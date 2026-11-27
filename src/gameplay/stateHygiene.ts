// 状态净化链：防止长局、读档、AI 行动和 UI wrapper 让 GameState 越玩越脏。
// V15：导出纯函数，不污染输入；新局、选国、读档、槽位读档、每回合后都统一走安全修复。

import type { DiplomaticRelation, GameState, Province, War } from '../types/game';
import { legacyOceanCapital, restoreCapitalTerrain } from '../engine/worldgen';
import { setProvincePopulation } from '../engine/provincePopulation';
import { buildTendency } from '../engine/init';
import { cloneGameState } from '../engine/stateClone';
import { syncWarFlags } from '../engine/turnIntel';
import { EVENT_BY_ID } from '../data/events';
import { isValidProvinceOwner } from './stateOwnership';

export function validPendingEvents(state: GameState) {
  const pendingKeys = new Set<string>();
  return (state.pendingEvents ?? []).filter((entry) => {
    if (!entry || !state.nations[entry.nationId] || state.nations[entry.nationId].defeated || !Object.prototype.hasOwnProperty.call(EVENT_BY_ID, entry.eventId)) return false;
    const key = `${entry.nationId}|${entry.eventId}`;
    if (pendingKeys.has(key)) return false;
    pendingKeys.add(key);
    return true;
  });
}

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
  return a < b ? relationKey(a, b) : relationKey(b, a);
}

function syncTreaty(left: DiplomaticRelation, right: DiplomaticRelation): void {
  const treaties = [left.treaty, right.treaty];
  const truceTurns = Math.max(left.truceTurns, right.truceTurns);
  const treaty = treaties.includes('truce') && truceTurns > 0 ? 'truce'
    : treaties.includes('alliance') ? 'alliance' : treaties.includes('trade') ? 'trade' : 'none';
  left.treaty = right.treaty = treaty;
  left.truceTurns = right.truceTurns = treaty === 'truce' ? truceTurns : 0;
  if (treaty !== 'none') {
    left.relation = right.relation = Math.min(left.relation, right.relation);
    left.trust = right.trust = Math.min(left.trust, right.trust);
  }
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
  for (const r of dedup.values()) {
    const reverseKey = relationKey(r.to, r.from);
    if (!dedup.has(reverseKey)) {
      dedup.set(reverseKey, { ...r, from: r.to, to: r.from });
    }
  }

  for (const r of dedup.values()) {
    if (r.from < r.to) syncTreaty(r, dedup.get(relationKey(r.to, r.from))!);
  }

  for (const w of wars) {
    for (const [from, to] of [[w.attackerId, w.defenderId], [w.defenderId, w.attackerId]]) {
      const key = relationKey(from, to);
      const previous = dedup.get(key);
      dedup.set(key, { from, to, threat: previous?.threat ?? 0, tradeDep: previous?.tradeDep ?? 0,
        treaty: 'war', relation: -100, truceTurns: 0, trust: Math.min(20, previous?.trust ?? 0) });
    }
  }

  return [...dedup.values()];
}

export function sanitizeState(state: GameState, resourcePrecision: 'round' | 'preserve' = 'round'): GameState {
  const next = cloneGameState(state);
  // Old snapshots can predate individual collections. Restore their defaults
  // here, before passing the private copy to the same settlement rules.
  for (const key of ['relations', 'wars', 'triggeredEvents', 'eventCooldowns', 'pendingEvents', 'history',
    'chronicle', 'diplomaticSummits', 'diplomaticAccords'] as const) {
    if (!Array.isArray(next[key])) next[key] = [];
  }
  const defaults = buildTendency();
  const tendencyKeys = Object.keys(defaults) as (keyof typeof defaults)[];
  for (const nation of Object.values(next.nations)) {
    nation.tendency ??= { ...defaults };
    for (const key of tendencyKeys) nation.tendency[key] = clamp(finite(nation.tendency[key]), 0, 100);
    nation.resources ??= { gold: 0, food: 0, wood: 0, iron: 0, adminPt: 5, sciPt: 0, influence: 20, supply: 50 };
    nation.government ??= { type: 'monarchy', stability: 50, legitimacy: 50, efficiency: 50, corruption: 10 };
    for (const key of ['factions', 'army', 'activePolicies', 'activeLaws', 'activeTradeRoutes', 'embargoedRoutes', 'activeCharacterBonuses'] as const) {
      if (!Array.isArray(nation[key])) nation[key] = [];
    }
    nation.tech.researchProgress ??= null;
    if (nation.civilWar && !Array.isArray(nation.civilWar.rebels)) nation.civilWar.rebels = [];
  }
  for (const province of Object.values(next.provinces)) {
    if (legacyOceanCapital(next, province)) restoreCapitalTerrain(province);
    if (!Array.isArray(province.classes)) province.classes = [];
    setProvincePopulation(province, finite(province.population));
    if (!Array.isArray(province.buildings)) province.buildings = [];
    province.baseResources ??= {};
  }
  for (const war of next.wars) if (!Array.isArray(war.battleReports)) war.battleReports = [];
  next.pendingEventOptions ??= null;
  next.lastReport ??= null;
  return sanitizeTurnSnapshot(next, resourcePrecision);
}

