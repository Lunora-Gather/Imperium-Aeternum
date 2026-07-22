// Imperium Aeternum — 安全主状态层
// 目标：保留页面接口，降低大文件维护风险，避免选国/回退/行动点状态卡死。

import { create } from 'zustand';
import type { GameState, Nation, StrategyFocusId, SummitAgenda, SummitStance, TurnReport } from '../types/game';
import { createInitialState, createWorldState } from '../engine/init';
import { saveGame, loadGame, hasSave, deleteSave, saveGameToSlot, loadGameFromSlot, deleteSlot, autoSave } from './persistence';
import { PLAYER_ID } from '../data/nations';
import type { PolicyId } from '../data/policies';
import { advanceTurnPipeline, prepareGameState } from '../gameplay/turnPipeline';
import {
  appeaseFactionAction,
  buildAction,
  culturalExportAction,
  conveneDiplomaticSummitAction,
  declareWarAction,
  demolishBuildingAction,
  developProvinceAction,
  dynasticMarriageAction,
  embargoTradeRouteAction,
  enactLawAction,
  enactPolicyAction,
  espionageAction,
  establishTradeRouteAction,
  formAllianceAction,
  formTradeAction,
  improveRelationAction,
  makePeaceAction,
  moveArmyAction,
  negotiateRebellionAction,
  recruitAction,
  researchAction,
  setTaxRateAction,
  suppressRebellionAction,
  upgradeBuildingAction,
} from '../gameplay/actions';
import type { GameActionResult, ProvinceDevelopmentKind, SpyKind } from '../gameplay/actions';
import { findScenario, RANDOM_SCENARIO_REGIONS, SCENARIOS } from './scenarioCatalog';
import type { ScenarioId } from './scenarioCatalog';
export { SCENARIOS } from './scenarioCatalog';
export type { ScenarioDef, ScenarioId } from './scenarioCatalog';

export interface GameStore { state: GameState; log: string[]; justProcessedTurn: boolean; scene: 'menu' | 'playing'; returnTab: string | null; setReturnTab: (t: string | null) => void; pendingProvinceId: string | null; setPendingProvince: (id: string | null) => void; pendingTab: string | null; jumpToTab: (tab: string) => void; consumePendingTab: () => void; startScenario: (id: ScenarioId) => void; startWithNation: (nationId: string) => void; backToMenu: () => void; newGame: () => void; load: () => boolean; save: () => void; clearSave: () => void; hasSave: () => boolean; saveToSlot: (slot: number) => void; loadFromSlot: (slot: number) => boolean; deleteSlotSave: (slot: number) => void; nextTurn: () => TurnReport | null; clearTurnFlag: () => void; setStrategyFocus: (id: StrategyFocusId) => void; setTaxRate: (rate: number) => void; appeaseFaction: (factionId: string) => boolean; build: (provinceId: string, buildingDefId: string) => boolean; recruit: (provinceId: string, count: number) => boolean; research: (techId: string) => boolean; improveRelation: (target: string) => boolean; formTrade: (target: string) => boolean; formAlliance: (target: string) => boolean; conveneDiplomaticSummit: (target: string, agenda: SummitAgenda, stance: SummitStance) => boolean; espionage: (target: string, kind: SpyKind) => boolean; dynasticMarriage: (target: string) => boolean; culturalExport: (target: string) => boolean; declareWar: (target: string, provinceId: string) => boolean; makePeace: (warId: string) => boolean; moveArmy: (armyId: string, toProvinceId: string) => boolean; enactPolicy: (policyId: PolicyId) => boolean; enactLaw: (lawId: string) => boolean; establishTradeRoute: (routeId: string) => boolean; embargoTradeRoute: (routeId: string) => boolean; developProvince: (provinceId: string, kind: 'reclaim' | 'garrison_deploy' | 'garrison_recall') => boolean; upgradeBuilding: (provinceId: string, buildingInstanceId: string) => boolean; demolishBuilding: (provinceId: string, buildingInstanceId: string) => boolean; suppressRebellion: () => boolean; negotiateRebellion: () => boolean; logMsg: (msg: string) => void; }

