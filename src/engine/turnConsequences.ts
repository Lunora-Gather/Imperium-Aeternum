import type { GameState, NationalTendency } from '../types/game';
import { clamp } from '../utils/math';
import { allocateEntityId } from '../utils/id';
import { mulberry32 } from '../utils/random';
import { addChronicle } from './chronicle';
import { provincesOf } from './init';
import { relocateArmy } from './military';

/**
 * 处理引擎级失败与叛乱后果。
 * 成功条件由 gameplay/ambitions 按剧本体量统一判定。
 */
export function resolveFailuresAndRebellions(state: GameState, playerId: string, startingCapital = state.nations[playerId]?.capital): void {
  if (state.victory.type) return;
  const player = state.nations[playerId];
  if (!player) return;
  const provinces = provincesOf(playerId, state.provinces);

  if (player.resources.gold <= 0) {
    state.bankruptTurns += 1;
    if (state.bankruptTurns >= 3) {
      state.victory.type = 'fail_bankrupt';
      return;
    }
  } else state.bankruptTurns = 0;

  if (player.government.stability <= 10) {
    state.lowStabilityTurns += 1;
    if (state.lowStabilityTurns >= 3) {
      state.victory.type = 'fail_collapse';
      return;
    }
  } else state.lowStabilityTurns = 0;

  if (startingCapital && state.provinces[startingCapital]?.ownerId !== playerId) {
    state.victory.type = 'fail_capital_lost';
    return;
  }
  if (player.government.legitimacy <= 0) {
    state.victory.type = 'fail_legitimacy';
    return;
  }

  const rebelProvinces = provinces.filter((province) => {
    if (province.rebellionRisk < 100) return false;
    const suppression = Math.min(60, Math.floor(province.garrison / 50) * 20);
    return province.rebellionRisk - suppression >= 100;
  });
  if (rebelProvinces.length >= 5) {
    state.victory.type = 'fail_split';
    return;
  }

  const rebellionRng = mulberry32(state.seed ^ (state.turn * 7919));
  const newRebels: string[] = [];
  for (const province of rebelProvinces) {
    const originalId = `rebel_${province.id}`;
    const previous = state.nations[originalId];
    const rebelId = previous && (previous.defeated || previous.rebelOf !== playerId) ? allocateEntityId(state, 'rebel') : originalId;
    newRebels.push(rebelId);
    if (!state.nations[rebelId]) {
      state.nations[rebelId] = {
        id: rebelId,
        name: `叛军·${province.name}`,
        isPlayer: false,
        tier: 'D',
        government: { type: 'monarchy', legitimacy: 30, stability: 40, efficiency: 20, corruption: 60 },
        character: 'balanced',
        tendency: { militarism: 50, commerce: 20, religiosity: 30, technocracy: 20, authoritarian: 60, welfare: 10, feudal: 40, revolutionary: 30, maritime: 10, centralization: 30, isolationist: 20, expansionist: 40, scholarly: 10, mercantilist: 20 } as NationalTendency,
        activeCharacterBonuses: [],
        capital: province.id,
        ruler: { name: '叛军首领', age: 35, ability: 2, reignYears: 0 },
        taxRate: 0.1,
        resources: { gold: 50, food: 100, wood: 0, iron: 0, adminPt: 1, sciPt: 0, influence: 0, supply: 0 },
        factions: [],
        tech: { agri: 0, mil: 1, admin: 0, culture: 0, researchProgress: null },
        army: [],
        activePolicies: [],
        activeLaws: [],
        activeTradeRoutes: [],
        embargoedRoutes: [],
        warExhaustion: 0,
        influence: 0,
        atWar: false,
        defeated: false,
        rebellionDecay: 6,
        rebelOf: playerId,
      };
    }

    province.assimilation = 30;
    province.loyalty = 30;
    province.unrest = 60;
    province.ownerId = rebelId;
    province.isCapital = state.nations[rebelId].capital === province.id;
    province.garrison = 0;
    province.buildings = province.buildings.filter((building) => building.defId === 'farm');
    addChronicle(state, {
      id: `rebel_${province.id}_${state.turn}`,
      turn: state.turn,
      kind: 'milestone_rebellion',
      title: `${province.name} 脱离独立`,
      desc: `${province.name} 叛乱成功，脱离 ${player.name}。5 年内未镇压将自动归顺。`,
      actorId: playerId,
    });

    for (const adjacentId of province.adjacent) {
      const adjacent = state.provinces[adjacentId];
      if (!adjacent || adjacent.ownerId !== playerId || adjacent.culture !== province.culture || adjacent.rebellionRisk < 60) continue;
      if (rebellionRng() < 0.3) {
        adjacent.rebellionRisk = Math.min(100, adjacent.rebellionRisk + 40);
        adjacent.unrest = Math.min(100, adjacent.unrest + 20);
      }
    }
  }

  if (!newRebels.length) return;
  if (state.provinces[player.capital]?.ownerId !== playerId) {
    state.victory.type = 'fail_capital_lost';
    const fallback = provinces.find(p => p.ownerId === playerId);
    if (fallback) {
      player.capital = fallback.id;
      fallback.isCapital = true;
    } else {
      player.defeated = true;
      player.army = [];
    }
  }
  for (const army of player.army) {
    if (state.provinces[army.location]?.ownerId !== playerId) relocateArmy(state, player, army, player.capital);
  }
  if (player.civilWar?.active) {
    player.civilWar.rebels = [...new Set([...player.civilWar.rebels, ...newRebels])];
  } else if (newRebels.length >= 3) {
    player.government.legitimacy = clamp(player.government.legitimacy - 25, 0, 100);
    player.government.stability = clamp(player.government.stability - 15, 0, 100);
    player.civilWar = { active: true, rebels: newRebels };
    addChronicle(state, {
      id: `civilwar_${playerId}_${state.turn}`,
      turn: state.turn,
      kind: 'milestone_rebellion',
      title: `${player.name} 陷入内战`,
      desc: `${rebelProvinces.length} 省叛乱，内战爆发。玩家可镇压或谈判。内战期间每年稳定度 -3，税收减少 30%。`,
      actorId: playerId,
    });
  }
}
