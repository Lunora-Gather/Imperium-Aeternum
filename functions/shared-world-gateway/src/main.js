import { Client, ID, Permission, Query, Role, Storage, TablesDB } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { advanceSharedWorld, applySharedWorldCommand, createSharedWorldSnapshot } from './engine-bundle.js';
import { assertCommandOwnership, isControlActive, isWorldDue, wasWorldActiveDuringWindow } from './policy.js';

const DATABASE_ID = 'imperium_game';
const WORLD_TABLE = 'shared_worlds';
const MEMBERSHIP_TABLE = 'world_memberships';
const CONTROL_TABLE = 'nation_controls';
const COMMAND_TABLE = 'world_commands';
const SNAPSHOT_BUCKET = 'world_snapshots';
const LEASE_DAYS = 14;

function hash(value) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}
const membershipId = (worldId, userId) => `mem_${hash(worldId)}_${hash(userId)}`;
const commandId = (key) => `cmd_${hash(key)}_${hash([...key].reverse().join(''))}`;

function services(req) {
  const client = new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);
  return { db: new TablesDB(client), storage: new Storage(client) };
}

const userPermissions = (userId) => [Permission.read(Role.user(userId))];
const isoAfterDays = (now, days) => new Date(now.getTime() + days * 86_400_000).toISOString();
const nextDeadline = (world, now = new Date()) => new Date(now.getTime() + Number(world.planningWindowSeconds) * 1000).toISOString();

async function ensureMembership(db, worldId, userId, now) {
  await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  const rowId = membershipId(worldId, userId);
  const data = { pairKey: `${worldId}:${userId}`, worldId, userId, role: 'member', joinedAt: now.toISOString(), lastSeenAt: now.toISOString() };
  try {
    await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId });
    return db.updateRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data: { lastSeenAt: now.toISOString() } });
  } catch (error) {
    if (error?.code !== 404) throw error;
    return db.createRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data, permissions: userPermissions(userId) });
  }
}

async function listControls(db, worldId) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('worldId', worldId), Query.orderAsc('nationName'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, queries, total: false });
    rows.push(...page.rows);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && rows.length < 1000);
  return rows;
}

async function listMemberships(db, worldId) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('worldId', worldId), Query.orderAsc('$id'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, queries, total: false });
    rows.push(...page.rows);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && rows.length < 1000);
  return rows;
}

async function listActiveWorlds(db) {
  const rows = [];
  let cursor;
  do {
    const queries = [Query.equal('status', 'active'), Query.orderAsc('$id'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listRows({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, queries, total: false });
    rows.push(...page.rows);
    cursor = page.rows.length === 100 ? page.rows.at(-1)?.$id : undefined;
  } while (cursor && rows.length < 1000);
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

async function requireControl(db, worldId, nationId, userId) {
  const found = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('nationId', nationId), Query.limit(1)], total: false });
  const control = found.rows[0];
  if (!control || control.controllerUserId !== userId || control.status !== 'controlled') throw new Error('你没有该国家的有效控制权');
  if (control.leaseExpiresAt && Date.parse(control.leaseExpiresAt) <= Date.now()) throw new Error('国家控制租约已过期，请重新认领');
  return control;
}

async function mutateControl(db, action, worldId, nationId, userId, now) {
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
    } else {
      if (control.controllerUserId && control.controllerUserId !== userId && !leaseExpired) throw new Error('该国家已由其他玩家控制');
      if (action === 'claim_nation' && control.controllerUserId !== userId) {
        const owned = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, queries: [Query.equal('worldId', worldId), Query.equal('controllerUserId', userId), Query.equal('status', 'controlled'), Query.limit(100)], transactionId: tx.$id, total: false });
        if (owned.rows.length >= world.maxNationsPerUser) throw new Error(`此版图最多控制 ${world.maxNationsPerUser} 个国家`);
      }
      await db.updateRow({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, rowId: control.$id, transactionId: tx.$id, data: { controllerUserId: userId, status: 'controlled', claimedAt: control.controllerUserId === userId ? control.claimedAt : now.toISOString(), releasedAt: null, leaseExpiresAt: isoAfterDays(now, LEASE_DAYS), lastActiveAt: now.toISOString(), version: control.version + 1 } });
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
  return JSON.parse(Buffer.from(payload).toString('utf8'));
}

