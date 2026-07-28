import { describe, expect, it } from 'vitest';
import { createInitialState, createWorldState } from '../../engine/init';
import { applyAmbitionsAfterTurn, getAmbitionSnapshot, syncAmbitionMeta } from '../ambitions';
import { advanceTurnPipeline } from '../turnPipeline';
import type { GameState } from '../../types/game';

function player(state: GameState) {
  return state.nations[state.playerNationId];
}

function establishEconomicFoundation(state: GameState): void {
  const owned = Object.values(state.provinces).filter((province) => province.ownerId === state.playerNationId);
  const target = getAmbitionSnapshot(state).economy.buildingTarget;
  for (let index = 0; index < target; index += 1) {
    const province = owned[index % owned.length];
    province.buildings.push({ id: `victory-building-${index}`, defId: 'farm', provinceId: province.id, level: 1 });
  }
  player(state).activeTradeRoutes = [{ routeId: 'silk_road', establishedTurn: state.turn }];
}

describe('ambition progress synchronization', () => {
  it('materializes ambition metadata before the first turn so UI progress has a persisted baseline', () => {
    const state = createInitialState() as GameState & { ambitionMeta?: unknown };
    expect(state.ambitionMeta).toBeUndefined();

    const synced = syncAmbitionMeta(state) as GameState & { ambitionMeta?: { playerNationId: string; startTurn: number; lastProgressTurn?: number } };

    expect(synced).not.toBe(state);
    expect(synced.ambitionMeta?.playerNationId).toBe(synced.playerNationId);
    expect(synced.ambitionMeta?.startTurn).toBe(synced.turn);
    expect(synced.ambitionMeta?.lastProgressTurn).toBe(synced.turn);
    expect(getAmbitionSnapshot(synced).economy.turns).toBe(0);
  });

  it('classifies the 50-province classic map as local and scales world goals materially higher', () => {
    const classic = getAmbitionSnapshot(syncAmbitionMeta(createInitialState()));
    const world = getAmbitionSnapshot(syncAmbitionMeta(createWorldState(8001, 'n_ea_qin')));

    expect(classic.worldScale).toBe('local');
    expect(classic.economy.target).toBeGreaterThanOrEqual(5000);
    expect(world.worldScale).toBe('world');
    expect(world.economy.target).toBeGreaterThanOrEqual(25000);
    expect(world.economy.needTurns).toBeGreaterThan(classic.economy.needTurns);
  });

  it('uses scenario-specific targets for campaigns with the same regional map scale', () => {
    const mediterranean = createWorldState(8101, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n']);
    mediterranean.scenarioId = 'w5_mediterranean';
    const trade = createWorldState(8102, 'n_sa_maurya', ['asia_south', 'africa_e', 'middle_east']);
    trade.scenarioId = 'w8_indianocean';

    const conquest = getAmbitionSnapshot(syncAmbitionMeta(mediterranean));
    const commerce = getAmbitionSnapshot(syncAmbitionMeta(trade));

    expect(conquest.conquest.target).toBeGreaterThan(conquest.conquest.current);
    expect(commerce.economy.target).toBeLessThanOrEqual(conquest.economy.target);
    expect(commerce.economy.needTurns).toBeLessThan(conquest.economy.needTurns);
  });

  it('advances economy and eternal counters once per turn and is idempotent for repeated syncs', () => {
    const base = syncAmbitionMeta(createInitialState()) as GameState & { ambitionMeta: { economyTurns: number; peaceTurns: number; lastProgressTurn?: number } };
    player(base).resources.gold = 5000;
    player(base).government.stability = 70;
    player(base).government.legitimacy = 70;
    establishEconomicFoundation(base);

    const turnAdvanced = { ...base, turn: base.turn + 1 };
    const first = applyAmbitionsAfterTurn(turnAdvanced).state as GameState & { ambitionMeta: { economyTurns: number; peaceTurns: number; lastProgressTurn?: number } };
    const second = applyAmbitionsAfterTurn(first).state as GameState & { ambitionMeta: { economyTurns: number; peaceTurns: number; lastProgressTurn?: number } };

    expect(first.ambitionMeta.economyTurns).toBe(1);
    expect(first.ambitionMeta.peaceTurns).toBe(1);
    expect(first.ambitionMeta.lastProgressTurn).toBe(turnAdvanced.turn);
    expect(second.ambitionMeta.economyTurns).toBe(1);
    expect(second.ambitionMeta.peaceTurns).toBe(1);
  });

  it('resets peace progress while at war without resetting the ambition baseline', () => {
    const base = syncAmbitionMeta(createInitialState()) as GameState & { ambitionMeta: { startProvinces: number; peaceTurns: number } };
    base.ambitionMeta.peaceTurns = 4;
    player(base).government.stability = 70;
    player(base).government.legitimacy = 70;
    base.wars = [{ id: 'w_test', attackerId: base.playerNationId, defenderId: 'n02', targetProvinceId: 'p02', progress: 10, turns: 0, battleReports: [] }];

    const applied = applyAmbitionsAfterTurn({ ...base, turn: base.turn + 1 }).state as GameState & { ambitionMeta: { startProvinces: number; peaceTurns: number } };

    expect(applied.ambitionMeta.startProvinces).toBe(base.ambitionMeta.startProvinces);
    expect(applied.ambitionMeta.peaceTurns).toBe(0);
  });

  it('does not award the retired 7-province conquest victory before the displayed 9-province goal', () => {
    const state = syncAmbitionMeta(createInitialState());
    const extra = Object.values(state.provinces).find((province) => province.ownerId !== state.playerNationId && !province.isCapital);
    expect(extra).toBeTruthy();
    if (!extra) return;
    extra.ownerId = state.playerNationId;

    const result = advanceTurnPipeline(state);
    const snapshot = getAmbitionSnapshot(result.state);

    expect(snapshot.conquest.current).toBe(7);
    expect(snapshot.conquest.target).toBe(9);
    expect(result.state.victory.type).toBeNull();
  });

  it('does not emit an old-threshold correction note at 2000 gold', () => {
    const state = syncAmbitionMeta(createInitialState());
    player(state).resources.gold = 2500;
    player(state).government.stability = 70;
    const result = advanceTurnPipeline(state);

    expect(result.state.victory.type).toBeNull();
    expect(result.notes).not.toContain('国运目标已按剧本体量重算，旧式过早胜利已延后。');
  });

  it.each([
    ['classic', () => createInitialState()],
    ['regional', () => createWorldState(8201, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n'])],
    ['world', () => createWorldState(8202, 'n_ea_qin')],
  ])('%s economy victory requires the displayed target and full maintenance duration', (_label, create) => {
    const state = syncAmbitionMeta(create());
    const snapshot = getAmbitionSnapshot(state);
    const meta = state.ambitionMeta;
    expect(meta).toBeDefined();
    if (!meta) return;
    player(state).resources.gold = snapshot.economy.target;
    player(state).government.stability = 70;
    establishEconomicFoundation(state);
    meta.economyTurns = snapshot.economy.needTurns - 2;
    meta.lastProgressTurn = state.turn;

    const penultimate = applyAmbitionsAfterTurn({ ...state, turn: state.turn + 1 }).state;
    expect(getAmbitionSnapshot(penultimate).economy.turns).toBe(snapshot.economy.needTurns - 1);
    expect(penultimate.victory.type).toBeNull();

    const final = applyAmbitionsAfterTurn({ ...penultimate, turn: penultimate.turn + 1 }).state;
    expect(getAmbitionSnapshot(final).economy.done).toBe(true);
    expect(final.victory.type).toBe('win_economy');
  });

  it('does not award passive economic victory without buildings and trade', () => {
    const state = syncAmbitionMeta(createInitialState());
    const snapshot = getAmbitionSnapshot(state);
    const meta = state.ambitionMeta;
    expect(meta).toBeDefined();
    if (!meta) return;
    player(state).resources.gold = snapshot.economy.target * 2;
    player(state).government.stability = 80;
    meta.economyTurns = snapshot.economy.needTurns;

    const result = applyAmbitionsAfterTurn({ ...state, turn: state.turn + 1 }).state;

    expect(getAmbitionSnapshot(result).economy.foundationDone).toBe(false);
    expect(result.victory.type).toBeNull();
  });

  it('does not repeat victory awards after the player enters legacy mode', () => {
    const state = syncAmbitionMeta(createInitialState());
    const snapshot = getAmbitionSnapshot(state);
    const meta = state.ambitionMeta;
    expect(meta).toBeDefined();
    if (!meta) return;
    player(state).resources.gold = snapshot.economy.target;
    player(state).government.stability = 70;
    establishEconomicFoundation(state);
    meta.economyTurns = snapshot.economy.needTurns;
    state.legacyMode = true;

    const result = applyAmbitionsAfterTurn({ ...state, turn: state.turn + 1 }).state;

    expect(result.victory.type).toBeNull();
    expect(result.legacyMode).toBe(true);
  });
});
