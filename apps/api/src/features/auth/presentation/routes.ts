import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, createToken } from '../../../shared/middleware/auth-middleware.js';
import { getLocalIp } from '../../../shared/utils/network.js';
import type {
  ChangePasswordUseCase,
  GetSetupStatusUseCase,
  LoginUseCase,
  SetupUseCase,
} from '../application/index.js';

export interface AuthUseCases {
  getSetupStatus: GetSetupStatusUseCase;
  setup: SetupUseCase;
  login: LoginUseCase;
  changePassword: ChangePasswordUseCase;
}

const setupSchema = z.object({ password: z.string().min(8) });
const loginSchema = z.object({ password: z.string() });
const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

export function createAuthRouter(useCases: AuthUseCases): Router {
  const router = Router();

  router.get('/setup/status', (_req, res) => {
    const isSetup = useCases.getSetupStatus.execute();
    res.json({ isSetup, localIp: getLocalIp() });
  });

  router.post('/auth/setup', async (req, res) => {
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    try {
      await useCases.setup.execute(parsed.data.password);
      res.json({ token: createToken() });
    } catch {
      res.status(409).json({ error: 'Already configured' });
    }
  });

  router.post('/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Password required' });
      return;
    }
    const ok = await useCases.login.execute(parsed.data.password);
    if (!ok) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    res.json({ token: createToken() });
  });

  router.post('/auth/change-password', authMiddleware, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const ok = await useCases.changePassword.execute(
      parsed.data.oldPassword,
      parsed.data.newPassword,
    );
    if (!ok) {
      res.status(401).json({ error: 'Invalid current password' });
      return;
    }
    res.json({ success: true });
  });

  return router;
}
