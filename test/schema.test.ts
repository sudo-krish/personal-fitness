import { describe, it, expect } from 'vitest';
import { profiles, workoutSplits, exercises, setLogs, userStreaks } from '../src/db/schema';

describe('Database Schema', () => {
  it('defines profiles table with correct columns', () => {
    expect(profiles).toBeDefined();
    expect(profiles.id).toBeDefined();
    expect(profiles.name).toBeDefined();
    expect(profiles.title).toBeDefined();
    expect(profiles.gender).toBeDefined();
    expect(profiles.age).toBeDefined();
    expect(profiles.stats).toBeDefined();
    expect(profiles.bio).toBeDefined();
    expect(profiles.avatarEmoji).toBeDefined();
    expect(profiles.themeColor).toBeDefined();
    expect(profiles.createdAt).toBeDefined();
  });

  it('defines workoutSplits table with correct columns', () => {
    expect(workoutSplits).toBeDefined();
    expect(workoutSplits.id).toBeDefined();
    expect(workoutSplits.profileId).toBeDefined();
    expect(workoutSplits.dayKey).toBeDefined();
    expect(workoutSplits.splitTitle).toBeDefined();
    expect(workoutSplits.focusDescription).toBeDefined();
    expect(workoutSplits.isRest).toBeDefined();
  });

  it('defines exercises table with correct columns', () => {
    expect(exercises).toBeDefined();
    expect(exercises.id).toBeDefined();
    expect(exercises.profileId).toBeDefined();
    expect(exercises.dayKey).toBeDefined();
    expect(exercises.pairTag).toBeDefined();
    expect(exercises.name).toBeDefined();
    expect(exercises.muscle).toBeDefined();
    expect(exercises.targetSets).toBeDefined();
    expect(exercises.targetReps).toBeDefined();
    expect(exercises.targetRpe).toBeDefined();
    expect(exercises.notes).toBeDefined();
    expect(exercises.videoUrl).toBeDefined();
    expect(exercises.sortOrder).toBeDefined();
  });

  it('defines setLogs table with correct columns', () => {
    expect(setLogs).toBeDefined();
    expect(setLogs.id).toBeDefined();
    expect(setLogs.profileId).toBeDefined();
    expect(setLogs.workoutDate).toBeDefined();
    expect(setLogs.exerciseId).toBeDefined();
    expect(setLogs.setNumber).toBeDefined();
    expect(setLogs.weightKg).toBeDefined();
    expect(setLogs.repsCompleted).toBeDefined();
    expect(setLogs.rpeAchieved).toBeDefined();
    expect(setLogs.isCompleted).toBeDefined();
    expect(setLogs.updatedAt).toBeDefined();
  });

  it('defines userStreaks table with correct columns', () => {
    expect(userStreaks).toBeDefined();
    expect(userStreaks.profileId).toBeDefined();
  });

  it('resolves foreign key references across tables', async () => {
    const { getTableConfig } = await import('drizzle-orm/sqlite-core');
    const tables = [workoutSplits, exercises, setLogs, userStreaks];
    for (const table of tables) {
      const config = getTableConfig(table);
      for (const fk of config.foreignKeys) {
        expect(fk.getName()).toBeDefined();
      }
    }
  });
});
