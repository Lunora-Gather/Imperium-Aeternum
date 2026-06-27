import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { processTurn } from '../../engine/turn';
import { buildCommandCenterActions } from '../commandCenterActions';
import { buildDashboardCommandGroups } from '../dashboardCommandGroups';
import { buildGovernorAdvisorPlan } from '../governorAdvisor';
import { buildReleaseReadinessPlan } from '../releaseReadiness';
import { buildStrategicHqPlan } from '../strategicHq';

const SUPPORTED_DASHBOARD_ITEMS = ['release', 'governor', 'onboarding', 'strategic-hq', 'turn-risk', 'economy', 'diplomacy', 'war'];

describe('dashboard stability smoke', () => {
  it('builds the full dashboard command stack from a fresh state', () => {
    const state = createInitialState();
    const actions = buildCommandCenterActions(state, 5);
    const hq = buildStrategicHqPlan(state, actions);
    const groups = buildDashboardCommandGroups(state);
    const governor = buildGovernorAdvisorPlan(state, actions);
    const release = buildReleaseReadinessPlan(state, actions);

    expect(actions.length).toBeGreaterThan(0);
    expect(hq.title.length).toBeGreaterThan(0);
    expect(groups.map((g) => g.id)).toEqual(['guide', 'risk', 'domestic', 'external']);
    expect(groups.flatMap((g) => g.itemIds).every((id) => SUPPORTED_DASHBOARD_ITEMS.includes(id))).toBe(true);
    expect(governor.queue.length).toBeGreaterThan(0);
    expect(release.buildMark).toContain('V');
    expect(release.score).toBeGreaterThanOrEqual(0);
  });

  it('keeps dashboard advisors stable after several processed turns', () => {
    let state = createInitialState();
    for (let i = 0; i < 3; i++) state = processTurn(state).state;

    const actions = buildCommandCenterActions(state, 6);
    const groups = buildDashboardCommandGroups(state);
    const governor = buildGovernorAdvisorPlan(state, actions);
    const release = buildReleaseReadinessPlan(state, actions);

    expect(state.turn).toBe(3);
    expect(actions.every((a) => a.label.length > 0 && a.desc.length > 0)).toBe(true);
    expect(groups.every((g) => g.title.length > 0 && g.subtitle.length > 0)).toBe(true);
    expect(governor.confidence).toBeGreaterThanOrEqual(0);
    expect(governor.confidence).toBeLessThanOrEqual(100);
    expect(release.items.length).toBe(6);
  });

  it('surfaces release and governor items in the first dashboard group', () => {
    const groups = buildDashboardCommandGroups(createInitialState());
    const guide = groups[0];

    expect(guide.id).toBe('guide');
    expect(guide.itemIds.slice(0, 2)).toEqual(['release', 'governor']);
  });
});
