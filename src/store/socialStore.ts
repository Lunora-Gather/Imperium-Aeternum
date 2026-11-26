import { create, type StoreApi } from 'zustand';
import { useAccountStore } from './accountStore';
import type { DirectMessage, Friendship, GameProfile, WorldChatMessage } from '../social/types';
import {
  discoverProfiles,
  ensureGameProfile,
  findProfileByFriendCode,
  getPublicProfile,
  listDirectInbox,
  listFriendships,
  listDirectMessages,
  listWorldMessages,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  sendDirectImage,
  sendDirectMessage,
  sendWorldImage,
  sendWorldMessage,
  subscribeToDirectMessages,
  subscribeToFriendships,
  updateGameProfile,
} from '../services/appwrite/socialService';

interface SocialStore {
  profile: GameProfile | null;
  discoveredProfiles: GameProfile[];
  discoveredWorldId: string | null;
  profileCache: Record<string, GameProfile>;
  friendships: Friendship[];
  messages: Record<string, WorldChatMessage[]>;
  directMessages: Record<string, DirectMessage[]>;
  unreadDirect: Record<string, number>;
  activeConversation: string | null;
  loading: boolean;
  sending: Record<string, boolean>;
  message: string | null;
  reset: () => void;
  initialize: () => Promise<void>;
  refreshFriendships: () => Promise<void>;
  discover: (worldId: string | null) => Promise<void>;
  loadProfile: (userId: string) => Promise<GameProfile | null>;
  updateProfile: (data: Pick<GameProfile, 'displayName' | 'title' | 'bio' | 'avatarColor'>) => Promise<boolean>;
  addByCode: (friendCode: string) => Promise<boolean>;
  addPlayer: (profile: GameProfile) => Promise<boolean>;
  respond: (friendshipId: string, accept: boolean) => Promise<void>;
  remove: (friendshipId: string) => Promise<void>;
  refreshMessages: (worldId: string) => Promise<void>;
  sendMessage: (worldId: string, body: string, nationId?: string) => Promise<boolean>;
  sendImage: (worldId: string, file: File, caption: string, nationId?: string) => Promise<boolean>;
  receiveMessage: (message: WorldChatMessage) => void;
  refreshDirectMessages: (friendUserId: string) => Promise<void>;
  sendDirect: (friendUserId: string, body: string) => Promise<boolean>;
  sendDirectImage: (friendUserId: string, file: File, caption: string) => Promise<boolean>;
  receiveDirectMessage: (message: DirectMessage) => void;
  markConversationRead: (friendUserId: string | null) => void;
}

function compareMessages(a: { id: string; createdAt: string }, b: { id: string; createdAt: string }): number {
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

export function mergeChatMessages<T extends { id: string; createdAt: string }>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const entry of incoming) byId.set(entry.id, entry);
  return [...byId.values()].sort(compareMessages).slice(-50);
}

export function reconcileSentMessage<T extends { id: string; createdAt: string }>(current: T[], localId: string, sent: T): T[] {
  return mergeChatMessages(current.filter((entry) => entry.id !== localId), [sent]);
}

export function applyIncomingUnread(current: Record<string, number>, friendUserId: string, activeConversation: string | null, incoming: boolean): Record<string, number> {
  if (!incoming || activeConversation === friendUserId) return current;
  return { ...current, [friendUserId]: (current[friendUserId] ?? 0) + 1 };
}

export function acceptedFriendUserIds(friendships: Friendship[], selfId?: string): Set<string> {
  if (!selfId) return new Set();
  return new Set(friendships
    .filter((entry) => entry.status === 'accepted' && (entry.requesterId === selfId || entry.addresseeId === selfId))
    .map((entry) => entry.requesterId === selfId ? entry.addresseeId : entry.requesterId)
    .filter((friendId) => friendId && friendId !== selfId));
}

export function totalSocialUnread(store: { friendships: Friendship[]; unreadDirect: Record<string, number> }, userId?: string) {
  const requests = store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === userId).length;
  const acceptedIds = acceptedFriendUserIds(store.friendships, userId);
  return requests + Object.entries(store.unreadDirect).reduce((sum, [friendId, value]) => sum + (acceptedIds.has(friendId) ? value : 0), 0);
}

