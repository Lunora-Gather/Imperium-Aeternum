import { describe, expect, it } from 'vitest';
import { createInitialState, createWorldState } from '../init';
import { processAITurn } from '../ai';
import { cloneGameState } from '../stateClone';
import { processTurn } from '../turn';
import { advanceSharedWorld, applySharedWorldCommand, createSharedWorldSnapshot, prepareSharedSnapshot, sharedRulerSnapshot } from '../../../scripts/shared-world-engine-entry';
import seed from '../../../appwrite/seeds/living-world-v1.json';

describe('shared world turn isolation', () => {
  it('opens the advertised nations and capitals in the seeded shared world', () => {
    const snapshot = createSharedWorldSnapshot();
    for (const { nationId, nationName } of seed.openNations) {
      const ruler = snapshot.nations[nationId];
      expect(ruler, nationName).toMatchObject({ name: nationName, defeated: false });
      expect(snapshot.provinces[ruler.capital].ownerId).toBe(nationId);
    }
    expect(Object.keys(snapshot.nations)).toHaveLength(seed.world.nationCount);
  });

  it('does not let AI issue orders for a human-controlled nation', () => {
    const state = createWorldState(20260722);
    const humanId = 'n_med_rome';
    expect(state.nations[humanId]).toBeDefined();
    for (const nation of Object.values(state.nations)) {
      nation.isPlayer = false;
      if (nation.id !== humanId) nation.defeated = true;
    }
    const before = cloneGameState(state).nations[humanId];
    processAITurn(state, new Set([humanId]));
    expect(state.nations[humanId]).toEqual(before);
  });

  it('does not end the whole shared world on one ruler single-player failure', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    state.provinces[player.capital].ownerId = Object.keys(state.nations).find((id) => id !== player.id)!;
    expect(processTurn(cloneGameState(state)).state.victory.type).toBe('fail_capital_lost');
    expect(processTurn(cloneGameState(state), { sharedWorld: true, humanNationIds: [state.playerNationId] }).state.victory.type).toBeNull();
  });

  it('rejects an injected strategy focus before it reaches shared state', () => {
    const state = createSharedWorldSnapshot();
    expect(() => applySharedWorldCommand(state, 'n_med_rome', {
      action: 'set_strategy_focus',
      args: ['__proto__'],
    })).toThrow('国策焦点无效');
  });
});

it('settles both rulers once, retains their own reports and focus, and ignores roster order', () => {
  let state = createInitialState();
  const ids = ['n01', 'n02'];
  for (const id of ids) state.nations[id].govTransitionTurns = 3;
  state = applySharedWorldCommand(state, ids[0], { action: 'set_strategy_focus', args: ['reform'] }).state;
  state = applySharedWorldCommand(state, ids[1], { action: 'set_strategy_focus', args: ['military'] }).state;
  const next = advanceSharedWorld(structuredClone(state), ids);
  const reversed = advanceSharedWorld(structuredClone(state), [...ids].reverse());
  expect(next).toEqual(reversed);
  expect(next.turn).toBe(1);
  for (const id of ids) {
    expect(next.nations[id].govTransitionTurns).toBe(2);
    expect(next.sharedHistories?.[id]?.[0]).toMatchObject({ nationId: id, turn: 1 });
  }
  expect(next.sharedHistories?.n01[0].strategicNotes?.join('')).toContain('改革');
  expect(next.sharedHistories?.n02[0].strategicNotes?.join('')).toContain('强军');
});

it('advances a caretaker turn after the first nation in the snapshot was defeated', () => {
  const state = createInitialState();
  state.nations[Object.keys(state.nations)[0]].defeated = true;
  expect(advanceSharedWorld(state, []).turn).toBe(1);
});

it('restores per-nation history and unscoped event records from a legacy shared snapshot', () => {
  const old = createInitialState();
  old.playerNationId = 'n02';
  const state = processTurn(old).state;
  state.triggeredEvents = [{ turn: 1, eventId: 'legacy', optionIndex: 0 }];
  state.strategyFocus = 'military';
  const next = advanceSharedWorld(state, ['n01', 'n02']);
  expect(next.sharedHistories?.n02.map((r) => r.turn)).toEqual([1, 2]);
  expect(next.sharedHistories?.n01.map((r) => r.turn)).toEqual([2]);
  expect(next.sharedFocuses?.n02).toBe('military');
  expect(next.triggeredEvents.find((e) => e.eventId === 'legacy')?.nationId).toBe('n02');
  expect(state.triggeredEvents[0].nationId).toBeUndefined();
});

it('projects each ruler’s final unrest, exhaustion and milestones alongside public diplomacy', () => {
  const state = createInitialState();
  state.sharedFocuses = { n01: 'stability', n02: 'military' };
  state.chronicle.push({ turn: 0, actorId: 'n02', kind: 'milestone_diplomacy', title: '两国通商', desc: '' });
  for (const province of Object.values(state.provinces)) province.unrest = 35;
  const next = advanceSharedWorld(state, ['n01', 'n02']);
  for (const id of ['n01', 'n02']) {
    const view = sharedRulerSnapshot(next, id);
    const unrest = Object.values(view.provinces).reduce((sum, p) => sum +
      (p.ownerId === id && state.provinces[p.id].ownerId === id ? Math.round(p.unrest - state.provinces[p.id].unrest) : 0), 0);
    expect(view.lastReport).toMatchObject({ unrestDelta: unrest, exhaustSnapshot: Math.round(view.nations[id].warExhaustion) });
    expect(view.chronicle.filter(c => c.kind === 'founding').map(c => c.title)).toEqual([view.nations[id].name + ' 立国']);
    expect(view.chronicle).toContainEqual(state.chronicle[0]);
  }
});

it('migrates known national records once and retains unattributed legacy history', () => {
  const state = createInitialState();
  state.playerNationId = 'n02';
  state.chronicle = [
    { turn: 1, kind: 'founding', title: '罗马 立国', desc: '' },
    { turn: 2, kind: 'reform', title: '改革', desc: '', actorId: 'n02' },
    { turn: 3, kind: 'trade', title: '国库充盈', desc: '' },
  ];
  const next = prepareSharedSnapshot(state);
  expect(prepareSharedSnapshot(next)).toEqual(next);
  expect(state.chronicle).toHaveLength(3);
  expect(sharedRulerSnapshot(next, 'n01').chronicle.map(c => c.title)).toEqual(['罗马 立国', '国库充盈']);
  expect(sharedRulerSnapshot(next, 'n02').chronicle.map(c => c.title)).toEqual(['改革', '国库充盈']);
});
