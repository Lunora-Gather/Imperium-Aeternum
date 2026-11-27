// Imperium Aeternum — GameState 初始化
// W4: 支持从 worldgen 生成 192 国 / 600 省世界

import type {
  GameState, Nation, Province, PopulationGroup, Faction, Army,
  DiplomaticRelation, ResourceStockpile, Government, NationalTendency,
} from '../types/game';
import { CLASS_IDS, SAVE_VERSION } from '../types/game';
import { NATIONS, PLAYER_ID, type NationDef } from '../data/nations';
import { PROVINCES, type ProvinceDef } from '../data/provinces';
import { GOVERNMENTS } from '../data/governments';
import { FACTIONS } from '../data/factions';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import { generateWorld } from './worldgen';
import { setProvincePopulation } from './provincePopulation';
import { clamp } from '../utils/math';

function buildClasses(ratio: ProvinceDef['initClassRatio']): PopulationGroup[] {
  return CLASS_IDS.map(classId => ({
    classId, weight: ratio[classId], count: 0, satisfaction: 50,
  }));
}

function buildFactions(govId: keyof typeof GOVERNMENTS): Faction[] {
  const gov = GOVERNMENTS[govId];
  return Object.values(FACTIONS).map((f) => ({
    id: f.id,
    power: f.initPower,
    satisfaction: clamp(f.initSatisfaction + gov.factionSatMod[f.id], 0, 100),
  }));
}

function buildGovernment(govId: keyof typeof GOVERNMENTS): Government {
  const g = GOVERNMENTS[govId];
  return {
    type: g.id,
    legitimacy: g.legitimacyBase,
    stability: g.stabilityBase,
    efficiency: g.efficiencyBase,
    corruption: g.corruptionBase,
  };
}

export function buildTendency(): NationalTendency {
  return {
    militarism: 0, commerce: 0, religiosity: 0, technocracy: 0,
    authoritarian: 0, welfare: 0, feudal: 0, revolutionary: 0,
    maritime: 0, centralization: 0,
    isolationist: 0, expansionist: 0, scholarly: 0, mercantilist: 0,
  };
}

function buildResources(n: NationDef): ResourceStockpile {
  return {
    gold: n.initGold, food: n.initFood, wood: n.initWood, iron: n.initIron,
    adminPt: 5, sciPt: 0, influence: 20, supply: 50,
  };
}

function buildArmy(n: NationDef): Army[] {
  if (!n.capital) return [];
  return [{
    id: `initial_army_${n.id}`,
    ownerId: n.id,
    location: n.capital,
    size: n.initArmy.size,
    morale: n.initArmy.morale,
    training: n.initArmy.training,
    equipment: n.initArmy.equipment,
    supply: 80,
  }];
}

function openingRelation(from: string, to: string, relation: number, trust: number): DiplomaticRelation {
  return { from, to, relation, trust, threat: 0, tradeDep: 0, treaty: 'none', truceTurns: 0 };
}

function buildProvinces(definitions: ProvinceDef[], rulers: NationDef[], playerId: string): Record<string, Province> {
  const out: Record<string, Province> = {};
  for (const p of definitions) {
    out[p.id] = {
      id: p.id, name: p.name, terrain: p.terrain,
      ownerId: p.ownerId, isCapital: p.isCapital,
      agriBase: p.agriBase, culture: p.culture, religion: p.religion,
      population: p.initPop,
      classes: buildClasses(p.initClassRatio),
      assimilation: p.ownerId === playerId ? 100 : 50,
      loyalty: p.ownerId === playerId ? 70 : 50,
      unrest: 0, rebellionRisk: 0,
      buildings: [], garrison: 0,
      baseResources: { ...p.baseResources },
      adjacent: [...p.adjacent],
      distToPlayerCapital: p.distToPlayerCapital,
      x: p.x, y: p.y,
    };
    setProvincePopulation(out[p.id], p.initPop);
  }
  // 首都驻初始军队
  for (const n of rulers) {
    if (n.capital && out[n.capital]) {
      out[n.capital].garrison = n.initArmy.size;
    }
  }
  return out;
}

