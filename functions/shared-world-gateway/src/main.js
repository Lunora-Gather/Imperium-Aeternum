import { services, ID, Permission, Query, Role, InputFile } from './sdk.js';
import { gzipSync } from 'node:zlib';
import { advanceSharedWorld, applySharedWorldCommand, createSharedWorldSnapshot, prepareSharedSnapshot, sharedRulerSnapshot } from './generated/engine-bundle.js';
import {
  assertCommandCategory,
  assertCommandOwnership,
  assertReadyCommandIdentity,
  assertRenewableControl,
  decodeSnapshotPayload,
  isControlActive,
  isWorldDue,
  readyCommandKey,
  wasWorldActiveDuringWindow,
} from './policy.js';

const DATABASE_ID = 'imperium_game';
const WORLD_TABLE = 'shared_worlds';
const MEMBERSHIP_TABLE = 'world_memberships';
const CONTROL_TABLE = 'nation_controls';
const COMMAND_TABLE = 'world_commands';
const SNAPSHOT_BUCKET = 'world_snapshots';
const LEASE_DAYS = 14;
const MAX_WORLD_MEMBERS = 100;
const identifier = (value, max, label) => {
  const result = String(value ?? '').trim();
  if (!result || result.length > max || !/^[a-zA-Z0-9._:-]+$/.test(result)) throw new Error(`${label}无效`);
  return result;
};

function hash(value) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}
const membershipId = (worldId, userId) => `mem_${hash(worldId)}_${hash(userId)}`;
const commandId = (key) => `cmd_${hash(key)}_${hash([...key].reverse().join(''))}`;

const userPermissions = (userId) => [Permission.read(Role.user(userId))];
const isoAfterDays = (now, days) => new Date(now.getTime() + days * 86_400_000).toISOString();
const nextDeadline = (world, now = new Date()) => new Date(now.getTime() + Number(world.planningWindowSeconds) * 1000).toISOString();

async function ensureMembership(db, worldId, userId, now) {
  await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  const rowId = membershipId(worldId, userId);
  const data = { pairKey: `${worldId}:${userId}`, worldId, userId, role: 'member', joinedAt: now.toISOString(), lastSeenAt: now.toISOString() };
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId });
    if (current.worldId !== worldId || current.userId !== userId) throw new Error('版图成员标识冲突');
    return db.updateRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data: { lastSeenAt: now.toISOString() } });
  } catch (error) {
    if (error?.code !== 404) throw error;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const tx = await db.createTransaction();
    try {
      const world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId: tx.$id });
      let current;
      try {
        current = await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, transactionId: tx.$id });
      } catch (error) {
        if (error?.code !== 404) throw error;
      }
      if (current) {
        if (current.worldId !== worldId || current.userId !== userId) throw new Error('版图成员标识冲突');
        const updated = await db.updateRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, transactionId: tx.$id, data: { lastSeenAt: now.toISOString() } });
        await db.updateTransaction({ transactionId: tx.$id, commit: true });
        return updated;
      }
      const members = await db.listRows({
        databaseId: DATABASE_ID,
        tableId: MEMBERSHIP_TABLE,
        queries: [Query.equal('worldId', worldId), Query.limit(MAX_WORLD_MEMBERS)],
        transactionId: tx.$id,
        total: true,
      });
      if (Number(members.total ?? members.rows.length) >= MAX_WORLD_MEMBERS) throw new Error(`当前版图成员已达 ${MAX_WORLD_MEMBERS} 人上限`);
      // Touch the shared world row in the same transaction so concurrent joins
      // serialize on one authoritative record instead of both observing slot 100.
      await db.updateRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId: tx.$id, data: { status: world.status } });
      const created = await db.createRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, transactionId: tx.$id, data, permissions: userPermissions(userId) });
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
      return created;
    } catch (createError) {
      await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
      if (createError?.code === 409 && attempt < 2) continue;
      if (createError?.code === 409) {
        const current = await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId }).catch(() => null);
        if (current && (current.worldId !== worldId || current.userId !== userId)) throw new Error('版图成员标识冲突');
        if (current) return db.updateRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data: { lastSeenAt: now.toISOString() } });
      }
      throw createError;
    }
  }
  throw new Error('版图成员并发登记失败，请稍后重试');
}

