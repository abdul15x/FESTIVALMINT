import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SprintShellCard } from '@/components/layout/sprint-shell-notice';

export default function OnboardingPage() {
  return (
    <DashboardShell role="organizer" userName="Role Onboarding">
      <SprintShellCard
        title="Role-Based Onboarding"
        description="Complete your University Society or Corporate Sponsor profile."
        sprintTarget="Sprint 2"
      />
    </DashboardShell>
  );
}
