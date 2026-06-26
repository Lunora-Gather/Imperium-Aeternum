import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildVictoryRoutes, bestVictoryRoute } from '../victoryRoutes';
import type { AmbitionSnapshot } from '../ambitions';

const snapshot: AmbitionSnapshot = {
  conquest: { current: 4, target: 10, done: false },
  economy: { current: 1500, target: 2000, turns: 4, needTurns: 6, done: false },
  diplomacy: { influence: 180, influenceTarget: 200, goodRelations: 5, goodTarget: 5, done: false },
  eternal: { turns: 10, target: 80, done: false },
  worldScale: 'local',
};

describe('victory route dashboard', () => {
  it('builds four route cards sorted by progress', () => {
    const state = createInitialState();
    const routes = buildVictoryRoutes(state, snapshot);

    expect(routes).toHaveLength(4);
    expect(routes[0]).toMatchObject({ id: 'diplomacy', label: '合纵路线', tab: 'diplomacy' });
    expect(routes[0].progress).toBe(90);
  });

  it('warns conquest route when stability is too low', () => {
    const state = createInitialState();
    state.nations[state.playerNationId].government.stability = 25;

    const route = buildVictoryRoutes(state, snapshot).find((x) => x.id === 'conquest');

    expect(route?.warning).toContain('安定');
    expect(route?.tone).toBe('warn');
  });

  it('warns diplomacy and eternal routes while at war', () => {
    const state = createInitialState();
    const target = Object.values(state.provinces).find((p) => p.ownerId !== state.playerNationId)!;
    state.wars.push({ id: 'route-war', attackerId: state.playerNationId, defenderId: target.ownerId, targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [] });

    const routes = buildVictoryRoutes(state, snapshot);

    expect(routes.find((x) => x.id === 'diplomacy')?.warning).toContain('战争');
    expect(routes.find((x) => x.id === 'eternal')?.warning).toContain('和平');
  });

  it('returns the best route helper', () => {
    const state = createInitialState();

    expect(bestVictoryRoute(state, snapshot).id).toBe('diplomacy');
  });
});
