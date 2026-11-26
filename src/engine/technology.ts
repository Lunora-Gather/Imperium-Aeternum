// Imperium Aeternum — 科技系统 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §13

import type { Nation, GameState } from '../types/game';
import { computeSciPt, researchCost } from './formulas';
import { TECHNOLOGIES, TECH_BY_ID } from '../data/technologies';
import type { TechBranch, TechnologyDef } from '../data/technologies';

export function settleTechnology(nation: Nation, state: GameState): void {
  const result = settleTechnologyPure(nation, state);
  nation.resources.sciPt += result.deltaSciPt;
  nation.resources.gold += result.deltaGold;
  nation.tech.researchProgress = result.researchProgressFinal;
  if (result.techLevelUp) nation.tech[result.techLevelUp.branch] = result.techLevelUp.level;
}

export function instantResearchBlocker(nation: Nation, tech: TechnologyDef): string | null {
  if (nation.tech[tech.branch] >= tech.level) return '已学';
  const prereq = tech.prereqTech && TECH_BY_ID[tech.prereqTech];
  if (nation.tech[tech.branch] + 1 !== tech.level || (prereq && nation.tech[prereq.branch] < prereq.level)) return '锁定';
  if (nation.tech.researchProgress) return '研发中';
  if (nation.resources.sciPt < tech.costSci) return '科研不足';
  if (nation.resources.gold < tech.costGold) return '金不足';
  if (nation.resources.adminPt < 1) return '行动点不足（需 1）';
  return null;
}

// 启动研发
export function startResearch(nation: Nation, techId: string): { ok: boolean; reason?: string } {
  const tech = TECH_BY_ID[techId];
  if (!tech) return { ok: false, reason: '科技不存在' };
  // 已达更高级
  if (nation.tech[tech.branch] >= tech.level) return { ok: false, reason: '已研发' };
  // 前置科技
  if (tech.prereqTech) {
    const pre = TECH_BY_ID[tech.prereqTech];
    if (pre && nation.tech[pre.branch] < pre.level) return { ok: false, reason: '缺少前置' };
  }
  if (nation.tech.researchProgress) return { ok: false, reason: '正在研发其他' };
  nation.tech.researchProgress = { techId, sciPtInvested: 0 };
  return { ok: true };
}

// 当前可研发的科技列表
export function availableTechs(nation: Nation): typeof TECHNOLOGIES {
  return TECHNOLOGIES.filter((t) => {
    if (nation.tech[t.branch] >= t.level) return false;
    if (t.prereqTech) {
      const pre = TECH_BY_ID[t.prereqTech];
      if (pre && nation.tech[pre.branch] < pre.level) return false;
    }
    return true;
  });
}

export { computeSciPt, researchCost };
export type { TechBranch };

// ── C1: 纯函数版本 settleTechnologyPure ──
// 不 mutate nation，返回 delta，供 processTurn 合并建新 state
// 与原 settleTechnology 并存（零回归）
export interface TechPartial {
  // resources 增量
  deltaSciPt: number;
  deltaGold: number;
  // researchProgress 最终值（覆写——null 表示完成，否则更新 sciPtInvested）
  researchProgressFinal: { techId: string; sciPtInvested: number } | null;
  // 完成时科技等级覆写（null 表示未完成）
  techLevelUp: { branch: 'agri' | 'mil' | 'admin' | 'culture'; level: number } | null;
}
export function settleTechnologyPure(nation: Nation, _state: GameState): TechPartial {
  const progress = nation.tech.researchProgress;
  const tech = progress && TECH_BY_ID[progress.techId];
  if (!progress || !tech || nation.tech[tech.branch] >= tech.level) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const invested = Math.min(tech.costSci, Math.max(0, Number.isFinite(progress.sciPtInvested) ? progress.sciPtInvested : 0));
  const invest = Math.min(Math.max(0, nation.resources.sciPt), tech.costSci - invested);
  const newInvested = invested + invest;
  if (newInvested >= tech.costSci && nation.resources.gold >= tech.costGold) {
    return {
      deltaSciPt: -invest,
      deltaGold: -tech.costGold,
      researchProgressFinal: null,  // 完成，清空
      techLevelUp: { branch: tech.branch, level: tech.level },
    };
  }
  return {
    deltaSciPt: -invest,
    deltaGold: 0,
    researchProgressFinal: { techId: tech.id, sciPtInvested: newInvested },
    techLevelUp: null,
  };
}
