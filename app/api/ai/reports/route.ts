import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { checkAiRateLimit } from '@/lib/ai/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { generatePerformanceReport, type DeliverableEvidenceInput } from '@/lib/ai/reports';
import { formatMinorCurrency } from '@/lib/utils';

const reportRequestSchema = z.object({
  proposalId: z.string().uuid('Valid proposalId is required.'),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer', 'sponsor', 'admin']);
  if (!auth.ok) return auth.response;

  if (!checkAiRateLimit(`report:${auth.context.userId}`, 15, 60_000)) {
    return apiError('RATE_LIMITED', 'Too many report requests. Please wait a minute.', 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid report request.',
      400
    );
  }

  const { supabase, context } = auth;
  const { data: proposal } = await supabase
    .from('proposals')
    .select(
      'id, organizer_id, sponsor_id, amount_minor, currency, status, events(title), sponsor_profiles(company_name)'
    )
    .eq('id', parsed.data.proposalId)
    .maybeSingle<{
      id: string;
      organizer_id: string;
      sponsor_id: string;
      amount_minor: number;
      currency: string;
      status: string;
      events: { title: string } | null;
      sponsor_profiles: { company_name: string } | null;
    }>();

  if (!proposal) {
    return apiError('NOT_FOUND', 'Proposal not found or unauthorized.', 404);
  }

  if (
    context.profile.role === 'organizer' &&
    proposal.organizer_id !== context.organizerProfile?.id
  ) {
    return apiError('FORBIDDEN', 'Access denied for this sponsorship.', 403);
  }
  if (context.profile.role === 'sponsor' && proposal.sponsor_id !== context.sponsorProfile?.id) {
    return apiError('FORBIDDEN', 'Access denied for this sponsorship.', 403);
  }

  if (proposal.status !== 'paid') {
    return apiError(
      'PAYMENT_REQUIRED',
      'Performance reports can only be generated after PayPal payment is completed.',
      409
    );
  }

  const [{ data: deliverables }] = await Promise.all([
    supabase
      .from('deliverables')
      .select('id, title, status, evidence_files(id, file_type, source_url, notes)')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: true }),
  ]);

  const deliverableInputs: DeliverableEvidenceInput[] = (deliverables ?? []).map((d) => {
    const files = Array.isArray(d.evidence_files) ? d.evidence_files : [];
    return {
      id: d.id,
      title: d.title,
      status: d.status,
      evidenceCount: files.length,
      evidenceNotes: files
        .map((f: { notes?: string | null }) => f.notes ?? '')
        .filter((n: string) => n.trim().length > 0),
      evidenceUrls: files
        .map((f: { source_url?: string | null }) => f.source_url ?? '')
        .filter((u: string) => u.trim().length > 0),
      evidenceFileTypes: files
        .map((f: { file_type?: string | null }) => f.file_type ?? 'unknown')
        .filter(Boolean),
    };
  });

  const generated = await generatePerformanceReport({
    eventTitle: proposal.events?.title ?? 'University Event',
    sponsorName: proposal.sponsor_profiles?.company_name ?? 'Sponsor Partner',
    amountFormatted: formatMinorCurrency(proposal.amount_minor, proposal.currency),
    deliverables: deliverableInputs,
  });

  const adminDb = createAdminSupabaseClient() ?? supabase;
  const { data: saved, error: saveErr } = await adminDb
    .from('performance_reports')
    .insert({
      proposal_id: proposal.id,
      generated_by: context.userId,
      summary: generated.report.summary,
      report_json: {
        ...generated.report,
        generationSource: generated.source,
      },
    })
    .select('*')
    .single();

  if (saveErr || !saved) {
    return apiError('REPORT_SAVE_FAILED', saveErr?.message ?? 'Could not save report.', 500);
  }

  return apiSuccess(
    {
      reportRecord: saved,
      report: generated.report,
      source: generated.source,
    },
    'Sponsorship performance report generated.',
    201
  );
}
