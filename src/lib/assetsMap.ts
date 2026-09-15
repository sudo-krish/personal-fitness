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

export function getMuscleIcon(muscle: string): React.ReactNode {
  const m = (muscle || '').toLowerCase();
  if (m.includes('chest')) return React.createElement(Shield, { style: { width: 14, height: 14 } });
  if (m.includes('back') || m.includes('lat')) return React.createElement(Layers, { style: { width: 14, height: 14 } });
  if (
    m.includes('leg') ||
    m.includes('quad') ||
    m.includes('hamstring') ||
    m.includes('glute') ||
    m.includes('calf')
  ) {
    return React.createElement(Footprints, { style: { width: 14, height: 14 } });
  }
  if (m.includes('shoulder') || m.includes('delt')) return React.createElement(Triangle, { style: { width: 14, height: 14 } });
  if (m.includes('arm') || m.includes('bicep') || m.includes('tricep') || m.includes('grip')) {
    return React.createElement(Flame, { style: { width: 14, height: 14 } });
  }
  if (m.includes('core') || m.includes('oblique') || m.includes('cardio')) {
    return React.createElement(Target, { style: { width: 14, height: 14 } });
  }
  return React.createElement(HeartPulse, { style: { width: 14, height: 14 } });
}

export function getEquipmentInfo(exerciseName: string): { icon: React.ReactNode; name: string } {
  const n = (exerciseName || '').toLowerCase();
  if (
    n.includes('barbell') ||
    n.includes('bench press') ||
    n.includes('deadlift') ||
    n.includes('overhead press')
  ) {
    return { icon: React.createElement(Dumbbell, { style: { width: 14, height: 14 } }), name: 'Barbell' };
  }
  if (
    n.includes('dumbbell') ||
    n.includes('db ') ||
    n.includes('lateral raise') ||
    n.includes('curl')
  ) {
    return { icon: React.createElement(Dumbbell, { style: { width: 14, height: 14 } }), name: 'Dumbbell' };
  }
  if (
    n.includes('cable') ||
    n.includes('pulldown') ||
    n.includes('pushdown') ||
    n.includes('face pull')
  ) {
    return { icon: React.createElement(Activity, { style: { width: 14, height: 14 } }), name: 'Cable' };
  }
  if (
    n.includes('machine') ||
    n.includes('leg press') ||
    n.includes('extension') ||
    n.includes('hack')
  ) {
    return { icon: React.createElement(Sliders, { style: { width: 14, height: 14 } }), name: 'Machine' };
  }
  if (n.includes('kettlebell') || n.includes('swing')) {
    return { icon: React.createElement(Zap, { style: { width: 14, height: 14 } }), name: 'Kettlebell' };
  }
  return { icon: React.createElement(User, { style: { width: 14, height: 14 } }), name: 'Bodyweight' };
}

// High-resolution day cover banner images
export function getSplitCoverPath(dayKey: string): string {
  const k = (dayKey || '').toLowerCase();
  if (k === 'monday' || k.includes('push')) return '/assets/covers/push-cover.jpg';
  if (k === 'tuesday' || k.includes('pull')) return '/assets/covers/pull-cover.jpg';
  if (k === 'wednesday' || k.includes('rest') || k.includes('recovery')) return '/assets/covers/rest-cover.jpg';
  if (k === 'thursday' || k.includes('leg')) return '/assets/covers/leg-cover.jpg';
  if (k === 'friday' || k.includes('upper')) return '/assets/covers/upper-cover.jpg';
  if (k === 'saturday' || k.includes('lower')) return '/assets/covers/lower-cover.jpg';
  if (k === 'sunday') return '/assets/covers/rest-cover.jpg';
  return '/assets/covers/push-cover.jpg';
}
