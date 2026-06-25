// Imperium Aeternum — 外交系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §12
// W1.3: 外交稀疏化 + getDefaultRelation API（DEC-013）

import type { GameState, Nation, DiplomaticRelation } from '../types/game';
import { relationDrift, computeThreat } from './formulas';
import { clamp } from '../utils/math';
import { provincesOf, getRelationObj } from './init';
import { addChronicle } from './chronicle';
import { mulberry32 } from '../utils/random';

// ── DEC-013: 默认关系即时计算（稀疏外交核心） ──
// 对于没有显式 DiplomaticRelation 的国家对，按文化/宗教/距离算默认值
export function getDefaultRelation(from: Nation, to: Nation, state: GameState): number {
  let base = 0;  // 中立起点
  // 同文化 +10
  const fromProvs = provincesOf(from.id, state.provinces);
  const toProvs = provincesOf(to.id, state.provinces);
  if (fromProvs.length > 0 && toProvs.length > 0) {
    if (fromProvs[0].culture === toProvs[0].culture) base += 10;
    if (fromProvs[0].religion === toProvs[0].religion) base += 8;
    // 不同宗教 -10
    else base -= 10;
  }
  // 同政体 +5
  if (from.government.type === to.government.type) base += 5;
  // 军国主义对弱国威胁感
  if (from.activeCharacterBonuses.includes('militarism')) base -= 5;
  return clamp(base, -50, 50);
}

// 获取两国外交关系（稀疏优先，无则用默认值）
export function getRelation(from: string, to: string, state: GameState): number {
  const explicit = getRelationObj(from, to, state);
  if (explicit) return explicit.relation;
  const fromN = state.nations[from];
  const toN = state.nations[to];
  if (!fromN || !toN) return 0;
  return getDefaultRelation(fromN, toN, state);
}

// 获取两国外交关系对象（稀疏优先，无则 null）
export function findRelationExplicit(from: string, to: string, state: GameState): DiplomaticRelation | null {
  return getRelationObj(from, to, state) ?? null;
}

