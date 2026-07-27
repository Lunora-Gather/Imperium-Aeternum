import { Client, ID, Permission, Query, Role, Storage, TablesDB, Users } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import {
  assertFriendshipParticipants,
  assertMembershipOwner,
  canViewProfile,
  discoverableMemberIds,
  friendshipPairKey,
  friendshipRowId,
  messageRateRowId,
  verifiedNationIdentity,
} from './policy.js';

const DATABASE_ID = 'imperium_game';
const PROFILE_TABLE = 'game_profiles';
const FRIENDSHIP_TABLE = 'friendships';
const MEMBERSHIP_TABLE = 'world_memberships';
const MESSAGE_TABLE = 'world_messages';
const DIRECT_MESSAGE_TABLE = 'direct_messages';
const MEDIA_BUCKET = 'world_chat_media';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_WORLD_MEMBERS = 100;
const WORLD_MESSAGE_WINDOW_MS = 1800;
const DIRECT_MESSAGE_WINDOW_MS = 1200;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const identifier = (value, max, label) => {
  const result = String(value ?? '').trim();
  if (!result || result.length > max || !/^[a-zA-Z0-9._:-]+$/.test(result)) throw new Error(`${label}无效`);
  return result;
};

function hash(value) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}
const profileId = (userId) => `profile_${hash(userId)}`;
const membershipId = (worldId, userId) => `mem_${hash(worldId)}_${hash(userId)}`;
const readForUsers = (ids) => [...new Set(ids)].slice(0, 100).map((id) => Permission.read(Role.user(id)));
const PROFILE_COLORS = new Set(['gold', 'jade', 'azure', 'crimson', 'violet', 'silver']);

function publicProfile(row) {
  return {
    $id: row.$id,
    userId: row.userId,
    displayName: row.displayName,
    friendCode: row.friendCode,
    title: row.title || '初来乍到的统治者',
    bio: row.bio || '这位统治者还没有写下自己的宣言。',
    avatarColor: row.avatarColor || 'gold',
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
  };
}

function services(req) {
  const client = new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);
  return { db: new TablesDB(client), users: new Users(client), storage: new Storage(client) };
}

async function ensureProfile(db, users, userId) {
  const id = profileId(userId);
  const now = new Date().toISOString();
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id });
    if (current.userId !== userId) throw new Error('玩家资料标识冲突');
    return db.updateRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id, data: { lastSeenAt: now } });
  } catch (error) {
    if (error?.code !== 404) throw error;
    const user = await users.get({ userId });
    const displayName = (user.name || `统治者-${hash(userId).slice(0, 4)}`).slice(0, 64);
    const friendCode = `IA${hash(userId).toUpperCase()}`.slice(0, 10);
    try {
      return await db.createRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id, data: { userId, displayName, friendCode, createdAt: now, lastSeenAt: now }, permissions: readForUsers([userId]) });
    } catch (createError) {
      if (createError?.code !== 409) throw createError;
      const current = await db.getRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: id });
      if (current.userId !== userId) throw new Error('玩家资料标识冲突');
      return current;
    }
  }
}

async function requireMembership(db, worldId, userId) {
  try {
    const membership = await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId: membershipId(worldId, userId) });
    return assertMembershipOwner(membership, worldId, userId);
  }
  catch (error) { if (error?.code === 404) throw new Error('只有该版图成员可以使用聊天室'); throw error; }
}

async function requireNationIdentity(db, worldId, userId, requestedNationId) {
  if (!requestedNationId) return null;
  const result = await db.listRows({ databaseId: DATABASE_ID, tableId: 'nation_controls', queries: [Query.equal('worldId', worldId), Query.equal('nationId', requestedNationId), Query.limit(1)], total: false });
  return verifiedNationIdentity(result.rows[0], userId, requestedNationId);
}

async function worldMembers(db, worldId) {
  const result = await db.listRows({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, queries: [Query.equal('worldId', worldId), Query.limit(MAX_WORLD_MEMBERS)], total: true });
  if (Number(result.total ?? result.rows.length) > MAX_WORLD_MEMBERS) throw new Error(`当前版图超过 ${MAX_WORLD_MEMBERS} 人，聊天权限需要迁移后才能继续发送`);
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

function decodeImage(base64) {
  const encoded = String(base64 ?? '');
  if (!encoded || encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 4) throw new Error('图片大小需要在 2MB 以内');
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error('图片大小需要在 2MB 以内');
  return buffer;
}

async function enforceMessageRate(db, worldId, userId) {
  const recent = await db.listRows({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(1)], total: false });
  if (recent.rows[0] && Date.now() - Date.parse(recent.rows[0].createdAt) < 1800) throw new Error('发送太快，请稍后再试');
}

