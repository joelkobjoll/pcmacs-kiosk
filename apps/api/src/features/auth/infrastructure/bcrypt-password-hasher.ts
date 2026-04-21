import bcrypt from 'bcryptjs';
import type { IPasswordHasher } from '../domain/index.js';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly rounds = 12) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