/** The turn engine already owns an isolated snapshot. Reuse it for final settlement. */
export function sanitizeTurnSnapshot(next: GameState, resourcePrecision: 'round' | 'preserve' = 'round'): GameState {
  const resourceValue = resourcePrecision === 'round' ? (value: number) => Math.round(finite(value)) : finite;

  next.version = Math.max(1, Math.round(finite(next.version, 1)));
  next.turn = Math.max(0, Math.round(finite(next.turn)));
  next.seed = Math.round(finite(next.seed));
  next.entityIdCounter = Math.max(0, Math.round(finite(next.entityIdCounter)));
  next.bankruptTurns = Math.max(0, Math.round(finite(next.bankruptTurns)));
  next.lowStabilityTurns = Math.max(0, Math.round(finite(next.lowStabilityTurns)));
  next.victory = next.victory ?? { type: null };

  if (!next.playerNationId || !next.nations[next.playerNationId]) {
    const fallback = Object.values(next.nations).find((n) => !n.defeated) ?? Object.values(next.nations)[0];
    if (fallback) next.playerNationId = fallback.id;
  }

  for (const n of Object.values(next.nations)) {
    if (n.civilWar?.active) {
      const rebels = n.civilWar.rebels.filter((id) => next.nations[id]?.rebelOf === n.id);
      n.civilWar = { active: rebels.length > 0, rebels };
    }
    n.isPlayer = n.id === next.playerNationId;
    n.resources.gold = resourceValue(n.resources.gold);
    n.resources.food = resourceValue(n.resources.food);
    n.resources.wood = Math.max(0, resourceValue(n.resources.wood));
    n.resources.iron = Math.max(0, resourceValue(n.resources.iron));
    n.resources.adminPt = Math.max(0, resourceValue(n.resources.adminPt));
    n.resources.sciPt = Math.max(0, resourceValue(n.resources.sciPt));
    n.resources.influence = Math.max(0, resourceValue(n.resources.influence));
    n.resources.supply = Math.max(0, resourceValue(n.resources.supply));
    n.government.stability = clamp(finite(n.government.stability, 50), 0, 100);
    n.government.legitimacy = clamp(finite(n.government.legitimacy, 50), 0, 100);
    n.government.efficiency = clamp(finite(n.government.efficiency, 50), 0, 100);
    n.government.corruption = clamp(finite(n.government.corruption, 10), 0, 100);
    n.warExhaustion = clamp(finite(n.warExhaustion), 0, 100);
    n.influence = Math.max(0, Math.round(finite(n.influence)));
    n.factions = n.factions.map((f) => ({ ...f, power: clamp(finite(f.power, 10), 0, 100), satisfaction: clamp(finite(f.satisfaction, 50), 0, 100) }));
    n.army = n.army.filter((a) => a && finite(a.size) > 0);
  }

  const provincesByOwner = new Map<string, Province[]>();
  for (const p of Object.values(next.provinces)) {
    if (!isValidProvinceOwner(next, p.ownerId)) {
      const fallback = next.nations[next.playerNationId] ?? Object.values(next.nations)[0];
      if (fallback) p.ownerId = fallback.id;
    }
    p.population = Math.max(0, Math.round(finite(p.population)));
    if (!next.nations[p.ownerId]) p.isCapital = false;
    p.garrison = Math.max(0, Math.round(finite(p.garrison)));
    p.unrest = clamp(finite(p.unrest), 0, 100);
    p.rebellionRisk = clamp(finite(p.rebellionRisk), 0, 100);
    p.loyalty = clamp(finite(p.loyalty, 50), 0, 100);
    p.assimilation = clamp(finite(p.assimilation, 50), 0, 100);
    p.adjacent = [...new Set((Array.isArray(p.adjacent) ? p.adjacent : []).filter((id) => !!next.provinces[id] && id !== p.id))];
    p.classes = p.classes.map((c) => ({ ...c, count: Math.max(0, Math.round(finite(c.count))), satisfaction: clamp(finite(c.satisfaction, 50), 0, 100) }));
    const owned = provincesByOwner.get(p.ownerId);
    if (owned) owned.push(p);
    else provincesByOwner.set(p.ownerId, [p]);
  }

  for (const n of Object.values(next.nations)) {
    const owned = provincesByOwner.get(n.id) ?? [];
    const designated = next.provinces[n.capital];
    const fallback = designated?.ownerId === n.id ? designated : owned.find(p => p.isCapital) ?? owned[0];
    if (fallback) n.capital = fallback.id;
    for (const province of owned) province.isCapital = province === fallback;
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
    if (w.attackerId === w.defenderId || next.provinces[w.targetProvinceId].ownerId !== w.defenderId) return false;
    if (next.nations[w.attackerId].defeated || next.nations[w.defenderId].defeated) return false;
    const key = pairKey(w.attackerId, w.defenderId);
    if (seenWars.has(key)) return false;
    seenWars.add(key);
    w.progress = clamp(finite(w.progress), 0, 100);
    w.turns = Math.max(0, Math.round(finite(w.turns)));
    w.battleReports = w.battleReports.slice(-8);
    return true;
  });

  syncWarFlags(next);

  next.relations = sanitizeRelations(next.relations, next.nations, next.wars);

  const summitAgendas = new Set(['trade', 'security', 'normalization', 'technology']);
  const summitStances = new Set(['conciliatory', 'pragmatic', 'firm']);
  const summitOutcomes = new Set(['rejected', 'breakdown', 'stalemate', 'agreement', 'breakthrough']);
  next.diplomaticSummits = next.diplomaticSummits
    .filter((summit) =>
      summit
      && typeof summit.id === 'string'
      && !!next.nations[summit.initiatorId]
      && !!next.nations[summit.targetId]
      && summit.initiatorId !== summit.targetId
      && summitAgendas.has(summit.agenda)
      && summitStances.has(summit.stance)
      && summitOutcomes.has(summit.outcome),
    )
    .map((summit) => ({
      ...summit,
      turn: Math.round(clamp(finite(summit.turn), 0, next.turn)),
      score: clamp(Math.round(finite(summit.score, 50)), 0, 100),
      summary: String(summit.summary ?? ''),
      commitments: Array.isArray(summit.commitments)
        ? summit.commitments.filter((item): item is string => typeof item === 'string').slice(0, 8)
        : [],
    }))
    .slice(-120);

  const accordIds = new Set<string>();
  next.diplomaticAccords = next.diplomaticAccords.filter((accord) => {
    if (
      !accord
      || typeof accord.id !== 'string'
      || accordIds.has(accord.id)
      || !next.nations[accord.partyA]
      || !next.nations[accord.partyB]
      || accord.partyA === accord.partyB
      || !summitAgendas.has(accord.agenda)
      || ![1, 2].includes(accord.strength)
    ) return false;
    accordIds.add(accord.id);
    accord.startedTurn = Math.round(clamp(finite(accord.startedTurn), 0, next.turn));
    accord.expiresTurn = Math.max(accord.startedTurn, Math.round(finite(accord.expiresTurn, next.turn)));
    return accord.expiresTurn >= next.turn;
  });

  // Event history became nation-scoped after v5. Legacy unscoped entries belong
  // to the saved player; corrupt cross-references are discarded deterministically.
  next.triggeredEvents = next.triggeredEvents
    .filter((entry) =>
      entry
      && typeof entry.eventId === 'string'
      && (entry.nationId === undefined || !!next.nations[entry.nationId]),
    )
    .map((entry) => ({
      ...entry,
      nationId: entry.nationId ?? next.playerNationId,
      turn: Math.round(clamp(finite(entry.turn), 0, next.turn)),
      optionIndex: Math.max(0, Math.round(finite(entry.optionIndex))),
    }));

  const cooldownByKey = new Map<string, GameState['eventCooldowns'][number]>();
  for (const entry of next.eventCooldowns) {
    if (!entry || typeof entry.eventId !== 'string') continue;
    if (entry.nationId !== undefined && !next.nations[entry.nationId]) continue;
    const nationId = entry.nationId ?? next.playerNationId;
    const normalized = {
      nationId,
      eventId: entry.eventId,
      lastTriggeredTurn: Math.round(clamp(finite(entry.lastTriggeredTurn), 0, next.turn)),
    };
    const key = `${nationId}|${entry.eventId}`;
    const existing = cooldownByKey.get(key);
    const event = EVENT_BY_ID[entry.eventId];
    const stillRelevant = !!event && (
      event.unique
      || next.turn - normalized.lastTriggeredTurn < event.cooldown
    );
    if (stillRelevant && (!existing || normalized.lastTriggeredTurn > existing.lastTriggeredTurn)) {
      cooldownByKey.set(key, normalized);
    }
  }
  next.eventCooldowns = [...cooldownByKey.values()];

  next.pendingEvents = validPendingEvents(next);
  if (
    next.pendingEventOptions
    && (
      !next.nations[next.pendingEventOptions.nationId]
      || !EVENT_BY_ID[next.pendingEventOptions.eventId]
    )
  ) next.pendingEventOptions = null;
  next.history = next.history.slice(-12);
  for (const report of next.history) report.strategicNotes = Array.isArray(report.strategicNotes) ? report.strategicNotes.slice(-8) : [];
  if (next.lastReport) next.lastReport.strategicNotes = Array.isArray(next.lastReport.strategicNotes) ? next.lastReport.strategicNotes.slice(-8) : [];
  next.chronicle = next.chronicle.slice(-60);
  next._relMap = undefined;
  return next;
}
