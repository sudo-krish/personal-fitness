import { Exercise, SetRecord } from '../../types/workout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PartnerStationColumn } from './PartnerStationColumn';

interface StationPairCardProps {
  stationIndex: number;
  stationLabel: string;
  p1Name: string;
  p2Name: string;
  p1Exercise?: Exercise;
  p2Exercise?: Exercise;
  p1Sets: SetRecord[];
  p2Sets: SetRecord[];
  onUpdateSet: (
    profileId: 'person_1' | 'person_2',
    exerciseId: string,
    setNumber: number,
    updates: Partial<SetRecord>
  ) => void;
  onOpenVideo: (url: string, title: string) => void;
}

export function StationPairCard({
  stationIndex,
  stationLabel,
  p1Name,
  p2Name,
  p1Exercise,
  p2Exercise,
  p1Sets,
  p2Sets,
  onUpdateSet,
  onOpenVideo,
}: StationPairCardProps) {
  // Check if both partner exercises in this station are fully finished
  const p1Target = p1Exercise?.targetSets || 0;
  const p2Target = p2Exercise?.targetSets || 0;
  const p1Finished = p1Target > 0 && p1Sets.filter((s) => s.isCompleted).length >= p1Target;
  const p2Finished = p2Target > 0 && p2Sets.filter((s) => s.isCompleted).length >= p2Target;
  const isStationComplete = (p1Target === 0 || p1Finished) && (p2Target === 0 || p2Finished);

  return (
    <Card
      variant="glass"
      className={`p-4 sm:p-6 transition-all ${
        isStationComplete
          ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
          : ''
      }`}
    >
      {/* Station Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center text-xs font-black">
            {stationIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {stationLabel || `Station ${stationIndex + 1}`}
            </h3>
          </div>
        </div>

        {isStationComplete && (
          <Badge variant="emerald" size="sm" dot>
            Complete
          </Badge>
        )}
      </div>

      {/* Columns: Side-by-side on lg screens, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {p1Exercise && (
          <PartnerStationColumn
            partnerName={p1Name}
            role="person_1"
            exercise={p1Exercise}
            sets={p1Sets}
            onUpdateSet={(exId, setNum, updates) =>
              onUpdateSet('person_1', exId, setNum, updates)
            }
            onOpenVideo={onOpenVideo}
          />
        )}

        {p2Exercise && (
          <PartnerStationColumn
            partnerName={p2Name}
            role="person_2"
            exercise={p2Exercise}
            sets={p2Sets}
            onUpdateSet={(exId, setNum, updates) =>
              onUpdateSet('person_2', exId, setNum, updates)
            }
            onOpenVideo={onOpenVideo}
          />
        )}
      </div>
    </Card>
  );
}
