import { create } from 'zustand';
import { useAccountStore } from './accountStore';
import {
  claimSharedNation,
  enterSharedWorld,
  joinSharedWorld,
  listNationControls,
  listSharedWorlds,
  releaseSharedNation,
  markSharedWorldReady, syncSharedWorld, subscribeToWorldLobby,
} from '../services/appwrite/sharedWorldService';
import { useGameStore } from './gameStore';
import type { NationControl, SharedWorldInstance } from '../shared-world/types';
import type { GameState } from '../types/game';
import { currentSharedSession, enqueueSharedCommand, recordSharedOrderFailure, useSharedWorldSessionStore, type SharedWorldSession } from './sharedWorldSessionStore';

interface SharedWorldStore {
  worlds: SharedWorldInstance[];
  controls: Record<string, NationControl[]>;
  worldListError: string | null;
  rosterErrors: Record<string, string | undefined>;
  loading: boolean;
  entering: boolean;
  busyNationId: string | null;
  message: string | null;
  refreshWorlds: () => Promise<void>;
  refreshControls: (worldId: string) => Promise<void>;
  join: (worldId: string, signal?: AbortSignal) => Promise<boolean>;
  claim: (worldId: string, nationId: string) => Promise<boolean>;
  release: (worldId: string, nationId: string) => Promise<boolean>;
  enter: (worldId: string, nationId: string, signal?: AbortSignal) => Promise<GameState | null>;
  setReady: () => Promise<GameState | null>;
}

function requireUser(): string {
  const user = useAccountStore.getState().user;
  if (!user) throw new Error('请先登录账号，再进入共享版图');
  return user.$id;
}

let worldListRequest = 0;
let enterRequest = 0;
let accountEpoch = 0;
const controlRequests = new Map<string, symbol>();

