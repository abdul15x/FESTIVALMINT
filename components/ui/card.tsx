import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(12,18,30,0.035),0_4px_12px_-4px_rgba(12,18,30,0.04)]',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_10px_28px_-10px_rgba(12,18,30,0.12)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3 sm:px-6 sm:pt-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-base font-semibold text-[#0c121e] sm:text-lg', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-stone-600 leading-relaxed', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />;
}
