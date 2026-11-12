import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, ShieldCheck } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requirePageSession } from '@/lib/auth/session';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';
import { formatMinorCurrency, formatShortDate } from '@/lib/utils';
import { computeDeterministicMatch } from '@/lib/matching/scorer';
import { SponsorEventDetailClient } from '@/components/sponsor/event-detail-client';
import type { EventRow, SponsorshipPackageRow } from '@/types/database';

interface EventWithRelations extends EventRow {
  organizer_profiles: {
    society_name: string;
    university_name: string | null;
    verification_status: string;
    description: string | null;
  } | null;
  sponsorship_packages: SponsorshipPackageRow[];
  event_benefits: Array<{ benefit_type: string }>;
}

export default async function SponsorEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, context } = await requirePageSession({ allowedRoles: ['sponsor'] });
  const sponsor = context.sponsorProfile;

  const { data: event } = await supabase
    .from('events')
    .select(
      '*, organizer_profiles(society_name, university_name, verification_status, description), sponsorship_packages(*), event_benefits(benefit_type)'
    )
    .eq('id', id)
    .in('status', ['approved', 'published', 'completed'])
    .maybeSingle<EventWithRelations>();

  if (!event) {
    notFound();
  }

  const packages = [...(event.sponsorship_packages ?? [])].sort(
    (a, b) => a.price_minor - b.price_minor
  );
  const benefitTypes = (event.event_benefits ?? []).map((b) => b.benefit_type);

  const deterministic = sponsor
    ? computeDeterministicMatch({
        event,
        sponsor,
        packages,
        eventBenefits: benefitTypes,
      })
    : null;

  const initialMatch = deterministic
    ? {
        ...deterministic,
        explanation: deterministic.deterministicExplanation,
        explanationSource: 'deterministic_fallback' as const,
      }
    : null;

  return (
    <DashboardShell role="sponsor" userName={sponsor?.company_name ?? context.profile.full_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/sponsor/discover" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Discovery
          </Link>
          <Badge
            variant={
              event.organizer_profiles?.verification_status === 'verified' ? 'mint' : 'neutral'
            }
          >
            <ShieldCheck className="mr-1 h-3 w-3" />
            {event.organizer_profiles?.verification_status === 'verified'
              ? 'Verified Society'
              : 'Society Pending Verification'}
          </Badge>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">{event.category}</Badge>
                  <Badge variant="neutral">{event.status}</Badge>
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold text-slate-950">
                  {event.title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Hosted by {event.organizer_profiles?.society_name ?? 'University Society'}
                  {event.organizer_profiles?.university_name
                    ? ` · ${event.organizer_profiles.university_name}`
                    : ''}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-2.5 text-right">
                <p className="text-xs text-slate-500">Target Sponsorship Pool</p>
                <p className="font-display text-lg font-bold text-slate-950">
                  {formatMinorCurrency(event.sponsorship_target_minor, event.currency)}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-700">{event.description}</p>

            <div className="flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatShortDate(event.starts_at)} – {formatShortDate(event.ends_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                {event.venue ? `${event.venue}, ${event.city}` : event.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                {event.expected_attendees.toLocaleString()} expected attendees
              </span>
            </div>

            {event.audience_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.audience_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <SponsorEventDetailClient
          eventId={event.id}
          eventTitle={event.title}
          packages={packages}
          initialMatch={initialMatch}
          hasSponsorProfile={Boolean(sponsor)}
        />
      </div>
    </DashboardShell>
  );
}
