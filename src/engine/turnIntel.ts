import type { GameState, Province } from '../types/game';
import { addChronicle } from './chronicle';

export interface ProvinceChange {
  id: string;
  name: string;
  from: string;
  to: string;
}

export function collectWorldEvents(
  previous: GameState,
  current: GameState,
  playerId: string,
  playerProvinces: Province[],
): string[] {
  const events: string[] = [];
  const neighbors = new Set<string>();

  for (const province of playerProvinces) {
    for (const adjacentId of province.adjacent) {
      const adjacent = current.provinces[adjacentId];
      if (adjacent && adjacent.ownerId !== playerId) neighbors.add(adjacent.ownerId);
    }
  }

  for (const war of current.wars) {
    if (previous.wars.some((candidate) => candidate.id === war.id)) continue;
    if (
      war.attackerId !== playerId
      && war.defenderId !== playerId
      && !neighbors.has(war.attackerId)
      && !neighbors.has(war.defenderId)
    ) continue;
    const attacker = current.nations[war.attackerId];
    const defender = current.nations[war.defenderId];
    const target = current.provinces[war.targetProvinceId];
    events.push(`⚔ ${attacker?.name ?? war.attackerId} 向 ${defender?.name ?? war.defenderId} 宣战，攻 ${target?.name ?? war.targetProvinceId}`);
  }

  for (const [nationId, nation] of Object.entries(current.nations)) {
    const oldNation = previous.nations[nationId];
    if (oldNation && !oldNation.defeated && nation.defeated && nationId !== playerId && neighbors.has(nationId)) {
      events.push(`☠ ${nation.name} 灭亡`);
    }
  }

  for (const relation of current.relations) {
    const oldRelation = previous.relations.find((candidate) => candidate.from === relation.from && candidate.to === relation.to);
    if (relation.treaty === 'alliance' && oldRelation?.treaty !== 'alliance') {
      if (
        relation.from === playerId
        || relation.to === playerId
        || neighbors.has(relation.from)
        || neighbors.has(relation.to)
      ) {
        events.push(`🤝 ${current.nations[relation.from]?.name ?? relation.from} 与 ${current.nations[relation.to]?.name ?? relation.to} 结盟`);
      }
    }

    if (relation.treaty === 'none' && oldRelation?.treaty === 'truce' && oldRelation.truceTurns > 0) {
      if (relation.from === playerId || relation.to === playerId) {
        const other = relation.from === playerId ? relation.to : relation.from;
        events.push(`🕊 与 ${current.nations[other]?.name ?? other} 停战到期，可再宣战`);
      }
    }
  }

  return events.slice(-10);
}

export function collectPlayerProvinceChanges(previous: GameState, current: GameState, playerId: string): ProvinceChange[] {
  const changes: ProvinceChange[] = [];
  for (const [provinceId, province] of Object.entries(current.provinces)) {
    const oldProvince = previous.provinces[provinceId];
    if (!oldProvince || oldProvince.ownerId === province.ownerId) continue;
    if (oldProvince.ownerId !== playerId && province.ownerId !== playerId) continue;
    changes.push({
      id: provinceId,
      name: province.name,
      from: oldProvince.ownerId,
      to: province.ownerId,
    });
  }
  return changes;
}

export function decayRebelNations(state: GameState): void {
  const expired: string[] = [];
  for (const [nationId, nation] of Object.entries(state.nations)) {
    if (nation.rebellionDecay === undefined || !nation.rebelOf) continue;
    nation.rebellionDecay -= 1;
    if (nation.rebellionDecay > 0) continue;

    for (const province of Object.values(state.provinces)) {
      if (province.ownerId !== nationId) continue;
      province.ownerId = nation.rebelOf;
      province.loyalty = 40;
      province.assimilation = 50;
      province.unrest = 30;
      province.rebellionRisk = 20;
    }
    addChronicle(state, {
      id: `rebel_return_${nationId}_${state.turn}`,
      turn: state.turn,
      kind: 'milestone_rebellion',
      title: '叛乱平定',
      desc: `${nation.name.replace('叛军·', '')} 历经 5 年未镇压，自行归顺 ${state.nations[nation.rebelOf]?.name ?? '原主'}。`,
      actorId: nation.rebelOf,
    });
    expired.push(nationId);
  }

  for (const nationId of expired) delete state.nations[nationId];
}