// 每回合关系自然漂移
export function settleDiplomacy(state: GameState): void {
  // E9 性能优化：预算 nation→provinces 和 nation→warOpponents 索引
  // 消除内层 O(provinces) 和 O(wars) 扫描（1717 relations × 全省扫描）
  const provsByOwner = new Map<string, ReturnType<typeof provincesOf>>();
  const getProvs = (id: string): ReturnType<typeof provincesOf> => {
    let arr = provsByOwner.get(id);
    if (!arr) { arr = provincesOf(id, state.provinces); provsByOwner.set(id, arr); }
    return arr;
  };
  // nation → 战争对手 Set
  const warOpponents = new Map<string, Set<string>>();
  for (const w of state.wars) {
    let s1 = warOpponents.get(w.attackerId);
    if (!s1) { s1 = new Set(); warOpponents.set(w.attackerId, s1); }
    s1.add(w.defenderId);
    let s2 = warOpponents.get(w.defenderId);
    if (!s2) { s2 = new Set(); warOpponents.set(w.defenderId, s2); }
    s2.add(w.attackerId);
  }

  for (const r of state.relations) {
    // 检查停战期
    if (r.treaty === 'truce' && r.truceTurns > 0) {
      r.truceTurns -= 1;
      if (r.truceTurns === 0) r.treaty = 'none';
    }
    // 边境相邻判定（用缓存）
    const fromProvs = getProvs(r.from);
    const toProvs = getProvs(r.to);
    const borderClash = fromProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === r.to));

    // 共同敌人（用索引，O(1)）
    const fromOps = warOpponents.get(r.from);
    const toOps = warOpponents.get(r.to);
    const atWarWithEachOther = !!(fromOps?.has(r.to));
    const commonEnemy = atWarWithEachOther ? false : !!(
      fromOps && toOps && [...fromOps].some((o) => toOps.has(o))
    );

    // 重新计算威胁
    const fromNation = state.nations[r.from];
    const toNation = state.nations[r.to];
    if (fromNation && toNation) {
      const fromMil = fromNation.army.reduce((s, a) => s + a.size, 0);
      const toMil = toNation.army.reduce((s, a) => s + a.size, 0);
      const toProvCount = toProvs.length;
      r.threat = computeThreat(fromMil, toMil, toProvCount, r.relation);
    }

    if (r.treaty !== 'war') {
      const d = relationDrift(r.treaty, borderClash, r.threat, commonEnemy);
      r.relation = clamp(r.relation + d, -100, 100);
    }
  }

  // P1 杆组闭环：联军反制阻尼——威胁值超阈值的国家被邻国联合抵制
  // 逻辑：对每个国家，统计有多少邻国对其威胁值 ≥70；若 ≥3 个邻国抵制，触发联军反制
  const threatThreshold = 70;
  const coalitionMin = 3;  // 至少 3 个邻国抵制才触发
  for (const nation of Object.values(state.nations)) {
    if (nation.defeated) continue;
    const nationProvs = getProvs(nation.id);
    if (nationProvs.length === 0) continue;
    // 收集所有邻国 id
    const neighborIds = new Set<string>();
    for (const p of nationProvs) {
      for (const adj of p.adjacent) {
        const adjProv = state.provinces[adj];
        if (adjProv && adjProv.ownerId !== nation.id) neighborIds.add(adjProv.ownerId);
      }
    }
    // 统计抵制邻国数（谁觉得该国威胁 ≥70）
    let resisters = 0;
    for (const nid of neighborIds) {
      if (nid === 'rebel' || nid.startsWith('rebel_')) continue;
      const r = getRelationObj(nid, nation.id, state);
      if (r && r.threat >= threatThreshold) resisters++;
    }
    if (resisters >= coalitionMin) {
      // 联军反制：该国稳定 -5、合法性 -3、所有抵制国对其关系再 -10
      nation.government.stability = clamp(nation.government.stability - 5, 0, 100);
      nation.government.legitimacy = clamp(nation.government.legitimacy - 3, 0, 100);
      for (const nid of neighborIds) {
        if (nid === 'rebel' || nid.startsWith('rebel_')) continue;
        const r = getRelationObj(nid, nation.id, state);
        if (r && r.threat >= threatThreshold) {
          r.relation = clamp(r.relation - 10, -100, 100);
          r.threat = clamp(r.threat + 5, 0, 100);  // 抵制国更警觉
        }
      }
      // 纪事记录
      addChronicle(state, {
        id: `coalition_${nation.id}_${state.turn}`,
        turn: state.turn, kind: 'milestone_diplomacy',
        title: `${nation.name} 遭联军反制`,
        desc: `${resisters} 个邻国因威胁过大联合抵制，稳定 -5、合法性 -3。`,
        actorId: nation.id,
      });
    }
  }
}

// 改善关系
export function improveRelation(nation: Nation, target: string, state: GameState): { ok: boolean; reason?: string } {
  if (nation.resources.influence < 20) return { ok: false, reason: '影响力不足' };
  nation.resources.influence -= 20;
  const rel = getRelationObj(nation.id, target, state);
  if (rel) rel.relation = clamp(rel.relation + 5, -100, 100);
  return { ok: true };
}

// 贸易协定
export function establishTrade(nation: Nation, target: string, state: GameState): { ok: boolean; reason?: string } {
  if (nation.resources.influence < 30) return { ok: false, reason: '影响力不足' };
  const rel = getRelationObj(nation.id, target, state);
  if (!rel) return { ok: false, reason: '无外交关系' };
  if (rel.treaty === 'war') return { ok: false, reason: '处于战争' };
  if (rel.relation < 0) return { ok: false, reason: '关系过差' };
  nation.resources.influence -= 30;
  rel.treaty = 'trade';
  rel.tradeDep = 30;
  // 对方关系也改善
  const rel2 = getRelationObj(target, nation.id, state);
  if (rel2) { rel2.treaty = 'trade'; rel2.tradeDep = 30; rel2.relation = clamp(rel2.relation + 10, -100, 100); }
  return { ok: true };
}

// 结盟
export function formAlliance(nation: Nation, target: string, state: GameState): { ok: boolean; reason?: string } {
  if (nation.resources.influence < 50) return { ok: false, reason: '影响力不足' };
  const rel = getRelationObj(nation.id, target, state);
  if (!rel) return { ok: false, reason: '无外交关系' };
  if (rel.relation < 50) return { ok: false, reason: '关系不足' };
  nation.resources.influence -= 50;
  rel.treaty = 'alliance';
  rel.trust = clamp(rel.trust + 20, 0, 100);
  const rel2 = getRelationObj(target, nation.id, state);
  if (rel2) { rel2.treaty = 'alliance'; rel2.trust = clamp(rel2.trust + 20, 0, 100); }
  return { ok: true };
}

