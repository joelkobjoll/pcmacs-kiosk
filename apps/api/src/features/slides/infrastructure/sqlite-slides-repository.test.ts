import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SqliteSlideRepository } from './sqlite-slides-repository.js';

describe('SqliteSlideRepository', () => {
  let db: Database.Database;
  let repo: SqliteSlideRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE slides (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        title           TEXT    NOT NULL,
        source_type     TEXT    NOT NULL,
        url             TEXT    NOT NULL,
        duration_ms     INTEGER NOT NULL DEFAULT 5000,
        transition_in   TEXT    NOT NULL DEFAULT 'fade',
        is_active       INTEGER NOT NULL DEFAULT 1,
        sort_order      INTEGER NOT NULL DEFAULT 0,
        slide_count     INTEGER NOT NULL DEFAULT 1,
        slide_duration_ms INTEGER NOT NULL DEFAULT 5000,
        yt_start_seconds INTEGER NOT NULL DEFAULT 0,
        yt_end_seconds  INTEGER,
        muted           INTEGER NOT NULL DEFAULT 1,
        qr_url          TEXT,
        schedule_start  TEXT,
        schedule_end    TEXT,
        schedule_days   TEXT
      )
    `);
    repo = new SqliteSlideRepository(db);
  });

  afterEach(() => db.close());

  it('findAll returns empty array initially', () => {
    expect(repo.findAll()).toEqual([]);
  });

  it('create adds a slide and returns it', () => {
    const slide = repo.create({
      title: 'Test',
      sourceType: 'image',
      url: 'https://example.com/img.jpg',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    expect(slide.title).toBe('Test');
    expect(slide.isActive).toBe(true);
    expect(slide.sortOrder).toBe(0);
  });

  it('create sets incrementing sort_order', () => {
    const s1 = repo.create({
      title: 'A',
      sourceType: 'image',
      url: 'https://a.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    const s2 = repo.create({
      title: 'B',
      sourceType: 'image',
      url: 'https://b.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    expect(s1.sortOrder).toBe(0);
    expect(s2.sortOrder).toBe(1);
  });

  it('update changes fields', () => {
    const slide = repo.create({
      title: 'X',
      sourceType: 'image',
      url: 'https://x.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    const updated = repo.update(slide.id, { isActive: false, durationMs: 8000 });
    expect(updated?.isActive).toBe(false);
    expect(updated?.durationMs).toBe(8000);
  });

  it('remove deletes a slide', () => {
    const slide = repo.create({
      title: 'Z',
      sourceType: 'image',
      url: 'https://z.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    repo.remove(slide.id);
    expect(repo.findAll()).toHaveLength(0);
  });

  it('reorder changes sort_order', () => {
    const s1 = repo.create({
      title: 'A',
      sourceType: 'image',
      url: 'https://a.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    const s2 = repo.create({
      title: 'B',
      sourceType: 'image',
      url: 'https://b.com',
      durationMs: 5000,
      transitionIn: 'fade',
    });
    repo.reorder([s2.id, s1.id]);
    const slides = repo.findAll();
    expect(slides[0].id).toBe(s2.id);
    expect(slides[1].id).toBe(s1.id);
  });
});
