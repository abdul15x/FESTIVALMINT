import test from 'node:test';
import assert from 'node:assert/strict';
import { eventInputSchema } from '../lib/validation/events.ts';
import {
  aiPackageGenerationResponseSchema,
  savePackagesSchema,
} from '../lib/validation/packages.ts';
import { buildDeterministicPackagesFallback } from '../lib/ai/packages.ts';

test('eventInputSchema rejects end date earlier than start date', () => {
  const res = eventInputSchema.safeParse({
    title: 'Campus AI Hackathon',
    description:
      'A 36-hour campus software engineering hackathon bringing together student builders.',
    category: 'technology',
    city: 'Lahore',
    country: 'Pakistan',
    startsAt: '2026-12-10T09:00:00.000Z',
    endsAt: '2026-12-09T09:00:00.000Z',
    expectedAttendees: 300,
    audienceTags: ['Computer Science'],
    eventObjectives: ['API adoption'],
    socialReach: 5000,
    sponsorshipTargetUsd: 3000,
    sponsorshipNeeds: ['Cash'],
    availableBenefits: ['Booth'],
  });
  assert.equal(res.success, false);
});

test('buildDeterministicPackagesFallback produces valid Bronze/Silver/Gold tiers', () => {
  const output = buildDeterministicPackagesFallback(
    {
      title: 'BuildFest AI Hackathon',
      category: 'technology',
      expected_attendees: 400,
      sponsorship_target_minor: 400000,
      currency: 'USD',
      audience_tags: ['Computer Science', 'AI & ML'],
      sponsorship_needs: ['Cash', 'Prizes'],
    },
    ['Logo placement', 'Booth', 'Workshop', 'Recruitment access']
  );

  const parsed = aiPackageGenerationResponseSchema.safeParse(output);
  assert.equal(parsed.success, true);
  assert.equal(output.packages.length, 3);
  assert.ok(output.packages[2].suggested_price > output.packages[0].suggested_price);
  assert.ok(
    output.assumptions.some((a) => a.toLowerCase().includes('deterministic heuristic'))
  );
});

test('savePackagesSchema validates organizer edits', () => {
  const valid = savePackagesSchema.safeParse({
    packages: [
      {
        name: 'Gold Title',
        description: 'Headline campus partner',
        priceUsd: 2500,
        currency: 'USD',
        benefits: ['Keynote', 'Main Booth'],
        availability: 1,
        idealSponsorCategories: ['Technology'],
        pricingRationale: 'Anchor tier',
        assumptions: ['400 attendees estimated'],
        aiGenerated: true,
        approvedByOrganizer: true,
      },
    ],
  });
  assert.equal(valid.success, true);
});
