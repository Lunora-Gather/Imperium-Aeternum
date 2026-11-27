// Imperium Aeternum — 军事系统 engine
// 阶段 5b：完整实现 docs/reference/02-system-rules.md §11

import type { GameState, Nation, War, Province, Army, BattleReport, ChronicleEntry } from '../types/game';
import { setProvincePopulation } from './provincePopulation';
import { computeCombat, resolveBattle, warCostPerTurn, milTechModifier } from './formulas';
import { TERRAIN_COMBAT_MOD } from './formulas';
import { terrainLabel } from '../data/terrain';
import type { Terrain } from '../data/provinces';
import { allocateEntityId } from '../utils/id';
import { clamp } from '../utils/math';
import { findRelation, relationPair } from './init';
import { nationalCharacterMods } from '../data/national-characters';
import { addChronicle } from './chronicle';
import { hasActiveNonAggressionAccord } from './summits';


// 宣战
export function warDeclarationBlocker(state: GameState, from: string, to: string): string | null {
  const attacker = state.nations[from], defender = state.nations[to];
  if (from === to || !attacker || !defender || attacker.defeated || defender.defeated) return '宣战目标无效';
  const pair = relationPair(state, from, to);
  if (!pair) return '缺少外交关系数据';
  if (pair.some((r) => r.treaty === 'alliance')) return '不能向盟友宣战';
  if (pair.some((r) => r.treaty === 'truce' && r.truceTurns > 0)) return '停战期内不能宣战';
  if (hasActiveNonAggressionAccord(state, from, to)) return '双方仍受不侵犯协议约束';
  if (state.wars.some((w) => (w.attackerId === from && w.defenderId === to) || (w.attackerId === to && w.defenderId === from))) return '双方已经处于战争中';
  return null;
}

export function declareWar(state: GameState, attackerId: string, defenderId: string, targetProvinceId: string): War | null {
  if (state.provinces[targetProvinceId]?.ownerId !== defenderId || warDeclarationBlocker(state, attackerId, defenderId)) return null;
  const war: War = {
    id: allocateEntityId(state, 'war'),
    attackerId: attackerId,
    defenderId: defenderId,
    targetProvinceId,
    progress: 0,
    turns: 0,
    battleReports: [],
  };
  state.wars.push(war);

  // 关系 → 战争状态
  for (const r of relationPair(state, attackerId, defenderId)!) {
    r.treaty = 'war';
    r.relation = -100;
    r.truceTurns = 0;
  }
  state.nations[attackerId].atWar = true;
  state.nations[defenderId].atWar = true;
  return war;
}

// 停战
// E21: 战略军队调动——省间移动（耗金、需己省/相邻己省、合并同省军队）
export function moveArmy(state: GameState, nation: Nation, armyId: string, toProvinceId: string, fromProvince: Province, toProvince: Province): { ok: boolean; reason?: string } {
  const army = nation.army.find((a) => a.id === armyId);
  if (!army) return { ok: false, reason: '军队不存在' };
  if (army.size <= 0) return { ok: false, reason: '军队无兵' };
  if (toProvince.ownerId !== nation.id) return { ok: false, reason: '目标省份非己方' };
  if (army.location === toProvinceId) return { ok: false, reason: '已在目标省份' };
  // 必须相邻或目标为首都（首都枢纽自由调动）
  const isAdjacent = fromProvince.adjacent.includes(toProvinceId);
  const isCapitalHub = toProvinceId === nation.capital || army.location === nation.capital;
  if (!isAdjacent && !isCapitalHub) return { ok: false, reason: '不相邻且非首都枢纽' };
  // 耗金：每兵 0.3 + 基础 5（首都枢纽半价）
  const baseCost = isCapitalHub ? 3 : 5;
  const goldCost = Math.round(baseCost + army.size * (isCapitalHub ? 0.15 : 0.3));
  if (nation.resources.gold < goldCost) return { ok: false, reason: `金不足（需 ${goldCost}）` };
  // 调动：扣金、合并到目标省份军队
  nation.resources.gold -= goldCost;
  relocateArmy(state, nation, army, toProvinceId);
  return { ok: true };
}

export function relocateArmy(state: GameState, nation: Nation, army: Army, destination: string): void {
  if (army.location === destination) return;
  const dest = nation.army.find((a) => a.location === destination);
  if (!dest) {
    const moved = { ...army, id: allocateEntityId(state, 'army'), location: destination };
    nation.army = [...nation.army.filter((a) => a.id !== army.id), moved];
    return;
  }
  const total = dest.size + army.size;
  for (const field of ['morale', 'training', 'equipment', 'supply'] as const) {
    dest[field] = Math.round((dest[field] * dest.size + army[field] * army.size) / Math.max(1, total));
  }
  dest.size = total;
  nation.army = nation.army.filter((a) => a.id !== army.id);
}

