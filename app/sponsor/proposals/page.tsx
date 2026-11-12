import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function SponsorProposalsPage() {
  return (
    <DashboardShell role="sponsor" userName="Sponsor Workspace">
      <SprintShellCard
        title="Sponsor Proposals & Checkout"
        description="Review incoming proposals, accept terms, and pay via PayPal Sandbox."
        sprintTarget="Sprint 4 & Sprint 5"
        backHref="/sponsor/dashboard"
        backLabel="Sponsor Dashboard"
      />
    </DashboardShell>
  );
}
