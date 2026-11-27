import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../../engine/init';
import { queueCloudSaveUpload } from '../../gameplay/cloudSyncCoordinator';
import { enterSharedWorld, joinSharedWorld, listNationControls, listSharedWorlds, markSharedWorldReady, submitSharedWorldAction, subscribeToWorldLobby, syncSharedWorld } from '../../services/appwrite/sharedWorldService';
import type { SharedWorldInstance } from '../../shared-world/types';
import { checkpointBeforeUnload, useGameStore } from '../gameStore';
import { enqueueSharedCommand, pendingSharedOrders, useSharedWorldSessionStore, waitForSharedCommands } from '../sharedWorldSessionStore';
import { useAccountStore } from '../accountStore';
import type { AuthUser } from '../../services/appwrite/authService';
import { useSharedWorldStore, watchSharedWorld, watchWorldLobby } from '../sharedWorldStore';

vi.mock('../../services/appwrite/sharedWorldService', () => ({
  enterSharedWorld: vi.fn(), listSharedWorlds: vi.fn(), listNationControls: vi.fn(),
  joinSharedWorld: vi.fn(), subscribeToWorldLobby: vi.fn(),
  markSharedWorldReady: vi.fn(),
  submitSharedWorldAction: vi.fn(),
  syncSharedWorld: vi.fn(),
}));
vi.mock('../../gameplay/cloudSyncCoordinator', () => ({ queueCloudSaveUpload: vi.fn(), onLocalSlotSaved: vi.fn() }));

