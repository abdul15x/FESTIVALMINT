'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 18);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled
          ? 'border-b border-stone-200/90 bg-[#f7f6f2]/92 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(12,18,30,0.08)]'
          : 'border-b border-stone-200/50 bg-[#f7f6f2]/80 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <nav className="hidden items-center gap-1 rounded-full border border-stone-200/80 bg-white/80 px-2 py-1 text-sm font-medium text-stone-600 md:flex">
          <Link
            href="/#how-it-works"
            className="rounded-full px-3.5 py-1.5 hover:bg-stone-100 hover:text-[#0c121e] transition-colors"
          >
            Workflow
          </Link>
          <Link
            href="/#preview"
            className="rounded-full px-3.5 py-1.5 hover:bg-stone-100 hover:text-[#0c121e] transition-colors"
          >
            Product Tour
          </Link>
          <Link
            href="/#demo-events"
            className="rounded-full px-3.5 py-1.5 hover:bg-stone-100 hover:text-[#0c121e] transition-colors"
          >
            Featured Events
          </Link>
          <Link
            href="/sponsor/discover"
            prefetch={false}
            className="rounded-full px-3.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            Sponsor Portal
          </Link>
          <Link
            href="/pitch"
            className="rounded-full px-3.5 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Pitch Video
          </Link>
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-[#0c121e] hover:bg-stone-100 md:hidden cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-stone-200 bg-white md:hidden"
          >
            <div className="px-4 py-4">
              <nav className="flex flex-col gap-1 text-sm font-medium text-stone-700">
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 hover:bg-stone-100"
                >
                  Workflow
                </Link>
                <Link
                  href="/#preview"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 hover:bg-stone-100"
                >
                  Product Tour
                </Link>
                <Link
                  href="/#demo-events"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 hover:bg-stone-100"
                >
                  Featured Events
                </Link>
                <Link
                  href="/sponsor/discover"
                  prefetch={false}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Sponsor Portal
                </Link>
              </nav>
              <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
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
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
