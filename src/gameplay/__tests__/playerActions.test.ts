import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { decayRebelNations } from '../../engine/turnIntel';
import { resolveFailuresAndRebellions } from '../../engine/turnConsequences';
import { declareWar } from '../../engine/military';
import { EVENT_BY_ID } from '../../data/events';
import { negotiateRebellionAction, suppressRebellionAction } from '../actions/provinceActions';
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

it('keeps an ongoing research project exclusive and charges a completed purchase once', () => {
  const { state, player } = playerState();
  player.tech.agri = 1;
  Object.assign(player.resources, { sciPt: 400, gold: 100, adminPt: 1 });
  player.tech.researchProgress = { techId: 'mil_lv2', sciPtInvested: 5 };
  const ready = structuredClone(state);
  ready.nations[player.id].tech.researchProgress = null;
  expect(researchAction(state, 'agri_lv2').state).toBe(state);
  const result = researchAction(ready, 'agri_lv2');
  expect(result.ok).toBe(true);
  expect(result.state.nations[player.id].resources).toMatchObject({ sciPt: 0, gold: 0, adminPt: 0 });
  expect(researchAction(result.state, 'agri_lv2').state).toBe(result.state);
});

function civilWarState() {
  const { state, player } = playerState();
  const provinces = Object.values(state.provinces).filter((p) => p.ownerId === player.id && p.id !== player.capital).slice(0, 3);
  for (const province of provinces) Object.assign(province, { rebellionRisk: 100, garrison: 0 });
  resolveFailuresAndRebellions(state, player.id);
  const rebels = [...player.civilWar!.rebels];
  const rebel = rebels[0];
  const eventId = Object.keys(EVENT_BY_ID)[0];
  state.triggeredEvents.push({ nationId: rebel, eventId, turn: state.turn, optionIndex: 0 });
  state.eventCooldowns.push({ nationId: rebel, eventId, lastTriggeredTurn: state.turn });
  state.pendingEvents.push({ nationId: rebel, eventId });
  state.pendingEventOptions = { nationId: rebel, eventId, options: [] };
  state.relations.push(...[[player.id, rebel], [rebel, player.id]].map(([from, to]) => ({
    from, to, relation: -10, trust: 10, threat: 10, tradeDep: 0, treaty: 'none' as const, truceTurns: 0,
  })));
  state._relMap = undefined;
  declareWar(state, player.id, rebel, provinces[0].id);
  player.resources.gold = 500;
  player.resources.adminPt = 5;
  player.army[0].size = 300;
  return { state, player, rebels, provinces };
}

it('ends the civil war when the last rebel returns, including active wars and events', () => {
  const { state, player, rebels } = civilWarState();
  state.nations[rebels[0]].rebellionDecay = 1;
  decayRebelNations(state);
  expect(player.civilWar).toEqual({ active: true, rebels: rebels.slice(1) });
  for (let turn = 0; turn < 5; turn++) decayRebelNations(state);
  expect(player.civilWar).toEqual({ active: false, rebels: [] });
  expect(invariantErrors(state)).toEqual([]);
});

it('suppresses the rebellion once even when rebels have wars and event records', () => {
  const { state, player, provinces } = civilWarState();
  const result = suppressRebellionAction(state);
  expect(result.messages).toEqual(['镇压叛乱成功']);
  expect(result.state.nations[player.id].resources).toMatchObject({ gold: 350, adminPt: 3 });
  expect(provinces.every((p) => result.state.provinces[p.id].ownerId === player.id)).toBe(true);
  expect(provinces.every((p) => !result.state.provinces[p.id].isCapital)).toBe(true);
  expect(suppressRebellionAction(result.state).state).toBe(result.state);
  expect(invariantErrors(result.state)).toEqual([]);
});

it('recognizes independent rebels and enforces the negotiated truce past the old return date', () => {
  const { state, player, rebels, provinces } = civilWarState();
  const result = negotiateRebellionAction(state);
  expect(result.ok).toBe(true);
  const next = structuredClone(result.state);
  for (let turn = 0; turn < 6; turn++) decayRebelNations(next);
  expect(provinces.map((p) => next.provinces[p.id].ownerId)).toEqual(rebels);
  expect(provinces.every((p) => next.provinces[p.id].isCapital)).toBe(true);
  expect(next.wars).toHaveLength(0);
  expect(declareWar(next, player.id, rebels[1], provinces[1].id)).toBeNull();
  expect(invariantErrors(next)).toEqual([]);
});

it('keeps territory under its living ruler when a rebel return has no surviving parent', () => {
  const { state, player, rebels, provinces } = civilWarState();
  for (const p of Object.values(state.provinces)) if (p.ownerId === player.id) p.ownerId = 'barbarian';
  player.defeated = true;
  state.nations[rebels[1]].rebelOf = 'missing';
  for (const id of rebels) state.nations[id].rebellionDecay = 1;
  decayRebelNations(state);
  for (const [i, id] of rebels.entries()) {
    expect(provinces[i].ownerId).toBe(id);
    expect(state.nations[id].rebelOf).toBeUndefined();
    expect(state.nations[id].rebellionDecay).toBeUndefined();
    expect(state.nations[id].name).toBe(provinces[i].name);
  }
  expect(player.civilWar?.active).toBe(false);
});

it('removes a conquered rebel without recording a fictitious return of territory', () => {
  const { state, rebels, provinces } = civilWarState();
  const id = rebels[0];
  provinces[0].ownerId = 'n02';
  state.nations[id].defeated = true;
  state.nations[id].rebellionDecay = 1;
  decayRebelNations(state);
  expect(provinces[0].ownerId).toBe('n02');
  expect(state.nations[id]).toBeUndefined();
  expect(state.chronicle.some(entry => entry.id?.startsWith(`rebel_return_${id}_`))).toBe(false);
});
