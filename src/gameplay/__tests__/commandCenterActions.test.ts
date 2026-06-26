import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildCommandCenterActions } from '../commandCenterActions';
import { buildReadinessReport } from '../readiness';
import type { GameState, TurnReport } from '../../types/game';
import type { StrategicBrief } from '../strategicAdvisor';
import type { TurnReportAction } from '../turnReportActions';

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

function brief(urgent: StrategicBrief['urgent'] = [{ title: '预计算战略', body: '来自 brief 上下文', tab: 'tech', level: 77, tone: 'warn', reason: 'test' }]): StrategicBrief {
  return {
    phase: '测试期',
    doctrine: '测试 doctrine',
    doctrineBody: '测试 body',
    score: 70,
    scoreLabel: '稳健',
    urgent,
    opportunities: [],
    horizon: [],
    risks: [],
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

  it('can reuse precomputed diagnostics and report actions', () => {
    const state = createInitialState();
    const readiness = buildReadinessReport(state);
    const reportActions: TurnReportAction[] = [{ id: 'precomputed-report', title: '预计算年报', body: '来自 reportActions 上下文', tab: 'economy', level: 80, tone: 'warn', tag: '建议' }];

    const actions = buildCommandCenterActions(state, 5, { readiness, brief: brief(), reportActions });

    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'report-precomputed-report', source: 'report', tab: 'economy' }),
      expect.objectContaining({ id: 'strategy-预计算战略', source: 'strategy', tab: 'tech' }),
    ]));
  });

  it('filters useless no-report actions on the dashboard command center', () => {
    const state = createInitialState();
    const readiness = { ...buildReadinessReport(state), blockers: [], warnings: [], advice: [] };
    const reportActions: TurnReportAction[] = [{ id: 'no-report', title: '先回总览', body: '尚无年度报告。', tab: 'dashboard', level: 20, tone: 'info', tag: '规划' }];

    const actions = buildCommandCenterActions(state, 5, { readiness, brief: brief([]), reportActions });

    expect(actions.some((a) => a.id === 'report-no-report')).toBe(false);
    expect(actions.some((a) => a.label === '先回总览')).toBe(false);
    expect(actions.some((a) => a.source === 'fallback')).toBe(true);
  });

  it('uses situation-aware fallback actions when there is a war', () => {
    const state = createInitialState();
    const target = Object.values(state.provinces).find((p) => p.ownerId !== state.playerNationId)!;
    state.wars.push({ id: 'war-fallback', attackerId: state.playerNationId, defenderId: target.ownerId, targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [] });
    const readiness = { ...buildReadinessReport(state), blockers: [], warnings: [], advice: [] };

    const actions = buildCommandCenterActions(state, 5, { readiness, brief: brief([]), reportActions: [] });

    expect(actions[0]).toMatchObject({ id: 'fallback-military', tab: 'military', source: 'fallback' });
  });
});
