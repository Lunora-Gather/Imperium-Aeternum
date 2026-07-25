import { describe, expect, it } from 'vitest';
import { createInitialState, getRelationObj } from '../init';
import { improveRelationAction } from '../../gameplay/actions';

describe('relation lookup on immutable action snapshots', () => {
  it('uses an external cache when Immer freezes the returned state', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.adminPt = 5;
    state.nations[state.playerNationId].resources.influence = 100;
    const targetId = state.relations.find((relation) => relation.from === state.playerNationId)!.to;

    const result = improveRelationAction(state, targetId);

    expect(result.ok).toBe(true);
    expect(Object.isFrozen(result.state)).toBe(true);
    expect(() => getRelationObj(state.playerNationId, targetId, result.state)).not.toThrow();
    expect(getRelationObj(state.playerNationId, targetId, result.state)?.relation).toBeDefined();
  });
});
