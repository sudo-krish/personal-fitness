import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'glass' | 'subtle' | 'elevated' | 'cyber';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  let variantClasses = '';
  switch (variant) {
    case 'default':
      variantClasses =
        'bg-white border border-slate-200/90 shadow-sm dark:bg-[#060b07] dark:border-emerald-500/20 dark:shadow-[0_4px_24px_rgba(0,0,0,0.8)]';
      break;
    case 'glass':
      variantClasses =
        'bg-white/85 backdrop-blur-xl border border-white/80 shadow-md dark:bg-[#060b07]/80 dark:backdrop-blur-xl dark:border-emerald-500/25 dark:shadow-[0_12px_36px_rgba(0,0,0,0.95)]';
      break;
    case 'subtle':
      variantClasses =
        'bg-slate-50 border border-slate-100 dark:bg-[#0a120c]/60 dark:border-emerald-500/15';
      break;
    case 'elevated':
      variantClasses =
        'bg-white border border-slate-200/80 shadow-xl dark:bg-[#0b140d] dark:border-emerald-500/30 dark:shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(0,255,102,0.08)]';
      break;
    case 'cyber':
      variantClasses =
        'bg-white border-2 border-emerald-500/40 shadow-lg dark:bg-[#050906] dark:border-emerald-400/60 dark:shadow-[0_0_25px_rgba(0,255,102,0.22)]';
      break;
  }

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-400 dark:hover:shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all duration-200 active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 ${variantClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

