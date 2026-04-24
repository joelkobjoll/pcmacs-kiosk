import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ALLOWED_TYPES, DiskMediaStorage, upload } from './disk-media-storage.js';

describe('DiskMediaStorage', () => {
  let tempDir: string;
  let storage: DiskMediaStorage;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-test-'));
    storage = new DiskMediaStorage(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('deleteFile removes existing file', () => {
    const filePath = path.join(tempDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello');
    expect(fs.existsSync(filePath)).toBe(true);

    storage.deleteFile('test.txt');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('deleteFile does not throw for missing file', () => {
    expect(() => storage.deleteFile('nonexistent.txt')).not.toThrow();
  });
});

describe('ALLOWED_TYPES regex', () => {
  it('matches image/jpeg', () => {
    expect(ALLOWED_TYPES.test('image/jpeg')).toBe(true);
  });

  it('matches image/png', () => {
    expect(ALLOWED_TYPES.test('image/png')).toBe(true);
  });

  it('matches image/gif', () => {
    expect(ALLOWED_TYPES.test('image/gif')).toBe(true);
  });

  it('matches image/webp', () => {
    expect(ALLOWED_TYPES.test('image/webp')).toBe(true);
  });

  it('matches image/svg+xml', () => {
    expect(ALLOWED_TYPES.test('image/svg+xml')).toBe(true);
  });

  it('matches video/mp4', () => {
    expect(ALLOWED_TYPES.test('video/mp4')).toBe(true);
  });

  it('matches video/webm', () => {
    expect(ALLOWED_TYPES.test('video/webm')).toBe(true);
  });

  it('rejects application/octet-stream', () => {
    expect(ALLOWED_TYPES.test('application/octet-stream')).toBe(false);
  });

  it('rejects text/plain', () => {
    expect(ALLOWED_TYPES.test('text/plain')).toBe(false);
  });
});

describe('multer upload config', () => {
  it('has 2 GB file size limit', () => {
    // @ts-expect-error — multer exposes limits internally
    const limits = upload.limits as { fileSize?: number } | undefined;
    expect(limits?.fileSize).toBe(2 * 1024 * 1024 * 1024);
  });
});
