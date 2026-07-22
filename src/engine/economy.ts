// Imperium Aeternum — 经济系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §9

import type { GameState, Nation, Province } from '../types/game';
import {
  computeTax, computeCorruptionLoss, computeFood, computeTrade,
  agriTechModifier,
} from './formulas';
import { provincesOf } from './init';
import { BUILDINGS } from '../data/buildings';
import type { BuildingId } from '../data/buildings';
import { TRADE_ROUTE_BY_ID, TRADE_ROUTES, LENGTH_MOD } from '../data/trade-routes';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId, NationalCharacterMods } from '../data/national-characters';
import { GOVERNMENTS } from '../data/governments';
import type { GovernmentId } from '../data/governments';
import { clamp } from '../utils/math';

// P1-4: 合并激活性格的加成+副作用
function charMods(nation: Nation): NationalCharacterMods {
  const merged: NationalCharacterMods = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid as NationalCharacterId];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) { (merged as Record<string, number>)[k] = ((merged as Record<string, number>)[k] ?? 0) + (v as number); }
    for (const [k, v] of Object.entries(def.penalties)) { (merged as Record<string, number>)[k] = ((merged as Record<string, number>)[k] ?? 0) + (v as number); }
  }
  return merged;
}

export interface EconomyResult {
  taxIncome: number;
  tradeIncome: number;
  buildingIncome: number;
  corruptionLoss: number;
  militaryExpense: number;
  foodProduced: number;
  foodConsumed: number;
  woodProduced: number;
  ironProduced: number;
}

export interface BuildingYieldTotals {
  gold: number;
  food: number;
  wood: number;
  iron: number;
  sciPt: number;
  adminPt: number;
  influence: number;
  supply: number;
}

export function computeBuildingYield(buildingDefId: string, level: number, terrain: Province['terrain']): BuildingYieldTotals {
  const totals: BuildingYieldTotals = { gold: 0, food: 0, wood: 0, iron: 0, sciPt: 0, adminPt: 0, influence: 0, supply: 0 };
  const definition = BUILDINGS[buildingDefId as BuildingId];
  if (!definition) return totals;
  const safeLevel = clamp(Math.round(level), 1, 3);
  const multiplier = safeLevel * (definition.terrainMod[terrain] ?? 1);
  for (const resource of Object.keys(totals) as (keyof BuildingYieldTotals)[]) {
    totals[resource] = (definition.yield[resource] ?? 0) * multiplier;
  }
  return totals;
}

/** 按设计公式结算建筑：基础产出 × 等级 × 省份地形修正。 */
export function computeBuildingYields(provs: Province[]): BuildingYieldTotals {
  const totals: BuildingYieldTotals = { gold: 0, food: 0, wood: 0, iron: 0, sciPt: 0, adminPt: 0, influence: 0, supply: 0 };
  for (const province of provs) {
    for (const building of province.buildings) {
      const instanceYield = computeBuildingYield(building.defId, building.level, province.terrain);
      for (const resource of Object.keys(totals) as (keyof BuildingYieldTotals)[]) {
        totals[resource] += instanceYield[resource];
      }
    }
  }
  return totals;
}

