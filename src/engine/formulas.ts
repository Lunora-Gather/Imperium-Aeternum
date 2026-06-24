// Imperium Aeternum — 公式集中实现
// 数据源：docs/formulas.md（FROZEN v1）
// 每函数对应 formulas.md §X.Y，函数名严格对应。
// 所有公式为纯函数，无副作用，便于单测。

import { clamp } from '../utils/math';
import type {
  Army, Government, Nation, Province, NationalTendency,
} from '../types/game';
import type { Terrain } from '../data/provinces';

// ── §2.1 税收 ──
export interface TaxInput {
  population: number;
  baseTaxRate: number;       // 0-0.5
  taxEfficiency: number;     // 0.5-1.5
  stability: number;         // 0-100
  corruption: number;        // 0-100
  assimilation: number;      // 0-100
}

export function stabilityTaxModifier(stability: number): number {
  if (stability >= 60) return 1.2;
  if (stability >= 40) return 1.0;
  if (stability >= 30) return 0.8;
  return 0.5;
}

export function corruptionModifier(corruption: number): number {
  return clamp(1 - corruption / 200, 0.5, 1.0);
}

export function assimilationModifier(assimilation: number): number {
  return clamp(0.7 + assimilation / 300, 0.7, 1.0);
}

export function computeTax(input: TaxInput): number {
  const raw = input.population * input.baseTaxRate * input.taxEfficiency
    * stabilityTaxModifier(input.stability)
    * corruptionModifier(input.corruption)
    * assimilationModifier(input.assimilation);
  return Math.max(0, raw);
}

// ── §2.2 粮食产量 ──
export const TERRAIN_FOOD_MOD: Record<Terrain, number> = {
  plain: 1.2, hill: 0.8, mountain: 0.3, coast: 1.0, forest: 0.6, desert: 0.3,
  tundra: 0.2, jungle: 0.9, swamp: 0.5, ocean: 0, island: 0.7,
};

export function agriTechModifier(agriLv: number): number {
  return 1 + agriLv * 0.08;
}

export function infrastructureFoodModifier(farmCount: number): number {
  return 1 + farmCount * 0.1;
}

export interface FoodInput {
  agriBase: number;
  peasantCount: number;
  terrain: Terrain;
  agriLv: number;
  farmCount: number;
}

export function computeFood(input: FoodInput): number {
  return input.agriBase * input.peasantCount
    * TERRAIN_FOOD_MOD[input.terrain]
    * agriTechModifier(input.agriLv)
    * infrastructureFoodModifier(input.farmCount);
}

// ── §2.3 腐败吞税 ──
export function computeCorruptionLoss(tax: number, corruption: number): number {
  return tax * corruption / 200;
}

// ── §2.4 贸易收入 ──
export interface TradeInput {
  baseTrade: number;
  marketCount: number;
  tradeDealCount: number;
  commerceActive: boolean;       // commerce≥70
  tradeDepSafety: number;        // 0.5-1.0
}

export function computeTrade(input: TradeInput): number {
  const marketMod = 1 + input.marketCount * 0.1;
  const dealMod = 1 + input.tradeDealCount * 0.15;
  const charMod = input.commerceActive ? 1.25 : 1.0;
  return input.baseTrade * marketMod * dealMod * charMod * input.tradeDepSafety;
}

// ── §3.1 合法性变化 ──
export function legitimacyDelta(
  factionAvgSat: number,       // 0-100
  corruption: number,
  warExhaustion: number,
  reformShockTurns: number,    // 剩余回合数（0 表示无）
): number {
  let d = 2;                                         // 政体巩固基础
  d += (factionAvgSat - 50) / 25;
  if (corruption > 30) d -= (corruption - 30) / 10;
  d -= warExhaustion / 20;
  if (reformShockTurns > 0) d -= 2;
  return d;
}

