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

  next.relations = next.relations.filter((r) => next.nations[r.from] && next.nations[r.to] && r.from !== r.to)
    .map((r) => ({
      ...r,
      relation: clamp(finite(r.relation), -100, 100),
      trust: clamp(finite(r.trust, 50), 0, 100),
      threat: clamp(finite(r.threat), 0, 100),
      tradeDep: clamp(finite(r.tradeDep), 0, 100),
      truceTurns: Math.max(0, Math.round(finite(r.truceTurns))),
    }));

  // 双向外交同步：战争/停战/同盟/贸易这种条约必须两边一致，否则 UI 和 AI 会判断不一致。
  const byKey = new Map(next.relations.map((r) => [`${r.from}|${r.to}`, r]));
  for (const r of next.relations) {
    const rev = byKey.get(`${r.to}|${r.from}`);
    if (!rev) continue;
    if (r.treaty === 'war' || r.treaty === 'truce' || r.treaty === 'alliance' || r.treaty === 'trade') {
      rev.treaty = r.treaty;
      rev.truceTurns = Math.max(rev.truceTurns, r.truceTurns);
      rev.relation = Math.min(rev.relation, r.relation);
      rev.trust = Math.min(rev.trust, r.trust);
    }
  }

  // 正在战争列表里的双方强制关系为 war，避免 AI 内联宣战只改一边。
  for (const w of next.wars) {
    const a = byKey.get(`${w.attackerId}|${w.defenderId}`);
    const b = byKey.get(`${w.defenderId}|${w.attackerId}`);
    if (a) { a.treaty = 'war'; a.relation = -100; }
    if (b) { b.treaty = 'war'; b.relation = -100; }
  }

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
