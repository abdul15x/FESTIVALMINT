import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getSessionContext } from '@/lib/auth/session';
import { computeDeterministicMatch } from '@/lib/matching/scorer';
import type { EventRow, SponsorshipPackageRow } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return apiError(
      'SUPABASE_NOT_CONFIGURED',
      'Supabase credentials are not configured yet.',
      503
    );
  }

  const sp = request.nextUrl.searchParams;
  const q = sp.get('q')?.trim().toLowerCase() ?? '';
  const category = sp.get('category')?.trim().toLowerCase() ?? '';
  const city = sp.get('city')?.trim().toLowerCase() ?? '';
  const maxBudgetUsd = Number(sp.get('maxBudgetUsd') ?? '0');

  let query = supabase
    .from('events')
    .select(
      '*, organizer_profiles(society_name, university_name, verification_status), sponsorship_packages(*)'
    )
    .in('status', ['approved', 'published'])
    .order('starts_at', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data: rows, error } = await query;
  if (error) {
    return apiError('DISCOVER_FAILED', error.message, 500);
  }

  const session = await getSessionContext();
  const sponsorProfile = session.context?.sponsorProfile ?? null;

  type JoinedEvent = EventRow & {
    organizer_profiles: {
      society_name: string;
      university_name: string | null;
      verification_status: string;
    } | null;
    sponsorship_packages: SponsorshipPackageRow[] | null;
  };

  let filtered = ((rows ?? []) as JoinedEvent[]).map((ev) => ({
    ...ev,
    sponsorship_packages: (ev.sponsorship_packages ?? []).filter((p) => p.status !== 'archived'),
  }));

  if (q) {
    filtered = filtered.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.audience_tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (city) {
    filtered = filtered.filter((ev) => ev.city.toLowerCase().includes(city));
  }

  if (Number.isFinite(maxBudgetUsd) && maxBudgetUsd > 0) {
    const maxMinor = Math.round(maxBudgetUsd * 100);
    filtered = filtered.filter((ev) => {
      if (ev.sponsorship_packages.length === 0) {
        return ev.sponsorship_target_minor <= maxMinor;
      }
      return ev.sponsorship_packages.some((p) => p.price_minor <= maxMinor);
    });
  }

  const enriched = filtered.map((ev) => {
    const match = sponsorProfile
      ? computeDeterministicMatch({
          event: ev,
          sponsor: sponsorProfile,
          packages: ev.sponsorship_packages,
        })
      : null;

    return {
      ...ev,
      matchPreview: match,
    };
  });

  if (sponsorProfile) {
    enriched.sort((a, b) => (b.matchPreview?.score ?? 0) - (a.matchPreview?.score ?? 0));
  }

  return apiSuccess({ events: enriched });
}
