// Imperium Aeternum — 军事系统 engine
// 阶段 5b：完整实现 docs/02-system-rules.md §11

import type { GameState, Nation, Army, War, Province, BattleReport } from '../types/game';
import { computeCombat, resolveBattle, warCostPerTurn, milTechModifier } from './formulas';
import { TERRAIN_COMBAT_MOD } from './formulas';
import type { Terrain } from '../data/provinces';
import { genId } from '../utils/id';
import { clamp } from '../utils/math';
import { getRelationObj } from './init';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId, NationalCharacterMods } from '../data/national-characters';
import { addChronicle } from './chronicle';

// P1-4: 合并激活性格的加成+副作用
function charMods(nation: Nation): NationalCharacterMods {
  const merged: NationalCharacterMods = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid as NationalCharacterId];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) { (merged as Record<string, number>)[k] = ((merged as Record<string, number>)[k] ?? 0) + (v as number); }
    for (const [k, v] of Object.entries(def.penalties)) { (merged as Record<string, number>)[k] = ((merged as Record<string, number>)[k] ?? 0) + (v as number); }
  }
  return merged;
}

// 宣战
export function declareWar(state: GameState, attackerId: string, defenderId: string, targetProvinceId: string): War | null {
  // 不能对停战期国家宣战
  const rel = getRelationObj(attackerId, defenderId, state);
  if (rel && rel.treaty === 'truce' && rel.truceTurns > 0) return null;
  if (state.wars.some((w) => w.attackerId === attackerId && w.defenderId === defenderId)) return null;

  const war: War = {
    id: genId('war'),
    attackerId: attackerId,
    defenderId: defenderId,
    targetProvinceId,
    progress: 0,
    turns: 0,
    battleReports: [],
  };
  state.wars.push(war);

  // 关系 → 战争状态
  if (rel) { rel.treaty = 'war'; rel.relation = -100; }
  const rel2 = getRelationObj(defenderId, attackerId, state);
  if (rel2) { rel2.treaty = 'war'; rel2.relation = -100; }

  const attacker = state.nations[attackerId];
  if (attacker) attacker.atWar = true;
  const defender = state.nations[defenderId];
  if (defender) defender.atWar = true;

  return war;
}

