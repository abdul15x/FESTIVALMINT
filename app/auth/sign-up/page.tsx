import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { getIntegrationReadiness } from '@/lib/env';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const selectedRole = params.role === 'sponsor' ? 'Sponsor' : 'Organizer';
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
            <CardTitle className="mt-2">Create Your {selectedRole} Account</CardTitle>
            <CardDescription>
              Public sign-up supports Organizer and Sponsor accounts only. Admin accounts are
              provisioned securely server-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!readiness.supabasePublic && (
              <Alert tone="info" title="Database & Auth Ready for Sprint 2">
                Supabase schema migrations and RLS policies are prepared in{' '}
                <code className="font-mono text-xs">supabase/migrations/</code>. Interactive
                sign-up and role onboarding activate in Sprint 2.
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Link href="/auth/sign-in" className={buttonClasses('primary', 'md', 'w-full')}>
                Already have an account? Sign In
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
