import type { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: ReactNode;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: TabsProps<T>) {
  const sizeClasses = size === 'sm' ? 'p-1 text-xs' : 'p-1.5 text-sm';
  const itemPadding = size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2';

  return (
    <div
      role="tablist"
      className={`inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {items.map((tab) => {
        const isSelected = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 cursor-pointer select-none ${itemPadding} ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
