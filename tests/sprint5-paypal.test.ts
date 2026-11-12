import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CheckoutPaymentIntent,
  CustomError,
  createPayPalSdkClient,
  extractPayPalErrorInfo,
} from '@/lib/paypal/client';
import {
  PAYPAL_ORDER_REUSE_MAX_AGE_MS,
  buildDeliverablesFromPackageSnapshot,
  canSponsorInitiateCheckout,
  evaluateLivePayPalOrderForReuse,
  isLocalPaymentRowReusable,
  minorToPayPalDecimal,
  payPalDecimalToMinor,
  shouldProcessWebhookEvent,
  verifyPayPalCaptureIntegrity,
  type LocalPaymentLedgerCandidate,
} from '@/lib/paypal/guards';
import { createOrReusePayPalOrder } from '@/lib/paypal/orders';

test('minorToPayPalDecimal and payPalDecimalToMinor convert currency accurately without float drift', () => {
  assert.equal(minorToPayPalDecimal(150000, 'USD'), '1500.00');
  assert.equal(minorToPayPalDecimal(5050, 'USD'), '50.50');
  assert.equal(minorToPayPalDecimal(5000, 'JPY'), '5000');
  assert.equal(payPalDecimalToMinor('1500.00', 'USD'), 150000);
  assert.throws(() => minorToPayPalDecimal(0, 'USD'));
});

test('canSponsorInitiateCheckout blocks unauthorized sponsor and invalid proposal states', () => {
  const wrongSponsor = canSponsorInitiateCheckout({
    proposalSponsorId: 'sponsor-a',
    currentSponsorId: 'sponsor-b',
    status: 'accepted',
  });
  assert.equal(wrongSponsor.ok, false);
  if (!wrongSponsor.ok) {
    assert.equal(wrongSponsor.httpStatus, 403);
  }

  const paidAlready = canSponsorInitiateCheckout({
    proposalSponsorId: 'sponsor-a',
    currentSponsorId: 'sponsor-a',
    status: 'paid',
  });
  assert.equal(paidAlready.ok, false);
  if (!paidAlready.ok) {
    assert.equal(paidAlready.httpStatus, 409);
  }

  const allowed = canSponsorInitiateCheckout({
    proposalSponsorId: 'sponsor-a',
    currentSponsorId: 'sponsor-a',
    status: 'accepted',
  });
  assert.equal(allowed.ok, true);
});

test('verifyPayPalCaptureIntegrity detects tampered amounts, mismatched currencies, and incomplete captures', () => {
  const valid = verifyPayPalCaptureIntegrity({
    expectedAmountMinor: 150000,
    expectedCurrency: 'USD',
    capturedValue: '1500.00',
    capturedCurrency: 'USD',
    captureStatus: 'COMPLETED',
  });
  assert.equal(valid.ok, true);

  const tamperedAmount = verifyPayPalCaptureIntegrity({
    expectedAmountMinor: 150000,
    expectedCurrency: 'USD',
    capturedValue: '1.00',
    capturedCurrency: 'USD',
    captureStatus: 'COMPLETED',
  });
  assert.equal(tamperedAmount.ok, false);

  const wrongStatus = verifyPayPalCaptureIntegrity({
    expectedAmountMinor: 150000,
    expectedCurrency: 'USD',
    capturedValue: '1500.00',
    capturedCurrency: 'USD',
    captureStatus: 'PENDING',
  });
  assert.equal(wrongStatus.ok, false);
});

test('shouldProcessWebhookEvent enforces idempotent handling and deliverable seeding extracts package benefits', () => {
  assert.equal(shouldProcessWebhookEvent(null), true);
  assert.equal(
    shouldProcessWebhookEvent({
      processing_status: 'processed',
      processed_at: '2026-11-12T12:00:00Z',
    }),
    false
  );

  const seeded = buildDeliverablesFromPackageSnapshot({
    proposalId: 'prop-123',
    benefitsSnapshot: ['Booth space at main hall', 'Opening keynote logo'],
  });
  assert.equal(seeded.length, 2);
  assert.equal(seeded[0].status, 'pending');
  assert.equal(seeded[0].title, 'Booth space at main hall');
});