// 停战
// E21: 战略军队调动——省间移动（耗金、需己省/相邻己省、合并同省军队）
export function moveArmy(nation: Nation, armyId: string, toProvinceId: string, fromProvince: Province, toProvince: Province): { ok: boolean; reason?: string } {
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
  let dest = nation.army.find((a) => a.location === toProvinceId);
  if (!dest) {
    dest = { id: genId('army'), ownerId: nation.id, location: toProvinceId, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
    nation.army.push(dest);
  }
  // 加权合并士气/训练/装备（按兵力加权）
  const total = army.size + dest.size;
  dest.morale = Math.round((army.morale * army.size + dest.morale * dest.size) / Math.max(1, total));
  dest.training = Math.round((army.training * army.size + dest.training * dest.size) / Math.max(1, total));
  dest.equipment = Math.round((army.equipment * army.size + dest.equipment * dest.size) / Math.max(1, total));
  dest.size += army.size;
  // 移除原军队
  nation.army = nation.army.filter((a) => a.id !== armyId);
  return { ok: true };
}

export function makePeace(state: GameState, war: War): void {
  const i = state.wars.findIndex((w) => w.id === war.id);
  if (i < 0) return;
  state.wars.splice(i, 1);

  // P1-6: 和约条件——按战争进度决定胜负方与惩罚
  const attacker = state.nations[war.attackerId];
  const defender = state.nations[war.defenderId];
  const attackerWon = war.progress >= 60;
  const defenderWon = war.progress <= 40;

  if (attacker && defender) {
    if (attackerWon) {
      // 进攻方胜：割让目标省份 + 赔款
      const targetProv = state.provinces[war.targetProvinceId];
      if (targetProv) {
        targetProv.ownerId = attacker.id;
        targetProv.loyalty = 30;       // 新征服省忠诚低
        targetProv.assimilation = 20;
        targetProv.unrest = 40;
        targetProv.garrison = 0;
        addChronicle(state, {
          id: `peace_win_${war.id}_${state.turn}`,
          turn: state.turn, kind: 'milestone_war',
          title: `${attacker.name} 攻占 ${targetProv.name}`,
          desc: `${defender.name} 割让 ${targetProv.name}。`,
          actorId: attacker.id,
        });
        // A3: 孤儿军队自动撤退——败方军队若 location 指已割省，撤回最近本国省；无本国省则 disbanded
        const defenderArmies = defender.army.filter((a) => a.location === war.targetProvinceId);
        for (const army of defenderArmies) {
          const ownProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
          // 找邻接的己省，或首都，或任意己省
          const adjOwn = ownProvs.find((p) => targetProv.adjacent.includes(p.id));
          const fallback = adjOwn ?? ownProvs.find((p) => p.id === defender.capital) ?? ownProvs[0];
          if (fallback) {
            army.location = fallback.id;
          } else {
            // 无本国省，军队解散
            defender.army = defender.army.filter((a) => a.id !== army.id);
            addChronicle(state, {
              id: `orphan_disband_${army.id}_${state.turn}`,
              turn: state.turn, kind: 'milestone_war',
              title: `残军溃散`,
              desc: `${defender.name} 在 ${targetProv.name} 的驻军因无本土可撤，溃散消失。`,
              actorId: defender.id,
            });
          }
        }
      }
      // 赔款（败方付，按财力比例）
      const tribute = Math.min(defender.resources.gold, 100 + war.progress);
      defender.resources.gold -= tribute;
      attacker.resources.gold += tribute;
    } else if (defenderWon) {
      // 防御方胜：进攻方赔款 + 厌战惩罚
      const indemnity = Math.min(attacker.resources.gold, 80);
      attacker.resources.gold -= indemnity;
      defender.resources.gold += indemnity;
      attacker.warExhaustion = clamp(attacker.warExhaustion + 10, 0, 100);
      addChronicle(state, {
        id: `peace_lose_${war.id}_${state.turn}`,
        turn: state.turn, kind: 'milestone_war',
        title: `${attacker.name} 战败`,
        desc: `${attacker.name} 进攻 ${defender.name} 失败，赔款 ${indemnity} 金。`,
        actorId: attacker.id,
      });
    }
    // 进度 40-60 之间：白和（无割让无赔款）
  }

  // 关系 → 停战
  const r1 = getRelationObj(war.attackerId, war.defenderId, state);
  if (r1) { r1.treaty = 'truce'; r1.truceTurns = 10; r1.relation = clamp(r1.relation - 30, 0, 100); r1.trust = clamp(r1.trust - 20, 0, 100); }
  const r2 = getRelationObj(war.defenderId, war.attackerId, state);
  if (r2) { r2.treaty = 'truce'; r2.truceTurns = 10; r2.relation = clamp(r2.relation - 30, 0, 100); r2.trust = clamp(r2.trust - 20, 0, 100); }

  // 检查是否仍有战争
  const atWarNations = new Set<string>();
  for (const w of state.wars) { atWarNations.add(w.attackerId); atWarNations.add(w.defenderId); }
  for (const n of Object.values(state.nations)) {
    if (!atWarNations.has(n.id)) n.atWar = false;
  }
}

// 每回合结算所有战争
export function settleWars(state: GameState): void {
  for (const war of [...state.wars]) {
    war.turns += 1;
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    if (!attacker || !defender) { makePeace(state, war); continue; }

    // E21: 进攻方军队在与目标省份相邻的己省即可发起进攻（前线）；无则停战
    const targetProv = state.provinces[war.targetProvinceId];
    const attackerArmy = attacker.army.find((a) =>
      a.size > 0 && (a.location === war.targetProvinceId ||
        (targetProv?.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === attacker.id))
    );
    const defenderArmy = defender.army.find((a) => a.location === war.targetProvinceId && a.size > 0);

    if (!attackerArmy) { makePeace(state, war); continue; }

    const prov = state.provinces[war.targetProvinceId];
    const terrain: Terrain = prov?.terrain ?? 'plain';
    const terrainMod = TERRAIN_COMBAT_MOD[terrain];

    const attPower = attackerArmy ? computeCombat({
      army: attackerArmy, milLv: attacker.tech.mil,
      general: attacker.ruler.ability, terrainMod,
    }) * (charMods(attacker).combatMod ?? 1) * (attacker.policyMods?.combatMod ?? 1) : 0;
    const defPower = defenderArmy ? computeCombat({
      army: defenderArmy, milLv: defender.tech.mil,
      general: defender.ruler.ability, terrainMod: terrainMod * 1.1, // 防守加成
    }) * (charMods(defender).combatMod ?? 1) * (defender.policyMods?.combatMod ?? 1) : (prov?.garrison ?? 0) * 0.5;

    const result = resolveBattle(attPower, defPower, attackerArmy.size, defenderArmy?.size ?? prov?.garrison ?? 0);
    war.progress = clamp(war.progress + result.progressDelta, 0, 100);

    // E13: 生成战报叙事（防御性初始化，兼容旧存档/AI 直接 push 的战争）
    if (!war.battleReports) war.battleReports = [];
    const outcome: BattleReport['outcome'] = result.progressDelta > 5 ? 'advance' : result.progressDelta < -5 ? 'repelled' : 'stalemate';
    const provName = prov?.name ?? war.targetProvinceId;
    const narrative = outcome === 'advance'
      ? `第${war.turns}年，我军于${provName}${terrain === 'mountain' ? '山地' : terrain === 'forest' ? '林地' : '平原'}推进，斩敌${Math.round(result.defenderLoss)}，士气大振。`
      : outcome === 'repelled'
      ? `第${war.turns}年，${provName}攻势受挫，折损${Math.round(result.attackerLoss)}人，敌阵稳固。`
      : `第${war.turns}年，${provName}战事胶着，双方各折${Math.round(result.attackerLoss)}、${Math.round(result.defenderLoss)}人。`;
    war.battleReports.push({
      turn: state.turn, attSize: attackerArmy.size, defSize: defenderArmy?.size ?? prov?.garrison ?? 0,
      attLoss: Math.round(result.attackerLoss), defLoss: Math.round(result.defenderLoss),
      progressDelta: Math.round(result.progressDelta), outcome, narrative,
    });
    if (war.battleReports.length > 20) war.battleReports = war.battleReports.slice(-20);

    // 兵力损耗
    if (attackerArmy) {
      attackerArmy.size = Math.max(0, Math.round(attackerArmy.size - result.attackerLoss));
      attackerArmy.morale = clamp(attackerArmy.morale + result.attackerMoraleDelta, 0, 100);
    }
    if (defenderArmy) {
      defenderArmy.size = Math.max(0, Math.round(defenderArmy.size - result.defenderLoss));
      defenderArmy.morale = clamp(defenderArmy.morale + result.defenderMoraleDelta, 0, 100);
    } else if (prov) {
      prov.garrison = Math.max(0, prov.garrison - Math.round(result.defenderLoss));
    }

    // 战争代价
    const cost = warCostPerTurn(attackerArmy?.size ?? 0);
    attacker.resources.gold -= cost.gold;
    attacker.resources.food -= cost.food;
    attacker.warExhaustion = clamp(attacker.warExhaustion + cost.exhaustionDelta, 0, 100);
    attacker.government.stability = clamp(attacker.government.stability + cost.stabilityDelta, 0, 100);
    if (attackerArmy) attackerArmy.size = Math.max(0, Math.round(attackerArmy.size - cost.attrition));

    // 防守方也付代价
    const dCost = warCostPerTurn(defenderArmy?.size ?? prov?.garrison ?? 0);
    defender.resources.gold -= dCost.gold;
    defender.resources.food -= dCost.food;
    defender.warExhaustion = clamp(defender.warExhaustion + dCost.exhaustionDelta, 0, 100);

    // 进度判定
    // W-fix: 防守方军队全灭 → 自动占领（加速灭国，旧逻辑只靠 progress 爬升太慢）
    const defenderArmyGone = !defenderArmy || defenderArmy.size <= 0;
    const garrisonGone = !prov || prov.garrison <= 0;
    if (war.progress >= 100 || (defenderArmyGone && garrisonGone && attackerArmy && attackerArmy.size > 0)) {
      // 占领省份
      if (prov) {
        const oldOwner = prov.ownerId;
        prov.ownerId = war.attackerId;
        prov.garrison = attackerArmy?.size ?? 0;
        prov.assimilation = Math.max(0, prov.assimilation - 30);
        prov.loyalty = 30;
        prov.unrest = clamp(prov.unrest + 20, 0, 100);
        // 防守方失都 → 标记 defeated
        const defenderNation = state.nations[war.defenderId];
        if (defenderNation && oldOwner === war.defenderId) {
          const remainingProvs = Object.values(state.provinces).filter((p) => p.ownerId === war.defenderId);
          if (remainingProvs.length === 0) {
            defenderNation.defeated = true;
          }
        }
      }
      makePeace(state, war);
    } else if (war.progress <= 0) {
      makePeace(state, war);
    }
  }
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
  provFinals: Record<string, { ownerId?: string; garrison?: number; assimilation?: number; loyalty?: number; unrest?: number }>;
  // 国家 deltas（resources/gov/exhaustion/defeated）
  nationDeltas: Record<string, {
    goldDelta: number; foodDelta: number;
    warExhaustionFinal?: number; stabilityFinal?: number;
    defeated?: boolean;
    armyRemovals?: string[]; // disbanded army ids
    armyLocationOverrides?: Record<string, string>; // armyId → new location
  }>;
  // 关系覆写值（peace 时设 treaty=truce/truceTurns=10/relation/trust）
  relationFinals: Record<string, { treaty?: string; truceTurns?: number; relation?: number; trust?: number }>; // key=`${from}->${to}`
  // 新编年史条目
  newChronicle: Array<{ id: string; turn: number; kind: string; title: string; desc: string; actorId: string }>;
  // atWar 清除标记（nationId → true 表示该回合后无战争应清 atWar=false）
  atWarClear: string[];
}

export function settleWarsPure(state: GameState): SettleWarsPureResult {
  const res: SettleWarsPureResult = {
    warUpdates: {}, peaceWarIds: [], armyFinals: {}, provFinals: {},
    nationDeltas: {}, relationFinals: {}, newChronicle: [], atWarClear: [],
  };
  // 模拟 makePeace 行为的辅助：收集 peace 后 effects（割让/赔款/孤儿撤退/关系改 truce/编年史/atWar 清除）
  const applyPeaceEffects = (war: War, peaceProgress: number) => {
    res.peaceWarIds.push(war.id);
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    const attackerWon = peaceProgress >= 60;
    const defenderWon = peaceProgress <= 40;
    if (attacker && defender) {
      const ndA = res.nationDeltas[attacker.id] ??= { goldDelta: 0, foodDelta: 0 };
      const ndD = res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 };
      if (attackerWon) {
        const targetProv = state.provinces[war.targetProvinceId];
        if (targetProv) {
          res.provFinals[targetProv.id] = {
            ownerId: attacker.id, loyalty: 30, assimilation: 20, unrest: 40, garrison: 0,
          };
          res.newChronicle.push({
            id: `peace_win_${war.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war',
            title: `${attacker.name} 攻占 ${targetProv.name}`,
            desc: `${defender.name} 割让 ${targetProv.name}。`, actorId: attacker.id,
          });
          // 孤儿军队撤退（败方军队 location 指已割省）
          const defenderArmies = defender.army.filter((a) => a.location === war.targetProvinceId);
          for (const army of defenderArmies) {
            const ownProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
            const adjOwn = ownProvs.find((p) => targetProv.adjacent.includes(p.id));
            const fallback = adjOwn ?? ownProvs.find((p) => p.id === defender.capital) ?? ownProvs[0];
            if (fallback) {
              (ndD.armyLocationOverrides ??= {})[army.id] = fallback.id;
            } else {
              (ndD.armyRemovals ??= []).push(army.id);
              res.newChronicle.push({
                id: `orphan_disband_${army.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war',
                title: `残军溃散`, desc: `${defender.name} 在 ${targetProv.name} 的驻军因无本土可撤，溃散消失。`, actorId: defender.id,
              });
            }
          }
        }
        const tribute = Math.min(defender.resources.gold, 100 + peaceProgress);
        ndD.goldDelta -= tribute;
        ndA.goldDelta += tribute;
      } else if (defenderWon) {
        const indemnity = Math.min(attacker.resources.gold, 80);
        ndA.goldDelta -= indemnity;
        ndD.goldDelta += indemnity;
        ndA.warExhaustionFinal = clamp(attacker.warExhaustion + 10, 0, 100);
        res.newChronicle.push({
          id: `peace_lose_${war.id}_${state.turn}`, turn: state.turn, kind: 'milestone_war',
          title: `${attacker.name} 战败`,
          desc: `${attacker.name} 进攻 ${defender.name} 失败，赔款 ${indemnity} 金。`, actorId: attacker.id,
        });
      }
    }
    // 关系 → 停战（双向）
    const r1 = getRelationObj(war.attackerId, war.defenderId, state);
    if (r1) res.relationFinals[`${war.attackerId}->${war.defenderId}`] = { treaty: 'truce', truceTurns: 10, relation: clamp(r1.relation - 30, 0, 100), trust: clamp(r1.trust - 20, 0, 100) };
    const r2 = getRelationObj(war.defenderId, war.attackerId, state);
    if (r2) res.relationFinals[`${war.defenderId}->${war.attackerId}`] = { treaty: 'truce', truceTurns: 10, relation: clamp(r2.relation - 30, 0, 100), trust: clamp(r2.trust - 20, 0, 100) };
  };

  for (const war of state.wars) {
    const newTurns = war.turns + 1;
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    if (!attacker || !defender) { applyPeaceEffects(war, war.progress); continue; }

    const targetProv = state.provinces[war.targetProvinceId];
    const attackerArmy = attacker.army.find((a) =>
      a.size > 0 && (a.location === war.targetProvinceId ||
        (targetProv?.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === attacker.id))
    );
    const defenderArmy = defender.army.find((a) => a.location === war.targetProvinceId && a.size > 0);

    if (!attackerArmy) { applyPeaceEffects(war, war.progress); continue; }

    const prov = state.provinces[war.targetProvinceId];
    const terrain: Terrain = prov?.terrain ?? 'plain';
    const terrainMod = TERRAIN_COMBAT_MOD[terrain];

    const attPower = computeCombat({
      army: attackerArmy, milLv: attacker.tech.mil,
      general: attacker.ruler.ability, terrainMod,
    }) * (charMods(attacker).combatMod ?? 1) * (attacker.policyMods?.combatMod ?? 1);
    const defPower = defenderArmy ? computeCombat({
      army: defenderArmy, milLv: defender.tech.mil,
      general: defender.ruler.ability, terrainMod: terrainMod * 1.1,
    }) * (charMods(defender).combatMod ?? 1) * (defender.policyMods?.combatMod ?? 1) : (prov?.garrison ?? 0) * 0.5;

    const result = resolveBattle(attPower, defPower, attackerArmy.size, defenderArmy?.size ?? prov?.garrison ?? 0);
    const newProgress = clamp(war.progress + result.progressDelta, 0, 100);

    // 战报
    const reports = war.battleReports ? [...war.battleReports] : [];
    const outcome: BattleReport['outcome'] = result.progressDelta > 5 ? 'advance' : result.progressDelta < -5 ? 'repelled' : 'stalemate';
    const provName = prov?.name ?? war.targetProvinceId;
    const narrative = outcome === 'advance'
      ? `第${newTurns}年，我军于${provName}${terrain === 'mountain' ? '山地' : terrain === 'forest' ? '林地' : '平原'}推进，斩敌${Math.round(result.defenderLoss)}，士气大振。`
      : outcome === 'repelled'
      ? `第${newTurns}年，${provName}攻势受挫，折损${Math.round(result.attackerLoss)}人，敌阵稳固。`
      : `第${newTurns}年，${provName}战事胶着，双方各折${Math.round(result.attackerLoss)}、${Math.round(result.defenderLoss)}人。`;
    reports.push({
      turn: state.turn, attSize: attackerArmy.size, defSize: defenderArmy?.size ?? prov?.garrison ?? 0,
      attLoss: Math.round(result.attackerLoss), defLoss: Math.round(result.defenderLoss),
      progressDelta: Math.round(result.progressDelta), outcome, narrative,
    });
    const trimmedReports = reports.length > 20 ? reports.slice(-20) : reports;
    res.warUpdates[war.id] = { turns: newTurns, progress: newProgress, battleReports: trimmedReports };

    // 兵力损耗（暂存 final，因后续 cost.attrition 还会再扣）
    let attSizeAfterBattle = Math.max(0, Math.round(attackerArmy.size - result.attackerLoss));
    let attMoraleAfter = clamp(attackerArmy.morale + result.attackerMoraleDelta, 0, 100);
    if (defenderArmy) {
      res.armyFinals[`${defender.id}:${defenderArmy.id}`] = {
        size: Math.max(0, Math.round(defenderArmy.size - result.defenderLoss)),
        morale: clamp(defenderArmy.morale + result.defenderMoraleDelta, 0, 100),
      };
    } else if (prov) {
      res.provFinals[prov.id] = { ...res.provFinals[prov.id], garrison: Math.max(0, prov.garrison - Math.round(result.defenderLoss)) };
    }

    // 战争代价（attacker）
    const cost = warCostPerTurn(attSizeAfterBattle);
    const ndA = res.nationDeltas[attacker.id] ??= { goldDelta: 0, foodDelta: 0 };
    ndA.goldDelta -= cost.gold;
    ndA.foodDelta -= cost.food;
    ndA.warExhaustionFinal = clamp(attacker.warExhaustion + cost.exhaustionDelta, 0, 100);
    ndA.stabilityFinal = clamp(attacker.government.stability + cost.stabilityDelta, 0, 100);
    attSizeAfterBattle = Math.max(0, Math.round(attSizeAfterBattle - cost.attrition));
    res.armyFinals[`${attacker.id}:${attackerArmy.id}`] = { size: attSizeAfterBattle, morale: attMoraleAfter };

    // 防守方代价
    const dCost = warCostPerTurn(defenderArmy?.size ?? prov?.garrison ?? 0);
    const ndD = res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 };
    ndD.goldDelta -= dCost.gold;
    ndD.foodDelta -= dCost.food;
    ndD.warExhaustionFinal = clamp(defender.warExhaustion + dCost.exhaustionDelta, 0, 100);

    // 进度判定
    // 注意：defenderArmyGone 判断需用 final size（已扣 battle loss）
    const defenderArmyFinalSize = defenderArmy ? (res.armyFinals[`${defender.id}:${defenderArmy.id}`]?.size ?? defenderArmy.size) : undefined;
    const provGarrisonFinal = res.provFinals[prov?.id ?? '']?.garrison ?? prov?.garrison ?? 0;
    const defenderArmyGone = !defenderArmy || (defenderArmyFinalSize ?? 0) <= 0;
    const garrisonGone = !prov || provGarrisonFinal <= 0;
    if (newProgress >= 100 || (defenderArmyGone && garrisonGone && attSizeAfterBattle > 0)) {
      // 占领省份
      if (prov) {
        const oldOwner = prov.ownerId;
        const curProvFinal = res.provFinals[prov.id] ?? {};
        res.provFinals[prov.id] = {
          ...curProvFinal,
          ownerId: war.attackerId,
          garrison: attSizeAfterBattle,
          assimilation: Math.max(0, (curProvFinal.assimilation ?? prov.assimilation) - 30),
          loyalty: 30,
          unrest: clamp((curProvFinal.unrest ?? prov.unrest) + 20, 0, 100),
        };
        // 防守方失都 → defeated
        if (oldOwner === war.defenderId) {
          const remainingProvs = Object.values(state.provinces).filter((p) => {
            const finalOwner = res.provFinals[p.id]?.ownerId ?? p.ownerId;
            return finalOwner === war.defenderId;
          });
          if (remainingProvs.length === 0) {
            (res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 }).defeated = true;
          }
        }
      }
      applyPeaceEffects(war, newProgress);
    } else if (newProgress <= 0) {
      applyPeaceEffects(war, newProgress);
    }
  }

  // atWar 清除：和约后无战争的国家 atWar=false
  const atWarNations = new Set<string>();
  for (const w of state.wars) {
    if (res.peaceWarIds.includes(w.id)) continue;
    atWarNations.add(w.attackerId); atWarNations.add(w.defenderId);
  }
  for (const n of Object.values(state.nations)) {
    if (!atWarNations.has(n.id)) res.atWarClear.push(n.id);
  }

  return res;
}

