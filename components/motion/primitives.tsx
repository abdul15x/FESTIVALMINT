'use client';

import * as React from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
  immediate = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  immediate?: boolean;
}) {
  if (immediate) {
    return (
      <motion.div
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay, ease: EASE_EDITORIAL }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.44, delay, ease: EASE_EDITORIAL }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  immediate = false,
}: {
  children: React.ReactNode;
  className?: string;
  immediate?: boolean;
}) {
  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  if (immediate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.36, ease: EASE_EDITORIAL },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  layoutId,
  className,
  dark = false,
}: {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  layoutId: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl p-1 border',
        dark
          ? 'border-white/15 bg-white/5'
          : 'border-stone-200/90 bg-[#efede6]',
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600',
              active
                ? dark
                  ? 'text-[#0c121e]'
                  : 'text-[#0c121e]'
                : dark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-stone-600 hover:text-[#0c121e]'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={cn(
                  'absolute inset-0 rounded-xl shadow-sm',
                  dark ? 'bg-emerald-400' : 'bg-white border border-stone-200/80'
                )}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium',
                    active
                      ? dark
                        ? 'bg-[#0c121e]/15 text-[#0c121e]'
                        : 'bg-emerald-50 text-emerald-800'
                      : dark
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-stone-200/70 text-stone-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AnimatedScoreBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-stone-200/80', className)}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: EASE_EDITORIAL }}
        style={{ width: `${pct}%`, transformOrigin: 'left center' }}
        className={cn('h-full rounded-full bg-emerald-600', barClassName)}
      />
    </div>
  );
}

export function AnimatedScoreRing({
  score,
  size = 64,
  strokeWidth = 5,
  dark = false,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  dark?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Compatibility score ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,0.12)' : '#e7e5de'}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={clamped >= 80 ? '#10b981' : clamped >= 60 ? '#059669' : '#d97706'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: EASE_EDITORIAL }}
        />
      </svg>
      <span
        className={cn(
          'absolute font-mono text-xs font-bold tabular-nums',
          dark ? 'text-white' : 'text-[#0c121e]'
        )}
      >
        {clamped}
      </span>
    </div>
  );
}

export function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-[#0c121e]/45 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: EASE_EDITORIAL }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-stone-200 bg-[#f7f6f2] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-[#0c121e]">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-stone-600">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

