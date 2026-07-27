import { createHash } from 'node:crypto';
import { Client, ID, Permission, Role, Storage, TablesDB } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { buildCloudSaveRowId } from './identity.js';
import { normalizeCloudSavePayload } from './policy.js';

export { buildCloudSaveRowId } from './identity.js';

const DATABASE_ID = 'imperium_game';
const SAVE_TABLE = 'cloud_saves';
const SAVE_BUCKET = 'cloud_saves';
const MAX_SAVE_BYTES = 5 * 1024 * 1024;

function services(req) {
  const client = new Client().setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);
  return { db: new TablesDB(client), storage: new Storage(client) };
}

const permissions = (userId) => [Permission.read(Role.user(userId))];
const integer = (value, min, max, label) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${label}无效`);
  return parsed;
};

async function currentRow(db, userId, slot, transactionId) {
  try {
    return await db.getRow({
      databaseId: DATABASE_ID,
      tableId: SAVE_TABLE,
      rowId: buildCloudSaveRowId(userId, slot),
      ...(transactionId ? { transactionId } : {}),
    });
  }
  catch (error) { if (error?.code === 404) return null; throw error; }
}

export async function commitUploadedSave(db, storage, userId, slot, uploaded, metadata, body) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let tx;
    try {
      tx = await db.createTransaction();
      const previous = await currentRow(db, userId, slot, tx.$id);
      if (previous?.contentHash === metadata.contentHash) {
        await db.updateTransaction({ transactionId: tx.$id, rollback: true });
        await storage.deleteFile({ bucketId: SAVE_BUCKET, fileId: uploaded.$id }).catch(() => undefined);
        return previous;
      }
      if (
        previous
        && previous.clientUpdatedAt > metadata.clientUpdatedAt
        && previous.deviceId !== metadata.deviceId
        && body.force !== true
      ) {
        const conflict = new Error('云端存在另一设备更新的存档，请先下载比较，或确认覆盖云端');
        conflict.code = 409;
        throw conflict;
      }
      const row = await db.upsertRow({
        databaseId: DATABASE_ID,
        tableId: SAVE_TABLE,
        rowId: buildCloudSaveRowId(userId, slot),
        transactionId: tx.$id,
        data: { userId, slot, fileId: uploaded.$id, ...metadata },
        permissions: permissions(userId),
      });
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
      if (previous?.fileId && previous.fileId !== uploaded.$id) {
        await storage.deleteFile({ bucketId: SAVE_BUCKET, fileId: previous.fileId }).catch(() => undefined);
      }
      return row;
    } catch (error) {
      if (tx) await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
      if (error?.code === 409 && attempt < 2) continue;
      await storage.deleteFile({ bucketId: SAVE_BUCKET, fileId: uploaded.$id }).catch(() => undefined);
      throw error;
    }
  }
  await storage.deleteFile({ bucketId: SAVE_BUCKET, fileId: uploaded.$id }).catch(() => undefined);
  throw new Error('云存档并发写入失败，请稍后重试');
}

async function uploadSave(db, storage, userId, body) {
  const slot = integer(body.slot, 0, 4, '存档槽位');
  const raw = typeof body.raw === 'string' ? body.raw : '';
  const bytes = Buffer.from(raw, 'utf8');
  if (!bytes.length || bytes.length > MAX_SAVE_BYTES) throw new Error('云存档大小需要在 5MB 以内');
  const { saveVersion, turn, nationName, clientUpdatedAt } = normalizeCloudSavePayload(raw);
  const deviceId = String(body.deviceId ?? '').trim().slice(0, 64);
  if (!deviceId) throw new Error('设备标识无效');
  const contentHash = createHash('sha256').update(bytes).digest('hex');
  const previous = await currentRow(db, userId, slot);
  if (previous?.contentHash === contentHash) return previous;
  if (previous && previous.clientUpdatedAt > clientUpdatedAt && previous.deviceId !== deviceId && body.force !== true) {
    const conflict = new Error('云端存在另一设备更新的存档，请先下载比较，或确认覆盖云端');
    conflict.code = 409;
    throw conflict;
  }
  const access = permissions(userId);
  const uploaded = await storage.createFile({ bucketId: SAVE_BUCKET, fileId: ID.unique(), file: InputFile.fromBuffer(bytes, `imperium-slot-${slot}.json`), permissions: access });
  return commitUploadedSave(
    db,
    storage,
    userId,
    slot,
    uploaded,
    { saveVersion, turn, nationName, deviceId, contentHash, clientUpdatedAt },
    body,
  );
}

export default async ({ req, res, error }) => {
  try {
    if (req.method !== 'POST') return res.json({ ok: false, message: '仅支持 POST 请求' }, 405);
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '登录后才能同步云存档' }, 401);
    const body = req.bodyJson ?? {};
    if (body.action !== 'upload_save') return res.json({ ok: false, message: '不支持的云存档操作' }, 400);
    const { db, storage } = services(req);
    return res.json({ ok: true, row: await uploadSave(db, storage, userId, body) });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const appwriteFailure = typeof cause?.code === 'number' && ![404, 409].includes(cause.code);
    const status = cause?.code === 409 ? 409 : cause?.code === 404 ? 404 : appwriteFailure ? 503 : 400;
    const message = appwriteFailure ? '云存档服务暂不可用，请稍后重试' : cause instanceof Error ? cause.message : '云存档同步失败';
    return res.json({ ok: false, message }, status);
  }
};
