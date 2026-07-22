// Imperium Aeternum — 回合结算引擎（5b 完整版）
// 入口：processTurn(gameState) → 新 GameState + TurnReport
// 接入 7 系统 engine + AI + 事件

import type { GameState, Nation, TurnReport, Province, TreatyType } from '../types/game';
import { clamp, avg } from '../utils/math';
import { mulberry32, weightedPick } from '../utils/random';
import { provincesOf } from './init';
import { applyEconomyResult, settleEconomyPure } from './economy';
import { settlePopulationPure } from './population';
import { applyLawPerTurnEffectFinals, lawPerTurnEffectsPure, overExtensionPenalty, settlePoliticsPure } from './politics';
import { applySettleWarsResult, settleWarsPure } from './military';
import { settleDiplomacyPure } from './diplomacy';
import { settleDiplomaticAccords } from './summits';
import { settleTechnologyPure } from './technology';
import { settleCultureReligionPure } from './culture';
import { rollEvents, EVENT_BY_ID } from './events';
import { processAITurn } from './ai';
import { adjustTendency } from './formulas';
import { ageRulersPure, reignLegitimacy } from './dynasty';
import { detectMilestones } from './chronicle';
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

function buildReport(
  nation: Nation, provs: Province[], state: GameState, prev: GameState,
  econ: { taxIncome: number; tradeIncome: number; buildingIncome: number; corruptionLoss: number; militaryExpense: number; foodProduced: number; foodConsumed: number },
  pol: { stabilityDelta: number; legitimacyDelta: number },
  pop: { totalGrowth: number },
  cr: { rebellionTriggered: string[] },
  events: string[],
  worldEvents: string[],
): TurnReport {
  const warnings: string[] = [];
  if (nation.resources.gold < 0) warnings.push('⚠ 国库赤字');
  if (nation.resources.food < 0) warnings.push('⚠ 粮食短缺');
  if (nation.government.stability < 20) warnings.push('⚠ 稳定度过低');
  if (nation.government.legitimacy < 25) warnings.push('⚠ 合法性危机');
  if (nation.warExhaustion > 70) warnings.push('⚠ 厌战高涨');
  if (cr.rebellionTriggered.length > 0) warnings.push(`⚠ ${cr.rebellionTriggered.length} 省叛乱`);
  for (const f of nation.factions) {
    if (f.satisfaction < 20) warnings.push(`⚠ ${f.id} 派系不满`);
  }

  // E23: 战争进展叙事——玩家参与的战争，本回合战报进展
  const warProgress: { target: string; progressDelta: number; outcome: string }[] = [];
  for (const w of state.wars) {
    if (w.attackerId !== nation.id && w.defenderId !== nation.id) continue;
    const prevWar = prev.wars.find((pw) => pw.id === w.id);
    const prevReports = prevWar?.battleReports ?? [];
    const newReports = (w.battleReports ?? []).slice(prevReports.length);
    for (const r of newReports) {
      const targetProv = state.provinces[w.targetProvinceId];
      warProgress.push({
        target: targetProv?.name ?? w.targetProvinceId,
        progressDelta: r.progressDelta,
        outcome: r.outcome,
      });
    }
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

  // P1 unrestDelta：本回合全国省份 unrest 总变化（对比 prev）
  let unrestDelta = 0;
  if (prevNation) {
    const prevProvs = Object.values(prev.provinces).filter((p) => p.ownerId === nation.id);
    for (const p of provs) {
      const prevP = prevProvs.find((pp) => pp.id === p.id);
      if (prevP) unrestDelta += Math.round(p.unrest - prevP.unrest);
    }
  }

  return {
    turn: state.turn,
    nationId: nation.id,
    income: { tax: Math.round(econ.taxIncome), trade: Math.round(econ.tradeIncome), building: Math.round(econ.buildingIncome) },
    expense: { military: Math.round(econ.militaryExpense), corruption: Math.round(econ.corruptionLoss) },
    foodDelta: Math.round(econ.foodProduced - econ.foodConsumed),
    popDelta: Math.round(pop.totalGrowth),
    stabilityDelta: Math.round(pol.stabilityDelta),
    legitimacyDelta: Math.round(pol.legitimacyDelta),
    unrestDelta,
    events,
    warnings,
    warProgress,
    factionDelta,
    exhaustSnapshot: Math.round(nation.warExhaustion),
    worldEvents: worldEvents.slice(-10),  // A4: 上限 10 条防溢出
    provinceChanges: [],  // B2: 在 buildReport 外计算（需对比 prev/next 省份归属）
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

export function processTurn(state: GameState): { state: GameState; report: TurnReport } {
  const rng = mulberry32(state.seed);
  const newSeed = Math.floor(rng() * 0xffffffff) >>> 0;

  const next = cloneGameState(state);
  next.seed = newSeed;
  next.turn = state.turn + 1;

  const normalizedPlayerId = findPlayerId(next);
  next.playerNationId = normalizedPlayerId;
  for (const nation of Object.values(next.nations)) nation.isPlayer = nation.id === normalizedPlayerId;

  const playerId = findPlayerId(next);
  const player = next.nations[playerId];
  const playerProvs = provincesOf(playerId, next.provinces);

  // ── 玩家回合：6 子引擎 Pure 版本收集 deltas，合并到 next ──
  const econPure = settleEconomyPure(player, next);
  applyEconomyResult(player, econPure);
  const econ = econPure;  // EconomyPartial extends EconomyResult，可直接传 buildReport

  const foodShortage = player.resources.food < playerProvs.reduce((s, p) => s + p.population, 0) * 0.4;
  const popPure = settlePopulationPure(player, playerProvs, foodShortage, true, player.atWar, false);
  // 合并 population deltas：popDelta 每省人口增量 + classSatDelta 每省每阶层 satisfaction 增量
  for (const [provId, popDelta] of Object.entries(popPure.popDelta)) {
    const p = next.provinces[provId];
    if (p) p.population = Math.max(10, p.population + popDelta);
  }
  for (const [provId, classDeltas] of Object.entries(popPure.classSatDelta)) {
    const p = next.provinces[provId];
    if (!p) continue;
    for (const [cls, delta] of Object.entries(classDeltas)) {
      const grp = p.classes.find((c) => c.classId === cls);
      if (grp) grp.satisfaction = clamp(grp.satisfaction + delta, 0, 100);
    }
  }
  for (const [facId, finalSat] of Object.entries(popPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }
  const pop = popPure;  // PopPartial extends PopSettleResult

  const polPure = settlePoliticsPure(player, next);
  // 合并 politics gov finals（覆写值）
  player.government.stability = polPure.govFinal.stability;
  player.government.legitimacy = polPure.govFinal.legitimacy;
  player.government.corruption = polPure.govFinal.corruption;
  player.government.efficiency = polPure.govFinal.efficiency;
  for (const [facId, finalSat] of Object.entries(polPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }
  const pol = polPure;  // PoliticsPartial extends PoliticsResult

  applyLawPerTurnEffectFinals(playerProvs, lawPerTurnEffectsPure(player, playerProvs));

  const techPure = settleTechnologyPure(player, next);
  player.resources.sciPt += techPure.deltaSciPt;
  player.resources.gold += techPure.deltaGold;
  if (techPure.researchProgressFinal !== null) {
    player.tech.researchProgress = techPure.researchProgressFinal;
  } else if (techPure.techLevelUp !== null) {
    player.tech.researchProgress = null;  // 完成，清空
    (player.tech as unknown as Record<string, unknown>)[techPure.techLevelUp.branch] = techPure.techLevelUp.level;
  }

  const crPure = settleCultureReligionPure(player, next);
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

  // 外交结算：Pure 版本收集 deltas，合并到 next
  const dipPure = settleDiplomacyPure(next);
  for (const r of next.relations) {
    const key = `${r.from}_${r.to}`;
    const f = dipPure.relationsFinal[key];
    if (f) {
      r.threat = f.threat;
      r.relation = f.relation;
      r.truceTurns = f.truceTurns;
      r.treaty = f.treaty as TreatyType;
    }
  }
  for (const [nid, govF] of Object.entries(dipPure.nationsGovFinal)) {
    const n = next.nations[nid];
    if (!n) continue;
    n.government.stability = govF.stability;
    n.government.legitimacy = govF.legitimacy;
  }
  for (const entry of dipPure.newChronicle) {
    next.chronicle.push({ ...entry });
  }

  settleDiplomaticAccords(next);
  applySettleWarsResult(next, settleWarsPure(next));

  // 王朝系统先纯计算，再把结果合并到隔离后的 next。
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated) continue;
    const result = ageRulersPure(nation, rng);
    nation.ruler = result.rulerFinal;
    if (result.govLegitimacyDelta) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + result.govLegitimacyDelta, 0, 100);
    }
    if (result.died && result.eventLog && nation.id === playerId) {
      pol.stabilityDelta -= 3;
    }
    const reignMod = reignLegitimacy(nation);
    if (reignMod !== 0) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + reignMod, 0, 100);
    }
  }

  // 玩家事件触发：保留原版本 mutate
  const playerEventIds = rollEvents(player, next, rng, 2);
  for (const eid of playerEventIds) {
    if (EVENT_BY_ID[eid] && !next.pendingEvents.some((pending) => pending.nationId === playerId && pending.eventId === eid)) {
      next.pendingEvents.push({ nationId: playerId, eventId: eid });
    }
  }
  if (player.govTransitionTurns && player.govTransitionTurns > 0) {
    player.govTransitionTurns -= 1;
  }

  runAITurnPhase(next, playerId, rng);

  // triggeredEvents 上限 1000
  if (next.triggeredEvents.length > 1000) {
    next.triggeredEvents = next.triggeredEvents.slice(-1000);
  }

  const worldEvents = collectWorldEvents(state, next, playerId, playerProvs);
  const report = buildReport(player, playerProvs, next, state, econ, pol, pop, cr, playerEventIds, worldEvents);
  resolveFailuresAndRebellions(next, playerId);
  // 判定与叛军衰减都可能改变归属，必须全部完成后再采集领土变化。
  decayRebelNations(next);
  report.provinceChanges = collectPlayerProvinceChanges(state, next, playerId);
  next.lastReport = report;
  next.history = [...next.history, report].slice(-10);
  detectMilestones(next, state);
  return { state: next, report };
}

// 兼容既有测试与外部调用；现在唯一正式实现已经具备完整输入隔离。
/** @deprecated 兼容旧调用方；新代码请直接使用 processTurn。 */
export const processTurnPure = processTurn;
