import { useState } from 'react';
import { SetRecord } from '../../types/workout';
import { Stepper } from '../../components/ui/Stepper';
import { Check } from 'lucide-react';
import { haptics } from '../../lib/haptics';

interface QuickSetLoggerProps {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  sets: SetRecord[];
  role: 'person_1' | 'person_2';
  onUpdateSet: (
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => void;
}

export function QuickSetLogger({
  exerciseId,
  targetSets,
  targetReps,
  sets,
  role,
  onUpdateSet,
}: QuickSetLoggerProps) {
  // Find first uncompleted set or default to set 1
  const firstIncompleteIdx = sets.findIndex((s) => !s.isCompleted);
  const defaultActiveSet = firstIncompleteIdx !== -1 ? firstIncompleteIdx + 1 : 1;
  const [selectedSetNum, setSelectedSetNum] = useState<number>(defaultActiveSet);

  // Active set record or fallback
  const activeSetRecord = sets.find((s) => s.setNumber === selectedSetNum) || {
    setNumber: selectedSetNum,
    weightKg: '20',
    repsCompleted: targetReps.split('-')[0] || '10',
    rpeAchieved: '',
    isCompleted: false,
  };

  const parsedWeight = parseFloat(activeSetRecord.weightKg) || 0;
  const parsedReps = parseInt(activeSetRecord.repsCompleted, 10) || 10;

  const handleToggleSetComplete = (setNum: number) => {
    haptics.tap();
    const existing = sets.find((s) => s.setNumber === setNum);
    const willBeCompleted = !existing?.isCompleted;

    onUpdateSet(exerciseId, setNum, {
      isCompleted: willBeCompleted,
      weightKg: existing?.weightKg && existing.weightKg !== '0' ? existing.weightKg : String(parsedWeight || 20),
      repsCompleted: existing?.repsCompleted && existing.repsCompleted !== '0' ? existing.repsCompleted : String(parsedReps || 10),
    });

    // If completed and not last set, automatically advance active set focus
    if (willBeCompleted && setNum < targetSets) {
      setSelectedSetNum(setNum + 1);
    }
  };

  const handleWeightChange = (newWeight: number) => {
    onUpdateSet(exerciseId, selectedSetNum, {
      weightKg: String(newWeight),
    });
  };

  const handleRepsChange = (newReps: number) => {
    onUpdateSet(exerciseId, selectedSetNum, {
      repsCompleted: String(newReps),
    });
  };

  const accentColor = role === 'person_1' ? 'sky' : 'rose';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Set Navigation & 1-Tap Completion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {Array.from({ length: targetSets }).map((_, idx) => {
          const setNum = idx + 1;
          const setRec = sets.find((s) => s.setNumber === setNum);
          const isDone = Boolean(setRec?.isCompleted);
          const isSelected = selectedSetNum === setNum;

          return (
            <button
              key={setNum}
              type="button"
              onClick={() => {
                if (isSelected) {
                  handleToggleSetComplete(setNum);
                } else {
                  setSelectedSetNum(setNum);
                }
              }}
              onDoubleClick={() => handleToggleSetComplete(setNum)}
              className={`flex-1 min-w-[56px] py-2 px-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border select-none ${
                isDone
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs font-bold'
                  : isSelected
                  ? accentColor === 'sky'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 font-bold ring-2 ring-sky-400/20'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500 text-rose-700 dark:text-rose-300 font-bold ring-2 ring-rose-400/20'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider opacity-80">
                  Set
                </span>
                <span className="text-xs font-bold">{setNum}</span>
                {isDone && <Check size={12} className="stroke-[3]" />}
              </div>
              <span className="text-[11px] font-mono mt-0.5">
                {setRec?.weightKg && setRec.weightKg !== '0'
                  ? `${setRec.weightKg}kg`
                  : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline Steppers for Active Set (Zero Clicks / Instant Thumb Controls) */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex-1 flex justify-center">
          <Stepper
            label={`Set ${selectedSetNum} Weight`}
            value={parsedWeight}
            onChange={handleWeightChange}
            min={0}
            max={300}
            step={2.5}
            unit="kg"
            size="sm"
          />
        </div>

        <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700/80" />

        <div className="flex-1 flex justify-center">
          <Stepper
            label={`Set ${selectedSetNum} Reps`}
            value={parsedReps}
            onChange={handleRepsChange}
            min={1}
            max={50}
            step={1}
            unit="reps"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
