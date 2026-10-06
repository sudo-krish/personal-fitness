import { DaySchedule, UserProfile } from '../../types/workout';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../../components/ui/Avatar';
import { Sun, Moon, Menu, Sparkles } from 'lucide-react';

interface WorkoutHeaderProps {
  schedule: DaySchedule;
  partner1?: UserProfile | null;
  partner2?: UserProfile | null;
  completedSets: number;
  totalSets: number;
  onOpenSidebar: () => void;
}

export function WorkoutHeader({
  schedule,
  partner1,
  partner2,
  completedSets,
  totalSets,
  onOpenSidebar,
}: WorkoutHeaderProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const p1Name = partner1?.name || 'Partner 1';
  const p2Name = partner2?.name || 'Partner 2';

  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <header className="w-full flex flex-col gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
      {/* Top Bar: Brand, Partner Switcher, Actions */}
      <div className="flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              Duo Fitness
            </span>
          </div>
        </div>

        {/* Partner Toggle & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Duo Partners Pill */}
          <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-1.5">
              <Avatar
                name={p1Name}
                emoji={partner1?.avatarEmoji || '⚡'}
                role="person_1"
                size="sm"
                className="w-5 h-5 text-xs"
              />
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 truncate max-w-[80px]">
                {p1Name}
              </span>
            </div>
            <span className="text-[11px] text-slate-300 dark:text-slate-600 font-bold">•</span>
            <div className="flex items-center gap-1.5">
              <Avatar
                name={p2Name}
                emoji={partner2?.avatarEmoji || '✨'}
                role="person_2"
                size="sm"
                className="w-5 h-5 text-xs"
              />
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 truncate max-w-[80px]">
                {p2Name}
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      {/* Split Info & Day Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {schedule.name} • {schedule.splitTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {schedule.focusDescription}
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
              {completedSets} / {totalSets} sets
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {pct}% finished
            </span>
          </div>

          <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
