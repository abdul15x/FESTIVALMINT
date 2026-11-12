import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { publicSignUpSchema } from '@/lib/validation/auth';
import { getPublicSupabaseEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = publicSignUpSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? 'Invalid registration data';
    return apiError('VALIDATION_ERROR', firstIssue, 400);
  }

  const { configured } = getPublicSupabaseEnv();
  const supabase = await createServerSupabaseClient();
  if (!configured || !supabase) {
    return apiError(
      'SUPABASE_NOT_CONFIGURED',
      'Supabase credentials are not configured in .env.local yet.',
      503
    );
  }

  const { fullName, email, password, role } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return apiError('SIGN_UP_FAILED', error.message, 400);
  }

  const user = data.user;
  if (!user) {
    return apiError('SIGN_UP_FAILED', 'Unable to create user account.', 400);
  }

  // If Supabase auto-confirmed the session immediately, create the profile row right away.
  if (data.session) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        role,
        full_name: fullName,
        email: user.email ?? email,
        status: 'active',
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      return apiError('PROFILE_CREATION_FAILED', profileError.message, 500);
    }

    return apiSuccess(
      {
        userId: user.id,
        role,
        requiresEmailConfirmation: false,
        redirectTo: '/onboarding',
      },
      'Account created. Complete your profile to continue.',
      201
    );
  }

  return apiSuccess(
    {
      userId: user.id,
      role,
      requiresEmailConfirmation: true,
      redirectTo: '/auth/sign-in',
    },
    'Account created. Please check your email to confirm your address before signing in.',
    201
  );
}
