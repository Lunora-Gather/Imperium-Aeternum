import { queueCloudSaveUpload } from '../gameplay/cloudSyncCoordinator';
// Imperium Aeternum — 安全主状态层
// 目标：保留页面接口，降低大文件维护风险，避免选国/回退/行动点状态卡死。

import { create } from 'zustand';
import type { GameState, Nation, StrategyFocusId, SummitAgenda, SummitStance, TurnReport } from '../types/game';
import { createInitialState, createWorldState } from '../engine/init';
import { hasSave, clearAllSaves, saveGameToSlot, loadSlotCheckpoint, slotStorageValue, deleteSlot, type ExpectedSlot, type SlotSaveResult, type snapshotSaveList } from './persistence';
import { PLAYER_ID } from '../data/nations';
import type { PolicyId } from '../data/policies';
import { openScenarioCouncil } from '../gameplay/campaignDecisions';
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
import { sharedNationView } from '../shared-world/nationView';
import type { SharedWorldInstance } from '../shared-world/types';
import { findScenario, RANDOM_SCENARIO_REGIONS } from './scenarioCatalog';
import { resolvePendingEventChoice } from '../gameplay/pendingEventResolution';
import type { ScenarioId } from './scenarioCatalog';
import { currentSharedSession, enqueueSharedCommand, pendingSharedOrders, sharedOrderFailures, recordSharedOrderFailure, useSharedWorldSessionStore } from './sharedWorldSessionStore';
export { SCENARIOS } from './scenarioCatalog';
export type { ScenarioDef, ScenarioId } from './scenarioCatalog';

export interface GameStore { state: GameState; log: string[]; logSeq: number; justProcessedTurn: boolean; scene: 'menu' | 'playing'; returnTab: string | null; setReturnTab: (t: string | null) => void; pendingProvinceId: string | null; setPendingProvince: (id: string | null) => void; pendingTab: string | null; jumpToTab: (tab: string) => void; consumePendingTab: () => void; startScenario: (id: ScenarioId, nationId?: string) => void; startWithNation: (nationId: string) => void; startSharedWorld: (state: GameState, nationId: string, worldName: string) => void; backToMenu: () => void; newGame: () => void; load: () => boolean; save: () => SlotSaveResult; clearSave: () => void; hasSave: () => boolean; saveToSlot: (slot: number, expectedRaw?: ExpectedSlot) => SlotSaveResult; loadFromSlot: (slot: number, expectedStored?: string | null) => boolean; deleteSlotSave: (slot: number, expectedRaw?: ExpectedSlot) => void; nextTurn: () => TurnReport | null; continueLegacy: () => boolean; clearTurnFlag: () => void; setStrategyFocus: (id: StrategyFocusId) => void; setTaxRate: (rate: number) => void; appeaseFaction: (factionId: string) => boolean; build: (provinceId: string, buildingDefId: string) => boolean; recruit: (provinceId: string, count: number) => boolean; research: (techId: string) => boolean; improveRelation: (target: string) => boolean; formTrade: (target: string) => boolean; formAlliance: (target: string) => boolean; conveneDiplomaticSummit: (target: string, agenda: SummitAgenda, stance: SummitStance) => boolean; espionage: (target: string, kind: SpyKind) => boolean; dynasticMarriage: (target: string) => boolean; culturalExport: (target: string) => boolean; declareWar: (target: string, provinceId: string) => boolean; makePeace: (warId: string) => boolean; moveArmy: (armyId: string, toProvinceId: string) => boolean; enactPolicy: (policyId: PolicyId) => boolean; enactLaw: (lawId: string) => boolean; establishTradeRoute: (routeId: string) => boolean; embargoTradeRoute: (routeId: string) => boolean; developProvince: (provinceId: string, kind: ProvinceDevelopmentKind) => boolean; upgradeBuilding: (provinceId: string, buildingInstanceId: string) => boolean; demolishBuilding: (provinceId: string, buildingInstanceId: string) => boolean; suppressRebellion: () => boolean; negotiateRebellion: () => boolean; logMsg: (msg: string) => void; }