async function listControls(db, worldId, transactionId, filters = []) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('worldId', worldId), ...filters, Query.orderAsc(filters.length ? '$id' : 'nationName'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, transactionId, queries, total: false });
    rows.push(...page.rows);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && rows.length < 1000);
  return rows;
}

async function listDueWorlds(db, nowMs) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('status', 'active'), Query.orderAsc('$id'), Query.limit(100),
      Query.select(['$id', 'turn', 'status', 'phase', 'snapshotFileId', 'planningDeadlineAt'])];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, queries, total: false });
    rows.push(...page.rows.filter(world => isWorldDue(world, nowMs)));
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor);
  return rows;
}

async function listTurnCommands(db, worldId, turn, extraQueries = []) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('worldId', worldId), Query.equal('turn', turn), ...extraQueries, Query.orderAsc('$id'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, queries, total: false });
    rows.push(...page.rows);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && rows.length < 1000);
  return rows;
}

async function readControl(db, worldId, nationId, userId, transactionId) {
  const found = await db.listRows({
    databaseId: DATABASE_ID, tableId: CONTROL_TABLE, transactionId, total: false,
    queries: [Query.equal('worldId', worldId), Query.equal('nationId', nationId), Query.limit(1)],
  });
  const control = found.rows[0];
  if (!control || control.controllerUserId !== userId || control.status !== 'controlled') throw Object.assign(new Error('你没有该国家的有效控制权'), { code: 403, lostControl: true });
  if (!isControlActive(control)) throw Object.assign(new Error('国家控制租约已过期，请重新认领'), { code: 403, lostControl: true });
  return control;
}

async function requireControl(db, worldId, nationId, userId, withControl) {
  // Two tabs may renew the same lease or confirm the same vote concurrently.
  for (let attempt = 0; ; attempt++) {
    const tx = await db.createTransaction();
    try {
      const control = await readControl(db, worldId, nationId, userId, tx.$id);
      const now = new Date();
      const updated = await db.updateRow({
        databaseId: DATABASE_ID,
        tableId: CONTROL_TABLE,
        rowId: control.$id,
        transactionId: tx.$id,
        data: { leaseExpiresAt: isoAfterDays(now, LEASE_DAYS), lastActiveAt: now.toISOString() },
      });
      if (withControl) await withControl(tx.$id);
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
      return updated;
    } catch (error) {
      await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
      if (error?.code !== 409 || error.staleRevision || attempt >= 2) throw error;
    }
  }
}

async function checkPollingControl(db, world, nationId, userId) {
  const control = await readControl(db, world.$id, nationId, userId);
  const now = Date.now();
  const age = now - Date.parse(control.lastActiveAt);
  // Keep a heartbeat in each planning window and renew a nearly expired lease.
  if (age >= 0 && age < 60_000 && Date.parse(control.leaseExpiresAt) > now + 60_000
    && wasWorldActiveDuringWindow(world, [control])) return control;
  return requireControl(db, world.$id, nationId, userId);
}

async function readReadyVote(db, world, nationId, transactionId) {
  const key = readyCommandKey(world.$id, world.turn, nationId);
  const params = { databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: commandId(key), transactionId };
  let vote;
  try { vote = await db.getRow(params); }
  catch (error) { if (error?.code !== 404) throw error; }
  if (vote) assertReadyCommandIdentity(vote, { worldId: world.$id, nationId, turn: world.turn, idempotencyKey: key });
  return { vote, key, params };
}

function hasCurrentVote(vote, control) {
  return vote?.status === 'pending' && vote.userId === control.controllerUserId
    && (!control.claimedAt || Date.parse(vote.createdAt) >= Date.parse(control.claimedAt));
}

