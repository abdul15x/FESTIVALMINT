import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { respondProposalSchema } from '@/lib/validation/proposals';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession(['sponsor']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const sponsor = context.sponsorProfile;
  if (!sponsor) return apiError('ONBOARDING_REQUIRED', 'Complete sponsor onboarding first.', 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = respondProposalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid response payload.',
      400
    );
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, sponsor_id, organizer_id, status, event_id')
    .eq('id', id)
    .maybeSingle();

  if (!proposal) return apiError('NOT_FOUND', 'Proposal not found.', 404);
  if (proposal.sponsor_id !== sponsor.id) {
    return apiError('FORBIDDEN', 'Only the addressed sponsor can respond to this proposal.', 403);
  }

  if (!['sent', 'changes_requested'].includes(proposal.status)) {
    return apiError(
      'INVALID_STATE',
      `Proposal in "${proposal.status}" status cannot be responded to.`,
      409
    );
  }

  const nextStatus =
    parsed.data.decision === 'accept'
      ? 'accepted'
      : parsed.data.decision === 'reject'
        ? 'rejected'
        : 'changes_requested';

  const { data: updated, error } = await supabase
    .from('proposals')
    .update({
      status: nextStatus,
      change_request_note: parsed.data.note || null,
    })
    .eq('id', proposal.id)
    .select('*')
    .single();

  if (error) return apiError('PROPOSAL_UPDATE_FAILED', error.message, 500);

  await supabase.from('proposal_events').insert({
    proposal_id: proposal.id,
    actor_id: context.userId,
    event_type: nextStatus,
    note: parsed.data.note || null,
  });

  const adminDb = createAdminSupabaseClient();
  if (adminDb) {
    const { data: org } = await adminDb
      .from('organizer_profiles')
      .select('user_id')
      .eq('id', proposal.organizer_id)
      .maybeSingle<{ user_id: string | null }>();

    if (org?.user_id) {
      await adminDb.from('notifications').insert({
        user_id: org.user_id,
        title: `Proposal ${nextStatus.replace('_', ' ')}`,
        body: `${sponsor.company_name} marked your proposal as ${nextStatus.replace('_', ' ')}.`,
        related_type: 'proposal',
        related_id: proposal.id,
      });
    }
  }

  return apiSuccess({ proposal: updated }, `Proposal marked ${nextStatus}.`);
}
