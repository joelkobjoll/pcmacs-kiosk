import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import type {
  CreateSlideUseCase,
  DeleteSlideUseCase,
  GetSlidesUseCase,
  ReorderSlidesUseCase,
  UpdateSlideUseCase,
} from '../application/index.js';

export interface SlideUseCases {
  getSlides: GetSlidesUseCase;
  createSlide: CreateSlideUseCase;
  updateSlide: UpdateSlideUseCase;
  deleteSlide: DeleteSlideUseCase;
  reorderSlides: ReorderSlidesUseCase;
}

const SOURCE_TYPES = ['image', 'video', 'youtube', 'google_slides', 'website'] as const;

const createSchema = z.object({
  title: z.string().min(1),
  sourceType: z.enum(SOURCE_TYPES),
  url: z.string().min(1),
  durationMs: z.number().int().min(0).optional(),
  transitionIn: z
    .enum(['fade', 'slide-left', 'slide-right', 'slide-up', 'zoom-fade', 'ken-burns'])
    .default('fade'),
  slideCount: z.number().int().min(1).optional(),
  slideDurationMs: z.number().int().min(500).optional(),
  ytStartSeconds: z.number().int().min(0).optional(),
  ytEndSeconds: z.number().int().min(1).nullable().optional(),
  muted: z.boolean().optional(),
  qrUrl: z.string().min(1).nullable().optional(),
  scheduleStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM')
    .nullable()
    .optional(),
  scheduleEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM')
    .nullable()
    .optional(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({ ids: z.array(z.number().int()) });

export function createSlidesRouter(useCases: SlideUseCases): Router {
  const router = Router();

  // Public — display page polls without auth
  router.get('/slides', (_req, res) => {
    res.json(useCases.getSlides.execute());
  });

  router.post('/slides', authMiddleware, (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    res.status(201).json(useCases.createSlide.execute(parsed.data));
  });

  // PATCH /slides/reorder must come before /slides/:id
  router.patch('/slides/reorder', authMiddleware, (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    useCases.reorderSlides.execute(parsed.data.ids);
    res.status(204).end();
  });

  router.patch('/slides/:id', authMiddleware, (req, res) => {
    const id = Number.parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const slide = useCases.updateSlide.execute(id, parsed.data);
    if (!slide) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(slide);
  });

  router.delete('/slides/:id', authMiddleware, (req, res) => {
    const id = Number.parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    useCases.deleteSlide.execute(id);
    res.status(204).end();
  });

  return router;
}
