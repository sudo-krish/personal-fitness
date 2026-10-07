import type { ReactNode } from 'react';
import { formatVolume, toDateStr, weekStart } from '../../lib/progressStats';

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  hintTone?: 'up' | 'down' | 'neutral';
}

/** Compact metric tile for the dashboard strip. */
export function StatTile({ icon, label, value, hint, hintTone = 'neutral' }: StatTileProps) {
  return (
    <div className="rounded-[20px] bg-surface/80 border border-hairline p-3.5 flex flex-col gap-1.5 min-w-0">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        <span className="text-sage-700" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <span className="font-display text-[26px] leading-none text-ink tabular-nums truncate">{value}</span>
      {hint && (
        <span
          className={`text-[11px] font-medium truncate ${
            hintTone === 'up' ? 'text-sage-700' : hintTone === 'down' ? 'text-clay' : 'text-ink-muted'
          }`}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

interface VolumeBarsProps {
  weeks: Array<{ weekStart: string; volumeKg: number; sets: number }>;
}

/** Weekly tonnage bars, oldest → newest; the current week is highlighted. */
export function VolumeBars({ weeks }: VolumeBarsProps) {
  const max = Math.max(1, ...weeks.map(w => w.volumeKg));
  return (
    <div className="flex items-end gap-2 h-32" role="img" aria-label={`Weekly volume: ${weeks.map(w => formatVolume(w.volumeKg)).join(', ')}`}>
      {weeks.map((w, i) => {
        const isCurrent = i === weeks.length - 1;
        const h = Math.max(4, (w.volumeKg / max) * 100);
        const d = new Date(`${w.weekStart}T00:00:00`);
        return (
          <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className={`text-[10px] font-mono tabular-nums ${isCurrent ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
              {w.volumeKg > 0 ? formatVolume(w.volumeKg) : ''}
            </span>
            <div
              className={`w-full rounded-t-[10px] rounded-b-[4px] transition-[height] duration-700 ease-(--ease-soft) ${
                isCurrent ? 'bg-gradient-to-t from-sage-500 to-sage-300' : 'bg-sage-200/70'
              }`}
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-ink-muted tabular-nums">
              {isCurrent ? 'Now' : `${d.getDate()}/${d.getMonth() + 1}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ConsistencyGridProps {
  trainedDates: Set<string>;
  restDayKeys: string[];
  weeks?: number;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Week-rows × weekday-columns heatmap of trained days. */
export function ConsistencyGrid({ trainedDates, restDayKeys, weeks = 5 }: ConsistencyGridProps) {
  const today = toDateStr(new Date());
  return (
    <div className="flex flex-col gap-1.5" role="grid" aria-label="Training consistency, last weeks">
      <div className="grid grid-cols-7 gap-1.5" role="row">
        {DAY_LETTERS.map((l, i) => (
          <span key={i} role="columnheader" className="text-center text-[10px] font-semibold text-ink-muted">
            {l}
          </span>
        ))}
      </div>
      {Array.from({ length: weeks }).map((_, wi) => {
        const start = weekStart(new Date(), weeks - 1 - wi);
        return (
          <div key={wi} className="grid grid-cols-7 gap-1.5" role="row">
            {DAY_NAMES.map((name, di) => {
              const date = toDateStr(new Date(start.getFullYear(), start.getMonth(), start.getDate() + di));
              const trained = trainedDates.has(date);
              const isRest = restDayKeys.includes(name);
              const isFuture = date > today;
              const isToday = date === today;
              return (
                <span
                  key={date}
                  role="gridcell"
                  aria-label={`${date}: ${trained ? 'trained' : isRest ? 'rest day' : isFuture ? 'upcoming' : 'missed'}`}
                  className={`aspect-square rounded-[8px] transition-colors ${
                    trained
                      ? 'bg-sage-500'
                      : isFuture
                        ? 'bg-transparent border border-dashed border-ink/10'
                        : isRest
                          ? 'bg-sunk/60'
                          : 'bg-sunk'
                  } ${isToday ? 'ring-2 ring-ink/40 ring-offset-1 ring-offset-surface' : ''}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
