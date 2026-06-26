// 战略焦点层：玩家国策 + AI 长期战略 + AI 记忆 + AI 领土野心
// 玩家国策保证总览页按钮有效；AI 记忆让国家长期记住宿敌、伙伴、关注目标和领土野心。

import { useGameStore } from '../store/gameStore';
import type { GameState, Nation, Province, DiplomaticRelation } from '../types/game';

let installed = false;

export type StrategyFocusId = 'balance' | 'stability' | 'prosperity' | 'military' | 'diplomacy' | 'reform';
type AIFocusKind = 'expansion' | 'trade' | 'recovery' | 'defense' | 'research';

interface AIFocusEntry { kind: AIFocusKind; sinceTurn: number; targetId?: string; intensity: number; }
interface TerritoryMemory { coreProvinceId?: string; desiredProvinceId?: string; revengeProvinceId?: string; pressure: number; lastUpdated: number; }
interface AIMemoryEntry { rivalId?: string; rivalScore: number; partnerId?: string; partnerScore: number; watchId?: string; watchScore: number; territory?: TerritoryMemory; lastUpdated: number; }

export interface AIStrategyInfo {
  kind: AIFocusKind; label: string; targetId?: string; targetName?: string; intensity: number; sinceTurn: number;
  rivalId?: string; rivalName?: string; rivalScore?: number; partnerId?: string; partnerName?: string; partnerScore?: number; watchId?: string; watchName?: string; watchScore?: number;
  coreProvinceId?: string; coreProvinceName?: string; desiredProvinceId?: string; desiredProvinceName?: string; revengeProvinceId?: string; revengeProvinceName?: string; territorialPressure?: number;
}

type StrategicState = GameState & { strategyFocus?: StrategyFocusId; aiStrategyMeta?: Record<string, AIFocusEntry>; aiMemory?: Record<string, AIMemoryEntry>; };

const AI_LABEL: Record<AIFocusKind, string> = { expansion: '扩张', trade: '贸易', recovery: '修复', defense: '防御', research: '研发' };
function clamp(v: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, v)); }
function playerId(state: GameState): string { if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId; return Object.values(state.nations).find((n) => n.isPlayer && !n.defeated)?.id ?? Object.keys(state.nations)[0]; }
function provincesOf(state: GameState, nationId: string): Province[] { return Object.values(state.provinces).filter((p) => p.ownerId === nationId); }
function relationOf(state: GameState, from: string, to: string): DiplomaticRelation | undefined { return state.relations.find((r) => r.from === from && r.to === to); }
function bothRelations(state: GameState, a: string, b: string): DiplomaticRelation[] { return state.relations.filter((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a)); }
function neighborsOf(state: GameState, nationId: string): string[] { const ids = new Set<string>(); for (const p of provincesOf(state, nationId)) for (const adjId of p.adjacent) { const adj = state.provinces[adjId]; if (adj && adj.ownerId !== nationId && state.nations[adj.ownerId] && !state.nations[adj.ownerId].defeated) ids.add(adj.ownerId); } return [...ids]; }
function armySize(n: Nation): number { return n.army.reduce((s, a) => s + a.size, 0); }
function isPlayerRelevant(state: GameState, nationId: string): boolean { const pid = playerId(state); return nationId === pid || neighborsOf(state, pid).includes(nationId) || state.wars.some((w) => [w.attackerId, w.defenderId].includes(pid) && [w.attackerId, w.defenderId].includes(nationId)); }
function provName(state: GameState, id?: string): string | undefined { return id ? state.provinces[id]?.name : undefined; }