export interface GameStore { resolveEvent: (eventId: string, optionIndex: number) => boolean }

let pendingScenario: { id: ScenarioId; seed: number } | null = null;
function pid(s: GameState): string { return s.playerNationId || PLAYER_ID; }
function playerOf(s: GameState): Nation { return s.nations[pid(s)]; }
function log(get: () => GameStore, msg: string) { get().logMsg(msg); }
function applyChallenge(state: GameState) { const p = playerOf(state); p.resources.gold = Math.min(p.resources.gold, 120); p.resources.food = Math.min(p.resources.food, 180); p.government.stability = Math.min(p.government.stability, 35); p.government.legitimacy = Math.min(p.government.legitimacy, 45); p.government.corruption = Math.max(p.government.corruption, 45); Object.values(state.provinces).filter((x) => x.ownerId === p.id).forEach((prov) => { prov.unrest = Math.max(prov.unrest, 35); prov.rebellionRisk = Math.max(prov.rebellionRisk, 25); }); }
const FOCUS_LABELS: Record<StrategyFocusId, string> = { balance: '均衡', stability: '安民', prosperity: '富国', military: '强军', diplomacy: '睦邻', reform: '改革' };

type StoreSet = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;
let autoVersion: string | null = null;
let ownsAutoSlot = false;
const checkpoints = new WeakMap<GameState, { slot: number; stored: string }>();
const clearedAutosaves = new WeakSet<GameState>();

function beginLocalCampaign() {
  ownsAutoSlot = false;
  try { autoVersion = slotStorageValue(0); } catch { autoVersion = null; }
}

function rememberCheckpoint(state: GameState, slot: number, stored: string) {
  checkpoints.set(state, { slot, stored });
  if (slot === 0) {
    clearedAutosaves.delete(state);
    autoVersion = stored;
    ownsAutoSlot = true;
  }
}

function deleteCampaignSlot(slot: number, expected?: ExpectedSlot): boolean {
  if (!deleteSlot(slot, expected)) return false;
  if (slot === 0) {
    autoVersion = null;
    ownsAutoSlot = false;
    clearedAutosaves.add(useGameStore.getState().state);
  }
  return true;
}

export function clearCampaignSaves(snapshot: ReturnType<typeof snapshotSaveList>): boolean {
  return clearAllSaves(snapshot, deleteCampaignSlot);
}

function saveLocalSlot(get: () => GameStore, slot: number, successLabel?: string, expectedRaw?: ExpectedSlot): SlotSaveResult {
  if (useSharedWorldSessionStore.getState().session) {
    const error = '共享版图由服务器自动保存，无需手动存档';
    log(get, error);
    return { ok: false, error };
  }
  const state = get().state;
  const result = saveGameToSlot(state, slot, expectedRaw);
  if (result.ok) {
    rememberCheckpoint(state, slot, result.stored);
    queueCloudSaveUpload(slot, result);
    if (successLabel) log(get, `${successLabel}（${result.sizeKB}KB）`);
  } else {
    log(get, result.error);
  }
  return result;
}

function restoreLocalSlot(get: () => GameStore, set: StoreSet, slot?: number, expectedStored?: string | null): boolean {
  if (useSharedWorldSessionStore.getState().session && pendingSharedOrders() > 0) {
    log(get, '共享操作正在提交，请等待确认后再读档。');
    return false;
  }
  const checkpoint = loadSlotCheckpoint(slot ?? 0, expectedStored);
  if (!checkpoint) {
    log(get, '读档失败：存档不存在或损坏');
    return false;
  }
  const { state, stored } = checkpoint;
  beginLocalCampaign();
  rememberCheckpoint(state, slot ?? 0, stored);
  useSharedWorldSessionStore.getState().leave();
  pendingScenario = null;
  const message = slot === undefined ? '读档成功' : `已读取槽位 ${slot} 存档`;
  set({ state, scene: 'playing', pendingProvinceId: null, returnTab: null, pendingTab: state.victory.type ? 'dashboard' : null, log: [message], logSeq: get().logSeq + 1, justProcessedTurn: false });
  return true;
}

