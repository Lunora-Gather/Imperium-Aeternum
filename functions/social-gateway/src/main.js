import { Client, ID, Permission, Query, Role, TablesDB, Users } from 'node-appwrite';

const DATABASE_ID = 'imperium_game';
const PROFILE_TABLE = 'game_profiles';
const FRIENDSHIP_TABLE = 'friendships';
const MEMBERSHIP_TABLE = 'world_memberships';
const MESSAGE_TABLE = 'world_messages';

function hash(value) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}
const profileId = (userId) => `profile_${hash(userId)}`;
const membershipId = (worldId, userId) => `mem_${hash(worldId)}_${hash(userId)}`;
const pairKey = (a, b) => [a, b].sort().join(':');
const friendshipId = (a, b) => `friend_${hash(pairKey(a, b))}_${hash(`${b}:${a}`)}`;
const readForUsers = (ids) => [...new Set(ids)].slice(0, 100).map((id) => Permission.read(Role.user(id)));

function services(req) {
  const client = new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);
  return { db: new TablesDB(client), users: new Users(client) };
}

async function ensureProfile(db, users, userId) {
  const id = profileId(userId);
  const now = new Date().toISOString();
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id });
    return db.updateRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id, data: { lastSeenAt: now } });
  } catch (error) {
    if (error?.code !== 404) throw error;
    const user = await users.get({ userId });
    const displayName = (user.name || `统治者-${hash(userId).slice(0, 4)}`).slice(0, 64);
    const friendCode = `IA${hash(userId).toUpperCase()}`.slice(0, 10);
    return db.createRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id, data: { userId, displayName, friendCode, createdAt: now, lastSeenAt: now }, permissions: readForUsers([userId]) });
  }
}

async function requireMembership(db, worldId, userId) {
  try { return await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId: membershipId(worldId, userId) }); }
  catch (error) { if (error?.code === 404) throw new Error('只有该版图成员可以使用聊天室'); throw error; }
}

async function worldMembers(db, worldId) {
  const result = await db.listRows({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, queries: [Query.equal('worldId', worldId), Query.limit(100)], total: false });
  return result.rows.map((row) => row.userId);
}

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '需要登录后使用社交功能' }, 401);
    const body = req.bodyJson ?? {};
    const { action } = body;
    const { db, users } = services(req);
    const self = await ensureProfile(db, users, userId);
    if (action === 'ensure_profile') return res.json({ ok: true, profile: self });
    if (action === 'find_profile') {
      const code = String(body.friendCode ?? '').trim().toUpperCase();
      if (code.length < 4) return res.json({ ok: false, message: '好友码格式不正确' }, 400);
      const found = await db.listRows({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, queries: [Query.equal('friendCode', code), Query.limit(1)], total: false });
      return res.json({ ok: true, profile: found.rows[0] ?? null });
    }
    if (action === 'send_friend_request') {
      const targetUserId = String(body.targetUserId ?? '');
      if (!targetUserId || targetUserId === userId) throw new Error('好友目标无效');
      const target = await ensureProfile(db, users, targetUserId);
      const id = friendshipId(userId, targetUserId);
      const key = pairKey(userId, targetUserId);
      try { await db.getRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id }); throw new Error('好友关系或申请已经存在'); }
      catch (lookupError) { if (lookupError?.code !== 404) throw lookupError; }
      const now = new Date().toISOString();
      await db.createRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id, data: { pairKey: key, requesterId: userId, addresseeId: targetUserId, requesterName: self.displayName, addresseeName: target.displayName, status: 'pending', createdAt: now, respondedAt: null }, permissions: readForUsers([userId, targetUserId]) });
      return res.json({ ok: true });
    }
    if (action === 'respond_friend_request' || action === 'remove_friend') {
      const id = String(body.friendshipId ?? '');
      const relation = await db.getRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id });
      if (![relation.requesterId, relation.addresseeId].includes(userId)) throw new Error('无权操作该好友关系');
      if (action === 'respond_friend_request') {
        if (relation.addresseeId !== userId || relation.status !== 'pending') throw new Error('该好友申请无法处理');
        if (body.accept === true) await db.updateRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id, data: { status: 'accepted', respondedAt: new Date().toISOString() } });
        else await db.deleteRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id });
      } else await db.deleteRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id });
      return res.json({ ok: true });
    }
    if (action === 'list_world_messages') {
      const worldId = String(body.worldId ?? '');
      await requireMembership(db, worldId, userId);
      const messages = await db.listRows({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, queries: [Query.equal('worldId', worldId), Query.orderDesc('createdAt'), Query.limit(50)], total: false });
      return res.json({ ok: true, messages: messages.rows });
    }
    if (action === 'send_world_message') {
      const worldId = String(body.worldId ?? '');
      const text = String(body.body ?? '').trim();
      await requireMembership(db, worldId, userId);
      if (!text || text.length > 500) throw new Error('消息需要在 1–500 字之间');
      const recent = await db.listRows({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(1)], total: false });
      if (recent.rows[0] && Date.now() - Date.parse(recent.rows[0].createdAt) < 2500) throw new Error('发送太快，请稍后再试');
      const members = await worldMembers(db, worldId);
      await db.createRow({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, rowId: ID.unique(), data: { worldId, userId, displayName: self.displayName, nationId: body.nationId ? String(body.nationId) : null, body: text, createdAt: new Date().toISOString() }, permissions: readForUsers(members) });
      return res.json({ ok: true });
    }
    return res.json({ ok: false, message: '不支持的社交操作' }, 400);
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : 400;
    return res.json({ ok: false, message: cause instanceof Error ? cause.message : '社交操作失败' }, status);
  }
};
