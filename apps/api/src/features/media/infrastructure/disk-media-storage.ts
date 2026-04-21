import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import type { IMediaStorage } from '../domain/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(__dirname, '../../../../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_TYPES = /image\/(jpeg|png|gif|webp|svg\+xml)|video\/(mp4|webm)/;

export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_TYPES.test(file.mimetype));
  },
});

export class DiskMediaStorage implements IMediaStorage {
  constructor(private readonly uploadsDir: string) {}

  deleteFile(filename: string): void {
    const filePath = path.join(this.uploadsDir, filename);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore missing file
    }
  }
}
