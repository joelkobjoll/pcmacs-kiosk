import type { IAuthRepository, IPasswordHasher } from '../domain/index.js';

export class GetSetupStatusUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  execute(): boolean {
    return this.authRepo.getPasswordHash() !== null;
  }
}

export class SetupUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(password: string): Promise<void> {
    if (this.authRepo.getPasswordHash() !== null) {
      throw new Error('Already set up');
    }
    const hash = await this.hasher.hash(password);
    this.authRepo.setPasswordHash(hash);
  }
}

export class LoginUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(password: string): Promise<boolean> {
    const hash = this.authRepo.getPasswordHash();
    if (!hash) return false;
    return this.hasher.compare(password, hash);
  }
}

export class ChangePasswordUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(oldPassword: string, newPassword: string): Promise<boolean> {
    const hash = this.authRepo.getPasswordHash();
    if (!hash) return false;
    const valid = await this.hasher.compare(oldPassword, hash);
    if (!valid) return false;
    const newHash = await this.hasher.hash(newPassword);
    this.authRepo.setPasswordHash(newHash);
    return true;
  }
}
