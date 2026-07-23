import { Channel, ExecutionMethod, Query, type Models } from 'appwrite';
import type { NationControl, SharedWorldInstance, WorldTickPolicy } from '../../shared-world/types';
import type { GameState } from '../../types/game';
import { APPWRITE_CONFIG } from './config';
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
  return {
    id: row.$id,
    templateId: row.templateId,
    name: row.name,
    status: row.status,
    phase: row.phase,
    turn: row.turn,
    revision: row.revision,
    nationCount: row.nationCount,
    snapshotFileId: row.snapshotFileId,
    planningDeadlineAt: row.planningDeadlineAt,
    tickPolicy,
  };
}

function toControl(row: NationControlRow): NationControl {
  return {
    id: row.$id,
    worldId: row.worldId,
    nationId: row.nationId,
    nationName: row.nationName,
    controllerUserId: row.controllerUserId,
    status: row.status,
    claimedAt: row.claimedAt,
    releasedAt: row.releasedAt,
    leaseExpiresAt: row.leaseExpiresAt,
    lastActiveAt: row.lastActiveAt,
    version: row.version,
  };
}

export async function listSharedWorlds(): Promise<SharedWorldInstance[]> {
  const result = await getAppwriteServices().tablesDB.listRows<SharedWorldRow>({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.worldTableId,
    queries: [Query.equal('status', ['forming', 'active', 'paused']), Query.orderAsc('name'), Query.limit(25)],
    total: false,
    ttl: 0,
  });
  return result.rows.map(toWorld);
}

export async function listNationControls(worldId: string): Promise<NationControl[]> {
  const result = await executeGateway('list_controls', worldId);
  return (result.controls ?? []).map(toControl);
}

interface GatewayResult { ok: boolean; message?: string; control?: NationControlRow; controls?: NationControlRow[]; world?: SharedWorldRow; state?: GameState; ready?: boolean; readyCount?: number; requiredCount?: number; resolved?: { world: SharedWorldRow; state: GameState } | null }

async function executeGateway(action: string, worldId: string, nationId?: string, data: Record<string, unknown> = {}): Promise<GatewayResult> {
  const execution = await getAppwriteServices().functions.createExecution({
    functionId: APPWRITE_CONFIG.worldGatewayFunctionId,
    body: JSON.stringify({ action, worldId, nationId, ...data }),
    async: false,
    xpath: '/',
    method: ExecutionMethod.POST,
  });
  const result = JSON.parse(execution.responseBody || '{}') as GatewayResult;
  if (!result.ok) throw new Error(result.message || '共享版图操作失败');
  return result;
}

export const joinSharedWorld = (worldId: string) => executeGateway('join_world', worldId);
export const claimSharedNation = (worldId: string, nationId: string) => executeGateway('claim_nation', worldId, nationId);
export const releaseSharedNation = (worldId: string, nationId: string) => executeGateway('release_nation', worldId, nationId);
export const renewSharedNationControl = (worldId: string, nationId: string) => executeGateway('renew_control', worldId, nationId);

export async function enterSharedWorld(worldId: string, nationId: string): Promise<{ world: SharedWorldInstance; state: GameState; controls: NationControl[] }> {
  const result = await executeGateway('enter_world', worldId, nationId);
  if (!result.world || !result.state) throw new Error('共享版图快照尚未准备完成');
  return { world: toWorld(result.world), state: result.state, controls: (result.controls ?? []).map(toControl) };
}

export async function submitSharedWorldAction(worldId: string, nationId: string, baseRevision: number, commandType: string, action: string, args: unknown[]): Promise<{ world: SharedWorldInstance; state: GameState }> {
  const result = await executeGateway('submit_command', worldId, nationId, { baseRevision, commandType, idempotencyKey: crypto.randomUUID(), payload: { action, args } });
  if (!result.world || !result.state) throw new Error('共享行动没有返回最新世界状态');
  return { world: toWorld(result.world), state: result.state };
}

export async function markSharedWorldReady(worldId: string, nationId: string, baseRevision: number): Promise<{ resolved: boolean; world?: SharedWorldInstance; state?: GameState; readyCount?: number; requiredCount?: number }> {
  const result = await executeGateway('set_ready', worldId, nationId, { baseRevision, idempotencyKey: `ready:${worldId}:${nationId}:${crypto.randomUUID()}` });
  return { resolved: !!result.resolved, world: result.resolved?.world ? toWorld(result.resolved.world) : undefined, state: result.resolved?.state, readyCount: result.readyCount, requiredCount: result.requiredCount };
}

export async function subscribeToWorldLobby(worldId: string, onChange: () => void): Promise<() => Promise<void>> {
  const { realtime } = getAppwriteServices();
  const subscription = await realtime.subscribe([
    Channel.tablesdb(APPWRITE_CONFIG.databaseId).table(APPWRITE_CONFIG.worldTableId).row(worldId),
    Channel.tablesdb(APPWRITE_CONFIG.databaseId).table(APPWRITE_CONFIG.nationControlTableId).row(),
  ], () => onChange());
  return async () => { await subscription.unsubscribe(); };
}
