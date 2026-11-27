import { LAND_RATIO } from '../data/provinces';
import { CLASS_IDS, type Province } from '../types/game';

/** Keep a stable distribution so rounding this year's headcounts cannot change next year's shares. */
export function setProvincePopulation(province: Province, population: number): void {
  const total = province.terrain === 'ocean' ? 0 : Math.max(0, Math.round(population));
  province.population = total;
  if (!province.classes.length && total > 0) {
    province.classes = CLASS_IDS.map(classId => ({ classId, count: 0, satisfaction: 50 }));
  }
  let weightSum = 0;
  for (const group of province.classes) {
    if (group.weight === undefined || !Number.isFinite(group.weight) || group.weight < 0) {
      group.weight = Number.isFinite(group.count) ? Math.max(0, group.count) : 0;
    }
    weightSum += group.weight;
  }
  if (weightSum === 0 && total > 0) {
    for (const group of province.classes) {
      group.weight = LAND_RATIO[group.classId];
      weightSum += group.weight;
    }
  }

  let cumulativeWeight = 0;
  let assigned = 0;
  for (const group of province.classes) {
    cumulativeWeight += group.weight ?? 0;
    const throughGroup = weightSum > 0 ? Math.round(total * (cumulativeWeight / weightSum)) : 0;
    group.count = throughGroup - assigned;
    assigned = throughGroup;
  }
}
