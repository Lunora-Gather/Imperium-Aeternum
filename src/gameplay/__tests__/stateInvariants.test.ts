import { describe, expect, it } from 'vitest';
import { createInitialState, createWorldState } from '../../engine/init';
import { auditStateInvariants, invariantErrors } from '../stateInvariants';
import { advanceTurnPipeline, prepareGameState } from '../turnPipeline';

describe('GameState invariants', () => {
  it('accepts prepared classic and world states', () => {
    const classic = prepareGameState(createInitialState());
    const world = prepareGameState(createWorldState(7777, 'n_ea_qin'));

    expect(invariantErrors(classic)).toEqual([]);
    expect(invariantErrors(world)).toEqual([]);
  });

  it('keeps invariants across several complete classic turns', () => {
    let state = prepareGameState(createInitialState());
    for (let turn = 0; turn < 5; turn += 1) {
      state = advanceTurnPipeline(state).state;
      expect(invariantErrors(state), `turn ${state.turn}`).toEqual([]);
    }
  });

  it('reports corrupted ownership, player markers and numeric state', () => {
    const state = prepareGameState(createInitialState());
    state.nations.n02.isPlayer = true;
    state.provinces.p01.ownerId = 'missing-owner';
    state.nations[state.playerNationId].resources.gold = Number.NaN;

    const ids = auditStateInvariants(state).map((issue) => issue.id);
    expect(ids).toEqual(expect.arrayContaining(['player-marker-mismatch', 'province-owner-invalid', 'nation-number-invalid']));
  });

  it('rejects an entity counter that trails persisted ids', () => {
    const state = prepareGameState(createInitialState());
    state.provinces.p01.buildings.push({ id: 'entity_a_building', defId: 'farm', provinceId: 'p01', level: 1 });
    state.entityIdCounter = 2;

    expect(auditStateInvariants(state).map((issue) => issue.id)).toContain('entity-id-counter-stale');
  });
});
