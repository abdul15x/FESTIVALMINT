import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { getIntegrationReadiness, getPayPalServerEnv } from '@/lib/env';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import { PayPalCheckoutClient } from '@/components/payments/paypal-checkout-client';

interface ProposalPaymentDetail {
  id: string;
  event_id: string;
  sponsor_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  benefits_snapshot_json: unknown;
  created_at: string;
  events: { title: string; starts_at: string; city: string } | null;
  organizer_profiles: { society_name: string; university_name: string | null } | null;
  sponsorship_packages: { name: string } | null;
}

export default async function SponsorProposalPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile!;

  const { data: proposal } = await supabase
    .from('proposals')
    .select(
      'id, event_id, sponsor_id, amount_minor, currency, status, benefits_snapshot_json, created_at, events(title, starts_at, city), organizer_profiles(society_name, university_name), sponsorship_packages(name)'
    )
    .eq('id', id)
    .eq('sponsor_id', sponsor.id)
    .maybeSingle<ProposalPaymentDetail>();

  if (!proposal) {
    notFound();
  }

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, paypal_order_id, paypal_capture_id, amount_minor, currency, status, captured_at')
    .eq('proposal_id', proposal.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      paypal_order_id: string | null;
      paypal_capture_id: string | null;
      amount_minor: number;
      currency: string;
      status: string;
      captured_at: string | null;
    }>();

  const readiness = getIntegrationReadiness();
  const paypalEnv = getPayPalServerEnv();
  const publicPayPalClientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || paypalEnv.clientId || null;

  const benefits = Array.isArray(proposal.benefits_snapshot_json)
    ? proposal.benefits_snapshot_json.map(String)
    : [];

  return (
    <DashboardShell role="sponsor" userName={sponsor.company_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/sponsor/proposals" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Proposals
          </Link>
          <Badge variant="navy" className="font-mono">
            Proposal {proposal.id.slice(0, 8)}
          </Badge>
        </div>

        <Card className="overflow-hidden border-stone-200/90">
          <div className="bg-[#0c121e] px-6 py-6 text-white bg-ledger-grid-dark sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                  {proposal.sponsorship_packages?.name ?? 'Sponsorship'} Tier Checkout
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold">
                  {proposal.events?.title ?? 'University Event'}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  {proposal.organizer_profiles?.society_name ?? 'Society'}
                  {proposal.organizer_profiles?.university_name
                    ? ` · ${proposal.organizer_profiles.university_name}`
                    : ''}
                  {proposal.events?.starts_at
                    ? ` · ${formatShortDate(proposal.events.starts_at)}`
                    : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs font-medium text-slate-400">
                  Locked Package Amount
                </p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-emerald-400 tabular-nums">
                  {formatMinorCurrency(proposal.amount_minor, proposal.currency)}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:px-8">
            {benefits.length > 0 && (
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                  Agreed Deliverables Included
                </p>
                <ul className="grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <PayPalCheckoutClient
          proposalId={proposal.id}
          amountMinor={proposal.amount_minor}
          currency={proposal.currency}
          proposalStatus={proposal.status}
          paypalClientId={publicPayPalClientId}
          paypalServerReady={readiness.paypalServer}
          existingPayment={existingPayment ?? null}
        />
      </div>
    </DashboardShell>
  );
}
