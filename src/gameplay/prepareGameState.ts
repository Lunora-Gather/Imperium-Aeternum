import type { GameState } from '../types/game';
import { syncAmbitionMeta } from './ambitions';
import { initializeNationalPurpose } from './nationalPurpose';
import { reviewBorderPact } from './borderPact';
import { sanitizeState } from './stateHygiene';

export function prepareGameState(state: GameState, resourcePrecision: 'round' | 'preserve' = 'round'): GameState {
  const next = sanitizeState(initializeNationalPurpose(syncAmbitionMeta(state)), resourcePrecision);
  reviewBorderPact(next);
  return next;
}
