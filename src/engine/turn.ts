// Imperium Aeternum — 回合结算引擎（5b 完整版）
// 入口：processTurn(gameState) → 新 GameState + TurnReport
// 接入 7 系统 engine + AI + 事件

import type { GameState, Nation, TurnReport, Province } from '../types/game';
import { clamp, avg } from '../utils/math';
import { mulberry32, weightedPick } from '../utils/random';
import { provincesOf } from './init';
import { settleEconomy } from './economy';
import { settlePopulation } from './population';
import { settlePolitics, overExtensionPenalty, lawPerTurnEffects } from './politics';
import { settleWars } from './military';
import { settleDiplomacy } from './diplomacy';
import { settleTechnology } from './technology';
import { settleCultureReligion } from './culture';
import { rollEvents, applyEffect, aiChooseOption, recordEvent, EVENT_BY_ID } from './events';
import { processAITurn } from './ai';
import { adjustTendency, activateTendency } from './formulas';
import { ageRulers, reignLegitimacy } from './dynasty';
import { detectMilestones, addChronicle } from './chronicle';
import { BEHAVIOR_MAP_BY_ACTION } from '../data/national-characters';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId } from '../data/national-characters';
import { PLAYER_ID } from '../data/nations';

// 动态找玩家国家（兼容旧 5 国和新 192 国世界）
function findPlayerId(state: GameState): string {
  // 优先用旧常量（5 国模式）
  if (state.nations[PLAYER_ID]) return PLAYER_ID;
  // 否则从 state 中找 isPlayer
  const p = Object.values(state.nations).find((n) => n.isPlayer);
  return p ? p.id : Object.keys(state.nations)[0];
}

