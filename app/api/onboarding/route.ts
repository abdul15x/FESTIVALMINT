import { NextRequest } from 'next/server';
import { requireApiSession, getDashboardPathForRole } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
  organizerOnboardingSchema,
  sponsorOnboardingSchema,
} from '@/lib/validation/auth';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer', 'sponsor']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  if (context.profile.role === 'organizer') {
    const parsed = organizerOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        'VALIDATION_ERROR',
        parsed.error.issues[0]?.message ?? 'Invalid organizer profile details.',
        400
      );
    }

    const d = parsed.data;
    const dbClient = createAdminSupabaseClient() ?? supabase;

    // Find or register university reference
    let universityId: string | null = null;
    const { data: existingUni } = await dbClient
      .from('universities')
      .select('id')
      .ilike('name', d.universityName)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (existingUni) {
      universityId = existingUni.id;
    } else if (createAdminSupabaseClient()) {
      const { data: createdUni } = await dbClient
        .from('universities')
        .insert({
          name: d.universityName,
          city: d.campusCity,
          country: 'Not specified',
          verification_status: 'pending',
        })
        .select('id')
        .maybeSingle<{ id: string }>();
      universityId = createdUni?.id ?? null;
    }

    const { data: organizerProfile, error } = await supabase
      .from('organizer_profiles')
      .upsert(
        {
          user_id: context.userId,
          society_name: d.societyName,
          university_id: universityId,
          university_name: d.universityName,
          campus_city: d.campusCity,
          category: d.category,
          description: d.description,
          contact_person: d.contactPerson,
          official_email: d.officialEmail,
          website: d.website || null,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      return apiError('ONBOARDING_FAILED', error.message, 500);
    }

    return apiSuccess(
      {
        profile: organizerProfile,
        redirectTo: getDashboardPathForRole('organizer'),
      },
      'Organizer profile saved.',
      201
    );
  }

  // Sponsor onboarding
  const parsed = sponsorOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid sponsor profile details.',
      400
    );
  }

  const s = parsed.data;
  const budgetMinMinor = Math.round(s.budgetMinUsd * 100);
  const budgetMaxMinor = Math.round(s.budgetMaxUsd * 100);

  const { data: sponsorProfile, error } = await supabase
    .from('sponsor_profiles')
    .upsert(
      {
        user_id: context.userId,
        company_name: s.companyName,
        industry: s.industry,
        description: s.description,
        website: s.website || null,
        products_services: s.productsServices || null,
        operating_locations: s.operatingLocations,
        target_tags: s.targetTags,
        objectives: s.objectives,
        budget_min_minor: budgetMinMinor,
        budget_max_minor: budgetMaxMinor,
        currency: 'USD',
        preferred_categories: s.preferredCategories,
        preferred_locations: s.preferredLocations,
        preferred_benefits: s.preferredBenefits,
        contact_email: s.contactEmail,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error) {
    return apiError('ONBOARDING_FAILED', error.message, 500);
  }

  return apiSuccess(
    {
      profile: sponsorProfile,
      redirectTo: getDashboardPathForRole('sponsor'),
    },
    'Sponsor brand profile saved.',
    201
  );
}
