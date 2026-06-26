// V40 帝国总参：把行动计划升级成本年首要目标、风险、信心和预计影响。
// 纯函数，不改 GameState；供 Dashboard 2.0 首页总参卡片消费。

import type { GameState } from '../types/game';
import type { CommandCenterAction } from './commandCenterActions';
import type { NavigationTab } from './navigationTabs';
import { buildCommandExecutionPlan } from './commandExecutionPlan';
import { buildActionPlanSummary, type ActionPlanSummary } from './actionPlanSummary';

export type StrategicHqTone = 'normal' | 'warn' | 'danger';

export interface StrategicHqImpact {
  id: string;
  label: string;
  value: string;
  tone: StrategicHqTone;
}

export interface StrategicHqPlan {
  title: string;
  objective: string;
  summary: string;
  confidence: number;
  risk: StrategicHqTone;
  riskLabel: string;
  horizon: string;
  primaryCta: string;
  primaryTab?: NavigationTab;
  why: string[];
  impacts: StrategicHqImpact[];
  summaryView: ActionPlanSummary;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function riskLabel(tone: StrategicHqTone): string {
  if (tone === 'danger') return '高风险';
  if (tone === 'warn') return '中风险';
  return '低风险';
}

function titleFor(tone: StrategicHqTone): string {
  if (tone === 'danger') return '帝国总参：先守住国家机器';
  if (tone === 'warn') return '帝国总参：谨慎修正路线';
  return '帝国总参：可以主动扩张节奏';
}

function horizonFor(tone: StrategicHqTone): string {
  if (tone === 'danger') return '1 回合内止血';
  if (tone === 'warn') return '2～3 回合修正';
  return '3～5 回合推进';
}

function confidenceFrom(actions: CommandCenterAction[], canAdvance: boolean): number {
  const danger = actions.filter((x) => x.tone === 'danger').length;
  const warn = actions.filter((x) => x.tone === 'warn').length;
  const base = canAdvance ? 82 : 58;
  return clamp(base - danger * 10 - warn * 4 + Math.min(8, actions.length));
}

function economyNet(state: GameState): number | null {
  const r = state.lastReport;
  if (!r) return null;
  return r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
}

function buildWhy(state: GameState, actions: CommandCenterAction[]): string[] {
  const player = state.nations[state.playerNationId];
  const out: string[] = [];
  const net = economyNet(state);
  if (actions[0]?.reason) out.push(actions[0].reason);
  if (player?.resources.gold !== undefined && player.resources.gold < 0) out.push('国库已经转负，继续推进会放大财政危机。');
  if (player?.resources.food !== undefined && player.resources.food < 0) out.push('粮储已经告竭，地方稳定和人口增长会承压。');
  if (player?.government.stability !== undefined && player.government.stability < 35) out.push('安定偏低，叛乱和地方失控风险上升。');
  if (net !== null && net < 0) out.push(`年度净收入为 ${n(net)}，需要先修复财政趋势。`);
  if (state.pendingEvents.some((x) => x.nationId === state.playerNationId)) out.push('存在待决事件，会阻断下一回合推进。');
  return [...new Set(out)].slice(0, 4);
}

function buildImpacts(state: GameState, actions: CommandCenterAction[]): StrategicHqImpact[] {
  const player = state.nations[state.playerNationId];
  const net = economyNet(state);
  const impacts: StrategicHqImpact[] = [];
  if (net !== null) impacts.push({ id: 'net', label: '财政', value: `${net >= 0 ? '+' : ''}${n(net)}/年`, tone: net < 0 ? 'warn' : 'normal' });
  if (player) impacts.push({ id: 'stability', label: '安定', value: `${n(player.government.stability)}`, tone: player.government.stability < 35 ? 'danger' : player.government.stability < 55 ? 'warn' : 'normal' });
  if (player) impacts.push({ id: 'food', label: '粮储', value: `${n(player.resources.food)}`, tone: player.resources.food < 0 ? 'danger' : player.resources.food < 80 ? 'warn' : 'normal' });
  const warCount = player ? state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id).length : 0;
  impacts.push({ id: 'war', label: '战事', value: `${warCount} 起`, tone: warCount > 0 ? 'warn' : 'normal' });
  const dangerousActions = actions.filter((x) => x.tone === 'danger').length;
  impacts.push({ id: 'blockers', label: '阻断项', value: `${dangerousActions} 项`, tone: dangerousActions > 0 ? 'danger' : 'normal' });
  return impacts;
}

export function buildStrategicHqPlan(state: GameState, actions: CommandCenterAction[]): StrategicHqPlan {
  const executionPlan = buildCommandExecutionPlan(actions);
  const summaryView = buildActionPlanSummary(executionPlan);
  const risk = executionPlan.tone;
  const first = executionPlan.nextAction;
  const objective = first ? first.label : executionPlan.canAdvance ? '存档后推进下一年' : '恢复国家运转';
  const why = buildWhy(state, actions);
  return {
    title: titleFor(risk),
    objective,
    summary: first ? `本年首要目标是“${first.label}”。${summaryView.body}` : summaryView.body,
    confidence: confidenceFrom(actions, executionPlan.canAdvance),
    risk,
    riskLabel: riskLabel(risk),
    horizon: horizonFor(risk),
    primaryCta: summaryView.primaryCta,
    primaryTab: first?.tab,
    why: why.length > 0 ? why : ['当前没有明显硬伤，可以把主动权用于建设、外交或科技。'],
    impacts: buildImpacts(state, actions),
    summaryView,
  };
}
