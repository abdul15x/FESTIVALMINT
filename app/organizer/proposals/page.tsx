import Link from 'next/link';
import { FileBarChart2, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';

interface OrganizerProposalRow {
  id: string;
  event_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  message: string | null;
  change_request_note: string | null;
  created_at: string;
  events: { title: string; starts_at: string } | null;
  sponsor_profiles: { company_name: string; industry: string } | null;
  sponsorship_packages: { name: string } | null;
}

const STATUS_BADGE: Record<string, 'neutral' | 'blue' | 'amber' | 'mint' | 'red'> = {
  sent: 'blue',
  changes_requested: 'amber',
  accepted: 'mint',
  payment_pending: 'amber',
  paid: 'mint',
  completed: 'mint',
  rejected: 'red',
  expired: 'neutral',
};

export default async function OrganizerProposalsPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['organizer'] });
  const org = context.organizerProfile!;

  const { data: proposals } = await supabase
    .from('proposals')
    .select(
      'id, event_id, amount_minor, currency, status, message, change_request_note, created_at, events(title, starts_at), sponsor_profiles(company_name, industry), sponsorship_packages(name)'
    )
    .eq('organizer_id', org.id)
    .order('created_at', { ascending: false })
    .returns<OrganizerProposalRow[]>();

  return (
    <DashboardShell role="organizer" userName={org.society_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950">
              Sponsorship Proposals & Fulfillment
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track outgoing sponsor proposals, accepted deals awaiting PayPal checkout, and paid
              sponsorships ready for fulfillment evidence.
            </p>
          </div>
          <Link href="/organizer/matches" className={buttonClasses('primary', 'sm')}>
            <Sparkles className="h-4 w-4" />
            Find More Sponsors
          </Link>
        </div>

        {(proposals ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No proposals sent or received yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Use Ranked Sponsor Matches to invite matching brands, or publish an approved event so
                sponsors can select a package.
              </p>
              <Link href="/organizer/matches" className={`${buttonClasses('primary', 'sm')} mt-4`}>
                Open Sponsor Matches
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(proposals ?? []).map((p) => {
              const isPaid = ['paid', 'completed'].includes(p.status);
              return (
                <Card key={p.id}>
                  <CardContent className="space-y-3 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-base font-bold text-slate-950">
                            {p.sponsor_profiles?.company_name ?? 'Sponsor Brand'}
                          </h2>
                          <Badge variant={STATUS_BADGE[p.status] ?? 'neutral'}>
                            {p.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {p.events?.title ?? 'Event'}
                          {p.sponsorship_packages?.name
                            ? ` · ${p.sponsorship_packages.name} Tier`
                            : ''}
                          {p.sponsor_profiles?.industry
                            ? ` · ${p.sponsor_profiles.industry}`
                            : ''}
                          {p.events?.starts_at ? ` · ${formatShortDate(p.events.starts_at)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-slate-950">
                          {formatMinorCurrency(p.amount_minor, p.currency)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Created {formatShortDate(p.created_at)}
                        </p>
                      </div>
                    </div>

                    {p.message && (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                        {p.message}
                      </p>
                    )}

                    {p.change_request_note && (
                      <Alert tone="warning" title="Sponsor Note">
                        {p.change_request_note}
                      </Alert>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <Link
                        href={`/organizer/events/${p.event_id}`}
                        className={buttonClasses('ghost', 'sm')}
                      >
                        Manage Event
                      </Link>
                      {isPaid ? (
                        <Link
                          href={`/organizer/reports/${p.id}`}
                          className={buttonClasses('secondary', 'sm')}
                        >
                          <FileBarChart2 className="h-3.5 w-3.5" />
                          Upload Evidence & AI Report
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {p.status === 'accepted' || p.status === 'payment_pending'
                            ? 'Awaiting sponsor PayPal Sandbox payment'
                            : 'Waiting on sponsor response'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
