import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Calendar,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';
import {
  AnimatedScoreBar,
  FadeIn,
  StaggerGroup,
  StaggerItem,
} from '@/components/motion/primitives';
import {
  HeroLedgerShowcase,
  InteractiveWorkspacePreview,
  SixStageStorytelling,
} from '@/components/landing/landing-interactive';

const FEATURED_DEMO_EVENTS = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    title: 'BuildFest Campus AI Hackathon 2026',
    society: 'CampusSpark Tech Society',
    city: 'Lahore',
    category: 'Technology',
    attendees: '450 Builders',
    target: '$4,500 Goal',
    startingTier: '$500 Starting Tier',
    packages: ['Bronze Supporter ($500)', 'Silver Partner ($1,500)', 'Gold Title ($2,500)'],
    summary:
      '36-hour engineering hackathon connecting computer science and AI societies with developer tool and cloud sponsors.',
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    title: 'Campus Founders & FinTech Summit',
    society: 'CampusSpark Tech Society',
    city: 'Islamabad',
    category: 'Business & FinTech',
    attendees: '320 Founders',
    target: '$3,000 Goal',
    startingTier: 'Custom Tier Studio',
    packages: ['Workshop Partner', 'Startup Booth', 'Keynote Sponsor'],
    summary:
      'One-day summit spotlighting student venture teams, payments workshops, and technical recruiting panels.',
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    title: 'Autumn Cultural & Acoustic Night',
    society: 'Civic & Arts Guild',
    city: 'Karachi',
    category: 'Cultural & Arts',
    attendees: '800 Attendees',
    target: '$2,500 Goal',
    startingTier: '$1,000 Stage Tier',
    packages: ['Festival Stage Partner ($1,000)'],
    summary:
      'High-footfall university arts evening ideal for consumer brands, beverage sampling, and on-campus activations.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f7f6f2] text-[#0c121e]">
      <SiteHeader />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-stone-200/80 bg-radial-mint bg-ledger-grid">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:grid-cols-12 lg:items-center lg:px-8">
          <FadeIn immediate className="min-w-0 lg:col-span-6">
            <Badge variant="mint" dot className="max-w-full whitespace-normal px-3 py-1 text-xs">
              Campus Sponsorship Exchange · PayPal Sandbox Verified
            </Badge>

            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[#0c121e] sm:text-5xl lg:leading-[1.08]">
              University events{' '}
              <span className="text-emerald-700">
                deserve
              </span>{' '}
              structured sponsor deals.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              FESTIVALMINT AI turns student event briefs into priced sponsorship tiers, scores
              compatibility against real brand objectives, processes checkout via PayPal Sandbox,
              and verifies post-event proof in a private ledger.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/sign-up?role=organizer"
                className={buttonClasses('primary', 'lg')}
              >
                <GraduationCap className="h-4 w-4 text-emerald-400" />
                I&apos;m an Organizer
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/sign-up?role=sponsor"
                className={buttonClasses('outline', 'lg')}
              >
                <Building2 className="h-4 w-4 text-emerald-700" />
                I&apos;m a Brand Sponsor
              </Link>
            </div>

            {/* Grounded Architectural Metric Bar */}
            <div className="mt-10 grid grid-cols-1 gap-4 border-t border-stone-300/70 pt-6 sm:grid-cols-3">
              <div>
                <p className="font-mono text-xl font-semibold text-[#0c121e] tabular-nums">6 Factors</p>
                <p className="mt-0.5 text-xs text-stone-600">Transparent match fit</p>
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-emerald-700 tabular-nums">100%</p>
                <p className="mt-0.5 text-xs text-stone-600">Locked term snapshots</p>
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-[#0c121e] tabular-nums">End-to-End</p>
                <p className="mt-0.5 text-xs text-stone-600">Checkout to proof vault</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn immediate delay={0.12} className="min-w-0 lg:col-span-6">
            <HeroLedgerShowcase />
          </FadeIn>
        </div>
      </section>

      {/* SECTION 2: 6-STAGE STORYTELLING */}
      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn className="max-w-2xl">
          <Badge variant="neutral" dot>
            From Campus Idea to Verified Recap
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-bold text-[#0c121e] sm:text-4xl">
            Every stage of the sponsorship{' '}
            <span className="text-emerald-700">
              lifecycle
            </span>{' '}
            in one place.
          </h2>
          <p className="mt-3 text-base text-stone-600">
            Explore how societies and sponsors move seamlessly from initial event brief to verified
            deliverables without scattered spreadsheets or unverified invoices.
          </p>
        </FadeIn>

        <div className="mt-10">
          <SixStageStorytelling />
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE PRODUCT PREVIEW */}
      <section id="preview" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <FadeIn>
          <InteractiveWorkspacePreview />
        </FadeIn>
      </section>

      {/* SECTION 4: ASYMMETRIC BENTO CAPABILITIES */}
      <section id="features" className="border-y border-stone-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <Badge variant="mint" dot>
                Built for Real Stakes
              </Badge>
              <h2 className="mt-3 font-display text-3xl font-bold text-[#0c121e] sm:text-4xl">
                Designed around accountability, not hand-wavy pitches.
              </h2>
            </div>
            <Link
              href="/sponsor/discover"
              prefetch={false}
              className={buttonClasses('outline', 'md')}
            >
              Browse Live Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          <StaggerGroup className="mt-10 grid gap-5 lg:grid-cols-12">
            {/* Large Left Card: Scoring Architecture */}
            <StaggerItem className="lg:col-span-7">
              <Card className="h-full border-stone-200/90 bg-[#faf9f6] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <Badge variant="mint">Explainable Compatibility Engine</Badge>
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#0c121e]">
                  Weighted scoring with zero guesswork.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
                  Every match calculates a 0–100 score directly from audience tags, sector fit,
                  sponsor budget window, campus geography, preferred activations, and lead time.
                </p>

                <div className="mt-6 space-y-3.5 rounded-2xl border border-stone-200 bg-white p-4.5">
                  {[
                    { label: 'Audience Alignment (30%)', score: 98 },
                    { label: 'Industry Sector Fit (20%)', score: 100 },
                    { label: 'Budget Range Fit (20%)', score: 95 },
                    { label: 'Campus City & Timing (20%)', score: 92 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#0c121e]">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold text-emerald-700">{item.score}/100</span>
                      </div>
                      <AnimatedScoreBar value={item.score} />
                    </div>
                  ))}
                </div>
              </Card>
            </StaggerItem>

            {/* Right Stack: Dark Checkout Card + Proof Vault Card */}
            <div className="lg:col-span-5 grid gap-5">
              <StaggerItem>
                <div className="rounded-2xl border border-[#0c121e] bg-[#0c121e] p-6 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-emerald-400">PAYPAL SANDBOX RAIL</span>
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold">
                    Idempotent Order &amp; Capture Guardrails
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Reuses active pending orders across reloads, blocks paid-proposal duplicates, and
                    verifies totals server-side before unlocking deliverables.
                  </p>
                  <div className="mt-4 flex items-center gap-2 font-mono text-xs text-emerald-300">
                    <Lock className="h-3.5 w-3.5" />
                    Authoritative server-side amount verification
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-stone-200/90 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral">Evidence &amp; Fulfillment</Badge>
                    <FileBarChart2 className="h-5 w-5 text-emerald-700" />
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-[#0c121e]">
                    Private Proof Locker &amp; Final ROI Dossier
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    Organizers upload recap URLs and signed event photos per deliverable; sponsors
                    verify completion before generating the final executive performance report.
                  </p>
                </Card>
              </StaggerItem>
            </div>
          </StaggerGroup>
        </div>
      </section>

      {/* SECTION 5: FEATURED CAMPUS EVENTS */}
      <section id="demo-events" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="mint" dot>
              Featured Campus Lineup
            </Badge>
            <h2 className="mt-3 font-display text-3xl font-bold text-[#0c121e] sm:text-4xl">
              Explore live verified student events.
            </h2>
          </div>
          <Link
            href="/sponsor/discover"
            prefetch={false}
            className={buttonClasses('primary', 'md')}
          >
            Open Sponsor Discovery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>

        <StaggerGroup className="mt-10 grid gap-6 lg:grid-cols-3">
          {FEATURED_DEMO_EVENTS.map((ev) => (
            <StaggerItem key={ev.id}>
              <Card interactive className="flex h-full flex-col justify-between overflow-hidden">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="mint">{ev.category}</Badge>
                    <span className="font-mono text-xs font-semibold text-emerald-700">
                      {ev.startingTier}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-[#0c121e]">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-stone-500">{ev.society}</p>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{ev.summary}</p>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-y border-stone-100 py-3 text-xs text-stone-700">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      {ev.city}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      {ev.attendees}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0c121e]">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      {ev.target}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Admin Verified
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ev.packages.map((pkg) => (
                      <span
                        key={pkg}
                        className="rounded-lg border border-stone-200 bg-[#faf9f6] px-2.5 py-1 text-[11px] font-medium text-stone-700"
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <div className="border-t border-stone-100 bg-[#faf9f6] px-6 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">Ready for proposals</span>
                  <Link
                    href={`/sponsor/events/${ev.id}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Inspect Event
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-[#0c121e] bg-[#0c121e] px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16 bg-ledger-grid-dark">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <Badge
                  variant="navy"
                  dot
                  className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                >
                  Ready for Demo &amp; Live Campus Workflows
                </Badge>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Launch a sponsorship round with structure, speed, and proof.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Whether you run a 450-person engineering hackathon or oversee university developer
                  partnerships, FESTIVALMINT AI replaces informal pitch emails with auditable
                  deals.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Link href="/auth/sign-up" className={buttonClasses('secondary', 'lg')}>
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/sign-in"
                  className={buttonClasses(
                    'outline',
                    'lg',
                    'border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40'
                  )}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <SiteFooter />
    </div>
  );
}
