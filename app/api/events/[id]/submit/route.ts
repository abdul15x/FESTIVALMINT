import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const { data: existing } = await supabase
    .from('events')
    .select('id, organizer_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!existing) return apiError('NOT_FOUND', 'Event not found.', 404);
  if (existing.organizer_id !== context.organizerProfile?.id) {
    return apiError('FORBIDDEN', 'You do not own this event.', 403);
  }

  if (!['draft', 'rejected'].includes(existing.status)) {
    return apiError(
      'INVALID_STATE',
      `Event in "${existing.status}" state cannot be submitted for review.`,
      409
    );
  }

  const { data: updated, error } = await supabase
    .from('events')
    .update({ status: 'pending_review' })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return apiError('SUBMIT_FAILED', error.message, 500);

  return apiSuccess({ event: updated }, 'Event submitted for university admin review.');
}
