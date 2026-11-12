import type {
  EventRow,
  FactorScores,
  SponsorProfileRow,
  SponsorshipPackageRow,
} from '@/types/database';
import { formatMinorCurrency } from '@/lib/utils';

export interface DeterministicMatchOutput {
  eventId: string;
  sponsorId: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  factorScores: FactorScores;
  missingInformation: string[];
  recommendedPackageId: string | null;
  deterministicExplanation: string;
}

function normalizeTokens(items: string[]): string[] {
  return items
    .flatMap((item) => item.toLowerCase().split(/[^a-z0-9+]+/))
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function jaccardAndOverlapScore(sourceA: string[], sourceB: string[]): number {
  const tokensA = new Set(normalizeTokens(sourceA));
  const tokensB = new Set(normalizeTokens(sourceB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let matches = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) matches += 1;
  }

  if (matches === 0) return 0;
  const ratio = matches / Math.min(tokensA.size, tokensB.size);
  return Math.min(100, Math.round(35 + ratio * 65));
}

export function computeDeterministicMatch(params: {
  event: EventRow;
  sponsor: SponsorProfileRow;
  packages: SponsorshipPackageRow[];
  eventBenefits?: string[];
}): DeterministicMatchOutput {
  const { event, sponsor, packages, eventBenefits = [] } = params;
  const missingInformation: string[] = [];

  // 1. Audience Fit (30%)
  if (event.audience_tags.length === 0) {
    missingInformation.push('Event target audience tags are not specified');
  }
  if (sponsor.target_tags.length === 0) {
    missingInformation.push('Sponsor target audience tags are not specified');
  }
  const audienceFit =
    event.audience_tags.length && sponsor.target_tags.length
      ? jaccardAndOverlapScore(
          [...event.audience_tags, event.title, event.description],
          [...sponsor.target_tags, ...sponsor.objectives]
        )
      : 25;

  // 2. Industry / Category Fit (20%)
  const prefCats = sponsor.preferred_categories.map((c) => c.toLowerCase());
  let industryFit = 20;
  if (prefCats.includes(event.category.toLowerCase())) {
    industryFit = 95;
  } else {
    const overlap = jaccardAndOverlapScore(
      [event.category, event.title, event.description],
      [sponsor.industry, sponsor.description, sponsor.products_services ?? '']
    );
    industryFit = Math.max(15, overlap);
  }
  if (prefCats.length === 0) {
    missingInformation.push('Sponsor preferred event categories are empty');
  }

  // 3. Budget Fit (20%) + Recommended Package selection
  const activePackages = packages.filter((p) => p.status !== 'archived');
  let budgetFit = 40;
  let recommendedPackageId: string | null = null;

  if (activePackages.length === 0) {
    missingInformation.push('No saved sponsorship packages on this event yet');
    const target = event.sponsorship_target_minor;
    if (target > 0 && sponsor.budget_max_minor > 0) {
      if (target >= sponsor.budget_min_minor && target <= sponsor.budget_max_minor * 2.5) {
        budgetFit = 70;
      } else if (target > sponsor.budget_max_minor * 3) {
        budgetFit = 25;
      }
    }
  } else {
    const inRange = activePackages.filter(
      (p) =>
        p.price_minor >= sponsor.budget_min_minor && p.price_minor <= sponsor.budget_max_minor
    );

    if (inRange.length > 0) {
      // Pick the highest-value package within sponsor budget
      inRange.sort((a, b) => b.price_minor - a.price_minor);
      recommendedPackageId = inRange[0].id;
      budgetFit = 95;
    } else {
      // Find nearest package and measure relative distance
      const sorted = [...activePackages].sort((a, b) => {
        const mid = (sponsor.budget_min_minor + sponsor.budget_max_minor) / 2;
        return Math.abs(a.price_minor - mid) - Math.abs(b.price_minor - mid);
      });
      const nearest = sorted[0];
      recommendedPackageId = nearest.id;

      if (nearest.price_minor < sponsor.budget_min_minor) {
        const ratio = nearest.price_minor / Math.max(1, sponsor.budget_min_minor);
        budgetFit = Math.max(35, Math.round(45 + ratio * 35));
      } else {
        const overshoot =
          (nearest.price_minor - sponsor.budget_max_minor) /
          Math.max(1, sponsor.budget_max_minor);
        budgetFit = Math.max(10, Math.round(70 - overshoot * 60));
      }
    }
  }

  // 4. Location Fit (10%)
  const sponsorLocations = [
    ...sponsor.preferred_locations,
    ...sponsor.operating_locations,
  ].map((l) => l.toLowerCase());
  const eventCity = event.city.toLowerCase();
  const eventCountry = event.country.toLowerCase();

  let locationFit = 40;
  if (sponsorLocations.length === 0) {
    missingInformation.push('Sponsor location preferences are not set');
    locationFit = 50;
  } else if (
    sponsorLocations.some((l) => l.includes(eventCity) || eventCity.includes(l))
  ) {
    locationFit = 100;
  } else if (
    sponsorLocations.some((l) => l.includes(eventCountry) || l.includes('remote') || l.includes('global'))
  ) {
    locationFit = 75;
  } else {
    locationFit = 20;
  }

  // 5. Benefit Fit (10%)
  const pkgBenefits = activePackages.flatMap((p) => p.benefits_json ?? []);
  const combinedEventBenefits = [...eventBenefits, ...pkgBenefits];
  if (combinedEventBenefits.length === 0) {
    missingInformation.push('Event sponsorship benefits inventory has not been specified');
  }
  const benefitFit =
    combinedEventBenefits.length && sponsor.preferred_benefits.length
      ? jaccardAndOverlapScore(combinedEventBenefits, sponsor.preferred_benefits)
      : 45;

  // 6. Timing Fit (10%)
  const daysUntilStart = Math.round(
    (Date.parse(event.starts_at) - Date.now()) / 86_400_000
  );
  let timingFit = 75;
  if (Number.isNaN(daysUntilStart)) {
    timingFit = 50;
    missingInformation.push('Event start date could not be evaluated');
  } else if (daysUntilStart < 0) {
    timingFit = 10;
  } else if (daysUntilStart < 7) {
    timingFit = 45;
  } else if (daysUntilStart <= 180) {
    timingFit = 90;
  } else {
    timingFit = 65;
  }

  const factorScores: FactorScores = {
    audience_fit: audienceFit,
    industry_fit: industryFit,
    budget_fit: budgetFit,
    location_fit: locationFit,
    benefit_fit: benefitFit,
    timing_fit: timingFit,
  };

  const weighted =
    audienceFit * 0.3 +
    industryFit * 0.2 +
    budgetFit * 0.2 +
    locationFit * 0.1 +
    benefitFit * 0.1 +
    timingFit * 0.1;

  const score = Math.max(0, Math.min(100, Math.round(weighted)));
  const confidence: 'high' | 'medium' | 'low' =
    missingInformation.length === 0 ? 'high' : missingInformation.length <= 2 ? 'medium' : 'low';

  const recPkg = activePackages.find((p) => p.id === recommendedPackageId);
  const budgetPhrase = recPkg
    ? `Recommended tier "${recPkg.name}" (${formatMinorCurrency(
        recPkg.price_minor,
        recPkg.currency
      )}) aligns against sponsor budget (${formatMinorCurrency(
        sponsor.budget_min_minor,
        sponsor.currency
      )}–${formatMinorCurrency(sponsor.budget_max_minor, sponsor.currency)}).`
    : `Evaluated against organizer target (${formatMinorCurrency(
        event.sponsorship_target_minor,
        event.currency
      )}).`;

  const deterministicExplanation = `Compatibility score ${score}/100 (${confidence} confidence) based on profile data: audience fit ${audienceFit}/100, industry/category fit ${industryFit}/100, budget fit ${budgetFit}/100, location fit ${locationFit}/100. ${budgetPhrase}`;

  return {
    eventId: event.id,
    sponsorId: sponsor.id,
    score,
    confidence,
    factorScores,
    missingInformation,
    recommendedPackageId,
    deterministicExplanation,
  };
}