async function requireFriendship(db, userId, friendUserId) {
  if (!friendUserId || friendUserId === userId) throw new Error('好友目标无效');
  const result = await db.listRows({
    databaseId: DATABASE_ID,
    tableId: FRIENDSHIP_TABLE,
    queries: [Query.equal('pairKey', friendshipPairKey(userId, friendUserId)), Query.limit(1)],
    total: false,
  });
  const relation = result.rows[0];
  if (!relation) throw new Error('好友关系不存在');
  return assertFriendshipParticipants(relation, userId, friendUserId);
}

async function relationshipBetween(db, userId, targetUserId) {
  const result = await db.listRows({
    databaseId: DATABASE_ID,
    tableId: FRIENDSHIP_TABLE,
    queries: [Query.equal('pairKey', friendshipPairKey(userId, targetUserId)), Query.limit(1)],
    total: false,
  });
  return result.rows[0] ?? null;
}

async function membershipWorldIds(db, userId) {
  const worldIds = new Set();
  let cursor;
  do {
    const queries = [Query.equal('userId', userId), Query.orderAsc('$id'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: MEMBERSHIP_TABLE,
      queries,
      total: false,
    });
    for (const row of page.rows) worldIds.add(row.worldId);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && worldIds.size < 1000);
  return worldIds;
}

async function sharesWorld(db, userId, targetUserId) {
  const [left, right] = await Promise.all([
    membershipWorldIds(db, userId),
    membershipWorldIds(db, targetUserId),
  ]);
  return [...left].some((worldId) => right.has(worldId));
}

async function requireProfileVisibility(db, userId, targetUserId) {
  if (userId === targetUserId) return;
  const friendship = await relationshipBetween(db, userId, targetUserId);
  if (canViewProfile(userId, targetUserId, friendship, false)) return;
  const visible = canViewProfile(userId, targetUserId, friendship, await sharesWorld(db, userId, targetUserId));
  if (!visible) throw new Error('只能查看自己、好友或同一版图成员的名片');
}

async function enforceDirectRate(db, key, userId) {
  const recent = await db.listRows({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, queries: [Query.equal('conversationKey', key), Query.equal('senderId', userId), Query.orderDesc('createdAt'), Query.limit(1)], total: false });
  if (recent.rows[0] && Date.now() - Date.parse(recent.rows[0].createdAt) < 1200) throw new Error('发送太快，请稍后再试');
}

async function createDirectMessage(db, userId, friendUserId, senderName, data) {
  const key = friendshipPairKey(userId, friendUserId);
  try {
    return await db.createRow({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, rowId: messageRateRowId('direct', key, userId, Date.now(), DIRECT_MESSAGE_WINDOW_MS), data: { conversationKey: key, senderId: userId, recipientId: friendUserId, senderName, createdAt: new Date().toISOString(), ...data }, permissions: readForUsers([userId, friendUserId]) });
  } catch (error) {
    if (error?.code === 409) throw new Error('发送太快，请稍后再试');
    throw error;
  }
}

async function createWorldMessage(db, members, data) {
  try {
    return await db.createRow({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, rowId: messageRateRowId('world', data.worldId, data.userId, Date.now(), WORLD_MESSAGE_WINDOW_MS), data, permissions: readForUsers(members) });
  } catch (error) {
    if (error?.code === 409) throw new Error('发送太快，请稍后再试');
    throw error;
  }
}

