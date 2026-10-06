import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'azure' | 'rose' | 'emerald' | 'amber' | 'neutral' | 'purple';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  let variantClasses = '';
  let dotColor = '';

  switch (variant) {
    case 'azure':
      variantClasses =
        'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
      dotColor = 'bg-sky-500';
      break;
    case 'rose':
      variantClasses =
        'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      dotColor = 'bg-rose-500';
      break;
    case 'emerald':
      variantClasses =
        'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      dotColor = 'bg-emerald-500';
      break;
    case 'amber':
      variantClasses =
        'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      dotColor = 'bg-amber-500';
      break;
    case 'purple':
      variantClasses =
        'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
      dotColor = 'bg-purple-500';
      break;
    case 'neutral':
      variantClasses =
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  );
}