export function processTurn(state: GameState): { state: GameState; report: TurnReport } {
  const rng = mulberry32(state.seed);
  const newSeed = Math.floor(rng() * 0xffffffff) >>> 0;

  const next: GameState = {
    ...state,
    seed: newSeed,
    turn: state.turn + 1,
    nations: { ...state.nations },
    provinces: { ...state.provinces },
    relations: [...state.relations],
    wars: [...state.wars],
  };

  // 玩家回合：先结算所有系统
  const playerId = findPlayerId(next);
  const player = next.nations[playerId];
  const playerProvs = provincesOf(playerId, next.provinces);

  const econ = settleEconomy(player, next);
  const foodShortage = player.resources.food < playerProvs.reduce((s, p) => s + p.population, 0) * 0.4;
  const pop = settlePopulation(player, playerProvs, foodShortage, true, player.atWar, false);
  const pol = settlePolitics(player, next);
  lawPerTurnEffects(player, playerProvs);  // C2: 法律每回合效果（不满/叛乱削减）
  settleTechnology(player, next);
  const cr = settleCultureReligion(player, next);

  // 超管惩罚（W-fix: A/S级豁免超管，D级补贴基础收入）
  if (playerProvs.length > 0 && player.tier !== 'S') {
    const pen = overExtensionPenalty(player, playerProvs.length);
    const stabPen = player.tier === 'A' ? Math.min(pen.stabilityLoss, 2) : Math.min(pen.stabilityLoss, 5);
    const effPen = player.tier === 'A' ? Math.min(pen.taxEffLoss * 20, 5) : Math.min(pen.taxEffLoss * 20, 10);
    if (effPen > 0) player.government.efficiency = clamp(player.government.efficiency - effPen, 0, 100);
    if (stabPen > 0) player.government.stability = clamp(player.government.stability - stabPen, 0, 100);
  }

  // 外交结算
  settleDiplomacy(next);

  // 战争结算
  settleWars(next);

  // 王朝系统：所有统治者 aging + 死亡继承 + 在位合法性
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated) continue;
    const result = ageRulers(nation, rng);
    if (result.died && result.eventLog) {
      // 玩家死亡记入报告
      if (nation.id === playerId) {
        pol.stabilityDelta -= 3; // 国丧冲击
      }
    }
    // 在位年数影响合法性
    const reignMod = reignLegitimacy(nation);
    if (reignMod !== 0) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + reignMod, 0, 100);
    }
  }

  // 玩家事件触发（候选池 + 抽取）
  const playerEventIds = rollEvents(player, next, rng, 2);
  for (const eid of playerEventIds) {
    const ev = EVENT_BY_ID[eid];
    if (!ev) continue;
    // AI 自动选择权重最高的选项（5c UI 会改为玩家手选；5b 自动）
    const optIdx = aiChooseOption(ev, rng);
    const opt = ev.options[optIdx];
    if (opt) applyEffect(player, opt.effects, next);
    recordEvent(next, playerId, eid, optIdx);
  }

  // AI 国家回合
  processAITurn(next);

  // E9: 预算 provsByOwner 局部索引（消除 192 国 × 全省扫描）
  const provsByOwner = new Map<string, Province[]>();
  for (const p of Object.values(next.provinces)) {
    const arr = provsByOwner.get(p.ownerId);
    if (arr) arr.push(p); else provsByOwner.set(p.ownerId, [p]);
  }

  // AI 国家也结算（简化：只跑经济/政治/科技/外交）
  // E9: 合并三次 Object.values(nations) 遍历为一次
  const allNations = Object.values(next.nations) as Nation[];
  for (const n of allNations) {
    if (n.isPlayer || n.defeated) continue;
    const nProvs = provsByOwner.get(n.id) ?? [];
    if (nProvs.length === 0) continue;
    settleEconomy(n, next);
    settlePopulation(n, nProvs, n.resources.food < nProvs.reduce((s, p) => s + p.population, 0) * 0.4, true, n.atWar, false);
    settlePolitics(n, next);
    lawPerTurnEffects(n, nProvs);  // C2: AI 法律每回合效果
    settleTechnology(n, next);
    settleCultureReligion(n, next);
    // W-fix: AI 每回合自动涨 influence（否则永远不够建贸易/外交）
    n.resources.influence = Math.min(n.resources.influence + 3, 100);
    // AI 事件触发并自动选
    const aiEvents = rollEvents(n, next, rng, 1);
    for (const eid of aiEvents) {
      const ev = EVENT_BY_ID[eid];
      if (!ev) continue;
      const optIdx = aiChooseOption(ev, rng);
      const opt = ev.options[optIdx];
      if (opt) applyEffect(n, opt.effects, next);
      recordEvent(next, n.id, eid, optIdx);
    }

    // E9: 国家性格倾向自然漂移（每 10 回合 -2）合并到本次遍历
    if (next.turn % 10 === 0) {
      for (const k of Object.keys(n.tendency) as (keyof typeof n.tendency)[]) {
        n.tendency[k] = clamp(n.tendency[k] - 2, 0, 100);
      }
    }

    // E9: 重新检查激活合并到本次遍历
    const activated = activateTendency(n.tendency) as NationalCharacterId[];
    n.activeCharacterBonuses = activated.filter((id) => id !== 'balanced' && NATIONAL_CHARACTERS[id]);
  }

  // E9: 玩家国也需激活检查（AI 循环跳过了 isPlayer）
  const playerNation = next.nations[playerId];
  if (playerNation) {
    const pActivated = activateTendency(playerNation.tendency) as NationalCharacterId[];
    playerNation.activeCharacterBonuses = pActivated.filter((id) => id !== 'balanced' && NATIONAL_CHARACTERS[id]);
  }

  // W1.6 内存预算（DEC-016）：triggeredEvents 上限 1000，满了丢最旧
  if (next.triggeredEvents.length > 1000) {
    next.triggeredEvents = next.triggeredEvents.slice(-1000);
  }

  // W1.6 内存预算：已结束战争从 wars 数组移除（makePeace 已 splice，此处做兜底）
  // 无需额外操作，makePeace 已处理

  // 玩家回合报告
  const report = buildReport(player, playerProvs, next, state, econ, pol, pop, cr, playerEventIds);
  judgeVictory(next, report);
  next.lastReport = report;
  // E10: 维护最近 10 回合历史（sparkline 用）
  next.history = [...next.history, report].slice(-10);
  // E12: 史册里程碑检测（state=prev, next=new）
  detectMilestones(next, state);
  return { state: next, report };
}

