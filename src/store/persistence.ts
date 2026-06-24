// Imperium Aeternum — 存档读写 + 版本迁移 + 多槽位
// 阶段 5a → B3 多槽位 + B7 迁移

import type { SaveGame, GameState } from '../types/game';
import { SAVE_VERSION } from '../types/game';

// B3: 5 槽位存档（槽位 0 = 自动存档，1-4 = 手动）
const STORAGE_KEY_BASE = 'imperium-aeternum-save';
const SLOT_KEY = (slot: number) => `${STORAGE_KEY_BASE}-${slot}`;
const AUTO_SLOT = 0;
export const SLOT_COUNT = 5;

// B7: 迁移函数——v1→v2→v3 补字段
// v1→v2: 补 embargoedRoutes/tech.culture/chronicle/battleReports/warProgress/factionDelta/exhaustSnapshot
// v2→v3: 补 civilWar/rebellionDecay/rebelOf + TurnReport.worldEvents/provinceChanges
const migrations: { from: number; to: number; apply: (s: SaveGame) => SaveGame }[] = [
  {
    from: 1, to: 2,
    apply: (s) => {
      const gs = s.gameState;
      // Nation 字段补全
      for (const n of Object.values(gs.nations)) {
        if (!n.embargoedRoutes) n.embargoedRoutes = [];
        if (n.tech && n.tech.culture === undefined) n.tech.culture = 0;
      }
      // GameState 字段补全
      if (!gs.chronicle) gs.chronicle = [];
      // TurnReport 字段补全（history 里旧报告）
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
      // A1/A2 字段补全
      for (const n of Object.values(gs.nations)) {
        if (n.civilWar === undefined) n.civilWar = undefined;  // 可选字段，无需补
      }
      // TurnReport A4/B2 字段补全
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
];

export function migrate(save: SaveGame): SaveGame {
  let cur = save;
  while (cur.version < SAVE_VERSION) {
    const m = migrations.find((x) => x.from === cur.version);
    if (!m) {
      throw new Error(`无法从版本 ${cur.version} 迁移到 ${SAVE_VERSION}：缺迁移函数`);
    }
    cur = m.apply(cur);
  }
  return cur;
}

// B3: 槽位存档
export function saveGameToSlot(state: GameState, slot: number): { ok: boolean; sizeKB?: number; error?: string } {
  const data: SaveGame = {
    version: SAVE_VERSION,
    createdAt: new Date().toISOString(),
    gameState: state,
  };
  try {
    const raw = JSON.stringify(data);
    const sizeKB = Math.round(raw.length / 1024);
    if (sizeKB > 4500) {
      console.warn(`存档 ${sizeKB}KB 接近 localStorage 上限，建议删档或精简`);
    }
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
  const raw = localStorage.getItem(SLOT_KEY(slot));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveGame;
    const migrated = migrate(parsed);
    return migrated.gameState;
  } catch (e) {
    console.error('存档读取失败', e);
    return null;
  }
}

// B3: 槽位元信息
export function getSlotMeta(slot: number): { createdAt: string; turn: number; version: number; nationName?: string } | null {
  const raw = localStorage.getItem(SLOT_KEY(slot));
  if (!raw) return null;
  try {
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
  for (let i = 0; i < SLOT_COUNT; i++) {
    const meta = getSlotMeta(i);
    out.push({ slot: i, meta });
  }
  return out;
}

// B3: 删除槽位
export function deleteSlot(slot: number): void {
  localStorage.removeItem(SLOT_KEY(slot));
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
  return !!localStorage.getItem(SLOT_KEY(AUTO_SLOT));
}
export function getSaveMeta(): { createdAt: string; turn: number; version: number } | null {
  return getSlotMeta(AUTO_SLOT);
}
export function deleteSave(): void {
  deleteSlot(AUTO_SLOT);
}

export { SAVE_VERSION };
