import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { buttonClasses } from '@/components/ui/button';
import { EventForm } from '@/components/events/event-form';
import { PackageStudio } from '@/components/events/package-studio';
import type { EventRow, SponsorshipPackageRow } from '@/types/database';

export default async function OrganizerEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, context } = await requirePageSession({ allowedRoles: ['organizer'] });
  const org = context.organizerProfile!;

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organizer_id', org.id)
    .maybeSingle<EventRow>();

  if (!event) {
    notFound();
  }

  const [{ data: benefitRows }, { data: packageRows }] = await Promise.all([
    supabase.from('event_benefits').select('benefit_type').eq('event_id', event.id),
    supabase
      .from('sponsorship_packages')
      .select('*')
      .eq('event_id', event.id)
      .order('price_minor', { ascending: true })
      .returns<SponsorshipPackageRow[]>(),
  ]);

  const benefitTypes = (benefitRows ?? []).map((b) => b.benefit_type);

  return (
    <DashboardShell role="organizer" userName={org.society_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/organizer/dashboard" className={buttonClasses('outline', 'sm')}>
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-slate-950 sm:text-2xl">
                  {event.title}
                </h1>
                <Badge
                  variant={
                    event.status === 'published' || event.status === 'approved'
                      ? 'mint'
                      : event.status === 'rejected'
                        ? 'red'
                        : 'amber'
                  }
                >
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>

          <Link
            href={`/organizer/matches?eventId=${event.id}`}
            className={buttonClasses('secondary', 'sm')}
          >
            <Sparkles className="h-4 w-4" />
            Find Matched Sponsors
          </Link>
        </div>

        {event.status === 'rejected' && event.review_note && (
          <Alert tone="error" title="Admin Review Note">
            {event.review_note}
          </Alert>
        )}

        <PackageStudio
          eventId={event.id}
          eventStatus={event.status}
          initialPackages={packageRows ?? []}
        />

        <EventForm mode="edit" initialEvent={event} initialBenefits={benefitTypes} />
      </div>
    </DashboardShell>
  );
}
