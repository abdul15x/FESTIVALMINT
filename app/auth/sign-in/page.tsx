import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { getIntegrationReadiness } from '@/lib/env';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; next?: string }>;
}) {
  const params = await searchParams;
  const readiness = getIntegrationReadiness();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <Badge variant="mint" className="w-fit">
              Sprint 2 Auth Activation
            </Badge>
            <CardTitle className="mt-2">Sign in to FESTIVALMINT AI</CardTitle>
            <CardDescription>
              Access your Organizer, Sponsor, or University Admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!readiness.supabasePublic || params.setup === 'pending') && (
              <Alert tone="warning" title="Supabase Auth Not Configured Yet">
                Configure <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
                <code className="font-mono text-xs">.env.local</code>. Full interactive sign-in
                activates in Sprint 2.
              </Alert>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Sprint 1 Route Foundation Ready</p>
              <p>
                Session middleware (<code className="font-mono">proxy.ts</code>), Supabase SSR
                helpers, and RLS role policies are installed.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Link href="/auth/sign-up" className={buttonClasses('primary', 'md', 'w-full')}>
                Go to Registration
              </Link>
              <Link href="/" className={buttonClasses('outline', 'md', 'w-full')}>
                Back to Marketplace Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
