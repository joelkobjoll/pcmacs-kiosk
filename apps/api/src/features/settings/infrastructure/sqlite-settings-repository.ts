import type Database from 'better-sqlite3';
import type { TransitionType } from '../../../shared/types.js';
import type { ISettingsRepository, Settings, UpdateSettingsInput } from '../domain/index.js';

interface SettingsRow {
  id: number;
  default_duration_ms: number;
  default_transition: TransitionType;
  auto_reload: number;
  offline_fallback: number;
  google_api_key: string;
}

function toSettings(row: SettingsRow): Settings {
  return {
    defaultDurationMs: row.default_duration_ms,
    defaultTransition: row.default_transition,
    autoReload: row.auto_reload === 1,
    offlineFallback: row.offline_fallback === 1,
    googleApiKey: row.google_api_key ?? '',
  };
}

export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: Database.Database) {}

  get(): Settings {
    const row = this.db.prepare('SELECT * FROM settings WHERE id = 1').get() as SettingsRow;
    return toSettings(row);
  }

  update(input: UpdateSettingsInput): Settings {
    const fields: string[] = [];
    const values: Record<string, unknown> = {};

    if (input.defaultDurationMs !== undefined) {
      fields.push('default_duration_ms = @defaultDurationMs');
      values.defaultDurationMs = input.defaultDurationMs;
    }
    if (input.defaultTransition !== undefined) {
      fields.push('default_transition = @defaultTransition');
      values.defaultTransition = input.defaultTransition;
    }
    if (input.autoReload !== undefined) {
      fields.push('auto_reload = @autoReload');
      values.autoReload = input.autoReload ? 1 : 0;
    }
    if (input.offlineFallback !== undefined) {
      fields.push('offline_fallback = @offlineFallback');
      values.offlineFallback = input.offlineFallback ? 1 : 0;
    }
    if (input.googleApiKey !== undefined) {
      fields.push('google_api_key = @googleApiKey');
      values.googleApiKey = input.googleApiKey;
    }

    if (fields.length === 0) return this.get();
    this.db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`).run(values);
    return this.get();
  }
}
