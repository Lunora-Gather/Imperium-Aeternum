import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { resolvePendingEventChoice } from '../pendingEventResolution';

describe('pending event resolution', () => {
  it('resolves from an immutable snapshot and cannot apply the same pending event twice', () => {
    const state = createInitialState();
    const pid = state.playerNationId;
    state.pendingEvents.push({ nationId: pid, eventId: 'evt_famine' });
    const snapshot = JSON.parse(JSON.stringify({ ...state, _relMap: undefined }));
    const foodBefore = state.nations[pid].resources.food;

    const first = resolvePendingEventChoice(state, pid, 'evt_famine', 0);

    expect(first.resolved).toBe(true);
    expect(JSON.parse(JSON.stringify({ ...state, _relMap: undefined }))).toEqual(snapshot);
    expect(first.state).not.toBe(state);
    expect(first.state.nations[pid].resources.food).toBe(foodBefore - 100);
    expect(first.state.pendingEvents).not.toContainEqual({ nationId: pid, eventId: 'evt_famine' });
    expect(first.state.triggeredEvents.filter((entry) => entry.eventId === 'evt_famine')).toHaveLength(1);

    const second = resolvePendingEventChoice(first.state, pid, 'evt_famine', 0);
    expect(second.resolved).toBe(false);
    expect(second.state).toBe(first.state);
    expect(second.state.nations[pid].resources.food).toBe(foodBefore - 100);
    expect(second.state.triggeredEvents.filter((entry) => entry.eventId === 'evt_famine')).toHaveLength(1);
  });
});
