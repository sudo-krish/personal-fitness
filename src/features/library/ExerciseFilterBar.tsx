import { Tabs, TabItem } from '../../components/ui/Tabs';

const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
];

const EQUIPMENT_OPTIONS = [
  'All',
  'Dumbbell',
  'Barbell',
  'Bodyweight',
  'Cable',
  'Machine',
  'Bands',
];

interface ExerciseFilterBarProps {
  p1Name: string;
  p2Name: string;
  selectedProfileTab: 'all' | 'null' | 'person_1' | 'person_2';
  onProfileTabChange: (val: 'all' | 'null' | 'person_1' | 'person_2') => void;
  selectedMuscle: string;
  onMuscleChange: (val: string) => void;
  selectedEquipment: string;
  onEquipmentChange: (val: string) => void;
  videoFilter: 'all' | 'has' | 'missing';
  onVideoFilterChange: (val: 'all' | 'has' | 'missing') => void;
}

export function ExerciseFilterBar({
  p1Name,
  p2Name,
  selectedProfileTab,
  onProfileTabChange,
  selectedMuscle,
  onMuscleChange,
  selectedEquipment,
  onEquipmentChange,
  videoFilter,
  onVideoFilterChange,
}: ExerciseFilterBarProps) {
  const profileTabs: TabItem<'all' | 'null' | 'person_1' | 'person_2'>[] = [
    { id: 'all', label: 'All Catalog' },
    { id: 'null', label: 'Unassigned' },
    { id: 'person_1', label: p1Name },
    { id: 'person_2', label: p2Name },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Top Segment: Profile Tabs & Equipment/Video Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          items={profileTabs}
          value={selectedProfileTab}
          onChange={onProfileTabChange}
          size="sm"
        />

        {/* Filters Selectors */}
        <div className="flex items-center gap-2">
          {/* Equipment Dropdown */}
          <select
            value={selectedEquipment}
            onChange={(e) => onEquipmentChange(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq} value={eq}>
                {eq === 'All' ? 'All Equipment' : eq}
              </option>
            ))}
          </select>

          {/* Video Status Dropdown */}
          <select
            value={videoFilter}
            onChange={(e) => onVideoFilterChange(e.target.value as 'all' | 'has' | 'missing')}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">All Videos</option>
            <option value="has">With Video</option>
            <option value="missing">Needs Video</option>
          </select>
        </div>
      </div>

      {/* Horizontal Muscle Group Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {MUSCLE_GROUPS.map((muscle) => {
          const isSelected = selectedMuscle === muscle;
          return (
            <button
              key={muscle}
              type="button"
              onClick={() => onMuscleChange(muscle)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              {muscle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