async function writeSnapshot(storage, worldId, state) {
  const fileId = ID.unique();
  const bytes = Buffer.from(JSON.stringify({ ...state, _relMap: undefined }));
  await storage.createFile({ bucketId: SNAPSHOT_BUCKET, fileId, file: InputFile.fromBuffer(bytes, `${worldId}-turn-${state.turn}.json`), permissions: [] });
  return fileId;
}

async function initializeWorld(db, storage, world) {
  if (world.snapshotFileId) return world;
  const state = createSharedWorldSnapshot();
  const fileId = await writeSnapshot(storage, world.$id, state);
  const tx = await db.createTransaction();
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id, transactionId: tx.$id });
    if (current.snapshotFileId) {
      await db.updateTransaction({ transactionId: tx.$id, rollback: true });
      await storage.deleteFile({ bucketId: SNAPSHOT_BUCKET, fileId }).catch(() => undefined);
      return current;
    }
    await db.updateRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id, transactionId: tx.$id, data: { status: 'active', phase: 'planning', snapshotFileId: fileId, planningDeadlineAt: nextDeadline(current) } });
    await db.updateTransaction({ transactionId: tx.$id, commit: true });
    return db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id });
  } catch (error) {
    await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
    await storage.deleteFile({ bucketId: SNAPSHOT_BUCKET, fileId }).catch(() => undefined);
    throw error;
  }
}

async function replaceSnapshot(db, storage, world, state, revisionDelta = 1, turnDelta = 0) {
  const newFileId = await writeSnapshot(storage, world.$id, state);
  const tx = await db.createTransaction();
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id, transactionId: tx.$id });
    if (current.revision !== world.revision) throw new Error('版图已被其他行动更新，请刷新后重试');
    await db.updateRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id, transactionId: tx.$id, data: { snapshotFileId: newFileId, revision: current.revision + revisionDelta, turn: current.turn + turnDelta, phase: 'planning', status: 'active', planningDeadlineAt: turnDelta ? nextDeadline(current) : current.planningDeadlineAt } });
    await db.updateTransaction({ transactionId: tx.$id, commit: true });
    if (world.snapshotFileId) await storage.deleteFile({ bucketId: SNAPSHOT_BUCKET, fileId: world.snapshotFileId }).catch(() => undefined);
    return db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: world.$id });
  } catch (error) {
    await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
    await storage.deleteFile({ bucketId: SNAPSHOT_BUCKET, fileId: newFileId }).catch(() => undefined);
    throw error;
  }
}

async function submitCommand(db, storage, worldId, nationId, userId, body) {
  await requireControl(db, worldId, nationId, userId);
  let world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  if (world.status !== 'active' || !world.snapshotFileId) throw new Error('共享版图尚未开放');
  if (world.phase !== 'planning') throw new Error('版图正在结算，请稍后刷新');
  if (Number(body.baseRevision) !== world.revision) throw new Error('版图已更新，请刷新后重新操作');
  const key = String(body.idempotencyKey ?? '');
  if (key.length < 8 || key.length > 64) throw new Error('行动幂等标识无效');
  const commandType = String(body.commandType ?? '');
  if (!['domestic_action', 'diplomatic_action', 'military_action'].includes(commandType)) throw new Error('共享行动类型无效');
  const serializedPayload = JSON.stringify(body.payload ?? {});
  if (serializedPayload.length > 8192) throw new Error('共享行动参数过大');
  try {
    const existing = await db.getRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: commandId(key) });
    assertCommandOwnership(existing, { idempotencyKey: key, worldId, nationId, userId });
    const state = await readSnapshot(storage, world.snapshotFileId);
    return { command: existing, world, state };
  } catch (error) { if (error?.code !== 404) throw error; }
  const command = await db.createRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: commandId(key), data: { worldId, nationId, userId, turn: world.turn, baseRevision: world.revision, commandType, idempotencyKey: key, payload: serializedPayload, status: 'pending', createdAt: new Date().toISOString() }, permissions: userPermissions(userId) });
  const snapshot = await readSnapshot(storage, world.snapshotFileId);
  try {
    const applied = applySharedWorldCommand(snapshot, nationId, body.payload ?? {});
    const updatedWorld = await replaceSnapshot(db, storage, world, applied.state);
    const completed = await db.updateRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: command.$id, data: { status: 'applied' } });
    return { command: completed, world: updatedWorld, state: applied.state, messages: applied.messages };
  } catch (error) {
    await db.updateRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: command.$id, data: { status: 'rejected' } }).catch(() => undefined);
    throw error;
  }
}

