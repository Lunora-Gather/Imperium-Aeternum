import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { planAITurn } from '../ai';

function neighborAiSetup() {
  const state = createInitialState();
  const ai = Object.values(state.nations).find((n) => !n.isPlayer && Object.values(state.provinces).some((p) => p.ownerId === n.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== n.id)))!;
  const owned = Object.values(state.provinces).find((p) => p.ownerId === ai.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== ai.id))!;
  const target = owned.adjacent.map((id) => state.provinces[id]).find((p) => p && p.ownerId !== ai.id)!;
  return { state, ai, owned, target };
}

describe('AI planner war assessment integration', () => {
  it('allows a strong aggressive AI to plan a war through the assessed merger', () => {
    const { state, ai, owned, target } = neighborAiSetup();
    ai.tendency.expansionist = 95;
    ai.tendency.militarism = 95;
    ai.tendency.commerce = 5;
    ai.resources.gold = 2200;
    ai.resources.food = 2200;
    ai.resources.supply = 280;
    ai.government.stability = 92;
    ai.government.legitimacy = 86;
    ai.warExhaustion = 0;
    ai.army = [{ id: 'ai-doom', ownerId: ai.id, location: owned.id, size: 14000, morale: 94, training: 92, equipment: 92, supply: 96 }];
    state.nations[target.ownerId].army = [{ id: 'weak', ownerId: target.ownerId, location: target.id, size: 250, morale: 25, training: 25, equipment: 20, supply: 30 }];
    target.garrison = 10;

    const actions = planAITurn(ai, state, () => 0.5);
    const war = actions.find((a) => a.actionId === 'declare_war');

    expect(war).toBeTruthy();
    expect(war?.targetProvinceId).toBeTruthy();
    expect(war?.weight).toBeGreaterThan(0);
  });

  it('suppresses old-style war candidates when the assessed risk is too high', () => {
    const { state, ai } = neighborAiSetup();
    ai.tendency.expansionist = 5;
    ai.tendency.militarism = 5;
    ai.tendency.commerce = 95;
    ai.resources.gold = -600;
    ai.resources.food = -200;
    ai.resources.supply = 0;
    ai.government.stability = 12;
    ai.government.legitimacy = 20;
    ai.warExhaustion = 95;
    ai.army = [{ id: 'broken-ai', ownerId: ai.id, location: ai.capital, size: 80, morale: 10, training: 10, equipment: 10, supply: 5 }];

    const actions = planAITurn(ai, state, () => 0.5);

    expect(actions.some((a) => a.actionId === 'declare_war')).toBe(false);
    expect(actions.some((a) => a.actionId === 'tax_up' || a.actionId === 'build_farm' || a.actionId === 'appease')).toBe(true);
  });
});
