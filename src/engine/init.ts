// Imperium Aeternum — GameState 初始化
// W4: 支持从 worldgen 生成 192 国 / 600 省世界

import type {
  GameState, Nation, Province, PopulationGroup, Faction, Army,
  DiplomaticRelation, ResourceStockpile, Government, NationalTendency,
} from '../types/game';
import { SAVE_VERSION } from '../types/game';
import type { NationId, NationTier, NationDef } from '../data/nations';
import {
  NATIONS, PLAYER_ID,
} from '../data/nations';
import { PROVINCES } from '../data/provinces';
import type { ProvinceDef } from '../data/provinces';
import { GOVERNMENTS } from '../data/governments';
import { FACTIONS } from '../data/factions';
import { NATIONAL_CHARACTERS } from '../data/national-characters';
import { genId } from '../utils/id';
import { generateWorld, type WorldGenResult } from './worldgen';

function buildClasses(totalPop: number, ratio: Province['classes'] extends never ? never : {
  peasants: number; workers: number; merchants: number;
  soldiers: number; scholars: number; nobles: number; clergy: number;
}): PopulationGroup[] {
  const ids: { key: 'peasants' | 'workers' | 'merchants' | 'soldiers' | 'scholars' | 'nobles' | 'clergy'; label: string }[] = [
    { key: 'peasants', label: '农民' }, { key: 'workers', label: '工人' },
    { key: 'merchants', label: '商人' }, { key: 'soldiers', label: '士兵' },
    { key: 'scholars', label: '学者' }, { key: 'nobles', label: '贵族' },
    { key: 'clergy', label: '神职' },
  ];
  return ids.map((i) => ({
    classId: i.key,
    count: Math.round(totalPop * ratio[i.key]),
    satisfaction: 50,
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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
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

function buildTendency(): NationalTendency {
  return {
    militarism: 0, commerce: 0, religiosity: 0, technocracy: 0,
    authoritarian: 0, welfare: 0, feudal: 0, revolutionary: 0,
    maritime: 0, centralization: 0,
  };
}

function buildResources(n: typeof NATIONS[number]): ResourceStockpile {
  return {
    gold: n.initGold, food: n.initFood, wood: n.initWood, iron: n.initIron,
    adminPt: 5, sciPt: 0, influence: 20, supply: 50,
  };
}

function buildArmy(n: typeof NATIONS[number]): Army[] {
  if (!n.capital) return [];
  return [{
    id: genId('army'),
    ownerId: n.id,
    location: n.capital,
    size: n.initArmy.size,
    morale: n.initArmy.morale,
    training: n.initArmy.training,
    equipment: n.initArmy.equipment,
    supply: 80,
  }];
}

function buildRelations(): DiplomaticRelation[] {
  const out: DiplomaticRelation[] = [];
  for (const n of NATIONS) {
    for (const r of n.initRelations) {
      out.push({
        from: n.id, to: r.target,
        relation: r.relation, trust: r.trust, threat: 0, tradeDep: 0,
        treaty: 'none', truceTurns: 0,
      });
    }
  }
  return out;
}

function buildProvinces(playerId: string): Record<string, Province> {
  const out: Record<string, Province> = {};
  for (const p of PROVINCES) {
    out[p.id] = {
      id: p.id, name: p.name, terrain: p.terrain,
      ownerId: p.ownerId, isCapital: p.isCapital,
      agriBase: p.agriBase, culture: p.culture, religion: p.religion,
      population: p.initPop,
      classes: buildClasses(p.initPop, p.initClassRatio),
      assimilation: p.ownerId === playerId ? 100 : 50,
      loyalty: p.ownerId === playerId ? 70 : 50,
      unrest: 0, rebellionRisk: 0,
      buildings: [], garrison: 0,
      baseResources: p.baseResources,
      adjacent: p.adjacent,
      distToPlayerCapital: p.distToPlayerCapital,
      x: p.x, y: p.y,
    };
  }
  // 首都驻初始军队
  for (const n of NATIONS) {
    if (n.capital && out[n.capital]) {
      out[n.capital].garrison = n.initArmy.size;
    }
  }
  return out;
}

function buildNations(): Record<string, Nation> {
  const out: Record<string, Nation> = {};
  for (const n of NATIONS) {
    out[n.id] = {
      id: n.id, name: n.name, isPlayer: n.isPlayer,
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

export function createInitialState(): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    turn: 0,
    seed: 12345,
    playerNationId: PLAYER_ID,
    nations: buildNations(),
    provinces: buildProvinces(PLAYER_ID),
    relations: buildRelations(),
    wars: [],
    triggeredEvents: [],
    eventCooldowns: [],
    pendingEvents: [],
    pendingEventOptions: null,
    lastReport: null,
    history: [],
    victory: { type: null },
    stableTurnsCount: 0,
    bankruptTurns: 0,
    lowStabilityTurns: 0,
    highEconomyStableTurns: 0,
    chronicle: [],
  };
  buildRelationMap(state);
  return state;
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

  const nations: Record<string, Nation> = {};
  for (const nd of world.nations) {
    const isPlayer = nd.id === playerId;
    nations[nd.id] = {
      id: nd.id, name: nd.name, isPlayer,
      tier: nd.tier,
      government: buildGovernment(nd.government),
      character: nd.character,
      tendency: buildTendency(),
      activeCharacterBonuses: [],
      capital: nd.capital,
      ruler: { ...nd.ruler },
      taxRate: nd.initTaxRate,
      resources: {
        gold: nd.initGold, food: nd.initFood, wood: nd.initWood, iron: nd.initIron,
        adminPt: 5, sciPt: 0, influence: 20, supply: 50,
      },
      factions: buildFactions(nd.government),
      tech: { agri: nd.initTech.agri, mil: nd.initTech.mil, admin: nd.initTech.admin, culture: 0, researchProgress: null },
      army: nd.capital ? [{ id: genId('army'), ownerId: nd.id, location: nd.capital, size: nd.initArmy.size, morale: nd.initArmy.morale, training: nd.initArmy.training, equipment: nd.initArmy.equipment, supply: 80 }] : [],
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

  const provinces: Record<string, Province> = {};
  for (const pd of world.provinces) {
    provinces[pd.id] = {
      id: pd.id, name: pd.name, terrain: pd.terrain,
      ownerId: pd.ownerId, isCapital: pd.isCapital,
      agriBase: pd.agriBase, culture: pd.culture, religion: pd.religion,
      population: pd.initPop,
      classes: buildClasses(pd.initPop, pd.initClassRatio),
      assimilation: pd.ownerId === playerId ? 100 : 50,
      loyalty: pd.ownerId === playerId ? 70 : 50,
      unrest: 0, rebellionRisk: 0,
      buildings: [], garrison: 0,
      baseResources: pd.baseResources,
      adjacent: pd.adjacent,
      distToPlayerCapital: 0,
      x: pd.x, y: pd.y,
    };
  }

  // 首都驻军
  for (const nd of world.nations) {
    if (nd.capital && provinces[nd.capital]) {
      provinces[nd.capital].garrison = nd.initArmy.size;
    }
  }

  // 稀疏外交关系
  const relations: DiplomaticRelation[] = [];
  for (const r of world.relations) {
    relations.push({ from: r.from, to: r.to, relation: r.relation, trust: r.trust, threat: 0, tradeDep: 0, treaty: 'none', truceTurns: 0 });
  }

  const state: GameState = {
    version: SAVE_VERSION,
    turn: 0,
    seed,
    playerNationId: playerId,
    nations,
    provinces,
    relations,
    wars: [],
    triggeredEvents: [],
    eventCooldowns: [],
    pendingEvents: [],
    pendingEventOptions: null,
    lastReport: null,
    history: [],
    victory: { type: null },
    stableTurnsCount: 0,
    bankruptTurns: 0,
    lowStabilityTurns: 0,
    highEconomyStableTurns: 0,
    chronicle: [],
  };
  buildRelationMap(state);
  return state;
}

export function findRelation(relations: DiplomaticRelation[], from: string, to: string): DiplomaticRelation | undefined {
  return relations.find((r) => r.from === from && r.to === to);
}

// E9 性能优化：关系索引 Map（transient，不序列化）
// key=`${from}|${to}`，value=relation 对象引用
// 运行时只 mutate 字段（treaty/relation/trust），不新增条目，故索引无需重建
// worldgen/init 阶段批量建好后调用 buildRelationMap()；push 新 relation 后需重建
export function buildRelationMap(state: GameState): void {
  if (!state._relMap) {
    state._relMap = new Map();
    for (const r of state.relations) state._relMap.set(`${r.from}|${r.to}`, r);
  }
}

export function getRelationObj(from: string, to: string, state: GameState): DiplomaticRelation | undefined {
  if (!state._relMap) buildRelationMap(state);
  return state._relMap!.get(`${from}|${to}`);
}

export function invalidateRelationMap(state: GameState): void {
  state._relMap = undefined;
}

export function provincesOf(nationId: string, provinces: Record<string, Province>): Province[] {
  return Object.values(provinces).filter((p) => p.ownerId === nationId);
}

export { NATIONAL_CHARACTERS };
