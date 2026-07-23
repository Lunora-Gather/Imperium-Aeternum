import { Account, Client, Users } from 'node-appwrite';
import { assertFreshEmailOtpSession, assertRecoverablePasswordUser } from './policy.js';

function clients(req) {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const admin = new Client().setEndpoint(endpoint).setProject(project).setKey(req.headers['x-appwrite-key']);
  const acting = new Client().setEndpoint(endpoint).setProject(project).setJWT(req.headers['x-appwrite-user-jwt']);
  return { account: new Account(acting), users: new Users(admin) };
}

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    const jwt = req.headers['x-appwrite-user-jwt'];
    if (!userId || !jwt) return res.json({ ok: false, message: '必须先通过邮箱验证码' }, 401);
    const body = req.bodyJson ?? {};
    if (body.action !== 'complete_otp_recovery') return res.json({ ok: false, message: '不支持的账号操作' }, 400);
    const password = String(body.password ?? '');
    if (password.length < 8 || password.length > 256) return res.json({ ok: false, message: '新密码必须为 8 到 256 位字符' }, 400);
    const { account, users } = clients(req);
    assertFreshEmailOtpSession(await account.getSession({ sessionId: 'current' }), userId);
    assertRecoverablePasswordUser(await users.get({ userId }), userId);
    await users.updatePassword({ userId, password });
    return res.json({ ok: true });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    return res.json({ ok: false, message: cause instanceof Error ? cause.message : '密码找回失败' }, 400);
  }
};
