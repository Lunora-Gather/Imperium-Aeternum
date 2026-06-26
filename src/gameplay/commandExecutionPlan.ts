// V39 行动执行计划：把行动中心建议整理成可执行的三段式节奏。
// 纯函数，不改 GameState；可被 Dashboard、快捷栏和测试复用。

import type { CommandCenterAction } from './commandCenterActions';
import type { NavigationTab } from './navigationTabs';

export type ExecutionPlanTone = 'normal' | 'warn' | 'danger';
export type ExecutionPlanPhaseId = 'stabilize' | 'build' | 'advance';

export interface CommandExecutionStep {
  id: string;
  label: string;
  desc: string;
  tab: NavigationTab;
  tone: ExecutionPlanTone;
  source: CommandCenterAction['source'];
  reason: string;
}

export interface CommandExecutionPhase {
  id: ExecutionPlanPhaseId;
  title: string;
  subtitle: string;
  tone: ExecutionPlanTone;
  steps: CommandExecutionStep[];
}

export interface CommandExecutionPlan {
  title: string;
  summary: string;
  tone: ExecutionPlanTone;
  canAdvance: boolean;
  phases: CommandExecutionPhase[];
  nextAction?: CommandExecutionStep;
}

function phaseFor(action: CommandCenterAction): ExecutionPlanPhaseId {
  if (action.tone === 'danger' || action.level >= 88) return 'stabilize';
  if (action.tone === 'warn' || action.level >= 55) return 'build';
  return 'advance';
}

function toneRank(tone: ExecutionPlanTone): number {
  return tone === 'danger' ? 3 : tone === 'warn' ? 2 : 1;
}

function strongestTone(items: { tone: ExecutionPlanTone }[], fallback: ExecutionPlanTone = 'normal'): ExecutionPlanTone {
  return items.reduce((best, item) => toneRank(item.tone) > toneRank(best) ? item.tone : best, fallback);
}

function stepFrom(action: CommandCenterAction): CommandExecutionStep {
  return {
    id: action.id,
    label: action.label,
    desc: action.desc,
    tab: action.tab,
    tone: action.tone,
    source: action.source,
    reason: action.reason ?? action.desc,
  };
}

function phaseMeta(id: ExecutionPlanPhaseId): Pick<CommandExecutionPhase, 'title' | 'subtitle'> {
  if (id === 'stabilize') return { title: '先稳住', subtitle: '先处理会阻断推进或放大崩盘的事项。' };
  if (id === 'build') return { title: '再建设', subtitle: '把红黄风险转成财政、地方、军事或外交优势。' };
  return { title: '最后推进', subtitle: '没有硬伤后，再存档、扩张或进入下一年。' };
}

export function buildCommandExecutionPlan(actions: CommandCenterAction[], limitPerPhase = 3): CommandExecutionPlan {
  const buckets: Record<ExecutionPlanPhaseId, CommandExecutionStep[]> = {
    stabilize: [],
    build: [],
    advance: [],
  };

  for (const action of actions) {
    const phase = phaseFor(action);
    if (buckets[phase].some((x) => x.id === action.id && x.tab === action.tab)) continue;
    buckets[phase].push(stepFrom(action));
  }

  const order: ExecutionPlanPhaseId[] = ['stabilize', 'build', 'advance'];
  const phases = order.map((id) => {
    const meta = phaseMeta(id);
    const steps = buckets[id].slice(0, limitPerPhase);
    return {
      id,
      ...meta,
      tone: strongestTone(steps),
      steps,
    };
  });

  const flat = phases.flatMap((phase) => phase.steps);
  const tone = strongestTone(flat);
  const nextAction = phases.find((phase) => phase.steps.length > 0)?.steps[0];
  const canAdvance = buckets.stabilize.length === 0;
  const title = tone === 'danger' ? '本年先救火' : tone === 'warn' ? '本年谨慎推进' : '本年可以扩张节奏';
  const summary = nextAction
    ? `先做“${nextAction.label}”，再根据三段计划处理后续事项。`
    : '暂无紧急行动；可以存档后进入下一回合，或主动规划省份、外交和科技。';

  return { title, summary, tone, canAdvance, phases, nextAction };
}
