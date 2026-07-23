import { create } from 'zustand';
import { useAccountStore } from './accountStore';
import {
  claimSharedNation,
  enterSharedWorld,
  joinSharedWorld,
  listNationControls,
  listSharedWorlds,
  releaseSharedNation,
  markSharedWorldReady,
} from '../services/appwrite/sharedWorldService';
import type { NationControl, SharedWorldInstance } from '../shared-world/types';
import type { GameState } from '../types/game';
import { useSharedWorldSessionStore } from './sharedWorldSessionStore';

interface SharedWorldStore {
  worlds: SharedWorldInstance[];
  controls: Record<string, NationControl[]>;
  loading: boolean;
  busyNationId: string | null;
  message: string | null;
  refreshWorlds: () => Promise<void>;
  refreshControls: (worldId: string) => Promise<void>;
  join: (worldId: string) => Promise<boolean>;
  claim: (worldId: string, nationId: string) => Promise<boolean>;
  release: (worldId: string, nationId: string) => Promise<boolean>;
  enter: (worldId: string, nationId: string) => Promise<GameState | null>;
  setReady: () => Promise<GameState | null>;
}

function requireUser(): string {
  const user = useAccountStore.getState().user;
  if (!user) throw new Error('请先登录账号，再进入共享版图');
  return user.$id;
}

export const useSharedWorldStore = create<SharedWorldStore>((set, get) => ({
  worlds: [], controls: {}, loading: false, busyNationId: null, message: null,
  refreshWorlds: async () => {
    set({ loading: true, message: null });
    try { set({ worlds: await listSharedWorlds() }); }
    catch (error) { set({ message: error instanceof Error ? error.message : '共享版图加载失败' }); }
    finally { set({ loading: false }); }
  },
  refreshControls: async (worldId) => {
    try {
      const controls = await listNationControls(worldId);
      set((state) => ({ controls: { ...state.controls, [worldId]: controls } }));
    }
    catch (error) { set({ message: error instanceof Error ? error.message : '国家控制状态加载失败' }); }
  },
  join: async (worldId) => {
    try { requireUser(); await joinSharedWorld(worldId); await get().refreshControls(worldId); return true; }
    catch (error) { set({ message: error instanceof Error ? error.message : '加入版图失败' }); return false; }
  },
  claim: async (worldId, nationId) => {
    set({ busyNationId: nationId, message: null });
    try { requireUser(); await claimSharedNation(worldId, nationId); await get().refreshControls(worldId); set({ message: '国家控制权认领成功' }); return true; }
    catch (error) { set({ message: error instanceof Error ? error.message : '认领失败' }); return false; }
    finally { set({ busyNationId: null }); }
  },
  release: async (worldId, nationId) => {
    set({ busyNationId: nationId, message: null });
    try { requireUser(); await releaseSharedNation(worldId, nationId); await get().refreshControls(worldId); set({ message: '已释放国家，AI 将继续治理' }); return true; }
    catch (error) { set({ message: error instanceof Error ? error.message : '释放失败' }); return false; }
    finally { set({ busyNationId: null }); }
  },
  enter: async (worldId, nationId) => {
    set({ loading: true, message: null });
    try {
      const result = await enterSharedWorld(worldId, nationId);
      useSharedWorldSessionStore.getState().start(result.world, nationId, result.state);
      set({ worlds: get().worlds.map((world) => world.id === worldId ? result.world : world), controls: { ...get().controls, [worldId]: result.controls }, message: `已进入 ${result.world.name}` });
      return result.state;
    } catch (error) { set({ message: error instanceof Error ? error.message : '进入共享版图失败' }); return null; }
    finally { set({ loading: false }); }
  },
  setReady: async () => {
    const session = useSharedWorldSessionStore.getState().session;
    if (!session) return null;
    set({ loading: true, message: null });
    try {
      const result = await markSharedWorldReady(session.worldId, session.nationId, session.revision);
      if (result.resolved && result.world && result.state) { useSharedWorldSessionStore.getState().update(result.world, result.state); set({ worlds: get().worlds.map((item) => item.id === result.world!.id ? result.world! : item), message: `统一结算完成，进入第 ${result.world.turn + 1} 年` }); return result.state; }
      set({ message: `已准备，等待其他统治者${result.readyCount !== undefined ? `（${result.readyCount}/${result.requiredCount}）` : ''}` });
      return null;
    } catch (error) { set({ message: error instanceof Error ? error.message : '准备状态提交失败' }); return null; }
    finally { set({ loading: false }); }
  },
}));
