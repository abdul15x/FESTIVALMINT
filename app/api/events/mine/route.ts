import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET() {
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const org = context.organizerProfile;
  if (!org) {
    return apiSuccess({ events: [] });
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', org.id)
    .order('created_at', { ascending: false });

  if (error) {
    return apiError('EVENTS_FETCH_FAILED', error.message, 500);
  }

  return apiSuccess({ events: data ?? [] });
}
