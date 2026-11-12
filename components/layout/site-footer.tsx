import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-300/80 bg-[#0c121e] text-slate-300 bg-ledger-grid-dark">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <BrandLogo dark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Campus sponsorship exchange connecting verified university societies with brand
              partners, from structured tier design and match insights to PayPal Sandbox checkout and
              proof-backed fulfillment reports.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm lg:col-span-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Portals
              </p>
              <ul className="mt-3.5 space-y-2.5 text-slate-400">
                <li>
                  <Link
                    href="/organizer/dashboard"
                    prefetch={false}
                    className="hover:text-white transition-colors"
                  >
                    Organizer Studio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sponsor/discover"
                    prefetch={false}
                    className="hover:text-white transition-colors"
                  >
                    Sponsor Discovery
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="hover:text-white transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Architecture
              </p>
              <ul className="mt-3.5 space-y-2.5 text-slate-400">
                <li>
                  <Link href="/#how-it-works" className="hover:text-white transition-colors">
                    6-Stage Lifecycle
                  </Link>
                </li>
                <li>
                  <Link href="/#preview" className="hover:text-white transition-colors">
                    Interactive Preview
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="hover:text-white transition-colors">
                    Trust &amp; Proof Ledger
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard"
                    prefetch={false}
                    className="hover:text-white transition-colors"
                  >
                    Campus Governance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 text-xs leading-relaxed text-slate-400 backdrop-blur-xs">
            <p className="font-semibold text-white">PayPal Sandbox &amp; Data Integrity</p>
            <p className="mt-2">
              All payments in this environment execute in <strong className="text-slate-200">PayPal Sandbox</strong> against a server-verified merchant order lifecycle; no real money is transferred. Match explanations and package recommendations use grounded event and sponsor records.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p className="font-mono">FESTIVALMINT AI · University Sponsorship Exchange</p>
          <p>Structured packages · Transparent compatibility · PayPal Sandbox · Proof Vault</p>
        </div>
      </div>
    </footer>
  );
}
