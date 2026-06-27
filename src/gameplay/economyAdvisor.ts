// V43 经济与内政顾问：统一判断财政、粮食、补给、稳定、腐败和叛乱压力。
// 纯函数，不改 GameState；供 Dashboard、内政页和 AI 后续复用。

import type { GameState, Nation, Province } from '../types/game';

export type EconomyAdvisorTone = 'good' | 'warn' | 'danger';
export type EconomyAdvisorAction = 'raise_tax' | 'lower_tax' | 'build_farm' | 'build_market' | 'recruit_less' | 'appease' | 'suppress' | 'anti_corruption' | 'safe_develop';

export interface EconomyAdvisorMetric {
  id: string;
  label: string;
  value: string;
  tone: EconomyAdvisorTone;
  detail: string;
}

export interface EconomyAdvisorRecommendation {
  id: EconomyAdvisorAction;
  title: string;
  body: string;
  tone: EconomyAdvisorTone;
  tab: string;
}

export interface EconomyAdvisorPlan {
  nationId: string;
  title: string;
  summary: string;
  tone: EconomyAdvisorTone;
  health: number;
  netGold: number;
  foodBalance: number;
  supplyPosture: number;
  unrestCount: number;
  metrics: EconomyAdvisorMetric[];
  recommendations: EconomyAdvisorRecommendation[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function ownedProvinces(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function goldNet(state: GameState, nation: Nation): number {
  if (state.lastReport?.nationId === nation.id) {
    const r = state.lastReport;
    return r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
  }
  const pop = ownedProvinces(state, nation.id).reduce((s, p) => s + p.population, 0);
  const tax = pop * nation.taxRate * (nation.policyMods?.taxEffMod ?? 1);
  const building = ownedProvinces(state, nation.id).reduce((s, p) => s + p.buildings.length * 4, 0);
  const military = nation.army.reduce((s, a) => s + a.size, 0) * 0.035;
  const corruption = nation.government.corruption * 0.8;
  return tax + building - military - corruption;
}

function foodBalance(state: GameState, nation: Nation): number {
  if (state.lastReport?.nationId === nation.id) return state.lastReport.foodDelta;
  const provs = ownedProvinces(state, nation.id);
  const output = provs.reduce((s, p) => s + p.agriBase * 12 + p.buildings.filter((b) => b.defId === 'farm').length * 18, 0);
  const consume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
  return output - consume;
}

function supplyPosture(nation: Nation): number {
  const armySize = nation.army.reduce((s, a) => s + a.size, 0);
  const need = Math.max(40, armySize * 0.035);
  return clamp((nation.resources.supply / need) * 70 + Math.min(30, nation.resources.food / 40));
}

function toneLowBad(value: number, warn: number, danger: number): EconomyAdvisorTone {
  return value <= danger ? 'danger' : value <= warn ? 'warn' : 'good';
}

function toneHighBad(value: number, warn: number, danger: number): EconomyAdvisorTone {
  return value >= danger ? 'danger' : value >= warn ? 'warn' : 'good';
}

function overallTone(health: number): EconomyAdvisorTone {
  return health < 40 ? 'danger' : health < 65 ? 'warn' : 'good';
}

function unique<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

export function buildEconomyAdvisorPlan(state: GameState, nationId: string = state.playerNationId): EconomyAdvisorPlan {
  const nation = state.nations[nationId];
  if (!nation) {
    return {
      nationId,
      title: '经济内政：国家缺失',
      summary: '无法读取该国家的经济状态。',
      tone: 'danger',
      health: 0,
      netGold: 0,
      foodBalance: 0,
      supplyPosture: 0,
      unrestCount: 0,
      metrics: [],
      recommendations: [{ id: 'safe_develop', title: '重新读档', body: '国家数据缺失，建议读档或重新开始。', tone: 'danger', tab: 'dashboard' }],
    };
  }

  const provs = ownedProvinces(state, nationId);
  const net = goldNet(state, nation);
  const food = foodBalance(state, nation);
  const supply = supplyPosture(nation);
  const unrestCount = provs.filter((p) => p.rebellionRisk > 65 || p.unrest > 55).length;
  const avgLoyalty = provs.length ? provs.reduce((s, p) => s + p.loyalty, 0) / provs.length : 50;
  const bankruptcyPenalty = nation.resources.gold < 0 ? 18 : 0;
  const foodPenalty = nation.resources.food < 0 ? 18 : food < 0 ? 8 : 0;
  const unrestPenalty = unrestCount * 7;
  const health = clamp(
    72 + Math.min(12, net / 12) + Math.min(8, food / 20) + (supply - 50) * 0.16 +
    (nation.government.stability - 50) * 0.22 + (avgLoyalty - 50) * 0.12 -
    nation.government.corruption * 0.18 - nation.warExhaustion * 0.12 - bankruptcyPenalty - foodPenalty - unrestPenalty,
  );
  const tone = overallTone(health);

  const metrics: EconomyAdvisorMetric[] = [
    { id: 'gold', label: '财政趋势', value: `${net >= 0 ? '+' : ''}${n(net)}/年`, tone: net < 0 || nation.resources.gold < 0 ? 'danger' : net < 40 ? 'warn' : 'good', detail: nation.resources.gold < 0 ? '国库已为负，继续扩张会放大破产风险。' : '年度净收入来自税收、贸易、建筑、军费和腐败估算。' },
    { id: 'food', label: '粮食趋势', value: `${food >= 0 ? '+' : ''}${n(food)}/年`, tone: nation.resources.food < 0 || food < 0 ? 'danger' : food < 30 ? 'warn' : 'good', detail: nation.resources.food < 0 ? '粮储为负，人口和稳定都会承压。' : '粮食趋势由农业基础、农场和人口消耗估算。' },
    { id: 'supply', label: '补给姿态', value: `${n(supply)}/100`, tone: toneLowBad(supply, 55, 35), detail: '补给姿态会影响战争承受力和军队扩张节奏。' },
    { id: 'stability', label: '安定', value: `${n(nation.government.stability)}`, tone: toneLowBad(nation.government.stability, 55, 35), detail: '安定不足会增加叛乱、事件和治理失控风险。' },
    { id: 'corruption', label: '腐败', value: `${n(nation.government.corruption)}`, tone: toneHighBad(nation.government.corruption, 45, 65), detail: '腐败会吞噬财政并降低长期治理效率。' },
    { id: 'unrest', label: '骚动省份', value: `${unrestCount} 省`, tone: unrestCount >= 3 ? 'danger' : unrestCount > 0 ? 'warn' : 'good', detail: '高不满或高叛乱风险省份需要优先处理。' },
  ];

  const recs: EconomyAdvisorRecommendation[] = [];
  if (nation.resources.gold < 0 || net < -20) recs.push({ id: 'raise_tax', title: '先止住财政失血', body: '提高税率、暂缓征兵，并优先建设市场或降低腐败。', tone: 'danger', tab: 'economy' });
  if (nation.resources.food < 0 || food < 0) recs.push({ id: 'build_farm', title: '立刻修复粮食', body: '优先在农业基础高、农场少的省份建设农场。', tone: 'danger', tab: 'province' });
  if (supply < 45) recs.push({ id: 'recruit_less', title: '暂停扩军补给', body: '补给不足时继续扩军会让战争和机动变得危险。', tone: 'warn', tab: 'military' });
  if (nation.government.stability < 45) recs.push({ id: 'appease', title: '先安抚国内', body: '安定偏低时优先安抚派系、降低税负或处理事件。', tone: 'warn', tab: 'court' });
  if (unrestCount > 0) recs.push({ id: 'suppress', title: '处理骚动省份', body: `${unrestCount} 个省份存在骚动或叛乱风险，推进前应镇压或安抚。`, tone: unrestCount >= 3 ? 'danger' : 'warn', tab: 'province' });
  if (nation.government.corruption > 55) recs.push({ id: 'anti_corruption', title: '压低腐败', body: '腐败偏高会持续拖累财政，适合优先改革或换取治理效率。', tone: 'warn', tab: 'court' });
  if (recs.length === 0) recs.push({ id: 'safe_develop', title: '可以主动发展', body: '经济与内政没有明显硬伤，可以选择市场、科技、外交或有限扩张。', tone: 'good', tab: 'province' });

  const title = tone === 'danger' ? '经济内政：先止血' : tone === 'warn' ? '经济内政：谨慎修正' : '经济内政：可主动发展';
  const summary = tone === 'danger'
    ? `健康度 ${n(health)}。财政、粮食或地方秩序存在硬伤，建议先处理红色项。`
    : tone === 'warn'
      ? `健康度 ${n(health)}。国家能运转，但需要先修补黄项再扩张。`
      : `健康度 ${n(health)}。财政与内政基本可支撑发展。`;

  return {
    nationId,
    title,
    summary,
    tone,
    health: n(health),
    netGold: n(net),
    foodBalance: n(food),
    supplyPosture: n(supply),
    unrestCount,
    metrics,
    recommendations: unique(recs).slice(0, 5),
  };
}
