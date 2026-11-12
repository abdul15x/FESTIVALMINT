import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileBarChart2,
  Building2,
  GraduationCap,
  Calendar,
  MapPin,
  Users,
} from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClasses } from '@/components/ui/button';

const SAMPLE_WORKFLOW_FACTORS = [
  { label: 'Audience Fit (30%)', score: 95 },
  { label: 'Industry Fit (20%)', score: 90 },
  { label: 'Budget Fit (20%)', score: 88 },
  { label: 'Location & Benefits (20%)', score: 85 },
];

const FEATURED_DEMO_EVENTS = [
  {
    title: 'BuildFest Campus AI Hackathon 2026',
    society: 'CampusSpark Tech Society (Demo)',
    category: 'Technology',
    city: 'Lahore, Pakistan',
    attendees: '450 builders (organizer est.)',
    target: '$4,500 target',
    tiers: 'Bronze $500 • Silver $1,500 • Gold $2,500',
  },
  {
    title: 'Campus Founders & FinTech Summit',
    society: 'CampusSpark Tech Society (Demo)',
    category: 'Business',
    city: 'Lahore, Pakistan',
    attendees: '300 attendees (organizer est.)',
    target: '$3,000 target',
    tiers: 'Partner tiers from $750',
  },
  {
    title: 'Autumn Cultural & Acoustic Night',
    society: 'Civic & Arts Guild (Demo)',
    category: 'Cultural',
    city: 'Lahore, Pakistan',
    attendees: '900 students (organizer est.)',
    target: '$2,500 target',
    tiers: 'Festival Stage Partner $1,000',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                AI-Powered University Sponsorship Marketplace
              </div>

              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-[#0b1220] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Great events deserve the{' '}
                <span className="text-emerald-600">right sponsors.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                FESTIVALMINT AI helps university societies turn event briefs into structured
                sponsorship packages, connects brands to high-fit student audiences with explainable
                match scores, completes checkout via PayPal Sandbox, and verifies post-event
                deliverables.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth/sign-up?role=organizer"
                  className={buttonClasses('primary', 'lg', 'w-full sm:w-auto')}
                >
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  Launch as Organizer
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/sign-up?role=sponsor"
                  className={buttonClasses('outline', 'lg', 'w-full sm:w-auto')}
                >
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Discover Events as Sponsor
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Matching
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    6-Factor Explainable Score
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Checkout
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    PayPal Sandbox Orders v2
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Accountability
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Evidence-Based AI Reports
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive-style Product Deal Preview Card */}
            <div className="lg:col-span-5">
              <Card className="border-slate-200 bg-white shadow-[0_18px_40px_-15px_rgba(11,18,32,0.12)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Sample Demo Workflow
                      </p>
                      <p className="mt-0.5 font-display text-base font-bold text-slate-900">
                        BuildFest Campus AI Hackathon
                      </p>
                    </div>
                    <Badge variant="mint">Verified Society (Demo)</Badge>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-emerald-900">
                          Recommended Sponsor: Northstar Cloud (Demo)
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Match score based on profile compatibility
                        </p>
                      </div>
                      <span className="font-mono text-2xl font-bold text-emerald-700">
                        91<span className="text-xs font-normal text-emerald-600">/100</span>
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {SAMPLE_WORKFLOW_FACTORS.map((factor) => (
                        <div key={factor.label}>
                          <div className="flex justify-between text-[11px] font-medium text-slate-700">
                            <span>{factor.label}</span>
                            <span className="font-mono">{factor.score}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${factor.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-slate-500">Suggested Package</p>
                      <p className="mt-1 font-semibold text-slate-900">Silver Builder Partner</p>
                      <p className="font-mono text-emerald-700">$1,500 USD (AI Draft)</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-slate-500">Checkout Flow</p>
                      <p className="mt-1 font-semibold text-slate-900">PayPal Sandbox</p>
                      <p className="font-mono text-slate-700">Server Capture + Webhook</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="navy">End-to-End Lifecycle</Badge>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 sm:text-3xl">
              From student event brief to verified fulfillment report
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Every stage is backed by relational PostgreSQL state, server-validated payments, and
              auditable AI reasoning.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'AI Package Generation',
                body: 'Organizers submit event reach, audience, and needs. AI drafts editable Bronze, Silver, and Gold tiers with transparent pricing assumptions.',
                icon: Sparkles,
              },
              {
                step: '02',
                title: 'Explainable Matching',
                body: 'A deterministic 6-factor model scores audience, industry, budget, location, benefits, and timing—then AI explains the fit and missing info.',
                icon: ShieldCheck,
              },
              {
                step: '03',
                title: 'Proposal & PayPal Sandbox',
                body: 'Sponsors review verified event proposals, accept terms, and complete server-verified PayPal Orders v2 Sandbox checkout.',
                icon: CreditCard,
              },
              {
                step: '04',
                title: 'Evidence & AI Report',
                body: 'Organizers upload deliverable proof to private storage; AI summarizes fulfilled vs. missing commitments without fabricating proof.',
                icon: FileBarChart2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        STEP {item.step}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Two-sided Value */}
        <section id="features" className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Card className="border-slate-200 bg-[#0b1220] text-white">
              <CardContent className="p-7 sm:p-8">
                <Badge variant="mint">For University Organizers</Badge>
                <h3 className="mt-4 font-display text-2xl font-bold">
                  Stop sending cold generic sponsor PDFs
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-300">
                  {[
                    'Turn event scope and student audience tags into structured sponsorship tiers',
                    'See ranked corporate sponsors with clear factor compatibility and missing data',
                    'Send trackable proposals and manage accepted deliverables in one workspace',
                    'Generate evidence-backed post-event sponsor reports in seconds',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Link
                    href="/organizer/dashboard"
                    className={buttonClasses('secondary', 'md')}
                  >
                    Open Organizer Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/70">
              <CardContent className="p-7 sm:p-8">
                <Badge variant="navy">For Brand Sponsors</Badge>
                <h3 className="mt-4 font-display text-2xl font-bold text-slate-950">
                  Discover vetted campus audiences that match your goals
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {[
                    'Filter admin-approved university events by category, city, and budget range',
                    'Inspect transparent match breakdowns—never opaque AI percentages',
                    'Accept, reject, or request changes on structured sponsorship proposals',
                    'Pay via PayPal Sandbox checkout and verify deliverable proof post-event',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Link href="/sponsor/discover" className={buttonClasses('primary', 'md')}>
                    Browse Approved Events
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Fictional Demo Events */}
        <section id="demo-events" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="amber">Fictional Demo Catalog</Badge>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-950 sm:text-3xl">
                Featured university events
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Sample campus events included in our seed dataset to demonstrate discovery and AI
                matching.
              </p>
            </div>
            <Link href="/sponsor/discover" className={buttonClasses('outline', 'md')}>
              Open Event Discovery
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {FEATURED_DEMO_EVENTS.map((ev) => (
              <Card key={ev.title} className="flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="mint">{ev.category}</Badge>
                    <span className="text-[11px] font-medium text-slate-400">Demo Listing</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-slate-950">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">{ev.society}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.attendees}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono text-slate-800">{ev.target}</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700">
                    {ev.tiers}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
