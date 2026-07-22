import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { applyAIStrategy } from '../strategyFocus';
import { sanitizeState } from '../stateHygiene';

describe('strategy focus integration', () => {
  it('handles classic-map neutral provinces without treating them as nations', () => {
    const state = sanitizeState(createInitialState());
    const neutralBefore = Object.values(state.provinces).filter((province) => province.ownerId === 'barbarian').length;

    const next = applyAIStrategy(state);

    expect(neutralBefore).toBeGreaterThan(0);
    expect(Object.values(next.provinces).filter((province) => province.ownerId === 'barbarian')).toHaveLength(neutralBefore);
  });
});
