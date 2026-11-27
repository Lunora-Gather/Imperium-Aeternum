import { tradeRouteById } from '../engine/tradeNetwork';
import { peacefulRelationPair } from '../engine/diplomacy';
import { getRelationObj } from '../engine/init';
import type { GameState, PactTerms, PendingDecision } from '../types/game';

export const RENEWAL_EVENT = 'evt_eastern_renewal';

export const pactTerms = {
  trade: { years: 5, gold: 0, reason: '两年商路交割，邻国愿免收礼金。' },
  peace: { years: 5, gold: 50, reason: '边境守约，邻国愿按旧礼续签。' },
  wary: { years: 3, gold: 120, reason: '邻国仍有戒心，只肯签短约。' },
} satisfies Record<PactTerms, { years: number; gold: number; reason: string }>;

function openingPact(state: GameState) {
  // Summit security accords run for eight or ten years. The opening envoy is the
  // sole five-year security pact signed at founding, including in earlier saves.
  return state.diplomaticAccords.find(a => a.partyA === state.playerNationId && a.agenda === 'security'
    && a.startedTurn === 0 && a.expiresTurn === 5);
}

export function reviewBorderPact(state: GameState, previous?: GameState) {
  if (state.scenarioId !== 'w3_eastasia' || state.turn > 5 || state.victory.type) return;
  const pact = openingPact(state);
  if (!pact) return;
  const { partyA, partyB } = pact;
  const delivered = previous && state.lastReport?.economicReturns?.routes.some(row => {
    const route = tradeRouteById(row.routeId);
    return route && (row.gold > 0 || row.food !== 0) && previous.provinces[route.endpoints[1]]?.ownerId === partyB;
  });
  if (delivered) {
    pact.tradeYears = (pact.tradeYears ?? 0) + 1;
  }
  if (state.turn !== pact.expiresTurn || !state.nations[partyB] || state.nations[partyB].defeated) return;
  if (state.pendingEvents.some(e => e.eventId === RENEWAL_EVENT && e.nationId === partyA)
    || state.eventCooldowns.some(e => e.eventId === RENEWAL_EVENT && e.nationId === partyA)) return;
  const relation = getRelationObj(partyB, partyA, state);
  if (!relation || relation.treaty === 'war' || relation.treaty === 'truce') return;
  const hostileAct = state.aiMemory?.[partyB]?.incidents?.some(i => i.actorId === partyA && i.kind === 'espionage' && i.turn >= pact.startedTurn);
  let terms: PactTerms = 'peace';
  if (hostileAct || relation.trust < 35) terms = 'wary';
  else if ((pact.tradeYears ?? 0) >= 2) terms = 'trade';
  else if (relation.relation < -35) terms = 'wary';
  state.pendingEvents.push({ eventId: RENEWAL_EVENT, nationId: partyA, partnerId: partyB, renewal: { accordId: pact.id, terms } });
  if (state.lastReport && !state.lastReport.events.includes(RENEWAL_EVENT)) {
    state.lastReport = { ...state.lastReport, events: [...state.lastReport.events, RENEWAL_EVENT] };
    state.history = state.history.map(r => r.turn === state.turn && r.nationId === partyA ? state.lastReport! : r);
  }
}

export function renewalBlocker(state: GameState, pending: PendingDecision) {
  const quote = pending.renewal;
  const pact = openingPact(state);
  const partner = state.nations[pending.partnerId ?? ''];
  if (!quote || !Object.prototype.hasOwnProperty.call(pactTerms, quote.terms) || !pact || pact.id !== quote.accordId || pact.partyA !== pending.nationId
    || pact.partyB !== partner?.id || !partner || partner.defeated || pact.expiresTurn !== state.turn
    || !peacefulRelationPair(state, pact.partyA, pact.partyB)) return '提议已失效';
  return state.nations[pending.nationId].resources.gold < pactTerms[quote.terms].gold ? '金不足' : null;
}

export function renewBorderPact(state: GameState, pending: PendingDecision) {
  const pact = openingPact(state)!;
  const { gold, years } = pactTerms[pending.renewal!.terms];
  state.nations[pact.partyA].resources.gold -= gold;
  state.nations[pact.partyB].resources.gold += gold;
  pact.expiresTurn += years;
  return `与${state.nations[pact.partyB].name}续约${years}年，礼金${gold}金。`;
}
