import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession, getDashboardPathForRole } from '@/lib/auth/session';
import {
  OrganizerOnboardingForm,
  SponsorOnboardingForm,
} from '@/components/auth/onboarding-form';

export default async function OnboardingPage() {
  const { context } = await requirePageSession({ requireOnboarded: false });

  if (context.profile.role === 'admin') {
    redirect('/admin/dashboard');
  }
  if (context.profile.role === 'organizer' && context.organizerProfile) {
    redirect(getDashboardPathForRole('organizer'));
  }
  if (context.profile.role === 'sponsor' && context.sponsorProfile) {
    redirect(getDashboardPathForRole('sponsor'));
  }

  return (
    <DashboardShell role={context.profile.role} userName={context.profile.full_name}>
      <div className="mx-auto max-w-3xl space-y-6">
        {context.profile.role === 'organizer' ? (
          <OrganizerOnboardingForm
            defaultContactName={context.profile.full_name}
            defaultEmail={context.email}
          />
        ) : (
          <SponsorOnboardingForm defaultEmail={context.email} />
        )}
      </div>
    </DashboardShell>
  );
}
