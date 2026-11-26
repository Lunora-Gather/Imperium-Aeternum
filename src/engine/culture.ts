// Imperium Aeternum — 文化与宗教系统 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §14

import type { Nation, GameState, Province } from '../types/game';
import { assimilationDelta, loyaltyDelta, computeRebellion } from './formulas';
import { clamp } from '../utils/math';
import { provincesOf } from './init';

export interface CultureReligionResult {
  rebellionTriggered: string[];  // 触发叛乱的省份 id
}

export interface CultureReligionPartial extends CultureReligionResult {
  provFinal: Record<string, Pick<Province, 'assimilation' | 'loyalty' | 'rebellionRisk'>>;
}

function settleCulture(
  nation: Nation, state: GameState, provs: Province[], provFinal?: CultureReligionPartial['provFinal'],
): string[] {
  const triggered: string[] = [];
  const culturePolicy: 'assimilate' | 'respect' = 'assimilate';
  const religionPolicy: 'tolerant' | 'state' | 'persecute' = 'tolerant';
  const capital = state.provinces[nation.capital];
  const cultureTechBonus = nation.tech.culture * 0.5 + (nation.policyMods?.assimilationMod ?? 0);

  for (const p of provs) {
    const cultureDiff = !!capital && p.culture !== capital.culture;
    const religionDiff = !!capital && p.religion !== capital.religion;
    const farFromCapital = !capital || (p.id !== capital.id && !capital.adjacent.includes(p.id)
      && !capital.adjacent.some(id => state.provinces[id]?.adjacent.includes(p.id)));
    const dAssim = assimilationDelta(
      p.buildings.filter((b) => b.defId === 'road').length,
      culturePolicy, nation.government.efficiency, cultureDiff, farFromCapital,
    ) + cultureTechBonus;
    const finalAssim = clamp(p.assimilation + dAssim, 0, 100);
    // loyalty 用 finalAssim（等价原函数 mutate 后值）
    const dLoy = loyaltyDelta(
      nation.government.stability, finalAssim, p.garrison > 0, p.unrest,
      nation.activeCharacterBonuses.includes('welfare'),
    );
    const finalLoy = clamp(p.loyalty + dLoy, 0, 100);
    const finalReb = clamp(computeRebellion({
      unrest: p.unrest, cultureDiff, religionDiff, religionPolicy,
      garrison: p.garrison, stability: nation.government.stability,
    }), 0, 100);
    if (provFinal) provFinal[p.id] = { assimilation: finalAssim, loyalty: finalLoy, rebellionRisk: finalReb };
    else {
      p.assimilation = finalAssim;
      p.loyalty = finalLoy;
      p.rebellionRisk = finalReb;
    }
    if (finalReb >= 100 && p.garrison === 0) triggered.push(p.id);
  }
  return triggered;
}

export function settleCultureReligion(nation: Nation, state: GameState, provs = provincesOf(nation.id, state.provinces)): CultureReligionResult {
  return { rebellionTriggered: settleCulture(nation, state, provs) };
}

export function settleCultureReligionPure(nation: Nation, state: GameState, provs = provincesOf(nation.id, state.provinces)): CultureReligionPartial {
  const provFinal: CultureReligionPartial['provFinal'] = {};
  return { rebellionTriggered: settleCulture(nation, state, provs, provFinal), provFinal };
}

export { assimilationDelta, loyaltyDelta };