function applyPlayerFocus(state: GameState, focus: StrategyFocusId): { state: GameState; note: string } {
  const pid = playerId(state); const player = state.nations[pid]; if (!player) return { state, note: '' };
  const next: StrategicState = { ...state, nations: { ...state.nations, [pid]: { ...player, resources: { ...player.resources }, government: { ...player.government }, army: player.army.map((a) => ({ ...a })) } }, provinces: { ...state.provinces }, relations: state.relations.map((r) => ({ ...r })) } as StrategicState;
  next.strategyFocus = focus; const p = next.nations[pid] as Nation; const provs = provincesOf(next, pid); const scale = Math.max(1, Math.min(12, provs.length));
  if (focus === 'balance') { p.resources.adminPt += 1; return { state: next, note: '均衡国策：行政点 +1' }; }
  if (focus === 'stability') { p.government.stability = clamp(p.government.stability + 1); p.resources.gold -= Math.max(4, Math.round(scale * 1.5)); for (const prov of provs) next.provinces[prov.id] = { ...prov, unrest: clamp(prov.unrest - 1), rebellionRisk: clamp(prov.rebellionRisk - 1) }; return { state: next, note: '安民国策：安定 +1，地方不满下降' }; }
  if (focus === 'prosperity') { p.resources.gold += Math.round(6 + scale * 3); p.resources.food += Math.round(8 + scale * 4); p.government.corruption = clamp(p.government.corruption + 0.5); return { state: next, note: '富国国策：国库与粮储增长，腐败略升' }; }
  if (focus === 'military') { p.resources.supply += 8; p.warExhaustion = clamp(p.warExhaustion + 0.5); p.army = p.army.map((a) => ({ ...a, morale: clamp(a.morale + 1), training: clamp(a.training + 1), supply: clamp(a.supply + 2) })); return { state: next, note: '强军国策：补给增长，军队士气与训练提升' }; }
  if (focus === 'diplomacy') { p.resources.influence += 4; for (const r of next.relations) if (r.from === pid || r.to === pid) { r.relation = clamp(r.relation + 1, -100, 100); r.trust = clamp(r.trust + 0.5, 0, 100); r.threat = clamp(r.threat - 0.5, 0, 100); } return { state: next, note: '睦邻国策：影响力增加，周边关系略有改善' }; }
  p.resources.sciPt += 4; p.resources.adminPt += 1; p.government.stability = clamp(p.government.stability - 1); return { state: next, note: '改革国策：科研与行政增长，短期安定承压' };
}

function borderProvinces(state: GameState, nationId: string): Province[] {
  return provincesOf(state, nationId).filter((p) => p.adjacent.some((id) => state.provinces[id] && state.provinces[id].ownerId !== nationId));
}
function bestDesiredProvince(state: GameState, nation: Nation): { id?: string; score: number } {
  let best: { id?: string; score: number } = { score: 0 };
  for (const p of borderProvinces(state, nation.id)) for (const adjId of p.adjacent) {
    const adj = state.provinces[adjId]; if (!adj || adj.ownerId === nation.id) continue;
    const rel = relationOf(state, nation.id, adj.ownerId); const enemy = state.nations[adj.ownerId];
    const richness = adj.population * 0.012 + adj.agriBase * 7 + adj.buildings.length * 10 + (adj.isCapital ? 28 : 0);
    const hostility = Math.max(0, -(rel?.relation ?? 0)) * 0.45 + (rel?.threat ?? 0) * 0.35;
    const weakness = Math.max(0, armySize(nation) - armySize(enemy)) / Math.max(80, armySize(enemy) + 1) * 12;
    const score = richness + hostility + weakness;
    if (score > best.score) best = { id: adj.id, score };
  }
  return best;
}
function bestCoreProvince(state: GameState, nation: Nation): string | undefined {
  const owned = provincesOf(state, nation.id);
  return owned.sort((a, b) => (b.isCapital ? 10000 : 0) + b.population + b.agriBase * 50 + b.garrison * 0.5 - ((a.isCapital ? 10000 : 0) + a.population + a.agriBase * 50 + a.garrison * 0.5))[0]?.id;
}
function revengeProvince(state: GameState, nation: Nation): string | undefined {
  const wars = state.wars.filter((w) => [w.attackerId, w.defenderId].includes(nation.id));
  const losing = wars.sort((a, b) => b.progress - a.progress)[0];
  if (!losing) return undefined;
  return losing.progress > 55 ? losing.targetProvinceId : undefined;
}

