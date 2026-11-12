import { z } from 'zod';

export const publicSignUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  // Admin role MUST NEVER be selectable via public sign-up
  role: z.enum(['organizer', 'sponsor'], {
    message: 'Role must be either organizer or sponsor',
  }),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const organizerOnboardingSchema = z.object({
  societyName: z.string().trim().min(3, 'Society name must be at least 3 characters').max(120),
  universityName: z.string().trim().min(3, 'University name is required').max(150),
  campusCity: z.string().trim().min(2, 'Campus city is required').max(80),
  category: z.enum([
    'Technology',
    'Business',
    'Sports',
    'Cultural',
    'Social',
    'Academic',
    'Other',
  ]),
  description: z
    .string()
    .trim()
    .min(30, 'Please describe your society in at least 30 characters')
    .max(1500),
  contactPerson: z.string().trim().min(2, 'Contact person name is required').max(100),
  officialEmail: z.string().trim().email('Official email must be valid'),
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL (e.g. https://...)')
    .optional()
    .or(z.literal('')),
});

export const sponsorOnboardingSchema = z
  .object({
    companyName: z.string().trim().min(2, 'Company name is required').max(120),
    industry: z.string().trim().min(2, 'Industry is required').max(100),
    description: z
      .string()
      .trim()
      .min(30, 'Please describe your brand in at least 30 characters')
      .max(1500),
    website: z
      .string()
      .trim()
      .url('Website must be a valid URL (e.g. https://...)')
      .optional()
      .or(z.literal('')),
    productsServices: z.string().trim().max(500).optional().or(z.literal('')),
    operatingLocations: z.array(z.string().trim().min(1)).min(1, 'Add at least one operating location'),
    targetTags: z.array(z.string().trim().min(1)).min(1, 'Add at least one target audience tag'),
    objectives: z.array(z.string().trim().min(1)).min(1, 'Select at least one marketing objective'),
    budgetMinUsd: z.coerce.number().min(50, 'Minimum budget must be at least $50').max(1000000),
    budgetMaxUsd: z.coerce.number().min(50, 'Maximum budget must be at least $50').max(1000000),
    preferredCategories: z
      .array(z.enum(['technology', 'business', 'sports', 'cultural', 'social', 'academic', 'other']))
      .min(1, 'Select at least one preferred event category'),
    preferredLocations: z.array(z.string().trim().min(1)).min(1, 'Add at least one preferred location'),
    preferredBenefits: z.array(z.string().trim().min(1)).min(1, 'Select at least one preferred benefit'),
    contactEmail: z.string().trim().email('Contact email must be valid'),
  })
  .refine((val) => val.budgetMaxUsd >= val.budgetMinUsd, {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMaxUsd'],
  });

export const adminReviewSchema = z.object({
  entityType: z.enum(['organizer_profile', 'event']),
  entityId: z.string().uuid('Invalid entity ID'),
  decision: z.enum(['approve', 'reject', 'request_changes']),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const adminUserModerationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['active', 'suspended']),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

export function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
