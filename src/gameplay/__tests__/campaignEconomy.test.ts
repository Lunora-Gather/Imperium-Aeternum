import { describe, expect, it } from 'vitest';
import { advanceSharedWorld, applySharedWorldCommand, prepareSharedSnapshot, sharedRulerSnapshot } from '../../../scripts/shared-world-engine-entry';
import { createInitialState, createWorldState } from '../../engine/init';
import { settleEconomyPure } from '../../engine/economy';
import { hasActiveNonAggressionAccord } from '../../engine/summits';
import { operatingRoutes, tradeOffers } from '../../engine/tradeNetwork';
import { findScenario, SCENARIOS, type ScenarioId } from '../../store/scenarioCatalog';
import { migrate, recoverMigratedSave } from '../../store/persistence';
import { SAVE_VERSION, type GameState } from '../../types/game';
import { developProvinceAction, espionageAction, embargoTradeRouteAction, establishTradeRouteAction, formTradeAction } from '../actions';
import { openScenarioCouncil, offerGrainBudget } from '../campaignDecisions';
import { RENEWAL_EVENT } from '../borderPact';
import { resolvePendingEventChoice } from '../pendingEventResolution';
import { advanceTurnPipeline, prepareGameState } from '../turnPipeline';

function start(id: ScenarioId, player: string, seed = 9104) {
  const state = createWorldState(seed, player, findScenario(id).regionFilter);
  state.scenarioId = id;
  openScenarioCouncil(state);
  return prepareGameState(state);
}

function reload(state: GameState) {
  return recoverMigratedSave(migrate({ version: SAVE_VERSION, createdAt: new Date(0).toISOString(), gameState: structuredClone(state) })).gameState;
}

function annual(state: GameState) {
  return settleEconomyPure(state.nations[state.playerNationId], state);
}

