import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess } from '@/lib/api/response';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return apiSuccess({ signedOut: true }, 'Signed out.');
}
