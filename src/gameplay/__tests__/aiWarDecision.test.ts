import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { decideAiWar } from '../aiWarDecision';

function firstAiWithNeighbor() {
  const state = createInitialState();
  const ai = Object.values(state.nations).find((n) => !n.isPlayer && Object.values(state.provinces).some((p) => p.ownerId === n.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== n.id)))!;
  const owned = Object.values(state.provinces).find((p) => p.ownerId === ai.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== ai.id))!;
  const target = owned.adjacent.map((id) => state.provinces[id]).find((p) => p && p.ownerId !== ai.id)!;
  return { state, ai, owned, target };
}

describe('AI war decision', () => {
  it('returns a safe avoid decision for missing nations', () => {
    const result = decideAiWar(createInitialState(), 'missing');

    expect(result.type).toBe('avoid');
    expect(result.reasons[0]).toContain('找不到');
  });

  it('avoids starting another war when already at war', () => {
    const { state, ai, target } = firstAiWithNeighbor();
    state.wars.push({ id: 'w', attackerId: ai.id, defenderId: target.ownerId, targetProvinceId: target.id, progress: 50, turns: 1, battleReports: [] });

    const result = decideAiWar(state, ai.id);

    expect(result.type).toBe('avoid');
    expect(result.label).toBe('已有战争');
  });

  it('declares war when an aggressive AI has overwhelming advantage', () => {
    const { state, ai, owned, target } = firstAiWithNeighbor();
    ai.tendency.expansionist = 95;
    ai.tendency.militarism = 95;
    ai.tendency.commerce = 20;
    ai.resources.gold = 1800;
    ai.resources.food = 1800;
    ai.resources.supply = 240;
    ai.government.stability = 88;
    ai.government.legitimacy = 82;
    ai.warExhaustion = 2;
    ai.army = [{ id: 'ai-doom', ownerId: ai.id, location: owned.id, size: 12000, morale: 92, training: 90, equipment: 90, supply: 95 }];
    state.nations[target.ownerId].army = [{ id: 'weak', ownerId: target.ownerId, location: target.id, size: 400, morale: 30, training: 30, equipment: 25, supply: 35 }];
    target.garrison = 50;

    const result = decideAiWar(state, ai.id);

    expect(result.type).toBe('declare');
    expect(result.candidate?.targetProvinceId).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(66);
    expect(result.reasons.join(' ')).toContain('开战阈值');
  });

  it('prepares instead of declaring when the target is close but not decisive', () => {
    const { state, ai, owned, target } = firstAiWithNeighbor();
    ai.tendency.expansionist = 70;
    ai.tendency.militarism = 65;
    ai.resources.gold = 500;
    ai.resources.food = 700;
    ai.resources.supply = 90;
    ai.government.stability = 62;
    ai.warExhaustion = 20;
    ai.army = [{ id: 'ai-mid', ownerId: ai.id, location: owned.id, size: 2500, morale: 65, training: 60, equipment: 60, supply: 60 }];
    state.nations[target.ownerId].army = [{ id: 'def-mid', ownerId: target.ownerId, location: target.id, size: 1500, morale: 55, training: 55, equipment: 55, supply: 55 }];

    const result = decideAiWar(state, ai.id);

    expect(['prepare', 'declare', 'avoid']).toContain(result.type);
    expect(result.candidate).toBeTruthy();
    expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
  });

  it('avoids war when the best target is too risky', () => {
    const { state, ai } = firstAiWithNeighbor();
    ai.tendency.expansionist = 10;
    ai.tendency.militarism = 10;
    ai.tendency.commerce = 90;
    ai.resources.gold = -500;
    ai.resources.food = -100;
    ai.resources.supply = 5;
    ai.government.stability = 18;
    ai.warExhaustion = 85;
    ai.army = [{ id: 'broken-ai', ownerId: ai.id, location: ai.capital, size: 100, morale: 15, training: 15, equipment: 15, supply: 10 }];

    const result = decideAiWar(state, ai.id);

    expect(result.type).toBe('avoid');
    expect(result.label).toBe('避免开战');
  });
});