describe('campaign decisions and realized returns', () => {
  it('offers actual market towns across the generated scenarios and keeps classic routes', () => {
    const classic = createInitialState();
    expect(tradeOffers(classic, classic.nations[classic.playerNationId])).toHaveLength(8);
    for (const scenario of SCENARIOS.filter(s => !['classic', 'challenge_survival'].includes(s.id))) {
      const state = createWorldState(9103, scenario.playableNations?.[0]?.id, scenario.id === 'w7_random' ? ['americas'] : scenario.regionFilter);
      for (const nation of Object.values(state.nations)) {
        expect(state.provinces[nation.capital].terrain).not.toBe('ocean');
        const offers = tradeOffers(state, nation);
        expect(offers.length).toBeGreaterThan(0);
        for (const route of offers) {
          const [home, foreign] = route.endpoints.map(id => state.provinces[id]);
          expect(home.ownerId).toBe(nation.id);
          expect(foreign.ownerId).not.toBe(nation.id);
          expect(foreign.terrain).not.toBe('ocean');
        }
      }
    }
  });

  it('requires an operating route for the commerce chapter even after twenty profitable years', () => {
    const state = start('w8_indianocean', 'n_oc_srivijaya');
    const id = state.playerNationId;
    const route = tradeOffers(state, state.nations[id])[0];
    const partner = state.provinces[route.endpoints[1]].ownerId;
    const signed = formTradeAction(state, partner);
    const opened = establishTradeRouteAction(signed.state, route.id);
    expect(opened.ok).toBe(true);
    function play(initial: GameState) {
      let next = initial;
      for (let turn = 0; turn < 20; turn++) {
        next = advanceTurnPipeline(next).state;
        let event = next.pendingEvents.find(e => e.nationId === id);
        while (event) {
          const choice = resolvePendingEventChoice(next, id, event.eventId, 0);
          expect(choice.resolved).toBe(true);
          next = choice.state;
          event = next.pendingEvents.find(e => e.nationId === id);
        }
      }
      return next.nationalMission!.completedStages;
    }
    expect(play(state)).toEqual(['foundation']);
    expect(play(opened.state)).toEqual(['foundation', 'route']);
  });

  it('requires a treaty, preserves route identity on reload and posts exactly the goods delivered', () => {
    const state = start('w8_indianocean', 'n_oc_srivijaya');
    const nation = state.nations[state.playerNationId];
    const route = tradeOffers(state, nation)[1];
    const partner = state.provinces[route.endpoints[1]].ownerId;
    expect(establishTradeRouteAction(state, route.id).state).toBe(state);
    const signed = formTradeAction(state, partner);
    expect(signed.ok).toBe(true);
    const built = establishTradeRouteAction(signed.state, route.id);
    expect(built.ok).toBe(true);
    const restored = reload(built.state);
    const baseline = annual(signed.state), delivery = annual(restored);
    expect(delivery.grain.exports - baseline.grain.exports).toBe(45);
    const receipt = delivery.economicReturns!.routes[0];
    expect(delivery.grain.net - baseline.grain.net).toBeCloseTo(receipt.food);
    expect(delivery.tradeIncome - baseline.tradeIncome).toBeCloseTo(receipt.gold);
    const turn = advanceTurnPipeline(restored);
    expect(turn.report.economicReturns?.routes[0]).toEqual({ ...receipt, opened: true });
    expect(embargoTradeRouteAction(restored, route.id).ok).toBe(true);
    expect(annual(embargoTradeRouteAction(restored, route.id).state).grain.exports).toBe(0);
    const scarce = structuredClone(restored);
    scarce.nations[nation.id].resources.food = -100000;
    expect(annual(scarce).economicReturns?.routes[0].gold).toBe(0);
    for (const r of scarce.relations) if (r.from === nation.id && r.to === partner) r.treaty = 'none';
    expect(operatingRoutes(scarce.nations[nation.id], scarce)).toHaveLength(0);
  });

  it('keeps shared-world orders and annual receipts scoped to their ruler', () => {
    const state = prepareSharedSnapshot(start('w8_indianocean', 'n_oc_srivijaya'));
    const id = state.playerNationId;
    const route = tradeOffers(state, state.nations[id])[0];
    const partner = state.provinces[route.endpoints[1]].ownerId;
    const signed = applySharedWorldCommand(state, id, { action: 'form_trade', args: [partner] });
    const built = applySharedWorldCommand(signed.state, id, { action: 'establish_trade_route', args: [route.id] });
    const next = advanceSharedWorld(built.state, [id, partner]);
    expect(sharedRulerSnapshot(next, id).lastReport?.economicReturns?.routes[0]).toMatchObject({ routeId: route.id, opened: true, food: 30 });
    expect(sharedRulerSnapshot(next, partner).lastReport?.economicReturns?.routes ?? []).toEqual([]);
  });

  it('recovers a legacy ocean capital locally and in a shared snapshot without redrawing the map', () => {
    const state = start('w8_indianocean', 'n_oc_srivijaya');
    const capital = state.nations[state.playerNationId].capital;
    state.provinces[capital].terrain = 'ocean';
    state.provinces[capital].agriBase = 0;
    for (const restored of [reload(state), prepareSharedSnapshot(state)]) {
      expect(restored.provinces[capital].terrain).toBe('coast');
      expect(restored.provinces[capital].id).toBe(capital);
      expect(restored.provinces[capital].agriBase).toBe(1);
    }
    expect(state.provinces[capital].terrain).toBe('ocean');
  });

  it('keeps the two eastern openings distinct and resolves a treaty only once', () => {
    const reform = start('eastasia', 'n_ea_qin'), border = start('w3_eastasia', 'n_ea_qin');
    const id = reform.playerNationId;
    const survey = resolvePendingEventChoice(reform, id, 'evt_eastern_reform', 0);
    expect(survey.state.nations[id].resources.gold).toBe(reform.nations[id].resources.gold - 80);
    const offer = border.pendingEvents[0];
    expect(offer.eventId).toBe('evt_eastern_envoy');
    const pact = resolvePendingEventChoice(reload(border), id, offer.eventId, 0).state;
    expect(hasActiveNonAggressionAccord(pact, id, offer.partnerId!)).toBe(true);
    expect(hasActiveNonAggressionAccord({ ...pact, turn: pact.turn + 6 }, id, offer.partnerId!)).toBe(false);
    expect(resolvePendingEventChoice(reload(pact), id, offer.eventId, 0).resolved).toBe(false);
    const declined = resolvePendingEventChoice(border, id, offer.eventId, 1).state;
    expect(hasActiveNonAggressionAccord(declined, id, offer.partnerId!)).toBe(false);
  });

  it('quotes the investment once, rechecks funds, and settles three years of actual shipments', () => {
    const s = createInitialState(), id = s.playerNationId, event = 'evt_grain_budget';
    s.turn = 8;
    s.nations[id].resources.gold = 2400;
    s.nations[id].resources.food = 2000;
    offerGrainBudget(s);
    offerGrainBudget(s);
    expect(s.pendingEvents.filter(e => e.eventId === event)).toHaveLength(1);
    const offer = s.pendingEvents[0], works = offer.works!;
    const broke = reload(s);
    broke.nations[id].resources.gold = works.price - 1;
    expect(resolvePendingEventChoice(broke, id, event, 1).resolved).toBe(false);
    expect(resolvePendingEventChoice(broke, id, event, 2).resolved).toBe(true);
    const irrigation = resolvePendingEventChoice(s, id, event, 1).state;
    expect(irrigation.nations[id].resources.gold).toBe(2400 - works.price);
    expect(annual(irrigation).economicReturns?.harvests[0].food).toBeGreaterThan(0);
    const signed = resolvePendingEventChoice(s, id, event, 0).state;
    const war = reload(signed);
    war.relations.find(r => r.from === id && r.to === offer.partnerId)!.treaty = 'war';
    expect(annual(war).economicReturns?.contract).toMatchObject({ gold: 0, yearsLeft: 0 });
    let next = reload(signed);
    for (const yearsLeft of [2, 1, 0]) {
      next = advanceTurnPipeline(next).state;
      expect(next.lastReport?.economicReturns?.contract).toMatchObject({ yearsLeft, food: -works.quantity, gold: 2 * works.quantity });
    }
    expect(next.nations[id].grainContract).toBeUndefined();
    expect(next.pendingEvents.some(e => e.eventId === event)).toBe(false);
    expect(annual(next).economicReturns?.contract).toBeUndefined();
  });

  it('attributes two reclamations to a single first harvest even across a save boundary', () => {
    const state = createInitialState(), nation = state.nations[state.playerNationId];
    const once = developProvinceAction(state, nation.capital, 'reclaim');
    const twice = developProvinceAction(once.state, nation.capital, 'reclaim');
    expect(twice.ok).toBe(true);
    const restored = reload(twice.state);
    const turn = advanceTurnPipeline(restored);
    const gains = turn.report.economicReturns?.harvests;
    expect(gains).toHaveLength(1);
    expect(gains![0].food).toBeCloseTo(annual(restored).foodProduced - annual(state).foodProduced);
    expect(annual(turn.state).economicReturns?.harvests ?? []).toHaveLength(0);
  });
});

