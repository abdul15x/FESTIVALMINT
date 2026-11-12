import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { savePackagesSchema } from '@/lib/validation/packages';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession(['organizer']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const { data: event } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', id)
    .maybeSingle();

  if (!event) return apiError('NOT_FOUND', 'Event not found.', 404);
  if (event.organizer_id !== context.organizerProfile?.id) {
    return apiError('FORBIDDEN', 'You do not own this event.', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = savePackagesSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid packages payload.',
      400
    );
  }

  // Archive packages omitted or replace active set safely (preserving packages referenced by existing proposals)
  const { data: existingPackages } = await supabase
    .from('sponsorship_packages')
    .select('id')
    .eq('event_id', id);

  const existingIds = new Set((existingPackages ?? []).map((p) => p.id));
  const incomingIds = new Set(
    parsed.data.packages.map((p) => p.id).filter((pid): pid is string => Boolean(pid))
  );

  for (const oldId of existingIds) {
    if (!incomingIds.has(oldId)) {
      await supabase
        .from('sponsorship_packages')
        .update({ status: 'archived' })
        .eq('id', oldId);
    }
  }

  const savedRows = [];
  for (const pkg of parsed.data.packages) {
    const rowPayload = {
      event_id: id,
      name: pkg.name,
      description: pkg.description || null,
      price_minor: Math.round(pkg.priceUsd * 100),
      currency: pkg.currency,
      benefits_json: pkg.benefits,
      availability: pkg.availability,
      ideal_sponsor_categories: pkg.idealSponsorCategories,
      pricing_rationale: pkg.pricingRationale || null,
      assumptions_json: pkg.assumptions,
      ai_generated: pkg.aiGenerated,
      approved_by_organizer: pkg.approvedByOrganizer,
      status: 'active' as const,
    };

    if (pkg.id && existingIds.has(pkg.id)) {
      const { data, error } = await supabase
        .from('sponsorship_packages')
        .update(rowPayload)
        .eq('id', pkg.id)
        .select('*')
        .single();
      if (error) return apiError('PACKAGE_SAVE_FAILED', error.message, 500);
      savedRows.push(data);
    } else {
      const { data, error } = await supabase
        .from('sponsorship_packages')
        .insert(rowPayload)
        .select('*')
        .single();
      if (error) return apiError('PACKAGE_SAVE_FAILED', error.message, 500);
      savedRows.push(data);
    }
  }

  return apiSuccess({ packages: savedRows }, 'Sponsorship packages saved.');
}
