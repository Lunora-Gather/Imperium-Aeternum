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
import { resolvePendingEventChoice } from '../gameplay/pendingEventResolution';
import type { ScenarioId } from './scenarioCatalog';
import { useSharedWorldSessionStore } from './sharedWorldSessionStore';
export { SCENARIOS } from './scenarioCatalog';
export type { ScenarioDef, ScenarioId } from './scenarioCatalog';

export interface GameStore { state: GameState; log: string[]; justProcessedTurn: boolean; scene: 'menu' | 'playing'; returnTab: string | null; setReturnTab: (t: string | null) => void; pendingProvinceId: string | null; setPendingProvince: (id: string | null) => void; pendingTab: string | null; jumpToTab: (tab: string) => void; consumePendingTab: () => void; startScenario: (id: ScenarioId) => void; startWithNation: (nationId: string) => void; startSharedWorld: (state: GameState, nationId: string, worldName: string) => void; backToMenu: () => void; newGame: () => void; load: () => boolean; save: () => void; clearSave: () => void; hasSave: () => boolean; saveToSlot: (slot: number) => void; loadFromSlot: (slot: number) => boolean; deleteSlotSave: (slot: number) => void; nextTurn: () => TurnReport | null; clearTurnFlag: () => void; setStrategyFocus: (id: StrategyFocusId) => void; setTaxRate: (rate: number) => void; appeaseFaction: (factionId: string) => boolean; build: (provinceId: string, buildingDefId: string) => boolean; recruit: (provinceId: string, count: number) => boolean; research: (techId: string) => boolean; improveRelation: (target: string) => boolean; formTrade: (target: string) => boolean; formAlliance: (target: string) => boolean; conveneDiplomaticSummit: (target: string, agenda: SummitAgenda, stance: SummitStance) => boolean; espionage: (target: string, kind: SpyKind) => boolean; dynasticMarriage: (target: string) => boolean; culturalExport: (target: string) => boolean; declareWar: (target: string, provinceId: string) => boolean; makePeace: (warId: string) => boolean; moveArmy: (armyId: string, toProvinceId: string) => boolean; enactPolicy: (policyId: PolicyId) => boolean; enactLaw: (lawId: string) => boolean; establishTradeRoute: (routeId: string) => boolean; embargoTradeRoute: (routeId: string) => boolean; developProvince: (provinceId: string, kind: 'reclaim' | 'garrison_deploy' | 'garrison_recall') => boolean; upgradeBuilding: (provinceId: string, buildingInstanceId: string) => boolean; demolishBuilding: (provinceId: string, buildingInstanceId: string) => boolean; suppressRebellion: () => boolean; negotiateRebellion: () => boolean; logMsg: (msg: string) => void; }

export interface GameStore { resolveEvent: (eventId: string, optionIndex: number) => boolean }

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

type SharedAction = { commandType: 'domestic_action' | 'diplomatic_action' | 'military_action'; action: string; args: unknown[] };
let sharedActionQueue = Promise.resolve();

