import type { GameState, PendingDecision, Nation } from '../types/game';
import { allocateEntityId } from '../utils/id';
import { addChronicle } from '../engine/chronicle';
import { EVENT_BY_ID } from '../data/events';
import { RENEWAL_EVENT, renewBorderPact, renewalBlocker } from './borderPact';
import { recordDiplomaticIncident } from './diplomaticMemory';

function tradingNeighbor(state: GameState, nation: Nation) {
  return state.relations.filter(r => r.from === nation.id && state.nations[r.to] && !state.nations[r.to].defeated
    && r.treaty !== 'war' && r.treaty !== 'truce')
    .sort((a, b) => b.relation - a.relation || a.to.localeCompare(b.to))[0]?.to;
}

/** Called only for a newly selected scenario. Loading a save never replays its opening. */
export function openScenarioCouncil(state: GameState) {
  const nation = state.nations[state.playerNationId];
  if (state.scenarioId === 'w8_indianocean') {
    nation.resources.influence = Math.max(30, nation.resources.influence);
    const neighbor = tradingNeighbor(state, nation);
    if (neighbor) {
      for (const r of state.relations) {
        if ((r.from === nation.id && r.to === neighbor) || (r.to === nation.id && r.from === neighbor)) r.relation = Math.max(0, r.relation);
      }
    }
  }
  if (state.scenarioId === 'eastasia') state.pendingEvents.push({ nationId: nation.id, eventId: 'evt_eastern_reform' });
  if (state.scenarioId === 'w3_eastasia') {
    const partnerId = tradingNeighbor(state, nation);
    if (partnerId) state.pendingEvents.push({ nationId: nation.id, eventId: 'evt_eastern_envoy', partnerId });
  }
}

export function offerGrainBudget(state: GameState) {
  const nation = state.nations[state.playerNationId];
  if (state.turn < 8 || state.turn > 20 || nation.resources.gold < 1200 || nation.resources.food < 500 || nation.atWar) return;
  const eventId = 'evt_grain_budget';
  if (state.pendingEvents.some(e => e.eventId === eventId && e.nationId === nation.id)
    || state.eventCooldowns.some(e => e.eventId === eventId && (e.nationId ?? nation.id) === nation.id)) return;
  const owned = Object.values(state.provinces).filter(p => p.ownerId === nation.id && p.terrain !== 'ocean');
  const province = owned.filter(p => p.agriBase < 12).sort((a, b) => b.population - a.population)[0];
  const partnerId = tradingNeighbor(state, nation);
  if (!province || !partnerId) return;
  const quantity = Math.max(30, Math.round(owned.reduce((sum, p) => sum + p.population, 0) * 0.05));
  const price = Math.round(nation.resources.gold * 0.2);
  state.pendingEvents = [...state.pendingEvents, { nationId: nation.id, eventId, partnerId, works: { provinceId: province.id, price, quantity } }];
  if (state.lastReport) state.lastReport = { ...state.lastReport, events: [...state.lastReport.events, eventId] };
}

export function decisionBlocker(state: GameState, pending: PendingDecision, option: number): string | null {
  if (pending.eventId === RENEWAL_EVENT && option === 0) return renewalBlocker(state, pending);
  const needsPartner = option === 0 && (pending.eventId === 'evt_eastern_envoy' || pending.eventId === 'evt_grain_budget');
  if (needsPartner && (!pending.partnerId || !state.nations[pending.partnerId] || state.nations[pending.partnerId].defeated ||
    state.relations.some(r => r.from === pending.nationId && r.to === pending.partnerId && r.treaty === 'war'))) return '提议已失效';
  if (pending.eventId !== 'evt_grain_budget' || option === 2) return null;
  const nation = state.nations[pending.nationId];
  if (!nation || !pending.works) return '提议已失效';
  if (option === 0) return null;
  const place = state.provinces[pending.works.provinceId];
  if (place?.ownerId !== nation.id || place.agriBase >= 12) return '提议已失效';
  return nation.resources.gold < pending.works.price ? '金不足' : null;
}

export function settleCampaignDecision(state: GameState, pending: PendingDecision, option: number) {
  const nation = state.nations[pending.nationId];
  let detail: string | undefined;
  if (pending.eventId === 'evt_eastern_envoy' && option === 0 && pending.partnerId) {
    state.diplomaticAccords.push({ id: allocateEntityId(state, 'accord'), partyA: nation.id, partyB: pending.partnerId,
      agenda: 'security', strength: 1, tradeYears: 0, startedTurn: state.turn, expiresTurn: state.turn + 5 });
    recordDiplomaticIncident(state, pending.partnerId, nation.id, 'alliance', 8, '签下五年约书');
  } else if (pending.eventId === RENEWAL_EVENT) {
    if (option === 0) detail = renewBorderPact(state, pending);
    else if (pending.partnerId && state.nations[pending.partnerId]) detail = `与${state.nations[pending.partnerId].name}的边约按期结束。`;
  } else if (pending.eventId === 'evt_grain_budget' && pending.works && pending.partnerId) {
    const { price, provinceId, quantity } = pending.works;
    if (option === 0) nation.grainContract = { partnerId: pending.partnerId, quantity, yearsLeft: 3 };
    if (option === 1) {
      const province = state.provinces[provinceId];
      nation.resources.gold -= price;
      province.priorAgriBase ??= province.agriBase;
      province.agriBase = Math.min(12, province.agriBase + 2);
    }
  } else if (pending.eventId !== 'evt_eastern_reform' && pending.eventId !== 'evt_eastern_envoy') return;
  const event = EVENT_BY_ID[pending.eventId];
  addChronicle(state, { turn: state.turn, kind: pending.eventId === 'evt_eastern_envoy' || pending.eventId === RENEWAL_EVENT ? 'milestone_diplomacy' : 'reform',
    actorId: nation.id, title: event.title, desc: detail ?? event.options[option].text });
}
