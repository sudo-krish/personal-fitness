import { Clock, X } from 'lucide-react';

interface RestTimerHUDProps {
  secondsRemaining: number;
  isRunning: boolean;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

export function RestTimerHUD({
  secondsRemaining,
  isRunning,
  onAdjust,
  onSkip,
}: RestTimerHUDProps) {
  if (!isRunning && secondsRemaining <= 0) {
    return null;
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between p-3.5 px-5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl">
        {/* Left: Clock Icon & Timer */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Rest Timer
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-white">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAdjust(15)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-all"
            aria-label="Add 15 seconds"
          >
            +15s
          </button>

          <button
            type="button"
            onClick={() => onAdjust(30)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-all"
            aria-label="Add 30 seconds"
          >
            +30s
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer active:scale-95 transition-all ml-1"
            title="Skip Rest"
            aria-label="Skip rest timer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
