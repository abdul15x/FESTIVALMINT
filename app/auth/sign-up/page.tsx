import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/motion/primitives';
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
    <div className="flex min-h-screen flex-col bg-[#f7f6f2]">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-12 lg:items-center lg:px-8">
        <FadeIn immediate className="hidden lg:col-span-6 lg:block">
          <div className="rounded-3xl border border-[#0c121e] bg-[#0c121e] p-8 text-white shadow-xl bg-ledger-grid-dark">
            <Badge
              variant="navy"
              dot
              className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
            >
              Join the Campus Exchange
            </Badge>
            <h1 className="mt-5 font-display text-3xl font-bold leading-snug">
              Two minutes to unlock{' '}
              <span className="text-emerald-400">
                transparent
              </span>{' '}
              university partnerships.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Choose whether you represent a student society organizing campus events or a corporate
              sponsor targeting student builders, talent, and communities.
            </p>
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Structured Bronze, Silver &amp; Gold package design</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>6-factor sponsor compatibility scoring &amp; fit briefs</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>End-to-end deliverable verification &amp; reporting</span>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn immediate delay={0.08} className="lg:col-span-6">
          <Card className="mx-auto max-w-md shadow-[0_16px_40px_-16px_rgba(12,18,30,0.12)]">
            <CardHeader>
              <Badge variant="mint" dot className="w-fit">
                New Account
              </Badge>
              <CardTitle className="mt-3 text-xl">Join FESTIVALMINT AI</CardTitle>
              <CardDescription>
                Register as a university event organizer or a brand sponsor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm defaultRole={defaultRole} supabaseConfigured={configured} />
            </CardContent>
          </Card>
        </FadeIn>
      </main>
      <SiteFooter />
    </div>
  );
}
