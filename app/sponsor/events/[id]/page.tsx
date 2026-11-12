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
            dot
            variant={
              event.organizer_profiles?.verification_status === 'verified' ? 'mint' : 'neutral'
            }
          >
            <ShieldCheck className="h-3 w-3" />
            {event.organizer_profiles?.verification_status === 'verified'
              ? 'Verified Society'
              : 'Society Pending Verification'}
          </Badge>
        </div>

        <Card className="overflow-hidden border-stone-200/90">
          <div className="bg-[#0c121e] px-6 py-6 text-white bg-ledger-grid-dark sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="navy"
                    className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  >
                    {event.category}
                  </Badge>
                  <Badge variant="navy" className="border-white/20 bg-white/10 text-slate-200">
                    {event.status}
                  </Badge>
                </div>
                <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{event.title}</h1>
                <p className="mt-1.5 text-sm text-slate-300">
                  Hosted by {event.organizer_profiles?.society_name ?? 'University Society'}
                  {event.organizer_profiles?.university_name
                    ? ` · ${event.organizer_profiles.university_name}`
                    : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Sponsorship Pool
                </p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  {formatMinorCurrency(event.sponsorship_target_minor, event.currency)}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="space-y-4 p-6 sm:px-8">
            <p className="text-sm leading-relaxed text-stone-700">{event.description}</p>

            <div className="flex flex-wrap gap-5 border-t border-stone-100 pt-4 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {formatShortDate(event.starts_at)} – {formatShortDate(event.ends_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {event.venue ? `${event.venue}, ${event.city}` : event.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                {event.expected_attendees.toLocaleString()} expected attendees
              </span>
            </div>

            {event.audience_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.audience_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-stone-200 bg-[#faf9f6] px-2.5 py-1 text-xs font-medium text-stone-700"
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
