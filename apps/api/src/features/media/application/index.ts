import type {
  IMediaRepository,
  IMediaStorage,
  MediaItem,
  SaveMediaInput,
} from '../domain/index.js';

export class ListMediaUseCase {
  constructor(private readonly repo: IMediaRepository) {}
  execute(): MediaItem[] {
    return this.repo.findAll();
  }
}

export class UploadMediaUseCase {
  constructor(private readonly repo: IMediaRepository) {}
  execute(input: SaveMediaInput): MediaItem {
    return this.repo.save(input);
  }
}

export class DeleteMediaUseCase {
  constructor(
    private readonly repo: IMediaRepository,
    private readonly storage: IMediaStorage,
  ) {}

  execute(id: number): void {
    const filename = this.repo.deleteRecord(id);
    if (filename) this.storage.deleteFile(filename);
  }
}
