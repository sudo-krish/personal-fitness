import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DAY_SCHEDULES } from '../data/initialWorkoutPlan';
import { StorageService } from '../services/storageService';
import { PlanService } from '../services/planService';
import {
  Exercise,
  WorkoutDayLog,
  SetRecord,
  DaySchedule,
  UserProfile,
  ExerciseProgress,
} from '../types/workout';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

interface UseWorkoutSessionOptions {
  user: UserProfile | null;
  partner: UserProfile | null;
  onStartRest?: (duration?: number) => void;
}

function ensureSetsPadded(sets: SetRecord[], targetSetsCount: number): SetRecord[] {
  const padded = [...sets];
  while (padded.length < targetSetsCount) {
    padded.push({
      setNumber: padded.length + 1,
      weightKg: '0',
      repsCompleted: '0',
      rpeAchieved: '',
      isCompleted: false,
    });
  }
  return padded;
}

function applySetUpdate(
  sets: SetRecord[],
  setNumber: number,
  updates: Partial<SetRecord>,
  onNewlyCompleted?: () => void,
): SetRecord[] {
  const result = [...sets];
  const setIdx = result.findIndex(s => s.setNumber === setNumber);
  const currentSet = result[setIdx];

  if (setIdx !== -1 && currentSet) {
    const wasCompleted = currentSet.isCompleted;
    const isNowCompleted = updates.isCompleted ?? wasCompleted;

    result[setIdx] = {
      ...currentSet,
      ...updates,
      setNumber: updates.setNumber ?? currentSet.setNumber,
    };

    if (!wasCompleted && isNowCompleted && onNewlyCompleted) {
      onNewlyCompleted();
    }
  }
  return result;
}

function calculateWorkoutCompletion(
  exercisesProgress: Record<string, ExerciseProgress>,
  exerciseIds: string[],
): { completedPercentage: number; isWorkoutFinished: boolean } {
  if (exerciseIds.length === 0) return { completedPercentage: 0, isWorkoutFinished: false };

  const completedExCount = exerciseIds.filter(id => exercisesProgress[id]?.isFullyCompleted).length;

  const completedPercentage = Math.round((completedExCount / exerciseIds.length) * 100);
  return {
    completedPercentage,
    isWorkoutFinished: completedPercentage === 100,
  };
}

function triggerCelebration(profileId: string) {
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
  } catch {
    // Canvas confetti optional fallback
  }
}

function computeSetStats(exercises: Exercise[], dayLog?: WorkoutDayLog) {
  let completedSets = 0;
  let totalSets = 0;
  for (const ex of exercises) {
    totalSets += ex.targetSets;
    const progress = dayLog?.exercisesProgress[ex.id];
    if (progress) {
      completedSets += progress.sets.filter(s => s.isCompleted).length;
    }
  }
  return { completedSets, totalSets };
}

function derivePartners(user: UserProfile | null, partner: UserProfile | null) {
  const isUserPrimary = user?.isPrimary ?? true;
  const partner1 = isUserPrimary ? user : partner;
  const partner2 = isUserPrimary ? partner : user;
  const p1Name = partner1?.name || 'Partner 1';
  const p2Name = partner2?.name || 'Partner 2';
  return { partner1, partner2, p1Name, p2Name };
}

function resolveInitialDayKey(todayKey: string): string {
  if (todayKey === 'sunday' || todayKey === 'wednesday') {
    return 'monday';
  }
  return todayKey;
}

function buildDayCompletionStatus(
  dayLogs: Record<string, WorkoutDayLog>,
  activeProfileId: string,
): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  for (const d of DAY_SCHEDULES) {
    const log = dayLogs[`${activeProfileId}_${d.key}`];
    status[d.key] = log ? log.isWorkoutFinished : false;
  }
  return status;
}

function computeUpdatedDayLog(
  targetLog: WorkoutDayLog,
  targetExercises: Exercise[],
  exerciseId: string,
  setNumber: number,
  updates: Partial<SetRecord>,
  onNewlyCompleted?: () => void,
): WorkoutDayLog {
  const existing = targetLog.exercisesProgress[exerciseId];
  const exProgress: ExerciseProgress = existing ?? {
    exerciseId,
    sets: [],
    isFullyCompleted: false,
  };

  const currentEx = targetExercises.find(e => e.id === exerciseId);
  const targetSetsCount = currentEx?.targetSets ?? setNumber;
  const paddedSets = ensureSetsPadded(exProgress.sets, targetSetsCount);
  const updatedSets = applySetUpdate(paddedSets, setNumber, updates, onNewlyCompleted);
  const isFullyCompleted = updatedSets.length > 0 && updatedSets.every(s => s.isCompleted);

  const newProgress = {
    ...targetLog.exercisesProgress,
    [exerciseId]: {
      ...exProgress,
      sets: updatedSets,
      isFullyCompleted,
    },
  };

  const { completedPercentage, isWorkoutFinished } = calculateWorkoutCompletion(
    newProgress,
    targetExercises.map(e => e.id),
  );

  return {
    ...targetLog,
    exercisesProgress: newProgress,
    completedPercentage,
    isWorkoutFinished,
  };
}

