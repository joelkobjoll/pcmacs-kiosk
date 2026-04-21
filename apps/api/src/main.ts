import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import {
  ChangePasswordUseCase,
  GetSetupStatusUseCase,
  LoginUseCase,
  SetupUseCase,
} from './features/auth/application/index.js';
import { BcryptPasswordHasher } from './features/auth/infrastructure/bcrypt-password-hasher.js';
import { SqliteAuthRepository } from './features/auth/infrastructure/sqlite-auth-repository.js';
import { createAuthRouter } from './features/auth/presentation/routes.js';
import {
  DeleteMediaUseCase,
  ListMediaUseCase,
  UploadMediaUseCase,
} from './features/media/application/index.js';
import {
  DiskMediaStorage,
  UPLOADS_DIR,
} from './features/media/infrastructure/disk-media-storage.js';
import { SqliteMediaRepository } from './features/media/infrastructure/sqlite-media-repository.js';
import { createMediaRouter } from './features/media/presentation/routes.js';
import {
  GetSettingsUseCase,
  UpdateSettingsUseCase,
} from './features/settings/application/index.js';
import { SqliteSettingsRepository } from './features/settings/infrastructure/sqlite-settings-repository.js';
import { createSettingsRouter } from './features/settings/presentation/routes.js';
import {
  CreateSlideUseCase,
  DeleteSlideUseCase,
  GetSlidesUseCase,
  ReorderSlidesUseCase,
  UpdateSlideUseCase,
} from './features/slides/application/index.js';
import { SqliteSlideRepository } from './features/slides/infrastructure/sqlite-slides-repository.js';
import { createSlidesRouter } from './features/slides/presentation/routes.js';
import { GetDeviceStatusUseCase } from './features/status/application/index.js';
import { createStatusRouter } from './features/status/presentation/routes.js';
import { getDb } from './infrastructure/database/db.js';
import { runMigrations } from './infrastructure/database/migrate.js';
import { errorMiddleware } from './shared/middleware/error-middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const BIND_HOST = process.env.BIND_HOST ?? '0.0.0.0';
const WEB_DIST = path.join(__dirname, '../../web/dist');

// Ensure runtime directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, '../../../data'), { recursive: true });

// ── Infrastructure ────────────────────────────────────────────────────────────
runMigrations();
const db = getDb();

const authRepo = new SqliteAuthRepository(db);
const passwordHasher = new BcryptPasswordHasher();
const slideRepo = new SqliteSlideRepository(db);
const mediaRepo = new SqliteMediaRepository(db);
const mediaStorage = new DiskMediaStorage(UPLOADS_DIR);
const settingsRepo = new SqliteSettingsRepository(db);

// ── Application (use cases) ───────────────────────────────────────────────────
const authUseCases = {
  getSetupStatus: new GetSetupStatusUseCase(authRepo),
  setup: new SetupUseCase(authRepo, passwordHasher),
  login: new LoginUseCase(authRepo, passwordHasher),
  changePassword: new ChangePasswordUseCase(authRepo, passwordHasher),
};

const slideUseCases = {
  getSlides: new GetSlidesUseCase(slideRepo),
  createSlide: new CreateSlideUseCase(slideRepo),
  updateSlide: new UpdateSlideUseCase(slideRepo),
  deleteSlide: new DeleteSlideUseCase(slideRepo),
  reorderSlides: new ReorderSlidesUseCase(slideRepo),
};

const mediaUseCases = {
  listMedia: new ListMediaUseCase(mediaRepo),
  uploadMedia: new UploadMediaUseCase(mediaRepo),
  deleteMedia: new DeleteMediaUseCase(mediaRepo, mediaStorage),
};

const settingsUseCases = {
  getSettings: new GetSettingsUseCase(settingsRepo),
  updateSettings: new UpdateSettingsUseCase(settingsRepo),
};

// ── Presentation (Express app) ────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api', createAuthRouter(authUseCases));
app.use('/api', createSlidesRouter(slideUseCases));
app.use('/api', createMediaRouter(mediaUseCases));
app.use('/api', createSettingsRouter(settingsUseCases));
app.use('/api', createStatusRouter(new GetDeviceStatusUseCase()));

if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });
}

app.use(errorMiddleware);

const server = app.listen(PORT, BIND_HOST, () => {
  console.log(`[API] Server running on http://${BIND_HOST}:${PORT}`);
});

function shutdown(signal: string) {
  console.log(`[API] ${signal} received — shutting down gracefully`);
  server.close(() => {
    // Close SQLite connection cleanly to flush WAL and prevent corruption
    try {
      db.close();
      console.log('[API] Database closed');
    } catch {}
    process.exit(0);
  });
  // Force exit after 5s if connections hang
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