// ── §3.2 稳定度变化 ──
export function stabilityDelta(
  legitimacy: number,
  factionWeightedSat: number,  // Σ(power×sat)
  factionTotalPower: number,   // Σ(power)
  avgUnrest: number,
  warExhaustion: number,
  rebellionProvinceCount: number,
): number {
  const ideal = factionTotalPower * 50;
  let d = (legitimacy - 50) / 15;
  d += (factionWeightedSat - ideal) / 80;
  d -= avgUnrest / 20;
  d -= warExhaustion / 12;
  d -= rebellionProvinceCount * 0.3;
  // W-fix v2: 回归力改衰减式 —— 只在合法性低时补，高时不补（避免恒定+3.5推到平衡点卡住）
  if (legitimacy < 40) d += 3;
  else if (legitimacy < 55) d += 1.5;
  // legitimacy >= 55 时不加回归力，让稳定度能自然爬升
  return d;
}

// ── §3.3 改革成功率 ──
export function reformSuccessRate(
  legitimacy: number,
  efficiency: number,
  dominantFactionSat: number,
): number {
  return clamp(0.3 + legitimacy / 200 + (efficiency / 100) * 0.2 + dominantFactionSat / 200, 0, 1);
}

// ── §3.4 可管理省份数 ──
export function maxProvinces(
  adminLv: number,
  efficiency: number,
  centralizationActive: boolean,
  tier?: string,
): number {
  // W-fix: 基础容量按 tier 扩容，否则 S 级大国瞬间超管死亡螺旋
  const tierBase: Record<string, number> = { S: 50, A: 25, B: 12, C: 6, D: 3 };
  const base = tierBase[tier ?? 'C'] ?? 6;
  return base + adminLv + Math.floor(efficiency / 25) + (centralizationActive ? 2 : 0);
}

// ── §4.3 人口增长 ──
export function stabilityPopModifier(stability: number): number {
  if (stability >= 60) return 1.2;
  if (stability >= 40) return 1.0;
  if (stability >= 20) return 0.7;
  return 0.3;
}

export interface PopGrowthInput {
  population: number;
  baseGrowth: number;           // 0.005-0.02
  food: number;
  foodNeed: number;             // pop×0.8
  stability: number;
  atWar: boolean;
  plague: boolean;
  welfareActive: boolean;
}

export function popGrowth(input: PopGrowthInput): number {
  const foodMod = clamp(input.foodNeed > 0 ? input.food / input.foodNeed : 1, 0.3, 1.5);
  const warMod = input.atWar ? 0.7 : 1.0;
  const plagueMod = input.plague ? 0.5 : 1.0;
  const welfareMod = input.welfareActive ? 1.1 : 1.0;
  return input.population * input.baseGrowth * foodMod
    * stabilityPopModifier(input.stability) * warMod * plagueMod * welfareMod;
}

// ── §4.4 阶层满意度变化 ──
export interface SatisfactionDeltaInput {
  taxRate: number;
  draftCount: number;           // 本回合该阶层被征兵数
  totalPop: number;
  foodShortage: boolean;
  appeased: boolean;            // 本回合是否被安抚
  policyMatch: number;          // -1/0/+1
  characterBonus: number;       // 国家性格加成
}

export function satisfactionDelta(input: SatisfactionDeltaInput): number {
  let d = 0;
  d -= (input.taxRate - 0.15) * 100;
  d -= (input.totalPop > 0 ? input.draftCount / input.totalPop : 0) * 200;
  if (input.foodShortage) d -= 15;
  if (input.appeased) d += 8;
  if (input.policyMatch > 0) d += 5;
  if (input.policyMatch < 0) d -= 5;
  d += input.characterBonus;
  return d;
}

// ── §4.5 阶层叛乱风险 ──
export function classRebellionRisk(satisfaction: number, power: number, stability: number): number {
  const stabMod = stability < 20 ? 2 : stability > 60 ? 0.5 : 1;
  return (100 - satisfaction) * (power / 100) * stabMod;
}

