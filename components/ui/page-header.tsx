import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowTone?: 'mint' | 'amber' | 'neutral' | 'navy' | 'blue' | 'red';
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowTone = 'mint',
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <Badge variant={eyebrowTone} dot className="mb-2.5">
            {eyebrow}
          </Badge>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0c121e] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}

