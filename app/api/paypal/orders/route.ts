import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { CheckoutPaymentIntent, createPayPalClient } from '@/lib/paypal/client';
import { canSponsorInitiateCheckout, minorToPayPalDecimal } from '@/lib/paypal/guards';

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

  const valueDecimal = minorToPayPalDecimal(proposal.amount_minor, proposal.currency);
  const tierLabel = proposal.sponsorship_packages?.name ?? 'Sponsorship';
  const eventTitle = proposal.events?.title ?? 'University Event';
  const description = `FestivalMint AI — ${tierLabel} for ${eventTitle}`.slice(0, 120);

  try {
    const orderResponse = await paypal.ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: proposal.id,
            customId: proposal.id,
            description,
            amount: {
              currencyCode: proposal.currency.toUpperCase(),
              value: valueDecimal,
            },
          },
        ],
      },
      prefer: 'return=representation',
    });

    const order = orderResponse.result;
    if (!order?.id) {
      return apiError('PAYPAL_ORDER_FAILED', 'PayPal did not return an order ID.', 500);
    }

    const { error: paymentErr } = await adminDb.from('payments').insert({
      proposal_id: proposal.id,
      paypal_order_id: order.id,
      amount_minor: proposal.amount_minor,
      currency: proposal.currency.toUpperCase(),
      status: 'CREATED',
      raw_status_reason: order.status ?? 'CREATED',
    });

    if (paymentErr) {
      return apiError('PAYMENT_LEDGER_ERROR', paymentErr.message, 500);
    }

    if (proposal.status === 'accepted') {
      await adminDb
        .from('proposals')
        .update({ status: 'payment_pending' })
        .eq('id', proposal.id);

      await adminDb.from('proposal_events').insert({
        proposal_id: proposal.id,
        actor_id: context.userId,
        event_type: 'payment_pending',
        note: `PayPal Sandbox Order ${order.id} created for ${valueDecimal} ${proposal.currency.toUpperCase()}.`,
      });
    }

    return apiSuccess(
      {
        orderId: order.id,
        status: order.status ?? 'CREATED',
        amountMinor: proposal.amount_minor,
        currency: proposal.currency.toUpperCase(),
        env: paypal.env,
      },
      'PayPal Sandbox order created.',
      201
    );
  } catch (err) {
    return apiError(
      'PAYPAL_ORDER_FAILED',
      err instanceof Error ? err.message : 'Unable to create PayPal Sandbox order.',
      500
    );
  }
}
