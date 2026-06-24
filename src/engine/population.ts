// Imperium Aeternum — 人口系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §10

import type { Nation, Province, PopulationGroup, ClassId } from '../types/game';
import { popGrowth, satisfactionDelta, classRebellionRisk } from './formulas';
import { clamp } from '../utils/math';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
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

const CLASS_IDS: ClassId[] = ['peasants', 'workers', 'merchants', 'soldiers', 'scholars', 'nobles', 'clergy'];

// 阶层关注点权重（影响满意度变化方向）
const CLASS_INTEREST: Record<ClassId, { tax: number; food: number; draft: number; trade: number; war: number; religion: number }> = {
  peasants:  { tax: 1.5, food: 1.5, draft: 1.0, trade: 0.2, war: 0.5, religion: 0.5 },
  workers:   { tax: 1.0, food: 1.0, draft: 0.5, trade: 0.5, war: 0.3, religion: 0.3 },
  merchants: { tax: 1.2, food: 0.5, draft: 0.3, trade: 2.0, war: 0.5, religion: 0.3 },
  soldiers:  { tax: 0.5, food: 0.5, draft: 0.2, trade: 0.3, war: 2.0, religion: 0.5 },
  scholars:  { tax: 0.5, food: 0.5, draft: 0.3, trade: 0.5, war: 0.3, religion: 0.2 },
  nobles:    { tax: 0.8, food: 0.3, draft: 0.3, trade: 0.5, war: 0.8, religion: 0.8 },
  clergy:    { tax: 0.3, food: 0.5, draft: 0.3, trade: 0.3, war: 0.5, religion: 2.0 },
};

export interface PopSettleResult {
  totalGrowth: number;
  classSatChanges: Record<ClassId, number>;
}

export function settlePopulation(
  nation: Nation,
  provinces: Province[],
  foodShortage: boolean,
  tradeFree: boolean,
  atWar: boolean,
  warWonRecent: boolean,
): PopSettleResult {
  let totalGrowth = 0;
  const classSatChanges = {} as Record<ClassId, number>;

  for (const p of provinces) {
    // 人口增长
    const totalPop = p.population;
    const delta = popGrowth({
      population: totalPop, baseGrowth: 0.01,
      food: nation.resources.food, foodNeed: totalPop * 0.8,
      stability: nation.government.stability,
      atWar, plague: false,
      welfareActive: nation.activeCharacterBonuses.includes('welfare'),
    }) * (charMods(nation).popGrowthMod ?? 1) * (nation.policyMods?.popGrowthMod ?? 1);  // P1-4 性格 + P-fix 政策人口增长加成
    p.population = Math.max(10, Math.round(p.population + delta));
    totalGrowth += delta;

    // 每阶层满意度变化
    for (const grp of p.classes) {
      const interest = CLASS_INTEREST[grp.classId];
      // 各因素对该阶层的压力
      const taxPressure = (nation.taxRate - 0.15) * 100 * interest.tax;
      const foodPressure = foodShortage ? -15 * interest.food : 0;
      const warPressure = atWar ? -5 * interest.war : (warWonRecent ? 5 * interest.war : 0);
      const tradePressure = tradeFree ? 3 * interest.trade : -3 * interest.trade;
      const religionPressure = 0; // 由 policies 处理

      const d = -taxPressure + foodPressure + warPressure + tradePressure + religionPressure;
      grp.satisfaction = clamp(grp.satisfaction + d, 0, 100);

      // 累加同类阶层变化（全国汇总用于派系）
      classSatChanges[grp.classId] = (classSatChanges[grp.classId] ?? 0) + d;
    }
  }

  // 全国同类阶层 → 派系满意度影响（简化：派系满意度 = 各省该阶层满意度均值）
  for (const fid of CLASS_IDS) {
    const faction = nation.factions.find((f) => f.id === mapClassToFaction(fid));
    if (!faction) continue;
    const allGrps = provinces.flatMap((p) => p.classes.filter((c) => c.classId === fid));
    if (allGrps.length === 0) continue;
    const avgSat = allGrps.reduce((s, g) => s + g.satisfaction, 0) / allGrps.length;
    // 派系满意度缓向均值靠拢
    faction.satisfaction = clamp(faction.satisfaction + (avgSat - faction.satisfaction) * 0.3, 0, 100);
  }

  return { totalGrowth, classSatChanges };
}

// 阶层 → 派系映射（共 7 阶层 → 5 派系）
function mapClassToFaction(c: ClassId): 'nobles' | 'merchants' | 'military' | 'commoners' | 'clergy' {
  switch (c) {
    case 'nobles': return 'nobles';
    case 'merchants': return 'merchants';
    case 'soldiers': return 'military';
    case 'clergy': return 'clergy';
    default: return 'commoners';  // peasants/workers/scholars → commoners
  }
}

// 征兵：从 peasants/workers/merchants 按比例抽 → soldiers
export function draftFromPopulation(province: Province, count: number): { drafted: number } {
  const candidates: ClassId[] = ['peasants', 'workers', 'merchants'];
  const ratio = [0.7, 0.2, 0.1];
  let drafted = 0;
  for (let i = 0; i < candidates.length && drafted < count; i++) {
    const grp = province.classes.find((g) => g.classId === candidates[i]);
    if (!grp) continue;
    const take = Math.min(grp.count, Math.round((count - drafted) * ratio[i] / (ratio[i] + (i === 2 ? 0 : 0))));
    grp.count -= take;
    drafted += take;
  }
  // 加到 soldiers
  const sol = province.classes.find((g) => g.classId === 'soldiers');
  if (sol) sol.count += drafted;
  // 征兵降低 peasants 满意度
  const pe = province.classes.find((g) => g.classId === 'peasants');
  if (pe) pe.satisfaction = clamp(pe.satisfaction - 5, 0, 100);
  province.population = Math.max(10, province.population - drafted);
  return { drafted };
}

export { classRebellionRisk };
