import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { checkAiRateLimit } from '@/lib/ai/client';
import { computeDeterministicMatch } from '@/lib/matching/scorer';
import { explainMatchWithAi, type ExplainedMatchResult } from '@/lib/ai/matching';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { EventRow, SponsorProfileRow, SponsorshipPackageRow } from '@/types/database';

const requestSchema = z.object({
  eventId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer', 'sponsor']);
  if (!auth.ok) return auth.response;

  if (!checkAiRateLimit(`match:${auth.context.userId}`, 20, 60_000)) {
    return apiError('RATE_LIMITED', 'Too many matching requests. Please wait a moment.', 429);
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid matching request payload.', 400);
  }

  const { supabase, context } = auth;
  const persistDb = createAdminSupabaseClient() ?? supabase;

  if (context.profile.role === 'organizer') {
    const org = context.organizerProfile;
    if (!org) return apiError('ONBOARDING_REQUIRED', 'Complete organizer onboarding first.', 400);
    if (!parsed.data.eventId) {
      return apiError('VALIDATION_ERROR', 'eventId is required for organizer matching.', 400);
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', parsed.data.eventId)
      .eq('organizer_id', org.id)
      .maybeSingle<EventRow>();

    if (!event) return apiError('NOT_FOUND', 'Event not found or not owned by you.', 404);

    const [{ data: packages }, { data: benefits }, { data: sponsors }] = await Promise.all([
      supabase
        .from('sponsorship_packages')
        .select('*')
        .eq('event_id', event.id)
        .returns<SponsorshipPackageRow[]>(),
      supabase.from('event_benefits').select('benefit_type').eq('event_id', event.id),
      supabase.from('sponsor_profiles').select('*').returns<SponsorProfileRow[]>(),
    ]);

    const pkgList = packages ?? [];
    const benefitList = (benefits ?? []).map((b) => b.benefit_type);
    const sponsorList = sponsors ?? [];

    const computed = sponsorList
      .map((sp) => ({
        sponsor: sp,
        match: computeDeterministicMatch({
          event,
          sponsor: sp,
          packages: pkgList,
          eventBenefits: benefitList,
        }),
      }))
      .sort((a, b) => b.match.score - a.match.score);

    const results: Array<{
      sponsor: SponsorProfileRow;
      match: ExplainedMatchResult;
      recommendedPackage: SponsorshipPackageRow | null;
    }> = [];

    for (let i = 0; i < computed.length; i++) {
      const item = computed[i];
      const recPkg = pkgList.find((p) => p.id === item.match.recommendedPackageId) ?? null;

      let explained: ExplainedMatchResult;
      if (i < 5) {
        explained = await explainMatchWithAi({
          match: item.match,
          event,
          sponsor: item.sponsor,
          recommendedPackage: recPkg,
        });
      } else {
        explained = {
          ...item.match,
          explanation: item.match.deterministicExplanation,
          explanationSource: 'deterministic_fallback',
        };
      }

      if (createAdminSupabaseClient()) {
        await persistDb.from('matches').upsert(
          {
            event_id: event.id,
            sponsor_id: item.sponsor.id,
            score: explained.score,
            confidence: explained.confidence,
            factor_scores_json: explained.factorScores,
            explanation: explained.explanation,
            missing_info_json: explained.missingInformation,
            recommended_package_id: explained.recommendedPackageId,
            profile_snapshot_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,sponsor_id' }
        );
      }

      results.push({
        sponsor: item.sponsor,
        match: explained,
        recommendedPackage: recPkg,
      });
    }

    return apiSuccess({
      mode: 'organizer_to_sponsors',
      eventId: event.id,
      matches: results,
    });
  }

  // Sponsor mode: score approved events for current sponsor
  const sponsor = context.sponsorProfile;
  if (!sponsor) return apiError('ONBOARDING_REQUIRED', 'Complete sponsor onboarding first.', 400);

  let eventQuery = supabase
    .from('events')
    .select('*')
    .in('status', ['approved', 'published']);

  if (parsed.data.eventId) {
    eventQuery = eventQuery.eq('id', parsed.data.eventId);
  }

  const { data: events } = await eventQuery.returns<EventRow[]>();
  const eventList = events ?? [];

  const computed = [];
  for (const ev of eventList) {
    const [{ data: pkgs }, { data: bens }] = await Promise.all([
      supabase
        .from('sponsorship_packages')
        .select('*')
        .eq('event_id', ev.id)
        .returns<SponsorshipPackageRow[]>(),
      supabase.from('event_benefits').select('benefit_type').eq('event_id', ev.id),
    ]);
    const pkgList = pkgs ?? [];
    const match = computeDeterministicMatch({
      event: ev,
      sponsor,
      packages: pkgList,
      eventBenefits: (bens ?? []).map((b) => b.benefit_type),
    });
    computed.push({ event: ev, packages: pkgList, match });
  }

  computed.sort((a, b) => b.match.score - a.match.score);

  const results = [];
  for (let i = 0; i < computed.length; i++) {
    const item = computed[i];
    const recPkg = item.packages.find((p) => p.id === item.match.recommendedPackageId) ?? null;
    const explained: ExplainedMatchResult =
      i < 5
        ? await explainMatchWithAi({
            match: item.match,
            event: item.event,
            sponsor,
            recommendedPackage: recPkg,
          })
        : {
            ...item.match,
            explanation: item.match.deterministicExplanation,
            explanationSource: 'deterministic_fallback',
          };

    if (createAdminSupabaseClient()) {
      await persistDb.from('matches').upsert(
        {
          event_id: item.event.id,
          sponsor_id: sponsor.id,
          score: explained.score,
          confidence: explained.confidence,
          factor_scores_json: explained.factorScores,
          explanation: explained.explanation,
          missing_info_json: explained.missingInformation,
          recommended_package_id: explained.recommendedPackageId,
          profile_snapshot_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,sponsor_id' }
      );
    }

    results.push({
      event: item.event,
      match: explained,
      recommendedPackage: recPkg,
    });
  }

  return apiSuccess({
    mode: 'sponsor_to_events',
    sponsorId: sponsor.id,
    matches: results,
  });
}
