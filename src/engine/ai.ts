// Imperium Aeternum — AI 国家决策 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §17
// W1.4: AI 三档结算（DEC-014）— full / lite / static

import type { GameState, Nation, Province } from '../types/game';
import type { NationTier, NationDef } from '../data/nations';
import { NATIONS, AI_NATIONS, PLAYER_ID } from '../data/nations';
import { provincesOf, getRelationObj, relationPair } from './init';
import { declareWar, makePeace, recruit, relocateArmy, warDeclarationBlocker } from './military';
import { clamp } from '../utils/math';
import { mulberry32 } from '../utils/random';
import { allocateEntityId } from '../utils/id';
import { canAfford, spend } from './economy';
import { BUILDINGS } from '../data/buildings';
import { POLICIES } from '../data/policies';
import { canEnactPolicy, enactPolicy } from './politics';
import { mergeAiWarActionPlan } from '../gameplay/aiWarActionAdapter';
import { startResearch } from './technology';

export function defaultAIWeights(tier: NationTier): NationDef['aiWeights'] {
  const base = { taxUp: 1.0, buildFarm: 1.0, suppress: 0.8, expandArmy: 0.8, alliance: 1.0, declareWar: 0.6, research: 1.0 };
  if (tier === 'S' || tier === 'A') return { ...base, expandArmy: 1.2, declareWar: 0.9, research: 1.2 };
  if (tier === 'D') return { ...base, taxUp: 0.6, buildFarm: 0.5, expandArmy: 0.4, declareWar: 0.3, alliance: 1.5 };
  return base;
}

export type AIActionId =
  | 'tax_up' | 'tax_down' | 'build_farm' | 'build_market' | 'build_barracks'
  | 'recruit' | 'research' | 'appease' | 'suppress' | 'improve_relation'
  | 'declare_war' | 'make_peace' | 'establish_trade' | 'move_army'
  | 'enact_policy';

export interface AIAction {
  actionId: AIActionId;
  weight: number;
  target?: string;
  targetProvinceId?: string;
  reason?: 'desired' | 'revenge' | 'weak_neighbor' | 'frontier';
}

interface TerritoryMemoryLike { desiredProvinceId?: string; revengeProvinceId?: string; pressure?: number; }
interface AIMemoryLike { rivalId?: string; territory?: TerritoryMemoryLike; }
type StateWithAIMemory = GameState & { aiMemory?: Record<string, AIMemoryLike> };

function armySize(nation: Nation | undefined): number {
  return nation ? nation.army.reduce((s, a) => s + a.size, 0) : 0;
}

function isAttackableProvince(nation: Nation, state: GameState, provinceId: string, owned?: Province[]): Province | null {
  const target = state.provinces[provinceId];
  if (!target || target.ownerId === nation.id) return null;
  if (warDeclarationBlocker(state, nation.id, target.ownerId)) return null;
  const ownFront = (owned ?? provincesOf(nation.id, state.provinces)).some((p) => p.adjacent.includes(target.id));
  return ownFront ? target : null;
}

function hasMilitaryEdge(nation: Nation, defender: Nation | undefined, ratio = 1.5): boolean {
  const myMil = armySize(nation);
  const theirMil = armySize(defender);
  return myMil > Math.max(1, theirMil) * ratio;
}

function scoreBorderProvince(nation: Nation, state: GameState, province: Province): number {
  const defender = state.nations[province.ownerId];
  const rel = getRelationObj(nation.id, province.ownerId, state);
  const richness = province.population * 0.012 + province.agriBase * 7 + province.buildings.length * 10 + (province.isCapital ? 28 : 0);
  const hostility = Math.max(0, -(rel?.relation ?? 0)) * 0.45 + (rel?.threat ?? 0) * 0.35;
  const weakness = Math.max(0, armySize(nation) - armySize(defender)) / Math.max(80, armySize(defender) + 1) * 12;
  return richness + hostility + weakness;
}