export function reconcileFriendConversationState(
  friendships: Friendship[],
  selfId: string | undefined,
  directMessages: Record<string, DirectMessage[]>,
  unreadDirect: Record<string, number>,
  activeConversation: string | null,
): Pick<SocialStore, 'directMessages' | 'unreadDirect' | 'activeConversation'> {
  const acceptedIds = acceptedFriendUserIds(friendships, selfId);
  return {
    directMessages: Object.fromEntries(Object.entries(directMessages).filter(([friendId]) => acceptedIds.has(friendId))),
    unreadDirect: Object.fromEntries(Object.entries(unreadDirect).filter(([friendId]) => acceptedIds.has(friendId))),
    activeConversation: activeConversation && acceptedIds.has(activeConversation) ? activeConversation : null,
  };
}

export function latestUnreadDirectMessage(
  directMessages: Record<string, DirectMessage[]>,
  unreadDirect: Record<string, number>,
  selfId: string,
): DirectMessage | undefined {
  return Object.entries(directMessages)
    .filter(([friendId]) => (unreadDirect[friendId] ?? 0) > 0)
    .flatMap(([, entries]) => entries)
    .filter((entry) => entry.senderId !== selfId)
    .sort((a, b) => compareMessages(b, a))[0];
}

type DirectReadReceipts = Record<string, string>;

const readReceiptKey = (userId: string) => `imperium-aeternum:direct-read:v1:${userId}`;
export const directMessageCursor = (entry: Pick<DirectMessage, 'id' | 'createdAt'>) => `${entry.createdAt}|${entry.id}`;

function loadReadReceipts(userId: string): DirectReadReceipts {
  if (typeof localStorage === 'undefined') return {};
  try {
    const value = JSON.parse(localStorage.getItem(readReceiptKey(userId)) ?? '{}');
    return value && typeof value === 'object' ? value as DirectReadReceipts : {};
  } catch { return {}; }
}

function saveReadReceipt(userId: string, friendUserId: string, cursor: string): void {
  if (typeof localStorage === 'undefined' || !cursor) return;
  const receipts = loadReadReceipts(userId);
  if ((receipts[friendUserId] ?? '').localeCompare(cursor) >= 0) return;
  try { localStorage.setItem(readReceiptKey(userId), JSON.stringify({ ...receipts, [friendUserId]: cursor })); }
  catch { /* Browsers may disable storage; realtime unread still works for this session. */ }
}

export function recoverDirectInbox(
  inbox: DirectMessage[],
  selfId: string,
  acceptedFriendIds: Set<string>,
  receipts: DirectReadReceipts,
): { messages: Record<string, DirectMessage[]>; unread: Record<string, number> } {
  const messages: Record<string, DirectMessage[]> = {};
  const unread: Record<string, number> = {};
  for (const entry of inbox) {
    if (entry.recipientId !== selfId || !acceptedFriendIds.has(entry.senderId)) continue;
    messages[entry.senderId] = mergeChatMessages(messages[entry.senderId] ?? [], [entry]);
    if (directMessageCursor(entry).localeCompare(receipts[entry.senderId] ?? '') > 0) unread[entry.senderId] = (unread[entry.senderId] ?? 0) + 1;
  }
  return { messages, unread };
}

function persistLatestConversationRead(selfId: string | undefined, friendUserId: string, entries: DirectMessage[]): void {
  if (!selfId) return;
  const incoming = entries.filter((entry) => entry.senderId === friendUserId && entry.recipientId === selfId).sort(compareMessages);
  const latestIncoming = incoming[incoming.length - 1];
  if (latestIncoming) saveReadReceipt(selfId, friendUserId, directMessageCursor(latestIncoming));
}

