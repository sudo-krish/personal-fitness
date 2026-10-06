import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

export type ButtonVariant = 'primary' | 'glass' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Pill button. `primary` is the solid sage CTA; `glass` is the frosted secondary control.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  let sizeClasses = 'h-[52px] px-6 text-[15px] gap-2';
  if (size === 'sm') sizeClasses = 'h-10 px-4 text-[13px] gap-1.5';
  if (size === 'icon') sizeClasses = 'size-11 justify-center';

  let variantClasses = 'bg-sage-300 text-ink hover:bg-sage-200 font-semibold';
  if (variant === 'glass') variantClasses = 'glass text-ink hover:bg-white/70 font-medium';
  if (variant === 'ghost') variantClasses = 'text-ink-muted hover:text-ink hover:bg-sunk font-medium';
  if (variant === 'danger') variantClasses = 'text-clay hover:bg-p2-tint/60 font-medium';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-full select-none cursor-pointer transition-[background-color,transform,color] duration-200 ease-(--ease-soft) active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