async function mutateControl(db, storage, action, worldId, nationId, userId, now) {
  if (!nationId) throw new Error('缺少国家标识');
  const tx = await db.createTransaction();
  try {
    const world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId: tx.$id });
    const controls = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('nationId', nationId), Query.limit(1)], transactionId: tx.$id, total: false });
    const control = controls.rows[0];
    if (!control) throw new Error('该国家不在此版图的开放列表中');
    const leaseExpired = !!control.leaseExpiresAt && Date.parse(control.leaseExpiresAt) <= now.getTime();
    if (action === 'release_nation') {
      if (control.controllerUserId !== userId) throw new Error('只有当前控制者可以释放该国家');
      await db.updateRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id, transactionId: tx.$id, data: { controllerUserId: null, status: 'available', releasedAt: now.toISOString(), leaseExpiresAt: null, lastActiveAt: null, version: control.version + 1 } });
    } else if (action === 'renew_control') {
      assertRenewableControl(control, userId, now.getTime());
      await db.updateRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id, transactionId: tx.$id, data: { leaseExpiresAt: isoAfterDays(now, LEASE_DAYS), lastActiveAt: now.toISOString(), version: control.version + 1 } });
    } else {
      const roster = await snapshotRoster(db, storage, world);
      if (roster && roster.fileId !== world.snapshotFileId) throw Object.assign(new Error('版图已更新，请刷新后重试'), { code: 409 });
      if (unavailable(roster, nationId)) throw new Error('国家不存在或已经覆亡');
      if (control.controllerUserId && control.controllerUserId !== userId && !leaseExpired) throw new Error('该国家已由其他玩家控制');
      if (control.controllerUserId !== userId || leaseExpired) {
        const owned = await listControls(db, worldId, tx.$id, [Query.equal('controllerUserId', userId), Query.equal('status', 'controlled')]);
        if (owned.filter(row => isControlActive(row, now.getTime()) && !unavailable(roster, row.nationId)).length >= world.maxNationsPerUser) throw new Error(`此版图最多控制 ${world.maxNationsPerUser} 个国家`);
      }
      await db.updateRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id, transactionId: tx.$id, data: { controllerUserId: userId, status: 'controlled', claimedAt: control.controllerUserId === userId && !leaseExpired ? control.claimedAt : now.toISOString(), releasedAt: null, leaseExpiresAt: isoAfterDays(now, LEASE_DAYS), lastActiveAt: now.toISOString(), version: control.version + 1 } });
    }
    if (action === 'release_nation' || (action === 'claim_nation' && (control.controllerUserId !== userId || leaseExpired))) {
      const { vote, params } = await readReadyVote(db, world, nationId, tx.$id);
      if (vote?.status === 'pending') await db.updateRow({ ...params, data: { status: 'cancelled' } });
      await db.updateRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId: tx.$id, data: { revision: world.revision + 1 } });
    }
    await db.updateTransaction({ transactionId: tx.$id, commit: true });
    return db.getRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id });
  } catch (error) {
    await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
    throw error;
  }
}

async function readSnapshot(storage, fileId) {
  const payload = await storage.getFileDownload({ bucketId: SNAPSHOT_BUCKET, fileId });
  return prepareSharedSnapshot(decodeSnapshotPayload(payload));
}

function encodeState(state, nationId) {
  if (!Object.hasOwn(state.nations, nationId)) throw Object.assign(new Error('该国家已不在当前版图中，请返回大厅另选国家'), { code: 403, lostControl: true });
  const view = sharedRulerSnapshot(state, nationId);
  return {
    stateEncoding: 'gzip-base64',
    statePayload: gzipSync(JSON.stringify(view), { level: 6 }).toString('base64'),
  };
}

async function writeSnapshot(storage, worldId, state) {
  const fileId = ID.unique();
  const bytes = Buffer.from(JSON.stringify({ ...state, _relMap: undefined }));
  await storage.createFile({ bucketId: SNAPSHOT_BUCKET, fileId, file: InputFile.fromBuffer(bytes, `${worldId}-turn-${state.turn}.json`), permissions: [] });
  return fileId;
}

const getWorld = (db, worldId, transactionId) =>
  db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId });

async function loadWorldSnapshot(db, storage, world) {
  for (let attempt = 0; ; attempt++) {
    try { return { world, state: await readSnapshot(storage, world.snapshotFileId) }; }
    catch (error) {
      if (error?.code !== 404 || attempt >= 3) throw error;
      const latest = await getWorld(db, world.$id);
      if (latest.snapshotFileId === world.snapshotFileId) throw error;
      world = latest;
    }
  }
}

