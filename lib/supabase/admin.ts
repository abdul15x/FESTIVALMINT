import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv, getServerSupabaseServiceKey } from '@/lib/env';

/**
 * Server-only privileged Supabase client (uses SUPABASE_SERVICE_ROLE_KEY).
 * NEVER import this module from Client Components or expose it to browsers.
 */
export function createAdminSupabaseClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceKey = getServerSupabaseServiceKey();

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

