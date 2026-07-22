import type { GameState } from '../types/game';

/** Creates a serializable GameState copy and always drops the transient relation cache. */
export function cloneGameState(state: GameState): GameState {
  const serializable = { ...state, _relMap: undefined };
  if (typeof structuredClone === 'function') return structuredClone(serializable) as GameState;
  return JSON.parse(JSON.stringify(serializable)) as GameState;
}
