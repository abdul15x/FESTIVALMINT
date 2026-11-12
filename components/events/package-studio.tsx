'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, Send, Plus, Trash2, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SponsorshipPackageRow } from '@/types/database';
import type { AiPackageGenerationResponse } from '@/lib/validation/packages';

interface EditablePackage {
  id?: string;
  name: string;
  description: string;
  priceUsd: string;
  currency: string;
  benefitsText: string;
  availability: string;
  idealSponsorCategoriesText: string;
  pricingRationale: string;
  assumptions: string[];
  aiGenerated: boolean;
  approvedByOrganizer: boolean;
}

function mapRowToEditable(row: SponsorshipPackageRow): EditablePackage {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    priceUsd: String(Math.round(row.price_minor / 100)),
    currency: row.currency,
    benefitsText: (row.benefits_json ?? []).join('\n'),
    availability: String(row.availability),
    idealSponsorCategoriesText: (row.ideal_sponsor_categories ?? []).join(', '),
    pricingRationale: row.pricing_rationale ?? '',
    assumptions: row.assumptions_json ?? [],
    aiGenerated: row.ai_generated,
    approvedByOrganizer: row.approved_by_organizer,
  };
}

export function PackageStudio({
  eventId,
  eventStatus,
  initialPackages,
}: {
  eventId: string;
  eventStatus: string;
  initialPackages: SponsorshipPackageRow[];
}) {
  const router = useRouter();
  const [packages, setPackages] = useState<EditablePackage[]>(
    initialPackages.filter((p) => p.status !== 'archived').map(mapRowToEditable)
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<{
    source: 'ai_provider' | 'deterministic_fallback';
    providerLabel: string;
    assumptions: string[];
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setFeedback(null);
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not generate packages.');
        return;
      }

      const data = json.data as {
        result: AiPackageGenerationResponse;
        source: 'ai_provider' | 'deterministic_fallback';
        providerLabel: string;
      };

      setGenerationMeta({
        source: data.source,
        providerLabel: data.providerLabel,
        assumptions: data.result.assumptions.filter(
          (item) => !/deterministic|heuristic|api key/i.test(item)
        ),
        warnings: data.result.warnings.filter(
          (item) => !/deterministic fallback output/i.test(item)
        ),
      });

      setPackages(
        data.result.packages.map((p) => ({
          name: p.name,
          description: p.description,
          priceUsd: String(p.suggested_price),
          currency: p.currency || 'USD',
          benefitsText: p.benefits.join('\n'),
          availability: String(p.availability),
          idealSponsorCategoriesText: p.ideal_sponsor_categories.join(', '),
          pricingRationale: p.pricing_rationale,
          assumptions: data.result.assumptions,
          aiGenerated: data.source === 'ai_provider',
          approvedByOrganizer: true,
        }))
      );
      setFeedback(json.message);
    } catch {
      setError('Network error generating sponsorship packages.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSavePackages() {
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      const payload = {
        packages: packages.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          priceUsd: Number(p.priceUsd),
          currency: p.currency || 'USD',
          benefits: p.benefitsText
            .split('\n')
            .map((b) => b.trim())
            .filter(Boolean),
          availability: Number(p.availability),
          idealSponsorCategories: p.idealSponsorCategoriesText
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          pricingRationale: p.pricingRationale,
          assumptions: p.assumptions,
          aiGenerated: p.aiGenerated,
          approvedByOrganizer: true,
        })),
      };

      const res = await fetch(`/api/events/${eventId}/packages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not save packages.');
        return;
      }

      setPackages((json.data.packages as SponsorshipPackageRow[]).map(mapRowToEditable));
      setFeedback('Sponsorship packages saved to database.');
      router.refresh();
    } catch {
      setError('Network error saving packages.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setError(null);
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/submit`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not submit event for review.');
        return;
      }
      setFeedback(json.message);
      router.refresh();
    } catch {
      setError('Network error submitting event.');
    } finally {
      setSubmitting(false);
    }
  }

  function updatePkg(index: number, patch: Partial<EditablePackage>) {
    setPackages((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  }

  function addCustomTier() {
    setPackages((prev) => [
      ...prev,
      {
        name: `Custom Tier ${prev.length + 1}`,
        description: 'Tailored partner benefits package.',
        priceUsd: '750',
        currency: 'USD',
        benefitsText: 'Logo placement on event materials\nSocial media spotlight',
        availability: '2',
        idealSponsorCategoriesText: 'Technology',
        pricingRationale: 'Organizer-defined custom package.',
        assumptions: [],
        aiGenerated: false,
        approvedByOrganizer: true,
      },
    ]);
  }

  const totalInventoryValue = packages.reduce((acc, p) => {
    const price = Number(p.priceUsd) || 0;
    const slots = Number(p.availability) || 1;
    return acc + price * slots;
  }, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-stone-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">AI Sponsorship Package Studio</CardTitle>
            {packages.length > 0 && (
              <Badge variant="mint" className="font-mono">
                Inventory ${totalInventoryValue.toLocaleString()}
              </Badge>
            )}
          </div>
          <CardDescription>
            Generate calibrated Bronze, Silver, and Gold tiers, refine deliverables and pricing
            rationale, and approve your live package lineup.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={generating} onClick={handleGenerate}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {packages.length > 0 ? 'Regenerate Suggestions' : 'Generate AI Packages'}
          </Button>
          {['draft', 'rejected'].includes(eventStatus) && (
            <Button variant="primary" disabled={submitting} onClick={handleSubmitForReview}>
              <Send className="h-4 w-4" />
              Submit Event for Review
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {error && <Alert tone="error">{error}</Alert>}
        {feedback && <Alert tone="success">{feedback}</Alert>}

        {generationMeta && (
          <Alert
            tone={generationMeta.source === 'ai_provider' ? 'info' : 'warning'}
            title={
              generationMeta.source === 'ai_provider'
                ? 'Tailored Suggestions Ready'
                : 'Suggested Sponsorship Structure'
            }
          >
            <p className="text-xs">
              Review each tier price, availability count, and deliverable before saving to your
              event marketplace page.
            </p>
            {generationMeta.warnings.length > 0 && (
              <ul className="mt-1.5 list-disc pl-4 text-xs">
                {generationMeta.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {packages.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="No sponsorship packages saved yet"
            description="Generate structured Bronze, Silver, and Gold tiers tailored to your attendance and audience, or build a custom tier from scratch."
            action={
              <Button variant="outline" size="sm" onClick={addCustomTier}>
                <Plus className="h-3.5 w-3.5" />
                Add Custom Package
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id ?? idx}
                className="rounded-2xl border border-stone-200/90 bg-[#faf9f6] p-5 space-y-4 transition-colors hover:border-stone-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/75 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0c121e] font-mono text-xs font-bold text-emerald-400">
                      0{idx + 1}
                    </span>
                    <Badge variant={pkg.aiGenerated ? 'mint' : 'neutral'}>
                      {pkg.aiGenerated ? 'AI Suggested' : 'Custom Tier'}
                    </Badge>
                    <span className="font-mono text-sm font-bold text-[#0c121e]">
                      ${Number(pkg.priceUsd || 0).toLocaleString()} {pkg.currency}
                    </span>
                  </div>
                  {packages.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setPackages((p) => p.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Package Name</Label>
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePkg(idx, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Price (USD)</Label>
                    <Input
                      type="number"
                      min={10}
                      className="font-mono"
                      value={pkg.priceUsd}
                      onChange={(e) => updatePkg(idx, { priceUsd: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Slots Available</Label>
                    <Input
                      type="number"
                      min={1}
                      className="font-mono"
                      value={pkg.availability}
                      onChange={(e) => updatePkg(idx, { availability: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Package Summary</Label>
                  <Input
                    value={pkg.description}
                    onChange={(e) => updatePkg(idx, { description: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Included Deliverables (one per line)</Label>
                    <Textarea
                      className="min-h-[118px]"
                      value={pkg.benefitsText}
                      onChange={(e) => updatePkg(idx, { benefitsText: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Ideal Sponsor Categories (comma-separated)</Label>
                      <Input
                        value={pkg.idealSponsorCategoriesText}
                        onChange={(e) =>
                          updatePkg(idx, { idealSponsorCategoriesText: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Pricing Rationale</Label>
                      <Textarea
                        className="min-h-[60px]"
                        value={pkg.pricingRationale}
                        onChange={(e) => updatePkg(idx, { pricingRationale: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 pt-4">
              <Button variant="outline" onClick={addCustomTier}>
                <Plus className="h-4 w-4" />
                Add Tier
              </Button>
              <Button variant="primary" size="lg" disabled={saving} onClick={handleSavePackages}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Approve &amp; Save Packages
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
