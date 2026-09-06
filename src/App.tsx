import React, { useState, useEffect, useRef } from 'react';
import * as confettiModule from 'canvas-confetti';
const confetti = (confettiModule as any).default ?? confettiModule;
import { UserProfile, Exercise, WorkoutDayLog } from './types/workout';
import { DAY_SCHEDULES, WORKOUT_PLAN_DATA } from './data/initialWorkoutPlan';
import { StorageService } from './services/storageService';

import { LiquidFilterDefs } from './components/LiquidFilterDefs';
import { Header } from './components/Header';
import { DaySelector } from './components/DaySelector';
import { ExerciseCard } from './components/ExerciseCard';
import { ProfileSwitcherModal } from './components/ProfileSwitcherModal';
import { RestTimerModal } from './components/RestTimerModal';
import { VideoModal } from './components/VideoModal';
import { PartnerSupersetView } from './components/PartnerSupersetView';
import { Award, Moon, Dumbbell, Sparkles, Droplets, Footprints, Salad } from 'lucide-react';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() =>
    StorageService.getProfiles()
  );
  const [activeProfileId, setActiveProfileId] = useState<string>(() =>
    StorageService.getActiveProfileId()
  );

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const todayKey = StorageService.getTodayDayKey();
  const todayDateStr = StorageService.getTodayDateStr();
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);

  const [dayLogs, setDayLogs] = useState<Record<string, WorkoutDayLog>>({});

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRestTimerModalOpen, setIsRestTimerModalOpen] = useState(false);
  const [activeVideoExercise, setActiveVideoExercise] = useState<Exercise | null>(
    null
  );
  const [partnerModeActive, setPartnerModeActive] = useState(false);

  // Rest Timer State
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Load Day Log for current activeProfile and selectedDayKey
  useEffect(() => {
    const logKey = `${activeProfileId}_${selectedDayKey}`;
    if (!dayLogs[logKey]) {
      const loaded = StorageService.getDayLog(
        activeProfileId,
        todayDateStr,
        selectedDayKey
      );
      setDayLogs((prev) => ({ ...prev, [logKey]: loaded }));
    }

    // Hydrate from SQLite (Local Miniflare or Cloudflare D1)
    StorageService.fetchRemoteDayLog(
      activeProfileId,
      todayDateStr,
      selectedDayKey
    ).then((remoteLog) => {
      if (remoteLog) {
        setDayLogs((prev) => ({ ...prev, [logKey]: remoteLog }));
      }
    });
  }, [activeProfileId, selectedDayKey, todayDateStr]);

  // Update root CSS custom properties when active profile changes
  useEffect(() => {
    if (activeProfile) {
      document.documentElement.style.setProperty(
        '--profile-accent',
        activeProfile.themeColor
      );
      document.documentElement.style.setProperty(
        '--profile-gradient',
        activeProfile.accentGradient
      );
      document.documentElement.style.setProperty(
        '--profile-glow',
        activeProfile.glowColor
      );
      document.documentElement.style.setProperty(
        '--profile-accent-soft',
        activeProfile.id === 'person_1'
          ? 'rgba(2, 132, 199, 0.12)'
          : 'rgba(225, 29, 72, 0.12)'
      );
    }
  }, [activeProfile]);

  // Rest Timer countdown interval
  useEffect(() => {
    if (isTimerRunning && secondsRemaining > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, secondsRemaining]);

  const startRestTimer = (duration: number) => {
    setTimerDuration(duration);
    setSecondsRemaining(duration);
    setIsTimerRunning(true);
  };

  const handleUpdateSet = (
    profileId: string,
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'repsCompleted' | 'rpeAchieved' | 'isCompleted',
    val: string | boolean
  ) => {
    const logKey = `${profileId}_${selectedDayKey}`;
    const currentLog =
      dayLogs[logKey] ||
      StorageService.getDayLog(profileId, todayDateStr, selectedDayKey);

    const exerciseProgress = currentLog.exercisesProgress[exerciseId];
    if (!exerciseProgress || !exerciseProgress.sets[setIndex]) return;

    const updatedSets = [...exerciseProgress.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [field]: val,
    };

    const updatedLog: WorkoutDayLog = {
      ...currentLog,
      exercisesProgress: {
        ...currentLog.exercisesProgress,
        [exerciseId]: {
          ...exerciseProgress,
          sets: updatedSets,
        },
      },
    };

    StorageService.saveDayLog(updatedLog);
    setDayLogs((prev) => ({ ...prev, [logKey]: updatedLog }));

    // Confetti celebration when entire session finishes
    if (!currentLog.isWorkoutFinished && updatedLog.isWorkoutFinished) {
      StorageService.playChime('all-done');
      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: [activeProfile.themeColor, '#10b981', '#fbbf24', '#ffffff'],
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleResetToday = () => {
    if (window.confirm("Reset today's progress and weights for this session?")) {
      const cleanLog = StorageService.getDayLog(
        activeProfileId,
        'clean_seed',
        selectedDayKey
      );
      cleanLog.dateStr = todayDateStr;
      StorageService.saveDayLog(cleanLog);
      setDayLogs((prev) => ({
        ...prev,
        [`${activeProfileId}_${selectedDayKey}`]: cleanLog,
      }));
    }
  };

  const currentLogKey = `${activeProfileId}_${selectedDayKey}`;
  const currentDayLog = dayLogs[currentLogKey] || {
    profileId: activeProfileId,
    dateStr: todayDateStr,
    dayKey: selectedDayKey,
    exercisesProgress: {},
    completedPercentage: 0,
    isWorkoutFinished: false,
    updatedAt: new Date().toISOString(),
  };

  const currentSchedule =
    DAY_SCHEDULES.find((d) => d.key === selectedDayKey) || DAY_SCHEDULES[0];
  const currentExercises =
    WORKOUT_PLAN_DATA[activeProfileId]?.[selectedDayKey] || [];
  const stats = StorageService.getUserStats(activeProfileId);

  const dayCompletionStatus: Record<string, boolean> = {};
  DAY_SCHEDULES.forEach((d) => {
    const log = dayLogs[`${activeProfileId}_${d.key}`];
    dayCompletionStatus[d.key] = log ? log.isWorkoutFinished : false;
  });

  const logsByProfile: Record<string, Record<string, any>> = {};
  profiles.forEach((p) => {
    const pLog = dayLogs[`${p.id}_${selectedDayKey}`];
    logsByProfile[p.id] = pLog ? pLog.exercisesProgress : {};
  });

  return (
    <div className="fitness-app-root">
      {/* Light Architectural Pattern & Geometric Grid Underlay */}
      <div className="pattern-canvas-underlay" />

      {/* Dynamic Ambient Mesh Lights */}
      <div className="ambient-mesh">
        <div className="ambient-light-1" />
        <div className="ambient-light-2" />
      </div>

      {/* Liquid Glass SVG Filters */}
      <LiquidFilterDefs />

      <div className="app-shell">
        {/* Executive Header */}
        <Header
          activeProfile={activeProfile}
          stats={stats}
          onOpenProfileSwitcher={() => setIsProfileModalOpen(true)}
          onOpenRestTimer={() => setIsRestTimerModalOpen(true)}
          timerSecondsRemaining={isTimerRunning ? secondsRemaining : null}
          partnerModeActive={partnerModeActive}
          onTogglePartnerMode={() => setPartnerModeActive((prev) => !prev)}
          onResetToday={handleResetToday}
        />

        {/* 7-Day Capsule Rail */}
        <DaySelector
          schedules={DAY_SCHEDULES}
          selectedDayKey={selectedDayKey}
          todayDayKey={todayKey}
          dayCompletionStatus={dayCompletionStatus}
          onSelectDay={(key) => setSelectedDayKey(key)}
          accentColor={activeProfile.themeColor}
          glowColor={activeProfile.glowColor}
        />

        {partnerModeActive ? (
          /* Partner Superset Swap System */
          <PartnerSupersetView
            profiles={profiles}
            selectedDayKey={selectedDayKey}
            dayTitle={currentSchedule.splitTitle}
            logsByProfile={logsByProfile}
            onUpdateSet={handleUpdateSet}
            onOpenVideo={(ex) => setActiveVideoExercise(ex)}
            onClosePartnerMode={() => setPartnerModeActive(false)}
          />
        ) : (
          /* Single Profile Workout View */
          <main className="main-content-flow">
            {/* Session Headline Hero Card */}
            <div className="glass-panel session-hero-card">
              <div className="liquid-shimmer" />

              <div className="hero-details">
                <div className="hero-day-tag">
                  <span>{currentSchedule.name}</span>
                  {selectedDayKey === todayKey && (
                    <span className="hero-today-pill">TODAY</span>
                  )}
                </div>
                <h1 className="hero-split-name">{currentSchedule.splitTitle}</h1>
                <p className="hero-focus-description">
                  {currentSchedule.focusDescription}
                </p>

                {/* Progress Bar inside Hero */}
                {!currentSchedule.isRest && (
                  <div className="session-progress-module">
                    <div className="progress-labels-row">
                      <span className="progress-text-label">Workout Progress</span>
                      <span
                        className="progress-percentage-val"
                        style={{ color: activeProfile.themeColor }}
                      >
                        {currentDayLog.completedPercentage}%
                      </span>
                    </div>
                    <div className="progress-hollow-track">
                      <div
                        className="progress-fluid-fill"
                        style={{
                          width: `${currentDayLog.completedPercentage}%`,
                          background: activeProfile.accentGradient,
                          boxShadow: `0 0 16px ${activeProfile.glowColor}`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="hero-meta-badge">
                {currentSchedule.isRest ? (
                  <div className="rest-indicator-orb">
                    <Moon size={24} className="rest-icon-glyph" />
                    <span>Rest Day</span>
                  </div>
                ) : (
                  <div className="exercise-count-pod">
                    <Dumbbell size={22} className="count-pod-icon" />
                    <div className="count-pod-text">
                      <span className="count-huge">{currentExercises.length}</span>
                      <span className="count-sub">EXERCISES</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Workout Finished Celebration Banner */}
            {currentDayLog.isWorkoutFinished && !currentSchedule.isRest && (
              <div className="glass-panel celebration-banner">
                <div className="celebration-content">
                  <div className="celebration-badge-icon">
                    <Award size={26} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="celebration-header">Session Completed!</h2>
                    <p className="celebration-text">
                      Great intensity today. All planned sets logged and executed.
                    </p>
                  </div>
                </div>
                <div className="streak-increment-chip">
                  <Sparkles size={14} /> Streak +1
                </div>
              </div>
            )}

            {/* Rest Day Peaceful Zen Screen */}
            {currentSchedule.isRest ? (
              <div className="glass-panel rest-zen-panel">
                <div className="zen-moon-container">
                  <Moon size={48} className="zen-moon-glyph" />
                </div>
                <h2 className="zen-headline">Active Recovery & Restoration</h2>
                <p className="zen-description">
                  {selectedDayKey === 'wednesday'
                    ? 'Mid-week active recovery. Take a gentle 20-30 minute walk, perform mobility stretching, hydrate well, and allow muscle fibers to repair.'
                    : 'Sunday physical recharge. Prepare wholesome meals, rest your mind and body, and reset your motivation for Monday.'}
                </p>

                <div className="zen-tips-row">
                  <div className="zen-tip-box glass-panel">
                    <div className="zen-tip-icon-box">
                      <Droplets size={20} className="tip-icon-cyan" />
                    </div>
                    <div>
                      <h4 className="zen-tip-name">Hydration</h4>
                      <p className="zen-tip-detail">2.5L+ Pure Water & Electrolytes</p>
                    </div>
                  </div>

                  <div className="zen-tip-box glass-panel">
                    <div className="zen-tip-icon-box">
                      <Footprints size={20} className="tip-icon-emerald" />
                    </div>
                    <div>
                      <h4 className="zen-tip-name">Mobility</h4>
                      <p className="zen-tip-detail">20m Gentle Outdoor Walk</p>
                    </div>
                  </div>

                  <div className="zen-tip-box glass-panel">
                    <div className="zen-tip-icon-box">
                      <Salad size={20} className="tip-icon-amber" />
                    </div>
                    <div>
                      <h4 className="zen-tip-name">Nutrition</h4>
                      <p className="zen-tip-detail">High Quality Protein & Sleep</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Exercise Cards List */
              <div className="exercises-stack">
                {currentExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    progress={currentDayLog.exercisesProgress[exercise.id]}
                    onUpdateSet={(exId, sIdx, field, val) =>
                      handleUpdateSet(activeProfileId, exId, sIdx, field, val)
                    }
                    onOpenVideo={(ex) => setActiveVideoExercise(ex)}
                    onTriggerRestTimer={(secs) => startRestTimer(secs)}
                    accentColor={activeProfile.themeColor}
                  />
                ))}
              </div>
            )}
          </main>
        )}
      </div>

      {/* Netflix Profile Switcher Modal */}
      {isProfileModalOpen && (
        <ProfileSwitcherModal
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelectProfile={(id) => {
            setActiveProfileId(id);
            StorageService.setActiveProfileId(id);
          }}
          onUpdateProfile={(updated) => {
            const newProfiles = profiles.map((p) =>
              p.id === updated.id ? updated : p
            );
            setProfiles(newProfiles);
            StorageService.saveProfiles(newProfiles);
          }}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={isRestTimerModalOpen}
        onClose={() => setIsRestTimerModalOpen(false)}
        secondsRemaining={secondsRemaining}
        totalDuration={timerDuration}
        isRunning={isTimerRunning}
        onStart={(duration) => startRestTimer(duration)}
        onPause={() => setIsTimerRunning(false)}
        onResume={() => setIsTimerRunning(true)}
        onReset={() => {
          setIsTimerRunning(false);
          setSecondsRemaining(timerDuration);
        }}
        onAdjustTime={(delta) =>
          setSecondsRemaining((prev) => Math.max(0, prev + delta))
        }
        accentColor={activeProfile.themeColor}
      />

      {/* Video Modal */}
      <VideoModal
        exercise={activeVideoExercise}
        onClose={() => setActiveVideoExercise(null)}
        accentColor={activeProfile.themeColor}
      />

      <style>{`
        .fitness-app-root {
          min-height: 100vh;
          padding: 1.5rem 1.25rem 4rem;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .app-shell {
          max-width: 980px;
          width: 100%;
        }
        .session-hero-card {
          padding: 2.25rem 2.5rem;
          margin-bottom: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--border-glass-strong);
          border-radius: 24px;
          box-shadow: var(--shadow-md);
        }
        .hero-details {
          flex: 1;
          min-width: 280px;
        }
        .hero-day-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--profile-accent);
          margin-bottom: 0.4rem;
        }
        .hero-today-pill {
          background: var(--profile-accent);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.15);
        }
        .hero-split-name {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: var(--text-primary);
          margin-bottom: 0.4rem;
        }
        .hero-focus-description {
          font-size: 0.925rem;
          color: var(--text-secondary);
          max-width: 540px;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        .session-progress-module {
          max-width: 440px;
        }
        .progress-labels-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 0.45rem;
        }
        .progress-text-label {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .progress-percentage-val {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.9rem;
        }
        .progress-hollow-track {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }
        .progress-fluid-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-meta-badge {
          display: flex;
          align-items: center;
        }
        .exercise-count-pod {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-glass);
          padding: 0.85rem 1.35rem;
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
        }
        .count-pod-icon {
          color: var(--profile-accent);
        }
        .count-huge {
          display: block;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.75rem;
          line-height: 1;
          color: var(--text-primary);
        }
        .count-sub {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }
        .rest-indicator-orb {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 1.35rem;
          border-radius: 18px;
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.9rem;
        }
        .celebration-banner {
          padding: 1.25rem 1.75rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(5, 150, 105, 0.3);
          background: rgba(5, 150, 105, 0.1);
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .celebration-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .celebration-badge-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(5, 150, 105, 0.18);
          border: 1px solid rgba(5, 150, 105, 0.35);
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .celebration-header {
          font-size: 1.2rem;
          font-weight: 800;
          color: #059669;
          line-height: 1.2;
        }
        .celebration-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .streak-increment-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.825rem;
          color: #d97706;
          background: rgba(217, 119, 6, 0.12);
          border: 1px solid rgba(217, 119, 6, 0.3);
          padding: 0.45rem 0.85rem;
          border-radius: 10px;
        }
        .rest-zen-panel {
          padding: 3.5rem 2.5rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--border-glass-strong);
          border-radius: 24px;
          box-shadow: var(--shadow-md);
        }
        .zen-moon-container {
          margin-bottom: 1.25rem;
        }
        .zen-moon-glyph {
          color: #7c3aed;
        }
        .zen-headline {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .zen-description {
          max-width: 580px;
          margin: 0 auto 2.25rem;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .zen-tips-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          max-width: 680px;
          margin: 0 auto;
        }
        .zen-tip-box {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.15rem 1.35rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-glass);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
        }
        .zen-tip-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tip-icon-cyan { color: #0284c7; }
        .tip-icon-emerald { color: #059669; }
        .tip-icon-amber { color: #d97706; }
        .zen-tip-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .zen-tip-detail {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }
        .exercises-stack {
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 640px) {
          .session-hero-card {
            padding: 1.5rem;
          }
          .hero-split-name {
            font-size: 1.5rem;
          }
          .hero-meta-badge {
            width: 100%;
          }
          .exercise-count-pod {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
