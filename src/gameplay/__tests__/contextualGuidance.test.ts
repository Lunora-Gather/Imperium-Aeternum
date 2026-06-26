import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildContextualGuidance } from '../contextualGuidance';
import type { GameState, TurnReport } from '../../types/game';

function report(state: GameState, patch: Partial<TurnReport> = {}): TurnReport {
  return {
    turn: state.turn,
    nationId: state.playerNationId,
    income: { tax: 50, trade: 5, building: 5 },
    expense: { military: 20, corruption: 5 },
    foodDelta: 10,
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

describe('contextual guidance', () => {
  it('starts with route guidance on a fresh first turn', () => {
    const state = createInitialState();
    state.turn = 1;
    state.lastReport = null;

    const guidance = buildContextualGuidance(state);

    expect(guidance.primary.id).toBe('first-route');
    expect(guidance.primary.tone).toBe('gold');
    expect(guidance.summary).toContain('主线');
  });

  it('prioritizes pending events over normal advice', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'test_event' });

    const guidance = buildContextualGuidance(state);

    expect(guidance.primary.id).toBe('pending-events');
    expect(guidance.primary.tone).toBe('danger');
    expect(guidance.primary.tab).toBe('dashboard');
  });

  it('teaches the player to fix economy before continuing when finance is red', () => {
    const state = createInitialState();
    state.turn = 4;
    state.lastReport = report(state, { income: { tax: 5, trade: 0, building: 0 }, expense: { military: 80, corruption: 20 } });
    state.nations[state.playerNationId].resources.gold = -30;

    const guidance = buildContextualGuidance(state);

    expect(guidance.tips.map((x) => x.id)).toContain('economy-red');
    expect(guidance.primary.id).toBe('economy-red');
    expect(guidance.primary.tab).toBe('economy');
  });

  it('detects war and save guidance together', () => {
    const state = createInitialState();
    const target = Object.values(state.provinces).find((p) => p.ownerId !== state.playerNationId)!;
    state.wars.push({ id: 'guidance-war', attackerId: state.playerNationId, defenderId: target.ownerId, targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [] });

    const guidance = buildContextualGuidance(state);

    expect(guidance.tips.map((x) => x.id)).toEqual(expect.arrayContaining(['war-first', 'save-window']));
    expect(guidance.tips.find((x) => x.id === 'war-first')?.tab).toBe('military');
  });

  it('uses report and chronicle context after the first years', () => {
    const state = createInitialState();
    state.turn = 12;
    state.lastReport = report(state, { foodDelta: -60, warnings: ['粮食短缺'] });
    state.chronicle = [
      { turn: 1, kind: 'founding', title: '开国', desc: '立国' },
      { turn: 4, kind: 'expansion', title: '疆土达 3 省', desc: '扩张' },
      { turn: 8, kind: 'crisis', title: '财政危机', desc: '赤字' },
    ];

    const guidance = buildContextualGuidance(state);

    expect(guidance.tips.map((x) => x.id)).toEqual(expect.arrayContaining(['food-red', 'read-report', 'chronicle-learning']));
  });
});
