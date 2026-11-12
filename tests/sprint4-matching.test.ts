import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDeterministicMatch } from '@/lib/matching/scorer';
import { createProposalSchema, respondProposalSchema } from '@/lib/validation/proposals';
import type { EventRow, SponsorProfileRow, SponsorshipPackageRow } from '@/types/database';

const baseEvent: EventRow = {
  id: '00000000-0000-4000-8000-000000000010',
  organizer_id: '00000000-0000-4000-8000-000000000001',
  university_id: null,
  title: 'National AI & FinTech Hackathon 2026',
  description:
    'A 36-hour university AI, cloud APIs, and student developer hackathon with 900 builders.',
  category: 'technology',
  city: 'Lahore',
  country: 'Pakistan',
  venue: 'NUST Auditorium',
  starts_at: '2026-12-01T09:00:00Z',
  ends_at: '2026-12-02T19:00:00Z',
  expected_attendees: 900,
  audience_tags: ['ai', 'fintech', 'developers', 'cloud'],
  event_objectives: ['Developer adoption', 'Campus recruiting'],
  social_reach: 12000,
  sponsorship_target_minor: 500000,
  currency: 'USD',
  sponsorship_needs: ['cash', 'swag'],
  deck_storage_path: null,
  status: 'approved',
  review_note: null,
  is_demo: false,
  created_at: '2026-11-12T00:00:00Z',
  updated_at: '2026-11-12T00:00:00Z',
};

const samplePackages: SponsorshipPackageRow[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    event_id: baseEvent.id,
    name: 'Bronze',
    description: 'Entry visibility',
    price_minor: 50000,
    currency: 'USD',
    benefits_json: ['Logo placement', 'Social shoutout'],
    availability: 5,
    ideal_sponsor_categories: ['technology'],
    pricing_rationale: 'Entry visibility',
    assumptions_json: [],
    ai_generated: false,
    approved_by_organizer: true,
    status: 'active',
    created_at: '2026-11-12T00:00:00Z',
    updated_at: '2026-11-12T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    event_id: baseEvent.id,
    name: 'Silver',
    description: 'Mid-tier developer booth',
    price_minor: 150000,
    currency: 'USD',
    benefits_json: ['Booth space', 'Recruiting booth', 'Logo placement'],
    availability: 3,
    ideal_sponsor_categories: ['technology'],
    pricing_rationale: 'Mid-tier developer booth',
    assumptions_json: [],
    ai_generated: false,
    approved_by_organizer: true,
    status: 'active',
    created_at: '2026-11-12T00:00:00Z',
    updated_at: '2026-11-12T00:00:00Z',
  },
];

const strongSponsor: SponsorProfileRow = {
  id: '00000000-0000-4000-8000-000000000201',
  user_id: null,
  company_name: 'Northstar Cloud APIs',
  industry: 'Cloud & AI Developer Tools',
  description: 'Developer APIs and AI inference infrastructure for startups and students.',
  website: 'https://northstar.example',
  operating_locations: ['Lahore'],
  products_services: 'Cloud SDKs, API credits',
  target_tags: ['ai', 'developers', 'cloud', 'fintech'],
  objectives: ['Developer adoption', 'API signups', 'Campus recruiting'],
  budget_min_minor: 50000,
  budget_max_minor: 200000,
  currency: 'USD',
  preferred_categories: ['technology'],
  preferred_locations: ['Lahore'],
  preferred_benefits: ['Booth space', 'Recruiting booth'],
  contact_email: 'sponsors@northstar.example',
  logo_url: null,
  verification_status: 'verified',
  is_demo: true,
  created_at: '2026-11-12T00:00:00Z',
  updated_at: '2026-11-12T00:00:00Z',
};

const poorSponsor: SponsorProfileRow = {
  id: '00000000-0000-4000-8000-000000000202',
  user_id: null,
  company_name: 'Apex Heavy Freight Logistics',
  industry: 'Industrial Freight & Trucking',
  description: 'Cross-border freight hauling for manufacturing plants.',
  website: null,
  operating_locations: ['Karachi'],
  products_services: 'Bulk trucking containers',
  target_tags: ['warehousing', 'diesel', 'supply-chain'],
  objectives: ['Fleet contracts'],
  budget_min_minor: 1000000,
  budget_max_minor: 2000000,
  currency: 'USD',
  preferred_categories: ['sports'],
  preferred_locations: ['Karachi'],
  preferred_benefits: ['Arena banner'],
  contact_email: 'fleet@apex.example',
  logo_url: null,
  verification_status: 'verified',
  is_demo: true,
  created_at: '2026-11-12T00:00:00Z',
  updated_at: '2026-11-12T00:00:00Z',
};

test('computeDeterministicMatch ranks strong-fit sponsor significantly higher than poor-fit sponsor', () => {
  const strong = computeDeterministicMatch({
    event: baseEvent,
    sponsor: strongSponsor,
    packages: samplePackages,
    eventBenefits: ['Booth space', 'Recruiting booth'],
  });
  const poor = computeDeterministicMatch({
    event: baseEvent,
    sponsor: poorSponsor,
    packages: samplePackages,
    eventBenefits: ['Booth space'],
  });

  assert.ok(strong.score > poor.score + 20);
  assert.ok(strong.score >= 70);
  assert.equal(strong.recommendedPackageId, samplePackages[1].id);
});

test('computeDeterministicMatch flags missing info and lowers confidence when metadata is empty', () => {
  const sparseEvent: EventRow = {
    ...baseEvent,
    audience_tags: [],
    city: '',
  };
  const sparseSponsor: SponsorProfileRow = {
    ...strongSponsor,
    target_tags: [],
    preferred_categories: [],
    preferred_locations: [],
  };

  const result = computeDeterministicMatch({
    event: sparseEvent,
    sponsor: sparseSponsor,
    packages: [],
    eventBenefits: [],
  });

  assert.equal(result.confidence, 'low');
  assert.ok(result.missingInformation.length >= 3);
});

test('proposal validation schemas enforce UUIDs, message length, and decision enums', () => {
  const validCreate = createProposalSchema.safeParse({
    eventId: baseEvent.id,
    packageId: samplePackages[0].id,
    message: 'Excited to sponsor this campus AI hackathon!',
  });
  assert.equal(validCreate.success, true);

  const badRespond = respondProposalSchema.safeParse({
    decision: 'maybe',
  });
  assert.equal(badRespond.success, false);
});
