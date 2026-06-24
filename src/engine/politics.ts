// Imperium Aeternum — 政治系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §8

import type { Nation, Province, GameState } from '../types/game';
import { stabilityDelta, legitimacyDelta, factionWeightedSat, reformSuccessRate, maxProvinces } from './formulas';
import { clamp } from '../utils/math';
import { provincesOf } from './init';
import { GOVERNMENTS } from '../data/governments';
import { POLICIES } from '../data/policies';
import { LAWS } from '../data/laws';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { GovernmentId } from '../data/governments';
import type { PolicyId } from '../data/policies';
import type { NationalCharacterId, NationalCharacterMods } from '../data/national-characters';

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

export interface PoliticsResult {
  stabilityDelta: number;
  legitimacyDelta: number;
}

export function settlePolitics(nation: Nation, state: GameState): PoliticsResult {
  const provs = provincesOf(nation.id, state.provinces);
  const fw = factionWeightedSat(nation.factions);
  const avgUnrest = provs.length ? provs.reduce((s, p) => s + p.unrest, 0) / provs.length : 0;
  const rebellionProvCount = provs.filter((p) => p.rebellionRisk >= 100).length;

  const dStab = stabilityDelta(
    nation.government.legitimacy, fw.weighted, fw.totalPower,
    avgUnrest, nation.warExhaustion, rebellionProvCount,
  );
  // W-fix v3 (A3): 调高分段回归力，让 A 级大国能爬到 60+
  // 旧 v2 在 stab<55 时 +2.5、55-70 时只 +1，导致 A 级卡在 55 平衡点上不去
  let finalDelta = dStab;
  // A2: 内战期间先扣 -3（在回归力前，确保惩罚始终可见，不被回归力盖过）
  if (nation.civilWar?.active) {
    finalDelta -= 3;
  }
  const stab = nation.government.stability;
  // A2: 内战时回归力减弱（濒死保护从 +5 降到 +2，让内战惩罚有效但不致死）
  const atWar = nation.civilWar?.active;
  if (stab < 40) {
    finalDelta = Math.max(finalDelta, atWar ? 2 : 5);   // 危殆：内战 +2 / 平时 +5
  } else if (stab < 60) {
    finalDelta = Math.max(finalDelta, atWar ? 1 : 3);   // 低：内战 +1 / 平时 +3
  } else if (stab < 75) {
    finalDelta = Math.max(finalDelta, atWar ? 0 : 1.5); // 中：内战 +0 / 平时 +1.5
  } else {
    finalDelta = Math.max(finalDelta, -2);              // 高：只防大跌
  }
  nation.government.stability = clamp(nation.government.stability + finalDelta, 0, 100);

  // 改革冲击：检查最近 3 回合内是否有改革
  const reformShockTurns = nation.activePolicies.filter(
    (p) => state.turn - p.enactedTurn < 3,
  ).length > 0 ? 1 : 0;

  const dLegit = legitimacyDelta(fw.avgSat, nation.government.corruption, nation.warExhaustion, reformShockTurns);
  nation.government.legitimacy = clamp(nation.government.legitimacy + dLegit, 0, 100);
  // E18: 文化科技合法性加成（每级 +0.3/回合，缓慢抬升法统根基）
  nation.government.legitimacy = clamp(nation.government.legitimacy + nation.tech.culture * 0.3, 0, 100);

  // 腐败自然演变：稳定度高的国家自我净化，低的国家恶化
  const hasAntiCorruption = nation.activePolicies.some((p) => p.policyId === 'anti_corruption');
  let corruptionDelta: number;
  if (hasAntiCorruption) {
    corruptionDelta = -1;
  } else if (nation.government.stability >= 70) {
    corruptionDelta = -0.2;  // 治世清明，腐败自然下降
  } else if (nation.government.stability >= 50) {
    corruptionDelta = 0.1;   // 平世微涨
  } else {
    corruptionDelta = 0.4;   // 乱世加速腐败
  }
  nation.government.corruption = clamp(nation.government.corruption + corruptionDelta, 0, 100);

  // P1-4: 性格加成——稳定度/合法性/行政效率/派系满意度
  const cm = charMods(nation);
  if (cm.stabilityMod) nation.government.stability = clamp(nation.government.stability + cm.stabilityMod, 0, 100);
  if (cm.legitimacyMod) nation.government.legitimacy = clamp(nation.government.legitimacy + cm.legitimacyMod, 0, 100);
  if (cm.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + cm.efficiencyMod, 0, 100);
  if (cm.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + cm.corruptionMod, 0, 100);
  // 派系满意度加成
  const factionSatMap: Record<string, number | undefined> = { nobles: cm.noblesSat, merchants: cm.merchantsSat, military: cm.militarySat, commoners: cm.commonersSat, clergy: cm.clergySat };
  for (const f of nation.factions) {
    const delta = factionSatMap[f.id];
    if (delta) f.satisfaction = clamp(f.satisfaction + delta * 0.1, 0, 100);  // 每回合渐变，非一次性
  }

  // P1-3: 政体每回合被动效果
  const govDef = GOVERNMENTS[nation.government.type as GovernmentId];
  if (govDef?.perTurn) {
    const pt = govDef.perTurn;
    if (pt.legitimacy) nation.government.legitimacy = clamp(nation.government.legitimacy + pt.legitimacy, 0, 100);
    if (pt.stability) nation.government.stability = clamp(nation.government.stability + pt.stability, 0, 100);
    if (pt.efficiency) nation.government.efficiency = clamp(nation.government.efficiency + pt.efficiency, 0, 100);
    if (pt.corruption) nation.government.corruption = clamp(nation.government.corruption + pt.corruption, 0, 100);
    if (pt.factionSat) {
      const fsMap: Record<string, number | undefined> = pt.factionSat as Record<string, number | undefined>;
      for (const f of nation.factions) {
        const d = fsMap[f.id];
        if (d) f.satisfaction = clamp(f.satisfaction + d, 0, 100);
      }
    }
  }

  return { stabilityDelta: dStab, legitimacyDelta: dLegit };
}

