import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface SwashProps {
  children: ReactNode;
  className?: string;
}

/** Wraps a word with a hand-drawn sage brush underline that draws in once. */
export function Swash({ children, className = '' }: SwashProps) {
  const reduce = useReducedMotion();
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.12em] left-[-4%] h-[0.32em] w-[108%] text-sage-300"
        fill="none"
      >
        <motion.path
          d="M3 13 C 40 6, 80 5, 118 9 S 176 15, 197 7"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </span>
  );
}