const world: SharedWorldInstance = {
  id: 'world-1', name: '测试版图', templateId: 'classic', status: 'active', phase: 'planning',
  turn: 0, revision: 1, nationCount: 5, snapshotFileId: null, planningDeadlineAt: '',
  tickPolicy: { planningWindowSeconds: 3600, pauseWhenEmpty: true, caretakerEnabled: true, maxNationsPerUser: 1 },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function enterWorld() {
  const state = createInitialState();
  useSharedWorldSessionStore.getState().start(world, state.playerNationId, state);
  useGameStore.getState().startSharedWorld(state, state.playerNationId, world.name);
}

describe('campaign session changes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    enterWorld();
  });

  afterEach(() => {
    useGameStore.getState().backToMenu();
    vi.unstubAllGlobals();
  });

  it('keeps a fallen ruler’s state read-only without submitting orders or readiness', async () => {
    const game = useGameStore.getState();
    game.state.nations[game.state.playerNationId].defeated = true;
    const before = structuredClone(game.state);
    game.setStrategyFocus('reform');
    expect(game.nextTurn()).toBeNull();
    expect(await waitForSharedCommands()).toBe(true);
    expect(useGameStore.getState().state).toEqual(before);
    expect(submitSharedWorldAction).not.toHaveBeenCalled();
    expect(markSharedWorldReady).not.toHaveBeenCalled();
  });

  it('drops same-year orders queued before the realm falls and keeps archive refreshes available', async () => {
    const session = useSharedWorldSessionStore.getState().session!;
    const blocked = deferred<void>();
    const earlier = enqueueSharedCommand(session, () => blocked.promise, 'refresh');
    const send = vi.fn().mockResolvedValue(undefined);
    const queued = enqueueSharedCommand(session, send);
    const archived = structuredClone(session.state);
    archived.nations[session.nationId].defeated = true;
    useSharedWorldSessionStore.getState().update({ ...world, revision: world.revision + 1 }, archived);
    const rejected = expect(queued).rejects.toThrow('国家已覆亡');
    blocked.resolve();
    await earlier;
    await rejected;
    expect(send).not.toHaveBeenCalled();
    await enqueueSharedCommand(session, send, 'refresh');
    expect(send).toHaveBeenCalledOnce();
  });

  it('ignores idle reads when leaving but waits for a queued action and reports its rejection', async () => {
    const session = useSharedWorldSessionStore.getState().session!;
    const refresh = deferred<void>();
    const order = deferred<Awaited<ReturnType<typeof submitSharedWorldAction>>>();
    vi.mocked(submitSharedWorldAction).mockReturnValue(order.promise);
    vi.mocked(enterSharedWorld).mockResolvedValue({ world, state: session.state, controls: [] });
    const polling = enqueueSharedCommand(session, () => refresh.promise, 'refresh');
    try {
      expect(checkpointBeforeUnload()).toBe(true);
      expect(await waitForSharedCommands()).toBe(true);
      useGameStore.getState().setStrategyFocus('reform');
      expect(pendingSharedOrders()).toBe(1);
      expect(checkpointBeforeUnload()).toBe(false);
      const leaving = waitForSharedCommands();
      refresh.resolve();
      await vi.waitFor(() => expect(submitSharedWorldAction).toHaveBeenCalledOnce());
      order.reject(new Error('order declined'));
      expect(await leaving).toBe(false);
      expect(checkpointBeforeUnload()).toBe(true);
      expect(await waitForSharedCommands()).toBe(true);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    } finally { refresh.resolve(); await polling; }
  });

  it('waits through a late readiness request and detects a failed vote', async () => {
    const session = useSharedWorldSessionStore.getState().session!;
    const first = deferred<void>();
    const vote = deferred<Awaited<ReturnType<typeof markSharedWorldReady>>>();
    vi.mocked(markSharedWorldReady).mockReturnValue(vote.promise);
    const action = enqueueSharedCommand(session, () => first.promise);
    const leaving = waitForSharedCommands();
    useGameStore.getState().nextTurn();
    first.resolve();
    await action;
    await vi.waitFor(() => expect(markSharedWorldReady).toHaveBeenCalledOnce());
    expect(checkpointBeforeUnload()).toBe(false);
    vote.reject(new Error('vote declined'));
    expect(await leaving).toBe(false);
    expect(pendingSharedOrders()).toBe(0);
  });

  it('coalesces repeated readiness input and reports an old-year order skipped during settlement', async () => {
    const vote = deferred<Awaited<ReturnType<typeof markSharedWorldReady>>>();
    vi.mocked(markSharedWorldReady).mockReturnValue(vote.promise);
    const game = useGameStore.getState();
    game.nextTurn();
    game.nextTurn();
    game.setStrategyFocus('military');
    expect(useSharedWorldSessionStore.getState().voting?.turn).toBe(0);
    const leaving = waitForSharedCommands();
    await vi.waitFor(() => expect(markSharedWorldReady).toHaveBeenCalledOnce());
    vote.resolve({ resolved: true, state: { ...createInitialState(), turn: 1 }, world: { ...world, turn: 1, revision: 2 } });
    expect(await leaving).toBe(false);
    expect(useSharedWorldSessionStore.getState().voting).toBeNull();
    expect(useSharedWorldSessionStore.getState().session?.ready).toBe(false);
    expect(submitSharedWorldAction).not.toHaveBeenCalled();
    expect(useGameStore.getState().state.turn).toBe(1);
    expect(useGameStore.getState().log.slice(-1)[0]).toContain('操作未提交');
  });

  it('accepts a readiness-only poll without replacing gameplay or carrying a vote into the next year', () => {
    const store = useSharedWorldSessionStore.getState();
    const state = store.session!.state;
    expect(store.update(world, undefined, true)).toBeNull();
    expect(useSharedWorldSessionStore.getState().session).toMatchObject({ ready: true, turn: 0 });
    expect(useSharedWorldSessionStore.getState().session!.state).toBe(state);
    store.update({ ...world, turn: 1, revision: 2 }, { ...state, turn: 1 });
    store.update(world, undefined, true);
    expect(useSharedWorldSessionStore.getState().session).toMatchObject({ ready: false, turn: 1 });
  });

  it('keeps local slots and the shared session intact on an unavailable save or load', () => {
    const session = useSharedWorldSessionStore.getState().session;
    const store = useGameStore.getState();
    expect(store.saveToSlot(1).ok).toBe(false);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(store.load()).toBe(false);
    expect(store.loadFromSlot(1)).toBe(false);
    expect(useSharedWorldSessionStore.getState().session).toBe(session);
  });

  it('preserves a queued order when the player tries to open a valid local save', async () => {
    const game = useGameStore.getState();
    const session = useSharedWorldSessionStore.getState().session!;
    const local = JSON.stringify({ gameState: createInitialState() });
    vi.stubGlobal('localStorage', { getItem: () => local, setItem: vi.fn() });
    const held = deferred<void>();
    const polling = enqueueSharedCommand(session, () => held.promise, 'refresh');
    const send = vi.fn().mockResolvedValue(undefined);
    const queued = enqueueSharedCommand(session, send);
    try {
      expect(game.loadFromSlot(1, local)).toBe(false);
      expect(useSharedWorldSessionStore.getState().session).toBe(session);
    } finally { held.resolve(); await polling; await queued; }
    expect(send).toHaveBeenCalledOnce();
    expect(game.loadFromSlot(1, local)).toBe(true);
    expect(useSharedWorldSessionStore.getState().session).toBeNull();
  });

  it.each([false, true])('coalesces wake signals during a failed sync, stopped=%s', async (stopped) => {
    const browser = Object.assign(new EventTarget(), { setInterval: vi.fn(), clearInterval: vi.fn() });
    vi.stubGlobal('window', browser);
    vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
    const interrupted = deferred<null>();
    vi.mocked(syncSharedWorld).mockReturnValueOnce(interrupted.promise).mockResolvedValueOnce({
      world: { ...world, turn: 1, revision: 2 }, state: { ...createInitialState(), turn: 1 },
    });
    const stop = watchSharedWorld(useSharedWorldSessionStore.getState().session!);
    try {
      await vi.waitFor(() => expect(syncSharedWorld).toHaveBeenCalledOnce());
      browser.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      browser.dispatchEvent(new Event('pageshow'));
      if (stopped) stop();
      interrupted.reject(new TypeError('Connection lost'));
      await vi.dynamicImportSettled();
      expect(syncSharedWorld).toHaveBeenCalledTimes(stopped ? 1 : 2);
      expect(useGameStore.getState().state.turn).toBe(stopped ? 0 : 1);
    } finally { stop(); }
  });

  it('defers an offline tab’s reconnect until it becomes visible without waiting for the polling interval', async () => {
    const browser = Object.assign(new EventTarget(), { setInterval: vi.fn(), clearInterval: vi.fn() });
    const page = Object.assign(new EventTarget(), { hidden: true });
    vi.stubGlobal('window', browser);
    vi.stubGlobal('document', page);
    vi.mocked(syncSharedWorld).mockResolvedValue({
      world: { ...world, turn: 1, revision: 2 }, state: { ...createInitialState(), turn: 1 },
    });
    const stop = watchSharedWorld(useSharedWorldSessionStore.getState().session!);
    try {
      browser.dispatchEvent(new Event('online'));
      await vi.dynamicImportSettled();
      expect(syncSharedWorld).not.toHaveBeenCalled();
      page.hidden = false;
      page.dispatchEvent(new Event('visibilitychange'));
      await vi.dynamicImportSettled();
      expect(syncSharedWorld).toHaveBeenCalledOnce();
      expect(useGameStore.getState().state.turn).toBe(1);
    } finally { stop(); }
  });

  it('uploads a checkpoint only after its local write succeeds', async () => {
    const store = useGameStore.getState();
    store.newGame();
    vi.mocked(localStorage.setItem).mockImplementationOnce(() => { throw new DOMException('full', 'QuotaExceededError'); });
    useGameStore.setState({ state: { ...useGameStore.getState().state, turn: 9 } });
    expect(store.nextTurn()?.turn).toBe(10);
    await vi.dynamicImportSettled();
    expect(queueCloudSaveUpload).not.toHaveBeenCalled();
    const { log } = useGameStore.getState();
    expect(log[log.length - 1]).toContain('无法存档');

    const written = store.save();
    expect(written.ok).toBe(true);
    await vi.dynamicImportSettled();
    expect(queueCloudSaveUpload).toHaveBeenCalledExactlyOnceWith(0, written);
  });

  it('submits readiness after the pending action using its acknowledged revision', async () => {
    const reply = deferred<Awaited<ReturnType<typeof submitSharedWorldAction>>>();
    vi.mocked(submitSharedWorldAction).mockReturnValue(reply.promise);
    vi.mocked(markSharedWorldReady).mockResolvedValue({ resolved: false });
    useGameStore.getState().setStrategyFocus('reform');
    useGameStore.getState().nextTurn();
    await vi.dynamicImportSettled();
    expect(markSharedWorldReady).not.toHaveBeenCalled();

    reply.resolve({ world: { ...world, revision: 2 }, state: useGameStore.getState().state });
    await vi.waitFor(() => expect(markSharedWorldReady).toHaveBeenCalledWith(world.id, 'n01', 2, 0));
  });

  it('holds an already queued confirmation when its preceding order fails, then accepts a fresh confirmation', async () => {
    const state = createInitialState();
    vi.mocked(submitSharedWorldAction).mockRejectedValue(new Error('connection lost'));
    vi.mocked(enterSharedWorld).mockResolvedValue({ world, state, controls: [] });
    vi.mocked(markSharedWorldReady).mockResolvedValue({ resolved: false });
    useGameStore.getState().setStrategyFocus('reform');
    useGameStore.getState().nextTurn();
    await vi.dynamicImportSettled();
    expect(enterSharedWorld).toHaveBeenCalledOnce();
    expect(useGameStore.getState().state.strategyFocus ?? 'balance').toBe('balance');
    expect(markSharedWorldReady).not.toHaveBeenCalled();
    useGameStore.getState().nextTurn();
    await vi.dynamicImportSettled();
    expect(markSharedWorldReady).toHaveBeenCalledOnce();
  });

  it.each([false, true])('recovers the authoritative vote after both replies are lost (settled: %s)', async settled => {
    vi.mocked(markSharedWorldReady).mockRejectedValue(new TypeError('connection lost'));
    const nextYear = { ...world, turn: 1, revision: world.revision + 1 };
    vi.mocked(syncSharedWorld).mockResolvedValue(settled
      ? { world: nextYear, state: { ...createInitialState(), turn: 1 }, ready: false }
      : { world, ready: true });
    useGameStore.getState().nextTurn();
    expect(await waitForSharedCommands()).toBe(true);
    expect(useSharedWorldSessionStore.getState().session).toMatchObject({ ready: !settled, turn: settled ? 1 : 0 });
    const { log } = useGameStore.getState();
    expect(log[log.length - 1]).toContain(settled ? '统一结算完成，进入第 2 年' : '已准备，等待其他统治者');
    expect(useGameStore.getState().justProcessedTurn).toBe(settled);
    expect(markSharedWorldReady).toHaveBeenCalledOnce();
  });

  it('keeps a failed vote visible when the authoritative year is still waiting for this ruler', async () => {
    vi.mocked(markSharedWorldReady).mockRejectedValue(new Error('准备状态提交失败'));
    vi.mocked(syncSharedWorld).mockResolvedValue({ world, ready: false });
    useGameStore.getState().nextTurn();
    expect(await waitForSharedCommands()).toBe(false);
    expect(useSharedWorldSessionStore.getState().session).toMatchObject({ ready: false, turn: 0 });
    const { log } = useGameStore.getState();
    expect(log[log.length - 1]).toContain('准备状态提交失败');
  });

  it('reports an unknown outcome when the readiness reply and its recovery check both fail', async () => {
    vi.mocked(markSharedWorldReady).mockRejectedValue(new TypeError('Load failed'));
    vi.mocked(syncSharedWorld).mockRejectedValue(new TypeError('Load failed'));
    useGameStore.getState().nextTurn();
    expect(await waitForSharedCommands()).toBe(false);
    expect(useSharedWorldStore.getState().message).toBe('准备结果尚未确认，恢复连接后会重新核对。');
    expect(useSharedWorldSessionStore.getState().session).toMatchObject({ ready: false, turn: 0 });
  });

  it('ignores old replies and queued commands after re-entering the same nation', async () => {
    const reply = deferred<Awaited<ReturnType<typeof submitSharedWorldAction>>>();
    vi.mocked(submitSharedWorldAction).mockReturnValue(reply.promise);
    useGameStore.getState().setStrategyFocus('reform');
    await vi.waitFor(() => expect(submitSharedWorldAction).toHaveBeenCalledTimes(1));
    useGameStore.getState().setStrategyFocus('diplomacy');
    useGameStore.getState().backToMenu();
    enterWorld();
    const current = useGameStore.getState().state;
    reply.resolve({ world: { ...world, revision: 2 }, state: createInitialState() });
    await vi.dynamicImportSettled();

    expect(useGameStore.getState().state).toBe(current);
    expect(useSharedWorldSessionStore.getState().session?.revision).toBe(1);
    expect(submitSharedWorldAction).toHaveBeenCalledTimes(1);
  });

  it('does not reopen a shared world when an in-flight action fails after leaving', async () => {
    const reply = deferred<Awaited<ReturnType<typeof submitSharedWorldAction>>>();
    vi.mocked(submitSharedWorldAction).mockReturnValue(reply.promise);
    useGameStore.getState().setStrategyFocus('reform');
    await vi.waitFor(() => expect(submitSharedWorldAction).toHaveBeenCalledOnce());
    useGameStore.getState().newGame();
    const local = useGameStore.getState().state;
    reply.reject(new Error('offline'));
    await vi.dynamicImportSettled();

    expect(enterSharedWorld).not.toHaveBeenCalled();
    expect(useGameStore.getState().state).toBe(local);
  });

  it('does not apply a resolved shared turn to a new local campaign', async () => {
    const reply = deferred<Awaited<ReturnType<typeof markSharedWorldReady>>>();
    vi.mocked(markSharedWorldReady).mockReturnValue(reply.promise);
    useGameStore.getState().nextTurn();
    await vi.waitFor(() => expect(markSharedWorldReady).toHaveBeenCalledOnce());
    useGameStore.getState().newGame();
    const local = useGameStore.getState().state;
    reply.resolve({ resolved: true, world: { ...world, turn: 1, revision: 2 }, state: { ...createInitialState(), turn: 1 } });
    await vi.dynamicImportSettled();

    expect(useGameStore.getState().state).toBe(local);
    expect(useGameStore.getState().justProcessedTurn).toBe(false);
  });

  it('keeps the second ruler in control when another nation is selected in the unified snapshot', async () => {
    const state = createInitialState();
    useSharedWorldSessionStore.getState().start(world, 'n02', state);
    useGameStore.getState().startSharedWorld(state, 'n02', world.name);
    vi.mocked(markSharedWorldReady).mockResolvedValue({ resolved: true,
      world: { ...world, turn: 1, revision: 2 }, state: { ...createInitialState(), turn: 1 } });
    useGameStore.getState().nextTurn();
    await vi.waitFor(() => expect(useGameStore.getState().state.turn).toBe(1));
    expect(useGameStore.getState().state.playerNationId).toBe('n02');
    expect(useGameStore.getState().state.nations.n02.isPlayer).toBe(true);
  });

  it('restores the last confirmed snapshot when an optimistic action and its refresh both fail', async () => {
    vi.mocked(submitSharedWorldAction).mockRejectedValue(new Error('offline'));
    vi.mocked(enterSharedWorld).mockRejectedValue(new Error('offline'));
    useGameStore.getState().setStrategyFocus('reform');
    await vi.waitFor(() => expect(enterSharedWorld).toHaveBeenCalledOnce());
    expect(useGameStore.getState().state.strategyFocus ?? 'balance').toBe('balance');
  });
});

