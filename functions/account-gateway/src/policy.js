export function assertFreshEmailOtpSession(session, userId, nowMs = Date.now()) {
  if (!session || session.userId !== userId || !session.current) throw new Error('找回会话无效，请重新获取验证码');
  if (session.provider !== 'token' || !Array.isArray(session.factors) || !session.factors.includes('email')) throw new Error('必须通过邮箱验证码后才能重设密码');
  const createdAt = Date.parse(session.$createdAt ?? '');
  if (!Number.isFinite(createdAt) || nowMs - createdAt > 10 * 60_000 || createdAt > nowMs + 60_000) throw new Error('找回验证已过期，请重新获取验证码');
  return session;
}

export function assertRecoverablePasswordUser(user, userId) {
  if (!user || user.$id !== userId || !user.emailVerification) throw new Error('邮箱账号尚未完成验证');
  if (!user.passwordUpdate) throw new Error('该邮箱没有可找回的密码账号，请注册新账号');
  return user;
}