// 切换政体
export function changeGovernment(nation: Nation, newGov: GovernmentId, state: GameState): boolean {
  if (nation.government.legitimacy < 40) return false;
  if (nation.resources.gold < 100) return false;
  const def = GOVERNMENTS[newGov];
  if (!def) return false;
  nation.resources.gold -= 100;
  nation.government.type = newGov;
  // B8: 政体切换反弹——合法性一次性 -15（过渡冲击）+ 派系满意度反应
  nation.government.legitimacy = clamp(nation.government.legitimacy - 15, 0, 100);
  nation.government.stability = clamp(nation.government.stability - 10, 0, 100);
  for (const f of nation.factions) {
    f.satisfaction = clamp(f.satisfaction + def.factionSatMod[f.id], 0, 100);
  }
  // B8: 标记反扑窗口——3 回合内可能触发反扑事件（events.ts 检测）
  nation.civilWar = nation.civilWar ?? undefined;  // 保持 civilWar 不变
  nation.govTransitionTurns = 3;
  return true;
}

// 推行政策
export function enactPolicy(nation: Nation, policyId: PolicyId, state: GameState): { ok: boolean; reason?: string } {
  const def = POLICIES.find((p) => p.id === policyId);
  if (!def) return { ok: false, reason: '政策不存在' };
  if (nation.activePolicies.some((p) => p.policyId === policyId)) {
    return { ok: false, reason: '已推行' };
  }
  if (def.allowedGovernments.length > 0 && !def.allowedGovernments.includes(nation.government.type)) {
    return { ok: false, reason: '政体不允许' };
  }
  if (def.prereqTech && !hasTech(nation, def.prereqTech)) {
    return { ok: false, reason: '缺少前置科技' };
  }
  if (nation.resources.gold < def.costGold) return { ok: false, reason: '金不足' };

  nation.resources.gold -= def.costGold;
  nation.activePolicies.push({ policyId, enactedTurn: state.turn });

  // 应用 effects 到国家修正
  if (def.effects.taxEffMod) nation.government.efficiency = Math.round(nation.government.efficiency * (def.effects.taxEffMod ?? 1));
  if (def.effects.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + def.effects.corruptionMod, 0, 100);
  if (def.effects.stabilityMod) nation.government.stability = clamp(nation.government.stability + def.effects.stabilityMod, 0, 100);
  if (def.effects.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + def.effects.efficiencyMod, 0, 100);
  if (def.effects.taxRateMod) nation.taxRate = clamp(nation.taxRate + (def.effects.taxRateMod ?? 0), 0, 0.5);

  // 派系反应
  for (const [fid, delta] of Object.entries(def.factionReaction)) {
    const f = nation.factions.find((x) => x.id === fid);
    if (f) f.satisfaction = clamp(f.satisfaction + (delta as number), 0, 100);
  }
  return { ok: true };
}

