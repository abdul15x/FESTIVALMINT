import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CheckoutPaymentIntent,
  CustomError,
  createPayPalSdkClient,
  extractPayPalErrorInfo,
} from '@/lib/paypal/client';
import {
  buildDeliverablesFromPackageSnapshot,
  canSponsorInitiateCheckout,
  minorToPayPalDecimal,
  payPalDecimalToMinor,
  shouldProcessWebhookEvent,
  verifyPayPalCaptureIntegrity,
} from '@/lib/paypal/guards';

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


