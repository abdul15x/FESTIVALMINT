import test from 'node:test';
import assert from 'node:assert/strict';
import {
  publicSignUpSchema,
  organizerOnboardingSchema,
  sponsorOnboardingSchema,
  adminReviewSchema,
  splitCommaList,
} from '../lib/validation/auth.ts';

test('publicSignUpSchema rejects admin role registration', () => {
  const result = publicSignUpSchema.safeParse({
    fullName: 'Test User',
    email: 'test@example.edu',
    password: 'StrongPassword123',
    role: 'admin',
  });
  assert.equal(result.success, false);
});

test('publicSignUpSchema accepts organizer and sponsor roles with valid password', () => {
  const org = publicSignUpSchema.safeParse({
    fullName: 'Amina Tariq',
    email: 'amina@example.edu',
    password: 'StrongPassword123',
    role: 'organizer',
  });
  const sponsor = publicSignUpSchema.safeParse({
    fullName: 'Zainab Malik',
    email: 'zainab@company.com',
    password: 'StrongPassword123',
    role: 'sponsor',
  });
  assert.equal(org.success, true);
  assert.equal(sponsor.success, true);
});

test('sponsorOnboardingSchema enforces budgetMax >= budgetMin', () => {
  const invalid = sponsorOnboardingSchema.safeParse({
    companyName: 'Northstar Cloud',
    industry: 'Software',
    description: 'Cloud infrastructure for student builders and startup ecosystems.',
    operatingLocations: ['Lahore'],
    targetTags: ['Computer Science'],
    objectives: ['Hiring'],
    budgetMinUsd: 2000,
    budgetMaxUsd: 500,
    preferredCategories: ['technology'],
    preferredLocations: ['Lahore'],
    preferredBenefits: ['Booth'],
    contactEmail: 'hello@northstar.example.com',
  });
  assert.equal(invalid.success, false);
});

test('organizerOnboardingSchema validates required society description length', () => {
  const shortDesc = organizerOnboardingSchema.safeParse({
    societyName: 'Tech Soc',
    universityName: 'Demo University',
    campusCity: 'Lahore',
    category: 'Technology',
    description: 'Too short',
    contactPerson: 'Amina',
    officialEmail: 'soc@example.edu',
  });
  assert.equal(shortDesc.success, false);
});

test('adminReviewSchema and splitCommaList behave deterministically', () => {
  assert.deepEqual(splitCommaList(' AI, FinTech , , Cloud '), ['AI', 'FinTech', 'Cloud']);
  const validReview = adminReviewSchema.safeParse({
    entityType: 'event',
    entityId: '33333333-3333-4333-8333-333333333301',
    decision: 'approve',
    note: 'Verified society and event details.',
  });
  assert.equal(validReview.success, true);
});
