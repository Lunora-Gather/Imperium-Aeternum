import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { processTurn } from '../turn';
import type { GameState, Nation, Province } from '../../types/game';

function finiteNation(n: Nation): boolean {
  const nums = [
    n.resources.gold,
    n.resources.food,
    n.resources.wood,
    n.resources.iron,
    n.resources.adminPt,
    n.resources.sciPt,
    n.resources.influence,
    n.resources.supply,
    n.government.stability,
    n.government.legitimacy,
    n.government.efficiency,
    n.government.corruption,
    n.warExhaustion,
  ];
  return nums.every(Number.isFinite);
}

function finiteProvince(p: Province): boolean {
  return [p.population, p.loyalty, p.assimilation, p.unrest, p.rebellionRisk, p.garrison, p.x, p.y].every(Number.isFinite);
}

describe('turn stability', () => {
  it('can advance several years without losing core state shape', () => {
    let state: GameState = createInitialState();
    const startNationCount = Object.keys(state.nations).length;
    const startProvinceCount = Object.keys(state.provinces).length;

    for (let i = 0; i < 5; i++) {
      const result = processTurn(state);
      state = result.state;

      expect(state.turn).toBe(i + 1);
      expect(result.report.turn).toBe(state.turn);
      expect(state.lastReport?.turn).toBe(state.turn);
      expect(state.history.length).toBeLessThanOrEqual(10);
      expect(Object.keys(state.nations).length).toBeGreaterThan(0);
      expect(Object.keys(state.provinces).length).toBe(startProvinceCount);
      expect(Object.keys(state.nations).length).toBeGreaterThanOrEqual(startNationCount - 2);
    }
  });

  it('keeps numeric nation and province fields finite after repeated turns', () => {
    let state: GameState = createInitialState();

    for (let i = 0; i < 8; i++) state = processTurn(state).state;

    expect(Object.values(state.nations).every(finiteNation)).toBe(true);
    expect(Object.values(state.provinces).every(finiteProvince)).toBe(true);
  });

  it('caps rolling report history at ten entries', () => {
    let state: GameState = createInitialState();

    for (let i = 0; i < 12; i++) state = processTurn(state).state;

    expect(state.turn).toBe(12);
    expect(state.history.length).toBe(10);
    expect(state.history[0].turn).toBe(3);
    expect(state.history[state.history.length - 1].turn).toBe(12);
  });
});