// ── §5.1 战斗力 ──
export function milTechModifier(milLv: number): number {
  return 1 + milLv * 0.08;
}

export interface CombatInput {
  army: Army;
  milLv: number;
  general: number;              // 35-65
  terrainMod: number;           // 0.7-1.3
}

export function computeCombat(input: CombatInput): number {
  const techMod = milTechModifier(input.milLv);
  const generalMod = input.general / 50;
  const supplyMod = input.army.supply / 100;
  return input.army.size
    * (input.army.morale / 100)
    * (input.army.training / 100)
    * (input.army.equipment / 100)
    * techMod * generalMod * supplyMod * input.terrainMod;
}

// ── §5.2 省份叛乱风险 ──
export interface RebellionInput {
  unrest: number;
  cultureDiff: boolean;
  religionDiff: boolean;
  religionPolicy: 'tolerant' | 'state' | 'persecute';
  garrison: number;
  stability: number;
}

export function computeRebellion(input: RebellionInput): number {
  const cultureMod = input.cultureDiff ? 1.5 : 1.0;
  let religionMod = 1.0;
  if (input.religionDiff) {
    religionMod = input.religionPolicy === 'tolerant' ? 1.0
      : input.religionPolicy === 'state' ? 1.3 : 2.0;
  }
  const garrisonMod = clamp(1 - input.garrison / 1000, 0.3, 1.0);
  const stabMod = clamp((100 - input.stability) / 50, 0.5, 1.5);
  return input.unrest * cultureMod * religionMod * garrisonMod * stabMod;
}

// ── §5.3 战斗结算 ──
export interface BattleResult {
  progressDelta: number;
  attackerLoss: number;
  defenderLoss: number;
  attackerMoraleDelta: number;
  defenderMoraleDelta: number;
}

export function resolveBattle(attackerPower: number, defenderPower: number, attackerSize: number, defenderSize: number): BattleResult {
  const ratio = attackerPower / (attackerPower + defenderPower);
  // W-fix: 进度加速 + 最小推进，让战争能实际产生领土转移（旧值势均力敌时≈0，战争永远不灭国）
  const rawDelta = (ratio - 0.5) * 60;  // 40→60，差距更敏感
  const progressDelta = ratio > 0.5 ? Math.max(rawDelta, 3) : Math.min(rawDelta, -3);  // 胜方至少+3/败方至少-3
  const baseLoss = 0.05;
  const attackerLoss = defenderPower / Math.max(attackerPower, 1) * baseLoss * attackerSize;
  const defenderLoss = attackerPower / Math.max(defenderPower, 1) * baseLoss * defenderSize;
  return {
    progressDelta,
    attackerLoss,
    defenderLoss,
    attackerMoraleDelta: -5,
    defenderMoraleDelta: -5,
  };
}

// ── §5.4 战争代价（每回合） ──
export interface WarCost {
  gold: number;
  food: number;
  exhaustionDelta: number;
  stabilityDelta: number;
  attrition: number;            // 兵力自然损耗
}

export function warCostPerTurn(armySize: number): WarCost {
  return {
    gold: armySize * 0.5,
    food: armySize * 1.0,
    exhaustionDelta: 2,
    stabilityDelta: -1,
    attrition: armySize * 0.02,
  };
}

// ── §6.1 关系自然漂移 ──
export function relationDrift(
  treaty: 'none' | 'trade' | 'alliance' | 'war' | 'truce',
  borderClash: boolean,
  threat: number,
  commonEnemy: boolean,
): number {
  let d = 0;
  if (treaty === 'trade') d += 2;
  if (treaty === 'alliance') d += 1;
  if (borderClash) d -= 3;
  d -= threat / 20;
  if (commonEnemy) d += 3;
  return d;
}

