import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Check, Plus, Minus, Users, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import { Exercise, WorkoutDayLog, SetRecord } from '../../types/workout';
import { getMuscleIcon, getEquipmentInfo } from '../../lib/assetsMap';
import { audio } from '../../lib/audio';
import { haptics } from '../../lib/haptics';

interface FullWorkoutListViewProps {
  exercises: Exercise[];
  dayLog: WorkoutDayLog;
  activeProfile: 'krish' | 'theju';
  onUpdateSet: (exerciseId: string, setNumber: number, updates: Partial<SetRecord>) => void;
  onOpenVideo: (url: string, title: string) => void;
  onSelectFocusExercise: (index: number) => void;
  coverImage: string;
  splitTitle: string;
  dayName: string;
  focusDescription: string;
}

export function FullWorkoutListView({
  exercises,
  dayLog,
  activeProfile,
  onUpdateSet,
  onOpenVideo,
  onSelectFocusExercise,
  coverImage,
  splitTitle,
  dayName,
  focusDescription,
}: FullWorkoutListViewProps) {
  const isKrish = activeProfile === 'krish';
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  const toggleCollapse = (exerciseId: string) => {
    haptics.tap();
    setCollapsedExercises((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  // Toggle single set completion
  const handleToggleSet = (exerciseId: string, set: SetRecord) => {
    const nextCompleted = !set.isCompleted;
    if (nextCompleted) {
      audio.playSetComplete();
      haptics.success();
    } else {
      haptics.tap();
    }

    onUpdateSet(exerciseId, set.setNumber, {
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    });
  };

  // Complete all sets for an exercise
  const handleCompleteAllSets = (exercise: Exercise, sets: SetRecord[]) => {
    audio.playCelebration();
    haptics.celebration();
    const defaultReps = exercise.targetReps.split('-')[0] || '10';

    sets.forEach((s) => {
      if (!s.isCompleted) {
        onUpdateSet(exercise.id, s.setNumber, {
          isCompleted: true,
          repsCompleted: s.repsCompleted !== '0' ? s.repsCompleted : defaultReps,
          completedAt: new Date().toISOString(),
        });
      }
    });
  };

  const handleAdjustWeight = (
    exerciseId: string,
    set: SetRecord,
    delta: number
  ) => {
    haptics.tap();
    const current = parseFloat(set.weightKg) || 0;
    const next = Math.max(0, parseFloat((current + delta).toFixed(1)));
    onUpdateSet(exerciseId, set.setNumber, { weightKg: next.toString() });
  };

  const handleAdjustReps = (
    exerciseId: string,
    set: SetRecord,
    delta: number
  ) => {
    haptics.tap();
    const current = parseInt(set.repsCompleted, 10) || 0;
    const next = Math.max(0, current + delta);
    onUpdateSet(exerciseId, set.setNumber, { repsCompleted: next.toString() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Liquid Glass Hero Cover Banner with Geometric Constructs */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '160px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <img
          src={coverImage}
          alt={splitTitle}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Technical Corner Crosshairs on Banner */}
        <span className="tech-crosshair tl" style={{ color: '#FFFFFF', opacity: 0.8 }}>+</span>
        <span className="tech-crosshair tr" style={{ color: '#FFFFFF', opacity: 0.8 }}>+</span>

        {/* Liquid Glass Scrim Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.88) 100%)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: isKrish ? 'var(--azure)' : 'var(--rose)',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              {dayName} • {isKrish ? 'Krish' : 'Theju'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8' }}>
              {dayLog?.completedPercentage ?? 0}% COMPLETED
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-athletic)',
              fontSize: '1.375rem',
              fontWeight: 900,
              color: '#FFFFFF',
              marginTop: '4px',
              lineHeight: 1.2,
            }}
          >
            {splitTitle}
          </h2>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#CBD5E1',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {focusDescription}
          </p>

          {/* Micro progress line */}
          <div
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${dayLog?.completedPercentage ?? 0}%`,
                height: '100%',
                backgroundColor: isKrish ? 'var(--azure)' : 'var(--rose)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Exercises List in Liquid Glass Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {exercises.map((exercise, index) => {
          const exProgress = dayLog?.exercisesProgress?.[exercise.id];
          const targetSetsCount = exercise.targetSets || 3;

          // Prepare sets
          let sets = exProgress?.sets || [];
          if (sets.length < targetSetsCount) {
            sets = Array.from({ length: targetSetsCount }, (_, i) => ({
              setNumber: i + 1,
              weightKg: sets[i]?.weightKg || '0',
              repsCompleted: sets[i]?.repsCompleted || '0',
              rpeAchieved: sets[i]?.rpeAchieved || '',
              isCompleted: sets[i]?.isCompleted || false,
            }));
          }

          const completedCount = sets.filter((s) => s.isCompleted).length;
          const isAllDone = completedCount === targetSetsCount && targetSetsCount > 0;
          const isCollapsed = collapsedExercises[exercise.id] || false;
          const equipment = getEquipmentInfo(exercise.name);

          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="focus-card"
              style={{
                padding: '16px',
                gap: '12px',
                border: isAllDone
                  ? '1.5px solid rgba(16, 185, 129, 0.45)'
                  : '1px solid var(--glass-border)',
                background: isAllDone
                  ? 'linear-gradient(180deg, rgba(236, 253, 245, 0.85) 0%, rgba(255, 255, 255, 0.8) 100%)'
                  : 'var(--glass-bg)',
              }}
            >
              {/* Technical Corner Crosshairs */}
              <span className="tech-crosshair tl">+</span>
              <span className="tech-crosshair tr">+</span>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '3px', cursor: 'pointer', flex: 1 }}
                  onClick={() => toggleCollapse(exercise.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="tech-tag">
                      {exercise.pair || `EX // 0${index + 1}`}
                    </span>
                    <span
                      className="tech-tag"
                      style={{ color: isKrish ? 'var(--azure)' : 'var(--rose)' }}
                    >
                      {getMuscleIcon(exercise.muscle)}
                      <span>{exercise.muscle}</span>
                    </span>
                    <span className="tech-tag">
                      {equipment.icon}
                      <span>{equipment.name}</span>
                    </span>
                    {isAllDone && (
                      <span
                        className="tech-tag"
                        style={{ color: 'var(--emerald)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                      >
                        DONE ({completedCount}/{targetSetsCount})
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-athletic)',
                      fontSize: '1.0625rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      marginTop: '2px',
                    }}
                  >
                    {exercise.name}
                  </h3>

                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Target: <span className="tabular-nums font-semibold">{exercise.targetSets}</span> sets ×{' '}
                    <span className="tabular-nums font-semibold">{exercise.targetReps}</span> reps • RPE {exercise.targetRpe}
                  </span>
                </div>

                {/* Video, Focus & Collapse Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {exercise.videoUrl && (
                    <button
                      type="button"
                      onClick={() => onOpenVideo(exercise.videoUrl!, exercise.name)}
                      className="reel-btn"
                      style={{ padding: '4px 8px', fontSize: '0.6875rem' }}
                      title="Watch technique demonstration"
                    >
                      <Play style={{ width: '12px', height: '12px', fill: 'currentColor' }} />
                      <span>Form</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      onSelectFocusExercise(index);
                    }}
                    title="View side-by-side in Pair View"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      background: isKrish ? 'var(--azure-light)' : 'var(--rose-light)',
                      border: `1px solid ${isKrish ? 'rgba(2, 132, 199, 0.25)' : 'rgba(225, 29, 72, 0.25)'}`,
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: isKrish ? 'var(--azure)' : 'var(--rose)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Users style={{ width: '12px', height: '12px' }} />
                    <span>Pair</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCollapse(exercise.id)}
                    className="reel-btn"
                    style={{ padding: '4px 6px' }}
                    title={isCollapsed ? 'Expand sets' : 'Collapse sets'}
                  >
                    {isCollapsed ? (
                      <ChevronDown style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <ChevronUp style={{ width: '14px', height: '14px' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Sets Section */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    {/* Technical Divider */}
                    <div className="tech-divider" style={{ margin: '2px 0' }} />

                    {/* Sets Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sets.map((set) => (
                        <div
                          key={set.setNumber}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '14px',
                            backgroundColor: set.isCompleted
                              ? 'rgba(236, 253, 245, 0.9)'
                              : 'rgba(248, 250, 252, 0.75)',
                            border: `1px solid ${set.isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(226, 232, 240, 0.8)'}`,
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: set.isCompleted ? 'var(--emerald)' : '#64748B',
                              width: '48px',
                            }}
                          >
                            SET {set.setNumber}
                          </span>

                          {/* Weight Adjust */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleAdjustWeight(exercise.id, set, -2.5)}
                              className="focus-stepper-btn"
                              style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '0.875rem' }}
                            >
                              <Minus style={{ width: '12px', height: '12px' }} />
                            </button>
                            <span className="tabular-nums font-bold" style={{ fontSize: '0.8125rem', minWidth: '46px', textAlign: 'center' }}>
                              {set.weightKg} kg
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustWeight(exercise.id, set, 2.5)}
                              className="focus-stepper-btn"
                              style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '0.875rem' }}
                            >
                              <Plus style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>

                          {/* Reps Adjust */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleAdjustReps(exercise.id, set, -1)}
                              className="focus-stepper-btn"
                              style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '0.875rem' }}
                            >
                              <Minus style={{ width: '12px', height: '12px' }} />
                            </button>
                            <span className="tabular-nums font-bold" style={{ fontSize: '0.8125rem', minWidth: '40px', textAlign: 'center' }}>
                              {set.repsCompleted} reps
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustReps(exercise.id, set, 1)}
                              className="focus-stepper-btn"
                              style={{ width: '28px', height: '28px', borderRadius: '8px', fontSize: '0.875rem' }}
                            >
                              <Plus style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>

                          {/* Checkmark Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSet(exercise.id, set)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '9999px',
                              border: 'none',
                              backgroundColor: set.isCompleted ? 'var(--emerald)' : 'rgba(226, 232, 240, 0.9)',
                              color: set.isCompleted ? '#FFFFFF' : '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: set.isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Check style={{ width: '16px', height: '16px', strokeWidth: 3 }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Quick "Complete All Sets" Action if not all done */}
                    {!isAllDone && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleCompleteAllSets(exercise, sets)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(236, 253, 245, 0.9)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--emerald)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <CheckCheck style={{ width: '13px', height: '13px' }} />
                          <span>Complete All {sets.length} Sets</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
