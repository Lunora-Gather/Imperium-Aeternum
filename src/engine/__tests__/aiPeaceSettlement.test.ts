import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { executeAIAction } from '../ai';

describe('AI peace settlement', () => {
  it('uses the shared war settlement pipeline so target province concessions are applied', () => {
    const state = createInitialState();
    const attacker = state.nations.n01;
    const defender = state.nations.n02;
    const target = state.provinces.p05;

    expect(attacker).toBeTruthy();
    expect(defender).toBeTruthy();
    expect(target.ownerId).toBe('n02');

    attacker.atWar = true;
    defender.atWar = true;
    state.wars = [{
      id: 'war_ai_peace_test',
      attackerId: attacker.id,
      defenderId: defender.id,
      targetProvinceId: target.id,
      progress: 75,
      turns: 3,
      battleReports: [],
    }];

    const attackerGoldBefore = attacker.resources.gold;
    const defenderGoldBefore = defender.resources.gold;

    executeAIAction(attacker, { actionId: 'make_peace', weight: 1 }, state);

    expect(state.wars).toHaveLength(0);
    expect(target.ownerId).toBe(attacker.id);
    expect(target.loyalty).toBe(30);
    expect(target.assimilation).toBe(20);
    expect(attacker.resources.gold).toBeGreaterThan(attackerGoldBefore);
    expect(defender.resources.gold).toBeLessThan(defenderGoldBefore);
    expect(attacker.atWar).toBe(false);
    expect(defender.atWar).toBe(false);
  });
});
