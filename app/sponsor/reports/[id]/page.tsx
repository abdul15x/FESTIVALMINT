import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import {
  FulfillmentReportClient,
  type DeliverableDisplayItem,
  type SavedReportView,
} from '@/components/reports/fulfillment-report-client';
import type { PerformanceReportPayload } from '@/lib/ai/reports';

export default async function SponsorProposalReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile!;

  const { data: proposal } = await supabase
    .from('proposals')
    .select(
      'id, sponsor_id, amount_minor, currency, status, events(title, starts_at), organizer_profiles(society_name), sponsorship_packages(name)'
    )
    .eq('id', id)
    .eq('sponsor_id', sponsor.id)
    .maybeSingle<{
      id: string;
      sponsor_id: string;
      amount_minor: number;
      currency: string;
      status: string;
      events: { title: string; starts_at: string } | null;
      organizer_profiles: { society_name: string } | null;
      sponsorship_packages: { name: string } | null;
    }>();

  if (!proposal) {
    notFound();
  }

  const [{ data: deliverableRows }, { data: reportRow }] = await Promise.all([
    supabase
      .from('deliverables')
      .select(
        'id, title, description, status, evidence_files(id, storage_path, file_type, source_url, notes, created_at)'
      )
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('performance_reports')
      .select('id, report_json, created_at')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        report_json: PerformanceReportPayload & {
          generationSource?: 'ai_provider' | 'deterministic_fallback';
        };
        created_at: string;
      }>(),
  ]);

  const adminDb = createAdminSupabaseClient();
  const deliverables: DeliverableDisplayItem[] = await Promise.all(
    (deliverableRows ?? []).map(async (d) => {
      const files = Array.isArray(d.evidence_files) ? d.evidence_files : [];
      const mappedFiles = await Promise.all(
        files.map(
          async (f: {
            id: string;
            storage_path: string | null;
            file_type: string | null;
            source_url: string | null;
            notes: string | null;
            created_at: string;
          }) => {
            let signedUrl: string | null = null;
            if (f.storage_path && adminDb) {
              const { data: signed } = await adminDb.storage
                .from('evidence')
                .createSignedUrl(f.storage_path, 3600);
              signedUrl = signed?.signedUrl ?? null;
            }
            return {
              id: f.id,
              file_type: f.file_type,
              source_url: f.source_url,
              notes: f.notes,
              signed_url: signedUrl,
              created_at: f.created_at,
            };
          }
        )
      );

      return {
        id: d.id,
        title: d.title,
        description: d.description,
        status: d.status,
        evidence_files: mappedFiles,
      };
    })
  );

  const initialReport: SavedReportView | null = reportRow
    ? {
        id: reportRow.id,
        created_at: reportRow.created_at,
        report: reportRow.report_json,
      }
    : null;

  return (
    <DashboardShell role="sponsor" userName={sponsor.company_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/sponsor/proposals" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Proposals
          </Link>
          <Badge variant={proposal.status === 'paid' ? 'mint' : 'amber'}>
            {proposal.status.toUpperCase()}
          </Badge>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-950">
                Sponsor Fulfillment Review &amp; Performance Report
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {proposal.events?.title ?? 'Event'} by{' '}
                {proposal.organizer_profiles?.society_name ?? 'Society'} (
                {proposal.sponsorship_packages?.name ?? 'Package'} Tier)
                {proposal.events?.starts_at ? ` · ${formatShortDate(proposal.events.starts_at)}` : ''}
              </p>
            </div>
            <p className="font-display text-xl font-bold text-slate-950">
              {formatMinorCurrency(proposal.amount_minor, proposal.currency)}
            </p>
          </CardContent>
        </Card>

        <FulfillmentReportClient
          proposalId={proposal.id}
          viewerRole="sponsor"
          isPaid={proposal.status === 'paid'}
          initialDeliverables={deliverables}
          initialReport={initialReport}
        />
      </div>
    </DashboardShell>
  );
}
