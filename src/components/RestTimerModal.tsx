import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, Timer } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsRemaining: number;
  totalDuration: number;
  isRunning: boolean;
  onStart: (duration: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  accentColor: string;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onClose,
  secondsRemaining,
  totalDuration,
  isRunning,
  onStart,
  onPause,
  onResume,
  onReset,
  onAdjustTime,
  accentColor,
}) => {
  const PRESETS = [30, 60, 90, 120];
  const finishedChimeRef = useRef(false);

  useEffect(() => {
    if (secondsRemaining === 0 && isRunning && !finishedChimeRef.current) {
      finishedChimeRef.current = true;
      StorageService.playChime('rest-done');
    }
    if (secondsRemaining > 0) {
      finishedChimeRef.current = false;
    }
  }, [secondsRemaining, isRunning]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressRatio = totalDuration > 0 ? secondsRemaining / totalDuration : 0;
  const strokeDashoffset = 283 * (1 - progressRatio);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="glass-panel glass-panel-elevated timer-dialog-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-icon" onClick={onClose} aria-label="Close Timer">
          <X size={18} />
        </button>

        <div className="timer-dialog-top">
          <div className="timer-tagline" style={{ color: accentColor }}>
            <Timer size={15} /> REST STOPWATCH
          </div>
          <h3 className="timer-dialog-title">Active Recovery</h3>
          <p className="timer-dialog-desc">Replenish ATP and central nervous output</p>
        </div>

        {/* Circular Display */}
        <div className="radial-timer-zone">
          <svg className="radial-timer-svg" viewBox="0 0 100 100">
            <circle className="radial-track" cx="50" cy="50" r="45" />
            <circle
              className="radial-progress"
              cx="50"
              cy="50"
              r="45"
              style={{
                stroke: accentColor,
                strokeDashoffset,
                filter: `drop-shadow(0 0 10px ${accentColor})`,
              }}
            />
          </svg>
          <div className="timer-digits-center">
            <span className="timer-digits-text">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="timer-state-tag">
              {isRunning ? 'RESTING' : secondsRemaining === 0 ? 'READY' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Adjust Buttons */}
        <div className="time-adjust-row">
          <button
            className="btn-glass adjust-step-btn"
            onClick={() => onAdjustTime(-15)}
            disabled={secondsRemaining <= 15}
          >
            <Minus size={13} /> 15s
          </button>
          <button
            className="btn-glass adjust-step-btn"
            onClick={() => onAdjustTime(15)}
          >
            <Plus size={13} /> 15s
          </button>
        </div>

        {/* Primary Controls */}
        <div className="timer-main-controls">
          <button
            className="btn-glass timer-reset-btn"
            onClick={onReset}
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>

          {isRunning ? (
            <button
              className="btn-glass btn-glass-primary timer-big-cta"
              onClick={onPause}
            >
              <Pause size={18} /> Pause
            </button>
          ) : (
            <button
              className="btn-glass btn-glass-primary timer-big-cta"
              onClick={secondsRemaining > 0 ? onResume : () => onStart(60)}
            >
              <Play size={18} /> {secondsRemaining > 0 ? 'Resume' : 'Start 60s'}
            </button>
          )}
        </div>

        {/* Presets */}
        <div className="preset-durations-row">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`preset-chip-btn ${
                totalDuration === p && isRunning ? 'preset-chip-active' : ''
              }`}
              onClick={() => onStart(p)}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .timer-dialog-container {
          max-width: 420px;
          width: 92%;
          padding: 2.25rem 2rem;
          text-align: center;
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-glass-strong);
          box-shadow: var(--shadow-xl);
          border-radius: 24px;
        }
        .timer-dialog-top {
          margin-bottom: 1.5rem;
        }
        .timer-tagline {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }
        .timer-dialog-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        .timer-dialog-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
        }
        .radial-timer-zone {
          position: relative;
          width: 190px;
          height: 190px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radial-timer-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .radial-track {
          fill: none;
          stroke: rgba(15, 23, 42, 0.08);
          stroke-width: 6;
        }
        .radial-progress {
          fill: none;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 283;
          transition: stroke-dashoffset 0.4s ease;
        }
        .timer-digits-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .timer-digits-text {
          font-family: var(--font-display);
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--text-primary);
        }
        .timer-state-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: 0.45rem;
        }
        .time-adjust-row {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.35rem;
        }
        .adjust-step-btn {
          padding: 0.4rem 0.95rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }
        .adjust-step-btn:hover:not(:disabled) {
          background: #ffffff;
          color: var(--text-primary);
          border-color: var(--border-glass-strong);
        }
        .timer-main-controls {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .timer-reset-btn {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          padding: 0;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }
        .timer-reset-btn:hover {
          background: #ffffff;
          color: var(--text-primary);
        }
        .timer-big-cta {
          flex: 1;
          height: 50px;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 700;
        }
        .preset-durations-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }
        .preset-chip-btn {
          padding: 0.55rem;
          border-radius: 12px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
        }
        .preset-chip-btn:hover {
          background: #ffffff;
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        .preset-chip-active {
          border-color: var(--profile-accent);
          background: var(--profile-accent);
          color: #ffffff !important;
          box-shadow: 0 4px 12px -2px rgba(2, 132, 199, 0.35);
        }
      `}</style>
    </div>
  );
};
