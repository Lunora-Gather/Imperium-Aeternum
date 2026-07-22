import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { processTurn } from '../../engine/turn';
import { compactGameStateForSave, loadGameFromSlot, migrate, readSaveGameFromSlot, saveGameToSlot, deleteSlot } from '../persistence';
import { SAVE_VERSION, type SaveGame } from '../../types/game';
import { allocateEntityId } from '../../utils/id';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
});

describe('persistence roundtrip', () => {
  it('saves and loads a played state from a slot', () => {
    const state = processTurn(createInitialState()).state;
    const saved = saveGameToSlot(state, 1);

    expect(saved.ok).toBe(true);
    const loaded = loadGameFromSlot(1);

    expect(loaded).toBeTruthy();
    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.turn).toBe(1);
    expect(loaded?.playerNationId).toBe(state.playerNationId);
    expect(loaded?.lastReport?.turn).toBe(1);
  });

  it('never mutates the live state while compacting or saving', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].activePolicies.push({ policyId: 'free_trade', enactedTurn: 0 });
    const snapshot = JSON.stringify({ ...state, _relMap: undefined });
    const playerRef = state.nations[state.playerNationId];

    const compact = compactGameStateForSave(state);
    const saved = saveGameToSlot(state, 1);

    expect(saved.ok).toBe(true);
    expect(JSON.stringify({ ...state, _relMap: undefined })).toBe(snapshot);
    expect(state.nations[state.playerNationId]).toBe(playerRef);
    expect(compact).not.toBe(state);
    expect(compact.nations[state.playerNationId]).not.toBe(playerRef);
    expect(compact.nations[state.playerNationId].policyMods?.influenceMod).toBeCloseTo(1.03);
  });

  it('returns null for a corrupt save slot instead of throwing', () => {
    localStorage.setItem('imperium-aeternum-save-2', '{not-json');

    expect(readSaveGameFromSlot(2).ok).toBe(false);
    expect(loadGameFromSlot(2)).toBeNull();
  });

  it('normalizes legacy saves during migration', () => {
    const state = createInitialState() as any;
    state.playerNationId = 'missing-player';
    state.pendingEvents = undefined;
    state.history = undefined;
    state.relations = state.relations.slice(0, 1);
    delete state.victory;

    const legacy: SaveGame = { version: 3, createdAt: 'legacy', gameState: state } as SaveGame;
    const migrated = migrate(legacy);

    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.gameState.nations[migrated.gameState.playerNationId]).toBeTruthy();
    expect(Array.isArray(migrated.gameState.pendingEvents)).toBe(true);
    expect(Array.isArray(migrated.gameState.history)).toBe(true);
    expect(migrated.gameState.victory).toEqual({ type: null });
    expect(migrated.gameState.relations.some((r) => r.from === migrated.gameState.relations[0].to && r.to === migrated.gameState.relations[0].from)).toBe(true);
  });

  it('migrates the persisted entity sequence past ids already present in a v4 save', () => {
    const state = createInitialState() as any;
    delete state.entityIdCounter;
    state.provinces.p01.buildings.push({ id: 'entity_z_building', defId: 'farm', provinceId: 'p01', level: 1 });
    const legacy = { version: 4, createdAt: 'legacy', gameState: state } as SaveGame;

    const migrated = migrate(legacy);

    expect(migrated.gameState.entityIdCounter).toBe(35);
    expect(allocateEntityId(migrated.gameState, 'army')).toBe('entity_10_army');
  });

  it('can delete a slot after saving', () => {
    expect(saveGameToSlot(createInitialState(), 3).ok).toBe(true);
    expect(readSaveGameFromSlot(3).ok).toBe(true);

    deleteSlot(3);

    const read = readSaveGameFromSlot(3);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.empty).toBe(true);
  });
});
