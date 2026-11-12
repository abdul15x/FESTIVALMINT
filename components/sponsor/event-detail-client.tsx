'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea, Label } from '@/components/ui/input';
import { AnimatedScoreBar, AnimatedScoreRing } from '@/components/motion/primitives';
import { cn, formatMinorCurrency } from '@/lib/utils';
import type { SponsorshipPackageRow } from '@/types/database';
import type { ExplainedMatchResult } from '@/lib/ai/matching';

export function SponsorEventDetailClient({
  eventId,
  eventTitle,
  packages,
  initialMatch,
  hasSponsorProfile,
}: {
  eventId: string;
  eventTitle: string;
  packages: SponsorshipPackageRow[];
  initialMatch: ExplainedMatchResult | null;
  hasSponsorProfile: boolean;
}) {
  const router = useRouter();
  const [match, setMatch] = useState<ExplainedMatchResult | null>(initialMatch);
  const [explaining, setExplaining] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    initialMatch?.recommendedPackageId ?? packages[0]?.id ?? ''
  );
  const [note, setNote] = useState(
    `We are excited to sponsor ${eventTitle} and collaborate on delivering high-value campus activations.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestAiExplanation() {
    setExplaining(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not refresh match explanation.');
        return;
      }
      const first = (json.data.matches ?? [])[0];
      if (first?.match) {
        setMatch(first.match);
      }
    } catch {
      setError('Network error requesting match explanation.');
    } finally {
      setExplaining(false);
    }
  }

  async function selectPackageForCheckout() {
    if (!selectedPkgId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          packageId: selectedPkgId,
          message: note.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not lock sponsorship package.');
        return;
      }
      router.push(`/sponsor/payments/${json.data.proposal.id}`);
    } catch {
      setError('Network error selecting sponsorship package.');
    } finally {
      setSubmitting(false);
    }
  }

  const activePackages = packages.filter((p) => p.status !== 'archived');

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}

      {match && (
        <Card className="border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-stone-200/70 pb-4">
            <div className="flex items-center gap-4">
              <AnimatedScoreRing score={match.score} size={60} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Sponsor Compatibility Analysis</CardTitle>
                  <Badge variant={match.score >= 70 ? 'mint' : 'blue'}>
                    {match.score}/100 ({match.confidence} confidence)
                  </Badge>
                  <Badge variant={match.explanationSource === 'ai_provider' ? 'blue' : 'neutral'}>
                    {match.explanationSource === 'ai_provider'
                      ? 'Why This Match Works'
                      : 'Compatibility Summary'}
                  </Badge>
                </div>
                <CardDescription>
                  Weighted 6-factor score: Audience (30%), Industry (20%), Budget (20%), Location
                  (10%), Benefits (10%), Timing (10%).
                </CardDescription>
              </div>
            </div>
            {hasSponsorProfile && (
              <Button variant="outline" size="sm" disabled={explaining} onClick={requestAiExplanation}>
                {explaining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                )}
                Refresh Match Insight
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-4 text-sm leading-relaxed text-stone-700">
              {match.explanation}
            </p>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Audience (30%)', match.factorScores.audience_fit],
                ['Industry (20%)', match.factorScores.industry_fit],
                ['Budget (20%)', match.factorScores.budget_fit],
                ['Location (10%)', match.factorScores.location_fit],
                ['Benefits (10%)', match.factorScores.benefit_fit],
                ['Timing (10%)', match.factorScores.timing_fit],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-xl border border-stone-200 bg-white p-3">
                  <p className="text-xs font-medium text-stone-500">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold text-[#0c121e]">{score}</p>
                  <AnimatedScoreBar value={Number(score)} className="mt-2 h-1" />
                </div>
              ))}
            </div>

            {match.missingInformation.length > 0 && (
              <Alert tone="warning" title="Missing Information Affecting Confidence">
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {match.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-stone-200/80 pb-4">
          <CardTitle className="text-xl">Select a Sponsorship Tier</CardTitle>
          <CardDescription>
            Compare locked deliverables and select a tier to generate your proposal snapshot and
            open PayPal Sandbox checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {activePackages.length === 0 ? (
            <Alert tone="warning">
              This event does not have saved sponsorship packages yet.
            </Alert>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {activePackages.map((pkg) => {
                  const selected = pkg.id === selectedPkgId;
                  const benefits = Array.isArray(pkg.benefits_json)
                    ? pkg.benefits_json.map(String)
                    : [];
                  const isRecommended = match?.recommendedPackageId === pkg.id;

                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={cn(
                        'flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer',
                        selected
                          ? 'border-emerald-600 bg-emerald-50/45 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display text-base font-bold text-[#0c121e]">
                            {pkg.name}
                          </span>
                          {isRecommended && <Badge variant="mint">Best Fit</Badge>}
                        </div>
                        <p className="mt-2 font-mono text-2xl font-bold text-[#0c121e] tabular-nums">
                          {formatMinorCurrency(pkg.price_minor, pkg.currency)}
                        </p>
                        {pkg.pricing_rationale && (
                          <p className="mt-2 text-xs leading-relaxed text-stone-600">
                            {pkg.pricing_rationale}
                          </p>
                        )}
                        <ul className="mt-4 space-y-2 border-t border-stone-200/70 pt-3.5 text-xs text-stone-700">
                          {benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className={cn(
                          'mt-5 inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                          selected
                            ? 'bg-[#0c121e] text-white'
                            : 'border border-stone-200 bg-[#faf9f6] text-stone-700'
                        )}
                      >
                        {selected ? 'Selected for Checkout' : 'Select Tier'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasSponsorProfile ? (
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-[#faf9f6] p-5">
                  <div>
                    <Label htmlFor="sponsorNote">Sponsorship Note to Organizer</Label>
                    <Textarea
                      id="sponsorNote"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-stone-600">
                      Locking a package creates an accepted proposal snapshot at the server-side
                      tier price before PayPal Sandbox checkout.
                    </p>
                    <Button
                      size="lg"
                      className="w-full whitespace-normal text-center sm:w-auto sm:whitespace-nowrap"
                      disabled={!selectedPkgId || submitting}
                      onClick={selectPackageForCheckout}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Sponsor Event &amp; Go to PayPal Checkout
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert tone="warning" title="Brand Profile Required">
                  Complete your sponsor brand profile in Settings or Onboarding before committing to
                  a package.
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
