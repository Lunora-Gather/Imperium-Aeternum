import type { GameState } from '../types/game';
import { syncAmbitionMeta } from './ambitions';
import { initializeNationalPurpose } from './nationalPurpose';
import { sanitizeState } from './stateHygiene';

export function prepareGameState(state: GameState, resourcePrecision: 'round' | 'preserve' = 'round'): GameState {
  return sanitizeState(initializeNationalPurpose(syncAmbitionMeta(state)), resourcePrecision);
}
