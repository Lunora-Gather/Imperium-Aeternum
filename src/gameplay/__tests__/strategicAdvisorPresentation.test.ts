import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildStrategicBrief } from '../strategicAdvisor';

describe('strategic advisor presentation', () => {
  it('uses player-facing faction names in urgent advice', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    const merchants = player.factions.find((faction) => faction.id === 'merchants')!;
    merchants.satisfaction = 10;

    const warning = buildStrategicBrief(state).urgent.find((item) => item.reason === 'faction');

    expect(warning?.body).toContain('商人 满意 10');
    expect(warning?.body).not.toContain('merchants');
  });
});
