import { z } from 'zod';

export const createProposalSchema = z.object({
  eventId: z.string().uuid('Valid eventId required'),
  sponsorId: z.string().uuid('Valid sponsorId required').optional(),
  packageId: z.string().uuid('Valid packageId required'),
  message: z
    .string()
    .trim()
    .min(10, 'Proposal message must be at least 10 characters')
    .max(3000, 'Proposal message must be at most 3000 characters'),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(14),
});

export const respondProposalSchema = z.object({
  decision: z.enum(['accept', 'reject', 'request_changes']),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const outreachDraftSchema = z.object({
  eventId: z.string().uuid(),
  sponsorId: z.string().uuid(),
  packageId: z.string().uuid(),
});
