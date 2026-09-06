import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  Save,
  Play,
  RotateCcw,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Exercise } from '../../types/workout';
import { DAY_SCHEDULES } from '../../data/initialWorkoutPlan';
import { PlanService } from '../../services/planService';
import { getMuscleIcon } from '../../lib/assetsMap';
import { haptics } from '../../lib/haptics';

interface PlanEditorViewProps {
  initialProfile: 'krish' | 'theju';
  onBackToWorkout: () => void;
  onOpenVideo: (url: string, title: string) => void;
  onPlanChanged?: () => void;
}

const MUSCLE_OPTIONS = [
  'Chest, Triceps',
  'Back, Biceps',
  'Shoulders',
  'Side Delts',
  'Triceps',
  'Quads, Glutes',
  'Hamstrings, Glutes',
  'Glutes, Calves',
  'Core, Abs',
  'Full Body',
];

export const PlanEditorView: React.FC<PlanEditorViewProps> = ({
  initialProfile,
  onBackToWorkout,
  onOpenVideo,
  onPlanChanged,
}) => {
  const [activeProfile, setActiveProfile] = useState<'krish' | 'theju'>(initialProfile);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('monday');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Exercise Form State
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle: 'Chest, Triceps',
    pairTag: 'Pair 1A',
    targetSets: 3,
    targetReps: '8-12',
    targetRpe: '7-8',
    notes: '',
    videoUrl: '',
  });

  const isKrish = activeProfile === 'krish';
  const profileId = isKrish ? 'person_1' : 'person_2';

  // Load exercises for current profile & day
  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const list = await PlanService.getExercises(profileId, selectedDayKey);
      setExercises(list);
    } catch {
      // Fallback handled inside PlanService
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [profileId, selectedDayKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Filtered exercises by search
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const q = searchQuery.toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle.toLowerCase().includes(q) ||
        (e.pair && e.pair.toLowerCase().includes(q))
    );
  }, [exercises, searchQuery]);

  // Handle saving field changes on an exercise
  const handleFieldChange = (exerciseId: string, field: keyof Exercise, value: any) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, [field]: value } : e))
    );
  };

  // Commit single exercise updates to SQLite
  const handleSaveExercise = async (ex: Exercise) => {
    haptics.tap();
    const success = await PlanService.updateExercise(ex.id, {
      name: ex.name,
      muscle: ex.muscle,
      pairTag: ex.pair || 'Pair 1',
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetRpe: ex.targetRpe || '7-8',
      notes: ex.notes || '',
      videoUrl: ex.videoUrl || '',
    });

    if (success) {
      showToast(`✓ Updated "${ex.name}" in fitness.db`);
      if (onPlanChanged) onPlanChanged();
    } else {
      showToast('⚠️ Could not update in SQLite, cached locally');
    }
  };

  // Delete exercise
  const handleDeleteExercise = async (exerciseId: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from this workout day?`)) return;
    haptics.tap();
    const success = await PlanService.deleteExercise(exerciseId);
    if (success) {
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      showToast(`Deleted "${name}"`);
      if (onPlanChanged) onPlanChanged();
    }
  };

  // Add new exercise
  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;

    haptics.tap();
    const created = await PlanService.addExercise({
      profileId,
      dayKey: selectedDayKey,
      name: newExercise.name.trim(),
      muscle: newExercise.muscle,
      pairTag: newExercise.pairTag,
      targetSets: Number(newExercise.targetSets) || 3,
      targetReps: newExercise.targetReps,
      targetRpe: newExercise.targetRpe,
      notes: newExercise.notes,
      videoUrl: newExercise.videoUrl,
    });

    if (created) {
      setExercises((prev) => [...prev, created]);
      setIsAddingNew(false);
      setNewExercise({
        name: '',
        muscle: 'Chest, Triceps',
        pairTag: `Pair ${exercises.length + 1}A`,
        targetSets: 3,
        targetReps: '8-12',
        targetRpe: '7-8',
        notes: '',
        videoUrl: '',
      });
      showToast(`✓ Added "${created.name}" to fitness.db`);
      if (onPlanChanged) onPlanChanged();
    }
  };

  // Reset day plan
  const handleResetDay = async () => {
    if (
      !window.confirm(
        `Reset ${activeProfile === 'krish' ? 'Krish' : 'Theju'}'s ${selectedDayKey} plan to defaults?`
      )
    )
      return;
    haptics.tap();
    await PlanService.resetDayPlan(profileId, selectedDayKey);
    await loadExercises();
    showToast(`✓ Reset ${selectedDayKey} plan in fitness.db`);
    if (onPlanChanged) onPlanChanged();
  };

  // Workout splits excluding Sunday rest
  const workoutDays = DAY_SCHEDULES.filter((d) => !d.isRest);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* 1. Top Navigation & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '18px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onBackToWorkout();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#0F172A',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          <span>Back to Tracker</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: 'var(--emerald-light)',
              color: 'var(--emerald)',
              border: '1px solid var(--emerald-border)',
            }}
          >
            ● SQLite (fitness.db)
          </span>
        </div>
      </div>

      {/* 2. Partner Switcher Capsule */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px',
          borderRadius: '16px',
          backgroundColor: 'rgba(241, 245, 249, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setActiveProfile('krish');
          }}
          style={{
            position: 'relative',
            flex: 1,
            padding: '8px 12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isKrish ? '#FFFFFF' : 'transparent',
            color: isKrish ? '#0F172A' : '#64748B',
            fontWeight: isKrish ? 800 : 600,
            fontSize: '0.8125rem',
            boxShadow: isKrish ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '9999px',
              backgroundColor: 'var(--azure)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 800,
            }}
          >
            K
          </span>
          <span>Krish's Program</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setActiveProfile('theju');
          }}
          style={{
            position: 'relative',
            flex: 1,
            padding: '8px 12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: !isKrish ? '#FFFFFF' : 'transparent',
            color: !isKrish ? '#0F172A' : '#64748B',
            fontWeight: !isKrish ? 800 : 600,
            fontSize: '0.8125rem',
            boxShadow: !isKrish ? 'var(--shadow-sm)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '9999px',
              backgroundColor: 'var(--rose)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 800,
            }}
          >
            T
          </span>
          <span>Theju's Program</span>
        </button>
      </div>

      {/* 3. Day Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}
      >
        {workoutDays.map((d) => {
          const isSelected = selectedDayKey === d.key;
          return (
            <button
              key={`day-tab-${d.key}`}
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedDayKey(d.key);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: isSelected
                  ? `1.5px solid ${isKrish ? 'var(--azure)' : 'var(--rose)'}`
                  : '1px solid #E2E8F0',
                backgroundColor: isSelected
                  ? isKrish
                    ? 'var(--azure-light)'
                    : 'var(--rose-light)'
                  : 'rgba(255, 255, 255, 0.85)',
                color: isSelected
                  ? isKrish
                    ? 'var(--azure)'
                    : 'var(--rose)'
                  : '#475569',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {d.shortName} ({d.splitTitle.split('(')[0].trim()})
            </button>
          );
        })}
      </div>

      {/* 4. Search & Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              width: '14px',
              height: '14px',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises or muscle..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 30px',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.75rem',
              outline: 'none',
              color: '#0F172A',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isKrish ? 'var(--azure)' : 'var(--rose)',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          <span>Add Exercise</span>
        </button>

        <button
          type="button"
          onClick={handleResetDay}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 10px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#64748B',
            fontSize: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          title="Reset this day's exercises to template defaults"
        >
          <RotateCcw style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* 5. Add New Exercise Inline Modal/Card */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateExercise}
            style={{
              padding: '14px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              border: `1.5px solid ${isKrish ? 'var(--azure)' : 'var(--rose)'}`,
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                Create New Exercise for {selectedDayKey.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  placeholder="e.g. Incline Dumbbell Press"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                  Station / Pair Tag
                </label>
                <input
                  type="text"
                  value={newExercise.pairTag}
                  onChange={(e) => setNewExercise({ ...newExercise, pairTag: e.target.value })}
                  placeholder="e.g. Pair 1A"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                  Muscle Group
                </label>
                <select
                  value={newExercise.muscle}
                  onChange={(e) => setNewExercise({ ...newExercise, muscle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.6875rem',
                  }}
                >
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                  Sets × Reps
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newExercise.targetSets}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, targetSets: Number(e.target.value) })
                    }
                    style={{
                      width: '36px',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                    }}
                  />
                  <input
                    type="text"
                    value={newExercise.targetReps}
                    onChange={(e) => setNewExercise({ ...newExercise, targetReps: e.target.value })}
                    placeholder="8-12"
                    style={{
                      flex: 1,
                      padding: '6px 6px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.75rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                  Target RPE
                </label>
                <input
                  type="text"
                  value={newExercise.targetRpe}
                  onChange={(e) => setNewExercise({ ...newExercise, targetRpe: e.target.value })}
                  placeholder="7-8"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                Coach Notes / Tempo
              </label>
              <input
                type="text"
                value={newExercise.notes}
                onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                placeholder="e.g. 2s eccentric tempo, RPE 7-8"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.75rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569' }}>
                Form Video URL (YouTube)
              </label>
              <input
                type="url"
                value={newExercise.videoUrl}
                onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.75rem',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '4px',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isKrish ? 'var(--azure)' : 'var(--rose)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Save New Movement to SQLite
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 6. Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              textAlign: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Editable Exercise Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
            Loading plan from fitness.db...
          </div>
        ) : filteredExercises.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              color: '#64748B',
            }}
          >
            No exercises found. Tap "+ Add Exercise" to create one.
          </div>
        ) : (
          filteredExercises.map((ex) => {
            const isExpanded = expandedExerciseId === ex.id;

            return (
              <div
                key={ex.id}
                style={{
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      {ex.pair || 'Pair'}
                    </span>

                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => handleFieldChange(ex.id, 'name', e.target.value)}
                      onBlur={() => handleSaveExercise(ex)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        color: '#0F172A',
                        border: '1px solid transparent',
                        backgroundColor: 'transparent',
                        padding: '2px 4px',
                        borderRadius: '6px',
                        width: '100%',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {ex.videoUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(ex.videoUrl!, ex.name)}
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
                        }}
                        title="Preview Form Video"
                      >
                        <Play style={{ width: '9px', height: '9px', fill: 'currentColor' }} />
                        <span>Form</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExerciseId(isExpanded ? null : ex.id)
                      }
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: '#F1F5F9',
                        borderRadius: '6px',
                        color: '#64748B',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp style={{ width: '14px', height: '14px' }} />
                      ) : (
                        <ChevronDown style={{ width: '14px', height: '14px' }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Compact Info Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#475569',
                      backgroundColor: '#F8FAFC',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {getMuscleIcon(ex.muscle)}
                    <span>{ex.muscle}</span>
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: isKrish ? 'var(--azure)' : 'var(--rose)',
                    }}
                  >
                    {ex.targetSets} sets × {ex.targetReps} reps • RPE {ex.targetRpe}
                  </span>
                </div>

                {/* Expanded Full Editor Form */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                          Station Tag
                        </label>
                        <input
                          type="text"
                          value={ex.pair || ''}
                          onChange={(e) => handleFieldChange(ex.id, 'pair', e.target.value)}
                          placeholder="Pair 1A"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                          Sets
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.targetSets}
                          onChange={(e) =>
                            handleFieldChange(ex.id, 'targetSets', Number(e.target.value))
                          }
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                          Reps
                        </label>
                        <input
                          type="text"
                          value={ex.targetReps}
                          onChange={(e) => handleFieldChange(ex.id, 'targetReps', e.target.value)}
                          placeholder="8-12"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                          Muscle Group
                        </label>
                        <input
                          type="text"
                          value={ex.muscle}
                          onChange={(e) => handleFieldChange(ex.id, 'muscle', e.target.value)}
                          placeholder="Chest, Shoulders"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                          Target RPE
                        </label>
                        <input
                          type="text"
                          value={ex.targetRpe || '7-8'}
                          onChange={(e) => handleFieldChange(ex.id, 'targetRpe', e.target.value)}
                          placeholder="7-8"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                        Coach / Technique Notes
                      </label>
                      <input
                        type="text"
                        value={ex.notes || ''}
                        onChange={(e) => handleFieldChange(ex.id, 'notes', e.target.value)}
                        placeholder="e.g. 2s eccentric, squeeze at top"
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                        Form Video Link (YouTube)
                      </label>
                      <input
                        type="url"
                        value={ex.videoUrl || ''}
                        onChange={(e) => handleFieldChange(ex.id, 'videoUrl', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                        }}
                      />
                    </div>

                    {/* Action buttons inside expanded card */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(ex.id, ex.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #FECDD3',
                          backgroundColor: '#FFF1F2',
                          color: '#E11D48',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                        <span>Delete Movement</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveExercise(ex)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isKrish ? 'var(--azure)' : 'var(--rose)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Save style={{ width: '12px', height: '12px' }} />
                        <span>Save to SQLite</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlanEditorView;
