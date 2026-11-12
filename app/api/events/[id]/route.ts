import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { eventInputSchema } from '@/lib/validation/events';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession(['organizer', 'admin']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return apiError('EVENT_FETCH_FAILED', error.message, 500);
  if (!event) return apiError('NOT_FOUND', 'Event not found.', 404);

  if (
    context.profile.role === 'organizer' &&
    event.organizer_id !== context.organizerProfile?.id
  ) {
    return apiError('FORBIDDEN', 'You do not own this event.', 403);
  }

  const [{ data: benefits }, { data: packages }] = await Promise.all([
    supabase.from('event_benefits').select('*').eq('event_id', id),
    supabase.from('sponsorship_packages').select('*').eq('event_id', id).order('price_minor'),
  ]);

  return apiSuccess({ event, benefits: benefits ?? [], packages: packages ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession(['organizer', 'admin']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const { data: existing } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return apiError('NOT_FOUND', 'Event not found.', 404);
  if (
    context.profile.role === 'organizer' &&
    existing.organizer_id !== context.organizerProfile?.id
  ) {
    return apiError('FORBIDDEN', 'You do not own this event.', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid event fields.',
      400
    );
  }

  const d = parsed.data;
  const { data: updated, error } = await supabase
    .from('events')
    .update({
      title: d.title,
      description: d.description,
      category: d.category,
      city: d.city,
      country: d.country,
      venue: d.venue || null,
      starts_at: new Date(d.startsAt).toISOString(),
      ends_at: new Date(d.endsAt).toISOString(),
      expected_attendees: d.expectedAttendees,
      audience_tags: d.audienceTags,
      event_objectives: d.eventObjectives,
      social_reach: d.socialReach,
      sponsorship_target_minor: Math.round(d.sponsorshipTargetUsd * 100),
      sponsorship_needs: d.sponsorshipNeeds,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return apiError('EVENT_UPDATE_FAILED', error.message, 500);

  await supabase.from('event_benefits').delete().eq('event_id', id);
  if (d.availableBenefits.length > 0) {
    await supabase.from('event_benefits').insert(
      d.availableBenefits.map((b) => ({
        event_id: id,
        benefit_type: b,
        quantity: 1,
      }))
    );
  }

  return apiSuccess({ event: updated }, 'Event updated.');
}
