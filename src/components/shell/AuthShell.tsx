import type { ReactNode } from 'react';
import { Contours } from '../art/Contours';

interface AuthShellProps {
  children: ReactNode;
  imageSrc?: string;
  tagline?: string;
}

/**
 * Full-bleed auth layout: photo panel beside the form on ≥md,
 * photo backdrop with a canvas fade behind the form on mobile.
 */
export function AuthShell({
  children,
  imageSrc = '/assets/partner-training.jpg',
  tagline = 'Two people. One plan. Every set counted.',
}: AuthShellProps) {
  return (
    <div className="min-h-dvh w-full bg-canvas md:grid md:grid-cols-[1.1fr_1fr] relative overflow-hidden">
      {/* Photo panel */}
      <div className="absolute inset-x-0 top-0 h-[46dvh] md:relative md:h-auto md:min-h-dvh">
        <img src={imageSrc} alt="" aria-hidden className="absolute inset-0 size-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-canvas/30 to-canvas md:bg-gradient-to-r md:from-ink/40 md:via-ink/10 md:to-transparent" />
        <div className="hidden md:flex absolute inset-x-10 bottom-10 flex-col gap-2 text-white">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Duo training log</span>
          <p className="font-display text-4xl leading-tight max-w-md">{tagline}</p>
        </div>
      </div>

      {/* Form panel */}
      <main className="relative z-10 flex min-h-dvh items-end md:items-center justify-center px-5 pb-8 pt-[30dvh] md:p-12">
        <Contours seed="auth" lines={6} drift className="text-ink/5 hidden md:block" />
        <div className="relative w-full max-w-[400px] animate-rise">{children}</div>
      </main>
    </div>
  );
}
