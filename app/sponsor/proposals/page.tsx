import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import {
  SponsorProposalsClient,
  type SponsorProposalItem,
} from '@/components/proposals/sponsor-proposals-client';

export default async function SponsorProposalsPage() {
  const { supabase, context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile;

  const { data: proposals } = sponsor
    ? await supabase
        .from('proposals')
        .select(
          'id, event_id, package_id, amount_minor, currency, status, message, change_request_note, benefits_snapshot_json, expires_at, created_at, events(title, city, starts_at, status), organizer_profiles(society_name, university_name), sponsorship_packages(name)'
        )
        .eq('sponsor_id', sponsor.id)
        .order('created_at', { ascending: false })
        .returns<SponsorProposalItem[]>()
    : { data: [] as SponsorProposalItem[] };

  return (
    <DashboardShell role="sponsor" userName={sponsor?.company_name ?? context.profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">
            Sponsorship Proposals & Deals
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review organizer invitations, accept or request changes, pay accepted tiers via PayPal
            Sandbox, and inspect post-event fulfillment reports.
          </p>
        </div>

        <SponsorProposalsClient initialProposals={proposals ?? []} />
      </div>
    </DashboardShell>
  );
}
