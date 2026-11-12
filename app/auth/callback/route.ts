import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDashboardPathForRole, getSessionContext } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  const origin = request.nextUrl.origin;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/sign-in?setup=pending`);
  }

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { context, errorReason } = await getSessionContext();
  if (errorReason === 'suspended') {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/sign-in?error=suspended`);
  }

  if (!context) {
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  const needsOnboarding =
    (context.profile.role === 'organizer' && !context.organizerProfile) ||
    (context.profile.role === 'sponsor' && !context.sponsorProfile);

  if (needsOnboarding) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  return NextResponse.redirect(
    `${origin}${safeNext ?? getDashboardPathForRole(context.profile.role)}`
  );
}
