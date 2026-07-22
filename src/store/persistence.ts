// Imperium Aeternum — 存档读写 + 版本迁移 + 多槽位
// 阶段 5a → B3 多槽位 + B7 迁移 + v6 会谈协议状态

import type { SaveGame, GameState, DiplomaticRelation } from '../types/game';
import { SAVE_VERSION } from '../types/game';
import { derivePolicyMods } from '../engine/politics';
import { cloneGameState } from '../engine/stateClone';
import { entitySequenceFromId } from '../utils/id';
import { EVENT_BY_ID } from '../data/events';

// B3: 5 槽位存档（槽位 0 = 自动存档，1-4 = 手动）
const STORAGE_KEY_BASE = 'imperium-aeternum-save';
const SLOT_KEY = (slot: number) => `${STORAGE_KEY_BASE}-${slot}`;
const AUTO_SLOT = 0;
export const SLOT_COUNT = 5;

type MutableGameState = GameState & Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeRelation(r: Partial<DiplomaticRelation>): DiplomaticRelation | null {
  if (!r.from || !r.to || r.from === r.to) return null;
  return {
    from: r.from,
    to: r.to,
    relation: clamp(num(r.relation), -100, 100),
    trust: clamp(num(r.trust, 50), 0, 100),
    threat: clamp(num(r.threat), 0, 100),
    tradeDep: clamp(num(r.tradeDep), 0, 100),
    treaty: r.treaty ?? 'none',
    truceTurns: Math.max(0, Math.round(num(r.truceTurns))),
  };
}

function reverseRelation(r: DiplomaticRelation): DiplomaticRelation {
  return { from: r.to, to: r.from, relation: r.relation, trust: r.trust, threat: r.threat, tradeDep: r.tradeDep, treaty: r.treaty, truceTurns: r.truceTurns };
}

function maxPersistedEntitySequence(state: GameState): number {
  let max = 0;
  const inspect = (id: unknown) => { max = Math.max(max, entitySequenceFromId(id)); };
  for (const nation of Object.values(state.nations)) nation.army?.forEach((army) => inspect(army.id));
  for (const province of Object.values(state.provinces)) province.buildings?.forEach((building) => inspect(building.id));
  state.wars?.forEach((war) => inspect(war.id));
  state.diplomaticSummits?.forEach((summit) => inspect(summit.id));
  state.diplomaticAccords?.forEach((accord) => inspect(accord.id));
  return max;
}

