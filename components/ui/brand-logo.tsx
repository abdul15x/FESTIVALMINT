import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
  dark?: boolean;
}

export function BrandLogo({ href = '/', compact = false, dark = false }: BrandLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group focus:outline-none">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-[1.03]',
          dark
            ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-400'
            : 'border-emerald-600/20 bg-[#0b1220] text-emerald-400 shadow-sm'
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v2a2 2 0 1 0 0 4v3A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-3a2 2 0 1 0 0-4v-2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M12 8.25 13.1 10.9 15.75 12 13.1 13.1 12 15.75 10.9 13.1 8.25 12 10.9 10.9 12 8.25Z"
            fill="#10B981"
          />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-base font-bold tracking-tight',
              dark ? 'text-white' : 'text-[#0b1220]'
            )}
          >
            FESTIVALMINT <span className="text-emerald-600">AI</span>
          </span>
          <span
            className={cn(
              'text-[10px] font-medium uppercase tracking-[0.14em]',
              dark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Sponsorship Network
          </span>
        </span>
      )}
    </Link>
  );
}

