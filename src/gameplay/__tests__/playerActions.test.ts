import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { invariantErrors } from '../stateInvariants';
import { prepareGameState } from '../turnPipeline';
import {
  buildAction,
  culturalExportAction,
  declareWarAction,
  demolishBuildingAction,
  enactPolicyAction,
  formAllianceAction,
  improveRelationAction,
  makePeaceAction,
  recruitAction,
  researchAction,
  setTaxRateAction,
  upgradeBuildingAction,
} from '../actions';

function playerState() {
  const state = prepareGameState(createInitialState());
  const player = state.nations[state.playerNationId];
  const owned = Object.values(state.provinces).find((province) => province.ownerId === player.id)!;
  const foreign = Object.values(state.nations).find((nation) => nation.id !== player.id)!;
  return { state, player, owned, foreign };
}

describe('transactional player actions', () => {
  it('commits a successful build with structural sharing and leaves the input untouched', () => {
    const { state, player, owned } = playerState();
    const unrelatedProvince = Object.values(state.provinces).find((province) => province.id !== owned.id)!;
    const beforeGold = player.resources.gold;
    const beforeBuildings = owned.buildings.length;

    const result = buildAction(state, owned.id, 'farm');

    expect(result.ok).toBe(true);
    expect(result.state).not.toBe(state);
    expect(result.state.nations[player.id]).not.toBe(player);
    expect(result.state.nations[player.id].resources.gold).toBe(beforeGold - 50);
    expect(result.state.provinces[owned.id]).not.toBe(owned);
    expect(result.state.provinces[owned.id].buildings).toHaveLength(beforeBuildings + 1);
    expect(result.state.provinces[unrelatedProvince.id]).toBe(unrelatedProvince);
    expect(state.nations[player.id].resources.gold).toBe(beforeGold);
    expect(state.provinces[owned.id].buildings).toHaveLength(beforeBuildings);
    expect(invariantErrors(result.state)).toEqual([]);
  });

  it('allocates identical persisted ids for identical action histories', () => {
    const left = playerState();
    const right = playerState();

    const a = buildAction(left.state, left.owned.id, 'farm');
    const b = buildAction(right.state, right.owned.id, 'farm');

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const aBuildings = a.state.provinces[left.owned.id].buildings;
    const bBuildings = b.state.provinces[right.owned.id].buildings;
    expect(aBuildings[aBuildings.length - 1]?.id).toBe('entity_1_building');
    expect(aBuildings[aBuildings.length - 1]?.id).toBe(bBuildings[bBuildings.length - 1]?.id);
    expect(a.state.entityIdCounter).toBe(1);
    expect(left.state.entityIdCounter).toBe(0);
  });

  it.each([
    ['negative recruit', (state: ReturnType<typeof createInitialState>) => recruitAction(state, 'p01', -50)],
    ['NaN tax', (state: ReturnType<typeof createInitialState>) => setTaxRateAction(state, Number.NaN)],
    ['missing relation target', (state: ReturnType<typeof createInitialState>) => improveRelationAction(state, 'missing')],
    ['locked cultural export', (state: ReturnType<typeof createInitialState>) => culturalExportAction(state, 'n02')],
  ])('%s fails with the exact original state reference', (_name, execute) => {
    const state = createInitialState();
    const snapshot = JSON.stringify(state);

    const result = execute(state);

    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('never spends resources or AP when an engine validation fails', () => {
    const { state, player } = playerState();
    player.resources.adminPt = 5;
    player.resources.sciPt = 10_000;
    player.resources.gold = 10_000;
    const before = { ...player.resources };

    const result = researchAction(state, 'culture_lv5');

    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(player.resources).toEqual(before);
  });

  it('blocks upgrading and demolishing buildings in foreign provinces', () => {
    const { state, foreign } = playerState();
    const province = Object.values(state.provinces).find((entry) => entry.ownerId === foreign.id)!;
    province.buildings.push({ id: 'enemy_farm', defId: 'farm', provinceId: province.id, level: 1 });

    const upgrade = upgradeBuildingAction(state, province.id, 'enemy_farm');
    const demolish = demolishBuildingAction(state, province.id, 'enemy_farm');

    expect(upgrade.ok).toBe(false);
    expect(demolish.ok).toBe(false);
    expect(upgrade.state).toBe(state);
    expect(demolish.state).toBe(state);
    expect(province.buildings.some((entry) => entry.id === 'enemy_farm')).toBe(true);
  });

  it('uses policy-specific AP costs and enforces every technology branch prerequisite', () => {
    const { state, player } = playerState();
    player.resources.gold = 10_000;
    player.resources.adminPt = 5;

    const locked = enactPolicyAction(state, 'crop_rotation');
    expect(locked.ok).toBe(false);
    expect(locked.state).toBe(state);

    const enacted = enactPolicyAction(state, 'land_privilege');
    expect(enacted.ok).toBe(true);
    expect(enacted.state.nations[player.id].resources.adminPt).toBe(4);
    expect(enacted.state.nations[player.id].activePolicies.some((entry) => entry.policyId === 'land_privilege')).toBe(true);
  });

  it('charges two AP for an alliance and updates both diplomatic directions', () => {
    const { state, player, foreign } = playerState();
    player.resources.influence = 100;
    player.resources.adminPt = 5;
    state.relations.filter((relation) => [player.id, foreign.id].includes(relation.from) && [player.id, foreign.id].includes(relation.to)).forEach((relation) => {
      relation.relation = 60;
      relation.treaty = 'none';
    });

    const result = formAllianceAction(state, foreign.id);

    expect(result.ok).toBe(true);
    expect(result.state.nations[player.id].resources.adminPt).toBe(3);
    expect(result.state.relations.filter((relation) => [player.id, foreign.id].includes(relation.from) && [player.id, foreign.id].includes(relation.to)).map((relation) => relation.treaty)).toEqual(['alliance', 'alliance']);
  });

  it('charges AP for a valid border war and rejects non-player peace manipulation', () => {
    const { state, player } = playerState();
    player.resources.adminPt = 5;
    const border = Object.values(state.provinces)
      .filter((province) => province.ownerId === player.id)
      .flatMap((province) => province.adjacent.map((id) => state.provinces[id]))
      .find((province) => province && province.ownerId !== player.id)!;

    const warResult = declareWarAction(state, border.ownerId, border.id);
    expect(warResult.ok).toBe(true);
    expect(warResult.state.nations[player.id].resources.adminPt).toBe(4);

    const foreignWarState = createInitialState();
    const others = Object.values(foreignWarState.nations).filter((nation) => nation.id !== foreignWarState.playerNationId);
    const targetProvince = Object.values(foreignWarState.provinces).find((province) => province.ownerId === others[1].id)!;
    foreignWarState.wars.push({ id: 'foreign-war', attackerId: others[0].id, defenderId: others[1].id, targetProvinceId: targetProvince.id, progress: 50, turns: 1, battleReports: [] });
    const peaceResult = makePeaceAction(foreignWarState, 'foreign-war');
    expect(peaceResult.ok).toBe(false);
    expect(peaceResult.state).toBe(foreignWarState);
  });
});
