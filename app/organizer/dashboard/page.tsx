import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function OrganizerDashboardPage() {
  return (
    <DashboardShell role="organizer" userName="Organizer Workspace">
      <SprintShellCard
        title="Organizer Dashboard"
        description="Manage campus events, AI sponsorship packages, sponsor matches, and fulfillment."
        sprintTarget="Sprint 2 & Sprint 3"
      />
    </DashboardShell>
  );
}
