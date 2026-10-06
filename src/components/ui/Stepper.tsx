import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit: string;
}

/** Frosted pill stepper. Long-press repeats after 400ms. */
export function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, unit }: StepperProps) {
  const repeatRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const nudge = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, +(valueRef.current + direction * step).toFixed(2)));
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
      haptics.tap();
    }
  };

  const stopRepeat = () => {
    if (repeatRef.current !== null) {
      window.clearTimeout(repeatRef.current);
      window.clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };

  const startRepeat = (direction: 1 | -1) => {
    stopRepeat();
    repeatRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => nudge(direction), 90);
    }, 400);
  };

  const buttonClasses =
    'size-10 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/80 active:scale-90 transition cursor-pointer disabled:opacity-30';

  return (
    <div className="glass rounded-full flex items-center justify-between gap-1 p-1 flex-1 min-w-0" role="group" aria-label={label}>
      <button
        type="button"
        className={buttonClasses}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => nudge(-1)}
        onPointerDown={() => startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Minus size={16} />
      </button>
      <div className="flex items-baseline gap-1 tabular-nums" aria-live="polite">
        <span className="text-xl font-semibold text-ink">{value}</span>
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
      <button
        type="button"
        className={buttonClasses}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => nudge(1)}
        onPointerDown={() => startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
