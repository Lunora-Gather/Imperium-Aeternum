import { BUILDINGS } from '../../data/buildings';
import type { BuildingId } from '../../data/buildings';
import { establishTradeRoute as engineEstablishTradeRoute } from '../../engine/economy';
import { addChronicle } from '../../engine/chronicle';
import { allocateEntityId } from '../../utils/id';
import type { GameState } from '../../types/game';
import { clamp, failure, runGameAction, spendAdmin, success } from './actionCore';

export type ProvinceDevelopmentKind = 'reclaim' | 'garrison_deploy' | 'garrison_recall' | 'neutral_negotiate' | 'neutral_colonize' | 'neutral_occupy';

export function establishTradeRouteAction(state: GameState, routeId: string) {
  return runGameAction(state, (working, player) => {
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = engineEstablishTradeRoute(player, routeId, working);
    if (!result.ok) return failure(`建立失败：${result.reason ?? '条件不足'}`);
    return success(`建立贸易路线：${result.routeName ?? routeId}`);
  });
}

export function embargoTradeRouteAction(state: GameState, routeId: string) {
  return runGameAction(state, (_working, player) => {
    if (!player.activeTradeRoutes.some((route) => route.routeId === routeId)) return failure('未建立该路线');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const embargoed = player.embargoedRoutes.includes(routeId);
    player.embargoedRoutes = embargoed
      ? player.embargoedRoutes.filter((entry) => entry !== routeId)
      : [...player.embargoedRoutes, routeId];
    return success(embargoed ? '已解除禁运' : '已禁运');
  });
}

export function developProvinceAction(state: GameState, provinceId: string, kind: ProvinceDevelopmentKind) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province) return failure('省份不存在');
    const neutralAction = kind === 'neutral_negotiate' || kind === 'neutral_colonize' || kind === 'neutral_occupy';
    if (neutralAction) {
      if (working.nations[province.ownerId]) return failure('该省份已有国家统治，应通过外交或战争处理');
      if (!province.adjacent.some((id) => working.provinces[id]?.ownerId === player.id)) return failure('只能拓展与本国接壤的中立省份');
      if (kind === 'neutral_negotiate' && (player.resources.gold < 80 || player.resources.influence < 40)) return failure('交涉需要 80 金与 40 影响力');
      if (kind === 'neutral_colonize' && (player.resources.gold < 120 || player.resources.food < 150)) return failure('移民开拓需要 120 金与 150 粮');
      const armySize = player.army.reduce((total, army) => total + army.size, 0);
      if (kind === 'neutral_occupy' && (player.resources.supply < 60 || armySize < Math.max(100, province.garrison + 50))) return failure('军事占领需要 60 补给与足够军力');
      const apFailure = spendAdmin(player, kind === 'neutral_occupy' ? 1 : 2);
      if (apFailure) return apFailure;

      if (kind === 'neutral_negotiate') {
        player.resources.gold -= 80;
        player.resources.influence -= 40;
        province.loyalty = 55;
        province.assimilation = Math.max(35, province.assimilation);
        province.unrest = Math.min(25, province.unrest);
        province.rebellionRisk = Math.min(25, province.rebellionRisk);
      } else if (kind === 'neutral_colonize') {
        player.resources.gold -= 120;
        player.resources.food -= 150;
        province.loyalty = 42;
        province.assimilation = Math.max(25, province.assimilation);
        province.unrest = Math.max(25, province.unrest);
        province.rebellionRisk = Math.max(20, province.rebellionRisk);
      } else {
        player.resources.supply -= 60;
        province.loyalty = 20;
        province.assimilation = Math.min(20, province.assimilation);
        province.unrest = Math.max(60, province.unrest);
        province.rebellionRisk = Math.max(55, province.rebellionRisk);
        province.garrison = Math.max(50, province.garrison);
        player.warExhaustion = Math.min(100, player.warExhaustion + 4);
      }
      province.ownerId = player.id;
      addChronicle(working, { turn: working.turn, kind: 'expansion', title: '边疆纳入版图', desc: `${province.name}通过${kind === 'neutral_negotiate' ? '交涉归附' : kind === 'neutral_colonize' ? '移民开拓' : '军事占领'}纳入国家。`, actorId: player.id });
      return success(`${province.name}已纳入版图`);
    }

    if (province.ownerId !== player.id) return failure('只能开发本国省份');
    if (!['reclaim', 'garrison_deploy', 'garrison_recall'].includes(kind)) return failure('未知省份操作');
    if (kind === 'reclaim') {
      if (province.agriBase >= 12) return failure('农业基础已达上限');
      if (player.resources.gold < 60) return failure('金不足');
    }
    const capitalArmy = player.army.find((army) => army.location === player.capital);
    if (kind === 'garrison_deploy' && (!capitalArmy || capitalArmy.size < 50)) return failure('首都军队不足');
    if (kind === 'garrison_recall' && province.garrison < 50) return failure('驻军不足');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;

    if (kind === 'reclaim') {
      player.resources.gold -= 60;
      province.agriBase = Math.min(12, province.agriBase + 2);
    } else if (kind === 'garrison_deploy' && capitalArmy) {
      capitalArmy.size -= 50;
      province.garrison += 50;
    } else if (kind === 'garrison_recall') {
      province.garrison -= 50;
      let army = player.army.find((entry) => entry.location === player.capital);
      if (!army) {
        army = { id: allocateEntityId(working, 'army'), ownerId: player.id, location: player.capital, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
        player.army.push(army);
      }
      army.size += 50;
    }
    return success('省份开发完成');
  });
}

