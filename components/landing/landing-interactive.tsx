'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileBarChart2,
  Sparkles,
  Building2,
  GraduationCap,
  Lock,
  ArrowRight,
  Compass,
  UploadCloud,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import {
  AnimatedScoreBar,
  AnimatedScoreRing,
  SegmentedTabs,
} from '@/components/motion/primitives';
import { cn } from '@/lib/utils';

const HERO_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze Supporter',
    price: '$500',
    fitNote: 'Ideal for logo visibility & career booth trials',
    deliverables: [
      'Recruiting & API demo booth in main atrium',
      'Logo placement on stage banners & event site',
      'Social announcement post & Discord spotlight',
    ],
    status: 'Verified Demo Receipt ($500)',
  },
  {
    id: 'silver',
    name: 'Silver Builder Partner',
    price: '$1,500',
    fitNote: 'Recommended by profile alignment engine',
    deliverables: [
      '45-minute technical API workshop slot',
      'Sponsored judging track & mentor access',
      'Priority opt-in developer resume book + booth',
    ],
    status: 'Recommended for Cloud & DevTools',
  },
  {
    id: 'gold',
    name: 'Gold Title Sponsor',
    price: '$2,500',
    fitNote: 'Full naming rights & opening keynote stage',
    deliverables: [
      'Opening keynote address (15 min main hall)',
      'Exclusive Hackathon Challenge Track naming',
      'VIP campus recruiting reception + full recap reel',
    ],
    status: '1 of 1 Title Slot Remaining',
  },
] as const;