let pendingScenario: ScenarioId | null = null;
let pendingSeed = 0;
function pid(s: GameState): string { return s.playerNationId || PLAYER_ID; }
function playerOf(s: GameState): Nation { return s.nations[pid(s)]; }
function log(get: () => GameStore, msg: string) { get().logMsg(msg); }
function markPlayer(state: GameState, id: string) { state.playerNationId = id; Object.values(state.nations).forEach((n) => { n.isPlayer = n.id === id; }); }
function applyChallenge(state: GameState) { const p = playerOf(state); p.resources.gold = Math.min(p.resources.gold, 120); p.resources.food = Math.min(p.resources.food, 180); p.government.stability = Math.min(p.government.stability, 35); p.government.legitimacy = Math.min(p.government.legitimacy, 45); p.government.corruption = Math.max(p.government.corruption, 45); Object.values(state.provinces).filter((x) => x.ownerId === p.id).forEach((prov) => { prov.unrest = Math.max(prov.unrest, 35); prov.rebellionRisk = Math.max(prov.rebellionRisk, 25); }); }
const FOCUS_LABELS: Record<StrategyFocusId, string> = { balance: '均衡', stability: '安民', prosperity: '富国', military: '强军', diplomacy: '睦邻', reform: '改革' };

type StoreSet = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;
function queueCloudSync(slot: number): void {
  void import('../gameplay/cloudSyncCoordinator')
    .then(({ queueCloudSaveUpload }) => queueCloudSaveUpload(slot))
    .catch(() => undefined);
}