// 撕毁条约（信任大降）
export function breakTreaty(nation: Nation, target: string, state: GameState): void {
  const rel = getRelationObj(nation.id, target, state);
  if (rel) { rel.treaty = 'none'; rel.trust = clamp(rel.trust - 30, 0, 100); rel.relation = clamp(rel.relation - 20, -100, 100); }
  const rel2 = getRelationObj(target, nation.id, state);
  if (rel2) { rel2.treaty = 'none'; rel2.trust = clamp(rel2.trust - 30, 0, 100); }
}

// E17: 间谍活动——窃取科技/煽动叛乱/刺探军情（耗影响力，失败降信任）
export function espionage(nation: Nation, target: string, state: GameState, kind: 'steal_tech' | 'foment_rebellion' | 'spy_military'): { ok: boolean; reason?: string; result?: string } {
  if (nation.resources.influence < 40) return { ok: false, reason: '影响力不足（需 40）' };
  const targetNation = state.nations[target];
  if (!targetNation) return { ok: false, reason: '目标国不存在' };
  if (targetNation.defeated) return { ok: false, reason: '目标已亡' };
  const rel = getRelationObj(nation.id, target, state);
  if (rel?.treaty === 'alliance') return { ok: false, reason: '同盟国不可间谍' };
  nation.resources.influence -= 40;
  // P1fix: 确定性 rng——保证同种子可复现（原 Math.random 破坏可复现性）
  const rng = mulberry32((state.seed ^ 0x5DEECE) ^ (state.turn * 31) ^ (nation.id.length * 7));
  // 成功率：基础 50% + 影响力差/10 - 对方行政效率/200
  const efficiencyDef = targetNation.government.efficiency ?? 50;
  const successRate = 0.5 + (nation.resources.influence - targetNation.resources.influence) / 200 - efficiencyDef / 400;
  const success = rng() < Math.max(0.2, Math.min(0.85, successRate));
  if (!success) {
    // 失败：信任大降，关系降，可能触发外交事件
    if (rel) { rel.trust = clamp(rel.trust - 25, 0, 100); rel.relation = clamp(rel.relation - 15, -100, 100); }
    const rel2 = getRelationObj(target, nation.id, state);
    if (rel2) { rel2.trust = clamp(rel2.trust - 25, 0, 100); rel2.relation = clamp(rel2.relation - 15, -100, 100); }
    return { ok: false, reason: '间谍败露！', result: `${targetNation.name} 查获间谍，信任骤降` };
  }
  if (kind === 'steal_tech') {
    // 窃取：随机降对方一科技等级，自己+1（同分支）—— E22: 含 culture 分支
    const branches = ['agri', 'mil', 'admin', 'culture'] as const;
    const branch = branches[Math.floor(rng() * 4)];
    if (targetNation.tech[branch] > 0) {
      targetNation.tech[branch] = Math.max(0, targetNation.tech[branch] - 1);
      nation.tech[branch] = Math.min(8, nation.tech[branch] + 1);
      return { ok: true, result: `窃取 ${targetNation.name} ${branch} 科技成功` };
    }
    return { ok: false, reason: '对方科技不足', result: '无所获' };
  }
  if (kind === 'foment_rebellion') {
    // 煽叛：对方随机省份 unrest +20, rebellionRisk +15
    const targetProvs = Object.values(state.provinces).filter((p) => p.ownerId === target);
    if (targetProvs.length === 0) return { ok: false, reason: '对方无省份' };
    const prov = targetProvs[Math.floor(rng() * targetProvs.length)];
    prov.unrest = clamp(prov.unrest + 20, 0, 100);
    prov.rebellionRisk = clamp(prov.rebellionRisk + 15, 0, 100);
    prov.loyalty = clamp(prov.loyalty - 15, 0, 100);
    return { ok: true, result: `煽动 ${prov.name} 叛乱成功` };
  }
  // spy_military：刺探军情（返回对方军力信息，无副作用）
  const armyTotal = targetNation.army.reduce((s, a) => s + a.size, 0);
  return { ok: true, result: `刺探成功：${targetNation.name} 总兵力 ${armyTotal}，士气均值 ${Math.round(targetNation.army.reduce((s, a) => s + a.morale, 0) / Math.max(1, targetNation.army.length))}` };
}

