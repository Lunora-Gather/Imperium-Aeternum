import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildGovernorAdvisorPlan } from '../governorAdvisor';
import type { CommandCenterAction } from '../commandCenterActions';

describe('governor advisor', () => {
  it('builds a prioritized route', () => {
    const plan = buildGovernorAdvisorPlan(createInitialState());

    expect(['blocked', 'stabilize', 'develop', 'expand']).toContain(plan.mode);
    expect(plan.confidence).toBeGreaterThanOrEqual(0);
    expect(plan.queue.length).toBeGreaterThan(0);
  });

  it('puts pending events first', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'event_a' });

    const plan = buildGovernorAdvisorPlan(state);

    expect(plan.mode).toBe('blocked');
    expect(plan.primaryAction?.id).toContain('fix-blockers');
    expect(plan.primaryAction?.tone).toBe('danger');
  });

  it('includes economy route when gold is low', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.gold = -500;

    const plan = buildGovernorAdvisorPlan(state);

    expect(plan.queue.some((x) => x.source === 'economy')).toBe(true);
    expect(plan.queue.some((x) => x.tone === 'danger')).toBe(true);
  });

  it('can include command center entries', () => {
    const state = createInitialState();
    const command: CommandCenterAction = { id: 'cmd-a', label: '发展核心省份', desc: '建设基础。', tab: 'province', level: 99, tone: 'warn', source: 'fallback' };
    const plan = buildGovernorAdvisorPlan(state, [command]);

    expect(plan.queue.some((x) => x.id === 'cmd-cmd-a')).toBe(true);
  });
});