function commitAction(get: () => GameStore, set: StoreSet, result: GameActionResult): boolean {
  if (result.ok) set({ state: result.state });
  result.messages.forEach((message) => log(get, message));
  return result.ok;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(), log: [], justProcessedTurn: false, scene: 'menu', returnTab: null, setReturnTab: (t) => set({ returnTab: t }), pendingProvinceId: null, setPendingProvince: (id) => set({ pendingProvinceId: id }), pendingTab: null, jumpToTab: (tab) => set({ pendingTab: tab }), consumePendingTab: () => set({ pendingTab: null }),
  startScenario: (id) => { pendingScenario = id; pendingSeed = Math.floor(Math.random() * 1e9); const scenario = findScenario(id); if (!scenario.needsNationPick) { const regions = id === 'w7_random' ? [...RANDOM_SCENARIO_REGIONS[pendingSeed % RANDOM_SCENARIO_REGIONS.length]] : undefined; const state = id === 'classic' || id === 'challenge_survival' ? createInitialState() : createWorldState(pendingSeed, undefined, regions); const chosen = Object.values(state.nations).find((n) => n.isPlayer) ?? Object.values(state.nations)[0]; if (chosen) markPlayer(state, chosen.id); if (id === 'challenge_survival') applyChallenge(state); set({ state: prepareGameState(state), scene: 'playing', log: [`新游戏开始：${scenario.name} · 第 1 年`], justProcessedTurn: false }); pendingScenario = null; } else set({ log: [`已选剧本：${scenario.name}，请选择你的邦国`] }); },
  startWithNation: (nationId) => { if (!pendingScenario) return; const scenario = SCENARIOS.find((s) => s.id === pendingScenario); const state = createWorldState(pendingSeed, nationId, scenario?.regionFilter); const player = state.nations[nationId] ?? Object.values(state.nations)[0]; if (player) markPlayer(state, player.id); set({ state: prepareGameState(state), scene: 'playing', log: [`新游戏开始：${scenario?.name ?? pendingScenario} · 你执掌 ${player?.name ?? '未知'} · 第 1 年`], justProcessedTurn: false }); pendingScenario = null; },
  backToMenu: () => { pendingScenario = null; set({ scene: 'menu', log: [], pendingTab: null, pendingProvinceId: null }); }, newGame: () => get().startScenario('classic'), load: () => { const s = loadGame(); if (!s) return false; set({ state: prepareGameState(s), scene: 'playing', log: ['读档成功'], justProcessedTurn: false }); return true; }, save: () => { const r = saveGame(get().state); if (r.ok) queueCloudSync(0); log(get, r.ok ? `已存档${r.sizeKB ? `（${r.sizeKB}KB）` : ''}` : (r.error ?? '存档失败')); }, clearSave: () => { deleteSave(); log(get, '已删档'); }, hasSave: () => hasSave(), saveToSlot: (slot) => { const r = saveGameToSlot(get().state, slot); if (r.ok) queueCloudSync(slot); log(get, r.ok ? `${slot === 0 ? '自动存档' : `已存档到槽位 ${slot}`}${r.sizeKB ? `（${r.sizeKB}KB）` : ''}` : (r.error ?? '存档失败')); }, loadFromSlot: (slot) => { const s = loadGameFromSlot(slot); if (!s) { log(get, '读档失败：存档不存在或损坏'); return false; } set({ state: prepareGameState(s), scene: 'playing', log: [`已读取槽位 ${slot} 存档`] }); return true; }, deleteSlotSave: (slot) => { deleteSlot(slot); log(get, `已删除槽位 ${slot} 存档`); },
  nextTurn: () => { const cur = get().state; if (cur.victory.type) return null; if (cur.pendingEvents.some((pending) => pending.nationId === cur.playerNationId)) { log(get, '请先处理待决事件'); return null; } const result = advanceTurnPipeline(cur); set({ state: result.state, justProcessedTurn: true }); if (result.report.warnings.length) log(get, result.report.warnings.join('; ')); result.notes.forEach((note) => log(get, note)); log(get, `进入第 ${result.state.turn + 1} 年`); if (result.state.turn > 0 && result.state.turn % 10 === 0) { autoSave(result.state); queueCloudSync(0); } return result.report; }, clearTurnFlag: () => set({ justProcessedTurn: false }), setStrategyFocus: (focus) => { const state = get().state; if ((state.strategyFocus ?? 'balance') === focus) return; set({ state: { ...state, strategyFocus: focus } }); log(get, `国策焦点改为：${FOCUS_LABELS[focus]}`); },
  setTaxRate: (rate) => { commitAction(get, set, setTaxRateAction(get().state, rate)); },
  appeaseFaction: (factionId) => commitAction(get, set, appeaseFactionAction(get().state, factionId)),
  build: (provinceId, buildingDefId) => commitAction(get, set, buildAction(get().state, provinceId, buildingDefId)),
  recruit: (provinceId, count) => commitAction(get, set, recruitAction(get().state, provinceId, count)),
  research: (techId) => commitAction(get, set, researchAction(get().state, techId)),
  improveRelation: (target) => commitAction(get, set, improveRelationAction(get().state, target)),
  formTrade: (target) => commitAction(get, set, formTradeAction(get().state, target)),
  formAlliance: (target) => commitAction(get, set, formAllianceAction(get().state, target)),
  conveneDiplomaticSummit: (target, agenda, stance) => commitAction(get, set, conveneDiplomaticSummitAction(get().state, target, agenda, stance)),
  espionage: (target, kind) => commitAction(get, set, espionageAction(get().state, target, kind)),
  dynasticMarriage: (target) => commitAction(get, set, dynasticMarriageAction(get().state, target)),
  culturalExport: (target) => commitAction(get, set, culturalExportAction(get().state, target)),
  declareWar: (target, provinceId) => commitAction(get, set, declareWarAction(get().state, target, provinceId)),
  makePeace: (warId) => commitAction(get, set, makePeaceAction(get().state, warId)),
  moveArmy: (armyId, toProvinceId) => commitAction(get, set, moveArmyAction(get().state, armyId, toProvinceId)),
  enactPolicy: (policyId) => commitAction(get, set, enactPolicyAction(get().state, policyId)),
  enactLaw: (lawId) => commitAction(get, set, enactLawAction(get().state, lawId)),
  establishTradeRoute: (routeId) => commitAction(get, set, establishTradeRouteAction(get().state, routeId)),
  embargoTradeRoute: (routeId) => commitAction(get, set, embargoTradeRouteAction(get().state, routeId)),
  developProvince: (provinceId, kind: ProvinceDevelopmentKind) => commitAction(get, set, developProvinceAction(get().state, provinceId, kind)),
  upgradeBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, upgradeBuildingAction(get().state, provinceId, buildingInstanceId)),
  demolishBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, demolishBuildingAction(get().state, provinceId, buildingInstanceId)),
  suppressRebellion: () => commitAction(get, set, suppressRebellionAction(get().state)),
  negotiateRebellion: () => commitAction(get, set, negotiateRebellionAction(get().state)),
  logMsg: (msg) => set((s) => ({ log: [...s.log.slice(-30), msg] })),
}));
