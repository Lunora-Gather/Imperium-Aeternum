import { ExecutionMethod, Query, type Models } from 'appwrite';
import { APPWRITE_CONFIG } from './config';
import { getAppwriteServices, storageFileUrl } from './client';
import { MAX_SAVE_BYTES } from '../../store/localSaveCodec';
import {
  storedSlotRaw,
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

export interface SaveVersions { local: string | null; cloud: string | null }

export class CloudSaveConflictError extends Error {
  constructor(public readonly slot: number, message: string, public readonly versions: SaveVersions) {
    super(message);
    this.name = 'CloudSaveConflictError';
  }
}

export function shortHash(value: string): string {
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

async function contentHash(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('当前浏览器不支持云存档完整性校验');
}

async function readCloudFile(response: Response): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('云存档文件为空');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SAVE_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new Error('云存档超过 5MB 安全上限');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function getCloudRow(userId: string, slot: number): Promise<CloudSaveRow | null> {
  const result = await getAppwriteServices().tablesDB.listRows<CloudSaveRow>({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.saveTableId,
    queries: [Query.equal('slot', [slot]), Query.limit(10)],
    total: false,
    ttl: 0,
  });
  return result.rows.find((row) => row.userId === userId && row.slot === slot) ?? null;
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

function versionsKey(userId: string, slot: number) { return `ia-cloud-base:${userId}:${slot}`; }
function syncedVersions(userId: string, slot: number): SaveVersions | null {
  try { return JSON.parse(localStorage.getItem(versionsKey(userId, slot)) ?? 'null'); } catch { return null; }
}
function remember(userId: string, slot: number, versions: SaveVersions) {
  try { localStorage.setItem(versionsKey(userId, slot), JSON.stringify(versions)); } catch { /* The next sync can ask for confirmation again. */ }
}

export function slotFingerprint(slot: number) {
  const raw = storedSlotRaw(slot);
  return raw === null ? null : shortHash(raw);
}

export async function uploadLocalSave(userId: string, slot: number, confirmation?: SaveVersions, active = () => true, queuedLocal?: string): Promise<CloudSaveRow> {
  const local = readSaveGameFromSlot(slot);
  if (!local.ok) throw new Error(local.error);
  const fingerprint = shortHash(local.raw);
  if (queuedLocal !== undefined && fingerprint !== queuedLocal) throw new Error('本地存档已变化，请重新确认');
  const baseHash = confirmation ? confirmation.cloud : syncedVersions(userId, slot)?.cloud ?? null;
  if (confirmation && confirmation.local !== fingerprint) {
    throw new CloudSaveConflictError(slot, '本地存档已变化，请重新确认', { local: fingerprint, cloud: baseHash });
  }
  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.cloudSaveGatewayFunctionId,
    body: JSON.stringify({ action: 'upload_save', userId, slot, raw: local.raw, deviceId: getDeviceId(), force: !!confirmation, baseHash }),
    async: false, xpath: '/', method: ExecutionMethod.POST,
  });
  if (!active()) throw new Error('登录账号已更换');
  const result = JSON.parse(execution.responseBody || '{}');
  if (!result.ok || !result.row) {
    if (execution.responseStatusCode === 409) {
      const cloud = result.cloudHash === undefined ? (await getCloudRow(userId, slot))?.contentHash ?? null : result.cloudHash;
      throw new CloudSaveConflictError(slot, result.message || '云存档存在更新冲突', { local: fingerprint, cloud });
    }
    throw Object.assign(new Error(result.message || '云存档上传失败'), { code: execution.responseStatusCode });
  }
  const row: CloudSaveRow = result.row;
  if (row.userId !== userId || row.slot !== slot) throw new Error('云存档回执不匹配');
  remember(userId, slot, { local: fingerprint, cloud: row.contentHash });
  return row;
}

export async function downloadCloudSave(userId: string, slot: number, confirmation?: SaveVersions, active = () => true): Promise<CloudSaveRow> {
  const rawLocal = storedSlotRaw(slot);
  const starting = rawLocal === null ? null : shortHash(rawLocal);
  let cloud = await getCloudRow(userId, slot);
  for (let attempt = 0; ; attempt++) {
    if (!cloud) throw new Error('该云端槽位为空');
    const versions = { local: slotFingerprint(slot), cloud: cloud.contentHash };
    const conflict = () => new CloudSaveConflictError(slot, '存档已变化，请比较后确认用云端覆盖本地', versions);
    if (versions.local !== starting || (confirmation && (confirmation.local !== starting || confirmation.cloud !== cloud.contentHash))) throw conflict();
    if (!confirmation && rawLocal !== null && syncedVersions(userId, slot)?.local !== starting && await contentHash(new TextEncoder().encode(rawLocal)) !== cloud.contentHash) throw conflict();
    const url = storageFileUrl(APPWRITE_CONFIG.saveBucketId, cloud.fileId, 'download');
    const { uri, options } = getAppwriteServices().client.prepareRequest('GET', url);
    const response = await fetch(uri, options);
    if (!response.ok && response.status !== 404) throw Object.assign(new Error(`云存档下载失败（${response.status}）`), { code: response.status });
    const bytes = response.ok ? await readCloudFile(response) : null;
    if (bytes && await contentHash(bytes) !== cloud.contentHash) throw new Error('云存档完整性校验失败，文件可能已损坏');
    const latest = await getCloudRow(userId, slot);
    if (!active()) throw new Error('登录账号已更换');
    if (latest?.contentHash !== cloud.contentHash || latest.fileId !== cloud.fileId) {
      if (attempt >= 2) throw new Error('云存档持续更新，请稍后重试');
      cloud = latest;
      continue;
    }
    if (!bytes) throw new Error('云存档文件不存在');
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const imported = importSaveGameToSlot(slot, raw, rawLocal);
    if (!imported.ok) {
      if (imported.conflict) {
        versions.local = slotFingerprint(slot);
        throw conflict();
      }
      throw new Error(imported.error);
    }
    remember(userId, slot, { local: shortHash(imported.raw), cloud: cloud.contentHash });
    return latest;
  }
}
