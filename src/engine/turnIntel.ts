import type { GameState, Nation, Province } from '../types/game';
import { invalidateRelationMap } from './init';
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
      const oldOwner = previous.provinces[adjacentId]?.ownerId;
      if (oldOwner && oldOwner !== playerId) neighbors.add(oldOwner);
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

  const oldTreaties = new Map(previous.relations.map((r) => [`${r.from}|${r.to}`, r]));
  const announced = new Set<string>();
  for (const { from, to, treaty } of current.relations) {
    const involvesPlayer = from === playerId || to === playerId;
    if (!involvesPlayer && !neighbors.has(from) && !neighbors.has(to)) continue;
    const pair = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (announced.has(pair)) continue;
    const old = oldTreaties.get(`${from}|${to}`);
    if (treaty === 'alliance' && old?.treaty !== 'alliance') {
      events.push(`🤝 ${current.nations[from]?.name ?? from} 与 ${current.nations[to]?.name ?? to} 结盟`);
    } else if (involvesPlayer && treaty === 'none' && old?.treaty === 'truce' && old.truceTurns > 0) {
      const other = from === playerId ? to : from;
      events.push(`🕊 与 ${current.nations[other]?.name ?? other} 停战到期，可再宣战`);
    } else continue;
    announced.add(pair);
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

export function recognizeRebelIndependence(nation: Nation): void {
  delete nation.rebellionDecay;
  delete nation.rebelOf;
  nation.name = nation.name.replace(/^叛军·/, '');
}

export function decayRebelNations(state: GameState): void {
  const expired: string[] = [];
  for (const [nationId, nation] of Object.entries(state.nations)) {
    if (nation.rebellionDecay === undefined || !nation.rebelOf) continue;
    if (nation.defeated) {
      expired.push(nationId);
      continue;
    }
    nation.rebellionDecay -= 1;
    if (nation.rebellionDecay > 0) continue;

    const parent = state.nations[nation.rebelOf];
    if (!parent || parent.defeated) {
      recognizeRebelIndependence(nation);
      if (parent?.civilWar?.active) parent.civilWar = { active: false, rebels: [] };
      continue;
    }
    for (const province of Object.values(state.provinces)) {
      if (province.ownerId !== nationId) continue;
      province.ownerId = parent.id;
      province.isCapital = parent.capital === province.id;
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
      desc: `${nation.name.replace('叛军·', '')} 历经 5 年未镇压，自行归顺 ${parent.name}。`,
      actorId: parent.id,
    });
    expired.push(nationId);
  }

  removeRebelNations(state, expired);
}

export function syncWarFlags(state: GameState): void {
  const atWar = new Set(state.wars.flatMap((war) => [war.attackerId, war.defenderId]));
  for (const nation of Object.values(state.nations)) nation.atWar = atWar.has(nation.id);
}

export function removeRebelNations(state: GameState, ids: readonly string[]): void {
  if (!ids.length) return;
  const removed = new Set(ids);
  for (const id of removed) {
    delete state.nations[id];
    if (state.aiMemory) delete state.aiMemory[id];
    if (state.aiStrategyMeta) delete state.aiStrategyMeta[id];
  }
  for (const nation of Object.values(state.nations)) {
    if (!nation.civilWar?.active) continue;
    const rebels = nation.civilWar.rebels.filter((id) => !removed.has(id));
    nation.civilWar = { active: rebels.length > 0, rebels };
  }
  state.wars = state.wars.filter((w) => !removed.has(w.attackerId) && !removed.has(w.defenderId));
  syncWarFlags(state);
  state.relations = state.relations.filter((r) => !removed.has(r.from) && !removed.has(r.to));
  invalidateRelationMap(state);
  state.diplomaticSummits = state.diplomaticSummits.filter((s) => !removed.has(s.initiatorId) && !removed.has(s.targetId));
  state.diplomaticAccords = state.diplomaticAccords.filter((a) => !removed.has(a.partyA) && !removed.has(a.partyB));
  const keepEvent = (e: { nationId?: string }) => !e.nationId || !removed.has(e.nationId);
  state.triggeredEvents = state.triggeredEvents.filter(keepEvent);
  state.eventCooldowns = state.eventCooldowns.filter(keepEvent);
  state.pendingEvents = state.pendingEvents.filter(keepEvent);
  if (state.pendingEventOptions && !keepEvent(state.pendingEventOptions)) state.pendingEventOptions = null;
}
