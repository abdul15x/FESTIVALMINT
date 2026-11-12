import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function NewEventPage() {
  return (
    <DashboardShell role="organizer" userName="Organizer Workspace">
      <SprintShellCard
        title="Create University Event"
        description="Submit event audience, reach, sponsorship needs, and generate AI package tiers."
        sprintTarget="Sprint 3"
        backHref="/organizer/dashboard"
        backLabel="Organizer Dashboard"
      />
    </DashboardShell>
  );
}

