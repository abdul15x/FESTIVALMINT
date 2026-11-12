import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { DiscoverEventsClient } from '@/components/sponsor/discover-client';

export default async function SponsorDiscoverPage() {
  const { context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile;

  return (
    <DashboardShell role="sponsor" userName={sponsor?.company_name ?? context.profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Discover University Events
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse verified university events ranked by audience alignment, budget fit, and brand
            objectives.
          </p>
        </div>

        <DiscoverEventsClient hasSponsorProfile={Boolean(sponsor)} />
      </div>
    </DashboardShell>
  );
}
