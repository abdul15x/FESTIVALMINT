import { z } from 'zod';

export const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/csv',
  'text/plain',
]);

export const ALLOWED_EVIDENCE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.csv',
  '.txt',
]);

export function validateEvidenceFileMeta(file: {
  name: string;
  type: string;
  size: number;
}): { ok: true; extension: string } | { ok: false; message: string } {
  const lowerName = file.name.trim().toLowerCase();
  const dotIdx = lowerName.lastIndexOf('.');
  const extension = dotIdx >= 0 ? lowerName.slice(dotIdx) : '';

  if (!extension || !ALLOWED_EVIDENCE_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      message: `Unsupported file extension "${extension || 'none'}". Allowed: jpg, png, webp, pdf, csv, txt.`,
    };
  }

  const normalizedMime = file.type.trim().toLowerCase();
  if (!ALLOWED_EVIDENCE_MIME_TYPES.has(normalizedMime)) {
    return {
      ok: false,
      message: `Unsupported MIME type "${file.type || 'unknown'}". Only images, PDF, CSV, and plain text are allowed.`,
    };
  }

  if (file.size <= 0) {
    return { ok: false, message: 'Uploaded file cannot be empty.' };
  }

  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return {
      ok: false,
      message: 'File exceeds the 10 MB security limit for fulfillment evidence.',
    };
  }

  return { ok: true, extension };
}

export const evidenceLinkSchema = z
  .object({
    deliverableId: z.string().uuid('Valid deliverableId required'),
    sourceUrl: z
      .string()
      .trim()
      .url('Proof URL must start with http:// or https://')
      .refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
        message: 'Only http:// or https:// proof links are allowed',
      })
      .optional()
      .or(z.literal('')),
    notes: z.string().trim().min(5, 'Add brief fulfillment context (at least 5 characters)').max(2000),
  })
  .refine((v) => Boolean(v.sourceUrl) || v.notes.length >= 10, {
    message: 'Provide either a valid proof URL or detailed fulfillment notes (10+ characters).',
  });

export const sponsorDeliverableReviewSchema = z.object({
  deliverableId: z.string().uuid('Valid deliverableId required'),
  status: z.enum(['verified', 'not_verified', 'waived_by_sponsor']),
});
