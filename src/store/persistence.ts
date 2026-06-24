// Imperium Aeternum — 存档读写 + 版本迁移
// 阶段 5a

import type { SaveGame, GameState } from '../types/game';
import { SAVE_VERSION } from '../types/game';

const STORAGE_KEY = 'imperium-aeternum-save';

// 当前仅 v1，迁移函数预留扩展
const migrations: { from: number; to: number; apply: (s: SaveGame) => SaveGame }[] = [];

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

export function saveGame(state: GameState): { ok: boolean; sizeKB?: number; error?: string } {
  const data: SaveGame = {
    version: SAVE_VERSION,
    createdAt: new Date().toISOString(),
    gameState: state,
  };
  try {
    const raw = JSON.stringify(data);
    // P1 容量预警：localStorage 通常 5MB 上限，>3MB 警告，>4.5MB 危险
    const sizeKB = Math.round(raw.length / 1024);
    if (sizeKB > 4500) {
      console.warn(`存档 ${sizeKB}KB 接近 localStorage 上限，建议删档或精简`);
    }
    localStorage.setItem(STORAGE_KEY, raw);
    return { ok: true, sizeKB };
  } catch (e) {
    // QuotaExceededError：存档超限
    const msg = (e instanceof DOMException && e.name === 'QuotaExceededError')
      ? '存档超出浏览器容量上限（约5MB），无法存档'
      : `存档失败：${(e as Error).message}`;
    console.error(msg, e);
    return { ok: false, error: msg };
  }
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
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

export function hasSave(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

// P2: 读取存档元信息（不迁移、不返回全状态），用于存档页显示时间戳
export function getSaveMeta(): { createdAt: string; turn: number; version: number } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveGame;
    return { createdAt: parsed.createdAt, turn: parsed.gameState?.turn ?? 0, version: parsed.version };
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export { SAVE_VERSION, STORAGE_KEY };
