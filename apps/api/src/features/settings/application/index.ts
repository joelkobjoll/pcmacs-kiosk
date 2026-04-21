import type { ISettingsRepository, Settings, UpdateSettingsInput } from '../domain/index.js';

export class GetSettingsUseCase {
  constructor(private readonly repo: ISettingsRepository) {}
  execute(): Settings {
    return this.repo.get();
  }
}

export class UpdateSettingsUseCase {
  constructor(private readonly repo: ISettingsRepository) {}
  execute(input: UpdateSettingsInput): Settings {
    return this.repo.update(input);
  }
}
