import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestTimer } from '../hooks/useRestTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { WorkoutHeader } from '../features/workout/WorkoutHeader';
import { DaysNavigationStrip } from '../features/workout/DaysNavigationStrip';
import { StationPairCard } from '../features/workout/StationPairCard';
import { RestTimerHUD } from '../features/workout/RestTimerHUD';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlanService } from '../services/planService';
import { Coffee, AlertTriangle, Dumbbell } from 'lucide-react';

interface HomePageProps {
  onOpenVideo: (url: string, title: string) => void;
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export function HomePage({ onOpenVideo, onOpenSidebar }: HomePageProps) {
  const { user, partner } = useAuth();

  const {
    restSecondsRemaining,
    isRestTimerRunning,
    startRestTimer,
    adjustRestTime,
    skipRest,
  } = useRestTimer();

  const {
    partner1,
    partner2,
    p1Name,
    p2Name,
    todayKey,
    selectedDayKey,
    setSelectedDayKey,
    currentSchedule,
    p1Exercises,
    p2Exercises,
    p1DayLog,
    p2DayLog,
    updateSet,
    dayCompletionStatus,
    stats,
    reloadPlan,
  } = useWorkoutSession({
    user,
    partner,
    onStartRest: () => startRestTimer(),
  });

  const [showSeedModal, setShowSeedModal] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const handleSeedPlan = async () => {
    setIsSeeding(true);
    await PlanService.seedPreWorkoutPlan(true);
    setIsSeeding(false);
    setShowSeedModal(false);
    reloadPlan();
  };

  const maxStations = Math.max(p1Exercises.length, p2Exercises.length);
  const totalCombinedSets = stats.p1TotalSets + stats.p2TotalSets;
  const completedCombinedSets = stats.p1CompletedSets + stats.p2CompletedSets;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-32 flex flex-col gap-6">
      {/* Workout Header */}
      <WorkoutHeader
        schedule={currentSchedule}
        partner1={partner1}
        partner2={partner2}
        completedSets={completedCombinedSets}
        totalSets={totalCombinedSets}
        onOpenSidebar={onOpenSidebar}
      />

      {/* Days Navigation Strip */}
      <DaysNavigationStrip
        selectedDayKey={selectedDayKey}
        todayKey={todayKey}
        completionStatus={dayCompletionStatus}
        onSelectDay={setSelectedDayKey}
      />

      {/* Rest Day Card Notice if scheduled rest day */}
      {currentSchedule.isRest ? (
        <Card variant="glass" className="p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <Coffee size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Scheduled Rest & Recovery Day
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Focus on hydration, protein intake, mobility, and recovery today. Select any other day above to view past workouts or log ahead.
          </p>
        </Card>
      ) : maxStations === 0 ? (
        <Card variant="glass" className="p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
            <Dumbbell size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No Exercises Assigned for this Day
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
            You can load the curated 5-Day Duo Workout Plan or assign exercises from the library.
          </p>
          <Button variant="azure" size="md" onClick={() => setShowSeedModal(true)}>
            Load 5-Day Duo Plan
          </Button>
        </Card>
      ) : (
        /* Synchronized Stations List */
        <div className="flex flex-col gap-5">
          {Array.from({ length: maxStations }).map((_, stationIdx) => {
            const p1Ex = p1Exercises[stationIdx];
            const p2Ex = p2Exercises[stationIdx];
            const rawLabel = p1Ex?.pair || p2Ex?.pair || `Station ${stationIdx + 1}`;

            const p1Sets = p1Ex ? p1DayLog?.exercisesProgress[p1Ex.id]?.sets || [] : [];
            const p2Sets = p2Ex ? p2DayLog?.exercisesProgress[p2Ex.id]?.sets || [] : [];

            return (
              <StationPairCard
                key={p1Ex?.id || p2Ex?.id || stationIdx}
                stationIndex={stationIdx}
                stationLabel={rawLabel}
                p1Name={p1Name}
                p2Name={p2Name}
                p1Exercise={p1Ex}
                p2Exercise={p2Ex}
                p1Sets={p1Sets}
                p2Sets={p2Sets}
                onUpdateSet={updateSet}
                onOpenVideo={onOpenVideo}
              />
            );
          })}
        </div>
      )}

      {/* Floating Rest Timer HUD */}
      <RestTimerHUD
        secondsRemaining={restSecondsRemaining}
        isRunning={isRestTimerRunning}
        onAdjust={adjustRestTime}
        onSkip={skipRest}
      />

      {/* Confirmation Modal to Seed Plan */}
      <Modal
        isOpen={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        title="Reload 5-Day Workout Plan?"
        description="This will reset logged set progress and reload the curated superset routines."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowSeedModal(false)}>
              Cancel
            </Button>
            <Button variant="azure" isLoading={isSeeding} onClick={handleSeedPlan}>
              Confirm Reload
            </Button>
          </div>
        }
      >
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            This action repopulates all 5 workout days with target weights, reps, and partner supersets.
          </span>
        </div>
      </Modal>
    </div>
  );
}
