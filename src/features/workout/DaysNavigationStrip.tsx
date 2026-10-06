import { DAY_SCHEDULES } from '../../data/initialWorkoutPlan';
import { Check } from 'lucide-react';

interface DaysNavigationStripProps {
  selectedDayKey: string;
  todayKey: string;
  completionStatus: Record<string, boolean>;
  onSelectDay: (dayKey: string) => void;
}

export function DaysNavigationStrip({
  selectedDayKey,
  todayKey,
  completionStatus,
  onSelectDay,
}: DaysNavigationStripProps) {
  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none select-none">
      {DAY_SCHEDULES.map((day) => {
        const isSelected = day.key === selectedDayKey;
        const isToday = day.key === todayKey;
        const isDone = completionStatus[day.key];

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelectDay(day.key)}
            className={`flex-1 min-w-[70px] py-2.5 px-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border relative ${
              isSelected
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md font-bold'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {/* Today indicator dot */}
            {isToday && (
              <span
                className={`absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-sky-400 dark:bg-sky-500' : 'bg-sky-500'
                }`}
              />
            )}

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wider">
                {day.shortName}
              </span>
              {isDone && <Check size={12} className="stroke-[3] text-emerald-400" />}
            </div>
            <span className={`text-[10px] mt-0.5 truncate max-w-[65px] ${isSelected ? 'opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>
              {day.isRest ? 'Rest' : day.splitTitle.split('(')[0]?.trim()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