export default async ({ req, res, error }) => {
  try {
    if (req.method !== 'POST') return res.json({ ok: false, message: '仅支持 POST 请求' }, 405);
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '需要登录后使用社交功能' }, 401);
    const body = req.bodyJson ?? {};
    const { action } = body;
    const { db, users, storage } = services(req);
    const self = await ensureProfile(db, users, userId);
    if (action === 'ensure_profile') return res.json({ ok: true, profile: publicProfile(self) });
    if (action === 'update_profile') {
      const displayName = String(body.displayName ?? '').trim();
      const title = String(body.title ?? '').trim();
      const bio = String(body.bio ?? '').trim();
      const avatarColor = String(body.avatarColor ?? 'gold').trim();
      if (displayName.length < 2 || displayName.length > 32) throw new Error('显示名称需要在 2–32 字之间');
      if (title.length > 48) throw new Error('称号不能超过 48 字');
      if (bio.length > 240) throw new Error('个人宣言不能超过 240 字');
      if (!PROFILE_COLORS.has(avatarColor)) throw new Error('头像主题无效');
      const updated = await db.updateRow({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, rowId: self.$id, data: { displayName, title, bio, avatarColor, lastSeenAt: new Date().toISOString() } });
      return res.json({ ok: true, profile: publicProfile(updated) });
    }
    if (action === 'discover_profiles') {
      // Keep the previous frontend safe during a rolling deployment without
      // reopening the removed global profile directory.
      if (!body.worldId) return res.json({ ok: true, profiles: [] });
      const worldId = identifier(body.worldId, 36, '版图标识');
      await requireMembership(db, worldId, userId);
      const memberships = await db.listRows({
        databaseId: DATABASE_ID,
        tableId: MEMBERSHIP_TABLE,
        queries: [Query.equal('worldId', worldId), Query.limit(MAX_WORLD_MEMBERS)],
        total: true,
      });
      if (Number(memberships.total ?? memberships.rows.length) > MAX_WORLD_MEMBERS) throw new Error(`当前版图超过 ${MAX_WORLD_MEMBERS} 人，玩家发现需要分页后才能继续使用`);
      const memberIds = discoverableMemberIds(memberships.rows, userId, MAX_WORLD_MEMBERS);
      if (memberIds.length === 0) return res.json({ ok: true, profiles: [] });
      const result = await db.listRows({
        databaseId: DATABASE_ID,
        tableId: PROFILE_TABLE,
        queries: [Query.equal('userId', memberIds), Query.limit(MAX_WORLD_MEMBERS)],
        total: false,
      });
      const profiles = result.rows
        .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)))
        .map(publicProfile);
      return res.json({ ok: true, profiles });
    }
    if (action === 'get_profile') {
      const targetUserId = identifier(body.targetUserId, 36, '玩家目标');
      await requireProfileVisibility(db, userId, targetUserId);
      const found = await db.listRows({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, queries: [Query.equal('userId', targetUserId), Query.limit(1)], total: false });
      return res.json({ ok: true, profile: found.rows[0] ? publicProfile(found.rows[0]) : null });
    }
    if (action === 'find_profile') {
      const code = String(body.friendCode ?? '').trim().toUpperCase();
      if (!/^IA[A-F0-9]{8}$/.test(code)) return res.json({ ok: false, message: '好友码格式不正确' }, 400);
      const found = await db.listRows({ databaseId: DATABASE_ID, tableId: PROFILE_TABLE, queries: [Query.equal('friendCode', code), Query.limit(1)], total: false });
      return res.json({ ok: true, profile: found.rows[0] ? publicProfile(found.rows[0]) : null });
    }
    if (action === 'send_friend_request') {
      const targetUserId = identifier(body.targetUserId, 36, '好友目标');
      if (!targetUserId || targetUserId === userId) throw new Error('好友目标无效');
      const target = await ensureProfile(db, users, targetUserId);
      const suppliedCode = String(body.friendCode ?? '').trim().toUpperCase();
      const authorizedByCode = suppliedCode && suppliedCode === target.friendCode;
      if (!authorizedByCode && !(await sharesWorld(db, userId, targetUserId))) {
        throw new Error('只能通过好友码或共同版图发送好友申请');
      }
      const id = friendshipRowId(userId, targetUserId);
      const key = friendshipPairKey(userId, targetUserId);
      const existing = await db.listRows({
        databaseId: DATABASE_ID,
        tableId: FRIENDSHIP_TABLE,
        queries: [Query.equal('pairKey', key), Query.limit(1)],
        total: false,
      });
      if (existing.rows[0]) throw new Error('好友关系或申请已经存在');
      const now = new Date().toISOString();
      await db.createRow({ databaseId: DATABASE_ID, tableId: FRIENDSHIP_TABLE, rowId: id, data: { pairKey: key, requesterId: userId, addresseeId: targetUserId, requesterName: self.displayName, addresseeName: target.displayName, status: 'pending', createdAt: now, respondedAt: null }, permissions: readForUsers([userId, targetUserId]) });
      return res.json({ ok: true });
    }
    if (action === 'respond_friend_request' || action === 'remove_friend') {
      const id = identifier(body.friendshipId, 36, '好友关系');
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
      const worldId = identifier(body.worldId, 36, '版图标识');
      await requireMembership(db, worldId, userId);
      const messages = await db.listRows({ databaseId: DATABASE_ID, tableId: MESSAGE_TABLE, queries: [Query.equal('worldId', worldId), Query.orderDesc('createdAt'), Query.limit(50)], total: false });
      return res.json({ ok: true, messages: messages.rows });
    }
    if (action === 'list_direct_messages') {
      const friendUserId = identifier(body.friendUserId, 36, '好友目标');
      await requireFriendship(db, userId, friendUserId);
      const messages = await db.listRows({ databaseId: DATABASE_ID, tableId: DIRECT_MESSAGE_TABLE, queries: [Query.equal('conversationKey', friendshipPairKey(userId, friendUserId)), Query.orderDesc('createdAt'), Query.limit(50)], total: false });
      return res.json({ ok: true, messages: messages.rows });
    }
    if (action === 'list_direct_inbox') {
      const messages = await db.listRows({
        databaseId: DATABASE_ID,
        tableId: DIRECT_MESSAGE_TABLE,
        queries: [Query.equal('recipientId', userId), Query.orderDesc('createdAt'), Query.limit(100)],
        total: false,
      });
      return res.json({ ok: true, messages: messages.rows });
    }
    if (action === 'send_direct_message') {
      const friendUserId = identifier(body.friendUserId, 36, '好友目标');
      const text = String(body.body ?? '').trim();
      await requireFriendship(db, userId, friendUserId);
      if (!text || text.length > 500) throw new Error('消息需要在 1–500 字之间');
      await enforceDirectRate(db, friendshipPairKey(userId, friendUserId), userId);
      const direct = await createDirectMessage(db, userId, friendUserId, self.displayName, { body: text, kind: 'text', mediaFileId: null, mediaMime: null });
      return res.json({ ok: true, message: direct });
    }
    if (action === 'send_world_message') {
      const worldId = identifier(body.worldId, 36, '版图标识');
      const text = String(body.body ?? '').trim();
      await requireMembership(db, worldId, userId);
      const nationId = await requireNationIdentity(db, worldId, userId, body.nationId ? String(body.nationId) : null);
      if (!text || text.length > 500) throw new Error('消息需要在 1–500 字之间');
      await enforceMessageRate(db, worldId, userId);
      const members = await worldMembers(db, worldId);
      const message = await createWorldMessage(db, members, { worldId, userId, displayName: self.displayName, nationId, body: text, kind: 'text', mediaFileId: null, mediaMime: null, createdAt: new Date().toISOString() });
      return res.json({ ok: true, message });
    }
    if (action === 'send_world_image') {
      const worldId = identifier(body.worldId, 36, '版图标识');
      const caption = String(body.caption ?? '').trim().slice(0, 300);
      const mime = String(body.mime ?? '').toLowerCase();
      await requireMembership(db, worldId, userId);
      const nationId = await requireNationIdentity(db, worldId, userId, body.nationId ? String(body.nationId) : null);
      await enforceMessageRate(db, worldId, userId);
      if (!ALLOWED_IMAGE_TYPES.has(mime)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
      const buffer = decodeImage(body.base64);
      if (!hasValidImageSignature(buffer, mime)) throw new Error('图片内容与文件类型不匹配');
      const members = await worldMembers(db, worldId);
      const fileId = ID.unique();
      const safeName = safeImageName(body.fileName, mime, 'world-image');
      await storage.createFile({ bucketId: MEDIA_BUCKET, fileId, file: InputFile.fromBuffer(buffer, safeName), permissions: readForUsers(members) });
      try {
        const message = await createWorldMessage(db, members, { worldId, userId, displayName: self.displayName, nationId, body: caption || '图片', kind: 'image', mediaFileId: fileId, mediaMime: mime, createdAt: new Date().toISOString() });
        return res.json({ ok: true, message });
      } catch (messageError) {
        await storage.deleteFile({ bucketId: MEDIA_BUCKET, fileId }).catch(() => undefined);
        throw messageError;
      }
    }
    if (action === 'send_direct_image') {
      const friendUserId = identifier(body.friendUserId, 36, '好友目标');
      const caption = String(body.caption ?? '').trim().slice(0, 300);
      const mime = String(body.mime ?? '').toLowerCase();
      await requireFriendship(db, userId, friendUserId);
      await enforceDirectRate(db, friendshipPairKey(userId, friendUserId), userId);
      if (!ALLOWED_IMAGE_TYPES.has(mime)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
      const buffer = decodeImage(body.base64);
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
    const appwriteFailure = typeof cause?.code === 'number' && ![404, 409].includes(cause.code);
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : appwriteFailure ? 503 : 400;
    const message = appwriteFailure ? '社交服务暂不可用，请稍后重试' : cause instanceof Error ? cause.message : '社交操作失败';
    return res.json({ ok: false, message }, status);
  }
};