export function makePeace(state: GameState, war: War): void {
  const current = state.wars.find((w) => w.id === war.id);
  if (!current) return;
  const result = emptyWarResult();
  const outcome = current.progress >= 60 ? 'attacker' : current.progress <= 40 ? 'defender' : 'draw';
  finishWar(state, result, current, outcome, current.progress);
  finalizeWars(state, result);
  applySettleWarsResult(state, result);
}

// 每回合结算所有战争
export function settleWars(state: GameState): void {
  applySettleWarsResult(state, settleWarsPure(state));
}
// ── C1 纯函数版本（不 mutate，返回结构化 deltas 供 processTurn 合并） ──

export interface SettleWarsPureResult {
  // 每场战争更新（turns/progress/battleReports 覆写值）
  warUpdates: Record<string, { turns: number; progress: number; battleReports: BattleReport[] }>;
  // 和平战争 ID（processTurn 合并时从 wars 移除）
  peaceWarIds: string[];
  // 军队覆写值（key=`${nationId}:${armyId}`，含 size/morale final）
  armyFinals: Record<string, { size: number; morale: number }>;
  // 省份覆写值（key=provId，含 ownerId/garrison/assimilation/loyalty/unrest）
  provFinals: Record<string, { ownerId?: string; isCapital?: boolean; garrison?: number; assimilation?: number; loyalty?: number; unrest?: number }>;
  // 国家 deltas（resources/gov/exhaustion/defeated）
  nationDeltas: Record<string, {
    goldDelta: number; foodDelta: number;
    warExhaustionFinal?: number; stabilityFinal?: number;
    defeated?: boolean; capital?: string;
    armyRemovals?: string[]; // disbanded army ids
    armyLocationOverrides?: Record<string, string>; // armyId → new location
  }>;
  // 关系覆写值（peace 时设 treaty=truce/truceTurns=10/relation/trust）
  relationFinals: Record<string, { treaty?: string; truceTurns?: number; relation?: number; trust?: number }>; // key=`${from}->${to}`
  // 新编年史条目
  newChronicle: ChronicleEntry[];
  // atWar 清除标记（nationId → true 表示该回合后无战争应清 atWar=false）
  atWarClear: string[];
}

function emptyWarResult(): SettleWarsPureResult {
  return { warUpdates: {}, peaceWarIds: [], armyFinals: {}, provFinals: {}, nationDeltas: {}, relationFinals: {}, newChronicle: [], atWarClear: [] };
}

function projectedOwner(result: SettleWarsPureResult, province: Province): string {
  return result.provFinals[province.id]?.ownerId ?? province.ownerId;
}

function nationDelta(result: SettleWarsPureResult, id: string) {
  return result.nationDeltas[id] ??= { goldDelta: 0, foodDelta: 0 };
}

function chargeWarCost(res: SettleWarsPureResult, nation: Nation, size: number) {
  const cost = warCostPerTurn(size);
  const delta = nationDelta(res, nation.id);
  delta.goldDelta -= cost.gold;
  delta.foodDelta -= cost.food;
  delta.warExhaustionFinal = clamp((delta.warExhaustionFinal ?? nation.warExhaustion) + cost.exhaustionDelta, 0, 100);
  return { cost, delta };
}

function frontArmy(result: SettleWarsPureResult, nation: Nation, onFront: (location: string) => boolean): Army | undefined {
  const changes = result.nationDeltas[nation.id];
  for (const army of nation.army) {
    const location = changes?.armyLocationOverrides?.[army.id] ?? army.location;
    if (!onFront(location) || changes?.armyRemovals?.includes(army.id)) continue;
    const final = result.armyFinals[`${nation.id}:${army.id}`];
    if ((final?.size ?? army.size) > 0) return { ...army, ...final, location };
  }
}

