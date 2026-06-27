import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildDashboardCommandGroups } from '../dashboardCommandGroups';

describe('dashboard command groups', () => {
  it('creates the four dashboard groups in order', () => {
    const groups = buildDashboardCommandGroups(createInitialState());

    expect(groups.map((g) => g.id)).toEqual(['guide', 'risk', 'domestic', 'external']);
    expect(groups.every((g) => g.title.length > 0 && g.subtitle.length > 0)).toBe(true);
  });

  it('opens the risk group when blockers exist', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'event_a' });

    const groups = buildDashboardCommandGroups(state);
    const risk = groups.find((g) => g.id === 'risk')!;

    expect(risk.tone).toBe('danger');
    expect(risk.defaultOpen).toBe(true);
  });

  it('marks domestic group dangerous when gold is low', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].resources.gold = -300;

    const groups = buildDashboardCommandGroups(state);

    expect(groups.find((g) => g.id === 'domestic')?.tone).toBe('danger');
  });

  it('keeps each group connected to render item ids', () => {
    const groups = buildDashboardCommandGroups(createInitialState());

    expect(groups.flatMap((g) => g.itemIds)).toEqual(['release', 'governor', 'onboarding', 'strategic-hq', 'turn-risk', 'economy', 'diplomacy', 'war']);
  });
});
