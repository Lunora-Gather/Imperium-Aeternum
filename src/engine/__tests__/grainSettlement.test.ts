import { describe, expect, it } from 'vitest';
import { createInitialState, provincesOf } from '../init';
import { settleEconomyPure } from '../economy';
import { applyEffect } from '../events';
import { recruit } from '../military';
import { settlePopulation } from '../population';
import { setProvincePopulation } from '../provincePopulation';
import { prepareSharedSnapshot } from '../../../scripts/shared-world-engine-entry';
import { migrate, recoverMigratedSave } from '../../store/persistence';
import { developProvinceAction, enactPolicyAction } from '../../gameplay/actions';
import { buildEconomyAdvisorPlan } from '../../gameplay/economyAdvisor';
import { SAVE_VERSION } from '../../types/game';

describe('provincial population and grain settlement', () => {
  it('keeps every resident in the census after growth, events and recruitment', () => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    const provinces = provincesOf(nation.id, state.provinces);
    const capital = state.provinces[nation.capital];
    const startingPopulation = capital.population;
    const initialReceipts = settleEconomyPure(nation, state).grain.receipts;
    for (let year = 0; year < 60; year++) settlePopulation(nation, provinces, false, true, false, false);
    expect(capital.population).toBeGreaterThan(startingPopulation);
    for (const group of capital.classes) expect(Math.abs(group.count - capital.population * group.weight!)).toBeLessThan(1);
    expect(settleEconomyPure(nation, state).grain.receipts).toBeGreaterThan(initialReceipts);
    const sea = Object.values(state.provinces).find(p => p.terrain === 'ocean')!;
    sea.ownerId = nation.id;
    settlePopulation(nation, [sea], false, true, false, false);
    applyEffect(nation, { population: 301 }, state);
    applyEffect(nation, { population: -171 }, state);
    expect(sea.population).toBe(0);
    const beforeRecruit = capital.population;
    expect(recruit(state, nation, capital, 30).ok).toBe(true);
    expect(capital.population).toBeLessThan(beforeRecruit);
    for (const p of Object.values(state.provinces)) expect(p.classes.reduce((sum, g) => sum + g.count, 0)).toBe(p.population);
  });

  it('restores old census counts and crop rotation through local and shared snapshot loading', () => {
    const legacy = createInitialState();
    const nation = legacy.nations[legacy.playerNationId];
    const capital = legacy.provinces[nation.capital];
    const peasants = capital.classes[0].count;
    for (const group of capital.classes) delete group.weight;
    capital.population *= 2;
    nation.activePolicies.push({ policyId: 'crop_rotation', enactedTurn: 0 });
    nation.policyMods = { popGrowthMod: 1.15 };
    const save = { version: SAVE_VERSION, createdAt: new Date(0).toISOString(), gameState: legacy };
    const local = recoverMigratedSave(migrate(save)).gameState;
    const shared = prepareSharedSnapshot(legacy);
    for (const restored of [local, shared]) {
      const p = restored.provinces[nation.capital];
      expect(p.classes[0].count).toBe(2 * peasants);
      expect(restored.nations[nation.id].policyMods).toEqual({ foodOutputMod: 1.15 });
      const before = structuredClone(p.classes);
      setProvincePopulation(p, p.population);
      expect(p.classes).toEqual(before);
    }
    expect(capital.classes[0].count).toBe(peasants);
    expect(capital.classes[0].weight).toBeUndefined();
  });

  it('uses the enacted crop rotation bonus on production and recalculates the advisor after reclamation', () => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    nation.tech.agri = 5;
    nation.resources.gold = 2000;
    const before = settleEconomyPure(nation, state);
    const policy = enactPolicyAction(state, 'crop_rotation');
    expect(policy.ok).toBe(true);
    const enacted = policy.state.nations[nation.id];
    const after = settleEconomyPure(enacted, policy.state);
    expect(after.foodProduced).toBeCloseTo(before.foodProduced * 1.15);
    expect(after.foodConsumed).toBe(before.foodConsumed);
    expect(enacted.policyMods?.popGrowthMod).toBeUndefined();
    const improved = developProvinceAction(policy.state, nation.capital, 'reclaim');
    expect(improved.ok).toBe(true);
    const budget = settleEconomyPure(improved.state.nations[nation.id], improved.state).grain;
    expect(budget.net).toBeGreaterThan(after.grain.net);
    expect(buildEconomyAdvisorPlan(improved.state).foodBalance).toBe(Math.round(budget.net));
  });
});
