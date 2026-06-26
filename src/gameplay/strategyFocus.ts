// 战略焦点层：玩家国策 + AI 长期战略
// 1) 玩家国策：总览页右侧国策按钮继续生效。
// 2) AI 战略：各国每回合形成扩张、贸易、修复、防御、研发等长期倾向。

import { useGameStore } from '../store/gameStore';
import type { GameState, Nation, Province, DiplomaticRelation } from '../types/game';

let installed = false;

export type StrategyFocusId = 'balance' | 'stability' | 'prosperity' | 'military' | 'diplomacy' | 'reform';
type AIFocusKind = 'expansion' | 'trade' | 'recovery' | 'defense' | 'research';

interface AIFocusEntry {
  kind: AIFocusKind;
  sinceTurn: number;
  targetId?: string;
  intensity: number;
}

export interface AIStrategyInfo {
  kind: AIFocusKind;
  label: string;
  targetId?: string;
  targetName?: string;
  intensity: number;
  sinceTurn: number;
}

type StrategicState = GameState & {
  strategyFocus?: StrategyFocusId;
  aiStrategyMeta?: Record<string, AIFocusEntry>;
};

const AI_LABEL: Record<AIFocusKind, string> = {
  expansion: '扩张',
  trade: '贸易',
  recovery: '修复',
  defense: '防御',
  research: '研发',
};

