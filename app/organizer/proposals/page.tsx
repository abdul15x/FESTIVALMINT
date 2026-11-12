import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function OrganizerProposalsPage() {
  return (
    <DashboardShell role="organizer" userName="Organizer Workspace">
      <SprintShellCard
        title="Proposals & Deal Fulfillment"
        description="Track sent proposals, PayPal Sandbox confirmation status, and deliverable evidence."
        sprintTarget="Sprint 4 & Sprint 6"
        backHref="/organizer/dashboard"
        backLabel="Organizer Dashboard"
      />
    </DashboardShell>
  );
}

