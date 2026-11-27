// Imperium Aeternum — 经济系统 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §9

import type { EconomicReturns, GameState, Nation, Province } from '../types/game';
import {
  computeTax, computeCorruptionLoss, computeFood, computeTrade,
  agriTechModifier, computeSciPt,
} from './formulas';
import { provincesOf } from './init';
import { BUILDINGS } from '../data/buildings';
import type { BuildingId } from '../data/buildings';
import { operatingRoutes, routeAccessBlocker, tradeOffers, tradeRouteById } from './tradeNetwork';
import { type TradeRouteDef, LENGTH_MOD } from '../data/trade-routes';
import { nationalCharacterMods } from '../data/national-characters';
import { GOVERNMENTS } from '../data/governments';
import type { GovernmentId } from '../data/governments';
import { clamp } from '../utils/math';


export interface EconomyResult {
  taxIncome: number;
  tradeIncome: number;
  buildingIncome: number;
  corruptionLoss: number;
  militaryExpense: number;
  foodProduced: number;
  foodConsumed: number;
  economicReturns?: EconomicReturns;
  grain: {
    exports: number;
    receipts: number;
    civilianRations: number;
    armyRations: number;
    net: number;
    shortageExpected: boolean;
  };
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

export function settleEconomy(nation: Nation, state: GameState, provs?: Province[], relations = state.relations): EconomyResult {
  const result = settleEconomyPure(nation, state, provs, relations);
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
    sciPt: number;
    supply: number;
    food: number;
  };
}
export function settleEconomyPure(nation: Nation, state: GameState, provs = provincesOf(nation.id, state.provinces), relations = state.relations): EconomyPartial {
  let taxIncome = 0, foodProduced = 0;
  let wood = 0, iron = 0, scholars = 0;
  let dInfluence = 0;

  const harvests: EconomicReturns['harvests'] = [];
  const taxEff = (1 + nation.tech.admin * 0.06) * (nation.policyMods?.taxEffMod ?? 1);

  for (const p of provs) {
    const peasants = p.classes.find((c) => c.classId === 'peasants')?.count ?? 0;
    scholars += p.classes.find((c) => c.classId === 'scholars')?.count ?? 0;
    const farms = p.buildings.filter((b) => b.defId === 'farm').length;
    const field = {
      agriBase: p.agriBase, peasantCount: peasants, terrain: p.terrain,
      agriLv: nation.tech.agri, farmCount: farms,
    };
    const harvest = computeFood(field);
    foodProduced += harvest;
    if (p.priorAgriBase !== undefined) {
      const gain = harvest - computeFood({ ...field, agriBase: p.priorAgriBase });
      harvests.push({ provinceId: p.id, food: gain * (nation.policyMods?.foodOutputMod ?? 1) });
    }
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
  foodProduced = (foodProduced + buildingYields.food) * (nation.policyMods?.foodOutputMod ?? 1);
  wood += buildingYields.wood;
  iron += buildingYields.iron;
  dInfluence += buildingYields.influence;

  if (nation.civilWar?.active) taxIncome *= 0.7;
  const corruptionLoss = computeCorruptionLoss(taxIncome, nation.government.corruption);
  const netTax = taxIncome - corruptionLoss;
  const cm = nationalCharacterMods(nation.activeCharacterBonuses);

  const marketCount = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === 'market').length, 0);
  let tradeDeals = 0;
  let tradeDepSafety = 1.0;
  for (const r of relations) {
    if (r.from !== nation.id || r.treaty !== 'trade') continue;
    tradeDeals++;
    if (r.relation < 0) tradeDepSafety = Math.min(tradeDepSafety, 1 - r.tradeDep / 200);
  }
  const tradeMod = cm.tradeMod ?? 1;
  const baseTrade = 80 + nation.tech.admin * 20;
  let tradeIncome = computeTrade({
    baseTrade, marketCount, tradeDealCount: tradeDeals,
    tradeMod, tradeDepSafety: Math.max(0.5, tradeDepSafety),
  });

  const govDef = GOVERNMENTS[nation.government.type as GovernmentId];
  const shipments: EconomicReturns['routes'] = [];
  const armySize = nation.army.reduce((s, a) => s + a.size, 0);
  const milCostMult = nation.tier === 'D' ? 0.25 : 0.5;
  const militaryExpense = armySize * milCostMult;

  const subsidy = nation.tier === 'D' ? 8 : 0;
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const foodMilConsume = nation.tier === 'D' ? armySize * 0.1 : (totalPop < 50 ? 0 : armySize * 0.5);
  const civilianRations = totalPop * 0.1;
  const foodConsumed = foodMilConsume + civilianRations;
  const routes = operatingRoutes(nation, state);
  const imports = routes.reduce((sum, def) => sum + Math.max(0, def.yield.food ?? 0), 0);
  foodProduced += imports;
  const receipts = foodProduced + subsidy;
  let routeInfluence = 0, exports = 0;
  for (const def of routes) {
    const yields = tradeRouteYield(def, nation);
    if (yields.food < 0) {
      const available = Math.max(0, Math.floor(nation.resources.food + receipts - foodConsumed - exports));
      const delivered = Math.min(available, -yields.food);
      const fulfilled = delivered / -yields.food;
      yields.food = -delivered;
      yields.gold *= fulfilled;
      yields.influence = Math.floor(yields.influence * fulfilled);
      exports += delivered;
    }
    tradeIncome += yields.gold;
    routeInfluence += yields.influence;
    const opening = nation.activeTradeRoutes.find(r => r.routeId === def.id);
    shipments.push({ routeId: def.id, ...yields, opened: opening?.establishedTurn === state.turn - 1 });
  }
  let contract: EconomicReturns['contract'];
  const agreement = nation.grainContract;
  if (agreement) {
    const partner = state.nations[agreement.partnerId];
    const atWar = relations.some(r => r.from === nation.id && r.to === agreement.partnerId && r.treaty === 'war');
    const trading = partner && !partner.defeated && !atWar;
    const available = Math.max(0, Math.floor(nation.resources.food + receipts - foodConsumed - exports));
    const delivered = trading ? Math.min(available, agreement.quantity) : 0;
    contract = { partnerId: agreement.partnerId, food: -delivered, gold: 2 * delivered,
      yearsLeft: trading ? Math.max(0, agreement.yearsLeft - 1) : 0 };
    tradeIncome += contract.gold;
    exports += delivered;
  }
  const income = netTax + tradeIncome + buildingIncome;
  const dGold = income + Math.round(income * (cm.goldMod ?? 0) / 100) + subsidy - militaryExpense;
  dInfluence += routeInfluence + (nation.tech.culture * 0.5) * (nation.policyMods?.influenceMod ?? 1);
  const researchProduced = computeSciPt(scholars, 0, false) + buildingYields.sciPt;
  const finalAdminPt = 3 + Math.floor(nation.government.efficiency / 25) + buildingYields.adminPt;
  const netFood = receipts - foodConsumed - exports;
  return {
    taxIncome, tradeIncome, buildingIncome, corruptionLoss, militaryExpense,
    foodProduced, foodConsumed, woodProduced: wood, ironProduced: iron,
    ...(shipments.length || harvests.length || contract ? { economicReturns: { ...(contract && { contract }), routes: shipments, harvests, grainBalance: netFood } } : {}),
    grain: { exports, receipts, civilianRations, armyRations: foodMilConsume, net: netFood,
      shortageExpected: nation.resources.food + netFood < totalPop * 0.4 },
    delta: {
      gold: Math.max(-50 - nation.resources.gold, dGold),
      wood,
      iron,
      influence: dInfluence,
      adminPt: finalAdminPt - nation.resources.adminPt,  // 覆写转 delta
      sciPt: Math.round(researchProduced * (cm.sciPtMod ?? 1) * (govDef?.perTurn?.sciPtMod ?? 1)),
      supply: buildingYields.supply,
      food: netFood,
    },
  };
}

