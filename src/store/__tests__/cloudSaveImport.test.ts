import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { SAVE_VERSION, type SaveGame } from '../../types/game';
import { importSaveGameToSlot, readSaveGameFromSlot, saveGameToSlot } from '../persistence';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
});

describe('cloud save import boundary', () => {
  it('migrates an older cloud payload before writing the local slot', () => {
    const state = createInitialState();
    const legacy = { version: 5, createdAt: '2026-01-01T00:00:00.000Z', gameState: state } as SaveGame;

    const result = importSaveGameToSlot(2, JSON.stringify(legacy));
    const stored = readSaveGameFromSlot(2);

    expect(result.ok).toBe(true);
    expect(stored.ok).toBe(true);
    if (stored.ok) {
      expect(stored.save.version).toBe(SAVE_VERSION);
      expect(stored.save.gameState.diplomaticSummits).toEqual([]);
      expect(stored.save.gameState.diplomaticAccords).toEqual([]);
    }
  });

  it('does not overwrite a good local slot when the cloud payload is corrupt', () => {
    expect(saveGameToSlot(createInitialState(), 1).ok).toBe(true);
    const before = readSaveGameFromSlot(1);

    expect(importSaveGameToSlot(1, '{broken').ok).toBe(false);
    const after = readSaveGameFromSlot(1);
    expect(after).toEqual(before);
  });

  it('rejects out-of-range slots without writing data', () => {
    const payload = JSON.stringify({ version: SAVE_VERSION, createdAt: 'now', gameState: createInitialState() });

    expect(importSaveGameToSlot(5, payload)).toEqual({ ok: false, error: '无效存档槽位' });
    expect(localStorage.length).toBe(0);
  });
});
