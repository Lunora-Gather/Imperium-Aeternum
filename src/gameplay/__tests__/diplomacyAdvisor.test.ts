import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildDiplomacyAdvisorPlan } from '../diplomacyAdvisor';

describe('diplomacy advisor', () => {
  it('builds a diplomatic posture with metrics and candidates', () => {
    const state = createInitialState();
    const plan = buildDiplomacyAdvisorPlan(state);

    expect(plan.nationId).toBe(state.playerNationId);
    expect(plan.posture).toBeGreaterThanOrEqual(0);
    expect(plan.metrics.map((m) => m.id)).toEqual(['posture', 'influence', 'trade', 'alliance', 'war', 'threat']);
  });

  it('flags active war as a dangerous diplomatic priority', () => {
    const state = createInitialState();
    const target = Object.values(state.nations).find((n) => !n.isPlayer)!;
    state.relations.push({ from: state.playerNationId, to: target.id, relation: -100, trust: 0, threat: 90, tradeDep: 0, treaty: 'war', truceTurns: 0 });
    state.wars.push({ id: 'w', attackerId: state.playerNationId, defenderId: target.id, targetProvinceId: Object.values(state.provinces).find((p) => p.ownerId === target.id)!.id, progress: 50, turns: 1, battleReports: [] });

    const plan = buildDiplomacyAdvisorPlan(state);

    expect(plan.warCount).toBeGreaterThan(0);
    expect(plan.tone).toBe('danger');
    expect(plan.candidates.some((c) => c.action === 'prepare_defense')).toBe(true);
  });

  it('finds alliance and trade windows when influence is available', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.resources.influence = 100;
    const target = Object.values(state.nations).find((n) => !n.isPlayer)!;
    const rel = state.relations.find((r) => r.from === state.playerNationId && r.to === target.id)!;
    rel.treaty = 'none';
    rel.relation = 70;
    rel.trust = 70;
    rel.threat = 5;

    const plan = buildDiplomacyAdvisorPlan(state);

    expect(plan.candidates.some((c) => c.action === 'seek_alliance' || c.action === 'make_trade')).toBe(true);
  });

  it('handles missing nation safely', () => {
    const plan = buildDiplomacyAdvisorPlan(createInitialState(), 'missing');

    expect(plan.tone).toBe('danger');
    expect(plan.summary).toContain('无法读取');
  });
});
