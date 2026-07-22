import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { processTurn } from '../turn';

describe('dynamic player selection', () => {
  it('uses playerNationId even when the legacy n01 nation is present', () => {
    const state = createInitialState();
    state.playerNationId = 'n02';
    state.nations.n01.isPlayer = false;
    state.nations.n02.isPlayer = true;

    const result = processTurn(state);

    expect(result.report.nationId).toBe('n02');
  });
});
