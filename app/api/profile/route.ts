import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
  organizerOnboardingSchema,
  sponsorOnboardingSchema,
} from '@/lib/validation/auth';

const baseProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
});

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  return apiSuccess({
    profile: auth.context.profile,
    organizerProfile: auth.context.organizerProfile,
    sponsorProfile: auth.context.sponsorProfile,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const baseParsed = baseProfileSchema.safeParse(body);
  if (!baseParsed.success) {
    return apiError('VALIDATION_ERROR', 'Full name must be 2–100 characters.', 400);
  }

  if (baseParsed.data.fullName) {
    const { error: nameErr } = await supabase
      .from('profiles')
      .update({ full_name: baseParsed.data.fullName })
      .eq('id', context.userId);

    if (nameErr) {
      return apiError('PROFILE_UPDATE_FAILED', nameErr.message, 500);
    }
  }

  if (context.profile.role === 'organizer' && body.societyName) {
    const parsed = organizerOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        parsed.error.issues[0]?.message ?? 'Invalid organizer details.',
        400
      );
    }
    const d = parsed.data;
    const { error } = await supabase
      .from('organizer_profiles')
      .update({
        society_name: d.societyName,
        university_name: d.universityName,
        campus_city: d.campusCity,
        category: d.category,
        description: d.description,
        contact_person: d.contactPerson,
        official_email: d.officialEmail,
        website: d.website || null,
      })
      .eq('user_id', context.userId);

    if (error) {
      return apiError('ORGANIZER_UPDATE_FAILED', error.message, 500);
    }
  }

  if (context.profile.role === 'sponsor' && body.companyName) {
    const parsed = sponsorOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        parsed.error.issues[0]?.message ?? 'Invalid sponsor details.',
        400
      );
    }
    const s = parsed.data;
    const { error } = await supabase
      .from('sponsor_profiles')
      .update({
        company_name: s.companyName,
        industry: s.industry,
        description: s.description,
        website: s.website || null,
        products_services: s.productsServices || null,
        operating_locations: s.operatingLocations,
        target_tags: s.targetTags,
        objectives: s.objectives,
        budget_min_minor: Math.round(s.budgetMinUsd * 100),
        budget_max_minor: Math.round(s.budgetMaxUsd * 100),
        preferred_categories: s.preferredCategories,
        preferred_locations: s.preferredLocations,
        preferred_benefits: s.preferredBenefits,
        contact_email: s.contactEmail,
      })
      .eq('user_id', context.userId);

    if (error) {
      return apiError('SPONSOR_UPDATE_FAILED', error.message, 500);
    }
  }

  return apiSuccess({ updated: true }, 'Profile settings updated.');
}
