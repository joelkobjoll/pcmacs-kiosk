/** Port interfaces — no external dependencies. */

export interface IAuthRepository {
  getPasswordHash(): string | null;
  setPasswordHash(hash: string): void;
}

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
