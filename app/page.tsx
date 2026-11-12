import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileBarChart2,
  ArrowRight,
  GraduationCap,
  Building2,
  Handshake,
  Layers,
  Lock,
} from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';

const SAMPLE_WORKFLOW_FACTORS = [
  { label: 'Audience Alignment (30%)', score: 98 },
  { label: 'Industry Fit (20%)', score: 100 },
  { label: 'Budget Range (20%)', score: 95 },
  { label: 'Campus City & Timing (20%)', score: 92 },
];

const FEATURED_DEMO_EVENTS = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    title: 'BuildFest Campus AI Hackathon 2026',
    society: 'CampusSpark Tech Society',
    city: 'Lahore',
    category: 'Technology',
    attendees: '450 Student Builders',
    target: '$4,500 Goal',
    startingTier: '$500 Bronze Tier',
    packages: ['Bronze Supporter ($500)', 'Silver Builder Partner ($1,500)', 'Gold Title Sponsor ($2,500)'],
    summary:
      '36-hour engineering hackathon connecting computer science and AI societies with developer tool and cloud sponsors.',
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    title: 'Campus Founders & FinTech Summit',
    society: 'CampusSpark Tech Society',
    city: 'Islamabad',
    category: 'Business & FinTech',
    attendees: '320 Founders & Students',
    target: '$3,000 Goal',
    startingTier: 'Custom Package Studio',
    packages: ['Workshop Partner', 'Startup Booth', 'Keynote Sponsor'],
    summary:
      'One-day summit spotlighting student venture teams, payments workshops, and recruiting panels.',
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    title: 'Autumn Cultural & Acoustic Night',
    society: 'Civic & Arts Guild',
    city: 'Karachi',
    category: 'Cultural & Arts',
    attendees: '800 Campus Attendees',
    target: '$2,500 Goal',
    startingTier: '$1,000 Stage Tier',
    packages: ['Festival Stage Partner ($1,000)'],
    summary:
      'High-footfall university arts evening ideal for consumer brands, beverage sampling, and student activations.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    actor: 'Organizer',
    title: 'Publish Event & Package Tiers',
    desc: 'Student organizers create an event profile, generate structured Bronze, Silver, and Gold tiers with FestivalMint AI, customize pricing, and submit for campus review.',
    icon: Sparkles,
  },
  {
    step: '02',
    actor: 'Both Sides',
    title: 'Inspect Smart Compatibility',
    desc: 'Organizers rank compatible brands and draft tailored outreach. Sponsors browse verified events scored across audience, industry, budget, location, benefits, and timing.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    actor: 'Sponsor -> Organizer',
    title: 'Agree Terms & Pay via PayPal Sandbox',
    desc: 'Accepted proposals lock deliverable snapshots and server-verified totals before completing checkout through PayPal Sandbox.',
    icon: CreditCard,
  },
  {
    step: '04',
    actor: 'Organizer -> Sponsor',
    title: 'Upload Proof & Generate Report',
    desc: 'Organizers upload event photos, reports, or recap URLs into private deliverable storage, sponsors verify items, and both sides review a proof-backed fulfillment report.',
    icon: FileBarChart2,
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'AI Package Studio',
    tag: 'Created with FestivalMint AI',
    desc: 'Turn event size, audience tags, and available benefits into structured Bronze, Silver, and Gold sponsorship tiers ready to edit and save.',
    icon: Layers,
  },
  {
    title: 'Transparent Match Scoring',
    tag: 'Why this match works',
    desc: 'Evaluate compatibility across six weighted factors with plain-English explanations highlighting audience overlap, budget alignment, and missing details.',
    icon: Sparkles,
  },
  {
    title: 'Proposal & Revision Flow',
    tag: 'Locked deliverables',
    desc: 'Send tailored sponsorship invitations, request package adjustments, or select a tier directly with benefits snapshotted at agreement.',
    icon: Handshake,
  },
  {
    title: 'PayPal Sandbox Checkout',
    tag: 'Server-verified totals',
    desc: 'Approve and capture sponsorship payments safely in PayPal Sandbox with server-enforced pricing, idempotency protection, and instant deliverable creation.',
    icon: CreditCard,
  },
  {
    title: 'Private Evidence Vault',
    tag: 'Signed file access',
    desc: 'Collect per-deliverable photos, PDFs, CSV recaps, and public links with secure signed access and explicit sponsor verification sign-off.',
    icon: Lock,
  },
  {
    title: 'Campus Governance Queue',
    tag: 'Verified societies',
    desc: 'University moderators verify student organizations, approve event listings before discovery, and maintain a complete governance log.',
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-[#0b1220]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:items-center lg:px-8">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                University Event Sponsorship Marketplace
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-[#0b1220] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Great University Events Deserve the Right Sponsors.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                FESTIVALMINT AI helps student societies package campus events and connect with
                compatible brands—while giving sponsors transparent fit insights, PayPal Sandbox
                checkout, and proof-backed deliverable tracking.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/auth/sign-up?role=organizer"
                  className={buttonClasses('primary', 'lg')}
                >
                  Find Sponsors
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#demo-events" className={buttonClasses('outline', 'lg')}>
                  Explore Events
                </a>
                <Link
                  href="/auth/sign-in"
                  className={buttonClasses('ghost', 'lg', 'text-slate-700')}
                >
                  Sign In
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Verified student societies
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  6-factor compatibility scoring
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  PayPal Sandbox checkout &amp; proof vault
                </span>
              </div>
            </div>

            {/* Product Preview Showcase */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-[#0b1220] p-5 text-white shadow-xl sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      Live Marketplace Workflow Preview
                    </p>
                    <h2 className="mt-1 font-display text-lg font-bold text-white">
                      BuildFest Campus AI Hackathon 2026
                    </h2>
                    <p className="text-xs text-slate-400">
                      CampusSpark Tech Society · Lahore · 450 Student Builders
                    </p>
                  </div>
                  <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                    96/100 Match
                  </Badge>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Matched Brand Partner
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-white">
                        Northstar Cloud &amp; DevTools
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                      Why this match works
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Strong alignment with Computer Science &amp; AI student builders, Lahore venue
                    presence, and developer workshop deliverables within target budget.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SAMPLE_WORKFLOW_FACTORS.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-2"
                      >
                        <p className="text-[10px] leading-tight text-slate-400">{item.label}</p>
                        <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
                          {item.score}/100
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {[
                    { tier: 'Bronze Supporter', price: '$500', note: 'Selected Tier' },
                    { tier: 'Silver Builder', price: '$1,500', note: 'Workshop + Booth' },
                    { tier: 'Gold Title', price: '$2,500', note: 'Headline Partner' },
                  ].map((pkg, idx) => (
                    <div
                      key={pkg.tier}
                      className={`rounded-xl border p-3 ${
                        idx === 0
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/60'
                      }`}
                    >
                      <p className="text-[11px] font-medium text-slate-300">{pkg.tier}</p>
                      <p className="mt-0.5 font-mono text-base font-bold text-white">{pkg.price}</p>
                      <p className="text-[10px] text-emerald-300">{pkg.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <span>PayPal Sandbox Checkout -&gt; Deliverables &amp; Proof Verified</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-300">Paid &amp; Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="mint">How It Works</Badge>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
              One structured workflow from campus pitch to verified fulfillment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Built for both student organizers seeking fair sponsorship tiers and brand teams who
              need accountable campus execution.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="h-full border-slate-200">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          STEP {item.step}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          {item.actor}
                        </span>
                      </div>
                      <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-base font-bold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Real Platform Features */}
        <section id="features" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <Badge variant="blue">Platform Capabilities</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                  Everything needed to launch, fund, and verify campus sponsorships
                </h2>
              </div>
              <Link href="/auth/sign-up" className={buttonClasses('outline', 'sm')}>
                Explore Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0b1220]">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-slate-950">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Two-Sided Marketplace Value */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-3xl bg-[#0b1220] p-8 text-white">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                  For University Organizers
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">
                  Stop cold-emailing mismatched companies with generic decks.
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      Generate editable Bronze, Silver, and Gold tiers tailored to your event size,
                      audience, and campus benefits.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      Rank verified sponsors by compatibility and draft custom proposal pitches in one
                      click.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      Receive PayPal Sandbox payments and build reusable proof portfolios for future
                      events.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-7">
                <Link
                  href="/auth/sign-up?role=organizer"
                  className={buttonClasses('secondary', 'md')}
                >
                  Start as an Organizer
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  For Brand Sponsors
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-slate-950">
                  Sponsor verified student events with clear deliverables and proof.
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Filter approved university events by city, audience focus, category, and
                      maximum budget.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Review factor-by-factor fit insights before accepting organizer invitations or
                      selecting a package tier.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Complete checkout via PayPal Sandbox, verify uploaded proof, and review
                      post-event fulfillment reports.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-7">
                <Link
                  href="/auth/sign-up?role=sponsor"
                  className={buttonClasses('primary', 'md')}
                >
                  Start as a Sponsor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Demo Events + Deliverable Preview */}
        <section id="demo-events" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Badge variant="mint">Live Marketplace Directory</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                  Featured University Events Ready for Sponsorship
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Sign in as a Sponsor to explore compatibility scores, inspect packages, send or
                  accept proposals, and run PayPal Sandbox checkout on these live demo listings.
                </p>
              </div>
              <Link href="/auth/sign-in" className={buttonClasses('outline', 'sm')}>
                Sign In to Discover
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {FEATURED_DEMO_EVENTS.map((ev) => (
                <Card key={ev.id} className="flex flex-col justify-between">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="blue">{ev.category}</Badge>
                        <span className="font-mono text-xs font-semibold text-emerald-700">
                          {ev.target}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold text-slate-950">
                        {ev.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {ev.society} · {ev.city} · {ev.attendees}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{ev.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {ev.packages.map((pkg) => (
                          <span
                            key={pkg}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {pkg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                      <span className="font-medium text-slate-500">{ev.startingTier}</span>
                      <Link
                        href={`/sponsor/events/${ev.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                      >
                        Inspect Event
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Product Preview: Post-Payment Fulfillment Accountability */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5">
                  <Badge variant="mint">Post-Payment Accountability</Badge>
                  <h3 className="mt-3 font-display text-xl font-bold text-slate-950">
                    Every sponsorship payment creates a trackable deliverable checklist
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Instead of vanishing after checkout, each agreed benefit becomes a deliverable
                    line item backed by organizer proof uploads, sponsor verification buttons, and an
                    evidence-based performance report.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:col-span-7">
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        Website &amp; Discord Logo
                      </span>
                      <Badge variant="mint">Verified</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Signed proof uploaded and approved by sponsor.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        Opening Ceremony Mention
                      </span>
                      <Badge variant="amber">Pending Proof</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Awaiting organizer stage photo or recap link.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        2 Social Spotlight Posts
                      </span>
                      <Badge variant="amber">Pending Proof</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Flagged clearly as unverified until proof arrives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#0b1220] px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Ready to connect your next campus event with aligned sponsors?
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Create an organizer or sponsor account to build packages, inspect match scores, and
                test end-to-end PayPal Sandbox checkout.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/sign-up" className={buttonClasses('secondary', 'lg')}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/sign-in"
                className={buttonClasses(
                  'outline',
                  'lg',
                  'border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
                )}
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
