import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'azure' | 'rose' | 'emerald';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Base sizing
  let sizeClasses = 'px-4 py-2.5 text-sm gap-2 rounded-xl';
  if (size === 'sm') sizeClasses = 'px-3 py-1.5 text-xs gap-1.5 rounded-lg';
  if (size === 'lg') sizeClasses = 'px-6 py-3.5 text-base gap-2.5 rounded-2xl font-semibold';
  if (size === 'icon') sizeClasses = 'p-2.5 rounded-xl aspect-square flex items-center justify-center';

  // Variant classes
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100';
      break;
    case 'secondary':
      variantClasses =
        'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 active:scale-[0.98] dark:bg-slate-800/80 dark:text-slate-100 dark:border-slate-700/80 dark:hover:bg-slate-700';
      break;
    case 'ghost':
      variantClasses =
        'bg-transparent text-slate-600 hover:bg-slate-100 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800/60';
      break;
    case 'danger':
      variantClasses =
        'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-[0.98] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-900/40';
      break;
    case 'azure':
      variantClasses =
        'bg-sky-500 text-white hover:bg-sky-600 active:scale-[0.98] shadow-sm shadow-sky-500/20';
      break;
    case 'rose':
      variantClasses =
        'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] shadow-sm shadow-rose-500/20';
      break;
    case 'emerald':
      variantClasses =
        'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm shadow-emerald-500/20';
      break;
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
