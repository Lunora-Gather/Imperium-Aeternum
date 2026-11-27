// Imperium Aeternum — 事件系统 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §15

import { setProvincePopulation } from './provincePopulation';
import type { GameState, Nation, Province } from '../types/game';
import type { EventDef, EventEffect, EventTrigger, FactionReaction } from '../data/events';
import { EVENTS, EVENT_BY_ID } from '../data/events';
import { weightedPick, pickWeightedEntry, mulberry32 } from '../utils/random';
import { provincesOf, getRelationObj } from './init';
import { clamp } from '../utils/math';
import type { FactionId } from '../data/factions';

// 判定触发条件是否满足
export function checkTrigger(trigger: EventTrigger, nation: Nation, state: GameState, owned?: Province[]): boolean {
  return matchesTurnAndWar(trigger, state.turn, nation.atWar) && meetsNationRequirements(trigger, nation, state, owned);
}

function matchesTurnAndWar(trigger: EventTrigger, turn: number, atWar: boolean): boolean {
  return (trigger.minTurn === undefined || turn >= trigger.minTurn)
    && (trigger.maxTurn === undefined || turn <= trigger.maxTurn)
    && !(trigger.atWar && !atWar) && !(trigger.notAtWar && atWar);
}

function meetsNationRequirements(trigger: EventTrigger, nation: Nation, state: GameState, owned?: Province[]): boolean {
  if (trigger.isPlayerOnly && nation.id !== state.playerNationId) return false;
  if (trigger.minGold !== undefined && nation.resources.gold < trigger.minGold) return false;
  if (trigger.minStability !== undefined && nation.government.stability < trigger.minStability) return false;
  if (trigger.maxStability !== undefined && nation.government.stability > trigger.maxStability) return false;
  if (trigger.maxLegitimacy !== undefined && nation.government.legitimacy > trigger.maxLegitimacy) return false;
  if (trigger.maxFoodRatio !== undefined) {
    const totalPop = (owned ?? provincesOf(nation.id, state.provinces)).reduce((s, p) => s + p.population, 0);
    const ratio = totalPop > 0 ? nation.resources.food / (totalPop * 0.8) : 1;
    if (ratio > trigger.maxFoodRatio) return false;
  }
  if (trigger.minCorruption !== undefined && nation.government.corruption < trigger.minCorruption) return false;
  if (trigger.minWarExhaustion !== undefined && nation.warExhaustion < trigger.minWarExhaustion) return false;
  if (trigger.hasNewTerritory) {
    // 修：真实检查——拥有非首都文化的省份视为新领土
    const cap = state.provinces[nation.capital];
    const hasNew = (owned ?? provincesOf(nation.id, state.provinces)).some((p) =>
      cap && p.id !== nation.capital && (p.culture !== cap.culture || p.religion !== cap.religion || p.assimilation < 80),
    );
    if (!hasNew) return false;
  }
  if (trigger.provinceCultureDiff) {
    const hasDiff = (owned ?? provincesOf(nation.id, state.provinces)).some((p) => {
      const cap = state.provinces[nation.capital];
      return cap && (p.culture !== cap.culture || p.religion !== cap.religion);
    });
    if (!hasDiff) return false;
  }
  if (trigger.factionSatBelow) {
    const f = nation.factions.find((x) => x.id === trigger.factionSatBelow!.faction);
    if (!f || f.satisfaction >= trigger.factionSatBelow.threshold) return false;
  }
  if (trigger.techLevelAbove) {
    if (nation.tech[trigger.techLevelAbove.branch] < trigger.techLevelAbove.level) return false;
  }
  if (trigger.relationBelow) {
    const r = getRelationObj(nation.id, trigger.relationBelow!.target, state);
    if (!r || r.relation >= trigger.relationBelow.threshold) return false;
  }
  // B8: 政体切换反扑窗口检测
  if (trigger.govTransitionActive) {
    if (!nation.govTransitionTurns || nation.govTransitionTurns <= 0) return false;
  }
  return true;
}