function buildReport(
  nation: Nation, provs: Province[], state: GameState, prev: GameState,
  econ: { taxIncome: number; tradeIncome: number; buildingIncome: number; corruptionLoss: number; militaryExpense: number; foodProduced: number; foodConsumed: number },
  pol: { stabilityDelta: number; legitimacyDelta: number },
  pop: { totalGrowth: number },
  cr: { rebellionTriggered: string[] },
  events: string[],
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
  };
}

// 胜负判定（docs/formulas.md §10）
function judgeVictory(state: GameState, report: TurnReport): void {
  if (state.victory.type) return;
  const playerId = findPlayerId(state);
  const player = state.nations[playerId];
  const provs = provincesOf(playerId, state.provinces);

  // 失败优先
  if (player.resources.gold <= 0) {
    state.bankruptTurns += 1;
    if (state.bankruptTurns >= 3) { state.victory.type = 'fail_bankrupt'; return; }
  } else state.bankruptTurns = 0;

  if (player.government.stability <= 10) {
    state.lowStabilityTurns += 1;
    if (state.lowStabilityTurns >= 3) { state.victory.type = 'fail_collapse'; return; }
  } else state.lowStabilityTurns = 0;

  if (player.capital && state.provinces[player.capital]?.ownerId !== playerId) {
    state.victory.type = 'fail_capital_lost'; return;
  }
  if (player.government.legitimacy <= 0) { state.victory.type = 'fail_legitimacy'; return; }

  // 叛乱独立 / 分裂：分级触发杆组
  // P1-2fix: garrison 部分压制——每 50 驻军抵 20 叛乱风险，garrison≥150 完全压制
  const rebelProvs = provs.filter((p) => {
    if (p.rebellionRisk < 100) return false;
    const suppress = Math.min(60, Math.floor(p.garrison / 50) * 20);  // 50兵抵20风险，上限60
    return p.rebellionRisk - suppress >= 100;
  });
  if (rebelProvs.length >= 5) { state.victory.type = 'fail_split'; return; }  // P1-2: 5省分裂（原3省太严）
  // P1-1: 叛乱执行——单省独立 + 纪事 + 剥离建筑
  for (const rp of rebelProvs) {
    rp.assimilation = 30;
    rp.loyalty = 30;
    rp.unrest = 60;
    rp.ownerId = `rebel_${rp.id}`;  // 从玩家剥离
    rp.garrison = 0;
    rp.buildings = rp.buildings.filter((b) => b.defId === 'farm');  // 仅留农田
    // 纪事记录
    addChronicle(state, {
      id: `rebel_${rp.id}_${state.turn}`,
      turn: state.turn,
      kind: 'milestone_rebellion',
      title: `${rp.name} 脱离独立`,
      desc: `${rp.name} 叛乱成功，脱离 ${player.name}。`,
      actorId: playerId,
    });
  }
  // P1-2: 中级分裂警告（3-4省叛乱）——不直接判负，但合法性/稳定大跌
  if (rebelProvs.length >= 3 && rebelProvs.length < 5) {
    player.government.legitimacy = clamp(player.government.legitimacy - 25, 0, 100);
    player.government.stability = clamp(player.government.stability - 15, 0, 100);
  }

  // 胜利
  if (provs.length >= 7 && player.government.stability >= 40) {
    state.victory.type = 'win_conquest'; return;
  }
  if (player.resources.gold >= 2000) {
    state.highEconomyStableTurns += 1;
    if (state.highEconomyStableTurns >= 10) { state.victory.type = 'win_economy'; return; }
  } else state.highEconomyStableTurns = 0;

  if (player.resources.influence >= 150) {
    const good = state.relations.filter((r) => r.from === playerId && r.relation >= 70).length;
    if (good >= 3) { state.victory.type = 'win_culture'; return; }
  }

  if (player.government.stability >= 30 && state.wars.length === 0) {
    state.stableTurnsCount += 1;
    if (state.stableTurnsCount >= 200) { state.victory.type = 'win_eternal'; return; }
  } else state.stableTurnsCount = 0;
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
