import { beforeEach, expect, it, vi } from 'vitest';
import { Channel, Query } from 'appwrite';
import { APPWRITE_CONFIG, tableRowChannel } from '../config';
import { listSharedWorlds, subscribeToWorldLobby } from '../sharedWorldService';

const { listRows, subscribe } = vi.hoisted(() => ({ listRows: vi.fn(), subscribe: vi.fn() }));
vi.mock('../client', () => ({
  getAppwriteServices: () => ({ tablesDB: { listRows }, realtime: { subscribe } }),
}));
beforeEach(() => { vi.resetAllMocks(); });

it('uses the SDK row channel for table-wide and individual row subscriptions', () => {
  for (const id of [undefined, 'world-1']) {
    const channel = Channel.tablesdb(APPWRITE_CONFIG.databaseId).table('worlds').row(id);
    expect(tableRowChannel('worlds', id)).toBe(channel.toString());
  }
});

it('includes worlds after the first page and preserves the directory order', async () => {
  const rows = Array.from({ length: 121 }, (_, i) => ({ $id: String(i), name: String(i).padStart(3, '0') }));
  listRows.mockImplementation(async ({ queries }: { queries: string[] }) => {
    const filters = queries.map(q => JSON.parse(q));
    const cursor = filters.find(q => q.method === 'cursorAfter')?.values[0];
    const start = cursor === undefined ? 0 : Number(cursor) + 1;
    const count = filters.find(q => q.method === 'limit').values[0];
    return { rows: rows.slice(start, start + count) };
  });
  expect((await listSharedWorlds()).map(w => w.id)).toEqual(rows.map(row => row.$id));
});

it('subscribes to the selected roster and tells world and ownership changes apart', async () => {
  const stopWorld = vi.fn(), stopControls = vi.fn();
  subscribe.mockResolvedValueOnce({ unsubscribe: stopWorld }).mockResolvedValueOnce({ unsubscribe: stopControls });
  const changed = vi.fn();
  const cleanup = await subscribeToWorldLobby('west', changed);
  expect(subscribe).toHaveBeenCalledTimes(2);
  const [world, controls] = subscribe.mock.calls;
  expect(controls[2]).toEqual([Query.equal('worldId', 'west')]);
  controls[1]({ payload: { worldId: 'east' } });
  expect(changed).not.toHaveBeenCalled();
  controls[1]({ payload: { worldId: 'west' } });
  world[1]({ payload: { $id: 'west' } });
  expect(changed.mock.calls).toEqual([['controls'], ['world']]);
  await cleanup();
  expect(stopWorld).toHaveBeenCalledOnce();
  expect(stopControls).toHaveBeenCalledOnce();
});

it('releases the world subscription when opening the roster subscription fails', async () => {
  const stop = vi.fn();
  subscribe.mockResolvedValueOnce({ unsubscribe: stop }).mockRejectedValueOnce(new Error('offline'));
  await expect(subscribeToWorldLobby('west', vi.fn())).rejects.toThrow('offline');
  expect(stop).toHaveBeenCalledOnce();
});
