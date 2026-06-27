import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildEconomyAdvisorPlan } from '../economyAdvisor';

describe('economy advisor', () => {
  it('builds a readable economy and internal affairs plan', () => {
    const state = createInitialState();
    const plan = buildEconomyAdvisorPlan(state);

    expect(plan.nationId).toBe(state.playerNationId);
    expect(plan.health).toBeGreaterThanOrEqual(0);
    expect(plan.metrics.map((m) => m.id)).toEqual(['gold', 'food', 'supply', 'stability', 'corruption', 'unrest']);
    expect(plan.recommendations.length).toBeGreaterThan(0);
  });

  it('prioritizes fiscal and food recovery during collapse', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.resources.gold = -500;
    player.resources.food = -300;
    player.resources.supply = 5;
    player.government.stability = 22;
    player.government.corruption = 72;
    state.lastReport = {
      turn: state.turn + 1,
      nationId: state.playerNationId,
      income: { tax: 5, trade: 0, building: 0 },
      expense: { military: 80, corruption: 40 },
      foodDelta: -90,
      popDelta: 0,
      stabilityDelta: -3,
      legitimacyDelta: 0,
      unrestDelta: 5,
      events: [],
      warnings: [],
      warProgress: [],
      factionDelta: [],
      exhaustSnapshot: 0,
      worldEvents: [],
      provinceChanges: [],
    };

    const plan = buildEconomyAdvisorPlan(state);

    expect(plan.tone).toBe('danger');
    expect(plan.recommendations.map((r) => r.id)).toContain('raise_tax');
    expect(plan.recommendations.map((r) => r.id)).toContain('build_farm');
    expect(plan.metrics.find((m) => m.id === 'gold')?.tone).toBe('danger');
    expect(plan.metrics.find((m) => m.id === 'food')?.tone).toBe('danger');
  });

  it('warns about unrest provinces', () => {
    const state = createInitialState();
    const playerProvince = Object.values(state.provinces).find((p) => p.ownerId === state.playerNationId)!;
    playerProvince.unrest = 80;
    playerProvince.rebellionRisk = 80;

    const plan = buildEconomyAdvisorPlan(state);

    expect(plan.unrestCount).toBeGreaterThan(0);
    expect(plan.recommendations.map((r) => r.id)).toContain('suppress');
  });

  it('has a safe missing nation fallback', () => {
    const plan = buildEconomyAdvisorPlan(createInitialState(), 'missing');

    expect(plan.tone).toBe('danger');
    expect(plan.recommendations[0].title).toContain('重新读档');
  });
});
