import {
  declareWar as engineDeclareWar,
  makePeace as engineMakePeace,
  moveArmy as engineMoveArmy,
  recruit as engineRecruit,
} from '../../engine/military';
import type { GameState } from '../../types/game';
import { hasActiveNonAggressionAccord } from '../../engine/summits';
import { failure, relationPair, runGameAction, spendAdmin, success, validForeignTarget } from './actionCore';

export function recruitAction(state: GameState, provinceId: string, count: number) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure('只能在本国省份征兵');
    if (!Number.isSafeInteger(count) || count <= 0) return failure('征兵数量必须是正整数');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = engineRecruit(working, player, province, count);
    if (!result.ok) return failure(`征兵失败：${result.reason ?? '条件不足'}`);
    return success(`在 ${province.name} 征兵 ${count} 人`);
  });
}

export function declareWarAction(state: GameState, targetId: string, provinceId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const targetProvince = working.provinces[provinceId];
    if (!target || !targetProvince || targetProvince.ownerId !== target.id) return failure('宣战目标无效');
    const pair = relationPair(working, player.id, target.id);
    if (!pair) return failure('缺少外交关系数据');
    if (pair.some((relation) => relation.treaty === 'alliance')) return failure('不能向盟友宣战');
    if (pair.some((relation) => relation.treaty === 'truce' && relation.truceTurns > 0)) return failure('停战期内不能宣战');
    if (hasActiveNonAggressionAccord(working, player.id, target.id)) return failure('双方仍受元首会谈达成的不侵犯协议约束');
    if (working.wars.some((war) => [war.attackerId, war.defenderId].includes(player.id) && [war.attackerId, war.defenderId].includes(target.id))) {
      return failure('双方已经处于战争中');
    }
    const bordersTarget = Object.values(working.provinces)
      .filter((province) => province.ownerId === player.id)
      .some((province) => province.adjacent.includes(targetProvince.id));
    if (!bordersTarget) return failure('只能向相邻省份发动战争');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const war = engineDeclareWar(working, player.id, target.id, targetProvince.id);
    if (!war) return failure('宣战失败');
    return success(`向 ${target.name} 宣战`);
  });
}

export function makePeaceAction(state: GameState, warId: string) {
  return runGameAction(state, (working, player) => {
    const war = working.wars.find((entry) => entry.id === warId);
    if (!war || (war.attackerId !== player.id && war.defenderId !== player.id)) return failure('无法处理不属于玩家的战争');
    if (player.resources.influence < 30) return failure('议和需要 30 影响力');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    const otherId = war.attackerId === player.id ? war.defenderId : war.attackerId;
    engineMakePeace(working, war);
    const pair = relationPair(working, player.id, otherId);
    if (pair) {
      for (const relation of pair) {
        relation.treaty = 'truce';
        relation.truceTurns = Math.max(relation.truceTurns, 10);
        relation.relation = Math.min(relation.relation, -35);
      }
    }
    return success(`与 ${working.nations[otherId]?.name ?? otherId} 议和完成`);
  });
}

export function moveArmyAction(state: GameState, armyId: string, toProvinceId: string) {
  return runGameAction(state, (working, player) => {
    const army = player.army.find((entry) => entry.id === armyId);
    const from = army ? working.provinces[army.location] : undefined;
    const to = working.provinces[toProvinceId];
    if (!army || !from || !to) return failure('军队或省份不存在');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = engineMoveArmy(working, player, armyId, toProvinceId, from, to);
    if (!result.ok) return failure(`调动失败：${result.reason ?? '不可达'}`);
    return success(`军队调至 ${to.name}`);
  });
}
