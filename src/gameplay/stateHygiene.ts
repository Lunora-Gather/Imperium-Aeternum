// 状态净化链：防止长局、读档、AI 行动和 UI wrapper 让 GameState 越玩越脏。
// V15：导出纯函数，不污染输入；新局、选国、读档、槽位读档、每回合后都统一走安全修复。

import { useGameStore } from '../store/gameStore';
import type { DiplomaticRelation, GameState, Nation, Province, War } from '../types/game';

let installed = false;

function finite(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function relationKey(from: string, to: string): string {
  return `${from}|${to}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

function cloneProvince(p: Province): Province {
  return {
    ...p,
    classes: Array.isArray(p.classes) ? p.classes.map((c) => ({ ...c })) : [],
    buildings: Array.isArray(p.buildings) ? p.buildings.map((b) => ({ ...b })) : [],
    baseResources: { ...(p.baseResources ?? {}) },
    adjacent: Array.isArray(p.adjacent) ? [...p.adjacent] : [],
  };
}

function cloneNation(n: Nation): Nation {
  return {
    ...n,
    government: { ...n.government },
    tendency: { ...n.tendency },
    ruler: { ...n.ruler, heir: n.ruler.heir ? { ...n.ruler.heir } : undefined },
    resources: { ...n.resources },
    factions: Array.isArray(n.factions) ? n.factions.map((f) => ({ ...f })) : [],
    tech: { ...n.tech, researchProgress: n.tech.researchProgress ? { ...n.tech.researchProgress } : null },
    army: Array.isArray(n.army) ? n.army.map((a) => ({ ...a })) : [],
    activePolicies: Array.isArray(n.activePolicies) ? n.activePolicies.map((p) => ({ ...p })) : [],
    activeLaws: Array.isArray(n.activeLaws) ? n.activeLaws.map((l) => ({ ...l })) : [],
    activeTradeRoutes: Array.isArray(n.activeTradeRoutes) ? n.activeTradeRoutes.map((r) => ({ ...r })) : [],
    embargoedRoutes: Array.isArray(n.embargoedRoutes) ? [...n.embargoedRoutes] : [],
    civilWar: n.civilWar ? { active: n.civilWar.active, rebels: [...n.civilWar.rebels] } : undefined,
    policyMods: n.policyMods ? { ...n.policyMods } : undefined,
  };
}

function cloneWar(w: War): War {
  return { ...w, battleReports: Array.isArray(w.battleReports) ? w.battleReports.map((b) => ({ ...b })) : [] };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    nations: Object.fromEntries(Object.entries(state.nations).map(([id, nation]) => [id, cloneNation(nation)])),
    provinces: Object.fromEntries(Object.entries(state.provinces).map(([id, province]) => [id, cloneProvince(province)])),
    relations: Array.isArray(state.relations) ? state.relations.map((r) => ({ ...r })) : [],
    wars: Array.isArray(state.wars) ? state.wars.map(cloneWar) : [],
    triggeredEvents: Array.isArray(state.triggeredEvents) ? state.triggeredEvents.map((e) => ({ ...e })) : [],
    eventCooldowns: Array.isArray(state.eventCooldowns) ? state.eventCooldowns.map((e) => ({ ...e })) : [],
    pendingEvents: Array.isArray(state.pendingEvents) ? state.pendingEvents.map((e) => ({ ...e })) : [],
    pendingEventOptions: state.pendingEventOptions ? { ...state.pendingEventOptions, options: state.pendingEventOptions.options.map((o) => ({ ...o })) } : null,
    lastReport: state.lastReport ? JSON.parse(JSON.stringify(state.lastReport)) as GameState['lastReport'] : null,
    history: Array.isArray(state.history) ? state.history.map((r) => JSON.parse(JSON.stringify(r)) as typeof r) : [],
    victory: { ...(state.victory ?? { type: null }) },
    chronicle: Array.isArray(state.chronicle) ? state.chronicle.map((c) => ({ ...c })) : [],
    _relMap: undefined,
  };
}

function syncTreaty(left: DiplomaticRelation, right: DiplomaticRelation): void {
  const major = new Set(['war', 'truce', 'alliance', 'trade']);
  if (!major.has(left.treaty) && !major.has(right.treaty)) return;
  const treaty = left.treaty === 'war' || right.treaty === 'war' ? 'war'
    : left.treaty === 'truce' || right.treaty === 'truce' ? 'truce'
      : left.treaty === 'alliance' || right.treaty === 'alliance' ? 'alliance'
        : 'trade';
  left.treaty = treaty;
  right.treaty = treaty;
  const relation = treaty === 'war' ? -100 : Math.min(left.relation, right.relation);
  const trust = treaty === 'war' ? Math.min(left.trust, right.trust, 20) : Math.min(left.trust, right.trust);
  left.relation = relation;
  right.relation = relation;
  left.trust = trust;
  right.trust = trust;
  const truceTurns = Math.max(left.truceTurns, right.truceTurns);
  left.truceTurns = truceTurns;
  right.truceTurns = truceTurns;
}

function sanitizeRelations(relations: DiplomaticRelation[], nations: GameState['nations'], wars: War[]): DiplomaticRelation[] {
  const dedup = new Map<string, DiplomaticRelation>();
  for (const r of relations) {
    if (!nations[r.from] || !nations[r.to] || r.from === r.to) continue;
    const key = relationKey(r.from, r.to);
    if (dedup.has(key)) continue;
    dedup.set(key, {
      ...r,
      relation: clamp(finite(r.relation), -100, 100),
      trust: clamp(finite(r.trust, 50), 0, 100),
      threat: clamp(finite(r.threat), 0, 100),
      tradeDep: clamp(finite(r.tradeDep), 0, 100),
      truceTurns: Math.max(0, Math.round(finite(r.truceTurns))),
    });
  }

  // 补齐缺失的反向关系，避免 UI/AI 只读一边时判断不一致。
  for (const r of [...dedup.values()]) {
    const reverseKey = relationKey(r.to, r.from);
    if (!dedup.has(reverseKey)) {
      dedup.set(reverseKey, { ...r, from: r.to, to: r.from });
    }
  }

  const pairSeen = new Set<string>();
  for (const r of dedup.values()) {
    const pk = pairKey(r.from, r.to);
    if (pairSeen.has(pk)) continue;
    pairSeen.add(pk);
    const reverse = dedup.get(relationKey(r.to, r.from));
    if (reverse) syncTreaty(r, reverse);
  }

  for (const w of wars) {
    const a = dedup.get(relationKey(w.attackerId, w.defenderId));
    const b = dedup.get(relationKey(w.defenderId, w.attackerId));
    if (a) { a.treaty = 'war'; a.relation = -100; a.trust = Math.min(a.trust, 20); }
    if (b) { b.treaty = 'war'; b.relation = -100; b.trust = Math.min(b.trust, 20); }
  }

  return [...dedup.values()];
}

export function sanitizeState(state: GameState): GameState {
  const next = cloneState(state);

  next.version = Math.max(1, Math.round(finite(next.version, 1)));
  next.turn = Math.max(0, Math.round(finite(next.turn)));
  next.seed = Math.round(finite(next.seed));
  next.stableTurnsCount = Math.max(0, Math.round(finite(next.stableTurnsCount)));
  next.bankruptTurns = Math.max(0, Math.round(finite(next.bankruptTurns)));
  next.lowStabilityTurns = Math.max(0, Math.round(finite(next.lowStabilityTurns)));
  next.highEconomyStableTurns = Math.max(0, Math.round(finite(next.highEconomyStableTurns)));
  next.victory = next.victory ?? { type: null };

  if (!next.playerNationId || !next.nations[next.playerNationId]) {
    const fallback = Object.values(next.nations).find((n) => !n.defeated) ?? Object.values(next.nations)[0];
    if (fallback) next.playerNationId = fallback.id;
  }

  for (const n of Object.values(next.nations)) {
    n.isPlayer = n.id === next.playerNationId;
    n.resources.gold = Math.round(finite(n.resources.gold));
    n.resources.food = Math.round(finite(n.resources.food));
    n.resources.wood = Math.max(0, Math.round(finite(n.resources.wood)));
    n.resources.iron = Math.max(0, Math.round(finite(n.resources.iron)));
    n.resources.adminPt = Math.max(0, Math.round(finite(n.resources.adminPt)));
    n.resources.sciPt = Math.max(0, Math.round(finite(n.resources.sciPt)));
    n.resources.influence = Math.max(0, Math.round(finite(n.resources.influence)));
    n.resources.supply = Math.max(0, Math.round(finite(n.resources.supply)));
    n.government.stability = clamp(finite(n.government.stability, 50), 0, 100);
    n.government.legitimacy = clamp(finite(n.government.legitimacy, 50), 0, 100);
    n.government.efficiency = clamp(finite(n.government.efficiency, 50), 0, 100);
    n.government.corruption = clamp(finite(n.government.corruption, 10), 0, 100);
    n.warExhaustion = clamp(finite(n.warExhaustion), 0, 100);
    n.influence = Math.max(0, Math.round(finite(n.influence)));
    n.factions = n.factions.map((f) => ({ ...f, power: clamp(finite(f.power, 10), 0, 100), satisfaction: clamp(finite(f.satisfaction, 50), 0, 100) }));
    n.army = n.army.filter((a) => a && finite(a.size) > 0);
  }

  for (const p of Object.values(next.provinces)) {
    if (!next.nations[p.ownerId]) {
      const fallback = next.nations[next.playerNationId] ?? Object.values(next.nations)[0];
      if (fallback) p.ownerId = fallback.id;
    }
    p.population = Math.max(0, Math.round(finite(p.population)));
    p.garrison = Math.max(0, Math.round(finite(p.garrison)));
    p.unrest = clamp(finite(p.unrest), 0, 100);
    p.rebellionRisk = clamp(finite(p.rebellionRisk), 0, 100);
    p.loyalty = clamp(finite(p.loyalty, 50), 0, 100);
    p.assimilation = clamp(finite(p.assimilation, 50), 0, 100);
    p.adjacent = [...new Set((Array.isArray(p.adjacent) ? p.adjacent : []).filter((id) => !!next.provinces[id] && id !== p.id))];
    p.classes = p.classes.map((c) => ({ ...c, count: Math.max(0, Math.round(finite(c.count))), satisfaction: clamp(finite(c.satisfaction, 50), 0, 100) }));
  }

  for (const n of Object.values(next.nations)) {
    const owned = Object.values(next.provinces).filter((p) => p.ownerId === n.id);
    const fallback = owned.find((p) => p.id === n.capital) ?? owned[0];
    n.army = n.army
      .map((a) => {
        const loc = next.provinces[a.location];
        const safeLocation = loc && loc.ownerId === n.id ? a.location : fallback?.id;
        if (!safeLocation) return null;
        return {
          ...a,
          location: safeLocation,
          size: Math.max(0, Math.round(finite(a.size))),
          morale: clamp(finite(a.morale, 50), 0, 100),
          training: clamp(finite(a.training, 50), 0, 100),
          equipment: clamp(finite(a.equipment, 50), 0, 100),
          supply: clamp(finite(a.supply, 50), 0, 100),
        };
      })
      .filter((a): a is NonNullable<typeof a> => !!a);
    if (owned.length === 0 && n.id !== next.playerNationId) n.defeated = true;
  }

  const seenWars = new Set<string>();
  next.wars = next.wars.filter((w) => {
    if (!next.nations[w.attackerId] || !next.nations[w.defenderId] || !next.provinces[w.targetProvinceId]) return false;
    if (next.nations[w.attackerId].defeated || next.nations[w.defenderId].defeated) return false;
    const key = pairKey(w.attackerId, w.defenderId);
    if (seenWars.has(key)) return false;
    seenWars.add(key);
    w.progress = clamp(finite(w.progress), 0, 100);
    w.turns = Math.max(0, Math.round(finite(w.turns)));
    w.battleReports = w.battleReports.slice(-8);
    return true;
  });

  const activeWarNations = new Set<string>();
  next.wars.forEach((w) => { activeWarNations.add(w.attackerId); activeWarNations.add(w.defenderId); });
  for (const n of Object.values(next.nations)) n.atWar = activeWarNations.has(n.id);

  next.relations = sanitizeRelations(next.relations, next.nations, next.wars);
  next.pendingEvents = next.pendingEvents.filter((e) => next.nations[e.nationId]);
  if (next.pendingEventOptions && !next.nations[next.pendingEventOptions.nationId]) next.pendingEventOptions = null;
  next.history = next.history.slice(-12);
  next.chronicle = next.chronicle.slice(-60);
  next._relMap = undefined;
  return next;
}

function sanitizeStoreState(): void {
  const state = useGameStore.getState().state;
  useGameStore.setState({ state: sanitizeState(state) });
}

export function installStateHygiene(): void {
  if (installed) return;
  installed = true;
  const store = useGameStore.getState() as unknown as {
    startScenario?: (id: string) => void;
    startWithNation?: (nationId: string) => void;
    load?: () => boolean;
    loadFromSlot?: (slot: number) => boolean;
    nextTurn?: () => unknown;
  };
  const originalStartScenario = store.startScenario;
  const originalStartWithNation = store.startWithNation;
  const originalLoad = store.load;
  const originalLoadFromSlot = store.loadFromSlot;
  const originalNextTurn = store.nextTurn;

  useGameStore.setState({
    startScenario: (id: string) => {
      originalStartScenario?.(id);
      sanitizeStoreState();
    },
    startWithNation: (nationId: string) => {
      originalStartWithNation?.(nationId);
      sanitizeStoreState();
    },
    load: () => {
      const ok = originalLoad?.() ?? false;
      if (ok) sanitizeStoreState();
      return ok;
    },
    loadFromSlot: (slot: number) => {
      const ok = originalLoadFromSlot?.(slot) ?? false;
      if (ok) sanitizeStoreState();
      return ok;
    },
    nextTurn: () => {
      const result = originalNextTurn?.();
      sanitizeStoreState();
      return result;
    },
  } as never);
}
