import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DAY_SCHEDULES } from '../data/initialWorkoutPlan';
import { StorageService } from '../services/storageService';
import { PlanService } from '../services/planService';
import { Exercise, WorkoutDayLog, SetRecord, DaySchedule, UserProfile } from '../types/workout';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

interface UseWorkoutSessionOptions {
  user: UserProfile | null;
  partner: UserProfile | null;
  onStartRest?: (duration?: number) => void;
}

export function useWorkoutSession({ user, partner, onStartRest }: UseWorkoutSessionOptions) {
  const [planRefreshKey, setPlanRefreshKey] = useState<number>(0);

  // Dynamic profiles (Partner 1 = Lead/Primary, Partner 2 = Partner)
  const isUserPrimary = user?.isPrimary ?? true;
  const partner1 = isUserPrimary ? user : partner;
  const partner2 = isUserPrimary ? partner : user;
  const p1Name = partner1?.name || 'Partner 1';
  const p2Name = partner2?.name || 'Partner 2';

  // Active profile selection
  const [activeProfileId, setActiveProfileId] = useState<'person_1' | 'person_2'>(() => {
    const saved = StorageService.getActiveProfileId();
    return saved === 'person_2' ? 'person_2' : 'person_1';
  });

  // Today and selected day
  const todayKey = StorageService.getTodayDayKey();
  const todayDateStr = StorageService.getTodayDateStr();
  const initialDayKey = todayKey === 'sunday' || todayKey === 'wednesday' ? 'monday' : todayKey;
  const [selectedDayKey, setSelectedDayKey] = useState<string>(initialDayKey);

  // Day logs indexed by `${profileId}_${dayKey}`
  const [dayLogs, setDayLogs] = useState<Record<string, WorkoutDayLog>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dynamic exercises from SQLite
  const [customP1Exercises, setCustomP1Exercises] = useState<Exercise[] | null>(null);
  const [customP2Exercises, setCustomP2Exercises] = useState<Exercise[] | null>(null);

  // Load exercises from SQLite
  useEffect(() => {
    let active = true;
    PlanService.getExercises('person_1', selectedDayKey).then((list) => {
      if (active) setCustomP1Exercises(list);
    });
    PlanService.getExercises('person_2', selectedDayKey).then((list) => {
      if (active) setCustomP2Exercises(list);
    });
    return () => {
      active = false;
    };
  }, [selectedDayKey, planRefreshKey]);

  // Load and hydrate day logs
  useEffect(() => {
    let active = true;
    ['person_1', 'person_2'].forEach((pId) => {
      const logKey = `${pId}_${selectedDayKey}`;
      if (!dayLogs[logKey]) {
        const loaded = StorageService.getDayLog(pId, todayDateStr, selectedDayKey);
        setDayLogs((prev) => ({ ...prev, [logKey]: loaded }));
      }

      setIsSyncing(true);
      StorageService.fetchRemoteDayLog(pId, todayDateStr, selectedDayKey)
        .then((remoteLog) => {
          if (active && remoteLog) {
            setDayLogs((prev) => ({ ...prev, [logKey]: remoteLog }));
          }
        })
        .finally(() => {
          if (active) setIsSyncing(false);
        });
    });

    return () => {
      active = false;
    };
  }, [selectedDayKey, todayDateStr]);

  const toggleActiveProfile = () => {
    const nextId: 'person_1' | 'person_2' = activeProfileId === 'person_1' ? 'person_2' : 'person_1';
    setActiveProfileId(nextId);
    StorageService.setActiveProfileId(nextId);
  };

  const currentSchedule: DaySchedule =
    DAY_SCHEDULES.find((d) => d.key === selectedDayKey) ?? DAY_SCHEDULES[0]!;

  const p1Exercises: Exercise[] = customP1Exercises ?? [];
  const p2Exercises: Exercise[] = customP2Exercises ?? [];

  const p1LogKey = `person_1_${selectedDayKey}`;
  const p2LogKey = `person_2_${selectedDayKey}`;

  const p1DayLog: WorkoutDayLog =
    dayLogs[p1LogKey] || StorageService.getDayLog('person_1', todayDateStr, selectedDayKey);
  const p2DayLog: WorkoutDayLog =
    dayLogs[p2LogKey] || StorageService.getDayLog('person_2', todayDateStr, selectedDayKey);

  // Update set progress
  const updateSet = (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => {
    const isTargetP1 = profileId === 'person_1';
    const targetLog = isTargetP1 ? p1DayLog : p2DayLog;
    const targetExercises = isTargetP1 ? p1Exercises : p2Exercises;

    const exProgress = targetLog?.exercisesProgress[exerciseId] || {
      exerciseId,
      sets: [],
      isFullyCompleted: false,
    };

    const sets = [...exProgress.sets];
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
      const wasCompleted = currentSet.isCompleted;
      const isNowCompleted = updates.isCompleted ?? wasCompleted;

      sets[setIdx] = {
        ...currentSet,
        ...updates,
        setNumber: updates.setNumber ?? currentSet.setNumber,
      };

      // Auto start rest timer on newly completed set
      if (!wasCompleted && isNowCompleted && onStartRest) {
        onStartRest();
        haptics.success();
        audio.playSetComplete();
      }
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

    const allExIds = targetExercises.map((e) => e.id);
    const completedExCount = allExIds.filter(
      (id) => updatedLog.exercisesProgress[id]?.isFullyCompleted
    ).length;
    const completedPct =
      allExIds.length > 0 ? Math.round((completedExCount / allExIds.length) * 100) : 0;
    updatedLog.completedPercentage = completedPct;
    updatedLog.isWorkoutFinished = completedPct === 100;

    StorageService.saveDayLog(updatedLog);
    setDayLogs((prev) => ({ ...prev, [logKey]: updatedLog }));

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

  // Day Completion map for navigation
  const dayCompletionStatus: Record<string, boolean> = {};
  for (const d of DAY_SCHEDULES) {
    const log = dayLogs[`${activeProfileId}_${d.key}`];
    dayCompletionStatus[d.key] = log ? log.isWorkoutFinished : false;
  }

  // Calculate pair progress stats
  const totalStations = Math.max(p1Exercises.length, p2Exercises.length);
  let p1CompletedSets = 0;
  let p1TotalSets = 0;
  p1Exercises.forEach((ex) => {
    p1TotalSets += ex.targetSets;
    const progress = p1DayLog?.exercisesProgress[ex.id];
    if (progress) {
      p1CompletedSets += progress.sets.filter((s) => s.isCompleted).length;
    }
  });

  let p2CompletedSets = 0;
  let p2TotalSets = 0;
  p2Exercises.forEach((ex) => {
    p2TotalSets += ex.targetSets;
    const progress = p2DayLog?.exercisesProgress[ex.id];
    if (progress) {
      p2CompletedSets += progress.sets.filter((s) => s.isCompleted).length;
    }
  });

  return {
    partner1,
    partner2,
    p1Name,
    p2Name,
    activeProfileId,
    setActiveProfileId,
    toggleActiveProfile,
    todayKey,
    selectedDayKey,
    setSelectedDayKey,
    currentSchedule,
    p1Exercises,
    p2Exercises,
    p1DayLog,
    p2DayLog,
    updateSet,
    isSyncing,
    dayCompletionStatus,
    stats: {
      totalStations,
      p1CompletedSets,
      p1TotalSets,
      p2CompletedSets,
      p2TotalSets,
    },
    reloadPlan: () => {
      setDayLogs({});
      setPlanRefreshKey((k) => k + 1);
    },
  };
}
