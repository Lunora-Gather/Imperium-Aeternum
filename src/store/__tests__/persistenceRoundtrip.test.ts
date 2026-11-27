import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, createWorldState } from '../../engine/init';
import { advanceTurnPipeline, prepareGameState } from '../../gameplay/turnPipeline';
import { applyEffect } from '../../engine/events';
import { enactPolicy } from '../../engine/politics';
import { processTurn } from '../../engine/turn';
import { clearAllSaves, snapshotSaveList, compactGameStateForSave, loadGameFromSlot, migrate, readSaveGameFromSlot, saveGameToSlot, deleteSlot, storedSlotRaw, importSaveGameToSlot } from '../persistence';
import { SAVE_VERSION, type SaveGame, type TurnReport } from '../../types/game';
import { checkpointBeforeUnload, clearCampaignSaves, saveCampaignForExit, useGameStore } from '../gameStore';
import { operatingNet } from '../../gameplay/reportFinances';
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
  it.each(['slot', 'all', 'partial'])('can save again after deleting the autosave in this campaign (%s)', mode => {
    const game = useGameStore.getState();
    game.newGame();
    expect(game.save().ok).toBe(true);
    if (mode === 'slot') game.deleteSlotSave(0, { stored: localStorage.getItem('imperium-aeternum-save-0') });
    else {
      expect(game.saveToSlot(1).ok).toBe(true);
      if (mode === 'partial') {
        const remove = localStorage.removeItem.bind(localStorage);
        vi.spyOn(localStorage, 'removeItem').mockImplementation(key => {
          if (key.endsWith('-1')) throw new Error('storage unavailable');
          remove(key);
        });
      }
      expect(clearCampaignSaves(snapshotSaveList())).toBe(mode === 'all');
    }
    checkpointBeforeUnload();
    expect(storedSlotRaw(0)).toBeNull();
    game.setTaxRate(0.31);
    expect(game.save().ok).toBe(true);
    expect(loadGameFromSlot(0)?.nations.n01.taxRate).toBe(0.31);
  });

  it.each(['replaced', 'deleted'])('preserves a checkpoint %s in another tab through refresh and save-and-exit', (change) => {
    const store = useGameStore.getState();
    store.newGame();
    store.setTaxRate(0.23);
    expect(checkpointBeforeUnload()).toBe(true);
    const original = storedSlotRaw(0)!;
    expect(JSON.parse(original).gameState.nations.n01.taxRate).toBe(0.23);
    const writes = vi.spyOn(localStorage, 'setItem');
    expect(checkpointBeforeUnload()).toBe(true);
    expect(writes).not.toHaveBeenCalled();

    store.setTaxRate(0.25);
    if (change === 'deleted') expect(deleteSlot(0, original)).toBe(true);
    else expect(saveGameToSlot({ ...useGameStore.getState().state, turn: 12 }, 0, original).ok).toBe(true);
    const external = storedSlotRaw(0);
    expect(checkpointBeforeUnload()).toBe(false);
    expect(store.save().ok).toBe(false);
    expect(saveCampaignForExit()).toContain('槽位已变化');
    expect(store.saveToSlot(2).ok).toBe(true);
    expect(saveCampaignForExit()).toBeNull();
    expect(checkpointBeforeUnload()).toBe(true);
    expect(storedSlotRaw(0)).toBe(external);
    expect(loadGameFromSlot(2)?.nations.n01.taxRate).toBe(0.25);
  });

  it('preserves the last playable save on defeat and does not recreate a discarded campaign', () => {
    const store = useGameStore.getState();
    store.newGame();
    expect(checkpointBeforeUnload()).toBe(true);
    const playable = storedSlotRaw(0);
    useGameStore.setState({ state: { ...useGameStore.getState().state, victory: { type: 'fail_collapse' } } });
    expect(checkpointBeforeUnload()).toBe(false);
    expect(storedSlotRaw(0)).toBe(playable);
    store.backToMenu();
    expect(checkpointBeforeUnload()).toBe(true);
    expect(storedSlotRaw(0)).toBe(playable);
  });

  it('lets the player retry after storage fills up and preserves a different campaign on backgrounding', () => {
    const store = useGameStore.getState();
    store.newGame();
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new DOMException('full', 'QuotaExceededError'); });
    expect(checkpointBeforeUnload()).toBe(false);
    expect(storedSlotRaw(0)).toBeNull();
    expect(checkpointBeforeUnload()).toBe(true);
    const olderCampaign = storedSlotRaw(0);
    store.backToMenu();
    store.newGame();
    store.setTaxRate(0.31);
    expect(checkpointBeforeUnload()).toBe(false);
    expect(storedSlotRaw(0)).toBe(olderCampaign);
  });

  it('continues the same world turn after loading every living AI strategy and memory', () => {
    const state = advanceTurnPipeline(prepareGameState(createWorldState(9103, 'n_ea_qin'))).state;
    expect(Object.keys(state.aiMemory!).length).toBeGreaterThan(180);
    expect(saveGameToSlot(state, 1).ok).toBe(true);
    const loaded = loadGameFromSlot(1)!;
    expect(loaded.aiMemory).toEqual(state.aiMemory);
    expect(loaded.aiStrategyMeta).toEqual(state.aiStrategyMeta);
    expect(advanceTurnPipeline(loaded)).toEqual(advanceTurnPipeline(state));
  });

  it('fits five world checkpoints in one browser quota, preserving JSON identity and stale-write checks', () => {
    const state = prepareGameState(createWorldState(9103, 'n_ea_qin'));
    const put = localStorage.setItem.bind(localStorage);
    const sizes = new Map<string, number>();
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      const otherSize = [...sizes].reduce((sum, [id, size]) => sum + (id === key ? 0 : size), 0);
      const size = 2 * (key.length + value.length);
      if (otherSize + size > 5 * 1024 * 1024) throw new DOMException('full', 'QuotaExceededError');
      put(key, value);
      sizes.set(key, size);
    });
    for (let slot = 0; slot < 5; slot++) {
      expect(saveGameToSlot({ ...state, turn: slot }, slot, null).ok).toBe(true);
    }
    for (let slot = 0; slot < 5; slot++) {
      const read = readSaveGameFromSlot(slot);
      if (!read.ok) throw new Error(read.error);
      expect(read.stored.length).toBeLessThan(read.raw.length / 2);
      expect(JSON.parse(read.raw).gameState.turn).toBe(slot);
      expect(loadGameFromSlot(slot)?.turn).toBe(slot);
    }

    const old = storedSlotRaw(2)!;
    expect(importSaveGameToSlot(2, storedSlotRaw(4)!, old).ok).toBe(true);
    const newer = storedSlotRaw(2)!;
    expect(JSON.parse(newer).gameState.turn).toBe(4);
    expect(importSaveGameToSlot(2, old, old)).toMatchObject({ ok: false, conflict: true });
    expect(saveGameToSlot(state, 2, old).ok).toBe(false);
    expect(deleteSlot(2, old)).toBe(false);
    expect(storedSlotRaw(2)).toBe(newer);
  });

  it('preserves a damaged compressed slot until the exact replacement is confirmed', () => {
    const state = createWorldState(9103, 'n_ea_qin');
    expect(saveGameToSlot(state, 1).ok).toBe(true);
    const key = 'imperium-aeternum-save-1';
    const previous = storedSlotRaw(1)!;
    const damaged = localStorage.getItem(key)!.slice(0, -5);
    localStorage.setItem(key, damaged);
    expect(readSaveGameFromSlot(1).ok).toBe(false);
    expect(loadGameFromSlot(1)).toBeNull();
    expect(storedSlotRaw(1)).toBe(damaged);
    expect(saveGameToSlot(state, 1, previous).ok).toBe(false);
    expect(saveGameToSlot(state, 1, damaged).ok).toBe(true);
    expect(loadGameFromSlot(1)?.playerNationId).toBe(state.playerNationId);
  });

  it('restores older nation tendencies before actions and the tenth-turn decay', () => {
    const state = createInitialState();
    state.turn = 9;
    const player = state.nations[state.playerNationId];
    const other = Object.values(state.nations).find(nation => nation.id !== player.id)!;
    Reflect.deleteProperty(other, 'tendency');
    player.tendency.welfare = 42;
    Reflect.deleteProperty(player.tendency, 'scholarly');
    expect(saveGameToSlot(state, 1).ok).toBe(true);
    const restored = loadGameFromSlot(1)!;
    expect(restored.nations[player.id].tendency).toMatchObject({ welfare: 42, scholarly: 0 });
    expect(advanceTurnPipeline(restored).state.turn).toBe(10);
  });

  it('keeps cultural event rewards through a policy change and repeated save recovery', () => {
    const state = createInitialState();
    const ruler = state.nations[state.playerNationId];
    ruler.resources.gold = 1000;
    applyEffect(ruler, { assimilationMod: 1 }, state);
    expect(enactPolicy(ruler, 'toleration', state).ok).toBe(true);
    expect(ruler.policyMods?.assimilationMod).toBe(9);
    expect(saveGameToSlot(state, 1).ok).toBe(true);
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(loadGameFromSlot(1)?.nations[ruler.id].policyMods?.assimilationMod).toBe(9);
    }
  });

  it('restores exactly one owned capital per realm from stale map markers', () => {
    const state = createInitialState();
    state.provinces.p01.isCapital = false;
    state.provinces.p02.isCapital = true;
    state.nations.n02.capital = 'p01';
    state.provinces.p08.isCapital = true;
    localStorage.setItem('imperium-aeternum-save-1', JSON.stringify({ gameState: state }));
    for (let read = 0; read < 2; read++) {
      const loaded = loadGameFromSlot(1)!;
      for (const [id, capital] of [['n01', 'p01'], ['n02', 'p07']]) {
        expect(loaded.nations[id].capital).toBe(capital);
        expect(Object.values(loaded.provinces).filter(p => p.ownerId === id && p.isCapital).map(p => p.id)).toEqual([capital]);
      }
    }
  });

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

  it.each(['win_economy', 'fail_collapse'])('restores a finished %s campaign without applying queued actions', (ending) => {
    const state = createInitialState();
    state.victory.type = ending;
    state.pendingEvents = [{ nationId: state.playerNationId, eventId: 'evt_famine' }];
    expect(saveGameToSlot(state, 2).ok).toBe(true);
    const store = useGameStore.getState();
    expect(store.loadFromSlot(2)).toBe(true);
    const restored = useGameStore.getState().state;
    expect(restored.victory.type).toBe(ending);
    expect(useGameStore.getState().pendingTab).toBe('dashboard');
    expect(store.nextTurn()).toBeNull();
    store.setTaxRate(0.4);
    store.setStrategyFocus('military');
    expect(store.resolveEvent('evt_famine', 0)).toBe(false);
    expect(useGameStore.getState().state).toBe(restored);

    const won = ending === 'win_economy';
    expect(store.continueLegacy()).toBe(won);
    if (won) {
      expect(store.load()).toBe(true);
      expect(useGameStore.getState().state.legacyMode).toBe(true);
      expect(store.continueLegacy()).toBe(false);
      expect(store.resolveEvent('evt_famine', 0)).toBe(true);
      expect(store.nextTurn()?.turn).toBe(1);
    }
  });

  it('preserves the last playable checkpoint on a periodic save turn that ends in defeat', () => {
    const state = createInitialState();
    expect(saveGameToSlot(state, 0).ok).toBe(true);
    const previous = localStorage.getItem('imperium-aeternum-save-0');
    state.turn = 9;
    state.provinces[state.nations[state.playerNationId].capital].ownerId = 'barbarian';
    useGameStore.setState({ state, scene: 'playing' });
    expect(useGameStore.getState().nextTurn()?.turn).toBe(10);
    expect(useGameStore.getState().state.victory.type).toBe('fail_capital_lost');
    expect(localStorage.getItem('imperium-aeternum-save-0')).toBe(previous);
    expect(useGameStore.getState().load()).toBe(true);
    expect(useGameStore.getState().state.turn).toBe(0);
  });

  it('preserves zero and absent treasury changes independently of the operating balance', () => {
    const state = processTurn(createInitialState()).state;
    const current = { ...state.lastReport!, goldDelta: 0 };
    const legacy: TurnReport = { ...current, turn: 0 };
    delete legacy.goldDelta;
    expect(operatingNet(current)).toBeGreaterThan(0);
    expect(saveGameToSlot({ ...state, history: [legacy, current], lastReport: current }, 1).ok).toBe(true);
    const loaded = loadGameFromSlot(1)!;
    expect(loaded.history.map(report => report.goldDelta)).toEqual([undefined, 0]);
    expect(loaded.history.map(operatingNet)).toEqual([operatingNet(current), operatingNet(current)]);
  });

  it('protects a different local version after confirmation and in a previously empty slot', () => {
    const state = createInitialState();
    const key = 'imperium-aeternum-save-1';
    expect(saveGameToSlot(state, 1, null).ok).toBe(true);
    const first = localStorage.getItem(key)!;
    expect(saveGameToSlot({ ...state, turn: 5 }, 1, first).ok).toBe(true);
    const latest = localStorage.getItem(key)!;
    expect(saveGameToSlot(state, 1, null).ok).toBe(false);
    expect(saveGameToSlot(state, 1, first).ok).toBe(false);
    expect(deleteSlot(1, first)).toBe(false);
    expect(localStorage.getItem(key)).toBe(latest);
    expect(deleteSlot(1, latest)).toBe(true);
  });

  it('reports partial deletion and leaves failed slots visible', () => {
    for (const slot of [1, 2]) expect(saveGameToSlot(createInitialState(), slot).ok).toBe(true);
    const remove = localStorage.removeItem.bind(localStorage);
    vi.spyOn(localStorage, 'removeItem').mockImplementation(key => {
      if (key.endsWith('-1')) throw new Error('storage unavailable');
      remove(key);
    });
    expect(clearAllSaves()).toBe(false);
    expect(loadGameFromSlot(1)).not.toBeNull();
    expect(loadGameFromSlot(2)).toBeNull();
  });

  it('preserves the whole reviewed list if another tab replaces or fills a slot during bulk confirmation', () => {
    const state = createInitialState();
    saveGameToSlot(state, 1);
    saveGameToSlot(state, 2);
    const reviewed = snapshotSaveList();
    saveGameToSlot({ ...state, turn: 12 }, 1);
    saveGameToSlot({ ...state, turn: 20 }, 3);
    expect(clearAllSaves(reviewed)).toBe(false);
    expect(loadGameFromSlot(1)?.turn).toBe(12);
    expect(loadGameFromSlot(2)?.turn).toBe(0);
    expect(loadGameFromSlot(3)?.turn).toBe(20);
  });

  it('keeps the current campaign open when a displayed slot has been replaced before loading', () => {
    const store = useGameStore.getState();
    store.newGame();
    const current = useGameStore.getState().state;
    const saved = saveGameToSlot(current, 1);
    if (!saved.ok) throw new Error(saved.error);
    expect(saveGameToSlot({ ...current, turn: 11 }, 1).ok).toBe(true);
    expect(store.loadFromSlot(1, saved.stored)).toBe(false);
    expect(useGameStore.getState().state).toBe(current);
    expect(store.loadFromSlot(1, localStorage.getItem('imperium-aeternum-save-1'))).toBe(true);
    expect(useGameStore.getState().state.turn).toBe(11);
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

  it('loads a readable legacy slot even when the browser refuses migration writeback', () => {
    const state = createInitialState();
    state.turn = 9;
    const raw = JSON.stringify({ version: 4, createdAt: '2025-01-01', gameState: state });
    const key = 'imperium-aeternum-save-2';
    localStorage.setItem(key, raw);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });

    expect(loadGameFromSlot(2)?.turn).toBe(9);
    expect(localStorage.getItem(key)).toBe(raw);
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

  it('upgrades both archived and current reports in versionless first-generation saves', () => {
    const state = processTurn(createInitialState()).state;
    const raw = JSON.stringify({ gameState: state }, (key, value) =>
      ['warProgress', 'factionDelta', 'exhaustSnapshot', 'worldEvents', 'provinceChanges', 'strategicNotes'].includes(key) ? undefined : value);
    localStorage.setItem('imperium-aeternum-save-1', raw);

    const loaded = loadGameFromSlot(1);
    const expected = { warProgress: [], factionDelta: [], exhaustSnapshot: 0, worldEvents: [], provinceChanges: [], strategicNotes: [] };
    expect(loaded?.lastReport).toMatchObject(expected);
    expect(loaded?.history[0]).toMatchObject(expected);
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
