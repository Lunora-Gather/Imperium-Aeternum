// Imperium Aeternum — 建筑表
// 数据源：docs/02-system-rules.md §9 / docs/formulas.md §2.5
// FROZEN v1（阶段 3a）

export type BuildingId =
  | 'farm'
  | 'road'
  | 'market'
  | 'barracks'
  | 'mine'
  | 'library'
  | 'temple'
  | 'courthouse'
  | 'wall'
  // B 扩展
  | 'aqueduct'
  | 'workshop'
  | 'academy'
  | 'relay_station'
  | 'mint'
  | 'clinic'
  | 'granary'
  | 'port'
  | 'lighthouse'
  | 'shrine'
  | 'gardens'
  // P3 质变节点——Lv6+ 科技解锁的高级建筑
  | 'great_library'
  | 'arsenal'
  | 'granary_empire'
  | 'cathedral';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  costGold: number;
  costWood: number;
  costIron: number;
  // 建造消耗行动点
  costAction: number;
  // 产出（per 回合，level=1 基础）
  yield: {
    gold?: number;
    food?: number;
    wood?: number;
    iron?: number;
    sciPt?: number;
    adminPt?: number;
    influence?: number;
    supply?: number;
  };
  // 地形适配修正（terrain → multiplier），未列出即 1.0
  terrainMod: Record<string, number>;
  // 前置科技 id（可选）
  prereqTech?: string;
  // 建造上限（per 省），0 表示不限
  maxPerProvince: number;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  farm: {
    id: 'farm',
    name: '农田',
    description: '提升粮食产量。地形适配：平原最佳。',
    costGold: 50,
    costWood: 20,
    costIron: 0,
    costAction: 1,
    yield: { food: 50 },
    terrainMod: { plain: 1.5, hill: 0.8, mountain: 0.3, coast: 1.0, forest: 0.6, desert: 0.3 },
    maxPerProvince: 5,
  },
  road: {
    id: 'road',
    name: '道路',
    description: '提升税收效率与同化速度，连接省份。',
    costGold: 40,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { adminPt: 1, influence: 1 },
    terrainMod: { plain: 1.2, hill: 0.8, mountain: 0.5, coast: 1.0, forest: 0.7, desert: 0.5 },
    maxPerProvince: 3,
  },
  market: {
    id: 'market',
    name: '市场',
    description: '提升贸易收入与商人满意度。',
    costGold: 80,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { gold: 30, influence: 2 },
    terrainMod: { plain: 1.0, hill: 1.0, mountain: 0.8, coast: 1.3, forest: 0.9, desert: 0.7 },
    maxPerProvince: 3,
  },
  barracks: {
    id: 'barracks',
    name: '兵营',
    description: '提升征兵速度与军事补给，军方满意度。',
    costGold: 100,
    costWood: 40,
    costIron: 30,
    costAction: 1,
    yield: { supply: 20 },
    terrainMod: {},
    maxPerProvince: 2,
  },
  mine: {
    id: 'mine',
    name: '矿山',
    description: '产出铁矿与少量金。仅山地/丘陵高产。',
    costGold: 60,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { iron: 15, gold: 10 },
    terrainMod: { mountain: 1.5, hill: 1.2, plain: 0.3, coast: 0.5, forest: 0.6, desert: 0.4 },
    maxPerProvince: 3,
  },
  library: {
    id: 'library',
    name: '学院',
    description: '产出科研点，提升学者满意度。',
    costGold: 120,
    costWood: 20,
    costIron: 10,
    costAction: 1,
    yield: { sciPt: 3 },
    terrainMod: {},
    prereqTech: 'admin_lv2',
    maxPerProvince: 2,
  },
  temple: {
    id: 'temple',
    name: '神殿',
    description: '提升神职满意度、稳定度、同化度。',
    costGold: 90,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { influence: 3, adminPt: 1 },
    terrainMod: {},
    maxPerProvince: 2,
  },
  courthouse: {
    id: 'courthouse',
    name: '法院',
    description: '降低腐败、提升行政能力与可管省数。',
    costGold: 150,
    costWood: 20,
    costIron: 20,
    costAction: 2,
    yield: { adminPt: 3 },
    terrainMod: {},
    prereqTech: 'admin_lv3',
    maxPerProvince: 1,
  },
  wall: {
    id: 'wall',
    name: '城墙',
    description: '提升省份防守地形修正，降低叛乱。',
    costGold: 110,
    costWood: 50,
    costIron: 40,
    costAction: 1,
    yield: { supply: 5 },
    terrainMod: {},
    maxPerProvince: 1,
  },
  // ── B 扩展：11 个新建筑，扩到 20 种 ──
  aqueduct: {
    id: 'aqueduct', name: '引渠', description: '引水灌溉，平原与丘陵粮产大增。',
    costGold: 90, costWood: 40, costIron: 0, costAction: 1,
    yield: { food: 8 }, terrainMod: { plain: 1.4, hill: 1.3 }, prereqTech: 'agri_lv2', maxPerProvince: 1,
  },
  workshop: {
    id: 'workshop', name: '工坊', description: '手工业聚集，产出木材与少量税收。',
    costGold: 80, costWood: 30, costIron: 10, costAction: 1,
    yield: { wood: 6, gold: 4 }, terrainMod: { plain: 1.2, hill: 1.1 }, maxPerProvince: 2,
  },
  academy: {
    id: 'academy', name: '学院', description: '培养学者，大幅提升科研点。',
    costGold: 140, costWood: 30, costIron: 0, costAction: 2,
    yield: { sciPt: 6, adminPt: 1 }, terrainMod: {}, prereqTech: 'admin_lv3', maxPerProvince: 1,
  },
  relay_station: {
    id: 'relay_station', name: '驿站', description: '提升行政效率与影响力传播。',
    costGold: 60, costWood: 25, costIron: 5, costAction: 1,
    yield: { adminPt: 2, influence: 1 }, terrainMod: { plain: 1.2 }, maxPerProvince: 1,
  },
  mint: {
    id: 'mint', name: '铸币厂', description: '稳定币值，提升税收但略增腐败。',
    costGold: 160, costWood: 20, costIron: 40, costAction: 2,
    yield: { gold: 12 }, terrainMod: {}, prereqTech: 'admin_lv2', maxPerProvince: 1,
  },
  clinic: {
    id: 'clinic', name: '医署', description: '降低疫病损失，提升人口增长。',
    costGold: 100, costWood: 20, costIron: 0, costAction: 1,
    yield: { adminPt: 1, food: 2 }, terrainMod: {}, prereqTech: 'admin_lv2', maxPerProvince: 1,
  },
  granary: {
    id: 'granary', name: '粮仓', description: '储粮备荒，提升粮食上限与稳定度。',
    costGold: 70, costWood: 40, costIron: 0, costAction: 1,
    yield: { food: 5 }, terrainMod: {}, maxPerProvince: 2,
  },
  port: {
    id: 'port', name: '军港', description: '沿海与河流省份可建，提升补给与贸易。',
    costGold: 120, costWood: 50, costIron: 20, costAction: 2,
    yield: { supply: 8, gold: 6, influence: 1 }, terrainMod: { coast: 1.5, island: 1.3 }, maxPerProvince: 1,
  },
  lighthouse: {
    id: 'lighthouse', name: '灯塔', description: '提升海上贸易收入与影响力。',
    costGold: 90, costWood: 30, costIron: 10, costAction: 1,
    yield: { gold: 5, influence: 2 }, terrainMod: { coast: 1.4, island: 1.5 }, prereqTech: 'admin_lv2', maxPerProvince: 1,
  },
  shrine: {
    id: 'shrine', name: '神像', description: '提升合法性与神职满意度。',
    costGold: 80, costWood: 20, costIron: 10, costAction: 1,
    yield: { influence: 2 }, terrainMod: {}, maxPerProvince: 1,
  },
  gardens: {
    id: 'gardens', name: '园林', description: '皇家园林，提升稳定度与威望。',
    costGold: 130, costWood: 30, costIron: 0, costAction: 2,
    yield: { influence: 3, adminPt: 1 }, terrainMod: { plain: 1.2 }, maxPerProvince: 1,
  },
  // ── P3 质变节点：Lv6+ 科技解锁的高级建筑（每省限 1，强收益但高门槛）──
  great_library: {
    id: 'great_library', name: '万卷楼', description: '文化 Lv6 解锁。科研点产出翻倍，影响力辐射邻邦。',
    costGold: 400, costWood: 100, costIron: 20, costAction: 3,
    yield: { sciPt: 15, influence: 8, adminPt: 2 }, terrainMod: {}, prereqTech: 'culture_lv6', maxPerProvince: 1,
  },
  arsenal: {
    id: 'arsenal', name: '武库', description: '军事 Lv6 解锁。装备与补给大增，军方满意度激增。',
    costGold: 500, costWood: 80, costIron: 120, costAction: 3,
    yield: { supply: 20, adminPt: 1 }, terrainMod: {}, prereqTech: 'mil_lv6', maxPerProvince: 1,
  },
  granary_empire: {
    id: 'granary_empire', name: '帝国粮仓', description: '农业 Lv6 解锁。粮储登顶，旱涝保收，人口增长加速。',
    costGold: 450, costWood: 150, costIron: 0, costAction: 3,
    yield: { food: 40, adminPt: 1 }, terrainMod: { plain: 1.3 }, prereqTech: 'agri_lv6', maxPerProvince: 1,
  },
  cathedral: {
    id: 'cathedral', name: '大圣堂', description: '行政 Lv6 解锁。合法性根基稳固，腐败大降，同化加速。',
    costGold: 600, costWood: 80, costIron: 60, costAction: 3,
    yield: { influence: 6, adminPt: 4 }, terrainMod: {}, prereqTech: 'admin_lv6', maxPerProvince: 1,
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDINGS);
