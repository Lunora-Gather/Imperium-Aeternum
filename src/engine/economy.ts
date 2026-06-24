// Imperium Aeternum — 经济系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §9

import type { GameState, Nation, Province } from '../types/game';
import {
  computeTax, computeCorruptionLoss, computeFood, computeTrade,
  agriTechModifier,
} from './formulas';
import { provincesOf } from './init';
import { BUILDINGS } from '../data/buildings';
import { TRADE_ROUTE_BY_ID, TRADE_ROUTES, LENGTH_MOD } from '../data/trade-routes';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId, NationalCharacterMods } from '../data/national-characters';
import { GOVERNMENTS } from '../data/governments';
import type { GovernmentId } from '../data/governments';

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

export function settleEconomy(nation: Nation, state: GameState): EconomyResult {
  const provs = provincesOf(nation.id, state.provinces);
  let taxIncome = 0, buildingIncome = 0, foodProduced = 0;
  let wood = 0, iron = 0;

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
    for (const b of p.buildings) {
      const def = BUILDINGS[b.defId];
      if (!def) continue;
      if (def.yield.gold) buildingIncome += def.yield.gold;
      if (def.yield.iron) iron += def.yield.iron;
      if (def.yield.influence) nation.resources.influence += def.yield.influence;
      if (def.yield.adminPt) nation.resources.adminPt += def.yield.adminPt;
      if (def.yield.sciPt) nation.resources.sciPt += def.yield.sciPt;
      if (def.yield.supply) nation.resources.supply += def.yield.supply;
    }
    wood += p.baseResources.wood ?? 0;
    iron += p.baseResources.iron ?? 0;
  }

  const corruptionLoss = computeCorruptionLoss(taxIncome, nation.government.corruption);
  const netTax = taxIncome - corruptionLoss;

  // P1-4: 性格加成
  const cm = charMods(nation);

  // 贸易收入
  const marketCount = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === 'market').length, 0);
  const tradeDeals = state.relations.filter(
    (r) => r.from === nation.id && r.treaty === 'trade',
  ).length;
  // 贸易依赖安全修正：任一贸易国关系<0 时按依赖度扣
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

  // C3: 贸易路线收益（每条已建立路线产金/影响/粮）
  // P1-5: 贸易差异化——叠加政体被动 tradeMod + 性格 tradeMod + 路线长度修正
  const govDef = GOVERNMENTS[nation.government.type as GovernmentId];
  const govTradeMod = govDef?.perTurn?.tradeMod ?? 1;
  const charTradeMod = cm.tradeMod ?? 1;  // 性格贸易修正（商业共和国/海洋贸易国）
  const routeTradeMod = govTradeMod * charTradeMod;
  let routeIncome = 0;
  let routeInfluence = 0;
  let routeFood = 0;
  for (const ar of nation.activeTradeRoutes) {
    const def = TRADE_ROUTE_BY_ID[ar.routeId];
    if (!def) continue;
    // E16: 禁运路线不产收益
    if (nation.embargoedRoutes?.includes(ar.routeId)) continue;
    // 路线两端省份必须仍归玩家所有，否则路线失效
    const ep1 = state.provinces[def.endpoints[0]];
    const ep2 = state.provinces[def.endpoints[1]];
    if (!ep1 || !ep2) continue;
    const owns1 = ep1.ownerId === nation.id;
    const owns2 = ep2.ownerId === nation.id;
    if (!owns1 && !owns2) continue;  // 两端都不归玩家，路线断
    // 至少一端归玩家即生效；长度修正 × 政体/性格修正
    const mod = LENGTH_MOD[def.length] * routeTradeMod;
    routeIncome += def.yield.gold * mod;
    routeInfluence += def.yield.influence;
    routeFood += def.yield.food ?? 0;
  }

  // 军费（W-fix: D级城邦军费减半，否则1省小国养不起军）
  const armySize = nation.army.reduce((s, a) => s + a.size, 0);
  const milCostMult = nation.tier === 'D' ? 0.25 : 0.5;
  const militaryExpense = armySize * milCostMult;

  // 入库
  nation.resources.gold += netTax + tradeIncome + buildingIncome + routeIncome - militaryExpense;
  nation.resources.wood += wood;
  nation.resources.iron += iron;
  nation.resources.influence += routeInfluence;
  // E18: 文化科技每回合产出影响力（每级 +0.5）+ P-fix 政策 influenceMod 倍率
  nation.resources.influence += (nation.tech.culture * 0.5) * (nation.policyMods?.influenceMod ?? 1);
  nation.resources.food += routeFood;

  // W-fix: D级城邦基础补贴（否则D级饿死）
  if (nation.tier === 'D') {
    nation.resources.gold += 8;
    nation.resources.food += 8; // W-fix: 从5提至8，覆盖军粮消耗
  }
  // P1-4: 性格 goldMod（福利国家 -15% 金等）
  if (cm.goldMod) nation.resources.gold += Math.round(nation.resources.gold * cm.goldMod / 100);
  // P1-4: 性格 sciPtMod（科技国家 +25% 科研点等）
  if (cm.sciPtMod && cm.sciPtMod !== 1) nation.resources.sciPt = Math.round(nation.resources.sciPt * cm.sciPtMod);
  // W-fix: 所有国家最低金保底（防破产螺旋）
  if (nation.resources.gold < -50) nation.resources.gold = -50;

  // P1 行动点闭环：每回合基础补充 adminPt（行政效率决定，3-7 点）
  // 改革杆组的核心阻尼——玩家行动消耗 adminPt，补不足则不能行动
  nation.resources.adminPt = 3 + Math.floor(nation.government.efficiency / 25);  // efficiency 0→3, 50→5, 100→7
  // W-fix: D级军粮消耗极低；人口<50的省免军粮（海洋城邦）
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const foodMilConsume = nation.tier === 'D' ? armySize * 0.1 : (totalPop < 50 ? 0 : armySize * 0.5);
  const foodConsumed = foodMilConsume + provs.reduce((s, p) => s + p.population, 0) * 0.1;
  nation.resources.food += foodProduced - foodConsumed;

  return { taxIncome, tradeIncome, buildingIncome, corruptionLoss, militaryExpense, foodProduced, foodConsumed, woodProduced: wood, ironProduced: iron };
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