function cedeProvince(state: GameState, res: SettleWarsPureResult, target: Province, attacker: Nation, defender: Nation, war: War): void {
  const changes = nationDelta(res, defender.id);
  res.provFinals[target.id] = { ownerId: attacker.id, loyalty: 30, assimilation: 20, unrest: 40, garrison: 0, isCapital: false };
  const remaining = Object.values(state.provinces).filter((p) => projectedOwner(res, p) === defender.id);
  const capital = changes.capital ?? defender.capital;
  const fallback = remaining.find((p) => target.adjacent.includes(p.id)) ?? remaining.find((p) => p.id === capital) ?? remaining[0];
  res.newChronicle.push({
    id: `peace_win_${war.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war',
    title: `${attacker.name} 攻占 ${target.name}`, desc: `${defender.name} 割让 ${target.name}。`, actorId: attacker.id,
  });
  if (!fallback) {
    changes.defeated = true;
    if (attacker.isPlayer || state.sharedChronicles) res.newChronicle.push({
      turn: state.turn, kind: 'victory', title: `灭 ${defender.name}`,
      desc: `${defender.name} 国祚终绝，我军攻下其最后一省${target.name}。`, actorId: attacker.id,
    });
  } else if (capital === target.id) {
    changes.capital = fallback.id;
    (res.provFinals[fallback.id] ??= {}).isCapital = true;
  }
  for (const army of defender.army) {
    const location = changes.armyLocationOverrides?.[army.id] ?? army.location;
    if (fallback && location !== target.id) continue;
    if (fallback) (changes.armyLocationOverrides ??= {})[army.id] = fallback.id;
    else {
      (changes.armyRemovals ??= []).push(army.id);
      res.newChronicle.push({
        id: `orphan_disband_${army.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war',
        title: '残军溃散', desc: `${defender.name} 在 ${target.name} 的驻军因无本土可撤，溃散消失。`, actorId: defender.id,
      });
    }
  }
}

function objectiveIsValid(state: GameState, res: SettleWarsPureResult, war: War): boolean {
  const target = state.provinces[war.targetProvinceId];
  return !!target && projectedOwner(res, target) === war.defenderId
    && [war.attackerId, war.defenderId].every((id) => state.nations[id] && !state.nations[id].defeated && !res.nationDeltas[id]?.defeated);
}

