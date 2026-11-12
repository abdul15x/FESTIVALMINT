import Link from 'next/link';
import { FileBarChart2, Handshake, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
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
        <PageHeader
          eyebrow="Deal Pipeline"
          title="Sponsorship Proposals & Fulfillment"
          description="Track sponsor responses, awaiting PayPal Sandbox checkouts, and funded partnerships ready for proof upload."
          actions={
            <Link href="/organizer/matches" className={buttonClasses('primary', 'md')}>
              <Sparkles className="h-4 w-4" />
              Find More Sponsors
            </Link>
          }
        />

        {(proposals ?? []).length === 0 ? (
          <EmptyState
            icon={<Handshake className="h-5 w-5" />}
            title="No proposals sent or received yet"
            description="Use Ranked Sponsor Matches to invite compatible brands, or publish an approved event so sponsors can select a package directly."
            action={
              <Link href="/organizer/matches" className={buttonClasses('primary', 'sm')}>
                Open Sponsor Matches
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {(proposals ?? []).map((p) => {
              const isPaid = ['paid', 'completed'].includes(p.status);
              return (
                <Card key={p.id} interactive>
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-lg font-bold text-[#0c121e]">
                            {p.sponsor_profiles?.company_name ?? 'Sponsor Brand'}
                          </h2>
                          <Badge dot variant={STATUS_BADGE[p.status] ?? 'neutral'}>
                            {p.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
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
                        <p className="font-mono text-xl font-bold text-[#0c121e] tabular-nums">
                          {formatMinorCurrency(p.amount_minor, p.currency)}
                        </p>
                        <p className="text-xs text-stone-500">
                          Created {formatShortDate(p.created_at)}
                        </p>
                      </div>
                    </div>

                    {p.message && (
                      <p className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3.5 text-xs leading-relaxed text-stone-700">
                        {p.message}
                      </p>
                    )}

                    {p.change_request_note && (
                      <Alert tone="warning" title="Sponsor Note">
                        {p.change_request_note}
                      </Alert>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3.5">
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
                          Upload Proof &amp; Report
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-stone-500">
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
