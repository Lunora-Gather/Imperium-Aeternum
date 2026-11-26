import { ExecutionMethod, Query, type Models } from 'appwrite';
import type { NationControl, SharedWorldInstance, WorldTickPolicy } from '../../shared-world/types';
import type { GameState } from '../../types/game';
import { APPWRITE_CONFIG, tableRowChannel } from './config';
import { getAppwriteServices } from './client';

export interface SharedWorldRow extends Models.Row {
  templateId: string;
  name: string;
  status: SharedWorldInstance['status'];
  phase: SharedWorldInstance['phase'];
  turn: number;
  revision: number;
  nationCount: number;
  snapshotFileId: string | null;
  planningDeadlineAt: string;
  planningWindowSeconds: number;
  pauseWhenEmpty: boolean;
  caretakerEnabled: boolean;
  maxNationsPerUser: number;
}

export interface NationControlRow extends Models.Row {
  worldId: string;
  nationId: string;
  nationName: string;
  controllerUserId: string | null;
  status: NationControl['status'];
  unavailable?: NationControl['unavailable'];
  claimedAt: string | null;
  releasedAt: string | null;
  leaseExpiresAt: string | null;
  lastActiveAt: string | null;
  version: number;
}

function toWorld(row: SharedWorldRow): SharedWorldInstance {
  const tickPolicy: WorldTickPolicy = {
    planningWindowSeconds: row.planningWindowSeconds,
    pauseWhenEmpty: row.pauseWhenEmpty,
    caretakerEnabled: row.caretakerEnabled,
    maxNationsPerUser: row.maxNationsPerUser,
  };
  return { ...row, id: row.$id, tickPolicy };
}

function toControl(row: NationControlRow): NationControl {
  const expired = row.leaseExpiresAt && Date.parse(row.leaseExpiresAt) <= Date.now();
  return { ...row, id: row.$id, ...(expired && { controllerUserId: null, status: 'available' as const }) };
}

export async function listSharedWorlds(): Promise<SharedWorldInstance[]> {
  const { tablesDB } = getAppwriteServices();
  const worlds = new Map<string, SharedWorldInstance>();
  let cursor: string | undefined;
  do {
    const queries = [Query.equal('status', ['forming', 'active', 'paused']), Query.orderAsc('name'), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await tablesDB.listRows<SharedWorldRow>({
      databaseId: APPWRITE_CONFIG.databaseId, tableId: APPWRITE_CONFIG.worldTableId, queries, total: false, ttl: 0,
    });
    for (const row of page.rows) worlds.set(row.$id, toWorld(row));
    cursor = page.rows.length === 100 ? page.rows[99].$id : undefined;
  } while (cursor);
  return [...worlds.values()];
}

export async function listNationControls(worldId: string): Promise<NationControl[]> {
  const result = await executeGateway('list_controls', worldId);
  return (result.controls ?? []).map(toControl);
}

interface EncodedState {
  state?: GameState;
  stateEncoding?: 'gzip-base64';
  statePayload?: string;
}

interface GatewayResult extends EncodedState {
  ok: boolean;
  message?: string;
  control?: NationControlRow;
  controls?: NationControlRow[];
  world?: SharedWorldRow;
  ready?: boolean;
  readyCount?: number;
  requiredCount?: number;
  resolved?: ({ world: SharedWorldRow } & EncodedState) | null;
}

export async function decodeGatewayState(payload: EncodedState): Promise<GameState | undefined> {
  if (payload.state) return payload.state;
  if (payload.stateEncoding !== 'gzip-base64' || !payload.statePayload) return undefined;
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器版本过旧，无法载入共享版图压缩快照');
  }

  const binary = atob(payload.statePayload);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as GameState;
}

