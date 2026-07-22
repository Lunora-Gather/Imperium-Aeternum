import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { processTurn } from '../../engine/turn';
import { useGameStore } from '../../store/gameStore';
import { resolvePendingEventChoice } from '../pendingEventResolution';

describe('player event queue integration', () => {
  beforeEach(() => {
    useGameStore.setState({ state: createInitialState(), scene: 'menu', log: [], justProcessedTurn: false });
  });

  it('queues player events for a real choice instead of silently applying an AI option', () => {
    const before = createInitialState();
    const result = processTurn(before);
    const pending = result.state.pendingEvents.filter((entry) => entry.nationId === before.playerNationId);

    expect(pending.length).toBeGreaterThan(0);
    expect(result.report.events).toEqual(pending.map((entry) => entry.eventId));
    expect(result.state.triggeredEvents.some((entry) => pending.some((queued) => queued.eventId === entry.eventId))).toBe(false);
    expect(result.state.pendingEvents.every((entry) => entry.nationId === before.playerNationId)).toBe(true);
  });

  it('records the selected option once and blocks turn advancement until all choices are handled', () => {
    useGameStore.getState().startScenario('classic');
    useGameStore.getState().nextTurn();
    const queued = useGameStore.getState().state.pendingEvents.find((entry) => entry.nationId === useGameStore.getState().state.playerNationId)!;
    const turnBeforeBlockedCall = useGameStore.getState().state.turn;

    expect(useGameStore.getState().nextTurn()).toBeNull();
    expect(useGameStore.getState().state.turn).toBe(turnBeforeBlockedCall);

    const current = useGameStore.getState().state;
    const resolved = resolvePendingEventChoice(current, queued.nationId, queued.eventId, 0);
    expect(resolved.resolved).toBe(true);
    expect(resolved.state.triggeredEvents.filter((entry) => entry.eventId === queued.eventId)).toHaveLength(1);
    expect(resolved.state.pendingEvents.some((entry) => entry.nationId === queued.nationId && entry.eventId === queued.eventId)).toBe(false);
  });
});
