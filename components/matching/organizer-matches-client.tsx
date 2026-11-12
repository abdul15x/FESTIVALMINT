'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label, Select, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatMinorCurrency } from '@/lib/utils';
import type { EventRow, SponsorProfileRow, SponsorshipPackageRow } from '@/types/database';
import type { ExplainedMatchResult } from '@/lib/ai/matching';

interface RankedMatchRow {
  sponsor: SponsorProfileRow;
  match: ExplainedMatchResult;
  recommendedPackage: SponsorshipPackageRow | null;
}

export function OrganizerMatchesClient({
  events,
  initialEventId,
  packagesByEvent,
}: {
  events: EventRow[];
  initialEventId?: string;
  packagesByEvent: Record<string, SponsorshipPackageRow[]>;
}) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(
    initialEventId && events.some((e) => e.id === initialEventId)
      ? initialEventId
      : (events[0]?.id ?? '')
  );
  const [matches, setMatches] = useState<RankedMatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Inline proposal composer state
  const [activeSponsor, setActiveSponsor] = useState<SponsorProfileRow | null>(null);
  const [proposalPackageId, setProposalPackageId] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  const eventPackages = (packagesByEvent[selectedEventId] ?? []).filter(
    (p) => p.status !== 'archived'
  );

  async function computeMatches() {
    if (!selectedEventId) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not generate sponsor matches.');
        return;
      }
      setMatches(json.data.matches ?? []);
    } catch {
      setError('Network error computing sponsor matches.');
    } finally {
      setLoading(false);
    }
  }

  function openComposer(row: RankedMatchRow) {
    setActiveSponsor(row.sponsor);
    const defaultPkg = row.recommendedPackage?.id ?? eventPackages[0]?.id ?? '';
    setProposalPackageId(defaultPkg);
    setProposalMessage(
      `Hello ${row.sponsor.company_name} team,\n\nWe would love to invite you to partner with our event based on our profile compatibility score (${row.match.score}/100). Please review the proposed package below.`
    );
    setFeedback(null);
    setError(null);
  }

  async function generateOutreachDraft() {
    if (!activeSponsor || !proposalPackageId || !selectedEventId) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          sponsorId: activeSponsor.id,
          packageId: proposalPackageId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not draft outreach message.');
        return;
      }
      setProposalMessage(json.data.message);
      setFeedback(
        json.data.source === 'ai_provider'
          ? 'Drafted personalized outreach message with AI.'
          : 'Generated editable template (deterministic fallback — no live AI key).'
      );
    } catch {
      setError('Network error drafting proposal message.');
    } finally {
      setDrafting(false);
    }
  }

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSponsor || !proposalPackageId || !selectedEventId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          sponsorId: activeSponsor.id,
          packageId: proposalPackageId,
          message: proposalMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not send proposal.');
        return;
      }
      setFeedback(`Proposal sent to ${activeSponsor.company_name}.`);
      setActiveSponsor(null);
      router.refresh();
    } catch {
      setError('Network error sending proposal.');
    } finally {
      setSending(false);
    }
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-600">
          Create an event first to run explainable sponsor matching.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <Label htmlFor="matchEvent">Select Event</Label>
            <Select
              id="matchEvent"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setMatches([]);
                setActiveSponsor(null);
              }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.status})
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" disabled={loading} onClick={computeMatches}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Rank &amp; Explain Sponsors
          </Button>
        </CardContent>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {activeSponsor && (
        <Card className="border-emerald-300 bg-emerald-50/30">
          <CardHeader>
            <CardTitle>Send Proposal to {activeSponsor.company_name}</CardTitle>
            <CardDescription>
              Select an approved sponsorship package and customize your pitch before sending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendProposal} className="space-y-4">
              {eventPackages.length === 0 ? (
                <Alert tone="warning">
                  Save at least one sponsorship package on this event before sending a proposal.
                </Alert>
              ) : (
                <>
                  <div>
                    <Label htmlFor="propPkg">Sponsorship Package</Label>
                    <Select
                      id="propPkg"
                      value={proposalPackageId}
                      onChange={(e) => setProposalPackageId(e.target.value)}
                    >
                      {eventPackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — {formatMinorCurrency(pkg.price_minor, pkg.currency)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Label htmlFor="propMsg" className="mb-0">
                        Editable Proposal Message
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={drafting}
                        onClick={generateOutreachDraft}
                      >
                        {drafting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                        Draft with AI
                      </Button>
                    </div>
                    <Textarea
                      id="propMsg"
                      required
                      minLength={20}
                      className="min-h-[140px]"
                      value={proposalMessage}
                      onChange={(e) => setProposalMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={sending}>
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Sponsorship Proposal
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveSponsor(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((row) => (
            <Card key={row.sponsor.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-slate-950">
                        {row.sponsor.company_name}
                      </h3>
                      <Badge variant="navy">{row.sponsor.industry}</Badge>
                      <Badge
                        variant={
                          row.match.explanationSource === 'ai_provider' ? 'mint' : 'neutral'
                        }
                      >
                        {row.match.explanationSource === 'ai_provider'
                          ? 'AI Explanation'
                          : 'Deterministic Explanation'}
                      </Badge>
                      {row.sponsor.is_demo && <Badge variant="amber">Demo</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Budget:{' '}
                      <span className="font-mono">
                        {formatMinorCurrency(row.sponsor.budget_min_minor, row.sponsor.currency)} –{' '}
                        {formatMinorCurrency(row.sponsor.budget_max_minor, row.sponsor.currency)}
                      </span>{' '}
                      • Confidence: <span className="uppercase">{row.match.confidence}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-right">
                      <p className="font-mono text-2xl font-bold text-emerald-700">
                        {row.match.score}
                        <span className="text-xs font-normal">/100</span>
                      </p>
                      <p className="text-[10px] font-semibold uppercase text-emerald-800">
                        Compatibility
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openComposer(row)}>
                      <Send className="h-3.5 w-3.5" />
                      Propose
                    </Button>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-700">{row.match.explanation}</p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ['Audience (30%)', row.match.factorScores.audience_fit],
                    ['Industry (20%)', row.match.factorScores.industry_fit],
                    ['Budget (20%)', row.match.factorScores.budget_fit],
                    ['Location (10%)', row.match.factorScores.location_fit],
                    ['Benefits (10%)', row.match.factorScores.benefit_fit],
                    ['Timing (10%)', row.match.factorScores.timing_fit],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[10px] font-medium text-slate-500">{label}</p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">{val}/100</p>
                    </div>
                  ))}
                </div>

                {row.match.missingInformation.length > 0 && (
                  <p className="text-xs text-amber-800">
                    <strong>Missing info:</strong> {row.match.missingInformation.join(' • ')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
