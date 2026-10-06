import { Exercise, SetRecord } from '../../types/workout';
import { Badge } from '../../components/ui/Badge';
import { QuickSetLogger } from './QuickSetLogger';
import { Play, Dumbbell } from 'lucide-react';

interface PartnerStationColumnProps {
  partnerName: string;
  role: 'person_1' | 'person_2';
  exercise?: Exercise;
  sets: SetRecord[];
  onUpdateSet: (
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => void;
  onOpenVideo: (url: string, title: string) => void;
}

export function PartnerStationColumn({
  partnerName,
  role,
  exercise,
  sets,
  onUpdateSet,
  onOpenVideo,
}: PartnerStationColumnProps) {
  if (!exercise) {
    return (
      <div className="flex-1 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center text-slate-400">
        <Dumbbell size={24} className="opacity-40 mb-2" />
        <span className="text-xs font-medium">Rest / Auxiliary Station</span>
      </div>
    );
  }

  const isP1 = role === 'person_1';
  const roleBadgeVariant = isP1 ? 'azure' : 'rose';
  const borderColor = isP1
    ? 'border-sky-200 dark:border-sky-900/50'
    : 'border-rose-200 dark:border-rose-900/50';

  return (
    <div
      className={`flex-1 flex flex-col p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border ${borderColor} shadow-xs backdrop-blur-md transition-all`}
    >
      {/* Header: Partner Name & Badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant={roleBadgeVariant} size="sm">
              {partnerName}
            </Badge>
            <Badge variant="neutral" size="sm">
              {exercise.muscle}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {exercise.name}
          </h3>
        </div>

        {/* Video button */}
        {exercise.videoUrl ? (
          <button
            type="button"
            onClick={() => onOpenVideo(exercise.videoUrl!, exercise.name)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
            title="Watch technique video"
            aria-label={`Watch video for ${exercise.name}`}
          >
            <Play size={15} className="fill-current" />
          </button>
        ) : null}
      </div>

      {/* Target Spec Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {exercise.targetSets} sets × {exercise.targetReps}
        </span>
        <span>•</span>
        <span>RPE {exercise.targetRpe || '7-8'}</span>
        {exercise.notes && (
          <span className="truncate max-w-[200px] text-slate-400 italic" title={exercise.notes}>
            • {exercise.notes}
          </span>
        )}
      </div>

      {/* Set Logger Controls */}
      <QuickSetLogger
        exerciseId={exercise.id}
        targetSets={exercise.targetSets}
        targetReps={exercise.targetReps}
        sets={sets}
        role={role}
        onUpdateSet={onUpdateSet}
      />
    </div>
  );
}
