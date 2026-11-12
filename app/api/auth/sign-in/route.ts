import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { signInSchema } from '@/lib/validation/auth';
import { getDashboardPathForRole, getSessionContext } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid email or password',
      400
    );
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(
      'SUPABASE_NOT_CONFIGURED',
      'Supabase credentials are not configured in .env.local yet.',
      503
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return apiError('SIGN_IN_FAILED', error.message, 401);
  }

  const session = await getSessionContext();
  if (session.errorReason === 'suspended') {
    await supabase.auth.signOut();
    return apiError(
      'ACCOUNT_SUSPENDED',
      'Your account has been suspended by an administrator.',
      403
    );
  }

  if (!session.context) {
    return apiError('PROFILE_MISSING', 'User profile could not be initialized.', 500);
  }

  const { profile, organizerProfile, sponsorProfile } = session.context;
  const needsOnboarding =
    (profile.role === 'organizer' && !organizerProfile) ||
    (profile.role === 'sponsor' && !sponsorProfile);

  return apiSuccess(
    {
      role: profile.role,
      redirectTo: needsOnboarding ? '/onboarding' : getDashboardPathForRole(profile.role),
    },
    'Signed in successfully.'
  );
}
