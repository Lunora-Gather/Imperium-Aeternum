// V46 新手引导与目标教练：把当前局势转成可执行教程任务。
// 纯函数，不改 GameState；供 Dashboard 和后续教程浮层复用。

import type { GameState } from '../types/game';
import { buildTurnRiskCenterPlan, type TurnRiskTone } from './turnRiskCenter';
import { buildEconomyAdvisorPlan } from './economyAdvisor';
import { buildDiplomacyAdvisorPlan } from './diplomacyAdvisor';
import { buildWarOpportunityAdvice } from './warOpportunityAdvisor';

export type CoachStepStatus = 'todo' | 'ready' | 'done' | 'blocked';

export interface CoachStep {
  id: string;
  title: string;
  body: string;
  tab: string;
  status: CoachStepStatus;
  tone: TurnRiskTone;
}

export interface OnboardingCoachPlan {
  title: string;
  summary: string;
  tone: TurnRiskTone;
  stage: 'survive' | 'stabilize' | 'expand' | 'optimize';
  progress: number;
  nextStep?: CoachStep;
  steps: CoachStep[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function statusDone(done: boolean): CoachStepStatus {
  return done ? 'done' : 'todo';
}

function toneFor(status: CoachStepStatus): TurnRiskTone {
  if (status === 'blocked') return 'danger';
  if (status === 'todo') return 'warn';
  return 'good';
}

function step(id: string, title: string, body: string, tab: string, status: CoachStepStatus): CoachStep {
  return { id, title, body, tab, status, tone: toneFor(status) };
}

export function buildOnboardingCoachPlan(state: GameState, nationId: string = state.playerNationId): OnboardingCoachPlan {
  const nation = state.nations[nationId];
  if (!nation) {
    return {
      title: '目标教练：无法读取国家',
      summary: '国家数据缺失，建议重新读档。',
      tone: 'danger',
      stage: 'survive',
      progress: 0,
      steps: [step('reload', '重新读档', '当前国家不存在，无法生成目标。', 'dashboard', 'blocked')],
    };
  }

  const risk = buildTurnRiskCenterPlan(state, nationId);
  const economy = buildEconomyAdvisorPlan(state, nationId);
  const diplomacy = buildDiplomacyAdvisorPlan(state, nationId);
  const war = buildWarOpportunityAdvice(state, nationId);
  const hasArmy = nation.army.reduce((s, a) => s + a.size, 0) > 0;
  const hasTrade = diplomacy.tradeCount > 0;
  const hasAlliance = diplomacy.allyCount > 0;
  const stable = economy.tone === 'good' && risk.decision !== 'block';
  const canExpand = war.tone === 'good' && !!war.best;

  const steps: CoachStep[] = [
    step('read-hq', '先读帝国总参', '总参会告诉你今年最重要的一个方向。', 'dashboard', 'done'),
    step('fix-blockers', '清掉推进阻断', risk.blockers[0]?.body ?? '没有硬性阻断，可以进入下一步。', risk.primaryTab ?? 'dashboard', risk.blockers.length > 0 ? 'blocked' : 'done'),
    step('stabilize-economy', '稳定财政与粮食', economy.recommendations[0]?.body ?? '经济内政已基本稳定。', economy.recommendations[0]?.tab ?? 'economy', economy.tone === 'good' ? 'done' : 'todo'),
    step('secure-diplomacy', '建立外交缓冲', diplomacy.candidates[0]?.body ?? '没有迫切外交事项，积累影响力即可。', diplomacy.candidates[0]?.tab ?? 'diplomacy', hasTrade || hasAlliance || diplomacy.tone === 'good' ? 'done' : 'todo'),
    step('prepare-army', '保证基础军力', hasArmy ? '已有可用军队，下一步看补给和战机。' : '没有可用军队，至少先征一支基础军。', 'military', hasArmy ? 'done' : 'todo'),
    step('choose-expansion', '选择扩张或发展', canExpand ? `可考虑进攻 ${war.best?.provinceName}，先看战争预演。` : '没有安全战机时，优先建设、科研或外交。', canExpand ? 'military' : 'province', stable ? (canExpand ? 'ready' : 'todo') : 'blocked'),
  ];

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const progress = clamp(Math.round((doneCount / steps.length) * 100));
  const nextStep = steps.find((s) => s.status === 'blocked') ?? steps.find((s) => s.status === 'todo') ?? steps.find((s) => s.status === 'ready');
  const stage: OnboardingCoachPlan['stage'] = risk.decision === 'block' ? 'survive' : economy.tone !== 'good' ? 'stabilize' : canExpand ? 'expand' : 'optimize';
  const tone: TurnRiskTone = nextStep?.tone ?? 'good';
  const title = stage === 'survive' ? '目标教练：先活下来' : stage === 'stabilize' ? '目标教练：先稳住国家' : stage === 'expand' ? '目标教练：准备扩张' : '目标教练：优化发展';
  const summary = nextStep ? `下一步：${nextStep.title}。${nextStep.body}` : '核心引导任务已完成，可以自由规划长期目标。';

  return { title, summary, tone, stage, progress, nextStep, steps };
}
