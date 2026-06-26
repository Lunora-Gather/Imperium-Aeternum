// Imperium Aeternum — AI 国家决策 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §17
// W1.4: AI 三档结算（DEC-014）— full / lite / static

import type { GameState, Nation, Province } from '../types/game';
import type { NationTier, NationDef } from '../data/nations';
import { NATIONS, AI_NATIONS, PLAYER_ID } from '../data/nations';
import { provincesOf, getRelationObj } from './init';
import { clamp } from '../utils/math';
import { mulberry32 } from '../utils/random';
import { genId } from '../utils/id';
import type { PolicyId } from '../data/policies';

// W-fix: 世界生成国家的默认 AI 权重（按 tier）——导出供世界生成复用
export function defaultAIWeights(tier: NationTier): NationDef['aiWeights'] {
  const base = { taxUp: 1.0, buildFarm: 1.0, suppress: 0.8, expandArmy: 0.8, alliance: 1.0, declareWar: 0.6, research: 1.0 };
  if (tier === 'S' || tier === 'A') return { ...base, expandArmy: 1.2, declareWar: 0.9, research: 1.2 };
  if (tier === 'D') return { ...base, taxUp: 0.6, buildFarm: 0.5, expandArmy: 0.4, declareWar: 0.3, alliance: 1.5 };
  return base;
}

// AI 决策行动 id
export type AIActionId =
  | 'tax_up' | 'tax_down' | 'build_farm' | 'build_market' | 'build_barracks'
  | 'recruit' | 'research' | 'appease' | 'suppress' | 'improve_relation'
  | 'declare_war' | 'make_peace' | 'establish_trade' | 'move_army'
  | 'enact_policy';  // P-fix: AI 推行政策（原完全缺失）

export interface AIAction {
  actionId: AIActionId;
  weight: number;
  target?: string;  // 省份/国家/科技/派系 id；宣战时为 defender nation id
  targetProvinceId?: string; // O12: 宣战闭环，绑定 AI 觊觎/复仇的真实战争目标省
  reason?: 'desired' | 'revenge' | 'weak_neighbor' | 'frontier';
}

interface TerritoryMemoryLike {
  desiredProvinceId?: string;
  revengeProvinceId?: string;
  pressure?: number;
}
interface AIMemoryLike {
  rivalId?: string;
  territory?: TerritoryMemoryLike;
}
type StateWithAIMemory = GameState & { aiMemory?: Record<string, AIMemoryLike> };

function armySize(nation: Nation | undefined): number {
  return nation ? nation.army.reduce((s, a) => s + a.size, 0) : 0;
}

