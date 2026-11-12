import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { OrganizerMatchesClient } from '@/components/matching/organizer-matches-client';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
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
        <PageHeader
          eyebrow="6-Factor Fit Engine"
          title="Ranked Sponsor Matches & Outreach"
          description="Score verified brand sponsors against your campus event, inspect transparent 6-factor scoring, and send tailored sponsorship proposals."
        />

        {(events ?? []).length === 0 ? (
          <EmptyState
            icon={<CalendarPlus className="h-5 w-5" />}
            title="No events created yet"
            description="Create an event and configure sponsorship packages first to unlock brand matching."
            action={
              <Link href="/organizer/events/new" className={buttonClasses('primary', 'sm')}>
                Create First Event
              </Link>
            }
          />
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
