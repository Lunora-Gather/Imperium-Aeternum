// 每回合后的状态巡检：防止长局越玩数据越脏。
// 它不改变核心玩法，只清理明显非法/卡死状态。

import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types/game';

let installed = false;

function finite(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sanitizeState(state: GameState): GameState {
  const next = { ...state, nations: { ...state.nations }, provinces: { ...state.provinces }, relations: [...state.relations], wars: [...state.wars] };

  // 玩家国兜底：避免读旧档/选国异常后玩家消失。
  if (!next.playerNationId || !next.nations[next.playerNationId]) {
    const fallback = Object.values(next.nations).find((n) => !n.defeated) ?? Object.values(next.nations)[0];
    if (fallback) next.playerNationId = fallback.id;
  }

  for (const n of Object.values(next.nations)) {
    n.isPlayer = n.id === next.playerNationId;
    n.resources.gold = Math.round(finite(n.resources.gold));
    n.resources.food = Math.round(finite(n.resources.food));
    n.resources.wood = Math.max(0, Math.round(finite(n.resources.wood)));
    n.resources.iron = Math.max(0, Math.round(finite(n.resources.iron)));
    n.resources.adminPt = Math.max(0, Math.round(finite(n.resources.adminPt)));
    n.resources.sciPt = Math.max(0, Math.round(finite(n.resources.sciPt)));
    n.resources.influence = Math.max(0, Math.round(finite(n.resources.influence)));
    n.resources.supply = Math.max(0, Math.round(finite(n.resources.supply)));
    n.government.stability = clamp(finite(n.government.stability, 50), 0, 100);
    n.government.legitimacy = clamp(finite(n.government.legitimacy, 50), 0, 100);
    n.government.efficiency = clamp(finite(n.government.efficiency, 50), 0, 100);
    n.government.corruption = clamp(finite(n.government.corruption, 10), 0, 100);
    n.warExhaustion = clamp(finite(n.warExhaustion), 0, 100);
  }

  for (const p of Object.values(next.provinces)) {
    p.population = Math.max(0, Math.round(finite(p.population)));
    p.garrison = Math.max(0, Math.round(finite(p.garrison)));
    p.unrest = clamp(finite(p.unrest), 0, 100);
    p.rebellionRisk = clamp(finite(p.rebellionRisk), 0, 100);
    p.loyalty = clamp(finite(p.loyalty, 50), 0, 100);
    p.assimilation = clamp(finite(p.assimilation, 50), 0, 100);
    p.adjacent = Array.isArray(p.adjacent) ? p.adjacent.filter((id) => !!next.provinces[id] && id !== p.id) : [];
  }

  // 军队不能停在不存在/非己方省份。优先撤到首都，其次任意己方省；无省则解散。
  for (const n of Object.values(next.nations)) {
    const owned = Object.values(next.provinces).filter((p) => p.ownerId === n.id);
    const fallback = owned.find((p) => p.id === n.capital) ?? owned[0];
    n.army = (Array.isArray(n.army) ? n.army : [])
      .filter((a) => a && finite(a.size) > 0)
      .map((a) => {
        const loc = next.provinces[a.location];
        const safeLocation = loc && loc.ownerId === n.id ? a.location : fallback?.id;
        if (!safeLocation) return null;
        return {
          ...a,
          location: safeLocation,
          size: Math.max(0, Math.round(finite(a.size))),
          morale: clamp(finite(a.morale, 50), 0, 100),
          training: clamp(finite(a.training, 50), 0, 100),
          equipment: clamp(finite(a.equipment, 50), 0, 100),
          supply: clamp(finite(a.supply, 50), 0, 100),
        };
      })
      .filter((a): a is NonNullable<typeof a> => !!a);
    if (owned.length === 0 && n.id !== next.playerNationId) n.defeated = true;
  }

  // 战争双方/目标必须仍有效，重复反向战争只留一场。
  const seenWars = new Set<string>();
  next.wars = next.wars.filter((w) => {
    if (!next.nations[w.attackerId] || !next.nations[w.defenderId] || !next.provinces[w.targetProvinceId]) return false;
    if (next.nations[w.attackerId].defeated || next.nations[w.defenderId].defeated) return false;
    const key = [w.attackerId, w.defenderId].sort().join('|');
    if (seenWars.has(key)) return false;
    seenWars.add(key);
    return true;
  });

  const activeWarNations = new Set<string>();
  next.wars.forEach((w) => { activeWarNations.add(w.attackerId); activeWarNations.add(w.defenderId); });
  for (const n of Object.values(next.nations)) n.atWar = activeWarNations.has(n.id);

  // 关系表只保留有效国家，数值夹紧。
  next.relations = next.relations.filter((r) => next.nations[r.from] && next.nations[r.to] && r.from !== r.to)
    .map((r) => ({
      ...r,
      relation: clamp(finite(r.relation), -100, 100),
      trust: clamp(finite(r.trust, 50), 0, 100),
      threat: clamp(finite(r.threat), 0, 100),
      tradeDep: clamp(finite(r.tradeDep), 0, 100),
      truceTurns: Math.max(0, Math.round(finite(r.truceTurns))),
    }));

  next._relMap = undefined;
  return next;
}

export function installStateHygiene(): void {
  if (installed) return;
  installed = true;
  const originalNextTurn = (useGameStore.getState() as unknown as { nextTurn?: () => unknown }).nextTurn;
  useGameStore.setState({
    nextTurn: () => {
      const result = originalNextTurn?.();
      const state = useGameStore.getState().state;
      useGameStore.setState({ state: sanitizeState(state) });
      return result;
    },
  } as never);
}
