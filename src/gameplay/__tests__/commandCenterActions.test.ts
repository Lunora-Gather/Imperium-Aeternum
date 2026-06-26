import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { arrangeCommandCenterActions, buildCommandCenterActions, type CommandCenterAction } from '../commandCenterActions';
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

function action(id: string, tab: CommandCenterAction['tab'], level: number, tone: CommandCenterAction['tone'] = 'normal'): CommandCenterAction {
  return { id, label: id, desc: id, tab, level, tone, source: 'strategy' };
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

  it('diversifies non-urgent actions across different tabs before filling duplicates', () => {
    const arranged = arrangeCommandCenterActions([
      action('eco-1', 'economy', 70, 'warn'),
      action('eco-2', 'economy', 68, 'warn'),
      action('province-1', 'province', 40),
      action('save-1', 'save', 20),
      action('diplomacy-1', 'diplomacy', 25),
    ], 4);

    expect(arranged.map((x) => x.tab).slice(0, 3)).toEqual(['economy', 'province', 'diplomacy']);
    expect(new Set(arranged.slice(0, 3).map((x) => x.tab)).size).toBe(3);
  });

  it('keeps urgent blockers ahead even when they share the same tab', () => {
    const arranged = arrangeCommandCenterActions([
      action('eco-danger-1', 'economy', 100, 'danger'),
      action('eco-danger-2', 'economy', 95, 'danger'),
      action('province-1', 'province', 80, 'warn'),
    ], 3);

    expect(arranged[0].id).toBe('eco-danger-1');
    expect(arranged[1].id).toBe('eco-danger-2');
    expect(arranged[2].tab).toBe('province');
  });

  it('adds fallback actions when high-scoring candidates are too narrow', () => {
    const state = createInitialState();
    const readiness = { ...buildReadinessReport(state), blockers: [], warnings: [], advice: [] };
    const reportActions: TurnReportAction[] = [
      { id: 'eco-a', title: '经济 A', body: '经济', tab: 'economy', level: 70, tone: 'warn', tag: '建议' },
      { id: 'eco-b', title: '经济 B', body: '经济', tab: 'economy', level: 68, tone: 'warn', tag: '建议' },
      { id: 'eco-c', title: '经济 C', body: '经济', tab: 'economy', level: 66, tone: 'warn', tag: '建议' },
    ];

    const actions = buildCommandCenterActions(state, 5, { readiness, brief: brief([]), reportActions });
    const tabs = new Set(actions.map((x) => x.tab));

    expect(tabs.has('economy')).toBe(true);
    expect(tabs.has('province')).toBe(true);
    expect(tabs.has('diplomacy')).toBe(true);
  });
});