describe('shared lobby refresh ordering', () => {
  const lobby = useSharedWorldStore.getState();
  beforeEach(() => {
    vi.resetAllMocks();
    useAccountStore.setState({ user: { $id: 'ruler' } as AuthUser });
  });
  afterEach(() => { useAccountStore.setState({ user: null }); vi.unstubAllGlobals(); });

  it('recovers a missed admission on return, coalesces ownership changes and ignores callbacks after closing', async () => {
    const browser = Object.assign(new EventTarget(), { setInterval: vi.fn(), clearInterval: vi.fn() });
    const page = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal('window', browser);
    vi.stubGlobal('document', page);
    vi.mocked(listSharedWorlds).mockResolvedValue([world]);
    vi.mocked(joinSharedWorld).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ ok: true });
    vi.mocked(listNationControls).mockResolvedValue([]);
    const stopSocket = vi.fn(async () => {});
    vi.mocked(subscribeToWorldLobby).mockResolvedValue(stopSocket);
    const watcher = watchWorldLobby(world.id);
    try {
      await vi.waitFor(() => expect(useSharedWorldStore.getState().rosterErrors[world.id]).toBe('offline'));
      page.hidden = true;
      browser.dispatchEvent(new Event('online'));
      expect(joinSharedWorld).toHaveBeenCalledOnce();
      page.hidden = false;
      page.dispatchEvent(new Event('visibilitychange'));
      await vi.waitFor(() => expect(listNationControls).toHaveBeenCalledOnce());
      expect(useSharedWorldStore.getState().rosterErrors[world.id]).toBeUndefined();
      const onChange = vi.mocked(subscribeToWorldLobby).mock.calls[0][1];
      const delayed = deferred<Awaited<ReturnType<typeof listNationControls>>>();
      vi.mocked(listNationControls).mockReturnValueOnce(delayed.promise);
      onChange('controls');
      onChange('controls');
      onChange('controls');
      expect(listNationControls).toHaveBeenCalledTimes(2);
      delayed.resolve([]);
      await vi.waitFor(() => expect(listNationControls).toHaveBeenCalledTimes(3));
      expect(listSharedWorlds).toHaveBeenCalledTimes(2);
      expect(joinSharedWorld).toHaveBeenCalledTimes(2);
      onChange('world');
      await vi.waitFor(() => expect(listSharedWorlds).toHaveBeenCalledTimes(3));
    } finally { watcher.stop(); }
    vi.mocked(subscribeToWorldLobby).mock.calls[0][1]('controls');
    browser.dispatchEvent(new Event('online'));
    expect(listNationControls).toHaveBeenCalledTimes(3);
    expect(stopSocket).toHaveBeenCalledOnce();
  });

  it('keeps cached worlds visible on a failed directory refresh and clears the error after recovery', async () => {
    vi.mocked(listSharedWorlds).mockResolvedValueOnce([world]).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    await lobby.refreshWorlds();
    await lobby.refreshWorlds();
    expect(useSharedWorldStore.getState()).toMatchObject({ worlds: [world], worldListError: 'offline' });
    await lobby.refreshWorlds();
    expect(useSharedWorldStore.getState()).toMatchObject({ worlds: [], worldListError: null });
  });

  it('keeps the latest list and rejects a late ownership response after logout', async () => {
    const delayedList = deferred<SharedWorldInstance[]>();
    vi.mocked(listSharedWorlds).mockReturnValueOnce(delayedList.promise).mockResolvedValueOnce([{ ...world, revision: 4 }]);
    const oldList = lobby.refreshWorlds();
    await lobby.refreshWorlds();
    delayedList.resolve([world]);
    await oldList;
    expect(useSharedWorldStore.getState().worlds[0].revision).toBe(4);

    const delayedControls = deferred<Awaited<ReturnType<typeof listNationControls>>>();
    vi.mocked(listNationControls).mockReturnValueOnce(delayedControls.promise);
    const oldControls = lobby.refreshControls(world.id);
    useAccountStore.setState({ user: null });
    delayedControls.resolve([]);
    await oldControls;
    expect(useSharedWorldStore.getState().controls).toEqual({});
    expect(useSharedWorldStore.getState().worlds).toEqual([]);
  });

  it('keeps entry pending while background refreshes finish and discards a superseded entry', async () => {
    const first = deferred<Awaited<ReturnType<typeof enterSharedWorld>>>();
    const second = deferred<Awaited<ReturnType<typeof enterSharedWorld>>>();
    vi.mocked(enterSharedWorld).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.mocked(listSharedWorlds).mockResolvedValue([world]);
    const a = lobby.enter(world.id, 'n01');
    const b = lobby.enter(world.id, 'n02');
    await lobby.refreshWorlds();
    first.resolve({ world, state: createInitialState(), controls: [] });
    expect(await a).toBeNull();
    expect(useSharedWorldStore.getState().entering).toBe(true);
    second.resolve({ world, state: createInitialState(), controls: [] });
    expect(await b).toBeTruthy();
    expect(useSharedWorldSessionStore.getState().session?.nationId).toBe('n02');
    expect(useSharedWorldStore.getState().entering).toBe(false);
  });
});