// Snapshot files are immutable. Keep only the small nation index of the last file read.
let lastRoster;
function indexNations(fileId, state) {
  const nations = new Map(Object.values(state.nations).map(({ id, name, defeated }) => [id, { name, defeated }]));
  lastRoster = { fileId, nations, pendingNations: new Set(state.pendingEvents.map(event => event.nationId)) };
  return lastRoster;
}

async function snapshotRoster(db, storage, world) {
  if (!world.snapshotFileId) return null;
  if (lastRoster?.fileId === world.snapshotFileId) return lastRoster;
  const latest = await loadWorldSnapshot(db, storage, world);
  return indexNations(latest.world.snapshotFileId, latest.state);
}

function unavailable(roster, id) {
  if (!roster) return undefined;
  const nation = roster.nations.get(id);
  return !nation ? 'missing' : nation.defeated ? 'defeated' : undefined;
}

function displayControls(rows, roster) {
  return rows.map(row => ({ ...row, nationName: roster?.nations.get(row.nationId)?.name ?? row.nationName,
    unavailable: unavailable(roster, row.nationId) }));
}

// The receipt and file pointer become visible in the same database commit.
async function publishSnapshot(db, storage, world, state, changes, writeReceipt) {
  const fileId = await writeSnapshot(storage, world.$id, state);
  const remove = (id) => storage.deleteFile({ bucketId: SNAPSHOT_BUCKET, fileId: id }).catch(() => undefined);
  let tx, updated, committing = false;
  try {
    tx = await db.createTransaction();
    const current = await getWorld(db, world.$id, tx.$id);
    if (current.revision !== world.revision || current.snapshotFileId !== world.snapshotFileId || current.phase !== world.phase || current.status !== world.status) {
      throw Object.assign(new Error('版图已更新，请刷新后重新操作'), { code: 409 });
    }
    if (writeReceipt) await writeReceipt(tx.$id);
    const data = { ...changes, snapshotFileId: fileId };
    updated = { ...current, ...data };
    await db.updateRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id, transactionId: tx.$id, data });
    committing = true;
    await db.updateTransaction({ transactionId: tx.$id, commit: true });
    if (world.snapshotFileId) await remove(world.snapshotFileId);
    return updated;
  } catch (error) {
    const rolledBack = tx && await db.updateTransaction({ transactionId: tx.$id, rollback: true }).then(() => true, () => false);
    if (!committing || rolledBack || error?.code === 409) await remove(fileId);
    else if ((await getWorld(db, world.$id).catch(() => null))?.snapshotFileId === fileId) {
      if (world.snapshotFileId) await remove(world.snapshotFileId);
      return updated;
    }
    throw error;
  }
}

async function initializeWorld(db, storage, world) {
  if (world.snapshotFileId) return world;
  try {
    return await publishSnapshot(db, storage, world, createSharedWorldSnapshot(), {
      status: 'active', phase: 'planning', planningDeadlineAt: nextDeadline(world),
    });
  } catch (error) {
    if (error?.code !== 409) throw error;
    const current = await getWorld(db, world.$id);
    if (!current.snapshotFileId) throw error;
    return current;
  }
}

async function submitCommand(db, storage, worldId, nationId, userId, body) {
  const world = await getWorld(db, worldId);
  await requireControl(db, worldId, nationId, userId);
  if (world.status !== 'active' || !world.snapshotFileId) throw new Error('共享版图尚未开放');
  if (world.phase !== 'planning') throw new Error('版图正在结算，请稍后刷新');
  const key = String(body.idempotencyKey ?? '');
  if (key.length < 8 || key.length > 64) throw new Error('行动幂等标识无效');
  const commandType = String(body.commandType ?? '');
  if (!['domestic_action', 'diplomatic_action', 'military_action'].includes(commandType)) throw new Error('共享行动类型无效');
  const action = String(body.payload?.action ?? '');
  assertCommandCategory(commandType, action);
  const serializedPayload = JSON.stringify(body.payload ?? {});
  if (serializedPayload.length > 8192) throw new Error('共享行动参数过大');
  const rowId = commandId(key);
  const findReceipt = async () => {
    let row;
    try { row = await db.getRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId }); }
    catch (error) { if (error?.code === 404) return null; throw error; }
    assertCommandOwnership(row, { idempotencyKey: key, worldId, nationId, userId });
    if (row.commandType !== commandType || row.payload !== serializedPayload || row.baseRevision !== body.baseRevision) throw new Error('行动幂等标识已用于其他指令');
    if (row.status !== 'applied') throw new Error('该行动未获确认，请刷新后重新操作');
    return { command: row, ...await loadWorldSnapshot(db, storage, await getWorld(db, worldId)) };
  };
  const existing = await findReceipt();
  if (existing) return existing;
  if (body.baseRevision !== world.revision) throw new Error('版图已更新，请刷新后重新操作');
  const snapshot = await readSnapshot(storage, world.snapshotFileId);
  const applied = applySharedWorldCommand(snapshot, nationId, body.payload ?? {});
  const data = { worldId, nationId, userId, turn: world.turn, baseRevision: world.revision, commandType,
    idempotencyKey: key, payload: serializedPayload, status: 'applied', createdAt: new Date().toISOString() };
  try {
    const updated = await publishSnapshot(db, storage, world, applied.state, { revision: world.revision + 1 }, (transactionId) =>
      db.createRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId, transactionId, data, permissions: userPermissions(userId) }));
    return { command: data, world: updated, state: applied.state, messages: applied.messages };
  } catch (error) {
    const committed = await findReceipt();
    if (committed) return committed;
    throw error;
  }
}

