import type Database from 'better-sqlite3';
import type { SlideSourceType, TransitionType } from '../../../shared/types.js';
import type {
  CreateSlideInput,
  ISlideRepository,
  Slide,
  UpdateSlideInput,
} from '../domain/index.js';

interface SlideRow {
  id: number;
  title: string;
  source_type: SlideSourceType;
  url: string;
  duration_ms: number;
  transition_in: TransitionType;
  is_active: number;
  sort_order: number;
  slide_count: number;
  slide_duration_ms: number;
  yt_start_seconds: number;
  yt_end_seconds: number | null;
  muted: number;
  qr_url: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_days: string | null;
}

function toSlide(row: SlideRow): Slide {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    url: row.url,
    durationMs: row.duration_ms,
    transitionIn: row.transition_in,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    slideCount: row.slide_count,
    slideDurationMs: row.slide_duration_ms,
    ytStartSeconds: row.yt_start_seconds ?? 0,
    ytEndSeconds: row.yt_end_seconds ?? null,
    muted: row.muted === 1,
    qrUrl: row.qr_url ?? null,
    scheduleStart: row.schedule_start ?? null,
    scheduleEnd: row.schedule_end ?? null,
    scheduleDays: row.schedule_days ? (JSON.parse(row.schedule_days) as number[]) : null,
  };
}

export class SqliteSlideRepository implements ISlideRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Slide[] {
    const rows = this.db
      .prepare('SELECT * FROM slides ORDER BY sort_order ASC, id ASC')
      .all() as SlideRow[];
    return rows.map(toSlide);
  }

  findById(id: number): Slide | null {
    const row = this.db.prepare('SELECT * FROM slides WHERE id = ?').get(id) as
      | SlideRow
      | undefined;
    return row ? toSlide(row) : null;
  }

  create(input: CreateSlideInput): Slide {
    const maxOrder = (
      this.db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM slides').get() as {
        m: number;
      }
    ).m;
    const result = this.db
      .prepare(
        `INSERT INTO slides
           (title, source_type, url, duration_ms, transition_in, sort_order,
            slide_count, slide_duration_ms, yt_start_seconds, yt_end_seconds,
            muted, qr_url, schedule_start, schedule_end, schedule_days)
         VALUES
           (@title, @sourceType, @url, @durationMs, @transitionIn, @sortOrder,
            @slideCount, @slideDurationMs, @ytStartSeconds, @ytEndSeconds,
            @muted, @qrUrl, @scheduleStart, @scheduleEnd, @scheduleDays)`,
      )
      .run({
        title: input.title,
        sourceType: input.sourceType,
        url: input.url,
        durationMs: input.durationMs ?? 5000,
        transitionIn: input.transitionIn,
        sortOrder: maxOrder + 1,
        slideCount: input.slideCount ?? 1,
        slideDurationMs: input.slideDurationMs ?? 5000,
        ytStartSeconds: input.ytStartSeconds ?? 0,
        ytEndSeconds: input.ytEndSeconds ?? null,
        muted: (input.muted ?? true) ? 1 : 0,
        qrUrl: input.qrUrl ?? null,
        scheduleStart: input.scheduleStart ?? null,
        scheduleEnd: input.scheduleEnd ?? null,
        scheduleDays: input.scheduleDays ? JSON.stringify(input.scheduleDays) : null,
      });
    const row = this.findById(result.lastInsertRowid as number);
    if (!row) throw new Error('Failed to retrieve created slide');
    return row;
  }

  update(id: number, input: UpdateSlideInput): Slide | null {
    const fields: string[] = [];
    const values: Record<string, unknown> = { id };

    if (input.title !== undefined) {
      fields.push('title = @title');
      values.title = input.title;
    }
    if (input.sourceType !== undefined) {
      fields.push('source_type = @sourceType');
      values.sourceType = input.sourceType;
    }
    if (input.url !== undefined) {
      fields.push('url = @url');
      values.url = input.url;
    }
    if (input.durationMs !== undefined) {
      fields.push('duration_ms = @durationMs');
      values.durationMs = input.durationMs;
    }
    if (input.transitionIn !== undefined) {
      fields.push('transition_in = @transitionIn');
      values.transitionIn = input.transitionIn;
    }
    if (input.isActive !== undefined) {
      fields.push('is_active = @isActive');
      values.isActive = input.isActive ? 1 : 0;
    }
    if (input.slideCount !== undefined) {
      fields.push('slide_count = @slideCount');
      values.slideCount = input.slideCount;
    }
    if (input.slideDurationMs !== undefined) {
      fields.push('slide_duration_ms = @slideDurationMs');
      values.slideDurationMs = input.slideDurationMs;
    }
    if (input.ytStartSeconds !== undefined) {
      fields.push('yt_start_seconds = @ytStartSeconds');
      values.ytStartSeconds = input.ytStartSeconds;
    }
    if (input.ytEndSeconds !== undefined) {
      fields.push('yt_end_seconds = @ytEndSeconds');
      values.ytEndSeconds = input.ytEndSeconds;
    }
    if (input.muted !== undefined) {
      fields.push('muted = @muted');
      values.muted = input.muted ? 1 : 0;
    }
    if (input.qrUrl !== undefined) {
      fields.push('qr_url = @qrUrl');
      values.qrUrl = input.qrUrl;
    }
    if (input.scheduleStart !== undefined) {
      fields.push('schedule_start = @scheduleStart');
      values.scheduleStart = input.scheduleStart;
    }
    if (input.scheduleEnd !== undefined) {
      fields.push('schedule_end = @scheduleEnd');
      values.scheduleEnd = input.scheduleEnd;
    }
    if (input.scheduleDays !== undefined) {
      fields.push('schedule_days = @scheduleDays');
      values.scheduleDays = input.scheduleDays ? JSON.stringify(input.scheduleDays) : null;
    }

    if (fields.length === 0) return this.findById(id);
    this.db.prepare(`UPDATE slides SET ${fields.join(', ')} WHERE id = @id`).run(values);
    return this.findById(id);
  }

  remove(id: number): void {
    this.db.prepare('DELETE FROM slides WHERE id = ?').run(id);
  }

  reorder(ids: number[]): void {
    const update = this.db.prepare('UPDATE slides SET sort_order = @order WHERE id = @id');
    const tx = this.db.transaction((items: number[]) => {
      items.forEach((id, index) => update.run({ order: index, id }));
    });
    tx(ids);
  }
}
