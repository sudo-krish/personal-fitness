import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  label,
  size = 'md',
}: StepperProps) {
  const timerRef = useRef<number | null>(null);

  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));
    onChange(next);
  };

  const startHold = (action: () => void) => {
    action();
    timerRef.current = window.setInterval(action, 120);
  };

  const stopHold = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  let btnSize = 'w-9 h-9 text-base rounded-xl';
  let textSize = 'text-base font-bold min-w-[54px]';
  if (size === 'sm') {
    btnSize = 'w-7 h-7 text-sm rounded-lg';
    textSize = 'text-xs font-semibold min-w-[42px]';
  } else if (size === 'lg') {
    btnSize = 'w-11 h-11 text-lg rounded-2xl';
    textSize = 'text-lg font-extrabold min-w-[64px]';
  }

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {label && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </span>
      )}
      <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <button
          type="button"
          disabled={value <= min}
          onMouseDown={() => startHold(handleDecrement)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(handleDecrement)}
          onTouchEnd={stopHold}
          className={`${btnSize} flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-xs`}
          aria-label="Decrement value"
        >
          <Minus size={size === 'sm' ? 14 : 16} />
        </button>

        <div className={`text-center ${textSize} text-slate-900 dark:text-white font-mono`}>
          <span>{value}</span>
          {unit && (
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-0.5">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={value >= max}
          onMouseDown={() => startHold(handleIncrement)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold(handleIncrement)}
          onTouchEnd={stopHold}
          className={`${btnSize} flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-xs`}
          aria-label="Increment value"
        >
          <Plus size={size === 'sm' ? 14 : 16} />
        </button>
      </div>
    </div>
  );
}