function recordBelongsToNation(
  record: { nationId?: string },
  nationId: string,
  state: GameState,
): boolean {
  // v4/v5 saves did not scope event history. Preserve that history for the
  // saved player without letting it suppress events for every AI nation.
  return record.nationId !== undefined
    ? record.nationId === nationId
    : nationId === state.playerNationId;
}

type Cooldown = GameState['eventCooldowns'][number];
type NationCooldowns = Map<string, { first: Cooldown; otherLastTurn: number }>;

export interface EventAvailabilityIndex {
  triggeredByNation: Map<string, Set<string>>;
  cooldownByNation: Map<string, NationCooldowns>;
}

function addTriggered(index: EventAvailabilityIndex, nationId: string, eventId: string): void {
  const events = index.triggeredByNation.get(nationId);
  if (events) events.add(eventId);
  else index.triggeredByNation.set(nationId, new Set([eventId]));
}

function indexCooldown(index: EventAvailabilityIndex, nationId: string, entry: Cooldown): void {
  let cooldowns = index.cooldownByNation.get(nationId);
  if (!cooldowns) {
    cooldowns = new Map();
    index.cooldownByNation.set(nationId, cooldowns);
  }
  const previous = cooldowns.get(entry.eventId);
  // Legacy duplicates are updated at the first row but availability uses the latest turn.
  if (previous) previous.otherLastTurn = Math.max(previous.otherLastTurn, entry.lastTriggeredTurn);
  else cooldowns.set(entry.eventId, { first: entry, otherLastTurn: -Infinity });
}

export function createEventAvailabilityIndex(state: GameState): EventAvailabilityIndex {
  const index: EventAvailabilityIndex = {
    triggeredByNation: new Map(),
    cooldownByNation: new Map(),
  };
  for (const entry of state.triggeredEvents) {
    addTriggered(index, entry.nationId ?? state.playerNationId, entry.eventId);
  }
  for (const entry of state.eventCooldowns) {
    indexCooldown(index, entry.nationId ?? state.playerNationId, entry);
  }
  return index;
}

// 检查冷却与唯一性
export function isEventAvailable(
  event: EventDef,
  nation: Nation,
  state: GameState,
  availability = createEventAvailabilityIndex(state),
): boolean {
  return availableInHistory(event, state.turn, availability.cooldownByNation.get(nation.id), availability.triggeredByNation.get(nation.id));
}

function availableInHistory(event: EventDef, turn: number, cooldowns?: NationCooldowns, triggered?: Set<string>): boolean {
  const cooldown = cooldowns?.get(event.id);
  // Cooldown records are not subject to the 1000-entry recent-event log cap,
  // so they are the durable unique-event source of truth. Triggered history is
  // retained as a compatibility fallback for legacy or partially recovered saves.
  if (event.unique && (
    cooldown !== undefined
    || triggered?.has(event.id)
  )) return false;
  if (cooldown && turn - Math.max(cooldown.first.lastTriggeredTurn, cooldown.otherLastTurn) < event.cooldown) return false;
  return true;
}

// 每回合抽取要触发的事件（候选池 + 权重）
const randomEvents = EVENTS.filter(event => event.weight > 0);
let drawPools: { turn: number; war: EventDef[]; peace: EventDef[] } | undefined;

function eventPool(turn: number, atWar: boolean) {
  // All nations in the same year share these two ordered lists. Keep only the
  // current year so a loaded campaign or a long game needs no cache cleanup.
  if (drawPools?.turn !== turn) {
    drawPools = { turn,
      war: randomEvents.filter(event => matchesTurnAndWar(event.trigger, turn, true)),
      peace: randomEvents.filter(event => matchesTurnAndWar(event.trigger, turn, false)),
    };
  }
  return atWar ? drawPools.war : drawPools.peace;
}

