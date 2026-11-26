import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildReadinessReport } from '../readiness';
import { advanceTurnPipeline, prepareGameState } from '../turnPipeline';

function snapshot(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

describe('explicit turn pipeline', () => {
  it('prepares a classic game without consuming neutral provinces', () => {
    const state = createInitialState();
    const neutral = Object.values(state.provinces).filter((province) => province.ownerId === 'barbarian').length;

    const prepared = prepareGameState(state);

    expect(prepared.ambitionMeta?.playerNationId).toBe(prepared.playerNationId);
    expect(Object.values(prepared.provinces).filter((province) => province.ownerId === 'barbarian')).toHaveLength(neutral);
    expect(buildReadinessReport(prepared).devChecks.map((item) => item.id)).not.toContain('invalid-province-owner');
  });

  it('advances the complete gameplay chain without mutating its input', () => {
    const state = prepareGameState(createInitialState());
    const before = snapshot({ ...state, _relMap: undefined });

    const result = advanceTurnPipeline(state);

    expect(snapshot({ ...state, _relMap: undefined })).toEqual(before);
    expect(result.state.turn).toBe(state.turn + 1);
    expect(result.report.turn).toBe(result.state.turn);
    expect(result.state.lastReport).toEqual(result.report);
    expect(result.state.aiStrategyMeta).toBeDefined();
    expect(result.state.aiMemory).toBeDefined();
    expect(result.notes).toContain('均衡国策：行政点 +1');
    expect(buildReadinessReport(result.state).devChecks.map((item) => item.id)).not.toContain('invalid-province-owner');
  });
});

it.each(['stability', 'prosperity', 'military'] as const)('reports the final year-end changes for %s focus', (focus) => {
  const state = prepareGameState(createInitialState());
  state.strategyFocus = focus;
  const before = state.nations[state.playerNationId];
  before.warExhaustion = 70;
  for (const p of Object.values(state.provinces)) if (p.ownerId === before.id) p.unrest = 30;
  const result = advanceTurnPipeline(state);
  const unrest = Object.values(result.state.provinces).reduce((sum, p) => sum +
    (p.ownerId === before.id && state.provinces[p.id].ownerId === before.id ? Math.round(p.unrest - state.provinces[p.id].unrest) : 0), 0);
  expect(result.report.unrestDelta).toBe(unrest);
  const after = result.state.nations[state.playerNationId];
  expect(result.report).toHaveProperty('goldDelta', Math.round(after.resources.gold - before.resources.gold));
  expect(result.report.warnings.includes('⚠ 厌战高涨')).toBe(after.warExhaustion > 70);
  expect(result.report.exhaustSnapshot).toBe(Math.round(after.warExhaustion));
  expect(result.report.foodDelta).toBe(Math.round(after.resources.food - before.resources.food));
  expect(result.report.stabilityDelta).toBe(Math.round(after.government.stability - before.government.stability));
  expect(result.report.legitimacyDelta).toBe(Math.round(after.government.legitimacy - before.government.legitimacy));
  expect(result.state.history[result.state.history.length - 1]).toEqual(result.report);
  expect(result.state.lastReport).toEqual(result.report);
});

it('records a treasury milestone when national focus takes the closing balance across the threshold', () => {
  const state = prepareGameState(createInitialState());
  const player = state.nations[state.playerNationId];
  state.strategyFocus = 'balance';
  const operatingYear = advanceTurnPipeline(state);
  const income = operatingYear.state.nations[player.id].resources.gold - player.resources.gold;
  player.resources.gold = 995 - income;
  state.strategyFocus = 'prosperity';
  const year = advanceTurnPipeline(state);
  expect(player.resources.gold).toBeLessThan(1000);
  expect(year.state.nations[player.id].resources.gold).toBeGreaterThanOrEqual(1000);
  expect(year.state.chronicle.filter(c => c.title === '国库充盈')).toHaveLength(1);
});