function scoreTargets(state: GameState, nation: Nation) {
  const neighbors = neighborsOf(state, nation.id);
  return neighbors.map((id) => { const target = state.nations[id]; const rel = relationOf(state, nation.id, id); const war = state.wars.some((w) => [w.attackerId, w.defenderId].includes(nation.id) && [w.attackerId, w.defenderId].includes(id)); const myArmy = armySize(nation); const otherArmy = target ? armySize(target) : 0; const relation = rel?.relation ?? 0; const threat = rel?.threat ?? 0; const trust = rel?.trust ?? 50; const weakness = Math.max(0, myArmy - otherArmy) / Math.max(80, otherArmy + 1); return { id, relation, threat, trust, treaty: rel?.treaty ?? 'none', rival: (war ? 80 : 0) + threat * 0.8 + Math.max(0, -relation) * 0.7 + weakness * 12, partner: (rel?.treaty === 'trade' ? 45 : 0) + (rel?.treaty === 'alliance' ? 55 : 0) + Math.max(0, relation) * 0.7 + trust * 0.4, watch: threat * 0.7 + Math.abs(relation) * 0.25 + Math.max(0, otherArmy - myArmy) / Math.max(80, myArmy + 1) * 20 }; }).filter((x) => !!state.nations[x.id] && !state.nations[x.id].defeated);
}

function updateAIMemory(state: StrategicState, nation: Nation): AIMemoryEntry {
  state.aiMemory = state.aiMemory ?? {};
  const old = state.aiMemory[nation.id] ?? { rivalScore: 0, partnerScore: 0, watchScore: 0, lastUpdated: state.turn };
  const scored = scoreTargets(state, nation); const rival = [...scored].sort((a, b) => b.rival - a.rival)[0]; const partner = [...scored].sort((a, b) => b.partner - a.partner)[0]; const watch = [...scored].sort((a, b) => b.watch - a.watch)[0];
  const desired = bestDesiredProvince(state, nation); const core = bestCoreProvince(state, nation); const revenge = revengeProvince(state, nation);
  const oldTerr = old.territory;
  const terr: TerritoryMemory = { coreProvinceId: core ?? oldTerr?.coreProvinceId, desiredProvinceId: desired.score >= 32 ? desired.id : oldTerr?.desiredProvinceId, revengeProvinceId: revenge ?? oldTerr?.revengeProvinceId, pressure: clamp(Math.max((oldTerr?.pressure ?? 0) * 0.8, desired.score, revenge ? 70 : 0), 0, 100), lastUpdated: state.turn };
  const next: AIMemoryEntry = { rivalId: rival && rival.rival >= 35 ? rival.id : old.rivalId, rivalScore: clamp(Math.max((old.rivalScore ?? 0) * 0.72, rival?.rival ?? 0), 0, 100), partnerId: partner && partner.partner >= 45 ? partner.id : old.partnerId, partnerScore: clamp(Math.max((old.partnerScore ?? 0) * 0.76, partner?.partner ?? 0), 0, 100), watchId: watch && watch.watch >= 30 ? watch.id : old.watchId, watchScore: clamp(Math.max((old.watchScore ?? 0) * 0.78, watch?.watch ?? 0), 0, 100), territory: terr, lastUpdated: state.turn };
  state.aiMemory[nation.id] = next; return next;
}

