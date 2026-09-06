import React from 'react';
import { Exercise, ExerciseProgress } from '../types/workout';
import { Play, Check } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface ExerciseCardProps {
  exercise: Exercise;
  progress?: ExerciseProgress;
  onUpdateSet: (
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'repsCompleted' | 'rpeAchieved' | 'isCompleted',
    val: string | boolean
  ) => void;
  onOpenVideo: (exercise: Exercise) => void;
  onTriggerRestTimer: (seconds: number) => void;
  accentColor: string;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  progress,
  onUpdateSet,
  onOpenVideo,
  onTriggerRestTimer,
}) => {
  const sets = progress?.sets || [];
  const isAllComplete = progress?.isFullyCompleted || false;

  const handleToggleSet = (idx: number, currentCompleted: boolean) => {
    const nextState = !currentCompleted;
    onUpdateSet(exercise.id, idx, 'isCompleted', nextState);
    if (nextState) {
      StorageService.playChime('set-complete');
      onTriggerRestTimer(60); // Auto-start 60s rest timer
    }
  };

  return (
    <div
      className={`glass-panel exercise-bento-card ${
        isAllComplete ? 'card-finished-glow' : ''
      }`}
      id={`exercise-${exercise.id}`}
    >
      {/* Liquid Shimmer Underlay */}
      <div className="liquid-shimmer" />

      {/* Top Header Row */}
      <div className="bento-top-row">
        <div className="bento-tags">
          <span className="glass-pill glass-pill-amber">{exercise.pair}</span>
          <span className="glass-pill glass-pill-accent">{exercise.muscle}</span>
          {isAllComplete && (
            <span className="glass-pill glass-pill-emerald">
              <Check size={11} strokeWidth={3} /> Complete
            </span>
          )}
        </div>

        {exercise.videoUrl && (
          <button
            className="btn-glass tutorial-link-btn"
            onClick={() => onOpenVideo(exercise)}
            title="Watch Form Video Tutorial"
          >
            <Play size={11} fill="currentColor" />
            <span>Form Video</span>
          </button>
        )}
      </div>

      {/* Title & Guidance */}
      <div className="bento-title-section">
        <h3 className="exercise-title-text">{exercise.name}</h3>
        <div className="exercise-targets-line">
          <span className="target-pill-text">
            <strong>{exercise.targetSets}</strong> Sets
          </span>
          <span className="dot-divider">•</span>
          <span className="target-pill-text">
            <strong>{exercise.targetReps}</strong> Reps
          </span>
          {exercise.targetRpe && (
            <>
              <span className="dot-divider">•</span>
              <span className="target-pill-text">RPE {exercise.targetRpe}</span>
            </>
          )}
        </div>
      </div>

      {exercise.notes && (
        <div className="coaching-cue-bar">
          <span className="cue-label">Focus:</span> {exercise.notes}
        </div>
      )}

      {/* Todo Set Rows */}
      <div className="sets-stack">
        {sets.map((setRecord, idx) => {
          const isDone = setRecord.isCompleted;

          return (
            <div
              key={idx}
              className={`set-todo-item ${isDone ? 'set-done-active' : ''}`}
            >
              {/* Set Label */}
              <div className="set-indicator">
                <span className="set-label-tag">SET</span>
                <span className="set-number-val">{idx + 1}</span>
              </div>

              {/* Weight & Reps Inputs */}
              <div className="set-inputs-cluster">
                <div className="input-with-label">
                  <input
                    type="number"
                    step="0.5"
                    className="glass-input set-val-input"
                    placeholder="—"
                    value={setRecord.weightKg}
                    onChange={(e) =>
                      onUpdateSet(exercise.id, idx, 'weightKg', e.target.value)
                    }
                  />
                  <span className="input-suffix">kg</span>
                </div>

                <div className="input-with-label">
                  <input
                    type="text"
                    className="glass-input set-val-input"
                    placeholder={exercise.targetReps.split('-')[0] || '10'}
                    value={setRecord.repsCompleted}
                    onChange={(e) =>
                      onUpdateSet(exercise.id, idx, 'repsCompleted', e.target.value)
                    }
                  />
                  <span className="input-suffix">reps</span>
                </div>
              </div>

              {/* Action Button: Check / Done */}
              <button
                className={`set-action-button ${isDone ? 'action-done' : ''}`}
                onClick={() => handleToggleSet(idx, isDone)}
                aria-label={`Complete Set ${idx + 1}`}
              >
                {isDone ? (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span>Done</span>
                  </>
                ) : (
                  <span>Mark Done</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .exercise-bento-card {
          padding: 1.5rem;
          margin-bottom: 1.25rem;
          border-radius: 20px;
          position: relative;
          background: rgba(255, 255, 255, 0.82);
        }
        .card-finished-glow {
          border-color: var(--success-border);
          box-shadow: 0 12px 32px -4px var(--success-glow), var(--specular-rim);
        }
        .bento-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
          position: relative;
          z-index: 2;
        }
        .bento-tags {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .tutorial-link-btn {
          font-size: 0.75rem;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          color: #e11d48;
          border-color: #fecdd3;
          background: #fff1f2;
        }
        .tutorial-link-btn:hover {
          background: #ffe4e6;
          border-color: #fda4af;
        }
        .bento-title-section {
          margin-bottom: 0.75rem;
          position: relative;
          z-index: 2;
        }
        .exercise-title-text {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 0.35rem;
          color: var(--text-primary);
        }
        .exercise-targets-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .target-pill-text strong {
          color: var(--text-primary);
          font-family: var(--font-display);
        }
        .dot-divider {
          color: var(--text-dim);
        }
        .coaching-cue-bar {
          font-size: 0.825rem;
          color: var(--text-secondary);
          background: var(--bg-inset);
          border-left: 3px solid var(--profile-accent);
          padding: 0.45rem 0.85rem;
          border-radius: 0 8px 8px 0;
          margin-bottom: 1.15rem;
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(15, 23, 42, 0.04);
          border-right: 1px solid rgba(15, 23, 42, 0.04);
          border-bottom: 1px solid rgba(15, 23, 42, 0.04);
        }
        .cue-label {
          font-weight: 800;
          color: var(--profile-accent);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          margin-right: 0.25rem;
        }
        .sets-stack {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          position: relative;
          z-index: 2;
        }
        .set-todo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.07);
          padding: 0.55rem 0.85rem;
          border-radius: 14px;
          transition: all 0.2s ease;
        }
        .set-todo-item:hover {
          border-color: var(--border-glass-hover);
          background: #ffffff;
          box-shadow: var(--shadow-glass-sm);
        }
        .set-done-active {
          background: var(--success-light);
          border-color: var(--success-border);
        }
        .set-indicator {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          min-width: 52px;
        }
        .set-label-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }
        .set-number-val {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1rem;
          color: var(--text-primary);
        }
        .set-inputs-cluster {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex: 1;
          max-width: 260px;
        }
        .input-with-label {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .set-val-input {
          width: 100%;
          text-align: left;
          padding-right: 2.2rem;
          font-size: 0.95rem;
        }
        .input-suffix {
          position: absolute;
          right: 0.65rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          pointer-events: none;
          text-transform: uppercase;
        }
        .set-action-button {
          min-width: 110px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.825rem;
          cursor: pointer;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          color: var(--text-secondary);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-glass-sm);
        }
        .set-action-button:hover {
          background: #ffffff;
          border-color: var(--border-glass-hover);
          color: var(--text-primary);
        }
        .set-action-button.action-done {
          background: var(--success);
          border-color: var(--success);
          color: #ffffff;
          box-shadow: 0 4px 14px var(--success-glow);
        }
        @media (max-width: 580px) {
          .set-todo-item {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .set-inputs-cluster {
            max-width: 100%;
            flex: 1;
          }
          .set-action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