export function rollEvents(
  nation: Nation,
  state: GameState,
  rng: () => number,
  maxTrigger = 2,
  availability = createEventAvailabilityIndex(state),
  owned = provincesOf(nation.id, state.provinces),
): string[] {
  const candidates: EventDef[] = [];
  const cooldowns = availability.cooldownByNation.get(nation.id);
  const triggered = availability.triggeredByNation.get(nation.id);
  for (const event of eventPool(state.turn, nation.atWar)) {
    if (!meetsNationRequirements(event.trigger, nation, state, owned)) continue;
    if (availableInHistory(event, state.turn, cooldowns, triggered)) candidates.push(event);
  }
  const out: string[] = [];
  while (out.length < maxTrigger && candidates.length) {
    const pick = pickWeightedEntry(rng, candidates);
    if (!pick) break;
    out.push(pick.id);
    if (out.length < maxTrigger) candidates.splice(candidates.indexOf(pick), 1);
  }
  return out;
}

// AI 选择选项（按 aiWeight）
export function aiChooseOption(event: EventDef, rng: () => number): number {
  const items = event.options.map((o: { aiWeight?: number }, i: number) => ({ item: i, weight: o.aiWeight ?? 1 }));
  const pick = weightedPick<number>(rng, items);
  return pick ?? 0;
}

/** Resolves chained events for AI nations so AI-only pending queues cannot leak forever. */
export function resolvePendingEventsForAI(nation: Nation, state: GameState, rng: () => number, maxChain = 8, availability?: EventAvailabilityIndex): string[] {
  const resolved: string[] = [];
  const seen = new Set<string>();
  for (let step = 0; step < maxChain; step += 1) {
    const index = state.pendingEvents.findIndex((pending) => pending.nationId === nation.id);
    if (index < 0) break;
    const pending = state.pendingEvents[index];
    state.pendingEvents.splice(index, 1);
    if (seen.has(pending.eventId)) continue;
    seen.add(pending.eventId);
    const event = EVENT_BY_ID[pending.eventId];
    if (!event) continue;
    const optionIndex = aiChooseOption(event, rng);
    const option = event.options[optionIndex];
    if (option) applyEffect(nation, option.effects, state, availability);
    recordEvent(state, nation.id, event.id, optionIndex, availability);
    resolved.push(event.id);
  }
  // Malformed cyclic chains must not leave an invisible AI queue behind.
  state.pendingEvents = state.pendingEvents.filter((pending) => pending.nationId !== nation.id);
  return resolved;
}

// ── C1 纯函数版本（不 mutate，返回 delta/final 供 processTurn 合并） ──

// applyEffectPure：返回资源增量、受限值终值、关系/派系/人口覆盖与新待决事件。
export interface ApplyEffectPureResult {
  resourceDeltas: Partial<Record<'gold' | 'food' | 'wood' | 'iron' | 'influence' | 'adminPt' | 'sciPt', number>>;
  warExhaustionFinal?: number;
  taxRateFinal?: number;
  assimilationModFinal?: number;
  govFinal?: { stability?: number; legitimacy?: number; corruption?: number; efficiency?: number };
  relationOverrides: Record<string, { relation: number }>; // key=`${from}->${to}`
  factionSatFinals: Record<string, number>; // factionId → final satisfaction
  provPopDeltas: Record<string, number>; // provId → population delta
  newPendingEvents: { nationId: string; eventId: string }[];
}

