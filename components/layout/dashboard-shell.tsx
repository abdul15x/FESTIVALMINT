'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    { href: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizer/events/new', label: 'Create Event', icon: CalendarPlus },
    { href: '/organizer/matches', label: 'Sponsor Matches', icon: Sparkles },
    { href: '/organizer/proposals', label: 'Proposals & Deals', icon: Handshake },
    { href: '/settings/profile', label: 'Society Profile', icon: Settings },
  ],
  sponsor: [
    { href: '/sponsor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const items = ROLE_NAV[role];

  const roleBadgeLabel =
    role === 'organizer' ? 'Organizer' : role === 'sponsor' ? 'Sponsor' : 'University Admin';

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' });
    } finally {
      router.push('/auth/sign-in');
      router.refresh();
    }
  }

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 flex items-center justify-between px-1">
          <BrandLogo />
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-900">{userName}</span>
            <Badge variant="mint">{roleBadgeLabel}</Badge>
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#0b1220] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    active ? 'text-emerald-400' : 'text-slate-500'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-1 border-t border-slate-200 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Public Marketplace</span>
        </Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{navContent}</div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <BrandLogo compact />
          <div className="flex items-center gap-2">
            <Badge variant="mint">{roleBadgeLabel}</Badge>
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label="Toggle dashboard menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            >
              {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-950/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 w-72 max-w-[85vw] bg-white shadow-xl">
              {navContent}
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