async function executeGateway(action: string, worldId: string, nationId?: string, data: Record<string, unknown> = {}): Promise<GatewayResult> {
  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.worldGatewayFunctionId,
    body: JSON.stringify({ action, worldId, nationId, ...data }),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
  });
  const result = JSON.parse(execution.responseBody || '{}') as GatewayResult;
  if (!result.ok) throw Object.assign(new Error(result.message || '共享版图操作失败'), { code: execution.responseStatusCode });
  return result;
}

export const joinSharedWorld = (worldId: string) => executeGateway('join_world', worldId);
export const claimSharedNation = (worldId: string, nationId: string) => executeGateway('claim_nation', worldId, nationId);
export const releaseSharedNation = (worldId: string, nationId: string) => executeGateway('release_nation', worldId, nationId);
export const renewSharedNationControl = (worldId: string, nationId: string) => executeGateway('renew_control', worldId, nationId);

export async function enterSharedWorld(worldId: string, nationId: string): Promise<{ world: SharedWorldInstance; state: GameState; controls: NationControl[]; ready?: boolean }> {
  const result = await executeGateway('enter_world', worldId, nationId);
  const state = await decodeGatewayState(result);
  if (!result.world || !state) throw new Error('共享版图快照尚未准备完成');
  return { world: toWorld(result.world), state, ready: result.ready, controls: (result.controls ?? []).map(toControl) };
}

export async function syncSharedWorld(worldId: string, nationId: string, baseRevision: number): Promise<{ world: SharedWorldInstance; state?: GameState; ready?: boolean } | null> {
  const result = await executeGateway('sync_world', worldId, nationId, { baseRevision });
  const state = await decodeGatewayState(result);
  return result.world ? { world: toWorld(result.world), state, ready: result.ready } : null;
}

function retryOnConnectionFailure(send: () => Promise<GatewayResult>) {
  return send().catch((error) => {
    if (error instanceof TypeError || Number(error?.code) >= 500) return send();
    throw error;
  });
}

export async function submitSharedWorldAction(worldId: string, nationId: string, baseRevision: number, commandType: string, action: string, args: unknown[]): Promise<{ world: SharedWorldInstance; state: GameState }> {
  const request = { baseRevision, commandType, idempotencyKey: crypto.randomUUID(), payload: { action, args } };
  const result = await retryOnConnectionFailure(() => executeGateway('submit_command', worldId, nationId, request));
  const state = await decodeGatewayState(result);
  if (!result.world || !state) throw new Error('共享行动没有返回最新世界状态');
  return { world: toWorld(result.world), state };
}

export async function markSharedWorldReady(worldId: string, nationId: string, baseRevision: number, turn: number): Promise<{ resolved: boolean; world?: SharedWorldInstance; state?: GameState; readyCount?: number; requiredCount?: number }> {
  const result = await retryOnConnectionFailure(() => executeGateway('set_ready', worldId, nationId, { baseRevision, turn }));
  const state = result.resolved ? await decodeGatewayState(result.resolved) : undefined;
  return { resolved: !!result.resolved, world: result.resolved?.world ? toWorld(result.resolved.world) : undefined, state, readyCount: result.readyCount, requiredCount: result.requiredCount };
}

export type LobbyChange = 'world' | 'controls';

export async function subscribeToWorldLobby(worldId: string, onChange: (part: LobbyChange) => void): Promise<() => Promise<void>> {
  const { realtime } = getAppwriteServices();
  const world = await realtime.subscribe(tableRowChannel(APPWRITE_CONFIG.worldTableId, worldId), () => onChange('world'));
  try {
    const controls = await realtime.subscribe<NationControlRow>(
      tableRowChannel(APPWRITE_CONFIG.nationControlTableId),
      ({ payload }) => { if (payload.worldId === worldId) onChange('controls'); },
      [Query.equal('worldId', worldId)],
    );
    return async () => { await Promise.all([world.unsubscribe(), controls.unsubscribe()]); };
  } catch (error) {
    await world.unsubscribe();
    throw error;
  }
}
