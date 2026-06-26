// V41 战争评估引擎：统一玩家预演、AI 宣战和战争 UI 的基础判断。
// 纯函数，不改 GameState；暂不改变现有战争结算和平衡。

import type { GameState, Nation, Province } from '../types/game';

export type WarAssessmentTone = 'good' | 'warn' | 'danger';
export type WarRecommendation = 'attack_now' | 'prepare' | 'avoid';

export interface WarAssessmentFactor {
  id: string;
  label: string;
  value: string;
  score: number;
  tone: WarAssessmentTone;
  detail: string;
}

export interface WarAssessment {
  attackerId: string;
  defenderId: string;
  targetProvinceId: string;
  title: string;
  winChance: number;
  readiness: number;
  logisticsPressure: number;
  fiscalPressure: number;
  exhaustionRisk: number;
  diplomaticRisk: number;
  recommendation: WarRecommendation;
  recommendationLabel: string;
  summary: string;
  factors: WarAssessmentFactor[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function armyPower(nation?: Nation): number {
  if (!nation) return 0;
  return nation.army.reduce((sum, army) => {
    const quality = (army.morale * 0.35 + army.training * 0.3 + army.equipment * 0.25 + army.supply * 0.1) / 100;
    return sum + army.size * (0.65 + quality);
  }, 0);
}

function ownedProvinces(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function relationScore(state: GameState, from: string, to: string): number {
  const rel = state.relations.find((r) => r.from === from && r.to === to);
  if (!rel) return 0;
  return rel.relation - rel.threat + rel.trust * 0.25 + rel.tradeDep * 0.15;
}

function borderAccess(state: GameState, attackerId: string, target?: Province): boolean {
  if (!target) return false;
  const attackerProvinceIds = new Set(ownedProvinces(state, attackerId).map((p) => p.id));
  return target.adjacent.some((id) => attackerProvinceIds.has(id));
}

function supplyScore(attacker?: Nation, hasBorder = false): number {
  if (!attacker) return 0;
  const stock = attacker.resources.supply;
  const food = attacker.resources.food;
  const base = Math.min(65, stock * 0.45) + Math.min(25, Math.max(0, food) * 0.05) + (hasBorder ? 10 : -12);
  return clamp(base);
}

function fiscalScore(attacker?: Nation): number {
  if (!attacker) return 0;
  const gold = attacker.resources.gold;
  const corruptionPenalty = attacker.government.corruption * 0.25;
  return clamp(55 + Math.min(25, gold / 20) - corruptionPenalty);
}

function stabilityScore(attacker?: Nation): number {
  if (!attacker) return 0;
  return clamp(attacker.government.stability * 0.7 + attacker.government.legitimacy * 0.2 + attacker.government.efficiency * 0.1 - attacker.warExhaustion * 0.45);
}

function diplomaticRiskScore(state: GameState, attackerId: string, defenderId: string): number {
  const rel = relationScore(state, attackerId, defenderId);
  const defenderAllies = state.relations.filter((r) => r.to === defenderId && r.treaty === 'alliance' && r.relation >= 50).length;
  const attackerAllies = state.relations.filter((r) => r.to === attackerId && r.treaty === 'alliance' && r.relation >= 50).length;
  return clamp(42 + defenderAllies * 12 - attackerAllies * 7 + Math.max(0, rel) * 0.25);
}

function factor(id: string, label: string, value: string, score: number, goodWhenHigh: boolean, detail: string): WarAssessmentFactor {
  const tone: WarAssessmentTone = goodWhenHigh
    ? score >= 65 ? 'good' : score >= 40 ? 'warn' : 'danger'
    : score <= 35 ? 'good' : score <= 60 ? 'warn' : 'danger';
  return { id, label, value, score: n(score), tone, detail };
}

function recLabel(rec: WarRecommendation): string {
  if (rec === 'attack_now') return '可以开战';
  if (rec === 'prepare') return '先准备一年';
  return '避免开战';
}

export function assessWar(state: GameState, attackerId: string, defenderId: string, targetProvinceId: string): WarAssessment {
  const attacker = state.nations[attackerId];
  const defender = state.nations[defenderId];
  const target = state.provinces[targetProvinceId];
  const attPower = armyPower(attacker);
  const defPower = armyPower(defender) + (target?.garrison ?? 0) * 0.85;
  const powerRatio = defPower <= 0 ? 100 : clamp((attPower / defPower) * 50, 0, 100);
  const hasBorder = borderAccess(state, attackerId, target);
  const logistics = supplyScore(attacker, hasBorder);
  const fiscal = fiscalScore(attacker);
  const stability = stabilityScore(attacker);
  const diplomaticRisk = diplomaticRiskScore(state, attackerId, defenderId);
  const exhaustionRisk = clamp((attacker?.warExhaustion ?? 100) + Math.max(0, 55 - stability) * 0.45 + (hasBorder ? 0 : 12));
  const readiness = clamp(powerRatio * 0.42 + logistics * 0.22 + fiscal * 0.16 + stability * 0.14 + (100 - diplomaticRisk) * 0.06);
  const winChance = clamp(30 + powerRatio * 0.48 + logistics * 0.12 + stability * 0.08 - diplomaticRisk * 0.08);
  const fiscalPressure = clamp(100 - fiscal + Math.max(0, defPower - attPower) / 300);
  const logisticsPressure = clamp(100 - logistics);
  const recommendation: WarRecommendation = readiness >= 70 && winChance >= 62 && diplomaticRisk < 62 ? 'attack_now' : readiness >= 48 && winChance >= 45 ? 'prepare' : 'avoid';
  const summary = recommendation === 'attack_now'
    ? '军力、后勤和政治条件基本支持开战。'
    : recommendation === 'prepare'
      ? '具备部分机会，但建议先补给、降厌战或改善外交。'
      : '当前开战会放大财政、后勤或外交风险。';

  return {
    attackerId,
    defenderId,
    targetProvinceId,
    title: `${attacker?.name ?? attackerId} → ${defender?.name ?? defenderId}`,
    winChance: n(winChance),
    readiness: n(readiness),
    logisticsPressure: n(logisticsPressure),
    fiscalPressure: n(fiscalPressure),
    exhaustionRisk: n(exhaustionRisk),
    diplomaticRisk: n(diplomaticRisk),
    recommendation,
    recommendationLabel: recLabel(recommendation),
    summary,
    factors: [
      factor('power', '军力对比', `${n(attPower)} / ${n(defPower)}`, powerRatio, true, '综合兵力、士气、训练、装备、补给和目标驻军。'),
      factor('logistics', '后勤准备', `${n(logistics)}/100`, logistics, true, hasBorder ? '目标接壤，补给线较短。' : '目标不接壤，远征压力上升。'),
      factor('fiscal', '财政承受', `${n(fiscal)}/100`, fiscal, true, '国库余额和腐败会影响长期战争承受力。'),
      factor('stability', '国内稳定', `${n(stability)}/100`, stability, true, '稳定、法统、治能和厌战共同影响动员风险。'),
      factor('diplomacy', '外交风险', `${n(diplomaticRisk)}/100`, diplomaticRisk, false, '防守方盟友、双方关系和威胁值会影响外部风险。'),
    ],
  };
}
