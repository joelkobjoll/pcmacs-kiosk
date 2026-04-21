import type { RequestHandler } from 'express';
import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth-middleware.js';
import type {
  DeleteMediaUseCase,
  ListMediaUseCase,
  UploadMediaUseCase,
} from '../application/index.js';
import { upload } from '../infrastructure/disk-media-storage.js';

export interface MediaUseCases {
  listMedia: ListMediaUseCase;
  uploadMedia: UploadMediaUseCase;
  deleteMedia: DeleteMediaUseCase;
}

// Cast needed: @types/multer uses express-serve-static-core@4, our router uses @5
const multerSingle = upload.single('file') as unknown as RequestHandler;

export function createMediaRouter(useCases: MediaUseCases): Router {
  const router = Router();

  router.get('/media', authMiddleware, (_req, res) => {
    res.json(useCases.listMedia.execute());
  });

  router.post('/media/upload', authMiddleware, multerSingle, (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded or unsupported type' });
      return;
    }
    const item = useCases.uploadMedia.execute({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
    res.status(201).json(item);
  });

  router.delete('/media/:id', authMiddleware, (req, res) => {
    const id = Number.parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    useCases.deleteMedia.execute(id);
    res.status(204).end();
  });

  return router;
}
