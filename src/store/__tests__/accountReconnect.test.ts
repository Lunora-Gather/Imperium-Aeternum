import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../../engine/init';
import { queueCloudSaveUpload } from '../../gameplay/cloudSyncCoordinator';
import { saveGameToSlot, storedSlotRaw } from '../persistence';
import { getCurrentUser, loginWithPassword, logoutCurrentSession, requestEmailOtp, type AuthUser } from '../../services/appwrite/authService';
import { listCloudSaves, uploadLocalSave } from '../../services/appwrite/cloudSaveService';
import { useSocialStore } from '../socialStore';
import { discoverProfiles, ensureGameProfile, listDirectInbox, listDirectMessages, listFriendships, sendDirectMessage } from '../../services/appwrite/socialService';
import { flushCloudUploads, useAccountStore, watchAccountSession } from '../accountStore';

vi.mock('../../services/appwrite/socialService', async (original) => ({
  ...await original<typeof import('../../services/appwrite/socialService')>(), discoverProfiles: vi.fn(), listDirectMessages: vi.fn(), listDirectInbox: vi.fn(), listFriendships: vi.fn(), ensureGameProfile: vi.fn(), sendDirectMessage: vi.fn(),
}));
vi.mock('../../services/appwrite/authService', async (original) => ({
  ...await original<typeof import('../../services/appwrite/authService')>(), getCurrentUser: vi.fn(), loginWithPassword: vi.fn(),
  logoutCurrentSession: vi.fn(), requestEmailOtp: vi.fn(),
}));
vi.mock('../../services/appwrite/cloudSaveService', async (original) => ({
  ...await original<typeof import('../../services/appwrite/cloudSaveService')>(), listCloudSaves: vi.fn(), uploadLocalSave: vi.fn(),
}));
const store = () => useAccountStore.getState();
const user = ($id: string) => ({ $id, emailVerification: true }) as AuthUser;
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function save(slot: number, turn: number) {
  const state = createInitialState(); state.turn = turn;
  expect(saveGameToSlot(state, slot).ok).toBe(true);
  queueCloudSaveUpload(slot);
}

