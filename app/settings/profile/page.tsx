import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function ProfileSettingsPage() {
  return (
    <DashboardShell role="organizer" userName="Account Settings">
      <SprintShellCard
        title="Profile Settings"
        description="Update your society or company profile metadata and preferences."
        sprintTarget="Sprint 2"
      />
    </DashboardShell>
  );
}
