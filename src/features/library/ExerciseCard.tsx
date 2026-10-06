import { useState } from 'react';
import { Exercise } from '../../types/workout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dumbbell, Play, Sparkles, Loader2, Link2 } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  p1Name: string;
  p2Name: string;
  isResolvingVideo: boolean;
  onAssignProfile: (newProfileId: 'person_1' | 'person_2' | null) => void;
  onOpenVideo: (url: string, title: string) => void;
  onResolveVideo: () => void;
  onEditManualUrl: () => void;
}

export function ExerciseCard({
  exercise,
  p1Name,
  p2Name,
  isResolvingVideo,
  onAssignProfile,
  onOpenVideo,
  onResolveVideo,
  onEditManualUrl,
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = `/exercises/${exercise.id}/0.jpg`;

  let assignmentBadge = null;
  if (exercise.profileId === 'person_1') {
    assignmentBadge = <Badge variant="azure" size="sm">{p1Name}</Badge>;
  } else if (exercise.profileId === 'person_2') {
    assignmentBadge = <Badge variant="rose" size="sm">{p2Name}</Badge>;
  }

  return (
    <Card
      variant="default"
      className="p-4 flex flex-col justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
    >
      <div>
        {/* Thumbnail Image */}
        <div className="relative w-full aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3 flex items-center justify-center">
          {!imageError ? (
            <img
              src={imageSrc}
              alt={exercise.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Dumbbell size={28} className="opacity-40" />
            </div>
          )}

          {/* Quick Video Play Overlay if videoUrl present */}
          {exercise.videoUrl && (
            <button
              type="button"
              onClick={() => onOpenVideo(exercise.videoUrl!, exercise.name)}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
              aria-label={`Play video for ${exercise.name}`}
            >
              <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                <Play size={18} className="fill-current ml-0.5" />
              </div>
            </button>
          )}

          {/* Top badges on image */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
            <Badge variant="neutral" size="sm" className="bg-slate-900/80 text-white backdrop-blur-xs border-transparent">
              {exercise.muscle}
            </Badge>
          </div>
        </div>

        {/* Title & Assignment */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {exercise.name}
          </h3>
          {assignmentBadge}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {exercise.targetSets} sets × {exercise.targetReps}
        </p>
      </div>

      {/* Actions Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Assignment Selector */}
        <select
          value={exercise.profileId || ''}
          onChange={(e) => {
            const val = e.target.value;
            onAssignProfile(val === 'person_1' ? 'person_1' : val === 'person_2' ? 'person_2' : null);
          }}
          className="text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
        >
          <option value="">Unassigned</option>
          <option value="person_1">{p1Name}</option>
          <option value="person_2">{p2Name}</option>
        </select>

        {/* Video Button */}
        <div className="flex items-center gap-1">
          {exercise.videoUrl ? (
            <button
              type="button"
              onClick={() => onOpenVideo(exercise.videoUrl!, exercise.name)}
              className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
              title="Watch video"
            >
              <Play size={14} className="fill-current" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isResolvingVideo}
              onClick={onResolveVideo}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-500 transition-colors cursor-pointer disabled:opacity-50"
              title="Find video on YouTube"
            >
              {isResolvingVideo ? (
                <Loader2 size={14} className="animate-spin text-sky-500" />
              ) : (
                <Sparkles size={14} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onEditManualUrl}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Edit video link"
          >
            <Link2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
