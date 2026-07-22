import { create } from 'zustand';
import type { AuthUser } from '../services/appwrite/authService';
import {
  describeAppwriteError,
  getCurrentUser,
  loginWithPassword,
  logoutCurrentSession,
  registerWithPassword,
  requestEmailOtp,
  verifyEmailOtp,
} from '../services/appwrite/authService';
import {
  CloudSaveConflictError,
  downloadCloudSave,
  listCloudSaves,
  uploadLocalSave,
  type CloudSaveRow,
} from '../services/appwrite/cloudSaveService';
import { isAppwriteConfigured } from '../services/appwrite/config';

type AccountStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AccountStore {
  configured: boolean;
  status: AccountStatus;
  user: AuthUser | null;
  pendingOtpUserId: string | null;
  cloudSaves: CloudSaveRow[];
  busySlot: number | null;
  conflictSlot: number | null;
  message: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  requestOtp: (email: string) => Promise<boolean>;
  verifyOtp: (secret: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshCloudSaves: () => Promise<void>;
  uploadSlot: (slot: number, force?: boolean) => Promise<boolean>;
  downloadSlot: (slot: number, force?: boolean) => Promise<boolean>;
  clearMessage: () => void;
}

let initialization: Promise<void> | null = null;

export const useAccountStore = create<AccountStore>((set, get) => ({
  configured: isAppwriteConfigured,
  status: 'idle',
  user: null,
  pendingOtpUserId: null,
  cloudSaves: [],
  busySlot: null,
  conflictSlot: null,
  message: null,

  initialize: async () => {
    if (!isAppwriteConfigured || get().status === 'authenticated') return;
    if (initialization) return initialization;
    initialization = (async () => {
      set({ status: 'loading' });
      try {
        const user = await getCurrentUser();
        set({ user, status: user ? 'authenticated' : 'guest' });
        if (user) await get().refreshCloudSaves();
      } catch (error) {
        set({ status: 'guest', message: describeAppwriteError(error) });
      } finally {
        initialization = null;
      }
    })();
    return initialization;
  },

  login: async (email, password) => {
    set({ status: 'loading', message: null });
    try {
      const user = await loginWithPassword(email.trim(), password);
      set({ user, status: 'authenticated', pendingOtpUserId: null, message: '登录成功' });
      await get().refreshCloudSaves();
      return true;
    } catch (error) {
      set({ status: 'guest', message: describeAppwriteError(error) });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ status: 'loading', message: null });
    try {
      const user = await registerWithPassword(email.trim(), password, name);
      set({ user, status: 'authenticated', pendingOtpUserId: null, message: '账号已创建并登录' });
      return true;
    } catch (error) {
      set({ status: 'guest', message: describeAppwriteError(error) });
      return false;
    }
  },

  requestOtp: async (email) => {
    set({ status: 'loading', message: null });
    try {
      const pendingOtpUserId = await requestEmailOtp(email.trim());
      set({ pendingOtpUserId, status: 'guest', message: '6 位验证码已发送，15 分钟内有效' });
      return true;
    } catch (error) {
      set({ status: 'guest', message: describeAppwriteError(error) });
      return false;
    }
  },

  verifyOtp: async (secret) => {
    const userId = get().pendingOtpUserId;
    if (!userId) {
      set({ message: '请先发送邮箱验证码' });
      return false;
    }
    set({ status: 'loading', message: null });
    try {
      const user = await verifyEmailOtp(userId, secret.trim());
      set({ user, status: 'authenticated', pendingOtpUserId: null, message: '验证码登录成功' });
      await get().refreshCloudSaves();
      return true;
    } catch (error) {
      set({ status: 'guest', message: describeAppwriteError(error) });
      return false;
    }
  },

  logout: async () => {
    try {
      await logoutCurrentSession();
    } finally {
      set({ user: null, status: 'guest', cloudSaves: [], pendingOtpUserId: null, message: '已退出登录' });
    }
  },

  refreshCloudSaves: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const cloudSaves = await listCloudSaves(user.$id);
      set({ cloudSaves, message: null });
    } catch (error) {
      set({ message: describeAppwriteError(error) });
    }
  },

  uploadSlot: async (slot, force = false) => {
    const user = get().user;
    if (!user) {
      set({ message: '请先登录后再同步云端' });
      return false;
    }
    set({ busySlot: slot, conflictSlot: null, message: null });
    try {
      await uploadLocalSave(user.$id, slot, force);
      await get().refreshCloudSaves();
      set({ message: `槽位 ${slot} 已上传云端` });
      return true;
    } catch (error) {
      set({
        conflictSlot: error instanceof CloudSaveConflictError ? slot : null,
        message: error instanceof CloudSaveConflictError ? error.message : describeAppwriteError(error),
      });
      return false;
    } finally {
      set({ busySlot: null });
    }
  },

  downloadSlot: async (slot, force = false) => {
    const user = get().user;
    if (!user) return false;
    set({ busySlot: slot, conflictSlot: null, message: null });
    try {
      await downloadCloudSave(user.$id, slot, force);
      set({ message: `槽位 ${slot} 已从云端恢复` });
      return true;
    } catch (error) {
      set({
        conflictSlot: error instanceof CloudSaveConflictError ? slot : null,
        message: error instanceof CloudSaveConflictError ? error.message : describeAppwriteError(error),
      });
      return false;
    } finally {
      set({ busySlot: null });
    }
  },

  clearMessage: () => set({ message: null, conflictSlot: null }),
}));