async function releaseExpiredControls(db, worldId, controls, nowMs) {
  const expired = controls.filter((control) => control.controllerUserId && !isControlActive(control, nowMs));
  if (!expired.length) return controls.filter((control) => isControlActive(control, nowMs));
  await Promise.all(expired.map(async (control) => {
    const tx = await db.createTransaction();
    try {
      const current = await db.getRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id, transactionId: tx.$id });
      if (!current.controllerUserId || isControlActive(current, nowMs)) {
        await db.updateTransaction({ transactionId: tx.$id, rollback: true });
        return;
      }
      await db.updateRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: current.$id, transactionId: tx.$id, data: { controllerUserId: null, status: 'available', releasedAt: new Date(nowMs).toISOString(), leaseExpiresAt: null, lastActiveAt: null, version: current.version + 1 } });
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
    } catch (error) {
      await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
      throw error;
    }
  }));
  return (await listControls(db, worldId)).filter((control) => isControlActive(control, nowMs));
}

async function resolveWorld(db, storage, worldId, options = {}) {
  const world = await getWorld(db, worldId);
  if (world.status !== 'active' || world.phase !== 'planning' || !world.snapshotFileId) return null;
  const nowMs = options.nowMs ?? Date.now();
  if (world.turn !== options.expectedTurn || (options.requireActivity && !isWorldDue(world, nowMs))) return null;
  const owned = await listControls(db, worldId, undefined, [Query.isNotNull('controllerUserId')]);
  const controls = await releaseExpiredControls(db, worldId, owned, nowMs);
  if (options.requireActivity && !wasWorldActiveDuringWindow(world, controls)) return null;
  if (!controls.length && world.pauseWhenEmpty) return null;
  let snapshot = options.snapshotFileId === world.snapshotFileId ? options.snapshot : undefined;
  let roster = lastRoster;
  if (roster?.fileId !== world.snapshotFileId) {
    snapshot ??= await readSnapshot(storage, world.snapshotFileId);
    roster = indexNations(world.snapshotFileId, snapshot);
  }
  const living = controls.filter(row => !unavailable(roster, row.nationId));
  if (!living.length && (!options.requireActivity || world.pauseWhenEmpty)) return null;
  if (options.requireActivity && living.length !== controls.length && !wasWorldActiveDuringWindow(world, living)) return null;
  const ready = await listTurnCommands(db, worldId, world.turn, [Query.equal('commandType', 'set_ready'), Query.equal('status', 'pending')]);
  if (!options.requireActivity) {
    const voters = new Map(ready.map((row) => [row.nationId, row]));
    const readyCount = living.filter((c) => {
      const vote = voters.get(c.nationId);
      return !roster.pendingNations.has(c.nationId) && hasCurrentVote(vote, c);
    }).length;
    if (readyCount < living.length) return { waiting: true, world, readyCount, requiredCount: living.length };
  }
  snapshot ??= await readSnapshot(storage, world.snapshotFileId);
  const state = advanceSharedWorld(snapshot, living.map((row) => row.nationId));
  const updated = await publishSnapshot(db, storage, world, state, {
    revision: world.revision + 1, turn: world.turn + 1, planningDeadlineAt: nextDeadline(world),
  });
  // Readiness is scoped by turn. Archiving a vote cannot invalidate an already published year.
  await Promise.all(ready.map((row) => db.updateRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: row.$id, data: { status: 'resolved' } }).catch(() => undefined)));
  return { world: updated, state };
}

