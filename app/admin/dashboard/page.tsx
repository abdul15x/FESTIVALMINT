import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function AdminDashboardPage() {
  return (
    <DashboardShell role="admin" userName="University Admin">
      <SprintShellCard
        title="Admin Verification Overview"
        description="Review pending student societies, moderate university events, and inspect audit logs."
        sprintTarget="Sprint 2"
      />
    </DashboardShell>
  );
}
