import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { Exercise } from '../../types/workout';

interface ExerciseThumbProps {
  exercise: Pick<Exercise, 'id' | 'name' | 'images'>;
  className?: string;
}

/** Exercise image with a line-art fallback when no photo is available. */
export function ExerciseThumb({ exercise, className = '' }: ExerciseThumbProps) {
  const [failed, setFailed] = useState(false);
  const src = exercise.images?.[0] ?? `/exercises/${exercise.id}/0.jpg`;

  return (
    <div className={`relative overflow-hidden bg-sunk ${className}`}>
      {!failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-opacity duration-200"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sage-500/70">
          <Dumbbell size={20} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
