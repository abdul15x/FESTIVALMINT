import { z } from 'zod';

export const generatedPackageItemSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(400).optional().default(''),
  suggested_price: z.number().positive().max(1000000),
  currency: z.string().trim().length(3).default('USD'),
  benefits: z.array(z.string().trim().min(2)).min(1).max(12),
  availability: z.number().int().min(1).max(50),
  ideal_sponsor_categories: z.array(z.string().trim().min(2)).min(1).max(6),
  pricing_rationale: z.string().trim().min(10).max(600),
});

export const aiPackageGenerationResponseSchema = z.object({
  event_summary: z.string().trim().min(10).max(1000),
  audience_summary: z.string().trim().min(10).max(1000),
  assumptions: z.array(z.string().trim().min(3)).min(1).max(10),
  packages: z.array(generatedPackageItemSchema).min(1).max(5),
  warnings: z.array(z.string().trim().min(3)).max(10).default([]),
});

export const savePackagesSchema = z.object({
  packages: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(400).optional().default(''),
        priceUsd: z.coerce.number().min(10, 'Package price must be at least $10').max(1000000),
        currency: z.string().trim().length(3).default('USD'),
        benefits: z.array(z.string().trim().min(2)).min(1, 'Each package needs at least one benefit'),
        availability: z.coerce.number().int().min(1).max(50),
        idealSponsorCategories: z.array(z.string().trim().min(1)).default([]),
        pricingRationale: z.string().trim().max(600).optional().default(''),
        assumptions: z.array(z.string().trim().min(1)).default([]),
        aiGenerated: z.boolean().default(false),
        approvedByOrganizer: z.boolean().default(true),
      })
    )
    .min(1, 'Save at least one sponsorship package')
    .max(6),
});

export type AiPackageGenerationResponse = z.infer<typeof aiPackageGenerationResponseSchema>;
