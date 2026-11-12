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
              AI-assisted university sponsorship marketplace connecting student societies and event
              organizers with relevant brand sponsors—from package creation and match insights to
              PayPal Sandbox checkout and proof-backed deliverable reporting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-white">Marketplace</p>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <Link href="/organizer/dashboard" prefetch={false} className="hover:text-emerald-400">
                    Organizer Portal
                  </Link>
                </li>
                <li>
                  <Link href="/sponsor/discover" prefetch={false} className="hover:text-emerald-400">
                    Sponsor Discovery
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="hover:text-emerald-400">
                    Get Started
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
              <p className="font-semibold text-white">Platform</p>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <Link href="/#how-it-works" className="hover:text-emerald-400">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="hover:text-emerald-400">
                    Capabilities
                  </Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" prefetch={false} className="hover:text-emerald-400">
                    Campus Governance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-200">PayPal Sandbox &amp; Verification Note</p>
            <p className="mt-1.5">
              All checkout flows in this environment run exclusively on{' '}
              <strong>PayPal Sandbox</strong> against a configured demo merchant account—no real
              funds are transferred. Package estimates and compatibility insights rely strictly on
              event and sponsor facts.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>FESTIVALMINT AI — University Event Sponsorship Marketplace.</p>
          <p>Structured packages, sponsor matching, PayPal Sandbox checkout &amp; proof tracking.</p>
        </div>
      </div>
    </footer>
  );
}
