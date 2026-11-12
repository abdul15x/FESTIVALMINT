import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseEnv } from '@/lib/env';

export function createClient() {
  const { url, anonKey, configured } = getPublicSupabaseEnv();
  if (!configured) {
    throw new Error(
      'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured.'
    );
  }
  return createBrowserClient(url, anonKey);
}
