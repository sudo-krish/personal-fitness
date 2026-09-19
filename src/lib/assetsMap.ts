import React from 'react';
import {
  Shield,
  Layers,
  Footprints,
  Triangle,
  Flame,
  Target,
  HeartPulse,
  Dumbbell,
  Activity,
  Sliders,
  Zap,
  User,
} from 'lucide-react';

const MUSCLE_MATCHERS: Array<[string[], () => React.ReactNode]> = [
  [['chest'], () => React.createElement(Shield, { style: { width: 14, height: 14 } })],
  [['back', 'lat'], () => React.createElement(Layers, { style: { width: 14, height: 14 } })],
  [['leg', 'quad', 'hamstring', 'glute', 'calf'], () => React.createElement(Footprints, { style: { width: 14, height: 14 } })],
  [['shoulder', 'delt'], () => React.createElement(Triangle, { style: { width: 14, height: 14 } })],
  [['arm', 'bicep', 'tricep', 'grip'], () => React.createElement(Flame, { style: { width: 14, height: 14 } })],
  [['core', 'oblique', 'cardio'], () => React.createElement(Target, { style: { width: 14, height: 14 } })],
];

export function getMuscleIcon(muscle: string): React.ReactNode {
  const m = (muscle || '').toLowerCase();
  for (const [keywords, createIcon] of MUSCLE_MATCHERS) {
    if (keywords.some((kw) => m.includes(kw))) {
      return createIcon();
    }
  }
  return React.createElement(HeartPulse, { style: { width: 14, height: 14 } });
}

type LucideIcon = React.ComponentType<{ style?: React.CSSProperties }>;

const EQUIPMENT_MATCHERS: Array<[string[], string, LucideIcon]> = [
  [['barbell', 'bench press', 'deadlift', 'overhead press'], 'Barbell', Dumbbell],
  [['dumbbell', 'db ', 'lateral raise', 'curl'], 'Dumbbell', Dumbbell],
  [['cable', 'pulldown', 'pushdown', 'face pull'], 'Cable', Activity],
  [['machine', 'leg press', 'extension', 'hack'], 'Machine', Sliders],
  [['kettlebell', 'swing'], 'Kettlebell', Zap],
];

export function getEquipmentInfo(exerciseName: string): { icon: React.ReactNode; name: string } {
  const n = (exerciseName || '').toLowerCase();
  for (const [keywords, name, IconComponent] of EQUIPMENT_MATCHERS) {
    if (keywords.some((kw) => n.includes(kw))) {
      return { icon: React.createElement(IconComponent, { style: { width: 14, height: 14 } }), name };
    }
  }
  return { icon: React.createElement(User, { style: { width: 14, height: 14 } }), name: 'Bodyweight' };
}

const COVER_MATCHERS: Array<[string[], string]> = [
  [['monday', 'push'], '/assets/covers/push-cover.jpg'],
  [['tuesday', 'pull'], '/assets/covers/pull-cover.jpg'],
  [['wednesday', 'rest', 'recovery', 'sunday'], '/assets/covers/rest-cover.jpg'],
  [['thursday', 'leg'], '/assets/covers/leg-cover.jpg'],
  [['friday', 'upper'], '/assets/covers/upper-cover.jpg'],
  [['saturday', 'lower'], '/assets/covers/lower-cover.jpg'],
];

export function getSplitCoverPath(dayKey: string): string {
  const k = (dayKey || '').toLowerCase();
  for (const [keywords, path] of COVER_MATCHERS) {
    if (keywords.some((kw) => k.includes(kw))) {
      return path;
    }
  }
  return '/assets/covers/push-cover.jpg';
}
