import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildAiWarActionPlan } from '../aiWarActionAdapter';

function aggressiveSetup() {
  const state = createInitialState();
  const ai = Object.values(state.nations).find((n) => !n.isPlayer && Object.values(state.provinces).some((p) => p.ownerId === n.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== n.id)))!;
  const owned = Object.values(state.provinces).find((p) => p.ownerId === ai.id && p.adjacent.some((id) => state.provinces[id]?.ownerId !== ai.id))!;
  const target = owned.adjacent.map((id) => state.provinces[id]).find((p) => p && p.ownerId !== ai.id)!;
  ai.tendency.expansionist = 95;
  ai.tendency.militarism = 95;
  ai.tendency.commerce = 10;
  ai.resources.gold = 2000;
  ai.resources.food = 2000;
  ai.resources.supply = 260;
  ai.government.stability = 90;
  ai.government.legitimacy = 85;
  ai.warExhaustion = 0;
  ai.army = [{ id: 'ai-doom', ownerId: ai.id, location: owned.id, size: 13000, morale: 92, training: 90, equipment: 90, supply: 95 }];
  state.nations[target.ownerId].army = [{ id: 'weak', ownerId: target.ownerId, location: target.id, size: 300, morale: 30, training: 30, equipment: 25, supply: 35 }];
  target.garrison = 20;
  return { state, ai };
}

describe('AI war action adapter', () => {
  it('converts a declare decision into an engine-compatible action', () => {
    const { state, ai } = aggressiveSetup();
    const plan = buildAiWarActionPlan(state, ai.id);

    expect(plan.action).toMatchObject({ actionId: 'declare_war', reason: 'weak_neighbor' });
    expect(plan.action?.target).toBeTruthy();
    expect(plan.action?.targetProvinceId).toBeTruthy();
    expect(plan.action?.weight).toBeGreaterThan(0);
    expect(plan.reasons.join(' ')).toContain('开战阈值');
  });

  it('returns null action when decision is not a declaration', () => {
    const state = createInitialState();
    const ai = Object.values(state.nations).find((n) => !n.isPlayer)!;
    ai.resources.gold = -1000;
    ai.resources.supply = 0;
    ai.government.stability = 10;
    ai.warExhaustion = 90;

    const plan = buildAiWarActionPlan(state, ai.id);

    expect(plan.action).toBeNull();
    expect(plan.confidence).toBeGreaterThanOrEqual(0);
    expect(plan.reasons.length).toBeGreaterThan(0);
  });
});
