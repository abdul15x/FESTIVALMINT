import { NextRequest } from 'next/server';
import { requireApiSession } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createProposalSchema } from '@/lib/validation/proposals';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await requireApiSession(['organizer', 'sponsor', 'admin']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;

  let query = supabase
    .from('proposals')
    .select(
      '*, events(title, city, starts_at, status), sponsor_profiles(company_name, industry), organizer_profiles(society_name, university_name), sponsorship_packages(name)'
    )
    .order('created_at', { ascending: false });

  if (context.profile.role === 'organizer') {
    query = query.eq('organizer_id', context.organizerProfile?.id ?? '');
  } else if (context.profile.role === 'sponsor') {
    query = query.eq('sponsor_id', context.sponsorProfile?.id ?? '');
  }

  const { data, error } = await query;
  if (error) return apiError('PROPOSALS_FETCH_FAILED', error.message, 500);

  return apiSuccess({ proposals: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(['organizer', 'sponsor']);
  if (!auth.ok) return auth.response;

  const { supabase, context } = auth;
  const role = context.profile.role;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid proposal payload.',
      400
    );
  }

  const { eventId, sponsorId: bodySponsorId, packageId, message, expiresInDays } = parsed.data;
  const adminDb = createAdminSupabaseClient();

  if (role === 'organizer') {
    const org = context.organizerProfile;
    if (!org) return apiError('ONBOARDING_REQUIRED', 'Complete organizer profile first.', 400);
    if (!bodySponsorId) {
      return apiError('VALIDATION_ERROR', 'sponsorId is required when organizer creates a proposal.', 400);
    }

    // Verify organizer owns event and package belongs to event; derive price strictly from DB
    const [{ data: event }, { data: pkg }, { data: sponsor }] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', eventId)
        .eq('organizer_id', org.id)
        .maybeSingle(),
      supabase
        .from('sponsorship_packages')
        .select('id, name, price_minor, currency, benefits_json, status')
        .eq('id', packageId)
        .eq('event_id', eventId)
        .maybeSingle(),
      supabase
        .from('sponsor_profiles')
        .select('id, user_id, company_name')
        .eq('id', bodySponsorId)
        .maybeSingle(),
    ]);

    if (!event) return apiError('FORBIDDEN', 'Event not found or not owned by you.', 403);
    if (!pkg || pkg.status === 'archived') {
      return apiError('NOT_FOUND', 'Active sponsorship package not found for this event.', 404);
    }
    if (!sponsor) return apiError('NOT_FOUND', 'Sponsor profile not found.', 404);

    const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();

    const { data: proposal, error } = await supabase
      .from('proposals')
      .insert({
        event_id: event.id,
        sponsor_id: sponsor.id,
        package_id: pkg.id,
        organizer_id: org.id,
        amount_minor: pkg.price_minor,
        currency: pkg.currency,
        benefits_snapshot_json: pkg.benefits_json,
        message,
        status: 'sent',
        expires_at: expiresAt,
        version: 1,
      })
      .select('*')
      .single();

    if (error || !proposal) {
      return apiError('PROPOSAL_CREATE_FAILED', error?.message ?? 'Failed to create proposal.', 500);
    }

    await supabase.from('proposal_events').insert({
      proposal_id: proposal.id,
      actor_id: context.userId,
      event_type: 'sent',
      note: `Proposal sent for ${pkg.name} package.`,
    });

    if (sponsor.user_id && adminDb) {
      await adminDb.from('notifications').insert({
        user_id: sponsor.user_id,
        title: `New sponsorship proposal: ${event.title}`,
        body: `${org.society_name} invited ${sponsor.company_name} to sponsor via the ${pkg.name} tier.`,
        related_type: 'proposal',
        related_id: proposal.id,
      });
    }

    return apiSuccess({ proposal }, 'Proposal sent to sponsor.', 201);
  }

  // Sponsor-initiated sponsorship commitment on an approved/published event
  const sponsor = context.sponsorProfile;
  if (!sponsor) return apiError('ONBOARDING_REQUIRED', 'Complete sponsor onboarding first.', 400);
  if (bodySponsorId && bodySponsorId !== sponsor.id) {
    return apiError('FORBIDDEN', 'Sponsors can only create proposals for their own brand profile.', 403);
  }

  const [{ data: event }, { data: pkg }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, organizer_id, status')
      .eq('id', eventId)
      .in('status', ['approved', 'published'])
      .maybeSingle(),
    supabase
      .from('sponsorship_packages')
      .select('id, name, price_minor, currency, benefits_json, status')
      .eq('id', packageId)
      .eq('event_id', eventId)
      .maybeSingle(),
  ]);

  if (!event) {
    return apiError('NOT_FOUND', 'Approved event not found for sponsorship.', 404);
  }
  if (!pkg || pkg.status === 'archived') {
    return apiError('NOT_FOUND', 'Active sponsorship package not found for this event.', 404);
  }

  const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
  const dbClient = adminDb ?? supabase;

  const { data: proposal, error } = await dbClient
    .from('proposals')
    .insert({
      event_id: event.id,
      sponsor_id: sponsor.id,
      package_id: pkg.id,
      organizer_id: event.organizer_id,
      amount_minor: pkg.price_minor,
      currency: pkg.currency,
      benefits_snapshot_json: pkg.benefits_json,
      message,
      status: 'accepted',
      expires_at: expiresAt,
      version: 1,
    })
    .select('*')
    .single();

  if (error || !proposal) {
    return apiError('PROPOSAL_CREATE_FAILED', error?.message ?? 'Failed to select package.', 500);
  }

  await dbClient.from('proposal_events').insert({
    proposal_id: proposal.id,
    actor_id: context.userId,
    event_type: 'accepted',
    note: `${sponsor.company_name} selected the ${pkg.name} package for sponsorship.`,
  });

  if (adminDb) {
    const { data: org } = await adminDb
      .from('organizer_profiles')
      .select('user_id')
      .eq('id', event.organizer_id)
      .maybeSingle<{ user_id: string | null }>();

    if (org?.user_id) {
      await adminDb.from('notifications').insert({
        user_id: org.user_id,
        title: `Sponsor selected ${pkg.name}: ${event.title}`,
        body: `${sponsor.company_name} accepted the ${pkg.name} package and can now proceed to PayPal Sandbox checkout.`,
        related_type: 'proposal',
        related_id: proposal.id,
      });
    }
  }

  return apiSuccess({ proposal }, 'Sponsorship package selected. Proceed to PayPal checkout.', 201);
}
