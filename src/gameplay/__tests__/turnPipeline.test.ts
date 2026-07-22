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