export const useSharedWorldStore = create<SharedWorldStore>((set, get) => ({
  worlds: [], controls: {}, worldListError: null, rosterErrors: {}, loading: false, entering: false, busyNationId: null, message: null,
  refreshWorlds: async () => {
    const request = ++worldListRequest;
    set({ loading: true });
    try {
      const worlds = await listSharedWorlds();
      if (request === worldListRequest) {
        const known = new Map(get().worlds.map(w => [w.id, w]));
        set({ worldListError: null, worlds: worlds.map(w => {
          const existing = known.get(w.id);
          return existing && existing.revision > w.revision ? existing : w;
        }) });
      }
    } catch (error) {
      if (request === worldListRequest) set({ worldListError: error instanceof Error ? error.message : '共享版图加载失败' });
    } finally {
      if (request === worldListRequest) set({ loading: false });
    }
  },
  refreshControls: async (worldId) => {
    const request = Symbol();
    controlRequests.set(worldId, request);
    try {
      const controls = await listNationControls(worldId);
      if (controlRequests.get(worldId) === request) {
        set((state) => ({ controls: { ...state.controls, [worldId]: controls }, rosterErrors: { ...state.rosterErrors, [worldId]: undefined } }));
      }
    } catch (error) {
      if (controlRequests.get(worldId) === request) set((state) => ({ rosterErrors: { ...state.rosterErrors, [worldId]: error instanceof Error ? error.message : '国家控制状态加载失败' } }));
    } finally {
      if (controlRequests.get(worldId) === request) controlRequests.delete(worldId);
    }
  },
  join: async (worldId, signal) => {
    const epoch = accountEpoch;
    try {
      requireUser();
      await joinSharedWorld(worldId);
      if (signal?.aborted || epoch !== accountEpoch) return false;
      await get().refreshControls(worldId);
      return !signal?.aborted && epoch === accountEpoch;
    } catch (error) {
      if (!signal?.aborted && epoch === accountEpoch) set((state) => ({ rosterErrors: { ...state.rosterErrors, [worldId]: error instanceof Error ? error.message : '加入版图失败' } }));
      return false;
    }
  },
  claim: (worldId, nationId) => changeControl(worldId, nationId, 'claim'),
  release: (worldId, nationId) => changeControl(worldId, nationId, 'release'),
  enter: async (worldId, nationId, signal) => {
    const request = ++enterRequest;
    set({ entering: true, message: null });
    try {
      requireUser();
      const result = await enterSharedWorld(worldId, nationId);
      if (signal?.aborted || request !== enterRequest) return null;
      useSharedWorldSessionStore.getState().start(result.world, nationId, result.state, result.ready);
      controlRequests.delete(worldId);
      set({ worlds: get().worlds.map((world) => world.id === worldId ? result.world : world), controls: { ...get().controls, [worldId]: result.controls }, message: `已进入 ${result.world.name}` });
      return result.state;
    } catch (error) {
      if (!signal?.aborted && request === enterRequest) set({ message: error instanceof Error ? error.message : '进入共享版图失败' });
      return null;
    } finally {
      if (request === enterRequest) set({ entering: false });
    }
  },
  setReady: async () => {
    const session = useSharedWorldSessionStore.getState().session;
    if (!session) return null;
    const reportSettlement = (world: SharedWorldInstance) => set(({ worlds }) => ({
      worlds: worlds.map(item => item.id === world.id && item.revision <= world.revision ? world : item),
      message: `统一结算完成，进入第 ${world.turn + 1} 年`,
    }));
    set({ message: null });
    try {
      const result = await markSharedWorldReady(session.worldId, session.nationId, session.revision, session.turn);
      const current = currentSharedSession(session);
      if (!current || current.turn !== session.turn) return null;
      if (result.resolved && result.world && result.state) {
        const view = useSharedWorldSessionStore.getState().update(result.world, result.state);
        if (!view) return null;
        reportSettlement(result.world);
        return view;
      }
      const readyProgress = result.readyCount === undefined || result.requiredCount === undefined
        ? undefined
        : { ready: result.readyCount, required: result.requiredCount };
      useSharedWorldSessionStore.setState({ session: { ...current, ready: true, readyProgress } });
      set({ message: `已准备，等待其他统治者${readyProgress ? `（${readyProgress.ready}/${readyProgress.required}）` : ''}` });
      return null;
    } catch (error) {
      if (!currentSharedSession(session)) return null;
      const recovered = await refreshSession(session).catch(() => null);
      if (!currentSharedSession(session)) return null;
      if (recovered?.state && recovered.world.turn > session.turn) {
        reportSettlement(recovered.world);
      } else if (recovered?.ready && recovered.world.turn === session.turn) {
        set({ message: '已准备，等待其他统治者' });
      } else {
        recordSharedOrderFailure(session);
        const code = (error as { code?: number })?.code;
        const uncertain = !recovered && (error instanceof TypeError || code === 0 || code === 408 || (code !== undefined && code >= 500));
        set({ message: uncertain ? '准备结果尚未确认，恢复连接后会重新核对。' : error instanceof Error ? error.message : '准备状态提交失败' });
      }
      return recovered?.state ?? null;
    }
  },
}));

async function changeControl(worldId: string, nationId: string, action: 'claim' | 'release'): Promise<boolean> {
  const epoch = accountEpoch;
  const claim = action === 'claim';
  useSharedWorldStore.setState({ busyNationId: nationId, message: null });
  try {
    requireUser();
    await (claim ? claimSharedNation : releaseSharedNation)(worldId, nationId);
    if (epoch !== accountEpoch) return false;
    await useSharedWorldStore.getState().refreshControls(worldId);
    if (epoch !== accountEpoch) return false;
    useSharedWorldStore.setState({ message: claim ? '国家控制权认领成功' : '已释放国家' });
    return true;
  } catch (error) {
    if (epoch === accountEpoch) useSharedWorldStore.setState({ message: error instanceof Error ? error.message : (claim ? '认领失败' : '释放失败') });
    return false;
  } finally {
    if (epoch === accountEpoch) useSharedWorldStore.setState({ busyNationId: null });
  }
}

async function refreshSession(session: SharedWorldSession) {
  const response = await syncSharedWorld(session.worldId, session.nationId, session.revision);
  if (!response || !currentSharedSession(session)) return null;
  const state = useSharedWorldSessionStore.getState().update(response.world, response.state, response.ready);
  if (state) useGameStore.setState({ state, ...(state.turn > session.turn && { justProcessedTurn: true }) });
  const latest = currentSharedSession(session);
  if (latest?.revision !== response.world.revision || latest.turn !== response.world.turn) return null;
  return { state, world: response.world, ready: response.ready };
}