function chooseAITarget(state: StrategicState, nation: Nation, focus: AIFocusKind, memory?: AIMemoryEntry): string | undefined { const scored = scoreTargets(state, nation); if (scored.length === 0) return undefined; if ((focus === 'expansion' || focus === 'defense') && memory?.rivalId && state.nations[memory.rivalId] && !state.nations[memory.rivalId].defeated) return memory.rivalId; if ((focus === 'trade' || focus === 'research') && memory?.partnerId && state.nations[memory.partnerId] && !state.nations[memory.partnerId].defeated) return memory.partnerId; if (focus === 'trade' || focus === 'research') return scored.sort((a, b) => b.partner - a.partner)[0]?.id; if (focus === 'defense') return scored.sort((a, b) => b.watch - a.watch)[0]?.id; if (focus === 'expansion') return scored.sort((a, b) => b.rival - a.rival)[0]?.id; return scored.sort((a, b) => b.partner - a.partner)[0]?.id; }
function decideAIFocus(state: StrategicState, nation: Nation, memory?: AIMemoryEntry): AIFocusKind { const owned = provincesOf(state, nation.id); const atWar = state.wars.some((w) => w.attackerId === nation.id || w.defenderId === nation.id); const avgUnrest = owned.length ? owned.reduce((s, p) => s + p.unrest + p.rebellionRisk * 0.6, 0) / owned.length : 0; const poor = nation.resources.gold < 60 || nation.resources.food < 80; if (poor || nation.government.stability < 35 || avgUnrest > 55) return 'recovery'; if (atWar || nation.warExhaustion > 45 || (memory?.watchScore ?? 0) > 70) return 'defense'; if (nation.character === 'commerce' || nation.character === 'maritime' || nation.government.type === 'merchant_republic' || (memory?.partnerScore ?? 0) > 75) return 'trade'; if (nation.character === 'scholarly' || nation.tech.admin + nation.tech.agri + nation.tech.mil + nation.tech.culture < 8) return 'research'; if (nation.character === 'militarism' || nation.character === 'expansionist' || armySize(nation) > Math.max(120, owned.length * 70) || (memory?.rivalScore ?? 0) > 65 || (memory?.territory?.pressure ?? 0) > 65) return 'expansion'; if (nation.tier === 'S' || nation.tier === 'A') return 'expansion'; return 'trade'; }
function reinforceBorder(state: GameState, nation: Nation): void { const border = borderProvinces(state, nation.id)[0]; if (border) border.garrison = clamp(Math.round(border.garrison + 8), 0, 600); }
function applyAIFocusEffect(state: StrategicState, nation: Nation, entry: AIFocusEntry): void { const target = entry.targetId; const intensity = clamp(entry.intensity, 1, 6); if (entry.kind === 'recovery') { nation.government.stability = clamp(nation.government.stability + 1); nation.government.corruption = clamp(nation.government.corruption - 0.5); const troubled = provincesOf(state, nation.id).sort((a, b) => (b.unrest + b.rebellionRisk) - (a.unrest + a.rebellionRisk))[0]; if (troubled) { troubled.unrest = clamp(troubled.unrest - 3); troubled.rebellionRisk = clamp(troubled.rebellionRisk - 2); } if (nation.tier === 'C' || nation.tier === 'D') nation.resources.gold += 4; return; } if (entry.kind === 'defense') { nation.warExhaustion = clamp(nation.warExhaustion - 1); reinforceBorder(state, nation); if (target) for (const r of bothRelations(state, nation.id, target)) r.threat = clamp(r.threat + intensity); return; } if (entry.kind === 'trade') { nation.resources.influence = clamp(nation.resources.influence + 2, 0, 9999); if (target) for (const r of bothRelations(state, nation.id, target)) if (r.treaty !== 'war' && r.treaty !== 'truce') { r.relation = clamp(r.relation + 2, -100, 100); r.trust = clamp(r.trust + 1); if (r.relation >= 55 && r.trust >= 45 && r.treaty === 'none') r.treaty = 'trade'; } return; } if (entry.kind === 'research') { nation.resources.sciPt = clamp(nation.resources.sciPt + 4 + Math.floor(nation.tech.admin / 2), 0, 99999); nation.resources.influence = clamp(nation.resources.influence + 1, 0, 9999); if (target) for (const r of bothRelations(state, nation.id, target)) if (r.treaty !== 'war') r.trust = clamp(r.trust + 1); return; } nation.resources.supply = clamp(nation.resources.supply + 3, 0, 99999); reinforceBorder(state, nation); if (target) for (const r of bothRelations(state, nation.id, target)) if (r.treaty !== 'alliance' && r.treaty !== 'trade') { r.threat = clamp(r.threat + 2 + intensity); r.relation = clamp(r.relation - 1 - Math.floor(intensity / 3), -100, 100); } }
function appendWorldEvent(state: GameState, text: string): void { if (!state.lastReport) return; const old = state.lastReport.worldEvents ?? []; if (old.includes(text)) return; state.lastReport = { ...state.lastReport, worldEvents: [...old, text].slice(-10) }; if (Array.isArray(state.history) && state.history.length > 0) { const last = state.history[state.history.length - 1]; if (last.turn === state.lastReport.turn) state.history[state.history.length - 1] = state.lastReport; } }

