import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Dumbbell,
  Database,
  ChevronRight,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../../lib/haptics';
import { AppRoute } from '../../router/routes';
import { UserProfile } from '../../types/workout';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface SidebarNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activePath: AppRoute;
  onNavigate: (path: AppRoute) => void;
  profiles?: UserProfile[];
  onSeedPlan?: () => void;
}

export function SidebarNavigation({
  isOpen,
  onClose,
  activePath,
  onNavigate,
  profiles,
  onSeedPlan,
}: SidebarNavigationProps) {
  const { user, partner, logout, isAuthenticated } = useAuth();
  const isPrimary = user?.isPrimary ?? true;
  const p1 = isPrimary ? user : partner;
  const p2 = isPrimary ? partner : user;
  const p1Name = p1?.name || profiles?.[0]?.name || 'Partner 1';
  const p1Emoji = p1?.avatarEmoji || profiles?.[0]?.avatarEmoji || '⚡';
  const p2Name = p2?.name || profiles?.[1]?.name || 'Partner 2';
  const p2Emoji = p2?.avatarEmoji || profiles?.[1]?.avatarEmoji || '✨';

  const handleNavigate = (path: AppRoute) => {
    haptics.tap();
    onNavigate(path);
    onClose();
  };

  const navItems = [
    {
      path: '/' as AppRoute,
      label: 'Workout Tracker',
      description: 'Synchronized superset stations',
      icon: <Dumbbell size={18} />,
    },
    {
      path: '/library' as AppRoute,
      label: 'Exercise Catalog',
      description: '870+ exercises & tutorials',
      icon: <Database size={18} />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-4/5 max-w-xs h-full bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col z-10 p-5 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  Duo Fitness
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Duo Training Team Card */}
            <div className="py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Duo Training Team
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={p1Name} emoji={p1Emoji} role="person_1" size="sm" />
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300 truncate max-w-[80px]">
                      {p1Name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 dark:text-slate-600 font-bold">•</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={p2Name} emoji={p2Emoji} role="person_2" size="sm" />
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 truncate max-w-[80px]">
                      {p2Name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5 py-4 flex-1">
              {navItems.map((item) => {
                const isActive = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className={`text-[11px] ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="opacity-40" />
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {onSeedPlan && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSeedPlan();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                >
                  <RefreshCw size={15} />
                  <span>Reload 5-Day Workout Plan</span>
                </button>
              )}

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
