import type { TransitionType } from '../../../shared/types.js';

export interface Settings {
  defaultDurationMs: number;
  defaultTransition: TransitionType;
  autoReload: boolean;
  offlineFallback: boolean;
  googleApiKey: string;
}

export type UpdateSettingsInput = Partial<Settings>;

export interface ISettingsRepository {
  get(): Settings;
  update(input: UpdateSettingsInput): Settings;
}
