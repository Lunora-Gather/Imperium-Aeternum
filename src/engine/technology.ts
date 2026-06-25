// Imperium Aeternum — 科技系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §13

import type { Nation, GameState } from '../types/game';
import { computeSciPt, researchCost } from './formulas';
import { TECHNOLOGIES, TECH_BY_ID } from '../data/technologies';
import type { TechBranch } from '../data/technologies';

// 每回合科研点产出 + 累积
export function settleTechnology(nation: Nation, state: GameState): void {
  // 已在 economy.ts 中通过建筑产出 sciPt；这里补充学者产出
  // 实际 sciPt 已在 economy settleEconomy 中累加，这里不再重复
  // 处理研发进度：若 researchProgress 存在，扣点推进
  if (nation.tech.researchProgress) {
    const tech = TECH_BY_ID[nation.tech.researchProgress.techId];
    if (!tech) { nation.tech.researchProgress = null; return; }
    const cost = researchCost(tech.level, tech.costSci, tech.costGold);
    // 每回合可投入的 sciPt（最多全投入）
    const invest = Math.min(nation.resources.sciPt, cost.sci - nation.tech.researchProgress.sciPtInvested);
    nation.tech.researchProgress.sciPtInvested += invest;
    nation.resources.sciPt -= invest;
    if (nation.tech.researchProgress.sciPtInvested >= cost.sci && nation.resources.gold >= cost.gold) {
      // 完成
      nation.resources.gold -= cost.gold;
      nation.tech[tech.branch] = Math.max(nation.tech[tech.branch], tech.level);
      nation.tech.researchProgress = null;
    }
  }
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
  if (!nation.tech.researchProgress) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const tech = TECH_BY_ID[nation.tech.researchProgress.techId];
  if (!tech) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const cost = researchCost(tech.level, tech.costSci, tech.costGold);
  const invest = Math.min(nation.resources.sciPt, cost.sci - nation.tech.researchProgress.sciPtInvested);
  const newInvested = nation.tech.researchProgress.sciPtInvested + invest;
  // 完成判定：注意原函数用 nation.resources.gold（未扣 invest 影响 gold）>= cost.gold
  if (newInvested >= cost.sci && nation.resources.gold >= cost.gold) {
    return {
      deltaSciPt: -invest,
      deltaGold: -cost.gold,
      researchProgressFinal: null,  // 完成，清空
      techLevelUp: { branch: tech.branch, level: tech.level },
    };
  }
  return {
    deltaSciPt: -invest,
    deltaGold: 0,
    researchProgressFinal: { techId: nation.tech.researchProgress.techId, sciPtInvested: newInvested },
    techLevelUp: null,
  };
}
