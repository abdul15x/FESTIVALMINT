import {
  canSponsorInitiateCheckout,
  evaluateLivePayPalOrderForReuse,
  isLocalPaymentRowReusable,
  minorToPayPalDecimal,
  type LocalPaymentLedgerCandidate,
} from '@/lib/paypal/guards';
import { extractPayPalErrorInfo, type PayPalHttpStatus } from '@/lib/paypal/client';

export interface OrderProposalSnapshot {
  id: string;
  sponsor_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  eventTitle: string;
  packageName: string;
}

export interface LivePayPalOrderSummary {
  id: string;
  status?: string | null;
  amountValue?: string | null;
  currencyCode?: string | null;
  captures?: Array<{ id?: string | null; status?: string | null }> | null;
}

export interface PayPalOrderLifecycleDeps {
  env: 'sandbox' | 'live';
  findProposalPayments: (proposalId: string) => Promise<LocalPaymentLedgerCandidate[]>;
  updatePaymentStatus: (params: {
    paymentId: string;
    status: 'APPROVED' | 'CANCELLED' | 'COMPLETED';
    reason: string;
    captureId?: string | null;
  }) => Promise<void>;
  insertCreatedPayment: (params: {
    proposalId: string;
    paypalOrderId: string;
    amountMinor: number;
    currency: string;
    rawStatusReason: string;
  }) => Promise<{ ok: true; duplicateRace?: boolean } | { ok: false; message: string }>;
  markProposalPaymentPending: (params: {
    proposalId: string;
    actorId: string;
    note: string;
  }) => Promise<void>;
  getPayPalOrder: (orderId: string) => Promise<LivePayPalOrderSummary>;
  createPayPalOrder: (params: {
    proposalId: string;
    currency: string;
    valueDecimal: string;
    description: string;
    requestId: string;
  }) => Promise<{ id?: string | null; status?: string | null }>;
  nowMs?: () => number;
}

export type OrderLifecycleResult =
  | {
      ok: true;
      httpStatus: 200 | 201;
      orderId: string;
      status: string;
      amountMinor: number;
      currency: string;
      env: 'sandbox' | 'live';
      reused: boolean;
    }
  | {
      ok: false;
      httpStatus: PayPalHttpStatus | 400 | 409 | 500;
      code: string;
      message: string;
    };

// Coalesces concurrent order creation attempts per proposal on this server instance.
const inFlightOrderRequests = new Map<string, Promise<OrderLifecycleResult>>();

export async function createOrReusePayPalOrder(params: {
  proposal: OrderProposalSnapshot;
  currentSponsorId: string;
  actorUserId: string;
  deps: PayPalOrderLifecycleDeps;
}): Promise<OrderLifecycleResult> {
  const { proposal, currentSponsorId } = params;

  const stateGuard = canSponsorInitiateCheckout({
    proposalSponsorId: proposal.sponsor_id,
    currentSponsorId,
    status: proposal.status,
  });
  if (!stateGuard.ok) {
    return {
      ok: false,
      httpStatus: stateGuard.httpStatus,
      code: stateGuard.code,
      message: stateGuard.message,
    };
  }

  const existingPromise = inFlightOrderRequests.get(proposal.id);
  if (existingPromise) {
    return existingPromise;
  }

  const runPromise = executeOrderLifecycle(params).finally(() => {
    inFlightOrderRequests.delete(proposal.id);
  });
  inFlightOrderRequests.set(proposal.id, runPromise);
  return runPromise;
}