const localMessageId = () => `local:${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;
const withoutMessage = <T extends { id: string }>(messages: T[], id: string) => messages.filter((entry) => entry.id !== id);

type SocialPatch = Partial<SocialStore> | ((state: SocialStore) => Partial<SocialStore>);
function socialSession(write: StoreApi<SocialStore>['setState'], get: () => SocialStore): SocialStore {
  const active = () => get().reset === reset;
  const reset = () => { if (active()) write(socialSession(write, get)); };
  const set = (patch: SocialPatch) => { if (active()) write(patch); };
  const available = () => active() && globalThis.navigator?.onLine !== false;
  let friendshipRead = 0;
  let discoveryRead = 0;
  const isFriend = (id: string) => active() && acceptedFriendUserIds(get().friendships, useAccountStore.getState().user?.$id).has(id);
  const applyFriends = (friendships: Friendship[]) => set(state => ({
    friendships, ...reconcileFriendConversationState(friendships, useAccountStore.getState().user?.$id,
      state.directMessages, state.unreadDirect, state.activeConversation),
  }));
  async function syncFriends() {
    if (!active()) return;
    const request = ++friendshipRead;
    const friendships = await listFriendships();
    if (request === friendshipRead) applyFriends(friendships);
  }

  return {
    profile: null, discoveredProfiles: [], discoveredWorldId: null, profileCache: {}, friendships: [], messages: {}, directMessages: {}, unreadDirect: {}, activeConversation: null, loading: false, sending: {}, message: null,
    reset,
    initialize: async () => {
      if (!available()) return;
      set({ loading: true, message: null });
      try {
        const previousProfile = get().profile;
        const [loadedProfile] = await Promise.all([ensureGameProfile(), syncFriends()]);
        if (!available()) return;
        const inbox = await listDirectInbox();
        if (!active()) return;
        const current = get();
        const profile = current.profile && current.profile !== previousProfile ? current.profile : loadedProfile;
        const friendships = current.friendships;
        const acceptedFriendIds = acceptedFriendUserIds(friendships, profile.userId);
        const recovered = recoverDirectInbox(inbox, profile.userId, acceptedFriendIds, loadReadReceipts(profile.userId));
        set((state) => {
          const retained = reconcileFriendConversationState(friendships, profile.userId, state.directMessages, state.unreadDirect, state.activeConversation);
          const directMessages = Object.fromEntries([...acceptedFriendIds].map(friendId => [
            friendId, mergeChatMessages(retained.directMessages[friendId] ?? [], recovered.messages[friendId] ?? []),
          ]));
          if (retained.activeConversation) {
            persistLatestConversationRead(profile.userId, retained.activeConversation, directMessages[retained.activeConversation]);
          }
          return {
            profile,
            friendships,
            profileCache: { ...state.profileCache, [profile.userId]: profile },
            directMessages,
            unreadDirect: Object.fromEntries([...acceptedFriendIds]
              .map<[string, number]>((friendId) => [friendId, Math.max(retained.unreadDirect[friendId] ?? 0, recovered.unread[friendId] ?? 0)])
              .filter(([id, count]) => id !== retained.activeConversation && count > 0)),
            activeConversation: retained.activeConversation,
          };
        });
      } catch (error) { set({ message: error instanceof Error ? error.message : '社交资料加载失败' }); }
      finally { set({ loading: false }); }
    },
    refreshFriendships: async () => {
      try { await syncFriends(); }
      catch (error) { set({ message: error instanceof Error ? error.message : '好友列表刷新失败' }); }
    },
    discover: async (worldId) => {
      const request = ++discoveryRead;
      if (!worldId) {
        set({ discoveredProfiles: [], discoveredWorldId: null, loading: false, message: null });
        return;
      }
      set(state => ({
        discoveredProfiles: state.discoveredWorldId === worldId ? state.discoveredProfiles : [],
        discoveredWorldId: worldId, loading: true, message: null,
      }));
      try {
        const discoveredProfiles = await discoverProfiles(worldId);
        if (request !== discoveryRead) return;
        set((state) => ({ discoveredProfiles, discoveredWorldId: worldId, profileCache: { ...state.profileCache, ...Object.fromEntries(discoveredProfiles.map((entry) => [entry.userId, entry])) } }));
      } catch (error) { if (request === discoveryRead) set({ message: error instanceof Error ? error.message : '玩家发现失败' }); }
      finally { if (request === discoveryRead) set({ loading: false }); }
    },
    loadProfile: async (userId) => {
      if (!active()) return null;
      const cached = get().profileCache[userId];
      if (cached) return cached;
      try {
        const found = await getPublicProfile(userId);
        if (found) set((state) => ({ profileCache: { ...state.profileCache, [found.userId]: found } }));
        return active() ? found : null;
      } catch (error) { set({ message: error instanceof Error ? error.message : '玩家名片加载失败' }); return null; }
    },
    updateProfile: async (data) => {
      set({ loading: true, message: null });
      try {
        const profile = await updateGameProfile(data);
        set((state) => ({ profile, profileCache: { ...state.profileCache, [profile.userId]: profile }, message: '个人名片已更新' }));
        return true;
      } catch (error) { set({ message: error instanceof Error ? error.message : '个人名片更新失败' }); return false; }
      finally { set({ loading: false }); }
    },
    addByCode: async (friendCode) => {
      set({ loading: true, message: null });
      try {
        const target = await findProfileByFriendCode(friendCode);
        if (!active()) return false;
        if (!target) throw new Error('没有找到该好友码');
        if (target.userId === get().profile?.userId) throw new Error('不能添加自己为好友');
        await sendFriendRequest(target.userId, friendCode.trim().toUpperCase());
        await syncFriends();
        set({ message: `已向 ${target.displayName} 发送好友申请` });
        return true;
      } catch (error) { set({ message: error instanceof Error ? error.message : '好友申请失败' }); return false; }
      finally { set({ loading: false }); }
    },
    addPlayer: async (target) => {
      set({ loading: true, message: null });
      try {
        if (target.userId === get().profile?.userId) throw new Error('不能添加自己为好友');
        await sendFriendRequest(target.userId);
        await syncFriends();
        set({ message: `已向 ${target.displayName} 发送好友申请` });
        return true;
      } catch (error) { set({ message: error instanceof Error ? error.message : '好友申请失败' }); return false; }
      finally { set({ loading: false }); }
    },
    respond: async (friendshipId, accept) => {
      try {
        await respondFriendRequest(friendshipId, accept);
        await syncFriends();
        set({ message: accept ? '已成为好友' : '已拒绝好友申请' });
      }
      catch (error) { set({ message: error instanceof Error ? error.message : '好友申请处理失败' }); }
    },
    remove: async (friendshipId) => {
      try {
        await removeFriend(friendshipId);
        if (!active()) return;
        applyFriends(get().friendships.filter(friend => friend.id !== friendshipId));
        await syncFriends();
        set({ message: '已移除好友' });
      }
      catch (error) { set({ message: error instanceof Error ? error.message : '移除好友失败' }); }
    },
    refreshMessages: async (worldId) => {
      try {
        const messages = await listWorldMessages(worldId);
        set((state) => ({ messages: { ...state.messages, [worldId]: mergeChatMessages(state.messages[worldId] ?? [], messages) }, message: null }));
      } catch (error) { set({ message: error instanceof Error ? error.message : '版图聊天加载失败' }); }
    },
    sendMessage: async (worldId, body, nationId) => {
      const text = body.trim();
      if (!text) return false;
      const sendingKey = `world:${worldId}`;
      if (!active() || get().sending[sendingKey]) return false;
      const localId = localMessageId();
      const profile = get().profile;
      const pending: WorldChatMessage = { id: localId, worldId, userId: profile?.userId ?? '', displayName: profile?.displayName ?? '我', nationId: nationId ?? null, body: text, kind: 'text', mediaFileId: null, mediaMime: null, createdAt: new Date().toISOString(), delivery: 'pending' };
      set((state) => ({ messages: { ...state.messages, [worldId]: mergeChatMessages(state.messages[worldId] ?? [], [pending]) }, sending: { ...state.sending, [sendingKey]: true }, message: null }));
      try {
        const entry = await sendWorldMessage(worldId, text, nationId);
        set((state) => ({ messages: { ...state.messages, [worldId]: reconcileSentMessage(state.messages[worldId] ?? [], localId, entry) } }));
        return true;
      }
      catch (error) { set((state) => ({ messages: { ...state.messages, [worldId]: withoutMessage(state.messages[worldId] ?? [], localId) }, message: error instanceof Error ? error.message : '消息发送失败' })); return false; }
      finally { set((state) => { const sending = { ...state.sending }; delete sending[sendingKey]; return { sending }; }); }
    },
    sendImage: async (worldId, file, caption, nationId) => {
      const sendingKey = `world:${worldId}`;
      if (!active() || get().sending[sendingKey]) return false;
      set((state) => ({ sending: { ...state.sending, [sendingKey]: true }, message: null }));
      try {
        const entry = await sendWorldImage(worldId, file, caption, nationId);
        set((state) => ({ messages: { ...state.messages, [worldId]: mergeChatMessages(state.messages[worldId] ?? [], [entry]) } }));
        return true;
      } catch (error) { set({ message: error instanceof Error ? error.message : '图片发送失败' }); return false; }
      finally { set((state) => { const sending = { ...state.sending }; delete sending[sendingKey]; return { sending }; }); }
    },
    receiveMessage: (entry) => set((state) => ({ messages: { ...state.messages, [entry.worldId]: mergeChatMessages(state.messages[entry.worldId] ?? [], [entry]) } })),
    refreshDirectMessages: async (friendUserId) => {
      if (!isFriend(friendUserId)) return;
      try {
        const entries = await listDirectMessages(friendUserId);
        if (!isFriend(friendUserId)) return;
        const merged = mergeChatMessages(get().directMessages[friendUserId] ?? [], entries);
        if (get().activeConversation === friendUserId) persistLatestConversationRead(get().profile?.userId, friendUserId, merged);
        set((state) => ({ directMessages: { ...state.directMessages, [friendUserId]: merged }, unreadDirect: state.activeConversation === friendUserId ? { ...state.unreadDirect, [friendUserId]: 0 } : state.unreadDirect, message: null }));
      }
      catch (error) { if (isFriend(friendUserId)) set({ message: error instanceof Error ? error.message : '好友对话加载失败' }); }
    },
    sendDirect: async (friendUserId, body) => {
      const text = body.trim(); if (!text) return false;
      const sendingKey = `direct:${friendUserId}`;
      if (!isFriend(friendUserId) || get().sending[sendingKey]) return false;
      const localId = localMessageId();
      const profile = get().profile;
      const pending: DirectMessage = { id: localId, conversationKey: '', senderId: profile?.userId ?? '', recipientId: friendUserId, senderName: profile?.displayName ?? '我', body: text, kind: 'text', mediaFileId: null, mediaMime: null, createdAt: new Date().toISOString(), delivery: 'pending' };
      set((state) => ({ directMessages: { ...state.directMessages, [friendUserId]: mergeChatMessages(state.directMessages[friendUserId] ?? [], [pending]) }, sending: { ...state.sending, [sendingKey]: true }, message: null }));
      try { const entry = await sendDirectMessage(friendUserId, text); if (!isFriend(friendUserId)) return false; set((state) => ({ directMessages: { ...state.directMessages, [friendUserId]: reconcileSentMessage(state.directMessages[friendUserId] ?? [], localId, entry) } })); return true; }
      catch (error) { if (isFriend(friendUserId)) set((state) => ({ directMessages: { ...state.directMessages, [friendUserId]: withoutMessage(state.directMessages[friendUserId] ?? [], localId) }, message: error instanceof Error ? error.message : '私信发送失败' })); return false; }
      finally { set((state) => { const sending = { ...state.sending }; delete sending[sendingKey]; return { sending }; }); }
    },
    sendDirectImage: async (friendUserId, file, caption) => {
      const sendingKey = `direct:${friendUserId}`;
      if (!isFriend(friendUserId) || get().sending[sendingKey]) return false;
      set((state) => ({ sending: { ...state.sending, [sendingKey]: true }, message: null }));
      try { const entry = await sendDirectImage(friendUserId, file, caption); if (!isFriend(friendUserId)) return false; set((state) => ({ directMessages: { ...state.directMessages, [friendUserId]: mergeChatMessages(state.directMessages[friendUserId] ?? [], [entry]) } })); return true; }
      catch (error) { if (isFriend(friendUserId)) set({ message: error instanceof Error ? error.message : '私信图片发送失败' }); return false; }
      finally { set((state) => { const sending = { ...state.sending }; delete sending[sendingKey]; return { sending }; }); }
    },
    receiveDirectMessage: (entry) => {
      const selfId = get().profile?.userId;
      if (!active() || (entry.senderId !== selfId && entry.recipientId !== selfId)) return;
      const friendUserId = entry.senderId === selfId ? entry.recipientId : entry.senderId;
      if (!acceptedFriendUserIds(get().friendships, selfId).has(friendUserId)) return;
      const existing = (get().directMessages[friendUserId] ?? []).some((message) => message.id === entry.id);
      const incoming = entry.senderId !== selfId && !existing;
      if (incoming && get().activeConversation === friendUserId) saveReadReceipt(selfId ?? '', friendUserId, directMessageCursor(entry));
      set((state) => ({
        directMessages: { ...state.directMessages, [friendUserId]: mergeChatMessages(state.directMessages[friendUserId] ?? [], [entry]) },
        unreadDirect: applyIncomingUnread(state.unreadDirect, friendUserId, state.activeConversation, incoming),
      }));
    },
    markConversationRead: (friendUserId) => set((state) => {
      if (!friendUserId || !isFriend(friendUserId)) return { activeConversation: null };
      persistLatestConversationRead(state.profile?.userId, friendUserId, state.directMessages[friendUserId] ?? []);
      return { activeConversation: friendUserId, unreadDirect: { ...state.unreadDirect, [friendUserId]: 0 } };
    }),
  };
}

export const useSocialStore = create<SocialStore>(socialSession);
export function socialInboxSubscriptions(userId: string) {
  const { receiveDirectMessage, refreshFriendships } = useSocialStore.getState();
  return [
    () => subscribeToDirectMessages(userId, receiveDirectMessage),
    () => subscribeToFriendships(() => void refreshFriendships()),
  ];
}

useAccountStore.subscribe((next, prev) => {
  if (next.user?.$id !== prev.user?.$id) useSocialStore.getState().reset();
});
