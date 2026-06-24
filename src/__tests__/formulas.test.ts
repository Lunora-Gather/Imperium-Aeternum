// Imperium Aeternum — 公式单测
// 对应 docs/formulas.md §11 手算示例

import { describe, it, expect } from 'vitest';
import type { Army } from '../types/game';
import {
  computeTax, stabilityTaxModifier, corruptionModifier, assimilationModifier,
  computeFood, agriTechModifier, infrastructureFoodModifier,
  popGrowth, stabilityPopModifier,
  computeCombat, milTechModifier,
  computeRebellion,
  resolveBattle,
  warCostPerTurn,
  relationDrift, computeThreat,
  computeSciPt, researchCost,
  assimilationDelta, loyaltyDelta,
  actionPointsPerTurn, activateTendency,
} from '../engine/formulas';

describe('§2.1 税收', () => {
  it('手算示例：pop=1000 tax=0.15 eff=1.0 stab=60 corr=20 assim=80 → ≈156.7', () => {
    const v = computeTax({
      population: 1000, baseTaxRate: 0.15, taxEfficiency: 1.0,
      stability: 60, corruption: 20, assimilation: 80,
    });
    // 1000×0.15×1.0×1.2×0.9×0.9667 = 156.7
    expect(v).toBeCloseTo(156.7, 0);
  });

  it('稳定度分段修正', () => {
    expect(stabilityTaxModifier(70)).toBe(1.2);
    expect(stabilityTaxModifier(50)).toBe(1.0);
    expect(stabilityTaxModifier(35)).toBe(0.8);
    expect(stabilityTaxModifier(20)).toBe(0.5);
  });

  it('腐败修正范围 0.5-1.0', () => {
    expect(corruptionModifier(0)).toBe(1.0);
    expect(corruptionModifier(100)).toBe(0.5);
    expect(corruptionModifier(50)).toBe(0.75);
  });

  it('同化度修正范围 0.7-1.0', () => {
    expect(assimilationModifier(0)).toBeCloseTo(0.7, 2);
    expect(assimilationModifier(90)).toBeCloseTo(1.0, 2);
  });
});

describe('§2.2 粮食产量', () => {
  it('手算示例：agriBase=1.0 peasant=400 plain agriLv=2 farm=3 → ≈723.8', () => {
    const v = computeFood({
      agriBase: 1.0, peasantCount: 400, terrain: 'plain',
      agriLv: 2, farmCount: 3,
    });
    // 1.0×400×1.2×1.16×1.3 = 723.84
    expect(v).toBeCloseTo(723.8, 0);
  });

  it('山地粮食减产', () => {
    const v = computeFood({ agriBase: 1.0, peasantCount: 100, terrain: 'mountain', agriLv: 1, farmCount: 0 });
    expect(v).toBeCloseTo(32.4, 0);  // 1×100×0.3×1.08×1.0 = 32.4
  });

  it('农业科技修正 1+Lv×0.08', () => {
    expect(agriTechModifier(1)).toBe(1.08);
    expect(agriTechModifier(5)).toBe(1.40);
  });

  it('基础设施修正 1+farm×0.1', () => {
    expect(infrastructureFoodModifier(0)).toBe(1.0);
    expect(infrastructureFoodModifier(5)).toBe(1.5);
  });
});

describe('§4.3 人口增长', () => {
  it('手算示例：pop=1000 base=0.01 food充足=1.2 stab=1.0 → 12', () => {
    const v = popGrowth({
      population: 1000, baseGrowth: 0.01,
      food: 960, foodNeed: 800,
      stability: 50, atWar: false, plague: false, welfareActive: false,
    });
    // 1000×0.01×1.2×1.0 = 12
    expect(v).toBeCloseTo(12, 0);
  });

  it('战时人口增长减半', () => {
    const peace = popGrowth({ population: 1000, baseGrowth: 0.01, food: 960, foodNeed: 800, stability: 50, atWar: false, plague: false, welfareActive: false });
    const war = popGrowth({ population: 1000, baseGrowth: 0.01, food: 960, foodNeed: 800, stability: 50, atWar: true, plague: false, welfareActive: false });
    expect(war).toBeLessThan(peace);
  });

  it('稳定度人口修正分段', () => {
    expect(stabilityPopModifier(70)).toBe(1.2);
    expect(stabilityPopModifier(30)).toBe(0.7);
    expect(stabilityPopModifier(10)).toBe(0.3);
  });
});