function isAttackableProvince(nation: Nation, state: GameState, provinceId: string): Province | null {
  const target = state.provinces[provinceId];
  if (!target || target.ownerId === nation.id) return null;
  const defender = state.nations[target.ownerId];
  if (!defender || defender.defeated) return null;
  const rel = getRelationObj(nation.id, target.ownerId, state);
  if (rel?.treaty === 'alliance') return null;
  if (rel?.treaty === 'truce' && rel.truceTurns > 0) return null;
  if (state.wars.some((w) => (w.attackerId === nation.id && w.defenderId === target.ownerId) || (w.attackerId === target.ownerId && w.defenderId === nation.id))) return null;
  const ownFront = provincesOf(nation.id, state.provinces).some((p) => p.adjacent.includes(target.id));
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

function chooseExpansionOpportunity(nation: Nation, state: GameState, w: NationDef['aiWeights']): AIAction | null {
  const memory = (state as StateWithAIMemory).aiMemory?.[nation.id];
  const preferred: { id?: string; reason: AIAction['reason']; baseWeight: number }[] = [
    { id: memory?.territory?.revengeProvinceId, reason: 'revenge', baseWeight: 11 },
    { id: memory?.territory?.desiredProvinceId, reason: 'desired', baseWeight: 10 },
  ];

  for (const item of preferred) {
    if (!item.id) continue;
    const target = isAttackableProvince(nation, state, item.id);
    if (!target) continue;
    if (!hasMilitaryEdge(nation, state.nations[target.ownerId], item.reason === 'revenge' ? 1.2 : 1.35)) continue;
    const pressure = memory?.territory?.pressure ?? 0;
    return {
      actionId: 'declare_war',
      weight: (item.baseWeight + pressure / 18) * w.declareWar,
      target: target.ownerId,
      targetProvinceId: target.id,
      reason: item.reason,
    };
  }

  let best: { province: Province; score: number } | null = null;
  const provs = provincesOf(nation.id, state.provinces);
  for (const p of provs) {
    for (const adjId of p.adjacent) {
      const adj = isAttackableProvince(nation, state, adjId);
      if (!adj) continue;
      const defender = state.nations[adj.ownerId];
      if (!hasMilitaryEdge(nation, defender, 1.5)) continue;
      const score = scoreBorderProvince(nation, state, adj);
      if (!best || score > best.score) best = { province: adj, score };
    }
  }
  if (!best) return null;
  return {
    actionId: 'declare_war',
    weight: (6 + Math.min(8, best.score / 18)) * w.declareWar,
    target: best.province.ownerId,
    targetProvinceId: best.province.id,
    reason: 'weak_neighbor',
  };
}

// AI 评估本回合应采取的行动
export function planAITurn(nation: Nation, state: GameState, rng: () => number): AIAction[] {
  void rng;
  const actions: AIAction[] = [];
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length === 0) return [];

  const def = NATIONS.find((n) => n.id === nation.id);
  // W-fix: 世界生成国家不在 NATIONS 数组中，用 tier 默认权重
  const w = def ? def.aiWeights : defaultAIWeights(nation.tier);

  // 维度评估
  const lowGold = nation.resources.gold < 100;
  const lowFood = nation.resources.food < provs.reduce((s, p) => s + p.population, 0) * 0.3;  // W-fix: 阈值从 0.5 降到 0.3
  const lowStab = nation.government.stability < 40;  // W-fix: 从 30 提到 40，AI 更早安抚
  const hasRebellionRisk = provs.some((p) => p.rebellionRisk > 50);
  const atWar = nation.atWar;
  const lowTech = nation.tech.agri < 3 || nation.tech.mil < 3 || nation.tech.admin < 3 || nation.tech.culture < 3;

  // 候选行动 + 性格权重
  if (lowGold) actions.push({ actionId: 'tax_up', weight: 10 * w.taxUp });
  if (lowFood) actions.push({ actionId: 'build_farm', weight: 12 * w.buildFarm, target: leastFarmProvince(provs) });
  if (hasRebellionRisk) actions.push({ actionId: 'suppress', weight: 8 * w.suppress, target: provs.find((p) => p.rebellionRisk > 50)?.id });
  if (lowStab) actions.push({ actionId: 'appease', weight: 6 });
  if (lowTech) actions.push({ actionId: 'research', weight: 8 * w.research });
  if (!atWar) {
    const expansion = chooseExpansionOpportunity(nation, state, w);
    if (expansion) actions.push(expansion);

    // 改善关系
    for (const r of state.relations) {
      if (r.from === nation.id && r.relation < 30 && r.treaty === 'none') {
        actions.push({ actionId: 'improve_relation', weight: 4 * w.alliance, target: r.to });
        break;
      }
    }
    // 贸易（W-fix v2: 同时查显式和隐式关系，找贸易伙伴；门槛放宽到 relation>-10，容忍轻度敌对商贸）
    let tradeTarget: string | undefined;
    for (const r of state.relations) {
      if (r.from === nation.id && r.relation > -10 && r.treaty === 'none') { tradeTarget = r.to; break; }
    }
    if (!tradeTarget) {
      for (const p of provs) {
        for (const adjId of p.adjacent) {
          const adj = state.provinces[adjId];
          if (adj && adj.ownerId !== nation.id && state.nations[adj.ownerId]) { tradeTarget = adj.ownerId; break; }
        }
        if (tradeTarget) break;
      }
    }
    if (tradeTarget) actions.push({ actionId: 'establish_trade', weight: 15 * w.alliance, target: tradeTarget });
  } else {
    // 战争中：考虑停战
    if (nation.warExhaustion > 50) actions.push({ actionId: 'make_peace', weight: 8 });
    // E22: AI 战争中重新调动军队——若某战争无军队在前线，触发 move_army
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
    // 补兵
    actions.push({ actionId: 'recruit', weight: 8 * w.expandArmy, target: nation.capital });
  }

  // P-fix: AI 政策推行——稳定度高且金充足时考虑改革（原完全缺失）
  if (nation.government.stability > 50 && nation.resources.gold > 200 && nation.activePolicies.length < 2) actions.push({ actionId: 'enact_policy', weight: 5 * (w.research ?? 1) });

  // 按权重排序，取前 3（行动点上限）
  actions.sort((a, b) => b.weight - a.weight);
  // W-fix: 负粮或粮储低于年消耗时强制建农场（A4：提前触发，不止 food<0）
  const provsAll = provincesOf(nation.id, state.provinces);
  const foodConsume = provsAll.reduce((s, p) => s + p.population, 0) * 0.1;  // 与 economy.ts 消耗率一致
  if (nation.resources.food < foodConsume * 2) {
    const target = leastFarmProvince(provsAll);
    if (target) actions.unshift({ actionId: 'build_farm', weight: 99, target });
    if (nation.taxRate > 0.10) actions.push({ actionId: 'tax_down', weight: 50 });
  }
  return actions.slice(0, 3);
}

