import { TRADE_ROUTES, TRADE_ROUTE_BY_ID, type TradeRouteDef } from '../data/trade-routes';
import type { GameState, Nation, Province } from '../types/game';

type Contract = Omit<TradeRouteDef, 'endpoints'>;

const contracts: Contract[] = [
  { id: 'grain_import', name: '粮食输入线', description: '运回口粮，兼收沿途商税。', costGold: 80, prereqAdminLevel: 1,
    length: 'short', yield: { gold: 15, food: 30, influence: 1 } },
  { id: 'grain_export', name: '粮食输出线', description: '每年交付粮储，换取货款与影响力。', costGold: 120, prereqAdminLevel: 1,
    length: 'medium', yield: { gold: 50, food: -45, influence: 3 } },
];

function connect(contract: Contract, start: string, end: string): TradeRouteDef {
  return { ...contract, id: [contract.id, start, end].join(':'), endpoints: [start, end] };
}

/** Contract IDs preserve both places across conquests, save/load and shared-world commands. */
export function tradeRouteById(id: string): TradeRouteDef | undefined {
  if (Object.prototype.hasOwnProperty.call(TRADE_ROUTE_BY_ID, id)) return TRADE_ROUTE_BY_ID[id];
  if (typeof id !== 'string') return;
  const parts = id.split(':');
  if (parts.length !== 3 || !parts[1] || !parts[2] || parts[1] === parts[2]) return;
  const contract = contracts.find(entry => entry.id === parts[0]);
  return contract && connect(contract, parts[1], parts[2]);
}

function marketRank(province: Province) {
  const coastal = province.terrain === 'coast' || province.terrain === 'island';
  return Number(coastal) * 2 + Number(province.isCapital);
}

export function tradeOffers(state: GameState, nation: Nation): TradeRouteDef[] {
  if (state.provinces.p01) return TRADE_ROUTES;
  const markets = new Map<string, Province>();
  for (const p of Object.values(state.provinces)) {
    if (p.terrain === 'ocean') continue;
    const previous = markets.get(p.ownerId);
    if (!previous || marketRank(p) > marketRank(previous) || (marketRank(p) === marketRank(previous) && p.id < previous.id)) {
      markets.set(p.ownerId, p);
    }
  }
  const home = markets.get(nation.id);
  if (!home) return [];
  const distance = (p: Province) => (p.x - home.x) ** 2 + (p.y - home.y) ** 2;
  const contacts = new Map(state.relations.filter(r => r.from === nation.id).map(r => [r.to, r]));
  const marketsAbroad = [...markets.values()].filter(p => contacts.has(p.ownerId) && state.nations[p.ownerId] && !state.nations[p.ownerId].defeated);
  const accessible = (p: Province) => {
    const r = contacts.get(p.ownerId)!;
    return Number(r.treaty === 'trade' || r.treaty === 'alliance' || (r.treaty === 'none' && r.relation >= 0));
  };
  marketsAbroad.sort((a, b) => accessible(b) - accessible(a) || distance(a) - distance(b) || a.id.localeCompare(b.id));
  const pactPartners = new Set(state.diplomaticAccords.filter(a => a.agenda === 'security' && a.expiresTurn >= state.turn
    && (a.partyA === nation.id || a.partyB === nation.id)).map(a => a.partyA === nation.id ? a.partyB : a.partyA));
  return marketsAbroad.filter((port, i) => i < 3 || pactPartners.has(port.ownerId))
    .flatMap(port => contracts.map(contract => connect(contract, home.id, port.id)));
}

export function foreignTradePartner(def: TradeRouteDef, state: GameState, nation: Nation) {
  if (!def.id.includes(':')) return undefined;
  const end = state.provinces[def.endpoints[1]];
  return end && end.ownerId !== nation.id ? state.nations[end.ownerId] : undefined;
}

export function routeAccessBlocker(def: TradeRouteDef, state: GameState, nation: Nation): string | null {
  const [start, end] = def.endpoints.map(id => state.provinces[id]);
  if (!start || !end) return '路线端点省份不存在';
  if (!def.id.includes(':')) return start.ownerId === nation.id || end.ownerId === nation.id ? null : '两端均不归本国';
  if (start.ownerId !== nation.id) return '起运地已易主';
  if (end.ownerId === nation.id) return null;
  const relation = state.relations.find(r => r.from === nation.id && r.to === end.ownerId);
  if (state.nations[end.ownerId]?.defeated || !relation || !['trade', 'alliance'].includes(relation.treaty)) return '需与对方签订贸易协定';
  return null;
}

export function operatingRoutes(nation: Nation, state: GameState): TradeRouteDef[] {
  return (nation.activeTradeRoutes ?? []).flatMap(entry => {
    const def = tradeRouteById(entry.routeId);
    return def && !nation.embargoedRoutes?.includes(def.id) && !routeAccessBlocker(def, state, nation) ? [def] : [];
  });
}