export function HeroLedgerShowcase() {
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'gold'>('silver');
  const current = HERO_TIERS.find((t) => t.id === selectedTier) ?? HERO_TIERS[1];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_20px_50px_-15px_rgba(12,18,30,0.14)]">
        {/* Top Ledger Chrome */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-[#0c121e] px-4 py-3.5 text-white sm:px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate font-mono text-xs text-slate-200">
              BuildFest Campus AI Hackathon 2026
            </span>
          </div>
          <Badge variant="navy" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
            96/100 Match
          </Badge>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-500">
                Sample Match · CampusSpark × Northstar Cloud
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-[#0c121e]">
                Inspect Package Terms &amp; Fit
              </h2>
            </div>
            <AnimatedScoreRing score={96} size={56} />
          </div>

          {/* Interactive Tier Switcher */}
          <div className="mt-4">
            <SegmentedTabs
              layoutId="hero-tier-switcher"
              value={selectedTier}
              onChange={setSelectedTier}
              className="w-full justify-between"
              items={[
                { id: 'bronze', label: 'Bronze', badge: '$500' },
                { id: 'silver', label: 'Silver', badge: '$1,500' },
                { id: 'gold', label: 'Gold', badge: '$2,500' },
              ]}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-stone-200 bg-[#faf9f6] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0c121e]">
                    {current.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">{current.fitNote}</p>
                </div>
                <span className="font-mono text-2xl font-bold text-[#0c121e] tabular-nums">
                  {current.price}
                </span>
              </div>

              <ul className="mt-3.5 space-y-2 border-t border-stone-200/80 pt-3">
                {current.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-mono text-stone-600">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Server-locked price &amp; deliverables
                </span>
                <Badge variant={selectedTier === 'bronze' ? 'mint' : 'amber'}>
                  {current.status}
                </Badge>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Compact Score Bars */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="mb-1 flex justify-between font-medium text-stone-700">
                <span>Audience Match</span>
                <span className="font-mono font-semibold text-emerald-700">98%</span>
              </div>
              <AnimatedScoreBar value={98} className="h-1.5" />
            </div>
            <div>
              <div className="mb-1 flex justify-between font-medium text-stone-700">
                <span>Budget Alignment</span>
                <span className="font-mono font-semibold text-emerald-700">95%</span>
              </div>
              <AnimatedScoreBar value={95} className="h-1.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGES = [
  {
    step: '01',
    role: 'Organizer',
    title: 'Publish Verified Campus Brief',
    summary:
      'Student societies capture attendee scale, demographics, campus city, dates, and target sponsorship goal, routed cleanly through university governance.',
    highlights: [
      'Society verification badge builds immediate corporate trust',
      'Structured audience tags replace messy PDF sponsorship decks',
      'Public discoverability stays gated until campus review approval',
    ],
    metricLabel: 'Average brief setup',
    metricValue: '4 minutes',
  },
  {
    step: '02',
    role: 'AI Package Studio',
    title: 'Draft & Tailor Multi-Tier Packages',
    summary:
      'Generate balanced Bronze, Silver, and Gold tiers calibrated to your expected attendance and category, then refine every price, benefit line, and slot.',
    highlights: [
      'Transparent pricing rationale attached to every suggested tier',
      'Full organizer editorial control before locking packages',
      'Category alignment tags guide brand discovery automatically',
    ],
    metricLabel: 'Structured output',
    metricValue: '3 to 4 Tiers',
  },
  {
    step: '03',
    role: 'Matching Engine',
    title: 'Evaluate 6-Factor Compatibility',
    summary:
      'Transparent scoring weighs audience fit (30%), industry alignment (20%), budget band (20%), location (15%), benefits, and timing, with plain-language fit notes.',
    highlights: [
      'No black-box rankings: every factor weight is inspectable',
      'Organizers generate tailored outreach briefs in one click',
      'Sponsors filter directly by campus city, track, and budget cap',
    ],
    metricLabel: 'Scoring dimensions',
    metricValue: '6 Factors',
  },
  {
    step: '04',
    role: 'Deal Desk',
    title: 'Negotiate & Lock Deliverable Snapshot',
    summary:
      'Proposals capture the exact package terms and deliverables snapshot at creation time so neither pricing nor benefits drift mid-negotiation.',
    highlights: [
      'Supports direct sponsor selection or organizer-initiated offers',
      'Change-request audit notes stay attached to the proposal thread',
      'Server-side ownership checks guard every state transition',
    ],
    metricLabel: 'Term drift risk',
    metricValue: '0%',
  },
  {
    step: '05',
    role: 'PayPal Sandbox',
    title: 'Complete Server-Verified Checkout',
    summary:
      'Idempotent PayPal Sandbox order creation reuses active pending orders and runs authoritative capture verification before creating deliverables.',
    highlights: [
      'Server-verified order amount & currency prevent client tampering',
      'Automatic deliverable checklist seeding immediately upon capture',
      'Complete payment receipt & capture ID stored permanently',
    ],
    metricLabel: 'Checkout protocol',
    metricValue: 'PayPal v2',
  },
  {
    step: '06',
    role: 'Proof Vault',
    title: 'Upload Proof & Compile Final Report',
    summary:
      'Organizers attach photos, recap documents, or live URLs into private storage; sponsors verify each deliverable and export an ROI fulfillment dossier.',
    highlights: [
      'Private signed-URL evidence locker per sponsorship deliverable',
      'Independent sponsor verification status (Verified / Flagged)',
      'Structured executive performance report for both stakeholders',
    ],
    metricLabel: 'Accountability',
    metricValue: '100% Proof',
  },
] as const;

export function SixStageStorytelling() {
  const [activeIdx, setActiveIdx] = useState(0);
  const stage = STAGES[activeIdx];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      {/* Left Interactive Index */}
      <div className="lg:col-span-5 space-y-2">
        {STAGES.map((item, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'w-full rounded-2xl border px-4 py-3.5 text-left transition-all cursor-pointer flex items-center justify-between gap-3',
                isActive
                  ? 'border-[#0c121e] bg-[#0c121e] text-white shadow-md'
                  : 'border-stone-200/90 bg-white text-[#0c121e] hover:border-stone-300 hover:bg-stone-50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold',
                    isActive ? 'bg-emerald-400 text-[#0c121e]' : 'bg-stone-100 text-stone-600'
                  )}
                >
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      isActive ? 'text-emerald-300' : 'text-stone-500'
                    )}
                  >
                    {item.role}
                  </p>
                  <p className="truncate font-display text-sm font-semibold">{item.title}</p>
                </div>
              </div>
              <ArrowRight
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform',
                  isActive ? 'translate-x-0.5 text-emerald-400' : 'text-stone-400'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Right Stage Dossier */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-[0_12px_36px_-16px_rgba(12,18,30,0.12)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-5">
              <div>
                <Badge variant="mint" dot>
                  Stage {stage.step} · {stage.role}
                </Badge>
                <h3 className="mt-3 font-display text-2xl font-bold text-[#0c121e]">
                  {stage.title}
                </h3>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] px-4 py-2.5 text-right">
                <p className="text-xs font-medium text-stone-500">
                  {stage.metricLabel}
                </p>
                <p className="font-mono text-base font-semibold text-emerald-700">
                  {stage.metricValue}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-stone-600 sm:text-base">
              {stage.summary}
            </p>

            <div className="mt-6 grid gap-3">
              {stage.highlights.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-3 rounded-xl border border-stone-200/75 bg-[#faf9f6] px-4 py-3 text-sm text-[#0c121e]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Step {activeIdx + 1} of {STAGES.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                  className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeIdx === STAGES.length - 1}
                  onClick={() => setActiveIdx((prev) => Math.min(STAGES.length - 1, prev + 1))}
                  className="rounded-xl bg-[#0c121e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#192338] disabled:opacity-40 cursor-pointer"
                >
                  Next Stage
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function InteractiveWorkspacePreview() {
  const [roleView, setRoleView] = useState<'organizer' | 'sponsor' | 'ledger'>('organizer');

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c121e] p-5 text-white shadow-2xl sm:p-8 bg-ledger-grid-dark">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge
            variant="navy"
            className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
            dot
          >
            Interactive Product Preview
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Two specialized portals. One verified transaction rail.
          </h2>
        </div>
        <SegmentedTabs
          dark
          layoutId="landing-workspace-preview"
          value={roleView}
          onChange={setRoleView}
          items={[
            {
              id: 'organizer',
              label: 'Organizer Studio',
              icon: <GraduationCap className="h-3.5 w-3.5" />,
            },
            {
              id: 'sponsor',
              label: 'Sponsor Discovery',
              icon: <Building2 className="h-3.5 w-3.5" />,
            },
            {
              id: 'ledger',
              label: 'Checkout & Proof',
              icon: <ShieldCheck className="h-3.5 w-3.5" />,
            },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        {roleView === 'organizer' && (
          <motion.div
            key="organizer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-6 grid gap-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400">ORGANIZER VIEW</span>
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">
                  Structure packages &amp; pitch qualified sponsors
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Manage active university events, refine Bronze/Silver/Gold tiers, compute sponsor
                  compatibility, and convert accepted deals into funded campus activations.
                </p>
                <div className="mt-5">
                  <Link
                    href="/auth/sign-up?role=organizer"
                    className={buttonClasses('secondary', 'sm')}
                  >
                    Create Organizer Account
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Funded</p>
                  <p className="mt-1 font-mono text-xl font-bold text-emerald-400">$500.00</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Open Tiers</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">3 Ready</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white p-5 text-[#0c121e]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div>
                  <p className="font-mono text-[11px] text-stone-500">EVENT PORTFOLIO SAMPLE</p>
                  <p className="font-display text-base font-bold">
                    BuildFest Campus AI Hackathon 2026
                  </p>
                </div>
                <Badge variant="mint" dot>
                  Approved
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {HERO_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className="rounded-xl border border-stone-200 bg-[#faf9f6] p-3.5"
                  >
                    <p className="text-xs font-semibold text-[#0c121e]">{tier.name}</p>
                    <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
                      {tier.price}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">{tier.deliverables[0]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-950">
                <span className="font-medium">Top Ranked Sponsor Match: Northstar Cloud &amp; DevTools</span>
                <span className="font-mono font-bold text-emerald-800">96 / 100 Fit</span>
              </div>
            </div>
          </motion.div>
        )}

        {roleView === 'sponsor' && (
          <motion.div
            key="sponsor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-6 grid gap-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400">SPONSOR VIEW</span>
                  <Compass className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">
                  Filter verified events by ROI &amp; audience fit
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Review campus events vetted by university admins, inspect transparent 6-factor fit
                  scores before committing, and select fixed-price tiers with clear deliverables.
                </p>
                <div className="mt-5">
                  <Link
                    href="/auth/sign-up?role=sponsor"
                    className={buttonClasses('secondary', 'sm')}
                  >
                    Join as Brand Sponsor
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white p-5 text-[#0c121e]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <p className="font-mono text-[11px] text-stone-500">COMPATIBILITY BREAKDOWN</p>
                  <p className="font-display text-base font-bold">Why BuildFest fits Northstar Cloud</p>
                </div>
                <Badge variant="mint">450 CS Builders · Lahore</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'Audience Alignment', score: 98 },
                  { name: 'Industry Fit', score: 100 },
                  { name: 'Budget Compatibility', score: 95 },
                  { name: 'Campus City & Timing', score: 92 },
                ].map((factor) => (
                  <div key={factor.name} className="rounded-xl border border-stone-200 p-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{factor.name}</span>
                      <span className="font-mono font-bold text-emerald-700">{factor.score}/100</span>
                    </div>
                    <AnimatedScoreBar value={factor.score} className="mt-2 h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {roleView === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-6 grid gap-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400">ESCROW &amp; PROOF</span>
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">
                  Server-verified PayPal Sandbox &amp; private evidence locker
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Every paid sponsorship unlocks deliverable checklists backed by signed-URL proof
                  files, sponsor verification sign-offs, and a structured fulfillment report.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white p-5 text-[#0c121e]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-display text-base font-bold">
                    Bronze Supporter · Captured Receipt
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-700">$500.00 USD</span>
              </div>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#faf9f6] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                    Logo placement on stage &amp; portal
                  </span>
                  <Badge variant="mint">Verified Proof</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#faf9f6] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <FileBarChart2 className="h-4 w-4 text-emerald-600" />
                    Fulfillment ROI Summary Generated
                  </span>
                  <Badge variant="blue">Signed URLs Ready</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

