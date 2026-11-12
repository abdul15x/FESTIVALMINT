import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'mint' | 'navy' | 'amber' | 'red' | 'blue';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-stone-100 text-stone-700 border-stone-200/90',
  mint: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
  navy: 'bg-[#0c121e] text-white border-[#0c121e]',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/90',
  red: 'bg-rose-50 text-rose-700 border-rose-200/90',
  blue: 'bg-sky-50 text-sky-800 border-sky-200/90',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ className, variant = 'neutral', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-normal whitespace-nowrap',
        BADGE_CLASSES[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'mint'
              ? 'bg-emerald-500'
              : variant === 'amber'
                ? 'bg-amber-500'
                : variant === 'red'
                  ? 'bg-rose-500'
                  : variant === 'blue'
                    ? 'bg-sky-500'
                    : variant === 'navy'
                      ? 'bg-emerald-400'
                      : 'bg-stone-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
