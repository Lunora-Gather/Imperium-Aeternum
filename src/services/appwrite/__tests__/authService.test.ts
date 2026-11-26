import { AppwriteException } from 'appwrite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createEmailPasswordSession: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
  updateName: vi.fn(),
  updatePassword: vi.fn(),
  createExecution: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../client', () => ({ getAppwriteServices: () => ({ account: mocks, functions: { createExecution: mocks.createExecution } }) }));

import { completePasswordRecovery, completeVerifiedRegistration, loginWithPassword, logoutCurrentSession } from '../authService';

describe('verified Appwrite account flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createEmailPasswordSession.mockResolvedValue({ $id: 'password-session', userId: 'u1' });
    mocks.createSession.mockResolvedValue({});
    mocks.deleteSession.mockResolvedValue({});
    mocks.updateName.mockResolvedValue({});
    mocks.updatePassword.mockResolvedValue({});
    mocks.createExecution.mockResolvedValue({ responseBody: '{"ok":true}' });
  });

  it('rejects a password session whose email is not verified', async () => {
    mocks.get.mockResolvedValue({ $id: 'u1', emailVerification: false });
    await expect(loginWithPassword('ruler@example.com', 'Imperium42')).rejects.toThrow('尚未验证');
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'password-session' });
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
    mocks.get.mockResolvedValue({ $id: 'u3', emailVerification: true });
    mocks.updatePassword.mockRejectedValueOnce(new Error('password rejected'));
    await expect(completeVerifiedRegistration('u3', '123456', 'weak', '执政官')).rejects.toThrow('password rejected');
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
  });

  it('updates a password only after a recovery OTP verifies an existing password account', async () => {
    mocks.get.mockResolvedValue({ $id: 'u4', emailVerification: true, passwordUpdate: '2026-07-22T00:00:00.000Z' });
    await completePasswordRecovery('u4', '654321', 'NewImperium42');
    expect(mocks.createSession).toHaveBeenCalledWith({ userId: 'u4', secret: '654321' });
    expect(mocks.createExecution).toHaveBeenCalledWith(expect.objectContaining({ functionId: 'account-gateway', body: JSON.stringify({ action: 'complete_otp_recovery', password: 'NewImperium42' }) }));
    expect(mocks.createSession.mock.invocationCallOrder[0]).toBeLessThan(mocks.createExecution.mock.invocationCallOrder[0]);
  });

  it('does not turn an unknown OTP-only account into a recovered password account', async () => {
    mocks.get.mockResolvedValue({ $id: 'u5', emailVerification: true, passwordUpdate: '' });
    await expect(completePasswordRecovery('u5', '654321', 'NewImperium42')).rejects.toThrow('没有可找回');
    expect(mocks.createExecution).not.toHaveBeenCalled();
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
  });

  it('finishes local logout when the session deletion response is lost', async () => {
    mocks.get.mockRejectedValueOnce(new AppwriteException('guest', 401));
    mocks.deleteSession.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(logoutCurrentSession()).resolves.toBeUndefined();
    expect(mocks.deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
  });

  it('checks the OTP account before changing an existing registered profile', async () => {
    mocks.get.mockResolvedValue({ $id: 'u5', emailVerification: true, passwordUpdate: '2026-01-01' });
    await expect(completeVerifiedRegistration('u5', '123456', 'Password123', 'different')).rejects.toThrow('已经注册');
    expect(mocks.updateName).not.toHaveBeenCalled();
    expect(mocks.updatePassword).not.toHaveBeenCalled();
  });

  it('reports an unconfirmed logout when both deletion and session lookup are offline', async () => {
    mocks.deleteSession.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mocks.get.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(logoutCurrentSession()).rejects.toThrow();
  });

  it('resumes the same verified account after a lost login acknowledgement', async () => {
    mocks.createEmailPasswordSession.mockRejectedValueOnce(new AppwriteException('active session', 401, 'user_session_already_exists'));
    mocks.get.mockResolvedValue({ $id: 'u1', email: 'ruler@example.com', emailVerification: true });
    await expect(loginWithPassword('Ruler@example.com', 'password')).resolves.toMatchObject({ $id: 'u1' });
  });

  it('leaves a replacement session in another tab alone when logging out', async () => {
    mocks.getSession.mockResolvedValueOnce({ $id: 'session-b', userId: 'b' });
    await expect(logoutCurrentSession('a')).rejects.toMatchObject({ sessionChanged: true });
    expect(mocks.deleteSession).not.toHaveBeenCalled();
  });
});
