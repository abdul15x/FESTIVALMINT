'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  CalendarPlus,
  Sparkles,
  Handshake,
  Compass,
  CreditCard,
  ShieldCheck,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  organizer: [
    { href: '/organizer/dashboard', label: 'Command Center', icon: LayoutDashboard },
    { href: '/organizer/events/new', label: 'Create Event', icon: CalendarPlus },
    { href: '/organizer/matches', label: 'Sponsor Matches', icon: Sparkles },
    { href: '/organizer/proposals', label: 'Proposals & Deals', icon: Handshake },
    { href: '/settings/profile', label: 'Society Profile', icon: Settings },
  ],
  sponsor: [
    { href: '/sponsor/dashboard', label: 'Sponsor Overview', icon: LayoutDashboard },
    { href: '/sponsor/discover', label: 'Discover Events', icon: Compass },
    { href: '/sponsor/proposals', label: 'Proposals & Checkout', icon: CreditCard },
    { href: '/settings/profile', label: 'Brand Profile', icon: Settings },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/reviews', label: 'Verification Queue', icon: ShieldCheck },
    { href: '/admin/users', label: 'User Moderation', icon: Users },
    { href: '/settings/profile', label: 'Profile Settings', icon: Settings },
  ],
};

interface DashboardShellProps {
  role: UserRole;
  userName?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName = 'Workspace User',
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const items = ROLE_NAV[role];

  const roleBadgeLabel =
    role === 'organizer' ? 'Organizer' : role === 'sponsor' ? 'Sponsor' : 'University Admin';

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' });
    } finally {
      window.location.replace('/auth/sign-in');
    }
  }

  function renderNavContent(idSuffix: string) {
    return (
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          <div className="mb-6 flex items-center justify-between px-1">
            <BrandLogo />
          </div>

          <div className="mb-5 rounded-2xl border border-stone-200/90 bg-[#f7f6f2] px-3.5 py-3">
            <p className="text-xs font-medium text-stone-500">
              Active Workspace
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate font-display text-sm font-semibold text-[#0c121e]">
                {userName}
              </span>
              <Badge variant="mint" dot>
                {roleBadgeLabel}
              </Badge>
            </div>
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-[#0c121e]'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`sidebar-pill-${idSuffix}`}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#0c121e] shadow-sm"
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 h-4 w-4 shrink-0',
                      active ? 'text-emerald-400' : 'text-stone-500'
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1.5 border-t border-stone-200 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-[#0c121e] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Public Marketplace</span>
          </Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] lg:flex">
      <aside className="hidden w-68 shrink-0 border-r border-stone-200/90 bg-white lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{renderNavContent('desktop')}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/90 bg-white/95 px-4 backdrop-blur-sm lg:hidden">
          <BrandLogo compact />
          <div className="flex items-center gap-2">
            <Badge variant="mint" dot>
              {roleBadgeLabel}
            </Badge>
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label="Toggle dashboard menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-[#0c121e] cursor-pointer"
            >
              {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#0c121e]/45 backdrop-blur-[2px]"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-50 w-72 max-w-[85vw] bg-white shadow-2xl"
              >
                {renderNavContent('mobile')}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