test('OrdersController createOrder & captureOrder serialize PayPal Sandbox payloads via SDK stub adapter', async () => {
  const capturedRequests: Array<{
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: string;
  }> = [];

  const { ordersController, env } = createPayPalSdkClient({
    clientId: 'stub-sandbox-client-id',
    clientSecret: 'stub-sandbox-client-secret',
    env: 'sandbox',
    oAuthToken: {
      accessToken: 'seeded-sandbox-token',
      tokenType: 'Bearer',
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
    },
    retryConfig: { maxNumberOfRetries: 0, maximumRetryWaitTime: 0 },
    unstable_httpClientOptions: {
      adapter: async (config: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        data?: string;
      }) => {
        capturedRequests.push(config);
        const isCapture = String(config.url).includes('/capture');
        const responseBody = isCapture
          ? {
              id: 'ORD-STUB-2026',
              status: 'COMPLETED',
              purchase_units: [
                {
                  reference_id: 'prop-uuid-1',
                  payments: {
                    captures: [
                      {
                        id: 'CAP-STUB-999',
                        status: 'COMPLETED',
                        amount: { currency_code: 'USD', value: '1500.00' },
                      },
                    ],
                  },
                },
              ],
            }
          : {
              id: 'ORD-STUB-2026',
              status: 'CREATED',
            };

        return {
          data: JSON.stringify(responseBody),
          status: isCapture ? 201 : 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' },
          config,
        };
      },
    },
  });

  assert.equal(env, 'sandbox');

  const createRes = await ordersController.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: 'prop-uuid-1',
          customId: 'prop-uuid-1',
          amount: { currencyCode: 'USD', value: '1500.00' },
        },
      ],
    },
    paypalRequestId: 'req-create-1',
    prefer: 'return=representation',
  });

  assert.equal(createRes.statusCode, 201);
  assert.equal(createRes.result.id, 'ORD-STUB-2026');
  assert.equal(createRes.result.status, 'CREATED');

  const req = capturedRequests[0];
  assert.ok(req.url?.startsWith('https://api-m.sandbox.paypal.com/v2/checkout/orders'));
  assert.equal(req.method?.toUpperCase(), 'POST');
  const parsedBody = JSON.parse(req.data ?? '{}') as {
    intent?: string;
    purchase_units?: Array<{ amount?: { currency_code?: string; value?: string } }>;
  };
  assert.equal(parsedBody.intent, 'CAPTURE');
  assert.equal(parsedBody.purchase_units?.[0]?.amount?.value, '1500.00');
  assert.equal(parsedBody.purchase_units?.[0]?.amount?.currency_code, 'USD');

  const captureRes = await ordersController.captureOrder({
    id: 'ORD-STUB-2026',
    paypalRequestId: 'capture-ORD-STUB-2026',
    prefer: 'return=representation',
  });
  assert.equal(captureRes.result.status, 'COMPLETED');
  const cap = captureRes.result.purchaseUnits?.[0]?.payments?.captures?.[0];
  assert.equal(cap?.id, 'CAP-STUB-999');
  assert.equal(cap?.amount?.value, '1500.00');
});

test('OrdersController throws CustomError on 422 and extractPayPalErrorInfo preserves wire debug_id', async () => {
  const { ordersController } = createPayPalSdkClient({
    clientId: 'stub-sandbox-client-id',
    clientSecret: 'stub-sandbox-client-secret',
    env: 'sandbox',
    oAuthToken: {
      accessToken: 'seeded-sandbox-token',
      tokenType: 'Bearer',
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
    },
    retryConfig: { maxNumberOfRetries: 0, maximumRetryWaitTime: 0 },
    unstable_httpClientOptions: {
      adapter: async (config: unknown) => ({
        data: JSON.stringify({
          name: 'UNPROCESSABLE_ENTITY',
          message: 'The requested action could not be performed.',
          debug_id: 'f739a8e19001b',
          details: [
            {
              issue: 'ORDER_NOT_APPROVED',
              description: 'Payer has not yet approved the Order for payment.',
            },
          ],
        }),
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: { 'content-type': 'application/json' },
        config,
      }),
    },
  });

  let caught: unknown;
  try {
    await ordersController.captureOrder({ id: 'ORD-UNAPPROVED' });
  } catch (err) {
    caught = err;
  }

  assert.ok(caught instanceof CustomError);
  const mapped = extractPayPalErrorInfo(caught);
  assert.equal(mapped.httpStatus, 422);
  assert.equal(mapped.code, 'PAYPAL_UNPROCESSABLE_ENTITY');
  assert.equal(mapped.debugId, 'f739a8e19001b');
  assert.match(mapped.message, /Payer has not yet approved/);
});

