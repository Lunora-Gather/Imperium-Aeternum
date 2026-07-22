import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { resolveFailuresAndRebellions } from '../turnConsequences';

describe('turn failure consequences', () => {
  it('requires three consecutive bankrupt turns and resets the counter after recovery', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.resources.gold = -1;

    resolveFailuresAndRebellions(state, player.id);
    expect(state.bankruptTurns).toBe(1);
    expect(state.victory.type).toBeNull();

    player.resources.gold = 1;
    resolveFailuresAndRebellions(state, player.id);
    expect(state.bankruptTurns).toBe(0);

    player.resources.gold = -1;
    resolveFailuresAndRebellions(state, player.id);
    resolveFailuresAndRebellions(state, player.id);
    resolveFailuresAndRebellions(state, player.id);
    expect(state.victory.type).toBe('fail_bankrupt');
  });

  it('fails immediately when the player loses the capital', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    state.provinces[player.capital].ownerId = 'n02';

    resolveFailuresAndRebellions(state, player.id);

    expect(state.victory.type).toBe('fail_capital_lost');
  });
});
