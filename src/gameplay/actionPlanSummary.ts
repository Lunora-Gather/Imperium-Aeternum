// V39 行动计划摘要：把三段式执行计划压缩成 Dashboard 可直接展示的文案。
// 纯函数，不改 GameState；下一步可以直接接入总览页卡片。

import type { CommandExecutionPlan, CommandExecutionStep, ExecutionPlanTone } from './commandExecutionPlan';

export interface ActionPlanSummaryLine {
  id: string;
  title: string;
  body: string;
  tone: ExecutionPlanTone;
  actionLabel?: string;
}

export interface ActionPlanSummary {
  title: string;
  kicker: string;
  body: string;
  tone: ExecutionPlanTone;
  advanceLabel: string;
  primaryCta: string;
  lines: ActionPlanSummaryLine[];
}

function sourceLabel(source: CommandExecutionStep['source']): string {
  if (source === 'readiness') return '体检';
  if (source === 'report') return '年报';
  if (source === 'strategy') return '参谋';
  return '规划';
}

function phaseFallback(id: string): string {
  if (id === 'stabilize') return '没有硬性阻断。';
  if (id === 'build') return '暂无必须建设项，可选择长期发展。';
  return '可以存档、观察预演后推进下一年。';
}

function summarizeStep(step: CommandExecutionStep): ActionPlanSummaryLine {
  return {
    id: step.id,
    title: step.label,
    body: `${sourceLabel(step.source)}：${step.reason}`,
    tone: step.tone,
    actionLabel: `前往${step.tab}`,
  };
}

export function buildActionPlanSummary(plan: CommandExecutionPlan): ActionPlanSummary {
  const lines = plan.phases.map((phase) => {
    const first = phase.steps[0];
    if (first) return summarizeStep(first);
    return {
      id: `empty-${phase.id}`,
      title: phase.title,
      body: phaseFallback(phase.id),
      tone: 'normal' as ExecutionPlanTone,
    };
  });

  const primaryCta = plan.nextAction ? `先做：${plan.nextAction.label}` : '存档后推进';
  const advanceLabel = plan.canAdvance ? '可进入下一年' : '先处理阻断项';
  const kicker = plan.tone === 'danger' ? 'Crisis Plan' : plan.tone === 'warn' ? 'Careful Plan' : 'Advance Plan';
  const body = plan.nextAction
    ? `当前最优先入口是“${plan.nextAction.label}”。处理后再看建设项和推进项。`
    : '当前没有硬阻断，建议先存档，再按预演进入下一年。';

  return {
    title: plan.title,
    kicker,
    body,
    tone: plan.tone,
    advanceLabel,
    primaryCta,
    lines,
  };
}
