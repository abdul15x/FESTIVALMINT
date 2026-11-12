import Link from 'next/link';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { OrganizerMatchesClient } from '@/components/matching/organizer-matches-client';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';
import type { EventRow, SponsorshipPackageRow } from '@/types/database';

export default async function OrganizerMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, context } = await requirePageSession({ allowedRoles: ['organizer'] });
  const org = context.organizerProfile!;

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', org.id)
    .order('created_at', { ascending: false })
    .returns<EventRow[]>();

  const eventIds = (events ?? []).map((e) => e.id);
  const { data: packages } = eventIds.length
    ? await supabase
        .from('sponsorship_packages')
        .select('*')
        .in('event_id', eventIds)
        .order('price_minor', { ascending: true })
        .returns<SponsorshipPackageRow[]>()
    : { data: [] as SponsorshipPackageRow[] };

  const packagesByEvent: Record<string, SponsorshipPackageRow[]> = {};
  for (const pkg of packages ?? []) {
    packagesByEvent[pkg.event_id] = [...(packagesByEvent[pkg.event_id] ?? []), pkg];
  }

  return (
    <DashboardShell role="organizer" userName={org.society_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Ranked Sponsor Matches & AI Outreach
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Score verified brand sponsors against your event, inspect transparent 6-factor scoring,
            and send personalized sponsorship proposals.
          </p>
        </div>

        {(events ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No events created yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Create an event and generate sponsorship packages first to unlock sponsor matching.
              </p>
              <Link href="/organizer/events/new" className={`${buttonClasses('primary', 'sm')} mt-4`}>
                Create First Event
              </Link>
            </CardContent>
          </Card>
        ) : (
          <OrganizerMatchesClient
            events={events ?? []}
            initialEventId={sp.eventId}
            packagesByEvent={packagesByEvent}
          />
        )}
      </div>
    </DashboardShell>
  );
}
