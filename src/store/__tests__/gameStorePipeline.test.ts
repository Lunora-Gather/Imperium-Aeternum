import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { invariantErrors } from '../../gameplay/stateInvariants';
import { useGameStore } from '../gameStore';

describe('GameStore explicit pipeline integration', () => {
  beforeEach(() => {
    useGameStore.setState({ state: createInitialState(), scene: 'menu', log: [], logSeq: 0, justProcessedTurn: false });
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

  it('continues a completed victory in legacy mode without allowing defeat bypass', () => {
    const won = createInitialState();
    won.turn = 17;
    won.victory.type = 'win_economy';
    useGameStore.setState({ state: won, scene: 'playing' });

    expect(useGameStore.getState().continueLegacy()).toBe(true);
    expect(useGameStore.getState().state.victory.type).toBeNull();
    expect(useGameStore.getState().state.legacyMode).toBe(true);

    const failed = { ...useGameStore.getState().state, victory: { type: 'fail_collapse' } };
    useGameStore.setState({ state: failed });
    expect(useGameStore.getState().continueLegacy()).toBe(false);
    expect(useGameStore.getState().state.victory.type).toBe('fail_collapse');
  });

  it('keeps a monotonic feedback sequence while the visible log rolls and messages repeat', () => {
    for (let index = 1; index <= 35; index += 1) {
      useGameStore.getState().logMsg(`消息 ${index}`);
    }
    useGameStore.getState().logMsg('请先处理待决事件');
    useGameStore.getState().logMsg('请先处理待决事件');

    const current = useGameStore.getState();
    expect(current.log).toHaveLength(31);
    expect(current.log.slice(-2)).toEqual(['请先处理待决事件', '请先处理待决事件']);
    expect(current.logSeq).toBe(37);
  });
});