function chooseExpansionOpportunity(nation: Nation, state: GameState, w: NationDef['aiWeights'], provs: Province[]): AIAction | null {
  const memory = (state as StateWithAIMemory).aiMemory?.[nation.id];
  const preferred: { id?: string; reason: AIAction['reason']; baseWeight: number }[] = [
    { id: memory?.territory?.revengeProvinceId, reason: 'revenge', baseWeight: 11 },
    { id: memory?.territory?.desiredProvinceId, reason: 'desired', baseWeight: 10 },
  ];

  for (const item of preferred) {
    if (!item.id) continue;
    const target = isAttackableProvince(nation, state, item.id, provs);
    if (!target) continue;
    if (!hasMilitaryEdge(nation, state.nations[target.ownerId], item.reason === 'revenge' ? 1.2 : 1.35)) continue;
    const pressure = memory?.territory?.pressure ?? 0;
    return { actionId: 'declare_war', weight: (item.baseWeight + pressure / 18) * w.declareWar, target: target.ownerId, targetProvinceId: target.id, reason: item.reason };
  }

  let best: { province: Province; score: number } | null = null;
  for (const p of provs) {
    for (const adjId of p.adjacent) {
      const adj = isAttackableProvince(nation, state, adjId, provs);
      if (!adj) continue;
      const defender = state.nations[adj.ownerId];
      if (!hasMilitaryEdge(nation, defender, 1.5)) continue;
      const score = scoreBorderProvince(nation, state, adj);
      if (!best || score > best.score) best = { province: adj, score };
    }
  }
  if (!best) return null;
  return { actionId: 'declare_war', weight: (6 + Math.min(8, best.score / 18)) * w.declareWar, target: best.province.ownerId, targetProvinceId: best.province.id, reason: 'weak_neighbor' };
}

export function planAITurn(nation: Nation, state: GameState, rng: () => number): AIAction[] {
  void rng;
  const actions: AIAction[] = [];
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length === 0) return [];

  const def = NATIONS.find((n) => n.id === nation.id);
  const w = def ? def.aiWeights : defaultAIWeights(nation.tier);
  const lowGold = nation.resources.gold < 100;
  const lowFood = nation.resources.food < provs.reduce((s, p) => s + p.population, 0) * 0.3;
  const lowStab = nation.government.stability < 40;
  const hasRebellionRisk = provs.some((p) => p.rebellionRisk > 50);
  const atWar = nation.atWar;
  const lowTech = nation.tech.agri < 3 || nation.tech.mil < 3 || nation.tech.admin < 3 || nation.tech.culture < 3;

  if (lowGold) actions.push({ actionId: 'tax_up', weight: 10 * w.taxUp });
  const farm = BUILDINGS.farm;
  const farmTarget = lowFood && canAfford(nation, farm.costGold, farm.costWood, farm.costIron) ? leastFarmProvince(provs) : undefined;
  if (farmTarget) actions.push({ actionId: 'build_farm', weight: 12 * w.buildFarm, target: farmTarget });
  if (hasRebellionRisk) actions.push({ actionId: 'suppress', weight: 8 * w.suppress, target: provs.find((p) => p.rebellionRisk > 50)?.id });
  if (lowStab) actions.push({ actionId: 'appease', weight: 6 });
  if (lowTech && !nation.tech.researchProgress) actions.push({ actionId: 'research', weight: 8 * w.research });

  if (!atWar) {
    const expansion = chooseExpansionOpportunity(nation, state, w, provs);
    if (expansion) actions.push(expansion);

    for (const r of state.relations) {
      if (r.from === nation.id && r.relation < 30 && r.treaty === 'none') {
        actions.push({ actionId: 'improve_relation', weight: 4 * w.alliance, target: r.to });
        break;
      }
    }

    const tradeTarget = nation.resources.influence >= 10 && state.relations.find((r) =>
      r.from === nation.id && r.treaty === 'none' && r.relation >= -10 && aiTradePair(state, nation, r.to));
    if (tradeTarget) actions.push({ actionId: 'establish_trade', weight: 15 * w.alliance, target: tradeTarget.to });
  } else {
    if (nation.warExhaustion > 50) actions.push({ actionId: 'make_peace', weight: 8 });
    for (const w of state.wars) {
      if (w.attackerId !== nation.id) continue;
      const targetProv = state.provinces[w.targetProvinceId];
      if (!targetProv) continue;
      const hasFrontArmy = nation.army.some((a) =>
        a.size > 0 && (a.location === w.targetProvinceId ||
          (targetProv.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === nation.id))
      );
      if (!hasFrontArmy) { actions.push({ actionId: 'move_army', weight: 10, target: w.id }); break; }
    }
    actions.push({ actionId: 'recruit', weight: 8 * w.expandArmy, target: nation.capital });
  }

  if (nation.government.stability > 50 && nation.resources.gold > 200 && nation.activePolicies.length < 2) actions.push({ actionId: 'enact_policy', weight: 5 * (w.research ?? 1) });

  const planned = !atWar ? mergeAiWarActionPlan(state, nation.id, actions) as AIAction[] : actions;
  planned.sort((a, b) => b.weight - a.weight);
  const foodConsume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
  if (nation.resources.food < foodConsume * 2) {
    const existingFarm = planned.findIndex((action) => action.actionId === 'build_farm');
    if (existingFarm >= 0) planned.splice(existingFarm, 1);
    if (farmTarget) planned.unshift({ actionId: 'build_farm', weight: 99, target: farmTarget });
    if (nation.taxRate > 0.10) planned.push({ actionId: 'tax_down', weight: 50 });
  }
  return planned.slice(0, 3);
}

