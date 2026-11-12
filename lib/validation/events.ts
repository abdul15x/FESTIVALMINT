import { z } from 'zod';

export const EVENT_CATEGORIES = [
  'technology',
  'business',
  'sports',
  'cultural',
  'social',
  'academic',
  'other',
] as const;

export const SPONSORSHIP_NEEDS_OPTIONS = [
  'Cash',
  'Prizes',
  'Equipment',
  'Food',
  'Venue',
  'Software credits',
  'Services',
] as const;

export const EVENT_BENEFITS_OPTIONS = [
  'Logo placement',
  'Booth',
  'Speaking slot',
  'Workshop',
  'Social media post',
  'Recruitment access',
  'Sampling',
] as const;

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Event name must be at least 5 characters')
      .max(120, 'Event name must be at most 120 characters'),
    description: z
      .string()
      .trim()
      .min(50, 'Description must be at least 50 characters')
      .max(2000, 'Description must be at most 2000 characters'),
    category: z.enum(EVENT_CATEGORIES),
    city: z.string().trim().min(2, 'City is required').max(80),
    country: z.string().trim().min(2, 'Country is required').max(80),
    venue: z.string().trim().max(120).optional().or(z.literal('')),
    startsAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Valid start date required'),
    endsAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Valid end date required'),
    expectedAttendees: z.coerce
      .number()
      .int('Expected attendees must be a whole number')
      .min(10, 'Expected attendees must be at least 10')
      .max(500000),
    audienceTags: z
      .array(z.string().trim().min(1))
      .min(1, 'Add at least one target audience tag'),
    eventObjectives: z
      .array(z.string().trim().min(1))
      .min(1, 'Add at least one event objective'),
    socialReach: z.coerce.number().int().min(0).max(50000000).default(0),
    sponsorshipTargetUsd: z.coerce
      .number()
      .min(100, 'Sponsorship target must be at least $100')
      .max(1000000),
    sponsorshipNeeds: z
      .array(z.string().trim().min(1))
      .min(1, 'Select at least one sponsorship need'),
    availableBenefits: z
      .array(z.string().trim().min(1))
      .min(1, 'Select at least one available benefit'),
  })
  .refine((data) => Date.parse(data.endsAt) > Date.parse(data.startsAt), {
    message: 'End date must be after start date',
    path: ['endsAt'],
  });
