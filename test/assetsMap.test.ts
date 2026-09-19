import { describe, it, expect } from 'vitest';
import { getMuscleIcon, getEquipmentInfo, getSplitCoverPath } from '../src/lib/assetsMap';

describe('assetsMap', () => {
  describe('getMuscleIcon', () => {
    it('returns icons for various muscle groups', () => {
      expect(getMuscleIcon('Chest')).toBeDefined();
      expect(getMuscleIcon('Back')).toBeDefined();
      expect(getMuscleIcon('Lat Pulldown')).toBeDefined();
      expect(getMuscleIcon('Legs')).toBeDefined();
      expect(getMuscleIcon('Quads')).toBeDefined();
      expect(getMuscleIcon('Hamstrings')).toBeDefined();
      expect(getMuscleIcon('Glutes')).toBeDefined();
      expect(getMuscleIcon('Calves')).toBeDefined();
      expect(getMuscleIcon('Shoulders')).toBeDefined();
      expect(getMuscleIcon('Delts')).toBeDefined();
      expect(getMuscleIcon('Arms')).toBeDefined();
      expect(getMuscleIcon('Biceps')).toBeDefined();
      expect(getMuscleIcon('Triceps')).toBeDefined();
      expect(getMuscleIcon('Grip')).toBeDefined();
      expect(getMuscleIcon('Core')).toBeDefined();
      expect(getMuscleIcon('Obliques')).toBeDefined();
      expect(getMuscleIcon('Cardio')).toBeDefined();
      expect(getMuscleIcon('Unknown')).toBeDefined();
      expect(getMuscleIcon('')).toBeDefined();
    });
  });

  describe('getEquipmentInfo', () => {
    it('identifies barbell exercises', () => {
      expect(getEquipmentInfo('Barbell Squat').name).toBe('Barbell');
      expect(getEquipmentInfo('Bench Press').name).toBe('Barbell');
      expect(getEquipmentInfo('Deadlift').name).toBe('Barbell');
      expect(getEquipmentInfo('Overhead Press').name).toBe('Barbell');
    });

    it('identifies dumbbell exercises', () => {
      expect(getEquipmentInfo('Dumbbell Row').name).toBe('Dumbbell');
      expect(getEquipmentInfo('DB Shoulder Press').name).toBe('Dumbbell');
      expect(getEquipmentInfo('Lateral Raise').name).toBe('Dumbbell');
      expect(getEquipmentInfo('Bicep Curl').name).toBe('Dumbbell');
    });

    it('identifies cable exercises', () => {
      expect(getEquipmentInfo('Cable Fly').name).toBe('Cable');
      expect(getEquipmentInfo('Lat Pulldown').name).toBe('Cable');
      expect(getEquipmentInfo('Tricep Pushdown').name).toBe('Cable');
      expect(getEquipmentInfo('Face Pull').name).toBe('Cable');
    });

    it('identifies machine exercises', () => {
      expect(getEquipmentInfo('Leg Extension Machine').name).toBe('Machine');
      expect(getEquipmentInfo('Leg Press').name).toBe('Machine');
      expect(getEquipmentInfo('Hack Squat').name).toBe('Machine');
    });

    it('identifies kettlebell exercises', () => {
      expect(getEquipmentInfo('Kettlebell Swing').name).toBe('Kettlebell');
      expect(getEquipmentInfo('Kettlebell Clean').name).toBe('Kettlebell');
    });

    it('defaults to bodyweight', () => {
      expect(getEquipmentInfo('Pushups').name).toBe('Bodyweight');
      expect(getEquipmentInfo('').name).toBe('Bodyweight');
    });
  });

  describe('getSplitCoverPath', () => {
    it('returns correct cover image path per day split', () => {
      expect(getSplitCoverPath('Monday')).toBe('/assets/covers/push-cover.jpg');
      expect(getSplitCoverPath('push')).toBe('/assets/covers/push-cover.jpg');
      expect(getSplitCoverPath('Tuesday')).toBe('/assets/covers/pull-cover.jpg');
      expect(getSplitCoverPath('pull')).toBe('/assets/covers/pull-cover.jpg');
      expect(getSplitCoverPath('Wednesday')).toBe('/assets/covers/rest-cover.jpg');
      expect(getSplitCoverPath('rest day')).toBe('/assets/covers/rest-cover.jpg');
      expect(getSplitCoverPath('recovery day')).toBe('/assets/covers/rest-cover.jpg');
      expect(getSplitCoverPath('Thursday')).toBe('/assets/covers/leg-cover.jpg');
      expect(getSplitCoverPath('leg day')).toBe('/assets/covers/leg-cover.jpg');
      expect(getSplitCoverPath('Friday')).toBe('/assets/covers/upper-cover.jpg');
      expect(getSplitCoverPath('upper body')).toBe('/assets/covers/upper-cover.jpg');
      expect(getSplitCoverPath('Saturday')).toBe('/assets/covers/lower-cover.jpg');
      expect(getSplitCoverPath('lower body')).toBe('/assets/covers/lower-cover.jpg');
      expect(getSplitCoverPath('Sunday')).toBe('/assets/covers/rest-cover.jpg');
      expect(getSplitCoverPath('other')).toBe('/assets/covers/push-cover.jpg');
      expect(getSplitCoverPath('')).toBe('/assets/covers/push-cover.jpg');
    });
  });
});
