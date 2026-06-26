import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildCommandCenterActions } from '../commandCenterActions';
import type { GameState, TurnReport } from '../../types/game';

function report(state: GameState, patch: Partial<TurnReport> = {}): TurnReport {
  return {
    turn: state.turn + 1,
    nationId: state.playerNationId,
    income: { tax: 30, trade: 5, building: 5 },
    expense: { military: 20, corruption: 4 },
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
    ...patch,
  };
}

describe('command center actions', () => {
  it('always provides actionable fallback items for a quiet opening state', () => {
    const state = createInitialState();

    const actions = buildCommandCenterActions(state);

    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions.every((a) => a.label && a.desc && a.tab)).toBe(true);
  });

  it('prioritizes hard readiness blockers over report and strategy suggestions', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'test_event' });
    state.lastReport = report(state, { income: { tax: 10, trade: 0, building: 0 }, expense: { military: 80, corruption: 0 } });

    const actions = buildCommandCenterActions(state);

    expect(actions[0].source).toBe('readiness');
    expect(actions[0].tone).toBe('danger');
  });

  it('surfaces year-report action routing when no readiness blocker exists', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.gold = 50;
    state.lastReport = report(state, { income: { tax: 5, trade: 0, building: 0 }, expense: { military: 80, corruption: 0 } });

    const actions = buildCommandCenterActions(state);

    expect(actions.some((a) => a.source === 'report' && a.tab === 'economy')).toBe(true);
  });

  it('deduplicates actions and respects the requested limit', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.gold = -20;
    state.lastReport = report(state, { income: { tax: 0, trade: 0, building: 0 }, expense: { military: 100, corruption: 20 } });

    const actions = buildCommandCenterActions(state, 3);
    const keys = actions.map((a) => `${a.id}|${a.tab}`);

    expect(actions).toHaveLength(3);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