export function applyEffectPure(
  nation: Nation,
  effect: EventEffect,
  state: GameState,
  availability?: EventAvailabilityIndex,
): ApplyEffectPureResult {
  const res: ApplyEffectPureResult = {
    resourceDeltas: {}, relationOverrides: {}, factionSatFinals: {}, provPopDeltas: {}, newPendingEvents: [],
  };
  if (effect.gold) res.resourceDeltas.gold = effect.gold;
  if (effect.food) res.resourceDeltas.food = effect.food;
  // Only the treasury and granary can carry a deficit into the next turn.
  for (const key of ['wood', 'iron', 'influence', 'adminPt', 'sciPt'] as const) {
    const delta = effect[key];
    if (delta) res.resourceDeltas[key] = Math.max(delta, -nation.resources[key]);
  }
  if (effect.warExhaustion) res.warExhaustionFinal = clamp(nation.warExhaustion + effect.warExhaustion, 0, 100);
  if (effect.taxRate) res.taxRateFinal = clamp(nation.taxRate + effect.taxRate, 0, 0.5);
  if (effect.assimilationMod) {
    res.assimilationModFinal = (nation.policyMods?.assimilationMod ?? 0) + effect.assimilationMod;
  }
  const govF: ApplyEffectPureResult['govFinal'] = {};
  if (effect.stability) govF.stability = clamp(nation.government.stability + effect.stability, 0, 100);
  if (effect.legitimacy) govF.legitimacy = clamp(nation.government.legitimacy + effect.legitimacy, 0, 100);
  if (effect.corruption) govF.corruption = clamp(nation.government.corruption + effect.corruption, 0, 100);
  if (effect.efficiency) govF.efficiency = clamp(nation.government.efficiency + effect.efficiency, 0, 100);
  if (Object.keys(govF).length > 0) res.govFinal = govF;
  if (effect.relation) {
    const r = getRelationObj(nation.id, effect.relation!.target, state);
    if (r) res.relationOverrides[`${nation.id}->${effect.relation!.target}`] = { relation: clamp(r.relation + effect.relation.delta, -100, 100) };
  }
  if (effect.factionSat) {
    for (const fr of effect.factionSat) {
      const f = nation.factions.find((x) => x.id === fr.faction);
      if (f) res.factionSatFinals[fr.faction] = clamp(f.satisfaction + fr.delta, 0, 100);
    }
  }
  if (effect.population) {
    const provs = provincesOf(nation.id, state.provinces).filter(p => p.terrain !== 'ocean');
    const populationDelta = Math.round(effect.population);
    if (populationDelta < 0 && provs.length > 0) {
      let remaining = -populationDelta;
      const share = Math.floor(remaining / provs.length);
      const remainder = remaining % provs.length;
      // Settle scarce provinces first only if the usual map-order split would overdraw one.
      if (provs.some((p, i) => p.population < share + (i < remainder ? 1 : 0))) {
        provs.sort((a, b) => a.population - b.population);
      }
      for (let index = 0; index < provs.length && remaining > 0; index += 1) {
        const province = provs[index];
        const take = Math.min(Math.max(0, province.population), Math.ceil(remaining / (provs.length - index)));
        if (take > 0) res.provPopDeltas[province.id] = -take;
        remaining -= take;
      }
    } else if (populationDelta > 0 && provs.length > 0) {
      const perProvince = Math.floor(populationDelta / provs.length);
      let remainder = populationDelta % provs.length;
      for (const province of provs) {
        const delta = perProvince + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        if (delta !== 0) res.provPopDeltas[province.id] = delta;
      }
    }
  }
  if (effect.triggerEvent) {
    const nextEv = EVENT_BY_ID[effect.triggerEvent];
    const alreadyQueued = state.pendingEvents.some((pending) =>
      pending.eventId === effect.triggerEvent && pending.nationId === nation.id,
    );
    const alreadyResolvedThisTurn = state.triggeredEvents.some((entry) =>
      entry.eventId === effect.triggerEvent
      && entry.turn === state.turn
      && recordBelongsToNation(entry, nation.id, state),
    );
    if (nextEv && !alreadyQueued && !alreadyResolvedThisTurn &&
        ((!nextEv.unique && !nextEv.cooldown) || isEventAvailable(nextEv, nation, state, availability))) {
      res.newPendingEvents.push({ nationId: nation.id, eventId: effect.triggerEvent });
    }
  }
  return res;
}