function leastFarmProvince(provs: ReturnType<typeof provincesOf>): string | undefined {
  let best = provs[0];
  for (const p of provs) {
    const farms = p.buildings.filter((b) => b.defId === 'farm').length;
    const bestFarms = best.buildings.filter((b) => b.defId === 'farm').length;
    if (farms < bestFarms) best = p;
  }
  return best?.id;
}

function moveCapitalArmyToFront(nation: Nation, state: GameState, targetProvinceId: string): void {
  const target = state.provinces[targetProvinceId];
  if (!target) return;
  const provs = provincesOf(nation.id, state.provinces);
  const frontProv = provs.find((p) => p.adjacent.includes(target.id)) ?? provs[0];
  if (!frontProv) return;
  const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
  if (!capitalArmy || frontProv.id === capitalArmy.location) return;
  let dest = nation.army.find((a) => a.location === frontProv.id);
  if (!dest) {
    dest = { id: genId('army'), ownerId: nation.id, location: frontProv.id, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
    nation.army.push(dest);
  }
  dest.size += capitalArmy.size;
  nation.army = nation.army.filter((a) => a.id !== capitalArmy.id);
}

// 执行 AI 行动（简化版，直接修改 state）
export function executeAIAction(nation: Nation, action: AIAction, state: GameState): void {
  switch (action.actionId) {
    case 'tax_up':
      nation.taxRate = clamp(nation.taxRate + 0.02, 0, 0.5);
      break;
    case 'tax_down':
      nation.taxRate = clamp(nation.taxRate - 0.02, 0, 0.5);
      break;
    case 'build_farm': {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 50) {
        nation.resources.gold -= 50;
        p.buildings.push({ id: genId('b'), defId: 'farm', provinceId: p.id, level: 1 });
      }
      break;
    }
    case 'build_market': {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 80) {
        nation.resources.gold -= 80;
        p.buildings.push({ id: genId('b'), defId: 'market', provinceId: p.id, level: 1 });
      }
      break;
    }
    case 'recruit': {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 75 && nation.resources.supply >= 10 && p.population > 50) {
        nation.resources.gold -= 75;
        nation.resources.supply -= 10;
        p.population -= 50;
        let army = nation.army.find((a) => a.location === action.target);
        if (!army) {
          army = { id: genId('army'), ownerId: nation.id, location: action.target, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
          nation.army.push(army);
        }
        army.size += 50;
      }
      break;
    }
    case 'research': {
      const branches = ['agri', 'mil', 'admin', 'culture'] as const;
      const minBranch = branches.reduce((min, b) => nation.tech[b] < nation.tech[min] ? b : min, 'agri' as 'agri');
      nation.tech[minBranch] = Math.min(8, nation.tech[minBranch] + 1);
      nation.resources.sciPt = Math.max(0, nation.resources.sciPt - 100);
      break;
    }
    case 'appease': {
      const low = [...nation.factions].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      if (low && nation.resources.gold >= 30) {
        nation.resources.gold -= 30;
        low.satisfaction = clamp(low.satisfaction + 8, 0, 100);
      }
      break;
    }
    case 'suppress': {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 50) {
        nation.resources.gold -= 50;
        p.unrest = clamp(p.unrest - 15, 0, 100);
      }
      break;
    }
    case 'improve_relation': {
      if (!action.target) break;
      if (nation.resources.influence >= 20) {
        nation.resources.influence -= 20;
        const r = getRelationObj(nation.id, action.target, state);
        if (r) r.relation = clamp(r.relation + 5, -100, 100);
      }
      break;
    }
    case 'declare_war': {
      const targetProvince = action.targetProvinceId ? isAttackableProvince(nation, state, action.targetProvinceId) : null;
      const fallbackTarget = !targetProvince && action.target
        ? provincesOf(nation.id, state.provinces).flatMap((p) => p.adjacent.map((adj) => state.provinces[adj])).find((p) => p && p.ownerId === action.target)
        : null;
      const target = targetProvince ?? fallbackTarget ?? null;
      if (!target) break;
      const defenderId = target.ownerId;
      moveCapitalArmyToFront(nation, state, target.id);
      state.wars.push({ id: genId('war'), attackerId: nation.id, defenderId, targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [] });
      nation.atWar = true;
      const defender = state.nations[defenderId];
      if (defender) defender.atWar = true;
      const r = getRelationObj(nation.id, defenderId, state);
      const rr = getRelationObj(defenderId, nation.id, state);
      if (r) { r.treaty = 'war'; r.relation = -100; }
      if (rr) { rr.treaty = 'war'; rr.relation = -100; }
      state._relMap = undefined;
      break;
    }
    case 'make_peace': {
      const endedWars = state.wars.filter((w) => w.attackerId === nation.id || w.defenderId === nation.id);
      state.wars = state.wars.filter((w) => w.attackerId !== nation.id && w.defenderId !== nation.id);
      for (const w of endedWars) {
        for (const r of state.relations) {
          if ((r.from === w.attackerId && r.to === w.defenderId) || (r.from === w.defenderId && r.to === w.attackerId)) {
            r.treaty = 'truce'; r.truceTurns = 10;
          }
        }
      }
      nation.atWar = false;
      break;
    }
    case 'move_army': {
      if (!action.target) break;
      const war = state.wars.find((w) => w.id === action.target && w.attackerId === nation.id);
      if (!war) break;
      moveCapitalArmyToFront(nation, state, war.targetProvinceId);
      break;
    }
    case 'establish_trade': {
      if (!action.target) break;
      if (nation.resources.influence >= 10) {
        nation.resources.influence -= 10;
        const r = getRelationObj(nation.id, action.target, state);
        const rr = getRelationObj(action.target, nation.id, state);
        if (r && r.treaty === 'none' && r.relation >= -10) { r.treaty = 'trade'; r.tradeDep = 20; }
        if (rr && rr.treaty === 'none' && rr.relation >= -10) { rr.treaty = 'trade'; rr.tradeDep = Math.max(rr.tradeDep, 20); }
      }
      break;
    }
    case 'enact_policy': {
      const POLICIES_AI: { id: string; costGold: number; allowedGovernments: string[]; effects: Record<string, unknown> }[] = [
        { id: 'census', costGold: 150, allowedGovernments: ['empire', 'monarchy'], effects: {} },
        { id: 'merchant_guild', costGold: 120, allowedGovernments: ['republic', 'merchant_republic', 'monarchy'], effects: {} },
        { id: 'military_reform', costGold: 200, allowedGovernments: ['empire', 'monarchy', 'junta'], effects: {} },
        { id: 'infrastructure_plan', costGold: 220, allowedGovernments: [], effects: {} },
        { id: 'education_reform', costGold: 200, allowedGovernments: [], effects: {} },
        { id: 'welfare', costGold: 150, allowedGovernments: [], effects: {} },
      ];
      const avail = POLICIES_AI.filter((p) =>
        nation.resources.gold >= p.costGold &&
        !nation.activePolicies.some((ap) => ap.policyId === p.id) &&
        (p.allowedGovernments.length === 0 || p.allowedGovernments.includes(nation.government.type))
      );
      if (avail.length > 0) {
        const prng = mulberry32((state.seed ^ 0x5DEECE) ^ (state.turn * 31) ^ (nation.id.length * 7));
        const pick = avail[Math.floor(prng() * avail.length)];
        nation.resources.gold -= pick.costGold;
        nation.activePolicies.push({ policyId: pick.id as PolicyId, enactedTurn: state.turn });
      }
      break;
    }
  }
}

