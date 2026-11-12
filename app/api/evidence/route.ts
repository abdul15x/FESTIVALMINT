import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  evidenceLinkSchema,
  sponsorDeliverableReviewSchema,
  validateEvidenceFileMeta,
} from '@/lib/validation/evidence';

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const org = context.organizerProfile;
  if (!org) {
    return apiError('ONBOARDING_REQUIRED', 'Complete organizer profile first.', 400);
  }

  const contentType = request.headers.get('content-type') ?? '';
  const adminDb = createAdminSupabaseClient();

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const deliverableId = String(formData.get('deliverableId') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();
    const sourceUrl = String(formData.get('sourceUrl') ?? '').trim();
    const fileEntry = formData.get('file');

    if (!deliverableId) {
      return apiError('VALIDATION_ERROR', 'deliverableId is required.', 400);
    }

    const { data: deliverable } = await supabase
      .from('deliverables')
      .select('id, proposal_id, title, proposals!inner(id, organizer_id, status)')
      .eq('id', deliverableId)
      .eq('proposals.organizer_id', org.id)
      .maybeSingle<{
        id: string;
        proposal_id: string;
        title: string;
        proposals: { id: string; organizer_id: string; status: string };
      }>();

    if (!deliverable) {
      return apiError('FORBIDDEN', 'Deliverable not found or not owned by your society.', 403);
    }

    if (!(fileEntry instanceof File)) {
      return apiError('VALIDATION_ERROR', 'A valid file attachment is required for upload.', 400);
    }

    const fileCheck = validateEvidenceFileMeta({
      name: fileEntry.name,
      type: fileEntry.type,
      size: fileEntry.size,
    });
    if (!fileCheck.ok) {
      return apiError('VALIDATION_ERROR', fileCheck.message, 400);
    }

    if (!adminDb) {
      return apiError(
        'STORAGE_NOT_CONFIGURED',
        'SUPABASE_SERVICE_ROLE_KEY is required to upload private evidence files. Use proof URL + notes instead.',
        503
      );
    }

    const safeFileName = fileEntry.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
    const storagePath = `${context.userId}/${deliverable.proposal_id}/${Date.now()}_${safeFileName}`;
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    const { error: uploadErr } = await adminDb.storage
      .from('evidence')
      .upload(storagePath, buffer, {
        contentType: fileEntry.type,
        upsert: false,
      });

    if (uploadErr) {
      return apiError('STORAGE_UPLOAD_FAILED', uploadErr.message, 500);
    }

    const { data: evidence, error: insertErr } = await adminDb
      .from('evidence_files')
      .insert({
        deliverable_id: deliverable.id,
        uploader_id: context.userId,
        storage_path: storagePath,
        file_type: fileEntry.type,
        source_url: sourceUrl || null,
        notes: notes || `Uploaded evidence file: ${safeFileName}`,
        review_status: 'pending',
      })
      .select('*')
      .single();

    if (insertErr || !evidence) {
      return apiError('EVIDENCE_SAVE_FAILED', insertErr?.message ?? 'Could not save evidence.', 500);
    }

    await adminDb
      .from('deliverables')
      .update({ status: 'submitted' })
      .eq('id', deliverable.id)
      .eq('status', 'pending');

    const { data: signed } = await adminDb.storage
      .from('evidence')
      .createSignedUrl(storagePath, 3600);

    return apiSuccess(
      { evidence, signedUrl: signed?.signedUrl ?? null },
      'Evidence file uploaded securely.',
      201
    );
  }

  // JSON link + fulfillment notes fallback
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be JSON or multipart form-data.', 400);
  }

  const parsed = evidenceLinkSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid evidence submission.',
      400
    );
  }

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, proposal_id, proposals!inner(id, organizer_id)')
    .eq('id', parsed.data.deliverableId)
    .eq('proposals.organizer_id', org.id)
    .maybeSingle();

  if (!deliverable) {
    return apiError('FORBIDDEN', 'Deliverable not found or not owned by your society.', 403);
  }

  const db = adminDb ?? supabase;
  const { data: evidence, error: insertErr } = await db
    .from('evidence_files')
    .insert({
      deliverable_id: parsed.data.deliverableId,
      uploader_id: context.userId,
      storage_path: null,
      file_type: parsed.data.sourceUrl ? 'external/url' : 'text/note',
      source_url: parsed.data.sourceUrl || null,
      notes: parsed.data.notes,
      review_status: 'pending',
    })
    .select('*')
    .single();

  if (insertErr || !evidence) {
    return apiError('EVIDENCE_SAVE_FAILED', insertErr?.message ?? 'Could not save evidence.', 500);
  }

  await db
    .from('deliverables')
    .update({ status: 'submitted' })
    .eq('id', parsed.data.deliverableId)
    .eq('status', 'pending');

  return apiSuccess({ evidence, signedUrl: null }, 'Fulfillment proof saved.', 201);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession(['sponsor']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const sponsor = context.sponsorProfile;
  if (!sponsor) {
    return apiError('ONBOARDING_REQUIRED', 'Complete sponsor profile first.', 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = sponsorDeliverableReviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid deliverable status.',
      400
    );
  }

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, proposal_id, proposals!inner(id, sponsor_id)')
    .eq('id', parsed.data.deliverableId)
    .eq('proposals.sponsor_id', sponsor.id)
    .maybeSingle();

  if (!deliverable) {
    return apiError('FORBIDDEN', 'Deliverable not found for your sponsorship.', 403);
  }

  const db = createAdminSupabaseClient() ?? supabase;
  const { data: updated, error } = await db
    .from('deliverables')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.deliverableId)
    .select('*')
    .single();

  if (error || !updated) {
    return apiError('UPDATE_FAILED', error?.message ?? 'Could not update deliverable.', 500);
  }

  return apiSuccess({ deliverable: updated }, 'Deliverable verification status updated.');
}