// E17: 联姻——缔结血脉同盟（耗金+影响力，关系+信任大升，合法+）
export function dynasticMarriage(nation: Nation, target: string, state: GameState): { ok: boolean; reason?: string; result?: string } {
  if (nation.resources.influence < 30) return { ok: false, reason: '影响力不足（需 30）' };
  if (nation.resources.gold < 80) return { ok: false, reason: '金不足（需 80）' };
  const targetNation = state.nations[target];
  if (!targetNation) return { ok: false, reason: '目标国不存在' };
  if (targetNation.defeated) return { ok: false, reason: '目标已亡' };
  const rel = getRelationObj(nation.id, target, state);
  if (!rel) return { ok: false, reason: '无外交关系' };
  if (rel.treaty === 'war') return { ok: false, reason: '处于战争' };
  if (rel.relation < 20) return { ok: false, reason: '关系过差（需≥20）' };
  nation.resources.influence -= 30;
  nation.resources.gold -= 80;
  rel.relation = clamp(rel.relation + 15, -100, 100);
  rel.trust = clamp(rel.trust + 25, 0, 100);
  nation.government.legitimacy = clamp(nation.government.legitimacy + 5, 0, 100);
  const rel2 = getRelationObj(target, nation.id, state);
  if (rel2) { rel2.relation = clamp(rel2.relation + 15, -100, 100); rel2.trust = clamp(rel2.trust + 25, 0, 100); }
  return { ok: true, result: `与 ${targetNation.name} 缔结联姻，血脉同盟` };
}

// E17: 文化输出——向目标国输出文化，提升影响力获取+关系（耗科研点）
export function culturalExport(nation: Nation, target: string, state: GameState): { ok: boolean; reason?: string; result?: string } {
  if (nation.resources.sciPt < 30) return { ok: false, reason: '科研点不足（需 30）' };
  const targetNation = state.nations[target];
  if (!targetNation) return { ok: false, reason: '目标国不存在' };
  if (targetNation.defeated) return { ok: false, reason: '目标已亡' };
  const rel = getRelationObj(nation.id, target, state);
  if (!rel) return { ok: false, reason: '无外交关系' };
  if (rel.treaty === 'war') return { ok: false, reason: '处于战争' };
  nation.resources.sciPt -= 30;
  nation.resources.influence = clamp(nation.resources.influence + 10, 0, 200);
  rel.relation = clamp(rel.relation + 8, -100, 100);
  const rel2 = getRelationObj(target, nation.id, state);
  if (rel2) rel2.relation = clamp(rel2.relation + 8, -100, 100);
  return { ok: true, result: `向 ${targetNation.name} 输出文化，影响力+10` };
}

export { relationDrift };

