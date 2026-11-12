import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api/response';
import type {
  OrganizerProfileRow,
  ProfileRow,
  SponsorProfileRow,
  UserRole,
} from '@/types/database';

export interface SessionContext {
  userId: string;
  email: string;
  profile: ProfileRow;
  organizerProfile: OrganizerProfileRow | null;
  sponsorProfile: SponsorProfileRow | null;
}

export function getDashboardPathForRole(role: UserRole): string {
  if (role === 'organizer') return '/organizer/dashboard';
  if (role === 'sponsor') return '/sponsor/dashboard';
  return '/admin/dashboard';
}

/**
 * Loads the authenticated user and verifies profile & role from PostgreSQL.
 * Also safely provisions a non-admin profile on first login from auth metadata
 * if the user signed up with email confirmation enabled.
 */
export async function getSessionContext(): Promise<{
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>> | null;
  context: SessionContext | null;
  errorReason: 'unconfigured' | 'unauthenticated' | 'suspended' | null;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { supabase: null, context: null, errorReason: 'unconfigured' };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, context: null, errorReason: 'unauthenticated' };
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  // Auto-provision non-admin profile if created via Supabase email-confirm signup
  if (!profile) {
    const rawRole = user.user_metadata?.role;
    const safeRole: 'organizer' | 'sponsor' =
      rawRole === 'sponsor' ? 'sponsor' : 'organizer';
    const fullName =
      typeof user.user_metadata?.full_name === 'string' &&
      user.user_metadata.full_name.trim().length >= 2
        ? user.user_metadata.full_name.trim()
        : (user.email?.split('@')[0] ?? 'Campus User');

    const { data: inserted } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: safeRole,
        full_name: fullName,
        email: user.email ?? '',
        status: 'active',
      })
      .select('*')
      .maybeSingle<ProfileRow>();

    profile = inserted ?? null;
  }

  if (!profile) {
    return { supabase, context: null, errorReason: 'unauthenticated' };
  }

  if (profile.status === 'suspended') {
    return { supabase, context: null, errorReason: 'suspended' };
  }

  let organizerProfile: OrganizerProfileRow | null = null;
  let sponsorProfile: SponsorProfileRow | null = null;

  if (profile.role === 'organizer') {
    const { data } = await supabase
      .from('organizer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<OrganizerProfileRow>();
    organizerProfile = data ?? null;
  } else if (profile.role === 'sponsor') {
    const { data } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<SponsorProfileRow>();
    sponsorProfile = data ?? null;
  }

  return {
    supabase,
    context: {
      userId: user.id,
      email: user.email ?? profile.email,
      profile,
      organizerProfile,
      sponsorProfile,
    },
    errorReason: null,
  };
}

/**
 * Server Component guard for protected pages.
 */
export async function requirePageSession(options?: {
  allowedRoles?: UserRole[];
  requireOnboarded?: boolean;
}): Promise<{
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;
  context: SessionContext;
}> {
  const { supabase, context, errorReason } = await getSessionContext();

  if (errorReason === 'unconfigured' || !supabase) {
    redirect('/auth/sign-in?setup=pending');
  }
  if (errorReason === 'suspended') {
    redirect('/auth/sign-in?error=suspended');
  }
  if (!context) {
    redirect('/auth/sign-in');
  }

  if (options?.allowedRoles && !options.allowedRoles.includes(context.profile.role)) {
    redirect(getDashboardPathForRole(context.profile.role));
  }

  if (options?.requireOnboarded !== false) {
    if (context.profile.role === 'organizer' && !context.organizerProfile) {
      redirect('/onboarding');
    }
    if (context.profile.role === 'sponsor' && !context.sponsorProfile) {
      redirect('/onboarding');
    }
  }

  return { supabase, context };
}

/**
 * API Route guard returning explicit 401 / 403 / 503 JSON responses.
 */
export async function requireApiSession(allowedRoles?: UserRole[]) {
  const { supabase, context, errorReason } = await getSessionContext();

  if (errorReason === 'unconfigured' || !supabase) {
    return {
      ok: false as const,
      response: apiError(
        'SUPABASE_NOT_CONFIGURED',
        'Supabase environment variables are not configured.',
        503
      ),
    };
  }

  if (errorReason === 'suspended') {
    return {
      ok: false as const,
      response: apiError(
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended by an administrator.',
        403
      ),
    };
  }

  if (!context) {
    return {
      ok: false as const,
      response: apiError('UNAUTHENTICATED', 'Authentication is required.', 401),
    };
  }

  if (allowedRoles && !allowedRoles.includes(context.profile.role)) {
    return {
      ok: false as const,
      response: apiError(
        'FORBIDDEN',
        `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        403
      ),
    };
  }

  return { ok: true as const, supabase, context };
}