function leastFarmProvince(provs: Province[]): string | undefined {
  let best: string | undefined;
  let fewest = BUILDINGS.farm.maxPerProvince;
  for (const p of provs) {
    const count = p.buildings.filter((b) => b.defId === 'farm').length;
    if (count < fewest) { best = p.id; fewest = count; }
  }
  return best;
}

function buildAIImprovement(state: GameState, nation: Nation, province: Province | undefined, id: 'farm' | 'market'): void {
  const def = BUILDINGS[id];
  if (!province || province.ownerId !== nation.id || province.buildings.filter((b) => b.defId === id).length >= def.maxPerProvince) return;
  if (!canAfford(nation, def.costGold, def.costWood, def.costIron)) return;
  spend(nation, def.costGold, def.costWood, def.costIron);
  province.buildings.push({ id: allocateEntityId(state, 'building'), defId: id, provinceId: province.id, level: 1 });
}

function moveCapitalArmyToFront(nation: Nation, state: GameState, targetProvinceId: string): void {
  const target = state.provinces[targetProvinceId];
  if (!target) return;
  const provs = provincesOf(nation.id, state.provinces);
  const frontProv = provs.find((p) => p.adjacent.includes(target.id));
  if (!frontProv) return;
  const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
  if (!capitalArmy || frontProv.id === capitalArmy.location) return;
  relocateArmy(state, nation, capitalArmy, frontProv.id);
}

function aiTradePair(state: GameState, nation: Nation, target: string) {
  const partner = state.nations[target];
  if (!partner || partner.defeated || target === nation.id) return null;
  const pair = relationPair(state, nation.id, target);
  return pair?.every((r) => r.treaty === 'none' && r.relation >= -10) ? pair : null;
}

function signAITrade(state: GameState, nation: Nation, target: string, cost: number): void {
  const pair = aiTradePair(state, nation, target);
  if (!pair || nation.resources.influence < cost) return;
  nation.resources.influence -= cost;
  for (const r of pair) { r.treaty = 'trade'; r.tradeDep = Math.max(r.tradeDep, 20); }
}

export function executeAIAction(nation: Nation, action: AIAction, state: GameState): void {
  switch (action.actionId) {
    case 'tax_up': nation.taxRate = clamp(nation.taxRate + 0.02, 0, 0.5); break;
    case 'tax_down': nation.taxRate = clamp(nation.taxRate - 0.02, 0, 0.5); break;
    case 'build_farm':
    case 'build_market':
      if (action.target) buildAIImprovement(state, nation, state.provinces[action.target], action.actionId === 'build_farm' ? 'farm' : 'market');
      break;
    case 'recruit': {
      const province = action.target && state.provinces[action.target];
      if (province && province.population > 50) recruit(state, nation, province, 50);
      break;
    }
    case 'research': {
      const branches = ['agri', 'mil', 'admin', 'culture'] as const;
      const minBranch = branches.reduce((min, b) => nation.tech[b] < nation.tech[min] ? b : min, 'agri' as 'agri');
      startResearch(nation, `${minBranch}_lv${nation.tech[minBranch] + 1}`);
      break;
    }
    case 'appease': {
      const low = [...nation.factions].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      if (low && nation.resources.gold >= 30) { nation.resources.gold -= 30; low.satisfaction = clamp(low.satisfaction + 8, 0, 100); }
      break;
    }
    case 'suppress': {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p?.ownerId === nation.id && nation.resources.gold >= 50) { nation.resources.gold -= 50; p.unrest = clamp(p.unrest - 15, 0, 100); }
      break;
    }
    case 'improve_relation': {
      if (!action.target) break;
      const pair = relationPair(state, nation.id, action.target);
      if (nation.resources.influence >= 20 && pair?.every((r) => r.treaty === 'none') && !state.nations[action.target]?.defeated) {
        nation.resources.influence -= 20;
        for (const r of pair) r.relation = clamp(r.relation + 5, -100, 100);
      }
      break;
    }
    case 'declare_war': {
      const id = action.targetProvinceId ?? provincesOf(nation.id, state.provinces).flatMap((p) => p.adjacent)
        .find((id) => state.provinces[id]?.ownerId === action.target);
      const target = id && isAttackableProvince(nation, state, id);
      if (!target || (action.target && target.ownerId !== action.target)) break;
      if (declareWar(state, nation.id, target.ownerId, target.id)) moveCapitalArmyToFront(nation, state, target.id);
      break;
    }
    case 'make_peace': {
      const warsToEnd = state.wars.filter((w) => w.attackerId === nation.id || w.defenderId === nation.id);
      for (const w of warsToEnd) makePeace(state, w);
      break;
    }
    case 'move_army': {
      if (!action.target) break;
      const war = state.wars.find((w) => w.id === action.target && w.attackerId === nation.id);
      if (!war) break;
      moveCapitalArmyToFront(nation, state, war.targetProvinceId);
      break;
    }
    case 'establish_trade':
      if (action.target) signAITrade(state, nation, action.target, 10);
      break;
    case 'enact_policy': {
      const aiPolicyIds = new Set(['census', 'merchant_guild', 'military_reform', 'infrastructure_plan', 'education_reform', 'welfare']);
      const avail = POLICIES.filter((policy) => aiPolicyIds.has(policy.id) && canEnactPolicy(nation, policy.id).ok);
      if (avail.length > 0) {
        const prng = mulberry32((state.seed ^ 0x5DEECE) ^ (state.turn * 31) ^ (nation.id.length * 7));
        const pick = avail[Math.floor(prng() * avail.length)];
        enactPolicy(nation, pick.id, state);
      }
      break;
    }
  }
}

