import { describe, expect, it } from 'vitest';
import { BUILD_MARK } from '../../buildInfo';
import { createInitialState } from '../../engine/init';
import { buildReleaseReadinessPlan } from '../releaseReadiness';

describe('release readiness', () => {
  it('builds visible release readiness information', () => {
    const plan = buildReleaseReadinessPlan(createInitialState());

    expect(plan.buildMark).toBe(BUILD_MARK);
    expect(plan.buildMark).toMatch(/^(V\d+|\d+\.\d+\.\d+)/);
    expect(plan.items.find((x) => x.id === 'build')?.tone).toBe('good');
    expect(plan.score).toBeGreaterThanOrEqual(0);
    expect(plan.items.map((x) => x.id)).toEqual(['build', 'dashboard', 'route', 'risk', 'domestic', 'external']);
  });

  it('includes dashboard coverage', () => {
    const plan = buildReleaseReadinessPlan(createInitialState());

    expect(plan.items.find((x) => x.id === 'dashboard')?.body).toContain('模块');
  });

  it('reflects risk status when events are pending', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'event_a' });

    const plan = buildReleaseReadinessPlan(state);

    expect(plan.items.find((x) => x.id === 'risk')?.tone).toBe('danger');
  });
});
