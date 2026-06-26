import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildStrategicHqPlan } from '../strategicHq';
import type { CommandCenterAction } from '../commandCenterActions';
import type { GameState, TurnReport } from '../../types/game';

function action(patch: Partial<CommandCenterAction> = {}): CommandCenterAction {
  return {
    id: 'act',
    label: '处理事项',
    desc: '处理事项说明',
    tab: 'dashboard',
    level: 30,
    tone: 'normal',
    source: 'fallback',
    reason: '测试原因',
    ...patch,
  };
}

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

describe('strategic HQ planner', () => {
  it('turns a danger action into a crisis objective with blocker impact', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'test_event' });

    const hq = buildStrategicHqPlan(state, [
      action({ id: 'event', label: '处理待决事件', tone: 'danger', level: 100, source: 'readiness', reason: '待决事件会阻断下一回合。' }),
    ]);

    expect(hq.title).toContain('先守住');
    expect(hq.objective).toBe('处理待决事件');
    expect(hq.risk).toBe('danger');
    expect(hq.riskLabel).toBe('高风险');
    expect(hq.confidence).toBeLessThan(70);
    expect(hq.why.join(' ')).toContain('待决事件');
    expect(hq.impacts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'blockers', value: '1 项', tone: 'danger' })]));
  });

  it('explains fiscal pressure when the last report is negative', () => {
    const state = createInitialState();
    state.lastReport = report(state, { income: { tax: 5, trade: 0, building: 0 }, expense: { military: 45, corruption: 10 } });

    const hq = buildStrategicHqPlan(state, [
      action({ id: 'eco', label: '修复财政', tone: 'warn', level: 70, tab: 'economy', source: 'report', reason: '年度复盘显示净收入转负。' }),
    ]);

    expect(hq.risk).toBe('warn');
    expect(hq.riskLabel).toBe('中风险');
    expect(hq.horizon).toContain('2～3');
    expect(hq.why.join(' ')).toContain('年度净收入');
    expect(hq.impacts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'net', value: '-50/年', tone: 'warn' })]));
  });

  it('produces an advance-facing HQ plan for quiet states', () => {
    const state = createInitialState();
    const hq = buildStrategicHqPlan(state, [
      action({ id: 'province', label: '发展核心省份', tone: 'normal', level: 35, tab: 'province', source: 'fallback', reason: '建设基础可以支撑长期扩张。' }),
    ]);

    expect(hq.title).toContain('主动扩张');
    expect(hq.risk).toBe('normal');
    expect(hq.riskLabel).toBe('低风险');
    expect(hq.confidence).toBeGreaterThanOrEqual(80);
    expect(hq.primaryCta).toBe('先做：发展核心省份');
    expect(hq.summaryView.advanceLabel).toBe('可进入下一年');
  });

  it('has a safe no-action fallback', () => {
    const hq = buildStrategicHqPlan(createInitialState(), []);

    expect(hq.objective).toBe('存档后推进下一年');
    expect(hq.primaryCta).toBe('存档后推进');
    expect(hq.why[0]).toContain('没有明显硬伤');
  });
});
