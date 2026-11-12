import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const TONE_STYLES: Record<AlertTone, { box: string; icon: React.ReactNode }> = {
  info: {
    box: 'border-blue-200 bg-blue-50/70 text-blue-900',
    icon: <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50/80 text-emerald-950',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50/80 text-amber-950',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />,
  },
  error: {
    box: 'border-red-200 bg-red-50/80 text-red-950',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />,
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
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} />;
}

