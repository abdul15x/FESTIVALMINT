import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { PageHeader } from '@/components/ui/page-header';
import {
  ReviewQueueClient,
  type PendingEventItem,
  type PendingOrganizerItem,
} from '@/components/admin/review-queue-client';

export default async function AdminReviewsPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['admin'] });
  const db = createAdminSupabaseClient() ?? supabase;

  const [{ data: organizers }, { data: events }] = await Promise.all([
    db
      .from('organizer_profiles')
      .select(
        'id, society_name, university_name, campus_city, category, official_email, verification_status'
      )
      .in('verification_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })
      .returns<PendingOrganizerItem[]>(),
    db
      .from('events')
      .select('id, title, category, city, country, expected_attendees, status')
      .in('status', ['pending_review', 'draft'])
      .order('created_at', { ascending: false })
      .returns<PendingEventItem[]>(),
  ]);

  return (
    <DashboardShell role="admin" userName={context.profile.full_name}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Trust & Compliance"
          title="Verification Queue"
          description="Approve or request updates for student societies and campus event submissions before they enter Sponsor Discovery."
        />
        <ReviewQueueClient organizers={organizers ?? []} events={events ?? []} />
      </div>
    </DashboardShell>
  );
}
