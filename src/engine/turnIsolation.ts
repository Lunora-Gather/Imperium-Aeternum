// 回合隔离边界：为仍含 mutation 的旧回合引擎提供可复用的纯输入保护。
// 这一层不改变结算规则，只保证调用方传入的 GameState 不会被 processTurn 的内部 mutation 污染。

import type { GameState, TurnReport } from '../types/game';
import { processTurn } from './turn';

export function cloneGameStateForTurn(state: GameState): GameState {
  // GameState 目前是纯数据结构；_relMap 是运行时缓存，必须丢弃并允许后续重建。
  return JSON.parse(JSON.stringify({ ...state, _relMap: undefined })) as GameState;
}

export function processTurnIsolated(state: GameState): { state: GameState; report: TurnReport } {
  const working = cloneGameStateForTurn(state);
  const result = processTurn(working);
  result.state._relMap = undefined;
  return result;
}
