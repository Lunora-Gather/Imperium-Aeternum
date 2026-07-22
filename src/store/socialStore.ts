import { create } from 'zustand';
import type { Friendship, GameProfile, WorldChatMessage } from '../social/types';
import {
  ensureGameProfile,
  findProfileByFriendCode,
  listFriendships,
  listWorldMessages,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  sendWorldMessage,
} from '../services/appwrite/socialService';

interface SocialStore {
  profile: GameProfile | null;
  friendships: Friendship[];
  messages: Record<string, WorldChatMessage[]>;
  loading: boolean;
  message: string | null;
  reset: () => void;
  initialize: () => Promise<void>;
  addByCode: (friendCode: string) => Promise<boolean>;
  respond: (friendshipId: string, accept: boolean) => Promise<void>;
  remove: (friendshipId: string) => Promise<void>;
  refreshMessages: (worldId: string) => Promise<void>;
  sendMessage: (worldId: string, body: string, nationId?: string) => Promise<boolean>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  profile: null, friendships: [], messages: {}, loading: false, message: null,
  reset: () => set({ profile: null, friendships: [], messages: {}, loading: false, message: null }),
  initialize: async () => {
    set({ loading: true, message: null });
    try {
      const [profile, friendships] = await Promise.all([ensureGameProfile(), listFriendships()]);
      set({ profile, friendships });
    } catch (error) { set({ message: error instanceof Error ? error.message : '社交资料加载失败' }); }
    finally { set({ loading: false }); }
  },
  addByCode: async (friendCode) => {
    set({ loading: true, message: null });
    try {
      const target = await findProfileByFriendCode(friendCode);
      if (!target) throw new Error('没有找到该好友码');
      if (target.userId === get().profile?.userId) throw new Error('不能添加自己为好友');
      await sendFriendRequest(target.userId);
      set({ friendships: await listFriendships(), message: `已向 ${target.displayName} 发送好友申请` });
      return true;
    } catch (error) { set({ message: error instanceof Error ? error.message : '好友申请失败' }); return false; }
    finally { set({ loading: false }); }
  },
  respond: async (friendshipId, accept) => {
    try { await respondFriendRequest(friendshipId, accept); set({ friendships: await listFriendships(), message: accept ? '已成为好友' : '已拒绝好友申请' }); }
    catch (error) { set({ message: error instanceof Error ? error.message : '好友申请处理失败' }); }
  },
  remove: async (friendshipId) => {
    try { await removeFriend(friendshipId); set({ friendships: await listFriendships(), message: '已移除好友' }); }
    catch (error) { set({ message: error instanceof Error ? error.message : '移除好友失败' }); }
  },
  refreshMessages: async (worldId) => {
    try {
      const messages = await listWorldMessages(worldId);
      set((state) => ({ messages: { ...state.messages, [worldId]: messages }, message: null }));
    } catch (error) { set({ message: error instanceof Error ? error.message : '版图聊天加载失败' }); }
  },
  sendMessage: async (worldId, body, nationId) => {
    const text = body.trim();
    if (!text) return false;
    set({ loading: true, message: null });
    try { await sendWorldMessage(worldId, text, nationId); await get().refreshMessages(worldId); return true; }
    catch (error) { set({ message: error instanceof Error ? error.message : '消息发送失败' }); return false; }
    finally { set({ loading: false }); }
  },
}));
