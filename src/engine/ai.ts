// Imperium Aeternum — AI 国家决策 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §17
// W1.4: AI 三档结算（DEC-014）— full / lite / static

import type { GameState, Nation } from '../types/game';
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
  target?: string;  // 省份/国家/科技/派系 id
}

// AI 评估本回合应采取的行动
export function planAITurn(nation: Nation, state: GameState, rng: () => number): AIAction[] {
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
  if (lowFood) {
    actions.push({ actionId: 'build_farm', weight: 12 * w.buildFarm, target: leastFarmProvince(provs) });  // W-fix: 提高建农场权重
  }
  if (hasRebellionRisk) actions.push({ actionId: 'suppress', weight: 8 * w.suppress, target: provs.find((p) => p.rebellionRisk > 50)?.id });
  if (lowStab) actions.push({ actionId: 'appease', weight: 6 });
  if (lowTech) actions.push({ actionId: 'research', weight: 8 * w.research });
  if (!atWar) {
    // 评估扩张机会：邻省 ownerId 非同盟 且我军力 > 对方×1.5
    for (const p of provs) {
      for (const adjId of p.adjacent) {
        const adj = state.provinces[adjId];
        if (!adj || adj.ownerId === nation.id) continue;
        const target = state.nations[adj.ownerId];
        if (!target) continue;
        const myMil = nation.army.reduce((s, a) => s + a.size, 0);
        const theirMil = target.army.reduce((s, a) => s + a.size, 0);
        const rel = getRelationObj(nation.id, adj.ownerId, state);
        if (rel?.treaty === 'alliance') continue;
        if (rel?.treaty === 'truce' && rel.truceTurns > 0) continue;
        if (myMil > theirMil * 1.5) {
          actions.push({ actionId: 'declare_war', weight: 6 * w.declareWar, target: adj.ownerId });
          break;
        }
      }
    }
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
      // W-fix: 对无显式关系的邻国也尝试建贸易
      for (const p of provs) {
        for (const adjId of p.adjacent) {
          const adj = state.provinces[adjId];
          if (adj && adj.ownerId !== nation.id && state.nations[adj.ownerId]) {
            tradeTarget = adj.ownerId; break;
          }
        }
        if (tradeTarget) break;
      }
    }
    if (tradeTarget) {
      actions.push({ actionId: 'establish_trade', weight: 15 * w.alliance, target: tradeTarget });  // W-fix: 8→15，更积极
    }
  } else {
    // 战争中：考虑停战
    if (nation.warExhaustion > 50) {
      actions.push({ actionId: 'make_peace', weight: 8 });
    }
    // E22: AI 战争中重新调动军队——若某战争无军队在前线，触发 move_army
    for (const w of state.wars) {
      if (w.attackerId !== nation.id) continue;
      const targetProv = state.provinces[w.targetProvinceId];
      if (!targetProv) continue;
      const hasFrontArmy = nation.army.some((a) =>
        a.size > 0 && (a.location === w.targetProvinceId ||
          (targetProv.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === nation.id))
      );
      if (!hasFrontArmy) {
        actions.push({ actionId: 'move_army', weight: 10, target: w.id });
        break;
      }
    }
    // 补兵
    actions.push({ actionId: 'recruit', weight: 8 * w.expandArmy, target: nation.capital });
  }

  // P-fix: AI 政策推行——稳定度高且金充足时考虑改革（原完全缺失）
  if (nation.government.stability > 50 && nation.resources.gold > 200 && nation.activePolicies.length < 2) {
    actions.push({ actionId: 'enact_policy', weight: 5 * (w.research ?? 1) });
  }

  // 按权重排序，取前 3（行动点上限）
  actions.sort((a, b) => b.weight - a.weight);
  // W-fix: 负粮或粮储低于年消耗时强制建农场（A4：提前触发，不止 food<0）
  const provsAll = provincesOf(nation.id, state.provinces);
  const foodConsume = provsAll.reduce((s, p) => s + p.population, 0) * 0.1;  // 与 economy.ts 消耗率一致
  if (nation.resources.food < foodConsume * 2) {  // 粮储低于 2 年消耗即触发
    const target = leastFarmProvince(provsAll);
    if (target) actions.unshift({ actionId: 'build_farm', weight: 99, target });
    // 同时降税缓解
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
      // E18: 选最低级路线升级（含 culture 第四分支）
      const branches = ['agri', 'mil', 'admin', 'culture'] as const;
      const minBranch = branches.reduce((min, b) => nation.tech[b] < nation.tech[min] ? b : min, 'agri' as 'agri');
      nation.tech[minBranch] = Math.min(8, nation.tech[minBranch] + 1);
      nation.resources.sciPt = Math.max(0, nation.resources.sciPt - 100);
      break;
    }
    case 'appease': {
      // P-fix: 不 mutate 源数组（原 .sort() 原地排序 factions，副作用）
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
      if (!action.target) break;
      // 找一个相邻省份作为目标
      const provs = provincesOf(nation.id, state.provinces);
      const target = provs.flatMap((p) => p.adjacent.map((adj) => state.provinces[adj])).find((p) => p && p.ownerId === action.target);
      if (target) {
        // E21: AI 宣战时把首都军队调动到与目标省份相邻的己省（前线）
        // settleWars 现要求进攻方军队在 targetProvinceId 才推进
        const frontProv = provs.find((p) => p.adjacent.includes(target.id)) ?? provs[0];
        if (frontProv) {
          const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
          if (capitalArmy && frontProv.id !== capitalArmy.location) {
            // 合并到前线省份已有军队
            let dest = nation.army.find((a) => a.location === frontProv.id);
            if (!dest) {
              dest = { id: genId('army'), ownerId: nation.id, location: frontProv.id, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
              nation.army.push(dest);
            }
            dest.size += capitalArmy.size;
            nation.army = nation.army.filter((a) => a.id !== capitalArmy.id);
          }
        }
        // 简化：直接调用 military.declareWar
        // 为避免循环依赖，内联战争创建
        state.wars.push({
          id: genId('war'), attackerId: nation.id, defenderId: action.target,
          targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [],
        });
        nation.atWar = true;
        const r = getRelationObj(nation.id, action.target, state);
        if (r) { r.treaty = 'war'; r.relation = -100; }
      }
      break;
    }
    case 'make_peace': {
      // 结束所有该 AI 参与的战争（用 filter 替代 splice+indexOf，避免 indexOf 返回 -1 时 splice(-1,1) 误删末尾元素）
      const endedWars = state.wars.filter((w) => w.attackerId === nation.id || w.defenderId === nation.id);
      state.wars = state.wars.filter((w) => w.attackerId !== nation.id && w.defenderId !== nation.id);
      for (const w of endedWars) {
        for (const r of state.relations) {
          if ((r.from === w.attackerId && r.to === w.defenderId) ||
              (r.from === w.defenderId && r.to === w.attackerId)) {
            r.treaty = 'truce'; r.truceTurns = 10;
          }
        }
      }
      nation.atWar = false;
      break;
    }
    case 'move_army': {
      // E22: AI 战争中重新调动军队——把首都军队调到目标战争的前线
      if (!action.target) break;
      const war = state.wars.find((w) => w.id === action.target && w.attackerId === nation.id);
      if (!war) break;
      const targetProv = state.provinces[war.targetProvinceId];
      if (!targetProv) break;
      const provs = provincesOf(nation.id, state.provinces);
      const frontProv = provs.find((p) => p.adjacent.includes(war.targetProvinceId));
      if (!frontProv) break;
      const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
      if (!capitalArmy || frontProv.id === capitalArmy.location) break;
      let dest = nation.army.find((a) => a.location === frontProv.id);
      if (!dest) {
        dest = { id: genId('army'), ownerId: nation.id, location: frontProv.id, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
        nation.army.push(dest);
      }
      dest.size += capitalArmy.size;
      nation.army = nation.army.filter((a) => a.id !== capitalArmy.id);
      break;
    }
    case 'establish_trade': {
      if (!action.target) break;
      // W-fix: 门槛从 30 降到 10，AI 更积极建贸易
      if (nation.resources.influence >= 10) {
        nation.resources.influence -= 10;
        const r = getRelationObj(nation.id, action.target, state);
        if (r && r.treaty === 'none' && r.relation >= -10) { r.treaty = 'trade'; r.tradeDep = 20; }
      }
      break;
    }
    case 'enact_policy': {
      // P-fix: AI 推行政策——按政体可选 + 金够 + 未推行 的政策中随机选一个
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
        // P-fix: 确定性 rng（原 Math.random 破坏存档可复现性）
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

// 完整结算：S/A 级 + 玩家邻国（~20 国）
// 完整决策 + 完整行动执行
export function processAITurnFull(nation: Nation, state: GameState, rng: () => number): void {
  const actions = planAITurn(nation, state, rng);
  for (const a of actions) executeAIAction(nation, a, state);
}

// 轻量结算：B/C 级（~90 国）
// 简化决策：建农田、建市场、调税、偶尔改善关系
export function processAITurnLite(nation: Nation, state: GameState, rng: () => number): void {
  // 税率自动向 0.15 回归
  if (nation.taxRate > 0.20) nation.taxRate = clamp(nation.taxRate - 0.01, 0, 0.5);
  if (nation.taxRate < 0.10) nation.taxRate = clamp(nation.taxRate + 0.01, 0, 0.5);
  // 建农田/市场（简化：每 5 回合有概率建一个）
  if (state.turn % 5 === 0 && nation.resources.gold >= 50) {
    const provs = provincesOf(nation.id, state.provinces);
    if (provs.length > 0) {
      const p = provs[Math.floor(rng() * provs.length)];
      const bType = rng() > 0.5 ? 'farm' : 'market';
      p.buildings.push({ id: genId('b'), defId: bType, provinceId: p.id, level: 1 });
      nation.resources.gold -= 50;
    }
  }
  // 偶尔建贸易条约（每 2 回合，提高频率 + 放宽门槛）
  if (state.turn % 2 === 0 && nation.resources.influence >= 5) {
    // E9: Lite 档贸易——遍历 own relations 一次而非全省 relations
    const ownRels = state.relations.filter((x) => x.from === nation.id && x.treaty === 'none' && x.relation > 0);
    if (ownRels.length > 0) { const rel = ownRels[0]; rel.treaty = 'trade'; rel.tradeDep = 20; nation.resources.influence -= 5; }
  }
}

// 静态结算：D 级（~86 国，每 5 回合跑一次）
// 只刷人口，不主动行动
export function processAITurnStatic(nation: Nation, state: GameState): void {
  // D 级城邦/部落几乎不行动，人口由 population engine 统一结算
  // 这里只做：稳定度缓慢回归 50
  if (nation.government.stability < 45) nation.government.stability += 0.5;
  if (nation.government.stability > 55) nation.government.stability -= 0.5;
  // A5: D 级食物兜底——粮储低于年消耗×2 时被动建一个农场（无金成本，模拟自给）
  // 否则 D 级极穷国永远负粮，无法靠 normal AI 流程翻身（Static 档不走 planAITurn）
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length > 0) {
    const foodConsume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
    if (nation.resources.food < foodConsume * 2) {
      // 找最少农场的省份加一个农场（免金，D 级生存逻辑）
      const target = provs.slice().sort((a, b) => {
        const af = a.buildings.filter((x) => x.defId === 'farm').length;
        const bf = b.buildings.filter((x) => x.defId === 'farm').length;
        return af - bf;
      })[0];
      if (target && target.buildings.filter((x) => x.defId === 'farm').length < 3) {
        target.buildings.push({ id: genId('b'), defId: 'farm', provinceId: target.id, level: 1 });
      }
    }
  }
}

// 判断国家是否为玩家邻国（省份相邻）
// E9: 预算玩家邻国 Set（processAITurn 内一次构建，O(1) 查询）
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
  // fallback：直接算
  const playerId = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId, state.provinces);
  return playerProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === nationId));
}

// 处理 AI 回合：按 tier 分层结算（DEC-014）
export function processAITurn(state: GameState): GameState {
  const rng = mulberry32(state.seed ^ 0x5DEECE66D);
  // E9: 预算玩家邻国 Set（191 国复用，消除重复 provincesOf 扫描）
  const playerNeighbors = buildPlayerNeighborSet(state);
  for (const nation of Object.values(state.nations) as Nation[]) {
    if (nation.isPlayer) continue;
    if (nation.defeated) continue;

    const tier = nation.tier;
    // S/A 级 或 玩家邻国 → 完整结算
    if (tier === 'S' || tier === 'A' || isPlayerNeighbor(nation.id, state, playerNeighbors)) {
      processAITurnFull(nation, state, rng);
    }
    // B/C 级 → 轻量结算
    else if (tier === 'B' || tier === 'C') {
      processAITurnLite(nation, state, rng);
    }
    // D 级 → 静态结算（E9 性能优化：每 5→10 回合，D 级 95 国负载减半）
    else if (state.turn % 10 === 0) {
      processAITurnStatic(nation, state);
    }
  }
  return state;
}

export { AI_NATIONS };
