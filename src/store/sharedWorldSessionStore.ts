import { create } from 'zustand';
import { sharedNationView } from '../shared-world/nationView';
import type { SharedWorldInstance } from '../shared-world/types';
import type { GameState } from '../types/game';

export interface SharedWorldSession { id: symbol; worldId: string; worldName: string; nationId: string; revision: number; turn: number; state: GameState; ready: boolean; readyProgress?: { ready: number; required: number } }

interface SharedWorldSessionStore {
  session: SharedWorldSession | null;
  voting: SharedWorldSession | null;
  start: (world: SharedWorldInstance, nationId: string, state: GameState, ready?: boolean) => void;
  update: (world: SharedWorldInstance, state?: GameState, ready?: boolean) => GameState | null;
  leave: () => void;
}

let commands = Promise.resolve();
let orders = { pending: 0, failures: 0, settled: commands };

export function pendingSharedOrders() { return orders.pending; }
export function sharedOrderFailures() { return orders.failures; }
export function recordSharedOrderFailure(origin: SharedWorldSession) {
  if (currentSharedSession(origin)) orders.failures++;
}

export const useSharedWorldSessionStore = create<SharedWorldSessionStore>((set, get) => ({
  session: null,
  voting: null,
  start: (world, nationId, state, ready = false) => {
    commands = Promise.resolve();
    orders = { pending: 0, failures: 0, settled: commands };
    set({ voting: null, session: { id: Symbol(), ready, worldId: world.id, worldName: world.name, nationId, revision: world.revision, turn: world.turn, state: sharedNationView(state, nationId) } });
  },
  update: (world, state, ready) => {
    const session = get().session;
    if (!session || world.id !== session.worldId || world.revision < session.revision ||
      world.turn < session.turn || (state && state.turn !== world.turn)) return null;
    if (!state) {
      if (ready !== undefined && ready !== session.ready && world.turn === session.turn && world.revision === session.revision)
        set({ session: { ...session, ready, readyProgress: undefined } });
      return null;
    }
    const view = sharedNationView(state, session.nationId);
    const sameTurn = world.turn === session.turn;
    const isReady = ready ?? (sameTurn && session.ready);
    const readyProgress = sameTurn && isReady ? session.readyProgress : undefined;
    set({ session: { ...session, ready: isReady, readyProgress, worldName: world.name, revision: world.revision, turn: world.turn, state: view } });
    return view;
  },
  leave: () => set({ session: null, voting: null }),
}));

export function currentSharedSession(origin: SharedWorldSession) {
  const current = useSharedWorldSessionStore.getState().session;
  return current?.id === origin.id ? current : null;
}

export async function waitForSharedCommands() {
  const batch = orders;
  const failures = batch.failures;
  let settled;
  do {
    settled = batch.settled;
    await settled;
  } while (settled !== batch.settled);
  return batch.failures === failures;
}

export function enqueueSharedCommand(origin: SharedWorldSession, run: (session: SharedWorldSession) => Promise<void>, kind: 'order' | 'refresh' = 'order') {
  if (!currentSharedSession(origin)) return Promise.resolve();
  const batch = orders;
  const isOrder = kind === 'order';
  if (isOrder) batch.pending++;
  const pending = commands.then(async () => {
    const current = currentSharedSession(origin);
    try {
      if (isOrder && current?.state.nations[current.nationId]?.defeated) throw new Error('国家已覆亡');
      if (current?.turn === origin.turn) await run(current);
      else if (current && isOrder) throw new Error('本年已结算，操作未提交。请核对新一年的版图后重试。');
    } catch (error) {
      if (isOrder) batch.failures++;
      throw error;
    } finally {
      if (isOrder) batch.pending--;
    }
  });
  commands = pending.catch(() => undefined);
  if (isOrder) batch.settled = commands;
  return pending;
}
