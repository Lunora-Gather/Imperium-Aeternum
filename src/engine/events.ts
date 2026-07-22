// Imperium Aeternum — 事件系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §15

import type { GameState, Nation } from '../types/game';
import type { EventDef, EventEffect, EventTrigger, FactionReaction } from '../data/events';
import { EVENTS, EVENT_BY_ID } from '../data/events';
import { weightedPick, mulberry32 } from '../utils/random';
import { provincesOf, getRelationObj } from './init';
import { clamp } from '../utils/math';
import type { FactionId } from '../data/factions';

// 判定触发条件是否满足
export function checkTrigger(trigger: EventTrigger, nation: Nation, state: GameState): boolean {
  if (trigger.isPlayerOnly && nation.id !== state.playerNationId) return false;
  if (trigger.minTurn !== undefined && state.turn < trigger.minTurn) return false;
  if (trigger.maxTurn !== undefined && state.turn > trigger.maxTurn) return false;
  if (trigger.minGold !== undefined && nation.resources.gold < trigger.minGold) return false;
  if (trigger.minStability !== undefined && nation.government.stability < trigger.minStability) return false;
  if (trigger.maxStability !== undefined && nation.government.stability > trigger.maxStability) return false;
  if (trigger.maxLegitimacy !== undefined && nation.government.legitimacy > trigger.maxLegitimacy) return false;
  if (trigger.maxFoodRatio !== undefined) {
    const totalPop = provincesOf(nation.id, state.provinces).reduce((s, p) => s + p.population, 0);
    const ratio = totalPop > 0 ? nation.resources.food / (totalPop * 0.8) : 1;
    if (ratio > trigger.maxFoodRatio) return false;
  }
  if (trigger.minCorruption !== undefined && nation.government.corruption < trigger.minCorruption) return false;
  if (trigger.minWarExhaustion !== undefined && nation.warExhaustion < trigger.minWarExhaustion) return false;
  if (trigger.atWar && !nation.atWar) return false;
  if (trigger.notAtWar && nation.atWar) return false;
  if (trigger.hasNewTerritory) {
    // 修：真实检查——拥有非首都文化的省份视为新领土
    const cap = state.provinces[nation.capital];
    const hasNew = provincesOf(nation.id, state.provinces).some((p) =>
      cap && p.id !== nation.capital && (p.culture !== cap.culture || p.religion !== cap.religion || p.assimilation < 80),
    );
    if (!hasNew) return false;
  }
  if (trigger.provinceCultureDiff) {
    const hasDiff = provincesOf(nation.id, state.provinces).some((p) => {
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

export interface EventAvailabilityIndex {
  triggeredByNation: Map<string, Set<string>>;
  cooldownByNation: Map<string, Map<string, number>>;
}

function addTriggered(index: EventAvailabilityIndex, nationId: string, eventId: string): void {
  const events = index.triggeredByNation.get(nationId);
  if (events) events.add(eventId);
  else index.triggeredByNation.set(nationId, new Set([eventId]));
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
    const nationId = entry.nationId ?? state.playerNationId;
    const cooldowns = index.cooldownByNation.get(nationId);
    if (cooldowns) {
      cooldowns.set(entry.eventId, Math.max(cooldowns.get(entry.eventId) ?? -Infinity, entry.lastTriggeredTurn));
    } else {
      index.cooldownByNation.set(nationId, new Map([[entry.eventId, entry.lastTriggeredTurn]]));
    }
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
  const cooldownTurn = availability.cooldownByNation.get(nation.id)?.get(event.id);
  // Cooldown records are not subject to the 1000-entry recent-event log cap,
  // so they are the durable unique-event source of truth. Triggered history is
  // retained as a compatibility fallback for legacy or partially recovered saves.
  if (event.unique && (
    cooldownTurn !== undefined
    || availability.triggeredByNation.get(nation.id)?.has(event.id)
  )) return false;
  if (cooldownTurn !== undefined && state.turn - cooldownTurn < event.cooldown) return false;
  return true;
}

// 每回合抽取要触发的事件（候选池 + 权重）
export function rollEvents(
  nation: Nation,
  state: GameState,
  rng: () => number,
  maxTrigger = 2,
  availability = createEventAvailabilityIndex(state),
): string[] {
  const candidates: { item: string; weight: number }[] = [];
  for (const e of EVENTS) {
    if (!isEventAvailable(e, nation, state, availability)) continue;
    if (!checkTrigger(e.trigger, nation, state)) continue;
    candidates.push({ item: e.id, weight: e.weight });
  }
  if (candidates.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < Math.min(maxTrigger, candidates.length); i++) {
    const pick = weightedPick(rng, candidates.filter((c) => !out.includes(c.item)));
    if (!pick) break;
    out.push(pick);
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
export function resolvePendingEventsForAI(nation: Nation, state: GameState, rng: () => number, maxChain = 8): string[] {
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
    if (option) applyEffect(nation, option.effects, state);
    recordEvent(state, nation.id, event.id, optionIndex);
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
): ApplyEffectPureResult {
  const res: ApplyEffectPureResult = {
    resourceDeltas: {}, relationOverrides: {}, factionSatFinals: {}, provPopDeltas: {}, newPendingEvents: [],
  };
  if (effect.gold) res.resourceDeltas.gold = effect.gold;
  if (effect.food) res.resourceDeltas.food = effect.food;
  if (effect.wood) res.resourceDeltas.wood = effect.wood;
  if (effect.iron) res.resourceDeltas.iron = effect.iron;
  if (effect.influence) res.resourceDeltas.influence = effect.influence;
  if (effect.adminPt) res.resourceDeltas.adminPt = effect.adminPt;
  if (effect.sciPt) res.resourceDeltas.sciPt = effect.sciPt;
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
    const provs = provincesOf(nation.id, state.provinces);
    const populationDelta = Math.round(effect.population);
    if (populationDelta < 0) {
      let remaining = Math.min(
        -populationDelta,
        provs.reduce((sum, province) => sum + Math.max(0, province.population), 0),
      );
      for (let index = 0; index < provs.length && remaining > 0; index += 1) {
        const province = provs[index];
        const remainingProvinceCount = provs.length - index;
        const take = Math.min(
          Math.max(0, province.population),
          Math.ceil(remaining / remainingProvinceCount),
        );
        res.provPopDeltas[province.id] = (res.provPopDeltas[province.id] ?? 0) - take;
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
    if (nextEv && !alreadyQueued && !alreadyResolvedThisTurn) {
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
    if (province) province.population = Math.max(0, province.population + delta);
  }
  state.pendingEvents.push(...result.newPendingEvents);
}

// Mutable compatibility boundary; all event-effect rules live in applyEffectPure.
export function applyEffect(nation: Nation, effect: EventEffect, state: GameState): void {
  applyEffectResult(nation, state, applyEffectPure(nation, effect, state));
}

// recordEventPure：返回新 triggeredEvents 条目 + cooldown 更新（覆盖或新增）
export interface RecordEventPureResult {
  newTriggeredEntry: { nationId: string; eventId: string; turn: number; optionIndex: number };
  cooldownUpdate: { nationId: string; eventId: string; lastTriggeredTurn: number; isNew: boolean };
}

export function recordEventPure(state: GameState, nationId: string, eventId: string, optionIndex: number): RecordEventPureResult {
  const existing = state.eventCooldowns.find((entry) =>
    entry.eventId === eventId && recordBelongsToNation(entry, nationId, state),
  );
  return {
    newTriggeredEntry: { nationId, eventId, turn: state.turn, optionIndex },
    cooldownUpdate: { nationId, eventId, lastTriggeredTurn: state.turn, isNew: !existing },
  };
}

export function applyRecordEventResult(state: GameState, result: RecordEventPureResult): void {
  state.triggeredEvents.push(result.newTriggeredEntry);
  const update = result.cooldownUpdate;
  const existing = state.eventCooldowns.find((entry) =>
    entry.eventId === update.eventId && recordBelongsToNation(entry, update.nationId, state),
  );
  if (existing) {
    existing.nationId = update.nationId;
    existing.lastTriggeredTurn = update.lastTriggeredTurn;
  } else {
    state.eventCooldowns.push({
      nationId: update.nationId,
      eventId: update.eventId,
      lastTriggeredTurn: update.lastTriggeredTurn,
    });
  }
}

// Mutable compatibility boundary; all event-history rules live in recordEventPure.
export function recordEvent(state: GameState, nationId: string, eventId: string, optionIndex: number): void {
  applyRecordEventResult(state, recordEventPure(state, nationId, eventId, optionIndex));
}

export { EVENT_BY_ID, EVENTS, mulberry32 };
export type { FactionReaction, FactionId };
