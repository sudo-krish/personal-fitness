import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Check,
  Clock,
  Plus,
  Minus,
  X,
  Users,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Exercise, WorkoutDayLog, SetRecord, DaySchedule } from '../../types/workout';
import { getMuscleIcon, getEquipmentInfo } from '../../lib/assetsMap';
import { audio } from '../../lib/audio';
import { haptics } from '../../lib/haptics';

interface PairWorkoutViewProps {
  schedule: DaySchedule;
  krishExercises: Exercise[];
  thejuExercises: Exercise[];
  krishLog: WorkoutDayLog;
  thejuLog: WorkoutDayLog;
  activeProfile: 'krish' | 'theju';
  onUpdateSet: (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => void;
  onOpenVideo: (url: string, title: string) => void;
  restSecondsRemaining: number;
  isRestRunning: boolean;
  onStartRest: (duration?: number) => void;
  onAdjustRest: (delta: number) => void;
  onSkipRest: () => void;
  coverImage: string;
}

interface StationPairItem {
  stationIndex: number;
  stationLabel: string;
  pairKey: string;
  krishEx?: Exercise;
  thejuEx?: Exercise;
  equipmentSynergy?: string;
  muscleSynergy?: string;
}

export const PairWorkoutView: React.FC<PairWorkoutViewProps> = ({
  schedule,
  krishExercises,
  thejuExercises,
  krishLog,
  thejuLog,
  activeProfile,
  onUpdateSet,
  onOpenVideo,
  restSecondsRemaining,
  isRestRunning,
  onStartRest,
  onAdjustRest,
  onSkipRest,
  coverImage,
}) => {
  // Station filter: null for all stations, or station index (0, 1, 2...)
  const [selectedStationFilter, setSelectedStationFilter] = useState<number | null>(null);

  // Group exercises into side-by-side stations
  const stations: StationPairItem[] = useMemo(() => {
    const maxLen = Math.max(krishExercises.length, thejuExercises.length);
    const list: StationPairItem[] = [];

    for (let i = 0; i < maxLen; i++) {
      const kEx = krishExercises[i];
      const tEx = thejuExercises[i];

      const rawPair = kEx?.pair || tEx?.pair || `Station ${i + 1}`;
      const pairKey = rawPair.toUpperCase();

      // Check equipment synergy
      let equipmentSynergy = '';
      if (kEx && tEx) {
        const kEq = getEquipmentInfo(kEx.name).name;
        const tEq = getEquipmentInfo(tEx.name).name;
        if (kEq === tEq) {
          equipmentSynergy = `Shared: ${kEq}`;
        } else {
          equipmentSynergy = `${kEq} + ${tEq}`;
        }
      }

      list.push({
        stationIndex: i,
        stationLabel: `Station ${String(i + 1).padStart(2, '0')}`,
        pairKey,
        krishEx: kEx,
        thejuEx: tEx,
        equipmentSynergy,
        muscleSynergy: kEx?.muscle || tEx?.muscle || '',
      });
    }

    return list;
  }, [krishExercises, thejuExercises]);

  // Overall Completion stats
  const krishCompletedCount = useMemo(() => {
    return krishExercises.filter(
      (e) => krishLog?.exercisesProgress?.[e.id]?.isFullyCompleted
    ).length;
  }, [krishExercises, krishLog]);

  const thejuCompletedCount = useMemo(() => {
    return thejuExercises.filter(
      (e) => thejuLog?.exercisesProgress?.[e.id]?.isFullyCompleted
    ).length;
  }, [thejuExercises, thejuLog]);

  const krishPct = krishExercises.length
    ? Math.round((krishCompletedCount / krishExercises.length) * 100)
    : 0;
  const thejuPct = thejuExercises.length
    ? Math.round((thejuCompletedCount / thejuExercises.length) * 100)
    : 0;

  // Filtered stations
  const displayedStations = useMemo(() => {
    if (selectedStationFilter === null) return stations;
    return stations.filter((s) => s.stationIndex === selectedStationFilter);
  }, [stations, selectedStationFilter]);

  // Handler to toggle set completion for either partner
  const handleToggleSetCompletion = (
    profileId: 'person_1' | 'person_2',
    exercise: Exercise,
    setNum: number,
    currentSet?: SetRecord
  ) => {
    const isCompleted = !currentSet?.isCompleted;
    if (isCompleted) {
      audio.playSetComplete();
      haptics.success();
      // Trigger rest timer if not already running
      if (!isRestRunning) {
        onStartRest(60);
      }
    } else {
      haptics.tap();
    }

    onUpdateSet(profileId, exercise.id, setNum, {
      isCompleted,
      weightKg: currentSet?.weightKg || '0',
      repsCompleted: currentSet?.repsCompleted || exercise.targetReps.split('-')[0] || '10',
    });
  };

  // Handler to update weight/reps input
  const handleSetChange = (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNum: number,
    field: 'weightKg' | 'repsCompleted',
    val: string
  ) => {
    onUpdateSet(profileId, exerciseId, setNum, {
      [field]: val,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. Liquid Glass Hero Banner */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '124px',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <img
          src={coverImage}
          alt={schedule.splitTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Technical Precision Corner Crosshairs */}
        <span className="tech-crosshair tl" style={{ color: '#FFFFFF', opacity: 0.85 }}>+</span>
        <span className="tech-crosshair tr" style={{ color: '#FFFFFF', opacity: 0.85 }}>+</span>
        <span className="tech-crosshair bl" style={{ color: '#FFFFFF', opacity: 0.85 }}>+</span>
        <span className="tech-crosshair br" style={{ color: '#FFFFFF', opacity: 0.85 }}>+</span>

        {/* Gradient Scrim Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.92) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '12px 16px',
            color: '#FFFFFF',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                }}
              >
                <Users style={{ width: '11px', height: '11px' }} />
                <span>PAIR SYNC WORKOUT</span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: '#94A3B8',
                }}
              >
                {schedule.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--azure)' }}>
                K: {krishPct}%
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>•</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--rose)' }}>
                T: {thejuPct}%
              </span>
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-athletic)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {schedule.splitTitle}
          </h2>
        </div>
      </div>

      {/* 2. Side-by-Side Dual-Partner Scorecard Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {/* Krish Plan Card */}
        <div
          style={{
            position: 'relative',
            padding: '10px 12px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            border: activeProfile === 'krish' ? '1.5px solid var(--azure)' : '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                }}
              >
                K
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                Krish
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: 'var(--azure)',
              }}
            >
              {krishCompletedCount}/{krishExercises.length} Done
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: '#E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${krishPct}%`,
                height: '100%',
                backgroundColor: 'var(--azure)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Theju Plan Card */}
        <div
          style={{
            position: 'relative',
            padding: '10px 12px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            border: activeProfile === 'theju' ? '1.5px solid var(--rose)' : '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                }}
              >
                T
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                Theju
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: 'var(--rose)',
              }}
            >
              {thejuCompletedCount}/{thejuExercises.length} Done
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: '#E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${thejuPct}%`,
                height: '100%',
                backgroundColor: 'var(--rose)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Synchronized Rest Timer Banner (if active) */}
      <AnimatePresence>
        {isRestRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock style={{ width: '15px', height: '15px' }} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#D97706',
                  }}
                >
                  Partner Rest Interval
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-athletic)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#92400E',
                    lineHeight: 1,
                  }}
                >
                  {String(Math.floor(restSecondsRemaining / 60)).padStart(2, '0')}:
                  {String(restSecondsRemaining % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onAdjustRest(-15)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  backgroundColor: '#FFFFFF',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="-15 seconds"
              >
                <Minus style={{ width: '13px', height: '13px' }} />
              </button>

              <button
                type="button"
                onClick={() => onAdjustRest(15)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  backgroundColor: '#FFFFFF',
                  color: '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="+15 seconds"
              >
                <Plus style={{ width: '13px', height: '13px' }} />
              </button>

              <button
                type="button"
                onClick={onSkipRest}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#92400E',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X style={{ width: '12px', height: '12px' }} />
                <span>Skip</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Station Stepper / Planning Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setSelectedStationFilter(null);
          }}
          style={{
            padding: '5px 10px',
            borderRadius: '10px',
            border: selectedStationFilter === null ? '1px solid #0F172A' : '1px solid #E2E8F0',
            backgroundColor: selectedStationFilter === null ? '#0F172A' : 'rgba(255, 255, 255, 0.85)',
            color: selectedStationFilter === null ? '#FFFFFF' : '#475569',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          All Stations ({stations.length})
        </button>

        {stations.map((s, idx) => {
          const isSelected = selectedStationFilter === idx;
          const kDone = s.krishEx
            ? krishLog?.exercisesProgress?.[s.krishEx.id]?.isFullyCompleted
            : false;
          const tDone = s.thejuEx
            ? thejuLog?.exercisesProgress?.[s.thejuEx.id]?.isFullyCompleted
            : false;
          const isStationAllDone = kDone && tDone;

          return (
            <button
              key={`st-nav-${idx}`}
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedStationFilter(idx);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 9px',
                borderRadius: '10px',
                border: isSelected
                  ? '1.5px solid var(--azure)'
                  : isStationAllDone
                  ? '1px solid var(--emerald-border)'
                  : '1px solid #E2E8F0',
                backgroundColor: isSelected
                  ? 'var(--azure-light)'
                  : isStationAllDone
                  ? 'var(--emerald-light)'
                  : 'rgba(255, 255, 255, 0.85)',
                color: isSelected
                  ? 'var(--azure)'
                  : isStationAllDone
                  ? 'var(--emerald)'
                  : '#475569',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {isStationAllDone ? (
                <CheckCircle2 style={{ width: '12px', height: '12px' }} />
              ) : (
                <span>{s.pairKey}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Side-by-Side Stations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayedStations.map((station) => {
          const { krishEx, thejuEx, stationLabel, pairKey, equipmentSynergy } = station;

          const kProgress = krishEx ? krishLog?.exercisesProgress?.[krishEx.id] : undefined;
          const tProgress = thejuEx ? thejuLog?.exercisesProgress?.[thejuEx.id] : undefined;

          const kIsDone = kProgress?.isFullyCompleted || false;
          const tIsDone = tProgress?.isFullyCompleted || false;

          return (
            <div
              key={`pair-station-${station.stationIndex}`}
              style={{
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: 'var(--glass-shadow)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative',
              }}
            >
              {/* Technical Precision Corner Crosshairs */}
              <span className="tech-crosshair tl" style={{ opacity: 0.35 }}>+</span>
              <span className="tech-crosshair tr" style={{ opacity: 0.35 }}>+</span>

              {/* Station Shared Header Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                    }}
                  >
                    {stationLabel}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-athletic)',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {pairKey}
                  </span>

                  {equipmentSynergy && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#F1F5F9',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      <Zap style={{ width: '10px', height: '10px', color: 'var(--amber)' }} />
                      <span>{equipmentSynergy}</span>
                    </span>
                  )}
                </div>

                {/* Quick 60s Rest Start Button */}
                <button
                  type="button"
                  onClick={() => onStartRest(60)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Start 60s rest timer for both partners"
                >
                  <Clock style={{ width: '11px', height: '11px' }} />
                  <span>Rest 60s</span>
                </button>
              </div>

              {/* Side-by-Side Dual Exercise Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                {/* ----------------- KRISH COLUMN (LEFT) ----------------- */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    borderRadius: '16px',
                    backgroundColor: kIsDone ? 'rgba(236, 253, 245, 0.45)' : 'rgba(240, 249, 255, 0.45)',
                    border: kIsDone
                      ? '1px solid var(--emerald-border)'
                      : '1px solid rgba(186, 230, 253, 0.65)',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                    gap: '8px',
                  }}
                >
                  {/* Krish Header & Form Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5625rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        K
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          color: 'var(--azure)',
                        }}
                      >
                        KRISH
                      </span>
                    </div>

                    {krishEx?.videoUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(krishEx.videoUrl!, krishEx.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--azure)',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        title="Form technique video"
                      >
                        <Play style={{ width: '9px', height: '9px', fill: 'currentColor' }} />
                        <span>Form</span>
                      </button>
                    )}
                  </div>

                  {/* Krish Exercise Name */}
                  {krishEx ? (
                    <div>
                      <h4
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: 0,
                          lineHeight: 1.25,
                        }}
                      >
                        {krishEx.name}
                      </h4>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            color: '#475569',
                            backgroundColor: '#FFFFFF',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {getMuscleIcon(krishEx.muscle)}
                          <span>{krishEx.muscle.split(',')[0]}</span>
                        </span>

                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            color: 'var(--azure)',
                          }}
                        >
                          {krishEx.targetSets}s × {krishEx.targetReps}
                        </span>
                      </div>

                      {/* Coach Notes */}
                      {krishEx.notes && (
                        <div
                          style={{
                            fontSize: '0.625rem',
                            color: '#64748B',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            marginTop: '4px',
                            lineHeight: 1.2,
                          }}
                        >
                          💡 {krishEx.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Rest / Spotter</span>
                  )}

                  {/* Krish Sets Logger */}
                  {krishEx && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {Array.from({ length: krishEx.targetSets }).map((_, sIdx) => {
                        const setNum = sIdx + 1;
                        const setRec = kProgress?.sets?.[sIdx];
                        const isSetDone = setRec?.isCompleted || false;

                        return (
                          <div
                            key={`k-set-${krishEx.id}-${setNum}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px',
                              padding: '3px 5px',
                              borderRadius: '8px',
                              backgroundColor: isSetDone ? '#ECFDF5' : '#FFFFFF',
                              border: isSetDone ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.625rem',
                                fontWeight: 800,
                                color: isSetDone ? 'var(--emerald)' : '#64748B',
                                width: '16px',
                              }}
                            >
                              S{setNum}
                            </span>

                            {/* Weight input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={setRec?.weightKg || ''}
                                placeholder="kg"
                                onChange={(e) =>
                                  handleSetChange('person_1', krishEx.id, setNum, 'weightKg', e.target.value)
                                }
                                style={{
                                  width: '32px',
                                  padding: '2px 3px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0F172A',
                                }}
                              />
                            </div>

                            {/* Reps input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={setRec?.repsCompleted || ''}
                                placeholder="reps"
                                onChange={(e) =>
                                  handleSetChange('person_1', krishEx.id, setNum, 'repsCompleted', e.target.value)
                                }
                                style={{
                                  width: '30px',
                                  padding: '2px 3px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0F172A',
                                }}
                              />
                            </div>

                            {/* Checkmark Complete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSetCompletion('person_1', krishEx, setNum, setRec)
                              }
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: isSetDone ? 'var(--emerald)' : '#F1F5F9',
                                color: isSetDone ? '#FFFFFF' : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                              title="Mark set complete"
                            >
                              <Check style={{ width: '13px', height: '13px', strokeWidth: 3 }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ----------------- THEJU COLUMN (RIGHT) ----------------- */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    borderRadius: '16px',
                    backgroundColor: tIsDone ? 'rgba(236, 253, 245, 0.45)' : 'rgba(255, 241, 242, 0.45)',
                    border: tIsDone
                      ? '1px solid var(--emerald-border)'
                      : '1px solid rgba(254, 205, 211, 0.65)',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                    gap: '8px',
                  }}
                >
                  {/* Theju Header & Form Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5625rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        T
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          color: 'var(--rose)',
                        }}
                      >
                        THEJU
                      </span>
                    </div>

                    {thejuEx?.videoUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(thejuEx.videoUrl!, thejuEx.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          border: '1px solid rgba(225, 29, 72, 0.3)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--rose)',
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        title="Form technique video"
                      >
                        <Play style={{ width: '9px', height: '9px', fill: 'currentColor' }} />
                        <span>Form</span>
                      </button>
                    )}
                  </div>

                  {/* Theju Exercise Name */}
                  {thejuEx ? (
                    <div>
                      <h4
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          margin: 0,
                          lineHeight: 1.25,
                        }}
                      >
                        {thejuEx.name}
                      </h4>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            color: '#475569',
                            backgroundColor: '#FFFFFF',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          {getMuscleIcon(thejuEx.muscle)}
                          <span>{thejuEx.muscle.split(',')[0]}</span>
                        </span>

                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            color: 'var(--rose)',
                          }}
                        >
                          {thejuEx.targetSets}s × {thejuEx.targetReps}
                        </span>
                      </div>

                      {/* Coach Notes */}
                      {thejuEx.notes && (
                        <div
                          style={{
                            fontSize: '0.625rem',
                            color: '#64748B',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            marginTop: '4px',
                            lineHeight: 1.2,
                          }}
                        >
                          💡 {thejuEx.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Rest / Spotter</span>
                  )}

                  {/* Theju Sets Logger */}
                  {thejuEx && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {Array.from({ length: thejuEx.targetSets }).map((_, sIdx) => {
                        const setNum = sIdx + 1;
                        const setRec = tProgress?.sets?.[sIdx];
                        const isSetDone = setRec?.isCompleted || false;

                        return (
                          <div
                            key={`t-set-${thejuEx.id}-${setNum}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px',
                              padding: '3px 5px',
                              borderRadius: '8px',
                              backgroundColor: isSetDone ? '#ECFDF5' : '#FFFFFF',
                              border: isSetDone ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.625rem',
                                fontWeight: 800,
                                color: isSetDone ? 'var(--emerald)' : '#64748B',
                                width: '16px',
                              }}
                            >
                              S{setNum}
                            </span>

                            {/* Weight input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={setRec?.weightKg || ''}
                                placeholder="kg"
                                onChange={(e) =>
                                  handleSetChange('person_2', thejuEx.id, setNum, 'weightKg', e.target.value)
                                }
                                style={{
                                  width: '32px',
                                  padding: '2px 3px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0F172A',
                                }}
                              />
                            </div>

                            {/* Reps input */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={setRec?.repsCompleted || ''}
                                placeholder="reps"
                                onChange={(e) =>
                                  handleSetChange('person_2', thejuEx.id, setNum, 'repsCompleted', e.target.value)
                                }
                                style={{
                                  width: '30px',
                                  padding: '2px 3px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0F172A',
                                }}
                              />
                            </div>

                            {/* Checkmark Complete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSetCompletion('person_2', thejuEx, setNum, setRec)
                              }
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: isSetDone ? 'var(--emerald)' : '#F1F5F9',
                                color: isSetDone ? '#FFFFFF' : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                              title="Mark set complete"
                            >
                              <Check style={{ width: '13px', height: '13px', strokeWidth: 3 }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PairWorkoutView;
