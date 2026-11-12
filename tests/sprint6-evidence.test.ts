import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evidenceLinkSchema,
  MAX_EVIDENCE_FILE_BYTES,
  validateEvidenceFileMeta,
} from '@/lib/validation/evidence';
import { buildDeterministicPerformanceReport } from '@/lib/ai/reports';

test('validateEvidenceFileMeta rejects unsupported extensions, dangerous files, and oversized payloads', () => {
  const exe = validateEvidenceFileMeta({
    name: 'malware.exe',
    type: 'application/x-msdownload',
    size: 1024,
  });
  assert.equal(exe.ok, false);

  const oversized = validateEvidenceFileMeta({
    name: 'event-deck.pdf',
    type: 'application/pdf',
    size: MAX_EVIDENCE_FILE_BYTES + 1,
  });
  assert.equal(oversized.ok, false);

  const validPng = validateEvidenceFileMeta({
    name: 'booth-photo.png',
    type: 'image/png',
    size: 250_000,
  });
  assert.equal(validPng.ok, true);
});

test('evidenceLinkSchema enforces http/https links and meaningful fulfillment notes', () => {
  const valid = evidenceLinkSchema.safeParse({
    deliverableId: '00000000-0000-4000-8000-000000000501',
    sourceUrl: 'https://campus.example/recap',
    notes: 'Published sponsor banner recap post.',
  });
  assert.equal(valid.success, true);

  const badUrl = evidenceLinkSchema.safeParse({
    deliverableId: '00000000-0000-4000-8000-000000000501',
    sourceUrl: 'javascript:alert(1)',
    notes: 'Attempted bad scheme link',
  });
  assert.equal(badUrl.success, false);
});

test('buildDeterministicPerformanceReport explicitly flags missing deliverables without fabricating completion', () => {
  const report = buildDeterministicPerformanceReport({
    eventTitle: 'BuildFest Campus AI Hackathon 2026',
    sponsorName: 'Northstar Cloud APIs',
    deliverables: [
      {
        id: '1',
        title: 'Keynote Slide Logo Placement',
        status: 'verified',
        evidenceCount: 1,
        evidenceNotes: ['Uploaded opening keynote slide deck photo.'],
        evidenceUrls: [],
        evidenceFileTypes: ['image/png'],
      },
      {
        id: '2',
        title: 'Developer Booth Activation',
        status: 'pending',
        evidenceCount: 0,
        evidenceNotes: [],
        evidenceUrls: [],
        evidenceFileTypes: [],
      },
      {
        id: '3',
        title: 'Post-Event Opt-In Summary CSV',
        status: 'pending',
        evidenceCount: 0,
        evidenceNotes: [],
        evidenceUrls: [],
        evidenceFileTypes: [],
      },
    ],
  });

  assert.equal(report.fulfillmentRatePercent, 33);
  assert.equal(report.missingDeliverables.length, 2);
  assert.ok(report.verifiedFacts.some((f) => f.includes('Keynote Slide Logo Placement')));
  assert.ok(report.missingDeliverables.some((m) => m.includes('Developer Booth Activation')));
});