async function executeOrderLifecycle(params: {
  proposal: OrderProposalSnapshot;
  actorUserId: string;
  deps: PayPalOrderLifecycleDeps;
}): Promise<OrderLifecycleResult> {
  const { proposal, actorUserId, deps } = params;
  const currencyUpper = proposal.currency.toUpperCase();
  const valueDecimal = minorToPayPalDecimal(proposal.amount_minor, currencyUpper);
  const nowMs = deps.nowMs ? deps.nowMs() : Date.now();

  const existingRows = await deps.findProposalPayments(proposal.id);

  // Defense-in-depth: refuse to mint or reuse if any completed ledger row exists.
  if (existingRows.some((row) => row.status.toUpperCase() === 'COMPLETED')) {
    return {
      ok: false,
      httpStatus: 409,
      code: 'INVALID_PROPOSAL_STATE',
      message: 'A completed payment already exists for this sponsorship proposal.',
    };
  }

  const openCandidates = existingRows.filter((row) => {
    const s = row.status.toUpperCase();
    return s === 'CREATED' || s === 'APPROVED';
  });

  for (let i = 0; i < openCandidates.length; i++) {
    const candidate = openCandidates[i];
    const localCheck = isLocalPaymentRowReusable(
      candidate,
      { amountMinor: proposal.amount_minor, currency: currencyUpper },
      nowMs
    );

    if (!localCheck.reusable) {
      await deps.updatePaymentStatus({
        paymentId: candidate.id,
        status: 'CANCELLED',
        reason: localCheck.reason,
      });
      continue;
    }

    // Only reuse the newest eligible open candidate; mark older stale duplicates superseded.
    if (i > 0) {
      await deps.updatePaymentStatus({
        paymentId: candidate.id,
        status: 'CANCELLED',
        reason: 'Superseded by newer PayPal order attempt.',
      });
      continue;
    }

    const orderId = candidate.paypal_order_id!;
    try {
      const liveOrder = await deps.getPayPalOrder(orderId);
      const evaluation = evaluateLivePayPalOrderForReuse({
        liveStatus: liveOrder.status,
        liveAmountValue: liveOrder.amountValue,
        liveCurrencyCode: liveOrder.currencyCode,
        captures: liveOrder.captures,
        expectedAmountMinor: proposal.amount_minor,
        expectedCurrency: currencyUpper,
      });

      if (evaluation.action === 'already_captured') {
        await deps.updatePaymentStatus({
          paymentId: candidate.id,
          status: 'COMPLETED',
          reason: evaluation.reason,
          captureId: evaluation.captureId,
        });
        return {
          ok: false,
          httpStatus: 409,
          code: 'INVALID_PROPOSAL_STATE',
          message: 'Existing PayPal order has already been captured.',
        };
      }

      if (evaluation.action === 'reuse') {
        if (evaluation.orderStatus === 'APPROVED' && candidate.status.toUpperCase() !== 'APPROVED') {
          await deps.updatePaymentStatus({
            paymentId: candidate.id,
            status: 'APPROVED',
            reason: 'Approved in PayPal checkout.',
          });
        }

        if (proposal.status === 'accepted') {
          await deps.markProposalPaymentPending({
            proposalId: proposal.id,
            actorId: actorUserId,
            note: `PayPal Sandbox Order ${orderId} reused for ${valueDecimal} ${currencyUpper}.`,
          });
        }

        return {
          ok: true,
          httpStatus: 200,
          orderId,
          status: evaluation.orderStatus,
          amountMinor: proposal.amount_minor,
          currency: currencyUpper,
          env: deps.env,
          reused: true,
        };
      }

      // Live PayPal says expired / voided / mismatched -> close this row before minting fresh.
      await deps.updatePaymentStatus({
        paymentId: candidate.id,
        status: 'CANCELLED',
        reason: evaluation.reason,
      });
    } catch (err) {
      const mapped = extractPayPalErrorInfo(err);
      if (mapped.httpStatus === 404) {
        await deps.updatePaymentStatus({
          paymentId: candidate.id,
          status: 'CANCELLED',
          reason: `PayPal order expired or not found (${mapped.message}).`,
        });
        continue;
      }

      const fullMessage = mapped.debugId
        ? `${mapped.message} (PayPal debug ID: ${mapped.debugId})`
        : mapped.message;
      return {
        ok: false,
        httpStatus: mapped.httpStatus,
        code: mapped.code,
        message: fullMessage,
      };
    }
  }

  // No reusable order exists — mint exactly one new PayPal order.
  const description = `FestivalMint AI — ${proposal.packageName} for ${proposal.eventTitle}`.slice(
    0,
    120
  );

  // Derive PayPal-Request-Id deterministically from proposal + existing ledger count so even
  // concurrent requests across separate worker instances collapse onto a single PayPal order,
  // while replaced/expired attempts increment existingRows.length and receive a fresh request ID.
  const deterministicRequestId = `order-${proposal.id}-n${existingRows.length}`;

  try {
    const created = await deps.createPayPalOrder({
      proposalId: proposal.id,
      currency: currencyUpper,
      valueDecimal,
      description,
      requestId: deterministicRequestId,
    });

    if (!created.id) {
      return {
        ok: false,
        httpStatus: 500,
        code: 'PAYPAL_ORDER_FAILED',
        message: 'PayPal did not return an order ID.',
      };
    }

    const insertOutcome = await deps.insertCreatedPayment({
      proposalId: proposal.id,
      paypalOrderId: created.id,
      amountMinor: proposal.amount_minor,
      currency: currencyUpper,
      rawStatusReason: created.status ?? 'CREATED',
    });

    if (!insertOutcome.ok) {
      return {
        ok: false,
        httpStatus: 500,
        code: 'PAYMENT_LEDGER_ERROR',
        message: insertOutcome.message,
      };
    }

    if (insertOutcome.duplicateRace) {
      return {
        ok: true,
        httpStatus: 200,
        orderId: created.id,
        status: created.status ?? 'CREATED',
        amountMinor: proposal.amount_minor,
        currency: currencyUpper,
        env: deps.env,
        reused: true,
      };
    }

    if (proposal.status === 'accepted') {
      await deps.markProposalPaymentPending({
        proposalId: proposal.id,
        actorId: actorUserId,
        note: `PayPal Sandbox Order ${created.id} created for ${valueDecimal} ${currencyUpper}.`,
      });
    }

    return {
      ok: true,
      httpStatus: 201,
      orderId: created.id,
      status: created.status ?? 'CREATED',
      amountMinor: proposal.amount_minor,
      currency: currencyUpper,
      env: deps.env,
      reused: false,
    };
  } catch (err) {
    const mapped = extractPayPalErrorInfo(err);
    const fullMessage = mapped.debugId
      ? `${mapped.message} (PayPal debug ID: ${mapped.debugId})`
      : mapped.message;
    return {
      ok: false,
      httpStatus: mapped.httpStatus,
      code: mapped.code,
      message: fullMessage,
    };
  }
}

