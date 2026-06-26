import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildReadinessReport } from '../readiness';
import { sanitizeState } from '../stateHygiene';
import type { GameState } from '../../types/game';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function firstForeignNationId(state: GameState): string {
  return Object.keys(state.nations).find((id) => id !== state.playerNationId) ?? state.playerNationId;
}

describe('state hygiene repair chain', () => {
  it('does not mutate its input while repairing scalar ranges', () => {
    const state = createInitialState();
    const before = clone(state);
    state.nations[state.playerNationId].resources.wood = -10;
    state.nations[state.playerNationId].government.stability = 180;
    state.provinces[state.nations[state.playerNationId].capital].unrest = Number.NaN;

    const repaired = sanitizeState(state);

    expect(state.nations[state.playerNationId].resources.wood).toBe(-10);
    expect(state.nations[state.playerNationId].government.stability).toBe(180);
    expect(repaired).not.toBe(state);
    expect(repaired.nations[state.playerNationId]).not.toBe(state.nations[state.playerNationId]);
    expect(repaired.nations[state.playerNationId].resources.wood).toBe(0);
    expect(repaired.nations[state.playerNationId].government.stability).toBe(100);
    expect(Number.isNaN(before.provinces[before.nations[before.playerNationId].capital].unrest)).toBe(false);
  });

  it('repairs duplicate and one-sided diplomatic relations', () => {
    const state = createInitialState();
    const other = firstForeignNationId(state);
    state.relations.push({ from: state.playerNationId, to: other, relation: 40, trust: 60, threat: 0, tradeDep: 0, treaty: 'trade', truceTurns: 0 });
    state.relations = state.relations.filter((r, index) => !(index > 0 && r.from === other && r.to === state.playerNationId));

    const repaired = sanitizeState(state);
    const forward = repaired.relations.filter((r) => r.from === state.playerNationId && r.to === other);
    const reverse = repaired.relations.filter((r) => r.from === other && r.to === state.playerNationId);

    expect(forward).toHaveLength(1);
    expect(reverse).toHaveLength(1);
    expect(forward[0].treaty).toBe(reverse[0].treaty);
  });

  it('removes invalid wars and cleans transient cache so readiness warnings disappear', () => {
    const state = createInitialState() as GameState & { _relMap?: Map<string, unknown> };
    state._relMap = new Map();
    state.wars.push({ id: 'bad-war', attackerId: state.playerNationId, defenderId: 'missing', targetProvinceId: 'missing-province', progress: 200, turns: -3, battleReports: [] });

    expect(buildReadinessReport(state).devChecks.map((item) => item.id)).toEqual(expect.arrayContaining(['invalid-war-refs', 'transient-relmap-present']));

    const repaired = sanitizeState(state);
    const report = buildReadinessReport(repaired);

    expect(repaired._relMap).toBeUndefined();
    expect(repaired.wars.some((w) => w.id === 'bad-war')).toBe(false);
    expect(report.devChecks.map((item) => item.id)).not.toContain('invalid-war-refs');
    expect(report.devChecks.map((item) => item.id)).not.toContain('transient-relmap-present');
  });

  it('moves orphan armies back to an owned province and trims noisy history', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.army.push({ id: 'orphan', ownerId: player.id, location: 'missing-province', size: 50, morale: 120, training: -10, equipment: 40, supply: 35 });
    state.history = Array.from({ length: 20 }, (_, i) => ({ ...state.lastReport!, turn: i }));

    const repaired = sanitizeState(state);
    const army = repaired.nations[state.playerNationId].army.find((a) => a.id === 'orphan');

    expect(army).toBeDefined();
    expect(repaired.provinces[army!.location]?.ownerId).toBe(state.playerNationId);
    expect(army!.morale).toBe(100);
    expect(army!.training).toBe(0);
    expect(repaired.history).toHaveLength(12);
  });
});
