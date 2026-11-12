'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  UploadCloud,
  Link2,
  Sparkles,
  AlertTriangle,
  FileText,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PerformanceReportPayload } from '@/lib/ai/reports';

export interface EvidenceDisplayItem {
  id: string;
  file_type: string | null;
  source_url: string | null;
  notes: string | null;
  signed_url: string | null;
  created_at: string;
}

export interface DeliverableDisplayItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  evidence_files: EvidenceDisplayItem[];
}

export interface SavedReportView {
  id: string;
  created_at: string;
  report: PerformanceReportPayload & {
    generationSource?: 'ai_provider' | 'deterministic_fallback';
  };
}

const DELIVERABLE_BADGE: Record<string, 'neutral' | 'blue' | 'mint' | 'red' | 'amber'> = {
  pending: 'amber',
  submitted: 'blue',
  verified: 'mint',
  not_verified: 'red',
  waived_by_sponsor: 'neutral',
};

export function FulfillmentReportClient({
  proposalId,
  viewerRole,
  isPaid,
  initialDeliverables,
  initialReport,
}: {
  proposalId: string;
  viewerRole: 'organizer' | 'sponsor';
  isPaid: boolean;
  initialDeliverables: DeliverableDisplayItem[];
  initialReport: SavedReportView | null;
}) {
  const router = useRouter();
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [reportView, setReportView] = useState<SavedReportView | null>(initialReport);
  const [busyDeliverableId, setBusyDeliverableId] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitEvidence(deliverableId: string) {
    setBusyDeliverableId(deliverableId);
    setError(null);
    setFeedback(null);

    try {
      const selectedFile = fileMap[deliverableId];
      const notes = notesMap[deliverableId]?.trim() ?? '';
      const sourceUrl = urlMap[deliverableId]?.trim() ?? '';

      let res: Response;
      if (selectedFile) {
        const fd = new FormData();
        fd.set('deliverableId', deliverableId);
        fd.set('notes', notes);
        if (sourceUrl) fd.set('sourceUrl', sourceUrl);
        fd.set('file', selectedFile);
        res = await fetch('/api/evidence', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliverableId,
            sourceUrl,
            notes,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not submit evidence.');
        return;
      }

      const ev = json.data.evidence;
      const signedUrl: string | null = json.data.signedUrl ?? null;

      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === deliverableId
            ? {
                ...d,
                status: d.status === 'pending' ? 'submitted' : d.status,
                evidence_files: [
                  ...d.evidence_files,
                  {
                    id: ev.id,
                    file_type: ev.file_type,
                    source_url: ev.source_url,
                    notes: ev.notes,
                    signed_url: signedUrl,
                    created_at: ev.created_at,
                  },
                ],
              }
            : d
        )
      );

      setFileMap((prev) => ({ ...prev, [deliverableId]: null }));
      setNotesMap((prev) => ({ ...prev, [deliverableId]: '' }));
      setUrlMap((prev) => ({ ...prev, [deliverableId]: '' }));
      setFeedback(json.message ?? 'Fulfillment evidence saved.');
      router.refresh();
    } catch {
      setError('Network error saving deliverable evidence.');
    } finally {
      setBusyDeliverableId(null);
    }
  }

  async function updateDeliverableStatus(
    deliverableId: string,
    status: 'verified' | 'not_verified' | 'waived_by_sponsor'
  ) {
    setBusyDeliverableId(deliverableId);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/evidence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverableId, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not update deliverable verification.');
        return;
      }
      setDeliverables((prev) =>
        prev.map((d) => (d.id === deliverableId ? { ...d, status } : d))
      );
      setFeedback(`Deliverable marked as ${status.replace('_', ' ')}.`);
      router.refresh();
    } catch {
      setError('Network error updating deliverable status.');
    } finally {
      setBusyDeliverableId(null);
    }
  }

  async function generateReport() {
    setGeneratingReport(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not generate performance report.');
        return;
      }
      setReportView({
        id: json.data.reportRecord.id,
        created_at: json.data.reportRecord.created_at,
        report: {
          ...json.data.report,
          generationSource: json.data.source,
        },
      });
      setFeedback('Sponsorship performance report generated and saved.');
      router.refresh();
    } catch {
      setError('Network error generating performance report.');
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {!isPaid && (
        <Alert tone="warning" title="Awaiting PayPal Sandbox Payment">
          Deliverable tracking and performance reporting unlock once this proposal is paid via
          PayPal Sandbox.
        </Alert>
      )}

      {/* Deliverables Checklist & Evidence */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsorship Deliverables &amp; Proof</CardTitle>
          <CardDescription>
            Each deliverable from the locked sponsorship package requires photo, PDF/CSV report, or
            public URL evidence before verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliverables.length === 0 ? (
            <p className="text-sm text-slate-500">
              No deliverables seeded yet. Deliverables are auto-seeded from the locked package
              benefits immediately upon PayPal capture.
            </p>
          ) : (
            deliverables.map((d) => (
              <div
                key={d.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-950">{d.title}</h3>
                    {d.description && <p className="mt-0.5 text-xs text-slate-500">{d.description}</p>}
                  </div>
                  <Badge variant={DELIVERABLE_BADGE[d.status] ?? 'neutral'}>
                    {d.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {d.evidence_files.length > 0 && (
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Submitted Proof Items ({d.evidence_files.length})
                    </p>
                    {d.evidence_files.map((ef) => (
                      <div
                        key={ef.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 font-medium text-slate-800">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{ef.file_type ?? 'evidence'}</span>
                          </p>
                          {ef.notes && <p className="text-slate-600">{ef.notes}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ef.signed_url && (
                            <a
                              href={ef.signed_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
                            >
                              Signed File
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {ef.source_url && (
                            <a
                              href={ef.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                            >
                              Proof Link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewerRole === 'organizer' && isPaid && (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`file-${d.id}`}>
                          Upload File (JPG/PNG/WEBP/PDF/CSV/TXT, max 10 MB)
                        </Label>
                        <Input
                          id={`file-${d.id}`}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,.csv,.txt"
                          onChange={(e) =>
                            setFileMap((prev) => ({
                              ...prev,
                              [d.id]: e.target.files?.[0] ?? null,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`url-${d.id}`}>Proof URL (Optional fallback)</Label>
                        <div className="relative">
                          <Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id={`url-${d.id}`}
                            className="pl-9"
                            placeholder="https://example.edu/recap-post"
                            value={urlMap[d.id] ?? ''}
                            onChange={(e) =>
                              setUrlMap((prev) => ({ ...prev, [d.id]: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`notes-${d.id}`}>Organizer Fulfillment Notes</Label>
                      <Textarea
                        id={`notes-${d.id}`}
                        rows={2}
                        placeholder="Describe photo, social impressions, or booth execution details..."
                        value={notesMap[d.id] ?? ''}
                        onChange={(e) =>
                          setNotesMap((prev) => ({ ...prev, [d.id]: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={busyDeliverableId === d.id}
                      onClick={() => submitEvidence(d.id)}
                    >
                      {busyDeliverableId === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="h-3.5 w-3.5" />
                      )}
                      Submit Evidence
                    </Button>
                  </div>
                )}

                {viewerRole === 'sponsor' && isPaid && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busyDeliverableId === d.id}
                      onClick={() => updateDeliverableStatus(d.id, 'verified')}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify Deliverable
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyDeliverableId === d.id}
                      onClick={() => updateDeliverableStatus(d.id, 'waived_by_sponsor')}
                    >
                      Waive
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyDeliverableId === d.id}
                      onClick={() => updateDeliverableStatus(d.id, 'not_verified')}
                    >
                      Flag Missing
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Sponsorship Performance Report */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>AI Sponsorship Performance Report</CardTitle>
            <CardDescription>
              Strictly separates verified uploaded proof, organizer claims, analytical observations,
              and missing deliverables.
            </CardDescription>
          </div>
          {isPaid && (
            <Button onClick={generateReport} disabled={generatingReport} variant="secondary" size="sm">
              {generatingReport ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {reportView ? 'Regenerate Report' : 'Generate Performance Report'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {!reportView ? (
            <p className="text-sm text-slate-500">
              No performance report generated yet. Upload evidence above and click &ldquo;Generate
              Performance Report&rdquo;.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-950">
                    {reportView.report.headline}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{reportView.report.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="mint">
                    {reportView.report.fulfillmentRatePercent}% Evidence Coverage
                  </Badge>
                  <Badge
                    variant={
                      reportView.report.generationSource === 'ai_provider' ? 'blue' : 'neutral'
                    }
                  >
                    {reportView.report.generationSource === 'ai_provider'
                      ? 'AI-Generated Analysis'
                      : 'Deterministic Fallback Audit'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Facts &amp; Uploaded Proof
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-800">
                    {reportView.report.verifiedFacts.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Missing / Unverified Deliverables
                  </p>
                  {reportView.report.missingDeliverables.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-700">
                      All agreed deliverables are backed by uploaded proof or sponsor sign-off.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs text-amber-950">
                      {reportView.report.missingDeliverables.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Organizer Claims (Self-Reported)
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {reportView.report.organizerClaims.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-900">
                    Analytical Observations
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-800">
                    {reportView.report.aiObservations.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
