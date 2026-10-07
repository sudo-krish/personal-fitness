import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { CropMarks } from '../components/art/CropMarks';
import { ExerciseThumb } from '../components/ui/ExerciseThumb';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Exercise } from '../types/workout';
import { Search, X, Play, Loader2, Dumbbell, Sparkles, Trophy, History } from 'lucide-react';
import { haptics } from '../lib/haptics';
import { StorageService } from '../services/storageService';
import { bestByExercise, exerciseHistory } from '../lib/progressStats';

interface ExerciseLibraryPageProps {
  onOpenVideo?: (url: string, title: string) => void;
}

const MUSCLE_CHIPS = [
  'All',
  'Chest',
  'Back',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
];

export function ExerciseLibraryPage({ onOpenVideo }: ExerciseLibraryPageProps) {
  const { user, partner } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const {
    search,
    setSearch,
    selectedMuscle,
    setSelectedMuscle,
    exercises,
    isLoading,
    totalCount,
    page,
    setPage,
    totalPages,
    assignProfile,
    actionNotice,
  } = useExerciseCatalog(36);

  const isPrimary = user?.isPrimary ?? true;
  const p1Name = isPrimary ? user?.name || 'Partner 1' : partner?.name || 'Partner 1';
  const p2Name = isPrimary ? partner?.name || 'Partner 2' : user?.name || 'Partner 2';
  const myLogs = StorageService.listDayLogs(isPrimary ? 'person_1' : 'person_2');
  const myBests = bestByExercise(myLogs);
  const selectedHistory = selectedExercise ? exerciseHistory(myLogs, selectedExercise.id) : [];

  const openExercise = (exercise: Exercise) => {
    haptics.tap();
    setSelectedExercise(exercise);
  };

  return (
    <div className="w-full max-w-[560px] sm:max-w-[760px] mx-auto px-5 pt-6 pb-36 animate-rise flex flex-col gap-5">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-strong text-ink px-4 py-2 rounded-full shadow-float text-xs font-semibold flex items-center gap-2 animate-rise">
          <Sparkles className="size-3.5 text-sage-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* L1: FROSTED SEARCH PILL WITH THEME TOGGLE */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="relative flex-1">
          <div className="glass rounded-full flex items-center px-4 py-3 gap-3 focus-within:ring-2 focus-within:ring-sage-500 transition-all">
          <Search size={18} className="text-ink-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises, equipment, muscle…"
            aria-label="Search exercises"
            className="w-full bg-transparent border-0 outline-none text-sm text-ink placeholder:text-ink-muted"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-ink-muted hover:text-ink cursor-pointer p-1.5 -m-1"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* L2: MUSCLE FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {MUSCLE_CHIPS.map((muscle) => {
          const isActive = selectedMuscle === muscle;
          return (
            <button
              key={muscle}
              type="button"
              onClick={() => {
                haptics.tap();
                setSelectedMuscle(muscle);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                isActive
                  ? 'bg-sage-100 text-sage-700 ring-1 ring-sage-500 shadow-xs'
                  : 'glass text-ink-muted hover:text-ink'
              }`}
            >
              {muscle}
            </button>
          );
        })}
      </div>

      {/* L3: META LINE */}
      <div className="flex items-center justify-between text-xs text-ink-muted px-1 font-medium">
        <span>
          {totalCount} exercises {selectedMuscle !== 'All' ? `in ${selectedMuscle}` : ''}
        </span>
        <span>A-Z Catalog</span>
      </div>

      {/* L4: 2-COLUMN GRID OF 4:5 CARDS */}
      {isLoading && exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted gap-3">
          <Loader2 size={28} className="animate-spin text-sage-500" />
          <span className="text-sm font-medium">Loading catalog...</span>
        </div>
      ) : exercises.length === 0 ? (
        <Card variant="tinted" className="p-12 text-center flex flex-col items-center gap-3">
          <Dumbbell size={28} className="text-sage-500/60" />
          <h3 className="font-display text-lg font-medium text-ink">No Exercises Found</h3>
          <p className="text-xs text-ink-muted">Try clearing your search query or choosing another muscle.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              variant="plain"
              role="button"
              tabIndex={0}
              aria-label={`${exercise.name}, ${exercise.muscle}. Open details`}
              className="group relative p-3 flex flex-col justify-between gap-3 cursor-pointer hover:border-ink/20 hover:shadow-sm hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-sage-500 transition-all duration-300 bg-surface/40"
              onClick={() => openExercise(exercise)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openExercise(exercise);
                }
              }}
            >
              <div className="flex flex-col gap-2.5">
                {/* 4:5 Media Thumbnail with CropMarks on hover */}
                <div className="relative aspect-[4/5] w-full rounded-[14px] overflow-hidden bg-sunk ring-1 ring-inset ring-ink/5">
                  <ExerciseThumb exercise={exercise} className="size-full" />
                  <CropMarks offset={6} length={12} className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Play button overlay */}
                  {exercise.videoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenVideo) onOpenVideo(exercise.videoUrl!, exercise.name);
                      }}
                      className="absolute bottom-2 right-2 glass size-10 rounded-full flex items-center justify-center text-ink hover:bg-white active:scale-90 transition-all cursor-pointer shadow-xs"
                      aria-label={`Play video for ${exercise.name}`}
                    >
                      <Play size={12} className="fill-current ml-0.5" />
                    </button>
                  )}
                  {myBests.get(exercise.id) && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full glass text-[10px] font-semibold text-ink">
                      <Trophy size={10} className="text-sage-700" />
                      {myBests.get(exercise.id)?.weightKg}kg
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="px-0.5">
                  <h4 className="text-sm font-semibold text-ink line-clamp-1 leading-snug group-hover:text-sage-600 transition-colors">
                    {exercise.name}
                  </h4>
                  <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 font-medium">
                    {exercise.muscle}
                  </p>
                </div>
              </div>

              {/* Target / Assignment Pill */}
              <div className="pt-2.5 border-t border-hairline flex items-center justify-between gap-2 text-[11px] text-ink-muted font-mono px-0.5">
                <span className="font-semibold tracking-tight shrink-0">{exercise.targetSets}×{exercise.targetReps}</span>
                {exercise.profileId === 'person_1' && (
                  <span className="px-2 py-0.5 rounded-full bg-p1-tint text-p1-ink font-semibold font-sans truncate">
                    {p1Name}
                  </span>
                )}
                {exercise.profileId === 'person_2' && (
                  <span className="px-2 py-0.5 rounded-full bg-p2-tint text-p2-ink font-semibold font-sans truncate">
                    {p2Name}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* L5: LOAD MORE BUTTON */}
      {page < totalPages - 1 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="glass"
            size="md"
            isLoading={isLoading}
            onClick={() => setPage(page + 1)}
            className="w-full max-w-xs"
          >
            Load More Exercises ({exercises.length} of {totalCount})
          </Button>
        </div>
      )}

      {/* L6: EXERCISE DETAIL BOTTOM SHEET */}
      <Sheet
        isOpen={Boolean(selectedExercise)}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise?.name}
        tall
      >
        {selectedExercise && (
          <div className="flex flex-col gap-5 pt-2">
            {/* Image / Video Area */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-sunk shadow-xs">
              <ExerciseThumb exercise={selectedExercise} className="size-full" />
              {selectedExercise.videoUrl && onOpenVideo && (
                <button
                  type="button"
                  onClick={() => onOpenVideo(selectedExercise.videoUrl!, selectedExercise.name)}
                  className="absolute inset-0 bg-ink/20 flex items-center justify-center text-surface hover:bg-ink/30 transition-colors cursor-pointer"
                >
                  <div className="glass-strong size-14 rounded-full flex items-center justify-center text-ink shadow-float">
                    <Play size={20} className="fill-current ml-1" />
                  </div>
                </button>
              )}
            </div>

            {/* Muscle & Target Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
                {selectedExercise.muscle}
              </span>
              <span className="px-3 py-1 rounded-full glass text-ink text-xs font-semibold tabular-nums">
                Target: {selectedExercise.targetSets} sets × {selectedExercise.targetReps}
              </span>
              {selectedExercise.targetRpe && (
                <span className="px-3 py-1 rounded-full glass text-ink text-xs font-semibold">
                  RPE {selectedExercise.targetRpe}
                </span>
              )}
            </div>

            {/* Notes / Technique instructions */}
            {selectedExercise.notes && (
              <div className="p-4 rounded-2xl bg-sunk text-xs text-ink leading-relaxed">
                <span className="font-semibold block mb-1 text-ink-muted uppercase tracking-wider text-[10px]">
                  Technique Cues
                </span>
                {selectedExercise.notes}
              </div>
            )}

            {/* Personal history */}
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <History size={12} /> Your recent sessions
              </span>
              {selectedHistory.length === 0 ? (
                <p className="text-xs text-ink-muted">Not logged yet. Your sets show up here after training.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {selectedHistory.map((row) => (
                    <li
                      key={row.dateStr}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-sunk text-xs"
                    >
                      <span className="text-ink-muted tabular-nums shrink-0">
                        {new Date(`${row.dateStr}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-mono text-ink tabular-nums truncate">
                        {row.sets.map((s) => `${s.weightKg}×${s.reps}`).join('  ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-hairline">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Assign to Partner Split
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => assignProfile(selectedExercise.id, 'person_1', p1Name)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedExercise.profileId === 'person_1'
                      ? 'bg-p1-tint text-p1-ink ring-2 ring-p1-ink'
                      : 'glass text-ink hover:bg-white'
                  }`}
                >
                  {p1Name}
                </button>
                <button
                  type="button"
                  onClick={() => assignProfile(selectedExercise.id, 'person_2', p2Name)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedExercise.profileId === 'person_2'
                      ? 'bg-p2-tint text-p2-ink ring-2 ring-p2-ink'
                      : 'glass text-ink hover:bg-white'
                  }`}
                >
                  {p2Name}
                </button>
                <button
                  type="button"
                  onClick={() => assignProfile(selectedExercise.id, null)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    !selectedExercise.profileId
                      ? 'bg-ink text-surface'
                      : 'glass text-ink-muted hover:text-ink'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
