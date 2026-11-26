import { afterEach, describe, expect, it } from 'vitest';
import { EVENTS, type EventDef, type EventEffect } from '../../data/events';
import { createInitialState } from '../init';
import {
  applyEffect,
  applyEffectPure,
  applyEffectResult,
  applyRecordEventResult,
  checkTrigger,
  createEventAvailabilityIndex,
  EVENT_BY_ID,
  isEventAvailable,
  recordEvent,
  recordEventPure,
  rollEvents,
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
  it('keeps event identities distinct for players and history records', () => {
    const titles = EVENTS.map((event) => event.title.trim());
    const descriptions = EVENTS.map((event) => event.description.trim());

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('keeps each option faction effect unambiguous', () => {
    for (const event of EVENTS) {
      for (const [optionIndex, option] of event.options.entries()) {
        const factions = option.effects.factionSat?.map((entry) => entry.faction) ?? [];
        expect(new Set(factions).size, `${event.id}.option-${optionIndex + 1}`).toBe(factions.length);
      }
    }
  });

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

  it('preserves the draw order after peace, war and loading an earlier turn', () => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    for (const [turn, atWar] of [[25, false], [25, true], [1, false], [25, false]] as const) {
      state.turn = turn;
      nation.atWar = atWar;
      const history = createEventAvailabilityIndex(state);
      const eligible = EVENTS.filter(event => event.weight > 0
        && checkTrigger(event.trigger, nation, state) && isEventAvailable(event, nation, state, history));
      let draws = 0;
      const picked = rollEvents(nation, state, () => { draws++; return 0; }, EVENTS.length, history);
      expect(picked).toEqual(eligible.map(event => event.id));
      expect(draws).toBe(eligible.length);
    }
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

  it.each([
    [100, 100, 1], [1, 100, 100], [100, 1, 100], [0, 0, 0], [7, 0, 0],
  ])('applies a 150-person event loss with provincial populations %i, %i, %i', (a, b, c) => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    const owned = Object.values(state.provinces).filter(p => p.ownerId === nation.id);
    owned.forEach((p, i) => { p.population = [a, b, c][i] ?? 0; });
    const total = a + b + c;
    applyEffect(nation, { population: -150 }, state);
    expect(owned.reduce((sum, p) => sum + p.population, 0)).toBe(Math.max(0, total - 150));
    expect(owned.every(p => p.population >= 0)).toBe(true);
    if (total > 150) {
      expect(owned.map(p => p.population).sort((x, y) => y - x).slice(0, 3)).toEqual([26, 25, 0]);
    }
  });

  it('preserves map-order rounding when the last province can pay its smaller share', () => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    const owned = Object.values(state.provinces).filter(p => p.ownerId === nation.id);
    const populations = [100, 90, 80, 37];
    owned.forEach((p, i) => {
      if (i < populations.length) p.population = populations[i];
      else p.ownerId = 'barbarian';
    });
    const result = applyEffectPure(nation, { population: -150 }, state);
    expect(owned.slice(0, 4).map(p => result.provPopDeltas[p.id])).toEqual([-38, -38, -37, -37]);
  });

  it('allows event deficits only for gold and food', () => {
    const state = createInitialState();
    const nation = state.nations[state.playerNationId];
    const starting = { gold: 3, food: 3, wood: 3, iron: 3, adminPt: 3, sciPt: 3, influence: 3 };
    Object.assign(nation.resources, starting);
    applyEffect(nation, { gold: -5, food: -5, wood: -5, iron: -5, adminPt: -5, sciPt: -5, influence: -5 }, state);
    expect(nation.resources).toMatchObject({ gold: -2, food: -2, wood: 0, iron: 0, adminPt: 0, sciPt: 0, influence: 0 });
  });

  it('checks per-nation uniqueness for forced chain endings in later turns', () => {
    const state = createInitialState();
    const { id } = EVENT_BY_ID.evt_chain_plague_3;
    const ruler = state.nations[state.playerNationId];
    const peer = Object.values(state.nations).find(n => n.id !== ruler.id)!;
    recordEvent(state, ruler.id, id, 0);
    state.turn++;
    state.triggeredEvents = [];
    applyEffect(ruler, { triggerEvent: id }, state);
    applyEffect(peer, { triggerEvent: id }, state);
    expect(state.pendingEvents).toEqual([{ nationId: peer.id, eventId: id }]);
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

  it('keeps indexed cooldown writes equivalent for legacy duplicates and chained repeats', () => {
    const state = createInitialState();
    const player = state.playerNationId;
    const event = EVENT_BY_ID.evt_famine;
    state.turn = event.cooldown + 2;
    state.eventCooldowns.push(
      { eventId: event.id, lastTriggeredTurn: 0 },
      { nationId: player, eventId: event.id, lastTriggeredTurn: state.turn - 1 },
    );
    const reference = structuredClone(state);
    const index = createEventAvailabilityIndex(state);
    expect(isEventAvailable(event, state.nations[player], state, index)).toBe(false);
    for (const id of [player, 'n02', 'n02']) {
      recordEvent(state, id, event.id, 0, index);
      recordEvent(reference, id, event.id, 0);
      expect(isEventAvailable(event, state.nations[id], state, index)).toBe(false);
    }
    expect(state.triggeredEvents).toEqual(reference.triggeredEvents);
    expect(state.eventCooldowns).toEqual(reference.eventCooldowns);
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
