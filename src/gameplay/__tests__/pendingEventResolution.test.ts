import { describe, expect, it } from 'vitest';
import { createInitialState, getRelationObj } from '../../engine/init';
import { setTaxRateAction } from '../actions/domesticActions';
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

  it('allows a gold deficit but not negative influence when buying emergency food', () => {
    const state = createInitialState();
    const pid = state.playerNationId;
    const resources = state.nations[pid].resources;
    resources.gold = 10;
    resources.influence = 1;
    state.pendingEvents.push({ nationId: pid, eventId: 'evt_famine' });

    const result = resolvePendingEventChoice(state, pid, 'evt_famine', 1);

    expect(result.resolved).toBe(true);
    expect(result.state.nations[pid].resources).toMatchObject({ gold: -140, food: resources.food + 80, influence: 0 });
    expect(resources.influence).toBe(1);
    const nextOrder = setTaxRateAction(result.state, 0.25);
    expect(nextOrder.ok).toBe(true);
    expect(nextOrder.state.nations[pid].taxRate).toBe(0.25);
  });

  it('does not leak the transient relation index after a diplomatic choice', () => {
    const state = createInitialState();
    const pid = state.playerNationId;
    state._relMap = new Map();
    const relation = getRelationObj(pid, 'n02', state)!;
    const before = relation.relation;
    state.pendingEvents.push({ nationId: pid, eventId: 'evt_border_clash' });

    const result = resolvePendingEventChoice(state, pid, 'evt_border_clash', 0);

    expect(result.resolved).toBe(true);
    expect(result.state._relMap).toBeUndefined();
    expect(relation.relation).toBe(before);
    expect(getRelationObj(pid, 'n02', result.state)?.relation).toBe(Math.min(100, before + 10));
    expect(result.state.provinces).toBe(state.provinces);
    expect(result.state.nations.n02).toBe(state.nations.n02);
  });
});
