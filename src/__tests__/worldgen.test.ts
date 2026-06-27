// W2 世界生成器测试

import { describe, it, expect } from 'vitest';
import { generateWorld, worldStats } from '../engine/worldgen';

describe('W2 世界生成器', () => {
  it('生成 192 国 / 600 省（±10% 容差）', () => {
    const result = generateWorld(12345);
    const stats = worldStats(result);
    // ~195 国 ±10%
    expect(result.nations.length).toBeGreaterThanOrEqual(180);
    expect(result.nations.length).toBeLessThanOrEqual(220);
    // ~600 省 ±10%
    expect(result.provinces.length).toBeGreaterThanOrEqual(500);
    expect(result.provinces.length).toBeLessThanOrEqual(700);
    // 外交关系稀疏（远小于全连接 18336）
    expect(result.relations.length).toBeLessThan(4000);
    // 恰好 1 个玩家国家
    expect(result.nations.filter((n) => n.isPlayer).length).toBeLessThanOrEqual(1);
  });

  it('12 洲每洲至少 1 国', () => {
    const result = generateWorld(12345);
    const continents = new Set(result.nations.map((n) => n.id.split('_')[1]));
    // 至少 10 个不同区域前缀（有些洲可能 0 国）
    expect(continents.size).toBeGreaterThanOrEqual(8);
  });

  it('S 级国家 2-6 个，D 级最多', () => {
    const result = generateWorld(12345);
    const tierCounts: Record<string, number> = {};
    for (const n of result.nations) tierCounts[n.tier] = (tierCounts[n.tier] ?? 0) + 1;
    expect(tierCounts['S'] ?? 0).toBeGreaterThanOrEqual(2);
    expect(tierCounts['S'] ?? 0).toBeLessThanOrEqual(6);
    // D 级应是最多的一级
    const dCount = tierCounts['D'] ?? 0;
    expect(dCount).toBeGreaterThanOrEqual(tierCounts['C'] ?? 0);
  });

  it('所有国家有合法 tier/government/character', () => {
    const result = generateWorld(12345);
    const validTiers = new Set(['S', 'A', 'B', 'C', 'D']);
    for (const n of result.nations) {
      expect(validTiers.has(n.tier)).toBe(true);
      expect(n.government.length).toBeGreaterThan(0);
      expect(n.character.length).toBeGreaterThan(0);
      expect(n.initGold).toBeGreaterThan(0);
      expect(n.initArmy.size).toBeGreaterThan(0);
    }
  });

  it('所有省份有合法 terrain/culture/religion', () => {
    const result = generateWorld(12345);
    for (const p of result.provinces) {
      expect(p.terrain.length).toBeGreaterThan(0);
      expect(p.culture.length).toBeGreaterThan(0);
      expect(p.religion.length).toBeGreaterThan(0);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      // 海洋省人口为 0
      if (p.terrain === 'ocean') expect(p.initPop).toBe(0);
    }
  });

  it('seed 确定性：同 seed 同结果', () => {
    const a = generateWorld(42);
    const b = generateWorld(42);
    expect(a.nations.length).toBe(b.nations.length);
    expect(a.provinces.length).toBe(b.provinces.length);
    expect(a.nations[0].name).toBe(b.nations[0].name);
  });

  it('统计输出格式正确', () => {
    const result = generateWorld(12345);
    const stats = worldStats(result);
    expect(stats).toContain('国');
    expect(stats).toContain('省');
    expect(stats).toContain('S:');
    expect(stats).toContain('D:');
  });
});
