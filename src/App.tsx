import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';

import { DAY_SCHEDULES, WORKOUT_PLAN_DATA } from './data/initialWorkoutPlan';
import { StorageService } from './services/storageService';
import { PlanService } from './services/planService';
import { Exercise, WorkoutDayLog, SetRecord, DaySchedule } from './types/workout';
import { getSplitCoverPath } from './lib/assetsMap';
import { audio } from './lib/audio';
import { haptics } from './lib/haptics';
import { useRestTimer } from './hooks/useRestTimer';

// Mobile-First Components
import { TopAppBar } from './components/mobile/TopAppBar';
import { DaysBottomNav } from './components/mobile/DaysBottomNav';
import { PairWorkoutView } from './components/mobile/PairWorkoutView';
import { FullWorkoutListView } from './components/mobile/FullWorkoutListView';
import { ExerciseListDrawer } from './components/mobile/ExerciseListDrawer';
import { VideoDrawer } from './components/mobile/VideoDrawer';
import { SidebarNavigation } from './components/mobile/SidebarNavigation';
import { PlanEditorView } from './components/mobile/PlanEditorView';
import { Dumbbell, Sparkles, Users, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const App: React.FC = () => {
  // Navigation & Page View: 'workout' (Daily Tracker) vs 'plan-editor' (Customization View)
  const [activePageView, setActivePageView] = useState<'workout' | 'plan-editor'>('workout');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [planRefreshKey, setPlanRefreshKey] = useState<number>(0);

  // Profiles State: Person 1 (Krish) ⇄ Person 2 (Theju)
  const [activeProfileId, setActiveProfileId] = useState<string>(() =>
    StorageService.getActiveProfileId()
  );

  const isKrish = activeProfileId === 'person_1';
  const activeProfileKey: 'krish' | 'theju' = isKrish ? 'krish' : 'theju';

  // Navigation & Day Selection:
  const todayKey = StorageService.getTodayDayKey();
  const todayDateStr = StorageService.getTodayDateStr();
  const initialDayKey = todayKey === 'sunday' || todayKey === 'wednesday' ? 'monday' : todayKey;
  const [selectedDayKey, setSelectedDayKey] = useState<string>(initialDayKey);

  // View Mode: 'pair' (side-by-side synchronized view) vs 'list' (single-user scrollable list)
  const [viewMode, setViewMode] = useState<'pair' | 'list'>('pair');

  // Active Exercise selection for drawers
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);

  // Day Logs State (indexed by `${profileId}_${dayKey}`)
  const [dayLogs, setDayLogs] = useState<Record<string, WorkoutDayLog>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dynamic Exercises loaded from SQLite (fitness.db)
  const [customKrishExercises, setCustomKrishExercises] = useState<Exercise[] | null>(null);
  const [customThejuExercises, setCustomThejuExercises] = useState<Exercise[] | null>(null);

  // Drawers
  const [isExerciseListOpen, setIsExerciseListOpen] = useState<boolean>(false);
  const [videoDrawerOpen, setVideoDrawerOpen] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string }>({
    url: '',
    title: '',
  });

  // Rest Timer State & Controls (decoupled via useRestTimer hook)
  const {
    restSecondsRemaining,
    isRestTimerRunning,
    startRestTimer: handleStartRestTimer,
    adjustRestTime: handleAdjustRestTime,
    skipRest: handleSkipRest,
  } = useRestTimer();

  // Load exercises from SQLite (fitness.db)
  useEffect(() => {
    PlanService.getExercises('person_1', selectedDayKey).then((list) => {
      setCustomKrishExercises(list);
    });
    PlanService.getExercises('person_2', selectedDayKey).then((list) => {
      setCustomThejuExercises(list);
    });
  }, [selectedDayKey, planRefreshKey]);

  // Load Day Logs for both Person 1 (Krish) and Person 2 (Theju)
  useEffect(() => {
    ['person_1', 'person_2'].forEach((pId) => {
      const logKey = `${pId}_${selectedDayKey}`;
      if (!dayLogs[logKey]) {
        const loaded = StorageService.getDayLog(pId, todayDateStr, selectedDayKey);
        setDayLogs((prev) => ({ ...prev, [logKey]: loaded }));
      }

      // Hydrate from SQLite / Cloudflare D1
      setIsSyncing(true);
      StorageService.fetchRemoteDayLog(pId, todayDateStr, selectedDayKey)
        .then((remoteLog) => {
          if (remoteLog) {
            setDayLogs((prev) => ({ ...prev, [logKey]: remoteLog }));
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    });
  }, [selectedDayKey, todayDateStr]);

  // Toggle Profile (Krish ⇄ Theju)
  const handleToggleProfile = () => {
    const nextId = activeProfileId === 'person_1' ? 'person_2' : 'person_1';
    setActiveProfileId(nextId);
    StorageService.setActiveProfileId(nextId);
    setCurrentExerciseIndex(0);
  };

  // Current Schedule & Exercises for both partners
  const fallbackSchedule: DaySchedule = DAY_SCHEDULES[0] ?? {
    key: 'monday',
    name: 'Monday',
    splitTitle: 'Push (Chest, Shoulders, Triceps)',
    shortName: 'Mon',
    isRest: false,
    focusDescription: 'Chest & shoulder pressing, tricep extensions with supersets.',
  };
  const currentSchedule: DaySchedule =
    DAY_SCHEDULES.find((d) => d.key === selectedDayKey) ?? fallbackSchedule;
  const krishExercises: Exercise[] =
    customKrishExercises || WORKOUT_PLAN_DATA['person_1']?.[selectedDayKey] || [];
  const thejuExercises: Exercise[] =
    customThejuExercises || WORKOUT_PLAN_DATA['person_2']?.[selectedDayKey] || [];

  const krishLogKey = `person_1_${selectedDayKey}`;
  const thejuLogKey = `person_2_${selectedDayKey}`;

  const krishDayLog: WorkoutDayLog =
    dayLogs[krishLogKey] || StorageService.getDayLog('person_1', todayDateStr, selectedDayKey);
  const thejuDayLog: WorkoutDayLog =
    dayLogs[thejuLogKey] || StorageService.getDayLog('person_2', todayDateStr, selectedDayKey);

  // Active profile exercises & log (for single list view & drawer)
  const currentExercises: Exercise[] = isKrish ? krishExercises : thejuExercises;
  const currentDayLog: WorkoutDayLog = isKrish ? krishDayLog : thejuDayLog;

  const safeExerciseIndex = Math.min(
    Math.max(0, currentExerciseIndex),
    Math.max(0, currentExercises.length - 1)
  );

  // Handle set update
  const handleUpdateSet = (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => {
    const isTargetKrish = profileId === 'person_1';
    const targetLog = isTargetKrish ? krishDayLog : thejuDayLog;
    const targetExercises = isTargetKrish ? krishExercises : thejuExercises;

    const exProgress = targetLog?.exercisesProgress[exerciseId] || {
      exerciseId,
      sets: [],
      isFullyCompleted: false,
    };

    const sets = [...exProgress.sets];

    // Ensure we have enough sets up to the target
    const currentEx = targetExercises.find((e) => e.id === exerciseId);
    const targetSetsCount = currentEx ? currentEx.targetSets : setNumber;

    while (sets.length < targetSetsCount) {
      sets.push({
        setNumber: sets.length + 1,
        weightKg: '0',
        repsCompleted: '0',
        rpeAchieved: '',
        isCompleted: false,
      });
    }

    const setIdx = sets.findIndex((s) => s.setNumber === setNumber);
    const currentSet = sets[setIdx];
    if (setIdx !== -1 && currentSet) {
      sets[setIdx] = {
        ...currentSet,
        ...updates,
        setNumber: updates.setNumber ?? currentSet.setNumber,
      };
    }

    const isFullyCompleted = sets.length > 0 && sets.every((s) => s.isCompleted);

    const logKey = `${profileId}_${selectedDayKey}`;
    const updatedLog: WorkoutDayLog = {
      ...targetLog,
      exercisesProgress: {
        ...(targetLog?.exercisesProgress || {}),
        [exerciseId]: {
          ...exProgress,
          sets,
          isFullyCompleted,
        },
      },
    };

    // Calculate completion percentage
    const allExIds = targetExercises.map((e) => e.id);
    const completedExCount = allExIds.filter(
      (id) => updatedLog.exercisesProgress[id]?.isFullyCompleted
    ).length;
    const completedPct =
      allExIds.length > 0 ? Math.round((completedExCount / allExIds.length) * 100) : 0;
    updatedLog.completedPercentage = completedPct;
    updatedLog.isWorkoutFinished = completedPct === 100;

    // Save to local Storage & queue sync to SQLite (fitness.db)
    StorageService.saveDayLog(updatedLog);
    setDayLogs((prev) => ({ ...prev, [logKey]: updatedLog }));

    // If whole workout just finished, blast celebration!
    if (!targetLog.isWorkoutFinished && updatedLog.isWorkoutFinished) {
      audio.playCelebration();
      haptics.celebration();
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors:
            profileId === 'person_1'
              ? ['#0284C7', '#38BDF8', '#10B981']
              : ['#E11D48', '#FB7185', '#10B981'],
        });
      } catch {}
    }
  };

  // Video guide handler
  const handleOpenVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
    setVideoDrawerOpen(true);
  };

  // Reset all plans in SQLite
  const handleResetAllPlans = async () => {
    await PlanService.resetDayPlan('person_1', selectedDayKey);
    await PlanService.resetDayPlan('person_2', selectedDayKey);
    setPlanRefreshKey((prev) => prev + 1);
  };

  // Day Completion map for 7-day dock
  const dayCompletionStatus = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const d of DAY_SCHEDULES) {
      const log = dayLogs[`${activeProfileId}_${d.key}`];
      map[d.key] = log ? log.isWorkoutFinished : false;
    }
    return map;
  }, [activeProfileId, dayLogs]);

  const streak = StorageService.getUserStats(activeProfileId).currentStreak;
  const coverImage = getSplitCoverPath(selectedDayKey);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Ambient Liquid Floating Mesh Canvas */}
      <div className="liquid-ambient-canvas" aria-hidden="true">
        <div className="liquid-blob-azure" />
        <div className="liquid-blob-rose" />
        <div className="liquid-blob-center" />
      </div>

      {/* Top App Bar with Sidebar Menu Trigger */}
      <TopAppBar
        activeProfile={activeProfileKey}
        onToggleProfile={handleToggleProfile}
        onSelectProfile={(profile) => {
          const nextId = profile === 'krish' ? 'person_1' : 'person_2';
          setActiveProfileId(nextId);
          StorageService.setActiveProfileId(nextId);
          setCurrentExerciseIndex(0);
        }}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        isSyncing={isSyncing}
        streakCount={streak}
      />

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          padding: '12px 14px 96px 14px',
          flex: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {activePageView === 'plan-editor' ? (
          /* Exercise Plan Editor View */
          <PlanEditorView
            initialProfile={activeProfileKey}
            onBackToWorkout={() => setActivePageView('workout')}
            onOpenVideo={handleOpenVideo}
            onPlanChanged={() => setPlanRefreshKey((prev) => prev + 1)}
          />
        ) : (
          /* Daily Workout Tracking View */
          <AnimatePresence mode="wait">
            {currentSchedule.isRest ? (
              /* Active Recovery Rest Day View */
              <motion.div
                key="rest-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="focus-card"
                style={{ textAlign: 'center', padding: '36px 20px', marginTop: '12px' }}
              >
                {/* Technical Corner Crosshairs */}
                <span className="tech-crosshair tl">+</span>
                <span className="tech-crosshair tr">+</span>
                <span className="tech-crosshair bl">+</span>
                <span className="tech-crosshair br">+</span>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '9999px',
                    background: 'var(--emerald-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'var(--emerald)',
                  }}
                >
                  <Sparkles style={{ width: '32px', height: '32px' }} />
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--emerald)',
                  }}
                >
                  Recovery Day
                </span>

                <h2
                  style={{
                    fontFamily: 'var(--font-athletic)',
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: '#0F172A',
                    marginTop: '4px',
                  }}
                >
                  ACTIVE REST & RECHARGE
                </h2>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#64748B',
                    lineHeight: 1.5,
                    maxWidth: '320px',
                    margin: '8px auto 20px auto',
                  }}
                >
                  {currentSchedule.focusDescription ||
                    'Muscles grow while resting! Prioritize 20-30m brisk walking, hydration, and 8 hours of quality sleep.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '24px',
                  }}
                >
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: '#F1F5F9',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    🚶 30m Walk
                  </span>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: '#F1F5F9',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    💧 3L Water
                  </span>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: '#F1F5F9',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    😴 8h Sleep
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setSelectedDayKey('monday');
                    setCurrentExerciseIndex(0);
                    setViewMode('pair');
                  }}
                  className={`log-set-btn ${isKrish ? 'krish' : 'theju'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Dumbbell style={{ width: '18px', height: '18px' }} />
                  <span>START / PREVIEW PUSH DAY 1</span>
                </button>
              </motion.div>
            ) : (
              /* Active Workout Day: Pair Mode OR All Exercises List Mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Mode Segmented Control: [ 👥 Pair View (Side by Side) ] [ 📋 My Full List ] */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '4px',
                    backgroundColor: 'rgba(241, 245, 249, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    boxShadow:
                      'inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 2px 8px rgba(15, 23, 42, 0.03)',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setViewMode('pair');
                    }}
                    style={{
                      position: 'relative',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: viewMode === 'pair' ? '#0F172A' : '#64748B',
                      fontWeight: viewMode === 'pair' ? 800 : 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      zIndex: 1,
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {viewMode === 'pair' && (
                      <motion.div
                        layoutId="view-mode-pill"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06), inset 0 1px 1px #FFFFFF',
                          zIndex: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Users
                      style={{
                        width: '15px',
                        height: '15px',
                        color: isKrish ? 'var(--azure)' : 'var(--rose)',
                      }}
                    />
                    <span>Pair View (Side by Side)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setViewMode('list');
                    }}
                    style={{
                      position: 'relative',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: viewMode === 'list' ? '#0F172A' : '#64748B',
                      fontWeight: viewMode === 'list' ? 800 : 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      zIndex: 1,
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {viewMode === 'list' && (
                      <motion.div
                        layoutId="view-mode-pill"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06), inset 0 1px 1px #FFFFFF',
                          zIndex: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <ListOrdered
                      style={{
                        width: '15px',
                        height: '15px',
                        color: isKrish ? 'var(--azure)' : 'var(--rose)',
                      }}
                    />
                    <span>My Full List ({currentExercises.length})</span>
                  </button>
                </div>

                {/* View Mode Content */}
                {viewMode === 'list' ? (
                  <FullWorkoutListView
                    exercises={currentExercises}
                    dayLog={currentDayLog}
                    activeProfile={activeProfileKey}
                    onUpdateSet={(exId, setNum, upds) =>
                      handleUpdateSet(activeProfileId as 'person_1' | 'person_2', exId, setNum, upds)
                    }
                    onOpenVideo={handleOpenVideo}
                    onSelectFocusExercise={(idx) => {
                      setCurrentExerciseIndex(idx);
                      setViewMode('pair');
                    }}
                    coverImage={coverImage}
                    splitTitle={currentSchedule.splitTitle}
                    dayName={currentSchedule.name}
                    focusDescription={currentSchedule.focusDescription}
                  />
                ) : (
                  <PairWorkoutView
                    schedule={currentSchedule}
                    krishExercises={krishExercises}
                    thejuExercises={thejuExercises}
                    krishLog={krishDayLog}
                    thejuLog={thejuDayLog}
                    activeProfile={activeProfileKey}
                    onUpdateSet={handleUpdateSet}
                    onOpenVideo={handleOpenVideo}
                    restSecondsRemaining={restSecondsRemaining}
                    isRestRunning={isRestTimerRunning}
                    onStartRest={handleStartRestTimer}
                    onAdjustRest={handleAdjustRestTime}
                    onSkipRest={handleSkipRest}
                    coverImage={coverImage}
                  />
                )}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* 7-Day Schedule Bottom Navigation Dock */}
      {activePageView === 'workout' && (
        <DaysBottomNav
          schedules={DAY_SCHEDULES}
          selectedDayKey={selectedDayKey}
          onSelectDay={(dayKey) => {
            setSelectedDayKey(dayKey);
            setCurrentExerciseIndex(0);
          }}
          todayKey={todayKey}
          dayCompletionStatus={dayCompletionStatus}
          activeProfile={activeProfileKey}
          onOpenExerciseList={() => setIsExerciseListOpen(true)}
        />
      )}

      {/* Slide-Up Exercise List Drawer */}
      <ExerciseListDrawer
        isOpen={isExerciseListOpen}
        onOpenChange={setIsExerciseListOpen}
        exercises={currentExercises}
        currentExerciseIndex={safeExerciseIndex}
        onSelectExercise={(idx) => {
          setCurrentExerciseIndex(idx);
          setViewMode('pair');
        }}
        dayLog={currentDayLog}
        activeProfile={activeProfileKey}
        splitTitle={currentSchedule.splitTitle}
      />

      {/* Form Technique Demonstration Drawer */}
      <VideoDrawer
        isOpen={videoDrawerOpen}
        onOpenChange={setVideoDrawerOpen}
        videoUrl={selectedVideo.url}
        exerciseName={selectedVideo.title}
      />

      {/* Slide-out Sidebar Navigation Menu */}
      <SidebarNavigation
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activePageView}
        onSelectView={(view) => setActivePageView(view)}
        activeProfile={activeProfileKey}
        onToggleProfile={handleToggleProfile}
        onResetPlan={handleResetAllPlans}
      />
    </div>
  );
};

export default App;
