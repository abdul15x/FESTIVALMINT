'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  Compass,
} from 'lucide-react';
import { Input, Label, Select } from '@/components/ui/input';
import { Button, buttonClasses } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, Skeleton } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedScoreRing } from '@/components/motion/primitives';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/validation/events';
import type { EventRow, SponsorshipPackageRow } from '@/types/database';
import type { DeterministicMatchOutput } from '@/lib/matching/scorer';

interface DiscoverEventItem extends EventRow {
  organizer_profiles: {
    society_name: string;
    university_name: string | null;
    verification_status: string;
  } | null;
  sponsorship_packages: SponsorshipPackageRow[];
  matchPreview: DeterministicMatchOutput | null;
}

export function DiscoverEventsClient({ hasSponsorProfile }: { hasSponsorProfile: boolean }) {
  const [events, setEvents] = useState<DiscoverEventItem[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState('');
  const [maxBudgetUsd, setMaxBudgetUsd] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<
    Record<string, { explanation: string; source: 'ai_provider' | 'deterministic_fallback' }>
  >({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set('q', q.trim());
      if (category !== 'all') sp.set('category', category);
      if (city.trim()) sp.set('city', city.trim());
      if (maxBudgetUsd.trim()) sp.set('maxBudgetUsd', maxBudgetUsd.trim());

      const res = await fetch(`/api/events/discover?${sp.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not load events.');
        return;
      }
      setEvents(json.data.events ?? []);
    } catch {
      setError('Network error loading approved university events.');
    } finally {
      setLoading(false);
    }
  }, [q, category, city, maxBudgetUsd]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialEvents() {
      try {
        const res = await fetch('/api/events/discover');
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.message ?? 'Could not load events.');
          return;
        }
        setEvents(json.data.events ?? []);
      } catch {
        if (!cancelled) {
          setError('Network error loading approved university events.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadInitialEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runAiMatchRefresh() {
    setRefreshingMatches(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Could not refresh match explanations.');
        return;
      }
      const nextMap: Record<
        string,
        { explanation: string; source: 'ai_provider' | 'deterministic_fallback' }
      > = {};
      for (const item of json.data.matches ?? []) {
        nextMap[item.event.id] = {
          explanation: item.match.explanation,
          source: item.match.explanationSource,
        };
      }
      setAiExplanations(nextMap);
    } catch {
      setError('Network error generating match explanations.');
    } finally {
      setRefreshingMatches(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="discQ">Search Keywords or Tags</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input
                  id="discQ"
                  className="pl-9"
                  placeholder="AI, FinTech, hackathon, computer science..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="discCat">Category</Label>
              <Select
                id="discCat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="discCity">City</Label>
              <Input
                id="discCity"
                placeholder="Lahore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="discMax">Max Package (USD)</Label>
              <Input
                id="discMax"
                type="number"
                min={50}
                placeholder="2500"
                className="font-mono"
                value={maxBudgetUsd}
                onChange={(e) => setMaxBudgetUsd(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <Button variant="primary" size="sm" onClick={fetchEvents}>
              Apply Filters
            </Button>
            {hasSponsorProfile && (
              <Button
                variant="outline"
                size="sm"
                disabled={refreshingMatches}
                onClick={runAiMatchRefresh}
              >
                {refreshingMatches ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                )}
                Refresh Compatibility Insights
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-5 w-5" />}
          title="No approved events match your current filters"
          description="Only admin-approved or published events appear in Sponsor Discovery. Try clearing filters to inspect all live listings."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((ev) => {
            const exp = aiExplanations[ev.id];
            const minPrice = ev.sponsorship_packages.length
              ? Math.min(...ev.sponsorship_packages.map((p) => p.price_minor))
              : ev.sponsorship_target_minor;
            return (
              <Card key={ev.id} interactive className="flex flex-col justify-between overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="mint">{ev.category}</Badge>
                        {ev.organizer_profiles?.verification_status === 'verified' && (
                          <Badge variant="blue" dot>
                            Verified Society
                          </Badge>
                        )}
                        {ev.is_demo && <Badge variant="amber">Demo</Badge>}
                      </div>
                      <h3 className="mt-2.5 font-display text-lg font-bold text-[#0c121e]">
                        {ev.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {ev.organizer_profiles?.society_name ?? 'University Society'} ·{' '}
                        {ev.organizer_profiles?.university_name ?? ev.city}
                      </p>
                    </div>
                    {ev.matchPreview && (
                      <div className="flex flex-col items-center shrink-0">
                        <AnimatedScoreRing score={ev.matchPreview.score} size={52} />
                        <span className="mt-1 text-xs font-medium text-stone-500">
                          Match
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
                    {ev.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 border-y border-stone-100 py-3 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ev.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{ev.expected_attendees} est.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{formatShortDate(ev.starts_at)}</span>
                    </div>
                  </div>

                  {(exp || ev.matchPreview) && (
                    <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3.5 text-xs text-stone-700">
                      <p className="font-semibold text-[#0c121e]">
                        {exp
                          ? exp.source === 'ai_provider'
                            ? 'Why this match works'
                            : 'Compatibility Summary'
                          : 'Sponsor Compatibility Summary'}
                      </p>
                      <p className="mt-1 leading-relaxed">
                        {exp ? exp.explanation : ev.matchPreview?.deterministicExplanation}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div>
                      <p className="text-[11px] font-medium text-stone-500">Packages starting from</p>
                      <p className="font-mono text-base font-bold text-[#0c121e] tabular-nums">
                        {formatMinorCurrency(minPrice, ev.currency)}
                      </p>
                    </div>
                    <Link
                      href={`/sponsor/events/${ev.id}`}
                      className={buttonClasses('primary', 'sm')}
                    >
                      Inspect Event &amp; Tiers
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