// v4：集中修复旧存档/旧世界生成留下的结构问题。
// 目标不是改变玩家进度，而是让旧档继续能跑：补数组、补资源字段、补双向外交、修无效玩家国。
export function normalizeGameState(gs: GameState): GameState {
  if (!gs || !gs.nations || !gs.provinces) return gs;
  const state = gs as MutableGameState;

  state.version = SAVE_VERSION;
  state.entityIdCounter = Math.max(0, Math.round(num(state.entityIdCounter)), maxPersistedEntitySequence(gs));
  delete state['stableTurnsCount'];
  delete state['highEconomyStableTurns'];
  state.wars = Array.isArray(state.wars) ? state.wars : [];
  state.diplomaticSummits = Array.isArray(state.diplomaticSummits) ? state.diplomaticSummits : [];
  state.diplomaticAccords = Array.isArray(state.diplomaticAccords) ? state.diplomaticAccords : [];
  state.triggeredEvents = Array.isArray(state.triggeredEvents) ? state.triggeredEvents : [];
  state.eventCooldowns = Array.isArray(state.eventCooldowns) ? state.eventCooldowns : [];
  state.pendingEvents = Array.isArray(state.pendingEvents) ? state.pendingEvents : [];
  state.pendingEventOptions = state.pendingEventOptions ?? null;
  state.history = Array.isArray(state.history) ? state.history : [];
  state.lastReport = state.lastReport ?? null;
  state.victory = state.victory ?? { type: null };
  state.bankruptTurns = num(state.bankruptTurns);
  state.lowStabilityTurns = num(state.lowStabilityTurns);
  state.chronicle = Array.isArray(state.chronicle) ? state.chronicle : [];

  if (!gs.playerNationId || !gs.nations[gs.playerNationId]) {
    const fallback = Object.values(gs.nations).find((n) => !n.defeated) ?? Object.values(gs.nations)[0];
    if (fallback) gs.playerNationId = fallback.id;
  }

  for (const n of Object.values(gs.nations)) {
    n.isPlayer = n.id === gs.playerNationId;
    n.activeCharacterBonuses = Array.isArray(n.activeCharacterBonuses) ? n.activeCharacterBonuses : [];
    n.activePolicies = Array.isArray(n.activePolicies) ? n.activePolicies : [];
    n.policyMods = derivePolicyMods(n);
    n.activeLaws = Array.isArray(n.activeLaws) ? n.activeLaws : [];
    n.activeTradeRoutes = Array.isArray(n.activeTradeRoutes) ? n.activeTradeRoutes : [];
    n.embargoedRoutes = Array.isArray(n.embargoedRoutes) ? n.embargoedRoutes : [];
    n.army = Array.isArray(n.army) ? n.army : [];
    n.factions = Array.isArray(n.factions) ? n.factions : [];
    n.resources = {
      gold: num(n.resources?.gold),
      food: num(n.resources?.food),
      wood: num(n.resources?.wood),
      iron: num(n.resources?.iron),
      adminPt: num(n.resources?.adminPt, 5),
      sciPt: num(n.resources?.sciPt),
      influence: num(n.resources?.influence, 20),
      supply: num(n.resources?.supply, 50),
    };
    n.tech = {
      agri: num(n.tech?.agri, 1),
      mil: num(n.tech?.mil, 1),
      admin: num(n.tech?.admin, 1),
      culture: num(n.tech?.culture),
      researchProgress: n.tech?.researchProgress ?? null,
    };
    n.government = {
      type: n.government?.type ?? 'monarchy',
      legitimacy: clamp(num(n.government?.legitimacy, 50), 0, 100),
      stability: clamp(num(n.government?.stability, 50), 0, 100),
      efficiency: clamp(num(n.government?.efficiency, 50), 0, 100),
      corruption: clamp(num(n.government?.corruption, 10), 0, 100),
    };
    n.ruler = n.ruler ?? { name: '无名', ability: 50, age: 40 };
    n.warExhaustion = clamp(num(n.warExhaustion), 0, 100);
    n.influence = num(n.influence, n.resources.influence);
    n.atWar = !!n.atWar;
    n.defeated = !!n.defeated;
  }

  for (const p of Object.values(gs.provinces)) {
    p.classes = Array.isArray(p.classes) ? p.classes : [];
    p.buildings = Array.isArray(p.buildings) ? p.buildings : [];
    p.adjacent = Array.isArray(p.adjacent) ? p.adjacent.filter((id) => !!gs.provinces[id] && id !== p.id) : [];
    p.baseResources = p.baseResources ?? {};
    p.population = Math.max(0, Math.round(num(p.population)));
    p.garrison = Math.max(0, Math.round(num(p.garrison)));
    p.assimilation = clamp(num(p.assimilation, 50), 0, 100);
    p.loyalty = clamp(num(p.loyalty, 50), 0, 100);
    p.unrest = clamp(num(p.unrest), 0, 100);
    p.rebellionRisk = clamp(num(p.rebellionRisk), 0, 100);
  }

  const byKey = new Map<string, DiplomaticRelation>();
  for (const raw of gs.relations ?? []) {
    const r = normalizeRelation(raw);
    if (!r || !gs.nations[r.from] || !gs.nations[r.to]) continue;
    byKey.set(`${r.from}|${r.to}`, r);
  }
  for (const r of Array.from(byKey.values())) {
    const revKey = `${r.to}|${r.from}`;
    if (!byKey.has(revKey)) byKey.set(revKey, reverseRelation(r));
  }
  gs.relations = Array.from(byKey.values());
  gs._relMap = undefined;

  return gs;
}

function pruneRecordByRecency<T extends { lastUpdated?: number; sinceTurn?: number }>(value: Record<string, T> | undefined, keep: number): Record<string, T> | undefined {
  if (!value) return value;
  const entries = Object.entries(value);
  if (entries.length <= keep) return value;
  return Object.fromEntries(entries.sort((a, b) => num(b[1]?.lastUpdated ?? b[1]?.sinceTurn) - num(a[1]?.lastUpdated ?? a[1]?.sinceTurn)).slice(0, keep));
}

