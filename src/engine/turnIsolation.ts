// 回合隔离边界：为仍含 mutation 的旧回合引擎提供可复用的纯输入保护。
// 这一层不改变结算规则，只保证调用方传入的 GameState 不会被 processTurn 的内部 mutation 污染。

import type { GameState, TurnReport } from '../types/game';
import { processTurn } from './turn';
import { cloneGameState } from './stateClone';

export function cloneGameStateForTurn(state: GameState): GameState {
  return cloneGameState(state);
}

export function processTurnIsolated(state: GameState): { state: GameState; report: TurnReport } {
  // processTurn 本身已建立输入隔离；保留此 API 作为旧调用方的语义化入口。
  const result = processTurn(state);
  result.state._relMap = undefined;
  return result;
}
