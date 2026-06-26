import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildWarOpportunityAdvice } from '../warOpportunityAdvisor';

function setup() {
  const state = createInitialState();
  const player = state.nations[state.playerNationId];
  const owned = Object.values(state.provinces).find((p) => p.ownerId === player.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== player.id))!;
  const target = owned.adjacent.map((id) => state.provinces[id]).find((p) => p && p.ownerId !== player.id)!;
  return { state, player, owned, target };
}

describe('war opportunity advisor', () => {
  it('finds and ranks legal neighboring war candidates', () => {
    const { state } = setup();
    const advice = buildWarOpportunityAdvice(state);

    expect(advice.candidates.length).toBeGreaterThan(0);
    expect(advice.best).toBeTruthy();
    expect(advice.best?.assessment.winChance).toBeGreaterThanOrEqual(0);
    expect(advice.best?.preview.lines.length).toBeGreaterThan(0);
  });

  it('recommends a strong target when player has overwhelming military conditions', () => {
    const { state, player, owned, target } = setup();
    player.resources.gold = 2000;
    player.resources.food = 2000;
    player.resources.supply = 260;
    player.government.stability = 90;
    player.government.legitimacy = 84;
    player.warExhaustion = 0;
    player.army = [{ id: 'player-doom', ownerId: player.id, location: owned.id, size: 14000, morale: 95, training: 92, equipment: 92, supply: 96 }];
    state.nations[target.ownerId].army = [{ id: 'weak', ownerId: target.ownerId, location: target.id, size: 250, morale: 25, training: 25, equipment: 20, supply: 30 }];
    target.garrison = 10;

    const advice = buildWarOpportunityAdvice(state);

    expect(advice.tone).toBe('good');
    expect(advice.title).toContain('可攻');
    expect(advice.best?.assessment.recommendation).toBe('attack_now');
  });

  it('marks expansion as blocked when the nation is already at war', () => {
    const { state, player, target } = setup();
    state.wars.push({ id: 'w', attackerId: player.id, defenderId: target.ownerId, targetProvinceId: target.id, progress: 40, turns: 1, battleReports: [] });
    player.atWar = true;

    const advice = buildWarOpportunityAdvice(state);

    expect(advice.blockers.join(' ')).toContain('已有战争');
    expect(advice.tone).not.toBe('good');
  });

  it('handles missing nations safely', () => {
    const advice = buildWarOpportunityAdvice(createInitialState(), 'missing');

    expect(advice.tone).toBe('danger');
    expect(advice.candidates).toEqual([]);
    expect(advice.summary).toContain('无法找到');
  });
});