// O13: 保存前瘦身。只删除可再生/陈旧/已限长数据，不改变玩家正在看的核心局势。
export function compactGameStateForSave(gs: GameState): GameState {
  const compact = normalizeGameState(cloneGameState(gs));
  compact.history = (compact.history ?? []).slice(-10);
  compact.triggeredEvents = (compact.triggeredEvents ?? []).slice(-1000);
  compact.eventCooldowns = (compact.eventCooldowns ?? []).filter((entry) => {
    const event = EVENT_BY_ID[entry.eventId];
    return !!event && (event.unique || compact.turn - entry.lastTriggeredTurn < event.cooldown);
  });
  compact.diplomaticSummits = (compact.diplomaticSummits ?? []).slice(-120);
  compact.diplomaticAccords = compact.diplomaticAccords ?? [];
  compact.chronicle = (compact.chronicle ?? []).slice(-80);
  compact.wars = (compact.wars ?? []).map((w) => ({ ...w, battleReports: (w.battleReports ?? []).slice(-20) }));

  compact.aiMemory = pruneRecordByRecency(compact.aiMemory, 180);
  compact.aiStrategyMeta = pruneRecordByRecency(compact.aiStrategyMeta, 180);
  compact._relMap = undefined;
  return compact;
}

const migrations: { from: number; to: number; apply: (s: SaveGame) => SaveGame }[] = [
  {
    from: 1, to: 2,
    apply: (s) => {
      const gs = s.gameState;
      for (const n of Object.values(gs.nations)) {
        if (!n.embargoedRoutes) n.embargoedRoutes = [];
        if (n.tech && n.tech.culture === undefined) n.tech.culture = 0;
      }
      if (!gs.chronicle) gs.chronicle = [];
      for (const r of gs.history ?? []) {
        if (!r.warProgress) r.warProgress = [];
        if (!r.factionDelta) r.factionDelta = [];
        if (r.exhaustSnapshot === undefined) r.exhaustSnapshot = 0;
      }
      if (gs.lastReport) {
        if (!gs.lastReport.warProgress) gs.lastReport.warProgress = [];
        if (!gs.lastReport.factionDelta) gs.lastReport.factionDelta = [];
        if (gs.lastReport.exhaustSnapshot === undefined) gs.lastReport.exhaustSnapshot = 0;
      }
      return { ...s, version: 2 };
    },
  },
  {
    from: 2, to: 3,
    apply: (s) => {
      const gs = s.gameState;
      for (const r of gs.history ?? []) {
        if (!r.worldEvents) r.worldEvents = [];
        if (!r.provinceChanges) r.provinceChanges = [];
      }
      if (gs.lastReport) {
        if (!gs.lastReport.worldEvents) gs.lastReport.worldEvents = [];
        if (!gs.lastReport.provinceChanges) gs.lastReport.provinceChanges = [];
      }
      return { ...s, version: 3 };
    },
  },
  { from: 3, to: 4, apply: (s) => ({ ...s, version: 4, gameState: normalizeGameState(s.gameState) }) },
  { from: 4, to: 5, apply: (s) => ({ ...s, version: 5, gameState: normalizeGameState(s.gameState) }) },
  { from: 5, to: 6, apply: (s) => ({ ...s, version: 6, gameState: normalizeGameState(s.gameState) }) },
];

export function migrate(save: SaveGame): SaveGame {
  // 迁移是工具链/预检也会调用的公共入口，不能污染调用方持有的旧存档对象。
  let cur: SaveGame = { ...save, gameState: cloneGameState(save.gameState) };
  if (!cur.version || cur.version < 1) cur = { ...cur, version: 1 };
  while (cur.version < SAVE_VERSION) {
    const m = migrations.find((x) => x.from === cur.version);
    if (!m) throw new Error(`无法从版本 ${cur.version} 迁移到 ${SAVE_VERSION}：缺迁移函数`);
    cur = m.apply(cur);
  }
  return { ...cur, gameState: normalizeGameState(cur.gameState), version: SAVE_VERSION };
}

