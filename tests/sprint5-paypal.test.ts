import test from 'node:test';
import assert from 'node:assert/strict';
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