describe('the opening border pact at maturity', () => {
  function signedOpening() {
    const s = start('w3_eastasia', 'n_ea_qin');
    s.strategyFocus = 'diplomacy';
    return resolvePendingEventChoice(s, s.playerNationId, 'evt_eastern_envoy', 0).state;
  }

  function advance(s: GameState) {
    let next = advanceTurnPipeline(s).state;
    for (const event of next.pendingEvents.filter(p => p.nationId === next.playerNationId && p.eventId !== RENEWAL_EVENT)) {
      const result = resolvePendingEventChoice(next, next.playerNationId, event.eventId, 0);
      expect(result.resolved).toBe(true);
      next = result.state;
    }
    return next;
  }

  it.each(['trade', 'spy', 'embargo'] as const)('quotes the same partner after actual %s orders', (path) => {
    let s = advance(signedOpening());
    const id = s.playerNationId, pact = s.diplomaticAccords[0], partner = pact.partyB;
    const route = tradeOffers(s, s.nations[id]).find(r => s.provinces[r.endpoints[1]].ownerId === partner)!;
    const built = establishTradeRouteAction(s, route.id);
    expect(built.ok).toBe(true);
    s = built.state;
    if (path === 'embargo') {
      const embargo = embargoTradeRouteAction(s, route.id);
      expect(embargo.ok).toBe(true);
      s = embargo.state;
    }
    while (s.turn < 5) {
      if (path === 'spy' && s.turn === 3) {
        const spy = espionageAction(s, partner, 'spy_military');
        expect(spy.ok).toBe(true);
        s = spy.state;
      }
      if (s.turn === 3) s = reload(s);
      s = advance(s);
    }
    const offer = s.pendingEvents.find(e => e.eventId === RENEWAL_EVENT)!;
    expect(offer.partnerId).toBe(partner);
    expect(s.diplomaticAccords.find(a => a.id === pact.id)?.tradeYears).toBe(path === 'embargo' ? 0 : 4);
    expect(offer.renewal).toEqual({ accordId: pact.id, terms: path === 'trade' ? 'trade' : 'wary' });
    const restored = reload(s);
    expect(restored.pendingEvents.filter(e => e.eventId === RENEWAL_EVENT)).toEqual([offer]);
    expect(restored.lastReport?.events.filter(e => e === RENEWAL_EVENT)).toHaveLength(1);
    const accepted = resolvePendingEventChoice(restored, id, RENEWAL_EVENT, 0);
    expect(accepted.resolved).toBe(true);
    const gold = path === 'trade' ? 0 : 120, expires = path === 'trade' ? 10 : 8;
    expect(accepted.state.nations[id].resources.gold).toBe(restored.nations[id].resources.gold - gold);
    expect(accepted.state.nations[partner].resources.gold).toBe(restored.nations[partner].resources.gold + gold);
    expect(accepted.state.chronicle.find(e => e.title === '边约期满')?.desc).toContain(`与${s.nations[partner].name}续约${expires - 5}年，礼金${gold}金`);
    expect(accepted.state.diplomaticAccords).toHaveLength(restored.diplomaticAccords.length);
    expect(hasActiveNonAggressionAccord({ ...accepted.state, turn: expires }, partner, id)).toBe(true);
    expect(hasActiveNonAggressionAccord({ ...accepted.state, turn: expires + 1 }, id, partner)).toBe(false);
    expect(resolvePendingEventChoice(reload(accepted.state), id, RENEWAL_EVENT, 0).resolved).toBe(false);
  });

  it('recovers an older due-year save and allows a broke ruler to decline without reopening the offer', () => {
    const state = signedOpening(), id = state.playerNationId;
    state.turn = 5;
    const pact = state.diplomaticAccords[0];
    delete pact.tradeYears;
    state.nations[id].resources.gold = 49;
    const s = reload(state);
    expect(s.pendingEvents[0].renewal?.terms).toBe('peace');
    expect(resolvePendingEventChoice(s, id, RENEWAL_EVENT, 0).state).toBe(s);
    s.nations[id].resources.gold = 50;
    const accepted = resolvePendingEventChoice(s, id, RENEWAL_EVENT, 0);
    expect(accepted.state.nations[id].resources.gold).toBe(0);
    const stale = reload(s);
    stale.nations[pact.partyB].defeated = true;
    expect(resolvePendingEventChoice(stale, id, RENEWAL_EVENT, 0).resolved).toBe(false);
    expect(resolvePendingEventChoice(stale, id, RENEWAL_EVENT, 1).resolved).toBe(true);
    const declined = reload(resolvePendingEventChoice(s, id, RENEWAL_EVENT, 1).state);
    expect(declined.nations[id].resources.gold).toBe(50);
    expect(declined.pendingEvents).toHaveLength(0);
    expect(hasActiveNonAggressionAccord(advance(declined), id, pact.partyB)).toBe(false);
  });

  it('does not offer a renewal for a refused opening or an ordinary summit accord', () => {
    const s = start('w3_eastasia', 'n_ea_qin');
    const id = s.playerNationId, partner = s.pendingEvents[0].partnerId!;
    const declined = resolvePendingEventChoice(s, id, 'evt_eastern_envoy', 1).state;
    declined.turn = 5;
    expect(reload(declined).pendingEvents).toHaveLength(0);
    declined.diplomaticAccords.push({ id: 'summit', partyA: id, partyB: partner, agenda: 'security', strength: 1, startedTurn: 0, expiresTurn: 8 });
    expect(reload(declined).pendingEvents).toHaveLength(0);
  });
});