export function applyEffectResult(nation: Nation, state: GameState, result: ApplyEffectPureResult): void {
  const resources = ['gold', 'food', 'wood', 'iron', 'influence', 'adminPt', 'sciPt'] as const;
  for (const resource of resources) {
    const delta = result.resourceDeltas[resource];
    if (delta !== undefined) nation.resources[resource] += delta;
  }
  if (result.warExhaustionFinal !== undefined) nation.warExhaustion = result.warExhaustionFinal;
  if (result.taxRateFinal !== undefined) nation.taxRate = result.taxRateFinal;
  if (result.assimilationModFinal !== undefined) {
    nation.policyMods ??= {};
    nation.policyMods.assimilationMod = result.assimilationModFinal;
  }
  if (result.govFinal) Object.assign(nation.government, result.govFinal);
  for (const [key, final] of Object.entries(result.relationOverrides)) {
    const separator = key.indexOf('->');
    const relation = separator >= 0
      ? getRelationObj(key.slice(0, separator), key.slice(separator + 2), state)
      : undefined;
    if (relation) relation.relation = final.relation;
  }
  for (const [factionId, satisfaction] of Object.entries(result.factionSatFinals)) {
    const faction = nation.factions.find((entry) => entry.id === factionId);
    if (faction) faction.satisfaction = satisfaction;
  }
  for (const [provinceId, delta] of Object.entries(result.provPopDeltas)) {
    const province = state.provinces[provinceId];
    if (province) setProvincePopulation(province, province.population + delta);
  }
  state.pendingEvents.push(...result.newPendingEvents);
}

// Mutable compatibility boundary; all event-effect rules live in applyEffectPure.
export function applyEffect(nation: Nation, effect: EventEffect, state: GameState, availability?: EventAvailabilityIndex): void {
  applyEffectResult(nation, state, applyEffectPure(nation, effect, state, availability));
}

// recordEventPure：返回新 triggeredEvents 条目 + cooldown 更新（覆盖或新增）
export interface RecordEventPureResult {
  newTriggeredEntry: { nationId: string; eventId: string; turn: number; optionIndex: number };
  cooldownUpdate: { nationId: string; eventId: string; lastTriggeredTurn: number; isNew: boolean };
}

function findCooldown(state: GameState, nationId: string, eventId: string, index?: EventAvailabilityIndex) {
  return index ? index.cooldownByNation.get(nationId)?.get(eventId)?.first
    : state.eventCooldowns.find(entry => entry.eventId === eventId && recordBelongsToNation(entry, nationId, state));
}

export function recordEventPure(state: GameState, nationId: string, eventId: string, optionIndex: number, index?: EventAvailabilityIndex): RecordEventPureResult {
  const existing = findCooldown(state, nationId, eventId, index);
  return {
    newTriggeredEntry: { nationId, eventId, turn: state.turn, optionIndex },
    cooldownUpdate: { nationId, eventId, lastTriggeredTurn: state.turn, isNew: !existing },
  };
}

export function applyRecordEventResult(state: GameState, result: RecordEventPureResult, index?: EventAvailabilityIndex): void {
  state.triggeredEvents.push(result.newTriggeredEntry);
  const update = result.cooldownUpdate;
  const existing = findCooldown(state, update.nationId, update.eventId, index);
  if (existing) {
    existing.nationId = update.nationId;
    existing.lastTriggeredTurn = update.lastTriggeredTurn;
  } else {
    const entry = { nationId: update.nationId, eventId: update.eventId, lastTriggeredTurn: update.lastTriggeredTurn };
    state.eventCooldowns.push(entry);
    if (index) indexCooldown(index, update.nationId, entry);
  }
}

// Mutable compatibility boundary; all event-history rules live in recordEventPure.
export function recordEvent(state: GameState, nationId: string, eventId: string, optionIndex: number, index?: EventAvailabilityIndex): void {
  applyRecordEventResult(state, recordEventPure(state, nationId, eventId, optionIndex, index), index);
}

export { EVENT_BY_ID, EVENTS, mulberry32 };
export type { FactionReaction, FactionId };
