import { create } from 'zustand';
import { useAccountStore } from './accountStore';
import {
  claimSharedNation,
  joinSharedWorld,
  listNationControls,
  listSharedWorlds,
  releaseSharedNation,
} from '../services/appwrite/sharedWorldService';
import type { NationControl, SharedWorldInstance } from '../shared-world/types';

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
}));
