import { describe, expect, it } from 'vitest';
import { createInitialState, createWorldState } from '../init';
import { processTurnSafe } from '../../gameplay/logicGuard';
import type { GameState } from '../../types/game';

function assertFiniteNumber(label: string, value: number) {
  expect(Number.isFinite(value), label).toBe(true);
}

function assertHealthyState(state: GameState) {
  expect(state.playerNationId).toBeTruthy();
  expect(state.nations[state.playerNationId], 'player nation exists').toBeTruthy();

  for (const [id, nation] of Object.entries(state.nations)) {
    assertFiniteNumber(`${id}.gold`, nation.resources.gold);
    assertFiniteNumber(`${id}.food`, nation.resources.food);
    assertFiniteNumber(`${id}.stability`, nation.government.stability);
    assertFiniteNumber(`${id}.legitimacy`, nation.government.legitimacy);
    assertFiniteNumber(`${id}.warExhaustion`, nation.warExhaustion);
    expect(nation.government.stability).toBeGreaterThanOrEqual(0);
    expect(nation.government.stability).toBeLessThanOrEqual(100);
    expect(nation.warExhaustion).toBeGreaterThanOrEqual(0);
    expect(nation.warExhaustion).toBeLessThanOrEqual(100);
    for (const army of nation.army) {
      expect(state.provinces[army.location], `${id}.army.${army.id}.location`).toBeTruthy();
      assertFiniteNumber(`${id}.army.${army.id}.size`, army.size);
      expect(army.size).toBeGreaterThanOrEqual(0);
    }
  }

  for (const [id, province] of Object.entries(state.provinces)) {
    expect(province.ownerId === 'barbarian' || !!state.nations[province.ownerId], `${id}.owner`).toBe(true);
    assertFiniteNumber(`${id}.population`, province.population);
    assertFiniteNumber(`${id}.unrest`, province.unrest);
    assertFiniteNumber(`${id}.rebellionRisk`, province.rebellionRisk);
    expect(province.population).toBeGreaterThanOrEqual(0);
    expect(province.unrest).toBeGreaterThanOrEqual(0);
    expect(province.unrest).toBeLessThanOrEqual(100);
    for (const adj of province.adjacent) expect(state.provinces[adj], `${id}.adjacent.${adj}`).toBeTruthy();
  }

  const activeWarPairs = new Set<string>();
  for (const war of state.wars) {
    expect(state.nations[war.attackerId], `${war.id}.attacker`).toBeTruthy();
    expect(state.nations[war.defenderId], `${war.id}.defender`).toBeTruthy();
    expect(state.provinces[war.targetProvinceId], `${war.id}.target`).toBeTruthy();
    assertFiniteNumber(`${war.id}.progress`, war.progress);
    expect(war.progress).toBeGreaterThanOrEqual(0);
    expect(war.progress).toBeLessThanOrEqual(100);
    const pair = [war.attackerId, war.defenderId].sort().join('|');
    expect(activeWarPairs.has(pair), `${war.id}.duplicate-war-pair`).toBe(false);
    activeWarPairs.add(pair);
    for (const report of war.battleReports ?? []) {
      assertFiniteNumber(`${war.id}.report.progressDelta`, report.progressDelta);
      assertFiniteNumber(`${war.id}.report.attLoss`, report.attLoss);
      assertFiniteNumber(`${war.id}.report.defLoss`, report.defLoss);
    }
  }
}

function simulate(state: GameState, years: number): GameState {
  let current = state;
  for (let i = 0; i < years; i += 1) {
    if (current.victory.type) current = { ...current, victory: { type: null } };
    const result = processTurnSafe(current);
    current = result.state;
    assertHealthyState(current);
  }
  return current;
}

describe('long-run simulation guard', () => {
  it('keeps the classic scenario internally valid for 200 turns', () => {
    const finalState = simulate(createInitialState(), 200);
    expect(finalState.turn).toBe(200);
  });

  it('keeps a regional world scenario valid long enough to catch AI/worldgen drift', () => {
    const finalState = simulate(createWorldState(20260626, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n']), 80);
    expect(finalState.turn).toBe(80);
    expect(Object.keys(finalState.nations).length).toBeGreaterThan(10);
  });
});
