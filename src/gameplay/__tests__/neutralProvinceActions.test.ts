import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { developProvinceAction } from '../actions/provinceActions';

function frontier() {
  const state = createInitialState();
  const player = state.nations[state.playerNationId];
  const owned = Object.values(state.provinces).find((province) => province.ownerId === player.id)!;
  const neutral = Object.values(state.provinces).find((province) => province.ownerId === 'barbarian');
  expect(neutral).toBeTruthy();
  if (!neutral) throw new Error('Classic fixture has no neutral frontier');
  if (!neutral.adjacent.includes(owned.id)) neutral.adjacent.push(owned.id);
  if (!owned.adjacent.includes(neutral.id)) owned.adjacent.push(neutral.id);
  neutral.garrison = 0;
  player.resources.adminPt = 10;
  player.resources.gold = 1000;
  player.resources.food = 1000;
  player.resources.influence = 100;
  player.resources.supply = 200;
  return { state, player, neutral };
}

describe('neutral province expansion', () => {
  it('negotiates a stable accession with explicit costs', () => {
    const { state, player, neutral } = frontier();
    const result = developProvinceAction(state, neutral.id, 'neutral_negotiate');
    expect(result.ok).toBe(true);
    expect(result.state.provinces[neutral.id]).toMatchObject({ ownerId: player.id, loyalty: 55 });
    expect(result.state.nations[player.id].resources).toMatchObject({ gold: 920, influence: 60, adminPt: 8 });
  });

  it('makes military occupation fast but creates unrest and exhaustion', () => {
    const { state, player, neutral } = frontier();
    const result = developProvinceAction(state, neutral.id, 'neutral_occupy');
    expect(result.ok).toBe(true);
    expect(result.state.provinces[neutral.id].unrest).toBeGreaterThanOrEqual(60);
    expect(result.state.nations[player.id].warExhaustion).toBe(4);
  });

  it('rejects non-adjacent neutral expansion without spending anything', () => {
    const { state } = frontier();
    const remote = Object.values(state.provinces).find((province) => province.ownerId !== state.playerNationId && !province.adjacent.some((id) => state.provinces[id]?.ownerId === state.playerNationId));
    expect(remote).toBeTruthy();
    if (!remote) return;
    remote.ownerId = 'barbarian';
    const result = developProvinceAction(state, remote.id, 'neutral_colonize');
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
  });
});