function finishWar(state: GameState, res: SettleWarsPureResult, war: War, outcome: 'attacker' | 'defender' | 'draw', progress: number): void {
  res.peaceWarIds.push(war.id);
  if (outcome !== 'draw' && objectiveIsValid(state, res, war)) {
    const attacker = state.nations[war.attackerId], defender = state.nations[war.defenderId];
    const a = nationDelta(res, attacker.id), d = nationDelta(res, defender.id);
    if (outcome === 'attacker') {
      cedeProvince(state, res, state.provinces[war.targetProvinceId], attacker, defender, war);
      const tribute = Math.min(Math.max(0, defender.resources.gold + d.goldDelta), 100 + progress);
      d.goldDelta -= tribute;
      a.goldDelta += tribute;
    } else {
      const indemnity = Math.min(Math.max(0, attacker.resources.gold + a.goldDelta), 80);
      a.goldDelta -= indemnity;
      d.goldDelta += indemnity;
      a.warExhaustionFinal = clamp((a.warExhaustionFinal ?? attacker.warExhaustion) + 10, 0, 100);
      res.newChronicle.push({
        id: `peace_lose_${war.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war', title: `${attacker.name} 战败`,
        desc: `${attacker.name} 进攻 ${defender.name} 失败，赔款 ${indemnity} 金。`, actorId: attacker.id,
      });
    }
  }
  for (const relation of relationPair(state, war.attackerId, war.defenderId) ?? []) {
    res.relationFinals[`${relation.from}->${relation.to}`] = { treaty: 'truce', truceTurns: 10, relation: -45, trust: Math.min(clamp(relation.trust - 20, 0, 100), 25) };
  }
}

function finalizeWars(state: GameState, res: SettleWarsPureResult): void {
  const ended = new Set(res.peaceWarIds);
  const stillFighting = new Set<string>();
  for (const war of state.wars) {
    if (ended.has(war.id)) continue;
    if (!objectiveIsValid(state, res, war)) finishWar(state, res, war, 'draw', war.progress);
    else { stillFighting.add(war.attackerId); stillFighting.add(war.defenderId); }
  }
  res.atWarClear = Object.keys(state.nations).filter((id) => !stillFighting.has(id));
}

export function settleWarsPure(state: GameState): SettleWarsPureResult {
  const res = emptyWarResult();
  for (const war of state.wars) {
    const newTurns = war.turns + 1;
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    if (!objectiveIsValid(state, res, war)) { finishWar(state, res, war, 'draw', war.progress); continue; }

    const prov = state.provinces[war.targetProvinceId];
    const attackerArmy = frontArmy(res, attacker, (id) => id === prov.id ||
      (prov.adjacent.includes(id) && !!state.provinces[id] && projectedOwner(res, state.provinces[id]) === attacker.id));
    const defenderArmy = frontArmy(res, defender, (id) => id === prov.id);
    if (!attackerArmy) { finishWar(state, res, war, 'defender', war.progress); continue; }
    const garrison = res.provFinals[prov.id]?.garrison ?? prov.garrison;
    const terrain: Terrain = prov?.terrain ?? 'plain';
    const terrainMod = TERRAIN_COMBAT_MOD[terrain];

    const attPower = computeCombat({
      army: attackerArmy, milLv: attacker.tech.mil,
      general: attacker.ruler.ability, terrainMod,
    }) * (nationalCharacterMods(attacker.activeCharacterBonuses).combatMod ?? 1) * (attacker.policyMods?.combatMod ?? 1);
    const defPower = defenderArmy ? computeCombat({
      army: defenderArmy, milLv: defender.tech.mil,
      general: defender.ruler.ability, terrainMod: terrainMod * 1.1,
    }) * (nationalCharacterMods(defender.activeCharacterBonuses).combatMod ?? 1) * (defender.policyMods?.combatMod ?? 1) : garrison * 0.5;

    const result = resolveBattle(attPower, defPower, attackerArmy.size, defenderArmy?.size ?? garrison);
    const newProgress = clamp(war.progress + result.progressDelta, 0, 100);

    // 战报
    const reports = war.battleReports?.slice(-19) ?? [];
    const outcome: BattleReport['outcome'] = result.progressDelta > 5 ? 'advance' : result.progressDelta < -5 ? 'repelled' : 'stalemate';
    const provName = prov?.name ?? war.targetProvinceId;
    const narrative = outcome === 'advance'
      ? `第${newTurns}年，我军于${provName}${terrainLabel(terrain)}推进，斩敌${Math.round(result.defenderLoss)}，士气大振。`
      : outcome === 'repelled'
      ? `第${newTurns}年，${provName}攻势受挫，折损${Math.round(result.attackerLoss)}人，敌阵稳固。`
      : `第${newTurns}年，${provName}战事胶着，双方各折${Math.round(result.attackerLoss)}、${Math.round(result.defenderLoss)}人。`;
    reports.push({
      turn: state.turn, attSize: attackerArmy.size, defSize: defenderArmy?.size ?? garrison,
      attLoss: Math.round(result.attackerLoss), defLoss: Math.round(result.defenderLoss),
      progressDelta: Math.round(result.progressDelta), outcome, narrative,
    });
    res.warUpdates[war.id] = { turns: newTurns, progress: newProgress, battleReports: reports };

    // 兵力损耗（暂存 final，因后续 cost.attrition 还会再扣）
    let attSizeAfterBattle = Math.max(0, Math.round(attackerArmy.size - result.attackerLoss));
    const attMoraleAfter = clamp(attackerArmy.morale + result.attackerMoraleDelta, 0, 100);
    if (defenderArmy) {
      res.armyFinals[`${defender.id}:${defenderArmy.id}`] = {
        size: Math.max(0, Math.round(defenderArmy.size - result.defenderLoss)),
        morale: clamp(defenderArmy.morale + result.defenderMoraleDelta, 0, 100),
      };
    } else if (prov) {
      res.provFinals[prov.id] = { ...res.provFinals[prov.id], garrison: Math.max(0, garrison - Math.round(result.defenderLoss)) };
    }

    // 战争代价（attacker）
    const { cost, delta } = chargeWarCost(res, attacker, attSizeAfterBattle);
    delta.stabilityFinal = clamp((delta.stabilityFinal ?? attacker.government.stability) + cost.stabilityDelta, 0, 100);
    attSizeAfterBattle = Math.max(0, Math.round(attSizeAfterBattle - cost.attrition));
    res.armyFinals[`${attacker.id}:${attackerArmy.id}`] = { size: attSizeAfterBattle, morale: attMoraleAfter };

    // 防守方代价
    const defenderSizeAfterBattle = defenderArmy
      ? (res.armyFinals[`${defender.id}:${defenderArmy.id}`]?.size ?? defenderArmy.size)
      : (res.provFinals[prov?.id ?? '']?.garrison ?? prov?.garrison ?? 0);
    chargeWarCost(res, defender, defenderSizeAfterBattle);

    const defendersGone = !frontArmy(res, defender, (id) => id === prov.id) && (res.provFinals[prov.id]?.garrison ?? garrison) <= 0;
    if (attSizeAfterBattle > 0 && (newProgress >= 100 || defendersGone)) finishWar(state, res, war, 'attacker', newProgress);
    else if (attSizeAfterBattle === 0 || (newProgress === 0 && result.progressDelta < 0)) finishWar(state, res, war, 'defender', newProgress);
  }
  finalizeWars(state, res);
  return res;
}

/** 把纯战争结算产物一次性合并到工作状态。 */
export function applySettleWarsResult(state: GameState, result: SettleWarsPureResult): void {
  for (const war of state.wars) {
    const update = result.warUpdates[war.id];
    if (update) {
      war.turns = update.turns;
      war.progress = update.progress;
      war.battleReports = update.battleReports;
    }
  }

  const peaceIds = new Set(result.peaceWarIds);
  state.wars = state.wars.filter((war) => !peaceIds.has(war.id));

  for (const [key, final] of Object.entries(result.armyFinals)) {
    const separator = key.indexOf(':');
    if (separator < 0) continue;
    const nation = state.nations[key.slice(0, separator)];
    const army = nation?.army.find((entry) => entry.id === key.slice(separator + 1));
    if (army) {
      if (final.size > 0) Object.assign(army, final);
      else nation.army = nation.army.filter((a) => a.id !== army.id);
    }
  }

  for (const [provinceId, final] of Object.entries(result.provFinals)) {
    const province = state.provinces[provinceId];
    if (province) Object.assign(province, final);
  }

  for (const [nationId, delta] of Object.entries(result.nationDeltas)) {
    const nation = state.nations[nationId];
    if (!nation) continue;
    nation.resources.gold += delta.goldDelta;
    nation.resources.food += delta.foodDelta;
    if (delta.warExhaustionFinal !== undefined) nation.warExhaustion = delta.warExhaustionFinal;
    if (delta.stabilityFinal !== undefined) nation.government.stability = delta.stabilityFinal;
    if (delta.capital !== undefined) nation.capital = delta.capital;
    if (delta.defeated !== undefined) nation.defeated = delta.defeated;
    if (delta.armyLocationOverrides) {
      for (const [armyId, location] of Object.entries(delta.armyLocationOverrides)) {
        const army = nation.army.find((entry) => entry.id === armyId);
        if (army) army.location = location;
      }
    }
    if (delta.armyRemovals?.length) {
      const removals = new Set(delta.armyRemovals);
      nation.army = nation.army.filter((army) => !removals.has(army.id));
    }
  }

  for (const [key, final] of Object.entries(result.relationFinals)) {
    const separator = key.indexOf('->');
    if (separator < 0) continue;
    const relation = findRelation(state.relations, key.slice(0, separator), key.slice(separator + 2));
    if (relation) Object.assign(relation, final);
  }

  for (const entry of result.newChronicle) addChronicle(state, entry);
  for (const nationId of result.atWarClear) {
    const nation = state.nations[nationId];
    if (nation) nation.atWar = false;
  }
}

// 征兵
export function recruit(state: GameState, nation: Nation, province: Province, count: number): { ok: boolean; reason?: string } {
  if (!Number.isSafeInteger(count) || count <= 0) return { ok: false, reason: '征兵数量必须是正整数' };
  const goldCost = count * 1.5;
  const supplyCost = count * 0.2;
  if (nation.resources.gold < goldCost) return { ok: false, reason: '金不足' };
  if (nation.resources.supply < supplyCost) return { ok: false, reason: '补给不足' };
  if (province.ownerId !== nation.id) return { ok: false, reason: '非己省' };

  // 性格加成：军国主义征兵速度+ + P-fix 政策 mobilizationMod
  const milBonus = nation.activeCharacterBonuses.includes('militarism') ? 1.2 : 1.0;
  const actualCount = Math.round(count * milBonus * (nation.policyMods?.mobilizationMod ?? 1));
  if (province.population < actualCount) return { ok: false, reason: `人口不足（实际需 ${actualCount}）` };

  setProvincePopulation(province, province.population - actualCount);
  nation.resources.gold -= goldCost;
  nation.resources.supply -= supplyCost;

  let army = nation.army.find((a) => a.location === province.id);
  if (!army) {
    army = {
      id: allocateEntityId(state, 'army'), ownerId: nation.id, location: province.id,
      size: 0, morale: 60, training: 50, equipment: 50, supply: 80,
    };
    nation.army.push(army);
  }
  army.size += actualCount;
  return { ok: true };
}

export { milTechModifier };
