import { motion } from 'motion/react';
import { Sun, Dumbbell, LibraryBig, Settings2, type LucideIcon } from 'lucide-react';
import type { AppRoute } from '../../router/routes';
import { haptics } from '../../lib/haptics';

interface DockItem {
  route: AppRoute;
  label: string;
  Icon: LucideIcon;
}

const DOCK_ITEMS: DockItem[] = [
  { route: '/', label: 'Today', Icon: Sun },
  { route: '/train', label: 'Train', Icon: Dumbbell },
  { route: '/library', label: 'Library', Icon: LibraryBig },
  { route: '/settings', label: 'Settings', Icon: Settings2 },
];

interface BottomDockProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  trainInProgress?: boolean;
}

/** The only navigation surface. Frosted pill with a sliding sage active pill. */
export function BottomDock({ activeRoute, onNavigate, trainInProgress = false }: BottomDockProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'max(16px, var(--safe-bottom))' }}
    >
      <ul className="glass-strong pointer-events-auto flex h-16 w-full max-w-[400px] items-center justify-between rounded-full p-1.5">
        {DOCK_ITEMS.map(({ route, label, Icon }) => {
          const active = route === activeRoute;
          return (
            <li key={route} className={active ? 'flex-[1.6]' : 'flex-1'}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                onClick={() => {
                  if (!active) {
                    haptics.tap();
                    onNavigate(route);
                  }
                }}
                className={`relative flex h-[52px] w-full items-center justify-center gap-2 rounded-full cursor-pointer transition-colors ${
                  active ? 'text-sage-700' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-full bg-sage-100"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <Icon size={21} strokeWidth={active ? 2 : 1.6} />
                  {route === '/train' && trainInProgress && !active && (
                    <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-sage-500 ring-2 ring-white" />
                  )}
                </span>
                {active && <span className="relative text-[13px] font-semibold">{label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
