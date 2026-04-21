import type {
  CreateSlideInput,
  ISlideRepository,
  Slide,
  UpdateSlideInput,
} from '../domain/index.js';

interface ResolvedDefaults {
  durationMs: number;
  slideCount: number;
  slideDurationMs: number;
  ytStartSeconds: number;
  ytEndSeconds: number | null;
}

function resolveDefaults(input: CreateSlideInput): ResolvedDefaults {
  if (input.sourceType === 'google_slides') {
    const slideCount = input.slideCount ?? 1;
    const slideDurationMs = input.slideDurationMs ?? 5000;
    return {
      durationMs: slideCount * slideDurationMs,
      slideCount,
      slideDurationMs,
      ytStartSeconds: 0,
      ytEndSeconds: null,
    };
  }
  // youtube and video share the same trim + auto-advance logic
  if (input.sourceType === 'youtube' || input.sourceType === 'video') {
    const ytStartSeconds = input.ytStartSeconds ?? 0;
    const ytEndSeconds = input.ytEndSeconds ?? null;
    // durationMs = 0 means "no timer — advance when playback ends"
    const durationMs =
      ytEndSeconds != null ? Math.max(0, (ytEndSeconds - ytStartSeconds) * 1000) : 0;
    return { durationMs, slideCount: 1, slideDurationMs: 5000, ytStartSeconds, ytEndSeconds };
  }
  return {
    durationMs: input.durationMs ?? 5000,
    slideCount: input.slideCount ?? 1,
    slideDurationMs: input.slideDurationMs ?? 5000,
    ytStartSeconds: 0,
    ytEndSeconds: null,
  };
}

export class GetSlidesUseCase {
  constructor(private readonly repo: ISlideRepository) {}
  execute(): Slide[] {
    return this.repo.findAll();
  }
}

export class CreateSlideUseCase {
  constructor(private readonly repo: ISlideRepository) {}
  execute(input: CreateSlideInput): Slide {
    return this.repo.create({ ...input, ...resolveDefaults(input) });
  }
}

export class UpdateSlideUseCase {
  constructor(private readonly repo: ISlideRepository) {}
  execute(id: number, input: UpdateSlideInput): Slide | null {
    const current = this.repo.findById(id);
    if (!current) return null;

    const updates: UpdateSlideInput = { ...input };
    const sourceType = input.sourceType ?? current.sourceType;

    if (sourceType === 'google_slides') {
      const changing = input.slideCount !== undefined || input.slideDurationMs !== undefined;
      if (changing) {
        const slideCount = input.slideCount ?? current.slideCount;
        const slideDurationMs = input.slideDurationMs ?? current.slideDurationMs;
        updates.durationMs = slideCount * slideDurationMs;
        updates.slideCount = slideCount;
        updates.slideDurationMs = slideDurationMs;
      }
    }

    if (sourceType === 'youtube' || sourceType === 'video') {
      const changingTrim = input.ytStartSeconds !== undefined || input.ytEndSeconds !== undefined;
      if (changingTrim) {
        const ytStart = input.ytStartSeconds ?? current.ytStartSeconds;
        const ytEnd = input.ytEndSeconds !== undefined ? input.ytEndSeconds : current.ytEndSeconds;
        updates.durationMs = ytEnd != null ? Math.max(0, (ytEnd - ytStart) * 1000) : 0;
        updates.ytStartSeconds = ytStart;
        updates.ytEndSeconds = ytEnd;
      }
    }

    return this.repo.update(id, updates);
  }
}

export class DeleteSlideUseCase {
  constructor(private readonly repo: ISlideRepository) {}
  execute(id: number): void {
    this.repo.remove(id);
  }
}

export class ReorderSlidesUseCase {
  constructor(private readonly repo: ISlideRepository) {}
  execute(ids: number[]): void {
    this.repo.reorder(ids);
  }
}
