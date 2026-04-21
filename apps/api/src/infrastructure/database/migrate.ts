import type Database from 'better-sqlite3';
import { getDb } from './db.js';

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slides (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      source_type  TEXT    NOT NULL,
      url          TEXT    NOT NULL,
      duration_ms  INTEGER NOT NULL DEFAULT 5000,
      transition_in TEXT   NOT NULL DEFAULT 'fade',
      is_active    INTEGER NOT NULL DEFAULT 1,
      sort_order   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS media (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      filename      TEXT    NOT NULL UNIQUE,
      original_name TEXT    NOT NULL,
      mime_type     TEXT    NOT NULL,
      size_bytes    INTEGER NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id                  INTEGER PRIMARY KEY CHECK (id = 1),
      default_duration_ms INTEGER NOT NULL DEFAULT 5000,
      default_transition  TEXT    NOT NULL DEFAULT 'fade',
      auto_reload         INTEGER NOT NULL DEFAULT 1,
      offline_fallback    INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);

  // Additive migrations — safe to run on existing databases
  addColumnIfMissing(db, 'slides', 'slide_count', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing(db, 'slides', 'slide_duration_ms', 'INTEGER NOT NULL DEFAULT 5000');
  addColumnIfMissing(db, 'slides', 'yt_start_seconds', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'slides', 'yt_end_seconds', 'INTEGER');
  addColumnIfMissing(db, 'settings', 'google_api_key', "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, 'slides', 'muted', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing(db, 'slides', 'qr_url', 'TEXT');
  addColumnIfMissing(db, 'slides', 'schedule_start', 'TEXT');
  addColumnIfMissing(db, 'slides', 'schedule_end', 'TEXT');
  addColumnIfMissing(db, 'slides', 'schedule_days', 'TEXT');
}