export function saveGameToSlot(state: GameState, slot: number): { ok: boolean; sizeKB?: number; error?: string } {
  const data: SaveGame = { version: SAVE_VERSION, createdAt: new Date().toISOString(), gameState: compactGameStateForSave(state) };
  try {
    const raw = JSON.stringify(data);
    const sizeKB = Math.round(raw.length / 1024);
    if (sizeKB > 4500) console.warn(`存档 ${sizeKB}KB 接近 localStorage 上限，建议删档或精简`);
    localStorage.setItem(SLOT_KEY(slot), raw);
    return { ok: true, sizeKB };
  } catch (e) {
    const msg = (e instanceof DOMException && e.name === 'QuotaExceededError') ? '存档超出浏览器容量上限（约5MB），无法存档' : `存档失败：${(e as Error).message}`;
    console.error(msg, e);
    return { ok: false, error: msg };
  }
}

export type SlotReadResult =
  | { ok: true; save: SaveGame; raw: string; sizeKB: number }
  | { ok: false; empty?: boolean; error: string };

export function readSaveGameFromSlot(slot: number): SlotReadResult {
  try {
    if (typeof localStorage === 'undefined') return { ok: false, empty: true, error: 'localStorage 不可用' };
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return { ok: false, empty: true, error: '空槽位' };
    return { ok: true, raw, save: JSON.parse(raw) as SaveGame, sizeKB: Math.round(raw.length / 1024) };
  } catch (e) {
    return { ok: false, error: `存档解析失败：${(e as Error).message}` };
  }
}

export function importSaveGameToSlot(slot: number, raw: string): { ok: true; state: GameState } | { ok: false; error: string } {
  try {
    if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) return { ok: false, error: '无效存档槽位' };
    if (typeof localStorage === 'undefined') return { ok: false, error: 'localStorage 不可用' };
    const parsed = JSON.parse(raw) as SaveGame;
    const migrated = migrate(parsed);
    const normalized: SaveGame = {
      version: SAVE_VERSION,
      createdAt: parsed.createdAt || new Date().toISOString(),
      gameState: compactGameStateForSave(migrated.gameState),
    };
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify(normalized));
    return { ok: true, state: normalized.gameState };
  } catch (error) {
    return { ok: false, error: `云存档导入失败：${(error as Error).message}` };
  }
}

export function loadGameFromSlot(slot: number): GameState | null {
  try {
    const read = readSaveGameFromSlot(slot);
    if (!read.ok) return null;
    const migrated = migrate(read.save);
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify({ ...migrated, gameState: compactGameStateForSave(migrated.gameState), createdAt: migrated.createdAt ?? new Date().toISOString() }));
    return migrated.gameState;
  } catch (e) {
    console.error('存档读取失败', e);
    return null;
  }
}

export function getSlotMeta(slot: number): { createdAt: string; turn: number; version: number; nationName?: string } | null {
  try {
    const read = readSaveGameFromSlot(slot);
    if (!read.ok) return null;
    const parsed = read.save;
    const pid = parsed.gameState?.playerNationId;
    const nationName = pid ? parsed.gameState?.nations?.[pid]?.name : undefined;
    return { createdAt: parsed.createdAt, turn: parsed.gameState?.turn ?? 0, version: parsed.version, nationName };
  } catch {
    return null;
  }
}

export function listAllSlots(): ({ slot: number; meta: NonNullable<ReturnType<typeof getSlotMeta>> } | { slot: number; meta: null })[] {
  const out: ({ slot: number; meta: NonNullable<ReturnType<typeof getSlotMeta>> } | { slot: number; meta: null })[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) out.push({ slot: i, meta: getSlotMeta(i) });
  return out;
}

export function deleteSlot(slot: number): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SLOT_KEY(slot));
  } catch { /* ignore */ }
}

export function clearAllSaves(): void {
  for (let i = 0; i < SLOT_COUNT; i++) deleteSlot(i);
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY_BASE); } catch { /* ignore */ }
}

export function autoSave(state: GameState): void { saveGameToSlot(state, AUTO_SLOT); }
export function saveGame(state: GameState): { ok: boolean; sizeKB?: number; error?: string } { return saveGameToSlot(state, AUTO_SLOT); }
export function loadGame(): GameState | null { return loadGameFromSlot(AUTO_SLOT); }
export function hasSave(): boolean {
  try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SLOT_KEY(AUTO_SLOT)); } catch { return false; }
}
export function getSaveMeta(): { createdAt: string; turn: number; version: number } | null { return getSlotMeta(AUTO_SLOT); }
export function deleteSave(): void { deleteSlot(AUTO_SLOT); }

export { SAVE_VERSION };