function commitAction(get: () => GameStore, set: StoreSet, result: GameActionResult, sharedAction?: SharedAction): boolean {
  if (result.ok) set({ state: result.state });
  result.messages.forEach((message) => log(get, message));
  const session = useSharedWorldSessionStore.getState().session;
  if (result.ok && session && sharedAction) {
    sharedActionQueue = sharedActionQueue.then(async () => {
      const current = useSharedWorldSessionStore.getState().session;
      if (!current) return;
      try {
        const { submitSharedWorldAction } = await import('../services/appwrite/sharedWorldService');
        const response = await submitSharedWorldAction(current.worldId, current.nationId, current.revision, sharedAction.commandType, sharedAction.action, sharedAction.args);
        useSharedWorldSessionStore.getState().update(response.world, response.state);
        set({ state: prepareGameState(response.state) });
      } catch (error) {
        log(get, error instanceof Error ? `共享行动未同步：${error.message}` : '共享行动同步失败');
        try {
          const { enterSharedWorld } = await import('../services/appwrite/sharedWorldService');
          const refreshed = await enterSharedWorld(current.worldId, current.nationId);
          useSharedWorldSessionStore.getState().start(refreshed.world, current.nationId, refreshed.state);
          set({ state: prepareGameState(refreshed.state) });
        } catch { /* retain the last visible state and surface the original error */ }
      }
    });
  }
  return result.ok;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(), log: [], justProcessedTurn: false, scene: 'menu', returnTab: null, setReturnTab: (t) => set({ returnTab: t }), pendingProvinceId: null, setPendingProvince: (id) => set({ pendingProvinceId: id }), pendingTab: null, jumpToTab: (tab) => set({ pendingTab: tab }), consumePendingTab: () => set({ pendingTab: null }),
  startScenario: (id) => { pendingScenario = id; pendingSeed = Math.floor(Math.random() * 1e9); const scenario = findScenario(id); if (!scenario.needsNationPick) { const regions = id === 'w7_random' ? [...RANDOM_SCENARIO_REGIONS[pendingSeed % RANDOM_SCENARIO_REGIONS.length]] : undefined; const state = id === 'classic' || id === 'challenge_survival' ? createInitialState() : createWorldState(pendingSeed, undefined, regions); const chosen = Object.values(state.nations).find((n) => n.isPlayer) ?? Object.values(state.nations)[0]; if (chosen) markPlayer(state, chosen.id); if (id === 'challenge_survival') applyChallenge(state); set({ state: prepareGameState(state), scene: 'playing', log: [`新游戏开始：${scenario.name} · 第 1 年`], justProcessedTurn: false }); pendingScenario = null; } else set({ log: [`已选剧本：${scenario.name}，请选择你的邦国`] }); },
  startWithNation: (nationId) => { if (!pendingScenario) return; const scenario = SCENARIOS.find((s) => s.id === pendingScenario); const state = createWorldState(pendingSeed, nationId, scenario?.regionFilter); const player = state.nations[nationId] ?? Object.values(state.nations)[0]; if (player) markPlayer(state, player.id); set({ state: prepareGameState(state), scene: 'playing', log: [`新游戏开始：${scenario?.name ?? pendingScenario} · 你执掌 ${player?.name ?? '未知'} · 第 1 年`], justProcessedTurn: false }); pendingScenario = null; },
  startSharedWorld: (state, nationId, worldName) => { markPlayer(state, nationId); set({ state: prepareGameState(state), scene: 'playing', log: [`已进入共享版图：${worldName} · 你执掌 ${state.nations[nationId]?.name ?? nationId}`], justProcessedTurn: false }); },
  backToMenu: () => { pendingScenario = null; useSharedWorldSessionStore.getState().leave(); set({ scene: 'menu', log: [], pendingTab: null, pendingProvinceId: null }); }, newGame: () => { useSharedWorldSessionStore.getState().leave(); get().startScenario('classic'); }, load: () => { useSharedWorldSessionStore.getState().leave(); const s = loadGame(); if (!s) return false; set({ state: prepareGameState(s), scene: 'playing', log: ['读档成功'], justProcessedTurn: false }); return true; }, save: () => { if (useSharedWorldSessionStore.getState().session) { log(get, '共享版图由服务器自动保存，无需手动存档'); return; } const r = saveGame(get().state); if (r.ok) queueCloudSync(0); log(get, r.ok ? `已存档${r.sizeKB ? `（${r.sizeKB}KB）` : ''}` : (r.error ?? '存档失败')); }, clearSave: () => { deleteSave(); log(get, '已删档'); }, hasSave: () => hasSave(), saveToSlot: (slot) => { const r = saveGameToSlot(get().state, slot); if (r.ok) queueCloudSync(slot); log(get, r.ok ? `${slot === 0 ? '自动存档' : `已存档到槽位 ${slot}`}${r.sizeKB ? `（${r.sizeKB}KB）` : ''}` : (r.error ?? '存档失败')); }, loadFromSlot: (slot) => { useSharedWorldSessionStore.getState().leave(); const s = loadGameFromSlot(slot); if (!s) { log(get, '读档失败：存档不存在或损坏'); return false; } set({ state: prepareGameState(s), scene: 'playing', log: [`已读取槽位 ${slot} 存档`] }); return true; }, deleteSlotSave: (slot) => { deleteSlot(slot); log(get, `已删除槽位 ${slot} 存档`); },
  nextTurn: () => { const cur = get().state; const session = useSharedWorldSessionStore.getState().session; if (session) { if (cur.pendingEvents.some((pending) => pending.nationId === cur.playerNationId)) { log(get, '请先处理待决事件'); return null; } void import('./sharedWorldStore').then(({ useSharedWorldStore }) => useSharedWorldStore.getState().setReady()).then((state) => { if (state) set({ state: prepareGameState(state), justProcessedTurn: true }); }); log(get, '已提交本年准备状态，等待统一结算'); return null; } if (cur.victory.type) return null; if (cur.pendingEvents.some((pending) => pending.nationId === cur.playerNationId)) { log(get, '请先处理待决事件'); return null; } const result = advanceTurnPipeline(cur); set({ state: result.state, justProcessedTurn: true }); if (result.report.warnings.length) log(get, result.report.warnings.join('; ')); result.notes.forEach((note) => log(get, note)); log(get, `进入第 ${result.state.turn + 1} 年`); if (result.state.turn > 0 && result.state.turn % 10 === 0) { autoSave(result.state); queueCloudSync(0); } return result.report; }, clearTurnFlag: () => set({ justProcessedTurn: false }), setStrategyFocus: (focus) => { const state = get().state; if ((state.strategyFocus ?? 'balance') === focus) return; const next = { ...state, strategyFocus: focus }; commitAction(get, set, { ok: true, state: next, messages: [`国策焦点改为：${FOCUS_LABELS[focus]}`] }, { commandType: 'domestic_action', action: 'set_strategy_focus', args: [focus] }); },
  setTaxRate: (rate) => { commitAction(get, set, setTaxRateAction(get().state, rate), { commandType: 'domestic_action', action: 'set_tax_rate', args: [rate] }); },
  appeaseFaction: (factionId) => commitAction(get, set, appeaseFactionAction(get().state, factionId), { commandType: 'domestic_action', action: 'appease_faction', args: [factionId] }),
  build: (provinceId, buildingDefId) => commitAction(get, set, buildAction(get().state, provinceId, buildingDefId), { commandType: 'domestic_action', action: 'build', args: [provinceId, buildingDefId] }),
  recruit: (provinceId, count) => commitAction(get, set, recruitAction(get().state, provinceId, count), { commandType: 'military_action', action: 'recruit', args: [provinceId, count] }),
  research: (techId) => commitAction(get, set, researchAction(get().state, techId), { commandType: 'domestic_action', action: 'research', args: [techId] }),
  improveRelation: (target) => commitAction(get, set, improveRelationAction(get().state, target), { commandType: 'diplomatic_action', action: 'improve_relation', args: [target] }),
  formTrade: (target) => commitAction(get, set, formTradeAction(get().state, target), { commandType: 'diplomatic_action', action: 'form_trade', args: [target] }),
  formAlliance: (target) => commitAction(get, set, formAllianceAction(get().state, target), { commandType: 'diplomatic_action', action: 'form_alliance', args: [target] }),
  conveneDiplomaticSummit: (target, agenda, stance) => commitAction(get, set, conveneDiplomaticSummitAction(get().state, target, agenda, stance), { commandType: 'diplomatic_action', action: 'summit', args: [target, agenda, stance] }),
  espionage: (target, kind) => commitAction(get, set, espionageAction(get().state, target, kind), { commandType: 'diplomatic_action', action: 'espionage', args: [target, kind] }),
  dynasticMarriage: (target) => commitAction(get, set, dynasticMarriageAction(get().state, target), { commandType: 'diplomatic_action', action: 'dynastic_marriage', args: [target] }),
  culturalExport: (target) => commitAction(get, set, culturalExportAction(get().state, target), { commandType: 'diplomatic_action', action: 'cultural_export', args: [target] }),
  declareWar: (target, provinceId) => commitAction(get, set, declareWarAction(get().state, target, provinceId), { commandType: 'military_action', action: 'declare_war', args: [target, provinceId] }),
  makePeace: (warId) => commitAction(get, set, makePeaceAction(get().state, warId), { commandType: 'military_action', action: 'make_peace', args: [warId] }),
  moveArmy: (armyId, toProvinceId) => commitAction(get, set, moveArmyAction(get().state, armyId, toProvinceId), { commandType: 'military_action', action: 'move_army', args: [armyId, toProvinceId] }),
  enactPolicy: (policyId) => commitAction(get, set, enactPolicyAction(get().state, policyId), { commandType: 'domestic_action', action: 'enact_policy', args: [policyId] }),
  enactLaw: (lawId) => commitAction(get, set, enactLawAction(get().state, lawId), { commandType: 'domestic_action', action: 'enact_law', args: [lawId] }),
  establishTradeRoute: (routeId) => commitAction(get, set, establishTradeRouteAction(get().state, routeId), { commandType: 'domestic_action', action: 'establish_trade_route', args: [routeId] }),
  embargoTradeRoute: (routeId) => commitAction(get, set, embargoTradeRouteAction(get().state, routeId), { commandType: 'domestic_action', action: 'embargo_trade_route', args: [routeId] }),
  developProvince: (provinceId, kind: ProvinceDevelopmentKind) => commitAction(get, set, developProvinceAction(get().state, provinceId, kind), { commandType: 'domestic_action', action: 'develop_province', args: [provinceId, kind] }),
  upgradeBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, upgradeBuildingAction(get().state, provinceId, buildingInstanceId), { commandType: 'domestic_action', action: 'upgrade_building', args: [provinceId, buildingInstanceId] }),
  demolishBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, demolishBuildingAction(get().state, provinceId, buildingInstanceId), { commandType: 'domestic_action', action: 'demolish_building', args: [provinceId, buildingInstanceId] }),
  suppressRebellion: () => commitAction(get, set, suppressRebellionAction(get().state), { commandType: 'domestic_action', action: 'suppress_rebellion', args: [] }),
  negotiateRebellion: () => commitAction(get, set, negotiateRebellionAction(get().state), { commandType: 'domestic_action', action: 'negotiate_rebellion', args: [] }),
  resolveEvent: (eventId, optionIndex) => {
    const state = get().state;
    const result = resolvePendingEventChoice(state, state.playerNationId, eventId, optionIndex);
    if (!result.resolved) return false;
    return commitAction(get, set, { ok: true, state: result.state, messages: [`事件 ${result.eventTitle}：选择「${result.optionText}」`] }, { commandType: 'domestic_action', action: 'resolve_event', args: [eventId, optionIndex] });
  },
  logMsg: (msg) => set((s) => ({ log: [...s.log.slice(-30), msg] })),
}));