describe('§5.1 战斗力', () => {
  it('手算示例：size=500 morale=80 train=70 equip=60 milLv=2 → ≈209', () => {
    const army: Army = { id: 'a', ownerId: 'n01', location: 'p01', size: 500, morale: 80, training: 70, equipment: 60, supply: 90 };
    const v = computeCombat({ army, milLv: 2, general: 50, terrainMod: 1.2 });
    // 500×0.8×0.7×0.6×1.16×1.0×0.9×1.2 = 210.47
    expect(v).toBeCloseTo(210.47, 0);
  });

  it('军事科技修正 1+Lv×0.08', () => {
    expect(milTechModifier(1)).toBe(1.08);
    expect(milTechModifier(5)).toBe(1.40);
  });
});

describe('§5.2 省份叛乱风险', () => {
  it('和平同化省叛乱低', () => {
    const v = computeRebellion({
      unrest: 10, cultureDiff: false, religionDiff: false,
      religionPolicy: 'tolerant', garrison: 100, stability: 70,
    });
    expect(v).toBeLessThan(20);
  });

  it('异教迫害省叛乱高', () => {
    const v = computeRebellion({
      unrest: 60, cultureDiff: true, religionDiff: true,
      religionPolicy: 'persecute', garrison: 0, stability: 20,
    });
    // 60×1.5×2.0×1.0×1.6 = 288
    expect(v).toBeGreaterThan(200);
  });
});

describe('§5.3 战斗结算', () => {
  it('均势推进有最小值', () => {
    const r = resolveBattle(100, 100, 100, 100);
    expect(Math.abs(r.progressDelta)).toBeGreaterThanOrEqual(3); // W-fix: 最小推进 ±3
  });

  it('绝对优势占领快', () => {
    const r = resolveBattle(900, 100, 900, 100);
    expect(r.progressDelta).toBeGreaterThan(10);
  });
});

describe('§5.4 战争代价', () => {
  it('每兵力 0.5金 1粮', () => {
    const c = warCostPerTurn(200);
    expect(c.gold).toBe(100);
    expect(c.food).toBe(200);
    expect(c.exhaustionDelta).toBe(2);
    expect(c.attrition).toBe(4);
  });
});

describe('§6 外交', () => {
  it('贸易关系 +2', () => {
    expect(relationDrift('trade', false, 0, false)).toBe(2);
  });

  it('边境冲突 -3', () => {
    expect(relationDrift('none', true, 0, false)).toBe(-3);
  });

  it('威胁值范围 0-100', () => {
    const v = computeThreat(100, 500, 8, -50);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe('§7 科技', () => {
  it('科研点产出', () => {
    expect(computeSciPt(20, 2, false)).toBe(14);  // 20×0.5 + 2×2
    expect(computeSciPt(20, 2, true)).toBe(17.5); // 14×1.25
  });

  it('研发成本 level²', () => {
    expect(researchCost(1, 100, 1).sci).toBe(100);
    expect(researchCost(2, 100, 1).sci).toBe(400);
    expect(researchCost(5, 100, 1).sci).toBe(2500);
  });
});

describe('§8 文化宗教', () => {
  it('同化度受道路与文化政策影响', () => {
    expect(assimilationDelta(2, 'assimilate', 60, false, false)).toBeGreaterThan(0);
    expect(assimilationDelta(0, 'respect', 30, true, true)).toBeLessThan(0);
  });

  it('忠诚度受稳定与驻军影响', () => {
    expect(loyaltyDelta(70, 80, true, 10, false)).toBeGreaterThan(0);
    expect(loyaltyDelta(20, 20, false, 50, false)).toBeLessThan(0);
  });
});

describe('§11 行动点', () => {
  it('基础 3 + 行政修正', () => {
    expect(actionPointsPerTurn(40, false)).toBe(4);   // 3 + floor(40/30) = 4
    expect(actionPointsPerTurn(90, true)).toBe(7);    // 3 + 3 + 1
  });
});

describe('国家性格激活', () => {
  it('tendency ≥ 70 激活', () => {
    const r = activateTendency({
      militarism: 75, commerce: 50, religiosity: 70, technocracy: 30,
      authoritarian: 10, welfare: 0, feudal: 0, revolutionary: 0, maritime: 0, centralization: 0,
    });
    expect(r).toContain('militarism');
    expect(r).toContain('religiosity');
    expect(r).not.toContain('commerce');
  });
});
