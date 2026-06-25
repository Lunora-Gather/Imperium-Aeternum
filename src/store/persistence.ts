// Imperium Aeternum — 存档读写 + 版本迁移 + 多槽位
// 阶段 5a → B3 多槽位 + B7 迁移 + v4 状态规范化

import type { SaveGame, GameState, DiplomaticRelation } from '../types/game';
import { SAVE_VERSION } from '../types/game';

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
  return {
    from: r.to,
    to: r.from,
    relation: r.relation,
    trust: r.trust,
    threat: r.threat,
    tradeDep: r.tradeDep,
    treaty: r.treaty,
    truceTurns: r.truceTurns,
  };
}

// v4：集中修复旧存档/旧世界生成留下的结构问题。
// 目标不是改变玩家进度，而是让旧档继续能跑：补数组、补资源字段、补双向外交、修无效玩家国。
export function normalizeGameState(gs: GameState): GameState {
  if (!gs || !gs.nations || !gs.provinces) return gs;
  const state = gs as MutableGameState;

  state.version = SAVE_VERSION;
  state.wars = Array.isArray(state.wars) ? state.wars : [];
  state.triggeredEvents = Array.isArray(state.triggeredEvents) ? state.triggeredEvents : [];
  state.eventCooldowns = Array.isArray(state.eventCooldowns) ? state.eventCooldowns : [];
  state.pendingEvents = Array.isArray(state.pendingEvents) ? state.pendingEvents : [];
  state.pendingEventOptions = state.pendingEventOptions ?? null;
  state.history = Array.isArray(state.history) ? state.history : [];
  state.lastReport = state.lastReport ?? null;
  state.victory = state.victory ?? { type: null };
  state.stableTurnsCount = num(state.stableTurnsCount);
  state.bankruptTurns = num(state.bankruptTurns);
  state.lowStabilityTurns = num(state.lowStabilityTurns);
  state.highEconomyStableTurns = num(state.highEconomyStableTurns);
  state.chronicle = Array.isArray(state.chronicle) ? state.chronicle : [];

  // 玩家国不存在时兜底到第一个未亡国家，避免读旧档直接白屏。
  if (!gs.playerNationId || !gs.nations[gs.playerNationId]) {
    const fallback = Object.values(gs.nations).find((n) => !n.defeated) ?? Object.values(gs.nations)[0];
    if (fallback) gs.playerNationId = fallback.id;
  }

  for (const n of Object.values(gs.nations)) {
    n.isPlayer = n.id === gs.playerNationId;
    n.activeCharacterBonuses = Array.isArray(n.activeCharacterBonuses) ? n.activeCharacterBonuses : [];
    n.activePolicies = Array.isArray(n.activePolicies) ? n.activePolicies : [];
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

  // 外交关系双向补全。旧世界只存 A→B 时，玩家选到 B 会找不到 B→A。
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

// B7: 迁移函数——v1→v2→v3→v4 补字段
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
  {
    from: 3, to: 4,
    apply: (s) => ({ ...s, version: 4, gameState: normalizeGameState(s.gameState) }),
  },
];

export function migrate(save: SaveGame): SaveGame {
  let cur = save;
  if (!cur.version || cur.version < 1) cur = { ...cur, version: 1 };
  while (cur.version < SAVE_VERSION) {
    const m = migrations.find((x) => x.from === cur.version);
    if (!m) throw new Error(`无法从版本 ${cur.version} 迁移到 ${SAVE_VERSION}：缺迁移函数`);
    cur = m.apply(cur);
  }
  return { ...cur, gameState: normalizeGameState(cur.gameState), version: SAVE_VERSION };
}

// B3: 槽位存档
export function saveGameToSlot(state: GameState, slot: number): { ok: boolean; sizeKB?: number; error?: string } {
  const data: SaveGame = {
    version: SAVE_VERSION,
    createdAt: new Date().toISOString(),
    gameState: normalizeGameState({ ...state, _relMap: undefined }),
  };
  try {
    const raw = JSON.stringify(data);
    const sizeKB = Math.round(raw.length / 1024);
    if (sizeKB > 4500) console.warn(`存档 ${sizeKB}KB 接近 localStorage 上限，建议删档或精简`);
    localStorage.setItem(SLOT_KEY(slot), raw);
    return { ok: true, sizeKB };
  } catch (e) {
    const msg = (e instanceof DOMException && e.name === 'QuotaExceededError')
      ? '存档超出浏览器容量上限（约5MB），无法存档'
      : `存档失败：${(e as Error).message}`;
    console.error(msg, e);
    return { ok: false, error: msg };
  }
}

// B3: 槽位读档
export function loadGameFromSlot(slot: number): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveGame;
    const migrated = migrate(parsed);
    // 成功迁移后回写，让下次读取更快，也让槽位显示最新版本。
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify({ ...migrated, createdAt: migrated.createdAt ?? new Date().toISOString() }));
    return migrated.gameState;
  } catch (e) {
    console.error('存档读取失败', e);
    return null;
  }
}

// B3: 槽位元信息
export function getSlotMeta(slot: number): { createdAt: string; turn: number; version: number; nationName?: string } | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveGame;
    const pid = parsed.gameState?.playerNationId;
    const nationName = pid ? parsed.gameState?.nations?.[pid]?.name : undefined;
    return { createdAt: parsed.createdAt, turn: parsed.gameState?.turn ?? 0, version: parsed.version, nationName };
  } catch {
    return null;
  }
}

// B3: 列出所有槽位元信息（含空槽位）
export function listAllSlots(): ({ slot: number; meta: NonNullable<ReturnType<typeof getSlotMeta>> } | { slot: number; meta: null })[] {
  const out: ({ slot: number; meta: NonNullable<ReturnType<typeof getSlotMeta>> } | { slot: number; meta: null })[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) out.push({ slot: i, meta: getSlotMeta(i) });
  return out;
}

// B3: 删除槽位
export function deleteSlot(slot: number): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SLOT_KEY(slot));
  } catch { /* ignore */ }
}

export function clearAllSaves(): void {
  for (let i = 0; i < SLOT_COUNT; i++) deleteSlot(i);
  // 兼容历史遗留默认键。
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY_BASE);
  } catch { /* ignore */ }
}

// B3: 自动存档（每 10 回合到槽位 0）
export function autoSave(state: GameState): void {
  saveGameToSlot(state, AUTO_SLOT);
}

// ── 旧 API 兼容（默认槽位 0）──
export function saveGame(state: GameState): { ok: boolean; sizeKB?: number; error?: string } {
  return saveGameToSlot(state, AUTO_SLOT);
}
export function loadGame(): GameState | null {
  return loadGameFromSlot(AUTO_SLOT);
}
export function hasSave(): boolean {
  try {
    return typeof localStorage !== 'undefined' && !!localStorage.getItem(SLOT_KEY(AUTO_SLOT));
  } catch {
    return false;
  }
}
export function getSaveMeta(): { createdAt: string; turn: number; version: number } | null {
  return getSlotMeta(AUTO_SLOT);
}
export function deleteSave(): void {
  deleteSlot(AUTO_SLOT);
}

export { SAVE_VERSION };
