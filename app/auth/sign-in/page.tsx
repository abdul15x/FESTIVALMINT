import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignInForm } from '@/components/auth/auth-forms';
import { getPublicSupabaseEnv } from '@/lib/env';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { configured } = getPublicSupabaseEnv();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <Badge variant="mint" className="w-fit">
              Marketplace Access
            </Badge>
            <CardTitle className="mt-2">Sign in to FESTIVALMINT AI</CardTitle>
            <CardDescription>
              Access your Organizer, Sponsor, or University Admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm supabaseConfigured={configured} initialError={params.error} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
