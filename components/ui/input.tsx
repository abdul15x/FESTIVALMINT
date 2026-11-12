import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-[#0c121e] placeholder:text-stone-400 transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:bg-stone-100/70',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[96px] w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-[#0c121e] placeholder:text-stone-400 transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:bg-stone-100/70',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-[#0c121e] transition-all focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:bg-stone-100/70',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'block text-xs font-medium text-stone-700 mb-1.5',
        className
      )}
      {...props}
    />
  );
}
