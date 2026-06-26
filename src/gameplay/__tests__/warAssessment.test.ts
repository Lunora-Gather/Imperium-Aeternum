import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { assessWar } from '../warAssessment';

function firstEnemyProvince(state = createInitialState()) {
  const target = Object.values(state.provinces).find((p) => p.ownerId !== state.playerNationId)!;
  return { state, target, defender: state.nations[target.ownerId] };
}

describe('war assessment', () => {
  it('produces a full assessment with readable factors', () => {
    const { state, target } = firstEnemyProvince();
    const result = assessWar(state, state.playerNationId, target.ownerId, target.id);

    expect(result.attackerId).toBe(state.playerNationId);
    expect(result.defenderId).toBe(target.ownerId);
    expect(result.targetProvinceId).toBe(target.id);
    expect(result.factors.map((f) => f.id)).toEqual(['power', 'logistics', 'fiscal', 'stability', 'diplomacy']);
    expect(result.readiness).toBeGreaterThanOrEqual(0);
    expect(result.winChance).toBeGreaterThanOrEqual(0);
    expect(['attack_now', 'prepare', 'avoid']).toContain(result.recommendation);
  });

  it('recommends attack when the attacker has overwhelming force and safe logistics', () => {
    const { state, target } = firstEnemyProvince();
    const player = state.nations[state.playerNationId];
    const attackerProvince = Object.values(state.provinces).find((p) => p.ownerId === state.playerNationId)!;
    target.adjacent.push(attackerProvince.id);
    player.resources.gold = 1200;
    player.resources.food = 1600;
    player.resources.supply = 220;
    player.government.stability = 82;
    player.government.legitimacy = 80;
    player.warExhaustion = 3;
    player.army = [{ id: 'doomstack', ownerId: player.id, location: attackerProvince.id, size: 9000, morale: 90, training: 88, equipment: 86, supply: 92 }];
    state.nations[target.ownerId].army = [{ id: 'weak', ownerId: target.ownerId, location: target.id, size: 900, morale: 35, training: 35, equipment: 30, supply: 40 }];
    target.garrison = 120;

    const result = assessWar(state, player.id, target.ownerId, target.id);

    expect(result.recommendation).toBe('attack_now');
    expect(result.winChance).toBeGreaterThanOrEqual(70);
    expect(result.logisticsPressure).toBeLessThan(45);
  });

  it('recommends avoiding war when treasury, supply and stability collapse', () => {
    const { state, target } = firstEnemyProvince();
    const player = state.nations[state.playerNationId];
    player.resources.gold = -500;
    player.resources.food = -200;
    player.resources.supply = 5;
    player.government.stability = 18;
    player.government.legitimacy = 25;
    player.warExhaustion = 82;
    player.army = [{ id: 'broken', ownerId: player.id, location: player.capital, size: 300, morale: 20, training: 20, equipment: 15, supply: 10 }];

    const result = assessWar(state, player.id, target.ownerId, target.id);

    expect(result.recommendation).toBe('avoid');
    expect(result.fiscalPressure).toBeGreaterThan(60);
    expect(result.exhaustionRisk).toBeGreaterThan(80);
  });

  it('penalizes distant targets without border access', () => {
    const { state, target } = firstEnemyProvince();
    const player = state.nations[state.playerNationId];
    target.adjacent = target.adjacent.filter((id) => state.provinces[id]?.ownerId !== player.id);

    const distant = assessWar(state, player.id, target.ownerId, target.id);
    const attackerProvince = Object.values(state.provinces).find((p) => p.ownerId === player.id)!;
    target.adjacent.push(attackerProvince.id);
    const bordering = assessWar(state, player.id, target.ownerId, target.id);

    expect(distant.logisticsPressure).toBeGreaterThan(bordering.logisticsPressure);
  });
});
