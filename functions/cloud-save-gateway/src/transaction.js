import { buildCloudSaveRowId } from './identity.js';

const DATABASE_ID = 'imperium_game';
const SAVE_TABLE = 'cloud_saves';
const SAVE_BUCKET = 'cloud_saves';

export async function currentRow(db, userId, slot, transactionId) {
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

export function checkReplacement(previous, metadata, body) {
  const hash = previous?.contentHash ?? null;
  const stale = body.baseHash !== undefined && body.baseHash !== hash;
  const older = previous && previous.clientUpdatedAt > metadata.clientUpdatedAt;
  const untrackedDevice = previous && body.baseHash === undefined && previous.deviceId !== metadata.deviceId;
  if (stale || (body.force !== true && (untrackedDevice || (older && previous.deviceId === metadata.deviceId)))) {
    throw Object.assign(new Error('云端存档已变化，请比较后重新确认'), { code: 409, cloudHash: hash });
  }
}

export async function commitUploadedSave(db, storage, userId, slot, uploaded, metadata, body, access) {
  const remove = (fileId) => storage.deleteFile({ bucketId: SAVE_BUCKET, fileId }).catch(() => undefined);
  for (let attempt = 0; ; attempt++) {
    let tx, previous, committing = false;
    try {
      tx = await db.createTransaction();
      previous = await currentRow(db, userId, slot, tx.$id);
      if (previous?.contentHash === metadata.contentHash) {
        await db.updateTransaction({ transactionId: tx.$id, rollback: true });
        await remove(uploaded.$id);
        return previous;
      }
      checkReplacement(previous, metadata, body);
      const row = await db.upsertRow({
        databaseId: DATABASE_ID, tableId: SAVE_TABLE, rowId: buildCloudSaveRowId(userId, slot),
        transactionId: tx.$id, data: { userId, slot, fileId: uploaded.$id, ...metadata }, permissions: access,
      });
      committing = true;
      await db.updateTransaction({ transactionId: tx.$id, commit: true });
      if (previous?.fileId) await remove(previous.fileId);
      return row;
    } catch (error) {
      const rolledBack = tx && await db.updateTransaction({ transactionId: tx.$id, rollback: true }).then(() => true, () => false);
      if (error?.code === 409 && error.cloudHash === undefined && attempt < 2) continue;
      if (!committing || error?.code === 409) await remove(uploaded.$id);
      else {
        const current = await currentRow(db, userId, slot).catch(() => null);
        if (current?.fileId === uploaded.$id) {
          if (previous?.fileId) await remove(previous.fileId);
          return current;
        }
        if (rolledBack) await remove(uploaded.$id);
      }
      throw error;
    }
  }
}