async function releaseExpiredControls(db, worldId, controls, nowMs) {
  const expired = controls.filter((control) => control.controllerUserId && !isControlActive(control, nowMs));
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
  let world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  if (world.status !== 'active' || world.phase !== 'planning' || !world.snapshotFileId) return null;
  const nowMs = options.nowMs ?? Date.now();
  const controls = await releaseExpiredControls(db, worldId, await listControls(db, worldId), nowMs);
  if (options.requireActivity && !wasWorldActiveDuringWindow(world, await listMemberships(db, worldId))) return null;
  if (!controls.length && world.pauseWhenEmpty) return null;
  const snapshot = await readSnapshot(storage, world.snapshotFileId);
  const state = advanceSharedWorld(snapshot, controls.map((row) => row.nationId));
  const updated = await replaceSnapshot(db, storage, world, state, 1, 1);
  const pending = await listTurnCommands(db, worldId, world.turn, [Query.equal('status', 'pending')]);
  await Promise.all(pending.map((row) => db.updateRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: row.$id, data: { status: 'resolved' } })));
  return { world: updated, state };
}

async function resolveDueWorlds(db, storage, nowMs = Date.now()) {
  const due = (await listActiveWorlds(db)).filter((world) => isWorldDue(world, nowMs));
  const results = [];
  for (const world of due) {
    try {
      const resolved = await resolveWorld(db, storage, world.$id, { requireActivity: true, nowMs });
      results.push({ worldId: world.$id, resolved: !!resolved });
    } catch (cause) {
      results.push({ worldId: world.$id, resolved: false, error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
  return results;
}

async function setReady(db, storage, worldId, nationId, userId, body) {
  await requireControl(db, worldId, nationId, userId);
  const world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  if (Number(body.baseRevision) !== world.revision) throw new Error('版图已更新，请刷新后重试');
  const key = String(body.idempotencyKey ?? `ready:${worldId}:${world.turn}:${nationId}`);
  try {
    await db.createRow({ databaseId: DATABASE_ID, tableId: COMMAND_TABLE, rowId: commandId(key), data: { worldId, nationId, userId, turn: world.turn, baseRevision: world.revision, commandType: 'set_ready', idempotencyKey: key, payload: '{}', status: 'pending', createdAt: new Date().toISOString() }, permissions: userPermissions(userId) });
  } catch (error) { if (error?.code !== 409) throw error; }
  const controls = (await listControls(db, worldId)).filter((row) => row.controllerUserId && row.status === 'controlled');
  const ready = await listTurnCommands(db, worldId, world.turn, [Query.equal('commandType', 'set_ready'), Query.equal('status', 'pending')]);
  const readyNations = new Set(ready.map((row) => row.nationId));
  if (controls.every((control) => readyNations.has(control.nationId))) return { ready: true, resolved: await resolveWorld(db, storage, worldId) };
  return { ready: true, readyCount: readyNations.size, requiredCount: controls.length };
}

export default async ({ req, res, error }) => {
  try {
    const { db, storage } = services(req);
    if (req.headers['x-appwrite-trigger'] === 'schedule') {
      const results = await resolveDueWorlds(db, storage);
      return res.json({ ok: true, checked: results.length, results });
    }
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '需要登录后操作共享版图' }, 401);
    const body = req.bodyJson ?? {};
    const { action, worldId, nationId } = body;
    if (!worldId || typeof worldId !== 'string') return res.json({ ok: false, message: '缺少版图标识' }, 400);
    const now = new Date();
    await ensureMembership(db, worldId, userId, now);
    if (action === 'join_world') return res.json({ ok: true });
    if (action === 'list_controls') return res.json({ ok: true, controls: await listControls(db, worldId) });
    if (action === 'enter_world') {
      await requireControl(db, worldId, nationId, userId);
      let world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
      world = await initializeWorld(db, storage, world);
      return res.json({ ok: true, world, state: await readSnapshot(storage, world.snapshotFileId), controls: await listControls(db, worldId) });
    }
    if (action === 'submit_command') {
      const result = await submitCommand(db, storage, worldId, nationId, userId, body);
      return res.json({ ok: true, ...result });
    }
    if (action === 'set_ready') return res.json({ ok: true, ...(await setReady(db, storage, worldId, nationId, userId, body)) });
    if (!['claim_nation', 'release_nation', 'renew_control'].includes(action)) return res.json({ ok: false, message: '不支持的共享版图操作' }, 400);
    return res.json({ ok: true, control: await mutateControl(db, action, worldId, nationId, userId, now) });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : 400;
    return res.json({ ok: false, message: cause instanceof Error ? cause.message : '共享版图操作失败' }, status);
  }
};
