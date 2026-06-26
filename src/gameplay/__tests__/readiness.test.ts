import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { syncAmbitionMeta } from '../ambitions';
import { buildReadinessReport } from '../readiness';
import type { GameState } from '../../types/game';

function player(state: GameState) {
  return state.nations[state.playerNationId];
}

describe('turn readiness diagnostics', () => {
  it('reports a healthy synced opening state as advanceable', () => {
    const state = syncAmbitionMeta(createInitialState());
    const report = buildReadinessReport(state);

    expect(report.canAdvance).toBe(true);
    expect(report.blockers).toHaveLength(0);
    expect(report.score).toBeGreaterThanOrEqual(75);
    expect(report.devChecks.some((item) => item.id === 'ambition-meta-missing')).toBe(false);
  });

  it('surfaces player-facing blockers before advancing a dangerous turn', () => {
    const state = syncAmbitionMeta(createInitialState());
    player(state).resources.gold = -20;
    player(state).government.stability = 18;
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'test_event' });

    const report = buildReadinessReport(state);

    expect(report.canAdvance).toBe(false);
    expect(report.tone).toBe('danger');
    expect(report.blockers.map((item) => item.id)).toEqual(expect.arrayContaining(['pending-events', 'gold-negative', 'stability-critical']));
  });

  it('catches developer-facing state consistency problems', () => {
    const state = syncAmbitionMeta(createInitialState());
    state.wars.push({ id: 'w_invalid', attackerId: state.playerNationId, defenderId: 'missing_nation', targetProvinceId: 'missing_province', progress: 0, turns: 0, battleReports: [] });
    state.relations.push({ from: state.playerNationId, to: 'n02', relation: 10, trust: 50, threat: 0, tradeDep: 0, treaty: 'trade', truceTurns: 0 });

    const report = buildReadinessReport(state);

    expect(report.devChecks.map((item) => item.id)).toEqual(expect.arrayContaining(['invalid-war-refs', 'duplicate-relations']));
    expect(report.tone).toBe('danger');
  });

  it('warns when ambition metadata is missing or stale', () => {
    const state = createInitialState() as GameState & { ambitionMeta?: { playerNationId: string; worldProvinces: number } };
    const missing = buildReadinessReport(state);
    expect(missing.devChecks.map((item) => item.id)).toContain('ambition-meta-missing');

    state.ambitionMeta = { playerNationId: 'other', worldProvinces: 1 };
    const stale = buildReadinessReport(state);
    expect(stale.devChecks.map((item) => item.id)).toContain('ambition-meta-stale');
  });
});
