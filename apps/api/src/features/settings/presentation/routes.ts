import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import type { GetSettingsUseCase, UpdateSettingsUseCase } from '../application/index.js';

export interface SettingsUseCases {
  getSettings: GetSettingsUseCase;
  updateSettings: UpdateSettingsUseCase;
}

const updateSchema = z.object({
  defaultDurationMs: z.number().int().min(500).optional(),
  defaultTransition: z
    .enum(['fade', 'slide-left', 'slide-right', 'slide-up', 'zoom-fade', 'ken-burns'])
    .optional(),
  autoReload: z.boolean().optional(),
  offlineFallback: z.boolean().optional(),
  googleApiKey: z.string().optional(),
});

export function createSettingsRouter(useCases: SettingsUseCases): Router {
  const router = Router();

  router.get('/settings', authMiddleware, (_req, res) => {
    res.json(useCases.getSettings.execute());
  });

  router.patch('/settings', authMiddleware, (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    res.json(useCases.updateSettings.execute(parsed.data));
  });

  return router;
}
