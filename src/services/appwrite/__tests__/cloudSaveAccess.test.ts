import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listRows: vi.fn(),
  createExecution: vi.fn(),
  prepareRequest: vi.fn(),
}));

vi.mock('../client', () => ({
  storageFileUrl: () => new URL('https://test.invalid/payload'),
  getAppwriteServices: () => ({
    client: { prepareRequest: mocks.prepareRequest },
    tablesDB: { listRows: mocks.listRows },
    functions: { createExecution: mocks.createExecution },
  }),
}));

import { createInitialState } from '../../../engine/init';
import { saveGameToSlot, storedSlotRaw } from '../../../store/persistence';
import { MAX_SAVE_BYTES } from '../../../store/localSaveCodec';
import { downloadCloudSave, uploadLocalSave, shortHash, CloudSaveConflictError } from '../cloudSaveService';

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

  afterEach(() => { vi.unstubAllGlobals(); });

  it('sends only the version associated with a queued upload', async () => {
    const state = createInitialState();
    const original = saveGameToSlot(state, 1);
    if (!original.ok) throw new Error(original.error);
    saveGameToSlot({ ...state, turn: 17 }, 1);
    await expect(uploadLocalSave('a', 1, undefined, () => true, shortHash(original.raw))).rejects.toThrow('本地存档已变化');
    expect(mocks.createExecution).not.toHaveBeenCalled();
  });

  function remoteFile() {
    saveGameToSlot(createInitialState(), 4);
    const raw = storedSlotRaw(4)!;
    const cloud = { userId: 'a', slot: 1, contentHash: createHash('sha256').update(raw).digest('hex'), fileId: 'v1', deviceId: 'other' };
    mocks.listRows.mockResolvedValue({ rows: [cloud] });
    mocks.prepareRequest.mockReturnValue({ uri: 'https://test.invalid/payload', options: { credentials: 'include', headers: { 'X-Fallback-Cookies': 'test-only' } } });
    return { raw, cloud };
  }

  it('keeps a new local save written during a cloud download and verifies the SDK request options', async () => {
    const { raw } = remoteFile();
    const fetcher = vi.fn(async () => {
      const local = createInitialState(); local.turn = 9; saveGameToSlot(local, 1);
      return new Response(raw);
    });
    vi.stubGlobal('fetch', fetcher);
    await expect(downloadCloudSave('a', 1)).rejects.toBeInstanceOf(CloudSaveConflictError);
    expect(JSON.parse(storedSlotRaw(1)!).gameState.turn).toBe(9);
    expect(fetcher).toHaveBeenCalledWith('https://test.invalid/payload', expect.objectContaining({ headers: { 'X-Fallback-Cookies': 'test-only' } }));
  });

  it('does not import a delayed download after changing account', async () => {
    const { raw } = remoteFile();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(raw)));
    await expect(downloadCloudSave('a', 1, undefined, () => false)).rejects.toThrow('账号已更换');
    expect(storedSlotRaw(1)).toBeNull();
  });

  it('stops reading an oversized file and retains the local checkpoint', async () => {
    const { cloud } = remoteFile();
    saveGameToSlot(createInitialState(), 1);
    const previous = storedSlotRaw(1)!;
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_SAVE_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body)));
    await expect(downloadCloudSave('a', 1, { local: shortHash(previous), cloud: cloud.contentHash })).rejects.toThrow('5MB');
    expect(cancel).toHaveBeenCalledOnce();
    expect(storedSlotRaw(1)).toBe(previous);
  });

  it('does not restore another slot from the same account', async () => {
    const { cloud } = remoteFile();
    mocks.listRows.mockResolvedValue({ rows: [{ ...cloud, slot: 3 }] });
    vi.stubGlobal('fetch', vi.fn());
    await expect(downloadCloudSave('a', 1)).rejects.toThrow('该云端槽位为空');
    expect(fetch).not.toHaveBeenCalled();
    expect(storedSlotRaw(1)).toBeNull();
  });

  it('remembers the imported version if another tab saves before the sync receipt is recorded', async () => {
    const { raw } = remoteFile();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(raw)));
    const write = localStorage.setItem.bind(localStorage);
    const key = 'imperium-aeternum-save-1';
    const later = JSON.parse(raw);
    later.gameState.turn = 12;
    const updated = JSON.stringify(later);
    let replaced = false;
    vi.spyOn(localStorage, 'setItem').mockImplementation((name, value) => {
      write(name, value);
      if (name === key && !replaced) { replaced = true; write(key, updated); }
    });
    await downloadCloudSave('a', 1);
    expect(storedSlotRaw(1)).toBe(updated);
    await expect(downloadCloudSave('a', 1)).rejects.toBeInstanceOf(CloudSaveConflictError);
    expect(storedSlotRaw(1)).toBe(updated);
  });

  it('asks again if a forced restore would import a cloud version newer than the one the player confirmed', async () => {
    const { raw, cloud } = remoteFile();
    const other = { ...cloud, fileId: 'v2', contentHash: 'newer' };
    mocks.listRows.mockResolvedValueOnce({ rows: [cloud] }).mockResolvedValue({ rows: [other] });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(raw)));
    await expect(downloadCloudSave('a', 1, { local: null, cloud: cloud.contentHash })).rejects.toMatchObject({
      versions: { local: null, cloud: 'newer' },
    });
    expect(storedSlotRaw(1)).toBeNull();
  });

  it('renews the row and reads its replacement when the old file disappears', async () => {
    const { raw, cloud } = remoteFile();
    mocks.listRows.mockResolvedValue({ rows: [{ ...cloud, fileId: 'v2' }] }).mockResolvedValueOnce({ rows: [cloud] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(raw)));
    await expect(downloadCloudSave('a', 1)).resolves.toMatchObject({ fileId: 'v2' });
    expect(JSON.parse(storedSlotRaw(1)!).gameState.turn).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