// ── W1.4: AI 三档结算（DEC-014） ──

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
      p.buildings.push({ id: genId('b'), defId: bType, provinceId: p.id, level: 1 });
      nation.resources.gold -= 50;
    }
  }
  if (state.turn % 2 === 0 && nation.resources.influence >= 5) {
    const ownRels = state.relations.filter((x) => x.from === nation.id && x.treaty === 'none' && x.relation > 0);
    if (ownRels.length > 0) { const rel = ownRels[0]; rel.treaty = 'trade'; rel.tradeDep = 20; nation.resources.influence -= 5; }
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
      if (target && target.buildings.filter((x) => x.defId === 'farm').length < 3) target.buildings.push({ id: genId('b'), defId: 'farm', provinceId: target.id, level: 1 });
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

function isPlayerNeighbor(nationId: string, state: GameState, neighborSet?: Set<string>): boolean {
  if (neighborSet) return neighborSet.has(nationId);
  const playerId = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId, state.provinces);
  return playerProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === nationId));
}

export function processAITurn(state: GameState): GameState {
  const rng = mulberry32(state.seed ^ 0x5DEECE66D);
  const playerNeighbors = buildPlayerNeighborSet(state);
  for (const nation of Object.values(state.nations) as Nation[]) {
    if (nation.isPlayer) continue;
    if (nation.defeated) continue;

    const tier = nation.tier;
    if (tier === 'S' || tier === 'A' || isPlayerNeighbor(nation.id, state, playerNeighbors)) processAITurnFull(nation, state, rng);
    else if (tier === 'B' || tier === 'C') processAITurnLite(nation, state, rng);
    else if (state.turn % 10 === 0) processAITurnStatic(nation, state);
  }
  return state;
}

export { AI_NATIONS };
