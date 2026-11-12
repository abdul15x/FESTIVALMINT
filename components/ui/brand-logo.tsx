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
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-[1.04]',
          dark
            ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-emerald-700/20 bg-[#0c121e] text-emerald-400 shadow-sm'
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
              'font-display text-[15px] font-bold tracking-tight',
              dark ? 'text-white' : 'text-[#0c121e]'
            )}
          >
            FESTIVALMINT{' '}
            <span className={dark ? 'text-emerald-400' : 'text-emerald-700'}>AI</span>
          </span>
          <span
            className={cn(
              'mt-0.5 text-[11px] font-medium tracking-wide',
              dark ? 'text-slate-300' : 'text-stone-600'
            )}
          >
            Campus Exchange
          </span>
        </span>
      )}
    </Link>
  );
}
