import { Search, X } from 'lucide-react';

interface ExerciseSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  totalCount: number;
}

export function ExerciseSearchBar({
  value,
  onChange,
  totalCount,
}: ExerciseSearchBarProps) {
  return (
    <div className="relative w-full flex items-center">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
        <Search size={18} />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search 870+ exercises by name or keyword..."
        className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs transition-all"
      />

      <div className="absolute right-3.5 flex items-center gap-2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}

        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {totalCount}
        </span>
      </div>
    </div>
  );
}
