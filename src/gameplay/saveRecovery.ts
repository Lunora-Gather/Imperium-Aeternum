// 存档恢复预检：只读分析槽位健康度，不提前修改 localStorage。
// 与 V14 readiness + V15 hygiene 形成闭环：预览问题、展示修复项、读档时再真正迁移写回。

import type { SaveGame, GameState } from '../types/game';
import { SAVE_VERSION, compactGameStateForSave, migrate, readSaveGameFromSlot } from '../store/persistence';
import { buildReadinessReport } from './readiness';
import { sanitizeState } from './stateHygiene';

export type SaveRecoveryStatus = 'empty' | 'healthy' | 'repairable' | 'risky' | 'broken';
export type SaveRecoveryTone = 'good' | 'warn' | 'danger' | 'info';

export interface SaveRecoveryPreview {
  slot: number;
  status: SaveRecoveryStatus;
  tone: SaveRecoveryTone;
  label: string;
  details: string[];
  repairs: string[];
  savedKB?: number;
  compactedKB?: number;
  version?: number;
  turn?: number;
  nationName?: string;
  score?: number;
  devIssueCount?: number;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sizeKB(value: unknown): number {
  return Math.max(1, Math.round(JSON.stringify(value).length / 1024));
}

function safeMigrate(save: SaveGame): SaveGame {
  return migrate(clone(save));
}

function safeReadiness(state: GameState) {
  try {
    return buildReadinessReport(state);
  } catch {
    return null;
  }
}

function nationName(state: GameState | undefined): string | undefined {
  const pid = state?.playerNationId;
  return pid ? state?.nations?.[pid]?.name : undefined;
}

function structuralRepairs(before: GameState, after: GameState): string[] {
  const repairs: string[] = [];
  if ((before as GameState)._relMap && !after._relMap) repairs.push('清理临时外交缓存');
  if ((before.wars?.length ?? 0) !== (after.wars?.length ?? 0)) repairs.push('移除无效或重复战争');
  if ((before.relations?.length ?? 0) !== (after.relations?.length ?? 0)) repairs.push('补齐/去重外交关系');
  if ((before.history?.length ?? 0) !== (after.history?.length ?? 0)) repairs.push('裁剪历史趋势缓存');
  if ((before.chronicle?.length ?? 0) !== (after.chronicle?.length ?? 0)) repairs.push('裁剪史册缓存');

  const beforePlayer = before.nations?.[before.playerNationId];
  const afterPlayer = after.nations?.[after.playerNationId];
  if (beforePlayer && afterPlayer) {
    if (beforePlayer.army?.length !== afterPlayer.army?.length) repairs.push('清理无效军队');
    if (JSON.stringify(beforePlayer.army?.map((a) => a.location)) !== JSON.stringify(afterPlayer.army?.map((a) => a.location))) repairs.push('修复军队所在省份');
    if (beforePlayer.government?.stability !== afterPlayer.government?.stability || beforePlayer.government?.corruption !== afterPlayer.government?.corruption) repairs.push('规整治理数值');
  }
  return [...new Set(repairs)];
}

export function inspectSaveSlot(slot: number): SaveRecoveryPreview {
  const read = readSaveGameFromSlot(slot);
  if (!read.ok) {
    return {
      slot,
      status: read.empty ? 'empty' : 'broken',
      tone: read.empty ? 'info' : 'danger',
      label: read.empty ? '空槽位' : '损坏',
      details: [read.error],
      repairs: [],
    };
  }

  try {
    const originalVersion = read.save.version ?? 0;
    const migrated = safeMigrate(read.save);
    const migratedState = migrated.gameState;
    const repairedState = sanitizeState(migratedState);
    const compacted = { ...migrated, version: SAVE_VERSION, gameState: compactGameStateForSave(repairedState) };
    const beforeReport = safeReadiness(migratedState);
    const afterReport = safeReadiness(repairedState);

    const repairs = structuralRepairs(migratedState, repairedState);
    if (originalVersion < SAVE_VERSION) repairs.unshift(`升级存档架构 v${originalVersion || '?'} → v${SAVE_VERSION}`);
    const compactedKB = sizeKB(compacted);
    if (read.sizeKB - compactedKB >= 64) repairs.push(`瘦身约 ${read.sizeKB - compactedKB}KB`);

    const devBefore = beforeReport?.devChecks.length ?? 0;
    const devAfter = afterReport?.devChecks.length ?? 0;
    if (devBefore > devAfter) repairs.push(`修复开发体检项 ${devBefore - devAfter} 项`);

    const score = afterReport?.score ?? 0;
    const status: SaveRecoveryStatus = devAfter > 0 || (afterReport?.blockers.length ?? 0) > 0
      ? 'risky'
      : repairs.length > 0
        ? 'repairable'
        : 'healthy';
    const tone: SaveRecoveryTone = status === 'healthy' ? 'good' : status === 'risky' ? 'warn' : 'warn';
    const label = status === 'healthy' ? '健康' : status === 'risky' ? '可读但有风险' : '可自动修复';

    return {
      slot,
      status,
      tone,
      label,
      details: [
        `第 ${(migratedState.turn ?? 0) + 1} 年`,
        nationName(migratedState) ?? '未知国家',
        `体检 ${score}/100`,
        devAfter > 0 ? `仍有开发体检项 ${devAfter} 项` : '结构体检通过',
      ],
      repairs: [...new Set(repairs)].slice(0, 6),
      savedKB: read.sizeKB,
      compactedKB,
      version: originalVersion,
      turn: migratedState.turn ?? 0,
      nationName: nationName(migratedState),
      score,
      devIssueCount: devAfter,
    };
  } catch (e) {
    return {
      slot,
      status: 'broken',
      tone: 'danger',
      label: '无法恢复',
      details: [`预检失败：${(e as Error).message}`],
      repairs: [],
      savedKB: read.sizeKB,
    };
  }
}

export function inspectAllSaveSlots(slotCount = 5): SaveRecoveryPreview[] {
  return Array.from({ length: slotCount }, (_, slot) => inspectSaveSlot(slot));
}
