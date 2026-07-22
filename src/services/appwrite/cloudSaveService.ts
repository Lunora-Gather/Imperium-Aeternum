import { AppwriteException, ID, Permission, Query, Role, type Models } from 'appwrite';
import { APPWRITE_CONFIG } from './config';
import { getAppwriteServices } from './client';
import {
  getSlotMeta,
  importSaveGameToSlot,
  readSaveGameFromSlot,
} from '../../store/persistence';

export interface CloudSaveRow extends Models.Row {
  userId: string;
  slot: number;
  fileId: string;
  saveVersion: number;
  turn: number;
  nationName: string;
  deviceId: string;
  contentHash: string;
  clientUpdatedAt: string;
}

export class CloudSaveConflictError extends Error {
  constructor(public readonly slot: number, message: string) {
    super(message);
    this.name = 'CloudSaveConflictError';
  }
}

function shortHash(value: string): string {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let i = 0; i < value.length; i += 1) {
    a = Math.imul(a ^ value.charCodeAt(i), 0x01000193);
    b = Math.imul(b ^ value.charCodeAt(i), 0x85ebca6b);
  }
  return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildCloudSaveRowId(userId: string, slot: number): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 14) || 'user';
  return `save_${safe}_${shortHash(userId).slice(0, 12)}_${slot}`;
}

function getDeviceId(): string {
  const key = 'ia-cloud-device-id';
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, created);
    return created;
  } catch {
    return 'unknown-device';
  }
}

async function contentHash(raw: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
  }
  return shortHash(raw);
}

const privatePermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

async function getCloudRow(userId: string, slot: number): Promise<CloudSaveRow | null> {
  try {
    return await getAppwriteServices().tablesDB.getRow<CloudSaveRow>({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.saveTableId,
      rowId: buildCloudSaveRowId(userId, slot),
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}

export async function listCloudSaves(userId: string): Promise<CloudSaveRow[]> {
  const result = await getAppwriteServices().tablesDB.listRows<CloudSaveRow>({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.saveTableId,
    queries: [Query.limit(10), Query.orderAsc('slot')],
    total: false,
    ttl: 0,
  });
  return result.rows.filter((row) => row.userId === userId).sort((a, b) => a.slot - b.slot);
}

export async function uploadLocalSave(userId: string, slot: number, force = false): Promise<CloudSaveRow> {
  const local = readSaveGameFromSlot(slot);
  if (!local.ok) throw new Error(local.error);
  const localMeta = getSlotMeta(slot);
  if (!localMeta) throw new Error('本地存档元数据不可用');

  const hash = await contentHash(local.raw);
  const previous = await getCloudRow(userId, slot);
  if (
    previous
    && previous.contentHash !== hash
    && previous.clientUpdatedAt > localMeta.createdAt
    && previous.deviceId !== getDeviceId()
    && !force
  ) {
    throw new CloudSaveConflictError(slot, '云端存在另一设备更新的存档，请先下载比较，或确认覆盖云端');
  }
  if (previous?.contentHash === hash) return previous;

  const { storage, tablesDB } = getAppwriteServices();
  const permissions = privatePermissions(userId);
  const file = new File([local.raw], `imperium-slot-${slot}.json`, { type: 'application/json' });
  const uploaded = await storage.createFile({
    bucketId: APPWRITE_CONFIG.saveBucketId,
    fileId: ID.unique(),
    file,
    permissions,
  });

  try {
    const row = await tablesDB.upsertRow<CloudSaveRow>({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.saveTableId,
      rowId: buildCloudSaveRowId(userId, slot),
      data: {
        userId,
        slot,
        fileId: uploaded.$id,
        saveVersion: localMeta.version,
        turn: localMeta.turn,
        nationName: localMeta.nationName ?? '未知国家',
        deviceId: getDeviceId(),
        contentHash: hash,
        clientUpdatedAt: localMeta.createdAt,
      },
      permissions,
    });
    if (previous?.fileId && previous.fileId !== uploaded.$id) {
      void storage.deleteFile({ bucketId: APPWRITE_CONFIG.saveBucketId, fileId: previous.fileId }).catch(() => undefined);
    }
    return row;
  } catch (error) {
    void storage.deleteFile({ bucketId: APPWRITE_CONFIG.saveBucketId, fileId: uploaded.$id }).catch(() => undefined);
    throw error;
  }
}

export async function downloadCloudSave(userId: string, slot: number, force = false): Promise<void> {
  const cloud = await getCloudRow(userId, slot);
  if (!cloud) throw new Error('该云端槽位为空');
  const local = readSaveGameFromSlot(slot);
  if (local.ok) {
    const hash = await contentHash(local.raw);
    const meta = getSlotMeta(slot);
    if (
      hash !== cloud.contentHash
      && meta
      && meta.createdAt > cloud.clientUpdatedAt
      && cloud.deviceId !== getDeviceId()
      && !force
    ) {
      throw new CloudSaveConflictError(slot, '本地存档更新，请先上传，或确认用云端覆盖本地');
    }
  }

  const url = getAppwriteServices().storage.getFileDownload({
    bucketId: APPWRITE_CONFIG.saveBucketId,
    fileId: cloud.fileId,
  });
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`云存档下载失败（${response.status}）`);
  const raw = await response.text();
  const imported = importSaveGameToSlot(slot, raw);
  if (!imported.ok) throw new Error(imported.error);
}
