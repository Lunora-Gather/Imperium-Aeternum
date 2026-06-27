// V45 推进前风险中枢：合并经济、外交、战争与待决事件，给出是否应该进入下一回合。
// 纯函数，不改 GameState；供 Dashboard 首屏和后续确认弹窗复用。

import type { GameState } from '../types/game';
import { buildEconomyAdvisorPlan, type EconomyAdvisorTone } from './economyAdvisor';
import { buildDiplomacyAdvisorPlan, type DiplomacyAdvisorTone } from './diplomacyAdvisor';
import { buildWarOpportunityAdvice } from './warOpportunityAdvisor';

export type TurnRiskTone = 'good' | 'warn' | 'danger';
export type TurnRiskDecision = 'advance' | 'prepare' | 'block';

export interface TurnRiskItem {
  id: string;
  title: string;
  body: string;
  tone: TurnRiskTone;
  tab: string;
}

export interface TurnRiskCenterPlan {
  title: string;
  summary: string;
  decision: TurnRiskDecision;
  tone: TurnRiskTone;
  readiness: number;
  primaryCta: string;
  primaryTab?: string;
  blockers: TurnRiskItem[];
  warnings: TurnRiskItem[];
  opportunities: TurnRiskItem[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function tonePenalty(tone: EconomyAdvisorTone | DiplomacyAdvisorTone | TurnRiskTone): number {
  if (tone === 'danger') return 24;
  if (tone === 'warn') return 10;
  return 0;
}

function titleFor(decision: TurnRiskDecision): string {
  if (decision === 'block') return '推进前检查：必须先处理';
  if (decision === 'prepare') return '推进前检查：建议先整备';
  return '推进前检查：可以进入下一年';
}

function ctaFor(decision: TurnRiskDecision): string {
  if (decision === 'block') return '先处理阻断项';
  if (decision === 'prepare') return '先处理高价值事项';
  return '存档后推进';
}

export function buildTurnRiskCenterPlan(state: GameState, nationId: string = state.playerNationId): TurnRiskCenterPlan {
  const economy = buildEconomyAdvisorPlan(state, nationId);
  const diplomacy = buildDiplomacyAdvisorPlan(state, nationId);
  const war = buildWarOpportunityAdvice(state, nationId);
  const nation = state.nations[nationId];
  const pendingEvents = state.pendingEvents.filter((e) => e.nationId === nationId);

  const blockers: TurnRiskItem[] = [];
  const warnings: TurnRiskItem[] = [];
  const opportunities: TurnRiskItem[] = [];

  if (pendingEvents.length > 0) blockers.push({ id: 'pending-events', title: '处理待决事件', body: `${pendingEvents.length} 个待决事件会阻断下一回合。`, tone: 'danger', tab: 'dashboard' });
  if (nation?.resources.gold !== undefined && nation.resources.gold < 0) blockers.push({ id: 'bankruptcy', title: '国库为负', body: '破产会持续拖累国家机器，推进前应先止血。', tone: 'danger', tab: 'economy' });
  if (nation?.resources.food !== undefined && nation.resources.food < 0) blockers.push({ id: 'food-crisis', title: '粮储为负', body: '粮食危机会压低稳定与人口增长，推进前应优先修复。', tone: 'danger', tab: 'province' });
  if (economy.unrestCount >= 3) blockers.push({ id: 'unrest-crisis', title: '地方骚动扩大', body: `${economy.unrestCount} 个省份存在高风险，推进可能引发更大危机。`, tone: 'danger', tab: 'province' });

  if (economy.tone !== 'good') warnings.push({ id: 'economy', title: economy.title, body: economy.summary, tone: economy.tone, tab: economy.recommendations[0]?.tab ?? 'economy' });
  if (diplomacy.tone !== 'good') warnings.push({ id: 'diplomacy', title: diplomacy.title, body: diplomacy.summary, tone: diplomacy.tone, tab: diplomacy.candidates[0]?.tab ?? 'diplomacy' });
  if (war.tone !== 'good' && war.blockers.length > 0) warnings.push({ id: 'war', title: war.title, body: war.summary, tone: war.tone, tab: 'military' });
  if (nation?.warExhaustion !== undefined && nation.warExhaustion > 60) warnings.push({ id: 'exhaustion', title: '厌战过高', body: `厌战 ${n(nation.warExhaustion)}，继续推进会削弱稳定和战力。`, tone: nation.warExhaustion > 80 ? 'danger' : 'warn', tab: 'military' });

  if (economy.tone === 'good') opportunities.push({ id: 'develop', title: '经济可支撑发展', body: economy.recommendations[0]?.body ?? '可以建设、科研或有限扩张。', tone: 'good', tab: economy.recommendations[0]?.tab ?? 'province' });
  if (diplomacy.tone === 'good' && diplomacy.candidates[0]) opportunities.push({ id: 'diplomacy', title: diplomacy.candidates[0].title, body: diplomacy.candidates[0].body, tone: 'good', tab: diplomacy.candidates[0].tab });
  if (war.tone === 'good' && war.best) opportunities.push({ id: 'war-opportunity', title: `可攻 ${war.best.provinceName}`, body: `预计胜率 ${war.best.assessment.winChance}%，备战度 ${war.best.assessment.readiness}%。`, tone: 'good', tab: 'military' });

  const readiness = clamp(
    92 - blockers.length * 24 - warnings.reduce((s, w) => s + tonePenalty(w.tone), 0) + opportunities.length * 4,
  );
  const decision: TurnRiskDecision = blockers.length > 0 ? 'block' : readiness < 68 || warnings.some((w) => w.tone === 'danger') ? 'prepare' : 'advance';
  const tone: TurnRiskTone = decision === 'block' ? 'danger' : decision === 'prepare' ? 'warn' : 'good';
  const first = blockers[0] ?? warnings[0] ?? opportunities[0];
  const summary = decision === 'block'
    ? `发现 ${blockers.length} 个阻断项，建议先处理再进入下一年。`
    : decision === 'prepare'
      ? `可推进但存在 ${warnings.length} 个风险项，先处理首要事项更稳。`
      : `未发现硬性阻断，国家 readiness ${n(readiness)}，可以存档后推进。`;

  return {
    title: titleFor(decision),
    summary,
    decision,
    tone,
    readiness: n(readiness),
    primaryCta: ctaFor(decision),
    primaryTab: first?.tab,
    blockers: blockers.slice(0, 4),
    warnings: warnings.slice(0, 5),
    opportunities: opportunities.slice(0, 4),
  };
}