export function upgradeBuildingAction(state: GameState, provinceId: string, buildingInstanceId: string) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure('只能升级本国建筑');
    const instance = province.buildings.find((building) => building.id === buildingInstanceId);
    const definition = instance ? BUILDINGS[instance.defId as BuildingId] : undefined;
    if (!instance || !definition) return failure('建筑不存在');
    if (instance.level >= 3) return failure('建筑已达最高等级');
    const goldCost = Math.round(definition.costGold * 0.6 * instance.level);
    if (player.resources.gold < goldCost) return failure('金不足');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.gold -= goldCost;
    instance.level += 1;
    return success(`${definition.name} 升级完成`);
  });
}

export function demolishBuildingAction(state: GameState, provinceId: string, buildingInstanceId: string) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure('只能拆除本国建筑');
    const instance = province.buildings.find((building) => building.id === buildingInstanceId);
    if (!instance) return failure('建筑不存在');
    const definition = BUILDINGS[instance.defId as BuildingId];
    const refund = Math.round((definition?.costGold ?? 50) * 0.3 * instance.level);
    province.buildings = province.buildings.filter((building) => building.id !== buildingInstanceId);
    player.resources.gold += refund;
    return success(`建筑已拆除，返还 ${refund} 金`);
  });
}

export function suppressRebellionAction(state: GameState) {
  return runGameAction(state, (working, player) => {
    if (!player.civilWar?.active) return failure('未处于内战');
    if (player.army.reduce((total, army) => total + army.size, 0) < 200 || player.resources.gold < 150) return failure('镇压条件不足');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.gold -= 150;
    for (const rebelId of player.civilWar.rebels) {
      Object.values(working.provinces).forEach((province) => {
        if (province.ownerId === rebelId) province.ownerId = player.id;
      });
      delete working.nations[rebelId];
      working.relations = working.relations.filter((relation) => relation.from !== rebelId && relation.to !== rebelId);
      working.wars = working.wars.filter((war) => war.attackerId !== rebelId && war.defenderId !== rebelId);
    }
    player.civilWar = { active: false, rebels: [] };
    player.government.stability = clamp(player.government.stability - 10, 0, 100);
    addChronicle(working, { turn: working.turn, kind: 'milestone_rebellion', title: '内战平定', desc: '玩家以武力镇压叛乱。', actorId: player.id });
    return success('镇压叛乱成功');
  });
}

export function negotiateRebellionAction(state: GameState) {
  return runGameAction(state, (working, player) => {
    if (!player.civilWar?.active) return failure('未处于内战');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    const rebelCount = player.civilWar.rebels.length;
    player.civilWar = { active: false, rebels: [] };
    player.government.legitimacy = clamp(player.government.legitimacy - 15, 0, 100);
    player.government.stability = clamp(player.government.stability + 15, 0, 100);
    addChronicle(working, {
      turn: working.turn,
      kind: 'milestone_rebellion',
      title: '内战和议',
      desc: `朝廷承认 ${rebelCount} 个叛乱政权的既成地位，换取停战。`,
      actorId: player.id,
    });
    return success('已通过谈判结束内战');
  });
}
