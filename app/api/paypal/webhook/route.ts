import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { verifyPayPalWebhookSignature } from '@/lib/paypal/client';
import { shouldProcessWebhookEvent } from '@/lib/paypal/guards';

interface PayPalWebhookBody {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
        capture_id?: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  let rawJson: PayPalWebhookBody;
  try {
    rawJson = (await request.json()) as PayPalWebhookBody;
  } catch {
    return apiError('INVALID_JSON', 'Webhook body must be valid JSON.', 400);
  }

  const eventId = rawJson.id;
  const eventType = rawJson.event_type;
  if (!eventId || !eventType) {
    return apiError('INVALID_WEBHOOK', 'Missing PayPal event id or event_type.', 400);
  }

  const verification = await verifyPayPalWebhookSignature({
    headers: request.headers,
    rawBody: rawJson as Record<string, unknown>,
  });

  if (!verification.verified) {
    return apiError(
      'WEBHOOK_SIGNATURE_INVALID',
      verification.reason ?? 'PayPal webhook signature verification failed.',
      401
    );
  }

  const adminDb = createAdminSupabaseClient();
  if (!adminDb) {
    return apiError('SERVER_CONFIG_ERROR', 'Service role key not configured.', 503);
  }

  // Idempotency guard via webhook_events.paypal_event_id
  const { data: existingEvent } = await adminDb
    .from('webhook_events')
    .select('id, processing_status, processed_at')
    .eq('paypal_event_id', eventId)
    .maybeSingle<{ id: string; processing_status: string; processed_at: string | null }>();

  if (!shouldProcessWebhookEvent(existingEvent)) {
    return apiSuccess({ duplicate: true, eventId }, 'Webhook event already processed.');
  }

  if (!existingEvent) {
    await adminDb.from('webhook_events').insert({
      paypal_event_id: eventId,
      event_type: eventType,
      processing_status: 'received',
      payload_summary_json: {
        resource_id: rawJson.resource?.id ?? null,
        custom_id: rawJson.resource?.custom_id ?? null,
      },
    });
  }

  const orderId =
    rawJson.resource?.supplementary_data?.related_ids?.order_id ??
    (eventType.startsWith('CHECKOUT.ORDER') ? rawJson.resource?.id : undefined);
  const captureId =
    eventType.startsWith('PAYMENT.CAPTURE') ? rawJson.resource?.id : undefined;

  let statusApplied: string | null = null;
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && (captureId || orderId)) {
    statusApplied = 'COMPLETED';
  } else if (eventType === 'CHECKOUT.ORDER.APPROVED' && orderId) {
    statusApplied = 'APPROVED';
  } else if (eventType === 'PAYMENT.CAPTURE.DENIED' && (captureId || orderId)) {
    statusApplied = 'FAILED';
  } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED' && (captureId || orderId)) {
    statusApplied = 'REFUNDED';
  }

  if (statusApplied && (orderId || captureId)) {
    const query = orderId
      ? adminDb.from('payments').select('id, proposal_id, status').eq('paypal_order_id', orderId)
      : adminDb
          .from('payments')
          .select('id, proposal_id, status')
          .eq('paypal_capture_id', captureId!);

    const { data: paymentRow } = await query.maybeSingle<{
      id: string;
      proposal_id: string;
      status: string;
    }>();

    if (paymentRow) {
      await adminDb
        .from('payments')
        .update({
          status: statusApplied,
          paypal_capture_id: captureId ?? undefined,
          captured_at: statusApplied === 'COMPLETED' ? new Date().toISOString() : undefined,
          raw_status_reason: `Webhook ${eventType} (${eventId})`,
        })
        .eq('id', paymentRow.id);

      if (statusApplied === 'COMPLETED') {
        await adminDb.from('proposals').update({ status: 'paid' }).eq('id', paymentRow.proposal_id);
      }
    }
  }

  await adminDb
    .from('webhook_events')
    .update({
      processing_status: statusApplied ? 'processed' : 'ignored',
      processed_at: new Date().toISOString(),
    })
    .eq('paypal_event_id', eventId);

  return apiSuccess({ eventId, eventType, reconciled: Boolean(statusApplied) }, 'Webhook handled.');
}