export function settleEconomy(nation: Nation, state: GameState): EconomyResult {
  const result = settleEconomyPure(nation, state);
  applyEconomyResult(nation, result);
  return result;
}
// ── C1: 纯函数版本 settleEconomyPure ──
// 不 mutate nation，返回 resources delta + EconomyResult，供 processTurn 合并建新 state
// 与原 settleEconomy 并存（零回归），后续 processTurn 迁移到此纯函数后可删原函数
export interface EconomyPartial extends EconomyResult {
  // resources 增量（processTurn 合并时 nation.resources.X += delta.X）
  delta: {
    gold: number;
    wood: number;
    iron: number;
    influence: number;
    adminPt: number;      // 注意：adminPt 是覆写非增量（原函数 = 3 + floor(eff/25)）
    sciPt: number;        // sciPt 是倍率覆写（原函数 round(sciPt * sciPtMod)）
    supply: number;
    food: number;
  };
}
export function settleEconomyPure(nation: Nation, state: GameState): EconomyPartial {
  const provs = provincesOf(nation.id, state.provinces);
  let taxIncome = 0, foodProduced = 0;
  let wood = 0, iron = 0;
  let dInfluence = 0;

  const taxEff = (1 + nation.tech.admin * 0.06) * (nation.policyMods?.taxEffMod ?? 1);

  for (const p of provs) {
    const peasants = p.classes.find((c) => c.classId === 'peasants')?.count ?? 0;
    const farms = p.buildings.filter((b) => b.defId === 'farm').length;
    foodProduced += computeFood({
      agriBase: p.agriBase, peasantCount: peasants, terrain: p.terrain,
      agriLv: nation.tech.agri, farmCount: farms,
    });
    taxIncome += computeTax({
      population: p.population, baseTaxRate: nation.taxRate,
      taxEfficiency: taxEff,
      stability: nation.government.stability,
      corruption: nation.government.corruption,
      assimilation: p.assimilation,
    });
    wood += p.baseResources.wood ?? 0;
    iron += p.baseResources.iron ?? 0;
  }
  const buildingYields = computeBuildingYields(provs);
  const buildingIncome = buildingYields.gold;
  foodProduced += buildingYields.food;
  wood += buildingYields.wood;
  iron += buildingYields.iron;
  dInfluence += buildingYields.influence;

  const corruptionLoss = computeCorruptionLoss(taxIncome, nation.government.corruption);
  const netTax = taxIncome - corruptionLoss;
  const cm = charMods(nation);

  const marketCount = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === 'market').length, 0);
  const tradeDeals = state.relations.filter((r) => r.from === nation.id && r.treaty === 'trade').length;
  let tradeDepSafety = 1.0;
  for (const r of state.relations) {
    if (r.from === nation.id && r.treaty === 'trade' && r.relation < 0) {
      tradeDepSafety = Math.min(tradeDepSafety, 1 - r.tradeDep / 200);
    }
  }
  const commerceActive = nation.activeCharacterBonuses.includes('commerce');
  const baseTrade = 80 + nation.tech.admin * 20;
  const tradeMod = cm.tradeMod ?? 1;
  const tradeIncome = computeTrade({
    baseTrade, marketCount, tradeDealCount: tradeDeals,
    commerceActive, tradeDepSafety: Math.max(0.5, tradeDepSafety),
  }) * tradeMod;

  const govDef = GOVERNMENTS[nation.government.type as GovernmentId];
  const govTradeMod = govDef?.perTurn?.tradeMod ?? 1;
  const charTradeMod = cm.tradeMod ?? 1;
  const routeTradeMod = govTradeMod * charTradeMod;
  let routeIncome = 0, routeInfluence = 0, routeFood = 0;
  for (const ar of nation.activeTradeRoutes) {
    const def = TRADE_ROUTE_BY_ID[ar.routeId];
    if (!def) continue;
    if (nation.embargoedRoutes?.includes(ar.routeId)) continue;
    const ep1 = state.provinces[def.endpoints[0]];
    const ep2 = state.provinces[def.endpoints[1]];
    if (!ep1 || !ep2) continue;
    const owns1 = ep1.ownerId === nation.id;
    const owns2 = ep2.ownerId === nation.id;
    if (!owns1 && !owns2) continue;
    const mod = LENGTH_MOD[def.length] * routeTradeMod;
    routeIncome += def.yield.gold * mod;
    routeInfluence += def.yield.influence;
    routeFood += def.yield.food ?? 0;
  }

  const armySize = nation.army.reduce((s, a) => s + a.size, 0);
  const milCostMult = nation.tier === 'D' ? 0.25 : 0.5;
  const militaryExpense = armySize * milCostMult;

  // delta 计算（不 mutate）
  let dGold = netTax + tradeIncome + buildingIncome + routeIncome - militaryExpense;
  if (nation.civilWar?.active) dGold = Math.round(dGold * 0.7);
  dGold += nation.resources.gold;  // 加原值后做性格/保底修正，最终 delta = finalGold - origGold
  // 注意：此处复刻原函数逻辑——原函数是 nation.resources.gold += netTax...; 然后后续修正都基于新 gold 值
  // 为保持语义一致，dGold 此处临时表示"修正后的最终 gold"，最后 delta = dGold - origGold
  dInfluence += routeInfluence + (nation.tech.culture * 0.5) * (nation.policyMods?.influenceMod ?? 1);
  let dFood = routeFood;
  if (nation.tier === 'D') { dGold += 8; dFood += 8; }
  if (cm.goldMod) dGold += Math.round(dGold * cm.goldMod / 100);
  let finalSciPt = buildingYields.sciPt + nation.resources.sciPt;  // 建筑产出后应用科研倍率
  if (cm.sciPtMod && cm.sciPtMod !== 1) finalSciPt = Math.round(finalSciPt * cm.sciPtMod);
  if (dGold < -50) dGold = -50;
  const finalAdminPt = 3 + Math.floor(nation.government.efficiency / 25) + buildingYields.adminPt;
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const foodMilConsume = nation.tier === 'D' ? armySize * 0.1 : (totalPop < 50 ? 0 : armySize * 0.5);
  const foodConsumed = foodMilConsume + provs.reduce((s, p) => s + p.population, 0) * 0.1;
  const finalFood = nation.resources.food + dFood + foodProduced - foodConsumed;

  // delta = 最终值 - 原值（processTurn 合并时 nation.resources.X += delta.X）
  const origGold = nation.resources.gold;
  const origFood = nation.resources.food;
  return {
    taxIncome, tradeIncome, buildingIncome, corruptionLoss, militaryExpense,
    foodProduced, foodConsumed, woodProduced: wood, ironProduced: iron,
    delta: {
      gold: dGold - origGold,
      wood,
      iron,
      influence: dInfluence,
      adminPt: finalAdminPt - nation.resources.adminPt,  // 覆写转 delta
      sciPt: finalSciPt - nation.resources.sciPt,        // 倍率覆写转 delta
      supply: buildingYields.supply,
      food: finalFood - origFood,
    },
  };
}

