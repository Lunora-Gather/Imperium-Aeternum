// AI 战略焦点层：不替代原 AI，只在每回合后给各国补一层长期倾向。
// 目标：让 AI 不再像完全随机短视，而是有扩张、贸易、修复、防御、研发等持续方向。

import { useGameStore } from '../store/gameStore';
import type { GameState, Nation, Province, DiplomaticRelation } from '../types/game';

let installed = false;

type FocusKind = 'expansion' | 'trade' | 'recovery' | 'defense' | 'research';

interface FocusEntry {
  kind: FocusKind;
  sinceTurn: number;
  targetId?: string;
  intensity: number;
}

type StrategicState = GameState & {
  aiStrategyMeta?: Record<string, FocusEntry>;
};

const FOCUS_LABEL: Record<FocusKind, string> = {
  expansion: '扩张',
  trade: '贸易',
  recovery: '修复',
  defense: '防御',
  research: '研发',
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function playerId(state: GameState): string {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  return Object.values(state.nations).find((n) => n.isPlayer && !n.defeated)?.id ?? Object.keys(state.nations)[0];
}

function provincesOf(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function relationOf(state: GameState, from: string, to: string): DiplomaticRelation | undefined {
  return state.relations.find((r) => r.from === from && r.to === to);
}

function bothRelations(state: GameState, a: string, b: string): DiplomaticRelation[] {
  return state.relations.filter((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
}

function neighborsOf(state: GameState, nationId: string): string[] {
  const ids = new Set<string>();
  for (const p of provincesOf(state, nationId)) {
    for (const adjId of p.adjacent) {
      const adj = state.provinces[adjId];
      if (adj && adj.ownerId !== nationId && state.nations[adj.ownerId] && !state.nations[adj.ownerId].defeated) ids.add(adj.ownerId);
    }
  }
  return [...ids];
}

function isPlayerRelevant(state: GameState, nationId: string): boolean {
  const pid = playerId(state);
  if (nationId === pid) return true;
  return neighborsOf(state, pid).includes(nationId) || state.wars.some((w) => [w.attackerId, w.defenderId].includes(pid) && [w.attackerId, w.defenderId].includes(nationId));
}

function chooseTarget(state: GameState, nation: Nation, focus: FocusKind): string | undefined {
  const neighbors = neighborsOf(state, nation.id);
  if (neighbors.length === 0) return undefined;
  const ranked = neighbors
    .map((id) => ({ id, rel: relationOf(state, nation.id, id)?.relation ?? 0, threat: relationOf(state, nation.id, id)?.threat ?? 0, tier: state.nations[id]?.tier ?? 'D' }))
    .filter((x) => !state.nations[x.id]?.defeated);

  if (focus === 'trade' || focus === 'research') return ranked.sort((a, b) => b.rel - a.rel)[0]?.id;
  if (focus === 'defense') return ranked.sort((a, b) => b.threat - a.threat)[0]?.id;
  if (focus === 'expansion') return ranked.sort((a, b) => a.rel - b.rel || String(a.tier).localeCompare(String(b.tier)))[0]?.id;
  return ranked.sort((a, b) => b.rel - a.rel)[0]?.id;
}

function decideFocus(state: GameState, nation: Nation): FocusKind {
  const owned = provincesOf(state, nation.id);
  const atWar = state.wars.some((w) => w.attackerId === nation.id || w.defenderId === nation.id);
  const avgUnrest = owned.length ? owned.reduce((s, p) => s + p.unrest + p.rebellionRisk * 0.6, 0) / owned.length : 0;
  const armySize = nation.army.reduce((s, a) => s + a.size, 0);
  const poor = nation.resources.gold < 60 || nation.resources.food < 80;

  if (poor || nation.government.stability < 35 || avgUnrest > 55) return 'recovery';
  if (atWar || nation.warExhaustion > 45) return 'defense';
  if (nation.character === 'commerce' || nation.character === 'maritime' || nation.government.type === 'merchant_republic') return 'trade';
  if (nation.character === 'scholarly' || nation.tech.admin + nation.tech.agri + nation.tech.mil + nation.tech.culture < 8) return 'research';
  if (nation.character === 'militarism' || nation.character === 'expansionist' || armySize > Math.max(120, owned.length * 70)) return 'expansion';
  if (nation.tier === 'S' || nation.tier === 'A') return 'expansion';
  return 'trade';
}

function reinforceBorder(state: GameState, nation: Nation): void {
  const owned = provincesOf(state, nation.id);
  const border = owned.find((p) => p.adjacent.some((id) => state.provinces[id] && state.provinces[id].ownerId !== nation.id));
  if (!border) return;
  border.garrison = clamp(Math.round(border.garrison + 8), 0, 600);
}

function applyFocusEffect(state: StrategicState, nation: Nation, entry: FocusEntry): void {
  const target = entry.targetId;
  const intensity = clamp(entry.intensity, 1, 6);

  if (entry.kind === 'recovery') {
    nation.government.stability = clamp(nation.government.stability + 1, 0, 100);
    nation.government.corruption = clamp(nation.government.corruption - 0.5, 0, 100);
    const troubled = provincesOf(state, nation.id).sort((a, b) => (b.unrest + b.rebellionRisk) - (a.unrest + a.rebellionRisk))[0];
    if (troubled) {
      troubled.unrest = clamp(troubled.unrest - 3, 0, 100);
      troubled.rebellionRisk = clamp(troubled.rebellionRisk - 2, 0, 100);
    }
    if (nation.tier === 'C' || nation.tier === 'D') nation.resources.gold += 4;
    return;
  }

  if (entry.kind === 'defense') {
    nation.warExhaustion = clamp(nation.warExhaustion - 1, 0, 100);
    reinforceBorder(state, nation);
    if (target) {
      for (const r of bothRelations(state, nation.id, target)) r.threat = clamp(r.threat + intensity, 0, 100);
    }
    return;
  }

  if (entry.kind === 'trade') {
    nation.resources.influence = clamp(nation.resources.influence + 2, 0, 9999);
    if (target) {
      for (const r of bothRelations(state, nation.id, target)) {
        if (r.treaty !== 'war' && r.treaty !== 'truce') {
          r.relation = clamp(r.relation + 2, -100, 100);
          r.trust = clamp(r.trust + 1, 0, 100);
          if (r.relation >= 55 && r.trust >= 45 && r.treaty === 'none') r.treaty = 'trade';
        }
      }
    }
    return;
  }

  if (entry.kind === 'research') {
    nation.resources.sciPt = clamp(nation.resources.sciPt + 4 + Math.floor(nation.tech.admin / 2), 0, 99999);
    nation.resources.influence = clamp(nation.resources.influence + 1, 0, 9999);
    if (target) {
      for (const r of bothRelations(state, nation.id, target)) {
        if (r.treaty !== 'war') r.trust = clamp(r.trust + 1, 0, 100);
      }
    }
    return;
  }

  // expansion：不是直接强制宣战，而是逐步制造威胁、备战和边境压力，让原 AI 更容易接上宣战。
  nation.resources.supply = clamp(nation.resources.supply + 3, 0, 99999);
  reinforceBorder(state, nation);
  if (target) {
    for (const r of bothRelations(state, nation.id, target)) {
      if (r.treaty !== 'alliance' && r.treaty !== 'trade') {
        r.threat = clamp(r.threat + 2 + intensity, 0, 100);
        r.relation = clamp(r.relation - 1 - Math.floor(intensity / 3), -100, 100);
      }
    }
  }
}

function appendWorldEvent(state: GameState, text: string): void {
  if (!state.lastReport) return;
  const old = state.lastReport.worldEvents ?? [];
  if (old.includes(text)) return;
  state.lastReport = { ...state.lastReport, worldEvents: [...old, text].slice(-10) };
  if (Array.isArray(state.history) && state.history.length > 0) {
    const last = state.history[state.history.length - 1];
    if (last.turn === state.lastReport.turn) state.history[state.history.length - 1] = state.lastReport;
  }
}

function applyStrategicFocus(state: GameState): GameState {
  const next = state as StrategicState;
  next.aiStrategyMeta = next.aiStrategyMeta ?? {};
  const messages: string[] = [];

  for (const nation of Object.values(next.nations)) {
    if (nation.defeated || nation.id === playerId(next)) continue;
    const focus = decideFocus(next, nation);
    const current = next.aiStrategyMeta[nation.id];
    const target = chooseTarget(next, nation, focus);
    const changed = !current || current.kind !== focus || current.targetId !== target;
    const intensity = changed ? 1 : clamp((current?.intensity ?? 1) + 1, 1, 6);
    const entry: FocusEntry = { kind: focus, targetId: target, sinceTurn: changed ? next.turn : (current?.sinceTurn ?? next.turn), intensity };
    next.aiStrategyMeta[nation.id] = entry;
    applyFocusEffect(next, nation, entry);

    if (changed && isPlayerRelevant(next, nation.id)) {
      const targetName = target ? `：${next.nations[target]?.name ?? target}` : '';
      messages.push(`◇ ${nation.name} 转向${FOCUS_LABEL[focus]}战略${targetName}`);
    }
  }

  for (const msg of messages.slice(0, 4)) appendWorldEvent(next, msg);
  next._relMap = undefined;
  return next;
}

export function installStrategyFocus(): void {
  if (installed) return;
  installed = true;
  const originalNextTurn = (useGameStore.getState() as unknown as { nextTurn?: () => unknown }).nextTurn;
  useGameStore.setState({
    nextTurn: () => {
      const result = originalNextTurn?.();
      const state = useGameStore.getState().state;
      useGameStore.setState({ state: applyStrategicFocus(state) });
      return result;
    },
  } as never);
}
