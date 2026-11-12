import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0c121e] text-white hover:bg-[#192338] active:scale-[0.99] focus-visible:ring-[#0c121e] shadow-[0_1px_2px_rgba(12,18,30,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]',
  secondary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] focus-visible:ring-emerald-600 shadow-[0_1px_2px_rgba(5,150,105,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]',
  outline:
    'border border-stone-300/90 bg-white text-[#0c121e] hover:border-stone-400 hover:bg-stone-50 active:scale-[0.99] focus-visible:ring-stone-400 shadow-[0_1px_1px_rgba(12,18,30,0.03)]',
  ghost:
    'text-stone-700 hover:bg-stone-200/60 hover:text-[#0c121e] focus-visible:ring-stone-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99] focus-visible:ring-rose-600 shadow-sm',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string
) {
  return cn(
    'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f2] whitespace-nowrap',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses(variant, size, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
