import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { EventForm } from '@/components/events/event-form';
import { buttonClasses } from '@/components/ui/button';

export default async function NewEventPage() {
  const { context } = await requirePageSession({ allowedRoles: ['organizer'] });

  return (
    <DashboardShell role="organizer" userName={context.organizerProfile!.society_name}>
      <div className="space-y-5">
        <div>
          <Link href="/organizer/dashboard" className={buttonClasses('ghost', 'sm')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <EventForm mode="create" />
      </div>
    </DashboardShell>
  );
}
