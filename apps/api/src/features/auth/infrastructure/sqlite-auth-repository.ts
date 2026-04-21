import type Database from 'better-sqlite3';
import type { IAuthRepository } from '../domain/index.js';

const PASSWORD_KEY = 'admin_password_hash';

export class SqliteAuthRepository implements IAuthRepository {
  constructor(private readonly db: Database.Database) {}

  getPasswordHash(): string | null {
    const row = this.db.prepare('SELECT value FROM config WHERE key = ?').get(PASSWORD_KEY) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  }

  setPasswordHash(hash: string): void {
    this.db
      .prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
      .run(PASSWORD_KEY, hash);
  }
}
