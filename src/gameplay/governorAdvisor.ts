// V50 RC Governor Advisor：把各顾问输出合成为可解释的执政路线。
// 纯函数，不改 GameState；只给路线、优先队列和页面跳转目标。

import type { GameState } from '../types/game';
import type { CommandCenterAction } from './commandCenterActions';
import type { NavigationTab } from './navigationTabs';
import { buildOnboardingCoachPlan } from './onboardingCoach';
import { buildTurnRiskCenterPlan, type TurnRiskTone } from './turnRiskCenter';
import { buildEconomyAdvisorPlan } from './economyAdvisor';
import { buildDiplomacyAdvisorPlan } from './diplomacyAdvisor';
import { buildWarOpportunityAdvice } from './warOpportunityAdvisor';

export type GovernorAdvisorMode = 'blocked' | 'stabilize' | 'develop' | 'expand';
export type GovernorAdvisorSource = 'coach' | 'risk' | 'economy' | 'diplomacy' | 'war' | 'command';

export interface GovernorAdvisorAction {
  id: string;
  title: string;
  body: string;
  tab: NavigationTab;
  tone: TurnRiskTone;
  priority: number;
  source: GovernorAdvisorSource;
}

export interface GovernorAdvisorPlan {
  title: string;
  summary: string;
  mode: GovernorAdvisorMode;
  confidence: number;
  guidanceLabel: string;
  primaryAction?: GovernorAdvisorAction;
  queue: GovernorAdvisorAction[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function toneFromCommand(tone: CommandCenterAction['tone']): TurnRiskTone {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function pushUnique(out: GovernorAdvisorAction[], item: GovernorAdvisorAction): void {
  const key = `${item.id}|${item.tab}`;
  if (out.some((x) => `${x.id}|${x.tab}` === key)) return;
  out.push(item);
}

function modeTitle(mode: GovernorAdvisorMode): string {
  if (mode === 'blocked') return 'Governor Advisor：先解除阻断';
  if (mode === 'stabilize') return 'Governor Advisor：稳国路线';
  if (mode === 'expand') return 'Governor Advisor：扩张路线';
  return 'Governor Advisor：发展路线';
}

export function buildGovernorAdvisorPlan(state: GameState, commandActions: CommandCenterAction[] = [], nationId: string = state.playerNationId): GovernorAdvisorPlan {
  const coach = buildOnboardingCoachPlan(state, nationId);
  const risk = buildTurnRiskCenterPlan(state, nationId);
  const economy = buildEconomyAdvisorPlan(state, nationId);
  const diplomacy = buildDiplomacyAdvisorPlan(state, nationId);
  const war = buildWarOpportunityAdvice(state, nationId);
  const queue: GovernorAdvisorAction[] = [];

  if (coach.nextStep) pushUnique(queue, {
    id: `coach-${coach.nextStep.id}`,
    title: coach.nextStep.title,
    body: coach.nextStep.body,
    tab: coach.nextStep.tab as NavigationTab,
    tone: coach.nextStep.tone,
    priority: coach.nextStep.status === 'blocked' ? 100 : coach.nextStep.status === 'todo' ? 76 : 48,
    source: 'coach',
  });

  for (const b of risk.blockers) pushUnique(queue, { id: `risk-${b.id}`, title: b.title, body: b.body, tab: b.tab as NavigationTab, tone: b.tone, priority: 98, source: 'risk' });
  for (const w of risk.warnings.slice(0, 2)) pushUnique(queue, { id: `risk-${w.id}`, title: w.title, body: w.body, tab: w.tab as NavigationTab, tone: w.tone, priority: w.tone === 'danger' ? 88 : 70, source: 'risk' });
  if (economy.recommendations[0]) pushUnique(queue, { id: `eco-${economy.recommendations[0].id}`, title: economy.recommendations[0].title, body: economy.recommendations[0].body, tab: economy.recommendations[0].tab as NavigationTab, tone: economy.recommendations[0].tone, priority: economy.tone === 'danger' ? 90 : economy.tone === 'warn' ? 68 : 42, source: 'economy' });
  if (diplomacy.candidates[0]) pushUnique(queue, { id: `dip-${diplomacy.candidates[0].id}`, title: diplomacy.candidates[0].title, body: diplomacy.candidates[0].body, tab: diplomacy.candidates[0].tab as NavigationTab, tone: diplomacy.candidates[0].tone, priority: diplomacy.tone === 'danger' ? 84 : diplomacy.tone === 'warn' ? 62 : 45, source: 'diplomacy' });
  if (war.best) pushUnique(queue, { id: `war-${war.best.defenderId}-${war.best.provinceId}`, title: `战争预演：${war.best.provinceName}`, body: `胜率 ${war.best.assessment.winChance}%，备战度 ${war.best.assessment.readiness}%。先打开军事页确认。`, tab: 'military', tone: war.tone, priority: war.tone === 'good' ? 58 : 35, source: 'war' });

  for (const c of commandActions.slice(0, 3)) pushUnique(queue, { id: `cmd-${c.id}`, title: c.label, body: c.desc, tab: c.tab, tone: toneFromCommand(c.tone), priority: c.level, source: 'command' });

  const sorted = queue.sort((a, b) => b.priority - a.priority).slice(0, 6);
  const primaryAction = sorted[0];
  const mode: GovernorAdvisorMode = risk.decision === 'block' ? 'blocked' : economy.tone !== 'good' || diplomacy.tone === 'danger' ? 'stabilize' : war.tone === 'good' && !!war.best ? 'expand' : 'develop';
  const dangerCount = sorted.filter((x) => x.tone === 'danger').length;
  const confidence = clamp(62 + risk.readiness * 0.25 + sorted.length * 3 - dangerCount * 8);
  const guidanceLabel = mode === 'blocked' ? '先手动处理' : confidence >= 80 ? '路线清晰' : '逐项确认';
  const summary = primaryAction ? `首要动作：${primaryAction.title}。${primaryAction.body}` : '当前没有明确紧急动作，可以自由规划建设、科技或外交。';

  return { title: modeTitle(mode), summary, mode, confidence: Math.round(confidence), guidanceLabel, primaryAction, queue: sorted };
}
