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
  if (trigger.minTurn !== undefined && state.turn < trigger.minTurn) return false;
  if (trigger.maxTurn !== undefined && state.turn > trigger.maxTurn) return false;
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
  return true;
}

// 检查冷却与唯一性
function isAvailable(event: EventDef, nation: Nation, state: GameState): boolean {
  if (event.unique && state.triggeredEvents.some((t) => t.eventId === event.id)) return false;
  const cd = state.eventCooldowns.find((c) => c.eventId === event.id);
  if (cd && state.turn - cd.lastTriggeredTurn < event.cooldown) return false;
  return true;
}

// 每回合抽取要触发的事件（候选池 + 权重）
export function rollEvents(nation: Nation, state: GameState, rng: () => number, maxTrigger = 2): string[] {
  const candidates: { item: string; weight: number }[] = [];
  for (const e of EVENTS) {
    if (!isAvailable(e, nation, state)) continue;
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

// 应用事件效果
export function applyEffect(nation: Nation, effect: EventEffect, state: GameState): void {
  if (effect.gold) nation.resources.gold += effect.gold;
  if (effect.food) nation.resources.food += effect.food;
  if (effect.wood) nation.resources.wood += effect.wood;
  if (effect.iron) nation.resources.iron += effect.iron;
  if (effect.stability) nation.government.stability = clamp(nation.government.stability + effect.stability, 0, 100);
  if (effect.legitimacy) nation.government.legitimacy = clamp(nation.government.legitimacy + effect.legitimacy, 0, 100);
  if (effect.corruption) nation.government.corruption = clamp(nation.government.corruption + effect.corruption, 0, 100);
  if (effect.efficiency) nation.government.efficiency = clamp(nation.government.efficiency + effect.efficiency, 0, 100);
  if (effect.warExhaustion) nation.warExhaustion = clamp(nation.warExhaustion + effect.warExhaustion, 0, 100);
  if (effect.influence) nation.resources.influence += effect.influence;
  if (effect.taxRate) nation.taxRate = clamp(nation.taxRate + effect.taxRate, 0, 0.5);
  if (effect.adminPt) nation.resources.adminPt += effect.adminPt;
  if (effect.sciPt) nation.resources.sciPt += effect.sciPt;
  if (effect.relation) {
    const r = getRelationObj(nation.id, effect.relation!.target, state);
    if (r) r.relation = clamp(r.relation + effect.relation.delta, -100, 100);
  }
  if (effect.factionSat) {
    for (const fr of effect.factionSat) {
      const f = nation.factions.find((x) => x.id === fr.faction);
      if (f) f.satisfaction = clamp(f.satisfaction + fr.delta, 0, 100);
    }
  }
  if (effect.population) {
    // 从所有省份按比例扣/加
    const provs = provincesOf(nation.id, state.provinces);
    if (effect.population < 0) {
      const loss = -effect.population;
      let remaining = loss;
      for (const p of provs) {
        if (remaining <= 0) break;
        const take = Math.min(p.population, Math.round(remaining / provs.length));
        p.population -= take;
        remaining -= take;
      }
    } else {
      for (const p of provs) p.population += Math.round(effect.population / provs.length);
    }
  }
  // C1 事件链：选项触发下一事件，立即入队 pendingEvents
  if (effect.triggerEvent) {
    const nextEv = EVENT_BY_ID[effect.triggerEvent];
    if (nextEv && !state.pendingEvents.some((p) => p.eventId === effect.triggerEvent && p.nationId === nation.id)) {
      state.pendingEvents.push({ nationId: nation.id, eventId: effect.triggerEvent });
    }
  }
}

// AI 选择选项（按 aiWeight）
export function aiChooseOption(event: EventDef, rng: () => number): number {
  const items = event.options.map((o: { aiWeight?: number }, i: number) => ({ item: i, weight: o.aiWeight ?? 1 }));
  const pick = weightedPick<number>(rng, items);
  return pick ?? 0;
}

// 记录事件触发
export function recordEvent(state: GameState, nationId: string, eventId: string, optionIndex: number): void {
  state.triggeredEvents.push({ eventId, turn: state.turn, optionIndex });
  // 冷却记录（覆盖）
  const cd = state.eventCooldowns.find((c) => c.eventId === eventId);
  if (cd) cd.lastTriggeredTurn = state.turn;
  else state.eventCooldowns.push({ eventId, lastTriggeredTurn: state.turn });
}

export { EVENT_BY_ID, EVENTS, mulberry32 };
export type { FactionReaction, FactionId };
