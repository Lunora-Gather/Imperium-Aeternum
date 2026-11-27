// Imperium Aeternum — 存档读写 + 版本迁移 + 多槽位
// 阶段 5a → B3 多槽位 + B7 迁移 + v6 会谈协议状态

import type { SaveGame, GameState, DiplomaticRelation } from '../types/game';
import { decodeLocalSave, encodeLocalSave, MAX_SAVE_BYTES } from './localSaveCodec';
import { SAVE_VERSION } from '../types/game';
import { derivePolicyMods } from '../engine/politics';
import { cloneGameState } from '../engine/stateClone';
import { entitySequenceFromId } from '../utils/id';
import { EVENT_BY_ID } from '../data/events';
import { prepareGameState } from '../gameplay/prepareGameState';

// B3: 5 槽位存档（槽位 0 = 自动存档，1-4 = 手动）
const STORAGE_KEY_BASE = 'imperium-aeternum-save';
const SLOT_KEY = (slot: number) => `${STORAGE_KEY_BASE}-${slot}`;
const AUTO_SLOT = 0;
export const SLOT_COUNT = 5;
export const SLOT_CHANGED = '槽位已变化，请在存档页核对或另存。';

type MutableGameState = GameState & Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEntityMap(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([id, entity]) => id !== '' && isRecord(entity) && entity.id === id);
}

function assertSafeSaveGame(value: unknown): asserts value is SaveGame {
  if (
    !isRecord(value)
    || !isRecord(value.gameState)
    || !isEntityMap(value.gameState.nations)
    || !isEntityMap(value.gameState.provinces)
  ) throw new Error('存档结构无效');
  const version = value.version == null ? 1 : Number(value.version);
  if (!Number.isSafeInteger(version) || version < 0 || version > SAVE_VERSION) throw new Error('存档版本无效');
}

const unsafeSaveKeys = ['__proto__', 'prototype', 'constructor'];
function validateSaveKey(key: string, value: unknown) {
  if (unsafeSaveKeys.includes(key)) throw new Error('存档包含不安全字段');
  return value;
}

function parseSaveGame(raw: string): SaveGame {
  // Without escapes every decoded key occurs literally in the input. Ordinary
  // world saves can use the native parser without invoking JS for every field.
  const reviewKeys = raw.includes('\\') || unsafeSaveKeys.some(key => raw.includes(key));
  const parsed: unknown = JSON.parse(raw, reviewKeys ? validateSaveKey : undefined);
  assertSafeSaveGame(parsed);
  return parsed;
}

function saveBytes(raw: string): number {
  return new Blob([raw]).size;
}

function serializeSave(save: SaveGame) {
  const raw = JSON.stringify(save);
  const bytes = new TextEncoder().encode(raw);
  if (bytes.byteLength > MAX_SAVE_BYTES) throw new Error('存档超过 5MB 安全上限，无法保存');
  return { raw, bytes };
}

function validSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < SLOT_COUNT;
}

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
  return { ...r, from: r.to, to: r.from };
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
  for (const report of state.history) report.strategicNotes = Array.isArray(report.strategicNotes) ? report.strategicNotes : [];
  if (state.lastReport) state.lastReport.strategicNotes = Array.isArray(state.lastReport.strategicNotes) ? state.lastReport.strategicNotes : [];
  state.victory = state.victory ?? { type: null };
  state.bankruptTurns = num(state.bankruptTurns);
  state.lowStabilityTurns = num(state.lowStabilityTurns);
  state.chronicle = Array.isArray(state.chronicle) ? state.chronicle : [];
  state.nationalMission = state.nationalMission && Array.isArray(state.nationalMission.completedStages)
    ? state.nationalMission
    : undefined;
  state.nationalCrisis = state.nationalCrisis ?? undefined;

  if (!Object.prototype.hasOwnProperty.call(gs.nations, gs.playerNationId)) {
    const fallback = Object.values(gs.nations).find((n) => !n.defeated) ?? Object.values(gs.nations)[0];
    if (fallback) gs.playerNationId = fallback.id;
  }

  for (const n of Object.values(gs.nations)) {
    n.isPlayer = n.id === gs.playerNationId;
    n.activeCharacterBonuses = Array.isArray(n.activeCharacterBonuses) ? n.activeCharacterBonuses : [];
    n.activePolicies = Array.isArray(n.activePolicies) ? n.activePolicies : [];
    if (n.policyMods || n.activePolicies.length) n.policyMods = derivePolicyMods(n);
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
  state.entityIdCounter = Math.max(0, Math.round(num(state.entityIdCounter)), maxPersistedEntitySequence(gs));

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

// O13: 保存前瘦身。只删除可再生/陈旧/已限长数据，不改变玩家正在看的核心局势。
export function compactGameStateForSave(gs: GameState): GameState {
  return compactNormalizedGameState(normalizeGameState(cloneGameState(gs)));
}

// Only pass a private copy: compaction trims its persisted history in place.
function compactNormalizedGameState(compact: GameState): GameState {
  compact.history = (compact.history ?? []).slice(-10);
  // Older saves sometimes recorded unique events only in the rolling event log.
  const recorded = new Set(compact.eventCooldowns.filter(e => EVENT_BY_ID[e.eventId]?.unique)
    .map(e => `${e.nationId ?? compact.playerNationId}|${e.eventId}`));
  for (const event of compact.triggeredEvents) {
    if (!EVENT_BY_ID[event.eventId]?.unique) continue;
    const nationId = event.nationId ?? compact.playerNationId;
    const key = `${nationId}|${event.eventId}`;
    if (!recorded.has(key) && compact.nations[nationId]) {
      compact.eventCooldowns.push({ nationId, eventId: event.eventId, lastTriggeredTurn: event.turn });
      recorded.add(key);
    }
  }
  compact.triggeredEvents = compact.triggeredEvents.slice(-1000);
  compact.eventCooldowns = (compact.eventCooldowns ?? []).filter((entry) => {
    const event = EVENT_BY_ID[entry.eventId];
    return !!event && (event.unique || compact.turn - entry.lastTriggeredTurn < event.cooldown);
  });
  compact.diplomaticSummits = (compact.diplomaticSummits ?? []).slice(-120);
  compact.diplomaticAccords = compact.diplomaticAccords ?? [];
  compact.chronicle = (compact.chronicle ?? []).slice(-80);
  compact.wars = (compact.wars ?? []).map((w) => ({ ...w, battleReports: (w.battleReports ?? []).slice(-20) }));

  // These are active diplomatic decisions, including for the smallest nations.
  // Only records for nations which have disappeared can be discarded.
  for (const records of [compact.aiMemory, compact.aiStrategyMeta]) {
    if (records) for (const id of Object.keys(records)) if (!compact.nations[id]) delete records[id];
  }
  compact._relMap = undefined;
  return compact;
}

// Older reports need the fields introduced in v2 and v3.
function upgradeLegacyReports(state: GameState, version: number): void {
  const reports = [...(state.history ?? [])];
  if (state.lastReport) reports.push(state.lastReport);
  for (const report of reports) {
    if (version < 2) {
      report.warProgress ??= [];
      report.factionDelta ??= [];
      report.exhaustSnapshot ??= 0;
    }
    report.worldEvents ??= [];
    report.provinceChanges ??= [];
  }
}

export function migrate(save: SaveGame): SaveGame {
  // 迁移是工具链/预检也会调用的公共入口，不能污染调用方持有的旧存档对象。
  assertSafeSaveGame(save);
  return migrateParsedSave({ ...save, gameState: cloneGameState(save.gameState) });
}

// The parser already validated and owns this snapshot. In-place migration
// avoids cloning the entire world before making the separate recovery copy.
export function migrateParsedSave(save: SaveGame): SaveGame {
  const createdAt = Number.isFinite(Date.parse(String(save.createdAt ?? '')))
    ? save.createdAt
    : new Date().toISOString();
  const state = save.gameState;
  const version = Number(save.version) || 1;
  if (version < 3) upgradeLegacyReports(state, version);
  // All schema changes from v4 through v7 are covered by normalization.
  return { ...save, createdAt, gameState: normalizeGameState(state), version: SAVE_VERSION };
}

export function recoverMigratedSave(migrated: SaveGame): SaveGame {
  return {
    version: migrated.version,
    createdAt: migrated.createdAt,
    gameState: compactNormalizedGameState(prepareGameState(migrated.gameState, 'preserve')),
  };
}

export type SlotSaveResult = { ok: true; sizeKB: number; stored: string; raw: string } | { ok: false; error: string };

export function watchOtherTabSaves(refresh: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage && (event.key === null || event.key.startsWith(STORAGE_KEY_BASE + '-'))) refresh();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export type ExpectedSlot = string | null | { stored: string | null };

function slotMatches(slot: number, expected?: ExpectedSlot): boolean {
  if (expected === undefined) return true;
  return expected !== null && typeof expected === 'object'
    ? slotStorageValue(slot) === expected.stored
    : storedSlotRaw(slot) === expected;
}

export function saveGameToSlot(state: GameState, slot: number, expectedRaw?: ExpectedSlot): SlotSaveResult {
  if (!validSlot(slot)) return { ok: false, error: '无效存档槽位' };
  try {
    const data: SaveGame = { version: SAVE_VERSION, createdAt: new Date().toISOString(), gameState: compactGameStateForSave(state) };
    const { raw, bytes } = serializeSave(data);
    const sizeKB = Math.round(bytes.byteLength / 1024);
    const stored = encodeLocalSave(raw, bytes);
    if (!slotMatches(slot, expectedRaw)) {
      return { ok: false, error: SLOT_CHANGED };
    }
    localStorage.setItem(SLOT_KEY(slot), stored);
    return { ok: true, sizeKB, stored, raw };
  } catch (e) {
    const msg = (e instanceof DOMException && e.name === 'QuotaExceededError') ? '浏览器空间已满，无法存档。请释放空间后重试。' : `存档失败：${(e as Error).message}`;
    console.error(msg, e);
    return { ok: false, error: msg };
  }
}

export type SlotReadResult =
  | { ok: true; save: SaveGame; raw: string; stored: string; sizeKB: number }
  | { ok: false; empty?: boolean; error: string };

export function slotStorageValue(slot: number): string | null {
  if (!validSlot(slot)) throw new Error('无效存档槽位');
  return localStorage.getItem(SLOT_KEY(slot));
}

// Cloud hashes and overwrite confirmations use the original JSON, regardless of
// its local encoding. A damaged slot still needs an identity for replacement.
export function storedSlotRaw(slot: number): string | null {
  const stored = slotStorageValue(slot);
  if (stored === null) return null;
  try { return decodeLocalSave(stored); } catch { return stored; }
}

export function readStoredSave(stored: string | null): SlotReadResult {
  try {
    if (stored === null) return { ok: false, empty: true, error: '空槽位' };
    const raw = decodeLocalSave(stored);
    const bytes = saveBytes(raw);
    if (bytes > MAX_SAVE_BYTES) return { ok: false, error: '存档超过 5MB 安全上限' };
    const parsed = parseSaveGame(raw);
    return { ok: true, raw, stored, save: parsed, sizeKB: Math.round(bytes / 1024) };
  } catch (e) {
    return { ok: false, error: `存档解析失败：${(e as Error).message}` };
  }
}

export function readSaveGameFromSlot(slot: number): SlotReadResult {
  try {
    if (!validSlot(slot)) return { ok: false, error: '无效存档槽位' };
    if (typeof localStorage === 'undefined') return { ok: false, empty: true, error: 'localStorage 不可用' };
    return readStoredSave(slotStorageValue(slot));
  } catch (error) {
    return { ok: false, error: `存档读取失败：${(error as Error).message}` };
  }
}

export function importSaveGameToSlot(slot: number, raw: string, expectedRaw?: ExpectedSlot): { ok: true; state: GameState; raw: string } | { ok: false; error: string; conflict?: boolean } {
  try {
    if (!validSlot(slot)) return { ok: false, error: '无效存档槽位' };
    if (typeof localStorage === 'undefined') return { ok: false, error: 'localStorage 不可用' };
    if (saveBytes(raw) > MAX_SAVE_BYTES) return { ok: false, error: '云存档超过 5MB 安全上限' };
    const recovered = recoverMigratedSave(migrateParsedSave(parseSaveGame(raw)));
    const serialized = serializeSave(recovered);
    const stored = encodeLocalSave(serialized.raw, serialized.bytes);
    if (!slotMatches(slot, expectedRaw)) {
      return { ok: false, conflict: true, error: SLOT_CHANGED };
    }
    localStorage.setItem(SLOT_KEY(slot), stored);
    return { ok: true, state: recovered.gameState, raw: serialized.raw };
  } catch (error) {
    return { ok: false, error: `云存档导入失败：${(error as Error).message}` };
  }
}

export function loadSlotCheckpoint(slot: number, expectedStored?: string | null): { state: GameState; stored: string } | null {
  try {
    const read = readSaveGameFromSlot(slot);
    if (!read.ok || (expectedStored !== undefined && read.stored !== expectedStored)) return null;
    const recovered = recoverMigratedSave(migrateParsedSave(read.save));
    let storedVersion = read.stored;
    try {
      const { raw, bytes } = serializeSave(recovered);
      if (raw !== read.raw || read.stored === read.raw) {
        const stored = encodeLocalSave(raw, bytes);
        if (stored !== read.stored && slotStorageValue(slot) === read.stored) {
          localStorage.setItem(SLOT_KEY(slot), stored);
          storedVersion = stored;
        }
      }
    } catch (error) {
      console.warn('存档已读取，修复结果未能写回', error);
    }
    return { state: recovered.gameState, stored: storedVersion };
  } catch (e) {
    console.error('存档读取失败', e);
    return null;
  }
}

export function loadGameFromSlot(slot: number): GameState | null {
  return loadSlotCheckpoint(slot)?.state ?? null;
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

export function deleteSlot(slot: number, expectedRaw?: ExpectedSlot): boolean {
  try {
    if (!validSlot(slot) || typeof localStorage === 'undefined') return false;
    if (!slotMatches(slot, expectedRaw)) return false;
    localStorage.removeItem(SLOT_KEY(slot));
    return true;
  } catch { return false; }
}

export function snapshotSaveList(reviewed?: ReadonlyMap<number, string | null>) {
  const slots = reviewed ?? new Map(Array.from({ length: SLOT_COUNT }, (_, slot) => [slot, slotStorageValue(slot)]));
  return { slots, legacy: localStorage.getItem(STORAGE_KEY_BASE) };
}

export function clearAllSaves(expected?: ReturnType<typeof snapshotSaveList>, removeSlot = deleteSlot): boolean {
  try {
    const { slots, legacy } = expected ?? snapshotSaveList();
    if (slots.size !== SLOT_COUNT || localStorage.getItem(STORAGE_KEY_BASE) !== legacy) return false;
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      if (slotStorageValue(slot) !== slots.get(slot)) return false;
    }
    let cleared = true;
    for (const [slot, stored] of slots) {
      if (stored !== null && !removeSlot(slot, { stored })) cleared = false;
    }
    if (legacy !== null) {
      if (localStorage.getItem(STORAGE_KEY_BASE) !== legacy) return false;
      localStorage.removeItem(STORAGE_KEY_BASE);
    }
    return cleared && [...slots.keys()].every(slot => slotStorageValue(slot) === null)
      && localStorage.getItem(STORAGE_KEY_BASE) === null;
  } catch { return false; }
}

export function autoSave(state: GameState): void { saveGameToSlot(state, AUTO_SLOT); }
export function saveGame(state: GameState): { ok: boolean; sizeKB?: number; error?: string } { return saveGameToSlot(state, AUTO_SLOT); }
export function loadGame(): GameState | null { return loadGameFromSlot(AUTO_SLOT); }
export function hasSave(): boolean {
  try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SLOT_KEY(AUTO_SLOT)); } catch { return false; }
}
export function getSaveMeta(): { createdAt: string; turn: number; version: number } | null { return getSlotMeta(AUTO_SLOT); }
export function deleteSave(): boolean { return deleteSlot(AUTO_SLOT); }

export { SAVE_VERSION };
