import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const TONE_STYLES: Record<AlertTone, { box: string; icon: React.ReactNode }> = {
  info: {
    box: 'border-sky-200 bg-sky-50/75 text-sky-950 border-l-4 border-l-sky-600',
    icon: <Info className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50/80 text-emerald-950 border-l-4 border-l-emerald-600',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50/85 text-amber-950 border-l-4 border-l-amber-500',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />,
  },
  error: {
    box: 'border-rose-200 bg-rose-50/85 text-rose-950 border-l-4 border-l-rose-600',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        style.box,
        className
      )}
    >
      {style.icon}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-stone-200/80', className)} />;
}