function createInMemoryOrderHarness(options?: {
  initialRows?: LocalPaymentLedgerCandidate[];
  liveOrders?: Record<
    string,
    {
      status: string;
      amountValue?: string;
      currencyCode?: string;
      captures?: Array<{ id: string; status: string }>;
      notFound?: boolean;
    }
  >;
  createDelayMs?: number;
  nowMs?: number;
}) {
  const rows: LocalPaymentLedgerCandidate[] = [...(options?.initialRows ?? [])];
  const liveOrders = { ...(options?.liveOrders ?? {}) };
  let createCalls = 0;
  let getOrderCalls = 0;
  const markedStatuses: Array<{ paymentId: string; status: string; reason: string }> = [];
  let proposalStatusTransitions = 0;
  const now = options?.nowMs ?? Date.parse('2026-11-12T12:00:00Z');

  return {
    rows,
    markedStatuses,
    getCreateCalls: () => createCalls,
    getGetOrderCalls: () => getOrderCalls,
    getProposalTransitions: () => proposalStatusTransitions,
    deps: {
      env: 'sandbox' as const,
      nowMs: () => now,
      findProposalPayments: async () => [...rows].reverse(),
      updatePaymentStatus: async ({
        paymentId,
        status,
        reason,
      }: {
        paymentId: string;
        status: 'APPROVED' | 'CANCELLED' | 'COMPLETED';
        reason: string;
      }) => {
        markedStatuses.push({ paymentId, status, reason });
        const target = rows.find((r) => r.id === paymentId);
        if (target) target.status = status;
      },
      insertCreatedPayment: async ({
        paypalOrderId,
        amountMinor,
        currency,
      }: {
        proposalId: string;
        paypalOrderId: string;
        amountMinor: number;
        currency: string;
        rawStatusReason: string;
      }) => {
        rows.push({
          id: `pay-${rows.length + 1}`,
          paypal_order_id: paypalOrderId,
          status: 'CREATED',
          amount_minor: amountMinor,
          currency,
          created_at: new Date(now).toISOString(),
        });
        return { ok: true as const };
      },
      markProposalPaymentPending: async () => {
        proposalStatusTransitions += 1;
      },
      getPayPalOrder: async (orderId: string) => {
        getOrderCalls += 1;
        const entry = liveOrders[orderId];
        if (!entry || entry.notFound) {
          const err = new CustomError(
            {
              headers: {},
              body: JSON.stringify({ message: 'RESOURCE_NOT_FOUND' }),
              statusCode: 404,
            } as never,
            'Resource not found'
          );
          throw err;
        }
        return {
          id: orderId,
          status: entry.status,
          amountValue: entry.amountValue ?? '500.00',
          currencyCode: entry.currencyCode ?? 'USD',
          captures: entry.captures ?? [],
        };
      },
      createPayPalOrder: async () => {
        createCalls += 1;
        if (options?.createDelayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.createDelayMs));
        }
        const orderId = `ORD-NEW-${createCalls}`;
        liveOrders[orderId] = { status: 'CREATED', amountValue: '500.00', currencyCode: 'USD' };
        return { id: orderId, status: 'CREATED' };
      },
    },
  };
}

test('createOrReusePayPalOrder reuses active CREATED order across repeated clicks', async () => {
  const harness = createInMemoryOrderHarness();
  const baseProposal = {
    id: 'prop-reuse-1',
    sponsor_id: 'sp-1',
    amount_minor: 50000,
    currency: 'USD',
    status: 'accepted',
    eventTitle: 'BuildFest 2026',
    packageName: 'Bronze',
  };

  const first = await createOrReusePayPalOrder({
    proposal: baseProposal,
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: harness.deps,
  });
  assert.equal(first.ok, true);
  if (first.ok) {
    assert.equal(first.httpStatus, 201);
    assert.equal(first.reused, false);
    assert.equal(first.orderId, 'ORD-NEW-1');
  }

  // Simulate repeated Smart Button clicks while proposal is payment_pending
  const second = await createOrReusePayPalOrder({
    proposal: { ...baseProposal, status: 'payment_pending' },
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: harness.deps,
  });
  assert.equal(second.ok, true);
  if (second.ok) {
    assert.equal(second.httpStatus, 200);
    assert.equal(second.reused, true);
    assert.equal(second.orderId, 'ORD-NEW-1');
  }
  assert.equal(harness.getCreateCalls(), 1);
  assert.equal(harness.rows.length, 1);
});

