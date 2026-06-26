import { describe, expect, it } from 'vitest';
import { buildActionPlanSummary } from '../actionPlanSummary';
import { buildCommandExecutionPlan } from '../commandExecutionPlan';
import type { CommandCenterAction } from '../commandCenterActions';

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

describe('action plan summary', () => {
  it('builds a crisis-facing summary from the execution plan', () => {
    const plan = buildCommandExecutionPlan([
      action({ id: 'event', label: '处理待决事件', tone: 'danger', level: 100, source: 'readiness', reason: '待决事件会阻断下一回合。' }),
      action({ id: 'eco', label: '修复财政', tone: 'warn', level: 70, source: 'report', tab: 'economy', reason: '年度复盘显示净收入转负。' }),
    ]);

    const summary = buildActionPlanSummary(plan);

    expect(summary.kicker).toBe('Crisis Plan');
    expect(summary.advanceLabel).toBe('先处理阻断项');
    expect(summary.primaryCta).toBe('先做：处理待决事件');
    expect(summary.lines[0]).toMatchObject({ title: '处理待决事件', tone: 'danger' });
    expect(summary.lines[0].body).toContain('体检');
    expect(summary.lines[1].body).toContain('年报');
  });

  it('fills empty phase lines with safe guidance', () => {
    const summary = buildActionPlanSummary(buildCommandExecutionPlan([]));

    expect(summary.advanceLabel).toBe('可进入下一年');
    expect(summary.primaryCta).toBe('存档后推进');
    expect(summary.lines).toHaveLength(3);
    expect(summary.lines.some((line) => line.body.includes('可以存档'))).toBe(true);
  });

  it('uses careful wording for warning-only plans', () => {
    const summary = buildActionPlanSummary(buildCommandExecutionPlan([
      action({ id: 'eco', label: '修复财政', tone: 'warn', level: 70, tab: 'economy', source: 'strategy', reason: '财政压力会拖慢胜利路线。' }),
    ]));

    expect(summary.kicker).toBe('Careful Plan');
    expect(summary.tone).toBe('warn');
    expect(summary.advanceLabel).toBe('可进入下一年');
    expect(summary.lines[1].actionLabel).toBe('前往economy');
  });
});
