import { AppwriteException, ID, type Models } from 'appwrite';
import { getAppwriteServices } from './client';

export type AuthUser = Models.User<Models.Preferences>;

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await getAppwriteServices().account.get();
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) return null;
    throw error;
  }
}

export async function registerWithPassword(email: string, password: string, name: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  await account.create({ userId: ID.unique(), email, password, name: name.trim() || undefined });
  await account.createEmailPasswordSession({ email, password });
  return account.get();
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const { account } = getAppwriteServices();
  await account.createEmailPasswordSession({ email, password });
  return account.get();
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
  await account.createSession({ userId, secret });
  return account.get();
}

export async function logoutCurrentSession(): Promise<void> {
  await getAppwriteServices().account.deleteSession({ sessionId: 'current' });
}

export function describeAppwriteError(error: unknown): string {
  if (!(error instanceof Error)) return '请求失败，请稍后重试';
  const message = error.message;
  if (/invalid credentials|Invalid credentials/i.test(message)) return '邮箱或密码不正确';
  if (/password.*8|password.*characters/i.test(message)) return '密码至少需要 8 位，并避免使用过于简单的组合';
  if (/user.*already exists/i.test(message)) return '该邮箱已经注册，请直接登录';
  if (/rate limit|too many/i.test(message)) return '请求过于频繁，请稍后再试';
  if (/network|fetch failed|failed to fetch/i.test(message)) return '无法连接 Appwrite，请检查网络或站点白名单后重试';
  return message || 'Appwrite 请求失败';
}
