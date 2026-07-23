import { create } from 'zustand';
import type { SharedWorldInstance } from '../shared-world/types';
import type { GameState } from '../types/game';

export interface SharedWorldSession { worldId: string; worldName: string; nationId: string; revision: number; turn: number; state: GameState }

interface SharedWorldSessionStore {
  session: SharedWorldSession | null;
  start: (world: SharedWorldInstance, nationId: string, state: GameState) => void;
  update: (world: SharedWorldInstance, state: GameState) => void;
  leave: () => void;
}

export const useSharedWorldSessionStore = create<SharedWorldSessionStore>((set) => ({
  session: null,
  start: (world, nationId, state) => set({ session: { worldId: world.id, worldName: world.name, nationId, revision: world.revision, turn: world.turn, state } }),
  update: (world, state) => set((current) => ({ session: current.session ? { ...current.session, worldName: world.name, revision: world.revision, turn: world.turn, state } : null })),
  leave: () => set({ session: null }),
}));
