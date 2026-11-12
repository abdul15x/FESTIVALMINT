import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { DiscoverEventsClient } from '@/components/sponsor/discover-client';

export default async function SponsorDiscoverPage() {
  const { context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile;

  return (
    <DashboardShell role="sponsor" userName={sponsor?.company_name ?? context.profile.full_name}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Campus Marketplace"
          title="Discover Verified University Events"
          description="Filter vetted student events scored across audience alignment, category focus, budget range, and activation inventory."
        />

        <DiscoverEventsClient hasSponsorProfile={Boolean(sponsor)} />
      </div>
    </DashboardShell>
  );
}
