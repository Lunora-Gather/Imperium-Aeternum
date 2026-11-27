// Imperium Aeternum — 回合结算引擎（5b 完整版）
// 入口：processTurn(gameState) → 新 GameState + TurnReport
// 接入 7 系统 engine + AI + 事件

import type { GameState, Nation, TurnReport, Province } from '../types/game';
import { clamp } from '../utils/math';
import { mulberry32 } from '../utils/random';
import { provincesOf } from './init';
import { applyEconomyResult, settleEconomyPure } from './economy';
import { settlePopulation } from './population';
import { applyLawPerTurnEffectFinals, lawPerTurnEffectsPure, overExtensionPenalty, settlePoliticsPure } from './politics';
import { applySettleWarsResult, settleWarsPure, type SettleWarsPureResult } from './military';
import { settleDiplomacy } from './diplomacy';
import { settleDiplomaticAccords } from './summits';
import { settleTechnology } from './technology';
import { settleCultureReligionPure } from './culture';
import { createEventAvailabilityIndex, resolvePendingEventsForAI, rollEvents, EVENT_BY_ID } from './events';
import { processAITurn } from './ai';
import { adjustTendency } from './formulas';
import { ageRulersPure, reignLegitimacy } from './dynasty';
import { applyPlayerFocus } from '../gameplay/strategyFocus';
import { detectBattleMilestones, detectMilestones } from './chronicle';
import { BEHAVIOR_MAP_BY_ACTION } from '../data/national-characters';
import { cloneGameState } from './stateClone';
import { collectPlayerProvinceChanges, collectWorldEvents, decayRebelNations } from './turnIntel';
import { runAITurnPhase } from './aiTurnPhase';
import { resolveFailuresAndRebellions } from './turnConsequences';
// 动态找玩家国家（兼容旧存档、经典剧本和世界剧本）
function findPlayerId(state: GameState): string {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  const player = Object.values(state.nations).find((nation) => nation.isPlayer && !nation.defeated);
  return player?.id ?? Object.keys(state.nations)[0];
}

export function yearEndChanges(prev: GameState, state: GameState, id: string, owned = provincesOf(id, state.provinces)) {
  const before = prev.nations[id], after = state.nations[id];
  let unrestDelta = 0;
  for (const p of owned) {
    const previous = prev.provinces[p.id];
    if (previous?.ownerId === id) unrestDelta += Math.round(p.unrest - previous.unrest);
  }
  return {
    unrestDelta,
    exhaustSnapshot: Math.round(after.warExhaustion),
    goldDelta: Math.round(after.resources.gold - before.resources.gold),
    foodDelta: Math.round(after.resources.food - before.resources.food),
    stabilityDelta: Math.round(after.government.stability - before.government.stability),
    legitimacyDelta: Math.round(after.government.legitimacy - before.government.legitimacy),
  };
}

export function nationWarnings(nation: Nation): string[] {
  const warnings: string[] = [];
  if (nation.resources.gold < 0) warnings.push('⚠ 国库赤字');
  if (nation.resources.food < 0) warnings.push('⚠ 粮食短缺');
  if (nation.government.stability < 20) warnings.push('⚠ 稳定度过低');
  if (nation.government.legitimacy < 25) warnings.push('⚠ 合法性危机');
  if (nation.warExhaustion > 70) warnings.push('⚠ 厌战高涨');
  for (const f of nation.factions) {
    if (f.satisfaction < 20) warnings.push(`⚠ ${f.id} 派系不满`);
  }
  return warnings;
}

function buildReport(
  nation: Nation, provs: Province[], state: GameState, prev: GameState,
  econ: ReturnType<typeof settleEconomyPure>,
  pop: { totalGrowth: number },
  cr: { rebellionTriggered: string[] },
  events: string[],
  worldEvents: string[],
  warUpdates: SettleWarsPureResult['warUpdates'],
): TurnReport {
  const warnings = nationWarnings(nation);
  if (cr.rebellionTriggered.length > 0) warnings.push(`⚠ ${cr.rebellionTriggered.length} 省叛乱`);

  // E23: 战争进展叙事——玩家参与的战争，本回合战报进展
  const warProgress: { target: string; progressDelta: number; outcome: string }[] = [];
  for (const war of prev.wars) {
    if (war.attackerId !== nation.id && war.defenderId !== nation.id) continue;
    const reports = warUpdates[war.id]?.battleReports;
    if (!reports?.length) continue;
    const battle = reports[reports.length - 1];
    const defending = war.defenderId === nation.id;
    const outcome = defending && battle.outcome !== 'stalemate' ? (battle.outcome === 'advance' ? 'repelled' : 'advance') : battle.outcome;
    warProgress.push({
      target: state.provinces[war.targetProvinceId]?.name ?? war.targetProvinceId,
      progressDelta: defending ? -battle.progressDelta : battle.progressDelta, outcome,
    });
  }

  // E23: 派系满意度变化（对比 prev）
  const prevNation = prev.nations[nation.id];
  const factionDelta: { id: string; delta: number }[] = [];
  if (prevNation) {
    for (const f of nation.factions) {
      const prevF = prevNation.factions.find((pf) => pf.id === f.id);
      if (prevF) {
        const d = Math.round(f.satisfaction - prevF.satisfaction);
        if (d !== 0) factionDelta.push({ id: f.id, delta: d });
      }
    }
  }

  return {
    turn: state.turn,
    nationId: nation.id,
    income: { tax: Math.round(econ.taxIncome), trade: Math.round(econ.tradeIncome), building: Math.round(econ.buildingIncome) },
    expense: { military: Math.round(econ.militaryExpense), corruption: Math.round(econ.corruptionLoss) },
    ...(econ.economicReturns && { economicReturns: econ.economicReturns }),
    ...yearEndChanges(prev, state, nation.id, provs),
    popDelta: Math.round(pop.totalGrowth),
    events,
    warnings,
    warProgress,
    factionDelta,
    worldEvents: worldEvents.slice(-10),  // A4: 上限 10 条防溢出
    provinceChanges: [],  // B2: 在 buildReport 外计算（需对比 prev/next 省份归属）
    strategicNotes: [],
  };
}

