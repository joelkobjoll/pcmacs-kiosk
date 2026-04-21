import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import type { GetDeviceStatusUseCase } from '../application/index.js';

export function createStatusRouter(getDeviceStatus: GetDeviceStatusUseCase): Router {
  const router = Router();

  router.get('/status', authMiddleware, (_req, res) => {
    res.json(getDeviceStatus.execute());
  });

  return router;
}
