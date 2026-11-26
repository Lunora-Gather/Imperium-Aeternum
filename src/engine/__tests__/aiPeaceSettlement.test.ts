import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { declareWar, makePeace, settleWars, settleWarsPure, applySettleWarsResult } from '../military';
import { establishTrade, formAlliance, breakTreaty } from '../diplomacy';
import { decideAiWar } from '../../gameplay/aiWarDecision';
import { buildWarOpportunityAdvice } from '../../gameplay/warOpportunityAdvisor';
import { processTurn } from '../turn';
import { invariantErrors } from '../../gameplay/stateInvariants';
import { declareWarAction, makePeaceAction } from '../../gameplay/actions/militaryActions';
import { processAITurnLite, executeAIAction } from '../ai';

describe('AI peace settlement', () => {
  it('uses the shared war settlement pipeline so target province concessions are applied', () => {
    const state = createInitialState();
    const attacker = state.nations.n01;
    const defender = state.nations.n02;
    const target = state.provinces.p08;

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

function borderWar() {
  const state = createInitialState();
  const attacker = state.nations.n01, defender = state.nations.n02;
  const front = state.provinces[attacker.capital];
  const target = state.provinces[defender.capital];
  front.adjacent = [...new Set([...front.adjacent, target.id])];
  target.adjacent = [...new Set([...target.adjacent, front.id])];
  return { state, attacker, defender, front, target };
}

it.each(['alliance', 'truce'] as const)('rejects a stale AI declaration under %s without moving any troops', (treaty) => {
  const { state, attacker, defender, target } = borderWar();
  for (const r of state.relations.filter((r) => [r.from, r.to].includes(attacker.id) && [r.from, r.to].includes(defender.id))) {
    Object.assign(r, { treaty, truceTurns: treaty === 'truce' ? 5 : 0 });
  }
  const before = JSON.stringify(state);
  executeAIAction(attacker, { actionId: 'declare_war', weight: 1, target: defender.id, targetProvinceId: target.id }, state);
  expect(JSON.stringify(state)).toBe(before);
});

it('does not redirect an explicit AI declaration after the target changes hands', () => {
  const { state, attacker, defender, target } = borderWar();
  target.ownerId = 'n03';
  executeAIAction(attacker, { actionId: 'declare_war', weight: 1, target: defender.id, targetProvinceId: target.id }, state);
  expect(state.wars).toHaveLength(0);
});

it.each(['full', 'lite'])('signs AI trade bilaterally and charges only for a new agreement (%s)', (mode) => {
  const { state, attacker, defender } = borderWar();
  state.turn = 2;
  const pair = state.relations.filter((r) => [r.from, r.to].includes(attacker.id) && [r.from, r.to].includes(defender.id));
  state.relations = pair;
  for (const r of pair) r.relation = 10;
  const sign = () => mode === 'lite' ? processAITurnLite(attacker, state, () => 0) :
    executeAIAction(attacker, { actionId: 'establish_trade', weight: 1, target: defender.id }, state);
  const before = attacker.resources.influence;
  sign();
  expect(pair.map((r) => r.treaty)).toEqual(['trade', 'trade']);
  sign();
  expect(attacker.resources.influence).toBe(before - (mode === 'lite' ? 5 : 10));
});

it('queues AI research without granting a level before the project is funded', () => {
  const { state, attacker } = borderWar();
  attacker.tech = { agri: 1, mil: 2, admin: 2, culture: 2, researchProgress: null };
  attacker.resources.sciPt = 0;
  executeAIAction(attacker, { actionId: 'research', weight: 1 }, state);
  expect(attacker.tech.agri).toBe(1);
  expect(attacker.tech.researchProgress).toEqual({ techId: 'agri_lv2', sciPtInvested: 0 });
});

it('executes player declarations and negotiated capital transfers with a warm relation cache', () => {
  const { state, attacker, defender, target } = borderWar();
  attacker.resources.influence = 50;
  const declared = declareWarAction(state, defender.id, target.id);
  expect(declared.messages).toEqual([expect.stringContaining('宣战')]);
  expect(declared.ok).toBe(true);
  const next = structuredClone(declared.state);
  next.wars[0].progress = 75;
  const peace = makePeaceAction(next, next.wars[0].id);
  expect(peace.ok, peace.messages.join(' ')).toBe(true);
  expect(peace.state.provinces[target.id].ownerId).toBe(attacker.id);
  expect(peace.state.nations[defender.id].capital).not.toBe(target.id);
  expect(invariantErrors(peace.state)).toEqual([]);
});

it('treats an uncontested capture as a win and includes its final battle in the annual report', () => {
  const { state, attacker, defender, target } = borderWar();
  target.garrison = 0;
  defender.army = [];
  const war = declareWar(state, attacker.id, defender.id, target.id)!;
  const result = processTurn(state, { humanNationIds: Object.keys(state.nations), sharedWorld: true });
  expect(result.state.provinces[target.id].ownerId).toBe(attacker.id);
  expect(result.state.chronicle.some((c) => c.id === `peace_lose_${war.id}_1`)).toBe(false);
  expect(result.report.warProgress).toEqual([expect.objectContaining({ target: target.name, outcome: 'advance' })]);
});

it('applies earlier casualties and exhaustion when one army fights twice in a year', () => {
  const { state, attacker, defender, front, target } = borderWar();
  const other = state.nations.n03, otherTarget = state.provinces[other.capital];
  otherTarget.adjacent = [front.id];
  for (const d of [defender, other]) d.army[0].size = 300;
  attacker.army[0].size = 1000;
  const w1 = declareWar(state, attacker.id, defender.id, target.id)!;
  const w2 = declareWar(state, attacker.id, other.id, otherTarget.id)!;
  w1.progress = w2.progress = 45;
  const startingExhaustion = attacker.warExhaustion;
  const startingStability = attacker.government.stability;
  const res = settleWarsPure(state);
  const a = res.warUpdates[w1.id].battleReports[0], b = res.warUpdates[w2.id].battleReports[0];
  expect(b.attSize).toBeLessThanOrEqual(a.attSize - a.attLoss);
  expect(b.attSize).toBeLessThan(a.attSize);
  applySettleWarsResult(state, res);
  expect(attacker.army[0].size).toBeLessThan(b.attSize);
  expect(attacker.warExhaustion).toBe(startingExhaustion + 4);
  expect(attacker.government.stability).toBe(startingStability - 2);
});

it('closes competing claims on ceded territory without charging a second tribute', () => {
  const { state, attacker, defender, target } = borderWar();
  const other = state.nations.n03;
  const paid = other.resources.gold;
  const first = declareWar(state, attacker.id, defender.id, target.id)!;
  declareWar(state, other.id, defender.id, target.id)!.progress = 80;
  first.progress = 75;
  makePeace(state, first);
  expect(state.wars).toHaveLength(0);
  settleWars(state);
  expect(target.ownerId).toBe(attacker.id);
  expect(other.resources.gold).toBe(paid);
  expect(invariantErrors(state)).toEqual([]);
});

it.each([false, true])('preserves local and shared-world capital-loss rules when the defender accepts peace (%s)', (shared) => {
  const { state, attacker, defender, target } = borderWar();
  state.playerNationId = defender.id;
  defender.isPlayer = true; attacker.isPlayer = false;
  defender.resources.influence = 50;
  const war = declareWar(state, attacker.id, defender.id, target.id)!;
  war.progress = 75;
  const result = makePeaceAction(state, war.id, shared);
  expect(result.ok, result.messages.join(' ')).toBe(true);
  expect(result.state.victory.type).toBe(shared ? null : 'fail_capital_lost');
  expect(invariantErrors(result.state)).toEqual([]);
});

it('reports a neighboring realm falling on the very turn its last border disappears', () => {
  const { state, attacker, defender, target } = borderWar();
  for (const province of Object.values(state.provinces)) {
    if (province.ownerId === defender.id && province !== target) province.ownerId = 'barbarian';
  }
  target.garrison = 0;
  defender.army = [];
  expect(declareWar(state, attacker.id, defender.id, target.id)).toBeTruthy();
  const result = processTurn(state, { humanNationIds: Object.keys(state.nations), sharedWorld: true });
  expect(result.state.nations[defender.id].defeated).toBe(true);
  const winner = result.state.sharedChronicles![attacker.id];
  expect(winner.some(c => c.title === `灭 ${defender.name}`)).toBe(true);
  expect(winner.some(c => c.title === '首战告捷')).toBe(true);
  expect(result.state.sharedChronicles![defender.id].some(c => c.title === '首战告捷')).toBe(false);
  expect(result.report.worldEvents).toContain(`☠ ${defender.name} 灭亡`);
  expect(result.state.history[result.state.history.length - 1].worldEvents).toEqual(result.report.worldEvents);
});

it('reports the closing battle from the defending player’s perspective after a full battle log', () => {
  const { state, attacker, defender, target } = borderWar();
  state.playerNationId = defender.id;
  attacker.isPlayer = false; defender.isPlayer = true;
  target.garrison = 0; defender.army = [];
  const war = declareWar(state, attacker.id, defender.id, target.id)!;
  war.battleReports = Array.from({ length: 20 }, (_, i) => ({ turn: i, attSize: 200, defSize: 150, attLoss: 4, defLoss: 5, progressDelta: 1, outcome: 'stalemate', narrative: '' }));
  const result = processTurn(state);
  expect(result.state.victory.type).toBe('fail_capital_lost');
  expect(result.report.warProgress).toEqual([expect.objectContaining({ outcome: 'repelled', progressDelta: -30 })]);
});

it('credits the defending ruler with enemy losses when the final battle closes a full log', () => {
  const { state, attacker, defender, target } = borderWar();
  state.playerNationId = defender.id;
  attacker.isPlayer = false;
  defender.isPlayer = true;
  attacker.army[0].size = 100;
  defender.army[0].size = 5000;
  const war = declareWar(state, attacker.id, defender.id, target.id)!;
  war.progress = 0;
  war.battleReports = Array.from({ length: 20 }, (_, turn) => ({ turn, attSize: 100, defSize: 5000, attLoss: 0, defLoss: 0,
    progressDelta: 0, outcome: 'stalemate', narrative: '' }));
  const battle = settleWarsPure(state).warUpdates[war.id].battleReports[19];
  expect(battle.outcome).toBe('repelled');
  expect(battle.attLoss).not.toBe(battle.defLoss);
  const next = processTurn(state).state;
  expect(next.wars.some(w => w.id === war.id)).toBe(false);
  expect(next.chronicle.find(c => c.title === '首战告捷')?.desc).toContain(`斩敌 ${battle.attLoss}。`);
});

it('excludes a protected neighbor from the decision, advice and execution', () => {
  const { state, attacker, defender, front, target } = borderWar();
  for (const province of Object.values(state.provinces).filter((p) => p.ownerId === attacker.id)) {
    province.adjacent = province.id === front.id ? [target.id] : [];
  }
  expect(buildWarOpportunityAdvice(state, attacker.id).best?.provinceId).toBe(target.id);
  state.diplomaticAccords.push({ id: 'security', partyA: attacker.id, partyB: defender.id, agenda: 'security', startedTurn: 0, expiresTurn: 8, strength: 1 });
  const decision = decideAiWar(state, attacker.id);
  expect([decision.candidate, ...decision.alternatives].some((c) => c?.defenderId === defender.id)).toBe(false);
  expect(buildWarOpportunityAdvice(state, attacker.id).candidates.some((c) => c.defenderId === defender.id)).toBe(false);
  expect(declareWar(state, attacker.id, defender.id, target.id)).toBeNull();
});

it('never cancels a war or an active truce through a different diplomatic order', () => {
  const { state, attacker, defender } = borderWar();
  attacker.resources.influence = 200;
  const pair = state.relations.filter((r) => [r.from, r.to].includes(attacker.id) && [r.from, r.to].includes(defender.id));
  for (const treaty of ['war', 'truce'] as const) {
    for (const r of pair) Object.assign(r, { treaty, truceTurns: treaty === 'truce' ? 5 : 0, relation: 80 });
    expect(establishTrade(attacker, defender.id, state).ok).toBe(false);
    expect(formAlliance(attacker, defender.id, state).ok).toBe(false);
    breakTreaty(attacker, defender.id, state);
    expect(pair.map((r) => r.treaty)).toEqual([treaty, treaty]);
  }
  expect(attacker.resources.influence).toBe(200);
});

it('revalidates AI construction ownership, materials and province capacity', () => {
  const { state, attacker, front, target } = borderWar();
  front.buildings = [];
  Object.assign(attacker.resources, { gold: 1000, wood: 100, iron: 100 });
  const build = (id: string) => executeAIAction(attacker, { actionId: 'build_farm', weight: 1, target: id }, state);
  build(target.id);
  expect(attacker.resources.gold).toBe(1000);
  for (let n = 0; n < 5; n++) build(front.id);
  expect(attacker.resources).toMatchObject({ wood: 0, gold: 750 });
  attacker.resources.wood = 20;
  build(front.id);
  expect(front.buildings).toHaveLength(5);
  expect(attacker.resources.wood).toBe(20);
});