function buildNations(rulers: NationDef[], playerId: string): Record<string, Nation> {
  const out: Record<string, Nation> = {};
  for (const n of rulers) {
    out[n.id] = {
      id: n.id, name: n.name, isPlayer: n.id === playerId,
      tier: n.tier,
      government: buildGovernment(n.government),
      character: n.character,
      tendency: buildTendency(),
      activeCharacterBonuses: [],
      capital: n.capital,
      ruler: { ...n.ruler },
      taxRate: n.initTaxRate,
      resources: buildResources(n),
      factions: buildFactions(n.government),
      tech: { agri: n.initTech.agri, mil: n.initTech.mil, admin: n.initTech.admin, culture: 0, researchProgress: null },
      army: buildArmy(n),
      activePolicies: [],
      activeLaws: [],
      activeTradeRoutes: [],
      embargoedRoutes: [],
      warExhaustion: 0,
      influence: 20,
      atWar: false,
      defeated: false,
    };
  }
  return out;
}

function createCampaign(
  scenarioId: 'classic' | 'world', seed: number, playerNationId: string,
  rulers: NationDef[], map: ProvinceDef[], relations: DiplomaticRelation[],
): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    scenarioId,
    turn: 0,
    seed,
    entityIdCounter: 0,
    playerNationId,
    nations: buildNations(rulers, playerNationId),
    provinces: buildProvinces(map, rulers, playerNationId),
    relations,
    diplomaticSummits: [],
    diplomaticAccords: [],
    wars: [],
    triggeredEvents: [],
    eventCooldowns: [],
    pendingEvents: [],
    pendingEventOptions: null,
    lastReport: null,
    history: [],
    victory: { type: null },
    bankruptTurns: 0,
    lowStabilityTurns: 0,
    chronicle: [],
  };
  buildRelationMap(state);
  return state;
}

export function createInitialState(): GameState {
  const relations = NATIONS.flatMap(n => n.initRelations.map(r => openingRelation(n.id, r.target, r.relation, r.trust)));
  return createCampaign('classic', 12345, PLAYER_ID, NATIONS, PROVINCES, relations);
}

// ── W4: 从 worldgen 创建世界级 GameState（192 国 / 600 省）──
export function createWorldState(seed: number, playerNationId?: string, regionFilter?: string[]): GameState {
  const world = generateWorld(seed, playerNationId, regionFilter);
  // 选玩家国：优先用指定 id；若该 id 不存在则找 isPlayer 标记；再不行 fallback 第一个 S/A
  let playerId = playerNationId ?? '';
  if (!world.nations.some((n) => n.id === playerId)) {
    const marked = world.nations.find((n) => n.isPlayer);
    playerId = marked?.id ?? world.nations.find((n) => n.tier === 'S' || n.tier === 'A')?.id ?? world.nations[0].id;
  }

  const relations = world.relations.map(r => openingRelation(r.from, r.to, r.relation, r.trust));
  return createCampaign('world', seed, playerId, world.nations, world.provinces, relations);
}

export function relationPair(
  state: GameState,
  from: string,
  to: string,
): [DiplomaticRelation, DiplomaticRelation] | null {
  const left = getRelationObj(from, to, state);
  const right = getRelationObj(to, from, state);
  return left && right ? [left, right] : null;
}

export function findRelation(relations: DiplomaticRelation[], from: string, to: string): DiplomaticRelation | undefined {
  return relations.find((r) => r.from === from && r.to === to);
}

// 索引仅记录数组位置。读写始终使用当前数组的元素，兼容冻结快照和 Immer 草稿。
const relationIndices = new WeakMap<DiplomaticRelation[], { length: number; positions: Map<string, number> }>();

export function buildRelationMap(state: GameState): void {
  const positions = new Map<string, number>();
  state.relations.forEach((r, i) => positions.set(`${r.from}|${r.to}`, i));
  relationIndices.set(state.relations, { length: state.relations.length, positions });
}

export function getRelationObj(from: string, to: string, state: GameState): DiplomaticRelation | undefined {
  let index = relationIndices.get(state.relations);
  if (!index || index.length !== state.relations.length) {
    buildRelationMap(state);
    index = relationIndices.get(state.relations)!;
  }
  const position = index.positions.get(`${from}|${to}`);
  return position === undefined ? undefined : state.relations[position];
}

export function invalidateRelationMap(state: GameState): void {
  relationIndices.delete(state.relations);
  if (Object.isExtensible(state)) state._relMap = undefined;
}

export function provincesOf(nationId: string, provinces: Record<string, Province>): Province[] {
  return Object.values(provinces).filter((p) => p.ownerId === nationId);
}

export { NATIONAL_CHARACTERS };
