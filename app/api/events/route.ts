import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { eventInputSchema } from '@/lib/validation/events';

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const org = context.organizerProfile;
  if (!org) {
    return apiError('ONBOARDING_REQUIRED', 'Complete your organizer profile first.', 400);
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
  const sponsorshipTargetMinor = Math.round(d.sponsorshipTargetUsd * 100);

  const { data: created, error } = await supabase
    .from('events')
    .insert({
      organizer_id: org.id,
      university_id: org.university_id,
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
      sponsorship_target_minor: sponsorshipTargetMinor,
      currency: 'USD',
      sponsorship_needs: d.sponsorshipNeeds,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error || !created) {
    return apiError('EVENT_CREATE_FAILED', error?.message ?? 'Could not create event.', 500);
  }

  if (d.availableBenefits.length > 0) {
    await supabase.from('event_benefits').insert(
      d.availableBenefits.map((b) => ({
        event_id: created.id,
        benefit_type: b,
        quantity: 1,
      }))
    );
  }

  return apiSuccess({ event: created }, 'Event saved as draft.', 201);
}
