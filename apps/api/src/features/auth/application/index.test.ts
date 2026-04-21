import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IAuthRepository, IPasswordHasher } from '../domain/index.js';
import {
  ChangePasswordUseCase,
  GetSetupStatusUseCase,
  LoginUseCase,
  SetupUseCase,
} from './index.js';

function makeMockRepo(passwordHash: string | null = null): IAuthRepository {
  let stored = passwordHash;
  return {
    getPasswordHash: vi.fn(() => stored),
    setPasswordHash: vi.fn((hash: string) => {
      stored = hash;
    }),
  };
}

function makeMockHasher(valid = true): IPasswordHasher {
  return {
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    compare: vi.fn(async () => valid),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('GetSetupStatusUseCase', () => {
  it('returns false when no password stored', () => {
    const uc = new GetSetupStatusUseCase(makeMockRepo(null));
    expect(uc.execute()).toBe(false);
  });

  it('returns true when password is stored', () => {
    const uc = new GetSetupStatusUseCase(makeMockRepo('$hash'));
    expect(uc.execute()).toBe(true);
  });
});

describe('SetupUseCase', () => {
  it('hashes password and stores it', async () => {
    const repo = makeMockRepo(null);
    const hasher = makeMockHasher();
    await new SetupUseCase(repo, hasher).execute('password123');
    expect(hasher.hash).toHaveBeenCalledWith('password123');
    expect(repo.setPasswordHash).toHaveBeenCalledWith('hashed:password123');
  });

  it('throws if already set up', async () => {
    const repo = makeMockRepo('$existing');
    await expect(new SetupUseCase(repo, makeMockHasher()).execute('p')).rejects.toThrow(
      'Already set up',
    );
  });
});

describe('LoginUseCase', () => {
  it('returns true with correct password', async () => {
    const repo = makeMockRepo('$hash');
    const hasher = makeMockHasher(true);
    expect(await new LoginUseCase(repo, hasher).execute('correct')).toBe(true);
  });

  it('returns false with wrong password', async () => {
    const repo = makeMockRepo('$hash');
    const hasher = makeMockHasher(false);
    expect(await new LoginUseCase(repo, hasher).execute('wrong')).toBe(false);
  });

  it('returns false when not set up', async () => {
    expect(await new LoginUseCase(makeMockRepo(null), makeMockHasher()).execute('x')).toBe(false);
  });
});

describe('ChangePasswordUseCase', () => {
  it('updates password when old password is correct', async () => {
    const repo = makeMockRepo('$old');
    const hasher = makeMockHasher(true);
    const ok = await new ChangePasswordUseCase(repo, hasher).execute('old', 'newpass1');
    expect(ok).toBe(true);
    expect(repo.setPasswordHash).toHaveBeenCalledWith('hashed:newpass1');
  });

  it('returns false when old password is wrong', async () => {
    const repo = makeMockRepo('$old');
    const hasher = makeMockHasher(false);
    const ok = await new ChangePasswordUseCase(repo, hasher).execute('wrong', 'newpass1');
    expect(ok).toBe(false);
    expect(repo.setPasswordHash).not.toHaveBeenCalled();
  });

  it('returns false when not set up', async () => {
    expect(
      await new ChangePasswordUseCase(makeMockRepo(null), makeMockHasher()).execute('x', 'y'),
    ).toBe(false);
  });
});

describe('BcryptPasswordHasher (integration)', () => {
  beforeEach(() => vi.useRealTimers());

  it('hashes and compares correctly', async () => {
    const { BcryptPasswordHasher } = await import('../infrastructure/bcrypt-password-hasher.js');
    const hasher = new BcryptPasswordHasher(4); // low rounds for speed
    const hash = await hasher.hash('secret');
    expect(await hasher.compare('secret', hash)).toBe(true);
    expect(await hasher.compare('wrong', hash)).toBe(false);
  });
});
