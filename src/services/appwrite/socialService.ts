import { Channel, ExecutionMethod, Query, type Models } from 'appwrite';
import type { Friendship, GameProfile, WorldChatMessage } from '../../social/types';
import { APPWRITE_CONFIG } from './config';
import { getAppwriteServices } from './client';

interface ProfileRow extends Models.Row { userId: string; displayName: string; friendCode: string; createdAt: string; lastSeenAt: string }
interface FriendshipRow extends Models.Row { pairKey: string; requesterId: string; addresseeId: string; requesterName: string; addresseeName: string; status: Friendship['status']; createdAt: string; respondedAt: string | null }
interface MessageRow extends Models.Row { worldId: string; userId: string; displayName: string; nationId: string | null; body: string; createdAt: string }

const profile = (row: ProfileRow): GameProfile => ({ id: row.$id, userId: row.userId, displayName: row.displayName, friendCode: row.friendCode, createdAt: row.createdAt, lastSeenAt: row.lastSeenAt });
const friendship = (row: FriendshipRow): Friendship => ({ id: row.$id, pairKey: row.pairKey, requesterId: row.requesterId, addresseeId: row.addresseeId, requesterName: row.requesterName, addresseeName: row.addresseeName, status: row.status, createdAt: row.createdAt, respondedAt: row.respondedAt });
const message = (row: MessageRow): WorldChatMessage => ({ id: row.$id, worldId: row.worldId, userId: row.userId, displayName: row.displayName, nationId: row.nationId, body: row.body, createdAt: row.createdAt });

interface SocialGatewayResult { ok: boolean; message?: string; profile?: ProfileRow; messages?: MessageRow[] }

async function executeSocial(action: string, data: Record<string, unknown> = {}): Promise<SocialGatewayResult> {
  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.socialGatewayFunctionId,
    body: JSON.stringify({ action, ...data }),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
  });
  const result = JSON.parse(execution.responseBody || '{}') as SocialGatewayResult;
  if (!result.ok) throw new Error(result.message || '社交操作失败');
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
  return (result.messages ?? []).map(message).reverse();
}

export const sendWorldMessage = (worldId: string, body: string, nationId?: string) => executeSocial('send_world_message', { worldId, body, nationId });

export async function subscribeToWorldChat(worldId: string, onChange: () => void): Promise<() => Promise<void>> {
  const { realtime } = getAppwriteServices();
  const subscription = await realtime.subscribe(
    Channel.tablesdb(APPWRITE_CONFIG.databaseId).table(APPWRITE_CONFIG.worldMessageTableId).row(),
    (event) => {
      const payload = event.payload as Partial<MessageRow>;
      if (payload.worldId === worldId) onChange();
    },
  );
  return async () => { await subscription.unsubscribe(); };
}