// ── §6.2 威胁值 ──
export function computeThreat(selfMil: number, otherMil: number, otherProvinceCount: number, relation: number): number {
  const milPart = (otherMil / Math.max(selfMil, 1)) * 30;
  const provPart = (otherProvinceCount / 10) * 20;
  const relPart = -relation / 2;
  return clamp(milPart + provPart + relPart, 0, 100);
}

// ── §7.1 科研点产出 ──
export function computeSciPt(scholarCount: number, libraryCount: number, technocracyActive: boolean): number {
  const base = scholarCount * 0.5 + libraryCount * 2;
  return technocracyActive ? base * 1.25 : base;
}

// ── §7.2 研发成本 ──
export function researchCost(level: number, baseSci: number, baseGold: number): { sci: number; gold: number } {
  return { sci: baseSci * level * level, gold: baseGold * level * 50 };
}

// ── §8.1 同化度变化 ──
export function assimilationDelta(
  roadCount: number,
  culturePolicy: 'assimilate' | 'respect',
  efficiency: number,
  cultureDiff: boolean,
  farFromCapital: boolean,
): number {
  let d = roadCount * 1;
  d += culturePolicy === 'assimilate' ? 2 : 0;
  d += efficiency / 50;
  if (cultureDiff) d -= 1;
  if (farFromCapital) d -= 1;
  return d;
}

// ── §8.2 忠诚度变化 ──
export function loyaltyDelta(
  stability: number,
  assimilation: number,
  hasGarrison: boolean,
  unrest: number,
  welfareActive: boolean,
): number {
  let d = (stability - 50) / 30;
  d += (assimilation - 50) / 30;
  if (hasGarrison) d += 5;
  d -= unrest / 10;
  if (welfareActive) d += 3;
  return d;
}

// ── §11 行动点 ──
export function actionPointsPerTurn(efficiency: number, reformPolicyActive: boolean): number {
  return 3 + Math.floor(efficiency / 30) + (reformPolicyActive ? 1 : 0);
}

// ── 阶层人口分布（按比例） ──
export function classCountFromRatio(totalPop: number, ratio: number): number {
  return Math.round(totalPop * ratio);
}

// ── 国家性格激活判定 ──
export function activateTendency(tendency: NationalTendency, threshold: number = 70): (keyof NationalTendency)[] {
  const out: (keyof NationalTendency)[] = [];
  for (const k of Object.keys(tendency) as (keyof NationalTendency)[]) {
    if (tendency[k] >= threshold) out.push(k);
  }
  return out;
}

// ── 派系加权满意度 ──
export function factionWeightedSat(factions: { power: number; satisfaction: number }[]): {
  weighted: number;
  totalPower: number;
  avgSat: number;
} {
  let weighted = 0, totalPower = 0;
  for (const f of factions) {
    weighted += f.power * f.satisfaction;
    totalPower += f.power;
  }
  const avgSat = factions.length ? factions.reduce((s, f) => s + f.satisfaction, 0) / factions.length : 50;
  return { weighted, totalPower, avgSat };
}

// 工具：聚合某国所有省份人口
export function nationPopulation(nation: Nation, provinces: Record<string, Province>): number {
  let sum = 0;
  for (const p of Object.values(provinces)) {
    if (p.ownerId === nation.id) sum += p.population;
  }
  return sum;
}

// 工具：地形修正（战斗力）
export const TERRAIN_COMBAT_MOD: Record<Terrain, number> = {
  plain: 1.0, hill: 1.1, mountain: 1.3, coast: 0.9, forest: 1.1, desert: 0.8,
  tundra: 0.7, jungle: 0.9, swamp: 0.8, ocean: 1.0, island: 1.0,
};

// 工具：派系倾向值修改（添加并 clamp）
export function adjustTendency(tendency: NationalTendency, key: keyof NationalTendency, delta: number): void {
  tendency[key] = clamp(tendency[key] + delta, 0, 100);
}
