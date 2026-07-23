import { describe, expect, it } from 'vitest';
import { createInitialState, createWorldState } from '../init';
import { processAITurn } from '../ai';
import { cloneGameState } from '../stateClone';
import { processTurn } from '../turn';

describe('shared world turn isolation', () => {
  it('does not let AI issue orders for a human-controlled nation', () => {
    const state = createWorldState(20260722);
    const humanId = 'n_med_rome';
    expect(state.nations[humanId]).toBeDefined();
    for (const nation of Object.values(state.nations)) {
      nation.isPlayer = false;
      if (nation.id !== humanId) nation.defeated = true;
    }
    const before = cloneGameState(state).nations[humanId];
    processAITurn(state, new Set([humanId]));
    expect(state.nations[humanId]).toEqual(before);
  });

  it('does not end the whole shared world on one ruler single-player failure', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    state.provinces[player.capital].ownerId = Object.keys(state.nations).find((id) => id !== player.id)!;
    expect(processTurn(cloneGameState(state)).state.victory.type).toBe('fail_capital_lost');
    expect(processTurn(cloneGameState(state), { sharedWorld: true, humanNationIds: [state.playerNationId] }).state.victory.type).toBeNull();
  });
});
