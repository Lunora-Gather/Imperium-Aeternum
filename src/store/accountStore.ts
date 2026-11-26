import { onLocalSlotSaved } from '../gameplay/cloudSyncCoordinator';
import { SLOT_COUNT, slotStorageValue } from './persistence';
import { create } from 'zustand';
import type { AuthUser } from '../services/appwrite/authService';
import {
  describeAppwriteError,
  completePasswordRecovery,
  completeVerifiedRegistration,
  getCurrentUser,
  loginWithPassword,
  logoutCurrentSession,
  requestEmailOtp,
  verifyEmailOtp,
} from '../services/appwrite/authService';
import {
  CloudSaveConflictError,
  downloadCloudSave,
  listCloudSaves,
  uploadLocalSave,
  shortHash, slotFingerprint, type SaveVersions, type CloudSaveRow,
} from '../services/appwrite/cloudSaveService';
import { isAppwriteConfigured } from '../services/appwrite/config';

type AccountStatus = 'idle' | 'loading' | 'authenticated' | 'guest';
export type OtpPurpose = 'login' | 'register' | 'recovery';

interface AccountStore {
  configured: boolean;
  status: AccountStatus;
  user: AuthUser | null;
  pendingOtpUserId: string | null;
  pendingOtpEmail: string | null;
  pendingOtpPurpose: OtpPurpose | null;
  cloudSaves: CloudSaveRow[];
  cloudListLoaded: boolean;
  busySlot: number | null;
  conflicts: Record<number, SaveVersions>;
  message: string | null;
  initialize: (recheck?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  requestOtp: (email: string, purpose: OtpPurpose) => Promise<boolean>;
  verifyLoginOtp: (secret: string) => Promise<boolean>;
  completeRegistration: (secret: string, password: string, name: string) => Promise<boolean>;
  recoverPassword: (secret: string, password: string) => Promise<boolean>;
  resetOtp: () => void;
  logout: () => Promise<void>;
  refreshCloudSaves: () => Promise<void>;
  uploadSlot: (slot: number, force?: boolean, queuedLocal?: string) => Promise<boolean>;
  downloadSlot: (slot: number, force?: boolean) => Promise<boolean>;
  clearMessage: () => void;
}

const noOtp = { pendingOtpUserId: null, pendingOtpEmail: null, pendingOtpPurpose: null };
const emptyCloud = { cloudSaves: [], cloudListLoaded: false, busySlot: null, conflicts: {} };
let generation = 0, listRequest = 0, otpRequest = 0;
let changingSession = false;
let checking: Promise<void> | undefined;
const sessionChangeKey = 'ia-account-session-change';

function notifySessionChange(userId?: string | null) {
  // The nonce also signals a renewed session for the same account.
  try { localStorage.setItem(sessionChangeKey, JSON.stringify({ userId, nonce: Math.random() })); } catch { /* Recheck on return when storage is unavailable. */ }
}

export function watchAccountSession() {
  if (!isAppwriteConfigured) return;
  const recheck = () => { void useAccountStore.getState().initialize(true); };
  const visible = () => { if (!document.hidden) recheck(); };
  const restored = (event: PageTransitionEvent) => { if (event.persisted) recheck(); };
  const sessionChanged = (event: StorageEvent) => {
    if (event.storageArea !== localStorage || event.key !== sessionChangeKey || !event.newValue) return;
    let userId: unknown;
    try { userId = JSON.parse(event.newValue).userId; } catch { /* Unknown identity must be rechecked. */ }
    generation++;
    otpRequest++;
    checking = undefined;
    const current = useAccountStore.getState().user;
    // Only the server can establish a new identity. Invalidate requests from
    // the previous session even when the same player signed in again.
    // An overlapping login/logout has no reliable identity hint. Recheck it
    // without ejecting the current player from a live shared campaign.
    const keepUser = current && (userId === undefined || current.$id === userId);
    useAccountStore.setState({ ...noOtp, message: null, busySlot: null,
      ...(keepUser ? {} : { ...emptyCloud, user: null, status: 'loading' }) });
    recheck();
  };
  window.addEventListener('storage', sessionChanged);
  window.addEventListener('online', visible);
  window.addEventListener('pageshow', restored);
  document.addEventListener('visibilitychange', visible);
  void useAccountStore.getState().initialize();
  return () => {
    window.removeEventListener('storage', sessionChanged);
    window.removeEventListener('online', visible);
    window.removeEventListener('pageshow', restored);
    document.removeEventListener('visibilitychange', visible);
  };
}

export const useAccountStore = create<AccountStore>((set, get) => {
  const authenticate = async (login: () => Promise<AuthUser>, message: string) => {
    if (changingSession || get().user) return false;
    changingSession = true;
    checking = undefined;
    const version = ++generation;
    otpRequest++;
    set({ status: 'loading', message: null });
    try {
      const user = await login();
      notifySessionChange(generation === version ? user.$id : undefined);
      if (generation !== version) return false;
      set({ user, status: 'authenticated', ...noOtp, ...emptyCloud, message });
      void get().refreshCloudSaves();
      return true;
    } catch (error) {
      if (generation !== version) return false;
      set({ status: get().user ? 'authenticated' : 'guest', message: describeAppwriteError(error) });
      if ((error as { sessionChanged?: boolean })?.sessionChanged) queueMicrotask(() => void get().initialize(true));
      return false;
    } finally {
      changingSession = false;
      if (generation !== version) void get().initialize(true);
      else void flushCloudUploads();
    }
  };

  const transfer = async (slot: number, upload: boolean, force: boolean, queuedLocal?: string) => {
    const { user, conflicts, busySlot } = get();
    if (!user || changingSession || busySlot !== null || (force && !conflicts[slot])) return false;
    const version = generation;
    const active = () => generation === version && get().user?.$id === user.$id;
    const confirmation = force ? conflicts[slot] : undefined;
    const ticket = pendingTicket(slot);
    set({ busySlot: slot, message: null });
    try {
      const row = upload ? await uploadLocalSave(user.$id, slot, confirmation, active, queuedLocal)
        : await downloadCloudSave(user.$id, slot, confirmation, active);
      if (!active()) return false;
      if (ticket?.startsWith(user.$id + ':') && pendingTicket(slot) === ticket) setTicket(slot, null);
      const remaining = { ...get().conflicts };
      delete remaining[slot];
      set({ cloudSaves: [...get().cloudSaves.filter(r => r.slot !== slot), row].sort((a, b) => a.slot - b.slot),
        conflicts: remaining, message: `槽位 ${slot} 已${upload ? '上传云端' : '从云端恢复'}` });
      return true;
    } catch (error) {
      if (active()) {
        if (error instanceof CloudSaveConflictError) {
          set({ conflicts: { ...get().conflicts, [slot]: error.versions }, message: error.message });
          void get().refreshCloudSaves();
        } else {
          set({ message: describeAppwriteError(error) });
          if ((error as { code?: number })?.code === 401) void get().initialize(true);
          else if (transient(error)) retryConnection();
        }
      }
      return false;
    } finally {
      if (active()) set({ busySlot: null });
      void flushCloudUploads();
    }
  };

  return {
    configured: isAppwriteConfigured, user: null, status: 'idle', message: null, ...noOtp, ...emptyCloud,
    initialize: async (recheck = false) => {
      if (!isAppwriteConfigured || changingSession || (!recheck && get().user)) return;
      if (checking) return checking;
      const version = generation;
      if (!get().user && !get().pendingOtpUserId) set({ status: 'loading' });
      const request = (async () => {
        try {
          const user = await getCurrentUser();
          if (generation !== version) return;
          const changed = get().user?.$id !== user?.$id;
          if (changed) { generation++; otpRequest++; }
          set({ user, status: user ? 'authenticated' : 'guest', ...(changed && { ...emptyCloud, ...noOtp, message: null }) });
          if (user) {
            // The identity lookup is complete. Listing slots must not hold up
            // another session check or an upload that already has its version.
            checking = undefined;
            const list = get().refreshCloudSaves();
            void flushCloudUploads();
            await list;
          }
        } catch (error) {
          if (generation === version) {
            set({ status: get().user ? 'authenticated' : 'guest', message: describeAppwriteError(error) });
            if (transient(error)) retryConnection();
          }
        }
      })();
      checking = request;
      try { await request; } finally { if (checking === request) checking = undefined; }
    },
    login: (email, password) => authenticate(() => loginWithPassword(email.trim(), password), '登录成功'),
    requestOtp: async (email, purpose) => {
      if (changingSession || get().user) return false;
      checking = undefined;
      generation++;
      const token = ++otpRequest;
      set({ ...noOtp, status: 'loading', message: null });
      try {
        const id = await requestEmailOtp(email.trim());
        if (token !== otpRequest) return false;
        set({ pendingOtpUserId: id, pendingOtpEmail: email.trim(), pendingOtpPurpose: purpose,
          status: 'guest', message: '6 位邮箱验证码已发送，15 分钟内有效' });
        return true;
      } catch (error) {
        if (token === otpRequest) set({ status: 'guest', message: describeAppwriteError(error) });
        return false;
      }
    },
    verifyLoginOtp: (secret) => {
      const { pendingOtpUserId: id, pendingOtpPurpose } = get();
      return id && pendingOtpPurpose === 'login' ? authenticate(() => verifyEmailOtp(id, secret.trim()), '邮箱验证通过，已安全登录') : Promise.resolve(false);
    },
    completeRegistration: (secret, password, name) => {
      const { pendingOtpUserId: id, pendingOtpPurpose } = get();
      return id && pendingOtpPurpose === 'register' ? authenticate(() => completeVerifiedRegistration(id, secret.trim(), password, name), '邮箱验证成功，账号已创建') : Promise.resolve(false);
    },
    recoverPassword: (secret, password) => {
      const { pendingOtpUserId: id, pendingOtpPurpose } = get();
      return id && pendingOtpPurpose === 'recovery' ? authenticate(() => completePasswordRecovery(id, secret.trim(), password), '密码已更新，并已安全登录') : Promise.resolve(false);
    },
    resetOtp: () => { otpRequest++; if (!get().user) set({ ...noOtp, ...(!changingSession && { status: 'guest' }), message: null }); },
    logout: async () => {
      if (changingSession) return;
      changingSession = true;
      checking = undefined;
      const version = ++generation;
      otpRequest++;
      set({ busySlot: null, status: 'loading' });
      try {
        await logoutCurrentSession(get().user?.$id);
        notifySessionChange(generation === version ? null : undefined);
        if (generation !== version) return;
        set({ user: null, status: 'guest', ...emptyCloud, ...noOtp, message: '已退出登录' });
      } catch (error) {
        if (generation !== version) return;
        set({ status: get().user ? 'authenticated' : 'guest', message: describeAppwriteError(error) });
        if ((error as { sessionChanged?: boolean })?.sessionChanged) queueMicrotask(() => void get().initialize(true));
      } finally {
        changingSession = false;
        if (generation !== version) void get().initialize(true);
      }
    },
    refreshCloudSaves: async () => {
      const { user } = get();
      if (!user) return;
      const version = generation, request = ++listRequest;
      const before = get().cloudSaves;
      try {
        const rows = await listCloudSaves(user.$id);
        if (version !== generation || request !== listRequest) return;
        const bySlot = new Map(rows.map((row) => [row.slot, row]));
        for (const row of get().cloudSaves) if (!before.includes(row)) bySlot.set(row.slot, row);
        set({ cloudListLoaded: true, cloudSaves: [...bySlot.values()].sort((a, b) => a.slot - b.slot) });
      } catch (error) {
        if (version === generation && request === listRequest) {
          set({ message: describeAppwriteError(error) });
          if (transient(error)) retryConnection();
        }
      }
    },
    uploadSlot: (slot, force = false, queuedLocal) => transfer(slot, true, force, queuedLocal),
    downloadSlot: (slot, force = false) => transfer(slot, false, force),
    clearMessage: () => set({ message: null }),
  };
});

const fallbackTickets = new Map<number, string | null>();
const ticketKey = (slot: number) => `ia-cloud-pending:${slot}`;
function pendingTicket(slot: number) {
  if (fallbackTickets.has(slot)) return fallbackTickets.get(slot);
  try { return localStorage.getItem(ticketKey(slot)); } catch { return null; }
}
function setTicket(slot: number, ticket: string | null) {
  try {
    if (ticket) localStorage.setItem(ticketKey(slot), ticket); else localStorage.removeItem(ticketKey(slot));
    fallbackTickets.delete(slot);
  } catch { fallbackTickets.set(slot, ticket); }
}

let drainingGeneration: number | undefined;
let retry: number | undefined;
function transient(error: unknown) {
  const code = (error as { code?: number })?.code;
  return error instanceof TypeError || code === 0 || code === 408 || code === 429 || (code !== undefined && code >= 500);
}
function retryConnection() {
  if (typeof window === 'undefined' || retry !== undefined || navigator.onLine === false) return;
  retry = window.setTimeout(() => { retry = undefined; void useAccountStore.getState().initialize(true); }, 30000);
}
export async function flushCloudUploads() {
  const version = generation;
  if (drainingGeneration === version || changingSession || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  drainingGeneration = version;
  const attempted = new Set<string>();
  try {
    for (let slot = 0; slot < SLOT_COUNT && generation === version; slot++) {
      const account = useAccountStore.getState();
      if (!account.user || account.busySlot !== null) break;
      const ticket = pendingTicket(slot);
      if (!ticket || account.conflicts[slot] || !ticket.startsWith(account.user.$id + ':')) continue;
      let fingerprint;
      try { fingerprint = slotFingerprint(slot); } catch { retryConnection(); continue; }
      if (!fingerprint || ticket !== account.user.$id + ':' + fingerprint) {
        if (pendingTicket(slot) === ticket) setTicket(slot, null);
        continue;
      }
      const key = slot + ':' + ticket;
      if (attempted.has(key)) continue;
      attempted.add(key);
      await account.uploadSlot(slot, false, fingerprint);
      slot = -1; // Check for newer saves written while this upload was in flight.
    }
  } finally { if (drainingGeneration === version) drainingGeneration = undefined; }
}

onLocalSlotSaved((slot, write) => {
  const user = useAccountStore.getState().user;
  let fingerprint;
  try {
    fingerprint = user ? (write ? shortHash(write.raw) : slotFingerprint(slot)) : null;
    if (write && slotStorageValue(slot) !== write.stored) return;
  } catch { return; }
  setTicket(slot, user && fingerprint ? user.$id + ':' + fingerprint : null);
  if (fingerprint) void flushCloudUploads();
});
