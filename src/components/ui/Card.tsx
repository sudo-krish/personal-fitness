import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'plain' | 'tinted';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children?: ReactNode;
}

/** Base surface. `tinted` is the sage-50 focus card used once per page. */
export function Card({ variant = 'plain', className = '', children, ...props }: CardProps) {
  const variantClasses =
    variant === 'tinted'
      ? 'bg-sage-50 border border-sage-100'
      : 'bg-surface border border-hairline shadow-card';

  return (
    <div className={`rounded-(--radius-card) ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
