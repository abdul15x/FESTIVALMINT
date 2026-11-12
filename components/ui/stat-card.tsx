import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'mint' | 'amber' | 'dark';
  className?: string;
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 transition-colors',
        tone === 'dark'
          ? 'border-[#0c121e] bg-[#0c121e] text-white shadow-sm'
          : tone === 'mint'
            ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/75 via-white to-white text-[#0c121e]'
            : tone === 'amber'
              ? 'border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-white text-[#0c121e]'
              : 'border-stone-200/90 bg-white text-[#0c121e]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'text-xs font-medium',
            tone === 'dark' ? 'text-slate-400' : 'text-stone-500'
          )}
        >
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border',
              tone === 'dark'
                ? 'border-white/10 bg-white/5 text-emerald-400'
                : tone === 'mint'
                  ? 'border-emerald-200 bg-emerald-100/70 text-emerald-700'
                  : tone === 'amber'
                    ? 'border-amber-200 bg-amber-100/70 text-amber-700'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">
        {value}
      </p>
      {detail && (
        <p
          className={cn(
            'mt-1.5 text-xs',
            tone === 'dark' ? 'text-slate-400' : 'text-stone-500'
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

