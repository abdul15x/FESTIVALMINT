const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND']);

export function minorToPayPalDecimal(amountMinor: number, currency = 'USD'): string {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Payment amount in minor units must be a positive integer.');
  }

  const upper = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) {
    return String(amountMinor);
  }

  return (amountMinor / 100).toFixed(2);
}

export function payPalDecimalToMinor(value: string, currency = 'USD'): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Invalid PayPal monetary value: "${value}"`);
  }

  const upper = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) {
    return Math.round(numeric);
  }

  return Math.round(numeric * 100);
}

export function canSponsorInitiateCheckout(params: {
  proposalSponsorId: string;
  currentSponsorId: string;
  status: string;
}): { ok: true } | { ok: false; code: string; message: string; httpStatus: 403 | 409 } {
  if (params.proposalSponsorId !== params.currentSponsorId) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Only the sponsor attached to this proposal can initiate PayPal checkout.',
      httpStatus: 403,
    };
  }

  if (!['accepted', 'payment_pending'].includes(params.status)) {
    return {
      ok: false,
      code: 'INVALID_PROPOSAL_STATE',
      message: `Proposal in "${params.status}" status is not eligible for PayPal checkout.`,
      httpStatus: 409,
    };
  }

  return { ok: true };
}

export function verifyPayPalCaptureIntegrity(params: {
  expectedAmountMinor: number;
  expectedCurrency: string;
  capturedValue?: string | null;
  capturedCurrency?: string | null;
  captureStatus?: string | null;
}): { ok: true } | { ok: false; reason: string } {
  const status = (params.captureStatus ?? '').toUpperCase();
  if (status !== 'COMPLETED') {
    return { ok: false, reason: `Expected COMPLETED capture status, got "${status || 'UNKNOWN'}".` };
  }

  const expectedCurr = params.expectedCurrency.toUpperCase();
  const capturedCurr = (params.capturedCurrency ?? '').toUpperCase();
  if (!capturedCurr || capturedCurr !== expectedCurr) {
    return {
      ok: false,
      reason: `Currency mismatch: expected ${expectedCurr}, received ${capturedCurr || 'NONE'}.`,
    };
  }

  if (!params.capturedValue) {
    return { ok: false, reason: 'PayPal capture response omitted captured amount.' };
  }

  try {
    const capturedMinor = payPalDecimalToMinor(params.capturedValue, expectedCurr);
    if (capturedMinor !== params.expectedAmountMinor) {
      return {
        ok: false,
        reason: `Amount mismatch: expected ${params.expectedAmountMinor} minor units, captured ${capturedMinor}.`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Invalid captured amount.',
    };
  }

  return { ok: true };
}

export function shouldProcessWebhookEvent(
  existingRecord: { processing_status?: string | null; processed_at?: string | null } | null
): boolean {
  if (!existingRecord) return true;
  if (existingRecord.processing_status === 'processed' && existingRecord.processed_at) {
    return false;
  }
  return true;
}

export function buildDeliverablesFromPackageSnapshot(params: {
  proposalId: string;
  benefitsSnapshot: unknown;
}): Array<{
  proposal_id: string;
  title: string;
  description: string;
  status: 'pending';
}> {
  const rawList = Array.isArray(params.benefitsSnapshot) ? params.benefitsSnapshot : [];
  const normalized = rawList
    .map((item) => String(item).trim())
    .filter((text) => text.length > 0);

  const items =
    normalized.length > 0
      ? normalized
      : ['Primary sponsor recognition & agreed package activation'];

  return items.map((title) => ({
    proposal_id: params.proposalId,
    title: title.slice(0, 180),
    description: `Agreed sponsorship deliverable from locked package snapshot: ${title}`,
    status: 'pending' as const,
  }));
}