async function resolveDueWorlds(db, storage, nowMs = Date.now()) {
  const due = await listDueWorlds(db, nowMs);
  const results = [];
  for (const world of due) {
    try {
      const resolved = await resolveWorld(db, storage, world.$id, { expectedTurn: world.turn, requireActivity: true, nowMs });
      results.push({ worldId: world.$id, resolved: !!resolved });
    } catch (cause) {
      results.push({ worldId: world.$id, resolved: false, error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
  return results;
}

async function setReady(db, storage, worldId, nationId, userId, body) {
  let world, turn, snapshot;
  await requireControl(db, worldId, nationId, userId, async (transactionId) => {
    world = await getWorld(db, worldId, transactionId);
    if (world.status !== 'active' || world.phase !== 'planning' || !world.snapshotFileId) throw new Error('共享版图当前不能确认准备');
    turn = body.turn === undefined ? (turn ?? world.turn) : body.turn;
    if (!Number.isSafeInteger(turn) || turn < 0 || turn > world.turn || !Number.isSafeInteger(body.baseRevision) || body.baseRevision < 0) throw new Error('准备回合或修订号无效');
    if (turn < world.turn) return;
    const { vote: existing, key, params } = await readReadyVote(db, world, nationId, transactionId);
    const replay = existing?.status === 'pending' && existing.userId === userId && existing.baseRevision === body.baseRevision;
    if (!replay && body.baseRevision !== world.revision) throw Object.assign(new Error('版图已更新，请刷新后重试'), { code: 409, staleRevision: true });
    try { snapshot = await readSnapshot(storage, world.snapshotFileId); }
    catch (error) {
      if (error?.code !== 404 || (await getWorld(db, worldId)).snapshotFileId === world.snapshotFileId) throw error;
      throw Object.assign(new Error('版图已更新，请刷新后重试'), { code: 409 });
    }
    if (!snapshot.nations[nationId] || snapshot.nations[nationId].defeated) throw new Error('国家不存在或已经覆亡');
    if (snapshot.pendingEvents.some((p) => p.nationId === nationId)) throw new Error('请先处理待决事件');
    if (replay) return;
    const vote = { userId, baseRevision: world.revision, status: 'pending', createdAt: new Date().toISOString() };
    const permissions = userPermissions(userId);
    if (!existing) {
      await db.createRow({ ...params, permissions, data: { ...vote, worldId, nationId, turn: world.turn,
        commandType: 'set_ready', idempotencyKey: key, payload: '{}' } });
    } else {
      await db.updateRow({ ...params, permissions, data: vote });
    }
  });
  if (turn < world.turn) return { ready: true, resolved: await loadWorldSnapshot(db, storage, world) };
  // A concurrent order or change of ruler may replace the snapshot after the votes were counted.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resolved = await resolveWorld(db, storage, worldId, { expectedTurn: world.turn, snapshotFileId: world.snapshotFileId, snapshot });
      if (resolved?.waiting) return { ready: true, readyCount: resolved.readyCount, requiredCount: resolved.requiredCount };
      if (resolved) return { ready: true, resolved };
    } catch (error) {
      if (error?.code !== 409 && error?.code !== 404) throw error;
    }
    const latest = await getWorld(db, worldId);
    await readControl(db, worldId, nationId, userId);
    if (latest.turn > world.turn) return { ready: true, resolved: await loadWorldSnapshot(db, storage, latest) };
    if (latest.turn !== world.turn || latest.status !== 'active' || latest.phase !== 'planning') break;
  }
  throw Object.assign(new Error('版图已更新，请刷新后重新确认准备'), { code: 409 });
}

export default async ({ req, res, error }) => {
  try {
    const { db, storage } = services(req);
    const userId = req.headers['x-appwrite-user-id'];
    if (req.headers['x-appwrite-trigger'] === 'schedule' && !userId) {
      const results = await resolveDueWorlds(db, storage);
      return res.json({ ok: true, checked: results.length, results });
    }
    if (req.method !== 'POST') return res.json({ ok: false, message: '仅支持 POST 请求' }, 405);
    if (!userId) return res.json({ ok: false, message: '需要登录后操作共享版图' }, 401);
    const body = req.bodyJson ?? {};
    const { action } = body;
    const worldId = identifier(body.worldId, 36, '版图标识');
    const nationId = body.nationId == null ? undefined : identifier(body.nationId, 64, '国家标识');
    const now = new Date();
    if (action === 'list_controls') {
      const world = await getWorld(db, worldId);
      const [rows, roster] = await Promise.all([listControls(db, worldId), snapshotRoster(db, storage, world)]);
      return res.json({ ok: true, controls: displayControls(rows, roster) });
    }
    if (action === 'join_world' || action === 'claim_nation' || action === 'enter_world') {
      await ensureMembership(db, worldId, userId, now);
    }
    if (action === 'join_world') return res.json({ ok: true });
    if (action === 'enter_world' || action === 'sync_world') {
      let world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
      if (world.status === 'paused' || world.status === 'archived') throw new Error('共享版图尚未开放');
      const control = action === 'sync_world' ? await checkPollingControl(db, world, nationId, userId) : await requireControl(db, worldId, nationId, userId);
      world = await initializeWorld(db, storage, world);
      const voteFor = async w => (await readReadyVote(db, w, nationId)).vote;
      let latest = action === 'sync_world' && world.revision === body.baseRevision
        ? { world } : await loadWorldSnapshot(db, storage, world);
      let vote = await voteFor(latest.world);
      if (vote?.status === 'resolved') {
        latest = await loadWorldSnapshot(db, storage, await getWorld(db, worldId));
        vote = await voteFor(latest.world);
      }
      let ready = hasCurrentVote(vote, control);
      if (ready) {
        // Lease expiry and a recorded final vote can leave the year ready
        // to settle without changing the snapshot revision.
        const resolved = await resolveWorld(db, storage, worldId, { expectedTurn: latest.world.turn,
          snapshotFileId: latest.world.snapshotFileId, snapshot: latest.state }).catch(error => {
          if (![404, 409].includes(error?.code)) throw error;
          return null;
        });
        if (resolved?.state) {
          latest = resolved;
          ready = false;
        } else if (!resolved || resolved.world.revision !== latest.world.revision) {
          latest = await loadWorldSnapshot(db, storage, await getWorld(db, worldId));
          ready = hasCurrentVote(await voteFor(latest.world), control);
        }
      }
      return res.json({ ok: true, world: latest.world, ready, ...(latest.state && encodeState(latest.state, nationId)),
        ...(action === 'enter_world' ? { controls: displayControls(await listControls(db, worldId), indexNations(latest.world.snapshotFileId, latest.state)) } : {}) });
    }
    if (action === 'submit_command') {
      const result = await submitCommand(db, storage, worldId, nationId, userId, body);
      const { state, ...metadata } = result;
      return res.json({ ok: true, ...metadata, ...encodeState(state, nationId) });
    }
    if (action === 'set_ready') {
      const result = await setReady(db, storage, worldId, nationId, userId, body);
      if (!result.resolved?.state) return res.json({ ok: true, ...result });
      const { state, ...resolved } = result.resolved;
      return res.json({ ok: true, ...result, resolved: { ...resolved, ...encodeState(state, nationId) } });
    }
    if (!['claim_nation', 'release_nation', 'renew_control'].includes(action)) return res.json({ ok: false, message: '不支持的共享版图操作' }, 400);
    return res.json({ ok: true, control: await mutateControl(db, storage, action, worldId, nationId, userId, now) });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const appwriteFailure = typeof cause?.code === 'number' && !cause.lostControl && ![404, 409].includes(cause.code);
    const status = cause?.lostControl ? 403 : cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : appwriteFailure ? 503 : 400;
    const message = appwriteFailure ? '共享版图服务暂不可用，请稍后重试' : cause instanceof Error ? cause.message : '共享版图操作失败';
    return res.json({ ok: false, message }, status);
  }
};