test('createOrReusePayPalOrder replaces expired, voided, missing, or amount-mismatched orders without deleting ledger rows', async () => {
  const now = Date.parse('2026-11-12T12:00:00Z');
  const staleCreatedAt = new Date(now - PAYPAL_ORDER_REUSE_MAX_AGE_MS - 60_000).toISOString();

  // 1. Locally expired row -> cancelled & replaced
  const expiredHarness = createInMemoryOrderHarness({
    nowMs: now,
    initialRows: [
      {
        id: 'pay-expired',
        paypal_order_id: 'ORD-EXPIRED',
        status: 'CREATED',
        amount_minor: 50000,
        currency: 'USD',
        created_at: staleCreatedAt,
      },
    ],
  });
  const afterExpired = await createOrReusePayPalOrder({
    proposal: {
      id: 'prop-expired',
      sponsor_id: 'sp-1',
      amount_minor: 50000,
      currency: 'USD',
      status: 'payment_pending',
      eventTitle: 'BuildFest 2026',
      packageName: 'Bronze',
    },
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: expiredHarness.deps,
  });
  assert.equal(afterExpired.ok, true);
  if (afterExpired.ok) {
    assert.equal(afterExpired.reused, false);
    assert.equal(afterExpired.orderId, 'ORD-NEW-1');
  }
  assert.equal(expiredHarness.rows.length, 2);
  assert.equal(expiredHarness.rows[0].status, 'CANCELLED');
  assert.equal(expiredHarness.getGetOrderCalls(), 0);

  // 2. Live PayPal VOIDED / missing 404 order -> cancelled & replaced
  const voidedHarness = createInMemoryOrderHarness({
    nowMs: now,
    initialRows: [
      {
        id: 'pay-voided',
        paypal_order_id: 'ORD-VOIDED',
        status: 'CREATED',
        amount_minor: 50000,
        currency: 'USD',
        created_at: new Date(now - 60_000).toISOString(),
      },
    ],
    liveOrders: { 'ORD-VOIDED': { status: 'VOIDED' } },
  });
  const afterVoided = await createOrReusePayPalOrder({
    proposal: {
      id: 'prop-voided',
      sponsor_id: 'sp-1',
      amount_minor: 50000,
      currency: 'USD',
      status: 'payment_pending',
      eventTitle: 'BuildFest 2026',
      packageName: 'Bronze',
    },
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: voidedHarness.deps,
  });
  assert.equal(afterVoided.ok, true);
  if (afterVoided.ok) {
    assert.equal(afterVoided.reused, false);
    assert.equal(afterVoided.orderId, 'ORD-NEW-1');
  }
  assert.equal(voidedHarness.rows[0].status, 'CANCELLED');

  // 3. Evaluate helper rejects already captured and tampered live amounts
  assert.equal(
    evaluateLivePayPalOrderForReuse({
      liveStatus: 'COMPLETED',
      liveAmountValue: '500.00',
      liveCurrencyCode: 'USD',
      captures: [{ id: 'CAP-1', status: 'COMPLETED' }],
      expectedAmountMinor: 50000,
      expectedCurrency: 'USD',
    }).action,
    'already_captured'
  );
  assert.equal(
    isLocalPaymentRowReusable(
      {
        id: 'p-1',
        paypal_order_id: 'ORD-1',
        status: 'CANCELLED',
        amount_minor: 50000,
        currency: 'USD',
        created_at: new Date(now).toISOString(),
      },
      { amountMinor: 50000, currency: 'USD' },
      now
    ).reusable,
    false
  );
});

