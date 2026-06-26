import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { processTurnSafe } from '../../gameplay/logicGuard';

describe('processTurnSafe immutability guard', () => {
  it('does not mutate the input GameState while producing the next state', () => {
    const before = createInitialState();
    const snapshot = JSON.parse(JSON.stringify({ ...before, _relMap: undefined }));

    const result = processTurnSafe(before);
    const afterCall = JSON.parse(JSON.stringify({ ...before, _relMap: undefined }));

    expect(afterCall).toEqual(snapshot);
    expect(result.state).not.toBe(before);
    expect(result.state.turn).toBe(before.turn + 1);
  });
});
