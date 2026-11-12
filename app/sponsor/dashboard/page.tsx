import Link from 'next/link';
import { Compass, CreditCard, ArrowRight } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import type { EventRow, ProposalRow } from '@/types/database';

export default async function SponsorDashboardPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile!;

  const [{ data: approvedEvents }, { data: proposals }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .in('status', ['approved', 'published'])
      .order('starts_at', { ascending: true })
      .limit(4)
      .returns<EventRow[]>(),
    supabase
      .from('proposals')
      .select('*')
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: false })
      .returns<ProposalRow[]>(),
  ]);

  const eventList = approvedEvents ?? [];
  const proposalList = proposals ?? [];
  const paidMinor = proposalList
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount_minor, 0);

  return (
    <DashboardShell role="sponsor" userName={sponsor.company_name}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-slate-950">
                {sponsor.company_name}
              </h1>
              <Badge variant="mint">{sponsor.industry}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Budget range:{' '}
              <span className="font-mono font-medium text-slate-900">
                {formatMinorCurrency(sponsor.budget_min_minor, sponsor.currency)} –{' '}
                {formatMinorCurrency(sponsor.budget_max_minor, sponsor.currency)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sponsor/discover" className={buttonClasses('primary', 'md')}>
              <Compass className="h-4 w-4" />
              Discover Events
            </Link>
            <Link href="/sponsor/proposals" className={buttonClasses('outline', 'md')}>
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Proposals &amp; Checkout
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Incoming Proposals</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-950">
                {proposalList.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Awaiting Decision</p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-700">
                {proposalList.filter((p) => p.status === 'sent').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Sandbox Commitments Paid</p>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-700">
                {formatMinorCurrency(paidMinor, sponsor.currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Approved University Events</CardTitle>
              <CardDescription>
                Open discovery to inspect explainable 6-factor match scores and packages.
              </CardDescription>
            </div>
            <Link href="/sponsor/discover" className={buttonClasses('outline', 'sm')}>
              Browse All
            </Link>
          </CardHeader>
          <CardContent>
            {eventList.length === 0 ? (
              <p className="text-sm text-slate-500">
                No approved events are listed yet. Seed demo data or wait for admin-approved events.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {eventList.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="mint">{ev.category}</Badge>
                        {ev.is_demo && <span className="text-[11px] text-slate-400">Demo</span>}
                      </div>
                      <h3 className="mt-2 font-semibold text-slate-950">{ev.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {ev.city}, {ev.country} • {formatShortDate(ev.starts_at)} •{' '}
                        {ev.expected_attendees} est. attendees
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/sponsor/events/${ev.id}`}
                        className={buttonClasses('outline', 'sm')}
                      >
                        Inspect Event &amp; Packages
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {proposalList.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Recent Sponsorship Deals</CardTitle>
                <CardDescription>
                  Complete PayPal Sandbox checkout or review fulfillment evidence reports.
                </CardDescription>
              </div>
              <Link href="/sponsor/proposals" className={buttonClasses('ghost', 'sm')}>
                Manage All
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {proposalList.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-mono text-xs text-slate-500">Deal {p.id.slice(0, 8)}</p>
                    <p className="font-semibold text-slate-900">
                      {formatMinorCurrency(p.amount_minor, p.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === 'paid' ? 'mint' : 'amber'}>{p.status}</Badge>
                    {['accepted', 'payment_pending'].includes(p.status) && (
                      <Link
                        href={`/sponsor/payments/${p.id}`}
                        className={buttonClasses('primary', 'sm')}
                      >
                        PayPal Checkout
                      </Link>
                    )}
                    {p.status === 'paid' && (
                      <Link
                        href={`/sponsor/reports/${p.id}`}
                        className={buttonClasses('outline', 'sm')}
                      >
                        Fulfillment Report
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
