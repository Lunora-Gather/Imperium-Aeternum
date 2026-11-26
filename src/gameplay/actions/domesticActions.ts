import { BUILDINGS } from '../../data/buildings';
import type { BuildingId, BuildingDef } from '../../data/buildings';
import { instantResearchBlocker } from '../../engine/technology';
import { TECH_BY_ID } from '../../data/technologies';
import { allocateEntityId } from '../../utils/id';
import type { GameState, Nation, Province } from '../../types/game';
import { clamp, failure, hasTech, runGameAction, spendAdmin, success } from './actionCore';

export function setTaxRateAction(state: GameState, rate: number) {
  return runGameAction(state, (_working, player) => {
    if (!Number.isFinite(rate)) return failure('税率必须是有效数字');
    player.taxRate = clamp(rate, 0, 0.5);
    return success(`税率调整为 ${Math.round(player.taxRate * 100)}%`);
  });
}

export function appeaseFactionAction(state: GameState, factionId: string) {
  return runGameAction(state, (_working, player) => {
    const faction = player.factions.find((entry) => entry.id === factionId);
    if (!faction) return failure('目标派系不存在');
    if (player.resources.gold < 30) return failure('金不足，无法安抚');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.gold -= 30;
    faction.satisfaction = clamp(faction.satisfaction + 8, 0, 100);
    return success(`安抚了 ${factionId}`);
  });
}

export function constructionBlocker(player: Nation, province: Province, definition: BuildingDef): string | null {
  if (!hasTech(player, definition.prereqTech)) return `缺少前置科技：${definition.prereqTech}`;
  if (definition.maxPerProvince > 0 && province.buildings.filter((b) => b.defId === definition.id).length >= definition.maxPerProvince) return '已达建造上限';
  if (player.resources.gold < definition.costGold || player.resources.wood < definition.costWood || player.resources.iron < definition.costIron) return '建造资源不足';
  if (player.resources.adminPt < definition.costAction) return `行动点不足（需 ${definition.costAction}）`;
  return null;
}

export function buildAction(state: GameState, provinceId: string, buildingDefId: string) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    const definition = BUILDINGS[buildingDefId as BuildingId];
    if (!province || province.ownerId !== player.id || !definition) return failure('无法在该省建造');
    const blocker = constructionBlocker(player, province, definition);
    if (blocker) return failure(blocker);
    player.resources.adminPt -= definition.costAction;
    player.resources.gold -= definition.costGold;
    player.resources.wood -= definition.costWood;
    player.resources.iron -= definition.costIron;
    province.buildings.push({ id: allocateEntityId(working, 'building'), defId: definition.id, provinceId, level: 1 });
    return success(`在 ${province.name} 建造了 ${definition.name}`);
  });
}

export function researchAction(state: GameState, techId: string) {
  return runGameAction(state, (_working, player) => {
    const definition = TECH_BY_ID[techId];
    if (!definition) return failure('科技不存在');
    const blocker = instantResearchBlocker(player, definition);
    if (blocker) return failure(blocker);
    player.resources.adminPt -= 1;
    player.resources.sciPt -= definition.costSci;
    player.resources.gold -= definition.costGold;
    player.tech[definition.branch] = definition.level;
    return success(`研发完成：${definition.name}`);
  });
}
