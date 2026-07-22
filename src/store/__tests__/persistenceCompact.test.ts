import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { EVENTS } from '../../data/events';
import { compactGameStateForSave } from '../persistence';

describe('compactGameStateForSave', () => {
  it('drops transient relation maps and caps long-running arrays without losing core state', () => {
    const state = createInitialState();
    state.history = Array.from({ length: 20 }, (_, i) => ({
      turn: i,
      nationId: state.playerNationId,
      income: { tax: 0, trade: 0, building: 0 },
      expense: { military: 0, corruption: 0 },
      foodDelta: 0,
      popDelta: 0,
      stabilityDelta: 0,
      legitimacyDelta: 0,
      unrestDelta: 0,
      events: [],
      warnings: [],
      warProgress: [],
      factionDelta: [],
      exhaustSnapshot: 0,
      worldEvents: [],
      provinceChanges: [],
    }));
    state.triggeredEvents = Array.from({ length: 1200 }, (_, i) => ({ eventId: `e_${i}`, turn: i, optionIndex: 0 }));
    state.turn = 1000;
    state.eventCooldowns = [
      { eventId: EVENTS[0].id, lastTriggeredTurn: 999 },
      { eventId: 'removed_event', lastTriggeredTurn: 999 },
    ];
    state.chronicle = Array.from({ length: 100 }, (_, i) => ({ turn: i, kind: 'founding', title: `t${i}`, desc: `d${i}` }));
    state._relMap = new Map();

    const compact = compactGameStateForSave(state);

    expect(compact.playerNationId).toBe(state.playerNationId);
    expect(compact.nations[state.playerNationId]).toBeTruthy();
    expect(compact._relMap).toBeUndefined();
    expect(compact.history).toHaveLength(10);
    expect(compact.triggeredEvents).toHaveLength(1000);
    expect(compact.eventCooldowns).toEqual([{ eventId: EVENTS[0].id, lastTriggeredTurn: 999 }]);
    expect(compact.chronicle).toHaveLength(80);
  });
});
