import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { applyAmbitionsAfterTurn, getAmbitionSnapshot, syncAmbitionMeta } from '../ambitions';
import type { GameState } from '../../types/game';

function player(state: GameState) {
  return state.nations[state.playerNationId];
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

  it('advances economy and eternal counters once per turn and is idempotent for repeated syncs', () => {
    const base = syncAmbitionMeta(createInitialState()) as GameState & { ambitionMeta: { economyTurns: number; peaceTurns: number; lastProgressTurn?: number } };
    player(base).resources.gold = 5000;
    player(base).government.stability = 70;
    player(base).government.legitimacy = 70;

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
});
