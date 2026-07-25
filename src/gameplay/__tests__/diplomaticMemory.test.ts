import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { improveRelationAction, espionageAction } from '../actions';
import { getDiplomaticMemoryBrief } from '../diplomaticMemory';

describe('diplomatic memory', () => {
  it('records goodwill and grudges from player actions', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.adminPt = 10;
    state.nations[state.playerNationId].resources.influence = 200;
    const targetId = state.relations.find((relation) => relation.from === state.playerNationId)?.to;
    expect(targetId).toBeTruthy();

    const goodwill = improveRelationAction(state, targetId!);
    expect(goodwill.ok).toBe(true);
    expect(getDiplomaticMemoryBrief(goodwill.state, targetId!).attitude).toBe('neutral');
    expect(getDiplomaticMemoryBrief(goodwill.state, targetId!).recent[0]?.kind).toBe('envoy');

    const grievance = espionageAction(goodwill.state, targetId!, 'spy_military');
    expect(grievance.ok).toBe(true);
    const brief = getDiplomaticMemoryBrief(grievance.state, targetId!);
    expect(brief.score).toBeLessThan(0);
    expect(brief.recent.map((incident) => incident.kind)).toEqual(['envoy', 'espionage']);
  });
});
