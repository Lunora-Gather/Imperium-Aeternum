// 回合前状态体检：给玩家一个明确的“能不能推进”，也给开发者一套轻量状态诊断。
// 只读纯函数，不修改 GameState；适合总览 UI、测试和未来调试面板复用。

import type { GameState, Nation, Province } from '../types/game';
import { isValidProvinceOwner } from './stateOwnership';

export type ReadinessTone = 'good' | 'warn' | 'danger';
export type ReadinessAudience = 'player' | 'developer';

export interface ReadinessItem {
  id: string;
  title: string;
  detail: string;
  tone: ReadinessTone;
  audience: ReadinessAudience;
  tab?: string;
}

export interface ReadinessReport {
  score: number;
  label: string;
  tone: ReadinessTone;
  canAdvance: boolean;
  blockers: ReadinessItem[];
  warnings: ReadinessItem[];
  advice: ReadinessItem[];
  devChecks: ReadinessItem[];
}

type StateWithAmbition = GameState & { ambitionMeta?: { playerNationId?: string; worldProvinces?: number } };

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function playerOf(state: GameState): Nation | undefined {
  return state.nations[state.playerNationId] ?? Object.values(state.nations).find((nation) => nation.isPlayer && !nation.defeated);
}

function provincesOf(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function armySize(nation: Nation): number {
  return nation.army.reduce((sum, army) => sum + army.size, 0);
}

function relationKey(a: string, b: string): string {
  return `${a}|${b}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function buildReadinessReport(state: GameState): ReadinessReport {
  const items: ReadinessItem[] = [];
  let score = 100;

  const add = (item: ReadinessItem, penalty: number) => {
    items.push(item);
    score -= penalty;
  };

  const player = playerOf(state);
  const pid = player?.id ?? state.playerNationId;

  if (!player) {
    add({ id: 'missing-player', title: '玩家国家缺失', detail: '当前存档找不到玩家国家，建议读档或重新开局。', tone: 'danger', audience: 'developer', tab: 'save' }, 60);
  } else {
    const provs = provincesOf(state, player.id);
    const unrest = provs.filter((p) => p.unrest >= 55 || p.rebellionRisk >= 65);
    const criticalUnrest = provs.filter((p) => p.unrest >= 75 || p.rebellionRisk >= 85);
    const activeWars = state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id);
    const lowSupplyArmies = player.army.filter((a) => a.size > 0 && (a.supply < 35 || a.morale < 30));

    if (state.victory.type) {
      add({ id: 'victory-ended', title: '终局已触发', detail: '当前局已经进入胜负结算，下一回合推进已无必要。', tone: 'danger', audience: 'player', tab: 'dashboard' }, 50);
    }

    const pendingEvents = state.pendingEvents.filter((e) => e.nationId === player.id).length;
    if (pendingEvents > 0) {
      add({ id: 'pending-events', title: '有待决事件', detail: `还有 ${pendingEvents} 个事件未处理，先完成事件选择再推进更稳。`, tone: 'danger', audience: 'player', tab: 'dashboard' }, 28);
    }

    if (player.resources.gold < 0) add({ id: 'gold-negative', title: '国库赤字', detail: `国库为 ${n(player.resources.gold)}，继续拖延会积累破产压力。`, tone: 'danger', audience: 'player', tab: 'economy' }, 18);
    else if (player.resources.gold < 80) add({ id: 'gold-low', title: '国库偏低', detail: `国库仅 ${n(player.resources.gold)}，建设、外交和赈济空间不足。`, tone: 'warn', audience: 'player', tab: 'economy' }, 7);

    if (player.resources.food < 0) add({ id: 'food-negative', title: '粮储告竭', detail: `粮储为 ${n(player.resources.food)}，人口与稳定会承压。`, tone: 'danger', audience: 'player', tab: 'economy' }, 18);
    else if (player.resources.food < 120) add({ id: 'food-low', title: '粮储偏低', detail: `粮储仅 ${n(player.resources.food)}，建议补农田或降低消耗。`, tone: 'warn', audience: 'player', tab: 'province' }, 6);

    if (player.government.stability < 25) add({ id: 'stability-critical', title: '安定危殆', detail: `安定 ${n(player.government.stability)}，叛乱和崩盘风险很高。`, tone: 'danger', audience: 'player', tab: 'politics' }, 22);
    else if (player.government.stability < 45) add({ id: 'stability-low', title: '安定偏低', detail: `安定 ${n(player.government.stability)}，推进前最好先安抚地方。`, tone: 'warn', audience: 'player', tab: 'politics' }, 9);

    if (player.government.legitimacy < 30) add({ id: 'legitimacy-low', title: '法统不足', detail: `法统 ${n(player.government.legitimacy)}，改革与长期统治会更不稳定。`, tone: 'warn', audience: 'player', tab: 'politics' }, 7);
    if (player.government.corruption > 70) add({ id: 'corruption-high', title: '腐败严重', detail: `腐败 ${n(player.government.corruption)}，财政损耗和治理效率会恶化。`, tone: 'danger', audience: 'player', tab: 'politics' }, 12);
    else if (player.government.corruption > 50) add({ id: 'corruption-mid', title: '腐败偏高', detail: `腐败 ${n(player.government.corruption)}，建议尽早反腐或提升治能。`, tone: 'warn', audience: 'player', tab: 'politics' }, 6);

    if (player.warExhaustion > 70) add({ id: 'war-exhaustion-high', title: '厌战严重', detail: `厌战 ${n(player.warExhaustion)}，继续作战会拖累稳定。`, tone: 'danger', audience: 'player', tab: 'military' }, 12);
    else if (player.warExhaustion > 50) add({ id: 'war-exhaustion-mid', title: '厌战偏高', detail: `厌战 ${n(player.warExhaustion)}，考虑停战、补给或休整。`, tone: 'warn', audience: 'player', tab: 'military' }, 6);

    if (criticalUnrest.length > 0) add({ id: 'province-critical-unrest', title: '地方濒临叛乱', detail: `${criticalUnrest.length} 省不满或叛乱风险过高，先镇压或安抚。`, tone: 'danger', audience: 'player', tab: 'province' }, 16);
    else if (unrest.length > 0) add({ id: 'province-unrest', title: '地方骚动', detail: `${unrest.length} 省存在明显不满，继续推进可能扩大风险。`, tone: 'warn', audience: 'player', tab: 'province' }, 7);

    if (activeWars.length > 0 && armySize(player) < Math.max(80, provs.length * 45)) {
      add({ id: 'war-underpowered', title: '战时军力偏薄', detail: `正在 ${activeWars.length} 场战争中，现有军力约 ${n(armySize(player))}。`, tone: 'warn', audience: 'player', tab: 'military' }, 7);
    }
    if (lowSupplyArmies.length > 0) {
      add({ id: 'army-low-readiness', title: '军队补给/士气不足', detail: `${lowSupplyArmies.length} 支军队补给或士气过低，作战表现会下降。`, tone: 'warn', audience: 'player', tab: 'military' }, 6);
    }
  }

  // 开发者视角：轻量状态一致性检查，不阻断普通体验，但会拉低体检分。
  const invalidProvinceOwners = Object.values(state.provinces).filter((p) => !isValidProvinceOwner(state, p.ownerId));
  if (invalidProvinceOwners.length > 0) add({ id: 'invalid-province-owner', title: '省份 ownerId 无效', detail: `${invalidProvinceOwners.length} 个省份指向不存在的国家。`, tone: 'danger', audience: 'developer', tab: 'map' }, 18);

  const invalidWars = state.wars.filter((w) => !state.nations[w.attackerId] || !state.nations[w.defenderId] || !state.provinces[w.targetProvinceId]);
  if (invalidWars.length > 0) add({ id: 'invalid-war-refs', title: '战争引用无效', detail: `${invalidWars.length} 条战争记录引用了不存在的国家或目标省。`, tone: 'danger', audience: 'developer', tab: 'military' }, 18);

  const relationSeen = new Set<string>();
  let duplicateRelations = 0;
  let treatyMismatches = 0;
  const relationMap = new Map(state.relations.map((r) => [relationKey(r.from, r.to), r]));
  const pairSeen = new Set<string>();
  for (const r of state.relations) {
    const key = relationKey(r.from, r.to);
    if (relationSeen.has(key)) duplicateRelations += 1;
    relationSeen.add(key);
    if (!state.nations[r.from] || !state.nations[r.to] || r.from === r.to) continue;
    const pk = pairKey(r.from, r.to);
    if (pairSeen.has(pk)) continue;
    pairSeen.add(pk);
    const rev = relationMap.get(relationKey(r.to, r.from));
    if (!rev) continue;
    if ((r.treaty === 'war' || r.treaty === 'truce' || r.treaty === 'alliance' || r.treaty === 'trade') && r.treaty !== rev.treaty) treatyMismatches += 1;
  }
  if (duplicateRelations > 0) add({ id: 'duplicate-relations', title: '外交关系重复', detail: `${duplicateRelations} 条重复关系会让 UI 或 AI 读取到旧值。`, tone: 'warn', audience: 'developer', tab: 'diplomacy' }, 8);
  if (treatyMismatches > 0) add({ id: 'treaty-mismatch', title: '双向条约不同步', detail: `${treatyMismatches} 组双向外交条约不一致。`, tone: 'warn', audience: 'developer', tab: 'diplomacy' }, 10);

  const activeWarPairs = new Set(state.wars.map((w) => pairKey(w.attackerId, w.defenderId)));
  let warRelationMismatches = 0;
  for (const pk of activeWarPairs) {
    const [a, b] = pk.split('|');
    const r1 = relationMap.get(relationKey(a, b));
    const r2 = relationMap.get(relationKey(b, a));
    if (r1?.treaty !== 'war' || r2?.treaty !== 'war') warRelationMismatches += 1;
  }
  if (warRelationMismatches > 0) add({ id: 'war-relation-mismatch', title: '战争与外交状态不一致', detail: `${warRelationMismatches} 场战争没有同步到双向外交 treaty=war。`, tone: 'warn', audience: 'developer', tab: 'diplomacy' }, 10);

  const orphanArmies = Object.values(state.nations).flatMap((nation) => nation.army.filter((army) => !state.provinces[army.location]).map((army) => `${nation.id}:${army.id}`));
  if (orphanArmies.length > 0) add({ id: 'orphan-armies', title: '军队位置无效', detail: `${orphanArmies.length} 支军队停在不存在的省份。`, tone: 'danger', audience: 'developer', tab: 'military' }, 18);

  const s = state as StateWithAmbition;
  const worldProvinces = Object.keys(state.provinces).length;
  if (!s.ambitionMeta) add({ id: 'ambition-meta-missing', title: '国运基线未持久化', detail: '当前状态没有 ambitionMeta，右侧目标条可能只能临时计算。', tone: 'warn', audience: 'developer', tab: 'dashboard' }, 6);
  else if (s.ambitionMeta.playerNationId !== pid || s.ambitionMeta.worldProvinces !== worldProvinces) add({ id: 'ambition-meta-stale', title: '国运基线与当前局不匹配', detail: 'ambitionMeta 的玩家或世界规模与当前状态不一致。', tone: 'warn', audience: 'developer', tab: 'dashboard' }, 8);

  if (state._relMap) add({ id: 'transient-relmap-present', title: '临时外交缓存仍在状态中', detail: '_relMap 应仅作运行时缓存，保存或跨层传递前应清理。', tone: 'warn', audience: 'developer', tab: 'save' }, 5);

  score = clamp(score);
  const blockers = items.filter((item) => item.tone === 'danger' && item.audience === 'player');
  const warnings = items.filter((item) => item.tone === 'warn' && item.audience === 'player');
  const devChecks = items.filter((item) => item.audience === 'developer');
  const advice = items.filter((item) => item.audience === 'player').slice(0, 5);
  const canAdvance = blockers.length === 0;
  const devDanger = devChecks.some((item) => item.tone === 'danger');
  const tone: ReadinessTone = blockers.length > 0 || devDanger || score < 45 ? 'danger' : warnings.length > 0 || devChecks.length > 0 || score < 75 ? 'warn' : 'good';
  const label = blockers.length > 0 ? '先处理危机' : devDanger ? '状态需修复' : tone === 'warn' ? '可推进但需关注' : '可以推进';

  return { score, label, tone, canAdvance, blockers, warnings, advice, devChecks };
}
