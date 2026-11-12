import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { EventForm } from '@/components/events/event-form';
import { buttonClasses } from '@/components/ui/button';

export default async function NewEventPage() {
  const { context } = await requirePageSession({ allowedRoles: ['organizer'] });

  return (
    <DashboardShell role="organizer" userName={context.organizerProfile!.society_name}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="New Event Brief"
          title="Launch a University Event"
          description="Set up your audience demographics, campus schedule, and benefit inventory before configuring sponsorship tiers."
          actions={
            <Link href="/organizer/dashboard" className={buttonClasses('outline', 'sm')}>
              <ArrowLeft className="h-4 w-4" />
              Command Center
            </Link>
          }
        />
        <EventForm mode="create" />
      </div>
    </DashboardShell>
  );
}