export function useWorkoutSession({ user, partner, onStartRest }: UseWorkoutSessionOptions) {
  const [planRefreshKey, setPlanRefreshKey] = useState<number>(0);
  const { partner1, partner2, p1Name, p2Name } = derivePartners(user, partner);

  const [activeProfileId, setActiveProfileId] = useState<'person_1' | 'person_2'>(() => {
    const saved = StorageService.getActiveProfileId();
    return saved === 'person_2' ? 'person_2' : 'person_1';
  });

  const todayKey = StorageService.getTodayDayKey();
  const todayDateStr = StorageService.getTodayDateStr();
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() =>
    resolveInitialDayKey(todayKey),
  );

  const [dayLogs, setDayLogs] = useState<Record<string, WorkoutDayLog>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [customP1Exercises, setCustomP1Exercises] = useState<Exercise[] | null>(null);
  const [customP2Exercises, setCustomP2Exercises] = useState<Exercise[] | null>(null);

  useEffect(() => {
    let active = true;
    PlanService.getExercises('person_1', selectedDayKey).then(list => {
      if (active) setCustomP1Exercises(list);
    });
    PlanService.getExercises('person_2', selectedDayKey).then(list => {
      if (active) setCustomP2Exercises(list);
    });
    return () => {
      active = false;
    };
  }, [selectedDayKey, planRefreshKey]);

  useEffect(() => {
    let active = true;
    for (const pId of ['person_1', 'person_2'] as const) {
      const logKey = `${pId}_${selectedDayKey}`;
      if (!dayLogs[logKey]) {
        const loaded = StorageService.getDayLog(pId, todayDateStr, selectedDayKey);
        setDayLogs(prev => ({ ...prev, [logKey]: loaded }));
      }

      setIsSyncing(true);
      StorageService.fetchRemoteDayLog(pId, todayDateStr, selectedDayKey)
        .then(remoteLog => {
          if (active && remoteLog) {
            setDayLogs(prev => ({ ...prev, [logKey]: remoteLog }));
          }
        })
        .finally(() => {
          if (active) setIsSyncing(false);
        });
    }

    return () => {
      active = false;
    };
  }, [selectedDayKey, todayDateStr]);

  const toggleActiveProfile = () => {
    const nextId: 'person_1' | 'person_2' =
      activeProfileId === 'person_1' ? 'person_2' : 'person_1';
    setActiveProfileId(nextId);
    StorageService.setActiveProfileId(nextId);
  };

  const currentSchedule: DaySchedule =
    DAY_SCHEDULES.find(d => d.key === selectedDayKey) ?? DAY_SCHEDULES[0]!;

  const p1Exercises: Exercise[] = customP1Exercises ?? [];
  const p2Exercises: Exercise[] = customP2Exercises ?? [];

  const p1DayLog: WorkoutDayLog =
    dayLogs[`person_1_${selectedDayKey}`] ||
    StorageService.getDayLog('person_1', todayDateStr, selectedDayKey);
  const p2DayLog: WorkoutDayLog =
    dayLogs[`person_2_${selectedDayKey}`] ||
    StorageService.getDayLog('person_2', todayDateStr, selectedDayKey);

  const updateSet = (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>,
  ) => {
    const isTargetP1 = profileId === 'person_1';
    const targetLog = isTargetP1 ? p1DayLog : p2DayLog;
    const targetExercises = isTargetP1 ? p1Exercises : p2Exercises;

    const updatedLog = computeUpdatedDayLog(
      targetLog,
      targetExercises,
      exerciseId,
      setNumber,
      updates,
      () => {
        if (onStartRest) onStartRest();
        haptics.success();
        audio.playSetComplete();
      },
    );

    StorageService.saveDayLog(updatedLog);
    setDayLogs(prev => ({ ...prev, [`${profileId}_${selectedDayKey}`]: updatedLog }));

    if (!targetLog.isWorkoutFinished && updatedLog.isWorkoutFinished) {
      triggerCelebration(profileId);
    }
  };

  const dayCompletionStatus = buildDayCompletionStatus(dayLogs, activeProfileId);
  const p1Stats = computeSetStats(p1Exercises, p1DayLog);
  const p2Stats = computeSetStats(p2Exercises, p2DayLog);

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
      totalStations: Math.max(p1Exercises.length, p2Exercises.length),
      p1CompletedSets: p1Stats.completedSets,
      p1TotalSets: p1Stats.totalSets,
      p2CompletedSets: p2Stats.completedSets,
      p2TotalSets: p2Stats.totalSets,
    },
    reloadPlan: () => {
      setDayLogs({});
      setPlanRefreshKey(k => k + 1);
    },
  };
}
