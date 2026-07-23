import { Channel, ExecutionMethod, Query, type Models } from 'appwrite';
import type { DirectMessage, Friendship, GameProfile, WorldChatMessage } from '../../social/types';
import { APPWRITE_CONFIG } from './config';
import { getAppwriteServices } from './client';

interface ProfileRow extends Models.Row { userId: string; displayName: string; friendCode: string; createdAt: string; lastSeenAt: string }
interface FriendshipRow extends Models.Row { pairKey: string; requesterId: string; addresseeId: string; requesterName: string; addresseeName: string; status: Friendship['status']; createdAt: string; respondedAt: string | null }
interface MessageRow extends Models.Row { worldId: string; userId: string; displayName: string; nationId: string | null; body: string; kind?: 'text' | 'image'; mediaFileId?: string | null; mediaMime?: string | null; createdAt: string }
interface DirectMessageRow extends Models.Row { conversationKey: string; senderId: string; recipientId: string; senderName: string; body: string; kind: 'text' | 'image'; mediaFileId?: string | null; mediaMime?: string | null; createdAt: string }

const profile = (row: ProfileRow): GameProfile => ({ id: row.$id, userId: row.userId, displayName: row.displayName, friendCode: row.friendCode, createdAt: row.createdAt, lastSeenAt: row.lastSeenAt });
const friendship = (row: FriendshipRow): Friendship => ({ id: row.$id, pairKey: row.pairKey, requesterId: row.requesterId, addresseeId: row.addresseeId, requesterName: row.requesterName, addresseeName: row.addresseeName, status: row.status, createdAt: row.createdAt, respondedAt: row.respondedAt });
const message = (row: MessageRow): WorldChatMessage => ({ id: row.$id, worldId: row.worldId, userId: row.userId, displayName: row.displayName, nationId: row.nationId, body: row.body, kind: row.kind ?? 'text', mediaFileId: row.mediaFileId ?? null, mediaMime: row.mediaMime ?? null, createdAt: row.createdAt });
const directMessage = (row: DirectMessageRow): DirectMessage => ({ id: row.$id, conversationKey: row.conversationKey, senderId: row.senderId, recipientId: row.recipientId, senderName: row.senderName, body: row.body, kind: row.kind, mediaFileId: row.mediaFileId ?? null, mediaMime: row.mediaMime ?? null, createdAt: row.createdAt });

interface SocialGatewayResult { ok: boolean; message?: string | MessageRow | DirectMessageRow; profile?: ProfileRow; messages?: (MessageRow | DirectMessageRow)[] }

async function executeSocial(action: string, data: Record<string, unknown> = {}): Promise<SocialGatewayResult> {
  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.socialGatewayFunctionId,
    body: JSON.stringify({ action, ...data }),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
  });
  const result = JSON.parse(execution.responseBody || '{}') as SocialGatewayResult;
  if (!result.ok) throw new Error(typeof result.message === 'string' ? result.message : '社交操作失败');
  return result;
}

export async function ensureGameProfile(): Promise<GameProfile> {
  const result = await executeSocial('ensure_profile');
  if (!result.profile) throw new Error('玩家资料创建失败');
  return profile(result.profile);
}

export async function findProfileByFriendCode(friendCode: string): Promise<GameProfile | null> {
  const result = await executeSocial('find_profile', { friendCode: friendCode.trim().toUpperCase() });
  return result.profile ? profile(result.profile) : null;
}

export async function listFriendships(): Promise<Friendship[]> {
  const result = await getAppwriteServices().tablesDB.listRows<FriendshipRow>({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.friendshipTableId,
    queries: [Query.orderDesc('createdAt'), Query.limit(100)], total: false, ttl: 0,
  });
  return result.rows.map(friendship);
}

