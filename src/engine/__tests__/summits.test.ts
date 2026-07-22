import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { declareWar } from '../military';
import {
  calculateDiplomaticSummitResolution,
  hasActiveNonAggressionAccord,
  previewDiplomaticSummit,
  settleDiplomaticAccords,
} from '../summits';
import { conveneDiplomaticSummitAction } from '../../gameplay/actions/summitActions';

function bilateral(state: ReturnType<typeof createInitialState>, targetId: string, relation: number, trust: number, threat = 10) {
  for (const entry of state.relations) {
    if (
      (entry.from === state.playerNationId && entry.to === targetId)
      || (entry.from === targetId && entry.to === state.playerNationId)
    ) {
      entry.relation = relation;
      entry.trust = trust;
      entry.threat = threat;
      entry.treaty = 'none';
      entry.truceTurns = 0;
    }
  }
}

function eligibleState() {
  const state = createInitialState();
  state.turn = 10;
  const player = state.nations[state.playerNationId];
  const target = Object.values(state.nations).find((nation) => nation.id !== player.id && !nation.defeated)!;
  player.government.stability = 70;
  player.government.legitimacy = 70;
  target.government.stability = 70;
  player.resources.adminPt = 10;
  player.resources.influence = 200;
  player.resources.gold = 500;
  bilateral(state, target.id, 40, 70);
  return { state, player, target };
}

describe('元首会谈', () => {
  it('按现实先决条件阻止过早、交战中和国内失序的会谈', () => {
    const { state, player, target } = eligibleState();
    state.turn = 1;
    player.government.stability = 20;
    state.wars.push({ id: 'war_test', attackerId: player.id, defenderId: target.id, targetProvinceId: target.capital, progress: 0, turns: 0, battleReports: [] });

    const preview = previewDiplomaticSummit(state, player.id, target.id, 'normalization', 'pragmatic');

    expect(preview.eligible).toBe(false);
    expect(preview.reasons.join(' ')).toContain('第 4 年');
    expect(preview.reasons.join(' ')).toContain('正在交战');
    expect(preview.reasons.join(' ')).toContain('国内稳定');
  });

  it('预览不修改状态且同一局势的正式结果可复现', () => {
    const { state, player, target } = eligibleState();
    const before = structuredClone(state);

    const preview = previewDiplomaticSummit(state, player.id, target.id, 'trade', 'conciliatory');
    const first = calculateDiplomaticSummitResolution(state, player.id, target.id, 'trade', 'conciliatory');
    const second = calculateDiplomaticSummitResolution(state, player.id, target.id, 'trade', 'conciliatory');

    expect(preview.eligible).toBe(true);
    expect(first).toEqual(second);
    expect(state).toEqual(before);
  });

  it('通过事务操作记录会谈，并把突破转化为多年协议', () => {
    const { state, player, target } = eligibleState();
    bilateral(state, target.id, 65, 90, 0);
    target.tendency.commerce = 100;
    target.tendency.mercantilist = 100;
    const beforeGold = player.resources.gold;

    const result = conveneDiplomaticSummitAction(state, target.id, 'trade', 'conciliatory');

    expect(result.ok, result.messages.join('；')).toBe(true);
    expect(state.diplomaticSummits).toHaveLength(0);
    expect(result.state.diplomaticSummits).toHaveLength(1);
    expect(result.state.diplomaticSummits[0].outcome).toMatch(/agreement|breakthrough/);
    expect(result.state.diplomaticAccords[0]?.agenda).toBe('trade');
    expect(result.state.nations[player.id].resources.gold).toBeLessThan(beforeGold);
  });

  it('安全协议同时约束底层宣战入口', () => {
    const { state, player, target } = eligibleState();
    state.diplomaticAccords.push({
      id: 'accord_security',
      partyA: player.id,
      partyB: target.id,
      agenda: 'security',
      startedTurn: 8,
      expiresTurn: 16,
      strength: 1,
    });

    expect(hasActiveNonAggressionAccord(state, player.id, target.id)).toBe(true);
    expect(declareWar(state, player.id, target.id, target.capital)).toBeNull();
    expect(state.wars).toHaveLength(0);
  });

  it('协议逐年兑现，并在到期后退出活动集合', () => {
    const { state, player, target } = eligibleState();
    const playerScience = player.resources.sciPt;
    const targetScience = target.resources.sciPt;
    state.diplomaticAccords.push({
      id: 'accord_technology',
      partyA: player.id,
      partyB: target.id,
      agenda: 'technology',
      startedTurn: 8,
      expiresTurn: 10,
      strength: 2,
    });

    settleDiplomaticAccords(state);
    expect(player.resources.sciPt).toBe(playerScience + 8);
    expect(target.resources.sciPt).toBe(targetScience + 8);
    expect(state.diplomaticAccords).toHaveLength(1);

    state.turn = 11;
    settleDiplomaticAccords(state);
    expect(state.diplomaticAccords).toHaveLength(0);
  });

  it('同一议题协议生效期间不可重复谈判，双边会谈有八年冷却', () => {
    const { state, player, target } = eligibleState();
    state.diplomaticAccords.push({
      id: 'accord_trade',
      partyA: player.id,
      partyB: target.id,
      agenda: 'trade',
      startedTurn: 9,
      expiresTurn: 15,
      strength: 1,
    });
    state.diplomaticSummits.push({
      id: 'summit_recent',
      turn: 9,
      initiatorId: player.id,
      targetId: target.id,
      agenda: 'trade',
      stance: 'pragmatic',
      outcome: 'agreement',
      score: 70,
      summary: '测试',
      commitments: [],
    });

    const preview = previewDiplomaticSummit(state, player.id, target.id, 'trade', 'pragmatic');
    expect(preview.eligible).toBe(false);
    expect(preview.cooldownRemaining).toBe(7);
    expect(preview.reasons.join(' ')).toContain('已有生效');
  });
});