describe('account and cloud reconnect', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) });
    vi.stubGlobal('navigator', { onLine: true });
    vi.mocked(listCloudSaves).mockResolvedValue([]);
    vi.mocked(logoutCurrentSession).mockResolvedValue(undefined);
    vi.mocked(loginWithPassword).mockImplementation(async (id) => user(id));
    useAccountStore.setState({ status: 'guest', user: null, cloudSaves: [], conflicts: {}, busySlot: null });
  });
  afterEach(async () => { await store().logout(); vi.unstubAllGlobals(); });

  it('clears former world members immediately and ignores a discovery reply after leaving', async () => {
    const social = useSocialStore.getState();
    const previous = [{ userId: 'old-member' }] as Awaited<ReturnType<typeof discoverProfiles>>;
    const delayed = deferred<typeof previous>();
    vi.mocked(discoverProfiles).mockResolvedValueOnce(previous).mockReturnValueOnce(delayed.promise);
    await social.discover('world-a');
    expect(useSocialStore.getState().discoveredProfiles).toEqual(previous);
    const loading = social.discover('world-b');
    expect(useSocialStore.getState().discoveredProfiles).toEqual([]);
    await social.discover(null);
    delayed.resolve(previous);
    await loading;
    expect(useSocialStore.getState()).toMatchObject({ discoveredProfiles: [], discoveredWorldId: null });
  });

  it('ignores an old session lookup and cloud list after a different login or logout', async () => {
    const check = deferred<AuthUser | null>();
    vi.mocked(getCurrentUser).mockReturnValue(check.promise);
    const restore = store().initialize();
    await store().login('b', 'password');
    check.resolve(user('a')); await restore;
    expect(store().user?.$id).toBe('b');

    const list = deferred<Awaited<ReturnType<typeof listCloudSaves>>>();
    vi.mocked(listCloudSaves).mockReturnValueOnce(list.promise);
    const refresh = store().refreshCloudSaves();
    await store().logout();
    list.resolve([{ userId: 'b', slot: 3 }] as Awaited<ReturnType<typeof listCloudSaves>>);
    await refresh;
    expect(store().cloudSaves).toEqual([]);
  });

  it('ignores a late OTP response after changing login mode', async () => {
    const code = deferred<string>();
    vi.mocked(requestEmailOtp).mockReturnValue(code.promise);
    const request = store().requestOtp('a@test.invalid', 'register');
    store().resetOtp(); code.resolve('a');
    expect(await request).toBe(false);
    expect(store().pendingOtpUserId).toBeNull();
  });

  it('reconciles an overlapping sign-out without broadcasting a stale logout to the successor', async () => {
    await store().login('a', 'password');
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('document', new EventTarget());
    const stop = watchAccountSession();
    const old = deferred<void>();
    vi.mocked(logoutCurrentSession).mockReturnValueOnce(old.promise);
    vi.mocked(getCurrentUser).mockResolvedValue(user('b'));
    const signOut = store().logout();
    const key = 'ia-account-session-change';
    try {
      window.dispatchEvent(Object.assign(new Event('storage'), { key, storageArea: localStorage, newValue: JSON.stringify({ userId: 'b' }) }));
      expect(store().user).toBeNull();
      old.resolve();
      await signOut;
      await vi.waitFor(() => expect(store().user?.$id).toBe('b'));
      const notice = localStorage.getItem(key)!;
      expect(JSON.parse(notice)).not.toHaveProperty('userId');
      const recheck = deferred<AuthUser | null>();
      vi.mocked(getCurrentUser).mockReturnValueOnce(recheck.promise);
      window.dispatchEvent(Object.assign(new Event('storage'), { key, storageArea: localStorage, newValue: notice }));
      expect(store().user?.$id).toBe('b');
      recheck.resolve(user('b'));
      await store().initialize(true);
    } finally { old.resolve(); await signOut; stop?.(); }
  });

  it('coalesces offline saves per slot and preserves a newer write during an upload', async () => {
    await store().login('a', 'password');
    vi.stubGlobal('navigator', { onLine: false });
    save(1, 1); save(1, 2); save(2, 7);
    expect(uploadLocalSave).not.toHaveBeenCalled();
    const first = deferred<void>();
    const turns: number[] = [];
    vi.mocked(uploadLocalSave).mockImplementation(async (id, slot) => {
      turns.push(JSON.parse(storedSlotRaw(slot)!).gameState.turn);
      if (turns.length === 1) await first.promise;
      return { userId: id, slot } as Awaited<ReturnType<typeof uploadLocalSave>>;
    });
    vi.stubGlobal('navigator', { onLine: true });
    const drain = flushCloudUploads();
    await vi.waitFor(() => expect(turns).toEqual([2]));
    save(1, 3);
    first.resolve(); await drain;
    expect(turns).toEqual([2, 3, 7]);
    expect(localStorage.getItem('ia-cloud-pending:1')).toBeNull();
  });

  it('rechecks the browser account before replaying work and preserves a failed logout', async () => {
    await store().login('a', 'password');
    vi.stubGlobal('navigator', { onLine: false });
    save(0, 12);
    vi.mocked(logoutCurrentSession).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await store().logout();
    expect(store().user?.$id).toBe('a');
    vi.mocked(getCurrentUser).mockResolvedValue(user('b'));
    vi.stubGlobal('navigator', { onLine: true });
    await store().initialize(true);
    expect(store().user?.$id).toBe('b');
    expect(uploadLocalSave).not.toHaveBeenCalled();
    expect(localStorage.getItem('ia-cloud-pending:0')).toMatch(/^a:/);
  });

  it('uploads the new account’s pending save while the previous account still awaits a receipt', async () => {
    await store().login('a', 'password');
    const pending = deferred<Awaited<ReturnType<typeof uploadLocalSave>>>();
    const receipt = (userId: string, slot: number) => ({ userId, slot }) as Awaited<ReturnType<typeof uploadLocalSave>>;
    vi.mocked(uploadLocalSave).mockReturnValueOnce(pending.promise).mockImplementation(async (id, slot) => receipt(id, slot));
    save(1, 4);
    expect(uploadLocalSave).toHaveBeenCalledOnce();
    try {
      await store().logout();
      await store().login('b', 'password');
      save(2, 8);
      await vi.waitFor(() => expect(store().cloudSaves).toEqual([receipt('b', 2)]));
      expect(localStorage.getItem('ia-cloud-pending:2')).toBeNull();
    } finally {
      pending.resolve(receipt('a', 1));
      await pending.promise;
    }
    expect(store().cloudSaves).toEqual([receipt('b', 2)]);
    expect(localStorage.getItem('ia-cloud-pending:1')).toMatch(/^a:/);
  });

  it('rechecks identity and uploads pending progress independently of a slow cloud list', async () => {
    await store().login('a', 'password');
    vi.stubGlobal('navigator', { onLine: false });
    save(0, 12);
    const list = deferred<Awaited<ReturnType<typeof listCloudSaves>>>();
    const row = { userId: 'a', slot: 0 } as Awaited<ReturnType<typeof uploadLocalSave>>;
    vi.mocked(listCloudSaves).mockReturnValueOnce(list.promise);
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user('a')).mockResolvedValueOnce(null);
    vi.mocked(uploadLocalSave).mockResolvedValue(row);
    vi.stubGlobal('navigator', { onLine: true });
    const reconnect = store().initialize(true);
    try {
      await vi.waitFor(() => expect(store().cloudSaves).toEqual([row]));
      const refresh = store().initialize(true);
      await vi.waitFor(() => expect(store().status).toBe('guest'));
      await refresh;
    } finally { list.resolve([row]); await reconnect; }
    expect(store().cloudSaves).toEqual([]);
  });

  it('leaves another tab’s pending upload intact when notified about an older write', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const old = saveGameToSlot(createInitialState(), 1);
    if (!old.ok) throw new Error(old.error);
    saveGameToSlot({ ...createInitialState(), turn: 12 }, 1);
    localStorage.setItem('ia-cloud-pending:1', 'peer:pending-version');
    queueCloudSaveUpload(1, old);
    expect(localStorage.getItem('ia-cloud-pending:1')).toBe('peer:pending-version');
    await store().login('a', 'password');
    queueCloudSaveUpload(1, old);
    expect(localStorage.getItem('ia-cloud-pending:1')).toBe('peer:pending-version');
    expect(uploadLocalSave).not.toHaveBeenCalled();
  });

  const friendship = { id: 'link', requesterId: 'a', addresseeId: 'friend', status: 'accepted' } as Awaited<ReturnType<typeof listFriendships>>[number];
  const direct = { id: 'old', senderId: 'friend', recipientId: 'a', createdAt: '2026-01-01', body: 'hello' } as Awaited<ReturnType<typeof sendDirectMessage>>;

  it('waits for reconnection when the network drops between friendship and inbox reads', async () => {
    await store().login('a', 'password');
    const social = useSocialStore.getState();
    const waiting = deferred<typeof friendship[]>();
    vi.mocked(ensureGameProfile).mockResolvedValue({ userId: 'a' } as Awaited<ReturnType<typeof ensureGameProfile>>);
    vi.mocked(listFriendships).mockReturnValueOnce(waiting.promise).mockResolvedValue([friendship]);
    vi.mocked(listDirectInbox).mockResolvedValue([direct]);
    const read = social.initialize();
    vi.stubGlobal('navigator', { onLine: false });
    waiting.resolve([friendship]);
    await read;
    await social.initialize();
    expect(listDirectInbox).not.toHaveBeenCalled();
    expect(listFriendships).toHaveBeenCalledTimes(1);
    vi.stubGlobal('navigator', { onLine: true });
    await social.initialize();
    expect(useSocialStore.getState().unreadDirect.friend).toBe(1);
  });

  it('keeps a removed friend out of delayed list, inbox, conversation and send replies', async () => {
    await store().login('a', 'password');
    const social = useSocialStore.getState();
    const oldList = deferred<typeof friendship[]>();
    const inbox = deferred<typeof direct[]>();
    const history = deferred<typeof direct[]>();
    const sent = deferred<typeof direct>();
    vi.mocked(ensureGameProfile).mockResolvedValue({ userId: 'a' } as Awaited<ReturnType<typeof ensureGameProfile>>);
    vi.mocked(listFriendships).mockResolvedValue([friendship]);
    vi.mocked(listDirectInbox).mockReturnValue(inbox.promise);
    vi.mocked(listDirectMessages).mockReturnValue(history.promise);
    vi.mocked(sendDirectMessage).mockReturnValue(sent.promise);
    const init = social.initialize();
    await vi.waitFor(() => expect(listDirectInbox).toHaveBeenCalled());
    social.markConversationRead('friend');
    const read = social.refreshDirectMessages('friend');
    const send = social.sendDirect('friend', 'hi');
    vi.mocked(listFriendships).mockReturnValueOnce(oldList.promise).mockResolvedValue([]);
    const older = social.refreshFriendships();
    await social.refreshFriendships();
    history.resolve([direct]); sent.resolve(direct); oldList.resolve([friendship]); inbox.resolve([direct]);
    await Promise.all([init, read, send, older]);
    expect(useSocialStore.getState()).toMatchObject({ friendships: [], activeConversation: null, unreadDirect: {}, directMessages: {} });
    expect(await social.sendDirect('friend', 'again')).toBe(false);
    expect(sendDirectMessage).toHaveBeenCalledTimes(1);
  });

  it('discards an old private conversation response after an account change', async () => {
    await store().login('a', 'password');
    useSocialStore.setState({ friendships: [friendship] });
    const reply = deferred<Awaited<ReturnType<typeof listDirectMessages>>>();
    vi.mocked(listDirectMessages).mockReturnValue(reply.promise);
    const refresh = useSocialStore.getState().refreshDirectMessages('friend');
    expect(listDirectMessages).toHaveBeenCalledWith('friend');
    await store().logout();
    await store().login('b', 'password');
    reply.resolve([{ id: 'old', senderId: 'a', recipientId: 'friend', body: 'old account' }] as Awaited<ReturnType<typeof listDirectMessages>>);
    await refresh;
    expect(useSocialStore.getState().directMessages).toEqual({});
  });

  it('revalidates the session and retries pending work when the first reconnect request fails', async () => {
    await store().login('a', 'password');
    vi.stubGlobal('navigator', { onLine: false });
    save(0, 21);
    vi.useFakeTimers();
    try {
      vi.stubGlobal('window', { setTimeout });
      vi.stubGlobal('navigator', { onLine: true });
      vi.mocked(getCurrentUser).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(user('a'));
      vi.mocked(uploadLocalSave).mockResolvedValue({ userId: 'a', slot: 0 } as Awaited<ReturnType<typeof uploadLocalSave>>);
      await store().initialize(true);
      expect(uploadLocalSave).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(30000);
      expect(uploadLocalSave).toHaveBeenCalledOnce();
      expect(localStorage.getItem('ia-cloud-pending:0')).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it('keeps other slots from a delayed list while preserving a newer upload receipt', async () => {
    const list = deferred<Awaited<ReturnType<typeof listCloudSaves>>>();
    vi.mocked(listCloudSaves).mockReturnValueOnce(list.promise);
    await store().login('a', 'password');
    const row = { userId: 'a', slot: 1, contentHash: 'new' } as Awaited<ReturnType<typeof uploadLocalSave>>;
    vi.mocked(uploadLocalSave).mockResolvedValue(row);
    expect(await store().uploadSlot(1)).toBe(true);
    list.resolve([{ ...row, contentHash: 'old' }, { ...row, slot: 2 }]);
    await vi.waitFor(() => expect(store().cloudSaves.map((r) => r.slot)).toEqual([1, 2]));
    expect(store().cloudSaves[0].contentHash).toBe('new');
  });
});
