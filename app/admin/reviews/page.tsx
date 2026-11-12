import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function AdminReviewsPage() {
  return (
    <DashboardShell role="admin" userName="University Admin">
      <SprintShellCard
        title="Verification Queue"
        description="Approve or reject organizer societies and event submissions with audit notes."
        sprintTarget="Sprint 2"
        backHref="/admin/dashboard"
        backLabel="Admin Overview"
      />
    </DashboardShell>
  );
}