/** 把纯经济结算结果一次性合并到国家工作副本。 */
export function applyEconomyResult(nation: Nation, result: EconomyPartial): void {
  const contract = result.economicReturns?.contract;
  if (contract && nation.grainContract) {
    if (contract.yearsLeft === 0) delete nation.grainContract;
    else nation.grainContract = { ...nation.grainContract, yearsLeft: contract.yearsLeft };
  }
  nation.resources.gold += result.delta.gold;
  nation.resources.food += result.delta.food;
  nation.resources.wood += result.delta.wood;
  nation.resources.iron += result.delta.iron;
  nation.resources.influence += result.delta.influence;
  nation.resources.adminPt += result.delta.adminPt;
  nation.resources.sciPt += result.delta.sciPt;
  nation.resources.supply += result.delta.supply;
}

function openingBlocker(nation: Nation, def: TradeRouteDef, state: GameState) {
  if (nation.activeTradeRoutes.some(r => r.routeId === def.id)) return '已建立';
  const blocked = routeAccessBlocker(def, state, nation);
  if (blocked) return blocked;
  if (nation.tech.admin < def.prereqAdminLevel) return `需行政Lv${def.prereqAdminLevel}`;
  return nation.resources.gold < def.costGold ? '金不足' : null;
}

export function establishTradeRoute(nation: Nation, routeId: string, state: GameState): { ok: boolean; reason?: string; routeName?: string } {
  const def = tradeOffers(state, nation).find(r => r.id === routeId);
  if (!def) return { ok: false, reason: '路线不存在' };
  const blocker = openingBlocker(nation, def, state);
  if (blocker) return { ok: false, reason: blocker };
  nation.resources.gold -= def.costGold;
  nation.activeTradeRoutes.push({ routeId, establishedTurn: state.turn });
  return { ok: true, routeName: def.name };
}

export function availableTradeRoutes(nation: Nation, state: GameState) {
  return tradeOffers(state, nation).map(def => {
    const blocker = openingBlocker(nation, def, state) ?? (nation.resources.adminPt < 1 ? '行动点不足（需 1）' : null);
    return { def, can: !blocker, blocker };
  });
}

export function tradeRouteYield(def: TradeRouteDef, nation?: Nation) {
  const government = nation && GOVERNMENTS[nation.government.type as GovernmentId];
  const character = nation && nationalCharacterMods(nation.activeCharacterBonuses);
  const multiplier = LENGTH_MOD[def.length] * (government?.perTurn?.tradeMod ?? 1) * (character?.tradeMod ?? 1);
  return { gold: def.yield.gold * multiplier, influence: def.yield.influence, food: def.yield.food ?? 0 };
}

export function routeYieldEstimate(routeId: string, nation?: Nation) {
  const def = tradeRouteById(routeId);
  if (!def) return { gold: 0, influence: 0, food: 0 };
  const yields = tradeRouteYield(def, nation);
  return { ...yields, gold: Math.round(yields.gold) };
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