/** 把纯经济结算结果一次性合并到国家工作副本。 */
export function applyEconomyResult(nation: Nation, result: EconomyPartial): void {
  nation.resources.gold += result.delta.gold;
  nation.resources.food += result.delta.food;
  nation.resources.wood += result.delta.wood;
  nation.resources.iron += result.delta.iron;
  nation.resources.influence += result.delta.influence;
  nation.resources.adminPt += result.delta.adminPt;
  nation.resources.sciPt += result.delta.sciPt;
  nation.resources.supply += result.delta.supply;
}

// ── C3: 建立贸易路线 ──
// 返回 {ok, reason}。成功则扣金、加 activeTradeRoutes。
export function establishTradeRoute(nation: Nation, routeId: string, state: GameState): { ok: boolean; reason?: string; routeName?: string } {
  const def = TRADE_ROUTE_BY_ID[routeId];
  if (!def) return { ok: false, reason: '路线不存在' };
  if (nation.activeTradeRoutes.some((r) => r.routeId === routeId)) return { ok: false, reason: '已建立' };
  // 前置行政科技
  if (nation.tech.admin < def.prereqAdminLevel) return { ok: false, reason: `需行政Lv${def.prereqAdminLevel}` };
  // 至少一端省份归玩家所有
  const ep1 = state.provinces[def.endpoints[0]];
  const ep2 = state.provinces[def.endpoints[1]];
  if (!ep1 || !ep2) return { ok: false, reason: '路线端点省份不存在' };
  const owns1 = ep1.ownerId === nation.id;
  const owns2 = ep2.ownerId === nation.id;
  if (!owns1 && !owns2) return { ok: false, reason: '路线两端均不归本国' };
  if (nation.resources.gold < def.costGold) return { ok: false, reason: '金不足' };

  nation.resources.gold -= def.costGold;
  nation.activeTradeRoutes.push({ routeId, establishedTurn: state.turn });
  return { ok: true, routeName: def.name };
}

// C3: 获取可建立的路线（前端用）
export function availableTradeRoutes(nation: Nation, state: GameState): { def: typeof TRADE_ROUTES[number]; can: boolean; blocker: string | null }[] {
  return TRADE_ROUTES.map((def) => {
    const already = nation.activeTradeRoutes.some((r) => r.routeId === def.id);
    const ep1 = state.provinces[def.endpoints[0]];
    const ep2 = state.provinces[def.endpoints[1]];
    const owns1 = ep1?.ownerId === nation.id;
    const owns2 = ep2?.ownerId === nation.id;
    const techOk = nation.tech.admin >= def.prereqAdminLevel;
    const goldOk = nation.resources.gold >= def.costGold;
    let blocker: string | null = null;
    if (already) blocker = '已建立';
    else if (!owns1 && !owns2) blocker = '两端均不归本国';
    else if (!techOk) blocker = `需行政Lv${def.prereqAdminLevel}`;
    else if (!goldOk) blocker = '金不足';
    return { def, can: !blocker, blocker };
  });
}

// C3: 路线每回合收益估算（前端显示用）
export function routeYieldEstimate(routeId: string): { gold: number; influence: number; food: number } {
  const def = TRADE_ROUTE_BY_ID[routeId];
  if (!def) return { gold: 0, influence: 0, food: 0 };
  const mod = LENGTH_MOD[def.length];
  return {
    gold: Math.round(def.yield.gold * mod),
    influence: def.yield.influence,
    food: def.yield.food ?? 0,
  };
}

export function canAfford(nation: Nation, gold: number, wood = 0, iron = 0): boolean {
  return nation.resources.gold >= gold && nation.resources.wood >= wood && nation.resources.iron >= iron;
}

export function spend(nation: Nation, gold: number, wood = 0, iron = 0): void {
  nation.resources.gold -= gold;
  nation.resources.wood -= wood;
  nation.resources.iron -= iron;
}

export { agriTechModifier };
