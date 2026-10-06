-- Migration 0003: Create Users table for duo authentication and multi-partner support
-- Preserves compatibility with existing profiles structure while adding credentials and duo links

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0 NOT NULL,
  partner_id TEXT,
  pair_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  stats TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL,
  theme_color TEXT NOT NULL,
  refresh_token_hash TEXT,
  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_pair_id ON users(pair_id);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
