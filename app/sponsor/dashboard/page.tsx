import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function SponsorDashboardPage() {
  return (
    <DashboardShell role="sponsor" userName="Sponsor Workspace">
      <SprintShellCard
        title="Sponsor Dashboard"
        description="View AI-recommended university events, active proposals, and PayPal Sandbox spend."
        sprintTarget="Sprint 2 & Sprint 4"
      />
    </DashboardShell>
  );
}
