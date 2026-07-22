// Imperium Aeternum — 可回放的实体 id 分配

import type { GameState } from '../types/game';

export function entitySequenceFromId(id: unknown): number {
  if (typeof id !== 'string') return 0;
  const match = /^entity_([0-9a-z]+)_/.exec(id);
  if (!match) return 0;
  const value = Number.parseInt(match[1], 36);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

/**
 * 从存档自身分配 id，避免 Date.now/进程级计数器破坏同种子回放与纯函数语义。
 * 计数器是 GameState 的一部分，因此克隆、保存和重新加载后都会继续同一序列。
 */
export function allocateEntityId(state: GameState, prefix = 'id'): string {
  const current = Number.isSafeInteger(state.entityIdCounter) && state.entityIdCounter >= 0
    ? state.entityIdCounter
    : 0;
  state.entityIdCounter = current + 1;
  return `entity_${state.entityIdCounter.toString(36)}_${prefix}`;
}
