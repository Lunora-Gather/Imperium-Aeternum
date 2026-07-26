import { describe, expect, it } from 'vitest';
import { BUILD_MARK } from '../../buildInfo';
import { createInitialState } from '../../engine/init';
import { buildReadinessReport } from '../readiness';
import { buildReleaseReadinessPlan } from '../releaseReadiness';

describe('system release readiness', () => {
  it('exposes the stable build and current integrity state', () => {
    const state = createInitialState();
    const plan = buildReleaseReadinessPlan(buildReadinessReport(state));

    expect(plan.buildMark).toBe(BUILD_MARK);
    expect(plan.integrityCount).toBe(2);
    expect(plan.tone).toBe('warn');
  });

  it('surfaces state-integrity diagnostics instead of hiding them', () => {
    const state = createInitialState();
    state.provinces[Object.keys(state.provinces)[0]].ownerId = 'missing-nation';

    const plan = buildReleaseReadinessPlan(buildReadinessReport(state));
    expect(plan.integrityCount).toBeGreaterThan(0);
    expect(plan.tone).toBe('danger');
  });
});
