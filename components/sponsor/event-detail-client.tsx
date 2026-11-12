'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, Loader2, CreditCard, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Textarea, Label } from '@/components/ui/input';
import { formatMinorCurrency } from '@/lib/utils';
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
        setError(json.message ?? 'Could not compute AI explanation.');
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
        <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Sponsor Compatibility</CardTitle>
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
            {hasSponsorProfile && (
              <Button variant="outline" size="sm" disabled={explaining} onClick={requestAiExplanation}>
                {explaining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Refresh Match Insight
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-800">{match.explanation}</p>

            <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Audience (30%)', match.factorScores.audience_fit],
                ['Industry (20%)', match.factorScores.industry_fit],
                ['Budget (20%)', match.factorScores.budget_fit],
                ['Location (10%)', match.factorScores.location_fit],
                ['Benefits (10%)', match.factorScores.benefit_fit],
                ['Timing (10%)', match.factorScores.timing_fit],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium text-slate-500">{label}</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-slate-950">{score}</p>
                </div>
              ))}
            </div>

            {match.missingInformation.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Missing Information Affecting Confidence
                </p>
                <ul className="mt-1 list-disc pl-4">
                  {match.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sponsorship Packages</CardTitle>
          <CardDescription>
            Compare locked deliverables and select a package to proceed directly to PayPal Sandbox
            checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
                      className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-bold text-slate-950">
                            {pkg.name}
                          </span>
                          {isRecommended && <Badge variant="blue">Recommended</Badge>}
                        </div>
                        <p className="mt-2 font-display text-2xl font-bold text-slate-950">
                          {formatMinorCurrency(pkg.price_minor, pkg.currency)}
                        </p>
                        {pkg.pricing_rationale && (
                          <p className="mt-2 text-xs text-slate-600">{pkg.pricing_rationale}</p>
                        )}
                        <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                          {benefits.map((b) => (
                            <li key={b} className="flex items-start gap-1.5">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 pt-3 text-xs font-semibold text-indigo-700">
                        {selected ? 'Selected for Checkout' : 'Click to Select'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasSponsorProfile ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                    <p className="text-xs text-slate-500">
                      Locking this package creates an accepted proposal snapshot at the server-side
                      package price before PayPal Sandbox payment.
                    </p>
                    <Button
                      className="w-full whitespace-normal text-center sm:w-auto sm:whitespace-nowrap"
                      disabled={!selectedPkgId || submitting}
                      onClick={selectPackageForCheckout}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Sponsor Event & Go to PayPal Checkout
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert tone="warning">
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