function clamp(v: number, min = 0, max = 100): number {
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

function applyPlayerFocus(state: GameState, focus: StrategyFocusId): { state: GameState; note: string } {
  const pid = playerId(state);
  const player = state.nations[pid];
  if (!player) return { state, note: '' };

  const next: StrategicState = {
    ...state,
    nations: { ...state.nations, [pid]: { ...player, resources: { ...player.resources }, government: { ...player.government }, army: player.army.map((a) => ({ ...a })) } },
    provinces: { ...state.provinces },
    relations: state.relations.map((r) => ({ ...r })),
  } as StrategicState;
  next.strategyFocus = focus;

  const p = next.nations[pid] as Nation;
  const provs = provincesOf(next, pid);
  const scale = Math.max(1, Math.min(12, provs.length));

  if (focus === 'balance') {
    p.resources.adminPt += 1;
    return { state: next, note: '均衡国策：行政点 +1' };
  }

  if (focus === 'stability') {
    p.government.stability = clamp(p.government.stability + 1);
    p.resources.gold -= Math.max(4, Math.round(scale * 1.5));
    for (const prov of provs) next.provinces[prov.id] = { ...prov, unrest: clamp(prov.unrest - 1), rebellionRisk: clamp(prov.rebellionRisk - 1) };
    return { state: next, note: '安民国策：安定 +1，地方不满下降' };
  }

  if (focus === 'prosperity') {
    p.resources.gold += Math.round(6 + scale * 3);
    p.resources.food += Math.round(8 + scale * 4);
    p.government.corruption = clamp(p.government.corruption + 0.5);
    return { state: next, note: '富国国策：国库与粮储增长，腐败略升' };
  }

  if (focus === 'military') {
    p.resources.supply += 8;
    p.warExhaustion = clamp(p.warExhaustion + 0.5);
    p.army = p.army.map((a) => ({ ...a, morale: clamp(a.morale + 1), training: clamp(a.training + 1), supply: clamp(a.supply + 2) }));
    return { state: next, note: '强军国策：补给增长，军队士气与训练提升' };
  }

  if (focus === 'diplomacy') {
    p.resources.influence += 4;
    for (const r of next.relations) {
      if (r.from === pid || r.to === pid) {
        r.relation = clamp(r.relation + 1, -100, 100);
        r.trust = clamp(r.trust + 0.5, 0, 100);
        r.threat = clamp(r.threat - 0.5, 0, 100);
      }
    }
    return { state: next, note: '睦邻国策：影响力增加，周边关系略有改善' };
  }

  p.resources.sciPt += 4;
  p.resources.adminPt += 1;
  p.government.stability = clamp(p.government.stability - 1);
  return { state: next, note: '改革国策：科研与行政增长，短期安定承压' };
}

function chooseAITarget(state: GameState, nation: Nation, focus: AIFocusKind): string | undefined {
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

function decideAIFocus(state: GameState, nation: Nation): AIFocusKind {
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
  const border = provincesOf(state, nation.id).find((p) => p.adjacent.some((id) => state.provinces[id] && state.provinces[id].ownerId !== nation.id));
  if (border) border.garrison = clamp(Math.round(border.garrison + 8), 0, 600);
}

function applyAIFocusEffect(state: StrategicState, nation: Nation, entry: AIFocusEntry): void {
  const target = entry.targetId;
  const intensity = clamp(entry.intensity, 1, 6);

  if (entry.kind === 'recovery') {
    nation.government.stability = clamp(nation.government.stability + 1);
    nation.government.corruption = clamp(nation.government.corruption - 0.5);
    const troubled = provincesOf(state, nation.id).sort((a, b) => (b.unrest + b.rebellionRisk) - (a.unrest + a.rebellionRisk))[0];
    if (troubled) {
      troubled.unrest = clamp(troubled.unrest - 3);
      troubled.rebellionRisk = clamp(troubled.rebellionRisk - 2);
    }
    if (nation.tier === 'C' || nation.tier === 'D') nation.resources.gold += 4;
    return;
  }

  if (entry.kind === 'defense') {
    nation.warExhaustion = clamp(nation.warExhaustion - 1);
    reinforceBorder(state, nation);
    if (target) for (const r of bothRelations(state, nation.id, target)) r.threat = clamp(r.threat + intensity);
    return;
  }

  if (entry.kind === 'trade') {
    nation.resources.influence = clamp(nation.resources.influence + 2, 0, 9999);
    if (target) {
      for (const r of bothRelations(state, nation.id, target)) {
        if (r.treaty !== 'war' && r.treaty !== 'truce') {
          r.relation = clamp(r.relation + 2, -100, 100);
          r.trust = clamp(r.trust + 1);
          if (r.relation >= 55 && r.trust >= 45 && r.treaty === 'none') r.treaty = 'trade';
        }
      }
    }
    return;
  }

  if (entry.kind === 'research') {
    nation.resources.sciPt = clamp(nation.resources.sciPt + 4 + Math.floor(nation.tech.admin / 2), 0, 99999);
    nation.resources.influence = clamp(nation.resources.influence + 1, 0, 9999);
    if (target) for (const r of bothRelations(state, nation.id, target)) if (r.treaty !== 'war') r.trust = clamp(r.trust + 1);
    return;
  }

  nation.resources.supply = clamp(nation.resources.supply + 3, 0, 99999);
  reinforceBorder(state, nation);
  if (target) {
    for (const r of bothRelations(state, nation.id, target)) {
      if (r.treaty !== 'alliance' && r.treaty !== 'trade') {
        r.threat = clamp(r.threat + 2 + intensity);
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

function applyAIStrategy(state: GameState): GameState {
  const next = state as StrategicState;
  next.aiStrategyMeta = next.aiStrategyMeta ?? {};
  const messages: string[] = [];

  for (const nation of Object.values(next.nations)) {
    if (nation.defeated || nation.id === playerId(next)) continue;
    const focus = decideAIFocus(next, nation);
    const current = next.aiStrategyMeta[nation.id];
    const target = chooseAITarget(next, nation, focus);
    const changed = !current || current.kind !== focus || current.targetId !== target;
    const intensity = changed ? 1 : clamp((current?.intensity ?? 1) + 1, 1, 6);
    const entry: AIFocusEntry = { kind: focus, targetId: target, sinceTurn: changed ? next.turn : (current?.sinceTurn ?? next.turn), intensity };
    next.aiStrategyMeta[nation.id] = entry;
    applyAIFocusEffect(next, nation, entry);

    if (changed && isPlayerRelevant(next, nation.id)) {
      const targetName = target ? `：${next.nations[target]?.name ?? target}` : '';
      messages.push(`◇ ${nation.name} 转向${AI_LABEL[focus]}战略${targetName}`);
    }
  }

  for (const msg of messages.slice(0, 4)) appendWorldEvent(next, msg);
  next._relMap = undefined;
  return next;
}

export function getAIStrategyInfo(state: GameState, nationId: string): AIStrategyInfo | null {
  const entry = (state as StrategicState).aiStrategyMeta?.[nationId];
  if (!entry) return null;
  return {
    kind: entry.kind,
    label: AI_LABEL[entry.kind],
    targetId: entry.targetId,
    targetName: entry.targetId ? state.nations[entry.targetId]?.name : undefined,
    intensity: entry.intensity,
    sinceTurn: entry.sinceTurn,
  };
}

export function installStrategyFocus(): void {
  if (installed) return;
  installed = true;
  const originalNextTurn = (useGameStore.getState() as unknown as { nextTurn?: () => unknown }).nextTurn;

  useGameStore.setState({
    setStrategyFocus: (id: StrategyFocusId) => {
      const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void };
      const old = ((cur.state as StrategicState).strategyFocus ?? 'balance') as StrategyFocusId;
      if (old === id) return;
      useGameStore.setState({ state: { ...cur.state, strategyFocus: id } as GameState } as never);
      const label: Record<StrategyFocusId, string> = { balance: '均衡', stability: '安民', prosperity: '富国', military: '强军', diplomacy: '睦邻', reform: '改革' };
      cur.logMsg?.(`国策焦点改为：${label[id]}`);
    },
    nextTurn: () => {
      const result = originalNextTurn?.();
      const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void };
      if (cur.state.victory.type) return result;
      const focus = (((cur.state as StrategicState).strategyFocus) ?? 'balance') as StrategyFocusId;
      const playerApplied = applyPlayerFocus(cur.state, focus);
      let next = playerApplied.state;
      next = applyAIStrategy(next);
      useGameStore.setState({ state: next } as never);
      if (playerApplied.note) cur.logMsg?.(playerApplied.note);
      return result;
    },
  } as never);
}
