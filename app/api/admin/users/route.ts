import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { adminUserModerationSchema } from '@/lib/validation/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
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

  const parsed = adminUserModerationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid moderation payload.',
      400
    );
  }

  const { userId, status, reason } = parsed.data;
  if (userId === context.userId) {
    return apiError('FORBIDDEN', 'Administrators cannot suspend their own account.', 403);
  }

  const { data: updated, error } = await adminDb
    .from('profiles')
    .update({ status })
    .eq('id', userId)
    .select('id, email, role, status')
    .maybeSingle();

  if (error) {
    return apiError('USER_MODERATION_FAILED', error.message, 500);
  }
  if (!updated) {
    return apiError('NOT_FOUND', 'User profile not found.', 404);
  }

  await adminDb.from('audit_logs').insert({
    actor_id: context.userId,
    action: `user_status_${status}`,
    entity_type: 'profile',
    entity_id: userId,
    metadata_json: { reason: reason || null, status },
  });

  return apiSuccess({ updated }, `User account marked ${status}.`);
}