test('createOrReusePayPalOrder coalesces concurrent requests and blocks paid proposals', async () => {
  const harness = createInMemoryOrderHarness({ createDelayMs: 30 });
  const proposal = {
    id: 'prop-concurrent-1',
    sponsor_id: 'sp-1',
    amount_minor: 50000,
    currency: 'USD',
    status: 'accepted',
    eventTitle: 'BuildFest 2026',
    packageName: 'Bronze',
  };

  const [r1, r2] = await Promise.all([
    createOrReusePayPalOrder({
      proposal,
      currentSponsorId: 'sp-1',
      actorUserId: 'user-1',
      deps: harness.deps,
    }),
    createOrReusePayPalOrder({
      proposal,
      currentSponsorId: 'sp-1',
      actorUserId: 'user-1',
      deps: harness.deps,
    }),
  ]);

  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  if (r1.ok && r2.ok) {
    assert.equal(r1.orderId, r2.orderId);
  }
  assert.equal(harness.getCreateCalls(), 1);
  assert.equal(harness.rows.length, 1);

  // Paid proposal is strictly rejected with 409 and never touches PayPal
  const paidRes = await createOrReusePayPalOrder({
    proposal: { ...proposal, id: 'prop-paid-1', status: 'paid' },
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: harness.deps,
  });
  assert.equal(paidRes.ok, false);
  if (!paidRes.ok) {
    assert.equal(paidRes.httpStatus, 409);
    assert.equal(paidRes.code, 'INVALID_PROPOSAL_STATE');
  }
  assert.equal(harness.getCreateCalls(), 1);

  // Defense-in-depth: even if proposal wasn't updated yet, COMPLETED ledger row blocks new order
  const completedLedgerHarness = createInMemoryOrderHarness({
    initialRows: [
      {
        id: 'pay-done',
        paypal_order_id: 'ORD-DONE',
        status: 'COMPLETED',
        amount_minor: 50000,
        currency: 'USD',
        created_at: new Date().toISOString(),
      },
    ],
  });
  const dupBlocked = await createOrReusePayPalOrder({
    proposal: { ...proposal, id: 'prop-completed-ledger', status: 'payment_pending' },
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: completedLedgerHarness.deps,
  });
  assert.equal(dupBlocked.ok, false);
  if (!dupBlocked.ok) {
    assert.equal(dupBlocked.httpStatus, 409);
  }
  assert.equal(completedLedgerHarness.getCreateCalls(), 0);
});

test('createOrReusePayPalOrder uses deterministic PayPal-Request-Id and handles cross-worker unique conflict (23505)', async () => {
  const seenRequestIds: string[] = [];
  const proposal = {
    id: 'prop-dist-race-1',
    sponsor_id: 'sp-1',
    amount_minor: 50000,
    currency: 'USD',
    status: 'accepted',
    eventTitle: 'BuildFest 2026',
    packageName: 'Bronze',
  };

  let firstInsertDone = false;
  const makeWorkerDeps = () => ({
    env: 'sandbox' as const,
    findProposalPayments: async () => [],
    updatePaymentStatus: async () => undefined,
    insertCreatedPayment: async () => {
      if (!firstInsertDone) {
        firstInsertDone = true;
        return { ok: true as const };
      }
      return { ok: true as const, duplicateRace: true };
    },
    markProposalPaymentPending: async () => undefined,
    getPayPalOrder: async () => {
      throw new Error('Should not be called when 0 rows exist');
    },
    createPayPalOrder: async ({ requestId }: { requestId: string }) => {
      seenRequestIds.push(requestId);
      return { id: `ORD-IDEMP-${requestId}`, status: 'CREATED' };
    },
  });

  const workerA = await createOrReusePayPalOrder({
    proposal,
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: makeWorkerDeps(),
  });
  const workerB = await createOrReusePayPalOrder({
    proposal,
    currentSponsorId: 'sp-1',
    actorUserId: 'user-1',
    deps: makeWorkerDeps(),
  });

  assert.equal(seenRequestIds.length, 2);
  assert.equal(seenRequestIds[0], seenRequestIds[1]);
  assert.equal(workerA.ok, true);
  assert.equal(workerB.ok, true);
  if (workerA.ok && workerB.ok) {
    assert.equal(workerA.orderId, workerB.orderId);
    assert.equal(workerA.httpStatus, 201);
    assert.equal(workerB.httpStatus, 200);
    assert.equal(workerB.reused, true);
  }
});