function applyAIStrategy(state: GameState): GameState {
  const next = state as StrategicState; next.aiStrategyMeta = next.aiStrategyMeta ?? {}; next.aiMemory = next.aiMemory ?? {}; const messages: string[] = [];
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated || nation.id === playerId(next)) continue;
    const before = next.aiMemory[nation.id]; const memory = updateAIMemory(next, nation); const focus = decideAIFocus(next, nation, memory); const current = next.aiStrategyMeta[nation.id]; const target = chooseAITarget(next, nation, focus, memory);
    const changed = !current || current.kind !== focus || current.targetId !== target; const intensity = changed ? 1 : clamp((current?.intensity ?? 1) + 1, 1, 6); const entry: AIFocusEntry = { kind: focus, targetId: target, sinceTurn: changed ? next.turn : (current?.sinceTurn ?? next.turn), intensity };
    next.aiStrategyMeta[nation.id] = entry; applyAIFocusEffect(next, nation, entry);
    if (changed && isPlayerRelevant(next, nation.id)) { const targetName = target ? `：${next.nations[target]?.name ?? target}` : ''; messages.push(`◇ ${nation.name} 转向${AI_LABEL[focus]}战略${targetName}`); }
    if (isPlayerRelevant(next, nation.id) && before?.rivalId !== memory.rivalId && memory.rivalId) messages.push(`◇ ${nation.name} 将 ${next.nations[memory.rivalId]?.name ?? memory.rivalId} 视为宿敌`);
    if (isPlayerRelevant(next, nation.id) && before?.partnerId !== memory.partnerId && memory.partnerId) messages.push(`◇ ${nation.name} 倾向亲近 ${next.nations[memory.partnerId]?.name ?? memory.partnerId}`);
    if (isPlayerRelevant(next, nation.id) && before?.territory?.desiredProvinceId !== memory.territory?.desiredProvinceId && memory.territory?.desiredProvinceId) messages.push(`◇ ${nation.name} 觊觎 ${provName(next, memory.territory.desiredProvinceId) ?? memory.territory.desiredProvinceId}`);
  }
  for (const msg of messages.slice(0, 6)) appendWorldEvent(next, msg); next._relMap = undefined; return next;
}

export function getAIStrategyInfo(state: GameState, nationId: string): AIStrategyInfo | null { const s = state as StrategicState; const entry = s.aiStrategyMeta?.[nationId]; const mem = s.aiMemory?.[nationId]; if (!entry && !mem) return null; const terr = mem?.territory; return { kind: entry?.kind ?? 'trade', label: entry ? AI_LABEL[entry.kind] : '观察', targetId: entry?.targetId, targetName: entry?.targetId ? state.nations[entry.targetId]?.name : undefined, intensity: entry?.intensity ?? 0, sinceTurn: entry?.sinceTurn ?? mem?.lastUpdated ?? state.turn, rivalId: mem?.rivalId, rivalName: mem?.rivalId ? state.nations[mem.rivalId]?.name : undefined, rivalScore: mem?.rivalScore, partnerId: mem?.partnerId, partnerName: mem?.partnerId ? state.nations[mem.partnerId]?.name : undefined, partnerScore: mem?.partnerScore, watchId: mem?.watchId, watchName: mem?.watchId ? state.nations[mem.watchId]?.name : undefined, watchScore: mem?.watchScore, coreProvinceId: terr?.coreProvinceId, coreProvinceName: provName(state, terr?.coreProvinceId), desiredProvinceId: terr?.desiredProvinceId, desiredProvinceName: provName(state, terr?.desiredProvinceId), revengeProvinceId: terr?.revengeProvinceId, revengeProvinceName: provName(state, terr?.revengeProvinceId), territorialPressure: terr?.pressure } }
export function installStrategyFocus(): void { if (installed) return; installed = true; const originalNextTurn = (useGameStore.getState() as unknown as { nextTurn?: () => unknown }).nextTurn; useGameStore.setState({ setStrategyFocus: (id: StrategyFocusId) => { const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void }; const old = ((cur.state as StrategicState).strategyFocus ?? 'balance') as StrategyFocusId; if (old === id) return; useGameStore.setState({ state: { ...cur.state, strategyFocus: id } as GameState } as never); const label: Record<StrategyFocusId, string> = { balance: '均衡', stability: '安民', prosperity: '富国', military: '强军', diplomacy: '睦邻', reform: '改革' }; cur.logMsg?.(`国策焦点改为：${label[id]}`); }, nextTurn: () => { const result = originalNextTurn?.(); const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void }; if (cur.state.victory.type) return result; const focus = (((cur.state as StrategicState).strategyFocus) ?? 'balance') as StrategyFocusId; const playerApplied = applyPlayerFocus(cur.state, focus); let next = playerApplied.state; next = applyAIStrategy(next); useGameStore.setState({ state: next } as never); if (playerApplied.note) cur.logMsg?.(playerApplied.note); return result; } } as never); }