type SharedAction = { commandType: 'domestic_action' | 'diplomatic_action' | 'military_action'; action: string; args: unknown[] };
function hasCurrentCheckpoint(state: GameState): boolean {
  const saved = checkpoints.get(state);
  try { return !!saved && slotStorageValue(saved.slot) === saved.stored; }
  catch { return false; }
}

export function saveCampaignForExit(): string | null {
  if (hasCurrentCheckpoint(useGameStore.getState().state)) return null;
  const result = saveLocalSlot(useGameStore.getState, 0, '已存档', { stored: autoVersion });
  return result.ok ? null : result.error;
}

export function checkpointBeforeUnload(): boolean {
  const { scene, state } = useGameStore.getState();
  if (scene !== 'playing') return true;
  if (useSharedWorldSessionStore.getState().session) return pendingSharedOrders() === 0;
  try {
    if (hasCurrentCheckpoint(state)) return true;
    if (clearedAutosaves.has(state)) return false;
    const stored = slotStorageValue(0);
    if (stored !== autoVersion || (stored !== null && (!ownsAutoSlot || state.victory.type?.startsWith('fail')))) return false;
    return saveLocalSlot(useGameStore.getState, 0, undefined, { stored }).ok;
  } catch { return false; }
}

export function watchCampaignExit() {
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (!checkpointBeforeUnload()) { event.preventDefault(); event.returnValue = ''; }
  };
  const onVisibility = () => { if (document.hidden) checkpointBeforeUnload(); };
  window.addEventListener('beforeunload', beforeUnload);
  window.addEventListener('pagehide', checkpointBeforeUnload);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('beforeunload', beforeUnload);
    window.removeEventListener('pagehide', checkpointBeforeUnload);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}