export function watchWorldLobby(worldId: string | null) {
  const store = useSharedWorldStore.getState();
  const epoch = accountEpoch;
  const lifetime = new AbortController();
  const visible = () => !lifetime.signal.aborted && epoch === accountEpoch && !document.hidden;
  let joined = false;
  // Keep one catch-up read if notifications arrive while an older read is in flight.
  function queueRead(read: () => Promise<void>) {
    let running = false, requested = false;
    return async () => {
      if (!visible()) return;
      requested = true;
      if (running) return;
      running = true;
      try {
        while (requested && visible()) {
          requested = false;
          await read();
        }
      } finally { running = false; }
    };
  }
  const snapshotFile = () => useSharedWorldStore.getState().worlds.find(world => world.id === worldId)?.snapshotFileId;
  const worlds = queueRead(async () => {
    const previous = snapshotFile();
    await store.refreshWorlds();
    if (joined && previous !== snapshotFile()) await roster();
  });
  const roster = queueRead(async () => {
    if (!worldId) return;
    if (joined) await store.refreshControls(worldId);
    else joined = await store.join(worldId, lifetime.signal);
  });
  let connecting = false;
  let dispose: (() => Promise<void>) | undefined;
  const resume = () => {
    if (!visible()) return;
    void worlds();
    if (!worldId) return;
    void roster();
    if (connecting || dispose) return;
    connecting = true;
    void subscribeToWorldLobby(worldId, part => { void (part === 'controls' ? roster() : worlds()); })
      .then(async cleanup => {
        if (lifetime.signal.aborted || epoch !== accountEpoch) await cleanup();
        else dispose = cleanup;
      }).catch(() => { /* The periodic read covers socket outages until the next connection attempt. */ })
      .finally(() => { connecting = false; });
  };
  const timer = window.setInterval(resume, 60_000);
  window.addEventListener('online', resume);
  window.addEventListener('pageshow', resume);
  document.addEventListener('visibilitychange', resume);
  resume();
  const stop = () => {
    lifetime.abort();
    window.clearInterval(timer);
    window.removeEventListener('online', resume);
    window.removeEventListener('pageshow', resume);
    document.removeEventListener('visibilitychange', resume);
    if (dispose) void dispose().catch(() => undefined);
  };
  return { refresh: resume, stop };
}

export function watchSharedWorld(session: SharedWorldSession) {
  let pending = false;
  let resumeRequested = false;
  let stopped = false;
  const refresh = () => {
    if (stopped || document.hidden || pending) return;
    const current = currentSharedSession(session);
    if (!current) return;
    pending = true;
    void enqueueSharedCommand(current, async (latest) => { await refreshSession(latest); }, 'refresh')
      .catch((error) => {
        if (!stopped && currentSharedSession(session) && [401, 403].includes(error?.code)) {
          useGameStore.getState().backToMenu();
          useSharedWorldStore.setState({ message: error.message });
        }
      }).finally(() => {
        pending = false;
        if (resumeRequested) {
          resumeRequested = false;
          refresh();
        }
      });
  };
  const resume = () => {
    if (document.hidden) return;
    if (pending) resumeRequested = true;
    else refresh();
  };
  const timer = window.setInterval(refresh, 15000);
  window.addEventListener('online', resume);
  window.addEventListener('pageshow', resume);
  document.addEventListener('visibilitychange', resume);
  refresh();
  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener('online', resume);
    window.removeEventListener('pageshow', resume);
    document.removeEventListener('visibilitychange', resume);
  };
}

useAccountStore.subscribe((next, prev) => {
  if (next.user?.$id === prev.user?.$id) return;
  accountEpoch++;
  worldListRequest++;
  enterRequest++;
  controlRequests.clear();
  useSharedWorldStore.setState({ worlds: [], controls: {}, worldListError: null, rosterErrors: {}, loading: false, entering: false, busyNationId: null, message: null });
  if (prev.user && useSharedWorldSessionStore.getState().session) useGameStore.getState().backToMenu();
});
