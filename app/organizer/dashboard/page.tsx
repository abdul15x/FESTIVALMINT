import Link from 'next/link';
import { CalendarPlus, Sparkles, Handshake, ArrowRight } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import type { EventRow, ProposalRow } from '@/types/database';

export default async function OrganizerDashboardPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['organizer'] });
  const org = context.organizerProfile!;

  const [{ data: events }, { data: proposals }] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('organizer_id', org.id)
      .order('created_at', { ascending: false })
      .returns<EventRow[]>(),
    supabase
      .from('proposals')
      .select('*')
      .eq('organizer_id', org.id)
      .order('created_at', { ascending: false })
      .returns<ProposalRow[]>(),
  ]);

  const eventList = events ?? [];
  const proposalList = proposals ?? [];
  const paidProposals = proposalList.filter((p) => p.status === 'paid');
  const totalConfirmedMinor = paidProposals.reduce((acc, p) => acc + p.amount_minor, 0);

  return (
    <DashboardShell role="organizer" userName={org.society_name}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-slate-950">{org.society_name}</h1>
              <Badge
                variant={
                  org.verification_status === 'verified'
                    ? 'mint'
                    : org.verification_status === 'rejected'
                      ? 'red'
                      : 'amber'
                }
              >
                {org.verification_status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {org.university_name ?? 'University'} • {org.campus_city}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/organizer/events/new" className={buttonClasses('primary', 'md')}>
              <CalendarPlus className="h-4 w-4" />
              Create Event
            </Link>
            <Link href="/organizer/matches" className={buttonClasses('outline', 'md')}>
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Sponsor Matches
            </Link>
          </div>
        </div>

        {org.verification_status === 'pending' && (
          <Alert tone="info" title="Society Verification Pending">
            You can create events and generate AI sponsorship packages now. Admin verification is
            required before events appear publicly in Sponsor Discovery.
          </Alert>
        )}
        {org.verification_status === 'rejected' && (
          <Alert tone="error" title="Verification Needs Attention">
            {org.review_note ||
              'An administrator requested updates to your society profile. Please update your details in Profile Settings.'}
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Total Events</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-950">{eventList.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Approved / Published</p>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-700">
                {eventList.filter((e) => e.status === 'approved' || e.status === 'published').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Active Proposals</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-950">
                {proposalList.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">Confirmed Sandbox Funding</p>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-700">
                {formatMinorCurrency(totalConfirmedMinor)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Create an event, generate AI sponsorship packages, and match with sponsors.
              </CardDescription>
            </div>
            <Link href="/organizer/events/new" className={buttonClasses('outline', 'sm')}>
              New Event
            </Link>
          </CardHeader>
          <CardContent>
            {eventList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">No events created yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Start by creating your first society event to unlock AI package pricing and
                  sponsor matching.
                </p>
                <Link
                  href="/organizer/events/new"
                  className={buttonClasses('primary', 'sm', 'mt-4')}
                >
                  Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {eventList.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/organizer/events/${ev.id}`}
                          className="font-semibold text-slate-950 hover:text-emerald-700"
                        >
                          {ev.title}
                        </Link>
                        <Badge variant={ev.status === 'published' || ev.status === 'approved' ? 'mint' : 'neutral'}>
                          {ev.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {ev.category} • {ev.city} • {formatShortDate(ev.starts_at)} •{' '}
                        {ev.expected_attendees} est. attendees
                      </p>
                    </div>
                    <Link
                      href={`/organizer/events/${ev.id}`}
                      className={buttonClasses('outline', 'sm')}
                    >
                      Manage &amp; Packages
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Recent Sponsorship Proposals</CardTitle>
              <CardDescription>Track sponsor responses and fulfillment status.</CardDescription>
            </div>
            <Link href="/organizer/proposals" className={buttonClasses('ghost', 'sm')}>
              <Handshake className="h-4 w-4" />
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {proposalList.length === 0 ? (
              <p className="text-sm text-slate-500">
                No proposals sent yet. Once your event has packages, visit Sponsor Matches to send
                a tailored offer.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {proposalList.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-slate-500">Proposal {p.id.slice(0, 8)}</p>
                      <p className="font-semibold text-slate-900">
                        {formatMinorCurrency(p.amount_minor, p.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === 'paid' ? 'mint' : 'neutral'}>{p.status}</Badge>
                      {p.status === 'paid' && (
                        <Link
                          href={`/organizer/reports/${p.id}`}
                          className={buttonClasses('outline', 'sm')}
                        >
                          Report &amp; Proof
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
