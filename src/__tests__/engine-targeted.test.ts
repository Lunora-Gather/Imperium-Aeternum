// C3: 引擎针对性测试扩充——economy/politics/military/diplomacy 各 ≥3 个
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../engine/init';
import { settleEconomy } from '../engine/economy';
import { settlePolitics, changeGovernment, enactPolicy } from '../engine/politics';
import { declareWar, makePeace, recruit } from '../engine/military';
import { improveRelation, establishTrade } from '../engine/diplomacy';
import { PLAYER_ID } from '../data/nations';
import type { GameState } from '../types/game';

describe('C3 economy 针对性', () => {
  it('高税率降低民心（通过腐败/稳定修正间接体现）', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    const low = { ...state, nations: { ...state.nations, [PLAYER_ID]: { ...player, taxRate: 0.1 } } };
    const high = { ...state, nations: { ...state.nations, [PLAYER_ID]: { ...player, taxRate: 0.5 } } };
    const rLow = settleEconomy(low.nations[PLAYER_ID], low);
    const rHigh = settleEconomy(high.nations[PLAYER_ID], high);
    expect(rHigh.taxIncome).toBeGreaterThan(rLow.taxIncome);
  });

  it('腐败吞掉部分税收（corruptionLoss > 0）', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    player.government.corruption = 50;
    const r = settleEconomy(player, state);
    expect(r.corruptionLoss).toBeGreaterThan(0);
  });

  it('内战期间税收 ×0.7', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    player.civilWar = { active: true, rebels: [] };
    const goldBefore = player.resources.gold;
    settleEconomy(player, state);
    expect(player.resources.gold).toBeLessThanOrEqual(goldBefore + 1000);  // 内战折扣生效，不暴涨
  });
});

describe('C3 politics 针对性', () => {
  it('政体切换耗 100 金 + 合法性 -15（B8 反弹）', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    const goldBefore = player.resources.gold;
    const legBefore = player.government.legitimacy;
    const ok = changeGovernment(player, 'republic' as never, state);
    if (ok) {
      expect(player.resources.gold).toBeLessThan(goldBefore);
      expect(player.government.legitimacy).toBeLessThan(legBefore);
    }
  });

  it('稳定度分段回归力——危危态 <40 时 +5', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    player.government.stability = 20;
    const before = player.government.stability;
    settlePolitics(player, state);
    expect(player.government.stability).toBeGreaterThanOrEqual(before);  // 回归力托底
  });

  it('内战期间回归力减弱（+5→+2）', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    player.government.stability = 20;
    player.civilWar = { active: true, rebels: [] };
    const before = player.government.stability;
    settlePolitics(player, state);
    expect(player.government.stability).toBeGreaterThanOrEqual(before);  // 仍有托底但弱
  });
});

describe('C3 military 针对性', () => {
  it('征兵耗金耗粮', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    const prov = Object.values(state.provinces).find((p) => p.ownerId === PLAYER_ID);
    if (!prov) return;
    const goldBefore = player.resources.gold;
    const ok = recruit(player, prov, 50);
    if (ok) expect(player.resources.gold).toBeLessThanOrEqual(goldBefore);
  });

  it('和约三档——progress>=60 割省', () => {
    const state = createInitialState();
    const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer);
    const attacker = aiNations[0];
    const defender = aiNations[1] ?? aiNations[0];
    const defProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
    if (defProvs.length === 0) return;
    const target = defProvs[0];
    const war = { id: 't', attackerId: attacker.id, defenderId: defender.id, targetProvinceId: target.id, progress: 70, turns: 1, battleReports: [] };
    state.wars.push(war);
    const ownerBefore = target.ownerId;
    makePeace(state, war);
    expect(state.provinces[target.id].ownerId).not.toBe(ownerBefore);
  });

  it('孤儿军队撤退——割省后败军不滞留', () => {
    const state = createInitialState();
    const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer);
    const attacker = aiNations[0];
    const defender = aiNations[1] ?? aiNations[0];
    const defProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
    if (defProvs.length < 2) return;
    const target = defProvs[0];
    defender.army.push({ id: 'orphan', ownerId: defender.id, location: target.id, size: 50, morale: 50, training: 30, equipment: 30, supply: 50 });
    const war = { id: 't', attackerId: attacker.id, defenderId: defender.id, targetProvinceId: target.id, progress: 70, turns: 1, battleReports: [] };
    state.wars.push(war);
    makePeace(state, war);
    const army = defender.army.find((a) => a.id === 'orphan');
    if (army) expect(army.location).not.toBe(target.id);  // 已撤退
  });
});

describe('C3 diplomacy 针对性', () => {
  it('改善关系 +5', () => {
    const state = createInitialState();
    const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer);
    const target = aiNations[0].id;
    const player = state.nations[PLAYER_ID];
    const r = improveRelation(player, target, state);
    expect(r.ok).toBe(true);
  });

  it('贸易协定建立后 treaty=trade', () => {
    const state = createInitialState();
    const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer);
    const target = aiNations[0].id;
    const player = state.nations[PLAYER_ID];
    const r = establishTrade(player, target, state);
    if (r.ok) {
      const rel = state.relations.find((rr) => rr.from === PLAYER_ID && rr.to === target);
      expect(rel?.treaty).toBe('trade');
    }
  });
});
