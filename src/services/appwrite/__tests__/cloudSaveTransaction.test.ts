import { describe, expect, it, vi } from 'vitest';
import { commitUploadedSave } from '../../../../functions/cloud-save-gateway/src/transaction.js';

const metadata = {
  saveVersion: 7,
  turn: 4,
  nationName: '罗马',
  deviceId: 'device-a',
  contentHash: 'new-hash',
  clientUpdatedAt: '2026-07-23T00:00:00.000Z',
};

function storageMock() {
  return { deleteFile: vi.fn().mockResolvedValue(undefined) };
}

describe('cloud save transactional replacement', () => {
  it('removes the uploaded file when a transaction cannot be opened', async () => {
    const failure = Object.assign(new Error('unavailable'), { code: 503 });
    const db = { createTransaction: vi.fn().mockRejectedValue(failure) };
    const storage = storageMock();

    await expect(commitUploadedSave(db, storage, 'user-a', 1, { $id: 'new-file' }, metadata, {}, [])).rejects.toThrow('unavailable');
    expect(storage.deleteFile).toHaveBeenCalledWith({ bucketId: 'cloud_saves', fileId: 'new-file' });
  });

  it('drops a redundant upload instead of replacing the existing identical row', async () => {
    const db = {
      createTransaction: vi.fn().mockResolvedValue({ $id: 'tx-1' }),
      getRow: vi.fn().mockResolvedValue({ $id: 'row-1', contentHash: 'new-hash', fileId: 'current-file' }),
      updateTransaction: vi.fn().mockResolvedValue(undefined),
      upsertRow: vi.fn(),
    };
    const storage = storageMock();

    const row = await commitUploadedSave(db, storage, 'user-a', 1, { $id: 'new-file' }, metadata, {}, []);
    expect(row).toEqual(expect.objectContaining({ fileId: 'current-file' }));
    expect(db.upsertRow).not.toHaveBeenCalled();
    expect(storage.deleteFile).toHaveBeenCalledWith({ bucketId: 'cloud_saves', fileId: 'new-file' });
  });

  it('rechecks the row after a concurrent commit conflict', async () => {
    const conflict = Object.assign(new Error('conflict'), { code: 409 });
    const db = {
      createTransaction: vi.fn()
        .mockResolvedValueOnce({ $id: 'tx-1' })
        .mockResolvedValueOnce({ $id: 'tx-2' }),
      getRow: vi.fn()
        .mockResolvedValueOnce({ $id: 'row-1', contentHash: 'old-hash', fileId: 'old-file', deviceId: 'device-a', clientUpdatedAt: '2026-07-22T00:00:00.000Z' })
        .mockResolvedValueOnce({ $id: 'row-1', contentHash: 'new-hash', fileId: 'winner-file' }),
      upsertRow: vi.fn().mockResolvedValue({ $id: 'row-1', fileId: 'new-file' }),
      updateTransaction: vi.fn()
        .mockRejectedValueOnce(conflict)
        .mockResolvedValue(undefined),
    };
    const storage = storageMock();

    const row = await commitUploadedSave(db, storage, 'user-a', 1, { $id: 'new-file' }, metadata, { baseHash: 'old-hash' }, []);
    expect(row).toEqual(expect.objectContaining({ fileId: 'winner-file' }));
    expect(db.createTransaction).toHaveBeenCalledTimes(2);
    expect(storage.deleteFile).toHaveBeenCalledWith({ bucketId: 'cloud_saves', fileId: 'new-file' });
  });

  it('requires another choice when the version confirmed on screen has since changed', async () => {
    const db = {
      createTransaction: vi.fn().mockResolvedValue({ $id: 'tx' }),
      getRow: vi.fn().mockResolvedValue({ contentHash: 'third', fileId: 'third-file', deviceId: 'device-a' }),
      updateTransaction: vi.fn().mockResolvedValue(undefined), upsertRow: vi.fn(),
    };
    const storage = storageMock();
    await expect(commitUploadedSave(db, storage, 'a', 1, { $id: 'new' }, metadata,
      { force: true, baseHash: 'second' }, [])).rejects.toMatchObject({ code: 409, cloudHash: 'third' });
    expect(db.upsertRow).not.toHaveBeenCalled();
  });

  it('retains the active payload when the commit succeeds but its reply is lost', async () => {
    const current = { fileId: 'new', ...metadata };
    const db = {
      createTransaction: vi.fn().mockResolvedValue({ $id: 'tx' }),
      getRow: vi.fn().mockResolvedValueOnce({ contentHash: 'old', fileId: 'old-file', deviceId: metadata.deviceId }).mockResolvedValue(current),
      upsertRow: vi.fn().mockResolvedValue(current), updateTransaction: vi.fn().mockRejectedValue(new Error('lost acknowledgement')),
    };
    const storage = storageMock();
    expect(await commitUploadedSave(db, storage, 'a', 1, { $id: 'new' }, metadata, {}, [])).toEqual(current);
    expect(storage.deleteFile).not.toHaveBeenCalledWith({ bucketId: 'cloud_saves', fileId: 'new' });
  });

  it('asks a legacy client to confirm a divergent save from another device even if its clock is ahead', async () => {
    const previous = { contentHash: 'other', deviceId: 'other-device', clientUpdatedAt: '2026-07-22T00:00:00.000Z' };
    const db = { createTransaction: vi.fn().mockResolvedValue({ $id: 'tx' }), getRow: vi.fn().mockResolvedValue(previous),
      updateTransaction: vi.fn().mockResolvedValue(undefined), upsertRow: vi.fn() };
    await expect(commitUploadedSave(db, storageMock(), 'a', 1, { $id: 'new' }, metadata, {}, [])).rejects.toMatchObject({ code: 409, cloudHash: 'other' });
    expect(db.upsertRow).not.toHaveBeenCalled();
  });
});
