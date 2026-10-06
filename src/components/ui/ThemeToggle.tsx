import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { haptics } from '../../lib/haptics';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleToggle = () => {
    haptics.tap();
    toggleTheme();
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`glass inline-flex items-center justify-center gap-2 rounded-full p-2.5 text-ink hover:bg-surface/80 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs ${className}`}
    >
      <span className="relative flex items-center justify-center size-5">
        {isDark ? (
          <Sun className="size-4.5 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="size-4.5 text-sage-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold pr-1.5 capitalize">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
