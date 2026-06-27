import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildOnboardingCoachPlan } from '../onboardingCoach';

describe('onboarding coach', () => {
  it('builds a staged coaching plan with actionable steps', () => {
    const state = createInitialState();
    const plan = buildOnboardingCoachPlan(state);

    expect(plan.steps.length).toBeGreaterThanOrEqual(5);
    expect(plan.progress).toBeGreaterThanOrEqual(0);
    expect(['survive', 'stabilize', 'expand', 'optimize']).toContain(plan.stage);
    expect(plan.nextStep).toBeTruthy();
  });

  it('prioritizes blockers when the player has pending events', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'event_a' });

    const plan = buildOnboardingCoachPlan(state);

    expect(plan.stage).toBe('survive');
    expect(plan.nextStep?.id).toBe('fix-blockers');
    expect(plan.nextStep?.status).toBe('blocked');
  });

  it('points new players to army preparation when no army exists', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].army = [];

    const plan = buildOnboardingCoachPlan(state);

    expect(plan.steps.find((s) => s.id === 'prepare-army')?.status).toBe('todo');
  });

  it('has a safe missing nation fallback', () => {
    const plan = buildOnboardingCoachPlan(createInitialState(), 'missing');

    expect(plan.tone).toBe('danger');
    expect(plan.steps[0].status).toBe('blocked');
  });
});
