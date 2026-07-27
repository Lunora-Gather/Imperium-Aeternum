import { buildCloudSaveRowId } from './identity.js';

const DATABASE_ID = 'imperium_game';
const SAVE_TABLE = 'cloud_saves';
const SAVE_BUCKET = 'cloud_saves';

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

export async function commitUploadedSave(db, storage, userId, slot, uploaded, metadata, body, access) {
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
        permissions: access,
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
