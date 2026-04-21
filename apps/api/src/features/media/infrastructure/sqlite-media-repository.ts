import type Database from 'better-sqlite3';
import type { IMediaRepository, MediaItem, SaveMediaInput } from '../domain/index.js';

const BASE_URL = process.env.BASE_URL ?? '';

interface MediaRow {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

function toMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    url: `${BASE_URL}/uploads/${row.filename}`,
    createdAt: row.created_at,
  };
}

export class SqliteMediaRepository implements IMediaRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): MediaItem[] {
    const rows = this.db
      .prepare('SELECT * FROM media ORDER BY created_at DESC')
      .all() as MediaRow[];
    return rows.map(toMedia);
  }

  findById(id: number): MediaItem | null {
    const row = this.db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;
    return row ? toMedia(row) : null;
  }

  save(input: SaveMediaInput): MediaItem {
    const result = this.db
      .prepare(
        `INSERT INTO media (filename, original_name, mime_type, size_bytes)
         VALUES (@filename, @originalName, @mimeType, @sizeBytes)`,
      )
      .run({
        filename: input.filename,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
    const row = this.findById(result.lastInsertRowid as number);
    if (!row) throw new Error('Failed to retrieve created media item');
    return row;
  }

  deleteRecord(id: number): string | null {
    const row = this.db.prepare('SELECT filename FROM media WHERE id = ?').get(id) as
      | { filename: string }
      | undefined;
    this.db.prepare('DELETE FROM media WHERE id = ?').run(id);
    return row?.filename ?? null;
  }
}
