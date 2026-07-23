import { Client, ID, Permission, Query, Role, Storage, TablesDB, Users } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const DATABASE_ID = 'imperium_game';
const PROFILE_TABLE = 'game_profiles';
const FRIENDSHIP_TABLE = 'friendships';
const MEMBERSHIP_TABLE = 'world_memberships';
const MESSAGE_TABLE = 'world_messages';
const DIRECT_MESSAGE_TABLE = 'direct_messages';
const MEDIA_BUCKET = 'world_chat_media';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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
  return { db: new TablesDB(client), users: new Users(client), storage: new Storage(client) };
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

function hasValidImageSignature(buffer, mime) {
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mime === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function safeImageName(fileName, mime, fallback) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime];
  const stem = String(fileName ?? fallback).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || fallback;
  return `${stem}.${extension}`;
}

async function enforceMessageRate(db, worldId, userId) {
  const recent = await db.listRows({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(1)], total: false });
  if (recent.rows[0] && Date.now() - Date.parse(recent.rows[0].createdAt) < 1800) throw new Error('发送太快，请稍后再试');
}

async function requireFriendship(db, userId, friendUserId) {
  if (!friendUserId || friendUserId === userId) throw new Error('好友目标无效');
  const id = friendshipId(userId, friendUserId);
  const relation = await db.getRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id });
  if (relation.status !== 'accepted' || ![relation.requesterId, relation.addresseeId].includes(userId)) throw new Error('只有已接受的好友可以私聊');
  return relation;
}

async function enforceDirectRate(db, key, userId) {
  const recent = await db.listRows({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, queries: [Query.equal('conversationKey', key), Query.equal('senderId', userId), Query.orderDesc('createdAt'), Query.limit(1)], total: false });
  if (recent.rows[0] && Date.now() - Date.parse(recent.rows[0].createdAt) < 1200) throw new Error('发送太快，请稍后再试');
}

async function createDirectMessage(db, userId, friendUserId, senderName, data) {
  return db.createRow({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, rowId: ID.unique(), data: { conversationKey: pairKey(userId, friendUserId), senderId: userId, recipientId: friendUserId, senderName, createdAt: new Date().toISOString(), ...data }, permissions: readForUsers([userId, friendUserId]) });
}

async function createWorldMessage(db, members, data) {
  return db.createRow({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, rowId: ID.unique(), data, permissions: readForUsers(members) });
}

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '需要登录后使用社交功能' }, 401);
    const body = req.bodyJson ?? {};
    const { action } = body;
    const { db, users, storage } = services(req);
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
    if (action === 'list_direct_messages') {
      const friendUserId = String(body.friendUserId ?? '');
      await requireFriendship(db, userId, friendUserId);
      const messages = await db.listRows({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, queries: [Query.equal('conversationKey', pairKey(userId, friendUserId)), Query.orderDesc('createdAt'), Query.limit(50)], total: false });
      return res.json({ ok: true, messages: messages.rows });
    }
    if (action === 'send_direct_message') {
      const friendUserId = String(body.friendUserId ?? '');
      const text = String(body.body ?? '').trim();
      await requireFriendship(db, userId, friendUserId);
      if (!text || text.length > 500) throw new Error('消息需要在 1–500 字之间');
      await enforceDirectRate(db, pairKey(userId, friendUserId), userId);
      const direct = await createDirectMessage(db, userId, friendUserId, self.displayName, { body: text, kind: 'text', mediaFileId: null, mediaMime: null });
      return res.json({ ok: true, message: direct });
    }
    if (action === 'send_world_message') {
      const worldId = String(body.worldId ?? '');
      const text = String(body.body ?? '').trim();
      await requireMembership(db, worldId, userId);
      if (!text || text.length > 500) throw new Error('消息需要在 1–500 字之间');
      await enforceMessageRate(db, worldId, userId);
      const members = await worldMembers(db, worldId);
      const message = await createWorldMessage(db, members, { worldId, userId, displayName: self.displayName, nationId: body.nationId ? String(body.nationId) : null, body: text, kind: 'text', mediaFileId: null, mediaMime: null, createdAt: new Date().toISOString() });
      return res.json({ ok: true, message });
    }
    if (action === 'send_world_image') {
      const worldId = String(body.worldId ?? '');
      const caption = String(body.caption ?? '').trim().slice(0, 300);
      const mime = String(body.mime ?? '').toLowerCase();
      await requireMembership(db, worldId, userId);
      await enforceMessageRate(db, worldId, userId);
      if (!ALLOWED_IMAGE_TYPES.has(mime)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
      const buffer = Buffer.from(String(body.base64 ?? ''), 'base64');
      if (buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error('图片大小需要在 2MB 以内');
      if (!hasValidImageSignature(buffer, mime)) throw new Error('图片内容与文件类型不匹配');
      const members = await worldMembers(db, worldId);
      const fileId = ID.unique();
      const safeName = safeImageName(body.fileName, mime, 'world-image');
      await storage.createFile({ bucketId: MEDIA_BUCKET, fileId, file: InputFile.fromBuffer(buffer, safeName), permissions: readForUsers(members) });
      try {
        const message = await createWorldMessage(db, members, { worldId, userId, displayName: self.displayName, nationId: body.nationId ? String(body.nationId) : null, body: caption || '图片', kind: 'image', mediaFileId: fileId, mediaMime: mime, createdAt: new Date().toISOString() });
        return res.json({ ok: true, message });
      } catch (messageError) {
        await storage.deleteFile({ bucketId: MEDIA_BUCKET, fileId }).catch(() => undefined);
        throw messageError;
      }
    }
    if (action === 'send_direct_image') {
      const friendUserId = String(body.friendUserId ?? '');
      const caption = String(body.caption ?? '').trim().slice(0, 300);
      const mime = String(body.mime ?? '').toLowerCase();
      await requireFriendship(db, userId, friendUserId);
      await enforceDirectRate(db, pairKey(userId, friendUserId), userId);
      if (!ALLOWED_IMAGE_TYPES.has(mime)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
      const buffer = Buffer.from(String(body.base64 ?? ''), 'base64');
      if (buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error('图片大小需要在 2MB 以内');
      if (!hasValidImageSignature(buffer, mime)) throw new Error('图片内容与文件类型不匹配');
      const fileId = ID.unique();
      const safeName = safeImageName(body.fileName, mime, 'direct-image');
      await storage.createFile({ bucketId: MEDIA_BUCKET, fileId, file: InputFile.fromBuffer(buffer, safeName), permissions: readForUsers([userId, friendUserId]) });
      try {
        const direct = await createDirectMessage(db, userId, friendUserId, self.displayName, { body: caption || '图片', kind: 'image', mediaFileId: fileId, mediaMime: mime });
        return res.json({ ok: true, message: direct });
      } catch (messageError) {
        await storage.deleteFile({ bucketId: MEDIA_BUCKET, fileId }).catch(() => undefined);
        throw messageError;
      }
    }
    return res.json({ ok: false, message: '不支持的社交操作' }, 400);
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : 400;
    return res.json({ ok: false, message: cause instanceof Error ? cause.message : '社交操作失败' }, status);
  }
};
