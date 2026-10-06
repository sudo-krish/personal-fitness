-- Migration 0002: Allow NULL profile_id for unassigned exercise library items
-- SQLite table migration pattern

PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS exercises_new (
  id TEXT PRIMARY KEY,
  profile_id TEXT,
  day_key TEXT NOT NULL,
  pair_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  muscle TEXT NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps TEXT NOT NULL,
  target_rpe TEXT DEFAULT '7-8',
  notes TEXT,
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

INSERT OR IGNORE INTO exercises_new SELECT * FROM exercises;
DROP TABLE IF EXISTS exercises;
ALTER TABLE exercises_new RENAME TO exercises;

PRAGMA foreign_keys=on;
