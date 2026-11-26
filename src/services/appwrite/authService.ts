import { AppwriteException, ExecutionMethod, ID, type Models } from 'appwrite';
import { getAppwriteServices } from './client';
import { APPWRITE_CONFIG } from './config';

export type AuthUser = Models.User<Models.Preferences>;

async function verifiedUser(expectedId?: string, sessionId?: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  const user = await account.get();
  if (expectedId && user.$id !== expectedId) throw new Error('登录账号已更换，请重新确认');
  if (user.emailVerification) return user;
  // Another tab may have replaced the current session while the account request was in flight.
  if (!sessionId) {
    const session = await account.getSession({ sessionId: 'current' });
    if (session.userId === user.$id) sessionId = session.$id;
  }
  if (sessionId) await account.deleteSession({ sessionId }).catch(() => undefined);
  throw new Error('该邮箱尚未验证，请使用邮箱验证码完成验证');
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try { return await verifiedUser(); }
  catch (error) {
    if (error instanceof AppwriteException && error.code === 401) return null;
    throw error;
  }
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  let session;
  try { session = await account.createEmailPasswordSession({ email, password }); }
  catch (error) {
    if (error instanceof AppwriteException && error.type === 'user_session_already_exists') {
      const existing = await getCurrentUser();
      if (existing?.email.toLowerCase() === email.toLowerCase()) return existing;
      if (existing) throw Object.assign(new Error('当前浏览器已登录其他账号，请先退出登录'), { sessionChanged: true });
    }
    throw error;
  }
  return verifiedUser(session.userId, session.$id);
}

export async function requestEmailOtp(email: string): Promise<string> {
  const token = await getAppwriteServices().account.createEmailToken({
    userId: ID.unique(),
    email,
    phrase: false,
  });
  return token.userId;
}

export async function verifyEmailOtp(userId: string, secret: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  const session = await account.createSession({ userId, secret });
  return verifiedUser(userId, session.$id);
}

export async function completeVerifiedRegistration(userId: string, secret: string, password: string, name: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  const session = await account.createSession({ userId, secret });
  try {
    const user = await account.get();
    if (user.$id !== userId || !user.emailVerification) throw new Error('邮箱尚未验证');
    if (user.passwordUpdate) throw new Error('该邮箱已经注册，请直接登录');
    await account.updateName({ name: name.trim() });
    await account.updatePassword({ password });
    return await verifiedUser(userId, session.$id);
  } catch (error) {
    await account.deleteSession({ sessionId: session.$id ?? 'current' }).catch(() => undefined);
    throw error;
  }
}

export async function completePasswordRecovery(userId: string, secret: string, password: string): Promise<AuthUser> {
  const { account, functions } = getAppwriteServices();
  const session = await account.createSession({ userId, secret });
  try {
    const user = await verifiedUser(userId, session.$id);
    if (!user.passwordUpdate) throw new Error('该邮箱没有可找回的密码账号，请注册新账号');
    const execution = await functions.createExecution({
      functionId: APPWRITE_CONFIG.accountGatewayFunctionId,
      body: JSON.stringify({ action: 'complete_otp_recovery', password }),
      async: false,
      xpath: '/',
      method: ExecutionMethod.POST,
    });
    const result = JSON.parse(execution.responseBody || '{}') as { ok?: boolean; message?: string };
    if (!result.ok) throw new Error(result.message || '密码找回失败');
    return await verifiedUser(userId, session.$id);
  } catch (error) {
    await account.deleteSession({ sessionId: session.$id ?? 'current' }).catch(() => undefined);
    throw error;
  }
}

export async function logoutCurrentSession(expectedUserId?: string): Promise<void> {
  const { account } = getAppwriteServices();
  let sessionId = 'current';
  if (expectedUserId) {
    try {
      const session = await account.getSession({ sessionId });
      if (session.userId !== expectedUserId) throw Object.assign(new Error('登录账号已更换，请重新确认'), { sessionChanged: true });
      sessionId = session.$id;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) return;
      throw error;
    }
  }
  try { await account.deleteSession({ sessionId }); }
  catch (error) {
    if (error instanceof AppwriteException && error.code === 401) return;
    const current = await getCurrentUser();
    if (expectedUserId && current && current.$id !== expectedUserId) throw Object.assign(new Error('登录账号已更换，请重新确认'), { sessionChanged: true });
    if (current) throw error;
  }
}

export function describeAppwriteError(error: unknown): string {
  if (!(error instanceof Error)) return '请求失败，请稍后重试';
  const message = error.message;
  if (/invalid credentials|Invalid credentials/i.test(message)) return '邮箱或密码不正确';
  if (/password.*8|password.*characters/i.test(message)) return '密码至少需要 8 位，并避免使用过于简单的组合';
  if (/user.*already exists/i.test(message)) return '该邮箱已经注册，请直接登录';
  if (/verification|not verified|尚未验证/i.test(message)) return '该邮箱尚未验证，请使用邮箱验证码完成验证';
  if (/rate limit|too many/i.test(message)) return '请求过于频繁，请稍后再试';
  if (/network|fetch failed|failed to fetch/i.test(message)) return '无法连接 Appwrite，请检查网络或站点白名单后重试';
  return message || 'Appwrite 请求失败';
}
