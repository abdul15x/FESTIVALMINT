import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function SponsorDiscoverPage() {
  return (
    <DashboardShell role="sponsor" userName="Sponsor Workspace">
      <SprintShellCard
        title="Discover University Events"
        description="Browse and filter approved campus events with explainable compatibility scores."
        sprintTarget="Sprint 4"
        backHref="/sponsor/dashboard"
        backLabel="Sponsor Dashboard"
      />
    </DashboardShell>
  );
}

