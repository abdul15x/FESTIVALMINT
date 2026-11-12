import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function OrganizerMatchesPage() {
  return (
    <DashboardShell role="organizer" userName="Organizer Workspace">
      <SprintShellCard
        title="Ranked Sponsor Matches"
        description="Deterministic compatibility scores and AI explanations for your events."
        sprintTarget="Sprint 4"
        backHref="/organizer/dashboard"
        backLabel="Organizer Dashboard"
      />
    </DashboardShell>
  );
}

