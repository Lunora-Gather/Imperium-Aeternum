// 省份所有权合约：国家实体与合法中立势力都属于有效 ownerId。

import type { GameState } from '../types/game';

export const NEUTRAL_PROVINCE_OWNER_IDS = new Set(['barbarian']);

export function isValidProvinceOwner(state: Pick<GameState, 'nations'>, ownerId: string): boolean {
  return !!state.nations[ownerId] || NEUTRAL_PROVINCE_OWNER_IDS.has(ownerId);
}
