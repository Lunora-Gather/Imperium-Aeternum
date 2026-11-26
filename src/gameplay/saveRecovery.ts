// 存档恢复预检：只读分析槽位健康度，不提前修改 localStorage。
// 与 V14 readiness + V15 hygiene 形成闭环：预览问题、展示修复项、读档时再真正迁移写回。

import type { GameState } from '../types/game';
import { SAVE_VERSION, SLOT_COUNT, migrateParsedSave, readSaveGameFromSlot, recoverMigratedSave, slotStorageValue, readStoredSave, type SlotReadResult } from '../store/persistence';
import { buildReadinessReport } from './readiness';

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
  storageSavingsPercent?: number;
  compactedKB?: number;
  version?: number;
  createdAt?: string;
  turn?: number;
  nationName?: string;
  defeated?: boolean;
  score?: number;
  devIssueCount?: number;
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

function inspectCurrentSlot(slot: number, read: SlotReadResult): SaveRecoveryPreview {
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
    const hadTransientRelMap = !!read.save.gameState?._relMap;
    const migrated = migrateParsedSave(read.save);
    const migratedState = migrated.gameState;
    const compacted = recoverMigratedSave(migrated);
    const repairedState = compacted.gameState;
    const beforeReport = safeReadiness(migratedState);
    const afterReport = buildReadinessReport(repairedState);

    const repairs = structuralRepairs(migratedState, repairedState);
    if (hadTransientRelMap) repairs.unshift('清理临时外交缓存');
    if (originalVersion < SAVE_VERSION) repairs.unshift(`升级存档架构 v${originalVersion || '?'} → v${SAVE_VERSION}`);
    const compactedKB = Math.round(new Blob([JSON.stringify(compacted)]).size / 1024);
    if (read.sizeKB - compactedKB >= 64) repairs.push(`瘦身约 ${read.sizeKB - compactedKB}KB`);

    const devBefore = beforeReport?.devChecks.length ?? 0;
    const devAfter = afterReport.devChecks.length;
    if (devBefore > devAfter) repairs.push(`修复开发体检项 ${devBefore - devAfter} 项`);

    const score = afterReport.score;
    const status: SaveRecoveryStatus = devAfter > 0 || afterReport.blockers.length > 0
      ? 'risky'
      : repairs.length > 0
        ? 'repairable'
        : 'healthy';
    const tone: SaveRecoveryTone = status === 'healthy' ? 'good' : 'warn';
    const label = status === 'healthy' ? '健康' : status === 'risky' ? '可读但有风险' : '可自动修复';

    return {
      slot,
      status,
      tone,
      label,
      details: [
        `第 ${repairedState.turn + 1} 年`,
        nationName(repairedState) ?? '未知国家',
        `体检 ${score}/100`,
        devAfter > 0 ? `仍有开发体检项 ${devAfter} 项` : '结构体检通过',
      ],
      repairs: [...new Set(repairs)].slice(0, 6),
      savedKB: read.sizeKB,
      storageSavingsPercent: read.stored === read.raw ? undefined : Math.round(100 * (1 - read.stored.length / read.raw.length)),
      compactedKB,
      version: originalVersion,
      createdAt: read.save.createdAt,
      turn: repairedState.turn,
      defeated: repairedState.victory.type?.startsWith('fail'),
      nationName: nationName(repairedState),
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

export function inspectStoredSlot(slot: number, stored: string): SaveRecoveryPreview {
  return inspectCurrentSlot(slot, readStoredSave(stored));
}

// Reading a slot's exact storage value also detects changes from another tab.
// Cache only the summary, never a mutable game state or a successful load.
const previews = new Map<number, { stored: string; preview: SaveRecoveryPreview }>();

export function cachedSavePreview(slot: number, stored: string | null): SaveRecoveryPreview | undefined {
  if (stored === null) {
    previews.delete(slot);
    return inspectCurrentSlot(slot, readStoredSave(null));
  }
  const cached = previews.get(slot);
  if (cached?.stored !== stored) return;
  return { ...cached.preview, details: [...cached.preview.details], repairs: [...cached.preview.repairs] };
}

export function cacheSavePreview(slot: number, stored: string, preview: SaveRecoveryPreview) {
  previews.set(slot, { stored, preview });
}

export function inspectSaveSlot(slot: number): SaveRecoveryPreview {
  let stored: string | null;
  try { stored = slotStorageValue(slot); } catch { return inspectCurrentSlot(slot, readSaveGameFromSlot(slot)); }
  const cached = cachedSavePreview(slot, stored);
  if (cached) return cached;
  const preview = inspectCurrentSlot(slot, readStoredSave(stored));
  if (stored !== null) cacheSavePreview(slot, stored, preview);
  return { ...preview, details: [...preview.details], repairs: [...preview.repairs] };
}

export function inspectAllSaveSlots(slotCount = SLOT_COUNT): SaveRecoveryPreview[] {
  return Array.from({ length: slotCount }, (_, slot) => inspectSaveSlot(slot));
}
