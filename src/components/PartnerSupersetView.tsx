import React from 'react';
import { UserProfile, Exercise, ExerciseProgress } from '../types/workout';
import { ArrowLeftRight, Check, Play, X } from 'lucide-react';
import { WORKOUT_PLAN_DATA } from '../data/initialWorkoutPlan';

interface PartnerSupersetViewProps {
  profiles: UserProfile[];
  selectedDayKey: string;
  dayTitle: string;
  logsByProfile: Record<string, Record<string, ExerciseProgress>>;
  onUpdateSet: (
    profileId: string,
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'repsCompleted' | 'rpeAchieved' | 'isCompleted',
    val: string | boolean
  ) => void;
  onOpenVideo: (exercise: Exercise) => void;
  onClosePartnerMode: () => void;
}

export const PartnerSupersetView: React.FC<PartnerSupersetViewProps> = ({
  profiles,
  selectedDayKey,
  dayTitle,
  logsByProfile,
  onUpdateSet,
  onOpenVideo,
  onClosePartnerMode,
}) => {
  const p1 = profiles[0];
  const p2 = profiles[1];

  const p1Exercises = WORKOUT_PLAN_DATA[p1.id]?.[selectedDayKey] || [];
  const p2Exercises = WORKOUT_PLAN_DATA[p2.id]?.[selectedDayKey] || [];

  const pairGroups: {
    pairName: string;
    ex1?: Exercise;
    ex2?: Exercise;
  }[] = [];

  const maxLen = Math.max(p1Exercises.length, p2Exercises.length);
  for (let i = 0; i < maxLen; i++) {
    const ex1 = p1Exercises[i];
    const ex2 = p2Exercises[i];
    const pairName = ex1?.pair || ex2?.pair || `Exercise ${i + 1}`;
    pairGroups.push({ pairName, ex1, ex2 });
  }

  const p1Monogram = p1.name.charAt(0).toUpperCase();
  const p2Monogram = p2.name.charAt(0).toUpperCase();

  return (
    <div className="partner-console-wrapper">
      {/* Top Banner */}
      <div className="glass-panel partner-banner">
        <div className="partner-info-col">
          <div className="partner-tag">
            <ArrowLeftRight size={14} /> SUPERSET SWAP ENGINE
          </div>
          <h2 className="partner-headline">{dayTitle}</h2>
          <p className="partner-subtext">
            While {p1.name} completes Station A, {p2.name} performs Station B. Swap stations after each set for zero equipment downtime.
          </p>
        </div>

        <button className="btn-glass exit-partner-btn" onClick={onClosePartnerMode}>
          <X size={15} />
          <span>Exit Partner View</span>
        </button>
      </div>

      {/* Dual Station Headers */}
      <div className="station-headers-grid">
        <div className="station-pod glass-panel" style={{ borderColor: p1.themeColor }}>
          <div className="pod-monogram" style={{ background: p1.accentGradient }}>
            {p1Monogram}
          </div>
          <div>
            <span className="station-tag">STATION A</span>
            <h3 className="pod-title">{p1.name}</h3>
          </div>
        </div>

        <div className="swap-glyph-box">
          <ArrowLeftRight size={18} />
        </div>

        <div className="station-pod glass-panel" style={{ borderColor: p2.themeColor }}>
          <div className="pod-monogram" style={{ background: p2.accentGradient }}>
            {p2Monogram}
          </div>
          <div>
            <span className="station-tag">STATION B</span>
            <h3 className="pod-title">{p2.name}</h3>
          </div>
        </div>
      </div>

      {/* Paired Exercises List */}
      <div className="paired-blocks-list">
        {pairGroups.map((group, idx) => {
          const ex1 = group.ex1;
          const ex2 = group.ex2;

          const prog1 = ex1 ? logsByProfile[p1.id]?.[ex1.id] : undefined;
          const prog2 = ex2 ? logsByProfile[p2.id]?.[ex2.id] : undefined;

          return (
            <div key={idx} className="glass-panel pair-block-card">
              <div className="pair-block-header">
                <span className="glass-pill glass-pill-amber">{group.pairName}</span>
                <span className="swap-hint-text">
                  <ArrowLeftRight size={12} /> Swap after each set
                </span>
              </div>

              <div className="pair-split-row">
                {/* Station A (Person 1) */}
                <div className="station-exercise-box">
                  {ex1 ? (
                    <>
                      <div className="station-title-bar">
                        <div>
                          <h4 className="st-name">{ex1.name}</h4>
                          <span className="st-sub">{ex1.muscle} • {ex1.targetSets}×{ex1.targetReps}</span>
                        </div>
                        {ex1.videoUrl && (
                          <button
                            className="btn-glass st-vid-btn"
                            onClick={() => onOpenVideo(ex1)}
                            title="Watch Tutorial"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                        )}
                      </div>

                      <div className="st-sets-pills">
                        {prog1?.sets.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            className={`st-set-pill ${s.isCompleted ? 'st-set-done' : ''}`}
                            onClick={() =>
                              onUpdateSet(p1.id, ex1.id, sIdx, 'isCompleted', !s.isCompleted)
                            }
                            style={{
                              borderColor: s.isCompleted ? p1.themeColor : undefined,
                            }}
                          >
                            <span>Set {sIdx + 1}</span>
                            {s.isCompleted && <Check size={11} strokeWidth={3} />}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="st-empty">Rest / Assist</div>
                  )}
                </div>

                {/* Station B (Person 2) */}
                <div className="station-exercise-box">
                  {ex2 ? (
                    <>
                      <div className="station-title-bar">
                        <div>
                          <h4 className="st-name">{ex2.name}</h4>
                          <span className="st-sub">{ex2.muscle} • {ex2.targetSets}×{ex2.targetReps}</span>
                        </div>
                        {ex2.videoUrl && (
                          <button
                            className="btn-glass st-vid-btn"
                            onClick={() => onOpenVideo(ex2)}
                            title="Watch Tutorial"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                        )}
                      </div>

                      <div className="st-sets-pills">
                        {prog2?.sets.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            className={`st-set-pill ${s.isCompleted ? 'st-set-done' : ''}`}
                            onClick={() =>
                              onUpdateSet(p2.id, ex2.id, sIdx, 'isCompleted', !s.isCompleted)
                            }
                            style={{
                              borderColor: s.isCompleted ? p2.themeColor : undefined,
                            }}
                          >
                            <span>Set {sIdx + 1}</span>
                            {s.isCompleted && <Check size={11} strokeWidth={3} />}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="st-empty">Rest / Assist</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .partner-console-wrapper {
          margin-bottom: 2rem;
        }
        .partner-banner {
          padding: 1.75rem 2rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          box-shadow: var(--shadow-md);
        }
        .partner-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #d97706;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }
        .partner-headline {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .partner-subtext {
          font-size: 0.875rem;
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.5;
        }
        .exit-partner-btn {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.6rem 1.15rem;
          border-radius: 12px;
        }
        .station-headers-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .station-pod {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1.5px solid var(--border-glass);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
        }
        .pod-monogram {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.05rem;
          color: #ffffff;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
        }
        .station-tag {
          display: block;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .pod-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .swap-glyph-box {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(217, 119, 6, 0.1);
          border: 1.5px solid rgba(217, 119, 6, 0.3);
          color: #d97706;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .paired-blocks-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pair-block-card {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
        }
        .pair-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }
        .swap-hint-text {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #d97706;
        }
        .pair-split-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .station-exercise-box {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--border-glass-strong);
          border-radius: 16px;
          padding: 1.15rem;
          box-shadow: var(--shadow-sm);
        }
        .station-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }
        .st-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .st-sub {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 0.2rem;
        }
        .st-vid-btn {
          padding: 0.35rem 0.6rem;
          color: #e11d48;
          border-radius: 8px;
          background: rgba(225, 29, 72, 0.08);
          border: 1px solid rgba(225, 29, 72, 0.2);
        }
        .st-vid-btn:hover {
          background: #e11d48;
          color: #ffffff;
        }
        .st-sets-pills {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .st-set-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.85rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: var(--font-display);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
        }
        .st-set-pill:hover {
          background: #ffffff;
          color: var(--text-primary);
          border-color: var(--border-glass-strong);
        }
        .st-set-pill.st-set-done {
          background: rgba(5, 150, 105, 0.12);
          color: #059669;
          border-color: rgba(5, 150, 105, 0.35);
          font-weight: 800;
        }
        .st-empty {
          height: 100%;
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px dashed rgba(15, 23, 42, 0.15);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.4);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .station-headers-grid {
            grid-template-columns: 1fr;
          }
          .swap-glyph-box {
            margin: 0 auto;
          }
          .pair-split-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
