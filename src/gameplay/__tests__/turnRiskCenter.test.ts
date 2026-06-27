import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildTurnRiskCenterPlan } from '../turnRiskCenter';

describe('turn risk center', () => {
  it('builds a turn readiness plan with visible sections', () => {
    const state = createInitialState();
    const plan = buildTurnRiskCenterPlan(state);

    expect(plan.readiness).toBeGreaterThanOrEqual(0);
    expect(['advance', 'prepare', 'block']).toContain(plan.decision);
    expect(plan.primaryCta.length).toBeGreaterThan(0);
  });

  it('blocks advancing when pending events exist', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'test_event' });

    const plan = buildTurnRiskCenterPlan(state);

    expect(plan.decision).toBe('block');
    expect(plan.blockers.map((b) => b.id)).toContain('pending-events');
    expect(plan.primaryTab).toBe('dashboard');
  });

  it('blocks during fiscal and food collapse', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.resources.gold = -400;
    player.resources.food = -200;

    const plan = buildTurnRiskCenterPlan(state);

    expect(plan.decision).toBe('block');
    expect(plan.blockers.map((b) => b.id)).toEqual(expect.arrayContaining(['bankruptcy', 'food-crisis']));
  });

  it('surfaces unrest as a blocker when many provinces are unstable', () => {
    const state = createInitialState();
    Object.values(state.provinces).filter((p) => p.ownerId === state.playerNationId).slice(0, 3).forEach((p) => {
      p.unrest = 90;
      p.rebellionRisk = 90;
    });

    const plan = buildTurnRiskCenterPlan(state);

    expect(plan.blockers.map((b) => b.id)).toContain('unrest-crisis');
    expect(plan.tone).toBe('danger');
  });
});