export const sendFriendRequest = (targetUserId: string) => executeSocial('send_friend_request', { targetUserId });
export const respondFriendRequest = (friendshipId: string, accept: boolean) => executeSocial('respond_friend_request', { friendshipId, accept });
export const removeFriend = (friendshipId: string) => executeSocial('remove_friend', { friendshipId });

export async function listWorldMessages(worldId: string): Promise<WorldChatMessage[]> {
  const result = await executeSocial('list_world_messages', { worldId });
  return (result.messages ?? []).map((row) => message(row as MessageRow)).reverse();
}

export async function sendWorldMessage(worldId: string, body: string, nationId?: string): Promise<WorldChatMessage> {
  const result = await executeSocial('send_world_message', { worldId, body, nationId });
  if (!result.message || typeof result.message === 'string') throw new Error('消息发送后未返回记录');
  return message(result.message as MessageRow);
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function sendWorldImage(worldId: string, file: File, caption: string, nationId?: string): Promise<WorldChatMessage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('图片大小需要在 2MB 以内');
  const result = await executeSocial('send_world_image', {
    worldId,
    nationId,
    caption: caption.trim().slice(0, 300),
    fileName: file.name.slice(0, 120),
    mime: file.type,
    base64: await fileToBase64(file),
  });
  if (!result.message || typeof result.message === 'string') throw new Error('图片发送后未返回记录');
  return message(result.message as MessageRow);
}

export async function listDirectMessages(friendUserId: string): Promise<DirectMessage[]> {
  const result = await executeSocial('list_direct_messages', { friendUserId });
  return (result.messages ?? []).map((row) => directMessage(row as DirectMessageRow)).reverse();
}

export async function sendDirectMessage(friendUserId: string, body: string): Promise<DirectMessage> {
  const result = await executeSocial('send_direct_message', { friendUserId, body });
  if (!result.message || typeof result.message === 'string') throw new Error('私信发送后未返回记录');
  return directMessage(result.message as DirectMessageRow);
}

export async function sendDirectImage(friendUserId: string, file: File, caption: string): Promise<DirectMessage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('仅支持 JPG、PNG、WebP 或 GIF 图片');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('图片大小需要在 2MB 以内');
  const result = await executeSocial('send_direct_image', { friendUserId, caption: caption.trim().slice(0, 300), fileName: file.name.slice(0, 120), mime: file.type, base64: await fileToBase64(file) });
  if (!result.message || typeof result.message === 'string') throw new Error('私信图片发送后未返回记录');
  return directMessage(result.message as DirectMessageRow);
}

export function worldMessageMediaUrl(fileId: string): string {
  return getAppwriteServices().storage.getFileView({ bucketId: APPWRITE_CONFIG.worldChatMediaBucketId, fileId }).toString();
}

export async function subscribeToWorldChat(worldId: string, onMessage: (entry: WorldChatMessage) => void): Promise<() => Promise<void>> {
  const { realtime } = getAppwriteServices();
  const subscription = await realtime.subscribe(
    Channel.tablesdb(APPWRITE_CONFIG.databaseId).table(APPWRITE_CONFIG.worldMessageTableId).row(),
    (event) => {
      const payload = event.payload as Partial<MessageRow>;
      if (payload.worldId === worldId && payload.$id) onMessage(message(payload as MessageRow));
    },
  );
  return async () => { await subscription.unsubscribe(); };
}

export async function subscribeToDirectMessages(userId: string, onMessage: (entry: DirectMessage) => void): Promise<() => Promise<void>> {
  const subscription = await getAppwriteServices().realtime.subscribe(
    Channel.tablesdb(APPWRITE_CONFIG.databaseId).table(APPWRITE_CONFIG.directMessageTableId).row(),
    (event) => {
      const payload = event.payload as Partial<DirectMessageRow>;
      if (payload.$id && (payload.senderId === userId || payload.recipientId === userId)) onMessage(directMessage(payload as DirectMessageRow));
    },
  );
  return async () => { await subscription.unsubscribe(); };
}
