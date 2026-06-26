import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildTurnReportActions } from '../turnReportActions';
import type { GameState, TurnReport } from '../../types/game';
import type { StrategicBrief } from '../strategicAdvisor';

function report(state: GameState, patch: Partial<TurnReport> = {}): TurnReport {
  return {
    turn: state.turn + 1,
    nationId: state.playerNationId,
    income: { tax: 40, trade: 10, building: 5 },
    expense: { military: 20, corruption: 5 },
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

function brief(): StrategicBrief {
  return {
    phase: '测试期',
    doctrine: '测试 doctrine',
    doctrineBody: '测试 body',
    score: 70,
    scoreLabel: '稳健',
    urgent: [{ title: '复用战略简报', body: '来自预计算 brief', tab: 'tech', level: 66, tone: 'warn', reason: 'test' }],
    opportunities: [],
    horizon: [],
    risks: [],
  };
}

describe('turn report action routing', () => {
  it('falls back to dashboard when there is no report', () => {
    const state = createInitialState();
    state.lastReport = null;

    const actions = buildTurnReportActions(state);

    expect(actions[0]).toMatchObject({ id: 'no-report', tab: 'dashboard' });
  });

  it('prioritizes economy when the treasury is negative', () => {
    const state = createInitialState();
    state.lastReport = report(state);
    state.nations[state.playerNationId].resources.gold = -10;

    const actions = buildTurnReportActions(state);

    expect(actions[0]).toMatchObject({ id: 'gold-negative', tab: 'economy', tone: 'danger' });
  });

  it('routes lost province reports to military response', () => {
    const state = createInitialState();
    const province = Object.values(state.provinces).find((p) => p.ownerId === state.playerNationId)!;
    state.lastReport = report(state, { provinceChanges: [{ id: province.id, name: province.name, from: state.playerNationId, to: 'n02' }] });

    const actions = buildTurnReportActions(state);

    expect(actions.map((a) => a.id)).toContain('lost-province');
    expect(actions.find((a) => a.id === 'lost-province')).toMatchObject({ tab: 'military', tone: 'danger' });
  });

  it('routes quiet wars to military when there is no yearly progress', () => {
    const state = createInitialState();
    const target = Object.values(state.provinces).find((p) => p.ownerId !== state.playerNationId)!;
    state.wars.push({ id: 'w-test', attackerId: state.playerNationId, defenderId: target.ownerId, targetProvinceId: target.id, progress: 5, turns: 1, battleReports: [] });
    state.lastReport = report(state, { warProgress: [] });

    const actions = buildTurnReportActions(state);

    expect(actions.find((a) => a.id === 'silent-front')).toMatchObject({ tab: 'military' });
  });

  it('keeps action ids unique after strategic brief merge', () => {
    const state = createInitialState();
    state.lastReport = report(state, { worldEvents: ['邻国宣布扩张战略，觊觎边境。'] });

    const actions = buildTurnReportActions(state);
    const ids = actions.map((a) => `${a.id}|${a.tab}`);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('can reuse a precomputed strategic brief', () => {
    const state = createInitialState();
    state.lastReport = report(state);

    const actions = buildTurnReportActions(state, { brief: brief() });

    expect(actions).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'brief-复用战略简报', tab: 'tech' })]));
  });
});
