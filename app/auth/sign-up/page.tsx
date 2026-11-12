import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignUpForm } from '@/components/auth/auth-forms';
import { getPublicSupabaseEnv } from '@/lib/env';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const defaultRole = params.role === 'sponsor' ? 'sponsor' : 'organizer';
  const { configured } = getPublicSupabaseEnv();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <Badge variant="mint" className="w-fit">
              Create Account
            </Badge>
            <CardTitle className="mt-2">Join FESTIVALMINT AI</CardTitle>
            <CardDescription>
              Register as a university event organizer or a brand sponsor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm defaultRole={defaultRole} supabaseConfigured={configured} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
