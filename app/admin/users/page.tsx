import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function AdminUsersPage() {
  return (
    <DashboardShell role="admin" userName="University Admin">
      <SprintShellCard
        title="User Moderation"
        description="Manage account statuses and review platform security audit logs."
        sprintTarget="Sprint 2"
        backHref="/admin/dashboard"
        backLabel="Admin Overview"
      />
    </DashboardShell>
  );
}