export function processAITurnFull(nation: Nation, state: GameState, rng: () => number): void {
  const actions = planAITurn(nation, state, rng);
  for (const a of actions) executeAIAction(nation, a, state);
}

export function processAITurnLite(nation: Nation, state: GameState, rng: () => number): void {
  if (nation.taxRate > 0.20) nation.taxRate = clamp(nation.taxRate - 0.01, 0, 0.5);
  if (nation.taxRate < 0.10) nation.taxRate = clamp(nation.taxRate + 0.01, 0, 0.5);
  if (state.turn % 5 === 0 && nation.resources.gold >= 50) {
    const provs = provincesOf(nation.id, state.provinces);
    if (provs.length > 0) {
      const p = provs[Math.floor(rng() * provs.length)];
      const bType = rng() > 0.5 ? 'farm' : 'market';
      buildAIImprovement(state, nation, p, bType);
    }
  }
  if (state.turn % 2 === 0 && nation.resources.influence >= 5) {
    const partner = state.relations.find((r) => r.from === nation.id && r.relation > 0 && r.treaty === 'none' && aiTradePair(state, nation, r.to));
    if (partner) signAITrade(state, nation, partner.to, 5);
  }
}

export function processAITurnStatic(nation: Nation, state: GameState): void {
  if (nation.government.stability < 45) nation.government.stability += 0.5;
  if (nation.government.stability > 55) nation.government.stability -= 0.5;
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length > 0) {
    const foodConsume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
    if (nation.resources.food < foodConsume * 2) {
      const target = provs.slice().sort((a, b) => {
        const af = a.buildings.filter((x) => x.defId === 'farm').length;
        const bf = b.buildings.filter((x) => x.defId === 'farm').length;
        return af - bf;
      })[0];
      if (target && target.buildings.filter((x) => x.defId === 'farm').length < 3) target.buildings.push({ id: allocateEntityId(state, 'building'), defId: 'farm', provinceId: target.id, level: 1 });
    }
  }
}

function buildPlayerNeighborSet(state: GameState): Set<string> {
  const playerId = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId, state.provinces);
  const neighbors = new Set<string>();
  for (const p of playerProvs) {
    for (const adj of p.adjacent) {
      const adjProv = state.provinces[adj];
      if (adjProv && adjProv.ownerId !== playerId) neighbors.add(adjProv.ownerId);
    }
  }
  return neighbors;
}

export function processAITurn(state: GameState, excludedNationIds: ReadonlySet<string> = new Set()): GameState {
  const rng = mulberry32(state.seed ^ 0x5DEECE66D);
  const playerNeighbors = buildPlayerNeighborSet(state);
  for (const nation of Object.values(state.nations) as Nation[]) {
    if (nation.isPlayer || excludedNationIds.has(nation.id)) continue;
    if (nation.defeated) continue;
    const tier = nation.tier;
    if (tier === 'S' || tier === 'A' || playerNeighbors.has(nation.id)) processAITurnFull(nation, state, rng);
    else if (tier === 'B' || tier === 'C') processAITurnLite(nation, state, rng);
    else if (state.turn % 10 === 0) processAITurnStatic(nation, state);
  }
  return state;
}

export { AI_NATIONS };
