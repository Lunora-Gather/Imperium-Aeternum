import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listRows: vi.fn(),
  createExecution: vi.fn(),
}));

vi.mock('../client', () => ({
  getAppwriteServices: () => ({
    tablesDB: { listRows: mocks.listRows },
    functions: { createExecution: mocks.createExecution },
  }),
}));

import { createInitialState } from '../../../engine/init';
import { saveGameToSlot } from '../../../store/persistence';
import { uploadLocalSave } from '../cloudSaveService';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

describe('private cloud save access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
  });

  it('delegates upload conflict checks to the trusted gateway without direct table access', async () => {
    expect(saveGameToSlot(createInitialState(), 1).ok).toBe(true);
    mocks.createExecution.mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({
        ok: true,
        row: {
          $id: 'save-row',
          userId: 'user-a',
          slot: 1,
          fileId: 'file-a',
          saveVersion: 6,
          turn: 0,
          nationName: '罗马',
          deviceId: 'device-a',
          contentHash: '0'.repeat(64),
          clientUpdatedAt: '2026-07-25T00:00:00.000Z',
        },
      }),
    });

    await expect(uploadLocalSave('user-a', 1)).resolves.toMatchObject({ slot: 1 });
    expect(mocks.listRows).not.toHaveBeenCalled();
    expect(mocks.createExecution).toHaveBeenCalledOnce();
  });
});
