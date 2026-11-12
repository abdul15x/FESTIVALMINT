import * as React from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-[#faf9f6] px-6 py-10 text-center',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 shadow-xs">
        {icon}
      </div>
      <h3 className="mt-3.5 font-display text-base font-semibold text-[#0c121e]">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-stone-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

