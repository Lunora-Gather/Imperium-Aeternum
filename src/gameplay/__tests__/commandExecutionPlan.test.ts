import { describe, expect, it } from 'vitest';
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

describe('command execution plan', () => {
  it('groups urgent, warning and normal actions into an execution rhythm', () => {
    const plan = buildCommandExecutionPlan([
      action({ id: 'pending', label: '处理待决事件', tone: 'danger', level: 100, tab: 'dashboard', source: 'readiness' }),
      action({ id: 'economy', label: '修复财政', tone: 'warn', level: 70, tab: 'economy', source: 'report' }),
      action({ id: 'save', label: '保存分支', tone: 'normal', level: 20, tab: 'save', source: 'fallback' }),
    ]);

    expect(plan.title).toBe('本年先救火');
    expect(plan.canAdvance).toBe(false);
    expect(plan.nextAction?.label).toBe('处理待决事件');
    expect(plan.phases.map((x) => x.id)).toEqual(['stabilize', 'build', 'advance']);
    expect(plan.phases[0].steps.map((x) => x.label)).toEqual(['处理待决事件']);
    expect(plan.phases[1].steps.map((x) => x.label)).toEqual(['修复财政']);
    expect(plan.phases[2].steps.map((x) => x.label)).toEqual(['保存分支']);
  });

  it('allows advancing when there is no stabilize bucket', () => {
    const plan = buildCommandExecutionPlan([
      action({ id: 'province', label: '发展省份', tone: 'normal', level: 35, tab: 'province' }),
      action({ id: 'diplomacy', label: '经营外交', tone: 'normal', level: 25, tab: 'diplomacy' }),
    ]);

    expect(plan.canAdvance).toBe(true);
    expect(plan.tone).toBe('normal');
    expect(plan.title).toBe('本年可以扩张节奏');
    expect(plan.nextAction?.label).toBe('发展省份');
  });

  it('deduplicates repeated actions inside the same phase and caps visible steps', () => {
    const plan = buildCommandExecutionPlan([
      action({ id: 'eco', label: '经济 A', tone: 'warn', level: 70, tab: 'economy' }),
      action({ id: 'eco', label: '经济 A duplicate', tone: 'warn', level: 68, tab: 'economy' }),
      action({ id: 'pol', label: '政治', tone: 'warn', level: 65, tab: 'politics' }),
      action({ id: 'mil', label: '军事', tone: 'warn', level: 60, tab: 'military' }),
    ], 2);

    const buildPhase = plan.phases.find((x) => x.id === 'build')!;
    expect(buildPhase.steps.map((x) => x.label)).toEqual(['经济 A', '政治']);
  });

  it('returns a safe empty plan for empty action input', () => {
    const plan = buildCommandExecutionPlan([]);

    expect(plan.canAdvance).toBe(true);
    expect(plan.nextAction).toBeUndefined();
    expect(plan.summary).toContain('暂无紧急行动');
  });
});
