import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Search, Target } from 'lucide-react';
import { Exercise, WorkoutDayLog } from '../../types/workout';
import { getMuscleIcon } from '../../lib/assetsMap';
import { haptics } from '../../lib/haptics';

interface ExerciseListDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  currentExerciseIndex: number;
  onSelectExercise: (index: number) => void;
  dayLog: WorkoutDayLog;
  activeProfile: 'krish' | 'theju';
  splitTitle: string;
}

export function ExerciseListDrawer({
  isOpen,
  onOpenChange,
  exercises,
  currentExerciseIndex,
  onSelectExercise,
  dayLog,
  activeProfile,
  splitTitle,
}: ExerciseListDrawerProps) {
  const isKrish = activeProfile === 'krish';
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredExercises = exercises.filter((ex) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.muscle.toLowerCase().includes(q) ||
      (ex.pair && ex.pair.toLowerCase().includes(q))
    );
  });

  const handleClose = () => {
    haptics.tap();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {/* Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
              borderTopLeftRadius: '26px',
              borderTopRightRadius: '26px',
              borderTop: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 -16px 40px rgba(15, 23, 42, 0.14), inset 0 1px 1px #FFFFFF',
              maxHeight: '82vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              paddingBottom: 'calc(var(--safe-bottom, 0px) + 20px)',
            }}
          >
            {/* Grab Handle */}
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: '#CBD5E1',
                margin: '10px auto 4px auto',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px 8px 20px',
                borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
              }}
            >
              <div>
                <span className="tech-tag" style={{ marginBottom: '2px' }}>
                  DAY SCHEDULE
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-athletic)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#0F172A',
                    margin: 0,
                  }}
                >
                  {splitTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'rgba(241, 245, 249, 0.9)',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Filter Search Input if more than 4 exercises */}
            {exercises.length > 4 && (
              <div style={{ padding: '8px 20px 4px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(241, 245, 249, 0.8)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                  }}
                >
                  <Search style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Filter by name or muscle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.8125rem',
                      color: '#0F172A',
                      width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Exercises List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 20px 20px 20px',
                overflowY: 'auto',
              }}
            >
              {filteredExercises.map((ex) => {
                const originalIndex = exercises.findIndex((e) => e.id === ex.id);
                const isCurrent = originalIndex === currentExerciseIndex;
                const exProgress = dayLog?.exercisesProgress?.[ex.id];
                const completedSets =
                  exProgress?.sets?.filter((s) => s.isCompleted).length || 0;
                const isDone = completedSets === ex.targetSets && ex.targetSets > 0;
                const progressPct = ex.targetSets > 0 ? (completedSets / ex.targetSets) * 100 : 0;

                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      onSelectExercise(originalIndex);
                      onOpenChange(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      border: isCurrent
                        ? `2px solid ${isKrish ? 'var(--azure)' : 'var(--rose)'}`
                        : '1px solid rgba(226, 232, 240, 0.8)',
                      backgroundColor: isCurrent
                        ? isKrish
                          ? 'var(--azure-light)'
                          : 'var(--rose-light)'
                        : 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isCurrent
                        ? `0 4px 14px -2px ${isKrish ? 'rgba(2, 132, 199, 0.2)' : 'rgba(225, 29, 72, 0.2)'}`
                        : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            color: isCurrent
                              ? isKrish
                                ? 'var(--azure)'
                                : 'var(--rose)'
                              : '#64748B',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {ex.pair || `EX // 0${originalIndex + 1}`}
                        </span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#64748B' }}>
                          {getMuscleIcon(ex.muscle)}
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{ex.muscle}</span>
                        </span>

                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              color: isKrish ? 'var(--azure)' : 'var(--rose)',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            FOCUS
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ex.name}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        {completedSets} of {ex.targetSets} sets completed
                      </span>

                      {/* Mini Progress Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '3px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(226, 232, 240, 0.8)',
                          marginTop: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            backgroundColor: isDone
                              ? 'var(--emerald)'
                              : isKrish
                              ? 'var(--azure)'
                              : 'var(--rose)',
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDone
                          ? 'var(--emerald)'
                          : isCurrent
                          ? isKrish
                            ? 'var(--azure)'
                            : 'var(--rose)'
                          : 'rgba(241, 245, 249, 0.9)',
                        color: isDone || isCurrent ? '#FFFFFF' : '#94A3B8',
                        flexShrink: 0,
                        boxShadow: isDone ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                      }}
                    >
                      {isDone ? (
                        <Check style={{ width: '16px', height: '16px', strokeWidth: 3 }} />
                      ) : isCurrent ? (
                        <Target style={{ width: '15px', height: '15px' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{originalIndex + 1}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
