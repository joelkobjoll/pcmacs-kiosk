export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export interface SaveMediaInput {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IMediaRepository {
  findAll(): MediaItem[];
  findById(id: number): MediaItem | null;
  save(input: SaveMediaInput): MediaItem;
  /** Deletes the DB record and returns the filename for storage cleanup. */
  deleteRecord(id: number): string | null;
}

export interface IMediaStorage {
  deleteFile(filename: string): void;
}