// 玩家行为 → 国家性格累积（store 调用）
export function recordPlayerAction(state: GameState, actionId: string): void {
  const playerId = findPlayerId(state);
  const player = state.nations[playerId];
  const map = BEHAVIOR_MAP_BY_ACTION[actionId];
  if (!map) return;
  for (const [k, v] of Object.entries(map.tendencyGain)) {
    adjustTendency(player.tendency, k as keyof typeof player.tendency, v as number);
  }
}

export { processAITurn };

// 唯一正式回合入口：先隔离输入，再按固定顺序结算各子系统。
// Pure 子引擎返回结构化差量；尚未迁移的复杂子系统只允许修改隔离后的 next。

export interface ProcessTurnOptions {
  /** Nations controlled by people in a shared world. They receive passive settlement but no AI orders. */
  humanNationIds?: readonly string[];
  /** Shared worlds do not end because one ruler reaches a single-player failure condition. */
  sharedWorld?: boolean;
  /** The local gameplay pipeline records national milestones after its final rewards and focus. */
  deferNationalMilestones?: boolean;
}

function settleRuler(next: GameState, playerId: string) {
  const player = next.nations[playerId];
  const playerProvs = provincesOf(playerId, next.provinces);

  // ── 玩家回合：6 子引擎 Pure 版本收集 deltas，合并到 next ──
  const econPure = settleEconomyPure(player, next, playerProvs);
  applyEconomyResult(player, econPure);
  for (const p of playerProvs) if (p.priorAgriBase !== undefined) delete p.priorAgriBase;
  const econ = econPure;  // EconomyPartial extends EconomyResult，可直接传 buildReport

  const foodShortage = econ.grain.shortageExpected;
  const pop = settlePopulation(player, playerProvs, foodShortage, true, player.atWar, false);

  const polPure = settlePoliticsPure(player, next, playerProvs);
  // 合并 politics gov finals（覆写值）
  player.government.stability = polPure.govFinal.stability;
  player.government.legitimacy = polPure.govFinal.legitimacy;
  player.government.corruption = polPure.govFinal.corruption;
  player.government.efficiency = polPure.govFinal.efficiency;
  for (const [facId, finalSat] of Object.entries(polPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }

  applyLawPerTurnEffectFinals(playerProvs, lawPerTurnEffectsPure(player, playerProvs));

  settleTechnology(player, next);

  const crPure = settleCultureReligionPure(player, next, playerProvs);
  for (const [provId, finals] of Object.entries(crPure.provFinal)) {
    const p = next.provinces[provId];
    if (!p) continue;
    p.assimilation = finals.assimilation;
    p.loyalty = finals.loyalty;
    p.rebellionRisk = finals.rebellionRisk;
  }
  const cr = crPure;  // CultureReligionPartial extends CultureReligionResult

  // 超管惩罚（与原版一致，直接 mutate）
  if (playerProvs.length > 0 && player.tier !== 'S') {
    const pen = overExtensionPenalty(player, playerProvs.length);
    const stabPen = player.tier === 'A' ? Math.min(pen.stabilityLoss, 2) : Math.min(pen.stabilityLoss, 5);
    const effPen = player.tier === 'A' ? Math.min(pen.taxEffLoss * 20, 5) : Math.min(pen.taxEffLoss * 20, 10);
    if (effPen > 0) player.government.efficiency = clamp(player.government.efficiency - effPen, 0, 100);
    if (stabPen > 0) player.government.stability = clamp(player.government.stability - stabPen, 0, 100);
  }

  return { playerProvs, econ, pop, cr, eventIds: [] as string[] };
}

export function processTurn(state: GameState, options: ProcessTurnOptions = {}): { state: GameState; report: TurnReport } {
  const rng = mulberry32(state.seed);
  const newSeed = Math.floor(rng() * 0xffffffff) >>> 0;

  let next = cloneGameState(state);
  if (options.sharedWorld) next.sharedChronicles ??= {};
  next.seed = newSeed;
  next.turn = state.turn + 1;

  const normalizedPlayerId = findPlayerId(next);
  next.playerNationId = normalizedPlayerId;
  for (const nation of Object.values(next.nations)) nation.isPlayer = nation.id === normalizedPlayerId;

  const playerId = findPlayerId(next);
  const humanIds = new Set(options.humanNationIds ?? []);
  const rulers = new Map([playerId, ...[...humanIds].sort().filter((id) =>
    id !== playerId && next.nations[id] && !next.nations[id].defeated)]
    .map((id) => [id, settleRuler(next, id)] as const));

  settleDiplomacy(next);
  settleDiplomaticAccords(next);
  const battles = settleWarsPure(next);
  applySettleWarsResult(next, battles);

  // 王朝系统先纯计算，再把结果合并到隔离后的 next。
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated) continue;
    const result = ageRulersPure(nation, rng);
    nation.ruler = result.rulerFinal;
    if (result.govLegitimacyDelta) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + result.govLegitimacyDelta, 0, 100);
    }
    const reignMod = reignLegitimacy(nation);
    if (reignMod !== 0) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + reignMod, 0, 100);
    }
  }

  const availableEvents = createEventAvailabilityIndex(next);
  for (const [id, settlement] of rulers) {
    const nation = next.nations[id];
    if (nation.defeated) continue;
    settlement.eventIds = rollEvents(nation, { ...next, playerNationId: id }, rng, 2, availableEvents);
    for (const eid of settlement.eventIds) {
      if (EVENT_BY_ID[eid] && !next.pendingEvents.some((p) => p.nationId === id && p.eventId === eid)) {
        next.pendingEvents.push({ nationId: id, eventId: eid });
      }
    }
    if (nation.govTransitionTurns && nation.govTransitionTurns > 0) nation.govTransitionTurns -= 1;
  }
  const aiCaretaker = !!options.sharedWorld && !humanIds.size;
  if (aiCaretaker) next.nations[playerId].isPlayer = false;
  runAITurnPhase(next, playerId, rng, { humanNationIds: humanIds, eventAvailability: availableEvents });
  if (aiCaretaker) {
    resolvePendingEventsForAI(next.nations[playerId], next, rng, undefined, availableEvents);
    next.nations[playerId].isPlayer = true;
  }

  // triggeredEvents 上限 1000
  if (next.triggeredEvents.length > 1000) {
    next.triggeredEvents = next.triggeredEvents.slice(-1000);
  }

  const eventsByNation = new Map([...rulers].map(([id, data]) =>
    [id, collectWorldEvents(state, next, id, data.playerProvs)] as const));
  if (!options.sharedWorld) resolveFailuresAndRebellions(next, playerId, state.nations[playerId].capital);
  decayRebelNations(next);
  const previousHistory = next.history;
  for (const [id, data] of rulers) {
    const isHuman = options.sharedWorld && humanIds.has(id);
    let focusNote;
    if (isHuman && !next.nations[id].defeated) {
      const focus = applyPlayerFocus(next, next.sharedFocuses?.[id] ?? 'balance', id);
      next = focus.state;
      focusNote = focus.note;
    }
    const report = buildReport(next.nations[id], provincesOf(id, next.provinces), next, state,
      data.econ, data.pop, data.cr, data.eventIds, eventsByNation.get(id)!, battles.warUpdates);
    if (focusNote) report.strategicNotes = [focusNote];
    report.provinceChanges = collectPlayerProvinceChanges(state, next, id);
    const history = [...(next.sharedHistories?.[id] ?? previousHistory.filter((r) => r.nationId === id)), report].slice(-10);
    if (isHuman) {
      (next.sharedHistories ??= {})[id] = history;
      const chronicle = next.sharedChronicles![id] ??= [];
      const ruler = { ...next, playerNationId: id, history, chronicle };
      detectMilestones(ruler, state);
      detectBattleMilestones(ruler, state, battles.warUpdates);
    }
    if (id === playerId) {
      next.lastReport = report;
      next.history = history;
    }
  }
  if (!options.sharedWorld) {
    if (!options.deferNationalMilestones) detectMilestones(next, state);
    detectBattleMilestones(next, state, battles.warUpdates);
  }
  return { state: next, report: next.lastReport! };
}

// 兼容既有测试与外部调用；现在唯一正式实现已经具备完整输入隔离。
/** @deprecated 兼容旧调用方；新代码请直接使用 processTurn。 */
export const processTurnPure = processTurn;
