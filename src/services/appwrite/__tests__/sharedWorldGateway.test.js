import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { createInitialState } from '../../../engine/init';
import { besiegeLastProvince, sharedWorldFixture, worldId } from '../../../../scripts/lib/shared-world-fixture.mjs';
import gateway from '../../../../functions/shared-world-gateway/src/main.js';

const { services } = vi.hoisted(() => ({ services: vi.fn() }));
vi.mock('../../../../functions/shared-world-gateway/src/sdk.js', async () => {
  const { ID, Permission, Query, Role } = await import('appwrite');
  return { ID, Permission, Query, Role, InputFile: { fromBuffer: (data) => data }, services };
});

const error = (code) => Object.assign(new Error(String(code)), { code });
const snapshotOf = (result) => JSON.parse(gunzipSync(Buffer.from(result.statePayload, 'base64')));

describe('shared world gateway with two rulers and transactional storage', () => {
  let f;
  beforeEach(async () => {
    f = sharedWorldFixture(gateway, createInitialState());
    services.mockReturnValue({ db: f.db, storage: f.storage });
    expect((await f.request('a', 'claim_nation', 'n01')).ok).toBe(true);
    expect((await f.request('b', 'claim_nation', 'n02')).ok).toBe(true);
  });

  it('keeps a conquered ruler’s records while freeing their active seat', async () => {
    const state = createInitialState();
    besiegeLastProvince(state);
    f.files.set('before-battle', Buffer.from(JSON.stringify(state)));
    f.write(worldId, { ...f.world(), snapshotFileId: 'before-battle', revision: f.world().revision + 1 });
    f.write('n03', { ...f.rows.get('n02'), nationId: 'n03', controllerUserId: null, status: 'available' });
    await f.ready('a', 'n01');
    const settled = snapshotOf((await f.ready('b', 'n02')).resolved);
    expect(settled.nations.n02.defeated).toBe(true);
    expect(settled.lastReport).toMatchObject({ nationId: 'n02', turn: 1 });
    const roster = (await f.request('b', 'list_controls')).controls;
    expect(roster.find(row => row.nationId === 'n02')).toMatchObject({ unavailable: 'defeated', controllerUserId: 'b' });
    const survivor = snapshotOf(await f.request('a', 'enter_world', 'n01'));
    for (const [i, event] of survivor.pendingEvents.entries()) {
      const answer = await f.request('a', 'submit_command', 'n01', { baseRevision: f.world().revision,
        commandType: 'domestic_action', idempotencyKey: 'survivor-event-' + i, payload: { action: 'resolve_event', args: [event.eventId, 0] } });
      expect(answer.ok, answer.message).toBe(true);
    }
    const advanced = await f.ready('a', 'n01');
    expect(advanced.ok, advanced.message).toBe(true);
    expect(advanced.resolved.world.turn).toBe(2);
    const archive = await f.request('b', 'enter_world', 'n02');
    expect(snapshotOf(archive).lastReport).toEqual(settled.lastReport);
    expect((await f.request('b', 'claim_nation', 'n03')).ok).toBe(true);
    expect((await f.request('b', 'release_nation', 'n02')).ok).toBe(true);
    expect((await f.request('c', 'claim_nation', 'n02')).ok).toBe(false);
  });

  it('allows a stale roster entry to be released without entering a missing country', async () => {
    f.write('missing', { ...f.rows.get('n02'), nationId: 'missing' });
    const roster = (await f.request('b', 'list_controls')).controls;
    expect(roster.find(row => row.nationId === 'missing').unavailable).toBe('missing');
    expect(await f.request('b', 'enter_world', 'missing')).toMatchObject({ ok: false, message: '该国家已不在当前版图中，请返回大厅另选国家' });
    expect((await f.request('b', 'release_nation', 'missing')).ok).toBe(true);
    expect((await f.request('c', 'claim_nation', 'missing')).ok).toBe(false);
  });

  it('refuses a claim if the snapshot changes while the ownership transaction is open', async () => {
    await f.request('b', 'release_nation', 'n02');
    const create = f.db.createTransaction.bind(f.db);
    const state = JSON.parse(f.files.get(f.initialFileId));
    state.nations.n02.defeated = true;
    vi.spyOn(f.db, 'createTransaction').mockImplementationOnce(async () => {
      const transaction = await create();
      const fileId = crypto.randomUUID();
      f.files.set(fileId, Buffer.from(JSON.stringify(state)));
      f.write(worldId, { ...f.world(), snapshotFileId: fileId, revision: f.world().revision + 1 });
      return transaction;
    });
    expect((await f.request('c', 'claim_nation', 'n02')).ok).toBe(false);
    const retry = await f.request('c', 'claim_nation', 'n02');
    expect(retry).toMatchObject({ ok: false, message: '国家不存在或已经覆亡' });
    expect(f.rows.get('n02').controllerUserId).toBeNull();
  });

  it('allows seeded nations to be claimed before the first snapshot is published', async () => {
    await f.request('b', 'release_nation', 'n02');
    f.write(worldId, { ...f.world(), status: 'forming', snapshotFileId: null });
    expect((await f.request('b', 'claim_nation', 'n02')).ok).toBe(true);
    expect((await f.request('b', 'list_controls')).controls.every(row => !row.unavailable)).toBe(true);
  });

  it('commits an order once, unifies both votes, and lets the waiting ruler sync the saved turn', async () => {
    const entered = await f.request('a', 'enter_world', 'n01');
    const baseRevision = entered.world.revision;
    const order = { baseRevision, commandType: 'military_action', idempotencyKey: 'recruit-a-0001',
      payload: { action: 'recruit', args: [snapshotOf(entered).nations.n01.capital, 10] } };
    const a = await f.request('a', 'submit_command', 'n01', order);
    expect(a.ok, a.message).toBe(true);
    const duplicate = await f.request('a', 'submit_command', 'n01', order);
    expect(duplicate.ok, duplicate.message).toBe(true);
    expect(duplicate.world.revision).toBe(baseRevision + 1);
    expect(snapshotOf(duplicate)).toEqual(snapshotOf(a));
    expect((await f.request('b', 'submit_command', 'n02', { ...order, idempotencyKey: 'recruit-b-0001' })).ok).toBe(false);
    expect(await f.ready('a', 'n01')).toMatchObject({ readyCount: 1, requiredCount: 2 });
    const b = await f.ready('b', 'n02');
    expect(b.ok, b.message).toBe(true);
    expect(b.resolved.world.turn).toBe(1);
    const reload = await f.request('a', 'sync_world', 'n01', { baseRevision: a.world.revision });
    expect(snapshotOf(reload).lastReport).toMatchObject({ nationId: 'n01', turn: 1 });
    expect(snapshotOf(b.resolved).lastReport).toMatchObject({ nationId: 'n02', turn: 1 });
    expect(snapshotOf(reload).provinces).toEqual(snapshotOf(b.resolved).provinces);
    expect(reload.world.revision).toBe(baseRevision + 2);
    expect((await f.request('a', 'sync_world', 'n01', { baseRevision: reload.world.revision })).statePayload).toBeUndefined();
    const saved = JSON.parse(f.files.get(reload.world.snapshotFileId));
    expect(saved.sharedHistories.n01.at(-1)).toEqual(snapshotOf(reload).lastReport);
    expect(saved.sharedHistories.n02.at(-1)).toEqual(snapshotOf(b.resolved).lastReport);
  });

  it('requires a new controller to confirm a former controller’s ready vote', async () => {
    expect((await f.ready('a', 'n01')).readyCount).toBe(1);
    await f.request('a', 'release_nation', 'n01');
    await f.request('c', 'claim_nation', 'n01');
    expect(await f.ready('b', 'n02')).toMatchObject({ readyCount: 1, requiredCount: 2 });
    expect((await f.ready('c', 'n01')).resolved.world.turn).toBe(1);
  });

  it('returns this ruler’s confirmed vote on re-entry and lightweight polls at the same revision', async () => {
    const revision = f.world().revision;
    expect((await f.ready('a', 'n01')).readyCount).toBe(1);
    for (const [user, id, ready] of [['a', 'n01', true], ['b', 'n02', false]]) {
      expect(await f.request(user, 'enter_world', id)).toMatchObject({ ok: true, ready, world: { turn: 0, revision } });
      const poll = await f.request(user, 'sync_world', id, { baseRevision: revision });
      expect(poll).toMatchObject({ ready, world: { turn: 0, revision } });
      expect(poll.statePayload).toBeUndefined();
    }
    await f.request('a', 'release_nation', 'n01');
    await f.request('a', 'claim_nation', 'n01');
    expect((await f.request('a', 'enter_world', 'n01')).ready).toBe(false);
    expect(f.world().turn).toBe(0);
  });

  it('settles exactly once on concurrent reconnect after the only unready ruler releases control', async () => {
    const revision = f.world().revision;
    await f.ready('a', 'n01');
    await f.request('b', 'release_nation', 'n02');
    const requests = await Promise.all([f.request('a', 'sync_world', 'n01', { baseRevision: revision }), f.request('a', 'enter_world', 'n01')]);
    for (const response of requests) {
      expect(response.ok, response.message).toBe(true);
      expect(response).toMatchObject({ ready: false, world: { turn: 1, revision: revision + 2 } });
      expect(snapshotOf(response).lastReport).toMatchObject({ turn: 1, nationId: 'n01' });
    }
    expect(f.files.size).toBe(1);
    expect([...f.rows.values()].filter(r => r.commandType === 'set_ready' && r.turn === 1)).toHaveLength(0);
  });

  it('settles on an unchanged-revision poll when the remaining unready lease has expired', async () => {
    const revision = f.world().revision;
    expect(await f.ready('a', 'n01')).toMatchObject({ readyCount: 1, requiredCount: 2 });
    f.write('n02', { ...f.rows.get('n02'), leaseExpiresAt: new Date(Date.now() - 1).toISOString() });
    const poll = () => f.request('a', 'sync_world', 'n01', { baseRevision: revision });
    const replies = await Promise.all([poll(), poll()]);
    expect(replies.every(reply => reply.ok)).toBe(true);
    expect(f.world()).toMatchObject({ turn: 1, revision: revision + 1 });
    expect(f.rows.get('n02').controllerUserId).toBeNull();
    const latest = await poll();
    expect(latest).toMatchObject({ ready: false, world: { turn: 1 } });
    expect(snapshotOf(latest).lastReport).toMatchObject({ turn: 1, nationId: 'n01' });
    expect(f.files.size).toBe(1);
  });

  it('resumes a recorded unanimous vote after settlement was interrupted before publishing', async () => {
    const revision = f.world().revision;
    await f.ready('a', 'n01');
    vi.spyOn(f.storage, 'createFile').mockRejectedValueOnce(error(503));
    expect((await f.ready('b', 'n02')).ok).toBe(false);
    expect(f.world().turn).toBe(0);
    expect([...f.rows.values()].filter(row => row.commandType === 'set_ready' && row.status === 'pending')).toHaveLength(2);
    const result = await f.request('a', 'sync_world', 'n01', { baseRevision: revision });
    expect(result).toMatchObject({ ok: true, ready: false, world: { turn: 1, revision: revision + 1 } });
    expect(snapshotOf(result).lastReport.nationId).toBe('n01');
    expect([...f.rows.values()].filter(row => row.commandType === 'set_ready' && row.turn === 1)).toHaveLength(0);
  });

  it('keeps an ordinary waiting poll free of snapshot downloads and writes', async () => {
    await f.ready('a', 'n01');
    const downloads = vi.spyOn(f.storage, 'getFileDownload');
    const updates = vi.spyOn(f.db, 'updateRow');
    for (let i = 0; i < 2; i++) {
      const result = await f.request('a', 'sync_world', 'n01', { baseRevision: f.world().revision });
      expect(result).toMatchObject({ ready: true, world: { turn: 0 } });
      expect(result.statePayload).toBeUndefined();
    }
    expect(downloads).not.toHaveBeenCalled();
    expect(updates).not.toHaveBeenCalled();
  });

  it('returns the settled year if a waiting ruler reads their old vote as the other ruler finishes', async () => {
    await f.ready('a', 'n01');
    const read = f.db.getRow.bind(f.db);
    let overlap = true;
    vi.spyOn(f.db, 'getRow').mockImplementation(async params => {
      const row = await read(params);
      if (overlap && params.tableId === 'world_commands' && !params.transactionId && row.userId === 'a') {
        overlap = false;
        expect((await f.ready('b', 'n02')).resolved.world.turn).toBe(1);
      }
      return row;
    });
    const result = await f.request('a', 'enter_world', 'n01');
    expect(result).toMatchObject({ ready: false, world: { turn: 1 } });
    expect(snapshotOf(result).turn).toBe(1);
  });

  it('catches up a same-revision poll that finds the previous year’s vote already archived', async () => {
    const revision = f.world().revision;
    await f.ready('a', 'n01');
    const read = f.db.getRow.bind(f.db);
    let overlap = true;
    vi.spyOn(f.db, 'getRow').mockImplementation(async params => {
      if (overlap && params.tableId === 'world_commands' && !params.transactionId) {
        overlap = false;
        expect((await f.ready('b', 'n02')).resolved.world.turn).toBe(1);
      }
      return read(params);
    });
    const result = await f.request('a', 'sync_world', 'n01', { baseRevision: revision });
    expect(result).toMatchObject({ ready: false, world: { turn: 1 } });
    expect(snapshotOf(result).lastReport).toMatchObject({ nationId: 'n01', turn: 1 });
  });

  it('acknowledges both tabs of the same ruler when they submit identical votes together', async () => {
    const seen = { turn: 0, baseRevision: f.world().revision };
    const twice = (user, id) => Promise.all([1, 2].map(() => f.request(user, 'set_ready', id, seen)));
    for (const vote of await twice('a', 'n01')) expect(vote).toMatchObject({ ready: true, readyCount: 1, requiredCount: 2 });
    for (const vote of await twice('b', 'n02')) expect(vote.resolved?.world).toMatchObject({ turn: 1, revision: seen.baseRevision + 1 });
    expect([...f.rows.values()].filter(r => r.commandType === 'set_ready')).toHaveLength(2);
  });

  it('recovers a vote when a scheduled settlement replaces its snapshot during confirmation', async () => {
    const revision = f.world().revision;
    const read = f.storage.getFileDownload.bind(f.storage);
    let overlap = true;
    vi.spyOn(f.storage, 'getFileDownload').mockImplementation(async params => {
      if (overlap && params.fileId === f.initialFileId) {
        overlap = false;
        f.write(worldId, { ...f.world(), planningDeadlineAt: new Date(Date.now() - 1).toISOString() });
        expect((await f.schedule()).results[0].resolved).toBe(true);
      }
      return read(params);
    });
    const response = await f.request('a', 'set_ready', 'n01', { baseRevision: revision, turn: 0 });
    expect(response.resolved?.world).toMatchObject({ turn: 1, revision: revision + 1 });
    expect([...f.rows.values()].some(r => r.commandType === 'set_ready' && r.turn === 1)).toBe(false);
  });

  it('applies simultaneous confirmations to at most one year', async () => {
    await f.ready('a', 'n01');
    const replies = await Promise.all([f.ready('a', 'n01'), f.ready('b', 'n02')]);
    expect(replies.some((r) => r.resolved?.world.turn === 1)).toBe(true);
    expect(f.world().turn).toBe(1);
  });

  it('replays a lost ready reply before and after settlement without voting for a later year', async () => {
    const confirm = { turn: 0, baseRevision: f.world().revision };
    const vote = () => f.request('a', 'set_ready', 'n01', confirm);
    expect(await vote()).toMatchObject({ readyCount: 1, requiredCount: 2 });
    const command = await f.request('b', 'submit_command', 'n02', {
      baseRevision: confirm.baseRevision, commandType: 'domestic_action', idempotencyKey: 'focus-reconnect-b',
      payload: { action: 'set_strategy_focus', args: ['reform'] },
    });
    expect(command.ok, command.message).toBe(true);
    expect(await vote()).toMatchObject({ readyCount: 1, requiredCount: 2 });
    expect((await f.ready('b', 'n02')).resolved.world.turn).toBe(1);
    const revision = f.world().revision;
    const recovered = await vote();
    expect(recovered.resolved?.world).toMatchObject({ turn: 1, revision });
    expect(snapshotOf(recovered.resolved)).toMatchObject({ turn: 1, playerNationId: 'n01' });
    expect([...f.rows.values()].filter((r) => r.commandType === 'set_ready' && r.turn === 1)).toHaveLength(0);
    expect((await f.request('a', 'set_ready', 'n01', { baseRevision: revision, turn: 2 })).ok).toBe(false);
  });

  it('settles both accepted votes using an order that commits while the turn is being published', async () => {
    expect((await f.ready('a', 'n01')).readyCount).toBe(1);
    const save = f.storage.createFile.bind(f.storage);
    vi.spyOn(f.storage, 'createFile').mockImplementationOnce(async (file) => {
      await save(file);
      const order = await f.request('a', 'submit_command', 'n01', {
        baseRevision: f.world().revision, commandType: 'domestic_action', idempotencyKey: 'last-focus-0001',
        payload: { action: 'set_strategy_focus', args: ['reform'] },
      });
      expect(order.ok, order.message).toBe(true);
    });
    const last = await f.ready('b', 'n02');
    expect(last.ok, last.message).toBe(true);
    expect(last.resolved.world.turn).toBe(1);
    expect(JSON.parse(f.files.get(f.world().snapshotFileId)).sharedFocuses.n01).toBe('reform');
    expect(f.files.size).toBe(1);
  });

  it('recounts votes when a country changes hands during publication', async () => {
    expect((await f.ready('a', 'n01')).readyCount).toBe(1);
    const save = f.storage.createFile.bind(f.storage);
    vi.spyOn(f.storage, 'createFile').mockImplementationOnce(async (file) => {
      await save(file);
      expect((await f.request('a', 'release_nation', 'n01')).ok).toBe(true);
      expect((await f.request('c', 'claim_nation', 'n01')).ok).toBe(true);
    });
    expect(await f.ready('b', 'n02')).toMatchObject({ ok: true, readyCount: 1, requiredCount: 2 });
    expect(f.world().turn).toBe(0);
    expect(f.files.size).toBe(1);
    expect((await f.ready('c', 'n01')).resolved.world.turn).toBe(1);
  });

  it('lists the roster without registering a spectator or updating any rows', async () => {
    const before = new Map(f.rows);
    const result = await f.request('spectator', 'list_controls');
    expect(result.controls.map(c => c.nationId).sort()).toEqual(['n01', 'n02']);
    expect(f.rows).toEqual(before);
  });

  it('waits for a living controller when only spectators visit an idle world', async () => {
    const stale = new Date(Date.now() - 7200000).toISOString();
    for (const nation of ['n01', 'n02']) f.write(nation, { ...f.rows.get(nation), lastActiveAt: stale, claimedAt: stale });
    for (const row of f.rows.values()) if (row.table === 'world_memberships') f.write(row.$id, { ...row, lastSeenAt: stale });
    f.write(worldId, { ...f.world(), planningDeadlineAt: new Date(Date.now() - 1000).toISOString() });
    await f.request('spectator', 'join_world');
    expect((await f.schedule()).results).toEqual([{ worldId, resolved: false }]);
    expect(f.world().turn).toBe(0);
    expect((await f.request('a', 'sync_world', 'n01', { baseRevision: f.world().revision })).ok).toBe(true);
    expect((await f.schedule()).results).toEqual([{ worldId, resolved: true }]);
    expect(f.world().turn).toBe(1);
  });

  it('checks unchanged revisions without refreshing a recent lease on every poll', async () => {
    const poll = () => f.request('a', 'sync_world', 'n01', { baseRevision: f.world().revision });
    const writes = vi.spyOn(f.db, 'updateRow');
    expect((await poll()).ok).toBe(true);
    expect((await poll()).ok).toBe(true);
    expect(writes).not.toHaveBeenCalled();
    const beforeWindow = new Date(Date.now() - 7200000).toISOString();
    f.write('n01', { ...f.rows.get('n01'), lastActiveAt: beforeWindow });
    expect((await poll()).ok).toBe(true);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(f.rows.get('n01').lastActiveAt).not.toBe(beforeWindow);
    expect((await f.request('a', 'release_nation', 'n01')).ok).toBe(true);
    expect((await poll()).ok).toBe(false);
  });

  it('requires a fresh vote after the same ruler releases and reclaims within one clock tick', async () => {
    vi.useFakeTimers();
    try {
      expect((await f.ready('a', 'n01')).readyCount).toBe(1);
      expect((await f.request('a', 'release_nation', 'n01')).ok).toBe(true);
      expect((await f.request('a', 'claim_nation', 'n01')).ok).toBe(true);
      expect(await f.ready('b', 'n02')).toMatchObject({ readyCount: 1, requiredCount: 2 });
      expect((await f.ready('a', 'n01')).resolved.world.turn).toBe(1);
    } finally { vi.useRealTimers(); }
  });

  it('rechecks the current deadline after the scheduler has listed a due world', async () => {
    const list = f.db.listRows.bind(f.db);
    vi.spyOn(f.db, 'listRows').mockImplementation(async (query) => {
      const result = await list(query);
      if (query.tableId === 'shared_worlds') result.rows = result.rows.map((row) => ({ ...row, planningDeadlineAt: new Date(0).toISOString() }));
      return result;
    });
    expect((await f.schedule()).results).toEqual([{ worldId, resolved: false }]);
    expect(f.world().turn).toBe(0);
  });

  it('advances a due world after a thousand active worlds whose deadlines are still ahead', async () => {
    for (let i = 0; i < 1000; i++) f.write('early-' + i, f.world());
    f.write(worldId, { ...f.world(), planningDeadlineAt: new Date(Date.now() - 1).toISOString() });
    expect((await f.schedule()).results).toEqual([{ worldId, resolved: true }]);
    expect(f.world().turn).toBe(1);
    expect(f.rows.get('early-999').turn).toBe(0);
  });

  it('keeps the snapshot in use after a successful commit whose reply is lost', async () => {
    const commit = f.db.updateTransaction.bind(f.db);
    vi.spyOn(f.db, 'updateTransaction').mockImplementation(async (req) => {
      await commit(req);
      if (req.commit && f.world().snapshotFileId !== f.initialFileId) throw error(503);
    });
    const result = await f.request('b', 'submit_command', 'n02', { baseRevision: f.world().revision,
      commandType: 'domestic_action', idempotencyKey: 'focus-b-0001', payload: { action: 'set_strategy_focus', args: ['reform'] } });
    expect(result.ok, result.message).toBe(true);
    expect(snapshotOf(result).strategyFocus).toBe('reform');
    expect(f.files.has(f.initialFileId)).toBe(false);
    expect(f.files.has(f.world().snapshotFileId)).toBe(true);
  });

  it('keeps both players’ orders after a concurrent revision conflict and explicit retry', async () => {
    const revision = f.world().revision;
    const players = [['a', 'n01', 'military'], ['b', 'n02', 'reform']];
    const send = ([user, id, focus], baseRevision) => f.request(user, 'submit_command', id, {
      commandType: 'domestic_action', baseRevision, idempotencyKey: `focus-${id}-${baseRevision}`,
      payload: { action: 'set_strategy_focus', args: [focus] },
    });
    const replies = await Promise.all(players.map((player) => send(player, revision)));
    expect(replies.filter((reply) => reply.ok)).toHaveLength(1);
    const retry = await send(players[replies.findIndex((reply) => !reply.ok)], f.world().revision);
    expect(retry.ok, retry.message).toBe(true);
    expect(f.world().revision).toBe(revision + 2);
    expect(JSON.parse(f.files.get(f.world().snapshotFileId)).sharedFocuses).toMatchObject({ n01: 'military', n02: 'reform' });
    expect(f.files.size).toBe(1);
  });

  it('holds a manual turn for a pending player choice and still permits the scheduled deadline', async () => {
    const state = JSON.parse(f.files.get(f.initialFileId));
    state.pendingEvents = [{ nationId: 'n02', eventId: 'evt_famine' }];
    f.files.set(f.initialFileId, Buffer.from(JSON.stringify(state)));
    expect((await f.ready('a', 'n01')).readyCount).toBe(1);
    expect((await f.ready('b', 'n02')).message).toContain('待决事件');
    expect(f.world().turn).toBe(0);
    f.write(worldId, { ...f.world(), planningDeadlineAt: new Date(Date.now() - 1).toISOString() });
    expect((await f.schedule()).results[0].resolved).toBe(true);
    expect(f.world().turn).toBe(1);
  });

  it('recovers old queues, applies each choice once and preserves the other ruler’s pending choice', async () => {
    const state = JSON.parse(f.files.get(f.initialFileId));
    const famine = (nationId) => ({ nationId, eventId: 'evt_famine' });
    state.pendingEvents = [famine('missing'), famine('n03'), { nationId: 'n01', eventId: 'retired' }, famine('n02'), famine('n02'), famine('n01')];
    state.nations.n03.defeated = true;
    state.pendingEventOptions = { ...famine('n02'), options: [] };
    f.files.set(f.initialFileId, Buffer.from(JSON.stringify(state)));
    for (const [user, id] of [['b', 'n02'], ['a', 'n01']]) {
      const view = snapshotOf(await f.request(user, 'enter_world', id));
      expect(view.pendingEvents).toEqual([famine(id)]);
      expect(view.pendingEventOptions).toEqual(user === 'b' ? state.pendingEventOptions : null);
      expect((await f.ready(user, id)).message).toContain('待决事件');
      const order = { baseRevision: f.world().revision, commandType: 'domestic_action', idempotencyKey: 'relief-order-' + user,
        payload: { action: 'resolve_event', args: ['evt_famine', 0] } };
      const response = await f.request(user, 'submit_command', id, order);
      expect(response.ok, response.message).toBe(true);
      expect(snapshotOf(await f.request(user, 'submit_command', id, order))).toEqual(snapshotOf(response));
      const restored = snapshotOf(await f.request(user, 'enter_world', id));
      expect(restored.pendingEvents).toEqual([]);
      expect(restored.pendingEventOptions).toBeNull();
      expect(restored.triggeredEvents.filter(e => e.eventId === 'evt_famine' && e.nationId === id)).toHaveLength(1);
      const vote = await f.ready(user, id);
      if (user === 'b') expect(vote.readyCount).toBe(1);
      else expect(vote.resolved.world.turn).toBe(1);
    }
    for (const [user, id] of [['a', 'n01'], ['b', 'n02']]) {
      const restored = snapshotOf(await f.request(user, 'enter_world', id));
      expect(restored.chronicle.filter(e => e.kind === 'founding').map(e => e.title)).toEqual([state.nations[id].name + ' 立国']);
      expect(restored.pendingEvents.every(e => e.nationId === id)).toBe(true);
      expect(restored.sharedChronicles).toBeUndefined();
      expect(restored.lastReport).toMatchObject({ nationId: id, turn: 1 });
    }
  });

  it('refetches the matching world row when a replaced snapshot disappears mid-download', async () => {
    const read = f.storage.getFileDownload.bind(f.storage);
    f.storage.getFileDownload = async (req) => {
      if (req.fileId === f.initialFileId) {
        f.files.set('latest', f.files.get(f.initialFileId)); f.files.delete(f.initialFileId);
        f.write(worldId, { ...f.world(), snapshotFileId: 'latest', revision: f.world().revision + 1 });
      }
      return read(req);
    };
    const result = await f.request('a', 'enter_world', 'n01');
    expect(result.ok, result.message).toBe(true);
    expect(result.world.snapshotFileId).toBe('latest');
    expect(snapshotOf(result).turn).toBe(result.world.turn);
  });
});
