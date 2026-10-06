import { DAY_SCHEDULES } from '../../data/initialWorkoutPlan';
import { Leaf } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface WeekThreadProps {
  selectedDayKey: string;
  todayKey: string;
  completionStatus: Record<string, boolean>;
  onSelectDay: (dayKey: string) => void;
}

/** 7-day drawn thread with node indicators (spec §3.2 T6). */
export function WeekThread({
  selectedDayKey,
  todayKey,
  completionStatus,
  onSelectDay,
}: WeekThreadProps) {
  return (
    <div className="relative w-full py-4 px-2 select-none" role="tablist" aria-label="Days of the week">
      {/* Connecting baseline */}
      <div className="absolute top-1/2 left-6 right-6 h-[1.5px] -translate-y-1/2 bg-ink/10" aria-hidden />

      <div className="relative flex items-center justify-between">
        {DAY_SCHEDULES.map((day) => {
          const isSelected = day.key === selectedDayKey;
          const isToday = day.key === todayKey;
          const isDone = Boolean(completionStatus[day.key]);

          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                haptics.tap();
                onSelectDay(day.key);
              }}
              className="group relative flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              {/* Day initial */}
              <span
                className={`text-[11px] font-semibold tracking-wider transition-colors ${
                  isSelected ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {day.shortName[0]}
              </span>

              {/* Node glyph */}
              <div
                className={`relative flex size-7 items-center justify-center rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-sage-500 ring-offset-2 ring-offset-canvas scale-110'
                    : 'group-hover:scale-105'
                }`}
              >
                {day.isRest ? (
                  <span
                    className={`flex size-6 items-center justify-center rounded-full ${
                      isSelected ? 'bg-sage-100 text-sage-700' : 'bg-surface text-ink-muted/60 border border-hairline'
                    }`}
                  >
                    <Leaf size={11} strokeWidth={2} />
                  </span>
                ) : isDone ? (
                  <span className="size-5 rounded-full bg-sage-300 border border-sage-500 shadow-xs flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-sage-700" />
                  </span>
                ) : (
                  <span
                    className={`size-4 rounded-full border transition-all ${
                      isSelected
                        ? 'border-sage-500 bg-sage-100'
                        : isToday
                        ? 'border-ink/40 bg-surface'
                        : 'border-ink/20 bg-surface/80'
                    }`}
                  />
                )}
              </div>

              {/* Current day soft indicator */}
              {isToday && (
                <span className="absolute -bottom-1 size-1 rounded-full bg-sage-500" aria-label="Today" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
