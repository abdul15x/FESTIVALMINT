import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createPayPalClient, extractPayPalErrorInfo } from '@/lib/paypal/client';
import {
  buildDeliverablesFromPackageSnapshot,
  verifyPayPalCaptureIntegrity,
} from '@/lib/paypal/guards';

const captureBodySchema = z.object({
  proposalId: z.string().uuid('Valid proposalId is required.'),
  orderId: z.string().trim().min(5, 'Valid PayPal orderId is required.'),
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

  const parsed = captureBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid capture payload.',
      400
    );
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select(
      'id, sponsor_id, organizer_id, event_id, amount_minor, currency, status, benefits_snapshot_json, events(title)'
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
      benefits_snapshot_json: unknown;
      events: { title: string } | null;
    }>();

  if (!proposal) {
    return apiError('NOT_FOUND', 'Proposal not found.', 404);
  }

  if (proposal.sponsor_id !== sponsor.id) {
    return apiError('FORBIDDEN', 'You can only capture payments for your own sponsorship.', 403);
  }

  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return apiError(
      'SERVER_CONFIG_ERROR',
      'SUPABASE_SERVICE_ROLE_KEY is required to capture and persist verified payments.',
      503
    );
  }

  const { data: paymentRecord } = await adminDb
    .from('payments')
    .select('*')
    .eq('proposal_id', proposal.id)
    .eq('paypal_order_id', parsed.data.orderId)
    .maybeSingle<{
      id: string;
      status: string;
      paypal_capture_id: string | null;
      amount_minor: number;
      currency: string;
      captured_at: string | null;
    }>();

  if (!paymentRecord) {
    return apiError(
      'ORDER_MISMATCH',
      'PayPal order does not belong to this sponsorship proposal.',
      404
    );
  }

  if (paymentRecord.status === 'COMPLETED' && proposal.status === 'paid') {
    return apiSuccess(
      {
        payment: paymentRecord,
        captureId: paymentRecord.paypal_capture_id,
        proposalStatus: 'paid',
        idempotentReplay: true,
      },
      'Payment already captured and verified.'
    );
  }

  const paypal = createPayPalClient();
  if (!paypal) {
    return apiError(
      'PAYPAL_NOT_CONFIGURED',
      'PayPal Sandbox server credentials are not configured in .env.local.',
      503
    );
  }

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), 15_000);

  try {
    const captureResponse = await paypal.ordersController.captureOrder(
      {
        id: parsed.data.orderId,
        paypalRequestId: `capture-${parsed.data.orderId}`,
        prefer: 'return=representation',
      },
      { abortSignal: abortController.signal }
    );

    const capturedOrder = captureResponse.result;
    const captureObj = capturedOrder.purchaseUnits?.[0]?.payments?.captures?.[0];
    const captureStatus = captureObj?.status ?? capturedOrder.status;

    const integrity = verifyPayPalCaptureIntegrity({
      expectedAmountMinor: proposal.amount_minor,
      expectedCurrency: proposal.currency,
      capturedValue: captureObj?.amount?.value,
      capturedCurrency: captureObj?.amount?.currencyCode,
      captureStatus: captureStatus ? String(captureStatus) : null,
    });

    if (!integrity.ok) {
      await adminDb
        .from('payments')
        .update({
          status: 'FAILED',
          raw_status_reason: integrity.reason,
        })
        .eq('id', paymentRecord.id);

      return apiError('PAYPAL_CAPTURE_VERIFICATION_FAILED', integrity.reason, 409);
    }

    const nowIso = new Date().toISOString();
    const captureId = captureObj?.id ?? null;

    const { data: updatedPayment } = await adminDb
      .from('payments')
      .update({
        paypal_capture_id: captureId,
        status: 'COMPLETED',
        captured_at: nowIso,
        raw_status_reason: `Verified capture ${captureId ?? parsed.data.orderId}`,
      })
      .eq('id', paymentRecord.id)
      .select('*')
      .single();

    await adminDb.from('proposals').update({ status: 'paid' }).eq('id', proposal.id);

    await adminDb.from('proposal_events').insert({
      proposal_id: proposal.id,
      actor_id: context.userId,
      event_type: 'paid',
      note: `PayPal Sandbox capture completed (${captureId ?? 'capture recorded'}).`,
      metadata_json: {
        paypal_order_id: parsed.data.orderId,
        paypal_capture_id: captureId,
      },
    });

    // Seed deliverables checklist if none created yet for this proposal
    const { count: existingDeliverables } = await adminDb
      .from('deliverables')
      .select('id', { count: 'exact', head: true })
      .eq('proposal_id', proposal.id);

    if (!existingDeliverables || existingDeliverables === 0) {
      const deliverableRows = buildDeliverablesFromPackageSnapshot({
        proposalId: proposal.id,
        benefitsSnapshot: proposal.benefits_snapshot_json,
      });
      await adminDb.from('deliverables').insert(deliverableRows);
    }

    // Notify organizer
    const { data: org } = await adminDb
      .from('organizer_profiles')
      .select('user_id')
      .eq('id', proposal.organizer_id)
      .maybeSingle<{ user_id: string | null }>();

    if (org?.user_id) {
      await adminDb.from('notifications').insert({
        user_id: org.user_id,
        title: `Sponsorship Paid: ${proposal.events?.title ?? 'Event'}`,
        body: `${sponsor.company_name} completed PayPal Sandbox payment. You can now upload deliverable fulfillment evidence.`,
        related_type: 'proposal',
        related_id: proposal.id,
      });
    }

    return apiSuccess(
      {
        payment: updatedPayment,
        captureId,
        proposalStatus: 'paid',
      },
      'PayPal Sandbox payment captured and verified.'
    );
  } catch (err) {
    const mapped = extractPayPalErrorInfo(err);
    const fullMessage = mapped.debugId
      ? `${mapped.message} (PayPal debug ID: ${mapped.debugId})`
      : mapped.message;
    return apiError(mapped.code, fullMessage, mapped.httpStatus);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

