import { motion, AnimatePresence } from 'motion/react';
import { Check, ListOrdered, Calendar } from 'lucide-react';
import { DaySchedule } from '../../types/workout';
import { haptics } from '../../lib/haptics';

interface DaysBottomNavProps {
  schedules: DaySchedule[];
  selectedDayKey: string;
  onSelectDay: (dayKey: string) => void;
  todayKey: string;
  dayCompletionStatus: Record<string, boolean>;
  activeProfile: 'krish' | 'theju';
  onOpenExerciseList?: () => void;
}

export function DaysBottomNav({
  schedules,
  selectedDayKey,
  onSelectDay,
  todayKey,
  dayCompletionStatus,
  activeProfile,
  onOpenExerciseList,
}: DaysBottomNavProps) {
  const fallbackSchedule: DaySchedule = schedules[0] ?? {
    key: 'monday',
    name: 'Monday',
    splitTitle: 'Push (Chest, Shoulders, Triceps)',
    shortName: 'Mon',
    isRest: false,
    focusDescription: '',
  };
  const selectedSchedule: DaySchedule =
    schedules.find((s) => s.key === selectedDayKey) ?? fallbackSchedule;
  const isSelectedCompleted = dayCompletionStatus[selectedDayKey] || false;
  const isViewingToday = selectedDayKey === todayKey;

  return (
    <nav className="days-dock-container" aria-label="7-Day Workout Schedule">
      {/* Top Shelf: Architectural Telemetry Readout & Quick Drawer Access */}
      <div className="dock-shelf">
        <div className="dock-shelf-left">
          <span className={`dock-shelf-tag ${activeProfile}`}>
            {selectedSchedule.shortName}
          </span>

          <AnimatePresence mode="wait">
            <motion.span
              key={selectedSchedule.key}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15 }}
              className="dock-shelf-title"
              title={selectedSchedule.splitTitle}
            >
              {selectedSchedule.isRest
                ? 'Active Recovery & Recharge'
                : selectedSchedule.splitTitle}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Right Action / Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Quick "Today" Jump button if viewing a different day */}
          {!isViewingToday && (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onSelectDay(todayKey);
              }}
              className="dock-shelf-action"
              title="Jump to Today's schedule"
              style={{
                color: activeProfile === 'krish' ? 'var(--azure)' : 'var(--rose)',
                borderColor: activeProfile === 'krish' ? 'rgba(2, 132, 199, 0.3)' : 'rgba(225, 29, 72, 0.3)',
              }}
            >
              <Calendar style={{ width: '11px', height: '11px' }} />
              <span>Today</span>
            </button>
          )}

          {selectedSchedule.isRest ? (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--emerald)',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(236, 253, 245, 0.8)',
              }}
            >
              Recharge
            </span>
          ) : isSelectedCompleted ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: 'var(--emerald)',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(236, 253, 245, 0.8)',
              }}
            >
              <Check style={{ width: '12px', height: '12px', strokeWidth: 3 }} />
              <span>Done</span>
            </div>
          ) : onOpenExerciseList ? (
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onOpenExerciseList();
              }}
              className="dock-shelf-action"
              title="Open exercise drawer"
            >
              <ListOrdered style={{ width: '12px', height: '12px' }} />
              <span>List</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Bottom Row: 7 Clean Day Glyphs */}
      <div className="dock-days-row" role="tablist" aria-label="Day selection">
        {schedules.map((day) => {
          const isSelected = selectedDayKey === day.key;
          const isToday = todayKey === day.key;
          const isCompleted = dayCompletionStatus[day.key] || false;

          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`day-dock-button ${isSelected ? 'active' : ''}`}
              onClick={() => {
                haptics.tap();
                onSelectDay(day.key);
              }}
            >
              {isSelected && (
                <motion.div
                  layoutId="day-dock-pill"
                  className={`day-dock-pill ${activeProfile}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <span className="day-name">{day.shortName}</span>

              {/* Status Indicator: Mini check, pulse dot, or rest tag */}
              <div className="day-status-indicator">
                {isCompleted ? (
                  <Check
                    style={{
                      width: '11px',
                      height: '11px',
                      strokeWidth: 3,
                      color: 'var(--emerald)',
                    }}
                  />
                ) : isToday ? (
                  <span
                    style={{
                      fontSize: '0.5625rem',
                      fontWeight: 800,
                      color: activeProfile === 'krish' ? 'var(--azure)' : 'var(--rose)',
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                    }}
                  >
                    NOW
                  </span>
                ) : day.isRest ? (
                  <span
                    style={{
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      color: '#94A3B8',
                      lineHeight: 1,
                    }}
                  >
                    zZ
                  </span>
                ) : (
                  <span className="day-status-dot idle" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
