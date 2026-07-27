import { ExecutionMethod, Query, type Models } from 'appwrite';
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
  throw new Error('当前浏览器不支持云存档完整性校验');
}

async function getCloudRow(userId: string, slot: number): Promise<CloudSaveRow | null> {
  const result = await getAppwriteServices().tablesDB.listRows<CloudSaveRow>({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.saveTableId,
    queries: [Query.equal('slot', [slot]), Query.limit(10)],
    total: false,
    ttl: 0,
  });
  return result.rows.find((row) => row.userId === userId) ?? null;
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

export async function uploadLocalSave(_userId: string, slot: number, force = false): Promise<CloudSaveRow> {
  const local = readSaveGameFromSlot(slot);
  if (!local.ok) throw new Error(local.error);

  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.cloudSaveGatewayFunctionId,
    body: JSON.stringify({ action: 'upload_save', slot, raw: local.raw, deviceId: getDeviceId(), force }),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
  });
  const result = JSON.parse(execution.responseBody || '{}') as { ok?: boolean; row?: CloudSaveRow; message?: string };
  if (!result.ok || !result.row) {
    if (execution.responseStatusCode === 409) throw new CloudSaveConflictError(slot, result.message || '云存档存在更新冲突');
    throw new Error(result.message || '云存档上传失败');
  }
  return result.row;
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
  const rawBytes = new TextEncoder().encode(raw);
  if (rawBytes.byteLength > 5 * 1024 * 1024) throw new Error('云存档超过 5MB 安全上限');
  if (await contentHash(raw) !== cloud.contentHash) throw new Error('云存档完整性校验失败，文件可能已损坏');
  const imported = importSaveGameToSlot(slot, raw);
  if (!imported.ok) throw new Error(imported.error);
}
