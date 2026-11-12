import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form';

export default async function ProfileSettingsPage() {
  const { context } = await requirePageSession({ requireOnboarded: false });

  return (
    <DashboardShell role={context.profile.role} userName={context.profile.full_name}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Workspace Settings"
          title="Profile & Organization Details"
          description="Keep your contact details, audience tags, and sponsorship parameters accurate for sharper marketplace matching."
        />
        <ProfileSettingsForm
          profile={context.profile}
          organizerProfile={context.organizerProfile}
          sponsorProfile={context.sponsorProfile}
        />
      </div>
    </DashboardShell>
  );
}
