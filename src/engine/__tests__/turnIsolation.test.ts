import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { cloneGameStateForTurn, processTurnIsolated } from '../turnIsolation';

function stableSnapshot(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

describe('turn isolation boundary', () => {
  it('deep-clones game state data and drops transient relation cache', () => {
    const state = createInitialState();
    state._relMap = new Map();

    const clone = cloneGameStateForTurn(state);

    expect(clone).not.toBe(state);
    expect(clone.nations).not.toBe(state.nations);
    expect(clone.nations[state.playerNationId]).not.toBe(state.nations[state.playerNationId]);
    expect(clone.provinces).not.toBe(state.provinces);
    expect(clone.provinces.p01).not.toBe(state.provinces.p01);
    expect(clone.relations).not.toBe(state.relations);
    expect(clone.wars).not.toBe(state.wars);
    expect(clone._relMap).toBeUndefined();
  });

  it('runs a turn without mutating the caller-provided state', () => {
    const before = createInitialState();
    const snapshot = stableSnapshot({ ...before, _relMap: undefined });

    const result = processTurnIsolated(before);
    const afterCall = stableSnapshot({ ...before, _relMap: undefined });

    expect(afterCall).toEqual(snapshot);
    expect(result.state).not.toBe(before);
    expect(result.state.turn).toBe(before.turn + 1);
    expect(result.report.turn).toBe(result.state.turn);
  });
});