// ── C1: 纯函数版本 settleDiplomacyPure ──
// 不 mutate state，返回 relations 覆写值 + nations gov delta + chronicle entries
// 与原 settleDiplomacy 并存（零回归）
export interface DiplomacyPartial {
  // 每条 relation 的覆写值（threat/relation/truceTurns/treaty 最终值）
  relationsFinal: Record<string, { threat: number; relation: number; truceTurns: number; treaty: string }>;
  // 联军反制影响的 nation gov 覆写值（stability/legitimacy 最终值）
  nationsGovFinal: Record<string, { stability: number; legitimacy: number }>;
  // 新增 chronicle 条目（processTurn 合并时 push）
  newChronicle: Array<{ id: string; turn: number; kind: 'milestone_diplomacy'; title: string; desc: string; actorId: string }>;
}
export function settleDiplomacyPure(state: GameState): DiplomacyPartial {
  const provsByOwner = new Map<string, ReturnType<typeof provincesOf>>();
  const getProvs = (id: string): ReturnType<typeof provincesOf> => {
    let arr = provsByOwner.get(id);
    if (!arr) { arr = provincesOf(id, state.provinces); provsByOwner.set(id, arr); }
    return arr;
  };
  const warOpponents = new Map<string, Set<string>>();
  for (const w of state.wars) {
    let s1 = warOpponents.get(w.attackerId);
    if (!s1) { s1 = new Set(); warOpponents.set(w.attackerId, s1); }
    s1.add(w.defenderId);
    let s2 = warOpponents.get(w.defenderId);
    if (!s2) { s2 = new Set(); warOpponents.set(w.defenderId, s2); }
    s2.add(w.attackerId);
  }

  // 用 relation key `${from}_${to}` 索引
  const relationsFinal: Record<string, { threat: number; relation: number; truceTurns: number; treaty: string }> = {};
  // nationsGovFinal 延后联军反制填，先记原值
  const nationsGovFinal: Record<string, { stability: number; legitimacy: number }> = {};
  const newChronicle: DiplomacyPartial['newChronicle'] = [];

  // 先建 relation key → relation 对象索引（纯函数不 mutate，用 key 引用原对象算 final）
  const relKey = (r: { from: string; to: string }) => `${r.from}_${r.to}`;
  const relByFromTo: Record<string, typeof state.relations[number]> = {};
  for (const r of state.relations) relByFromTo[relKey(r)] = r;

  // 第一遍：算每条 relation final
  for (const r of state.relations) {
    let finalTruceTurns = r.truceTurns;
    let finalTreaty = r.treaty;
    if (r.treaty === 'truce' && r.truceTurns > 0) {
      finalTruceTurns = r.truceTurns - 1;
      if (finalTruceTurns === 0) finalTreaty = 'none';
    }
    const fromProvs = getProvs(r.from);
    const toProvs = getProvs(r.to);
    const borderClash = fromProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === r.to));
    const fromOps = warOpponents.get(r.from);
    const toOps = warOpponents.get(r.to);
    const atWarWithEachOther = !!(fromOps?.has(r.to));
    const commonEnemy = atWarWithEachOther ? false : !!(fromOps && toOps && [...fromOps].some((o) => toOps.has(o)));
    const fromNation = state.nations[r.from];
    const toNation = state.nations[r.to];
    let finalThreat = r.threat;
    if (fromNation && toNation) {
      const fromMil = fromNation.army.reduce((s, a) => s + a.size, 0);
      const toMil = toNation.army.reduce((s, a) => s + a.size, 0);
      const toProvCount = toProvs.length;
      finalThreat = computeThreat(fromMil, toMil, toProvCount, r.relation);
    }
    let finalRelation = r.relation;
    if (finalTreaty !== 'war') {
      const d = relationDrift(finalTreaty, borderClash, finalThreat, commonEnemy);
      finalRelation = clamp(r.relation + d, -100, 100);
    }
    relationsFinal[relKey(r)] = { threat: finalThreat, relation: finalRelation, truceTurns: finalTruceTurns, treaty: finalTreaty };
  }

  // 第二遍：联军反制（用 relationsFinal 的 threat 判断，等价原函数 mutate 后值）
  const threatThreshold = 70;
  const coalitionMin = 3;
  for (const nation of Object.values(state.nations)) {
    if (nation.defeated) continue;
    const nationProvs = getProvs(nation.id);
    if (nationProvs.length === 0) continue;
    const neighborIds = new Set<string>();
    for (const p of nationProvs) {
      for (const adj of p.adjacent) {
        const adjProv = state.provinces[adj];
        if (adjProv && adjProv.ownerId !== nation.id) neighborIds.add(adjProv.ownerId);
      }
    }
    let resisters = 0;
    const resisterIds: string[] = [];
    for (const nid of neighborIds) {
      if (nid === 'rebel' || nid.startsWith('rebel_')) continue;
      const rf = relationsFinal[`${nid}_${nation.id}`];
      if (rf && rf.threat >= threatThreshold) { resisters++; resisterIds.push(nid); }
    }
    if (resisters >= coalitionMin) {
      nationsGovFinal[nation.id] = {
        stability: clamp(nation.government.stability - 5, 0, 100),
        legitimacy: clamp(nation.government.legitimacy - 3, 0, 100),
      };
      for (const nid of resisterIds) {
        const rf = relationsFinal[`${nid}_${nation.id}`];
        if (rf) {
          rf.relation = clamp(rf.relation - 10, -100, 100);
          rf.threat = clamp(rf.threat + 5, 0, 100);
        }
      }
      newChronicle.push({
        id: `coalition_${nation.id}_${state.turn}`,
        turn: state.turn, kind: 'milestone_diplomacy',
        title: `${nation.name} 遭联军反制`,
        desc: `${resisters} 个邻国因威胁过大联合抵制，稳定 -5、合法性 -3。`,
        actorId: nation.id,
      });
    }
  }

  return { relationsFinal, nationsGovFinal, newChronicle };
}