// 征兵
export function recruit(nation: Nation, province: Province, count: number): { ok: boolean; reason?: string } {
  const goldCost = count * 1.5;
  const supplyCost = count * 0.2;
  if (nation.resources.gold < goldCost) return { ok: false, reason: '金不足' };
  if (nation.resources.supply < supplyCost) return { ok: false, reason: '补给不足' };
  if (province.population < count) return { ok: false, reason: '人口不足' };
  if (province.ownerId !== nation.id) return { ok: false, reason: '非己省' };

  // 性格加成：军国主义征兵速度+ + P-fix 政策 mobilizationMod
  const milBonus = nation.activeCharacterBonuses.includes('militarism') ? 1.2 : 1.0;
  const actualCount = Math.round(count * milBonus * (nation.policyMods?.mobilizationMod ?? 1));

  province.population -= actualCount;
  nation.resources.gold -= goldCost;
  nation.resources.supply -= supplyCost;

  let army = nation.army.find((a) => a.location === province.id);
  if (!army) {
    army = {
      id: genId('army'), ownerId: nation.id, location: province.id,
      size: 0, morale: 60, training: 50, equipment: 50, supply: 80,
    };
    nation.army.push(army);
  }
  army.size += actualCount;
  return { ok: true };
}

export { milTechModifier };
