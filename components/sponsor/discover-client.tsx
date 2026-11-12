'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Sparkles, MapPin, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Input, Label, Select } from '@/components/ui/input';
import { Button, buttonClasses } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
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
        setError(json.message ?? 'Could not refresh AI match explanations.');
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
        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="discQ">Search Keywords or Tags</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                value={maxBudgetUsd}
                onChange={(e) => setMaxBudgetUsd(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={fetchEvents}>
              Apply Filters
            </Button>
            {hasSponsorProfile && (
              <Button
                variant="secondary"
                size="sm"
                disabled={refreshingMatches}
                onClick={runAiMatchRefresh}
              >
                {refreshingMatches ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Generate AI Match Explanations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">
              No approved events match your current filters
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Only admin-approved or published events appear in Sponsor Discovery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((ev) => {
            const exp = aiExplanations[ev.id];
            const minPrice = ev.sponsorship_packages.length
              ? Math.min(...ev.sponsorship_packages.map((p) => p.price_minor))
              : ev.sponsorship_target_minor;
            return (
              <Card key={ev.id} className="flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="mint">{ev.category}</Badge>
                        {ev.organizer_profiles?.verification_status === 'verified' && (
                          <Badge variant="blue">Verified Society</Badge>
                        )}
                        {ev.is_demo && <Badge variant="amber">Demo</Badge>}
                      </div>
                      <h3 className="mt-2 font-display text-lg font-bold text-slate-950">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {ev.organizer_profiles?.society_name ?? 'University Society'} •{' '}
                        {ev.organizer_profiles?.university_name ?? ev.city}
                      </p>
                    </div>
                    {ev.matchPreview && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-right shrink-0">
                        <p className="font-mono text-lg font-bold text-emerald-700">
                          {ev.matchPreview.score}
                          <span className="text-[11px] font-normal">/100</span>
                        </p>
                        <p className="text-[10px] font-medium text-emerald-800">Profile Match</p>
                      </div>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm text-slate-600">{ev.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{ev.expected_attendees} est.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatShortDate(ev.starts_at)}</span>
                    </div>
                  </div>

                  {(exp || ev.matchPreview) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {exp
                          ? exp.source === 'ai_provider'
                            ? 'Why this match works'
                            : 'Compatibility Summary'
                          : 'Sponsor Compatibility Breakdown'}
                      </p>
                      <p className="mt-1 leading-relaxed">
                        {exp ? exp.explanation : ev.matchPreview?.deterministicExplanation}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[11px] text-slate-500">Packages starting from</p>
                      <p className="font-mono text-sm font-bold text-slate-950">
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
