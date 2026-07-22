import { afterEach, describe, expect, it } from 'vitest';
import type { EventDef, EventEffect } from '../../data/events';
import { createInitialState } from '../init';
import {
  applyEffect,
  applyEffectPure,
  applyEffectResult,
  applyRecordEventResult,
  checkTrigger,
  EVENT_BY_ID,
  isEventAvailable,
  recordEvent,
  recordEventPure,
} from '../events';
import { resolvePendingEventChoice } from '../../gameplay/pendingEventResolution';
import { sanitizeState } from '../../gameplay/stateHygiene';
import { invariantErrors } from '../../gameplay/stateInvariants';
import { weightedPick } from '../../utils/random';

const CUSTOM_EVENT_IDS = ['test_cycle_a', 'test_cycle_b'] as const;

afterEach(() => {
  for (const eventId of CUSTOM_EVENT_IDS) delete EVENT_BY_ID[eventId];
});

describe('event rule integrity', () => {
  it('enforces player-only and minimum-gold trigger predicates', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    const ai = Object.values(state.nations).find((nation) => nation.id !== player.id)!;

    expect(checkTrigger({ isPlayerOnly: true }, player, state)).toBe(true);
    expect(checkTrigger({ isPlayerOnly: true }, ai, state)).toBe(false);
    expect(checkTrigger({ minGold: player.resources.gold }, player, state)).toBe(true);
    expect(checkTrigger({ minGold: player.resources.gold + 1 }, player, state)).toBe(false);
  });

  it('never selects a zero-weight entry, including at the zero RNG boundary', () => {
    expect(weightedPick(() => 0, [
      { item: 'disabled', weight: 0 },
      { item: 'enabled', weight: 1 },
    ])).toBe('enabled');
    expect(weightedPick(() => 0.5, [
      { item: 'negative', weight: -10 },
      { item: 'enabled', weight: 1 },
    ])).toBe('enabled');
    expect(weightedPick(() => 0, [{ item: 'disabled', weight: 0 }])).toBeNull();
  });

  it('applies every declared event-effect family through the pure result applicator', () => {
    const left = createInitialState();
    const playerId = left.playerNationId;
    const player = left.nations[playerId];
    const relation = left.relations.find((entry) => entry.from === playerId)!;
    player.government.stability = 98;
    player.government.legitimacy = 99;
    player.government.corruption = 1;
    player.government.efficiency = 97;
    player.warExhaustion = 96;
    player.taxRate = 0.49;

    const right = structuredClone(left);
    const effect: EventEffect = {
      gold: 11,
      food: 12,
      wood: 13,
      iron: 14,
      influence: 15,
      adminPt: 16,
      sciPt: 17,
      stability: 9,
      legitimacy: 8,
      corruption: -9,
      efficiency: 7,
      warExhaustion: 10,
      taxRate: 0.1,
      assimilationMod: 2,
      population: 7,
      relation: { target: relation.to, delta: 200 },
      factionSat: [
        { faction: 'commoners', delta: 200 },
        { faction: 'nobles', delta: -200 },
      ],
      triggerEvent: 'evt_chain_plague_2',
    };

    applyEffect(left.nations[playerId], effect, left);
    const beforePure = structuredClone(right);
    const result = applyEffectPure(right.nations[playerId], effect, right);
    expect(right).toEqual(beforePure);
    applyEffectResult(right.nations[playerId], right, result);

    expect(right).toEqual(left);
    expect(right.nations[playerId].policyMods?.assimilationMod).toBe(2);
    expect(right.nations[playerId].warExhaustion).toBe(100);
    expect(right.nations[playerId].taxRate).toBe(0.5);
    expect(right.relations.find((entry) => entry.from === playerId && entry.to === relation.to)?.relation).toBe(100);
  });

  it('distributes population changes exactly and never makes a province negative', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    const fallbackOwner = Object.values(state.nations).find((nation) => nation.id !== player.id)!;
    const all = Object.values(state.provinces);
    const selected = [
      state.provinces[player.capital],
      ...all.filter((province) => province.id !== player.capital),
    ].slice(0, 3);

    for (const province of all) {
      if (province.ownerId === player.id) province.ownerId = fallbackOwner.id;
    }
    selected.forEach((province, index) => {
      province.ownerId = player.id;
      province.population = [1, 100, 100][index];
    });

    const loss = applyEffectPure(player, { population: -150 }, state);
    expect(Object.values(loss.provPopDeltas).reduce((sum, delta) => sum + delta, 0)).toBe(-150);
    applyEffectResult(player, state, loss);
    expect(selected.every((province) => province.population >= 0)).toBe(true);

    const gain = applyEffectPure(player, { population: 5 }, state);
    expect(Object.values(gain.provPopDeltas).reduce((sum, delta) => sum + delta, 0)).toBe(5);
    const gainValues = Object.values(gain.provPopDeltas);
    expect(Math.max(...gainValues) - Math.min(...gainValues)).toBeLessThanOrEqual(1);
  });

  it('scopes unique-event history and cooldowns to each nation', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    const ai = Object.values(state.nations).find((nation) => nation.id !== player.id)!;
    const unique = EVENT_BY_ID.evt_chain_plague_3;
    const repeatable = EVENT_BY_ID.evt_famine;

    recordEvent(state, player.id, unique.id, 0);
    recordEvent(state, player.id, repeatable.id, 0);

    expect(isEventAvailable(unique, player, state)).toBe(false);
    expect(isEventAvailable(unique, ai, state)).toBe(true);
    expect(isEventAvailable(repeatable, player, state)).toBe(false);
    expect(isEventAvailable(repeatable, ai, state)).toBe(true);

    // The recent event log is capped at 1000 entries; durable cooldown history
    // must still prevent a unique event from reappearing after that log rotates.
    state.triggeredEvents = [];
    expect(isEventAvailable(unique, player, state)).toBe(false);

    recordEvent(state, ai.id, repeatable.id, 1);
    expect(state.eventCooldowns.filter((entry) => entry.eventId === repeatable.id)).toEqual([
      expect.objectContaining({ nationId: player.id }),
      expect.objectContaining({ nationId: ai.id }),
    ]);
  });

  it('keeps legacy unscoped history for the saved player without suppressing AI events', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    const ai = Object.values(state.nations).find((nation) => nation.id !== player.id)!;
    const unique = EVENT_BY_ID.evt_chain_plague_3;
    state.triggeredEvents.push({ eventId: unique.id, turn: state.turn, optionIndex: 0 });

    expect(isEventAvailable(unique, player, state)).toBe(false);
    expect(isEventAvailable(unique, ai, state)).toBe(true);
  });

  it('keeps mutable event recording exactly equivalent to pure calculation plus apply', () => {
    const left = createInitialState();
    const right = structuredClone(left);
    const playerId = left.playerNationId;

    recordEvent(left, playerId, 'evt_test', 1);
    const pure = recordEventPure(right, playerId, 'evt_test', 1);
    expect(right.triggeredEvents).toHaveLength(0);
    expect(right.eventCooldowns).toHaveLength(0);
    applyRecordEventResult(right, pure);

    expect(right.triggeredEvents).toEqual(left.triggeredEvents);
    expect(right.eventCooldowns).toEqual(left.eventCooldowns);
  });

  it('normalizes legacy event history and removes duplicate or impossible pending entries', () => {
    const state = createInitialState();
    const playerId = state.playerNationId;
    state.turn = 12;
    state.triggeredEvents = [{ eventId: 'evt_famine', turn: 4, optionIndex: 0 }];
    state.eventCooldowns = [
      { eventId: 'evt_famine', lastTriggeredTurn: 4 },
      { nationId: playerId, eventId: 'evt_famine', lastTriggeredTurn: 8 },
      { nationId: 'missing_nation', eventId: 'evt_plague', lastTriggeredTurn: 9 },
    ];
    state.pendingEvents = [
      { nationId: playerId, eventId: 'evt_famine' },
      { nationId: playerId, eventId: 'evt_famine' },
      { nationId: playerId, eventId: 'missing_event' },
      { nationId: 'missing_nation', eventId: 'evt_plague' },
    ];
    state.pendingEventOptions = {
      nationId: playerId,
      eventId: 'missing_event',
      options: [{ text: 'ghost', index: 0 }],
    };

    const sanitized = sanitizeState(state);

    expect(sanitized.triggeredEvents).toEqual([
      { nationId: playerId, eventId: 'evt_famine', turn: 4, optionIndex: 0 },
    ]);
    expect(sanitized.eventCooldowns).toEqual([
      { nationId: playerId, eventId: 'evt_famine', lastTriggeredTurn: 8 },
    ]);
    expect(sanitized.pendingEvents).toEqual([{ nationId: playerId, eventId: 'evt_famine' }]);
    expect(sanitized.pendingEventOptions).toBeNull();
    expect(invariantErrors(sanitized)).toEqual([]);
  });

  it('cuts a malformed player event cycle after each event resolves once in a turn', () => {
    const makeEvent = (id: string, nextId: string): EventDef => ({
      id,
      title: id,
      description: id,
      category: 'crisis',
      trigger: {},
      weight: 0,
      cooldown: 0,
      unique: false,
      options: [
        { text: 'continue', effects: { triggerEvent: nextId }, aiWeight: 1 },
        { text: 'stop', effects: {}, aiWeight: 1 },
      ],
    });
    EVENT_BY_ID.test_cycle_a = makeEvent('test_cycle_a', 'test_cycle_b');
    EVENT_BY_ID.test_cycle_b = makeEvent('test_cycle_b', 'test_cycle_a');

    const state = createInitialState();
    const nationId = state.playerNationId;
    state.pendingEvents = [{ nationId, eventId: 'test_cycle_a' }];

    const first = resolvePendingEventChoice(state, nationId, 'test_cycle_a', 0);
    expect(first.resolved).toBe(true);
    expect(first.state.pendingEvents).toEqual([{ nationId, eventId: 'test_cycle_b' }]);

    const second = resolvePendingEventChoice(first.state, nationId, 'test_cycle_b', 0);
    expect(second.resolved).toBe(true);
    expect(second.state.pendingEvents).toEqual([]);
    expect(second.state.triggeredEvents.map((entry) => entry.eventId)).toEqual([
      'test_cycle_a',
      'test_cycle_b',
    ]);
  });
});
