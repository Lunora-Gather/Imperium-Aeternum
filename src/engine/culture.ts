// Imperium Aeternum — 文化与宗教系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §14

import type { Nation, Province, GameState } from '../types/game';
import { assimilationDelta, loyaltyDelta, computeRebellion } from './formulas';
import { clamp } from '../utils/math';
import { provincesOf } from './init';
import type { CultureId, ReligionId } from '../data/provinces';

export interface CultureReligionResult {
  rebellionTriggered: string[];  // 触发叛乱的省份 id
}

export function settleCultureReligion(nation: Nation, state: GameState): CultureReligionResult {
  const provs = provincesOf(nation.id, state.provinces);
  const triggered: string[] = [];
  // 默认政策：宽容 + 尊重（5b 简化；玩家可通过事件切换）
  const culturePolicy: 'assimilate' | 'respect' = 'assimilate';
  const religionPolicy: 'tolerant' | 'state' | 'persecute' = 'tolerant';
  // 国文化/国教取首都
  const capital = state.provinces[nation.capital];
  const stateCulture: CultureId | null = capital?.culture ?? null;
  const stateReligion: ReligionId | null = capital?.religion ?? null;

  for (const p of provs) {
    const cultureDiff = stateCulture !== null && p.culture !== stateCulture;
    const religionDiff = stateReligion !== null && p.religion !== stateReligion;
    const farFromCapital = p.distToPlayerCapital > 2;

    // E18: 文化科技加成同化速度（每级 +0.5）+ P-fix 政策 assimilationMod
    const cultureTechBonus = nation.tech.culture * 0.5 + (nation.policyMods?.assimilationMod ?? 0);
    const dAssim = assimilationDelta(
      p.buildings.filter((b) => b.defId === 'road').length,
      culturePolicy, nation.government.efficiency, cultureDiff, farFromCapital,
    ) + cultureTechBonus;
    p.assimilation = clamp(p.assimilation + dAssim, 0, 100);

    const dLoy = loyaltyDelta(
      nation.government.stability, p.assimilation, p.garrison > 0, p.unrest,
      nation.activeCharacterBonuses.includes('welfare'),
    );
    p.loyalty = clamp(p.loyalty + dLoy, 0, 100);

    // 叛乱风险
    p.rebellionRisk = clamp(computeRebellion({
      unrest: p.unrest, cultureDiff, religionDiff, religionPolicy,
      garrison: p.garrison, stability: nation.government.stability,
    }), 0, 100);

    // 触发叛乱
    if (p.rebellionRisk >= 100 && p.garrison === 0) {
      triggered.push(p.id);
    }
  }
  return { rebellionTriggered: triggered };
}

export { assimilationDelta, loyaltyDelta };
