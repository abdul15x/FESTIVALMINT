'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { buttonClasses } from '@/components/ui/button';

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#how-it-works" className="hover:text-slate-950 transition-colors">
            How It Works
          </Link>
          <Link href="/#features" className="hover:text-slate-950 transition-colors">
            Features
          </Link>
          <Link href="/#demo-events" className="hover:text-slate-950 transition-colors">
            Explore Events
          </Link>
          <Link href="/sponsor/discover" className="hover:text-slate-950 transition-colors">
            Sponsor Portal
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/sign-in" className={buttonClasses('ghost', 'sm')}>
            Sign In
          </Link>
          <Link href="/auth/sign-up" className={buttonClasses('primary', 'sm')}>
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              How It Works
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              Features
            </Link>
            <Link
              href="/#demo-events"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              Explore Events
            </Link>
            <Link
              href="/sponsor/discover"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              Sponsor Portal
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/auth/sign-in"
                onClick={() => setMobileOpen(false)}
                className={buttonClasses('outline', 'md', 'w-full')}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                onClick={() => setMobileOpen(false)}
                className={buttonClasses('primary', 'md', 'w-full')}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

