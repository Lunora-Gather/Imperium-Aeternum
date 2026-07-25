import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { applyNationalPurposeAfterTurn, getNationalCrisisView, getNationalMissionView, initializeNationalPurpose } from '../nationalPurpose';

describe('national purpose progression', () => {
  it('assigns a mission and grants only one completed chapter per turn', () => {
    const state = initializeNationalPurpose(createInitialState());
    const meta = state.nationalMission!;
    const player = state.nations[state.playerNationId];
    state.turn = meta.startedTurn + 2;
    player.government.stability = 60;
    player.government.legitimacy = 60;
    meta.lastEvaluatedTurn = state.turn - 1;

    const result = applyNationalPurposeAfterTurn(state);
    const view = getNationalMissionView(result.state);

    expect(result.state.nationalMission?.completedStages).toEqual(['foundation']);
    expect(view.completed).toBe(1);
    expect(result.notes[0]).toContain('国家使命完成');
    expect(player.resources.adminPt).not.toBe(result.state.nations[state.playerNationId].resources.adminPt);
  });

  it('starts, escalates and resolves a fiscal crisis through safe years', () => {
    let state = initializeNationalPurpose(createInitialState());
    const playerId = state.playerNationId;
    state.turn = 1;
    state.nations[playerId].resources.gold = -200;
    state.nationalMission!.lastEvaluatedTurn = 1;
    state = applyNationalPurposeAfterTurn(state).state;
    expect(getNationalCrisisView(state)?.kind).toBe('fiscal');

    state.turn = 4;
    state.nations[playerId].resources.gold = -300;
    state = applyNationalPurposeAfterTurn(state).state;
    expect(getNationalCrisisView(state)?.stage).toBeGreaterThanOrEqual(2);

    state.turn = 5;
    state.nations[playerId].resources.gold = 200;
    state.nations[playerId].resources.food = 200;
    state = applyNationalPurposeAfterTurn(state).state;
    expect(state.nationalCrisis?.recoveryTurns).toBe(1);

    state.turn = 6;
    const resolved = applyNationalPurposeAfterTurn(state);
    expect(resolved.state.nationalCrisis).toBeUndefined();
    expect(resolved.notes.join(' ')).toContain('国家危机化解');
  });
});
