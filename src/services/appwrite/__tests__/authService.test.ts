import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createEmailPasswordSession: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  updateName: vi.fn(),
  updatePassword: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../client', () => ({ getAppwriteServices: () => ({ account: mocks }) }));

import { completeVerifiedRegistration, loginWithPassword } from '../authService';

describe('verified Appwrite account flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createEmailPasswordSession.mockResolvedValue({});
    mocks.createSession.mockResolvedValue({});
    mocks.deleteSession.mockResolvedValue({});
    mocks.updateName.mockResolvedValue({});
    mocks.updatePassword.mockResolvedValue({});
  });

  it('rejects a password session whose email is not verified', async () => {
    mocks.get.mockResolvedValue({ $id: 'u1', emailVerification: false });
    await expect(loginWithPassword('ruler@example.com', 'Imperium42')).rejects.toThrow('尚未验证');
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
  });

  it('sets profile and password only after the OTP session is created', async () => {
    mocks.get.mockResolvedValue({ $id: 'u2', emailVerification: true });
    await completeVerifiedRegistration('u2', '123456', 'Imperium42', '执政官');
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u2', secret: '123456' });
    expect(mocks.updateName).toHaveBeenCalledWith({ name: '执政官' });
    expect(mocks.updatePassword).toHaveBeenCalledWith({ password: 'Imperium42' });
    expect(mocks.createSession.mock.invocationCallOrder[0]).toBeLessThan(mocks.updatePassword.mock.invocationCallOrder[0]);
  });

  it('cleans up the temporary session if registration finalization fails', async () => {
    mocks.updatePassword.mockRejectedValueOnce(new Error('password rejected'));
    await expect(completeVerifiedRegistration('u3', '123456', 'weak', '执政官')).rejects.toThrow('password rejected');
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
  });
});
