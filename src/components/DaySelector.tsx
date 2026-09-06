import React from 'react';
import { DaySchedule } from '../types/workout';
import { Moon, Check } from 'lucide-react';

interface DaySelectorProps {
  schedules: DaySchedule[];
  selectedDayKey: string;
  todayDayKey: string;
  dayCompletionStatus: Record<string, boolean>;
  onSelectDay: (dayKey: string) => void;
  accentColor: string;
  glowColor: string;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  schedules,
  selectedDayKey,
  todayDayKey,
  dayCompletionStatus,
  onSelectDay,
  accentColor,
  glowColor,
}) => {
  return (
    <div className="day-rail-wrapper">
      <div className="day-rail-track">
        {schedules.map((day) => {
          const isSelected = day.key === selectedDayKey;
          const isToday = day.key === todayDayKey;
          const isCompleted = dayCompletionStatus[day.key] || false;

          return (
            <button
              key={day.key}
              onClick={() => onSelectDay(day.key)}
              className={`day-capsule-btn ${isSelected ? 'day-active' : ''} ${
                day.isRest ? 'day-rest' : ''
              }`}
              style={{
                borderColor: isSelected ? accentColor : undefined,
                boxShadow: isSelected
                  ? `0 8px 24px -4px ${glowColor}, var(--specular-rim)`
                  : undefined,
              }}
            >
              <div className="day-top-row">
                <span className="day-title-code">{day.shortName}</span>
                {isToday && <span className="today-dot" title="Today" />}
                {isCompleted && !day.isRest && (
                  <span className="completed-check-icon" title="Workout Done">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                {day.isRest && (
                  <span className="rest-moon-icon" title="Rest Day">
                    <Moon size={11} />
                  </span>
                )}
              </div>

              <div className="day-subtitle-focus">
                {day.isRest ? 'Rest' : day.splitTitle.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .day-rail-wrapper {
          margin-bottom: 1.5rem;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .day-rail-track {
          display: flex;
          gap: 0.5rem;
          min-width: max-content;
        }
        .day-capsule-btn {
          flex: 1;
          min-width: 96px;
          padding: 0.75rem 0.85rem;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--shadow-glass-sm), var(--specular-rim);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .day-capsule-btn:hover {
          background: #ffffff;
          border-color: var(--border-glass-hover);
          transform: translateY(-1.5px);
          box-shadow: var(--shadow-glass-md);
        }
        .day-capsule-btn.day-active {
          background: #ffffff;
          border-width: 1.5px;
        }
        .day-capsule-btn.day-rest {
          opacity: 0.85;
        }
        .day-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .day-title-code {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
          color: var(--text-primary);
        }
        .today-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--profile-accent);
          box-shadow: 0 0 6px var(--profile-accent);
        }
        .completed-check-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--success);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rest-moon-icon {
          color: var(--text-muted);
        }
        .day-subtitle-focus {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .day-active .day-subtitle-focus {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
