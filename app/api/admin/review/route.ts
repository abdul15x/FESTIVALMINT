import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { adminReviewSchema } from '@/lib/validation/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['admin']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const adminDb = createAdminSupabaseClient() ?? supabase;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = adminReviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid review payload.',
      400
    );
  }

  const { entityType, entityId, decision, note } = parsed.data;

  if (entityType === 'organizer_profile') {
    const nextVerification =
      decision === 'approve'
        ? 'verified'
        : decision === 'reject'
          ? 'rejected'
          : 'pending';

    const { data: updated, error } = await adminDb
      .from('organizer_profiles')
      .update({
        verification_status: nextVerification,
        review_note: note || null,
      })
      .eq('id', entityId)
      .select('id, user_id, society_name, verification_status')
      .maybeSingle();

    if (error) {
      return apiError('REVIEW_FAILED', error.message, 500);
    }
    if (!updated) {
      return apiError('NOT_FOUND', 'Organizer profile not found.', 404);
    }

    await adminDb.from('audit_logs').insert({
      actor_id: context.userId,
      action: `organizer_${decision}`,
      entity_type: 'organizer_profile',
      entity_id: entityId,
      metadata_json: { note: note || null, verification_status: nextVerification },
    });

    if (updated.user_id) {
      await adminDb.from('notifications').insert({
        user_id: updated.user_id,
        title: `Society review: ${nextVerification}`,
        body: note
          ? `${updated.society_name} status updated to ${nextVerification}. Note: ${note}`
          : `${updated.society_name} status updated to ${nextVerification}.`,
        related_type: 'organizer_profile',
        related_id: entityId,
      });
    }

    return apiSuccess({ updated }, 'Organizer review recorded.');
  }

  // Event review
  const nextStatus =
    decision === 'approve'
      ? 'published'
      : decision === 'reject'
        ? 'rejected'
        : 'draft';

  const { data: updatedEvent, error: eventErr } = await adminDb
    .from('events')
    .update({
      status: nextStatus,
      review_note: note || null,
    })
    .eq('id', entityId)
    .select('id, organizer_id, title, status')
    .maybeSingle();

  if (eventErr) {
    return apiError('REVIEW_FAILED', eventErr.message, 500);
  }
  if (!updatedEvent) {
    return apiError('NOT_FOUND', 'Event not found.', 404);
  }

  await adminDb.from('audit_logs').insert({
    actor_id: context.userId,
    action: `event_${decision}`,
    entity_type: 'event',
    entity_id: entityId,
    metadata_json: { note: note || null, status: nextStatus },
  });

  const { data: org } = await adminDb
    .from('organizer_profiles')
    .select('user_id')
    .eq('id', updatedEvent.organizer_id)
    .maybeSingle<{ user_id: string | null }>();

  if (org?.user_id) {
    await adminDb.from('notifications').insert({
      user_id: org.user_id,
      title: `Event review: ${nextStatus}`,
      body: note
        ? `"${updatedEvent.title}" is now ${nextStatus}. Note: ${note}`
        : `"${updatedEvent.title}" is now ${nextStatus}.`,
      related_type: 'event',
      related_id: entityId,
    });
  }

  return apiSuccess({ updated: updatedEvent }, 'Event review recorded.');
}
