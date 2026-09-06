import React from 'react';
import { UserProfile, UserStats } from '../types/workout';
import { Flame, Clock, Users, RotateCcw, ChevronDown, Dumbbell } from 'lucide-react';

interface HeaderProps {
  activeProfile: UserProfile;
  stats: UserStats;
  onOpenProfileSwitcher: () => void;
  onOpenRestTimer: () => void;
  timerSecondsRemaining: number | null;
  partnerModeActive: boolean;
  onTogglePartnerMode: () => void;
  onResetToday: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  stats,
  onOpenProfileSwitcher,
  onOpenRestTimer,
  timerSecondsRemaining,
  partnerModeActive,
  onTogglePartnerMode,
  onResetToday,
}) => {
  const monogram = activeProfile.name.charAt(0).toUpperCase();

  return (
    <header className="glass-panel header-bar">
      {/* Liquid Shimmer Underlay */}
      <div className="liquid-shimmer" />

      <div className="header-left">
        {/* Brand Logo */}
        <div className="brand-mark">
          <div className="brand-icon-box">
            <Dumbbell size={17} strokeWidth={2.4} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-name">PULSE</span>
            <span className="brand-tag">5-DAY SPLIT</span>
          </div>
        </div>

        {/* Netflix-Style Profile Switcher Capsule */}
        <button
          onClick={onOpenProfileSwitcher}
          className="profile-selector-capsule"
          title="Switch Profile (Netflix Style)"
          aria-label="Switch User Profile"
        >
          <div
            className="monogram-ring"
            style={{
              background: activeProfile.accentGradient,
              boxShadow: `0 2px 10px ${activeProfile.glowColor}`,
            }}
          >
            <span className="monogram-text">{monogram}</span>
          </div>
          <div className="profile-info-pill">
            <span className="profile-active-name">{activeProfile.name}</span>
            <span className="profile-role-label">{activeProfile.gender}</span>
          </div>
          <ChevronDown size={14} className="dropdown-chevron" />
        </button>
      </div>

      <div className="header-right">
        {/* Floating Rest Timer Pill */}
        <button
          onClick={onOpenRestTimer}
          className={`timer-pill ${timerSecondsRemaining !== null ? 'timer-active' : ''}`}
          title="Open Rest Timer"
        >
          <Clock size={15} />
          <span>
            {timerSecondsRemaining !== null
              ? `${Math.floor(timerSecondsRemaining / 60)}:${String(
                  timerSecondsRemaining % 60
                ).padStart(2, '0')}`
              : 'Rest Timer'}
          </span>
        </button>

        {/* Partner Mode Button */}
        <button
          onClick={onTogglePartnerMode}
          className={`btn-glass partner-mode-btn ${
            partnerModeActive ? 'partner-mode-active' : ''
          }`}
          title="Toggle Partner Superset Swap System"
        >
          <Users size={15} />
          <span className="desktop-text">Partner Mode</span>
        </button>

        {/* Streak Flame Pill */}
        <div className="streak-pill" title={`${stats.currentStreak} Day Workout Streak`}>
          <Flame size={15} className="flame-glyph" />
          <span className="streak-count">{stats.currentStreak}</span>
        </div>

        {/* Reset Today */}
        <button
          onClick={onResetToday}
          className="btn-glass icon-only-btn"
          title="Reset Day Progress"
          aria-label="Reset Today"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <style>{`
        .header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.4rem;
          margin-bottom: 1.5rem;
          gap: 1rem;
          position: relative;
          z-index: 10;
        }
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          position: relative;
          z-index: 2;
        }
        .brand-mark {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding-right: 0.85rem;
          border-right: 1px solid var(--border-glass-subtle);
        }
        .brand-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: var(--shadow-glass-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--profile-accent);
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          color: var(--text-primary);
          line-height: 1;
        }
        .brand-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }
        .profile-selector-capsule {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-glass);
          outline: 1px solid var(--border-glass-subtle);
          border-radius: 999px;
          padding: 0.3rem 0.85rem 0.3rem 0.35rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-glass-sm);
        }
        .profile-selector-capsule:hover {
          background: #ffffff;
          outline-color: var(--border-glass-hover);
          transform: translateY(-1px);
        }
        .monogram-ring {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .profile-info-pill {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .profile-active-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .profile-role-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .dropdown-chevron {
          color: var(--text-muted);
        }
        .timer-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.9rem;
          border-radius: 999px;
          font-size: 0.825rem;
          font-family: var(--font-display);
          font-weight: 700;
          background: var(--warning-light);
          border: 1px solid var(--warning-border);
          color: var(--warning);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-glass-sm);
        }
        .timer-pill:hover {
          background: #fef3c7;
        }
        .timer-pill.timer-active {
          animation: pulseAmber 2s infinite;
        }
        @keyframes pulseAmber {
          0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.35); }
          70% { box-shadow: 0 0 0 8px rgba(217, 119, 6, 0); }
          100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
        }
        .partner-mode-btn {
          border-radius: 999px;
          padding: 0.5rem 0.9rem;
        }
        .partner-mode-btn.partner-mode-active {
          background: var(--profile-gradient);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.4);
          font-weight: 700;
          box-shadow: 0 4px 14px var(--profile-glow);
        }
        .streak-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #e11d48;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.85rem;
          box-shadow: var(--shadow-glass-sm);
        }
        .flame-glyph {
          color: #e11d48;
        }
        .icon-only-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 50%;
          color: var(--text-muted);
        }
        .icon-only-btn:hover {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .header-bar {
            padding: 0.75rem 1rem;
          }
          .brand-mark {
            display: none;
          }
          .desktop-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
