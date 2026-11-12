import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { checkAiRateLimit } from '@/lib/ai/client';
import { generateEventPackages } from '@/lib/ai/packages';
import type { EventRow } from '@/types/database';

const requestSchema = z.object({
  eventId: z.string().uuid('Valid eventId is required'),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  if (!checkAiRateLimit(`pkg:${auth.context.userId}`, 15, 60_000)) {
    return apiError('RATE_LIMITED', 'Too many package generation requests. Wait a minute.', 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const { supabase, context } = auth;
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', parsed.data.eventId)
    .maybeSingle<EventRow>();

  if (error) return apiError('EVENT_FETCH_FAILED', error.message, 500);
  if (!event) return apiError('NOT_FOUND', 'Event not found.', 404);
  if (event.organizer_id !== context.organizerProfile?.id) {
    return apiError('FORBIDDEN', 'You do not own this event.', 403);
  }

  const { data: benefitRows } = await supabase
    .from('event_benefits')
    .select('benefit_type')
    .eq('event_id', event.id);

  const availableBenefits = (benefitRows ?? []).map((b) => b.benefit_type);
  const outcome = await generateEventPackages(event, availableBenefits);

  return apiSuccess(
    outcome,
    outcome.source === 'ai_provider'
      ? 'Created with FestivalMint AI. Review and customize packages before saving.'
      : 'Generated structured package suggestions from your event details. Review and customize before saving.'
  );
}
