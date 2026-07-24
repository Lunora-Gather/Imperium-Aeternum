import { buildAIQuotaPlan } from './policy.js';

const DATABASE_ID = 'imperium_game';
const USAGE_TABLE = 'ai_usage';

async function changeQuota(db, plan, delta, enforceLimits) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const tx = await db.createTransaction();
    try {
      const rows = [];
      for (const entry of plan) {
        try {
          rows.push(await db.getRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId: entry.rowId, transactionId: tx.$id }));
        } catch (error) {
          if (error?.code !== 404) throw error;
          rows.push(null);
        }
      }
      if (enforceLimits) {
        const blocked = plan.find((entry, index) => Number(rows[index]?.count ?? 0) >= entry.limit);
        if (blocked) throw new Error(`${blocked.message}（${blocked.limit} 次）`);
      }
      for (let index = 0; index < plan.length; index += 1) {
        const entry = plan[index];
        const current = rows[index];
        const count = Math.max(0, Number(current?.count ?? 0) + delta);
        if (!current && delta < 0) continue;
        if (current) await db.updateRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId: entry.rowId, transactionId: tx.$id, data: { count, updatedAt: new Date().toISOString() } });
        else await db.createRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId: entry.rowId, transactionId: tx.$id, data: { userKey: entry.userKey, day: entry.period, count, updatedAt: new Date().toISOString() } });
      }
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
      return plan.map((entry, index) => ({ ...entry, used: Math.max(0, Number(rows[index]?.count ?? 0) + delta) }));
    } catch (error) {
      await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
      if (error?.code === 409 && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error('AI 配额并发校验失败，请稍后重试');
}

export async function reserveAIQuota(db, userId, env = process.env) {
  const plan = buildAIQuotaPlan(userId, env);
  const counters = await changeQuota(db, plan, 1, true);
  const user = counters.find((entry) => entry.scope === 'user');
  return { plan, quota: { used: user.used, limit: user.limit } };
}

export async function releaseAIQuota(db, plan) {
  await changeQuota(db, plan, -1, false);
}