function commitAction(get: () => GameStore, set: StoreSet, apply: (state: GameState) => GameActionResult, sharedAction: SharedAction): boolean {
  const session = useSharedWorldSessionStore.getState().session;
  const state = get().state;
  if (session && state.nations[session.nationId]?.defeated) return false;
  if (state.victory.type && !session) {
    log(get, '本局已结束，请查看结局或读取存档。');
    return false;
  }
  const result = apply(state);
  if (result.ok) {
    const ended = result.state.victory.type && !session;
    set({ state: result.state, ...(ended && { pendingTab: 'dashboard' }) });
  }
  result.messages.forEach((message) => log(get, message));
  if (result.ok && session) {
    void enqueueSharedCommand(session, async (current) => {
      const applySnapshot = (res: { world: SharedWorldInstance; state: GameState; ready?: boolean }) => {
        const state = useSharedWorldSessionStore.getState().update(res.world, res.state, res.ready);
        if (state) set({ state, ...(state.turn > current.turn && { justProcessedTurn: true }) });
      };
      try {
        const { submitSharedWorldAction } = await import('../services/appwrite/sharedWorldService');
        if (!currentSharedSession(current)) return;
        const response = await submitSharedWorldAction(current.worldId, current.nationId, current.revision, sharedAction.commandType, sharedAction.action, sharedAction.args);
        if (!currentSharedSession(current)) return;
        applySnapshot(response);
      } catch (error) {
        if (!currentSharedSession(current)) return;
        log(get, error instanceof Error ? `共享行动未同步：${error.message}` : '共享行动同步失败');
        try {
          const { enterSharedWorld } = await import('../services/appwrite/sharedWorldService');
          if (!currentSharedSession(current)) return;
          const refreshed = await enterSharedWorld(current.worldId, current.nationId);
          if (!currentSharedSession(current)) return;
          applySnapshot(refreshed);
        } catch {
          const confirmed = currentSharedSession(current);
          if (confirmed) set({ state: confirmed.state });
        } finally {
          recordSharedOrderFailure(current);
        }
      }
    }).catch(error => { if (currentSharedSession(session)) log(get, error.message); });
  }
  return result.ok;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(), log: [], logSeq: 0, justProcessedTurn: false, scene: 'menu', returnTab: null, setReturnTab: (t) => set({ returnTab: t }), pendingProvinceId: null, setPendingProvince: (id) => set({ pendingProvinceId: id }), pendingTab: null, jumpToTab: (tab) => set({ pendingTab: tab }), consumePendingTab: () => set({ pendingTab: null }),
  startScenario: (id, nationId) => {
    const scenario = findScenario(id);
    const seed = pendingScenario?.id === id ? pendingScenario.seed : Math.floor(Math.random() * 1e9);
    if (scenario.needsNationPick && !nationId) {
      pendingScenario = { id, seed };
      log(get, `已选剧本：${scenario.name}，请选择你的邦国`);
      return;
    }
    if (nationId && !scenario.playableNations?.some((nation) => nation.id === nationId)) {
      log(get, '该邦国不在当前剧本中，请重新选择。');
      return;
    }
    const regions = id === 'w7_random'
      ? [...RANDOM_SCENARIO_REGIONS[seed % RANDOM_SCENARIO_REGIONS.length]]
      : scenario.regionFilter;
    const state = id === 'classic' || id === 'challenge_survival'
      ? createInitialState()
      : createWorldState(seed, nationId, regions);
    if (nationId && state.playerNationId !== nationId) {
      log(get, '该邦国不在当前剧本中，请重新选择。');
      return;
    }
    beginLocalCampaign();
    state.scenarioId = id;
    openScenarioCouncil(state);
    if (id === 'challenge_survival') applyChallenge(state);
    pendingScenario = null;
    useSharedWorldSessionStore.getState().leave();
    set({
      state: prepareGameState(state), scene: 'playing', justProcessedTurn: false,
      pendingTab: null, pendingProvinceId: null, returnTab: null,
      log: [nationId ? `新游戏开始：${scenario.name} · 你执掌 ${state.nations[nationId].name} · 第 1 年` : `新游戏开始：${scenario.name} · 第 1 年`],
      logSeq: get().logSeq + 1,
    });
  },
  startWithNation: (nationId) => {
    if (pendingScenario) get().startScenario(pendingScenario.id, nationId);
  },
  startSharedWorld: (state, nationId, worldName) => {
    pendingScenario = null;
    set({ state: sharedNationView(state, nationId), scene: 'playing', log: [`已进入共享版图：${worldName} · 你执掌 ${state.nations[nationId]?.name ?? nationId}`], logSeq: get().logSeq + 1, justProcessedTurn: false, pendingTab: null, pendingProvinceId: null, returnTab: null });
  },
  backToMenu: () => {
    pendingScenario = null;
    useSharedWorldSessionStore.getState().leave();
    set({ scene: 'menu', log: [], pendingTab: null, pendingProvinceId: null, returnTab: null, justProcessedTurn: false });
  },
  newGame: () => get().startScenario('classic'),
  load: () => restoreLocalSlot(get, set),
  save: () => saveLocalSlot(get, 0, '已存档', { stored: autoVersion }),
  clearSave: () => log(get, deleteCampaignSlot(0, { stored: autoVersion }) ? '已删档' : '删除失败，请刷新存档体检。'),
  hasSave: () => hasSave(),
  saveToSlot: (slot, expectedRaw) => saveLocalSlot(get, slot, slot === 0 ? '自动存档' : `已存档到槽位 ${slot}`, expectedRaw),
  loadFromSlot: (slot, expectedStored) => restoreLocalSlot(get, set, slot, expectedStored),
  deleteSlotSave: (slot, expectedRaw) => log(get, deleteCampaignSlot(slot, expectedRaw) ? `已删除槽位 ${slot} 存档` : '删除失败，请刷新存档体检。'),
  nextTurn: () => {
    const cur = get().state;
    const session = useSharedWorldSessionStore.getState().session;
    if (session ? cur.nations[session.nationId]?.defeated : cur.victory.type) return null;
    if (cur.pendingEvents.some((pending) => pending.nationId === cur.playerNationId)) {
      log(get, '请先处理待决事件');
      return null;
    }
    if (session) {
      const voting = useSharedWorldSessionStore.getState().voting;
      if (voting?.id === session.id && voting.turn === session.turn) return null;
      useSharedWorldSessionStore.setState({ voting: session });
      const failuresAtConfirmation = sharedOrderFailures();
      void enqueueSharedCommand(session, async () => {
        if (sharedOrderFailures() !== failuresAtConfirmation) {
          log(get, '有行动未获确认，请核对当前版图后重新准备。');
          return;
        }
        const { useSharedWorldStore } = await import('./sharedWorldStore');
        if (!currentSharedSession(session)) return;
        const state = await useSharedWorldStore.getState().setReady();
        if (!currentSharedSession(session)) return;
        if (state) set({ state, justProcessedTurn: state.turn > session.turn });
        const message = useSharedWorldStore.getState().message;
        if (message) log(get, message);
      }).catch(error => { if (currentSharedSession(session)) log(get, error.message); }).finally(() => {
        if (useSharedWorldSessionStore.getState().voting === session) useSharedWorldSessionStore.setState({ voting: null });
      });
      return null;
    }
    const result = advanceTurnPipeline(cur);
    set({ state: result.state, justProcessedTurn: true });
    if (result.report.warnings.length) log(get, result.report.warnings.join('; '));
    result.notes.forEach((note) => log(get, note));
    log(get, `进入第 ${result.state.turn + 1} 年`);
    if (result.state.victory.type?.startsWith('win') || (!result.state.victory.type && result.state.turn > 0 && result.state.turn % 10 === 0)) {
      saveLocalSlot(get, 0, undefined, { stored: autoVersion });
    }
    return result.report;
  },
  continueLegacy: () => {
    const current = get().state;
    if (!current.victory.type?.startsWith('win') || useSharedWorldSessionStore.getState().session) return false;
    const state = prepareGameState({ ...current, victory: { type: null }, legacyMode: true });
    set({ state, justProcessedTurn: false });
    log(get, '已进入传世经营，不再重复判定胜利');
    saveLocalSlot(get, 0, undefined, { stored: autoVersion });
    return true;
  },
  clearTurnFlag: () => set({ justProcessedTurn: false }),
  setStrategyFocus: (focus) => {
    if ((get().state.strategyFocus ?? 'balance') === focus) return;
    commitAction(get, set, (state) => ({
      ok: true, state: { ...state, strategyFocus: focus }, messages: [`国策焦点改为：${FOCUS_LABELS[focus]}`],
    }), { commandType: 'domestic_action', action: 'set_strategy_focus', args: [focus] });
  },
  setTaxRate: (rate) => { commitAction(get, set, (state) => setTaxRateAction(state, rate), { commandType: 'domestic_action', action: 'set_tax_rate', args: [rate] }); },
  appeaseFaction: (factionId) => commitAction(get, set, (state) => appeaseFactionAction(state, factionId), { commandType: 'domestic_action', action: 'appease_faction', args: [factionId] }),
  build: (provinceId, buildingDefId) => commitAction(get, set, (state) => buildAction(state, provinceId, buildingDefId), { commandType: 'domestic_action', action: 'build', args: [provinceId, buildingDefId] }),
  recruit: (provinceId, count) => commitAction(get, set, (state) => recruitAction(state, provinceId, count), { commandType: 'military_action', action: 'recruit', args: [provinceId, count] }),
  research: (techId) => commitAction(get, set, (state) => researchAction(state, techId), { commandType: 'domestic_action', action: 'research', args: [techId] }),
  improveRelation: (target) => commitAction(get, set, (state) => improveRelationAction(state, target), { commandType: 'diplomatic_action', action: 'improve_relation', args: [target] }),
  formTrade: (target) => commitAction(get, set, (state) => formTradeAction(state, target), { commandType: 'diplomatic_action', action: 'form_trade', args: [target] }),
  formAlliance: (target) => commitAction(get, set, (state) => formAllianceAction(state, target), { commandType: 'diplomatic_action', action: 'form_alliance', args: [target] }),
  conveneDiplomaticSummit: (target, agenda, stance) => commitAction(get, set, (state) => conveneDiplomaticSummitAction(state, target, agenda, stance), { commandType: 'diplomatic_action', action: 'summit', args: [target, agenda, stance] }),
  espionage: (target, kind) => commitAction(get, set, (state) => espionageAction(state, target, kind), { commandType: 'diplomatic_action', action: 'espionage', args: [target, kind] }),
  dynasticMarriage: (target) => commitAction(get, set, (state) => dynasticMarriageAction(state, target), { commandType: 'diplomatic_action', action: 'dynastic_marriage', args: [target] }),
  culturalExport: (target) => commitAction(get, set, (state) => culturalExportAction(state, target), { commandType: 'diplomatic_action', action: 'cultural_export', args: [target] }),
  declareWar: (target, provinceId) => commitAction(get, set, (state) => declareWarAction(state, target, provinceId), { commandType: 'military_action', action: 'declare_war', args: [target, provinceId] }),
  makePeace: (warId) => commitAction(get, set, (state) => makePeaceAction(state, warId, !!useSharedWorldSessionStore.getState().session), { commandType: 'military_action', action: 'make_peace', args: [warId] }),
  moveArmy: (armyId, toProvinceId) => commitAction(get, set, (state) => moveArmyAction(state, armyId, toProvinceId), { commandType: 'military_action', action: 'move_army', args: [armyId, toProvinceId] }),
  enactPolicy: (policyId) => commitAction(get, set, (state) => enactPolicyAction(state, policyId), { commandType: 'domestic_action', action: 'enact_policy', args: [policyId] }),
  enactLaw: (lawId) => commitAction(get, set, (state) => enactLawAction(state, lawId), { commandType: 'domestic_action', action: 'enact_law', args: [lawId] }),
  establishTradeRoute: (routeId) => commitAction(get, set, (state) => establishTradeRouteAction(state, routeId), { commandType: 'domestic_action', action: 'establish_trade_route', args: [routeId] }),
  embargoTradeRoute: (routeId) => commitAction(get, set, (state) => embargoTradeRouteAction(state, routeId), { commandType: 'domestic_action', action: 'embargo_trade_route', args: [routeId] }),
  developProvince: (provinceId, kind: ProvinceDevelopmentKind) => commitAction(get, set, (state) => developProvinceAction(state, provinceId, kind), { commandType: 'domestic_action', action: 'develop_province', args: [provinceId, kind] }),
  upgradeBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, (state) => upgradeBuildingAction(state, provinceId, buildingInstanceId), { commandType: 'domestic_action', action: 'upgrade_building', args: [provinceId, buildingInstanceId] }),
  demolishBuilding: (provinceId, buildingInstanceId) => commitAction(get, set, (state) => demolishBuildingAction(state, provinceId, buildingInstanceId), { commandType: 'domestic_action', action: 'demolish_building', args: [provinceId, buildingInstanceId] }),
  suppressRebellion: () => commitAction(get, set, (state) => suppressRebellionAction(state), { commandType: 'domestic_action', action: 'suppress_rebellion', args: [] }),
  negotiateRebellion: () => commitAction(get, set, (state) => negotiateRebellionAction(state), { commandType: 'domestic_action', action: 'negotiate_rebellion', args: [] }),
  resolveEvent: (eventId, optionIndex) => commitAction(get, set, (state) => {
    const result = resolvePendingEventChoice(state, state.playerNationId, eventId, optionIndex);
    return {
      ok: result.resolved,
      state: result.state,
      messages: result.resolved ? [`事件 ${result.eventTitle}：选择「${result.optionText}」`] : [],
    };
  }, { commandType: 'domestic_action', action: 'resolve_event', args: [eventId, optionIndex] }),
  logMsg: (msg) => set((s) => ({ log: [...s.log.slice(-30), msg], logSeq: s.logSeq + 1 })),
}));
