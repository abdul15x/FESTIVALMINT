import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { CheckoutPaymentIntent, createPayPalClient } from '@/lib/paypal/client';
import { canSponsorInitiateCheckout, type LocalPaymentLedgerCandidate } from '@/lib/paypal/guards';
import { createOrReusePayPalOrder } from '@/lib/paypal/orders';

const createOrderBodySchema = z.object({
  proposalId: z.string().uuid('Valid proposalId is required.'),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['sponsor']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const sponsor = context.sponsorProfile;
  if (!sponsor) {
    return apiError('ONBOARDING_REQUIRED', 'Complete your sponsor profile first.', 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = createOrderBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid PayPal order request.',
      400
    );
  }

  // Strictly fetch amount_minor & currency from PostgreSQL — NEVER trust browser amounts.
  const { data: proposal } = await supabase
    .from('proposals')
    .select(
      'id, sponsor_id, organizer_id, event_id, amount_minor, currency, status, events(title), sponsorship_packages(name)'
    )
    .eq('id', parsed.data.proposalId)
    .maybeSingle<{
      id: string;
      sponsor_id: string;
      organizer_id: string;
      event_id: string;
      amount_minor: number;
      currency: string;
      status: string;
      events: { title: string } | null;
      sponsorship_packages: { name: string } | null;
    }>();

  if (!proposal) {
    return apiError('NOT_FOUND', 'Proposal not found.', 404);
  }

  const stateGuard = canSponsorInitiateCheckout({
    proposalSponsorId: proposal.sponsor_id,
    currentSponsorId: sponsor.id,
    status: proposal.status,
  });

  if (!stateGuard.ok) {
    return apiError(stateGuard.code, stateGuard.message, stateGuard.httpStatus);
  }

  const paypal = createPayPalClient();
  if (!paypal) {
    return apiError(
      'PAYPAL_NOT_CONFIGURED',
      'PayPal Sandbox server credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are not configured in .env.local.',
      503
    );
  }

  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return apiError(
      'SERVER_CONFIG_ERROR',
      'SUPABASE_SERVICE_ROLE_KEY is required to record verified payment ledgers.',
      503
    );
  }

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), 15_000);

  try {
    const outcome = await createOrReusePayPalOrder({
      proposal: {
        id: proposal.id,
        sponsor_id: proposal.sponsor_id,
        amount_minor: proposal.amount_minor,
        currency: proposal.currency,
        status: proposal.status,
        eventTitle: proposal.events?.title ?? 'University Event',
        packageName: proposal.sponsorship_packages?.name ?? 'Sponsorship',
      },
      currentSponsorId: sponsor.id,
      actorUserId: context.userId,
      deps: {
        env: paypal.env,
        findProposalPayments: async (proposalId) => {
          const { data } = await adminDb
            .from('payments')
            .select('id, paypal_order_id, status, amount_minor, currency, created_at')
            .eq('proposal_id', proposalId)
            .order('created_at', { ascending: false })
            .returns<LocalPaymentLedgerCandidate[]>();
          return data ?? [];
        },
        updatePaymentStatus: async ({ paymentId, status, reason, captureId }) => {
          await adminDb
            .from('payments')
            .update({
              status,
              raw_status_reason: reason,
              ...(captureId ? { paypal_capture_id: captureId } : {}),
            })
            .eq('id', paymentId);
        },
        insertCreatedPayment: async ({
          proposalId,
          paypalOrderId,
          amountMinor,
          currency,
          rawStatusReason,
        }) => {
          const { error: paymentErr } = await adminDb.from('payments').insert({
            proposal_id: proposalId,
            paypal_order_id: paypalOrderId,
            amount_minor: amountMinor,
            currency,
            status: 'CREATED',
            raw_status_reason: rawStatusReason,
          });
          if (paymentErr) {
            if (paymentErr.code === '23505') {
              return { ok: true, duplicateRace: true };
            }
            return { ok: false, message: paymentErr.message };
          }
          return { ok: true };
        },
        markProposalPaymentPending: async ({ proposalId, actorId, note }) => {
          await adminDb
            .from('proposals')
            .update({ status: 'payment_pending' })
            .eq('id', proposalId);

          await adminDb.from('proposal_events').insert({
            proposal_id: proposalId,
            actor_id: actorId,
            event_type: 'payment_pending',
            note,
          });
        },
        getPayPalOrder: async (orderId) => {
          const res = await paypal.ordersController.getOrder(
            { id: orderId },
            { abortSignal: abortController.signal }
          );
          const unit = res.result.purchaseUnits?.[0];
          return {
            id: res.result.id ?? orderId,
            status: res.result.status ? String(res.result.status) : null,
            amountValue: unit?.amount?.value ?? null,
            currencyCode: unit?.amount?.currencyCode ?? null,
            captures:
              unit?.payments?.captures?.map((c) => ({
                id: c.id ?? null,
                status: c.status ? String(c.status) : null,
              })) ?? [],
          };
        },
        createPayPalOrder: async ({ proposalId, currency, valueDecimal, description, requestId }) => {
          const orderResponse = await paypal.ordersController.createOrder(
            {
              body: {
                intent: CheckoutPaymentIntent.Capture,
                purchaseUnits: [
                  {
                    referenceId: proposalId,
                    customId: proposalId,
                    description,
                    amount: {
                      currencyCode: currency,
                      value: valueDecimal,
                    },
                  },
                ],
              },
              paypalRequestId: requestId,
              prefer: 'return=representation',
            },
            { abortSignal: abortController.signal }
          );
          return {
            id: orderResponse.result?.id ?? null,
            status: orderResponse.result?.status ? String(orderResponse.result.status) : null,
          };
        },
      },
    });

    if (!outcome.ok) {
      return apiError(outcome.code, outcome.message, outcome.httpStatus);
    }

    return apiSuccess(
      {
        orderId: outcome.orderId,
        status: outcome.status,
        amountMinor: outcome.amountMinor,
        currency: outcome.currency,
        env: outcome.env,
        reused: outcome.reused,
      },
      outcome.reused
        ? 'Reused active PayPal Sandbox order.'
        : 'PayPal Sandbox order created.',
      outcome.httpStatus
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

