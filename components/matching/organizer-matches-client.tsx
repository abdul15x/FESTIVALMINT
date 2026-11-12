'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2, Wand2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label, Select, Textarea } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import {
  AnimatedScoreBar,
  AnimatedScoreRing,
  SlideOverDrawer,
} from '@/components/motion/primitives';
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
  const [hasComputed, setHasComputed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Slide-over proposal composer state
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
      setHasComputed(true);
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
          ? 'Drafted personalized outreach message with FestivalMint AI.'
          : 'Generated an editable outreach template for your review.'
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
      <EmptyState
        icon={<Target className="h-5 w-5" />}
        title="No events available yet"
        description="Create an event first to unlock personalized sponsor compatibility matching."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <Label htmlFor="matchEvent">Target Event</Label>
            <Select
              id="matchEvent"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setMatches([]);
                setHasComputed(false);
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
          <Button variant="secondary" size="md" disabled={loading} onClick={computeMatches}>
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

      {!hasComputed && matches.length === 0 && !loading && (
        <EmptyState
          icon={<Sparkles className="h-5 w-5 text-emerald-700" />}
          title="Ready to rank compatible brands"
          description="Select an event above and click “Rank & Explain Sponsors” to compute 6-factor compatibility scores and tailored outreach drafts."
        />
      )}

      {hasComputed && matches.length === 0 && !loading && (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="No sponsor profiles found"
          description="Once sponsors onboard into the marketplace, compatible matches will appear here."
        />
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((row) => (
            <Card key={row.sponsor.id} interactive>
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-[#0c121e]">
                        {row.sponsor.company_name}
                      </h3>
                      <Badge variant="navy">{row.sponsor.industry}</Badge>
                      <Badge
                        variant={
                          row.match.explanationSource === 'ai_provider' ? 'mint' : 'neutral'
                        }
                      >
                        {row.match.explanationSource === 'ai_provider'
                          ? 'Recommended Match Insight'
                          : 'Match Summary'}
                      </Badge>
                      {row.sponsor.is_demo && <Badge variant="amber">Demo</Badge>}
                    </div>
                    <p className="mt-1.5 text-xs text-stone-500">
                      Budget Window:{' '}
                      <span className="font-mono font-semibold text-[#0c121e]">
                        {formatMinorCurrency(row.sponsor.budget_min_minor, row.sponsor.currency)} –{' '}
                        {formatMinorCurrency(row.sponsor.budget_max_minor, row.sponsor.currency)}
                      </span>{' '}
                      · Confidence: <span className="uppercase font-medium">{row.match.confidence}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      <AnimatedScoreRing score={row.match.score} size={54} />
                      <div className="text-left">
                        <p className="text-xs font-medium text-stone-500">
                          Fit Score
                        </p>
                        <p className="font-mono text-xs font-semibold text-emerald-700">
                          {row.match.score}/100
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openComposer(row)}>
                      <Send className="h-3.5 w-3.5" />
                      Propose
                    </Button>
                  </div>
                </div>

                <p className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3.5 text-sm leading-relaxed text-stone-700">
                  {row.match.explanation}
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ['Audience (30%)', row.match.factorScores.audience_fit],
                    ['Industry (20%)', row.match.factorScores.industry_fit],
                    ['Budget (20%)', row.match.factorScores.budget_fit],
                    ['Location (10%)', row.match.factorScores.location_fit],
                    ['Benefits (10%)', row.match.factorScores.benefit_fit],
                    ['Timing (10%)', row.match.factorScores.timing_fit],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl border border-stone-200/90 bg-white p-3">
                      <p className="text-xs font-medium text-stone-500">{label}</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#0c121e]">{val}/100</p>
                      <AnimatedScoreBar value={Number(val)} className="mt-2 h-1" />
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

      <SlideOverDrawer
        open={Boolean(activeSponsor)}
        onClose={() => setActiveSponsor(null)}
        title={activeSponsor ? `Proposal to ${activeSponsor.company_name}` : 'Compose Proposal'}
        subtitle="Lock a package snapshot and tailor your partnership invitation."
      >
        {activeSponsor && (
          <form onSubmit={sendProposal} className="space-y-4">
            {eventPackages.length === 0 ? (
              <Alert tone="warning">
                Save at least one sponsorship package on this event before sending a proposal.
              </Alert>
            ) : (
              <>
                <div>
                  <Label htmlFor="propPkg">Sponsorship Package Tier</Label>
                  <Select
                    id="propPkg"
                    value={proposalPackageId}
                    onChange={(e) => setProposalPackageId(e.target.value)}
                  >
                    {eventPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({formatMinorCurrency(pkg.price_minor, pkg.currency)})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <Label htmlFor="propMsg" className="mb-0">
                      Outreach Message
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
                    className="min-h-[180px]"
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" size="lg" className="flex-1" disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Sponsorship Proposal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setActiveSponsor(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </SlideOverDrawer>
    </div>
  );
}