function hasTech(nation: Nation, techId: string): boolean {
  // 简化：检查对应路线等级
  if (techId === 'admin_lv3') return nation.tech.admin >= 3;
  if (techId === 'admin_lv2') return nation.tech.admin >= 2;
  return true;
}

// ── C2: 推行法律 ──
// 返回 {ok, reason}。成功则扣金、加 activeLaws、应用 effects、派系反应。
export function enactLaw(nation: Nation, lawId: string, state: GameState): { ok: boolean; reason?: string } {
  const def = LAWS.find((l) => l.id === lawId);
  if (!def) return { ok: false, reason: '法律不存在' };
  if (nation.activeLaws.some((l) => l.lawId === lawId)) return { ok: false, reason: '已推行' };
  // 政体限制
  if (def.allowedGovernments.length > 0 && !def.allowedGovernments.includes(nation.government.type)) {
    return { ok: false, reason: '政体不允许' };
  }
  // 前置行政科技
  if (nation.tech.admin < def.prereqAdminLevel) return { ok: false, reason: `需行政Lv${def.prereqAdminLevel}` };
  // 互斥
  if (def.conflictsWith) {
    for (const c of def.conflictsWith) {
      if (nation.activeLaws.some((l) => l.lawId === c)) {
        return { ok: false, reason: `与已推行的 ${LAWS.find((x) => x.id === c)?.name ?? c} 冲突` };
      }
    }
  }
  if (nation.resources.gold < def.costGold) return { ok: false, reason: '金不足' };

  nation.resources.gold -= def.costGold;
  nation.activeLaws.push({ lawId, enactedTurn: state.turn });

  // 应用 effects
  const e = def.effects;
  if (e.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + e.corruptionMod, 0, 100);
  if (e.stabilityMod) nation.government.stability = clamp(nation.government.stability + e.stabilityMod, 0, 100);
  if (e.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + e.efficiencyMod, 0, 100);
  if (e.legitimacyMod) nation.government.legitimacy = clamp(nation.government.legitimacy + e.legitimacyMod, 0, 100);
  // taxEffMod 是乘数，暂存到 efficiency（简化：没有独立 taxEff 字段，用 efficiency 近似）
  if (e.taxEffMod && e.taxEffMod !== 1) nation.government.efficiency = clamp(nation.government.efficiency * e.taxEffMod, 0, 100);

  // 派系反应
  for (const f of nation.factions) {
    const delta = def.factionReaction[f.id];
    if (delta) f.satisfaction = clamp(f.satisfaction + delta, 0, 100);
  }
  return { ok: true };
}

// 每回合法律效果：unrestReduction / rebellionReduction 在 turn.ts 调用
export function lawPerTurnEffects(nation: Nation, provs: Province[]): void {
  for (const al of nation.activeLaws) {
    const def = LAWS.find((l) => l.id === al.lawId);
    if (!def) continue;
    const e = def.effects;
    if (e.unrestReduction) {
      for (const p of provs) p.unrest = clamp(p.unrest - e.unrestReduction, 0, 100);
    }
    if (e.rebellionReduction) {
      for (const p of provs) p.rebellionRisk = clamp(p.rebellionRisk - e.rebellionReduction, 0, 100);
    }
  }
}

// 可管理省份数
export function maxManageableProvinces(nation: Nation): number {
  return maxProvinces(
    nation.tech.admin,
    nation.government.efficiency,
    nation.activeCharacterBonuses.includes('centralization'),
    nation.tier,
  );
}

// 超出可管省 → 惩罚
export function overExtensionPenalty(nation: Nation, provinceCount: number): { taxEffLoss: number; stabilityLoss: number } {
  const max = maxManageableProvinces(nation);
  const over = Math.max(0, provinceCount - max);
  return { taxEffLoss: over * 0.05, stabilityLoss: over * 2 };
}

export { reformSuccessRate };
