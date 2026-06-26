import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildTurnDebrief } from '../turnDebrief';
import type { GameState, TurnReport } from '../../types/game';

function report(state: GameState, patch: Partial<TurnReport> = {}): TurnReport {
  return {
    turn: state.turn + 1,
    nationId: state.playerNationId,
    income: { tax: 50, trade: 10, building: 10 },
    expense: { military: 20, corruption: 5 },
    foodDelta: 20,
    popDelta: 5,
    stabilityDelta: 2,
    legitimacyDelta: 1,
    unrestDelta: -1,
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

describe('turn debrief', () => {
  it('returns null before the first report', () => {
    const state = createInitialState();
    state.lastReport = null;

    expect(buildTurnDebrief(state)).toBeNull();
  });

  it('summarizes a good year with improved points', () => {
    const state = createInitialState();
    state.lastReport = report(state);

    const debrief = buildTurnDebrief(state)!;

    expect(debrief.score).toBeGreaterThan(60);
    expect(debrief.tone).toMatch(/good|gold/);
    expect(debrief.improved.map((x) => x.id)).toEqual(expect.arrayContaining(['net-positive', 'food-positive']));
    expect(debrief.route.label).toContain('路线');
  });

  it('summarizes a bad year with worsened points and next focus', () => {
    const state = createInitialState();
    state.lastReport = report(state, {
      income: { tax: 5, trade: 0, building: 0 },
      expense: { military: 80, corruption: 20 },
      foodDelta: -80,
      stabilityDelta: -6,
      legitimacyDelta: -2,
      unrestDelta: 5,
      warnings: ['财政吃紧'],
    });

    const debrief = buildTurnDebrief(state)!;

    expect(debrief.tone).toMatch(/warn|danger/);
    expect(debrief.worsened.map((x) => x.id)).toEqual(expect.arrayContaining(['net-negative', 'food-negative']));
    expect(debrief.nextFocus.title.length).toBeGreaterThan(1);
  });

  it('tracks gained and lost provinces', () => {
    const state = createInitialState();
    state.lastReport = report(state, {
      provinceChanges: [
        { id: 'p1', name: '新省', from: 'n02', to: state.playerNationId },
        { id: 'p2', name: '旧省', from: state.playerNationId, to: 'n03' },
      ],
    });

    const debrief = buildTurnDebrief(state)!;

    expect(debrief.improved.some((x) => x.id === 'province-gained')).toBe(true);
    expect(debrief.worsened.some((x) => x.id === 'province-lost')).toBe(true);
  });
});
