import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#0b1220] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <BrandLogo dark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              AI-powered sponsorship marketplace connecting university societies and event
              organizers with compatible brand sponsors—with explainable matching, PayPal Sandbox
              checkout, and deliverable reporting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-white">Platform</p>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <Link href="/organizer/dashboard" className="hover:text-emerald-400">
                    Organizer Portal
                  </Link>
                </li>
                <li>
                  <Link href="/sponsor/discover" className="hover:text-emerald-400">
                    Sponsor Discovery
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="hover:text-emerald-400">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="hover:text-emerald-400">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Governance</p>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <Link href="/admin/dashboard" className="hover:text-emerald-400">
                    Admin Moderation
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-emerald-400">
                    Matching Model
                  </a>
                </li>
                <li>
                  <Link href="/api/health" className="hover:text-emerald-400">
                    System Health
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">Hackathon MVP Disclosures</p>
            <p className="mt-1.5">
              All checkout flows run exclusively on <strong>PayPal Sandbox</strong> against a
              single configured demo merchant account (no real funds, escrow, or multi-party
              settlement). AI pricing and match explanations rely solely on user-supplied facts and
              clearly label estimates.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>FESTIVALMINT AI — Build What&apos;s Next with PayPal and AI Hackathon Prototype.</p>
          <p>Built with Next.js, TypeScript, Supabase, PayPal Server SDK &amp; APIMatic Context Plugin.</p>
        </div>
      </div>
    </footer>
  );
}

