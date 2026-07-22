import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { invariantErrors } from '../../gameplay/stateInvariants';
import { useGameStore } from '../gameStore';

describe('GameStore explicit pipeline integration', () => {
  beforeEach(() => {
    useGameStore.setState({ state: createInitialState(), scene: 'menu', log: [], justProcessedTurn: false });
  });

  it('prepares and advances a classic game without runtime installers', () => {
    useGameStore.getState().startScenario('classic');
    const started = useGameStore.getState();
    const owned = Object.values(started.state.provinces).filter((province) => province.ownerId === started.state.playerNationId);

    expect(started.scene).toBe('playing');
    expect(owned).toHaveLength(6);
    expect(started.state.ambitionMeta).toBeDefined();
    expect(invariantErrors(started.state)).toEqual([]);

    const report = started.nextTurn();
    const advanced = useGameStore.getState();
    expect(report?.turn).toBe(1);
    expect(advanced.state.turn).toBe(1);
    expect(advanced.justProcessedTurn).toBe(true);
    expect(advanced.state.lastReport).toEqual(report);
    expect(invariantErrors(advanced.state)).toEqual([]);
  });

  it('stores and applies a typed strategy focus', () => {
    useGameStore.getState().startScenario('classic');
    useGameStore.getState().setStrategyFocus('reform');
    const before = useGameStore.getState().state.nations.n01.resources.sciPt;

    useGameStore.getState().nextTurn();

    expect(useGameStore.getState().state.strategyFocus).toBe('reform');
    expect(useGameStore.getState().state.nations.n01.resources.sciPt).toBeGreaterThanOrEqual(before + 4);
  });
});
