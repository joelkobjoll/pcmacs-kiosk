import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SqliteSettingsRepository } from './sqlite-settings-repository.js';

describe('SqliteSettingsRepository', () => {
  let db: Database.Database;
  let repo: SqliteSettingsRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE settings (
        id                  INTEGER PRIMARY KEY CHECK (id = 1),
        default_duration_ms INTEGER NOT NULL DEFAULT 5000,
        default_transition  TEXT    NOT NULL DEFAULT 'fade',
        auto_reload         INTEGER NOT NULL DEFAULT 1,
        offline_fallback    INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO settings (id) VALUES (1);
    `);
    repo = new SqliteSettingsRepository(db);
  });

  afterEach(() => db.close());

  it('get returns default settings', () => {
    const s = repo.get();
    expect(s.defaultDurationMs).toBe(5000);
    expect(s.defaultTransition).toBe('fade');
    expect(s.autoReload).toBe(true);
    expect(s.offlineFallback).toBe(true);
  });

  it('update changes specified fields', () => {
    const s = repo.update({ defaultDurationMs: 8000, autoReload: false });
    expect(s.defaultDurationMs).toBe(8000);
    expect(s.autoReload).toBe(false);
    expect(s.offlineFallback).toBe(true);
  });
});
