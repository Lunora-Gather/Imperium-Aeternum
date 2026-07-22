import { Client, Permission, Query, Role, TablesDB } from 'node-appwrite';

const DATABASE_ID = 'imperium_game';
const WORLD_TABLE = 'shared_worlds';
const MEMBERSHIP_TABLE = 'world_memberships';
const CONTROL_TABLE = 'nation_controls';
const LEASE_DAYS = 14;

function hash(value) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}
const membershipId = (worldId, userId) => `mem_${hash(worldId)}_${hash(userId)}`;

function services(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);
  return new TablesDB(client);
}

const userPermissions = (userId) => [Permission.read(Role.user(userId))];
const isoAfterDays = (now, days) => new Date(now.getTime() + days * 86_400_000).toISOString();

async function ensureMembership(db, worldId, userId, now) {
  await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId });
  const rowId = membershipId(worldId, userId);
  const data = { pairKey: `${worldId}:${userId}`, worldId, userId, role: 'member', joinedAt: now.toISOString(), lastSeenAt: now.toISOString() };
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId });
    return db.updateRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data: { lastSeenAt: now.toISOString() } });
  } catch (error) {
    if (error?.code !== 404) throw error;
    return db.createRow({ databaseId: DATABASE_ID, tableId: MEMBERSHIP_TABLE, rowId, data, permissions: userPermissions(userId) });
  }
}

async function mutateControl(db, action, worldId, nationId, userId, now) {
  if (!nationId) throw new Error('缺少国家标识');
  const tx = await db.createTransaction();
  try {
    const world = await db.getRow({ databaseId: DATABASE_ID, tableId: WORLD_TABLE, rowId: worldId, transactionId: tx.$id });
    const controls = await db.listRows({
      databaseId: DATABASE_ID,
      tableId: CONTROL_TABLE,
      queries: [Query.equal('worldId', worldId), Query.equal('nationId', nationId), Query.limit(1)],
      transactionId: tx.$id,
      total: false,
    });
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

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '需要登录后操作共享版图' }, 401);
    const body = req.bodyJson ?? {};
    const { action, worldId, nationId } = body;
    if (!worldId || typeof worldId !== 'string') return res.json({ ok: false, message: '缺少版图标识' }, 400);
    const db = services(req);
    const now = new Date();
    await ensureMembership(db, worldId, userId, now);
    if (action === 'join_world') return res.json({ ok: true });
    if (action === 'list_controls') {
      const controls = await db.listRows({ databaseId: DATABASE_ID, tableId: CONTROL_TABLE, queries: [Query.equal('worldId', worldId), Query.orderAsc('nationName'), Query.limit(100)], total: false });
      return res.json({ ok: true, controls: controls.rows });
    }
    if (!['claim_nation', 'release_nation', 'renew_control'].includes(action)) return res.json({ ok: false, message: '不支持的共享版图操作' }, 400);
    const control = await mutateControl(db, action, worldId, nationId, userId, now);
    return res.json({ ok: true, control });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : 400;
    return res.json({ ok: false, message: cause instanceof Error ? cause.message : '共享版图操作失败' }, status);
  }
};
