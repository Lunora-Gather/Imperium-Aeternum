// src/types/game.ts
var SAVE_VERSION = 6;

// src/data/nations.ts
var NATIONS = [
  // ── 玩家：罗马式小国 ──
  {
    id: "n01",
    name: "\u7F57\u9A6C",
    isPlayer: true,
    tier: "A",
    government: "monarchy",
    character: "balanced",
    capital: "p01",
    initGold: 300,
    initFood: 400,
    initWood: 80,
    initIron: 30,
    initTaxRate: 0.15,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: { size: 200, morale: 60, training: 50, equipment: 40 },
    ruler: { name: "\u6267\u653F\u5B98\u5E03\u9C81\u56FE", ability: 50, age: 40 },
    aiWeights: { taxUp: 0, buildFarm: 0, suppress: 0, expandArmy: 0, alliance: 0, declareWar: 0, research: 0 },
    initRelations: [
      { target: "n02", relation: -10, trust: 40 },
      { target: "n03", relation: 20, trust: 55 },
      { target: "n04", relation: -20, trust: 35 },
      { target: "n05", relation: 0, trust: 50 }
    ]
  },
  // ── AI n02：北意大利联邦（商业共和） ──
  {
    id: "n02",
    name: "\u7EF4\u5C3C\u6258\u8054\u90A6",
    isPlayer: false,
    tier: "B",
    government: "republic",
    character: "commerce",
    capital: "p07",
    initGold: 500,
    initFood: 350,
    initWood: 100,
    initIron: 60,
    initTaxRate: 0.18,
    initTech: { agri: 1, mil: 1, admin: 2 },
    initArmy: { size: 150, morale: 50, training: 45, equipment: 50 },
    ruler: { name: "\u6267\u653F\u5B98\u9A6C\u5C14\u79D1", ability: 55, age: 45 },
    aiWeights: { taxUp: 0.8, buildFarm: 1, suppress: 0.7, expandArmy: 0.6, alliance: 1.2, declareWar: 0.5, research: 1 },
    initRelations: [
      { target: "n01", relation: -10, trust: 40 },
      { target: "n03", relation: 0, trust: 50 },
      { target: "n04", relation: 10, trust: 55 },
      { target: "n05", relation: 0, trust: 50 }
    ]
  },
  // ── AI n03：大希腊叙拉古（科技国家） ──
  {
    id: "n03",
    name: "\u53D9\u62C9\u53E4",
    isPlayer: false,
    tier: "B",
    government: "republic",
    character: "technocracy",
    capital: "p13",
    initGold: 350,
    initFood: 300,
    initWood: 70,
    initIron: 40,
    initTaxRate: 0.16,
    initTech: { agri: 2, mil: 1, admin: 2 },
    initArmy: { size: 180, morale: 55, training: 55, equipment: 55 },
    ruler: { name: "\u6267\u653F\u5B98\u963F\u57FA\u7C73\u5FB7", ability: 60, age: 50 },
    aiWeights: { taxUp: 0.9, buildFarm: 1, suppress: 0.8, expandArmy: 0.7, alliance: 1, declareWar: 0.6, research: 1.8 },
    initRelations: [
      { target: "n01", relation: 20, trust: 55 },
      { target: "n02", relation: 0, trust: 50 },
      { target: "n04", relation: -10, trust: 45 },
      { target: "n05", relation: 10, trust: 55 }
    ]
  },
  // ── AI n04：东方帝国（高压帝国） ──
  {
    id: "n04",
    name: "\u6F58\u8BFA\u5C3C\u4E9A\u5E1D\u56FD",
    isPlayer: false,
    tier: "A",
    government: "empire",
    character: "authoritarian",
    capital: "p19",
    initGold: 400,
    initFood: 380,
    initWood: 120,
    initIron: 80,
    initTaxRate: 0.2,
    initTech: { agri: 1, mil: 2, admin: 1 },
    initArmy: { size: 250, morale: 60, training: 55, equipment: 55 },
    ruler: { name: "\u7687\u5E1D\u6234\u514B\u91CC", ability: 50, age: 48 },
    aiWeights: { taxUp: 1.3, buildFarm: 0.9, suppress: 1.8, expandArmy: 1.2, alliance: 0.6, declareWar: 1.3, research: 0.7 },
    initRelations: [
      { target: "n01", relation: -20, trust: 35 },
      { target: "n02", relation: 10, trust: 55 },
      { target: "n03", relation: -10, trust: 45 },
      { target: "n05", relation: -30, trust: 30 }
    ]
  },
  // ── AI n05：蛮族联盟（军国主义，无开局省份，靠侵占领土） ──
  // 设计：开局在地图外，每 30 回合有概率入侵边境省份；玩家击退可获声望
  {
    id: "n05",
    name: "\u86EE\u65CF\u8054\u76DF",
    isPlayer: false,
    tier: "C",
    government: "junta",
    character: "militarism",
    capital: "p27",
    // 昔提亚联盟王庭
    initGold: 200,
    initFood: 200,
    initWood: 50,
    initIron: 30,
    initTaxRate: 0.1,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: { size: 300, morale: 70, training: 40, equipment: 30 },
    ruler: { name: "\u86EE\u738B\u4E9A\u62C9\u91CC\u514B", ability: 45, age: 35 },
    aiWeights: { taxUp: 1.2, buildFarm: 0.8, suppress: 1.5, expandArmy: 1.5, alliance: 0.7, declareWar: 1.8, research: 0.8 },
    initRelations: [
      { target: "n01", relation: 0, trust: 50 },
      { target: "n02", relation: 0, trust: 50 },
      { target: "n03", relation: 10, trust: 55 },
      { target: "n04", relation: -30, trust: 30 }
    ]
  }
];
var NATION_BY_ID = Object.fromEntries(
  NATIONS.map((n3) => [n3.id, n3])
);
var PLAYER_ID = "n01";
var PLAYER_NATION = NATION_BY_ID["n01"];
var AI_NATIONS = NATIONS.filter((n3) => !n3.isPlayer);

// src/data/provinces.ts
var LAND_RATIO = {
  peasants: 0.55,
  workers: 0.15,
  merchants: 0.1,
  soldiers: 0.08,
  scholars: 0.04,
  nobles: 0.05,
  clergy: 0.03
};
var POOR_RATIO = {
  peasants: 0.65,
  workers: 0.1,
  merchants: 0.05,
  soldiers: 0.1,
  scholars: 0.02,
  nobles: 0.05,
  clergy: 0.03
};
var TRADE_RATIO = {
  peasants: 0.4,
  workers: 0.15,
  merchants: 0.2,
  soldiers: 0.08,
  scholars: 0.05,
  nobles: 0.07,
  clergy: 0.05
};
var OCEAN_RATIO = { peasants: 0, workers: 0, merchants: 0, soldiers: 0, scholars: 0, nobles: 0, clergy: 0 };
var PROVINCES = [
  // ── 玩家罗马核心区（p01-p06）──
  {
    id: "p01",
    name: "\u7F57\u9A6C",
    terrain: "plain",
    type: "capital",
    ownerId: "n01",
    isCapital: true,
    agriBase: 1.4,
    culture: "latin",
    religion: "polytheism",
    initPop: 1200,
    initClassRatio: TRADE_RATIO,
    baseResources: { wood: 20, stone: 10 },
    adjacent: ["p02", "p03", "p04", "p07"],
    distToPlayerCapital: 0,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 2,
    fortressLevel: 2,
    x: 500,
    y: 380
  },
  {
    id: "p02",
    name: "\u57C3\u7279\u9C81\u91CC\u4E9A",
    terrain: "hill",
    type: "land",
    ownerId: "n01",
    isCapital: false,
    agriBase: 0.9,
    culture: "latin",
    religion: "polytheism",
    initPop: 500,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, iron: 10, stone: 15 },
    adjacent: ["p01", "p04", "p05", "p08"],
    distToPlayerCapital: 1,
    elevation: "medium",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: false,
    fortressLevel: 1,
    x: 470,
    y: 340
  },
  {
    id: "p03",
    name: "\u5927\u5E0C\u814A",
    terrain: "coast",
    type: "land",
    ownerId: "n01",
    isCapital: false,
    agriBase: 1.1,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 600,
    initClassRatio: TRADE_RATIO,
    baseResources: { wood: 10 },
    adjacent: ["p01", "p06", "p09"],
    distToPlayerCapital: 1,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 540,
    y: 420
  },
  {
    id: "p04",
    name: "\u8428\u83AB\u5948",
    terrain: "mountain",
    type: "land",
    ownerId: "n01",
    isCapital: false,
    agriBase: 0.5,
    culture: "latin",
    religion: "polytheism",
    initPop: 300,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 20, stone: 20 },
    adjacent: ["p01", "p02", "p05", "p10"],
    distToPlayerCapital: 1,
    elevation: "high",
    climate: "temperate",
    hasRiver: false,
    isTradeNode: false,
    fortressLevel: 1,
    x: 520,
    y: 360
  },
  {
    id: "p05",
    name: "\u7FC1\u5E03\u91CC\u4E9A",
    terrain: "hill",
    type: "land",
    ownerId: "n01",
    isCapital: false,
    agriBase: 0.9,
    culture: "latin",
    religion: "polytheism",
    initPop: 400,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, stone: 10 },
    adjacent: ["p02", "p04", "p08", "p11"],
    distToPlayerCapital: 2,
    elevation: "medium",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 480,
    y: 310
  },
  {
    id: "p06",
    name: "\u574E\u5E15\u5C3C\u4E9A",
    terrain: "plain",
    type: "land",
    ownerId: "n01",
    isCapital: false,
    agriBase: 1.5,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 700,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, luxury: 5 },
    adjacent: ["p03", "p09", "p10"],
    distToPlayerCapital: 2,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 530,
    y: 450
  },
  // ── 北意大利联邦 n02（p07-p12）──
  {
    id: "p07",
    name: "\u7EF4\u5C3C\u6258",
    terrain: "plain",
    type: "capital",
    ownerId: "n02",
    isCapital: true,
    agriBase: 1.2,
    culture: "nordic",
    religion: "monotheism_a",
    initPop: 800,
    initClassRatio: TRADE_RATIO,
    baseResources: { wood: 20 },
    adjacent: ["p01", "p08", "p11", "p13"],
    distToPlayerCapital: 2,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 2,
    fortressLevel: 1,
    x: 510,
    y: 260
  },
  {
    id: "p08",
    name: "\u5C71\u5357\u9AD8\u5362",
    terrain: "mountain",
    type: "land",
    ownerId: "n02",
    isCapital: false,
    agriBase: 0.5,
    culture: "celtic",
    religion: "animism",
    initPop: 350,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 25, stone: 15 },
    adjacent: ["p02", "p05", "p07", "p11", "p14", "p34"],
    distToPlayerCapital: 2,
    elevation: "high",
    climate: "temperate",
    hasRiver: false,
    isTradeNode: false,
    fortressLevel: 2,
    x: 450,
    y: 280
  },
  {
    id: "p09",
    name: "\u5362\u5361\u5C3C\u4E9A",
    terrain: "hill",
    type: "land",
    ownerId: "n02",
    isCapital: false,
    agriBase: 0.7,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 300,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 12 },
    adjacent: ["p03", "p06", "p10", "p18"],
    distToPlayerCapital: 3,
    elevation: "medium",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: false,
    x: 510,
    y: 490
  },
  {
    id: "p10",
    name: "\u666E\u5229\u4E9A",
    terrain: "plain",
    type: "land",
    ownerId: "n02",
    isCapital: false,
    agriBase: 1,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 450,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 8, luxury: 3 },
    adjacent: ["p04", "p06", "p09", "p18"],
    distToPlayerCapital: 3,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: false,
    x: 570,
    y: 460
  },
  {
    id: "p11",
    name: "\u96F7\u8482\u4E9A",
    terrain: "mountain",
    type: "fortress",
    ownerId: "n02",
    isCapital: false,
    agriBase: 0.4,
    culture: "germanic",
    religion: "animism",
    initPop: 250,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 15, iron: 20, stone: 25 },
    adjacent: ["p05", "p07", "p08", "p14"],
    distToPlayerCapital: 3,
    elevation: "high",
    climate: "cold",
    hasRiver: true,
    isTradeNode: false,
    fortressLevel: 3,
    x: 470,
    y: 220
  },
  {
    id: "p12",
    name: "\u4E9A\u5F97\u91CC\u4E9A\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p07", "p09", "p10", "p18", "p22", "p23"],
    distToPlayerCapital: 3,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 580,
    y: 320
  },
  // ── 大希腊叙拉古 n03（p13-p18）──
  {
    id: "p13",
    name: "\u53D9\u62C9\u53E4",
    terrain: "coast",
    type: "capital",
    ownerId: "n03",
    isCapital: true,
    agriBase: 1,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 700,
    initClassRatio: TRADE_RATIO,
    baseResources: { wood: 10, luxury: 8 },
    adjacent: ["p07", "p14", "p15", "p18", "p22"],
    distToPlayerCapital: 3,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 3,
    fortressLevel: 2,
    x: 560,
    y: 540
  },
  {
    id: "p14",
    name: "\u8BFA\u91CC\u5E93\u59C6",
    terrain: "mountain",
    type: "land",
    ownerId: "n03",
    isCapital: false,
    agriBase: 0.4,
    culture: "germanic",
    religion: "animism",
    initPop: 280,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 30, stone: 10 },
    adjacent: ["p08", "p11", "p13", "p16"],
    distToPlayerCapital: 4,
    elevation: "high",
    climate: "cold",
    hasRiver: true,
    isTradeNode: false,
    fortressLevel: 1,
    x: 420,
    y: 200
  },
  {
    id: "p15",
    name: "\u6614\u5170\u5C3C",
    terrain: "desert",
    type: "land",
    ownerId: "n03",
    isCapital: false,
    agriBase: 0.3,
    culture: "african",
    religion: "monotheism_a",
    initPop: 300,
    initClassRatio: POOR_RATIO,
    baseResources: { spice: 10, luxury: 5 },
    adjacent: ["p13", "p22", "p27"],
    distToPlayerCapital: 5,
    elevation: "low",
    climate: "arid",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 600,
    y: 600
  },
  {
    id: "p16",
    name: "\u6F58\u8BFA\u5C3C\u4E9A",
    terrain: "plain",
    type: "land",
    ownerId: "n03",
    isCapital: false,
    agriBase: 1.1,
    culture: "slavic",
    religion: "monotheism_b",
    initPop: 450,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 20 },
    adjacent: ["p14", "p17", "p24"],
    distToPlayerCapital: 4,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 440,
    y: 180
  },
  {
    id: "p17",
    name: "\u8FBE\u5C14\u9A6C\u63D0\u4E9A",
    terrain: "coast",
    type: "land",
    ownerId: "n03",
    isCapital: false,
    agriBase: 0.6,
    culture: "slavic",
    religion: "monotheism_b",
    initPop: 320,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, stone: 10 },
    adjacent: ["p12", "p16", "p19", "p22", "p23", "p24"],
    distToPlayerCapital: 4,
    elevation: "medium",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: false,
    x: 500,
    y: 200
  },
  {
    id: "p18",
    name: "\u5E03\u9C81\u63D0\u4E4C\u59C6",
    terrain: "coast",
    type: "land",
    ownerId: "n03",
    isCapital: false,
    agriBase: 0.8,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 350,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, luxury: 4 },
    adjacent: ["p09", "p10", "p12", "p13"],
    distToPlayerCapital: 4,
    elevation: "medium",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: false,
    x: 540,
    y: 510
  },
  // ── 东方帝国 n04（p19-p26）──
  {
    id: "p19",
    name: "\u8FBE\u5951\u4E9A",
    terrain: "forest",
    type: "capital",
    ownerId: "n04",
    isCapital: true,
    agriBase: 0.7,
    culture: "orient",
    religion: "animism",
    initPop: 600,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 30, iron: 15, stone: 10 },
    adjacent: ["p17", "p20", "p24", "p25"],
    distToPlayerCapital: 5,
    elevation: "medium",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 1,
    fortressLevel: 2,
    x: 460,
    y: 130
  },
  {
    id: "p20",
    name: "\u672C\u90FD",
    terrain: "mountain",
    type: "land",
    ownerId: "n04",
    isCapital: false,
    agriBase: 0.4,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 350,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 25, stone: 15 },
    adjacent: ["p19", "p21", "p25", "p29"],
    distToPlayerCapital: 6,
    elevation: "high",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    fortressLevel: 2,
    x: 540,
    y: 100
  },
  {
    id: "p21",
    name: "\u5361\u5E15\u591A\u897F\u4E9A",
    terrain: "plain",
    type: "land",
    ownerId: "n04",
    isCapital: false,
    agriBase: 0.9,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 400,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, spice: 5 },
    adjacent: ["p20", "p25", "p29", "p30"],
    distToPlayerCapital: 6,
    elevation: "medium",
    climate: "arid",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 580,
    y: 110
  },
  {
    id: "p22",
    name: "\u7231\u7434\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p12", "p13", "p15", "p17", "p23", "p27"],
    distToPlayerCapital: 5,
    elevation: "low",
    climate: "mediterranean",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 580,
    y: 480
  },
  {
    id: "p23",
    name: "\u8272\u96F7\u65AF",
    terrain: "plain",
    type: "land",
    ownerId: "n04",
    isCapital: false,
    agriBase: 1,
    culture: "hellenic",
    religion: "monotheism_b",
    initPop: 420,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, iron: 10 },
    adjacent: ["p12", "p17", "p22", "p24", "p29"],
    distToPlayerCapital: 5,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 540,
    y: 180
  },
  {
    id: "p24",
    name: "\u9ED8\u897F\u4E9A",
    terrain: "forest",
    type: "land",
    ownerId: "n04",
    isCapital: false,
    agriBase: 0.6,
    culture: "slavic",
    religion: "animism",
    initPop: 300,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 25, iron: 8 },
    adjacent: ["p16", "p17", "p19", "p23"],
    distToPlayerCapital: 5,
    elevation: "medium",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 480,
    y: 160
  },
  {
    id: "p25",
    name: "\u4E9A\u7F8E\u5C3C\u4E9A",
    terrain: "mountain",
    type: "fortress",
    ownerId: "n04",
    isCapital: false,
    agriBase: 0.3,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 280,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 20, stone: 20 },
    adjacent: ["p19", "p20", "p21", "p29"],
    distToPlayerCapital: 6,
    elevation: "high",
    climate: "cold",
    hasRiver: true,
    isTradeNode: false,
    fortressLevel: 3,
    x: 600,
    y: 80
  },
  {
    id: "p26",
    name: "\u9ED1\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "hellenic",
    religion: "polytheism",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p12", "p17", "p20", "p23", "p25"],
    distToPlayerCapital: 6,
    elevation: "low",
    climate: "cold",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 600,
    y: 200
  },
  // ── 蛮族联盟 n05（p27-p32 边缘蛮区）──
  {
    id: "p27",
    name: "\u6614\u63D0\u4E9A",
    terrain: "tundra",
    type: "capital",
    ownerId: "n05",
    isCapital: true,
    agriBase: 0.2,
    culture: "slavic",
    religion: "animism",
    initPop: 200,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 8, iron: 15 },
    adjacent: ["p15", "p22", "p28"],
    distToPlayerCapital: 7,
    elevation: "low",
    climate: "cold",
    hasRiver: true,
    isTradeNode: false,
    x: 640,
    y: 580
  },
  {
    id: "p28",
    name: "\u8428\u5C14\u9A6C\u63D0\u4E9A",
    terrain: "plain",
    type: "land",
    ownerId: "n05",
    isCapital: false,
    agriBase: 0.5,
    culture: "slavic",
    religion: "animism",
    initPop: 250,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 12 },
    adjacent: ["p27", "p29", "p31"],
    distToPlayerCapital: 8,
    elevation: "low",
    climate: "cold",
    hasRiver: true,
    isTradeNode: false,
    x: 640,
    y: 300
  },
  {
    id: "p29",
    name: "\u79D1\u5C14\u57FA\u65AF",
    terrain: "mountain",
    type: "land",
    ownerId: "n05",
    isCapital: false,
    agriBase: 0.3,
    culture: "persian",
    religion: "animism",
    initPop: 180,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 18 },
    adjacent: ["p20", "p21", "p23", "p25", "p28", "p30"],
    distToPlayerCapital: 7,
    elevation: "high",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 620,
    y: 140
  },
  {
    id: "p30",
    name: "\u7C73\u5E95",
    terrain: "desert",
    type: "land",
    ownerId: "n05",
    isCapital: false,
    agriBase: 0.2,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 220,
    initClassRatio: POOR_RATIO,
    baseResources: { spice: 8, luxury: 4 },
    adjacent: ["p21", "p29", "p31", "p38"],
    distToPlayerCapital: 8,
    elevation: "medium",
    climate: "arid",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 660,
    y: 120
  },
  {
    id: "p31",
    name: "\u91CC\u6D77\u8349\u539F",
    terrain: "plain",
    type: "land",
    ownerId: "n05",
    isCapital: false,
    agriBase: 0.4,
    culture: "persian",
    religion: "animism",
    initPop: 200,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 6, iron: 10 },
    adjacent: ["p28", "p30", "p32", "p38"],
    distToPlayerCapital: 9,
    elevation: "low",
    climate: "cold",
    hasRiver: false,
    isTradeNode: false,
    x: 680,
    y: 200
  },
  {
    id: "p32",
    name: "\u91CC\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "persian",
    religion: "animism",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p26", "p28", "p31", "p38"],
    distToPlayerCapital: 9,
    elevation: "low",
    climate: "cold",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 700,
    y: 160
  },
  // ── 中立未开发省份（p33-p42，开局属 'barbarian'）──
  {
    id: "p33",
    name: "\u4E0D\u5217\u98A0",
    terrain: "forest",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.5,
    culture: "celtic",
    religion: "animism",
    initPop: 300,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 25, iron: 15, stone: 10 },
    adjacent: ["p34", "p35"],
    distToPlayerCapital: 10,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 280,
    y: 120
  },
  {
    id: "p34",
    name: "\u9AD8\u5362",
    terrain: "forest",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.8,
    culture: "celtic",
    religion: "animism",
    initPop: 500,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 20, iron: 12 },
    adjacent: ["p08", "p33", "p35", "p36"],
    distToPlayerCapital: 4,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: false,
    x: 380,
    y: 200
  },
  {
    id: "p35",
    name: "\u4F0A\u6BD4\u5229\u4E9A",
    terrain: "hill",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.6,
    culture: "iberian",
    religion: "animism",
    initPop: 400,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 15, iron: 20, stone: 10 },
    adjacent: ["p33", "p34", "p36"],
    distToPlayerCapital: 6,
    elevation: "medium",
    climate: "mediterranean",
    hasRiver: true,
    isTradeNode: false,
    x: 300,
    y: 280
  },
  {
    id: "p36",
    name: "\u963F\u975E\u5229\u52A0",
    terrain: "coast",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.4,
    culture: "african",
    religion: "monotheism_a",
    initPop: 350,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 8, spice: 6 },
    adjacent: ["p34", "p35", "p37", "p39"],
    distToPlayerCapital: 6,
    elevation: "low",
    climate: "arid",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 1,
    x: 340,
    y: 480
  },
  {
    id: "p37",
    name: "\u6BDB\u91CC\u5854\u5C3C\u4E9A",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.2,
    culture: "african",
    religion: "monotheism_a",
    initPop: 200,
    initClassRatio: POOR_RATIO,
    baseResources: { spice: 5, luxury: 3 },
    adjacent: ["p36", "p39"],
    distToPlayerCapital: 8,
    elevation: "low",
    climate: "arid",
    hasRiver: false,
    isTradeNode: false,
    x: 320,
    y: 560
  },
  {
    id: "p38",
    name: "\u5E15\u63D0\u4E9A",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.3,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 400,
    initClassRatio: LAND_RATIO,
    baseResources: { spice: 10, silk: 5, luxury: 6 },
    adjacent: ["p30", "p31", "p32", "p40", "p41"],
    distToPlayerCapital: 10,
    elevation: "medium",
    climate: "arid",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 720,
    y: 100
  },
  {
    id: "p39",
    name: "\u52AA\u7C73\u5E95\u4E9A",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.2,
    culture: "african",
    religion: "monotheism_a",
    initPop: 250,
    initClassRatio: POOR_RATIO,
    baseResources: { wood: 5, spice: 4 },
    adjacent: ["p36", "p37", "p42"],
    distToPlayerCapital: 9,
    elevation: "low",
    climate: "arid",
    hasRiver: false,
    isTradeNode: false,
    x: 360,
    y: 600
  },
  {
    id: "p40",
    name: "\u6CE2\u65AF",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.4,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 500,
    initClassRatio: LAND_RATIO,
    baseResources: { spice: 12, silk: 8, luxury: 8 },
    adjacent: ["p38", "p41", "p43"],
    distToPlayerCapital: 12,
    elevation: "medium",
    climate: "arid",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 760,
    y: 120
  },
  {
    id: "p41",
    name: "\u5DF4\u6BD4\u4F26",
    terrain: "plain",
    type: "trade_node",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.8,
    culture: "persian",
    religion: "monotheism_b",
    initPop: 600,
    initClassRatio: TRADE_RATIO,
    baseResources: { spice: 15, silk: 10, luxury: 12 },
    adjacent: ["p38", "p40", "p42", "p43"],
    distToPlayerCapital: 13,
    elevation: "low",
    climate: "arid",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 760,
    y: 180
  },
  {
    id: "p42",
    name: "\u963F\u62C9\u4F2F",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.1,
    culture: "orient",
    religion: "monotheism_a",
    initPop: 300,
    initClassRatio: POOR_RATIO,
    baseResources: { spice: 8, luxury: 4 },
    adjacent: ["p39", "p41", "p43", "p44"],
    distToPlayerCapital: 14,
    elevation: "medium",
    climate: "arid",
    hasRiver: false,
    isTradeNode: false,
    x: 700,
    y: 280
  },
  // ── 远东贸易圈（p43-p50，开局均属 'barbarian'，是高端贸易节点）──
  {
    id: "p43",
    name: "\u5370\u5EA6\u6CB3\u53E3",
    terrain: "coast",
    type: "trade_node",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.6,
    culture: "indian",
    religion: "polytheism",
    initPop: 500,
    initClassRatio: TRADE_RATIO,
    baseResources: { spice: 20, silk: 8, luxury: 10 },
    adjacent: ["p40", "p41", "p42", "p44", "p45", "p46"],
    distToPlayerCapital: 16,
    elevation: "low",
    climate: "tropical",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 800,
    y: 240
  },
  {
    id: "p44",
    name: "\u963F\u62C9\u4F2F\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "indian",
    religion: "polytheism",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p42", "p43", "p45", "p46"],
    distToPlayerCapital: 16,
    elevation: "low",
    climate: "tropical",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 780,
    y: 320
  },
  {
    id: "p45",
    name: "\u6052\u6CB3",
    terrain: "jungle",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 1.2,
    culture: "indian",
    religion: "polytheism",
    initPop: 700,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 20, spice: 15, silk: 6 },
    adjacent: ["p43", "p44", "p46", "p47"],
    distToPlayerCapital: 18,
    elevation: "low",
    climate: "tropical",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 840,
    y: 260
  },
  {
    id: "p46",
    name: "\u5FB7\u5E72",
    terrain: "jungle",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.7,
    culture: "indian",
    religion: "polytheism",
    initPop: 400,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, spice: 8, luxury: 5 },
    adjacent: ["p43", "p44", "p45", "p47"],
    distToPlayerCapital: 18,
    elevation: "medium",
    climate: "tropical",
    hasRiver: true,
    isTradeNode: false,
    x: 840,
    y: 320
  },
  {
    id: "p47",
    name: "\u4E1D\u8DEF\u4E1C\u6BB5",
    terrain: "desert",
    type: "trade_node",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.2,
    culture: "sinic",
    religion: "ancestor",
    initPop: 350,
    initClassRatio: TRADE_RATIO,
    baseResources: { silk: 25, spice: 10, luxury: 8 },
    adjacent: ["p45", "p46", "p48", "p49"],
    distToPlayerCapital: 20,
    elevation: "medium",
    climate: "arid",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 880,
    y: 240
  },
  {
    id: "p48",
    name: "\u897F\u57DF",
    terrain: "desert",
    type: "land",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0.1,
    culture: "sinic",
    religion: "ancestor",
    initPop: 200,
    initClassRatio: POOR_RATIO,
    baseResources: { silk: 12, luxury: 4 },
    adjacent: ["p47", "p49"],
    distToPlayerCapital: 22,
    elevation: "medium",
    climate: "arid",
    hasRiver: false,
    isTradeNode: false,
    x: 900,
    y: 200
  },
  {
    id: "p49",
    name: "\u4E2D\u539F",
    terrain: "plain",
    type: "trade_node",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 1.6,
    culture: "sinic",
    religion: "ancestor",
    initPop: 1e3,
    initClassRatio: LAND_RATIO,
    baseResources: { wood: 25, silk: 15, luxury: 10 },
    adjacent: ["p47", "p48", "p50"],
    distToPlayerCapital: 24,
    elevation: "low",
    climate: "temperate",
    hasRiver: true,
    isTradeNode: true,
    tradeNodeTier: 3,
    x: 920,
    y: 240
  },
  {
    id: "p50",
    name: "\u4E1C\u6D77",
    terrain: "ocean",
    type: "ocean",
    ownerId: "barbarian",
    isCapital: false,
    agriBase: 0,
    culture: "sinic",
    religion: "ancestor",
    initPop: 0,
    initClassRatio: OCEAN_RATIO,
    baseResources: {},
    adjacent: ["p49"],
    distToPlayerCapital: 26,
    elevation: "low",
    climate: "temperate",
    hasRiver: false,
    isTradeNode: true,
    tradeNodeTier: 2,
    x: 940,
    y: 280
  }
];
var PROVINCE_BY_ID = Object.fromEntries(
  PROVINCES.map((p) => [p.id, p])
);
var PROVINCE_IDS = PROVINCES.map((p) => p.id);
var PROVINCE_COUNT = PROVINCES.length;
var LAND_PROVINCES = PROVINCES.filter((p) => p.type !== "ocean");
var OCEAN_PROVINCES = PROVINCES.filter((p) => p.type === "ocean");
var TRADE_NODES = PROVINCES.filter((p) => p.isTradeNode);
var FORTRESSES = PROVINCES.filter((p) => p.type === "fortress" || (p.fortressLevel ?? 0) > 0);

// src/data/governments.ts
var GOVERNMENTS = {
  monarchy: {
    id: "monarchy",
    name: "\u541B\u4E3B\u5236",
    description: "\u738B\u6743\u4E16\u88AD\uFF0C\u8D35\u65CF\u652F\u6301\u9AD8\uFF0C\u4F46\u6539\u9769\u7F13\u6162\uFF0C\u5546\u4EBA\u4E0E\u5B66\u8005\u4E0D\u6EE1\u3002",
    legitimacyBase: 60,
    stabilityBase: 55,
    efficiencyBase: 40,
    corruptionBase: 25,
    factionSatMod: { nobles: 15, merchants: -5, military: 5, commoners: 0, clergy: 5 },
    reformCostMultiplier: 1.3,
    mobilizationMultiplier: 1,
    unlockedPolicies: ["land_privilege", "royal_tax"],
    perTurn: { legitimacy: 0.2, factionSat: { nobles: 0.5, merchants: -0.3 } }
  },
  republic: {
    id: "republic",
    name: "\u5171\u548C\u56FD",
    description: "\u8BAE\u4E8B\u51B3\u65AD\uFF0C\u8D38\u6613\u4E0E\u79D1\u6280\u8F83\u5F3A\uFF0C\u4F46\u6D3E\u7CFB\u6597\u4E89\u6FC0\u70C8\uFF0C\u52A8\u5458\u8F83\u6162\u3002",
    legitimacyBase: 50,
    stabilityBase: 50,
    efficiencyBase: 55,
    corruptionBase: 20,
    factionSatMod: { nobles: -10, merchants: 15, military: -5, commoners: 5, clergy: -5 },
    reformCostMultiplier: 0.9,
    mobilizationMultiplier: 0.85,
    unlockedPolicies: ["free_trade", "civic_reform"],
    perTurn: { tradeMod: 1.1, sciPtMod: 1.03, factionSat: { merchants: 0.3, military: -0.2 } }
  },
  theocracy: {
    id: "theocracy",
    name: "\u795E\u6743\u5236",
    description: "\u6559\u6743\u81F3\u4E0A\uFF0C\u795E\u804C\u6EE1\u610F\uFF0C\u5F02\u6559\u5730\u533A\u6CBB\u7406\u538B\u529B\u5927\u3002",
    legitimacyBase: 55,
    stabilityBase: 55,
    efficiencyBase: 35,
    corruptionBase: 30,
    factionSatMod: { nobles: 0, merchants: -5, military: 0, commoners: 5, clergy: 25 },
    reformCostMultiplier: 1.2,
    mobilizationMultiplier: 0.9,
    unlockedPolicies: ["state_religion", "holy_war"],
    perTurn: { legitimacy: 0.1, factionSat: { clergy: 0.5, commoners: -0.2 } }
  },
  junta: {
    id: "junta",
    name: "\u519B\u653F\u5E9C",
    description: "\u6B66\u529B\u638C\u56FD\uFF0C\u519B\u961F\u5F3A\u5927\u9547\u538B\u9AD8\u6548\uFF0C\u6C11\u5FC3\u4F4E\u5916\u4EA4\u58F0\u671B\u5DEE\u3002",
    legitimacyBase: 35,
    stabilityBase: 50,
    efficiencyBase: 45,
    corruptionBase: 35,
    factionSatMod: { nobles: -5, merchants: -10, military: 25, commoners: -15, clergy: -10 },
    reformCostMultiplier: 1.1,
    mobilizationMultiplier: 1.3,
    unlockedPolicies: ["martial_law", "conscription"],
    perTurn: { stability: 0.3, factionSat: { military: 0.5, commoners: -1 } }
  },
  empire: {
    id: "empire",
    name: "\u5E1D\u56FD\u5236",
    description: "\u4E2D\u592E\u96C6\u6743\uFF0C\u884C\u653F\u4E0E\u7A0E\u6536\u5F3A\uFF0C\u4F46\u5730\u65B9\u53DB\u4E71\u538B\u529B\u9AD8\u3002",
    legitimacyBase: 55,
    stabilityBase: 50,
    efficiencyBase: 60,
    corruptionBase: 30,
    factionSatMod: { nobles: 5, merchants: 5, military: 10, commoners: -5, clergy: 0 },
    reformCostMultiplier: 1,
    mobilizationMultiplier: 1.1,
    unlockedPolicies: ["centralization", "imperial_tax"],
    perTurn: { efficiency: 0.3, corruption: 0.3, factionSat: { nobles: 0.2, merchants: 0.2 } }
  },
  tribe: {
    id: "tribe",
    name: "\u90E8\u843D\u5236",
    description: "\u90E8\u843D\u8054\u76DF\uFF0C\u519B\u4E8B\u5F3A\u4F46\u884C\u653F\u5F31\uFF0C\u96BE\u96C6\u6743\u3002",
    legitimacyBase: 40,
    stabilityBase: 60,
    efficiencyBase: 25,
    corruptionBase: 15,
    factionSatMod: { nobles: 10, merchants: -10, military: 15, commoners: 5, clergy: 5 },
    reformCostMultiplier: 1.5,
    mobilizationMultiplier: 1.2,
    unlockedPolicies: ["conscription"],
    perTurn: { factionSat: { military: 0.3, merchants: -0.3 } }
  },
  federation: {
    id: "federation",
    name: "\u8054\u90A6\u5236",
    description: "\u591A\u90A6\u8054\u5408\uFF0C\u5730\u65B9\u81EA\u6CBB\u5F3A\uFF0C\u5916\u4EA4\u7075\u6D3B\u4F46\u52A8\u5458\u6162\u3002",
    legitimacyBase: 50,
    stabilityBase: 60,
    efficiencyBase: 50,
    corruptionBase: 20,
    factionSatMod: { nobles: 5, merchants: 10, military: 0, commoners: 10, clergy: 0 },
    reformCostMultiplier: 0.95,
    mobilizationMultiplier: 0.9,
    unlockedPolicies: ["free_trade", "civic_reform"],
    perTurn: { stability: 0.1, tradeMod: 1.05 }
  },
  tyrant: {
    id: "tyrant",
    name: "\u50ED\u4E3B\u5236",
    description: "\u6B66\u529B\u7BE1\u6743\uFF0C\u519B\u65B9\u62E5\u6234\u4F46\u5408\u6CD5\u6027\u4F4E\u3002",
    legitimacyBase: 25,
    stabilityBase: 45,
    efficiencyBase: 50,
    corruptionBase: 40,
    factionSatMod: { nobles: -20, merchants: -10, military: 20, commoners: -10, clergy: -15 },
    reformCostMultiplier: 0.8,
    mobilizationMultiplier: 1.3,
    unlockedPolicies: ["martial_law", "conscription"],
    perTurn: { legitimacy: -0.3, factionSat: { military: 0.5, nobles: -0.5 } }
  },
  constitutional: {
    id: "constitutional",
    name: "\u541B\u4E3B\u7ACB\u5BAA",
    description: "\u738B\u6743\u53D7\u9650\uFF0C\u884C\u653F\u9AD8\u6548\uFF0C\u6539\u9769\u5FEB\u4F46\u738B\u6743\u5F31\u3002",
    legitimacyBase: 60,
    stabilityBase: 65,
    efficiencyBase: 65,
    corruptionBase: 15,
    factionSatMod: { nobles: 5, merchants: 15, military: -5, commoners: 10, clergy: 0 },
    reformCostMultiplier: 0.85,
    mobilizationMultiplier: 0.95,
    unlockedPolicies: ["free_trade", "civic_reform", "anti_corruption"],
    perTurn: { efficiency: 0.2, corruption: -0.2, factionSat: { merchants: 0.3 } }
  },
  merchant_republic: {
    id: "merchant_republic",
    name: "\u5546\u4E1A\u5171\u548C\u56FD",
    description: "\u5546\u4EBA\u638C\u56FD\uFF0C\u8D38\u6613\u6781\u5F3A\u4F46\u519B\u4E8B\u5F31\u3002",
    legitimacyBase: 45,
    stabilityBase: 50,
    efficiencyBase: 60,
    corruptionBase: 25,
    factionSatMod: { nobles: -15, merchants: 30, military: -10, commoners: 5, clergy: -5 },
    reformCostMultiplier: 0.9,
    mobilizationMultiplier: 0.75,
    unlockedPolicies: ["free_trade", "welfare"],
    perTurn: { tradeMod: 1.15, factionSat: { merchants: 0.5, military: -0.3 } }
  },
  priest_king: {
    id: "priest_king",
    name: "\u796D\u53F8\u738B\u5236",
    description: "\u738B\u6743\u4E0E\u6559\u6743\u5408\u4E00\uFF0C\u795E\u804C\u6781\u62E5\u6234\u4F46\u5F02\u6559\u7701\u96BE\u6CBB\u3002",
    legitimacyBase: 65,
    stabilityBase: 60,
    efficiencyBase: 40,
    corruptionBase: 25,
    factionSatMod: { nobles: 5, merchants: -5, military: 5, commoners: 5, clergy: 30 },
    reformCostMultiplier: 1.3,
    mobilizationMultiplier: 0.95,
    unlockedPolicies: ["state_religion", "holy_war"],
    perTurn: { legitimacy: 0.15, factionSat: { clergy: 0.5 } }
  },
  nomad_khanate: {
    id: "nomad_khanate",
    name: "\u6E38\u7267\u6C57\u56FD",
    description: "\u9A91\u5175\u4E3A\u738B\uFF0C\u673A\u52A8\u6781\u5F3A\u4F46\u519C\u8015\u5F31\u3001\u96BE\u5B9A\u5C45\u3002",
    legitimacyBase: 35,
    stabilityBase: 45,
    efficiencyBase: 30,
    corruptionBase: 20,
    factionSatMod: { nobles: 15, merchants: -5, military: 25, commoners: 0, clergy: -5 },
    reformCostMultiplier: 1.4,
    mobilizationMultiplier: 1.5,
    unlockedPolicies: ["conscription", "holy_war"],
    perTurn: { factionSat: { military: 0.5, merchants: -0.3 } }
  }
};
var GOVERNMENT_LIST = Object.values(GOVERNMENTS);

// src/data/factions.ts
var FACTIONS = {
  nobles: {
    id: "nobles",
    name: "\u8D35\u65CF",
    description: "\u4E16\u88AD\u571F\u5730\u9636\u5C42\uFF0C\u91CD\u89C6\u7279\u6743\u4E0E\u738B\u6743\u3002",
    initPower: 25,
    initSatisfaction: 55,
    policyBias: ["land_privilege", "centralization", "state_religion"],
    coupEventId: "evt_noble_coup"
  },
  merchants: {
    id: "merchants",
    name: "\u5546\u4EBA",
    description: "\u8D38\u6613\u9636\u5C42\uFF0C\u91CD\u89C6\u5E02\u573A\u4E0E\u7A0E\u6536\u81EA\u7531\u3002",
    initPower: 20,
    initSatisfaction: 50,
    policyBias: ["free_trade", "welfare"],
    coupEventId: "evt_merchant_strike"
  },
  military: {
    id: "military",
    name: "\u519B\u65B9",
    description: "\u519B\u961F\u52BF\u529B\uFF0C\u91CD\u89C6\u519B\u8D39\u4E0E\u6218\u4E89\u80DC\u5229\u3002",
    initPower: 20,
    initSatisfaction: 50,
    policyBias: ["conscription", "martial_law", "holy_war"],
    coupEventId: "evt_military_unrest"
  },
  commoners: {
    id: "commoners",
    name: "\u6C11\u4F17",
    description: "\u519C\u6C11\u4E0E\u5DE5\u4EBA\uFF0C\u91CD\u89C6\u7A0E\u6536\u4E0E\u7CAE\u98DF\u3002",
    initPower: 25,
    initSatisfaction: 50,
    policyBias: ["welfare", "civic_reform", "anti_corruption"],
    coupEventId: "evt_peasant_uprising"
  },
  clergy: {
    id: "clergy",
    name: "\u795E\u804C",
    description: "\u5B97\u6559\u52BF\u529B\uFF0C\u91CD\u89C6\u56FD\u6559\u4E0E\u6587\u5316\u653F\u7B56\u3002",
    initPower: 10,
    initSatisfaction: 50,
    policyBias: ["state_religion", "holy_war"],
    coupEventId: "evt_clergy_interference"
  }
};
var FACTION_LIST = Object.values(FACTIONS);

// src/data/national-characters.ts
var NATIONAL_CHARACTERS = {
  militarism: {
    id: "militarism",
    name: "\u519B\u56FD\u4E3B\u4E49",
    description: "\u9EE9\u6B66\u6269\u5F20\uFF0C\u519B\u961F\u5F3A\u4F46\u5916\u4EA4\u5B64\u7ACB\u3002",
    threshold: 70,
    bonuses: { conscriptionMod: 1.2, moraleMod: 1.1 },
    penalties: { relationMod: -10, warExhaustionMod: 1.15 }
  },
  commerce: {
    id: "commerce",
    name: "\u5546\u4E1A\u5171\u548C\u56FD",
    description: "\u91CD\u5546\u8F7B\u6B66\uFF0C\u8D38\u6613\u5BCC\u4F46\u52A8\u5458\u6162\u3002",
    threshold: 70,
    bonuses: { tradeMod: 1.25, marketCostMod: 0.9 },
    penalties: { noblesSat: -10, mobilizationMod: 0.85 }
  },
  religiosity: {
    id: "religiosity",
    name: "\u5B97\u6559\u5E1D\u56FD",
    description: "\u6559\u6743\u81F3\u4E0A\uFF0C\u795E\u804C\u62E5\u6234\u4F46\u5F02\u6559\u7701\u53DB\u4E71\u3002",
    threshold: 70,
    bonuses: { clergySat: 20, legitimacyMod: 5 },
    penalties: { rebellionMod: 1.2, sciPtMod: 0.9 }
  },
  technocracy: {
    id: "technocracy",
    name: "\u79D1\u6280\u56FD\u5BB6",
    description: "\u79D1\u7814\u5F3A\u56FD\uFF0C\u4F46\u8D35\u65CF\u62B5\u5236\u3002",
    threshold: 70,
    bonuses: { sciPtMod: 1.25 },
    penalties: { noblesSat: -10, stabilityMod: -5 }
  },
  authoritarian: {
    id: "authoritarian",
    name: "\u9AD8\u538B\u5E1D\u56FD",
    description: "\u94C1\u8155\u9547\u538B\uFF0C\u7A33\u5B9A\u4F46\u6C11\u5FC3\u4F4E\u3002",
    threshold: 70,
    bonuses: { stabilityMod: 10, efficiencyMod: 5 },
    penalties: { commonersSat: -20, relationMod: -15 }
  },
  welfare: {
    id: "welfare",
    name: "\u798F\u5229\u56FD\u5BB6",
    description: "\u6000\u67D4\u60E0\u6C11\uFF0C\u6C11\u4F17\u62E5\u6234\u4F46\u56FD\u5E93\u8D1F\u62C5\u3002",
    threshold: 70,
    bonuses: { commonersSat: 15, popGrowthMod: 1.1 },
    penalties: { goldMod: -15, noblesSat: -10 }
  },
  feudal: {
    id: "feudal",
    name: "\u5C01\u5EFA\u56FD\u5BB6",
    description: "\u8D35\u65CF\u7279\u6743\uFF0C\u738B\u6743\u7A33\u56FA\u4F46\u884C\u653F\u4F4E\u6548\u3002",
    threshold: 70,
    bonuses: { noblesSat: 20, legitimacyMod: 5 },
    penalties: { efficiencyMod: -10, merchantsSat: -10 }
  },
  revolutionary: {
    id: "revolutionary",
    name: "\u9769\u547D\u5171\u548C\u56FD",
    description: "\u6FC0\u8FDB\u6539\u9769\uFF0C\u6C11\u4F17\u62E5\u62A4\u4F46\u90BB\u56FD\u8B66\u60D5\u3002",
    threshold: 70,
    bonuses: { commonersSat: 15 },
    penalties: { noblesSat: -30 }
  },
  maritime: {
    id: "maritime",
    name: "\u6D77\u6D0B\u8D38\u6613",
    description: "\u91CD\u89C6\u6D77\u8D38\uFF0C\u8D38\u6613\u5F3A\u4F46\u9646\u519B\u5F31\u3002",
    threshold: 70,
    bonuses: { tradeMod: 1.3 },
    penalties: { combatMod: 0.9 }
  },
  centralization: {
    id: "centralization",
    name: "\u4E2D\u592E\u96C6\u6743",
    description: "\u96C6\u6743\u9AD8\u6548\uFF0C\u4F46\u5730\u65B9\u53CD\u5F39\u3002",
    threshold: 70,
    bonuses: { efficiencyMod: 15, tradeMod: 1.1 },
    penalties: { rebellionMod: 1.15, merchantsSat: -5 }
  },
  // ── D6 扩充：+4 性格到 15 ──
  isolationist: {
    id: "isolationist",
    name: "\u5B64\u7ACB\u4E3B\u4E49",
    description: "\u6D77\u7981\u9501\u56FD\uFF0C\u7A33\u5B9A\u4F46\u8D38\u6613\u8870\u3002",
    threshold: 70,
    bonuses: { stabilityMod: 12, legitimacyMod: 5 },
    penalties: { tradeMod: 0.7, influenceMod: -10, sciPtMod: 0.85 }
  },
  expansionist: {
    id: "expansionist",
    name: "\u6269\u5F20\u4E3B\u4E49",
    description: "\u9AD8\u901F\u6269\u5F20\u4F46\u6CBB\u7406\u538B\u529B\u5267\u589E\u3002",
    threshold: 70,
    bonuses: { conscriptionMod: 1.15, mobilizationMod: 1.15 },
    penalties: { rebellionMod: 1.25, warExhaustionMod: 1.2, efficiencyMod: -8 }
  },
  scholarly: {
    id: "scholarly",
    name: "\u6587\u6CBB\u56FD\u5BB6",
    description: "\u79D1\u7814\u6587\u5316\u5F3A\u4F46\u519B\u529B\u5F31\u3002",
    threshold: 70,
    bonuses: { sciPtMod: 1.3, assimilationMod: 5, legitimacyMod: 3 },
    penalties: { combatMod: 0.85, moraleMod: 0.9, militarySat: -10 }
  },
  mercantilist: {
    id: "mercantilist",
    name: "\u91CD\u5546\u4E3B\u4E49",
    description: "\u56E4\u91D1\u5F3A\u56FD\u4F46\u6C11\u751F\u4F4E\u3002",
    threshold: 70,
    bonuses: { goldMod: 20, tradeMod: 1.15 },
    penalties: { commonersSat: -15, popGrowthMod: 0.95, stabilityMod: -5 }
  },
  balanced: {
    id: "balanced",
    name: "\u5747\u8861\u53D1\u5C55",
    description: "\u65E0\u660E\u663E\u503E\u5411\uFF0C\u73A9\u5BB6\u9ED8\u8BA4\u3002",
    threshold: 0,
    bonuses: {},
    penalties: {}
  }
};
var BEHAVIOR_MAPPINGS = [
  { actionId: "declare_war", tendencyGain: { militarism: 3 } },
  { actionId: "build_market", tendencyGain: { commerce: 2, maritime: 1 } },
  { actionId: "research_tech", tendencyGain: { technocracy: 2 } },
  { actionId: "suppress_populace", tendencyGain: { authoritarian: 3 } },
  { actionId: "appease_populace", tendencyGain: { welfare: 2 } },
  { actionId: "protect_nobles", tendencyGain: { feudal: 2 } },
  { actionId: "persecute_religion", tendencyGain: { religiosity: 3, authoritarian: 1 } },
  { actionId: "radical_reform", tendencyGain: { revolutionary: 2 } },
  { actionId: "centralize", tendencyGain: { centralization: 2 } },
  { actionId: "build_farm", tendencyGain: { welfare: 1 } },
  { actionId: "build_road", tendencyGain: { centralization: 1 } },
  { actionId: "conscription", tendencyGain: { militarism: 1 } },
  // ── D6 扩充：+4 性格行为映射 ──
  { actionId: "close_borders", tendencyGain: { isolationist: 3, authoritarian: 1 } },
  { actionId: "annex_province", tendencyGain: { expansionist: 2, militarism: 1 } },
  { actionId: "found_academy", tendencyGain: { scholarly: 2, technocracy: 1 } },
  { actionId: "hoard_gold", tendencyGain: { mercantilist: 2, commerce: 1 } },
  { actionId: "build_granary", tendencyGain: { mercantilist: 1, welfare: 1 } },
  { actionId: "censor_scholars", tendencyGain: { isolationist: 1, authoritarian: 1 } }
];
var BEHAVIOR_MAP_BY_ACTION = Object.fromEntries(
  BEHAVIOR_MAPPINGS.map((b) => [b.actionId, b])
);

// src/data/regions.ts
var REGIONS = [
  {
    continent: "mediterranean",
    name: "Mediterranean",
    nameCn: "\u5730\u4E2D\u6D77",
    culture: "latin",
    religion: "polytheism",
    terrainBias: ["coast", "plain", "hill", "island"],
    climate: "mediterranean",
    nationCount: { S: 1, A: 2, B: 4, C: 7, D: 6 },
    nationNamePool: ["\u7F57\u9A6C", "\u8FE6\u592A\u57FA", "\u53D9\u62C9\u53E4", "\u9A6C\u897F\u5229\u4E9A", "\u5854\u5170\u6258", "\u65AF\u5DF4\u8FBE", "\u96C5\u5178", "\u79D1\u6797\u65AF", "\u6614\u5170\u5C3C", "\u963F\u594E\u83B1\u4E9A", "\u8BFA\u62C9", "\u5361\u666E\u4E9A"],
    provinceNamePool: ["\u62C9\u4E01\u59C6", "\u574E\u5E15\u5C3C\u4E9A", "\u897F\u897F\u91CC", "\u963F\u666E\u5229\u4E9A", "\u4F0A\u7279\u9C81\u91CC\u4E9A", "\u8428\u8C1F\u5948", "\u5362\u5361\u5C3C\u4E9A", "\u5E03\u9C81\u63D0\u4E4C\u59C6", "\u5361\u62C9\u5E03\u91CC\u4E9A", "\u7FC1\u5E03\u91CC\u4E9A"],
    rulerNamePool: ["\u5E03\u9C81\u56FE", "\u897F\u5E87\u963F", "\u51EF\u6492", "\u5E9E\u57F9", "\u5B89\u4E1C\u5C3C", "\u5965\u53E4\u65AF\u90FD", "\u5C3C\u7984", "\u56FE\u62C9\u771F", "\u54C8\u5FB7\u826F", "\u9A6C\u53EF"],
    goldMod: 1.1,
    foodMod: 1,
    militaryMod: 1.1,
    xRange: [300, 500],
    yRange: [250, 400]
  },
  {
    continent: "europe_w",
    name: "Western Europe",
    nameCn: "\u897F\u6B27",
    culture: "germanic",
    religion: "monotheism_a",
    terrainBias: ["plain", "forest", "coast", "hill"],
    climate: "temperate",
    nationCount: { S: 0, A: 1, B: 3, C: 7, D: 7 },
    nationNamePool: ["\u6CD5\u5170\u514B", "\u52C3\u826E\u7B2C", "\u963F\u57FA\u5766", "\u8BFA\u66FC\u5E95", "\u5E03\u5217\u5854\u5C3C", "\u4F5B\u5170\u5FB7\u65AF", "\u6D1B\u6797", "\u8428\u4F0F\u4F9D", "\u666E\u7F57\u65FA\u65AF", "\u52A0\u65AF\u79D1\u6D85"],
    provinceNamePool: ["\u5DF4\u9ECE", "\u91CC\u6602", "\u56FE\u5362\u5179", "\u6CE2\u5C14\u591A", "\u9C81\u6602", "\u5170\u65AF", "\u5357\u7279", "\u9A6C\u8D5B", "\u91CC\u5C14", "\u65AF\u7279\u62C9\u65AF\u5821"],
    rulerNamePool: ["\u67E5\u7406", "\u8DEF\u6613", "\u8153\u529B", "\u4EA8\u5229", "\u7F57\u8D1D\u5C14", "\u5A01\u5EC9", "\u7406\u67E5", "\u5F17\u6717\u7D22\u74E6", "\u8153\u7279\u70C8", "\u5965\u6258"],
    goldMod: 1,
    foodMod: 1.1,
    militaryMod: 0.9,
    xRange: [100, 300],
    yRange: [100, 250]
  },
  {
    continent: "europe_e",
    name: "Eastern Europe",
    nameCn: "\u4E1C\u6B27",
    culture: "slavic",
    religion: "monotheism_a",
    terrainBias: ["plain", "forest", "hill"],
    climate: "temperate",
    nationCount: { S: 0, A: 1, B: 3, C: 6, D: 8 },
    nationNamePool: ["\u57FA\u8F85", "\u83AB\u65AF\u79D1", "\u8BFA\u592B\u54E5\u7F57\u5FB7", "\u6CE2\u5170", "\u6CE2\u5E0C\u7C73\u4E9A", "\u5308\u7259\u5229", "\u74E6\u62C9\u51E0\u4E9A", "\u6469\u5C14\u8FBE\u7EF4\u4E9A", "\u7ACB\u9676\u5B9B", "\u514B\u7F57\u5730\u4E9A"],
    provinceNamePool: ["\u57FA\u8F85", "\u83AB\u65AF\u79D1", "\u534E\u6C99", "\u5E03\u62C9\u683C", "\u5E03\u8FBE\u4F69\u65AF", "\u5E03\u52A0\u52D2\u65AF\u7279", "\u660E\u65AF\u514B", "\u5229\u6C83\u592B", "\u8428\u683C\u52D2\u5E03", "\u7D22\u83F2\u4E9A"],
    rulerNamePool: ["\u5F17\u62C9\u57FA\u7C73\u5C14", "\u4F0A\u4E07", "\u74E6\u897F\u91CC", "\u5FB7\u7C73\u7279\u91CC", "\u9C8D\u91CC\u65AF", "\u4E9A\u5386\u5C71\u5927", "\u7C73\u54C8\u4F0A\u5C14", "\u5C3C\u53E4\u62C9", "\u5F7C\u5F97", "\u5B89\u5FB7\u70C8"],
    goldMod: 0.8,
    foodMod: 1,
    militaryMod: 1.1,
    xRange: [400, 600],
    yRange: [50, 200]
  },
  {
    continent: "europe_n",
    name: "Northern Europe",
    nameCn: "\u5317\u6B27",
    culture: "nordic",
    religion: "animism",
    terrainBias: ["tundra", "forest", "coast"],
    climate: "cold",
    nationCount: { S: 0, A: 0, B: 1, C: 5, D: 7 },
    nationNamePool: ["\u4E39\u9EA6", "\u745E\u5178", "\u632A\u5A01", "\u82AC\u5170", "\u51B0\u5C9B", "\u54E5\u7279\u5170", "\u8428\u7C73", "\u6CE2\u7F8E\u62C9\u5C3C\u4E9A", "\u6885\u514B\u4F26\u5821", "\u8377\u5C14\u65AF\u5766"],
    provinceNamePool: ["\u54E5\u672C\u54C8\u6839", "\u65AF\u5FB7\u54E5\u5C14\u6469", "\u5965\u65AF\u9646", "\u8D6B\u5C14\u8F9B\u57FA", "\u5351\u5C14\u6839", "\u4E4C\u666E\u8428\u62C9", "\u9686\u5FB7", "\u56FE\u5C14\u5E93", "\u7279\u9686\u8D6B\u59C6", "\u96F7\u514B\u96C5\u672A\u514B"],
    rulerNamePool: ["\u5965\u62C9\u592B", "\u54C8\u62C9\u5C14", "\u57C3\u91CC\u514B", "\u9A6C\u683C\u52AA\u65AF", "\u53E4\u65AF\u5854\u592B", "\u6BD4\u7EA6\u6069", "\u62C9\u683C\u7EB3", "\u897F\u683C\u5FB7", "\u514B\u52AA\u7279", "\u65AF\u97E6\u6069"],
    goldMod: 0.7,
    foodMod: 0.6,
    militaryMod: 1.2,
    xRange: [200, 450],
    yRange: [0, 100]
  },
  {
    continent: "middle_east",
    name: "Middle East",
    nameCn: "\u4E2D\u4E1C",
    culture: "arab",
    religion: "monotheism_b",
    terrainBias: ["desert", "mountain", "coast"],
    climate: "arid",
    nationCount: { S: 0, A: 1, B: 3, C: 6, D: 6 },
    nationNamePool: ["\u6CE2\u65AF", "\u5DF4\u6BD4\u4F26", "\u4E9A\u8FF0", "\u8153\u5C3C\u57FA", "\u5E15\u63D0\u4E9A", "\u585E\u7409\u53E4", "\u72B9\u5730\u4E9A", "\u7EB3\u5DF4\u6CF0", "\u7C73\u5E95", "\u57C3\u5170"],
    provinceNamePool: ["\u5DF4\u683C\u8FBE", "\u5927\u9A6C\u58EB\u9769", "\u8036\u8DEF\u6492\u51B7", "\u5B89\u6761\u514B", "\u6CF0\u5C14", "\u897F\u987F", "\u4F69\u7279\u62C9", "\u82CF\u8428", "\u57C3\u514B\u5DF4\u5766\u90A3", "\u5C3C\u5C3C\u5FAE"],
    rulerNamePool: ["\u5C45\u9C81\u58EB", "\u5927\u6D41\u58EB", "\u859B\u897F\u65AF", "\u963F\u5854\u859B\u897F\u65AF", "\u7C73\u7279\u91CC\u8FBE\u7279", "\u5B89\u6761\u514B", "\u5E0C\u5F8B", "\u8428\u62C9\u4E01", "\u54C8\u4F26", "\u9A6C\u7A46\u5FB7"],
    goldMod: 1.2,
    foodMod: 0.7,
    militaryMod: 1,
    xRange: [500, 700],
    yRange: [200, 350]
  },
  {
    continent: "africa_n",
    name: "North Africa",
    nameCn: "\u5317\u975E",
    culture: "african",
    religion: "monotheism_b",
    terrainBias: ["desert", "coast", "plain"],
    climate: "arid",
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 7 },
    nationNamePool: ["\u57C3\u53CA", "\u52AA\u6BD4\u4E9A", "\u6614\u5170\u5C3C\u52A0", "\u7A81\u5C3C\u65AF", "\u963F\u5C14\u53CA\u5C14", "\u6469\u6D1B\u54E5", "\u6BDB\u91CC\u5854\u5C3C\u4E9A", "\u963F\u975E\u5229\u52A0", "\u7684\u9ECE\u6CE2\u91CC", "\u8D39\u8D5E"],
    provinceNamePool: ["\u5F00\u7F57", "\u4E9A\u5386\u5C71\u5927", "\u8FE6\u592A\u57FA", "\u5229\u6BD4\u4E9A", "\u7A81\u5C3C\u65AF", "\u963F\u5C14\u53CA\u5C14", "\u975E\u65AF", "\u9A6C\u62C9\u5580\u4EC0", "\u963F\u65AF\u65FA", "\u9EA6\u7F57\u57C3"],
    rulerNamePool: ["\u6258\u52D2\u5BC6", "\u514B\u83B1\u5965\u5E15\u7279\u62C9", "\u54C8\u592B\u8428", "\u66FC\u8428", "\u82CF\u83B1\u66FC", "\u4F0A\u5FB7\u91CC\u65AF", "\u963F\u535C\u675C\u62C9", "\u7A46\u7F55\u9ED8\u5FB7", "\u4F18\u7D20\u798F", "\u963F\u9A6C\u5C14"],
    goldMod: 0.9,
    foodMod: 0.6,
    militaryMod: 0.9,
    xRange: [250, 500],
    yRange: [350, 480]
  },
  {
    continent: "africa_s",
    name: "Sub-Saharan Africa",
    nameCn: "\u5357\u975E",
    culture: "african",
    religion: "animism",
    terrainBias: ["jungle", "plain", "forest"],
    climate: "tropical",
    nationCount: { S: 0, A: 0, B: 2, C: 6, D: 9 },
    nationNamePool: ["\u963F\u514B\u82CF\u59C6", "\u9A6C\u91CC", "\u6851\u6D77", "\u52A0\u7EB3", "\u8D1D\u5B81", "\u5E93\u5DF4", "\u5927\u6D25\u5DF4\u5E03\u97E6", "\u521A\u679C", "\u5362\u65FA\u8FBE", "\u5E03\u9686\u8FEA", "\u7D22\u9A6C\u91CC", "\u83AB\u897F"],
    provinceNamePool: ["\u963F\u514B\u82CF\u59C6", "\u5EF7\u5DF4\u514B\u56FE", "\u52A0\u5965", "\u5E93\u9A6C\u897F", "\u8D1D\u5B81\u57CE", "\u5927\u6D25\u5DF4\u5E03\u97E6", "\u91D1\u6C99\u8428", "\u57FA\u52A0\u5229", "\u6469\u52A0\u8FEA\u6C99", "\u8499\u5DF4\u8428"],
    rulerNamePool: ["\u66FC\u8428", "\u6851\u5C3C", "\u963F\u65AF\u57FA\u4E9A", "\u5965\u585E", "\u57C3\u6D25\u7EB3", "\u59C6\u74E6\u5854", "\u5361\u585E", "\u5362\u52A0\u5FB7", "\u963F\u91CC", "\u6613\u535C\u62C9\u6B23"],
    goldMod: 0.7,
    foodMod: 0.8,
    militaryMod: 0.8,
    xRange: [350, 550],
    yRange: [480, 650]
  },
  {
    continent: "asia_central",
    name: "Central Asia",
    nameCn: "\u4E2D\u4E9A",
    culture: "turkic",
    religion: "monotheism_b",
    terrainBias: ["desert", "plain", "mountain"],
    climate: "arid",
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 8 },
    nationNamePool: ["\u5927\u590F", "\u7C9F\u7279", "\u82B1\u524C\u5B50\u6A21", "\u5688\u54D2", "\u7A81\u53A5", "\u56DE\u9E58", "\u5951\u4E39", "\u515A\u9879", "\u5410\u8543", "\u4E8E\u9617", "\u9F9F\u5179", "\u9AD8\u660C"],
    provinceNamePool: ["\u6492\u9A6C\u5C14\u7F55", "\u5E03\u54C8\u62C9", "\u5854\u4EC0\u5E72", "\u6885\u5C14\u592B", "\u5580\u4EC0", "\u6566\u714C", "\u697C\u5170", "\u9F9F\u5179", "\u54C8\u5BC6", "\u5410\u9C81\u756A"],
    rulerNamePool: ["\u5E16\u6728\u513F", "\u6210\u5409\u601D", "\u5FFD\u5FC5\u70C8", "\u672F\u8D64", "\u5BDF\u5408\u53F0", "\u7A9D\u9614\u53F0", "\u62D6\u96F7", "\u62D4\u90FD", "\u65ED\u70C8\u5140", "\u963F\u91CC\u4E0D\u54E5"],
    goldMod: 0.8,
    foodMod: 0.6,
    militaryMod: 1.3,
    xRange: [600, 800],
    yRange: [100, 250]
  },
  {
    continent: "asia_east",
    name: "East Asia",
    nameCn: "\u4E1C\u4E9A",
    culture: "sinic",
    religion: "sinic_religion",
    terrainBias: ["plain", "coast", "forest", "mountain"],
    climate: "temperate",
    nationCount: { S: 1, A: 1, B: 3, C: 6, D: 7 },
    nationNamePool: ["\u79E6", "\u6C49", "\u9B4F", "\u8700", "\u5434", "\u664B", "\u968B", "\u5510", "\u5B8B", "\u660E", "\u9AD8\u53E5\u4E3D", "\u767E\u6D4E"],
    provinceNamePool: ["\u957F\u5B89", "\u6D1B\u9633", "\u5F00\u5C01", "\u5357\u4EAC", "\u5317\u4EAC", "\u6210\u90FD", "\u5E7F\u5DDE", "\u676D\u5DDE", "\u8346\u5DDE", "\u5E7D\u5DDE", "\u5E73\u58E4", "\u6C49\u57CE"],
    rulerNamePool: ["\u79E6\u59CB\u7687", "\u6C49\u6B66\u5E1D", "\u5510\u592A\u5B97", "\u5B8B\u592A\u7956", "\u660E\u592A\u7956", "\u66F9\u64CD", "\u5218\u5907", "\u5B59\u6743", "\u53F8\u9A6C\u61FF", "\u8BF8\u845B\u4EAE"],
    goldMod: 1.2,
    foodMod: 1.2,
    militaryMod: 1.1,
    xRange: [750, 950],
    yRange: [150, 350]
  },
  {
    continent: "asia_south",
    name: "South Asia",
    nameCn: "\u5357\u4E9A",
    culture: "indian",
    religion: "indian_religion",
    terrainBias: ["jungle", "plain", "mountain"],
    climate: "tropical",
    nationCount: { S: 0, A: 1, B: 2, C: 5, D: 6 },
    nationNamePool: ["\u5B54\u96C0", "\u7B08\u591A", "\u83AB\u5367\u513F", "\u6212\u65E5", "\u6731\u7F57", "\u5E15\u62C9\u74E6", "\u6BD7\u5962\u8036\u90A3\u4F3D", "\u6CE2\u7F57", "\u9521\u5170", "\u5C3C\u6CCA\u5C14", "\u5B5F\u52A0\u62C9", "\u65C1\u906E\u666E"],
    provinceNamePool: ["\u534E\u6C0F\u57CE", "\u66F2\u5973\u57CE", "\u6469\u63ED\u9640", "\u7FAF\u9675\u4F3D", "\u5FB7\u5E72", "\u8FC8\u7D22\u5C14", "\u65C1\u906E\u666E", "\u5B5F\u52A0\u62C9", "\u53E4\u5409\u62C9\u7279", "\u62C9\u8D3E\u65AF\u5766"],
    rulerNamePool: ["\u963F\u80B2\u738B", "\u65C3\u9640\u7F57\u7B08\u591A", "\u6212\u65E5\u738B", "\u8FE6\u817B\u8272\u8FE6", "\u6BD7\u5962\u8036\u90A3\u4F3D", "\u6CE2\u7F57", "\u6731\u7F57", "\u5E15\u62C9\u74E6", "\u666E\u62C9\u5854\u666E", "\u5E0C\u74E6\u5409"],
    goldMod: 1,
    foodMod: 1.2,
    militaryMod: 0.9,
    xRange: [650, 800],
    yRange: [300, 450]
  },
  {
    continent: "americas",
    name: "Americas",
    nameCn: "\u7F8E\u6D32",
    culture: "indigenous_americas",
    religion: "sun_worship",
    terrainBias: ["plain", "mountain", "forest", "jungle", "coast"],
    climate: "temperate",
    nationCount: { S: 0, A: 1, B: 3, C: 8, D: 12 },
    nationNamePool: ["\u963F\u5179\u7279\u514B", "\u5370\u52A0", "\u739B\u96C5", "\u6613\u6D1B\u9B41", "\u5207\u7F57\u57FA", "\u82CF\u65CF", "\u7EB3\u74E6\u970D", "\u963F\u52B3\u574E", "\u56FE\u76AE", "\u52A0\u52D2\u6BD4", "\u5947\u5E03\u67E5", "\u6258\u5C14\u7279\u514B"],
    provinceNamePool: ["\u7279\u8BFA\u5947\u8482\u7279\u5170", "\u5E93\u65AF\u79D1", "\u8482\u5361\u5C14", "\u5E15\u4F26\u514B", "\u5947\u7434\u4F0A\u5BDF", "\u9A6C\u4E18\u6BD4\u4E18", "\u7279\u5965\u8482\u74E6\u574E", "\u660C\u660C", "\u6CE2\u54E5\u5927", "\u57FA\u591A"],
    rulerNamePool: ["\u8499\u7279\u7956\u9A6C", "\u5E15\u67E5\u5E93\u7279\u514B", "\u5361\u7C73\u7EB3", "\u4F0A\u5179\u79D1\u963F\u7279\u5C14", "\u963F\u7EF4\u56FE", "\u585E\u594E\u4E9A", "\u74DC\u7279\u83AB\u514B", "\u66FC\u79D1", "\u963F\u5854\u74E6\u5C14\u5E15", "\u74E6\u4F0A\u7EB3"],
    goldMod: 0.9,
    foodMod: 1,
    militaryMod: 0.8,
    xRange: [50, 200],
    yRange: [250, 600]
  },
  {
    continent: "oceania",
    name: "Oceania",
    nameCn: "\u5927\u6D0B\u6D32",
    culture: "polynesian",
    religion: "animism",
    terrainBias: ["island", "ocean", "coast"],
    climate: "tropical",
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 12 },
    nationNamePool: ["\u590F\u5A01\u5937", "\u5854\u5E0C\u63D0", "\u6C64\u52A0", "\u6590\u6D4E", "\u8428\u6469\u4E9A", "\u6BDB\u5229", "\u5DF4\u5E03\u4E9A", "\u722A\u54C7", "\u82CF\u95E8\u7B54\u814A", "\u5A46\u7F57\u6D32", "\u82CF\u62C9\u5A01\u897F", "\u9A6C\u6765"],
    provinceNamePool: ["\u706B\u5974\u9C81\u9C81", "\u5E15\u76AE\u63D0", "\u52AA\u5E93\u963F\u6D1B\u6CD5", "\u82CF\u74E6", "\u963F\u76AE\u4E9A", "\u5965\u514B\u5170", "\u83AB\u5C14\u5179\u6BD4\u6E2F", "\u96C5\u52A0\u8FBE", "\u5DE8\u6E2F", "\u53E4\u664B"],
    rulerNamePool: ["\u5361\u7F8E\u54C8\u7F8E\u54C8", "\u6CE2\u9A6C\u96F7", "\u56FE\u666E", "\u585E\u9C81", "\u9A6C\u5229\u6258", "\u970D\u5185", "\u5965\u8D6B", "\u6D77\u8FBE\u4E9A", "\u62C9\u5361", "\u5854\u9C81"],
    goldMod: 0.6,
    foodMod: 0.8,
    militaryMod: 0.6,
    xRange: [800, 1e3],
    yRange: [400, 600]
  }
];
var REGION_BY_ID = Object.fromEntries(
  REGIONS.map((r) => [r.continent, r])
);

// src/utils/random.ts
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function weightedPick(rng, items) {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const it of items) {
    const weight = Math.max(0, it.weight);
    if (weight <= 0) continue;
    if (r < weight) return it.item;
    r -= weight;
  }
  return [...items].reverse().find((item) => item.weight > 0)?.item ?? null;
}

// src/engine/worldgen.ts
var NATION_TEMPLATES = {
  S: { tier: "S", provinceCountRange: [15, 25], initGoldRange: [1500, 2500], initArmyRange: [1200, 1800], initTech: { agri: 2, mil: 2, admin: 2 }, governmentPool: ["empire", "monarchy"], characterPool: ["authoritarian", "balanced"] },
  A: { tier: "A", provinceCountRange: [6, 12], initGoldRange: [800, 1200], initArmyRange: [600, 1e3], initTech: { agri: 2, mil: 1, admin: 2 }, governmentPool: ["empire", "monarchy", "republic"], characterPool: ["balanced", "commerce", "technocracy"] },
  B: { tier: "B", provinceCountRange: [3, 6], initGoldRange: [400, 600], initArmyRange: [300, 500], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ["monarchy", "republic", "federation"], characterPool: ["balanced", "commerce", "technocracy", "welfare"] },
  C: { tier: "C", provinceCountRange: [2, 4], initGoldRange: [200, 300], initArmyRange: [150, 250], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ["monarchy", "republic", "tribe"], characterPool: ["balanced", "feudal", "commerce"] },
  D: { tier: "D", provinceCountRange: [1, 2], initGoldRange: [100, 150], initArmyRange: [80, 120], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ["tribe", "junta", "theocracy"], characterPool: ["militarism", "feudal", "balanced"] }
};
var KEY_NATIONS = [
  // 地中海
  { id: "n_med_rome", name: "\u7F57\u9A6C", tier: "A", government: "monarchy", character: "balanced", initGold: 300, initFood: 400, initArmy: { size: 200, morale: 60, training: 50, equipment: 40 } },
  { id: "n_med_carthage", name: "\u8FE6\u592A\u57FA", tier: "A", government: "republic", character: "commerce", initGold: 500, initFood: 350, initArmy: { size: 150, morale: 50, training: 45, equipment: 50 } },
  { id: "n_med_syracuse", name: "\u53D9\u62C9\u53E4", tier: "B", government: "republic", character: "technocracy", initGold: 350, initFood: 300, initArmy: { size: 180, morale: 55, training: 55, equipment: 55 } },
  // 中东
  { id: "n_me_persia", name: "\u6CE2\u65AF\u5E1D\u56FD", tier: "S", government: "empire", character: "authoritarian", initGold: 2e3, initFood: 500, initArmy: { size: 1500, morale: 60, training: 55, equipment: 55 } },
  { id: "n_me_parthia", name: "\u5E15\u63D0\u4E9A", tier: "A", government: "monarchy", character: "militarism", initGold: 800, initFood: 300, initArmy: { size: 800, morale: 65, training: 50, equipment: 50 } },
  // 东亚
  { id: "n_ea_qin", name: "\u79E6\u5E1D\u56FD", tier: "S", government: "empire", character: "authoritarian", initGold: 1800, initFood: 600, initArmy: { size: 1600, morale: 55, training: 60, equipment: 50 } },
  { id: "n_ea_han", name: "\u6C49", tier: "A", government: "monarchy", character: "balanced", initGold: 1e3, initFood: 500, initArmy: { size: 700, morale: 50, training: 50, equipment: 45 } },
  // 南亚
  { id: "n_sa_maurya", name: "\u5B54\u96C0\u5E1D\u56FD", tier: "A", government: "empire", character: "welfare", initGold: 900, initFood: 450, initArmy: { size: 650, morale: 50, training: 50, equipment: 45 } },
  // 北非
  { id: "n_na_egypt", name: "\u57C3\u53CA", tier: "B", government: "theocracy", character: "religiosity", initGold: 400, initFood: 350, initArmy: { size: 300, morale: 50, training: 45, equipment: 40 } },
  { id: "n_na_carthage", name: "\u52AA\u7C73\u5E95\u4E9A", tier: "B", government: "monarchy", character: "militarism", initGold: 380, initFood: 300, initArmy: { size: 320, morale: 55, training: 45, equipment: 40 } },
  // 美洲
  { id: "n_am_inca", name: "\u5370\u52A0\u5E1D\u56FD", tier: "A", government: "empire", character: "authoritarian", initGold: 700, initFood: 400, initArmy: { size: 600, morale: 55, training: 40, equipment: 35 } },
  { id: "n_am_aztec", name: "\u963F\u5179\u7279\u514B", tier: "B", government: "junta", character: "militarism", initGold: 400, initFood: 300, initArmy: { size: 400, morale: 60, training: 45, equipment: 30 } },
  { id: "n_am_maya", name: "\u739B\u96C5", tier: "B", government: "theocracy", character: "technocracy", initGold: 350, initFood: 280, initArmy: { size: 200, morale: 45, training: 40, equipment: 30 } },
  // 东欧
  { id: "n_ee_kievan", name: "\u57FA\u8F85\u7F57\u65AF", tier: "B", government: "monarchy", character: "balanced", initGold: 400, initFood: 350, initArmy: { size: 350, morale: 50, training: 45, equipment: 40 } },
  // 中亚
  { id: "n_ca_xiongnu", name: "\u5308\u5974\u6C57\u56FD", tier: "B", government: "nomad_khanate", character: "militarism", initGold: 300, initFood: 200, initArmy: { size: 500, morale: 65, training: 55, equipment: 35 } },
  // 西欧
  { id: "n_we_frank", name: "\u6CD5\u5170\u514B", tier: "A", government: "monarchy", character: "balanced", initGold: 800, initFood: 400, initArmy: { size: 600, morale: 50, training: 45, equipment: 45 } },
  // 大洋洲
  { id: "n_oc_srivijaya", name: "\u5BA4\u5229\u4F5B\u901D", tier: "B", government: "merchant_republic", character: "commerce", initGold: 450, initFood: 300, initArmy: { size: 250, morale: 45, training: 40, equipment: 35 } }
];
var KEY_NATION_REGION = {
  n_med_rome: "mediterranean",
  n_med_carthage: "mediterranean",
  n_med_syracuse: "mediterranean",
  n_me_persia: "middle_east",
  n_me_parthia: "middle_east",
  n_ea_qin: "asia_east",
  n_ea_han: "asia_east",
  n_sa_maurya: "asia_south",
  n_na_egypt: "africa_n",
  n_na_carthage: "africa_n",
  n_am_inca: "americas",
  n_am_aztec: "americas",
  n_am_maya: "americas",
  n_ee_kievan: "europe_e",
  n_ca_xiongnu: "asia_central",
  n_we_frank: "europe_w",
  n_oc_srivijaya: "oceania"
};
function generateWorld(seed, playerNationId, regionFilter) {
  const rng = mulberry32(seed);
  const nations = [];
  const provinces = [];
  const relations = [];
  let nationCounter = 0;
  let provinceCounter = 0;
  const regionsToGen = regionFilter && regionFilter.length > 0 ? REGIONS.filter((r) => regionFilter.includes(r.continent)) : REGIONS;
  for (const region of regionsToGen) {
    const regionNations = generateRegionNations(region, rng, nationCounter, playerNationId);
    nationCounter += regionNations.length;
    const regionProvinces = generateRegionProvinces(region, regionNations, rng, provinceCounter);
    provinceCounter += regionProvinces.length;
    for (let i = 0; i < regionNations.length; i++) {
      for (let j = i + 1; j < regionNations.length; j++) {
        const baseRel = rng() > 0.5 ? 10 : -5;
        relations.push({ from: regionNations[i].id, to: regionNations[j].id, relation: baseRel, trust: 50 });
        relations.push({ from: regionNations[j].id, to: regionNations[i].id, relation: baseRel, trust: 50 });
      }
    }
    nations.push(...regionNations);
    provinces.push(...regionProvinces);
  }
  return { nations, provinces, relations };
}
function generateRegionNations(region, rng, idOffset, playerNationId) {
  const result = [];
  const usedKeyNation = /* @__PURE__ */ new Set();
  const tiers = ["S", "A", "B", "C", "D"];
  let localId = 0;
  for (const tier of tiers) {
    const count = region.nationCount[tier];
    for (let i = 0; i < count; i++) {
      const nationId = `n_${idOffset + localId + 1}`;
      localId++;
      const keyNation = KEY_NATIONS.find((k) => !!k.id && KEY_NATION_REGION[k.id] === region.continent && k.tier === tier && !usedKeyNation.has(k.id));
      if (keyNation && (tier === "S" || tier === "A" || tier === "B")) {
        usedKeyNation.add(keyNation.id);
        const built = buildKeyNation(keyNation, nationId, region, rng);
        built.isPlayer = playerNationId === keyNation.id;
        result.push(built);
        continue;
      }
      const tmpl = NATION_TEMPLATES[tier];
      const nameIdx = Math.floor(rng() * region.nationNamePool.length);
      const name = region.nationNamePool[nameIdx] ?? `${region.nameCn}${tier}${i + 1}`;
      const rulerIdx = Math.floor(rng() * region.rulerNamePool.length);
      const govIdx = Math.floor(rng() * tmpl.governmentPool.length);
      const charIdx = Math.floor(rng() * tmpl.characterPool.length);
      const gold = lerp(tmpl.initGoldRange[0], tmpl.initGoldRange[1], rng()) * region.goldMod;
      const armySize2 = lerp(tmpl.initArmyRange[0], tmpl.initArmyRange[1], rng()) * region.militaryMod;
      const isPlayer = playerNationId === nationId;
      result.push({
        id: nationId,
        name,
        isPlayer,
        tier,
        government: tmpl.governmentPool[govIdx],
        character: tmpl.characterPool[charIdx],
        capital: "",
        // 后续由省份分配填充
        initGold: Math.round(gold),
        initFood: Math.round(gold * 0.8 * region.foodMod),
        initWood: Math.round(gold * 0.15),
        initIron: Math.round(gold * 0.05),
        initTaxRate: 0.12 + rng() * 0.08,
        initTech: { ...tmpl.initTech },
        initArmy: { size: Math.round(armySize2), morale: 50 + Math.round(rng() * 20), training: 40 + Math.round(rng() * 20), equipment: 35 + Math.round(rng() * 20) },
        ruler: { name: region.rulerNamePool[rulerIdx] ?? "\u65E0\u540D", ability: 40 + Math.round(rng() * 25), age: 25 + Math.round(rng() * 40) },
        aiWeights: buildAIWeights(tier, rng),
        initRelations: []
        // 后续由 relations 数组填充
      });
    }
  }
  return result;
}
function buildKeyNation(key, nationId, region, rng) {
  return {
    id: key.id ?? nationId,
    name: key.name ?? "\u672A\u540D",
    isPlayer: false,
    tier: key.tier ?? "B",
    government: key.government ?? "monarchy",
    character: key.character ?? "balanced",
    capital: "",
    initGold: key.initGold ?? 300,
    initFood: key.initFood ?? 300,
    initWood: Math.round((key.initGold ?? 300) * 0.15),
    initIron: Math.round((key.initGold ?? 300) * 0.05),
    initTaxRate: 0.15,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: key.initArmy ?? { size: 200, morale: 50, training: 50, equipment: 40 },
    ruler: { name: "\u65E0\u540D", ability: 50, age: 40 },
    aiWeights: buildAIWeights(key.tier ?? "B", rng),
    initRelations: []
  };
}
function buildAIWeights(tier, rng) {
  const base = { taxUp: 1, buildFarm: 1, suppress: 0.8, expandArmy: 0.8, alliance: 1, declareWar: 0.6, research: 1 };
  if (tier === "S" || tier === "A") {
    return { ...base, expandArmy: 1.2, declareWar: 0.9, research: 1.2 };
  }
  if (tier === "D") {
    return { ...base, taxUp: 0.6, buildFarm: 0.5, expandArmy: 0.4, declareWar: 0.3, alliance: 1.5 };
  }
  return base;
}
function addProvince(nation, region, rng, idOffset, provIdx, result, isCapital) {
  const provId = `p_${idOffset + provIdx + 1}`;
  const nameIdx = Math.floor(rng() * region.provinceNamePool.length);
  const terrainIdx = Math.floor(rng() * region.terrainBias.length);
  const terrain = region.terrainBias[terrainIdx];
  const x = lerp(region.xRange[0], region.xRange[1], rng());
  const y = lerp(region.yRange[0], region.yRange[1], rng());
  const pop = isCapital ? Math.round(lerp(800, 2e3, rng()) * (nation.tier === "S" ? 2 : 1)) : Math.round(lerp(200, 800, rng()));
  result.push({
    id: provId,
    name: `${region.provinceNamePool[nameIdx % region.provinceNamePool.length]}${!isCapital ? ` ${provIdx}` : ""}`,
    terrain,
    type: isCapital ? "capital" : terrain === "ocean" ? "ocean" : "land",
    ownerId: nation.id,
    isCapital,
    agriBase: terrain === "ocean" ? 0 : lerp(0.5, 1.5, rng()),
    culture: region.culture,
    religion: region.religion,
    initPop: terrain === "ocean" ? 0 : pop,
    initClassRatio: terrain === "ocean" ? { peasants: 0, workers: 0, merchants: 0, soldiers: 0, scholars: 0, nobles: 0, clergy: 0 } : { peasants: 0.5, workers: 0.2, merchants: 0.1, soldiers: 0.08, scholars: 0.04, nobles: 0.04, clergy: 0.04 },
    baseResources: { wood: Math.round(rng() * 5), iron: Math.round(rng() * 3) },
    adjacent: [],
    distToPlayerCapital: 0,
    elevation: terrain === "mountain" ? "high" : terrain === "hill" ? "medium" : "low",
    climate: region.climate,
    hasRiver: rng() > 0.6,
    isTradeNode: isCapital || rng() > 0.85,
    tradeNodeTier: isCapital ? 2 : rng() > 0.7 ? 1 : void 0,
    fortressLevel: isCapital ? 1 : 0,
    x,
    y
  });
  if (isCapital) nation.capital = provId;
}
function generateRegionProvinces(region, regionNations, rng, idOffset) {
  const result = [];
  const sortedNations = [...regionNations].sort((a, b) => {
    const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });
  const minProvinces = sortedNations.length;
  const totalProvinces = Math.max(minProvinces, Math.round(regionNations.reduce((s, nation) => s + lerp(
    NATION_TEMPLATES[nation.tier].provinceCountRange[0],
    NATION_TEMPLATES[nation.tier].provinceCountRange[1],
    rng()
  ), 0)));
  let provIdx = 0;
  for (const nation of sortedNations) {
    if (provIdx >= totalProvinces) break;
    addProvince(nation, region, rng, idOffset, provIdx, result, true);
    provIdx++;
  }
  for (const nation of sortedNations) {
    const extraCount = Math.max(0, Math.round(lerp(
      NATION_TEMPLATES[nation.tier].provinceCountRange[0],
      NATION_TEMPLATES[nation.tier].provinceCountRange[1],
      rng()
    )) - 1);
    for (let i = 0; i < extraCount && provIdx < totalProvinces; i++) {
      addProvince(nation, region, rng, idOffset, provIdx, result, false);
      provIdx++;
    }
  }
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i], b = result[j];
      if (a.ownerId === b.ownerId) {
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < 80) {
          a.adjacent.push(b.id);
          b.adjacent.push(a.id);
        }
      } else {
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < 50) {
          a.adjacent.push(b.id);
          b.adjacent.push(a.id);
        }
      }
    }
  }
  return result;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// src/engine/init.ts
function buildClasses(totalPop, ratio) {
  const ids = [
    { key: "peasants", label: "\u519C\u6C11" },
    { key: "workers", label: "\u5DE5\u4EBA" },
    { key: "merchants", label: "\u5546\u4EBA" },
    { key: "soldiers", label: "\u58EB\u5175" },
    { key: "scholars", label: "\u5B66\u8005" },
    { key: "nobles", label: "\u8D35\u65CF" },
    { key: "clergy", label: "\u795E\u804C" }
  ];
  return ids.map((i) => ({
    classId: i.key,
    count: Math.round(totalPop * ratio[i.key]),
    satisfaction: 50
  }));
}
function buildFactions(govId) {
  const gov = GOVERNMENTS[govId];
  return Object.values(FACTIONS).map((f) => ({
    id: f.id,
    power: f.initPower,
    satisfaction: clamp(f.initSatisfaction + gov.factionSatMod[f.id], 0, 100)
  }));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function buildGovernment(govId) {
  const g = GOVERNMENTS[govId];
  return {
    type: g.id,
    legitimacy: g.legitimacyBase,
    stability: g.stabilityBase,
    efficiency: g.efficiencyBase,
    corruption: g.corruptionBase
  };
}
function buildTendency() {
  return {
    militarism: 0,
    commerce: 0,
    religiosity: 0,
    technocracy: 0,
    authoritarian: 0,
    welfare: 0,
    feudal: 0,
    revolutionary: 0,
    maritime: 0,
    centralization: 0,
    isolationist: 0,
    expansionist: 0,
    scholarly: 0,
    mercantilist: 0
  };
}
function createWorldState(seed, playerNationId, regionFilter) {
  const world = generateWorld(seed, playerNationId, regionFilter);
  let playerId = playerNationId ?? "";
  if (!world.nations.some((n3) => n3.id === playerId)) {
    const marked = world.nations.find((n3) => n3.isPlayer);
    playerId = marked?.id ?? world.nations.find((n3) => n3.tier === "S" || n3.tier === "A")?.id ?? world.nations[0].id;
  }
  const nations = {};
  for (const nd of world.nations) {
    const isPlayer = nd.id === playerId;
    nations[nd.id] = {
      id: nd.id,
      name: nd.name,
      isPlayer,
      tier: nd.tier,
      government: buildGovernment(nd.government),
      character: nd.character,
      tendency: buildTendency(),
      activeCharacterBonuses: [],
      capital: nd.capital,
      ruler: { ...nd.ruler },
      taxRate: nd.initTaxRate,
      resources: {
        gold: nd.initGold,
        food: nd.initFood,
        wood: nd.initWood,
        iron: nd.initIron,
        adminPt: 5,
        sciPt: 0,
        influence: 20,
        supply: 50
      },
      factions: buildFactions(nd.government),
      tech: { agri: nd.initTech.agri, mil: nd.initTech.mil, admin: nd.initTech.admin, culture: 0, researchProgress: null },
      army: nd.capital ? [{ id: `initial_army_${nd.id}`, ownerId: nd.id, location: nd.capital, size: nd.initArmy.size, morale: nd.initArmy.morale, training: nd.initArmy.training, equipment: nd.initArmy.equipment, supply: 80 }] : [],
      activePolicies: [],
      activeLaws: [],
      activeTradeRoutes: [],
      embargoedRoutes: [],
      warExhaustion: 0,
      influence: 20,
      atWar: false,
      defeated: false
    };
  }
  const provinces = {};
  for (const pd of world.provinces) {
    provinces[pd.id] = {
      id: pd.id,
      name: pd.name,
      terrain: pd.terrain,
      ownerId: pd.ownerId,
      isCapital: pd.isCapital,
      agriBase: pd.agriBase,
      culture: pd.culture,
      religion: pd.religion,
      population: pd.initPop,
      classes: buildClasses(pd.initPop, pd.initClassRatio),
      assimilation: pd.ownerId === playerId ? 100 : 50,
      loyalty: pd.ownerId === playerId ? 70 : 50,
      unrest: 0,
      rebellionRisk: 0,
      buildings: [],
      garrison: 0,
      baseResources: pd.baseResources,
      adjacent: pd.adjacent,
      distToPlayerCapital: 0,
      x: pd.x,
      y: pd.y
    };
  }
  for (const nd of world.nations) {
    if (nd.capital && provinces[nd.capital]) {
      provinces[nd.capital].garrison = nd.initArmy.size;
    }
  }
  const relations = [];
  for (const r of world.relations) {
    relations.push({ from: r.from, to: r.to, relation: r.relation, trust: r.trust, threat: 0, tradeDep: 0, treaty: "none", truceTurns: 0 });
  }
  const state = {
    version: SAVE_VERSION,
    turn: 0,
    seed,
    entityIdCounter: 0,
    playerNationId: playerId,
    nations,
    provinces,
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
    chronicle: []
  };
  buildRelationMap(state);
  return state;
}
function buildRelationMap(state) {
  if (!state._relMap) {
    state._relMap = /* @__PURE__ */ new Map();
    for (const r of state.relations) state._relMap.set(`${r.from}|${r.to}`, r);
  }
}
function getRelationObj(from, to, state) {
  if (!state._relMap) buildRelationMap(state);
  return state._relMap.get(`${from}|${to}`);
}
function provincesOf(nationId, provinces) {
  return Object.values(provinces).filter((p) => p.ownerId === nationId);
}

// src/utils/math.ts
function clamp2(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// src/engine/formulas.ts
function stabilityTaxModifier(stability) {
  if (stability >= 60) return 1.2;
  if (stability >= 40) return 1;
  if (stability >= 30) return 0.8;
  return 0.5;
}
function corruptionModifier(corruption) {
  return clamp2(1 - corruption / 200, 0.5, 1);
}
function assimilationModifier(assimilation) {
  return clamp2(0.7 + assimilation / 300, 0.7, 1);
}
function computeTax(input) {
  const raw = input.population * input.baseTaxRate * input.taxEfficiency * stabilityTaxModifier(input.stability) * corruptionModifier(input.corruption) * assimilationModifier(input.assimilation);
  return Math.max(0, raw);
}
var TERRAIN_FOOD_MOD = {
  plain: 1.2,
  hill: 0.8,
  mountain: 0.3,
  coast: 1,
  forest: 0.6,
  desert: 0.3,
  tundra: 0.2,
  jungle: 0.9,
  swamp: 0.5,
  ocean: 0,
  island: 0.7
};
function agriTechModifier(agriLv) {
  return 1 + agriLv * 0.08;
}
function infrastructureFoodModifier(farmCount) {
  return 1 + farmCount * 0.1;
}
function computeFood(input) {
  return input.agriBase * input.peasantCount * TERRAIN_FOOD_MOD[input.terrain] * agriTechModifier(input.agriLv) * infrastructureFoodModifier(input.farmCount);
}
function computeCorruptionLoss(tax, corruption) {
  return tax * corruption / 200;
}
function computeTrade(input) {
  const marketMod = 1 + input.marketCount * 0.1;
  const dealMod = 1 + input.tradeDealCount * 0.15;
  const charMod = input.commerceActive ? 1.25 : 1;
  return input.baseTrade * marketMod * dealMod * charMod * input.tradeDepSafety;
}
function legitimacyDelta(factionAvgSat, corruption, warExhaustion, reformShockTurns) {
  let d = 2;
  d += (factionAvgSat - 50) / 25;
  if (corruption > 30) d -= (corruption - 30) / 10;
  d -= warExhaustion / 20;
  if (reformShockTurns > 0) d -= 2;
  return d;
}
function stabilityDelta(legitimacy, factionWeightedSat2, factionTotalPower, avgUnrest, warExhaustion, rebellionProvinceCount) {
  const ideal = factionTotalPower * 50;
  let d = (legitimacy - 50) / 15;
  d += (factionWeightedSat2 - ideal) / 80;
  d -= avgUnrest / 20;
  d -= warExhaustion / 12;
  d -= rebellionProvinceCount * 0.3;
  if (legitimacy < 40) d += 3;
  else if (legitimacy < 55) d += 1.5;
  return d;
}
function maxProvinces(adminLv, efficiency, centralizationActive, tier) {
  const tierBase = { S: 50, A: 25, B: 12, C: 6, D: 3 };
  const base = tierBase[tier ?? "C"] ?? 6;
  return base + adminLv + Math.floor(efficiency / 25) + (centralizationActive ? 2 : 0);
}
function stabilityPopModifier(stability) {
  if (stability >= 60) return 1.2;
  if (stability >= 40) return 1;
  if (stability >= 20) return 0.7;
  return 0.3;
}
function popGrowth(input) {
  const foodMod = clamp2(input.foodNeed > 0 ? input.food / input.foodNeed : 1, 0.3, 1.5);
  const warMod = input.atWar ? 0.7 : 1;
  const plagueMod = input.plague ? 0.5 : 1;
  const welfareMod = input.welfareActive ? 1.1 : 1;
  return input.population * input.baseGrowth * foodMod * stabilityPopModifier(input.stability) * warMod * plagueMod * welfareMod;
}
function milTechModifier(milLv) {
  return 1 + milLv * 0.08;
}
function computeCombat(input) {
  const techMod = milTechModifier(input.milLv);
  const generalMod = input.general / 50;
  const supplyMod = input.army.supply / 100;
  return input.army.size * (input.army.morale / 100) * (input.army.training / 100) * (input.army.equipment / 100) * techMod * generalMod * supplyMod * input.terrainMod;
}
function computeRebellion(input) {
  const cultureMod = input.cultureDiff ? 1.5 : 1;
  let religionMod = 1;
  if (input.religionDiff) {
    religionMod = input.religionPolicy === "tolerant" ? 1 : input.religionPolicy === "state" ? 1.3 : 2;
  }
  const garrisonMod = clamp2(1 - input.garrison / 1e3, 0.3, 1);
  const stabMod = clamp2((100 - input.stability) / 50, 0.5, 1.5);
  return input.unrest * cultureMod * religionMod * garrisonMod * stabMod;
}
function safeNonNegative(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
function resolveBattle(attackerPower, defenderPower, attackerSize, defenderSize) {
  const attPower = safeNonNegative(attackerPower);
  const defPower = safeNonNegative(defenderPower);
  const attSize = safeNonNegative(attackerSize);
  const defSize = safeNonNegative(defenderSize);
  const totalPower = attPower + defPower;
  if (totalPower <= 0) {
    return { progressDelta: 0, attackerLoss: 0, defenderLoss: 0, attackerMoraleDelta: 0, defenderMoraleDelta: 0 };
  }
  const ratio = attPower / totalPower;
  const rawDelta = (ratio - 0.5) * 60;
  const progressDelta = ratio === 0.5 ? 0 : ratio > 0.5 ? Math.max(rawDelta, 3) : Math.min(rawDelta, -3);
  const baseLoss = 0.05;
  const attackerLoss = clamp2(defPower / Math.max(attPower, 1) * baseLoss * attSize, 0, attSize);
  const defenderLoss = clamp2(attPower / Math.max(defPower, 1) * baseLoss * defSize, 0, defSize);
  return {
    progressDelta,
    attackerLoss,
    defenderLoss,
    attackerMoraleDelta: -5,
    defenderMoraleDelta: -5
  };
}
function warCostPerTurn(armySize2) {
  return {
    gold: armySize2 * 0.5,
    food: armySize2 * 1,
    exhaustionDelta: 2,
    stabilityDelta: -1,
    attrition: armySize2 * 0.02
  };
}
function relationDrift(treaty, borderClash, threat, commonEnemy) {
  let d = 0;
  if (treaty === "trade") d += 2;
  if (treaty === "alliance") d += 1;
  if (borderClash) d -= 3;
  d -= threat / 20;
  if (commonEnemy) d += 3;
  return d;
}
function computeThreat(selfMil, otherMil, otherProvinceCount, relation) {
  const milPart = otherMil / Math.max(selfMil, 1) * 30;
  const provPart = otherProvinceCount / 10 * 20;
  const relPart = -relation / 2;
  return clamp2(milPart + provPart + relPart, 0, 100);
}
function researchCost(level, baseSci, baseGold) {
  return { sci: baseSci * level * level, gold: baseGold * level * 50 };
}
function assimilationDelta(roadCount, culturePolicy, efficiency, cultureDiff, farFromCapital) {
  let d = roadCount * 1;
  d += culturePolicy === "assimilate" ? 2 : 0;
  d += efficiency / 50;
  if (cultureDiff) d -= 1;
  if (farFromCapital) d -= 1;
  return d;
}
function loyaltyDelta(stability, assimilation, hasGarrison, unrest, welfareActive) {
  let d = (stability - 50) / 30;
  d += (assimilation - 50) / 30;
  if (hasGarrison) d += 5;
  d -= unrest / 10;
  if (welfareActive) d += 3;
  return d;
}
function activateTendency(tendency, threshold = 70) {
  const out = [];
  for (const k of Object.keys(tendency)) {
    if (tendency[k] >= threshold) out.push(k);
  }
  return out;
}
function factionWeightedSat(factions) {
  let weighted = 0, totalPower = 0;
  for (const f of factions) {
    weighted += f.power * f.satisfaction;
    totalPower += f.power;
  }
  const avgSat = factions.length ? factions.reduce((s, f) => s + f.satisfaction, 0) / factions.length : 50;
  return { weighted, totalPower, avgSat };
}
var TERRAIN_COMBAT_MOD = {
  plain: 1,
  hill: 1.1,
  mountain: 1.3,
  coast: 0.9,
  forest: 1.1,
  desert: 0.8,
  tundra: 0.7,
  jungle: 0.9,
  swamp: 0.8,
  ocean: 1,
  island: 1
};

// src/data/buildings.ts
var BUILDINGS = {
  farm: {
    id: "farm",
    name: "\u519C\u7530",
    description: "\u63D0\u5347\u7CAE\u98DF\u4EA7\u91CF\u3002\u5730\u5F62\u9002\u914D\uFF1A\u5E73\u539F\u6700\u4F73\u3002",
    costGold: 50,
    costWood: 20,
    costIron: 0,
    costAction: 1,
    yield: { food: 50 },
    terrainMod: { plain: 1.5, hill: 0.8, mountain: 0.3, coast: 1, forest: 0.6, desert: 0.3 },
    maxPerProvince: 5
  },
  road: {
    id: "road",
    name: "\u9053\u8DEF",
    description: "\u63D0\u5347\u7A0E\u6536\u6548\u7387\u4E0E\u540C\u5316\u901F\u5EA6\uFF0C\u8FDE\u63A5\u7701\u4EFD\u3002",
    costGold: 40,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { adminPt: 1, influence: 1 },
    terrainMod: { plain: 1.2, hill: 0.8, mountain: 0.5, coast: 1, forest: 0.7, desert: 0.5 },
    maxPerProvince: 3
  },
  market: {
    id: "market",
    name: "\u5E02\u573A",
    description: "\u63D0\u5347\u8D38\u6613\u6536\u5165\u4E0E\u5546\u4EBA\u6EE1\u610F\u5EA6\u3002",
    costGold: 80,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { gold: 30, influence: 2 },
    terrainMod: { plain: 1, hill: 1, mountain: 0.8, coast: 1.3, forest: 0.9, desert: 0.7 },
    maxPerProvince: 3
  },
  barracks: {
    id: "barracks",
    name: "\u5175\u8425",
    description: "\u63D0\u5347\u5F81\u5175\u901F\u5EA6\u4E0E\u519B\u4E8B\u8865\u7ED9\uFF0C\u519B\u65B9\u6EE1\u610F\u5EA6\u3002",
    costGold: 100,
    costWood: 40,
    costIron: 30,
    costAction: 1,
    yield: { supply: 20 },
    terrainMod: {},
    maxPerProvince: 2
  },
  mine: {
    id: "mine",
    name: "\u77FF\u5C71",
    description: "\u4EA7\u51FA\u94C1\u77FF\u4E0E\u5C11\u91CF\u91D1\u3002\u4EC5\u5C71\u5730/\u4E18\u9675\u9AD8\u4EA7\u3002",
    costGold: 60,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { iron: 15, gold: 10 },
    terrainMod: { mountain: 1.5, hill: 1.2, plain: 0.3, coast: 0.5, forest: 0.6, desert: 0.4 },
    maxPerProvince: 3
  },
  library: {
    id: "library",
    name: "\u5B66\u9662",
    description: "\u4EA7\u51FA\u79D1\u7814\u70B9\uFF0C\u63D0\u5347\u5B66\u8005\u6EE1\u610F\u5EA6\u3002",
    costGold: 120,
    costWood: 20,
    costIron: 10,
    costAction: 1,
    yield: { sciPt: 3 },
    terrainMod: {},
    prereqTech: "admin_lv2",
    maxPerProvince: 2
  },
  temple: {
    id: "temple",
    name: "\u795E\u6BBF",
    description: "\u63D0\u5347\u795E\u804C\u6EE1\u610F\u5EA6\u3001\u7A33\u5B9A\u5EA6\u3001\u540C\u5316\u5EA6\u3002",
    costGold: 90,
    costWood: 30,
    costIron: 0,
    costAction: 1,
    yield: { influence: 3, adminPt: 1 },
    terrainMod: {},
    maxPerProvince: 2
  },
  courthouse: {
    id: "courthouse",
    name: "\u6CD5\u9662",
    description: "\u964D\u4F4E\u8150\u8D25\u3001\u63D0\u5347\u884C\u653F\u80FD\u529B\u4E0E\u53EF\u7BA1\u7701\u6570\u3002",
    costGold: 150,
    costWood: 20,
    costIron: 20,
    costAction: 2,
    yield: { adminPt: 3 },
    terrainMod: {},
    prereqTech: "admin_lv3",
    maxPerProvince: 1
  },
  wall: {
    id: "wall",
    name: "\u57CE\u5899",
    description: "\u63D0\u5347\u7701\u4EFD\u9632\u5B88\u5730\u5F62\u4FEE\u6B63\uFF0C\u964D\u4F4E\u53DB\u4E71\u3002",
    costGold: 110,
    costWood: 50,
    costIron: 40,
    costAction: 1,
    yield: { supply: 5 },
    terrainMod: {},
    maxPerProvince: 1
  },
  // ── B 扩展：11 个新建筑，扩到 20 种 ──
  aqueduct: {
    id: "aqueduct",
    name: "\u5F15\u6E20",
    description: "\u5F15\u6C34\u704C\u6E89\uFF0C\u5E73\u539F\u4E0E\u4E18\u9675\u7CAE\u4EA7\u5927\u589E\u3002",
    costGold: 90,
    costWood: 40,
    costIron: 0,
    costAction: 1,
    yield: { food: 8 },
    terrainMod: { plain: 1.4, hill: 1.3 },
    prereqTech: "agri_lv2",
    maxPerProvince: 1
  },
  workshop: {
    id: "workshop",
    name: "\u5DE5\u574A",
    description: "\u624B\u5DE5\u4E1A\u805A\u96C6\uFF0C\u4EA7\u51FA\u6728\u6750\u4E0E\u5C11\u91CF\u7A0E\u6536\u3002",
    costGold: 80,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { wood: 6, gold: 4 },
    terrainMod: { plain: 1.2, hill: 1.1 },
    maxPerProvince: 2
  },
  academy: {
    id: "academy",
    name: "\u5B66\u9662",
    description: "\u57F9\u517B\u5B66\u8005\uFF0C\u5927\u5E45\u63D0\u5347\u79D1\u7814\u70B9\u3002",
    costGold: 140,
    costWood: 30,
    costIron: 0,
    costAction: 2,
    yield: { sciPt: 6, adminPt: 1 },
    terrainMod: {},
    prereqTech: "admin_lv3",
    maxPerProvince: 1
  },
  relay_station: {
    id: "relay_station",
    name: "\u9A7F\u7AD9",
    description: "\u63D0\u5347\u884C\u653F\u6548\u7387\u4E0E\u5F71\u54CD\u529B\u4F20\u64AD\u3002",
    costGold: 60,
    costWood: 25,
    costIron: 5,
    costAction: 1,
    yield: { adminPt: 2, influence: 1 },
    terrainMod: { plain: 1.2 },
    maxPerProvince: 1
  },
  mint: {
    id: "mint",
    name: "\u94F8\u5E01\u5382",
    description: "\u7A33\u5B9A\u5E01\u503C\uFF0C\u63D0\u5347\u7A0E\u6536\u4F46\u7565\u589E\u8150\u8D25\u3002",
    costGold: 160,
    costWood: 20,
    costIron: 40,
    costAction: 2,
    yield: { gold: 12 },
    terrainMod: {},
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  clinic: {
    id: "clinic",
    name: "\u533B\u7F72",
    description: "\u964D\u4F4E\u75AB\u75C5\u635F\u5931\uFF0C\u63D0\u5347\u4EBA\u53E3\u589E\u957F\u3002",
    costGold: 100,
    costWood: 20,
    costIron: 0,
    costAction: 1,
    yield: { adminPt: 1, food: 2 },
    terrainMod: {},
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  granary: {
    id: "granary",
    name: "\u7CAE\u4ED3",
    description: "\u50A8\u7CAE\u5907\u8352\uFF0C\u63D0\u5347\u7CAE\u98DF\u4E0A\u9650\u4E0E\u7A33\u5B9A\u5EA6\u3002",
    costGold: 70,
    costWood: 40,
    costIron: 0,
    costAction: 1,
    yield: { food: 5 },
    terrainMod: {},
    maxPerProvince: 2
  },
  port: {
    id: "port",
    name: "\u519B\u6E2F",
    description: "\u6CBF\u6D77\u4E0E\u6CB3\u6D41\u7701\u4EFD\u53EF\u5EFA\uFF0C\u63D0\u5347\u8865\u7ED9\u4E0E\u8D38\u6613\u3002",
    costGold: 120,
    costWood: 50,
    costIron: 20,
    costAction: 2,
    yield: { supply: 8, gold: 6, influence: 1 },
    terrainMod: { coast: 1.5, island: 1.3 },
    maxPerProvince: 1
  },
  lighthouse: {
    id: "lighthouse",
    name: "\u706F\u5854",
    description: "\u63D0\u5347\u6D77\u4E0A\u8D38\u6613\u6536\u5165\u4E0E\u5F71\u54CD\u529B\u3002",
    costGold: 90,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { gold: 5, influence: 2 },
    terrainMod: { coast: 1.4, island: 1.5 },
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  shrine: {
    id: "shrine",
    name: "\u795E\u50CF",
    description: "\u63D0\u5347\u5408\u6CD5\u6027\u4E0E\u795E\u804C\u6EE1\u610F\u5EA6\u3002",
    costGold: 80,
    costWood: 20,
    costIron: 10,
    costAction: 1,
    yield: { influence: 2 },
    terrainMod: {},
    maxPerProvince: 1
  },
  gardens: {
    id: "gardens",
    name: "\u56ED\u6797",
    description: "\u7687\u5BB6\u56ED\u6797\uFF0C\u63D0\u5347\u7A33\u5B9A\u5EA6\u4E0E\u5A01\u671B\u3002",
    costGold: 130,
    costWood: 30,
    costIron: 0,
    costAction: 2,
    yield: { influence: 3, adminPt: 1 },
    terrainMod: { plain: 1.2 },
    maxPerProvince: 1
  },
  // ── P3 质变节点：Lv6+ 科技解锁的高级建筑（每省限 1，强收益但高门槛）──
  great_library: {
    id: "great_library",
    name: "\u4E07\u5377\u697C",
    description: "\u6587\u5316 Lv6 \u89E3\u9501\u3002\u79D1\u7814\u70B9\u4EA7\u51FA\u7FFB\u500D\uFF0C\u5F71\u54CD\u529B\u8F90\u5C04\u90BB\u90A6\u3002",
    costGold: 400,
    costWood: 100,
    costIron: 20,
    costAction: 3,
    yield: { sciPt: 15, influence: 8, adminPt: 2 },
    terrainMod: {},
    prereqTech: "culture_lv6",
    maxPerProvince: 1
  },
  arsenal: {
    id: "arsenal",
    name: "\u6B66\u5E93",
    description: "\u519B\u4E8B Lv6 \u89E3\u9501\u3002\u88C5\u5907\u4E0E\u8865\u7ED9\u5927\u589E\uFF0C\u519B\u65B9\u6EE1\u610F\u5EA6\u6FC0\u589E\u3002",
    costGold: 500,
    costWood: 80,
    costIron: 120,
    costAction: 3,
    yield: { supply: 20, adminPt: 1 },
    terrainMod: {},
    prereqTech: "mil_lv6",
    maxPerProvince: 1
  },
  granary_empire: {
    id: "granary_empire",
    name: "\u5E1D\u56FD\u7CAE\u4ED3",
    description: "\u519C\u4E1A Lv6 \u89E3\u9501\u3002\u7CAE\u50A8\u767B\u9876\uFF0C\u65F1\u6D9D\u4FDD\u6536\uFF0C\u4EBA\u53E3\u589E\u957F\u52A0\u901F\u3002",
    costGold: 450,
    costWood: 150,
    costIron: 0,
    costAction: 3,
    yield: { food: 40, adminPt: 1 },
    terrainMod: { plain: 1.3 },
    prereqTech: "agri_lv6",
    maxPerProvince: 1
  },
  cathedral: {
    id: "cathedral",
    name: "\u5927\u5723\u5802",
    description: "\u884C\u653F Lv6 \u89E3\u9501\u3002\u5408\u6CD5\u6027\u6839\u57FA\u7A33\u56FA\uFF0C\u8150\u8D25\u5927\u964D\uFF0C\u540C\u5316\u52A0\u901F\u3002",
    costGold: 600,
    costWood: 80,
    costIron: 60,
    costAction: 3,
    yield: { influence: 6, adminPt: 4 },
    terrainMod: {},
    prereqTech: "admin_lv6",
    maxPerProvince: 1
  },
  // ── D3 扩充：+16 建筑到 40，每建筑含前置/差异化效果/地形适配 ──
  smithy: {
    id: "smithy",
    name: "\u94C1\u5320\u94FA",
    description: "\u953B\u94C1\u4E3A\u5668\uFF0C\u4EA7\u94C1\u4E0E\u88C5\u5907\u8865\u7ED9\uFF0C\u519B\u65B9\u4F9D\u8D56\u3002",
    costGold: 90,
    costWood: 20,
    costIron: 20,
    costAction: 1,
    yield: { iron: 8, supply: 4 },
    terrainMod: { mountain: 1.3, hill: 1.2 },
    maxPerProvince: 2
  },
  canal_wharf: {
    id: "canal_wharf",
    name: "\u6F15\u8FD0\u7801\u5934",
    description: "\u5E73\u539F\u6CB3\u6D41\u7701\u4EFD\u8D38\u6613\u67A2\u7EBD\uFF0C\u91D1\u5E01\u4E0E\u5F71\u54CD\u529B\u53CC\u5347\u3002",
    costGold: 140,
    costWood: 50,
    costIron: 10,
    costAction: 2,
    yield: { gold: 15, influence: 2 },
    terrainMod: { plain: 1.4, coast: 1.3 },
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  city_wall: {
    id: "city_wall",
    name: "\u57CE\u5899\u52A0\u56FA",
    description: "\u52A0\u56FA\u57CE\u9632\uFF0C\u53DB\u4E71\u4E0E\u5165\u4FB5\u62B5\u6297\u5927\u589E\u3002",
    costGold: 180,
    costWood: 60,
    costIron: 50,
    costAction: 2,
    yield: { supply: 8 },
    terrainMod: {},
    prereqTech: "mil_lv2",
    maxPerProvince: 1
  },
  scholar_academy: {
    id: "scholar_academy",
    name: "\u4E66\u9662",
    description: "\u805A\u8D24\u8BB2\u5B66\uFF0C\u79D1\u7814\u4E0E\u540C\u5316\u53CC\u5347\uFF0C\u5B66\u8005\u5411\u5F80\u3002",
    costGold: 160,
    costWood: 40,
    costIron: 0,
    costAction: 2,
    yield: { sciPt: 5, adminPt: 2 },
    terrainMod: { plain: 1.1 },
    prereqTech: "admin_lv3",
    maxPerProvince: 1
  },
  post_house: {
    id: "post_house",
    name: "\u9A7F\u9986",
    description: "\u901A\u653F\u4EE4\u8FBE\u8FB9\u8FDC\uFF0C\u884C\u653F\u4E0E\u540C\u5316\u52A0\u901F\u3002",
    costGold: 70,
    costWood: 30,
    costIron: 5,
    costAction: 1,
    yield: { adminPt: 2, influence: 1 },
    terrainMod: { plain: 1.2, hill: 0.9 },
    maxPerProvince: 2
  },
  silo: {
    id: "silo",
    name: "\u7B52\u4ED3",
    description: "\u6DF1\u50A8\u7CAE\uFF0C\u65F1\u6D9D\u4FDD\u6536\uFF0C\u7A33\u5B9A\u5EA6\u5347\u3002",
    costGold: 100,
    costWood: 50,
    costIron: 0,
    costAction: 1,
    yield: { food: 8 },
    terrainMod: { plain: 1.2 },
    maxPerProvince: 2
  },
  coin_workshop: {
    id: "coin_workshop",
    name: "\u94F8\u5E01\u5DE5\u574A",
    description: "\u79C1\u8425\u94F8\u5E01\uFF0C\u91D1\u5E01\u4EA7\u51FA\u4F46\u8150\u8D25\u7565\u5347\u3002",
    costGold: 130,
    costWood: 10,
    costIron: 30,
    costAction: 2,
    yield: { gold: 10 },
    terrainMod: {},
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  apothecary: {
    id: "apothecary",
    name: "\u836F\u94FA",
    description: "\u9632\u75AB\u795B\u75C5\uFF0C\u4EBA\u53E3\u589E\u957F\u4E0E\u7A33\u5B9A\u5EA6\u5347\u3002",
    costGold: 110,
    costWood: 20,
    costIron: 0,
    costAction: 1,
    yield: { adminPt: 1, food: 3 },
    terrainMod: {},
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  watchtower: {
    id: "watchtower",
    name: "\u671B\u697C",
    description: "\u9884\u8B66\u53DB\u4E71\u4E0E\u5165\u4FB5\uFF0C\u519B\u65B9\u6EE1\u610F\u5EA6\u5347\u3002",
    costGold: 60,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { supply: 3 },
    terrainMod: { hill: 1.3, mountain: 1.4 },
    maxPerProvince: 2
  },
  guild_hall: {
    id: "guild_hall",
    name: "\u4F1A\u9986",
    description: "\u5546\u56E2\u8BAE\u4E8B\u4E4B\u6240\uFF0C\u91D1\u5E01\u4E0E\u5546\u4EBA\u6EE1\u610F\u5EA6\u5347\u3002",
    costGold: 150,
    costWood: 40,
    costIron: 20,
    costAction: 2,
    yield: { gold: 12, influence: 2 },
    terrainMod: { plain: 1.2, coast: 1.3 },
    prereqTech: "admin_lv2",
    maxPerProvince: 1
  },
  armory: {
    id: "armory",
    name: "\u519B\u68B0\u5E93",
    description: "\u50A8\u5175\u5668\u7532\u80C4\uFF0C\u88C5\u5907\u4E0E\u8865\u7ED9\u5927\u5347\u3002",
    costGold: 200,
    costWood: 50,
    costIron: 80,
    costAction: 2,
    yield: { supply: 12 },
    terrainMod: {},
    prereqTech: "mil_lv2",
    maxPerProvince: 1
  },
  observatory: {
    id: "observatory",
    name: "\u89C2\u8C61\u53F0",
    description: "\u5BDF\u661F\u8FB0\u5B9A\u5386\u6CD5\uFF0C\u79D1\u7814\u4E0E\u5408\u6CD5\u6027\u5347\u3002",
    costGold: 180,
    costWood: 30,
    costIron: 10,
    costAction: 2,
    yield: { sciPt: 4, influence: 3 },
    terrainMod: { mountain: 1.3, hill: 1.2 },
    prereqTech: "admin_lv3",
    maxPerProvince: 1
  },
  granary_royal: {
    id: "granary_royal",
    name: "\u738B\u5BB6\u7CAE\u4ED3",
    description: "\u738B\u5BA4\u76F4\u8F96\u50A8\u7CAE\uFF0C\u65F1\u6D9D\u4FDD\u6536\uFF0C\u5408\u6CD5\u5347\u3002",
    costGold: 220,
    costWood: 80,
    costIron: 10,
    costAction: 2,
    yield: { food: 15, adminPt: 1 },
    terrainMod: { plain: 1.2 },
    prereqTech: "agri_lv2",
    maxPerProvince: 1
  },
  trade_post: {
    id: "trade_post",
    name: "\u8D38\u6613\u7AD9",
    description: "\u8FB9\u7586\u4E92\u5E02\uFF0C\u91D1\u5E01\u4E0E\u5F71\u54CD\u529B\u5347\u4F46\u9700\u9A7B\u519B\u3002",
    costGold: 100,
    costWood: 30,
    costIron: 10,
    costAction: 1,
    yield: { gold: 8, influence: 2 },
    terrainMod: { hill: 1.2, desert: 0.8 },
    maxPerProvince: 2
  },
  monastery: {
    id: "monastery",
    name: "\u4FEE\u9053\u9662",
    description: "\u6E05\u4FEE\u4E4B\u6240\uFF0C\u795E\u804C\u6EE1\u610F\u5EA6\u4E0E\u7A33\u5B9A\u5EA6\u5347\u3002",
    costGold: 120,
    costWood: 40,
    costIron: 0,
    costAction: 2,
    yield: { influence: 3, adminPt: 1 },
    terrainMod: { hill: 1.2, mountain: 1.3 },
    maxPerProvince: 1
  },
  irrigation_works: {
    id: "irrigation_works",
    name: "\u6C34\u5229\u5DE5\u7A0B",
    description: "\u6C9F\u6E20\u7EB5\u6A2A\uFF0C\u5E73\u539F\u7CAE\u4EA7\u7FFB\u500D\uFF0C\u9700\u519C\u4E1A Lv3\u3002",
    costGold: 200,
    costWood: 80,
    costIron: 10,
    costAction: 2,
    yield: { food: 25 },
    terrainMod: { plain: 1.6, hill: 1 },
    prereqTech: "agri_lv3",
    maxPerProvince: 1
  },
  // ── D2 扩充：2 个质变建筑，绑定 Lv8 科技解锁 ──
  fertilizer_plant: {
    id: "fertilizer_plant",
    name: "\u5316\u80A5\u5382",
    description: "\u519C\u4E1A Lv8 \u89E3\u9501\u3002\u5316\u5B66\u80A5\u6599\u4F7F\u7CAE\u4EA7 \xD71.5\uFF0C\u5E73\u539F\u98DE\u8DC3\u3002",
    costGold: 600,
    costWood: 100,
    costIron: 80,
    costAction: 3,
    yield: { food: 60 },
    terrainMod: { plain: 1.5, hill: 1.2 },
    prereqTech: "agri_lv8",
    maxPerProvince: 1
  },
  mobilization_camp: {
    id: "mobilization_camp",
    name: "\u603B\u52A8\u5458\u8425",
    description: "\u519B\u4E8B Lv8 \u89E3\u9501\u3002\u5168\u56FD\u52A8\u5458\uFF0C\u5F81\u5175 \xD72\uFF0C\u519B\u65B9\u6EE1\u610F\u5EA6\u767B\u9876\u3002",
    costGold: 700,
    costWood: 120,
    costIron: 150,
    costAction: 3,
    yield: { supply: 30, adminPt: 2 },
    terrainMod: {},
    prereqTech: "mil_lv8",
    maxPerProvince: 1
  }
};
var BUILDING_LIST = Object.values(BUILDINGS);

// src/data/trade-routes.ts
var TRADE_ROUTES = [
  {
    id: "route_silk_road",
    name: "\u4E1D\u7EF8\u4E4B\u8DEF",
    description: "\u6A2A\u8D2F\u4E1C\u897F\u7684\u5546\u9053\uFF0C\u8FD0\u4E1D\u7EF8\u9999\u6599\u3002",
    endpoints: ["p03", "p15"],
    costGold: 300,
    prereqAdminLevel: 3,
    yield: { gold: 60, influence: 4 },
    length: "long",
    throughTerrain: ["desert", "mountain"]
  },
  {
    id: "route_mediterranean",
    name: "\u5730\u4E2D\u6D77\u5546\u8DEF",
    description: "\u8FDE\u63A5\u5730\u4E2D\u6D77\u5404\u6E2F\u7684\u6D77\u4E0A\u5546\u8DEF\u3002",
    endpoints: ["p01", "p08"],
    costGold: 180,
    prereqAdminLevel: 2,
    yield: { gold: 40, influence: 3, food: 10 },
    length: "medium"
  },
  {
    id: "route_amber_road",
    name: "\u7425\u73C0\u4E4B\u8DEF",
    description: "\u5317\u65B9\u7425\u73C0\u5357\u8FD0\u7684\u53E4\u8001\u5546\u9053\u3002",
    endpoints: ["p05", "p12"],
    costGold: 120,
    prereqAdminLevel: 2,
    yield: { gold: 25, influence: 2 },
    length: "medium"
  },
  {
    id: "route_grain_route",
    name: "\u7CAE\u9053",
    description: "\u5185\u9646\u7CAE\u8FD0\u4E13\u7EBF\uFF0C\u4FDD\u969C\u4EAC\u5E08\u4F9B\u7ED9\u3002",
    endpoints: ["p02", "p01"],
    costGold: 80,
    prereqAdminLevel: 1,
    yield: { gold: 15, influence: 1, food: 30 },
    length: "short"
  },
  {
    id: "route_iron_route",
    name: "\u94C1\u6599\u5546\u8DEF",
    description: "\u94C1\u77FF\u4EA7\u5730\u5230\u51B6\u70BC\u4E2D\u5FC3\u7684\u8FD0\u8F93\u7EBF\u3002",
    endpoints: ["p07", "p04"],
    costGold: 100,
    prereqAdminLevel: 2,
    yield: { gold: 20, influence: 1 },
    length: "short"
  },
  {
    id: "route_salt_road",
    name: "\u76D0\u9053",
    description: "\u76D0\u8FD0\u4E13\u7EBF\uFF0C\u6C11\u751F\u521A\u9700\u3002",
    endpoints: ["p09", "p03"],
    costGold: 90,
    prereqAdminLevel: 1,
    yield: { gold: 18, influence: 1, food: 5 },
    length: "short"
  },
  {
    id: "route_luxury_route",
    name: "\u5962\u4F88\u54C1\u5546\u8DEF",
    description: "\u8FD0\u9001\u4E1D\u7EF8\u9999\u6599\u5B9D\u77F3\u7684\u9AD8\u7AEF\u5546\u8DEF\u3002",
    endpoints: ["p15", "p06"],
    costGold: 220,
    prereqAdminLevel: 3,
    yield: { gold: 50, influence: 5 },
    length: "medium"
  },
  {
    id: "route_frontier_trade",
    name: "\u8FB9\u5173\u4E92\u5E02",
    description: "\u4E0E\u8FB9\u5883\u6C11\u65CF\u7684\u4E92\u5E02\u8D38\u6613\u3002",
    endpoints: ["p10", "p14"],
    costGold: 70,
    prereqAdminLevel: 1,
    yield: { gold: 12, influence: 2 },
    length: "short"
  }
];
var TRADE_ROUTE_BY_ID = Object.fromEntries(
  TRADE_ROUTES.map((r) => [r.id, r])
);
var TRADE_ROUTE_IDS = TRADE_ROUTES.map((r) => r.id);
var TRADE_ROUTE_COUNT = TRADE_ROUTES.length;
var LENGTH_MOD = {
  short: 1,
  medium: 1.3,
  long: 1.6
};

// src/engine/economy.ts
function charMods(nation) {
  const merged = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(def.penalties)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
  }
  return merged;
}
function computeBuildingYield(buildingDefId, level, terrain) {
  const totals = { gold: 0, food: 0, wood: 0, iron: 0, sciPt: 0, adminPt: 0, influence: 0, supply: 0 };
  const definition = BUILDINGS[buildingDefId];
  if (!definition) return totals;
  const safeLevel = clamp2(Math.round(level), 1, 3);
  const multiplier = safeLevel * (definition.terrainMod[terrain] ?? 1);
  for (const resource of Object.keys(totals)) {
    totals[resource] = (definition.yield[resource] ?? 0) * multiplier;
  }
  return totals;
}
function computeBuildingYields(provs) {
  const totals = { gold: 0, food: 0, wood: 0, iron: 0, sciPt: 0, adminPt: 0, influence: 0, supply: 0 };
  for (const province of provs) {
    for (const building of province.buildings) {
      const instanceYield = computeBuildingYield(building.defId, building.level, province.terrain);
      for (const resource of Object.keys(totals)) {
        totals[resource] += instanceYield[resource];
      }
    }
  }
  return totals;
}
function settleEconomy(nation, state) {
  const result = settleEconomyPure(nation, state);
  applyEconomyResult(nation, result);
  return result;
}
function settleEconomyPure(nation, state) {
  const provs = provincesOf(nation.id, state.provinces);
  let taxIncome = 0, foodProduced = 0;
  let wood = 0, iron = 0;
  let dInfluence = 0;
  const taxEff = (1 + nation.tech.admin * 0.06) * (nation.policyMods?.taxEffMod ?? 1);
  for (const p of provs) {
    const peasants = p.classes.find((c) => c.classId === "peasants")?.count ?? 0;
    const farms = p.buildings.filter((b) => b.defId === "farm").length;
    foodProduced += computeFood({
      agriBase: p.agriBase,
      peasantCount: peasants,
      terrain: p.terrain,
      agriLv: nation.tech.agri,
      farmCount: farms
    });
    taxIncome += computeTax({
      population: p.population,
      baseTaxRate: nation.taxRate,
      taxEfficiency: taxEff,
      stability: nation.government.stability,
      corruption: nation.government.corruption,
      assimilation: p.assimilation
    });
    wood += p.baseResources.wood ?? 0;
    iron += p.baseResources.iron ?? 0;
  }
  const buildingYields = computeBuildingYields(provs);
  const buildingIncome = buildingYields.gold;
  foodProduced += buildingYields.food;
  wood += buildingYields.wood;
  iron += buildingYields.iron;
  dInfluence += buildingYields.influence;
  const corruptionLoss = computeCorruptionLoss(taxIncome, nation.government.corruption);
  const netTax = taxIncome - corruptionLoss;
  const cm = charMods(nation);
  const marketCount = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === "market").length, 0);
  const tradeDeals = state.relations.filter((r) => r.from === nation.id && r.treaty === "trade").length;
  let tradeDepSafety = 1;
  for (const r of state.relations) {
    if (r.from === nation.id && r.treaty === "trade" && r.relation < 0) {
      tradeDepSafety = Math.min(tradeDepSafety, 1 - r.tradeDep / 200);
    }
  }
  const commerceActive = nation.activeCharacterBonuses.includes("commerce");
  const baseTrade = 80 + nation.tech.admin * 20;
  const tradeMod = cm.tradeMod ?? 1;
  const tradeIncome = computeTrade({
    baseTrade,
    marketCount,
    tradeDealCount: tradeDeals,
    commerceActive,
    tradeDepSafety: Math.max(0.5, tradeDepSafety)
  }) * tradeMod;
  const govDef = GOVERNMENTS[nation.government.type];
  const govTradeMod = govDef?.perTurn?.tradeMod ?? 1;
  const charTradeMod = cm.tradeMod ?? 1;
  const routeTradeMod = govTradeMod * charTradeMod;
  let routeIncome = 0, routeInfluence = 0, routeFood = 0;
  for (const ar of nation.activeTradeRoutes) {
    const def = TRADE_ROUTE_BY_ID[ar.routeId];
    if (!def) continue;
    if (nation.embargoedRoutes?.includes(ar.routeId)) continue;
    const ep1 = state.provinces[def.endpoints[0]];
    const ep2 = state.provinces[def.endpoints[1]];
    if (!ep1 || !ep2) continue;
    const owns1 = ep1.ownerId === nation.id;
    const owns2 = ep2.ownerId === nation.id;
    if (!owns1 && !owns2) continue;
    const mod = LENGTH_MOD[def.length] * routeTradeMod;
    routeIncome += def.yield.gold * mod;
    routeInfluence += def.yield.influence;
    routeFood += def.yield.food ?? 0;
  }
  const armySize2 = nation.army.reduce((s, a) => s + a.size, 0);
  const milCostMult = nation.tier === "D" ? 0.25 : 0.5;
  const militaryExpense = armySize2 * milCostMult;
  let dGold = netTax + tradeIncome + buildingIncome + routeIncome - militaryExpense;
  if (nation.civilWar?.active) dGold = Math.round(dGold * 0.7);
  dGold += nation.resources.gold;
  dInfluence += routeInfluence + nation.tech.culture * 0.5 * (nation.policyMods?.influenceMod ?? 1);
  let dFood = routeFood;
  if (nation.tier === "D") {
    dGold += 8;
    dFood += 8;
  }
  if (cm.goldMod) dGold += Math.round(dGold * cm.goldMod / 100);
  let finalSciPt = buildingYields.sciPt + nation.resources.sciPt;
  if (cm.sciPtMod && cm.sciPtMod !== 1) finalSciPt = Math.round(finalSciPt * cm.sciPtMod);
  if (dGold < -50) dGold = -50;
  const finalAdminPt = 3 + Math.floor(nation.government.efficiency / 25) + buildingYields.adminPt;
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const foodMilConsume = nation.tier === "D" ? armySize2 * 0.1 : totalPop < 50 ? 0 : armySize2 * 0.5;
  const foodConsumed = foodMilConsume + provs.reduce((s, p) => s + p.population, 0) * 0.1;
  const finalFood = nation.resources.food + dFood + foodProduced - foodConsumed;
  const origGold = nation.resources.gold;
  const origFood = nation.resources.food;
  return {
    taxIncome,
    tradeIncome,
    buildingIncome,
    corruptionLoss,
    militaryExpense,
    foodProduced,
    foodConsumed,
    woodProduced: wood,
    ironProduced: iron,
    delta: {
      gold: dGold - origGold,
      wood,
      iron,
      influence: dInfluence,
      adminPt: finalAdminPt - nation.resources.adminPt,
      // 覆写转 delta
      sciPt: finalSciPt - nation.resources.sciPt,
      // 倍率覆写转 delta
      supply: buildingYields.supply,
      food: finalFood - origFood
    }
  };
}
function applyEconomyResult(nation, result) {
  nation.resources.gold += result.delta.gold;
  nation.resources.food += result.delta.food;
  nation.resources.wood += result.delta.wood;
  nation.resources.iron += result.delta.iron;
  nation.resources.influence += result.delta.influence;
  nation.resources.adminPt += result.delta.adminPt;
  nation.resources.sciPt += result.delta.sciPt;
  nation.resources.supply += result.delta.supply;
}
function establishTradeRoute(nation, routeId, state) {
  const def = TRADE_ROUTE_BY_ID[routeId];
  if (!def) return { ok: false, reason: "\u8DEF\u7EBF\u4E0D\u5B58\u5728" };
  if (nation.activeTradeRoutes.some((r) => r.routeId === routeId)) return { ok: false, reason: "\u5DF2\u5EFA\u7ACB" };
  if (nation.tech.admin < def.prereqAdminLevel) return { ok: false, reason: `\u9700\u884C\u653FLv${def.prereqAdminLevel}` };
  const ep1 = state.provinces[def.endpoints[0]];
  const ep2 = state.provinces[def.endpoints[1]];
  if (!ep1 || !ep2) return { ok: false, reason: "\u8DEF\u7EBF\u7AEF\u70B9\u7701\u4EFD\u4E0D\u5B58\u5728" };
  const owns1 = ep1.ownerId === nation.id;
  const owns2 = ep2.ownerId === nation.id;
  if (!owns1 && !owns2) return { ok: false, reason: "\u8DEF\u7EBF\u4E24\u7AEF\u5747\u4E0D\u5F52\u672C\u56FD" };
  if (nation.resources.gold < def.costGold) return { ok: false, reason: "\u91D1\u4E0D\u8DB3" };
  nation.resources.gold -= def.costGold;
  nation.activeTradeRoutes.push({ routeId, establishedTurn: state.turn });
  return { ok: true, routeName: def.name };
}

// src/engine/population.ts
function charMods2(nation) {
  const merged = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(def.penalties)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
  }
  return merged;
}
var CLASS_IDS = ["peasants", "workers", "merchants", "soldiers", "scholars", "nobles", "clergy"];
var CLASS_INTEREST = {
  peasants: { tax: 1.5, food: 1.5, draft: 1, trade: 0.2, war: 0.5, religion: 0.5 },
  workers: { tax: 1, food: 1, draft: 0.5, trade: 0.5, war: 0.3, religion: 0.3 },
  merchants: { tax: 1.2, food: 0.5, draft: 0.3, trade: 2, war: 0.5, religion: 0.3 },
  soldiers: { tax: 0.5, food: 0.5, draft: 0.2, trade: 0.3, war: 2, religion: 0.5 },
  scholars: { tax: 0.5, food: 0.5, draft: 0.3, trade: 0.5, war: 0.3, religion: 0.2 },
  nobles: { tax: 0.8, food: 0.3, draft: 0.3, trade: 0.5, war: 0.8, religion: 0.8 },
  clergy: { tax: 0.3, food: 0.5, draft: 0.3, trade: 0.3, war: 0.5, religion: 2 }
};
function settlePopulation(nation, provinces, foodShortage, tradeFree, atWar2, warWonRecent) {
  let totalGrowth = 0;
  const classSatChanges = {};
  for (const p of provinces) {
    const totalPop = p.population;
    const delta = popGrowth({
      population: totalPop,
      baseGrowth: 0.01,
      food: nation.resources.food,
      foodNeed: totalPop * 0.8,
      stability: nation.government.stability,
      atWar: atWar2,
      plague: false,
      welfareActive: nation.activeCharacterBonuses.includes("welfare")
    }) * (charMods2(nation).popGrowthMod ?? 1) * (nation.policyMods?.popGrowthMod ?? 1);
    p.population = Math.max(10, Math.round(p.population + delta));
    totalGrowth += delta;
    for (const grp of p.classes) {
      const interest = CLASS_INTEREST[grp.classId];
      const taxPressure = (nation.taxRate - 0.15) * 100 * interest.tax;
      const foodPressure = foodShortage ? -15 * interest.food : 0;
      const warPressure = atWar2 ? -5 * interest.war : warWonRecent ? 5 * interest.war : 0;
      const tradePressure = tradeFree ? 3 * interest.trade : -3 * interest.trade;
      const religionPressure = 0;
      const d = -taxPressure + foodPressure + warPressure + tradePressure + religionPressure;
      grp.satisfaction = clamp2(grp.satisfaction + d, 0, 100);
      classSatChanges[grp.classId] = (classSatChanges[grp.classId] ?? 0) + d;
    }
  }
  for (const fid of CLASS_IDS) {
    const faction = nation.factions.find((f) => f.id === mapClassToFaction(fid));
    if (!faction) continue;
    const allGrps = provinces.flatMap((p) => p.classes.filter((c) => c.classId === fid));
    if (allGrps.length === 0) continue;
    const avgSat = allGrps.reduce((s, g) => s + g.satisfaction, 0) / allGrps.length;
    faction.satisfaction = clamp2(faction.satisfaction + (avgSat - faction.satisfaction) * 0.3, 0, 100);
  }
  return { totalGrowth, classSatChanges };
}
function mapClassToFaction(c) {
  switch (c) {
    case "nobles":
      return "nobles";
    case "merchants":
      return "merchants";
    case "soldiers":
      return "military";
    case "clergy":
      return "clergy";
    default:
      return "commoners";
  }
}
function settlePopulationPure(nation, provinces, foodShortage, tradeFree, atWar2, warWonRecent) {
  let totalGrowth = 0;
  const classSatChanges = {};
  const popDelta = {};
  const classSatDelta = {};
  const classSatNew = {};
  for (const p of provinces) {
    const totalPop = p.population;
    const delta = popGrowth({
      population: totalPop,
      baseGrowth: 0.01,
      food: nation.resources.food,
      foodNeed: totalPop * 0.8,
      stability: nation.government.stability,
      atWar: atWar2,
      plague: false,
      welfareActive: nation.activeCharacterBonuses.includes("welfare")
    }) * (charMods2(nation).popGrowthMod ?? 1) * (nation.policyMods?.popGrowthMod ?? 1);
    const newPop = Math.max(10, Math.round(p.population + delta));
    popDelta[p.id] = newPop - p.population;
    totalGrowth += delta;
    const satDelta = {};
    const satNew = {};
    for (const grp of p.classes) {
      const interest = CLASS_INTEREST[grp.classId];
      const taxPressure = (nation.taxRate - 0.15) * 100 * interest.tax;
      const foodPressure = foodShortage ? -15 * interest.food : 0;
      const warPressure = atWar2 ? -5 * interest.war : warWonRecent ? 5 * interest.war : 0;
      const tradePressure = tradeFree ? 3 * interest.trade : -3 * interest.trade;
      const religionPressure = 0;
      const d = -taxPressure + foodPressure + warPressure + tradePressure + religionPressure;
      const newSat = clamp2(grp.satisfaction + d, 0, 100);
      satDelta[grp.classId] = newSat - grp.satisfaction;
      satNew[grp.classId] = newSat;
      classSatChanges[grp.classId] = (classSatChanges[grp.classId] ?? 0) + d;
    }
    classSatDelta[p.id] = satDelta;
    classSatNew[p.id] = satNew;
  }
  const factionSatFinal = {};
  for (const fid of CLASS_IDS) {
    const factionId = mapClassToFaction(fid);
    const faction = nation.factions.find((f) => f.id === factionId);
    if (!faction) continue;
    const allGrps = provinces.flatMap((p) => p.classes.filter((c) => c.classId === fid));
    if (allGrps.length === 0) continue;
    let avgSum = 0, cnt = 0;
    for (const p of provinces) {
      const newSat = classSatNew[p.id]?.[fid];
      if (newSat !== void 0) {
        avgSum += newSat;
        cnt++;
      }
    }
    const avgSat = cnt > 0 ? avgSum / cnt : 0;
    factionSatFinal[factionId] = clamp2(faction.satisfaction + (avgSat - faction.satisfaction) * 0.3, 0, 100);
  }
  return { totalGrowth, classSatChanges, popDelta, classSatDelta, factionSatFinal };
}

// src/data/policies.ts
var POLICIES = [
  {
    id: "land_privilege",
    name: "\u8D35\u65CF\u571F\u5730\u7279\u6743",
    description: "\u4FDD\u969C\u8D35\u65CF\u571F\u5730\u6743\u76CA\uFF0C\u63D0\u8D35\u65CF\u6EE1\u610F\u5EA6\uFF0C\u4F46\u884C\u653F\u80FD\u529B\u4E0B\u964D\u3002",
    costAction: 1,
    costGold: 50,
    allowedGovernments: ["monarchy", "empire"],
    effects: { efficiencyMod: -5 },
    factionReaction: { nobles: 15, merchants: -5, commoners: -10 }
  },
  {
    id: "royal_tax",
    name: "\u738B\u5BB6\u7A0E",
    description: "\u738B\u5BA4\u76F4\u8F96\u7A0E\u6536\uFF0C\u6548\u7387\u5347\u4F46\u6C11\u5FC3\u964D\u3002",
    costAction: 1,
    costGold: 80,
    allowedGovernments: ["monarchy", "empire"],
    effects: { taxEffMod: 1.1, stabilityMod: -3 },
    factionReaction: { nobles: 5, merchants: -5, commoners: -10 }
  },
  {
    id: "free_trade",
    name: "\u81EA\u7531\u8D38\u6613",
    description: "\u653E\u5BBD\u8D38\u6613\u7BA1\u5236\uFF0C\u8D38\u6613\u6536\u5165\u4E0E\u5546\u4EBA\u6EE1\u610F\u5EA6\u5347\u3002",
    costAction: 1,
    costGold: 100,
    allowedGovernments: ["republic", "empire"],
    effects: { influenceMod: 3 },
    factionReaction: { merchants: 20, nobles: -5, commoners: 5 }
  },
  {
    id: "civic_reform",
    name: "\u516C\u6C11\u6539\u9769",
    description: "\u6269\u5927\u516C\u6C11\u6743\uFF0C\u6C11\u4F17\u6EE1\u610F\u5EA6\u5347\uFF0C\u4F46\u8D35\u65CF\u4E0D\u6EE1\u3002",
    costAction: 2,
    costGold: 200,
    allowedGovernments: ["republic"],
    effects: { stabilityMod: 5, popGrowthMod: 1.05 },
    factionReaction: { nobles: -15, commoners: 20, merchants: 5 }
  },
  {
    id: "state_religion",
    name: "\u56FD\u6559\u7ACB\u56FD",
    description: "\u786E\u7ACB\u56FD\u6559\uFF0C\u795E\u804C\u6EE1\u610F\u5EA6\u4E0E\u5408\u6CD5\u6027\u5347\uFF0C\u4F46\u5F02\u6559\u5730\u533A\u53DB\u4E71\u5347\u3002",
    costAction: 1,
    costGold: 100,
    allowedGovernments: ["theocracy", "monarchy"],
    effects: { stabilityMod: 3, influenceMod: 5 },
    factionReaction: { clergy: 25, nobles: 5, commoners: -5 }
  },
  {
    id: "holy_war",
    name: "\u5723\u6218",
    description: "\u5BF9\u5F02\u6559\u56FD\u5BA3\u6218\u52A0\u6210\uFF0C\u519B\u65B9\u4E0E\u795E\u804C\u6EE1\u610F\u5EA6\u5347\uFF0C\u4F46\u5916\u4EA4\u6076\u5316\u3002",
    costAction: 1,
    costGold: 150,
    allowedGovernments: ["theocracy"],
    effects: { combatMod: 1.1, mobilizationMod: 1.2 },
    factionReaction: { military: 15, clergy: 15, merchants: -15, commoners: -10 }
  },
  {
    id: "martial_law",
    name: "\u6212\u4E25\u4EE4",
    description: "\u5F3A\u5316\u9547\u538B\uFF0C\u53DB\u4E71\u98CE\u9669\u964D\uFF0C\u4F46\u6C11\u5FC3\u4E0E\u5916\u4EA4\u964D\u3002",
    costAction: 1,
    costGold: 80,
    allowedGovernments: ["junta", "empire"],
    effects: { stabilityMod: 5, efficiencyMod: 5, influenceMod: -3 },
    factionReaction: { military: 10, commoners: -15, merchants: -10 }
  },
  {
    id: "conscription",
    name: "\u5168\u6C11\u5F81\u5175",
    description: "\u5F81\u5175\u901F\u5EA6\u5927\u5E45\u63D0\u5347\uFF0C\u4F46\u6C11\u4F17\u6EE1\u610F\u5EA6\u964D\u3002",
    costAction: 1,
    costGold: 100,
    allowedGovernments: ["junta", "empire", "monarchy"],
    effects: { mobilizationMod: 1.3 },
    factionReaction: { military: 15, commoners: -15, merchants: -5 }
  },
  {
    id: "centralization",
    name: "\u4E2D\u592E\u96C6\u6743",
    description: "\u96C6\u6743\u884C\u653F\uFF0C\u7A0E\u6536\u4E0E\u884C\u653F\u80FD\u529B\u5347\uFF0C\u4F46\u5730\u65B9\u53DB\u4E71\u5347\u3002",
    costAction: 2,
    costGold: 200,
    allowedGovernments: ["empire", "monarchy"],
    effects: { taxEffMod: 1.1, efficiencyMod: 10, assimilationMod: 2 },
    factionReaction: { nobles: -10, merchants: -5, commoners: -5 }
  },
  {
    id: "imperial_tax",
    name: "\u5E1D\u56FD\u7A0E",
    description: "\u884C\u7701\u91CD\u7A0E\uFF0C\u56FD\u5E93\u5347\u4F46\u5730\u65B9\u4E0D\u6EE1\u3002",
    costAction: 1,
    costGold: 120,
    allowedGovernments: ["empire"],
    effects: { taxEffMod: 1.15, stabilityMod: -5 },
    factionReaction: { nobles: 5, merchants: -10, commoners: -15 }
  },
  {
    id: "anti_corruption",
    name: "\u53CD\u8150\u6539\u9769",
    description: "\u5F3A\u529B\u53CD\u8150\uFF0C\u8150\u8D25\u5927\u964D\u4F46\u8D35\u65CF\u4E0D\u6EE1\u3002\u9700\u884C\u653F\u79D1\u6280 Lv3\u3002",
    costAction: 2,
    costGold: 300,
    allowedGovernments: [],
    effects: { corruptionMod: -15, efficiencyMod: 10 },
    factionReaction: { nobles: -20, merchants: 10, commoners: 10 },
    prereqTech: "admin_lv3"
  },
  {
    id: "welfare",
    name: "\u798F\u5229\u653F\u7B56",
    description: "\u5B89\u629A\u6C11\u4F17\uFF0C\u6EE1\u610F\u5EA6\u4E0E\u4EBA\u53E3\u589E\u957F\u5347\uFF0C\u4F46\u56FD\u5E93\u8D1F\u62C5\u3002",
    costAction: 1,
    costGold: 150,
    allowedGovernments: [],
    effects: { popGrowthMod: 1.1, stabilityMod: 3, taxRateMod: -0.02 },
    factionReaction: { commoners: 20, nobles: -10, merchants: -5 }
  },
  // ── B 扩展：13 个新政策 ──
  { id: "education_reform", name: "\u6559\u80B2\u6539\u9769", description: "\u5E7F\u8BBE\u5B66\u5BAB\uFF0C\u63D0\u5347\u79D1\u7814\u4E0E\u540C\u5316\u3002", costAction: 2, costGold: 200, allowedGovernments: [], effects: { assimilationMod: 5, efficiencyMod: 3 }, factionReaction: { clergy: -8, commoners: 8 }, prereqTech: "admin_lv3" },
  { id: "merchant_guild", name: "\u5546\u56E2\u7279\u8BB8", description: "\u6388\u4E88\u5546\u56E2\u4E13\u8425\u6743\uFF0C\u8D38\u6613\u5347\u4F46\u8D35\u65CF\u4E0D\u6EE1\u3002", costAction: 1, costGold: 120, allowedGovernments: ["republic", "merchant_republic", "monarchy"], effects: { taxEffMod: 1.08 }, factionReaction: { merchants: 18, nobles: -12 } },
  { id: "land_reform", name: "\u5747\u7530\u4EE4", description: "\u91CD\u65B0\u5206\u914D\u571F\u5730\uFF0C\u6C11\u4F17\u5927\u60A6\u4F46\u8D35\u65CF\u53CD\u5F39\u3002", costAction: 2, costGold: 180, allowedGovernments: ["empire", "monarchy", "republic"], effects: { popGrowthMod: 1.08, stabilityMod: 5 }, factionReaction: { commoners: 25, nobles: -25 } },
  { id: "toleration", name: "\u5B97\u6559\u5BBD\u5BB9", description: "\u5BBD\u5BB9\u5F02\u6559\uFF0C\u964D\u51B2\u7A81\u4F46\u795E\u804C\u4E0D\u6EE1\u3002", costAction: 1, costGold: 100, allowedGovernments: [], effects: { stabilityMod: 3, assimilationMod: 8 }, factionReaction: { clergy: -20, commoners: 5 } },
  { id: "civil_service_exam", name: "\u79D1\u4E3E\u5236", description: "\u4EE5\u8003\u8BD5\u9009\u62D4\u5B98\u540F\uFF0C\u884C\u653F\u5927\u5347\u3002\u9700\u884C\u653F Lv3\u3002", costAction: 2, costGold: 250, allowedGovernments: ["empire", "monarchy"], effects: { efficiencyMod: 15, corruptionMod: -8 }, factionReaction: { nobles: -18, commoners: 10 }, prereqTech: "admin_lv3" },
  { id: "military_reform", name: "\u519B\u4E8B\u6539\u9769", description: "\u91CD\u7EC4\u519B\u5236\uFF0C\u6218\u6597\u529B\u5347\u4F46\u8017\u91D1\u3002", costAction: 2, costGold: 200, allowedGovernments: ["empire", "monarchy", "junta"], effects: { combatMod: 1.15, mobilizationMod: 1.2 }, factionReaction: { military: 20, commoners: -8 } },
  { id: "naval_expansion", name: "\u6269\u5F20\u8230\u961F", description: "\u5927\u529B\u53D1\u5C55\u6D77\u519B\uFF0C\u6D77\u4E0A\u8D38\u6613\u4E0E\u6218\u529B\u5347\u3002", costAction: 2, costGold: 180, allowedGovernments: ["republic", "merchant_republic", "empire"], effects: { influenceMod: 1.1, combatMod: 1.1 }, factionReaction: { military: 12, merchants: 10 } },
  { id: "agrarian_reform", name: "\u519C\u672C\u653F\u7B56", description: "\u91CD\u519C\u6291\u5546\uFF0C\u7CAE\u4EA7\u5347\u4F46\u8D38\u6613\u964D\u3002", costAction: 1, costGold: 100, allowedGovernments: ["empire", "monarchy"], effects: { popGrowthMod: 1.06, taxRateMod: -0.01 }, factionReaction: { commoners: 12, merchants: -15 } },
  { id: "infrastructure_plan", name: "\u57FA\u5EFA\u632F\u5174", description: "\u5168\u56FD\u4FEE\u8DEF\u5EFA\u6865\uFF0C\u884C\u653F\u4E0E\u8D38\u6613\u5347\u3002\u9700\u884C\u653F Lv2\u3002", costAction: 2, costGold: 220, allowedGovernments: [], effects: { efficiencyMod: 8, taxEffMod: 1.05 }, factionReaction: { commoners: 8, merchants: 8 }, prereqTech: "admin_lv2" },
  { id: "census", name: "\u7F16\u6237\u9F50\u6C11", description: "\u666E\u67E5\u4EBA\u53E3\uFF0C\u7A0E\u6536\u6548\u7387\u5347\u3002\u9700\u884C\u653F Lv2\u3002", costAction: 1, costGold: 150, allowedGovernments: ["empire", "monarchy"], effects: { taxEffMod: 1.1, efficiencyMod: 5 }, factionReaction: { nobles: -8 }, prereqTech: "admin_lv2" },
  { id: "diplomatic_corps", name: "\u5916\u4EA4\u4F7F\u56E2", description: "\u8BBE\u7ACB\u4E13\u804C\u5916\u4EA4\u673A\u6784\uFF0C\u5F71\u54CD\u529B\u4EA7\u51FA\u5347\u3002", costAction: 1, costGold: 130, allowedGovernments: [], effects: { influenceMod: 1.15 }, factionReaction: { nobles: 5, merchants: 5 } },
  { id: "cultural_patronage", name: "\u6587\u5316\u8D5E\u52A9", description: "\u8D5E\u52A9\u827A\u672F\u5B66\u672F\uFF0C\u5A01\u671B\u4E0E\u540C\u5316\u5347\u3002", costAction: 1, costGold: 110, allowedGovernments: [], effects: { influenceMod: 1.08, assimilationMod: 3 }, factionReaction: { clergy: 5, commoners: 3 } },
  { id: "succession_law", name: "\u7EE7\u627F\u6CD5", description: "\u786E\u7ACB\u7EE7\u627F\u987A\u5E8F\uFF0C\u5408\u6CD5\u6027\u5927\u5347\u4F46\u9650\u5236\u541B\u4E3B\u3002", costAction: 2, costGold: 200, allowedGovernments: ["monarchy", "empire"], effects: { stabilityMod: 8 }, factionReaction: { nobles: 15, military: -5 } },
  // ── D2 扩充：4 个质变政策，绑定 Lv5 科技解锁 ──
  { id: "crop_rotation", name: "\u8F6E\u4F5C\u653F\u7B56", description: "\u79D1\u5B66\u8F6E\u4F5C\u517B\u5730\uFF0C\u7CAE\u4EA7 +15%\u3002\u9700\u519C\u4E1A Lv5\u3002", costAction: 2, costGold: 280, allowedGovernments: [], effects: { popGrowthMod: 1.15 }, factionReaction: { commoners: 15, nobles: -5 }, prereqTech: "agri_lv5" },
  { id: "total_mobilization", name: "\u603B\u52A8\u5458", description: "\u5168\u56FD\u52A8\u5458\uFF0C\u5F81\u5175 \xD72 \u4F46\u538C\u6218 +15\u3002\u9700\u519B\u4E8B Lv5\u3002", costAction: 3, costGold: 350, allowedGovernments: ["empire", "junta", "monarchy"], effects: { mobilizationMod: 2 }, factionReaction: { military: 25, commoners: -20 }, prereqTech: "mil_lv5" },
  { id: "civil_service_reform", name: "\u79D1\u4E3E\u6539\u9769", description: "\u6DF1\u5316\u79D1\u4E3E\uFF0C\u8150\u8D25 -10\u3001\u884C\u653F +10\u3002\u9700\u884C\u653F Lv5\u3002", costAction: 3, costGold: 320, allowedGovernments: ["empire", "monarchy", "republic"], effects: { corruptionMod: -10, efficiencyMod: 10 }, factionReaction: { nobles: -22, commoners: 12, clergy: 5 }, prereqTech: "admin_lv5" },
  { id: "cultural_export", name: "\u6587\u5316\u8F93\u51FA", description: "\u5411\u8BF8\u90A6\u8F93\u51FA\u6587\u5316\uFF0C\u5F71\u54CD\u529B +25%\u3001\u5916\u4EA4 +10\u3002\u9700\u6587\u5316 Lv5\u3002", costAction: 2, costGold: 260, allowedGovernments: [], effects: { influenceMod: 1.25, assimilationMod: 8 }, factionReaction: { clergy: 8, commoners: 5 }, prereqTech: "culture_lv5" }
];
var POLICY_BY_ID = Object.fromEntries(
  POLICIES.map((p) => [p.id, p])
);

// src/data/laws.ts
var LAWS = [
  // ── 民法类（civil）── 关乎产权、婚姻、契约
  {
    id: "law_civil_code",
    name: "\u6210\u6587\u6CD5\u5178",
    category: "civil",
    description: "\u9881\u5E03\u6210\u6587\u6CD5\uFF0C\u660E\u793A\u5F8B\u4EE4\uFF0C\u9650\u5236\u5B98\u540F\u64C5\u6743\u3002",
    costGold: 120,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { corruptionMod: -5, stabilityMod: 5, legitimacyMod: 8, efficiencyMod: 3 },
    factionReaction: { nobles: -10, commoners: 12, merchants: 8 }
  },
  {
    id: "law_land_reform",
    name: "\u571F\u5730\u6539\u9769",
    category: "civil",
    description: "\u9650\u5236\u8D35\u65CF\u5360\u5730\uFF0C\u91CD\u5206\u571F\u5730\u4E8E\u519C\u6C11\u3002",
    costGold: 200,
    allowedGovernments: ["republic", "monarchy", "empire", "theocracy"],
    prereqAdminLevel: 3,
    conflictsWith: ["law_noble_privilege"],
    effects: { stabilityMod: 3, efficiencyMod: 5, taxEffMod: 1.05, unrestReduction: 1 },
    factionReaction: { nobles: -20, commoners: 18, merchants: 5 }
  },
  {
    id: "law_noble_privilege",
    name: "\u8D35\u65CF\u7279\u6743\u6CD5",
    category: "civil",
    description: "\u4EE5\u6CD5\u5F8B\u56FA\u5316\u8D35\u65CF\u7279\u6743\uFF0C\u6362\u53D6\u5176\u652F\u6301\u3002",
    costGold: 80,
    allowedGovernments: ["monarchy", "empire", "feudal"],
    prereqAdminLevel: 1,
    conflictsWith: ["law_land_reform", "law_equal_tax"],
    effects: { stabilityMod: 4, legitimacyMod: 5, efficiencyMod: -3, corruptionMod: 3 },
    factionReaction: { nobles: 20, commoners: -10, merchants: -5 }
  },
  {
    id: "law_equal_tax",
    name: "\u5747\u7A0E\u6CD5",
    category: "civil",
    description: "\u8D35\u65CF\u5546\u4EBA\u4E00\u4F53\u7EB3\u7A0E\uFF0C\u5E9F\u9664\u514D\u7A0E\u7279\u6743\u3002",
    costGold: 150,
    allowedGovernments: ["republic", "empire", "theocracy"],
    prereqAdminLevel: 3,
    conflictsWith: ["law_noble_privilege"],
    effects: { taxEffMod: 1.1, corruptionMod: -3, efficiencyMod: 4 },
    factionReaction: { nobles: -15, merchants: -8, commoners: 10 }
  },
  // ── 刑法类（criminal）── 关乎治安、刑罚
  {
    id: "law_strict_punishment",
    name: "\u4E25\u5211\u5CFB\u6CD5",
    category: "criminal",
    description: "\u91CD\u5211\u60E9\u6CBB\u76D7\u532A\u53DB\u4E71\uFF0C\u9707\u6151\u5730\u65B9\u3002",
    costGold: 60,
    allowedGovernments: [],
    prereqAdminLevel: 1,
    effects: { stabilityMod: 3, efficiencyMod: 2, unrestReduction: 2, rebellionReduction: 3 },
    factionReaction: { military: 8, commoners: -8, nobles: 3 }
  },
  {
    id: "law_mercy_policy",
    name: "\u5BBD\u5211\u7701\u7F5A",
    category: "criminal",
    description: "\u51CF\u8F7B\u5211\u7F5A\uFF0C\u4EE5\u4EC1\u653F\u6536\u4EBA\u5FC3\u3002",
    costGold: 50,
    allowedGovernments: ["republic", "theocracy", "monarchy"],
    prereqAdminLevel: 2,
    conflictsWith: ["law_strict_punishment"],
    effects: { stabilityMod: 5, legitimacyMod: 3, efficiencyMod: -2 },
    factionReaction: { commoners: 12, clergy: 8, military: -6 }
  },
  {
    id: "law_conscription",
    name: "\u5F81\u5175\u6CD5",
    category: "criminal",
    description: "\u4F9D\u6CD5\u5F3A\u5236\u5F81\u5175\uFF0C\u6269\u5145\u519B\u529B\u3002",
    costGold: 100,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { efficiencyMod: 3, stabilityMod: -2, unrestReduction: -1 },
    factionReaction: { military: 15, commoners: -12, nobles: 3 }
  },
  {
    id: "law_anti_corruption",
    name: "\u53CD\u8150\u5F8B",
    category: "criminal",
    description: "\u4E25\u60E9\u8D2A\u58A8\uFF0C\u8BBE\u76D1\u5BDF\u4E4B\u804C\u3002",
    costGold: 180,
    allowedGovernments: [],
    prereqAdminLevel: 3,
    effects: { corruptionMod: -10, efficiencyMod: 5, stabilityMod: 2 },
    factionReaction: { nobles: -12, merchants: 5, commoners: 10 }
  },
  // ── 行政法类（administrative）── 关乎官僚、地方、税收
  {
    id: "law_civil_service",
    name: "\u79D1\u4E3E\u8003\u7EE9\u6CD5",
    category: "administrative",
    description: "\u4EE5\u8003\u8BD5\u9009\u5B98\uFF0C\u6253\u7834\u4E16\u88AD\u3002",
    costGold: 150,
    allowedGovernments: ["empire", "republic", "monarchy"],
    prereqAdminLevel: 3,
    effects: { efficiencyMod: 8, corruptionMod: -4, legitimacyMod: 4 },
    factionReaction: { nobles: -15, clergy: 5, scholars: 15 }
  },
  {
    id: "law_decentralization",
    name: "\u5730\u65B9\u81EA\u6CBB\u6CD5",
    category: "administrative",
    description: "\u653E\u6743\u5730\u65B9\uFF0C\u51CF\u8F7B\u4E2D\u592E\u8D1F\u62C5\u3002",
    costGold: 100,
    allowedGovernments: ["republic", "feudal", "tribal"],
    prereqAdminLevel: 2,
    conflictsWith: ["law_centralization"],
    effects: { efficiencyMod: -3, stabilityMod: 4, taxEffMod: 0.97, unrestReduction: 1 },
    factionReaction: { nobles: 10, commoners: 5, merchants: 3 }
  },
  {
    id: "law_centralization",
    name: "\u4E2D\u592E\u96C6\u6743\u6CD5",
    category: "administrative",
    description: "\u6536\u5F52\u5730\u65B9\u6743\u529B\u4E8E\u4E2D\u592E\u3002",
    costGold: 200,
    allowedGovernments: ["empire", "monarchy", "theocracy", "military"],
    prereqAdminLevel: 3,
    conflictsWith: ["law_decentralization"],
    effects: { efficiencyMod: 6, taxEffMod: 1.04, stabilityMod: -2 },
    factionReaction: { nobles: -8, military: 8, commoners: -3 }
  },
  {
    id: "law_trade_regulation",
    name: "\u5546\u5F8B",
    category: "administrative",
    description: "\u89C4\u8303\u5E02\u573A\uFF0C\u4FDD\u62A4\u5951\u7EA6\u3002",
    costGold: 120,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { taxEffMod: 1.03, efficiencyMod: 2, corruptionMod: -2 },
    factionReaction: { merchants: 15, nobles: -3, commoners: 3 }
  },
  // ── D4 扩充：+8 法律到 20 ──
  // 民法 +3
  {
    id: "law_marriage_reform",
    name: "\u5A5A\u59FB\u6539\u9769\u6CD5",
    category: "civil",
    description: "\u653E\u5BBD\u5A5A\u59FB\u9650\u5236\uFF0C\u4FDD\u62A4\u5973\u6027\u8D22\u4EA7\uFF0C\u63D0\u5347\u6C11\u4F17\u8BA4\u540C\u3002",
    costGold: 90,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { stabilityMod: 4, legitimacyMod: 3, unrestReduction: 1 },
    factionReaction: { commoners: 10, clergy: -8, nobles: -3 }
  },
  {
    id: "law_contract_enforcement",
    name: "\u5951\u7EA6\u6267\u884C\u6CD5",
    category: "civil",
    description: "\u5F3A\u5316\u5951\u7EA6\u6548\u529B\uFF0C\u5546\u4E1A\u7EA0\u7EB7\u6709\u6CD5\u53EF\u4F9D\u3002",
    costGold: 110,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { taxEffMod: 1.04, corruptionMod: -3, efficiencyMod: 2 },
    factionReaction: { merchants: 18, nobles: -5, commoners: 2 }
  },
  {
    id: "law_eminent_domain",
    name: "\u5F81\u6536\u6CD5",
    category: "civil",
    description: "\u56FD\u5BB6\u53EF\u5F81\u7528\u79C1\u5730\u5EFA\u516C\u5171\u8BBE\u65BD\uFF0C\u8D35\u65CF\u53CD\u5F39\u4F46\u884C\u653F\u5347\u3002",
    costGold: 140,
    allowedGovernments: ["empire", "republic", "monarchy"],
    prereqAdminLevel: 3,
    conflictsWith: ["law_noble_privilege"],
    effects: { efficiencyMod: 6, taxEffMod: 1.03, stabilityMod: -2 },
    factionReaction: { nobles: -18, commoners: 5, merchants: 3 }
  },
  // 刑法 +2
  {
    id: "law_prison_reform",
    name: "\u72F1\u653F\u6539\u9769",
    category: "criminal",
    description: "\u6539\u5584\u72F1\u653F\uFF0C\u51CF\u5C11\u51A4\u72F1\uFF0C\u6C11\u5FC3\u5347\u4F46\u9707\u6151\u964D\u3002",
    costGold: 80,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    conflictsWith: ["law_strict_punishment"],
    effects: { stabilityMod: 4, legitimacyMod: 4, rebellionReduction: -1 },
    factionReaction: { commoners: 10, clergy: 6, military: -5 }
  },
  {
    id: "law_border_control",
    name: "\u8FB9\u9632\u7BA1\u5236\u6CD5",
    category: "criminal",
    description: "\u4E25\u63A7\u8FB9\u5883\uFF0C\u9632\u95F4\u8C0D\u6E17\u900F\uFF0C\u6CBB\u5B89\u5347\u4F46\u8D38\u6613\u964D\u3002",
    costGold: 100,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    effects: { stabilityMod: 3, efficiencyMod: 3, rebellionReduction: 2 },
    factionReaction: { military: 12, merchants: -10, nobles: 3 }
  },
  // 行政法 +3
  {
    id: "law_census_registration",
    name: "\u7F16\u6237\u9F50\u6C11\u6CD5",
    category: "administrative",
    description: "\u666E\u67E5\u4EBA\u53E3\u6237\u7C4D\uFF0C\u7A0E\u6536\u6548\u7387\u5927\u5347\u4F46\u8D35\u65CF\u62B5\u5236\u3002",
    costGold: 160,
    allowedGovernments: ["empire", "monarchy", "republic"],
    prereqAdminLevel: 3,
    effects: { taxEffMod: 1.08, efficiencyMod: 6, corruptionMod: -4 },
    factionReaction: { nobles: -12, merchants: 5, commoners: 3 }
  },
  {
    id: "law_merchant_guild_charter",
    name: "\u5546\u56E2\u7279\u8BB8\u6CD5",
    category: "administrative",
    description: "\u6388\u4E88\u5546\u56E2\u4E13\u8425\u7279\u6743\uFF0C\u8D38\u6613\u5347\u4F46\u5C0F\u5546\u6237\u4E0D\u6EE1\u3002",
    costGold: 130,
    allowedGovernments: ["republic", "monarchy", "empire"],
    prereqAdminLevel: 2,
    conflictsWith: ["law_equal_tax"],
    effects: { taxEffMod: 1.05, corruptionMod: 3, efficiencyMod: 2 },
    factionReaction: { merchants: 15, nobles: 5, commoners: -8 }
  },
  {
    id: "law_religious_tolerance",
    name: "\u5B97\u6559\u5BBD\u5BB9\u6CD5",
    category: "administrative",
    description: "\u5BBD\u5BB9\u5F02\u6559\uFF0C\u964D\u51B2\u7A81\u4F46\u795E\u804C\u4E0D\u6EE1\u3002",
    costGold: 120,
    allowedGovernments: [],
    prereqAdminLevel: 2,
    conflictsWith: ["law_strict_punishment"],
    effects: { stabilityMod: 4, efficiencyMod: 3, unrestReduction: 2 },
    factionReaction: { clergy: -18, commoners: 8, merchants: 5 }
  }
];
var LAW_BY_ID = Object.fromEntries(
  LAWS.map((l) => [l.id, l])
);
var LAW_IDS = LAWS.map((l) => l.id);
var LAW_COUNT = LAWS.length;
var LAWS_BY_CATEGORY = {
  civil: LAWS.filter((l) => l.category === "civil"),
  criminal: LAWS.filter((l) => l.category === "criminal"),
  administrative: LAWS.filter((l) => l.category === "administrative")
};

// src/engine/politics.ts
function charMods3(nation) {
  const merged = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(def.penalties)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
  }
  return merged;
}
function settlePolitics(nation, state) {
  const provs = provincesOf(nation.id, state.provinces);
  const fw = factionWeightedSat(nation.factions);
  const avgUnrest = provs.length ? provs.reduce((s, p) => s + p.unrest, 0) / provs.length : 0;
  const rebellionProvCount = provs.filter((p) => p.rebellionRisk >= 100).length;
  const dStab = stabilityDelta(
    nation.government.legitimacy,
    fw.weighted,
    fw.totalPower,
    avgUnrest,
    nation.warExhaustion,
    rebellionProvCount
  );
  let finalDelta = dStab;
  if (nation.civilWar?.active) {
    finalDelta -= 3;
  }
  const stab = nation.government.stability;
  const atWar2 = nation.civilWar?.active;
  if (stab < 40) {
    finalDelta = Math.max(finalDelta, atWar2 ? 2 : 5);
  } else if (stab < 60) {
    finalDelta = Math.max(finalDelta, atWar2 ? 1 : 3);
  } else if (stab < 75) {
    finalDelta = Math.max(finalDelta, atWar2 ? 0 : 1.5);
  } else {
    finalDelta = Math.max(finalDelta, -2);
  }
  nation.government.stability = clamp2(nation.government.stability + finalDelta, 0, 100);
  const reformShockTurns = nation.activePolicies.filter(
    (p) => state.turn - p.enactedTurn < 3
  ).length > 0 ? 1 : 0;
  const dLegit = legitimacyDelta(fw.avgSat, nation.government.corruption, nation.warExhaustion, reformShockTurns);
  nation.government.legitimacy = clamp2(nation.government.legitimacy + dLegit, 0, 100);
  nation.government.legitimacy = clamp2(nation.government.legitimacy + nation.tech.culture * 0.3, 0, 100);
  const hasAntiCorruption = nation.activePolicies.some((p) => p.policyId === "anti_corruption");
  let corruptionDelta;
  if (hasAntiCorruption) {
    corruptionDelta = -1;
  } else if (nation.government.stability >= 70) {
    corruptionDelta = -0.2;
  } else if (nation.government.stability >= 50) {
    corruptionDelta = 0.1;
  } else {
    corruptionDelta = 0.4;
  }
  nation.government.corruption = clamp2(nation.government.corruption + corruptionDelta, 0, 100);
  const cm = charMods3(nation);
  if (cm.stabilityMod) nation.government.stability = clamp2(nation.government.stability + cm.stabilityMod, 0, 100);
  if (cm.legitimacyMod) nation.government.legitimacy = clamp2(nation.government.legitimacy + cm.legitimacyMod, 0, 100);
  if (cm.efficiencyMod) nation.government.efficiency = clamp2(nation.government.efficiency + cm.efficiencyMod, 0, 100);
  if (cm.corruptionMod) nation.government.corruption = clamp2(nation.government.corruption + cm.corruptionMod, 0, 100);
  const factionSatMap = { nobles: cm.noblesSat, merchants: cm.merchantsSat, military: cm.militarySat, commoners: cm.commonersSat, clergy: cm.clergySat };
  for (const f of nation.factions) {
    const delta = factionSatMap[f.id];
    if (delta) f.satisfaction = clamp2(f.satisfaction + delta * 0.1, 0, 100);
  }
  const govDef = GOVERNMENTS[nation.government.type];
  if (govDef?.perTurn) {
    const pt = govDef.perTurn;
    if (pt.legitimacy) nation.government.legitimacy = clamp2(nation.government.legitimacy + pt.legitimacy, 0, 100);
    if (pt.stability) nation.government.stability = clamp2(nation.government.stability + pt.stability, 0, 100);
    if (pt.efficiency) nation.government.efficiency = clamp2(nation.government.efficiency + pt.efficiency, 0, 100);
    if (pt.corruption) nation.government.corruption = clamp2(nation.government.corruption + pt.corruption, 0, 100);
    if (pt.factionSat) {
      const fsMap = pt.factionSat;
      for (const f of nation.factions) {
        const d = fsMap[f.id];
        if (d) f.satisfaction = clamp2(f.satisfaction + d, 0, 100);
      }
    }
  }
  return { stabilityDelta: dStab, legitimacyDelta: dLegit };
}
function canEnactPolicy(nation, policyId) {
  const def = POLICIES.find((p) => p.id === policyId);
  if (!def) return { ok: false, reason: "\u653F\u7B56\u4E0D\u5B58\u5728" };
  if (nation.activePolicies.some((p) => p.policyId === policyId)) {
    return { ok: false, reason: "\u5DF2\u63A8\u884C" };
  }
  if (def.allowedGovernments.length > 0 && !def.allowedGovernments.includes(nation.government.type)) {
    return { ok: false, reason: "\u653F\u4F53\u4E0D\u5141\u8BB8" };
  }
  if (def.prereqTech && !hasTech(nation, def.prereqTech)) {
    return { ok: false, reason: "\u7F3A\u5C11\u524D\u7F6E\u79D1\u6280" };
  }
  if (nation.resources.gold < def.costGold) return { ok: false, reason: "\u91D1\u4E0D\u8DB3" };
  return { ok: true };
}
function enactPolicy(nation, policyId, state) {
  const eligibility = canEnactPolicy(nation, policyId);
  if (!eligibility.ok) return eligibility;
  const def = POLICIES.find((p) => p.id === policyId);
  nation.resources.gold -= def.costGold;
  nation.activePolicies.push({ policyId, enactedTurn: state.turn });
  if (def.effects.corruptionMod) nation.government.corruption = clamp2(nation.government.corruption + def.effects.corruptionMod, 0, 100);
  if (def.effects.stabilityMod) nation.government.stability = clamp2(nation.government.stability + def.effects.stabilityMod, 0, 100);
  if (def.effects.efficiencyMod) nation.government.efficiency = clamp2(nation.government.efficiency + def.effects.efficiencyMod, 0, 100);
  if (def.effects.taxRateMod) nation.taxRate = clamp2(nation.taxRate + (def.effects.taxRateMod ?? 0), 0, 0.5);
  nation.policyMods = derivePolicyMods(nation);
  for (const [fid, delta] of Object.entries(def.factionReaction)) {
    const f = nation.factions.find((x) => x.id === fid);
    if (f) f.satisfaction = clamp2(f.satisfaction + delta, 0, 100);
  }
  return { ok: true };
}
function hasTech(nation, techId) {
  const match = /^(agri|mil|admin|culture)_lv(\d+)$/.exec(techId);
  if (!match) return false;
  const branch = match[1];
  return nation.tech[branch] >= Number(match[2]);
}
function derivePolicyMods(nation) {
  const mods = {};
  for (const active of nation.activePolicies) {
    const effects = POLICIES.find((policy) => policy.id === active.policyId)?.effects;
    if (!effects) continue;
    if (effects.taxEffMod) mods.taxEffMod = (mods.taxEffMod ?? 1) * effects.taxEffMod;
    if (effects.combatMod) mods.combatMod = (mods.combatMod ?? 1) * effects.combatMod;
    if (effects.mobilizationMod) mods.mobilizationMod = (mods.mobilizationMod ?? 1) * effects.mobilizationMod;
    if (effects.popGrowthMod) mods.popGrowthMod = (mods.popGrowthMod ?? 1) * effects.popGrowthMod;
    if (effects.influenceMod) {
      const influenceMultiplier = Math.abs(effects.influenceMod) >= 2 ? 1 + effects.influenceMod / 100 : effects.influenceMod;
      mods.influenceMod = (mods.influenceMod ?? 1) * influenceMultiplier;
    }
    if (effects.assimilationMod) mods.assimilationMod = (mods.assimilationMod ?? 0) + effects.assimilationMod;
  }
  return mods;
}
function enactLaw(nation, lawId, state) {
  const def = LAWS.find((l) => l.id === lawId);
  if (!def) return { ok: false, reason: "\u6CD5\u5F8B\u4E0D\u5B58\u5728" };
  if (nation.activeLaws.some((l) => l.lawId === lawId)) return { ok: false, reason: "\u5DF2\u63A8\u884C" };
  if (def.allowedGovernments.length > 0 && !def.allowedGovernments.includes(nation.government.type)) {
    return { ok: false, reason: "\u653F\u4F53\u4E0D\u5141\u8BB8" };
  }
  if (nation.tech.admin < def.prereqAdminLevel) return { ok: false, reason: `\u9700\u884C\u653FLv${def.prereqAdminLevel}` };
  if (def.conflictsWith) {
    for (const c of def.conflictsWith) {
      if (nation.activeLaws.some((l) => l.lawId === c)) {
        return { ok: false, reason: `\u4E0E\u5DF2\u63A8\u884C\u7684 ${LAWS.find((x) => x.id === c)?.name ?? c} \u51B2\u7A81` };
      }
    }
  }
  if (nation.resources.gold < def.costGold) return { ok: false, reason: "\u91D1\u4E0D\u8DB3" };
  nation.resources.gold -= def.costGold;
  nation.activeLaws.push({ lawId, enactedTurn: state.turn });
  const e = def.effects;
  if (e.corruptionMod) nation.government.corruption = clamp2(nation.government.corruption + e.corruptionMod, 0, 100);
  if (e.stabilityMod) nation.government.stability = clamp2(nation.government.stability + e.stabilityMod, 0, 100);
  if (e.efficiencyMod) nation.government.efficiency = clamp2(nation.government.efficiency + e.efficiencyMod, 0, 100);
  if (e.legitimacyMod) nation.government.legitimacy = clamp2(nation.government.legitimacy + e.legitimacyMod, 0, 100);
  if (e.taxEffMod && e.taxEffMod !== 1) nation.government.efficiency = clamp2(nation.government.efficiency * e.taxEffMod, 0, 100);
  for (const f of nation.factions) {
    const delta = def.factionReaction[f.id];
    if (delta) f.satisfaction = clamp2(f.satisfaction + delta, 0, 100);
  }
  return { ok: true };
}
function lawPerTurnEffects(nation, provs) {
  applyLawPerTurnEffectFinals(provs, lawPerTurnEffectsPure(nation, provs));
}
function applyLawPerTurnEffectFinals(provs, finals) {
  const byId = new Map(provs.map((p) => [p.id, p]));
  for (const [provId, final] of Object.entries(finals)) {
    const p = byId.get(provId);
    if (!p) continue;
    if (final.unrest !== void 0) p.unrest = final.unrest;
    if (final.rebellionRisk !== void 0) p.rebellionRisk = final.rebellionRisk;
  }
}
function lawPerTurnEffectsPure(nation, provs) {
  const finals = {};
  for (const al of nation.activeLaws) {
    const def = LAWS.find((l) => l.id === al.lawId);
    if (!def) continue;
    const e = def.effects;
    if (e.unrestReduction) {
      for (const p of provs) {
        const cur = finals[p.id]?.unrest ?? p.unrest;
        finals[p.id] = { ...finals[p.id], unrest: clamp2(cur - e.unrestReduction, 0, 100) };
      }
    }
    if (e.rebellionReduction) {
      for (const p of provs) {
        const cur = finals[p.id]?.rebellionRisk ?? p.rebellionRisk;
        finals[p.id] = { ...finals[p.id], rebellionRisk: clamp2(cur - e.rebellionReduction, 0, 100) };
      }
    }
  }
  return finals;
}
function maxManageableProvinces(nation) {
  return maxProvinces(
    nation.tech.admin,
    nation.government.efficiency,
    nation.activeCharacterBonuses.includes("centralization"),
    nation.tier
  );
}
function overExtensionPenalty(nation, provinceCount) {
  const max = maxManageableProvinces(nation);
  const over = Math.max(0, provinceCount - max);
  return { taxEffLoss: over * 0.05, stabilityLoss: over * 2 };
}
function settlePoliticsPure(nation, state) {
  const provs = provincesOf(nation.id, state.provinces);
  const fw = factionWeightedSat(nation.factions);
  const avgUnrest = provs.length ? provs.reduce((s, p) => s + p.unrest, 0) / provs.length : 0;
  const rebellionProvCount = provs.filter((p) => p.rebellionRisk >= 100).length;
  const dStab = stabilityDelta(
    nation.government.legitimacy,
    fw.weighted,
    fw.totalPower,
    avgUnrest,
    nation.warExhaustion,
    rebellionProvCount
  );
  let finalDelta = dStab;
  if (nation.civilWar?.active) finalDelta -= 3;
  const stab = nation.government.stability;
  const atWar2 = nation.civilWar?.active;
  if (stab < 40) finalDelta = Math.max(finalDelta, atWar2 ? 2 : 5);
  else if (stab < 60) finalDelta = Math.max(finalDelta, atWar2 ? 1 : 3);
  else if (stab < 75) finalDelta = Math.max(finalDelta, atWar2 ? 0 : 1.5);
  else finalDelta = Math.max(finalDelta, -2);
  let finalStab = clamp2(nation.government.stability + finalDelta, 0, 100);
  const reformShockTurns = nation.activePolicies.filter((p) => state.turn - p.enactedTurn < 3).length > 0 ? 1 : 0;
  const dLegit = legitimacyDelta(fw.avgSat, nation.government.corruption, nation.warExhaustion, reformShockTurns);
  let finalLegit = clamp2(nation.government.legitimacy + dLegit, 0, 100);
  finalLegit = clamp2(finalLegit + nation.tech.culture * 0.3, 0, 100);
  const hasAntiCorruption = nation.activePolicies.some((p) => p.policyId === "anti_corruption");
  let corruptionDelta;
  if (hasAntiCorruption) corruptionDelta = -1;
  else if (finalStab >= 70) corruptionDelta = -0.2;
  else if (finalStab >= 50) corruptionDelta = 0.1;
  else corruptionDelta = 0.4;
  let finalCorruption = clamp2(nation.government.corruption + corruptionDelta, 0, 100);
  let finalEfficiency = nation.government.efficiency;
  const cm = charMods3(nation);
  if (cm.stabilityMod) finalStab = clamp2(finalStab + cm.stabilityMod, 0, 100);
  if (cm.legitimacyMod) finalLegit = clamp2(finalLegit + cm.legitimacyMod, 0, 100);
  if (cm.efficiencyMod) finalEfficiency = clamp2(finalEfficiency + cm.efficiencyMod, 0, 100);
  if (cm.corruptionMod) finalCorruption = clamp2(finalCorruption + cm.corruptionMod, 0, 100);
  const factionSatFinal = {};
  const factionSatMap = { nobles: cm.noblesSat, merchants: cm.merchantsSat, military: cm.militarySat, commoners: cm.commonersSat, clergy: cm.clergySat };
  for (const f of nation.factions) {
    let sat = f.satisfaction;
    const d = factionSatMap[f.id];
    if (d) sat = clamp2(sat + d * 0.1, 0, 100);
    factionSatFinal[f.id] = sat;
  }
  const govDef = GOVERNMENTS[nation.government.type];
  if (govDef?.perTurn) {
    const pt = govDef.perTurn;
    if (pt.legitimacy) finalLegit = clamp2(finalLegit + pt.legitimacy, 0, 100);
    if (pt.stability) finalStab = clamp2(finalStab + pt.stability, 0, 100);
    if (pt.efficiency) finalEfficiency = clamp2(finalEfficiency + pt.efficiency, 0, 100);
    if (pt.corruption) finalCorruption = clamp2(finalCorruption + pt.corruption, 0, 100);
    if (pt.factionSat) {
      const fsMap = pt.factionSat;
      for (const f of nation.factions) {
        const d = fsMap[f.id];
        if (d) factionSatFinal[f.id] = clamp2(factionSatFinal[f.id] + d, 0, 100);
      }
    }
  }
  return {
    stabilityDelta: dStab,
    legitimacyDelta: dLegit,
    govFinal: { stability: finalStab, legitimacy: finalLegit, corruption: finalCorruption, efficiency: finalEfficiency },
    factionSatFinal
  };
}

// src/utils/id.ts
function entitySequenceFromId(id) {
  if (typeof id !== "string") return 0;
  const match = /^entity_([0-9a-z]+)_/.exec(id);
  if (!match) return 0;
  const value = Number.parseInt(match[1], 36);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
function allocateEntityId(state, prefix = "id") {
  const current2 = Number.isSafeInteger(state.entityIdCounter) && state.entityIdCounter >= 0 ? state.entityIdCounter : 0;
  state.entityIdCounter = current2 + 1;
  return `entity_${state.entityIdCounter.toString(36)}_${prefix}`;
}

// src/engine/chronicle.ts
var CHRONICLE_MAX = 50;
function addChronicle(state, entry) {
  if (state.chronicle.some((c) => c.kind === entry.kind && c.title === entry.title)) return;
  state.chronicle.push(entry);
  if (state.chronicle.length > CHRONICLE_MAX) {
    state.chronicle = state.chronicle.slice(-CHRONICLE_MAX);
  }
}
function detectMilestones(state, prev) {
  const playerId = state.playerNationId;
  const player = state.nations[playerId];
  if (!player) return;
  const prevPlayer = prev.nations[playerId];
  if (!prevPlayer) return;
  const turn = state.turn;
  const provs = provincesOf(playerId, state.provinces);
  const prevProvs = provincesOf(playerId, prev.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const prevPop = prevProvs.reduce((s, p) => s + p.population, 0);
  if (turn === 1 && !state.chronicle.some((c) => c.kind === "founding")) {
    addChronicle(state, {
      turn,
      kind: "founding",
      title: `${player.name} \u7ACB\u56FD`,
      desc: `${player.ruler.name} \u8087\u57FA\uFF0C${player.government.type} \u5236\u521D\u7ACB\uFF0C\u7586\u571F ${provs.length} \u7701\u3002`
    });
  }
  const provCount = provs.length;
  const prevProvCount = prevProvs.length;
  const expandThresholds = [3, 5, 10, 20, 35];
  for (const th of expandThresholds) {
    if (provCount >= th && prevProvCount < th) {
      addChronicle(state, {
        turn,
        kind: "expansion",
        title: `\u7586\u571F\u8FBE ${th} \u7701`,
        desc: `\u5E1D\u56FD\u6269\u5F20\u81F3 ${provCount} \u7701\uFF0C\u6CBB\u80FD\u538B\u529B\u65E5\u589E\u3002`
      });
    }
  }
  const popThresholds = [500, 2e3, 5e3, 1e4];
  for (const th of popThresholds) {
    if (totalPop >= th && prevPop < th) {
      addChronicle(state, {
        turn,
        kind: "population",
        title: `\u5B50\u6C11\u7834 ${th}`,
        desc: `\u4EBA\u53E3\u8FBE ${Math.round(totalPop)}\uFF0C\u90A6\u56FD\u5174\u76DB\u3002`
      });
    }
  }
  if (player.atWar && !prevPlayer.atWar) {
    const war = state.wars.find((w) => w.attackerId === playerId || w.defenderId === playerId);
    const enemy = war ? state.nations[war.attackerId === playerId ? war.defenderId : war.attackerId] : null;
    addChronicle(state, {
      turn,
      kind: "victory",
      title: `\u9996\u6218\u6253\u54CD`,
      desc: enemy ? `\u4E0E ${enemy.name} \u5175\u620E\u76F8\u89C1\uFF0C\u56FD\u8FD0\u7CFB\u4E8E\u6B64\u6218\u3002` : `\u5175\u6208\u65E2\u8D77\uFF0C\u793E\u7A37\u52A8\u5458\u3002`
    });
  }
  if (prevPlayer.government.stability < 20 && player.government.stability > 50) {
    addChronicle(state, {
      turn,
      kind: "crisis",
      title: `\u5371\u5C40\u626D\u8F6C`,
      desc: `\u7A33\u5B9A\u5EA6\u4ECE ${Math.round(prevPlayer.government.stability)} \u56DE\u5347\u81F3 ${Math.round(player.government.stability)}\uFF0C\u793E\u7A37\u8F6C\u5B89\u3002`
    });
  }
  if (player.government.stability < 20 && prevPlayer.government.stability >= 20 && !state.chronicle.some((c) => c.kind === "crisis" && c.title === "\u4E71\u4E16\u7684\u5E8F\u7AE0")) {
    addChronicle(state, {
      turn,
      kind: "crisis",
      title: `\u4E71\u4E16\u7684\u5E8F\u7AE0`,
      desc: `\u793E\u7A37\u52A8\u8361\uFF0C\u7A33\u5B9A\u5EA6\u964D\u81F3 ${Math.round(player.government.stability)}\uFF0C\u4EBA\u5FC3\u601D\u4E71\u3002`
    });
  }
  let deficitStreak = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const r = state.history[i];
    const net = r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
    if (net < 0) deficitStreak++;
    else break;
  }
  if (deficitStreak >= 3 && !state.chronicle.some((c) => c.kind === "crisis" && c.title === "\u8D22\u653F\u5371\u673A")) {
    addChronicle(state, {
      turn,
      kind: "crisis",
      title: `\u8D22\u653F\u5371\u673A`,
      desc: `\u56FD\u5E93\u8FDE\u7EED ${deficitStreak} \u5E74\u8D64\u5B57\uFF0C\u8D22\u7528\u532E\u4E4F\uFF0C\u5B9C\u901F\u6574\u987F\u3002`
    });
  }
  const goldThresholds = [1e3, 3e3];
  for (const th of goldThresholds) {
    if (player.resources.gold >= th && prevPlayer.resources.gold < th) {
      addChronicle(state, {
        turn,
        kind: "trade",
        title: `\u56FD\u5E93\u5145\u76C8`,
        desc: `\u91D1\u5E93\u8FBE ${Math.round(player.resources.gold)}\uFF0C\u8D22\u7528\u8DB3\u3002`
      });
    }
  }
  const reign = player.ruler.reignYears ?? 0;
  const prevReign = prevPlayer.ruler.reignYears ?? 0;
  for (const th of [20, 40]) {
    if (reign >= th && prevReign < th) {
      addChronicle(state, {
        turn,
        kind: "reign",
        title: `${player.ruler.name} \u5728\u4F4D ${th} \u8F7D`,
        desc: `\u4E3B\u541B\u6CBB ${th} \u5E74\uFF0C\u90A6\u56FD\u6839\u57FA\u6E10\u56FA\u3002`
      });
    }
  }
  if (prevPlayer.ruler.name !== player.ruler.name && turn > 1) {
    addChronicle(state, {
      turn,
      kind: "reign",
      title: `\u65B0\u541B\u7EE7\u4F4D`,
      desc: `${player.ruler.name} \u627F\u5927\u7EDF\uFF0C\u5E74 ${player.ruler.age}\uFF0C\u6CBB\u80FD ${player.ruler.ability}\u3002`
    });
  }
  for (const war of state.wars) {
    const isAttacker = war.attackerId === playerId;
    const isDefender = war.defenderId === playerId;
    if (!isAttacker && !isDefender) continue;
    const prevWar = prev.wars.find((w) => w.id === war.id);
    if (!prevWar) continue;
    const prevReports = prevWar.battleReports ?? [];
    const newReports = (war.battleReports ?? []).slice(prevReports.length);
    for (const r of newReports) {
      const playerWon = isAttacker ? r.outcome === "advance" : r.outcome === "repelled";
      const playerLost = isAttacker ? r.outcome === "repelled" : r.outcome === "advance";
      if (playerWon && !state.chronicle.some((c) => c.kind === "victory" && c.title === "\u9996\u6218\u544A\u6377")) {
        addChronicle(state, {
          turn,
          kind: "victory",
          title: `\u9996\u6218\u544A\u6377`,
          desc: `\u6211\u519B\u4E8E ${state.provinces[war.targetProvinceId]?.name ?? "\u524D\u7EBF"} \u53D6\u80DC\uFF0C\u65A9\u654C ${r.defLoss}\u3002`
        });
      }
      if (playerLost && r.attLoss + r.defLoss > 100 && !state.chronicle.some((c) => c.kind === "crisis" && c.title === "\u5175\u8D25\u4E4B\u8FB1")) {
        addChronicle(state, {
          turn,
          kind: "crisis",
          title: `\u5175\u8D25\u4E4B\u8FB1`,
          desc: `\u6211\u519B\u4E8E ${state.provinces[war.targetProvinceId]?.name ?? "\u524D\u7EBF"} \u60E8\u8D25\uFF0C\u6298\u635F ${isAttacker ? r.attLoss : r.defLoss} \u4EBA\u3002`
        });
      }
    }
  }
  for (const [nid, n3] of Object.entries(state.nations)) {
    if (n3.defeated) {
      const prevN = prev.nations[nid];
      if (prevN && !prevN.defeated && !state.chronicle.some((c) => c.kind === "victory" && c.title === `\u706D ${n3.name}`)) {
        const playerInvolved = state.wars.some((w) => w.attackerId === playerId && w.defenderId === nid || w.defenderId === playerId && w.attackerId === nid);
        if (playerInvolved) {
          addChronicle(state, {
            turn,
            kind: "victory",
            title: `\u706D ${n3.name}`,
            desc: `${n3.name} \u56FD\u795A\u7EC8\u7EDD\uFF0C\u7586\u571F\u5C3D\u5F52\u6211\u6709\u3002`
          });
        }
      }
    }
  }
}

// src/engine/summits.ts
var SUMMIT_AGENDAS = {
  trade: {
    label: "\u7ECF\u8D38\u5F00\u653E",
    description: "\u5546\u8BA8\u5E02\u573A\u51C6\u5165\u3001\u5173\u7A0E\u534F\u8C03\u4E0E\u957F\u671F\u8D38\u6613\u4F9D\u5B58\u3002",
    agreementName: "\u53CC\u8FB9\u7ECF\u8D38\u6846\u67B6",
    duration: 6
  },
  security: {
    label: "\u5B89\u5168\u4E0E\u4E0D\u4FB5\u72AF",
    description: "\u964D\u4F4E\u8BEF\u5224\u4E0E\u8FB9\u5883\u538B\u529B\uFF0C\u5E76\u4EE5\u591A\u5E74\u4E0D\u4FB5\u72AF\u627F\u8BFA\u7EA6\u675F\u53CC\u65B9\u3002",
    agreementName: "\u53CC\u8FB9\u4E0D\u4FB5\u72AF\u58F0\u660E",
    duration: 8
  },
  normalization: {
    label: "\u5173\u7CFB\u6B63\u5E38\u5316",
    description: "\u4FEE\u590D\u654C\u610F\u3001\u6062\u590D\u4E92\u4FE1\u5E76\u9010\u6B65\u964D\u4F4E\u5F7C\u6B64\u5A01\u80C1\u8BA4\u77E5\u3002",
    agreementName: "\u5173\u7CFB\u6B63\u5E38\u5316\u8DEF\u7EBF\u56FE",
    duration: 5
  },
  technology: {
    label: "\u79D1\u7814\u4E0E\u5B66\u672F\u4E92\u8BBF",
    description: "\u5EFA\u7ACB\u5B66\u8005\u3001\u5178\u7C4D\u4E0E\u6280\u672F\u4EA4\u6D41\u673A\u5236\uFF0C\u9010\u5E74\u589E\u52A0\u79D1\u7814\u79EF\u7D2F\u3002",
    agreementName: "\u79D1\u7814\u4E92\u8BBF\u534F\u5B9A",
    duration: 6
  }
};
var SUMMIT_STANCES = {
  conciliatory: {
    label: "\u4E3B\u52A8\u8BA9\u6B65",
    description: "\u627F\u62C5\u66F4\u591A\u63A5\u5F85\u4E0E\u4EA4\u6362\u6210\u672C\uFF0C\u663E\u8457\u63D0\u9AD8\u5BF9\u65B9\u63A5\u53D7\u610F\u613F\u3002",
    cost: { adminPt: 2, influence: 30, gold: 100 },
    score: 14
  },
  pragmatic: {
    label: "\u52A1\u5B9E\u4E92\u60E0",
    description: "\u4EE5\u5BF9\u7B49\u4EA4\u6362\u5BFB\u6C42\u53EF\u6267\u884C\u7684\u4E2D\u95F4\u65B9\u6848\u3002",
    cost: { adminPt: 2, influence: 25, gold: 60 },
    score: 0
  },
  firm: {
    label: "\u5F3A\u52BF\u4EA4\u6D89",
    description: "\u6210\u672C\u8F83\u4F4E\u4F46\u66F4\u4F9D\u8D56\u5B9E\u529B\u4F18\u52BF\uFF0C\u5931\u8D25\u65F6\u5916\u4EA4\u4EE3\u4EF7\u66F4\u5927\u3002",
    cost: { adminPt: 2, influence: 35, gold: 40 },
    score: -8
  }
};
var SUMMIT_COOLDOWN = 8;
function pairMatches(a, b, left, right) {
  return a === left && b === right || a === right && b === left;
}
function relationPair(state, left, right) {
  const forward = state.relations.find((relation) => relation.from === left && relation.to === right);
  const reverse = state.relations.find((relation) => relation.from === right && relation.to === left);
  return forward && reverse ? [forward, reverse] : null;
}
function average(left, right) {
  return (left + right) / 2;
}
function nationPower(nation, state) {
  const army = nation.army.reduce((sum, unit) => sum + unit.size * (0.5 + unit.morale / 200), 0);
  const provinces = Object.values(state.provinces).filter((province) => province.ownerId === nation.id).length;
  return army + provinces * 180 + nation.resources.gold * 0.2 + nation.government.stability * 2;
}
function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function otherWars(state, nationId, excludedId) {
  return state.wars.filter(
    (war) => (war.attackerId === nationId || war.defenderId === nationId) && war.attackerId !== excludedId && war.defenderId !== excludedId
  ).length;
}
function factor(label, value, detail) {
  return { label, value: Math.round(value), detail };
}
function agendaFactors(agenda, initiator, target, relations, state) {
  const [forward, reverse] = relations;
  const avgThreat = average(forward.threat, reverse.threat);
  const tendency = target.tendency;
  switch (agenda) {
    case "trade":
      return [
        factor("\u5546\u4E1A\u53D6\u5411", (tendency.commerce + tendency.mercantilist) / 14, "\u5BF9\u65B9\u8D8A\u91CD\u89C6\u5546\u4E1A\u4E0E\u91CD\u5546\u653F\u7B56\uFF0C\u8D8A\u613F\u610F\u5F00\u653E\u5E02\u573A\u3002"),
        factor("\u5B64\u7ACB\u503E\u5411", -tendency.isolationist / 10, "\u5B64\u7ACB\u4E3B\u4E49\u4F1A\u538B\u4F4E\u7ECF\u8D38\u8C08\u5224\u7A7A\u95F4\u3002"),
        factor("\u65E2\u6709\u8D38\u6613", forward.treaty === "trade" ? 10 : 0, "\u5DF2\u6709\u8D38\u6613\u5173\u7CFB\u66F4\u5BB9\u6613\u5347\u7EA7\u4E3A\u957F\u671F\u6846\u67B6\u3002")
      ];
    case "security":
      return [
        factor("\u5171\u540C\u907F\u6218\u9700\u6C42", Math.min(12, avgThreat / 7), "\u8F83\u9AD8\u5A01\u80C1\u4F1A\u5236\u9020\u8FBE\u6210\u4E0D\u4FB5\u72AF\u627F\u8BFA\u7684\u73B0\u5B9E\u9700\u6C42\u3002"),
        factor("\u6269\u5F20\u503E\u5411", -(tendency.expansionist + tendency.militarism) / 14, "\u6269\u5F20\u4E0E\u519B\u56FD\u503E\u5411\u4F1A\u524A\u5F31\u627F\u8BFA\u53EF\u4FE1\u5EA6\u3002"),
        factor("\u5916\u90E8\u6218\u4E89\u538B\u529B", otherWars(state, target.id, initiator.id) * 6, "\u5BF9\u65B9\u82E5\u53E6\u6709\u6218\u4E8B\uFF0C\u66F4\u9700\u8981\u7A33\u5B9A\u8FD9\u4E00\u65B9\u5411\u3002")
      ];
    case "normalization":
      return [
        factor("\u4FEE\u590D\u7A7A\u95F4", average(forward.relation, reverse.relation) < 0 ? 12 : 4, "\u5173\u7CFB\u8D8A\u7D27\u5F20\uFF0C\u6539\u5584\u5E26\u6765\u7684\u73B0\u5B9E\u6536\u76CA\u8D8A\u5927\u3002"),
        factor("\u4F4E\u5A01\u80C1\u73AF\u5883", -avgThreat / 12, "\u6301\u7EED\u9AD8\u5A01\u80C1\u4F1A\u59A8\u788D\u4E92\u4FE1\u6062\u590D\u3002"),
        factor("\u56FD\u5185\u7A33\u5B9A", (target.government.stability - 50) / 8, "\u7A33\u5B9A\u653F\u5E9C\u66F4\u6709\u80FD\u529B\u5151\u73B0\u6E10\u8FDB\u5F0F\u627F\u8BFA\u3002")
      ];
    case "technology":
      return [
        factor("\u5B66\u672F\u53D6\u5411", (tendency.scholarly + tendency.technocracy) / 12, "\u5B66\u672F\u4E0E\u6280\u672F\u5B98\u50DA\u503E\u5411\u63D0\u9AD8\u4EA4\u6D41\u610F\u613F\u3002"),
        factor("\u5B64\u7ACB\u503E\u5411", -tendency.isolationist / 9, "\u5B64\u7ACB\u4E3B\u4E49\u4F1A\u9650\u5236\u77E5\u8BC6\u4E0E\u4EBA\u5458\u6D41\u52A8\u3002"),
        factor("\u79D1\u7814\u57FA\u7840", (target.tech.admin + target.tech.culture - 2) * 2, "\u884C\u653F\u4E0E\u6587\u5316\u57FA\u7840\u51B3\u5B9A\u4EA4\u6D41\u673A\u5236\u80FD\u5426\u6267\u884C\u3002")
      ];
  }
}
function getActiveAccord(state, left, right, agenda) {
  return state.diplomaticAccords.find(
    (accord) => pairMatches(accord.partyA, accord.partyB, left, right) && accord.expiresTurn >= state.turn && (!agenda || accord.agenda === agenda)
  );
}
function hasActiveNonAggressionAccord(state, left, right) {
  return !!getActiveAccord(state, left, right, "security");
}
function previewDiplomaticSummit(state, initiatorId, targetId, agenda, stance) {
  const initiator = state.nations[initiatorId];
  const target = state.nations[targetId];
  const reasons = [];
  const factors = [];
  const costs = SUMMIT_STANCES[stance].cost;
  if (!initiator || initiator.defeated) reasons.push("\u53D1\u8D77\u56FD\u4E0D\u5B58\u5728\u6216\u5DF2\u7ECF\u706D\u4EA1");
  if (!target || target.defeated || targetId === initiatorId) reasons.push("\u76EE\u6807\u56FD\u5BB6\u65E0\u6548");
  const relations = initiator && target ? relationPair(state, initiatorId, targetId) : null;
  if (!relations) reasons.push("\u53CC\u65B9\u5C1A\u672A\u5EFA\u7ACB\u53EF\u7528\u7684\u6B63\u5F0F\u5916\u4EA4\u6E20\u9053");
  if (state.turn < 3) reasons.push("\u5EFA\u56FD\u521D\u671F\u5916\u4EA4\u673A\u5236\u5C1A\u672A\u6210\u719F\uFF08\u9700\u7B2C 4 \u5E74\u8D77\uFF09");
  if (state.wars.some((war) => pairMatches(war.attackerId, war.defenderId, initiatorId, targetId))) {
    reasons.push("\u53CC\u65B9\u6B63\u5728\u4EA4\u6218\uFF0C\u5E94\u5148\u901A\u8FC7\u505C\u6218\u6216\u548C\u5E73\u8C08\u5224\u7ED3\u675F\u6218\u4E89");
  }
  const lastSummit = [...state.diplomaticSummits].reverse().find((summit) => pairMatches(summit.initiatorId, summit.targetId, initiatorId, targetId));
  const cooldownRemaining = lastSummit ? Math.max(0, SUMMIT_COOLDOWN - (state.turn - lastSummit.turn)) : 0;
  if (cooldownRemaining > 0) reasons.push(`\u8DDD\u79BB\u4E0A\u6B21\u5143\u9996\u63A5\u89E6\u8FC7\u8FD1\uFF08\u8FD8\u9700 ${cooldownRemaining} \u5E74\uFF09`);
  if (initiator) {
    if (initiator.government.stability < 30) reasons.push("\u56FD\u5185\u7A33\u5B9A\u4F4E\u4E8E 30\uFF0C\u5143\u9996\u65E0\u6CD5\u79BB\u5F00\u5371\u673A\u5904\u7F6E");
    if (initiator.government.legitimacy < 25) reasons.push("\u5408\u6CD5\u6027\u4F4E\u4E8E 25\uFF0C\u5BF9\u5916\u627F\u8BFA\u7F3A\u4E4F\u56FD\u5185\u6388\u6743");
    if (initiator.resources.adminPt < costs.adminPt) reasons.push(`\u884C\u653F\u70B9\u4E0D\u8DB3\uFF08\u9700 ${costs.adminPt}\uFF09`);
    if (initiator.resources.influence < costs.influence) reasons.push(`\u5F71\u54CD\u529B\u4E0D\u8DB3\uFF08\u9700 ${costs.influence}\uFF09`);
    if (initiator.resources.gold < costs.gold) reasons.push(`\u56FD\u5E93\u4E0D\u8DB3\uFF08\u9700 ${costs.gold}\uFF09`);
  }
  if (target && target.government.stability < 25) reasons.push("\u5BF9\u65B9\u56FD\u5185\u5C40\u52BF\u8FC7\u4E8E\u52A8\u8361\uFF0C\u65E0\u6CD5\u5151\u73B0\u957F\u671F\u627F\u8BFA");
  if (relations && initiator && target) {
    const [forward, reverse] = relations;
    const avgRelation = average(forward.relation, reverse.relation);
    const avgTrust = average(forward.trust, reverse.trust);
    const avgThreat = average(forward.threat, reverse.threat);
    const treaty = forward.treaty;
    if (treaty === "truce" && agenda !== "normalization") reasons.push("\u505C\u6218\u671F\u5185\u53EA\u80FD\u5148\u8BA8\u8BBA\u5173\u7CFB\u6B63\u5E38\u5316");
    if (getActiveAccord(state, initiatorId, targetId, agenda)) reasons.push("\u8BE5\u8BAE\u9898\u5DF2\u6709\u751F\u6548\u4E2D\u7684\u53CC\u8FB9\u534F\u8BAE");
    if (agenda === "trade" && (avgRelation < 5 || avgTrust < 25)) {
      reasons.push("\u7ECF\u8D38\u5F00\u653E\u81F3\u5C11\u9700\u8981\u5173\u7CFB 5\u3001\u4FE1\u4EFB 25");
    }
    if (agenda === "security" && (avgRelation < -20 || avgTrust < 15)) {
      reasons.push("\u5B89\u5168\u4F1A\u8C08\u81F3\u5C11\u9700\u8981\u5173\u7CFB -20\u3001\u4FE1\u4EFB 15");
    }
    if (agenda === "normalization" && avgRelation >= 55) reasons.push("\u53CC\u65B9\u5173\u7CFB\u5DF2\u8F83\u7A33\u5B9A\uFF0C\u65E0\u9700\u542F\u52A8\u6B63\u5E38\u5316\u8DEF\u7EBF\u56FE");
    if (agenda === "normalization" && avgRelation < -55) reasons.push("\u654C\u610F\u8FC7\u6DF1\uFF0C\u5E94\u5148\u901A\u8FC7\u4F7F\u8282\u6539\u5584\u6700\u4F4E\u6C9F\u901A\u6761\u4EF6");
    if (agenda === "technology" && (avgRelation < 20 || avgTrust < 35)) {
      reasons.push("\u79D1\u7814\u4E92\u8BBF\u81F3\u5C11\u9700\u8981\u5173\u7CFB 20\u3001\u4FE1\u4EFB 35");
    }
    if (agenda === "technology" && (initiator.tech.admin + initiator.tech.culture < 2 || target.tech.admin + target.tech.culture < 2)) reasons.push("\u53CC\u65B9\u81F3\u5C11\u9700\u8981\u884C\u653F\u4E0E\u6587\u5316\u79D1\u6280\u5408\u8BA1\u8FBE\u5230 2");
    factors.push(
      factor("\u53CC\u8FB9\u5173\u7CFB", avgRelation * 0.25, `\u5F53\u524D\u5E73\u5747\u5173\u7CFB ${Math.round(avgRelation)}\u3002`),
      factor("\u76F8\u4E92\u4FE1\u4EFB", (avgTrust - 40) * 0.3, `\u5F53\u524D\u5E73\u5747\u4FE1\u4EFB ${Math.round(avgTrust)}\u3002`),
      factor("\u5A01\u80C1\u8BA4\u77E5", -avgThreat * 0.12, `\u5F53\u524D\u5E73\u5747\u5A01\u80C1 ${Math.round(avgThreat)}\u3002`)
    );
    if (treaty === "trade") factors.push(factor("\u8D38\u6613\u57FA\u7840", 8, "\u65E2\u6709\u8D38\u6613\u964D\u4F4E\u4E86\u6267\u884C\u6210\u672C\u3002"));
    if (treaty === "alliance") factors.push(factor("\u540C\u76DF\u57FA\u7840", 15, "\u540C\u76DF\u5173\u7CFB\u663E\u8457\u63D0\u9AD8\u4E86\u627F\u8BFA\u53EF\u4FE1\u5EA6\u3002"));
    if (treaty === "truce") factors.push(factor("\u505C\u6218\u9634\u5F71", -8, "\u8FD1\u671F\u51B2\u7A81\u4ECD\u538B\u4F4E\u653F\u6CBB\u4E92\u4FE1\u3002"));
    const initiatorCapital = state.provinces[initiator.capital];
    const targetCapital = state.provinces[target.capital];
    if (initiator.government.type === target.government.type) factors.push(factor("\u653F\u4F53\u76F8\u8FD1", 4, "\u76F8\u8FD1\u5236\u5EA6\u4FBF\u4E8E\u7406\u89E3\u5BF9\u65B9\u627F\u8BFA\u3002"));
    if (initiatorCapital && targetCapital && initiatorCapital.culture === targetCapital.culture) {
      factors.push(factor("\u6587\u5316\u7EBD\u5E26", 4, "\u5171\u540C\u6587\u5316\u964D\u4F4E\u6C9F\u901A\u6210\u672C\u3002"));
    }
    if (initiatorCapital && targetCapital && initiatorCapital.religion === targetCapital.religion) {
      factors.push(factor("\u5B97\u6559\u7EBD\u5E26", 3, "\u5171\u540C\u4FE1\u4EF0\u63D0\u9AD8\u793E\u4F1A\u63A5\u53D7\u5EA6\u3002"));
    }
    const powerRatio = nationPower(initiator, state) / Math.max(1, nationPower(target, state));
    if (stance === "firm") {
      factors.push(factor(
        "\u5B9E\u529B\u652F\u6491",
        powerRatio >= 1.25 ? 10 : powerRatio >= 0.9 ? -2 : -14,
        `\u53D1\u8D77\u56FD\u7EFC\u5408\u5B9E\u529B\u7EA6\u4E3A\u5BF9\u65B9\u7684 ${powerRatio.toFixed(2)} \u500D\u3002`
      ));
    }
    factors.push(factor("\u4EA4\u6D89\u59FF\u6001", SUMMIT_STANCES[stance].score, SUMMIT_STANCES[stance].description));
    factors.push(...agendaFactors(agenda, initiator, target, relations, state));
  }
  const willingness = clamp2(Math.round(38 + factors.reduce((sum, entry) => sum + entry.value, 0)), 0, 100);
  const likelihood = willingness >= 75 ? "likely" : willingness >= 58 ? "plausible" : willingness >= 40 ? "uncertain" : "very_low";
  return {
    eligible: reasons.length === 0,
    reasons,
    willingness,
    likelihood,
    costs,
    factors,
    cooldownRemaining
  };
}
function outcomeFromScore(score) {
  if (score < 25) return "rejected";
  if (score < 43) return "breakdown";
  if (score < 63) return "stalemate";
  if (score < 82) return "agreement";
  return "breakthrough";
}
function commitmentsFor(agenda, strength, duration) {
  const yearly = strength === 2 ? "\u5F3A\u5316" : "\u57FA\u7840";
  switch (agenda) {
    case "trade":
      return [`${duration} \u5E74\u5E02\u573A\u51C6\u5165\u6846\u67B6`, `${yearly}\u8D38\u6613\u6536\u76CA\u4E0E\u4F9D\u5B58\u589E\u957F`];
    case "security":
      return [`${duration} \u5E74\u53CC\u8FB9\u4E0D\u4FB5\u72AF\u627F\u8BFA`, `${yearly}\u8FB9\u5883\u964D\u6E29\u4E0E\u5A01\u80C1\u524A\u51CF`];
    case "normalization":
      return [`${duration} \u5E74\u5173\u7CFB\u6B63\u5E38\u5316\u8DEF\u7EBF\u56FE`, `${yearly}\u4E92\u4FE1\u6062\u590D\u673A\u5236`];
    case "technology":
      return [`${duration} \u5E74\u79D1\u7814\u4E0E\u5B66\u8005\u4E92\u8BBF`, `${yearly}\u5E74\u5EA6\u79D1\u7814\u79EF\u7D2F`];
  }
}
function summaryFor(initiator, target, agenda, outcome) {
  const subject = SUMMIT_AGENDAS[agenda].label;
  if (outcome === "rejected") return `${target.name} \u62D2\u7EDD\u5C31\u201C${subject}\u201D\u4E3E\u884C\u6B63\u5F0F\u4F1A\u8C08\u3002`;
  if (outcome === "breakdown") return `${initiator.name} \u4E0E ${target.name} \u7684\u201C${subject}\u201D\u4F1A\u8C08\u56E0\u5206\u6B67\u516C\u5F00\u7834\u88C2\u3002`;
  if (outcome === "stalemate") return `\u53CC\u65B9\u5C31\u201C${subject}\u201D\u4EA4\u6362\u7ACB\u573A\uFF0C\u4F46\u672A\u5F62\u6210\u53EF\u6267\u884C\u627F\u8BFA\u3002`;
  if (outcome === "agreement") return `\u53CC\u65B9\u5C31\u201C${subject}\u201D\u8FBE\u6210\u52A1\u5B9E\u534F\u8BAE\uFF0C\u540E\u7EED\u6548\u679C\u5C06\u9010\u5E74\u5151\u73B0\u3002`;
  return `\u53CC\u65B9\u5728\u201C${subject}\u201D\u4E0A\u53D6\u5F97\u7A81\u7834\uFF0C\u7B7E\u7F72\u4E86\u66F4\u5F3A\u3001\u66F4\u957F\u671F\u7684\u53CC\u8FB9\u534F\u8BAE\u3002`;
}
function calculateDiplomaticSummitResolution(state, initiatorId, targetId, agenda, stance) {
  const preview = previewDiplomaticSummit(state, initiatorId, targetId, agenda, stance);
  if (!preview.eligible) throw new Error(preview.reasons[0] ?? "\u4F1A\u8C08\u6761\u4EF6\u4E0D\u8DB3");
  const initiator = state.nations[initiatorId];
  const target = state.nations[targetId];
  const rng = mulberry32(
    state.seed ^ Math.imul(state.turn + 1, 2654435761) ^ stableHash(`${initiatorId}|${targetId}|${agenda}|${stance}`)
  );
  const score = clamp2(preview.willingness + Math.floor(rng() * 17) - 8, 0, 100);
  const outcome = outcomeFromScore(score);
  const accepted = outcome === "agreement" || outcome === "breakthrough";
  const strength = outcome === "breakthrough" ? 2 : 1;
  const duration = SUMMIT_AGENDAS[agenda].duration + (strength === 2 ? 2 : 0);
  const commitments = accepted ? commitmentsFor(agenda, strength, duration) : [];
  let relationDelta = 0;
  let trustDelta = 0;
  let threatDelta = 0;
  let tradeDepDelta = 0;
  if (outcome === "rejected") {
    relationDelta = stance === "firm" ? -4 : -1;
    trustDelta = stance === "firm" ? -4 : -2;
  } else if (outcome === "breakdown") {
    relationDelta = stance === "firm" ? -10 : -6;
    trustDelta = -8;
    threatDelta = 5;
  } else if (outcome === "stalemate") {
    relationDelta = 1;
  } else if (outcome === "agreement") {
    relationDelta = 6;
    trustDelta = 8;
    threatDelta = -4;
    tradeDepDelta = agenda === "trade" ? 20 : 0;
  } else {
    relationDelta = 12;
    trustDelta = 14;
    threatDelta = -8;
    tradeDepDelta = agenda === "trade" ? 35 : 0;
  }
  const actualCosts = outcome === "rejected" ? { adminPt: 1, influence: 10, gold: 0 } : preview.costs;
  return {
    record: {
      turn: state.turn,
      initiatorId,
      targetId,
      agenda,
      stance,
      outcome,
      score,
      summary: summaryFor(initiator, target, agenda, outcome),
      commitments
    },
    costs: actualCosts,
    relationDelta,
    trustDelta,
    threatDelta,
    tradeDepDelta,
    accord: accepted ? {
      partyA: initiatorId,
      partyB: targetId,
      agenda,
      startedTurn: state.turn,
      expiresTurn: state.turn + duration,
      strength
    } : void 0
  };
}
function applyDiplomaticSummitResolution(state, resolution) {
  const initiator = state.nations[resolution.record.initiatorId];
  if (!initiator) throw new Error("\u4F1A\u8C08\u53D1\u8D77\u56FD\u4E0D\u5B58\u5728");
  initiator.resources.adminPt -= resolution.costs.adminPt;
  initiator.resources.influence -= resolution.costs.influence;
  initiator.resources.gold -= resolution.costs.gold;
  const pair = relationPair(state, resolution.record.initiatorId, resolution.record.targetId);
  if (pair) {
    for (const relation of pair) {
      relation.relation = clamp2(relation.relation + resolution.relationDelta, -100, 100);
      relation.trust = clamp2(relation.trust + resolution.trustDelta, 0, 100);
      relation.threat = clamp2(relation.threat + resolution.threatDelta, 0, 100);
      relation.tradeDep = clamp2(relation.tradeDep + resolution.tradeDepDelta, 0, 100);
      if (resolution.accord?.agenda === "trade" && relation.treaty === "none") relation.treaty = "trade";
    }
  }
  const record = {
    id: allocateEntityId(state, "summit"),
    ...resolution.record
  };
  state.diplomaticSummits.push(record);
  if (resolution.accord) {
    state.diplomaticAccords.push({
      id: allocateEntityId(state, "accord"),
      ...resolution.accord
    });
    addChronicle(state, {
      id: `summit_${record.id}`,
      turn: state.turn,
      kind: "milestone_diplomacy",
      title: SUMMIT_AGENDAS[record.agenda].agreementName,
      desc: record.summary,
      actorId: record.initiatorId
    });
  }
  state._relMap = void 0;
  return record;
}
function addPairValue(state, accord, field, amount) {
  const pair = relationPair(state, accord.partyA, accord.partyB);
  if (!pair) return;
  for (const relation of pair) {
    const min = field === "relation" ? -100 : 0;
    relation[field] = clamp2(relation[field] + amount, min, 100);
  }
}
function settleDiplomaticAccords(state) {
  const active = [];
  for (const accord of state.diplomaticAccords) {
    const left = state.nations[accord.partyA];
    const right = state.nations[accord.partyB];
    if (!left || !right || left.defeated || right.defeated) continue;
    if (state.turn > accord.expiresTurn) {
      addChronicle(state, {
        id: `accord_end_${accord.id}`,
        turn: state.turn,
        kind: "milestone_diplomacy",
        title: `${SUMMIT_AGENDAS[accord.agenda].agreementName}\u671F\u6EE1`,
        desc: `${left.name} \u4E0E ${right.name} \u7684\u534F\u8BAE\u6309\u671F\u7ED3\u675F\uFF0C\u540E\u7EED\u5173\u7CFB\u5C06\u91CD\u65B0\u53D6\u51B3\u4E8E\u73B0\u5B9E\u5229\u76CA\u3002`,
        actorId: accord.partyA
      });
      continue;
    }
    const atWar2 = state.wars.some(
      (war) => pairMatches(war.attackerId, war.defenderId, accord.partyA, accord.partyB)
    );
    if (atWar2) {
      addPairValue(state, accord, "relation", -20);
      addPairValue(state, accord, "trust", -25);
      addChronicle(state, {
        id: `accord_breach_${accord.id}`,
        turn: state.turn,
        kind: "milestone_diplomacy",
        title: `${SUMMIT_AGENDAS[accord.agenda].agreementName}\u7834\u88C2`,
        desc: `${left.name} \u4E0E ${right.name} \u7206\u53D1\u6218\u4E89\uFF0C\u65E2\u6709\u627F\u8BFA\u5931\u6548\u5E76\u9020\u6210\u4E25\u91CD\u4FE1\u4EFB\u635F\u5931\u3002`,
        actorId: accord.partyA
      });
      continue;
    }
    if (state.turn <= accord.startedTurn) {
      active.push(accord);
      continue;
    }
    const strength = accord.strength;
    if (accord.agenda === "trade") {
      left.resources.gold += 8 * strength;
      right.resources.gold += 8 * strength;
      addPairValue(state, accord, "tradeDep", 3 * strength);
      addPairValue(state, accord, "relation", strength);
      addPairValue(state, accord, "trust", strength);
    } else if (accord.agenda === "security") {
      addPairValue(state, accord, "threat", -4 * strength);
      addPairValue(state, accord, "relation", strength);
      addPairValue(state, accord, "trust", strength);
    } else if (accord.agenda === "normalization") {
      addPairValue(state, accord, "relation", 2 * strength);
      addPairValue(state, accord, "trust", strength);
      addPairValue(state, accord, "threat", -2 * strength);
    } else {
      left.resources.sciPt += 4 * strength;
      right.resources.sciPt += 4 * strength;
      addPairValue(state, accord, "relation", strength);
      addPairValue(state, accord, "trust", strength);
    }
    active.push(accord);
  }
  state.diplomaticAccords = active;
  state._relMap = void 0;
}

// src/engine/military.ts
function charMods4(nation) {
  const merged = {};
  for (const cid of nation.activeCharacterBonuses) {
    const def = NATIONAL_CHARACTERS[cid];
    if (!def) continue;
    for (const [k, v] of Object.entries(def.bonuses)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(def.penalties)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
  }
  return merged;
}
function declareWar(state, attackerId, defenderId, targetProvinceId) {
  const rel = getRelationObj(attackerId, defenderId, state);
  if (hasActiveNonAggressionAccord(state, attackerId, defenderId)) return null;
  if (rel?.treaty === "alliance") return null;
  if (rel && rel.treaty === "truce" && rel.truceTurns > 0) return null;
  if (state.wars.some((w) => [w.attackerId, w.defenderId].includes(attackerId) && [w.attackerId, w.defenderId].includes(defenderId))) return null;
  const war = {
    id: allocateEntityId(state, "war"),
    attackerId,
    defenderId,
    targetProvinceId,
    progress: 0,
    turns: 0,
    battleReports: []
  };
  state.wars.push(war);
  if (rel) {
    rel.treaty = "war";
    rel.relation = -100;
  }
  const rel2 = getRelationObj(defenderId, attackerId, state);
  if (rel2) {
    rel2.treaty = "war";
    rel2.relation = -100;
  }
  const attacker = state.nations[attackerId];
  if (attacker) attacker.atWar = true;
  const defender = state.nations[defenderId];
  if (defender) defender.atWar = true;
  return war;
}
function moveArmy(state, nation, armyId, toProvinceId, fromProvince, toProvince) {
  const army = nation.army.find((a) => a.id === armyId);
  if (!army) return { ok: false, reason: "\u519B\u961F\u4E0D\u5B58\u5728" };
  if (army.size <= 0) return { ok: false, reason: "\u519B\u961F\u65E0\u5175" };
  if (toProvince.ownerId !== nation.id) return { ok: false, reason: "\u76EE\u6807\u7701\u4EFD\u975E\u5DF1\u65B9" };
  if (army.location === toProvinceId) return { ok: false, reason: "\u5DF2\u5728\u76EE\u6807\u7701\u4EFD" };
  const isAdjacent = fromProvince.adjacent.includes(toProvinceId);
  const isCapitalHub = toProvinceId === nation.capital || army.location === nation.capital;
  if (!isAdjacent && !isCapitalHub) return { ok: false, reason: "\u4E0D\u76F8\u90BB\u4E14\u975E\u9996\u90FD\u67A2\u7EBD" };
  const baseCost = isCapitalHub ? 3 : 5;
  const goldCost = Math.round(baseCost + army.size * (isCapitalHub ? 0.15 : 0.3));
  if (nation.resources.gold < goldCost) return { ok: false, reason: `\u91D1\u4E0D\u8DB3\uFF08\u9700 ${goldCost}\uFF09` };
  nation.resources.gold -= goldCost;
  let dest = nation.army.find((a) => a.location === toProvinceId);
  if (!dest) {
    dest = { id: allocateEntityId(state, "army"), ownerId: nation.id, location: toProvinceId, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
    nation.army.push(dest);
  }
  const total = army.size + dest.size;
  dest.morale = Math.round((army.morale * army.size + dest.morale * dest.size) / Math.max(1, total));
  dest.training = Math.round((army.training * army.size + dest.training * dest.size) / Math.max(1, total));
  dest.equipment = Math.round((army.equipment * army.size + dest.equipment * dest.size) / Math.max(1, total));
  dest.size += army.size;
  nation.army = nation.army.filter((a) => a.id !== armyId);
  return { ok: true };
}
function makePeace(state, war) {
  const i = state.wars.findIndex((w) => w.id === war.id);
  if (i < 0) return;
  state.wars.splice(i, 1);
  const attacker = state.nations[war.attackerId];
  const defender = state.nations[war.defenderId];
  const attackerWon = war.progress >= 60;
  const defenderWon = war.progress <= 40;
  if (attacker && defender) {
    if (attackerWon) {
      const targetProv = state.provinces[war.targetProvinceId];
      if (targetProv) {
        targetProv.ownerId = attacker.id;
        targetProv.loyalty = 30;
        targetProv.assimilation = 20;
        targetProv.unrest = 40;
        targetProv.garrison = 0;
        addChronicle(state, {
          id: `peace_win_${war.id}_${state.turn}`,
          turn: state.turn,
          kind: "milestone_war",
          title: `${attacker.name} \u653B\u5360 ${targetProv.name}`,
          desc: `${defender.name} \u5272\u8BA9 ${targetProv.name}\u3002`,
          actorId: attacker.id
        });
        const defenderArmies = defender.army.filter((a) => a.location === war.targetProvinceId);
        for (const army of defenderArmies) {
          const ownProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
          const adjOwn = ownProvs.find((p) => targetProv.adjacent.includes(p.id));
          const fallback = adjOwn ?? ownProvs.find((p) => p.id === defender.capital) ?? ownProvs[0];
          if (fallback) {
            army.location = fallback.id;
          } else {
            defender.army = defender.army.filter((a) => a.id !== army.id);
            addChronicle(state, {
              id: `orphan_disband_${army.id}_${state.turn}`,
              turn: state.turn,
              kind: "milestone_war",
              title: `\u6B8B\u519B\u6E83\u6563`,
              desc: `${defender.name} \u5728 ${targetProv.name} \u7684\u9A7B\u519B\u56E0\u65E0\u672C\u571F\u53EF\u64A4\uFF0C\u6E83\u6563\u6D88\u5931\u3002`,
              actorId: defender.id
            });
          }
        }
      }
      const tribute = Math.min(Math.max(0, defender.resources.gold), 100 + war.progress);
      defender.resources.gold -= tribute;
      attacker.resources.gold += tribute;
    } else if (defenderWon) {
      const indemnity = Math.min(Math.max(0, attacker.resources.gold), 80);
      attacker.resources.gold -= indemnity;
      defender.resources.gold += indemnity;
      attacker.warExhaustion = clamp2(attacker.warExhaustion + 10, 0, 100);
      addChronicle(state, {
        id: `peace_lose_${war.id}_${state.turn}`,
        turn: state.turn,
        kind: "milestone_war",
        title: `${attacker.name} \u6218\u8D25`,
        desc: `${attacker.name} \u8FDB\u653B ${defender.name} \u5931\u8D25\uFF0C\u8D54\u6B3E ${indemnity} \u91D1\u3002`,
        actorId: attacker.id
      });
    }
  }
  const r1 = getRelationObj(war.attackerId, war.defenderId, state);
  if (r1) {
    r1.treaty = "truce";
    r1.truceTurns = 10;
    r1.relation = -45;
    r1.trust = Math.min(clamp2(r1.trust - 20, 0, 100), 25);
  }
  const r2 = getRelationObj(war.defenderId, war.attackerId, state);
  if (r2) {
    r2.treaty = "truce";
    r2.truceTurns = 10;
    r2.relation = -45;
    r2.trust = Math.min(clamp2(r2.trust - 20, 0, 100), 25);
  }
  const atWarNations = /* @__PURE__ */ new Set();
  for (const w of state.wars) {
    atWarNations.add(w.attackerId);
    atWarNations.add(w.defenderId);
  }
  for (const n3 of Object.values(state.nations)) {
    if (!atWarNations.has(n3.id)) n3.atWar = false;
  }
}
function settleWarsPure(state) {
  const res = {
    warUpdates: {},
    peaceWarIds: [],
    armyFinals: {},
    provFinals: {},
    nationDeltas: {},
    relationFinals: {},
    newChronicle: [],
    atWarClear: []
  };
  const applyPeaceEffects = (war, peaceProgress) => {
    res.peaceWarIds.push(war.id);
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    const attackerWon = peaceProgress >= 60;
    const defenderWon = peaceProgress <= 40;
    if (attacker && defender) {
      const ndA = res.nationDeltas[attacker.id] ??= { goldDelta: 0, foodDelta: 0 };
      const ndD = res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 };
      if (attackerWon) {
        const targetProv = state.provinces[war.targetProvinceId];
        if (targetProv) {
          res.provFinals[targetProv.id] = {
            ownerId: attacker.id,
            loyalty: 30,
            assimilation: 20,
            unrest: 40,
            garrison: 0
          };
          res.newChronicle.push({
            id: `peace_win_${war.id}_${state.turn}`,
            turn: state.turn,
            kind: "milestone_war",
            title: `${attacker.name} \u653B\u5360 ${targetProv.name}`,
            desc: `${defender.name} \u5272\u8BA9 ${targetProv.name}\u3002`,
            actorId: attacker.id
          });
          const defenderArmies = defender.army.filter((a) => a.location === war.targetProvinceId);
          for (const army of defenderArmies) {
            const ownProvs = Object.values(state.provinces).filter((p) => p.ownerId === defender.id);
            const adjOwn = ownProvs.find((p) => targetProv.adjacent.includes(p.id));
            const fallback = adjOwn ?? ownProvs.find((p) => p.id === defender.capital) ?? ownProvs[0];
            if (fallback) {
              (ndD.armyLocationOverrides ??= {})[army.id] = fallback.id;
            } else {
              (ndD.armyRemovals ??= []).push(army.id);
              res.newChronicle.push({
                id: `orphan_disband_${army.id}_${state.turn}`,
                turn: state.turn,
                kind: "milestone_war",
                title: `\u6B8B\u519B\u6E83\u6563`,
                desc: `${defender.name} \u5728 ${targetProv.name} \u7684\u9A7B\u519B\u56E0\u65E0\u672C\u571F\u53EF\u64A4\uFF0C\u6E83\u6563\u6D88\u5931\u3002`,
                actorId: defender.id
              });
            }
          }
        }
        const tribute = Math.min(Math.max(0, defender.resources.gold + ndD.goldDelta), 100 + peaceProgress);
        ndD.goldDelta -= tribute;
        ndA.goldDelta += tribute;
      } else if (defenderWon) {
        const indemnity = Math.min(Math.max(0, attacker.resources.gold + ndA.goldDelta), 80);
        ndA.goldDelta -= indemnity;
        ndD.goldDelta += indemnity;
        ndA.warExhaustionFinal = clamp2((ndA.warExhaustionFinal ?? attacker.warExhaustion) + 10, 0, 100);
        res.newChronicle.push({
          id: `peace_lose_${war.id}_${state.turn}`,
          turn: state.turn,
          kind: "milestone_war",
          title: `${attacker.name} \u6218\u8D25`,
          desc: `${attacker.name} \u8FDB\u653B ${defender.name} \u5931\u8D25\uFF0C\u8D54\u6B3E ${indemnity} \u91D1\u3002`,
          actorId: attacker.id
        });
      }
    }
    const r1 = getRelationObj(war.attackerId, war.defenderId, state);
    if (r1) res.relationFinals[`${war.attackerId}->${war.defenderId}`] = { treaty: "truce", truceTurns: 10, relation: -45, trust: Math.min(clamp2(r1.trust - 20, 0, 100), 25) };
    const r2 = getRelationObj(war.defenderId, war.attackerId, state);
    if (r2) res.relationFinals[`${war.defenderId}->${war.attackerId}`] = { treaty: "truce", truceTurns: 10, relation: -45, trust: Math.min(clamp2(r2.trust - 20, 0, 100), 25) };
  };
  for (const war of state.wars) {
    const newTurns = war.turns + 1;
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    if (!attacker || !defender) {
      applyPeaceEffects(war, war.progress);
      continue;
    }
    const targetProv = state.provinces[war.targetProvinceId];
    const attackerArmy = attacker.army.find(
      (a) => a.size > 0 && (a.location === war.targetProvinceId || targetProv?.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === attacker.id)
    );
    const defenderArmy = defender.army.find((a) => a.location === war.targetProvinceId && a.size > 0);
    if (!attackerArmy) {
      applyPeaceEffects(war, war.progress);
      continue;
    }
    const prov = state.provinces[war.targetProvinceId];
    const terrain = prov?.terrain ?? "plain";
    const terrainMod = TERRAIN_COMBAT_MOD[terrain];
    const attPower = computeCombat({
      army: attackerArmy,
      milLv: attacker.tech.mil,
      general: attacker.ruler.ability,
      terrainMod
    }) * (charMods4(attacker).combatMod ?? 1) * (attacker.policyMods?.combatMod ?? 1);
    const defPower = defenderArmy ? computeCombat({
      army: defenderArmy,
      milLv: defender.tech.mil,
      general: defender.ruler.ability,
      terrainMod: terrainMod * 1.1
    }) * (charMods4(defender).combatMod ?? 1) * (defender.policyMods?.combatMod ?? 1) : (prov?.garrison ?? 0) * 0.5;
    const result = resolveBattle(attPower, defPower, attackerArmy.size, defenderArmy?.size ?? prov?.garrison ?? 0);
    const newProgress = clamp2(war.progress + result.progressDelta, 0, 100);
    const reports = war.battleReports ? [...war.battleReports] : [];
    const outcome = result.progressDelta > 5 ? "advance" : result.progressDelta < -5 ? "repelled" : "stalemate";
    const provName = prov?.name ?? war.targetProvinceId;
    const narrative = outcome === "advance" ? `\u7B2C${newTurns}\u5E74\uFF0C\u6211\u519B\u4E8E${provName}${terrain === "mountain" ? "\u5C71\u5730" : terrain === "forest" ? "\u6797\u5730" : "\u5E73\u539F"}\u63A8\u8FDB\uFF0C\u65A9\u654C${Math.round(result.defenderLoss)}\uFF0C\u58EB\u6C14\u5927\u632F\u3002` : outcome === "repelled" ? `\u7B2C${newTurns}\u5E74\uFF0C${provName}\u653B\u52BF\u53D7\u632B\uFF0C\u6298\u635F${Math.round(result.attackerLoss)}\u4EBA\uFF0C\u654C\u9635\u7A33\u56FA\u3002` : `\u7B2C${newTurns}\u5E74\uFF0C${provName}\u6218\u4E8B\u80F6\u7740\uFF0C\u53CC\u65B9\u5404\u6298${Math.round(result.attackerLoss)}\u3001${Math.round(result.defenderLoss)}\u4EBA\u3002`;
    reports.push({
      turn: state.turn,
      attSize: attackerArmy.size,
      defSize: defenderArmy?.size ?? prov?.garrison ?? 0,
      attLoss: Math.round(result.attackerLoss),
      defLoss: Math.round(result.defenderLoss),
      progressDelta: Math.round(result.progressDelta),
      outcome,
      narrative
    });
    const trimmedReports = reports.length > 20 ? reports.slice(-20) : reports;
    res.warUpdates[war.id] = { turns: newTurns, progress: newProgress, battleReports: trimmedReports };
    let attSizeAfterBattle = Math.max(0, Math.round(attackerArmy.size - result.attackerLoss));
    let attMoraleAfter = clamp2(attackerArmy.morale + result.attackerMoraleDelta, 0, 100);
    if (defenderArmy) {
      res.armyFinals[`${defender.id}:${defenderArmy.id}`] = {
        size: Math.max(0, Math.round(defenderArmy.size - result.defenderLoss)),
        morale: clamp2(defenderArmy.morale + result.defenderMoraleDelta, 0, 100)
      };
    } else if (prov) {
      res.provFinals[prov.id] = { ...res.provFinals[prov.id], garrison: Math.max(0, prov.garrison - Math.round(result.defenderLoss)) };
    }
    const cost = warCostPerTurn(attSizeAfterBattle);
    const ndA = res.nationDeltas[attacker.id] ??= { goldDelta: 0, foodDelta: 0 };
    ndA.goldDelta -= cost.gold;
    ndA.foodDelta -= cost.food;
    ndA.warExhaustionFinal = clamp2(attacker.warExhaustion + cost.exhaustionDelta, 0, 100);
    ndA.stabilityFinal = clamp2(attacker.government.stability + cost.stabilityDelta, 0, 100);
    attSizeAfterBattle = Math.max(0, Math.round(attSizeAfterBattle - cost.attrition));
    res.armyFinals[`${attacker.id}:${attackerArmy.id}`] = { size: attSizeAfterBattle, morale: attMoraleAfter };
    const defenderSizeAfterBattle = defenderArmy ? res.armyFinals[`${defender.id}:${defenderArmy.id}`]?.size ?? defenderArmy.size : res.provFinals[prov?.id ?? ""]?.garrison ?? prov?.garrison ?? 0;
    const dCost = warCostPerTurn(defenderSizeAfterBattle);
    const ndD = res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 };
    ndD.goldDelta -= dCost.gold;
    ndD.foodDelta -= dCost.food;
    ndD.warExhaustionFinal = clamp2(defender.warExhaustion + dCost.exhaustionDelta, 0, 100);
    const defenderArmyFinalSize = defenderArmy ? res.armyFinals[`${defender.id}:${defenderArmy.id}`]?.size ?? defenderArmy.size : void 0;
    const provGarrisonFinal = res.provFinals[prov?.id ?? ""]?.garrison ?? prov?.garrison ?? 0;
    const defenderArmyGone = !defenderArmy || (defenderArmyFinalSize ?? 0) <= 0;
    const garrisonGone = !prov || provGarrisonFinal <= 0;
    if (newProgress >= 100 || defenderArmyGone && garrisonGone && attSizeAfterBattle > 0) {
      if (prov) {
        const oldOwner = prov.ownerId;
        const curProvFinal = res.provFinals[prov.id] ?? {};
        res.provFinals[prov.id] = {
          ...curProvFinal,
          ownerId: war.attackerId,
          garrison: attSizeAfterBattle,
          assimilation: Math.max(0, (curProvFinal.assimilation ?? prov.assimilation) - 30),
          loyalty: 30,
          unrest: clamp2((curProvFinal.unrest ?? prov.unrest) + 20, 0, 100)
        };
        if (oldOwner === war.defenderId) {
          const remainingProvs = Object.values(state.provinces).filter((p) => {
            const finalOwner = res.provFinals[p.id]?.ownerId ?? p.ownerId;
            return finalOwner === war.defenderId;
          });
          if (remainingProvs.length === 0) {
            (res.nationDeltas[defender.id] ??= { goldDelta: 0, foodDelta: 0 }).defeated = true;
          }
        }
      }
      applyPeaceEffects(war, newProgress);
    } else if (newProgress <= 0) {
      applyPeaceEffects(war, newProgress);
    }
  }
  const atWarNations = /* @__PURE__ */ new Set();
  for (const w of state.wars) {
    if (res.peaceWarIds.includes(w.id)) continue;
    atWarNations.add(w.attackerId);
    atWarNations.add(w.defenderId);
  }
  for (const n3 of Object.values(state.nations)) {
    if (!atWarNations.has(n3.id)) res.atWarClear.push(n3.id);
  }
  return res;
}
function applySettleWarsResult(state, result) {
  for (const war of state.wars) {
    const update = result.warUpdates[war.id];
    if (update) {
      war.turns = update.turns;
      war.progress = update.progress;
      war.battleReports = update.battleReports;
    }
  }
  const peaceIds = new Set(result.peaceWarIds);
  state.wars = state.wars.filter((war) => !peaceIds.has(war.id));
  for (const [key, final] of Object.entries(result.armyFinals)) {
    const separator = key.indexOf(":");
    if (separator < 0) continue;
    const nation = state.nations[key.slice(0, separator)];
    const army = nation?.army.find((entry) => entry.id === key.slice(separator + 1));
    if (army) Object.assign(army, final);
  }
  for (const [provinceId, final] of Object.entries(result.provFinals)) {
    const province = state.provinces[provinceId];
    if (province) Object.assign(province, final);
  }
  for (const [nationId, delta] of Object.entries(result.nationDeltas)) {
    const nation = state.nations[nationId];
    if (!nation) continue;
    nation.resources.gold += delta.goldDelta;
    nation.resources.food += delta.foodDelta;
    if (delta.warExhaustionFinal !== void 0) nation.warExhaustion = delta.warExhaustionFinal;
    if (delta.stabilityFinal !== void 0) nation.government.stability = delta.stabilityFinal;
    if (delta.defeated !== void 0) nation.defeated = delta.defeated;
    if (delta.armyLocationOverrides) {
      for (const [armyId, location] of Object.entries(delta.armyLocationOverrides)) {
        const army = nation.army.find((entry) => entry.id === armyId);
        if (army) army.location = location;
      }
    }
    if (delta.armyRemovals?.length) {
      const removals = new Set(delta.armyRemovals);
      nation.army = nation.army.filter((army) => !removals.has(army.id));
    }
  }
  for (const [key, final] of Object.entries(result.relationFinals)) {
    const separator = key.indexOf("->");
    if (separator < 0) continue;
    const relation = getRelationObj(key.slice(0, separator), key.slice(separator + 2), state);
    if (relation) Object.assign(relation, final);
  }
  state.chronicle.push(...result.newChronicle.map((entry) => ({ ...entry })));
  for (const nationId of result.atWarClear) {
    const nation = state.nations[nationId];
    if (nation) nation.atWar = false;
  }
}
function recruit(state, nation, province, count) {
  if (!Number.isSafeInteger(count) || count <= 0) return { ok: false, reason: "\u5F81\u5175\u6570\u91CF\u5FC5\u987B\u662F\u6B63\u6574\u6570" };
  const goldCost = count * 1.5;
  const supplyCost = count * 0.2;
  if (nation.resources.gold < goldCost) return { ok: false, reason: "\u91D1\u4E0D\u8DB3" };
  if (nation.resources.supply < supplyCost) return { ok: false, reason: "\u8865\u7ED9\u4E0D\u8DB3" };
  if (province.ownerId !== nation.id) return { ok: false, reason: "\u975E\u5DF1\u7701" };
  const milBonus = nation.activeCharacterBonuses.includes("militarism") ? 1.2 : 1;
  const actualCount = Math.round(count * milBonus * (nation.policyMods?.mobilizationMod ?? 1));
  if (province.population < actualCount) return { ok: false, reason: `\u4EBA\u53E3\u4E0D\u8DB3\uFF08\u5B9E\u9645\u9700 ${actualCount}\uFF09` };
  province.population -= actualCount;
  nation.resources.gold -= goldCost;
  nation.resources.supply -= supplyCost;
  let army = nation.army.find((a) => a.location === province.id);
  if (!army) {
    army = {
      id: allocateEntityId(state, "army"),
      ownerId: nation.id,
      location: province.id,
      size: 0,
      morale: 60,
      training: 50,
      equipment: 50,
      supply: 80
    };
    nation.army.push(army);
  }
  army.size += actualCount;
  return { ok: true };
}

// src/engine/diplomacy.ts
function settleDiplomacyPure(state) {
  const provsByOwner = /* @__PURE__ */ new Map();
  const getProvs = (id) => {
    let arr = provsByOwner.get(id);
    if (!arr) {
      arr = provincesOf(id, state.provinces);
      provsByOwner.set(id, arr);
    }
    return arr;
  };
  const warOpponents = /* @__PURE__ */ new Map();
  for (const w of state.wars) {
    let s1 = warOpponents.get(w.attackerId);
    if (!s1) {
      s1 = /* @__PURE__ */ new Set();
      warOpponents.set(w.attackerId, s1);
    }
    s1.add(w.defenderId);
    let s2 = warOpponents.get(w.defenderId);
    if (!s2) {
      s2 = /* @__PURE__ */ new Set();
      warOpponents.set(w.defenderId, s2);
    }
    s2.add(w.attackerId);
  }
  const relationsFinal = {};
  const nationsGovFinal = {};
  const newChronicle = [];
  const relKey = (r) => `${r.from}_${r.to}`;
  const relByFromTo = {};
  for (const r of state.relations) relByFromTo[relKey(r)] = r;
  for (const r of state.relations) {
    let finalTruceTurns = r.truceTurns;
    let finalTreaty = r.treaty;
    if (r.treaty === "truce" && r.truceTurns > 0) {
      finalTruceTurns = r.truceTurns - 1;
      if (finalTruceTurns === 0) finalTreaty = "none";
    }
    const fromProvs = getProvs(r.from);
    const toProvs = getProvs(r.to);
    const borderClash = fromProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === r.to));
    const fromOps = warOpponents.get(r.from);
    const toOps = warOpponents.get(r.to);
    const atWarWithEachOther = !!fromOps?.has(r.to);
    const commonEnemy = atWarWithEachOther ? false : !!(fromOps && toOps && [...fromOps].some((o) => toOps.has(o)));
    const fromNation = state.nations[r.from];
    const toNation = state.nations[r.to];
    let finalThreat = r.threat;
    if (fromNation && toNation) {
      const fromMil = fromNation.army.reduce((s, a) => s + a.size, 0);
      const toMil = toNation.army.reduce((s, a) => s + a.size, 0);
      const toProvCount = toProvs.length;
      finalThreat = computeThreat(fromMil, toMil, toProvCount, r.relation);
    }
    let finalRelation = r.relation;
    if (finalTreaty !== "war") {
      const d = relationDrift(finalTreaty, borderClash, finalThreat, commonEnemy);
      finalRelation = clamp2(r.relation + d, -100, 100);
    }
    relationsFinal[relKey(r)] = { threat: finalThreat, relation: finalRelation, truceTurns: finalTruceTurns, treaty: finalTreaty };
  }
  const threatThreshold = 70;
  const coalitionMin = 3;
  for (const nation of Object.values(state.nations)) {
    if (nation.defeated) continue;
    const nationProvs = getProvs(nation.id);
    if (nationProvs.length === 0) continue;
    const neighborIds = /* @__PURE__ */ new Set();
    for (const p of nationProvs) {
      for (const adj of p.adjacent) {
        const adjProv = state.provinces[adj];
        if (adjProv && adjProv.ownerId !== nation.id) neighborIds.add(adjProv.ownerId);
      }
    }
    let resisters = 0;
    const resisterIds = [];
    for (const nid of neighborIds) {
      if (nid === "rebel" || nid.startsWith("rebel_")) continue;
      const rf = relationsFinal[`${nid}_${nation.id}`];
      if (rf && rf.threat >= threatThreshold) {
        resisters++;
        resisterIds.push(nid);
      }
    }
    if (resisters >= coalitionMin) {
      nationsGovFinal[nation.id] = {
        stability: clamp2(nation.government.stability - 5, 0, 100),
        legitimacy: clamp2(nation.government.legitimacy - 3, 0, 100)
      };
      for (const nid of resisterIds) {
        const rf = relationsFinal[`${nid}_${nation.id}`];
        if (rf) {
          rf.relation = clamp2(rf.relation - 10, -100, 100);
          rf.threat = clamp2(rf.threat + 5, 0, 100);
        }
      }
      newChronicle.push({
        id: `coalition_${nation.id}_${state.turn}`,
        turn: state.turn,
        kind: "milestone_diplomacy",
        title: `${nation.name} \u906D\u8054\u519B\u53CD\u5236`,
        desc: `${resisters} \u4E2A\u90BB\u56FD\u56E0\u5A01\u80C1\u8FC7\u5927\u8054\u5408\u62B5\u5236\uFF0C\u7A33\u5B9A -5\u3001\u5408\u6CD5\u6027 -3\u3002`,
        actorId: nation.id
      });
    }
  }
  return { relationsFinal, nationsGovFinal, newChronicle };
}

// src/data/technologies.ts
var TECHNOLOGIES = [
  // ── 农业科技 ──
  {
    id: "agri_lv1",
    branch: "agri",
    level: 1,
    name: "\u4F11\u8015\u8F6E\u4F5C",
    description: "\u57FA\u7840\u8015\u4F5C\u6539\u8FDB\uFF0C\u63D0\u5347\u7CAE\u98DF\u4EA7\u91CF\u3002",
    costSci: 100,
    costGold: 50,
    effects: { agriYieldMod: 1.08, popGrowthMod: 1.05 }
  },
  {
    id: "agri_lv2",
    branch: "agri",
    level: 2,
    name: "\u94C1\u5236\u519C\u5177",
    description: "\u63A8\u5E7F\u94C1\u7281\u94C1\u9504\uFF0C\u7CAE\u4EA7\u518D\u63D0\u5347\u3002",
    costSci: 400,
    costGold: 100,
    prereqTech: "agri_lv1",
    effects: { agriYieldMod: 1.16, popGrowthMod: 1.1 }
  },
  {
    id: "agri_lv3",
    branch: "agri",
    level: 3,
    name: "\u6C34\u5229\u5DE5\u7A0B",
    description: "\u704C\u6E89\u7CFB\u7EDF\uFF0C\u65F1\u6D9D\u4FDD\u6536\u3002",
    costSci: 900,
    costGold: 200,
    prereqTech: "agri_lv2",
    effects: { agriYieldMod: 1.24, popGrowthMod: 1.15 }
  },
  {
    id: "agri_lv4",
    branch: "agri",
    level: 4,
    name: "\u9009\u79CD\u80B2\u79CD",
    description: "\u826F\u79CD\u7E41\u80B2\uFF0C\u7CAE\u98DF\u5927\u5E45\u63D0\u5347\u3002",
    costSci: 1600,
    costGold: 400,
    prereqTech: "agri_lv3",
    effects: { agriYieldMod: 1.32, popGrowthMod: 1.2 }
  },
  {
    id: "agri_lv5",
    branch: "agri",
    level: 5,
    name: "\u519C\u4E1A\u9769\u547D",
    description: "\u7CFB\u7EDF\u5316\u519C\u4E1A\u79D1\u5B66\uFF0C\u7CAE\u4EA7\u767B\u9876\u3002",
    costSci: 2500,
    costGold: 800,
    prereqTech: "agri_lv4",
    effects: { agriYieldMod: 1.4, popGrowthMod: 1.25 }
  },
  // ── 军事科技 ──
  {
    id: "mil_lv1",
    branch: "mil",
    level: 1,
    name: "\u5E38\u5907\u519B\u5236",
    description: "\u5EFA\u7ACB\u804C\u4E1A\u519B\u961F\uFF0C\u63D0\u5347\u8BAD\u7EC3\u5EA6\u3002",
    costSci: 100,
    costGold: 100,
    effects: { combatMod: 1.08 }
  },
  {
    id: "mil_lv2",
    branch: "mil",
    level: 2,
    name: "\u94C1\u5236\u6B66\u5668",
    description: "\u88C5\u5907\u94C1\u5175\u5668\uFF0C\u6218\u6597\u529B\u63D0\u5347\u3002",
    costSci: 400,
    costGold: 200,
    prereqTech: "mil_lv1",
    effects: { combatMod: 1.16, equipMod: 1.05 }
  },
  {
    id: "mil_lv3",
    branch: "mil",
    level: 3,
    name: "\u540E\u52E4\u4F53\u7CFB",
    description: "\u8865\u7ED9\u7CFB\u7EDF\uFF0C\u8FDC\u5F81\u80FD\u529B\u63D0\u5347\u3002",
    costSci: 900,
    costGold: 400,
    prereqTech: "mil_lv2",
    effects: { combatMod: 1.24, supplyMod: 1.05 }
  },
  {
    id: "mil_lv4",
    branch: "mil",
    level: 4,
    name: "\u7CBE\u9510\u90E8\u961F",
    description: "\u89E3\u9501\u7CBE\u9510\u5175\u8425\uFF0C\u88C5\u5907\u9876\u7EA7\u3002",
    costSci: 1600,
    costGold: 800,
    prereqTech: "mil_lv3",
    effects: { combatMod: 1.32, equipMod: 1.1, supplyMod: 1.1 }
  },
  {
    id: "mil_lv5",
    branch: "mil",
    level: 5,
    name: "\u519B\u4E8B\u5B66\u8BF4",
    description: "\u7CFB\u7EDF\u5316\u519B\u4E8B\u7406\u8BBA\uFF0C\u6218\u529B\u767B\u9876\u3002",
    costSci: 2500,
    costGold: 1600,
    prereqTech: "mil_lv4",
    effects: { combatMod: 1.4, equipMod: 1.15, supplyMod: 1.15 }
  },
  // ── 行政科技 ──
  {
    id: "admin_lv1",
    branch: "admin",
    level: 1,
    name: "\u5B98\u50DA\u4F53\u7CFB",
    description: "\u5EFA\u7ACB\u6587\u5B98\u5236\u5EA6\uFF0C\u7A0E\u6536\u6548\u7387\u63D0\u5347\u3002",
    costSci: 100,
    costGold: 80,
    effects: { taxEffMod: 1.06, efficiencyMod: 5, maxProvinceBonus: 1 }
  },
  {
    id: "admin_lv2",
    branch: "admin",
    level: 2,
    name: "\u5F8B\u6CD5\u7F16\u7E82",
    description: "\u7EDF\u4E00\u5F8B\u6CD5\uFF0C\u8150\u8D25\u4E0B\u964D\u3002\u89E3\u9501\u5B66\u9662\u3002",
    costSci: 400,
    costGold: 160,
    prereqTech: "admin_lv1",
    effects: { taxEffMod: 1.12, corruptionReduction: 5, efficiencyMod: 10, maxProvinceBonus: 2 }
  },
  {
    id: "admin_lv3",
    branch: "admin",
    level: 3,
    name: "\u5BA1\u8BA1\u5236\u5EA6",
    description: "\u53CD\u8150\u5BA1\u8BA1\uFF0C\u8150\u8D25\u5927\u964D\u3002\u89E3\u9501\u6CD5\u9662\u3001\u53CD\u8150\u6539\u9769\u3002",
    costSci: 900,
    costGold: 320,
    prereqTech: "admin_lv2",
    effects: { taxEffMod: 1.18, corruptionReduction: 10, efficiencyMod: 15, maxProvinceBonus: 3 }
  },
  {
    id: "admin_lv4",
    branch: "admin",
    level: 4,
    name: "\u884C\u7701\u5236\u5EA6",
    description: "\u5730\u65B9\u5206\u6743\uFF0C\u53EF\u7BA1\u7701\u5927\u589E\u3002",
    costSci: 1600,
    costGold: 640,
    prereqTech: "admin_lv3",
    effects: { taxEffMod: 1.24, corruptionReduction: 15, efficiencyMod: 20, maxProvinceBonus: 4 }
  },
  {
    id: "admin_lv5",
    branch: "admin",
    level: 5,
    name: "\u4E2D\u592E\u96C6\u6743",
    description: "\u9AD8\u5EA6\u96C6\u6743\uFF0C\u884C\u653F\u767B\u9876\u3002",
    costSci: 2500,
    costGold: 1280,
    prereqTech: "admin_lv4",
    effects: { taxEffMod: 1.3, corruptionReduction: 20, efficiencyMod: 25, maxProvinceBonus: 5 }
  },
  // ── B 扩展：每路加 Lv6-8，扩到 24 科技 ──
  // 农业 Lv6-8
  { id: "agri_lv6", branch: "agri", level: 6, name: "\u6742\u4EA4\u9009\u80B2", description: "\u9009\u80B2\u826F\u79CD\uFF0C\u7CAE\u4EA7\u98DE\u8DC3\u3002", costSci: 3600, costGold: 1e3, prereqTech: "agri_lv5", effects: { agriYieldMod: 1.48, popGrowthMod: 1.3 } },
  { id: "agri_lv7", branch: "agri", level: 7, name: "\u519C\u5B66\u96C6\u5927\u6210", description: "\u519C\u5B66\u4F53\u7CFB\u5316\uFF0C\u65F1\u6D9D\u4FDD\u6536\u3002", costSci: 4900, costGold: 1400, prereqTech: "agri_lv6", effects: { agriYieldMod: 1.56, popGrowthMod: 1.35 } },
  { id: "agri_lv8", branch: "agri", level: 8, name: "\u4E07\u9877\u818F\u58E4", description: "\u5168\u9762\u6539\u826F\u571F\u58E4\uFF0C\u7CAE\u4EA7\u767B\u9876\u3002", costSci: 6400, costGold: 1800, prereqTech: "agri_lv7", effects: { agriYieldMod: 1.64, popGrowthMod: 1.4 } },
  // 军事 Lv6-8
  { id: "mil_lv6", branch: "mil", level: 6, name: "\u91CD\u88C5\u6B65\u5175", description: "\u91CD\u7532\u7CBE\u9510\uFF0C\u6467\u67AF\u62C9\u673D\u3002", costSci: 3600, costGold: 1e3, prereqTech: "mil_lv5", effects: { combatMod: 1.48, equipMod: 1.2, supplyMod: 1.16 } },
  { id: "mil_lv7", branch: "mil", level: 7, name: "\u673A\u52A8\u6218\u6CD5", description: "\u9AD8\u5EA6\u673A\u52A8\uFF0C\u51FA\u5947\u5236\u80DC\u3002", costSci: 4900, costGold: 1400, prereqTech: "mil_lv6", effects: { combatMod: 1.56, equipMod: 1.25, supplyMod: 1.2 } },
  { id: "mil_lv8", branch: "mil", level: 8, name: "\u5929\u4E0B\u96C4\u5E08", description: "\u519B\u5A01\u9707\u56DB\u65B9\uFF0C\u6218\u65E0\u4E0D\u80DC\u3002", costSci: 6400, costGold: 1800, prereqTech: "mil_lv7", effects: { combatMod: 1.64, equipMod: 1.3, supplyMod: 1.25 } },
  // 行政 Lv6-8
  { id: "admin_lv6", branch: "admin", level: 6, name: "\u6587\u5B98\u5236\u5EA6", description: "\u4E13\u4E1A\u6587\u5B98\u4F53\u7CFB\uFF0C\u884C\u653F\u767B\u9876\u3002", costSci: 3600, costGold: 1e3, prereqTech: "admin_lv5", effects: { taxEffMod: 1.36, corruptionReduction: 25, efficiencyMod: 30, maxProvinceBonus: 6 } },
  { id: "admin_lv7", branch: "admin", level: 7, name: "\u5E1D\u56FD\u5F8B\u4EE4", description: "\u7EDF\u4E00\u5F8B\u4EE4\uFF0C\u56DB\u6D77\u5F52\u6CBB\u3002", costSci: 4900, costGold: 1400, prereqTech: "admin_lv6", effects: { taxEffMod: 1.42, corruptionReduction: 30, efficiencyMod: 35, maxProvinceBonus: 7 } },
  { id: "admin_lv8", branch: "admin", level: 8, name: "\u4E07\u4E16\u4E4B\u6CD5", description: "\u6C38\u6052\u6CD5\u5EA6\uFF0C\u793E\u7A37\u957F\u6CBB\u3002", costSci: 6400, costGold: 1800, prereqTech: "admin_lv7", effects: { taxEffMod: 1.5, corruptionReduction: 40, efficiencyMod: 45, maxProvinceBonus: 10 } },
  // ── E18: 文化科技 Lv1-8（第四分支，影响合法性/影响力/同化/文化输出）──
  { id: "culture_lv1", branch: "culture", level: 1, name: "\u793C\u4E50\u521D\u5174", description: "\u786E\u7ACB\u793C\u4E50\u5236\u5EA6\uFF0C\u5408\u6CD5\u6027\u6839\u57FA\u521D\u56FA\u3002", costSci: 100, costGold: 60, effects: { legitimacyMod: 5, assimilationMod: 1 } },
  { id: "culture_lv2", branch: "culture", level: 2, name: "\u5178\u7C4D\u7F16\u7E82", description: "\u6C47\u7F16\u5178\u7C4D\uFF0C\u6587\u5316\u5F71\u54CD\u529B\u6269\u6563\u3002", costSci: 400, costGold: 180, prereqTech: "culture_lv1", effects: { legitimacyMod: 8, influenceMod: 2, assimilationMod: 2 } },
  { id: "culture_lv3", branch: "culture", level: 3, name: "\u6559\u5316\u4E07\u6C11", description: "\u63A8\u884C\u6559\u5316\uFF0C\u540C\u5316\u901F\u5EA6\u5927\u589E\u3002", costSci: 900, costGold: 360, prereqTech: "culture_lv2", effects: { legitimacyMod: 12, influenceMod: 3, assimilationMod: 3, cultureExportMod: 1.1 } },
  { id: "culture_lv4", branch: "culture", level: 4, name: "\u76DB\u4E16\u6587\u8FD0", description: "\u6587\u827A\u9F0E\u76DB\uFF0C\u5F71\u54CD\u529B\u8F90\u5C04\u90BB\u90A6\u3002", costSci: 1600, costGold: 720, prereqTech: "culture_lv3", effects: { legitimacyMod: 16, influenceMod: 5, assimilationMod: 4, cultureExportMod: 1.2 } },
  { id: "culture_lv5", branch: "culture", level: 5, name: "\u4E07\u90A6\u6765\u671D", description: "\u6587\u5316\u9F0E\u76DB\uFF0C\u8BF8\u90A6\u4EF0\u6155\u5F52\u5FC3\u3002", costSci: 2500, costGold: 1440, prereqTech: "culture_lv4", effects: { legitimacyMod: 20, influenceMod: 7, assimilationMod: 5, cultureExportMod: 1.3 } },
  { id: "culture_lv6", branch: "culture", level: 6, name: "\u5B66\u672F\u767E\u5BB6", description: "\u767E\u5BB6\u4E89\u9E23\uFF0C\u79D1\u7814\u4E0E\u5F71\u54CD\u529B\u53CC\u5347\u3002", costSci: 3600, costGold: 1e3, prereqTech: "culture_lv5", effects: { legitimacyMod: 25, influenceMod: 9, assimilationMod: 6, cultureExportMod: 1.4 } },
  { id: "culture_lv7", branch: "culture", level: 7, name: "\u6587\u660E\u4E4B\u5149", description: "\u6587\u660E\u767B\u9876\uFF0C\u5149\u7167\u56DB\u6D77\u3002", costSci: 4900, costGold: 1400, prereqTech: "culture_lv6", effects: { legitimacyMod: 30, influenceMod: 12, assimilationMod: 8, cultureExportMod: 1.55 } },
  { id: "culture_lv8", branch: "culture", level: 8, name: "\u6C38\u6052\u6587\u8109", description: "\u6587\u8109\u6C38\u7EED\uFF0C\u5E1D\u56FD\u7CBE\u795E\u4E0D\u673D\u3002", costSci: 6400, costGold: 1800, prereqTech: "culture_lv7", effects: { legitimacyMod: 40, influenceMod: 15, assimilationMod: 10, cultureExportMod: 1.7 } }
];
var TECH_BY_ID = Object.fromEntries(
  TECHNOLOGIES.map((t) => [t.id, t])
);

// src/engine/technology.ts
function settleTechnology(nation, state) {
  if (nation.tech.researchProgress) {
    const tech = TECH_BY_ID[nation.tech.researchProgress.techId];
    if (!tech) {
      nation.tech.researchProgress = null;
      return;
    }
    const cost = researchCost(tech.level, tech.costSci, tech.costGold);
    const invest = Math.min(nation.resources.sciPt, cost.sci - nation.tech.researchProgress.sciPtInvested);
    nation.tech.researchProgress.sciPtInvested += invest;
    nation.resources.sciPt -= invest;
    if (nation.tech.researchProgress.sciPtInvested >= cost.sci && nation.resources.gold >= cost.gold) {
      nation.resources.gold -= cost.gold;
      nation.tech[tech.branch] = Math.max(nation.tech[tech.branch], tech.level);
      nation.tech.researchProgress = null;
    }
  }
}
function settleTechnologyPure(nation, _state) {
  if (!nation.tech.researchProgress) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const tech = TECH_BY_ID[nation.tech.researchProgress.techId];
  if (!tech) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const cost = researchCost(tech.level, tech.costSci, tech.costGold);
  const invest = Math.min(nation.resources.sciPt, cost.sci - nation.tech.researchProgress.sciPtInvested);
  const newInvested = nation.tech.researchProgress.sciPtInvested + invest;
  if (newInvested >= cost.sci && nation.resources.gold >= cost.gold) {
    return {
      deltaSciPt: -invest,
      deltaGold: -cost.gold,
      researchProgressFinal: null,
      // 完成，清空
      techLevelUp: { branch: tech.branch, level: tech.level }
    };
  }
  return {
    deltaSciPt: -invest,
    deltaGold: 0,
    researchProgressFinal: { techId: nation.tech.researchProgress.techId, sciPtInvested: newInvested },
    techLevelUp: null
  };
}

// src/engine/culture.ts
function settleCultureReligion(nation, state) {
  const provs = provincesOf(nation.id, state.provinces);
  const triggered = [];
  const culturePolicy = "assimilate";
  const religionPolicy = "tolerant";
  const capital = state.provinces[nation.capital];
  const stateCulture = capital?.culture ?? null;
  const stateReligion = capital?.religion ?? null;
  for (const p of provs) {
    const cultureDiff = stateCulture !== null && p.culture !== stateCulture;
    const religionDiff = stateReligion !== null && p.religion !== stateReligion;
    const farFromCapital = p.distToPlayerCapital > 2;
    const cultureTechBonus = nation.tech.culture * 0.5 + (nation.policyMods?.assimilationMod ?? 0);
    const dAssim = assimilationDelta(
      p.buildings.filter((b) => b.defId === "road").length,
      culturePolicy,
      nation.government.efficiency,
      cultureDiff,
      farFromCapital
    ) + cultureTechBonus;
    p.assimilation = clamp2(p.assimilation + dAssim, 0, 100);
    const dLoy = loyaltyDelta(
      nation.government.stability,
      p.assimilation,
      p.garrison > 0,
      p.unrest,
      nation.activeCharacterBonuses.includes("welfare")
    );
    p.loyalty = clamp2(p.loyalty + dLoy, 0, 100);
    p.rebellionRisk = clamp2(computeRebellion({
      unrest: p.unrest,
      cultureDiff,
      religionDiff,
      religionPolicy,
      garrison: p.garrison,
      stability: nation.government.stability
    }), 0, 100);
    if (p.rebellionRisk >= 100 && p.garrison === 0) {
      triggered.push(p.id);
    }
  }
  return { rebellionTriggered: triggered };
}
function settleCultureReligionPure(nation, state) {
  const provs = provincesOf(nation.id, state.provinces);
  const triggered = [];
  const culturePolicy = "assimilate";
  const religionPolicy = "tolerant";
  const capital = state.provinces[nation.capital];
  const stateCulture = capital?.culture ?? null;
  const stateReligion = capital?.religion ?? null;
  const provFinal = {};
  for (const p of provs) {
    const cultureDiff = stateCulture !== null && p.culture !== stateCulture;
    const religionDiff = stateReligion !== null && p.religion !== stateReligion;
    const farFromCapital = p.distToPlayerCapital > 2;
    const cultureTechBonus = nation.tech.culture * 0.5 + (nation.policyMods?.assimilationMod ?? 0);
    const dAssim = assimilationDelta(
      p.buildings.filter((b) => b.defId === "road").length,
      culturePolicy,
      nation.government.efficiency,
      cultureDiff,
      farFromCapital
    ) + cultureTechBonus;
    const finalAssim = clamp2(p.assimilation + dAssim, 0, 100);
    const dLoy = loyaltyDelta(
      nation.government.stability,
      finalAssim,
      p.garrison > 0,
      p.unrest,
      nation.activeCharacterBonuses.includes("welfare")
    );
    const finalLoy = clamp2(p.loyalty + dLoy, 0, 100);
    const finalReb = clamp2(computeRebellion({
      unrest: p.unrest,
      cultureDiff,
      religionDiff,
      religionPolicy,
      garrison: p.garrison,
      stability: nation.government.stability
    }), 0, 100);
    provFinal[p.id] = { assimilation: finalAssim, loyalty: finalLoy, rebellionRisk: finalReb };
    if (finalReb >= 100 && p.garrison === 0) triggered.push(p.id);
  }
  return { rebellionTriggered: triggered, provFinal };
}

// src/data/events.ts
var fr = (faction, delta) => [{ faction, delta }];
var fra = (...items) => items;
var EVENTS = [
  // ── 危机类 ──
  {
    id: "evt_famine",
    title: "\u7CAE\u98DF\u5371\u673A",
    description: "\u591A\u5730\u7CAE\u4ED3\u544A\u6025\uFF0C\u7CAE\u4EF7\u98DE\u6DA8\uFF0C\u6C11\u4F17\u60F6\u6050\u3002",
    category: "crisis",
    trigger: { maxFoodRatio: 0.6 },
    weight: 10,
    cooldown: 15,
    unique: false,
    options: [
      { text: "\u7D27\u6025\u5F00\u4ED3\u653E\u7CAE", effects: { food: -100, stability: 5, factionSat: fr("commoners", 10) }, aiWeight: 2 },
      { text: "\u4ECE\u90BB\u56FD\u9AD8\u4EF7\u8D2D\u7CAE", effects: { gold: -150, food: 80, influence: -3 }, aiWeight: 3 },
      { text: "\u5750\u89C6\u4E0D\u7BA1", effects: { stability: -10, population: -50, factionSat: fr("commoners", -15) }, aiWeight: 1 }
    ]
  },
  {
    id: "evt_plague",
    title: "\u761F\u75AB",
    description: "\u761F\u75AB\u8513\u5EF6\uFF0C\u4EBA\u53E3\u9AA4\u51CF\u3002",
    category: "crisis",
    trigger: { minTurn: 20 },
    weight: 4,
    cooldown: 40,
    unique: false,
    options: [
      { text: "\u9694\u79BB\u75AB\u533A", effects: { population: -80, stability: -5, gold: -50 }, aiWeight: 3 },
      { text: "\u7948\u795E\u79B3\u707E", effects: { population: -150, factionSat: fr("clergy", 10) }, aiWeight: 2 },
      { text: "\u53EC\u96C6\u5B66\u8005\u7814\u7A76", effects: { population: -60, sciPt: 5, gold: -80 }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_drought",
    title: "\u65F1\u707E",
    description: "\u6301\u7EED\u5E72\u65F1\uFF0C\u7CAE\u98DF\u51CF\u4EA7\u3002",
    category: "crisis",
    trigger: {},
    weight: 6,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u51CF\u514D\u519C\u7A0E", effects: { taxRate: -0.02, food: -50, factionSat: fr("commoners", 10) }, aiWeight: 3 },
      { text: "\u5F3A\u884C\u5F81\u7CAE", effects: { food: 50, stability: -8, factionSat: fr("commoners", -15) }, aiWeight: 2 }
    ]
  },
  // ── 政治类 ──
  {
    id: "evt_noble_coup",
    title: "\u8D35\u65CF\u903C\u5BAB",
    description: "\u4E0D\u6EE1\u7684\u8D35\u65CF\u5BC6\u8C0B\u53CD\u5BF9\u4F60\u7684\u7EDF\u6CBB\u3002",
    category: "politics",
    trigger: { factionSatBelow: { faction: "nobles", threshold: 20 } },
    weight: 8,
    cooldown: 25,
    unique: false,
    options: [
      { text: "\u8BA9\u6B65\u5206\u6743", effects: { legitimacy: -10, efficiency: -5, factionSat: fr("nobles", 20) }, aiWeight: 3 },
      { text: "\u94C1\u8155\u9547\u538B", effects: { stability: -10, legitimacy: -5, factionSat: fra({ faction: "nobles", delta: -10 }, { faction: "military", delta: 5 }) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_merchant_strike",
    title: "\u5546\u4EBA\u7F62\u5E02",
    description: "\u5546\u4EBA\u5173\u95ED\u5E97\u94FA\u6297\u8BAE\u7A0E\u653F\u3002",
    category: "politics",
    trigger: { factionSatBelow: { faction: "merchants", threshold: 20 } },
    weight: 8,
    cooldown: 25,
    unique: false,
    options: [
      { text: "\u51CF\u514D\u5546\u7A0E", effects: { taxRate: -0.02, gold: -50, factionSat: fr("merchants", 20) }, aiWeight: 3 },
      { text: "\u5F3A\u5236\u5F00\u5E02", effects: { gold: -100, stability: -5, factionSat: fr("merchants", -10) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_military_unrest",
    title: "\u519B\u65B9\u4E0D\u6EE1",
    description: "\u6B20\u9977\u7684\u519B\u961F\u9A9A\u52A8\u4E0D\u5B89\u3002",
    category: "politics",
    trigger: { factionSatBelow: { faction: "military", threshold: 20 } },
    weight: 9,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u8865\u53D1\u519B\u9977", effects: { gold: -120, factionSat: fr("military", 25) }, aiWeight: 3 },
      { text: "\u88C1\u64A4\u8001\u5175", effects: { population: -30, stability: -5, factionSat: fr("military", -10) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_peasant_uprising",
    title: "\u519C\u6C11\u8D77\u4E49",
    description: "\u4E0D\u582A\u91CD\u7A0E\u7684\u519C\u6C11\u63ED\u7AFF\u800C\u8D77\u3002",
    category: "politics",
    trigger: { factionSatBelow: { faction: "commoners", threshold: 20 } },
    weight: 9,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u9547\u538B\u8D77\u4E49", effects: { gold: -80, population: -40, stability: -5, factionSat: fra({ faction: "commoners", delta: -15 }, { faction: "military", delta: 5 }) }, aiWeight: 3 },
      { text: "\u5141\u8BFA\u51CF\u7A0E", effects: { taxRate: -0.03, gold: -30, factionSat: fr("commoners", 25) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_clergy_interference",
    title: "\u795E\u804C\u5E72\u653F",
    description: "\u795E\u804C\u4EBA\u5458\u8981\u6C42\u66F4\u5927\u7684\u5B97\u6559\u8BDD\u8BED\u6743\u3002",
    category: "politics",
    trigger: { factionSatBelow: { faction: "clergy", threshold: 30 }, minCorruption: 30 },
    weight: 5,
    cooldown: 30,
    unique: false,
    options: [
      { text: "\u6388\u4E88\u5B97\u6559\u7279\u6743", effects: { influence: 5, efficiency: -5, factionSat: fra({ faction: "clergy", delta: 20 }, { faction: "merchants", delta: -5 }) }, aiWeight: 3 },
      { text: "\u62D2\u7EDD\u5E76\u9650\u5236\u6559\u6743", effects: { stability: -3, legitimacy: -3, factionSat: fr("clergy", -15) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_succession_crisis",
    title: "\u738B\u4F4D\u7EE7\u627F\u5371\u673A",
    description: "\u7EE7\u627F\u5408\u6CD5\u6027\u53D7\u5230\u8D28\u7591\u3002",
    category: "politics",
    trigger: { maxLegitimacy: 25 },
    weight: 12,
    cooldown: 30,
    unique: false,
    options: [
      { text: "\u4E89\u53D6\u8D35\u65CF\u652F\u6301", effects: { gold: -100, legitimacy: 15, factionSat: fr("nobles", 15) }, aiWeight: 3 },
      { text: "\u6C11\u4F17\u62E5\u6234\u8DEF\u7EBF", effects: { gold: -80, legitimacy: 10, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -5 }) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_corruption_scandal",
    title: "\u8150\u8D25\u4E11\u95FB",
    description: "\u9AD8\u5B98\u8D2A\u8150\u6848\u66DD\u5149\uFF0C\u671D\u91CE\u9707\u52A8\u3002",
    category: "politics",
    trigger: { minCorruption: 60 },
    weight: 8,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u4E25\u60E9\u6D89\u6848\u5B98\u5458", effects: { corruption: -10, gold: -50, factionSat: fr("nobles", -10) }, aiWeight: 3 },
      { text: "\u5927\u4E8B\u5316\u5C0F", effects: { corruption: 5, legitimacy: -5, factionSat: fr("commoners", -10) }, aiWeight: 2 }
    ]
  },
  // ── 经济类 ──
  {
    id: "evt_treasury_alarm",
    title: "\u56FD\u5E93\u544A\u6025",
    description: "\u56FD\u5E93\u5373\u5C06\u89C1\u5E95\uFF0C\u8D22\u653F\u544A\u6025\u3002",
    category: "economy",
    trigger: { minTurn: 1 },
    weight: 7,
    cooldown: 15,
    unique: false,
    options: [
      { text: "\u4E34\u65F6\u52A0\u5F81\u7279\u522B\u7A0E", effects: { gold: 100, stability: -5, factionSat: fr("commoners", -10) }, aiWeight: 3 },
      { text: "\u51FA\u552E\u738B\u5BA4\u73CD\u85CF", effects: { gold: 150, legitimacy: -3 }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_trade_route_open",
    title: "\u5546\u8DEF\u5F00\u901A",
    description: "\u4E00\u6761\u65B0\u7684\u5546\u8DEF\u88AB\u53D1\u73B0\u3002",
    category: "economy",
    trigger: { notAtWar: true },
    weight: 5,
    cooldown: 30,
    unique: false,
    options: [
      { text: "\u9F13\u52B1\u5546\u4EBA\u5F00\u62D3", effects: { gold: 50, influence: 3, factionSat: fr("merchants", 10) }, aiWeight: 3 },
      { text: "\u738B\u5BA4\u5784\u65AD\u8D38\u6613", effects: { gold: 100, factionSat: fr("merchants", -10) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_mineral_discovery",
    title: "\u77FF\u85CF\u53D1\u73B0",
    description: "\u52D8\u63A2\u8005\u53D1\u73B0\u65B0\u77FF\u85CF\u3002",
    category: "economy",
    trigger: {},
    weight: 4,
    cooldown: 40,
    unique: false,
    options: [
      { text: "\u7ACB\u5373\u5F00\u91C7", effects: { iron: 50, gold: -30 }, aiWeight: 3 },
      { text: "\u957F\u671F\u5F00\u53D1", effects: { iron: 20, gold: 20 }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_harvest_bumper",
    title: "\u4E30\u6536",
    description: "\u4ECA\u5E74\u98CE\u8C03\u96E8\u987A\uFF0C\u7CAE\u98DF\u5927\u4E30\u3002",
    category: "economy",
    trigger: {},
    weight: 5,
    cooldown: 15,
    unique: false,
    options: [
      { text: "\u5145\u5B9E\u7CAE\u4ED3", effects: { food: 200, stability: 3 }, aiWeight: 3 },
      { text: "\u51FA\u53E3\u6362\u91D1", effects: { food: 100, gold: 80 }, aiWeight: 2 }
    ]
  },
  // ── 军事类 ──
  {
    id: "evt_war_weariness",
    title: "\u538C\u6218\u6C11\u53D8",
    description: "\u957F\u671F\u6218\u4E89\u5F15\u53D1\u6C11\u4F17\u538C\u6218\u6297\u8BAE\u3002",
    category: "military",
    trigger: { minWarExhaustion: 70 },
    weight: 10,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u627F\u8BFA\u5C3D\u5FEB\u505C\u6218", effects: { warExhaustion: -10, factionSat: fr("commoners", 10) }, aiWeight: 3 },
      { text: "\u5F3A\u786C\u9547\u538B\u53CD\u6218", effects: { stability: -10, warExhaustion: -5, factionSat: fr("commoners", -15) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_peace_proposal",
    title: "\u548C\u8C08\u63D0\u8BAE",
    description: "\u654C\u65B9\u6D3E\u51FA\u4F7F\u8005\u63D0\u8BAE\u505C\u6218\u3002",
    category: "military",
    trigger: { atWar: true },
    weight: 8,
    cooldown: 15,
    unique: false,
    options: [
      { text: "\u63A5\u53D7\u548C\u8C08", effects: { influence: 10, warExhaustion: -20 }, aiWeight: 3 },
      { text: "\u62D2\u7EDD\u7EE7\u7EED\u6218\u4E89", effects: { stability: -3, factionSat: fr("military", 5) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_new_territory",
    title: "\u65B0\u9886\u571F\u6CBB\u7406",
    description: "\u521A\u5360\u9886\u7684\u7701\u4EFD\u9700\u8981\u6CBB\u7406\u65B9\u6848\u3002",
    category: "military",
    trigger: { hasNewTerritory: true },
    weight: 12,
    cooldown: 5,
    unique: false,
    options: [
      { text: "\u6000\u67D4\u5B89\u629A", effects: { gold: -80, stability: 3, influence: 5 }, aiWeight: 3 },
      { text: "\u9A7B\u519B\u9547\u538B", effects: { gold: -40, stability: -3, factionSat: fr("military", 5) }, aiWeight: 2 }
    ]
  },
  // ── 外交类 ──
  {
    id: "evt_border_clash",
    title: "\u8FB9\u5883\u51B2\u7A81",
    description: "\u4E0E\u90BB\u56FD\u8FB9\u5883\u53D1\u751F\u5C0F\u89C4\u6A21\u51B2\u7A81\u3002",
    category: "diplomacy",
    trigger: { relationBelow: { target: "n02", threshold: -30 } },
    weight: 7,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u5916\u4EA4\u65A1\u65CB", effects: { influence: -10, relation: { target: "n02", delta: 10 } }, aiWeight: 3 },
      { text: "\u5F3A\u786C\u53CD\u5236", effects: { relation: { target: "n02", delta: -15 }, factionSat: fr("military", 8) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_foreign_envoy",
    title: "\u5916\u56FD\u4F7F\u56E2\u5230\u8BBF",
    description: "\u90BB\u56FD\u6D3E\u51FA\u4F7F\u56E2\u5BFB\u6C42\u5408\u4F5C\u3002",
    category: "diplomacy",
    trigger: { notAtWar: true, minTurn: 5 },
    weight: 5,
    cooldown: 25,
    unique: false,
    options: [
      { text: "\u70ED\u60C5\u63A5\u5F85", effects: { gold: -30, influence: 8, relation: { target: "n03", delta: 5 } }, aiWeight: 3 },
      { text: "\u51B7\u6DE1\u56DE\u7EDD", effects: { influence: -3, relation: { target: "n03", delta: -5 } }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_neighbor_threat",
    title: "\u90BB\u56FD\u5A01\u80C1",
    description: "\u90BB\u56FD\u9648\u5175\u8FB9\u5883\u53D1\u51FA\u5A01\u80C1\u3002",
    category: "diplomacy",
    trigger: { minTurn: 10 },
    weight: 6,
    cooldown: 30,
    unique: false,
    options: [
      { text: "\u5916\u4EA4\u59A5\u534F", effects: { influence: -5, gold: -50, relation: { target: "n04", delta: 10 } }, aiWeight: 3 },
      { text: "\u6269\u519B\u5907\u6218", effects: { gold: -100, factionSat: fr("military", 10), relation: { target: "n04", delta: -10 } }, aiWeight: 2 }
    ]
  },
  // ── 宗教类 ──
  {
    id: "evt_religion_dispute",
    title: "\u5B97\u6559\u4E89\u7AEF",
    description: "\u4E0D\u540C\u4FE1\u4EF0\u8005\u53D1\u751F\u51B2\u7A81\u3002",
    category: "religion",
    trigger: { provinceCultureDiff: true },
    weight: 6,
    cooldown: 25,
    unique: false,
    options: [
      { text: "\u63A8\u884C\u5BBD\u5BB9\u653F\u7B56", effects: { stability: 3, influence: 3, factionSat: fr("clergy", -10) }, aiWeight: 3 },
      { text: "\u652F\u6301\u56FD\u6559\u538B\u5236", effects: { stability: -5, factionSat: fra({ faction: "clergy", delta: 15 }, { faction: "commoners", delta: -10 }) }, aiWeight: 2 }
    ]
  },
  // ── 科技类 ──
  {
    id: "evt_tech_breakthrough",
    title: "\u79D1\u6280\u7A81\u7834",
    description: "\u5B66\u8005\u53D6\u5F97\u91CD\u5927\u7A81\u7834\uFF01",
    category: "science",
    trigger: { techLevelAbove: { branch: "admin", level: 2 } },
    weight: 3,
    cooldown: 20,
    unique: false,
    options: [
      { text: "\u63A8\u5E7F\u65B0\u6280\u672F", effects: { sciPt: 20, gold: -50 }, aiWeight: 3 },
      { text: "\u4FDD\u5BC6\u5FA1\u7528", effects: { sciPt: 10, legitimacy: 3, factionSat: fr("nobles", 5) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_scholar_petition",
    title: "\u5B66\u8005\u8BF7\u613F",
    description: "\u5B66\u8005\u8BF7\u6C42\u52A0\u5927\u79D1\u7814\u6295\u5165\u3002",
    category: "science",
    trigger: { minTurn: 5 },
    weight: 4,
    cooldown: 25,
    unique: false,
    options: [
      { text: "\u62E8\u91D1\u652F\u6301", effects: { gold: -80, sciPt: 10 }, aiWeight: 3 },
      { text: "\u5A49\u62D2", effects: { factionSat: fr("commoners", -5) }, aiWeight: 2 }
    ]
  },
  // ── 机会类 ──
  {
    id: "evt_reform_call",
    title: "\u6539\u9769\u547C\u58F0",
    description: "\u6C11\u4F17\u4E0E\u5546\u4EBA\u547C\u5401\u4F53\u5236\u6539\u9769\u3002",
    category: "opportunity",
    trigger: { minTurn: 15, maxStability: 40 },
    weight: 5,
    cooldown: 30,
    unique: false,
    options: [
      { text: "\u542F\u52A8\u6E10\u8FDB\u6539\u9769", effects: { legitimacy: -5, stability: 5, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -10 }) }, aiWeight: 3 },
      { text: "\u62D2\u7EDD\u6539\u9769", effects: { stability: -5, factionSat: fr("commoners", -10) }, aiWeight: 2 }
    ]
  },
  {
    id: "evt_coup_risk",
    title: "\u519B\u4E8B\u653F\u53D8\u98CE\u9669",
    description: "\u519B\u65B9\u5BC6\u8C0B\u53D1\u52A8\u653F\u53D8\uFF01",
    category: "politics",
    trigger: { factionSatBelow: { faction: "military", threshold: 10 }, maxLegitimacy: 40 },
    weight: 8,
    cooldown: 50,
    unique: false,
    options: [
      { text: "\u5BC6\u8C0B\u5206\u5316\u5C06\u9886", effects: { gold: -150, legitimacy: -5, factionSat: fr("military", 15) }, aiWeight: 3 },
      { text: "\u5148\u53D1\u5236\u4EBA\u6E05\u6D17", effects: { stability: -15, legitimacy: -10, factionSat: fr("military", -20) }, aiWeight: 1 }
    ]
  },
  // ── 扩展事件 26-55（世界级） ──
  { id: "evt_gold_rush", title: "\u6DD8\u91D1\u70ED", description: "\u8FB9\u5883\u53D1\u73B0\u91D1\u77FF\uFF01", category: "economy", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u5F00\u91C7", effects: { gold: 200, corruption: 5 }, aiWeight: 3 }, { text: "\u9650\u5236\u5F00\u91C7", effects: { gold: 50, stability: 3 }, aiWeight: 2 }] },
  { id: "evt_trade_boom", title: "\u8D38\u6613\u7E41\u8363", description: "\u5546\u8DEF\u7545\u901A\uFF0C\u8D38\u6613\u91CF\u6FC0\u589E\uFF01", category: "economy", trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u9F13\u52B1\u8D38\u6613", effects: { gold: 100, factionSat: fr("merchants", 10) }, aiWeight: 3 }, { text: "\u5F81\u6536\u5546\u7A0E", effects: { gold: 150, factionSat: fr("merchants", -8) }, aiWeight: 2 }] },
  { id: "evt_drought_severe", title: "\u5927\u65F1", description: "\u4E45\u65F1\u4E0D\u96E8\uFF0C\u7CAE\u98DF\u51CF\u4EA7\uFF01", category: "crisis", trigger: { minTurn: 3 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u5F00\u4ED3\u653E\u7CAE", effects: { food: -100, stability: 5 }, aiWeight: 3 }, { text: "\u52A0\u91CD\u8D4B\u7A0E\u6551\u707E", effects: { gold: -80, food: 50, factionSat: fr("commoners", -10) }, aiWeight: 2 }] },
  { id: "evt_refugee_wave", title: "\u96BE\u6C11\u6F6E", description: "\u90BB\u56FD\u6218\u4E71\uFF0C\u96BE\u6C11\u6D8C\u5165\u8FB9\u5883\uFF01", category: "crisis", trigger: { minTurn: 10 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u63A5\u7EB3\u5B89\u7F6E", effects: { population: 500, food: -50, stability: -3 }, aiWeight: 2 }, { text: "\u5173\u95ED\u8FB9\u5883", effects: { legitimacy: -5, factionSat: fr("commoners", 5) }, aiWeight: 3 }] },
  { id: "evt_merchant_guild", title: "\u5546\u4EBA\u884C\u4F1A", description: "\u5546\u4EBA\u7EC4\u5EFA\u884C\u4F1A\u8981\u6C42\u7279\u6743\uFF01", category: "politics", trigger: { minTurn: 8 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u6388\u4E88\u7279\u6743", effects: { gold: 80, factionSat: fra({ faction: "merchants", delta: 15 }, { faction: "nobles", delta: -8 }) }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { factionSat: fr("merchants", -12) }, aiWeight: 2 }] },
  { id: "evt_military_reform", title: "\u519B\u4E8B\u6539\u9769", description: "\u5C06\u9886\u63D0\u8BAE\u6539\u9769\u519B\u5236\uFF01", category: "military", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u63A8\u884C\u6539\u9769", effects: { gold: -120, factionSat: fr("military", 10), stability: -3 }, aiWeight: 3 }, { text: "\u7EF4\u6301\u73B0\u72B6", effects: { factionSat: fr("military", -5) }, aiWeight: 2 }] },
  { id: "evt_cultural_flourish", title: "\u6587\u5316\u7E41\u8363", description: "\u5B66\u8005\u827A\u672F\u5BB6\u6C47\u805A\uFF0C\u6587\u5316\u660C\u76DB\uFF01", category: "culture", trigger: { minTurn: 15, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5927\u529B\u8D44\u52A9", effects: { gold: -80, sciPt: 15, legitimacy: 5 }, aiWeight: 3 }, { text: "\u9002\u5EA6\u652F\u6301", effects: { gold: -30, sciPt: 5 }, aiWeight: 2 }] },
  { id: "evt_border_incident", title: "\u8FB9\u5883\u51B2\u7A81", description: "\u8FB9\u9632\u519B\u4E0E\u90BB\u56FD\u53D1\u751F\u5C0F\u89C4\u6A21\u51B2\u7A81\uFF01", category: "military", trigger: { minTurn: 5 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u5F3A\u786C\u56DE\u5E94", effects: { stability: 3, factionSat: fra({ faction: "military", delta: 8 }, { faction: "merchants", delta: -5 }) }, aiWeight: 2 }, { text: "\u5916\u4EA4\u65A1\u65CB", effects: { gold: -30, legitimacy: 3 }, aiWeight: 3 }] },
  { id: "evt_earthquake", title: "\u5730\u9707", description: "\u5F3A\u70C8\u5730\u9707\u88AD\u51FB\u7701\u4EFD\uFF01", category: "crisis", trigger: { minTurn: 3 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u5168\u529B\u6551\u707E", effects: { gold: -150, food: -50, stability: 5 }, aiWeight: 3 }, { text: "\u6709\u9650\u6551\u63F4", effects: { gold: -50, stability: -5 }, aiWeight: 2 }] },
  { id: "evt_tax_evasion", title: "\u5927\u89C4\u6A21\u9003\u7A0E", description: "\u5BCC\u5546\u5927\u65CF\u9003\u7A0E\u4E25\u91CD\uFF01", category: "economy", trigger: { minCorruption: 30 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u4E25\u67E5\u91CD\u7F5A", effects: { gold: 100, factionSat: fr("nobles", -10), corruption: -5 }, aiWeight: 2 }, { text: "\u4ECE\u8F7B\u53D1\u843D", effects: { factionSat: fr("nobles", 5), corruption: 3 }, aiWeight: 3 }] },
  { id: "evt_succession_war", title: "\u7EE7\u627F\u5371\u673A", description: "\u591A\u4F4D\u7EE7\u627F\u4EBA\u9009\u4E89\u593A\u5927\u4F4D\uFF01", category: "politics", trigger: { maxLegitimacy: 50 }, weight: 6, cooldown: 40, unique: false, options: [{ text: "\u7ACB\u957F\u5B50", effects: { legitimacy: 10, stability: -5 }, aiWeight: 3 }, { text: "\u62E9\u8D24\u7ACB", effects: { legitimacy: 5, stability: -8, factionSat: fr("nobles", -10) }, aiWeight: 2 }] },
  { id: "evt_foreign_aid", title: "\u5916\u56FD\u63F4\u52A9", description: "\u53CB\u90A6\u9001\u6765\u7269\u8D44\u63F4\u52A9\uFF01", category: "economy", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u6B23\u7136\u63A5\u53D7", effects: { gold: 80, food: 60 }, aiWeight: 3 }, { text: "\u5A49\u62D2\u4EE5\u4FDD\u72EC\u7ACB", effects: { legitimacy: 5 }, aiWeight: 2 }] },
  { id: "evt_pop_boom", title: "\u4EBA\u53E3\u6FC0\u589E", description: "\u4E30\u6536\u5E26\u6765\u4EBA\u53E3\u5FEB\u901F\u589E\u957F\uFF01", category: "population", trigger: { minTurn: 8, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u9F13\u52B1\u589E\u957F", effects: { population: 300, food: -30 }, aiWeight: 3 }, { text: "\u9002\u5EA6\u63A7\u5236", effects: { population: 100 }, aiWeight: 2 }] },
  { id: "evt_slave_revolt", title: "\u5974\u5F79\u8D77\u4E49", description: "\u88AB\u538B\u8FEB\u8005\u63ED\u7AFF\u800C\u8D77\uFF01", category: "crisis", trigger: { minTurn: 10, maxStability: 40 }, weight: 5, cooldown: 35, unique: false, options: [{ text: "\u9547\u538B", effects: { gold: -80, stability: -5, factionSat: fr("military", 5) }, aiWeight: 2 }, { text: "\u9002\u5EA6\u6539\u9769", effects: { gold: -50, legitimacy: 5, factionSat: fr("nobles", -8) }, aiWeight: 3 }] },
  { id: "evt_spy_scandal", title: "\u95F4\u8C0D\u4E11\u95FB", description: "\u5916\u56FD\u95F4\u8C0D\u88AB\u6293\u83B7\uFF01", category: "diplomacy", trigger: { minTurn: 5 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u516C\u5F00\u5904\u5211", effects: { legitimacy: 5, stability: -3 }, aiWeight: 2 }, { text: "\u79D8\u5BC6\u5229\u7528", effects: { gold: 50, corruption: 3 }, aiWeight: 3 }] },
  { id: "evt_temple_dispute", title: "\u5BFA\u5E99\u4E89\u7AEF", description: "\u5B97\u6559\u56E2\u4F53\u95F4\u7206\u53D1\u51B2\u7A81\uFF01", category: "religion", trigger: { minTurn: 5, provinceCultureDiff: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u4EF2\u88C1\u8C03\u505C", effects: { gold: -30, stability: 3 }, aiWeight: 3 }, { text: "\u652F\u6301\u4E00\u65B9", effects: { factionSat: fr("clergy", 10), stability: -5 }, aiWeight: 2 }] },
  { id: "evt_road_building", title: "\u4FEE\u8DEF\u70ED\u6F6E", description: "\u5404\u65B9\u8981\u6C42\u4FEE\u5EFA\u9053\u8DEF\uFF01", category: "economy", trigger: { minTurn: 8, notAtWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u5927\u5174\u571F\u6728", effects: { gold: -120, stability: 3, factionSat: fr("merchants", 8) }, aiWeight: 3 }, { text: "\u91CF\u529B\u800C\u884C", effects: { gold: -40 }, aiWeight: 2 }] },
  { id: "evt_weapon_advance", title: "\u6B66\u5668\u9769\u65B0", description: "\u5DE5\u5320\u53D1\u660E\u65B0\u578B\u6B66\u5668\uFF01", category: "military", trigger: { techLevelAbove: { branch: "mil", level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u88C5\u5907\u5168\u519B", effects: { gold: -100, iron: -20, factionSat: fr("military", 12) }, aiWeight: 3 }, { text: "\u9650\u91CF\u88C5\u5907", effects: { gold: -40, factionSat: fr("military", 5) }, aiWeight: 2 }] },
  { id: "evt_noble_feud", title: "\u8D35\u65CF\u5185\u6597", description: "\u4E24\u5927\u8D35\u65CF\u5BB6\u65CF\u516C\u5F00\u5BF9\u7ACB\uFF01", category: "politics", trigger: { minTurn: 5 }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u5C45\u4E2D\u8C03\u505C", effects: { gold: -50, stability: 3 }, aiWeight: 3 }, { text: "\u652F\u6301\u5F3A\u52BF\u65B9", effects: { factionSat: fr("nobles", -8), legitimacy: -3 }, aiWeight: 2 }] },
  { id: "evt_harvest_festival", title: "\u4E30\u6536\u8282", description: "\u4E94\u8C37\u4E30\u767B\uFF0C\u4E07\u6C11\u540C\u5E86\uFF01", category: "culture", trigger: { minTurn: 5, notAtWar: true, minStability: 30 }, weight: 5, cooldown: 15, unique: false, options: [{ text: "\u5927\u8086\u5E86\u795D", effects: { gold: -50, food: -20, stability: 5, factionSat: fr("commoners", 10) }, aiWeight: 3 }, { text: "\u7B80\u6734\u4ECE\u4E8B", effects: { stability: 2 }, aiWeight: 2 }] },
  { id: "evt_corruption_expose", title: "\u8D2A\u8150\u66DD\u5149", description: "\u5927\u81E3\u8D2A\u58A8\u88AB\u63ED\u53D1\uFF01", category: "politics", trigger: { minCorruption: 40 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u4E25\u60E9\u4E0D\u8D37", effects: { corruption: -8, legitimacy: 5, factionSat: fr("nobles", -12) }, aiWeight: 3 }, { text: "\u7F5A\u9152\u4E09\u676F", effects: { corruption: -2, legitimacy: -3 }, aiWeight: 2 }] },
  { id: "evt_bandit_outbreak", title: "\u76D7\u532A\u7316\u7357", description: "\u76D7\u532A\u5360\u636E\u5C71\u5934\u52AB\u63A0\u5546\u8DEF\uFF01", category: "crisis", trigger: { maxStability: 50 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u6D3E\u5175\u6E05\u527F", effects: { gold: -60, stability: 5, factionSat: fr("military", 5) }, aiWeight: 3 }, { text: "\u62DB\u5B89\u5B89\u629A", effects: { gold: -30, corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_foreign_merchants", title: "\u5916\u5546\u6D8C\u5165", description: "\u5916\u56FD\u5546\u4EBA\u5E26\u6765\u65B0\u5947\u5546\u54C1\uFF01", category: "economy", trigger: { minTurn: 8, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u5F00\u653E\u5E02\u573A", effects: { gold: 60, factionSat: fra({ faction: "merchants", delta: 8 }, { faction: "commoners", delta: -3 }) }, aiWeight: 3 }, { text: "\u9650\u5236\u51C6\u5165", effects: { factionSat: fr("merchants", -5) }, aiWeight: 2 }] },
  { id: "evt_land_reform", title: "\u571F\u5730\u6539\u9769", description: "\u519C\u6C11\u8981\u6C42\u91CD\u65B0\u5206\u914D\u571F\u5730\uFF01", category: "politics", trigger: { minTurn: 15, factionSatBelow: { faction: "commoners", threshold: 30 } }, weight: 5, cooldown: 40, unique: false, options: [{ text: "\u63A8\u884C\u6539\u9769", effects: { gold: -100, stability: -8, factionSat: fra({ faction: "commoners", delta: 20 }, { faction: "nobles", delta: -15 }) }, aiWeight: 2 }, { text: "\u62D2\u7EDD", effects: { factionSat: fr("commoners", -10), stability: -3 }, aiWeight: 3 }] },
  { id: "evt_witch_hunt", title: "\u730E\u5DEB\u8FD0\u52A8", description: "\u6C11\u95F4\u6380\u8D77\u730E\u5DEB\u72C2\u6F6E\uFF01", category: "religion", trigger: { maxStability: 40 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u987A\u4ECE\u6C11\u610F", effects: { stability: 3, legitimacy: -3, population: -100 }, aiWeight: 2 }, { text: "\u7981\u6B62\u8FEB\u5BB3", effects: { stability: -5, factionSat: fr("clergy", -8) }, aiWeight: 3 }] },
  { id: "evt_diplomatic_envoy", title: "\u5916\u4EA4\u4F7F\u56E2", description: "\u4ED6\u56FD\u6D3E\u9063\u4F7F\u56E2\u6765\u8BBF\uFF01", category: "diplomacy", trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u9686\u91CD\u63A5\u5F85", effects: { gold: -40, legitimacy: 3, influence: 5 }, aiWeight: 3 }, { text: "\u51B7\u6DE1\u5E94\u5BF9", effects: { legitimacy: -2 }, aiWeight: 2 }] },
  { id: "evt_mint_debasement", title: "\u8D27\u5E01\u8D2C\u503C", description: "\u56FD\u5E93\u5403\u7D27\uFF0C\u6709\u4EBA\u5EFA\u8BAE\u94F8\u52A3\u5E01\uFF01", category: "economy", trigger: { minTurn: 10 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u94F8\u52A3\u5E01", effects: { gold: 150, corruption: 8, legitimacy: -8 }, aiWeight: 2 }, { text: "\u7EF4\u6301\u4FE1\u7528", effects: { legitimacy: 5 }, aiWeight: 3 }] },
  { id: "evt_wall_construction", title: "\u57CE\u5899\u4FEE\u5EFA", description: "\u8FB9\u5883\u7701\u4EFD\u8BF7\u6C42\u4FEE\u7B51\u57CE\u5899\uFF01", category: "economy", trigger: { minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u62E8\u6B3E\u4FEE\u5899", effects: { gold: -100, stability: 3, factionSat: fr("military", 5) }, aiWeight: 3 }, { text: "\u6682\u7F13", effects: { stability: -2 }, aiWeight: 2 }] },
  { id: "evt_scholar_exchange", title: "\u5B66\u8005\u4EA4\u6D41", description: "\u5F02\u56FD\u5B66\u8005\u524D\u6765\u4EA4\u6D41\uFF01", category: "science", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u70ED\u60C5\u63A5\u5F85", effects: { sciPt: 15, gold: -30 }, aiWeight: 3 }, { text: "\u8C28\u614E\u5BF9\u5F85", effects: { sciPt: 5 }, aiWeight: 2 }] },
  { id: "evt_granary_fire", title: "\u7CAE\u4ED3\u706B\u707E", description: "\u4E3B\u8981\u7CAE\u4ED3\u7A81\u53D1\u5927\u706B\uFF01", category: "crisis", trigger: { minTurn: 5 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u5168\u529B\u62A2\u6551", effects: { food: -80, gold: -30 }, aiWeight: 3 }, { text: "\u542C\u4E4B\u4EFB\u4E4B", effects: { food: -150, stability: -5 }, aiWeight: 1 }] },
  { id: "evt_naval_discovery", title: "\u822A\u6D77\u53D1\u73B0", description: "\u63A2\u9669\u8239\u961F\u53D1\u73B0\u65B0\u5C9B\u5C7F\uFF01", category: "science", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u5EFA\u7ACB\u636E\u70B9", effects: { gold: -100, influence: 10, food: 40 }, aiWeight: 3 }, { text: "\u53EA\u7ED8\u56FE\u8BB0\u5F55", effects: { sciPt: 10 }, aiWeight: 2 }] },
  { id: "evt_conscription_unrest", title: "\u5F81\u5175\u66B4\u52A8", description: "\u5F3A\u5236\u5F81\u5175\u5F15\u53D1\u6C11\u4F17\u6297\u8BAE\uFF01", category: "crisis", trigger: { minTurn: 5, atWar: true }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u575A\u6301\u5F81\u5175", effects: { stability: -8, factionSat: fra({ faction: "military", delta: 5 }, { faction: "commoners", delta: -12 }) }, aiWeight: 2 }, { text: "\u51CF\u5C11\u5F81\u5175", effects: { factionSat: fra({ faction: "commoners", delta: 8 }, { faction: "military", delta: -5 }) }, aiWeight: 3 }] },
  // ── B 扩展：35 个新事件，补齐 culture/population/opportunity 等 ──
  { id: "evt_culture_flourish", title: "\u6587\u6CBB\u9F0E\u76DB", description: "\u8BD7\u4EBA\u5B66\u8005\u4E91\u96C6\u4EAC\u757F\uFF0C\u6587\u8FD0\u660C\u9686\uFF01", category: "culture", trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u8BBE\u7ACB\u7FF0\u6797\u9662", effects: { gold: -80, sciPt: 20, legitimacy: 8, factionSat: fr("clergy", 15) }, aiWeight: 3 }, { text: "\u6C11\u95F4\u81EA\u6D41", effects: { sciPt: 5, stability: 3 }, aiWeight: 2 }] },
  { id: "evt_culture_patron", title: "\u827A\u5320\u6C42\u5E87", description: "\u540D\u5320\u5BFB\u6C42\u7687\u5BA4\u5E87\u62A4\uFF0C\u732E\u4E0A\u5947\u6280\uFF01", category: "culture", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u91CD\u91D1\u793C\u9047", effects: { gold: -60, influence: 5, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { influence: -2 }, aiWeight: 2 }] },
  { id: "evt_culture_renaissance", title: "\u6587\u827A\u590D\u5174", description: "\u53E4\u5178\u5B66\u672F\u590D\u5174\uFF0C\u65B0\u601D\u6F6E\u6D8C\u52A8\uFF01", category: "culture", trigger: { minTurn: 30, techLevelAbove: { branch: "admin", level: 3 } }, weight: 2, cooldown: 60, unique: true, options: [{ text: "\u5927\u529B\u5021\u5BFC", effects: { gold: -150, sciPt: 40, stability: 5, factionSat: fra({ faction: "clergy", delta: 20 }, { faction: "clergy", delta: -8 }) }, aiWeight: 3 }, { text: "\u987A\u5176\u81EA\u7136", effects: { sciPt: 15 }, aiWeight: 2 }] },
  { id: "evt_culture_ban", title: "\u5F02\u7AEF\u5B66\u8BF4", description: "\u65B0\u5947\u5B66\u8BF4\u6311\u6218\u4F20\u7EDF\uFF0C\u6559\u4F1A\u8981\u6C42\u67E5\u7981\uFF01", category: "culture", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u67E5\u7981\u5F02\u7AEF", effects: { stability: 3, sciPt: -10, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "clergy", delta: -15 }) }, aiWeight: 2 }, { text: "\u4FDD\u62A4\u5B66\u672F", effects: { stability: -4, sciPt: 15, factionSat: fr("clergy", -10) }, aiWeight: 3 }] },
  { id: "evt_culture_festival", title: "\u4E07\u56FD\u6765\u671D", description: "\u8BF8\u90A6\u9063\u4F7F\u671D\u8D3A\uFF0C\u56FD\u5A01\u8FDC\u626C\uFF01", category: "culture", trigger: { minTurn: 25, notAtWar: true, minStability: 60 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u76DB\u5178\u793C\u4E4B", effects: { gold: -120, legitimacy: 10, influence: 15 }, aiWeight: 3 }, { text: "\u7B80\u793C\u76F8\u5F85", effects: { legitimacy: 3, influence: 5 }, aiWeight: 2 }] },
  { id: "evt_pop_boom2", title: "\u4EBA\u4E01\u5174\u65FA", description: "\u8FDE\u5E74\u4E30\u7A14\uFF0C\u4EBA\u53E3\u6FC0\u589E\uFF01", category: "population", trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u9F13\u52B1\u751F\u80B2", effects: { food: -50, population: 200, stability: 3 }, aiWeight: 3 }, { text: "\u987A\u5176\u81EA\u7136", effects: { population: 100 }, aiWeight: 2 }] },
  { id: "evt_pop_migration", title: "\u6D41\u6C11\u6D8C\u5165", description: "\u90BB\u90A6\u6218\u4E71\uFF0C\u5927\u6279\u6D41\u6C11\u6D8C\u5165\u8FB9\u5883\uFF01", category: "population", trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u7F16\u6237\u9F50\u6C11", effects: { population: 150, food: -40, stability: -3, factionSat: fr("commoners", -5) }, aiWeight: 3 }, { text: "\u9A71\u9010\u51FA\u5883", effects: { influence: -5, stability: 2 }, aiWeight: 2 }] },
  { id: "evt_pop_urban", title: "\u57CE\u5E02\u81A8\u80C0", description: "\u90FD\u57CE\u4EBA\u53E3\u8FC7\u8F7D\uFF0C\u574A\u5E02\u62E5\u6324\uFF01", category: "population", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u6269\u5EFA\u57CE\u90ED", effects: { gold: -100, population: 100, stability: 3 }, aiWeight: 3 }, { text: "\u9650\u5236\u6D41\u5165", effects: { stability: -2, factionSat: fr("merchants", -8) }, aiWeight: 2 }] },
  { id: "evt_pop_plague_end", title: "\u75AB\u540E\u4F59\u751F", description: "\u5927\u75AB\u5E73\u606F\uFF0C\u5E78\u5B58\u8005\u4F11\u517B\u751F\u606F\uFF01", category: "population", trigger: { minTurn: 30, maxStability: 60 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u8F7B\u5FAD\u8584\u8D4B", effects: { gold: -30, population: 100, stability: 5, factionSat: fr("commoners", 10) }, aiWeight: 3 }, { text: "\u5E38\u6001\u6CBB\u7406", effects: { population: 50 }, aiWeight: 2 }] },
  { id: "evt_pop_labor_short", title: "\u52B3\u529B\u77ED\u7F3A", description: "\u6218\u4E71\u540E\u7530\u5730\u8352\u829C\uFF0C\u52B3\u529B\u532E\u4E4F\uFF01", category: "population", trigger: { minTurn: 15, atWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u62DB\u52DF\u6D41\u6C11", effects: { gold: -50, population: 80, food: 20 }, aiWeight: 3 }, { text: "\u5F3A\u5236\u5F81\u53D1", effects: { population: 50, stability: -5, factionSat: fr("commoners", -10) }, aiWeight: 1 }] },
  { id: "evt_opp_ancient_treasure", title: "\u53E4\u5893\u73B0\u5B9D", description: "\u519C\u592B\u6398\u51FA\u4E0A\u53E4\u5B9D\u85CF\uFF01", category: "opportunity", trigger: { minTurn: 10 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u5145\u516C\u56FD\u5E93", effects: { gold: 200, legitimacy: 3 }, aiWeight: 3 }, { text: "\u8D4F\u8D50\u519C\u592B", effects: { gold: 50, stability: 5, factionSat: fr("commoners", 8) }, aiWeight: 2 }] },
  { id: "evt_opp_strategic_location", title: "\u9669\u9698\u5F52\u9644", description: "\u8FB9\u5883\u9669\u9698\u5B88\u5C06\u732E\u5173\u6295\u8BDA\uFF01", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 2, cooldown: 60, unique: false, options: [{ text: "\u7EB3\u964D\u91CD\u8D4F", effects: { gold: -80, influence: 10, stability: 3 }, aiWeight: 3 }, { text: "\u8C28\u614E\u63A5\u7EB3", effects: { influence: 3 }, aiWeight: 2 }] },
  { id: "evt_opp_talent", title: "\u8D24\u624D\u6295\u6548", description: "\u5F02\u56FD\u540D\u58EB\u6155\u540D\u6765\u6295\uFF01", category: "opportunity", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u7834\u683C\u5F55\u7528", effects: { gold: -40, sciPt: 15, efficiency: 3 }, aiWeight: 3 }, { text: "\u8003\u5BDF\u540E\u7528", effects: { sciPt: 5 }, aiWeight: 2 }] },
  { id: "evt_opp_good_omen", title: "\u7965\u745E\u964D\u4E34", description: "\u5929\u73B0\u7965\u745E\uFF0C\u4E07\u6C11\u79F0\u5E86\uFF01", category: "opportunity", trigger: { minTurn: 20, notAtWar: true, minStability: 40 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u662D\u544A\u5929\u4E0B", effects: { legitimacy: 8, stability: 5, influence: 5 }, aiWeight: 3 }, { text: "\u79D8\u800C\u4E0D\u5BA3", effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: "evt_opp_trade_windfall", title: "\u5546\u8DEF\u66B4\u5229", description: "\u7F55\u89C1\u5546\u961F\u5E26\u6765\u5DE8\u989D\u5229\u6DA6\uFF01", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 2, cooldown: 45, unique: false, options: [{ text: "\u62BD\u53D6\u91CD\u7A0E", effects: { gold: 180, factionSat: fr("merchants", -5) }, aiWeight: 3 }, { text: "\u8F7B\u7A0E\u60E0\u6C11", effects: { gold: 80, factionSat: fr("merchants", 10) }, aiWeight: 2 }] },
  { id: "evt_opp_mercenary", title: "\u96C7\u4F63\u519B\u6765\u6295", description: "\u767E\u6218\u96C7\u4F63\u519B\u5BFB\u6C42\u6548\u547D\uFF01", category: "opportunity", trigger: { minTurn: 10, atWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u9AD8\u4EF7\u96C7\u4F63", effects: { gold: -100, factionSat: fr("military", 10) }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { stability: 2 }, aiWeight: 2 }] },
  { id: "evt_opp_dynastic_match", title: "\u8054\u59FB\u826F\u7F18", description: "\u5F3A\u56FD\u738B\u5BA4\u63D0\u8BAE\u8054\u59FB\uFF01", category: "opportunity", trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u6B23\u7136\u5141\u8BFA", effects: { gold: -60, influence: 15, legitimacy: 5 }, aiWeight: 3 }, { text: "\u5A49\u8A00\u8C22\u7EDD", effects: { influence: -3 }, aiWeight: 2 }] },
  { id: "evt_relig_heresy", title: "\u5F02\u7AEF\u8513\u5EF6", description: "\u5F02\u7AEF\u6559\u6D3E\u5728\u6C11\u95F4\u6269\u6563\uFF01", category: "religion", trigger: { minTurn: 20, maxStability: 60 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u5B97\u6559\u88C1\u5224", effects: { stability: 3, population: -50, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "commoners", delta: -10 }) }, aiWeight: 2 }, { text: "\u8FA9\u8BBA\u611F\u5316", effects: { sciPt: 8, stability: -2 }, aiWeight: 3 }] },
  { id: "evt_relig_temple_grant", title: "\u5BFA\u5E99\u8BF7\u7530", description: "\u5927\u5BFA\u8BF7\u6C42\u8D50\u7530\u517B\u50E7\uFF01", category: "religion", trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u6177\u6168\u8D50\u7530", effects: { gold: -50, food: -30, legitimacy: 5, factionSat: fr("clergy", 15) }, aiWeight: 2 }, { text: "\u9650\u7530\u6291\u5BFA", effects: { factionSat: fra({ faction: "clergy", delta: -12 }, { faction: "nobles", delta: 5 }) }, aiWeight: 3 }] },
  { id: "evt_relig_pilgrimage", title: "\u671D\u5723\u70ED\u6F6E", description: "\u4FE1\u4F17\u6380\u8D77\u671D\u5723\u70ED\u6F6E\uFF01", category: "religion", trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5B98\u65B9\u62A4\u6301", effects: { gold: -40, legitimacy: 5, influence: 3, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u6C11\u95F4\u81EA\u7406", effects: { stability: 2 }, aiWeight: 2 }] },
  { id: "evt_relig_schism", title: "\u6559\u6D3E\u5206\u88C2", description: "\u5B97\u6559\u5185\u90E8\u7206\u53D1\u6559\u4E49\u4E4B\u4E89\uFF01", category: "religion", trigger: { minTurn: 30 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u652F\u6301\u6B63\u7EDF", effects: { stability: 3, factionSat: fra({ faction: "clergy", delta: 10 }, { faction: "commoners", delta: -5 }) }, aiWeight: 2 }, { text: "\u4FDD\u6301\u4E2D\u7ACB", effects: { stability: -3, factionSat: fr("clergy", -8) }, aiWeight: 3 }] },
  { id: "evt_relig_conversion", title: "\u5F02\u6559\u5F52\u5316", description: "\u8FB9\u5883\u5F02\u6559\u90E8\u843D\u8BF7\u6C42\u5F52\u5316\uFF01", category: "religion", trigger: { minTurn: 15, hasNewTerritory: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u9686\u91CD\u53D7\u793C", effects: { gold: -30, legitimacy: 5, stability: 3, factionSat: fr("clergy", 12) }, aiWeight: 3 }, { text: "\u56E0\u4FD7\u800C\u6CBB", effects: { stability: 2, factionSat: fr("clergy", -5) }, aiWeight: 2 }] },
  { id: "evt_sci_astronomy", title: "\u5929\u6587\u5F02\u8C61", description: "\u5BA2\u661F\u663C\u89C1\uFF0C\u53F8\u5929\u76D1\u8BF7\u89E3\uFF01", category: "science", trigger: { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8BE6\u8BB0\u89C2\u6D4B", effects: { sciPt: 20, gold: -20 }, aiWeight: 3 }, { text: "\u89C6\u4E3A\u5929\u8C34", effects: { stability: -3, legitimacy: -3, factionSat: fr("clergy", 8) }, aiWeight: 1 }] },
  { id: "evt_sci_invention", title: "\u5DE7\u5320\u732E\u5668", description: "\u5DE5\u5320\u53D1\u660E\u65B0\u5F0F\u5668\u68B0\uFF01", category: "science", trigger: { minTurn: 20, techLevelAbove: { branch: "agri", level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u63A8\u5E7F\u6C11\u7528", effects: { gold: -60, food: 30, sciPt: 10 }, aiWeight: 3 }, { text: "\u519B\u7528\u4FDD\u5BC6", effects: { gold: -40, factionSat: fr("military", 8) }, aiWeight: 2 }] },
  { id: "evt_sci_academy", title: "\u5B66\u9662\u7B79\u5EFA", description: "\u5B66\u8005\u8BF7\u6C42\u8BBE\u7ACB\u7687\u5BB6\u5B66\u9662\uFF01", category: "science", trigger: { minTurn: 25, techLevelAbove: { branch: "admin", level: 3 } }, weight: 2, cooldown: 60, unique: true, options: [{ text: "\u62E8\u6B3E\u5174\u5EFA", effects: { gold: -200, sciPt: 50, efficiency: 5, factionSat: fr("clergy", 20) }, aiWeight: 3 }, { text: "\u6682\u7F13", effects: { factionSat: fr("clergy", -8) }, aiWeight: 2 }] },
  { id: "evt_sci_translation", title: "\u8BD1\u7ECF\u8FD0\u52A8", description: "\u5F02\u57DF\u5178\u7C4D\u4F20\u5165\uFF0C\u8BF7\u65E8\u7FFB\u8BD1\uFF01", category: "science", trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8BBE\u8BD1\u573A", effects: { gold: -80, sciPt: 25, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "clergy", delta: 5 }) }, aiWeight: 3 }, { text: "\u6C11\u95F4\u81EA\u8BD1", effects: { sciPt: 8 }, aiWeight: 2 }] },
  { id: "evt_dip_alliance_proposal", title: "\u7ED3\u76DF\u4E4B\u8BAE", description: "\u5F3A\u56FD\u4E3B\u52A8\u63D0\u8BAE\u7ED3\u76DF\uFF01", category: "diplomacy", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u6B23\u7136\u7ED3\u76DF", effects: { influence: 10, legitimacy: 3, gold: -30 }, aiWeight: 3 }, { text: "\u4FDD\u6301\u72EC\u7ACB", effects: { influence: -2 }, aiWeight: 2 }] },
  { id: "evt_dip_hostage", title: "\u8D28\u5B50\u4E4B\u7EA6", description: "\u90BB\u56FD\u63D0\u8BAE\u4E92\u9001\u8D28\u5B50\u4EE5\u56FA\u76DF\u7EA6\uFF01", category: "diplomacy", trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u63A5\u53D7", effects: { influence: 8, legitimacy: -3, stability: -2 }, aiWeight: 2 }, { text: "\u62D2\u7EDD", effects: { influence: -5 }, aiWeight: 3 }] },
  { id: "evt_dip_trade_embassy", title: "\u901A\u5546\u4F7F\u56E2", description: "\u8FDC\u65B9\u56FD\u5EA6\u9063\u901A\u5546\u4F7F\u56E2\uFF01", category: "diplomacy", trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u7B7E\u8BA2\u6761\u7EA6", effects: { gold: 80, influence: 5, factionSat: fr("merchants", 12) }, aiWeight: 3 }, { text: "\u89C2\u671B", effects: { influence: 2 }, aiWeight: 2 }] },
  { id: "evt_dip_border_incident", title: "\u8FB9\u5883\u4E8B\u4EF6", description: "\u8FB9\u519B\u8BEF\u5165\u90BB\u90A6\u5F15\u53D1\u7EA0\u7EB7\uFF01", category: "diplomacy", trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u9063\u4F7F\u81F4\u6B49", effects: { gold: -30, influence: 3 }, aiWeight: 3 }, { text: "\u5F3A\u786C\u7ACB\u573A", effects: { influence: -5, stability: 3, factionSat: fr("military", 8) }, aiWeight: 2 }] },
  { id: "evt_dip_refugee_crisis", title: "\u96BE\u6C11\u6F6E", description: "\u90BB\u90A6\u5185\u4E71\uFF0C\u96BE\u6C11\u6D8C\u5165\uFF01", category: "diplomacy", trigger: { minTurn: 20 }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u8BBE\u8425\u5B89\u7F6E", effects: { gold: -80, food: -40, population: 100, influence: 8 }, aiWeight: 3 }, { text: "\u5C01\u95ED\u8FB9\u5883", effects: { influence: -8, stability: 2 }, aiWeight: 2 }] },
  { id: "evt_mil_traitor", title: "\u53DB\u5C06\u6295\u654C", description: "\u8FB9\u5173\u5B88\u5C06\u53DB\u9003\u654C\u56FD\uFF01", category: "military", trigger: { minTurn: 15, maxStability: 60 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u60AC\u8D4F\u7F09\u62FF", effects: { gold: -50, influence: 3, factionSat: fr("military", 5) }, aiWeight: 3 }, { text: "\u7533\u65A5\u8FB9\u9547", effects: { stability: -5, factionSat: fr("military", -8) }, aiWeight: 2 }] },
  { id: "evt_mil_victory_parade", title: "\u51EF\u65CB\u732E\u4FD8", description: "\u5927\u519B\u51EF\u65CB\uFF0C\u8BF7\u884C\u732E\u4FD8\u793C\uFF01", category: "military", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u9686\u91CD\u732E\u4FD8", effects: { gold: -40, legitimacy: 8, factionSat: fr("military", 15) }, aiWeight: 3 }, { text: "\u4F4E\u8C03\u5904\u7F6E", effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: "evt_mil_supply_line", title: "\u7CAE\u9053\u88AB\u65AD", description: "\u654C\u519B\u88AD\u6270\u7CAE\u9053\uFF0C\u524D\u7EBF\u544A\u6025\uFF01", category: "military", trigger: { minTurn: 10, atWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u91CD\u5175\u62A4\u7CAE", effects: { gold: -80, food: -30, factionSat: fr("military", 8) }, aiWeight: 3 }, { text: "\u5C31\u5730\u5F81\u7CAE", effects: { food: 20, stability: -8, factionSat: fr("commoners", -15) }, aiWeight: 1 }] },
  { id: "evt_mil_defection", title: "\u654C\u5C06\u6765\u6295", description: "\u654C\u56FD\u540D\u5C06\u7387\u90E8\u6765\u964D\uFF01", category: "military", trigger: { minTurn: 15, atWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u539A\u793C\u63A5\u7EB3", effects: { gold: -60, factionSat: fr("military", 12), influence: 5 }, aiWeight: 3 }, { text: "\u7591\u800C\u4E0D\u7528", effects: { stability: -2 }, aiWeight: 2 }] },
  { id: "evt_mil_fortress_siege", title: "\u5B64\u57CE\u6B7B\u5B88", description: "\u8FB9\u57CE\u88AB\u56F4\uFF0C\u5B88\u5C06\u8BF7\u63F4\uFF01", category: "military", trigger: { minTurn: 12, atWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u503E\u56FD\u9A70\u63F4", effects: { gold: -100, food: -50, factionSat: fr("military", 10) }, aiWeight: 3 }, { text: "\u5F03\u8F66\u4FDD\u5E05", effects: { stability: -10, legitimacy: -5, factionSat: fr("military", -12) }, aiWeight: 1 }] },
  { id: "evt_mil_weapon_upgrade", title: "\u519B\u68B0\u9769\u65B0", description: "\u5DE5\u574A\u732E\u4E0A\u65B0\u5F0F\u5175\u5668\uFF01", category: "military", trigger: { minTurn: 20, techLevelAbove: { branch: "mil", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u5168\u519B\u6362\u88C5", effects: { gold: -150, factionSat: fr("military", 15) }, aiWeight: 3 }, { text: "\u5C40\u90E8\u8BD5\u7528", effects: { gold: -50, factionSat: fr("military", 5) }, aiWeight: 2 }] },
  // ── C1 事件链（3 条链 × 3 事件 = 9 事件）──
  // 链 1：瘟疫链——爆发→蔓延→余波
  { id: "evt_chain_plague_1", title: "\u761F\u75AB\u7206\u53D1", description: "\u8FB9\u9547\u7A81\u53D1\u602A\u75C5\uFF0C\u6B7B\u8005\u751A\u4F17\uFF01\u592A\u533B\u8BF7\u65E8\u5904\u7F6E\u3002", category: "crisis", trigger: { minTurn: 15, maxFoodRatio: 0.8 }, weight: 4, cooldown: 60, unique: false, options: [
    { text: "\u5C01\u9501\u75AB\u533A", effects: { stability: -5, population: -100, triggerEvent: "evt_chain_plague_2" }, aiWeight: 3 },
    { text: "\u8BF7\u795E\u7948\u798F", effects: { gold: -50, stability: 3, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_plague_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_plague_2", title: "\u761F\u75AB\u8513\u5EF6", description: "\u75AB\u75C5\u8513\u5EF6\u81F3\u4EAC\u757F\uFF0C\u4EBA\u5FC3\u60F6\u60F6\uFF01", category: "crisis", trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u9694\u79BB\u6551\u6CBB", effects: { gold: -120, population: -200, stability: -3, triggerEvent: "evt_chain_plague_3" }, aiWeight: 3 },
    { text: "\u5F03\u57CE\u907F\u75AB", effects: { gold: -30, stability: -15, legitimacy: -10, population: -150, triggerEvent: "evt_chain_plague_3" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_plague_3", title: "\u761F\u75AB\u4F59\u6CE2", description: "\u75AB\u75C5\u7EC8\u4E8E\u5E73\u606F\uFF0C\u4F46\u6C11\u751F\u51CB\u655D\uFF0C\u8BF7\u65E8\u5584\u540E\u3002", category: "crisis", trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u51CF\u514D\u8D4B\u7A0E", effects: { gold: -80, stability: 8, factionSat: fr("commoners", 15), legitimacy: 5 }, aiWeight: 3 },
    { text: "\u5982\u5E38\u5F81\u8D4B", effects: { stability: -5, factionSat: fr("commoners", -12) }, aiWeight: 2 }
  ] },
  // 链 2：王位继承链——储君薨→争夺→新朝
  { id: "evt_chain_heir_1", title: "\u50A8\u541B\u66B4\u85A8", description: "\u592A\u5B50\u65E0\u75BE\u800C\u7EC8\uFF01\u8BF8\u7687\u5B50\u6697\u4E2D\u4E89\u4F4D\u3002", category: "politics", trigger: { minTurn: 20, maxLegitimacy: 70 }, weight: 3, cooldown: 80, unique: false, options: [
    { text: "\u7ACB\u6B21\u5B50\u4E3A\u50A8", effects: { legitimacy: -5, stability: -3, triggerEvent: "evt_chain_heir_2" }, aiWeight: 3 },
    { text: "\u6682\u4E0D\u7ACB\u50A8", effects: { legitimacy: -10, stability: -8, factionSat: fr("nobles", -8), triggerEvent: "evt_chain_heir_2" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_heir_2", title: "\u593A\u4F4D\u4E4B\u4E89", description: "\u8BF8\u7687\u5B50\u660E\u4E89\u6697\u6597\uFF0C\u671D\u81E3\u5404\u7ACB\u5176\u4E3B\uFF01", category: "politics", trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5F3A\u7ACB\u4E00\u7CFB", effects: { gold: -100, legitimacy: 5, stability: -5, factionSat: fr("nobles", -10), triggerEvent: "evt_chain_heir_3" }, aiWeight: 2 },
    { text: "\u5EF7\u8BAE\u516C\u63A8", effects: { gold: -50, legitimacy: 8, stability: 3, efficiency: -3, triggerEvent: "evt_chain_heir_3" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_heir_3", title: "\u65B0\u50A8\u5373\u4F4D", description: "\u65B0\u50A8\u767B\u57FA\uFF0C\u5927\u8D66\u5929\u4E0B\u4EE5\u56FA\u4F4D\u3002", category: "politics", trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u5927\u8D66\u5929\u4E0B", effects: { gold: -60, legitimacy: 15, stability: 10, factionSat: fra({ faction: "commoners", delta: 12 }, { faction: "nobles", delta: 5 }) }, aiWeight: 3 },
    { text: "\u4F4E\u8C03\u5373\u4F4D", effects: { legitimacy: 5, stability: 2 }, aiWeight: 2 },
    // P3 继承链内战结局——强压异议触发宗室起兵
    { text: "\u5F3A\u538B\u5F02\u8BAE", effects: { legitimacy: -10, stability: -8, factionSat: fr("military", 15), triggerEvent: "evt_chain_heir_civil" }, aiWeight: 1 }
  ] },
  // P3 继承链内战结局——宗室起兵→决战→新朝或割据
  { id: "evt_chain_heir_civil", title: "\u5B97\u5BA4\u8D77\u5175", description: "\u4E0D\u6EE1\u65B0\u50A8\u7684\u5B97\u5BA4\u85E9\u9547\u4E3E\u5175\u5411\u9619\uFF01\u5929\u4E0B\u9707\u52A8\uFF0C\u793E\u7A37\u5371\u6B86\uFF01", category: "crisis", trigger: { minTurn: 20, maxLegitimacy: 50 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5FA1\u9A7E\u4EB2\u5F81", effects: { gold: -200, stability: -10, legitimacy: 8, factionSat: fra({ faction: "military", delta: 20 }, { faction: "commoners", delta: -15 }), triggerEvent: "evt_chain_heir_civil_2" }, aiWeight: 2 },
    { text: "\u5272\u5730\u5B89\u629A", effects: { gold: -100, stability: 5, legitimacy: -15, influence: -10, factionSat: fr("nobles", 10), triggerEvent: "evt_chain_heir_civil_2" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_heir_civil_2", title: "\u5185\u6218\u7EC8\u5C40", description: "\u53DB\u4E71\u5E73\u5B9A\u6216\u5272\u636E\u6210\u5B9A\u5C40\uFF0C\u65B0\u671D\u683C\u5C40\u5DF2\u6210\u3002", category: "politics", trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u91CD\u6574\u5C71\u6CB3", effects: { gold: -150, stability: 15, legitimacy: 20, efficiency: 5, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "nobles", delta: -8 }) }, aiWeight: 3 },
    { text: "\u9ED8\u8BB8\u5272\u636E", effects: { stability: -20, legitimacy: -25, corruption: 10, factionSat: fr("nobles", 15) }, aiWeight: 1 }
  ] },
  // 链 3：边境冲突链——摩擦→升级→议和
  { id: "evt_chain_border_1", title: "\u8FB9\u6C11\u51B2\u7A81", description: "\u8FB9\u6C11\u8D8A\u754C\u8015\u7267\uFF0C\u4E0E\u90BB\u90A6\u8D77\u4E89\u6267\uFF01", category: "diplomacy", trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 50, unique: false, options: [
    { text: "\u9063\u4F7F\u4EA4\u6D89", effects: { gold: -20, influence: 3, triggerEvent: "evt_chain_border_2" }, aiWeight: 3 },
    { text: "\u5F3A\u786C\u9A71\u8D76", effects: { influence: -3, stability: 2, factionSat: fr("military", 8), triggerEvent: "evt_chain_border_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_border_2", title: "\u8FB9\u519B\u5BF9\u5CD9", description: "\u53CC\u65B9\u8FB9\u519B\u5BF9\u5CD9\uFF0C\u5251\u62D4\u5F29\u5F20\uFF01", category: "diplomacy", trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u4E3B\u52A8\u64A4\u519B", effects: { influence: -5, stability: 3, triggerEvent: "evt_chain_border_3" }, aiWeight: 3 },
    { text: "\u589E\u5175\u65BD\u538B", effects: { gold: -80, factionSat: fr("military", 12), influence: 2, stability: -2, triggerEvent: "evt_chain_border_3" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_border_3", title: "\u8FB9\u5883\u8BAE\u548C", description: "\u53CC\u65B9\u9063\u4F7F\u8BAE\u548C\uFF0C\u91CD\u5B9A\u7586\u754C\u3002", category: "diplomacy", trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u7F14\u7ED3\u548C\u7EA6", effects: { gold: -40, influence: 8, legitimacy: 3, stability: 5 }, aiWeight: 3 },
    { text: "\u6682\u7F6E\u4E0D\u8BAE", effects: { stability: -2, influence: -2 }, aiWeight: 2 }
  ] },
  // ── E15 扩展事件链（2 条 × 3 事件 = 6 事件）──
  // 链 4：旱灾链——大旱→饥荒→流民
  { id: "evt_chain_drought_1", title: "\u8D64\u5730\u5343\u91CC", description: "\u8FDE\u6708\u4E0D\u96E8\uFF0C\u79BE\u82D7\u67AF\u7126\uFF0C\u8D64\u5730\u5343\u91CC\uFF01\u592A\u53F2\u594F\u65F1\u3002", category: "crisis", trigger: { minTurn: 8, maxFoodRatio: 0.9 }, weight: 5, cooldown: 70, unique: false, options: [
    { text: "\u5F00\u4ED3\u8D48\u707E", effects: { food: -120, stability: 5, factionSat: fr("commoners", 8), triggerEvent: "evt_chain_drought_2" }, aiWeight: 3 },
    { text: "\u7948\u96E8\u796D\u5929", effects: { gold: -60, legitimacy: 3, stability: 2, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_drought_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_drought_2", title: "\u9965\u8352\u8513\u5EF6", description: "\u7CAE\u4EF7\u98DE\u6DA8\uFF0C\u997F\u6B8D\u904D\u91CE\uFF0C\u9965\u6C11\u805A\u4F17\u6C42\u98DF\uFF01", category: "crisis", trigger: { minTurn: 8 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5F3A\u5236\u5E73\u7C9C", effects: { gold: -100, stability: 3, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "merchants", delta: -15 }), triggerEvent: "evt_chain_drought_3" }, aiWeight: 3 },
    { text: "\u653E\u4EFB\u7CAE\u4EF7", effects: { population: -300, stability: -10, factionSat: fr("commoners", -20), triggerEvent: "evt_chain_drought_3" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_drought_3", title: "\u6D41\u6C11\u56DB\u6563", description: "\u707E\u6C11\u80CC\u4E95\u79BB\u4E61\uFF0C\u6D41\u6C11\u6F6E\u5E2D\u5377\u8BF8\u7701\uFF01", category: "crisis", trigger: { minTurn: 8 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u7F16\u6237\u5B89\u7F6E", effects: { gold: -80, food: -40, stability: 8, population: 200, factionSat: fr("commoners", 12) }, aiWeight: 3 },
    { text: "\u9063\u6563\u56DE\u4E61", effects: { population: -150, stability: -5, legitimacy: -5 }, aiWeight: 2 }
  ] },
  // 链 5：盛世衰落链——奢靡→乱政→中兴
  { id: "evt_chain_decline_1", title: "\u5962\u9761\u4E4B\u98CE", description: "\u5BAB\u5EF7\u5962\u9761\uFF0C\u6743\u8D35\u6597\u5BCC\uFF0C\u6C11\u98CE\u6E10\u6D6E\uFF01", category: "politics", trigger: { minTurn: 25, minStability: 50, minGold: 500 }, weight: 3, cooldown: 100, unique: false, options: [
    { text: "\u63D0\u5021\u8282\u4FED", effects: { stability: 5, legitimacy: 5, factionSat: fr("nobles", -10), triggerEvent: "evt_chain_decline_2" }, aiWeight: 3 },
    { text: "\u7EB5\u5BB9\u6D6E\u534E", effects: { gold: -100, corruption: 8, stability: -3, factionSat: fr("nobles", 12), triggerEvent: "evt_chain_decline_2" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_decline_2", title: "\u540F\u6CBB\u8D25\u574F", description: "\u8D2A\u58A8\u6A2A\u884C\uFF0C\u653F\u4EE4\u4E0D\u51FA\u4EAC\u757F\uFF0C\u884C\u653F\u762B\u75EA\uFF01", category: "politics", trigger: { minTurn: 25, minCorruption: 40 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u4E25\u60E9\u8D2A\u540F", effects: { gold: -120, corruption: -10, stability: -5, factionSat: fr("nobles", -15), triggerEvent: "evt_chain_decline_3" }, aiWeight: 3 },
    { text: "\u5F97\u8FC7\u4E14\u8FC7", effects: { corruption: 5, efficiency: -5, legitimacy: -8, triggerEvent: "evt_chain_decline_3" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_decline_3", title: "\u4E2D\u5174\u4E4B\u673A", description: "\u4E71\u8C61\u6BD5\u9732\uFF0C\u671D\u91CE\u547C\u5401\u6539\u9769\u56FE\u5F3A\uFF01", category: "opportunity", trigger: { minTurn: 25 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u529B\u884C\u65B0\u653F", effects: { gold: -200, stability: -8, legitimacy: 15, efficiency: 8, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -10 }) }, aiWeight: 3 },
    { text: "\u5F90\u56FE\u6574\u987F", effects: { gold: -80, stability: 3, efficiency: 3, legitimacy: 5 }, aiWeight: 2 }
  ] },
  // ── E15 王朝继位玩家干预事件（dynasty 引擎触发）──
  { id: "evt_dynasty_heir_birth", title: "\u50A8\u541B\u964D\u751F", description: "\u540E\u5BAB\u8BDE\u4E0B\u9F99\u88D4\uFF0C\u4E3E\u56FD\u6B22\u5E86\uFF01\u8BF7\u5B9A\u50A8\u541B\u4E4B\u540D\u3002", category: "politics", trigger: { minTurn: 1 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u7ACB\u4E3A\u50A8\u541B", effects: { legitimacy: 10, stability: 5, factionSat: fr("nobles", 12) }, aiWeight: 3 },
    { text: "\u6682\u4E0D\u7ACB\u50A8", effects: { legitimacy: -3, stability: -2, factionSat: fr("nobles", -8) }, aiWeight: 1 }
  ] },
  { id: "evt_dynasty_ruler_decline", title: "\u541B\u738B\u8001\u8FC8", description: "\u4E3B\u6625\u79CB\u5E74\u8FC8\uFF0C\u7CBE\u529B\u6E10\u8870\uFF0C\u671D\u81E3\u8BF7\u9884\u7ACB\u50A8\u4EE5\u56FA\u56FD\u672C\u3002", category: "politics", trigger: { minTurn: 30 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u7985\u8BA9\u50A8\u541B", effects: { legitimacy: 5, stability: 8, factionSat: fr("nobles", 10) }, aiWeight: 3 },
    { text: "\u52C9\u529B\u89C6\u671D", effects: { stability: -3, legitimacy: -5, factionSat: fr("nobles", -5) }, aiWeight: 2 }
  ] },
  // ── P3 扩展事件链 6-9 + 独立事件（目标 150+）──
  // 链 6：科技突破链——灵感→试验→应用或事故
  { id: "evt_chain_tech_1", title: "\u5F02\u8C61\u542F\u601D", description: "\u591C\u89C2\u661F\u8C61\uFF0C\u5B66\u8005\u5FFD\u5F97\u7075\u611F\uFF0C\u79F0\u53EF\u9769\u65B0\u519C\u5177\uFF01", category: "science", trigger: { minTurn: 12, techLevelAbove: { branch: "agri", level: 1 } }, weight: 4, cooldown: 80, unique: false, options: [
    { text: "\u62E8\u91D1\u8D44\u52A9", effects: { gold: -80, sciPt: 10, factionSat: fr("clergy", -5), triggerEvent: "evt_chain_tech_2" }, aiWeight: 3 },
    { text: "\u89C2\u5176\u81EA\u6210", effects: { sciPt: 3, triggerEvent: "evt_chain_tech_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_tech_2", title: "\u5DE5\u574A\u8BD5\u9A8C", description: "\u5B66\u8005\u4E8E\u5DE5\u574A\u4E2D\u53CD\u590D\u8BD5\u9A8C\uFF0C\u6210\u8D25\u53C2\u534A\uFF01", category: "science", trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u8FFD\u52A0\u6295\u5165", effects: { gold: -120, sciPt: 8, efficiency: 3, triggerEvent: "evt_chain_tech_3" }, aiWeight: 3 },
    { text: "\u8C28\u614E\u63A8\u8FDB", effects: { gold: -40, sciPt: 4, triggerEvent: "evt_chain_tech_3" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_tech_3", title: "\u9769\u65B0\u95EE\u4E16", description: "\u65B0\u519C\u5177\u95EE\u4E16\uFF0C\u7CAE\u4EA7\u53EF\u671F\uFF01\u7136\u65E7\u5320\u62B5\u5236\u65B0\u6280\u672F\u3002", category: "opportunity", trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u5168\u9762\u63A8\u5E7F", effects: { gold: -60, food: 80, factionSat: fra({ faction: "commoners", delta: 12 }, { faction: "nobles", delta: -8 }) }, aiWeight: 3 },
    { text: "\u7F13\u6162\u6E17\u900F", effects: { food: 30, sciPt: 5 }, aiWeight: 2 }
  ] },
  // 链 7：文化输入链——异邦艺术→风靡→本土化或文化冲突
  { id: "evt_chain_culture_1", title: "\u5F02\u90A6\u732E\u827A", description: "\u5F02\u90A6\u4F7F\u56E2\u732E\u4E0A\u5947\u73CD\u4E50\u821E\uFF0C\u671D\u91CE\u4E3A\u4E4B\u503E\u5012\uFF01", category: "culture", trigger: { minTurn: 15, notAtWar: true }, weight: 4, cooldown: 90, unique: false, options: [
    { text: "\u76DB\u60C5\u63A5\u7EB3", effects: { gold: -40, influence: 5, legitimacy: 3, triggerEvent: "evt_chain_culture_2" }, aiWeight: 3 },
    { text: "\u8C28\u614E\u89C2\u8D4F", effects: { influence: 2, triggerEvent: "evt_chain_culture_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_culture_2", title: "\u98CE\u5C1A\u98CE\u9761", description: "\u5F02\u90A6\u827A\u672F\u5728\u4E0A\u6D41\u793E\u4F1A\u98CE\u9761\uFF0C\u672C\u571F\u827A\u4EBA\u6297\u8BAE\u58F0\u8D77\uFF01", category: "culture", trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u63D0\u5021\u878D\u5408", effects: { gold: -60, influence: 8, factionSat: fr("clergy", -8), triggerEvent: "evt_chain_culture_3" }, aiWeight: 3 },
    { text: "\u538B\u5236\u5F02\u98CE", effects: { influence: -5, stability: 3, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_culture_3" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_culture_3", title: "\u6587\u5316\u5B9A\u8C03", description: "\u98CE\u6C14\u4E4B\u4E89\u7EC8\u6709\u5B9A\u8BBA\uFF0C\u5E1D\u56FD\u6587\u5316\u8D70\u5411\u4F55\u65B9\uFF1F", category: "culture", trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u517C\u5BB9\u5E76\u84C4", effects: { gold: -80, influence: 12, legitimacy: 8, assimilationMod: 1 }, aiWeight: 3 },
    { text: "\u56FA\u5B88\u6B63\u7EDF", effects: { legitimacy: 5, influence: -3, factionSat: fr("clergy", 15) }, aiWeight: 2 }
  ] },
  // 链 8：联盟瓦解链——盟国生疑→摩擦→决裂或修复
  { id: "evt_chain_alliance_1", title: "\u76DF\u56FD\u751F\u7591", description: "\u76DF\u56FD\u4F7F\u81E3\u65C1\u6572\u4FA7\u51FB\uFF0C\u7591\u4F60\u6709\u80CC\u76DF\u4E4B\u610F\uFF01", category: "diplomacy", trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 70, unique: false, options: [
    { text: "\u9063\u4F7F\u91CD\u7533\u76DF\u7EA6", effects: { gold: -50, influence: 5, triggerEvent: "evt_chain_alliance_2" }, aiWeight: 3 },
    { text: "\u7F6E\u4E4B\u4E0D\u7406", effects: { influence: -8, stability: 2, triggerEvent: "evt_chain_alliance_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_alliance_2", title: "\u8FB9\u5883\u6469\u64E6", description: "\u76DF\u56FD\u8FB9\u519B\u4E0E\u5DF1\u65B9\u5546\u961F\u53D1\u751F\u6469\u64E6\uFF01", category: "diplomacy", trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u8D54\u793C\u9053\u6B49", effects: { gold: -80, influence: 3, legitimacy: -3, triggerEvent: "evt_chain_alliance_3" }, aiWeight: 3 },
    { text: "\u5F3A\u786C\u7D22\u8D54", effects: { gold: 30, influence: -10, factionSat: fr("military", 8), triggerEvent: "evt_chain_alliance_3" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_alliance_3", title: "\u76DF\u7EA6\u6289\u62E9", description: "\u76DF\u56FD\u9012\u4EA4\u6700\u540E\u901A\u7252\uFF0C\u662F\u548C\u662F\u88C2\uFF1F", category: "diplomacy", trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u4FEE\u590D\u76DF\u7EA6", effects: { gold: -100, influence: 10, legitimacy: 5, factionSat: fr("merchants", 8) }, aiWeight: 3 },
    { text: "\u542C\u4EFB\u51B3\u88C2", effects: { influence: -15, stability: 5, factionSat: fr("military", 12) }, aiWeight: 2 }
  ] },
  // 链 9：移民潮链——流民入境→安置压力→同化或排斥
  { id: "evt_chain_migrate_1", title: "\u6D41\u6C11\u53E9\u8FB9", description: "\u90BB\u90A6\u5927\u4E71\uFF0C\u6570\u4E07\u6D41\u6C11\u53E9\u5173\u6C42\u9644\uFF01", category: "population", trigger: { minTurn: 12 }, weight: 5, cooldown: 80, unique: false, options: [
    { text: "\u5F00\u5173\u7EB3\u4E4B", effects: { food: -80, population: 400, stability: -3, triggerEvent: "evt_chain_migrate_2" }, aiWeight: 2 },
    { text: "\u95ED\u5173\u62D2\u4E4B", effects: { legitimacy: -5, influence: -3, factionSat: fr("commoners", 5), triggerEvent: "evt_chain_migrate_2" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_migrate_2", title: "\u5B89\u7F6E\u4E4B\u56F0", description: "\u6D41\u6C11\u805A\u5C45\u8FB9\u7701\uFF0C\u4E0E\u672C\u5730\u6C11\u4F17\u4E89\u7530\u4E89\u6C34\uFF01", category: "population", trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u7F16\u6237\u9F50\u6C11", effects: { gold: -100, food: -40, population: 200, efficiency: 3, triggerEvent: "evt_chain_migrate_3" }, aiWeight: 3 },
    { text: "\u8BBE\u6805\u9694\u79BB", effects: { gold: -30, stability: -5, factionSat: fr("commoners", -10), triggerEvent: "evt_chain_migrate_3" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_migrate_3", title: "\u878D\u5408\u6216\u6392\u65A5", description: "\u6D41\u6C11\u95EE\u9898\u7EC8\u987B\u89E3\u51B3\uFF0C\u5E1D\u56FD\u5305\u5BB9\u6027\u9762\u4E34\u8003\u9A8C\u3002", category: "population", trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: "\u4E00\u89C6\u540C\u4EC1", effects: { gold: -60, population: 150, influence: 8, assimilationMod: 1, factionSat: fr("commoners", 8) }, aiWeight: 3 },
    { text: "\u533A\u522B\u5BF9\u5F85", effects: { stability: -8, corruption: 5, factionSat: fr("nobles", 8) }, aiWeight: 2 }
  ] },
  // ── 独立事件扩展（覆盖 science/culture/population/diplomacy 稀缺分类）──
  { id: "evt_library_fire", title: "\u5B66\u9662\u5931\u706B", description: "\u7687\u5BB6\u5B66\u9662\u6DF1\u591C\u5931\u706B\uFF0C\u5178\u7C4D\u4ED8\u4E4B\u4E00\u70AC\uFF01", category: "science", trigger: { minTurn: 10, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u5168\u529B\u62A2\u6551", effects: { gold: -100, sciPt: -10, stability: 3 }, aiWeight: 3 }, { text: "\u542C\u4E4B\u4EFB\u4E4B", effects: { sciPt: -25, legitimacy: -5 }, aiWeight: 2 }] },
  { id: "evt_scientist_defect", title: "\u5B66\u8005\u6295\u5954", description: "\u5F02\u90A6\u77E5\u540D\u5B66\u8005\u8BF7\u6C42\u653F\u6CBB\u5E87\u62A4\uFF01", category: "science", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u63A5\u7EB3\u91CD\u7528", effects: { gold: 50, sciPt: 20, influence: -3 }, aiWeight: 3 }, { text: "\u5A49\u62D2\u9063\u8FD4", effects: { influence: 5, legitimacy: 3 }, aiWeight: 2 }] },
  { id: "evt_alchemy_craze", title: "\u70BC\u91D1\u72C2\u70ED", description: "\u5BAB\u5EF7\u5174\u8D77\u70BC\u91D1\u70ED\u6F6E\uFF0C\u65B9\u58EB\u58F0\u79F0\u80FD\u70B9\u77F3\u6210\u91D1\uFF01", category: "science", trigger: { minTurn: 15 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u8D44\u52A9\u8BD5\u9A8C", effects: { gold: -150, corruption: 5, factionSat: fr("clergy", -10) }, aiWeight: 2 }, { text: "\u65A5\u4E3A\u90AA\u672F", effects: { legitimacy: 3, factionSat: fr("clergy", 12) }, aiWeight: 3 }] },
  { id: "evt_cultural_revival", title: "\u6587\u827A\u590D\u5174", description: "\u53E4\u5178\u6587\u5316\u590D\u5174\u8FD0\u52A8\u5E2D\u5377\u5B66\u754C\uFF01", category: "culture", trigger: { minTurn: 20, minStability: 50, techLevelAbove: { branch: "culture", level: 2 } }, weight: 3, cooldown: 60, unique: false, options: [{ text: "\u5927\u529B\u5021\u5BFC", effects: { gold: -100, influence: 15, legitimacy: 8, sciPt: 10 }, aiWeight: 3 }, { text: "\u987A\u5176\u81EA\u7136", effects: { influence: 5, sciPt: 3 }, aiWeight: 2 }] },
  { id: "evt_temple_construction", title: "\u5E99\u5B87\u5927\u5174", description: "\u795E\u804C\u56E2\u4F53\u8BF7\u5EFA\u5927\u5E99\uFF0C\u4FE1\u4F17\u8E0A\u8DC3\u6350\u8D44\uFF01", category: "culture", trigger: { minTurn: 10, minStability: 40 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u94A6\u51C6\u7763\u5EFA", effects: { gold: -80, legitimacy: 8, influence: 5, factionSat: fr("clergy", 15) }, aiWeight: 3 }, { text: "\u6C11\u529E\u5B98\u52A9", effects: { gold: -30, factionSat: fr("clergy", 8) }, aiWeight: 2 }] },
  { id: "evt_festival_grand", title: "\u4E07\u56FD\u6765\u671D", description: "\u85E9\u5C5E\u9063\u4F7F\u671D\u8D3A\uFF0C\u5E1D\u56FD\u5A01\u4EEA\u8FDC\u64AD\uFF01", category: "culture", trigger: { minTurn: 25, minStability: 60, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u76DB\u5927\u5E86\u8D3A", effects: { gold: -150, influence: 20, legitimacy: 10, factionSat: fr("nobles", 10) }, aiWeight: 3 }, { text: "\u7B80\u793C\u76F8\u5F85", effects: { gold: -40, influence: 8 }, aiWeight: 2 }] },
  { id: "evt_plague_quarantine", title: "\u68C0\u75AB\u4E4B\u4E89", description: "\u8FB9\u5883\u53D1\u73B0\u75AB\u75C5\uFF0C\u662F\u5426\u5C01\u9501\u8FB9\u5883\uFF1F", category: "population", trigger: { minTurn: 15 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u4E25\u683C\u9694\u79BB", effects: { gold: -60, population: -50, stability: -3, factionSat: fr("merchants", -12) }, aiWeight: 3 }, { text: "\u6709\u9650\u68C0\u67E5", effects: { population: -150, stability: 2 }, aiWeight: 2 }] },
  { id: "evt_diplomatic_marriage", title: "\u548C\u4EB2\u4E4B\u8BAE", description: "\u5F3A\u56FD\u9063\u4F7F\u6C42\u548C\u4EB2\uFF0C\u6B32\u7ED3\u79E6\u664B\u4E4B\u597D\uFF01", category: "diplomacy", trigger: { minTurn: 15, notAtWar: true }, weight: 4, cooldown: 50, unique: false, options: [{ text: "\u5141\u8BFA\u548C\u4EB2", effects: { gold: 100, influence: 15, legitimacy: -3, factionSat: fr("nobles", -8) }, aiWeight: 3 }, { text: "\u5A49\u8A00\u8C22\u7EDD", effects: { influence: -5, stability: 3 }, aiWeight: 2 }] },
  { id: "evt_trade_embargo", title: "\u4ED6\u56FD\u7981\u8FD0", description: "\u90BB\u90A6\u8054\u5408\u5BF9\u4F60\u7684\u5546\u54C1\u5B9E\u65BD\u7981\u8FD0\uFF01", category: "diplomacy", trigger: { minTurn: 18 }, weight: 5, cooldown: 40, unique: false, options: [{ text: "\u5BFB\u6C42\u65B0\u5546\u8DEF", effects: { gold: -100, influence: 5, factionSat: fr("merchants", 8) }, aiWeight: 3 }, { text: "\u53CD\u5236\u7981\u8FD0", effects: { gold: -50, influence: -8, stability: 3 }, aiWeight: 2 }] },
  { id: "evt_border_demarcate", title: "\u52D8\u754C\u5B9A\u7586", description: "\u4E0E\u90BB\u56FD\u52D8\u5B9A\u8FB9\u754C\uFF0C\u4E89\u8BAE\u4E4B\u5730\u5982\u4F55\u5904\u7F6E\uFF1F", category: "diplomacy", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u636E\u7406\u529B\u4E89", effects: { gold: -40, influence: 5, factionSat: fr("military", 8) }, aiWeight: 2 }, { text: "\u4E92\u8BA9\u59A5\u534F", effects: { gold: 20, influence: 8, legitimacy: 3 }, aiWeight: 3 }] },
  { id: "evt_secret_treaty", title: "\u5BC6\u7EA6\u66DD\u5149", description: "\u4F60\u4E0E\u4ED6\u56FD\u7684\u79D8\u5BC6\u6761\u7EA6\u88AB\u6CC4\u9732\uFF0C\u671D\u91CE\u54D7\u7136\uFF01", category: "diplomacy", trigger: { minTurn: 20 }, weight: 4, cooldown: 60, unique: false, options: [{ text: "\u516C\u5F00\u627F\u8BA4", effects: { legitimacy: -8, influence: 5, stability: -3 }, aiWeight: 2 }, { text: "\u77E2\u53E3\u5426\u8BA4", effects: { legitimacy: -3, influence: -10, corruption: 3 }, aiWeight: 3 }] },
  // ── P-fix 补齐事件到 150（覆盖 science/culture/population/diplomacy/opportunity）──
  { id: "evt_sci_observatory", title: "\u89C2\u661F\u53F0", description: "\u5929\u6587\u5B66\u5BB6\u8BF7\u5EFA\u89C2\u661F\u53F0\uFF0C\u89C2\u6D4B\u661F\u8C61\u4EE5\u63A8\u5386\u6CD5\uFF01", category: "science", trigger: { minTurn: 18, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u62E8\u6B3E\u5174\u5EFA", effects: { gold: -120, sciPt: 30, influence: 5 }, aiWeight: 3 }, { text: "\u6C11\u95F4\u89C2\u6D4B", effects: { sciPt: 8 }, aiWeight: 2 }] },
  { id: "evt_sci_water_mill", title: "\u6C34\u529B\u78E8\u574A", description: "\u5DE5\u5320\u53D1\u660E\u6C34\u529B\u78E8\u574A\uFF0C\u7CAE\u4EA7\u52A0\u5DE5\u6548\u7387\u5927\u589E\uFF01", category: "science", trigger: { minTurn: 14, techLevelAbove: { branch: "agri", level: 2 } }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u63A8\u5E7F\u5168\u56FD", effects: { gold: -80, food: 50, factionSat: fr("commoners", 8) }, aiWeight: 3 }, { text: "\u9650\u7687\u5BB6\u4E13\u7528", effects: { gold: -30, food: 15 }, aiWeight: 2 }] },
  { id: "evt_sci_medical_text", title: "\u533B\u5178\u7F16\u7E82", description: "\u592A\u533B\u5949\u65E8\u7F16\u7E82\u533B\u5178\uFF0C\u6C47\u5929\u4E0B\u65B9\u672F\uFF01", category: "science", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 3 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u9881\u884C\u5929\u4E0B", effects: { gold: -100, sciPt: 20, stability: 5, population: 100 }, aiWeight: 3 }, { text: "\u79D8\u85CF\u5185\u5E9C", effects: { sciPt: 10, factionSat: fr("clergy", 5) }, aiWeight: 2 }] },
  { id: "evt_culture_poet", title: "\u8BD7\u4EBA\u732E\u8D4B", description: "\u540D\u8BD7\u4EBA\u732E\u9882\u8D4B\uFF0C\u8F9E\u85FB\u534E\u7F8E\uFF0C\u671D\u91CE\u4F20\u8BF5\uFF01", category: "culture", trigger: { minTurn: 12, minStability: 40 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u539A\u8D4F\u8D50\u7235", effects: { gold: -40, legitimacy: 5, influence: 3, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u53E3\u5934\u5609\u5956", effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: "evt_culture_architecture", title: "\u5BAB\u5BA4\u8425\u5EFA", description: "\u5320\u5E08\u732E\u65B0\u56FE\u6837\uFF0C\u8BF7\u5EFA\u5B8F\u4F1F\u5BAB\u5BA4\u4EE5\u5F70\u56FD\u5A01\uFF01", category: "culture", trigger: { minTurn: 22, minStability: 50, minGold: 300 }, weight: 3, cooldown: 60, unique: false, options: [{ text: "\u5927\u5174\u571F\u6728", effects: { gold: -250, legitimacy: 10, influence: 8, factionSat: fr("nobles", 12) }, aiWeight: 2 }, { text: "\u7B80\u6734\u4ECE\u4E8B", effects: { legitimacy: 3, factionSat: fr("commoners", 5) }, aiWeight: 3 }] },
  { id: "evt_culture_relic", title: "\u5723\u7269\u73B0\u4E16", description: "\u53E4\u5BFA\u51FA\u571F\u5723\u7269\uFF0C\u4FE1\u4F17\u8702\u62E5\u671D\u62DC\uFF01", category: "culture", trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u8FCE\u5165\u4EAC\u757F", effects: { gold: -60, legitimacy: 8, factionSat: fr("clergy", 15), influence: 5 }, aiWeight: 3 }, { text: "\u7559\u5BFA\u4F9B\u5949", effects: { stability: 3, factionSat: fr("clergy", 8) }, aiWeight: 2 }] },
  { id: "evt_pop_urbanization", title: "\u5E02\u4E95\u7E41\u5174", description: "\u90FD\u57CE\u5546\u5E02\u7E41\u5174\uFF0C\u767E\u4E1A\u4E91\u96C6\uFF01", category: "population", trigger: { minTurn: 16, minStability: 50, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u89C4\u8303\u5E02\u574A", effects: { gold: 60, efficiency: 3, factionSat: fr("merchants", 10) }, aiWeight: 3 }, { text: "\u4EFB\u5176\u53D1\u5C55", effects: { gold: 40, corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_pop_infant", title: "\u5A74\u6B87\u4E4B\u75DB", description: "\u90FD\u57CE\u5A74\u592D\u7387\u9AD8\uFF0C\u592A\u533B\u8BF7\u8BBE\u80B2\u5A74\u5C40\uFF01", category: "population", trigger: { minTurn: 14 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u8BBE\u5C40\u54FA\u80B2", effects: { gold: -80, population: 80, stability: 3, factionSat: fr("commoners", 12) }, aiWeight: 3 }, { text: "\u542C\u5929\u7531\u547D", effects: { population: -50, factionSat: fr("commoners", -8) }, aiWeight: 2 }] },
  { id: "evt_dip_tribute", title: "\u85E9\u5C5E\u671D\u8D21", description: "\u8FDC\u65B9\u85E9\u5C5E\u9063\u4F7F\u671D\u8D21\u73CD\u5F02\u7269\u4EA7\uFF01", category: "diplomacy", trigger: { minTurn: 20, notAtWar: true, minStability: 50 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u539A\u5F80\u8584\u6765", effects: { gold: -100, influence: 15, legitimacy: 8 }, aiWeight: 3 }, { text: "\u5E38\u793C\u76F8\u5F85", effects: { gold: -30, influence: 5 }, aiWeight: 2 }] },
  { id: "evt_dip_mediation", title: "\u90BB\u90A6\u8BF7\u8C03", description: "\u4E24\u90BB\u90A6\u5F00\u6218\uFF0C\u53CC\u65B9\u7686\u8BF7\u6211\u56FD\u8C03\u505C\uFF01", category: "diplomacy", trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u51FA\u9762\u65A1\u65CB", effects: { gold: -60, influence: 20, legitimacy: 5, sciPt: 5 }, aiWeight: 3 }, { text: "\u4FDD\u6301\u4E2D\u7ACB", effects: { influence: -3, stability: 2 }, aiWeight: 2 }] },
  { id: "evt_opp_granary_surplus", title: "\u7CAE\u4ED3\u5145\u76C8", description: "\u8FDE\u5E74\u4E30\u6536\uFF0C\u7CAE\u4ED3\u6EE1\u6EA2\uFF0C\u5982\u4F55\u5904\u7F6E\uFF1F", category: "opportunity", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5E73\u4EF7\u51FA\u7C9C", effects: { gold: 100, food: -80, factionSat: fr("merchants", 8) }, aiWeight: 3 }, { text: "\u5907\u8352\u50A8\u5907", effects: { stability: 5, factionSat: fr("commoners", 5) }, aiWeight: 2 }] },
  { id: "evt_opp_mercenary_captain", title: "\u96C7\u4F63\u5175\u9996\u9886", description: "\u767E\u6218\u96C7\u4F63\u5175\u9996\u9886\u7387\u90E8\u6765\u6295\uFF0C\u613F\u4E3A\u524D\u950B\uFF01", category: "opportunity", trigger: { minTurn: 14, atWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u59D4\u4EE5\u91CD\u4EFB", effects: { gold: -80, factionSat: fr("military", 15), influence: 3 }, aiWeight: 3 }, { text: "\u5B58\u7591\u4E0D\u7528", effects: { stability: -2, factionSat: fr("military", -5) }, aiWeight: 2 }] },
  { id: "evt_opp_good_harvest_chain", title: "\u8FDE\u5E74\u4E30\u7A14", description: "\u8FDE\u7EED\u4E30\u6536\uFF0C\u767E\u59D3\u5BCC\u8DB3\uFF0C\u56FD\u5E93\u5145\u76C8\uFF01", category: "opportunity", trigger: { minTurn: 16, notAtWar: true, minStability: 60 }, weight: 2, cooldown: 60, unique: false, options: [{ text: "\u51CF\u514D\u8D4B\u7A0E", effects: { gold: -100, stability: 8, factionSat: fr("commoners", 15), legitimacy: 5 }, aiWeight: 3 }, { text: "\u5145\u5B9E\u56FD\u5E93", effects: { gold: 200, factionSat: fr("commoners", -5) }, aiWeight: 2 }] },
  // ── D1: 扩充至 300+ 事件（每类别 ≥8） ──
  { id: "evt_locust", title: "\u8757\u707E", description: "\u8757\u866B\u8FC7\u5883\uFF0C\u5BF8\u8349\u4E0D\u751F\uFF01", category: "crisis", trigger: { minTurn: 8 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u7EC4\u7EC7\u706D\u8757", effects: { gold: -60, food: -80, stability: 3 }, aiWeight: 3 }, { text: "\u7948\u5929\u6C42\u96E8", effects: { food: -120, legitimacy: -3 }, aiWeight: 2 }] },
  { id: "evt_flood", title: "\u6D2A\u6D9D", description: "\u66B4\u96E8\u6210\u707E\uFF0C\u826F\u7530\u88AB\u6DF9\uFF01", category: "crisis", trigger: { minTurn: 6 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u7B51\u5824\u6551\u707E", effects: { gold: -100, food: -60, stability: 4 }, aiWeight: 3 }, { text: "\u8F6C\u79FB\u9AD8\u5730", effects: { food: -40, population: -80 }, aiWeight: 2 }] },
  { id: "evt_blight", title: "\u75AB\u75C5\u4FB5\u88AD\u5E84\u7A3C", description: "\u4F5C\u7269\u5927\u9762\u79EF\u67AF\u840E\uFF01", category: "crisis", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u711A\u7530\u9632\u75AB", effects: { food: -150, stability: -3 }, aiWeight: 2 }, { text: "\u5BFB\u6C42\u826F\u79CD", effects: { gold: -50, food: -80 }, aiWeight: 3 }] },
  { id: "evt_hail", title: "\u51B0\u96F9", description: "\u7A81\u964D\u51B0\u96F9\uFF0C\u6BC1\u574F\u5E84\u7A3C\uFF01", category: "crisis", trigger: {}, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u5F00\u4ED3\u8D48\u6D4E", effects: { food: -60, gold: -40, stability: 5 }, aiWeight: 3 }, { text: "\u81EA\u529B\u66F4\u751F", effects: { food: -100, stability: -3 }, aiWeight: 2 }] },
  { id: "evt_famine_riot", title: "\u9965\u6C11\u66B4\u52A8", description: "\u9965\u997F\u7684\u6C11\u4F17\u51B2\u51FB\u7CAE\u4ED3\uFF01", category: "crisis", trigger: { maxFoodRatio: 0.4 }, weight: 8, cooldown: 20, unique: false, options: [{ text: "\u9547\u538B", effects: { gold: -40, stability: -5, factionSat: fr("military", 5) }, aiWeight: 2 }, { text: "\u653E\u7CAE\u5B89\u629A", effects: { food: -100, stability: 5, factionSat: fr("commoners", 10) }, aiWeight: 3 }] },
  { id: "evt_wolf_plague", title: "\u517D\u75AB", description: "\u7272\u755C\u5927\u6279\u6B7B\u4EA1\uFF01", category: "crisis", trigger: { minTurn: 12 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u9694\u79BB\u711A\u70E7", effects: { food: -50, gold: -30 }, aiWeight: 3 }, { text: "\u6C42\u533B\u95EE\u836F", effects: { gold: -60, food: -30 }, aiWeight: 2 }] },
  { id: "evt_noble_exile", title: "\u8D35\u65CF\u6D41\u4EA1", description: "\u5931\u52BF\u8D35\u65CF\u9003\u4EA1\u4ED6\u56FD\uFF01", category: "politics", trigger: { maxLegitimacy: 30 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u901A\u7F09\u8FFD\u56DE", effects: { gold: -50, legitimacy: 3 }, aiWeight: 2 }, { text: "\u4EFB\u5176\u53BB\u7559", effects: { factionSat: fr("nobles", -8), stability: 2 }, aiWeight: 3 }] },
  { id: "evt_noble_marriage", title: "\u8D35\u65CF\u8054\u59FB", description: "\u4E24\u5927\u8D35\u65CF\u5BB6\u65CF\u8054\u59FB\uFF0C\u52BF\u529B\u5750\u5927\uFF01", category: "politics", trigger: { minTurn: 10 }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u8D50\u5A5A\u652F\u6301", effects: { gold: -40, factionSat: fr("nobles", 12), legitimacy: 3 }, aiWeight: 3 }, { text: "\u4ECE\u4E2D\u4F5C\u6897", effects: { factionSat: fr("nobles", -10), stability: -3 }, aiWeight: 2 }] },
  { id: "evt_noble_disinherit", title: "\u593A\u7235", description: "\u8D35\u65CF\u5B50\u5F1F\u88AB\u593A\u7235\uFF0C\u5F15\u53D1\u4E89\u8BAE\uFF01", category: "politics", trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u7EF4\u6301\u539F\u5224", effects: { factionSat: fr("nobles", -12), legitimacy: 5 }, aiWeight: 2 }, { text: "\u6062\u590D\u7235\u4F4D", effects: { factionSat: fr("nobles", 8), gold: -60 }, aiWeight: 3 }] },
  { id: "evt_faction_civil_war", title: "\u6D3E\u7CFB\u5185\u6218", description: "\u4E24\u5927\u6D3E\u7CFB\u516C\u5F00\u51B2\u7A81\uFF01", category: "politics", trigger: { maxStability: 35 }, weight: 7, cooldown: 20, unique: false, options: [{ text: "\u652F\u6301\u4E00\u65B9", effects: { stability: -8, legitimacy: -5 }, aiWeight: 2 }, { text: "\u8C03\u505C", effects: { gold: -80, stability: 3 }, aiWeight: 3 }] },
  { id: "evt_merchant_smuggle", title: "\u8D70\u79C1\u7316\u7357", description: "\u5546\u4EBA\u8D70\u79C1\u9003\u7A0E\u4E25\u91CD\uFF01", category: "politics", trigger: { minCorruption: 25 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u4E25\u6253\u8D70\u79C1", effects: { gold: 60, factionSat: fr("merchants", -10), corruption: -3 }, aiWeight: 2 }, { text: "\u7741\u53EA\u773C\u95ED\u53EA\u773C", effects: { corruption: 5, factionSat: fr("merchants", 5) }, aiWeight: 3 }] },
  { id: "evt_merchant_monopoly", title: "\u884C\u4F1A\u5784\u65AD", description: "\u5546\u4EBA\u884C\u4F1A\u5784\u65AD\u5E02\u573A\uFF01", category: "politics", trigger: { minTurn: 15 }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u6253\u7834\u5784\u65AD", effects: { gold: -50, factionSat: fra({ faction: "merchants", delta: -15 }, { faction: "commoners", delta: 10 }) }, aiWeight: 3 }, { text: "\u6536\u7A0E\u4E86\u4E8B", effects: { gold: 80, corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_military_coup_attempt", title: "\u5175\u53D8\u672A\u9042", description: "\u90E8\u5206\u5C06\u9886\u5BC6\u8C0B\u5175\u53D8\uFF01", category: "politics", trigger: { factionSatBelow: { faction: "military", threshold: 15 }, maxLegitimacy: 35 }, weight: 9, cooldown: 50, unique: false, options: [{ text: "\u94C1\u8155\u9547\u538B", effects: { gold: -100, stability: -8, factionSat: fr("military", -15) }, aiWeight: 2 }, { text: "\u5B89\u629A\u519B\u5FC3", effects: { gold: -80, factionSat: fr("military", 10), stability: -3 }, aiWeight: 3 }] },
  { id: "evt_military_veteran", title: "\u8001\u5175\u5B89\u7F6E", description: "\u9000\u5F79\u8001\u5175\u65E0\u4EE5\u4E3A\u751F\uFF01", category: "politics", trigger: { minTurn: 12 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u8D50\u7530\u5B89\u7F6E", effects: { gold: -60, factionSat: fr("military", 10), stability: 3 }, aiWeight: 3 }, { text: "\u4E0D\u4E88\u7406\u776C", effects: { factionSat: fr("military", -12), stability: -3 }, aiWeight: 2 }] },
  { id: "evt_military_mutiny", title: "\u54D7\u53D8", description: "\u6B20\u9977\u58EB\u5175\u54D7\u53D8\uFF01", category: "politics", trigger: { factionSatBelow: { faction: "military", threshold: 10 } }, weight: 10, cooldown: 30, unique: false, options: [{ text: "\u9547\u538B", effects: { gold: -80, stability: -10, factionSat: fr("military", -8) }, aiWeight: 2 }, { text: "\u8865\u53D1\u6B20\u9977", effects: { gold: -120, factionSat: fr("military", 15), stability: 3 }, aiWeight: 3 }] },
  { id: "evt_trade_embargo_hit", title: "\u8D38\u6613\u7981\u8FD0\u51B2\u51FB", description: "\u4ED6\u56FD\u5BF9\u6211\u56FD\u7981\u8FD0\uFF01", category: "economy", trigger: { minTurn: 10 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u81EA\u7ED9\u81EA\u8DB3", effects: { gold: -50, stability: 3 }, aiWeight: 3 }, { text: "\u5BFB\u627E\u66FF\u4EE3", effects: { gold: -80, influence: 3 }, aiWeight: 2 }] },
  { id: "evt_inflation", title: "\u901A\u80C0", description: "\u7269\u4EF7\u98DE\u6DA8\uFF0C\u6C11\u6028\u6CB8\u817E\uFF01", category: "economy", trigger: { minCorruption: 40 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u7D27\u7F29\u94F6\u6839", effects: { gold: -80, stability: 3, corruption: -3 }, aiWeight: 3 }, { text: "\u653E\u4EFB\u4E0D\u7BA1", effects: { factionSat: fr("commoners", -12), corruption: 5 }, aiWeight: 2 }] },
  { id: "evt_devaluation", title: "\u8D27\u5E01\u8D2C\u503C", description: "\u94F8\u5E01\u63BA\u5047\uFF0C\u5E01\u503C\u66B4\u8DCC\uFF01", category: "economy", trigger: { minCorruption: 50 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u6574\u987F\u5E01\u5236", effects: { gold: -100, legitimacy: 5, corruption: -5 }, aiWeight: 3 }, { text: "\u501F\u673A\u725F\u5229", effects: { gold: 150, corruption: 8, factionSat: fr("merchants", -10) }, aiWeight: 2 }] },
  { id: "evt_resource_shortage", title: "\u8D44\u6E90\u77ED\u7F3A", description: "\u94C1\u77FF\u6728\u6750\u4E25\u91CD\u4E0D\u8DB3\uFF01", category: "economy", trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u9AD8\u4EF7\u91C7\u8D2D", effects: { gold: -80, iron: 20, wood: 20 }, aiWeight: 3 }, { text: "\u9650\u5236\u6D88\u8017", effects: { factionSat: fr("military", -8), stability: -2 }, aiWeight: 2 }] },
  { id: "evt_caravan_arrival", title: "\u5546\u961F\u62B5\u8FBE", description: "\u8FDC\u65B9\u5546\u961F\u5E26\u6765\u73CD\u5947\u8D27\u7269\uFF01", category: "economy", trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u8BBE\u5E02\u4EA4\u6613", effects: { gold: 80, factionSat: fr("merchants", 8) }, aiWeight: 3 }, { text: "\u5F81\u6536\u5173\u7A0E", effects: { gold: 120, factionSat: fr("merchants", -5) }, aiWeight: 2 }] },
  { id: "evt_bank_loan", title: "\u94B1\u5E84\u501F\u8D37", description: "\u94B1\u5E84\u613F\u501F\u5DE8\u6B3E\uFF01", category: "economy", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u63A5\u53D7\u501F\u8D37", effects: { gold: 300, corruption: 5 }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { legitimacy: 3 }, aiWeight: 2 }] },
  { id: "evt_market_crash", title: "\u5E02\u5D29", description: "\u5E02\u573A\u6050\u614C\uFF0C\u7269\u4EF7\u66B4\u8DCC\uFF01", category: "economy", trigger: { minTurn: 15 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u6284\u5E95\u6536\u8D2D", effects: { gold: -150, stability: -5 }, aiWeight: 2 }, { text: "\u7A33\u5B9A\u5E02\u4EF7", effects: { gold: -80, stability: 5 }, aiWeight: 3 }] },
  { id: "evt_frontline_victory", title: "\u524D\u7EBF\u5927\u6377", description: "\u6211\u519B\u5927\u7834\u654C\u519B\uFF01", category: "military", trigger: { atWar: true }, weight: 6, cooldown: 10, unique: false, options: [{ text: "\u4E58\u80DC\u8FFD\u51FB", effects: { gold: -50, factionSat: fr("military", 12), stability: 5 }, aiWeight: 2 }, { text: "\u89C1\u597D\u5C31\u6536", effects: { legitimacy: 5, factionSat: fr("military", -3) }, aiWeight: 3 }] },
  { id: "evt_siege", title: "\u56F4\u57CE", description: "\u654C\u519B\u56F4\u56F0\u6211\u65B9\u57CE\u6C60\uFF01", category: "military", trigger: { atWar: true }, weight: 7, cooldown: 15, unique: false, options: [{ text: "\u6B7B\u5B88\u5F85\u63F4", effects: { food: -80, gold: -40, stability: 3 }, aiWeight: 3 }, { text: "\u7A81\u56F4", effects: { gold: -60, stability: -5, factionSat: fr("military", 5) }, aiWeight: 2 }] },
  { id: "evt_deserter", title: "\u9003\u5175", description: "\u5927\u6279\u58EB\u5175\u9003\u4EA1\uFF01", category: "military", trigger: { minWarExhaustion: 50 }, weight: 6, cooldown: 20, unique: false, options: [{ text: "\u4E25\u60E9\u9003\u5175", effects: { factionSat: fr("military", 5), stability: -3 }, aiWeight: 2 }, { text: "\u6539\u5584\u5F85\u9047", effects: { gold: -80, factionSat: fr("military", 10) }, aiWeight: 3 }] },
  { id: "evt_conscription_resistance", title: "\u6297\u5F81", description: "\u6C11\u4F17\u6297\u62D2\u5F81\u5175\uFF01", category: "military", trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u5F3A\u5236\u5F81\u5175", effects: { factionSat: fr("commoners", -15), stability: -5 }, aiWeight: 2 }, { text: "\u51CF\u5C11\u5F81\u989D", effects: { factionSat: fr("commoners", 8), stability: 2 }, aiWeight: 3 }] },
  { id: "evt_war_profit", title: "\u6218\u4E89\u8D22", description: "\u519B\u9700\u65FA\u76DB\uFF0C\u5546\u4EBA\u53D1\u6218\u4E89\u8D22\uFF01", category: "military", trigger: { atWar: true, minTurn: 10 }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u5F81\u6536\u6218\u4E89\u7A0E", effects: { gold: 100, factionSat: fr("merchants", -8) }, aiWeight: 2 }, { text: "\u9F13\u52B1\u4F9B\u5E94", effects: { gold: 50, factionSat: fr("merchants", 5) }, aiWeight: 3 }] },
  { id: "evt_alliance_proposal", title: "\u540C\u76DF\u9080\u8BF7", description: "\u4ED6\u56FD\u63D0\u8BAE\u7ED3\u76DF\uFF01", category: "diplomacy", trigger: { notAtWar: true, minTurn: 8 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u540C\u610F\u7ED3\u76DF", effects: { influence: 10, legitimacy: 3 }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { influence: -3 }, aiWeight: 2 }] },
  { id: "evt_treaty_break", title: "\u6BC1\u7EA6", description: "\u76DF\u56FD\u5355\u65B9\u9762\u6495\u6BC1\u6761\u7EA6\uFF01", category: "diplomacy", trigger: { minTurn: 15 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u5F3A\u70C8\u6297\u8BAE", effects: { legitimacy: 5, stability: -3 }, aiWeight: 2 }, { text: "\u5FCD\u6C14\u541E\u58F0", effects: { legitimacy: -8, factionSat: fr("nobles", -10) }, aiWeight: 3 }] },
  { id: "evt_hostage_return", title: "\u8D28\u5B50\u5F52\u8FD8", description: "\u4ED6\u56FD\u5F52\u8FD8\u4EBA\u8D28\uFF01", category: "diplomacy", trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u5584\u5F85\u5F52\u56FD", effects: { legitimacy: 5, stability: 3 }, aiWeight: 3 }, { text: "\u51B7\u5F85", effects: { factionSat: fr("nobles", -5) }, aiWeight: 2 }] },
  { id: "evt_pirate_attack", title: "\u6D77\u76D7\u88AD\u51FB", description: "\u6D77\u76D7\u52AB\u63A0\u6CBF\u6D77\uFF01", category: "diplomacy", trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u51FA\u5175\u527F\u706D", effects: { gold: -60, factionSat: fr("military", 8), stability: 3 }, aiWeight: 3 }, { text: "\u62DB\u5B89", effects: { gold: -30, corruption: 5 }, aiWeight: 2 }] },
  { id: "evt_tribute_demand", title: "\u7D22\u8D21", description: "\u5F3A\u56FD\u8981\u6C42\u8FDB\u8D21\uFF01", category: "diplomacy", trigger: { minTurn: 12 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u5FCD\u8FB1\u8FDB\u8D21", effects: { gold: -100, legitimacy: -5, stability: -3 }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { legitimacy: 8, stability: -5 }, aiWeight: 2 }] },
  { id: "evt_cultural_exchange", title: "\u6587\u5316\u4EA4\u6D41", description: "\u4ED6\u56FD\u5B66\u8005\u6765\u8BBF\u4EA4\u6D41\uFF01", category: "diplomacy", trigger: { notAtWar: true, minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u70ED\u70C8\u6B22\u8FCE", effects: { sciPt: 8, influence: 5, gold: -30 }, aiWeight: 3 }, { text: "\u8C28\u614E\u5BF9\u5F85", effects: { sciPt: 3 }, aiWeight: 2 }] },
  { id: "evt_heresy", title: "\u5F02\u7AEF", description: "\u5F02\u7AEF\u6559\u6D3E\u5174\u8D77\uFF01", category: "religion", trigger: { minTurn: 10, maxStability: 50 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u9547\u538B\u5F02\u7AEF", effects: { stability: -5, factionSat: fr("clergy", 10), legitimacy: 3 }, aiWeight: 2 }, { text: "\u5BBD\u5BB9\u5BF9\u5F85", effects: { factionSat: fr("clergy", -12), stability: 3 }, aiWeight: 3 }] },
  { id: "evt_holy_war_call", title: "\u5723\u6218\u53F7\u53EC", description: "\u5B97\u6559\u9886\u8896\u53F7\u53EC\u5723\u6218\uFF01", category: "religion", trigger: { minTurn: 20 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u54CD\u5E94\u53F7\u53EC", effects: { factionSat: fr("clergy", 15), stability: -5, legitimacy: 5 }, aiWeight: 2 }, { text: "\u62D2\u7EDD", effects: { factionSat: fr("clergy", -15), stability: 3 }, aiWeight: 3 }] },
  { id: "evt_shrine_miracle", title: "\u795E\u8FF9", description: "\u795E\u6BBF\u73B0\u5F02\u8C61\uFF0C\u4FE1\u5F92\u8702\u62E5\uFF01", category: "religion", trigger: { minTurn: 15, minStability: 40 }, weight: 2, cooldown: 60, unique: false, options: [{ text: "\u5927\u8086\u5BA3\u626C", effects: { legitimacy: 8, factionSat: fr("clergy", 12), influence: 5 }, aiWeight: 3 }, { text: "\u4F4E\u8C03\u5904\u7406", effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: "evt_monastery_land", title: "\u5BFA\u9662\u5360\u5730", description: "\u5BFA\u9662\u5E7F\u5360\u826F\u7530\uFF01", category: "religion", trigger: { minTurn: 12, minCorruption: 20 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u6CA1\u6536\u8FD8\u7530", effects: { food: 50, factionSat: fr("clergy", -15), legitimacy: -3 }, aiWeight: 3 }, { text: "\u7EF4\u6301\u73B0\u72B6", effects: { factionSat: fr("clergy", 5), corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_tech_academy", title: "\u5B66\u5E9C\u4E89\u9E23", description: "\u5404\u5B66\u6D3E\u6FC0\u70C8\u8BBA\u6218\uFF01", category: "science", trigger: { minTurn: 10, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u8D44\u52A9\u7814\u7A76", effects: { gold: -60, sciPt: 10, factionSat: fr("nobles", -5) }, aiWeight: 3 }, { text: "\u9650\u5236\u4E89\u8BBA", effects: { stability: 3, sciPt: -3 }, aiWeight: 2 }] },
  { id: "evt_tech_leak", title: "\u6280\u672F\u5916\u6D41", description: "\u6838\u5FC3\u673A\u5BC6\u88AB\u4ED6\u56FD\u7A83\u53D6\uFF01", category: "science", trigger: { minTurn: 15 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8FFD\u67E5\u5185\u9B3C", effects: { gold: -50, stability: -3 }, aiWeight: 3 }, { text: "\u52A0\u901F\u7814\u53D1", effects: { gold: -80, sciPt: 8 }, aiWeight: 2 }] },
  { id: "evt_tech_craft_guild", title: "\u5DE5\u5320\u884C\u4F1A", description: "\u5DE5\u5320\u7EC4\u7EC7\u884C\u4F1A\u4FDD\u62A4\u79D8\u65B9\uFF01", category: "science", trigger: { minTurn: 8 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u652F\u6301\u884C\u4F1A", effects: { gold: -30, sciPt: 5, factionSat: fr("merchants", 5) }, aiWeight: 3 }, { text: "\u6253\u7834\u5784\u65AD", effects: { sciPt: -2, factionSat: fr("merchants", -8) }, aiWeight: 2 }] },
  { id: "evt_tech_invention", title: "\u53D1\u660E", description: "\u5DE5\u5320\u53D1\u660E\u65B0\u5DE5\u5177\uFF01", category: "science", trigger: { techLevelAbove: { branch: "agri", level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u63A8\u5E7F\u4F7F\u7528", effects: { gold: -40, food: 30, sciPt: 3 }, aiWeight: 3 }, { text: "\u4FDD\u5B88\u79D8\u5BC6", effects: { sciPt: 5, influence: 2 }, aiWeight: 2 }] },
  { id: "evt_granary_rot", title: "\u7CAE\u4ED3\u9709\u53D8", description: "\u50A8\u7CAE\u5927\u91CF\u9709\u53D8\uFF01", category: "crisis", trigger: { minTurn: 10 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u7D27\u6025\u6E05\u7406", effects: { food: -80, gold: -30 }, aiWeight: 3 }, { text: "\u542C\u4E4B\u4EFB\u4E4B", effects: { food: -150, stability: -5 }, aiWeight: 2 }] },
  { id: "evt_road_bandit", title: "\u8DEF\u532A", description: "\u76D7\u532A\u76D8\u8E1E\u8981\u9053\uFF01", category: "crisis", trigger: { maxStability: 45 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u6D3E\u5175\u6E05\u527F", effects: { gold: -40, stability: 5, factionSat: fr("military", 5) }, aiWeight: 3 }, { text: "\u7ED5\u9053", effects: { gold: -20, factionSat: fr("merchants", -5) }, aiWeight: 2 }] },
  { id: "evt_pop_plague", title: "\u65F6\u75AB", description: "\u75AB\u75C5\u5728\u90FD\u57CE\u8513\u5EF6\uFF01", category: "population", trigger: { minTurn: 15 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u5C01\u57CE\u9694\u79BB", effects: { gold: -80, population: -100, stability: -3 }, aiWeight: 3 }, { text: "\u653E\u4EFB", effects: { population: -300, stability: -8 }, aiWeight: 2 }] },
  { id: "evt_pop_festival", title: "\u4E07\u6C11\u540C\u5E86", description: "\u56FD\u6CF0\u6C11\u5B89\uFF0C\u4E07\u6C11\u6B22\u5E86\uFF01", category: "population", trigger: { minStability: 60, notAtWar: true, minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5927\u8D66\u5929\u4E0B", effects: { gold: -50, stability: 8, legitimacy: 5, factionSat: fr("commoners", 10) }, aiWeight: 3 }, { text: "\u7167\u5E38", effects: { stability: 2 }, aiWeight: 2 }] },
  { id: "evt_opp_relic", title: "\u5723\u7269\u73B0\u4E16", description: "\u4F20\u8BF4\u5723\u7269\u88AB\u53D1\u6398\uFF01", category: "opportunity", trigger: { minTurn: 20 }, weight: 2, cooldown: 60, unique: false, options: [{ text: "\u4F9B\u5949\u5C55\u793A", effects: { gold: -30, legitimacy: 10, factionSat: fr("clergy", 15), influence: 8 }, aiWeight: 3 }, { text: "\u79D8\u85CF", effects: { legitimacy: 3 }, aiWeight: 2 }] },
  { id: "evt_opp_annex", title: "\u90BB\u56FD\u5185\u4E71", description: "\u90BB\u56FD\u9677\u5165\u5185\u4E71\uFF0C\u6709\u673A\u53EF\u4E58\uFF01", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8D81\u865A\u800C\u5165", effects: { gold: -100, stability: -5, influence: 10 }, aiWeight: 2 }, { text: "\u9759\u89C2\u5176\u53D8", effects: { stability: 3 }, aiWeight: 3 }] },
  { id: "evt_opp_trade_monopoly", title: "\u72EC\u5360\u5546\u8DEF", description: "\u7ADE\u4E89\u5BF9\u624B\u9000\u51FA\uFF0C\u5546\u8DEF\u72EC\u5360\uFF01", category: "opportunity", trigger: { notAtWar: true, minTurn: 12 }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u5927\u4E3E\u6269\u5F20", effects: { gold: 150, factionSat: fr("merchants", 12) }, aiWeight: 3 }, { text: "\u7A33\u624E\u7A33\u6253", effects: { gold: 60, stability: 3 }, aiWeight: 2 }] },
  { id: "evt_opp_goldmine", title: "\u91D1\u77FF\u53D1\u73B0", description: "\u63A2\u77FF\u8005\u53D1\u73B0\u5927\u91D1\u77FF\uFF01", category: "opportunity", trigger: { minTurn: 20 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u5168\u529B\u5F00\u91C7", effects: { gold: 300, corruption: 8, factionSat: fr("nobles", 10) }, aiWeight: 3 }, { text: "\u9002\u5EA6\u5F00\u91C7", effects: { gold: 100, corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_culture_propaganda", title: "\u6587\u5316\u8F93\u51FA", description: "\u4ED6\u56FD\u4EF0\u6155\u6211\u56FD\u6587\u5316\uFF01", category: "culture", trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u79EF\u6781\u63A8\u5E7F", effects: { gold: -40, influence: 12, legitimacy: 3 }, aiWeight: 3 }, { text: "\u6765\u8005\u4E0D\u62D2", effects: { influence: 5 }, aiWeight: 2 }] },
  { id: "evt_culture_decay", title: "\u6587\u5316\u8870\u843D", description: "\u6587\u8109\u65AD\u7EDD\uFF0C\u793C\u5D29\u4E50\u574F\uFF01", category: "culture", trigger: { maxStability: 30 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u5174\u5B66\u91CD\u6559", effects: { gold: -80, stability: 5, legitimacy: 3 }, aiWeight: 3 }, { text: "\u542C\u4E4B\u4EFB\u4E4B", effects: { legitimacy: -5, factionSat: fr("nobles", -8) }, aiWeight: 2 }] },
  // ── B8: 政体切换反扑事件（3 个，仅 govTransitionActive 窗口内可触发）──
  { id: "evt_gov_nobles_plot", title: "\u65E7\u8D35\u65CF\u5BC6\u8C0B\u590D\u8F9F", description: "\u5931\u53BB\u7279\u6743\u7684\u65E7\u8D35\u65CF\u6697\u4E2D\u5BC6\u8C0B\uFF0C\u4F01\u56FE\u590D\u8F9F\u65E7\u5236\uFF01", category: "politics", trigger: { govTransitionActive: true }, weight: 10, cooldown: 5, unique: false, options: [{ text: "\u94C1\u8155\u9547\u538B", effects: { gold: -100, stability: -8, factionSat: fr("nobles", -20), legitimacy: 5 }, aiWeight: 2 }, { text: "\u5B89\u629A\u59A5\u534F", effects: { gold: -50, factionSat: fr("nobles", 15), legitimacy: -8 }, aiWeight: 3 }] },
  { id: "evt_gov_republican_push", title: "\u5171\u548C\u6D3E\u903C\u5BAB", description: "\u5171\u548C\u6D3E\u501F\u65B0\u653F\u4E4B\u673A\u8981\u6C42\u6269\u5927\u8BAE\u4F1A\u6743\u529B\uFF01", category: "politics", trigger: { govTransitionActive: true }, weight: 8, cooldown: 5, unique: false, options: [{ text: "\u987A\u5E94\u6269\u6743", effects: { legitimacy: -5, stability: 5, factionSat: fr("merchants", 12) }, aiWeight: 3 }, { text: "\u575A\u5B88\u738B\u6743", effects: { stability: -10, factionSat: fr("merchants", -15), legitimacy: 3 }, aiWeight: 2 }] },
  { id: "evt_gov_clergy_backlash", title: "\u6559\u58EB\u53CD\u6251", description: "\u5931\u52BF\u7684\u6559\u58EB\u717D\u52A8\u4FE1\u4F17\uFF0C\u6307\u65B0\u653F\u4E3A\u5F02\u7AEF\uFF01", category: "religion", trigger: { govTransitionActive: true }, weight: 8, cooldown: 5, unique: false, options: [{ text: "\u653F\u6559\u5206\u79BB", effects: { gold: -80, stability: -5, factionSat: fr("clergy", -18), legitimacy: 5 }, aiWeight: 2 }, { text: "\u62C9\u62E2\u6559\u58EB", effects: { gold: -40, factionSat: fr("clergy", 10), legitimacy: -3 }, aiWeight: 3 }] },
  // ── D1 扩充：+97 事件到 300，每类 +10 + 5 链 15 事件 ──
  // crisis +10
  { id: "evt_d1_flood", title: "\u6D2A\u6C34\u6CDB\u6EE5", description: "\u66B4\u96E8\u6210\u707E\uFF0C\u6CB3\u6C34\u6CDB\u6EE5\u3002", category: "crisis", trigger: { minTurn: 5 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u7B51\u5824\u6551\u707E", effects: { gold: -80, stability: 3 }, aiWeight: 3 }, { text: "\u4EFB\u5176\u81EA\u7136", effects: { food: -40, stability: -5 }, aiWeight: 2 }] },
  { id: "evt_d1_locust", title: "\u8757\u707E", description: "\u8757\u866B\u906E\u5929\u853D\u65E5\uFF0C\u5E84\u7A3C\u5C3D\u6BC1\u3002", category: "crisis", trigger: { minTurn: 8 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u6251\u706D\u8757\u866B", effects: { gold: -60, food: -20 }, aiWeight: 3 }, { text: "\u7948\u7977\u4E0A\u82CD", effects: { food: -50, legitimacy: 2 }, aiWeight: 2 }] },
  { id: "evt_d1_fire", title: "\u5927\u706B", description: "\u57CE\u4E2D\u5927\u706B\uFF0C\u8FDE\u70E7\u6570\u574A\u3002", category: "crisis", trigger: { minTurn: 6 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u5168\u529B\u6251\u6551", effects: { gold: -70, stability: 3 }, aiWeight: 3 }, { text: "\u62A2\u6551\u8D22\u7269", effects: { gold: -20, stability: -4 }, aiWeight: 2 }] },
  { id: "evt_d1_famine_locust", title: "\u8757\u540E\u9965\u8352", description: "\u8757\u707E\u4E4B\u540E\u7CAE\u4ED3\u7A7A\u865A\u3002", category: "crisis", trigger: { maxFoodRatio: 0.5 }, weight: 6, cooldown: 20, unique: false, options: [{ text: "\u5916\u8D2D\u7CAE\u98DF", effects: { gold: -100, food: 80 }, aiWeight: 3 }, { text: "\u52D2\u7D27\u8170\u5E26", effects: { food: -30, factionSat: fr("commoners", -10) }, aiWeight: 2 }] },
  { id: "evt_d1_epidemic", title: "\u75AB\u75C5", description: "\u57CE\u4E2D\u75AB\u75C5\u6D41\u884C\u3002", category: "crisis", trigger: { minTurn: 12 }, weight: 5, cooldown: 40, unique: false, options: [{ text: "\u9694\u79BB\u6551\u6CBB", effects: { gold: -90, population: -50, stability: 3 }, aiWeight: 3 }, { text: "\u4E0D\u7BA1\u4E0D\u95EE", effects: { population: -200, stability: -8 }, aiWeight: 1 }] },
  { id: "evt_d1_riot", title: "\u6C11\u53D8", description: "\u6C11\u4F17\u805A\u4F17\u95F9\u4E8B\uFF0C\u51B2\u51FB\u5E9C\u8859\u3002", category: "crisis", trigger: { maxStability: 30 }, weight: 7, cooldown: 15, unique: false, options: [{ text: "\u5F39\u538B", effects: { gold: -50, stability: -3, factionSat: fr("military", 5) }, aiWeight: 2 }, { text: "\u7B54\u5E94\u8BC9\u6C42", effects: { gold: -80, stability: 5, factionSat: fr("commoners", 10) }, aiWeight: 3 }] },
  { id: "evt_d1_collapse", title: "\u5EFA\u7B51\u574D\u584C", description: "\u5E74\u4E45\u5931\u4FEE\u7684\u5EFA\u7B51\u574D\u584C\u3002", category: "crisis", trigger: { minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u91CD\u5EFA", effects: { gold: -100, stability: 2 }, aiWeight: 3 }, { text: "\u6682\u7F6E", effects: { stability: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_invasion_raid", title: "\u86EE\u65CF\u52AB\u63A0", description: "\u86EE\u65CF\u9A91\u5175\u52AB\u63A0\u8FB9\u5883\uFF01", category: "crisis", trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u51FA\u51FB", effects: { gold: -60, factionSat: fr("military", 8), stability: 3 }, aiWeight: 3 }, { text: "\u575A\u58C1\u6E05\u91CE", effects: { food: -30, gold: -30 }, aiWeight: 2 }] },
  { id: "evt_d1_starvation", title: "\u9965\u9991", description: "\u7CAE\u5C3D\u6C11\u9965\uFF0C\u997F\u6B8D\u8F7D\u9053\u3002", category: "crisis", trigger: { maxFoodRatio: 0.4 }, weight: 8, cooldown: 15, unique: false, options: [{ text: "\u5F00\u4ED3", effects: { food: -80, stability: 4 }, aiWeight: 3 }, { text: "\u52A0\u7A0E\u8D2D\u7CAE", effects: { gold: -50, factionSat: fr("commoners", -15) }, aiWeight: 1 }] },
  { id: "evt_d1_unrest_spread", title: "\u9A9A\u4E71\u8513\u5EF6", description: "\u4E00\u7701\u9A9A\u4E71\u8513\u5EF6\u90BB\u7701\u3002", category: "crisis", trigger: { maxStability: 35 }, weight: 6, cooldown: 18, unique: false, options: [{ text: "\u6D3E\u5175\u9547\u538B", effects: { gold: -70, factionSat: fr("military", 6) }, aiWeight: 2 }, { text: "\u5B89\u629A", effects: { gold: -100, stability: 5 }, aiWeight: 3 }] },
  // politics +10
  { id: "evt_d1_court_intrigue", title: "\u5BAB\u5EF7\u9634\u8C0B", description: "\u540E\u5BAB\u4E0E\u671D\u81E3\u6697\u4E2D\u52FE\u7ED3\u3002", category: "politics", trigger: { minTurn: 10 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u5F7B\u67E5", effects: { gold: -50, legitimacy: 5, factionSat: fr("nobles", -8) }, aiWeight: 3 }, { text: "\u88C5\u4F5C\u4E0D\u77E5", effects: { legitimacy: -5, corruption: 5 }, aiWeight: 2 }] },
  { id: "evt_d1_minister_dismiss", title: "\u7F62\u76F8", description: "\u5BB0\u76F8\u5931\u804C\uFF0C\u671D\u91CE\u5F39\u52BE\u3002", category: "politics", trigger: { minCorruption: 40 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u7F62\u514D", effects: { legitimacy: 3, stability: -3, factionSat: fr("nobles", -10) }, aiWeight: 3 }, { text: "\u7559\u4EFB", effects: { corruption: 5, legitimacy: -5 }, aiWeight: 1 }] },
  { id: "evt_d1_faction_feud", title: "\u6D3E\u7CFB\u503E\u8F67", description: "\u4E24\u5927\u6D3E\u7CFB\u516C\u5F00\u5BF9\u7ACB\u3002", category: "politics", trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u5C45\u4E2D\u8C03\u505C", effects: { gold: -40, stability: 3 }, aiWeight: 3 }, { text: "\u652F\u6301\u4E00\u65B9", effects: { stability: -5, legitimacy: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_edict", title: "\u8BCF\u4EE4\u98CE\u6CE2", description: "\u65B0\u8BCF\u5F15\u53D1\u671D\u91CE\u4E89\u8BAE\u3002", category: "politics", trigger: { minTurn: 12 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u575A\u6301", effects: { legitimacy: 5, stability: -5 }, aiWeight: 2 }, { text: "\u6536\u56DE", effects: { legitimacy: -8, stability: 3 }, aiWeight: 3 }] },
  { id: "evt_d1_tax_revolt", title: "\u6297\u7A0E", description: "\u67D0\u7701\u62D2\u4E0D\u7EB3\u7A0E\u3002", category: "politics", trigger: { maxStability: 40 }, weight: 6, cooldown: 20, unique: false, options: [{ text: "\u6B66\u529B\u50AC\u7A0E", effects: { gold: 30, stability: -8, factionSat: fr("commoners", -12) }, aiWeight: 1 }, { text: "\u51CF\u514D", effects: { gold: -50, stability: 5 }, aiWeight: 3 }] },
  { id: "evt_d1_audit", title: "\u5BA1\u8BA1", description: "\u5BA1\u8BA1\u53D1\u73B0\u8D26\u76EE\u4E8F\u7A7A\u3002", category: "politics", trigger: { minCorruption: 30 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u8FFD\u7F34", effects: { gold: 60, corruption: -5, factionSat: fr("nobles", -8) }, aiWeight: 3 }, { text: "\u4E0D\u4E86\u4E86\u4E4B", effects: { corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_d1_promotion", title: "\u64E2\u5347", description: "\u529F\u81E3\u8BF7\u8D4F\u3002", category: "politics", trigger: { minTurn: 10, minStability: 40 }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u91CD\u8D4F", effects: { gold: -80, legitimacy: 5, factionSat: fr("nobles", 8) }, aiWeight: 3 }, { text: "\u8584\u8D4F", effects: { factionSat: fr("nobles", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_law_dispute", title: "\u5F8B\u6CD5\u4E89\u8BAE", description: "\u65B0\u5F8B\u5F15\u53D1\u6CD5\u7406\u4E89\u8BAE\u3002", category: "politics", trigger: { minTurn: 15 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u4FEE\u8BA2", effects: { gold: -60, legitimacy: 3 }, aiWeight: 3 }, { text: "\u7EF4\u6301", effects: { stability: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_generalissimo", title: "\u5C06\u6743\u8FC7\u91CD", description: "\u5927\u5C06\u6743\u503E\u671D\u91CE\u3002", category: "politics", trigger: { minTurn: 20 }, weight: 5, cooldown: 40, unique: false, options: [{ text: "\u524A\u6743", effects: { factionSat: fr("military", -15), stability: 3 }, aiWeight: 3 }, { text: "\u7EB5\u5BB9", effects: { legitimacy: -8, corruption: 5 }, aiWeight: 1 }] },
  { id: "evt_d1_reform_backlash", title: "\u6539\u9769\u53CD\u5F39", description: "\u65E7\u52BF\u529B\u53CD\u6251\u65B0\u653F\u3002", category: "politics", trigger: { minTurn: 15 }, weight: 6, cooldown: 25, unique: false, options: [{ text: "\u575A\u6301\u6539\u9769", effects: { stability: -8, legitimacy: 5 }, aiWeight: 2 }, { text: "\u59A5\u534F", effects: { stability: 3, legitimacy: -5 }, aiWeight: 3 }] },
  // economy +10
  { id: "evt_d1_inflation", title: "\u901A\u80C0", description: "\u7269\u4EF7\u98DE\u6DA8\uFF0C\u6C11\u6028\u6CB8\u817E\u3002", category: "economy", trigger: { minTurn: 12 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u5E73\u6291\u7269\u4EF7", effects: { gold: -100, stability: 4 }, aiWeight: 3 }, { text: "\u4EFB\u5176\u53D1\u5C55", effects: { factionSat: fr("commoners", -12) }, aiWeight: 1 }] },
  { id: "evt_d1_depression", title: "\u8427\u6761", description: "\u5546\u4E1A\u8427\u6761\uFF0C\u5E02\u573A\u51B7\u6E05\u3002", category: "economy", trigger: { minTurn: 15, notAtWar: true }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u523A\u6FC0", effects: { gold: -120, factionSat: fr("merchants", 10) }, aiWeight: 3 }, { text: "\u7B49\u5F85\u590D\u82CF", effects: { gold: -20, factionSat: fr("merchants", -8) }, aiWeight: 2 }] },
  { id: "evt_d1_smuggling", title: "\u8D70\u79C1\u7316\u7357", description: "\u8D70\u79C1\u6D41\u5931\u5927\u91CF\u7A0E\u91D1\u3002", category: "economy", trigger: { minCorruption: 35 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u4E25\u6253", effects: { gold: 80, corruption: -3, factionSat: fr("merchants", -8) }, aiWeight: 3 }, { text: "\u9ED8\u8BB8", effects: { corruption: 4 }, aiWeight: 2 }] },
  { id: "evt_d1_coinage", title: "\u5E01\u5236\u6539\u9769", description: "\u94B1\u5E01\u8D2C\u503C\u5F15\u53D1\u6DF7\u4E71\u3002", category: "economy", trigger: { minTurn: 18 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u6574\u987F\u5E01\u5236", effects: { gold: -150, stability: 5, corruption: -5 }, aiWeight: 3 }, { text: "\u653E\u4EFB", effects: { factionSat: fr("merchants", -10) }, aiWeight: 2 }] },
  { id: "evt_d1_harvest_tax", title: "\u79CB\u6536\u5F81\u7A0E", description: "\u4E30\u6536\u4E4B\u5E74\u8BE5\u5F81\u591A\u5C11\uFF1F", category: "economy", trigger: { minTurn: 5 }, weight: 5, cooldown: 15, unique: false, options: [{ text: "\u91CD\u7A0E", effects: { gold: 120, factionSat: fr("commoners", -10) }, aiWeight: 2 }, { text: "\u8584\u7A0E", effects: { gold: 50, factionSat: fr("commoners", 8) }, aiWeight: 3 }] },
  { id: "evt_d1_trade_disrupt", title: "\u5546\u8DEF\u963B\u65AD", description: "\u5546\u8DEF\u88AB\u532A\u5F92\u963B\u65AD\u3002", category: "economy", trigger: { minTurn: 10 }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u6E05\u527F", effects: { gold: -60, factionSat: fr("merchants", 10) }, aiWeight: 3 }, { text: "\u7ED5\u9053", effects: { gold: -20, factionSat: fr("merchants", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_usury", title: "\u9AD8\u5229\u8D37", description: "\u5BCC\u5546\u653E\u9AD8\u5229\u8D37\u76D8\u5265\u767E\u59D3\u3002", category: "economy", trigger: { minCorruption: 25 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u9650\u5236\u5229\u7387", effects: { gold: -30, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "merchants", delta: -8 }) }, aiWeight: 3 }, { text: "\u653E\u4EFB", effects: { corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_d1_grain_store", title: "\u7CAE\u50A8", description: "\u7CAE\u50A8\u662F\u5426\u5145\u5B9E\uFF1F", category: "economy", trigger: { minTurn: 8 }, weight: 3, cooldown: 20, unique: false, options: [{ text: "\u5E7F\u50A8", effects: { gold: -80, food: 100, stability: 3 }, aiWeight: 3 }, { text: "\u5C11\u50A8", effects: { gold: 20, food: -20 }, aiWeight: 2 }] },
  { id: "evt_d1_market_tax", title: "\u5E02\u7A0E", description: "\u662F\u5426\u63D0\u9AD8\u5E02\u573A\u7A0E\uFF1F", category: "economy", trigger: { minTurn: 6 }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u63D0\u9AD8", effects: { gold: 80, factionSat: fr("merchants", -10) }, aiWeight: 2 }, { text: "\u7EF4\u6301", effects: { factionSat: fr("merchants", 5) }, aiWeight: 3 }] },
  { id: "evt_d1_labor_short", title: "\u52B3\u529B\u77ED\u7F3A", description: "\u5174\u5EFA\u5927\u5DE5\u7A0B\u52B3\u529B\u4E0D\u8DB3\u3002", category: "economy", trigger: { minTurn: 12 }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u5F81\u5F79", effects: { factionSat: fr("commoners", -10), stability: -3 }, aiWeight: 2 }, { text: "\u52DF\u5DE5", effects: { gold: -100 }, aiWeight: 3 }] },
  // military +10
  { id: "evt_d1_mutiny", title: "\u54D7\u53D8", description: "\u6B20\u9977\u58EB\u5175\u54D7\u53D8\uFF01", category: "military", trigger: { minTurn: 10, factionSatBelow: { faction: "military", threshold: 15 } }, weight: 7, cooldown: 25, unique: false, options: [{ text: "\u9547\u538B", effects: { gold: -80, stability: -10, factionSat: fr("military", -15) }, aiWeight: 1 }, { text: "\u8865\u9977", effects: { gold: -150, factionSat: fr("military", 15) }, aiWeight: 3 }] },
  { id: "evt_d1_general_die", title: "\u540D\u5C06\u9668\u843D", description: "\u4E00\u4EE3\u540D\u5C06\u75C5\u901D\u3002", category: "military", trigger: { minTurn: 20 }, weight: 4, cooldown: 50, unique: false, options: [{ text: "\u539A\u846C", effects: { gold: -60, legitimacy: 3, factionSat: fr("military", 8) }, aiWeight: 3 }, { text: "\u7B80\u846C", effects: { factionSat: fr("military", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_border_warn", title: "\u8FB9\u8B66", description: "\u8FB9\u62A5\u9891\u4F20\uFF0C\u654C\u56FD\u5F02\u52A8\u3002", category: "military", trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u589E\u5175", effects: { gold: -80, factionSat: fr("military", 5) }, aiWeight: 3 }, { text: "\u89C2\u671B", effects: { stability: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_conscript_wave", title: "\u5F81\u5175", description: "\u662F\u5426\u5927\u89C4\u6A21\u5F81\u5175\uFF1F", category: "military", trigger: { atWar: true }, weight: 6, cooldown: 15, unique: false, options: [{ text: "\u5927\u5F81", effects: { factionSat: fra({ faction: "commoners", delta: -15 }, { faction: "military", delta: 10 }) }, aiWeight: 2 }, { text: "\u5C0F\u5F81", effects: { factionSat: fr("military", 3) }, aiWeight: 3 }] },
  { id: "evt_d1_supply_cut", title: "\u8865\u7ED9\u7EBF\u65AD", description: "\u524D\u7EBF\u8865\u7ED9\u88AB\u5207\u65AD\uFF01", category: "military", trigger: { atWar: true, minTurn: 5 }, weight: 6, cooldown: 20, unique: false, options: [{ text: "\u6253\u901A", effects: { gold: -100, factionSat: fr("military", 8) }, aiWeight: 3 }, { text: "\u5C31\u5730\u5F81\u7CAE", effects: { factionSat: fr("commoners", -12), stability: -5 }, aiWeight: 1 }] },
  { id: "evt_d1_veteran_return", title: "\u8001\u5175\u5F52\u4E61", description: "\u6218\u540E\u8001\u5175\u5F52\u4E61\u5B89\u7F6E\u3002", category: "military", trigger: { minTurn: 15 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u6388\u7530", effects: { gold: -100, factionSat: fra({ faction: "military", delta: 12 }, { faction: "commoners", delta: 5 }) }, aiWeight: 3 }, { text: "\u4E0D\u7BA1", effects: { factionSat: fr("military", -10), stability: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_fortify", title: "\u7B51\u57CE", description: "\u662F\u5426\u52A0\u56FA\u57CE\u9632\uFF1F", category: "military", trigger: { minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5927\u5174", effects: { gold: -120, stability: 5 }, aiWeight: 3 }, { text: "\u5C0F\u4FEE", effects: { gold: -30 }, aiWeight: 2 }] },
  { id: "evt_d1_alliance_call", title: "\u76DF\u53CB\u6C42\u63F4", description: "\u76DF\u56FD\u906D\u5165\u4FB5\u6C42\u63F4\u3002", category: "military", trigger: { minTurn: 12, notAtWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u51FA\u5175", effects: { gold: -100, factionSat: fr("military", 8), influence: 5 }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { influence: -8 }, aiWeight: 2 }] },
  { id: "evt_d1_pirate", title: "\u6D77\u76D7", description: "\u6D77\u76D7\u88AD\u6270\u6CBF\u6D77\uFF01", category: "military", trigger: { minTurn: 10 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u527F\u706D", effects: { gold: -80, factionSat: fr("military", 6) }, aiWeight: 3 }, { text: "\u62DB\u5B89", effects: { gold: -40, corruption: 4 }, aiWeight: 2 }] },
  { id: "evt_d1_war_debt", title: "\u6218\u503A", description: "\u6218\u4E89\u8017\u8D39\u5DE8\u5927\uFF0C\u56FD\u5E93\u544A\u6025\u3002", category: "military", trigger: { atWar: true, minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: "\u52A0\u7A0E\u507F\u503A", effects: { gold: 80, factionSat: fr("commoners", -12) }, aiWeight: 2 }, { text: "\u4E3E\u503A", effects: { gold: 100, corruption: 5 }, aiWeight: 3 }] },
  // diplomacy +10
  { id: "evt_d1_envoy_gift", title: "\u4F7F\u8282\u732E\u793C", description: "\u5916\u56FD\u4F7F\u8282\u5E26\u6765\u539A\u793C\u3002", category: "diplomacy", trigger: { minTurn: 8, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u56DE\u793C", effects: { gold: -50, influence: 8 }, aiWeight: 3 }, { text: "\u6536\u4E0B", effects: { gold: 30, influence: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_marriage", title: "\u8054\u59FB", description: "\u90BB\u56FD\u63D0\u8BAE\u8054\u59FB\u7ED3\u76DF\u3002", category: "diplomacy", trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u5E94\u5141", effects: { gold: -80, influence: 15, legitimacy: 3 }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { influence: -8 }, aiWeight: 2 }] },
  { id: "evt_d1_trade_pact", title: "\u5546\u7EA6", description: "\u90BB\u56FD\u63D0\u8BAE\u7B7E\u8BA2\u5546\u7EA6\u3002", category: "diplomacy", trigger: { minTurn: 8, notAtWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u7B7E\u8BA2", effects: { gold: 60, influence: 5, factionSat: fr("merchants", 10) }, aiWeight: 3 }, { text: "\u89C2\u671B", effects: { factionSat: fr("merchants", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_insult", title: "\u53D7\u8FB1", description: "\u90BB\u56FD\u4F7F\u8282\u51FA\u8A00\u4E0D\u900A\u3002", category: "diplomacy", trigger: { minTurn: 12 }, weight: 4, cooldown: 20, unique: false, options: [{ text: "\u6297\u8BAE", effects: { influence: -5, stability: 3 }, aiWeight: 2 }, { text: "\u5FCD\u8BA9", effects: { legitimacy: -3 }, aiWeight: 3 }] },
  { id: "evt_d1_refugee_return", title: "\u9063\u8FD4", description: "\u90BB\u56FD\u8981\u6C42\u9063\u8FD4\u6D41\u6C11\u3002", category: "diplomacy", trigger: { minTurn: 15 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u9063\u8FD4", effects: { influence: 5, stability: -3 }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { influence: -8 }, aiWeight: 2 }] },
  { id: "evt_d1_embassy", title: "\u8BBE\u4F7F\u9986", description: "\u662F\u5426\u5728\u5404\u56FD\u8BBE\u4F7F\u9986\uFF1F", category: "diplomacy", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8BBE\u7ACB", effects: { gold: -100, influence: 12 }, aiWeight: 3 }, { text: "\u6682\u7F13", effects: { influence: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_hostage", title: "\u8D28\u5B50", description: "\u90BB\u56FD\u9001\u8D28\u5B50\u4EE5\u6C42\u548C\u3002", category: "diplomacy", trigger: { minTurn: 15 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u63A5\u53D7", effects: { influence: 10, stability: -3 }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { influence: -5 }, aiWeight: 2 }] },
  { id: "evt_d1_summit", title: "\u4F1A\u76DF", description: "\u8BF8\u56FD\u63D0\u8BAE\u4F1A\u76DF\u3002", category: "diplomacy", trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 60, unique: false, options: [{ text: "\u4E3B\u76DF", effects: { gold: -150, influence: 20, legitimacy: 5 }, aiWeight: 3 }, { text: "\u5217\u5E2D", effects: { influence: 5 }, aiWeight: 2 }] },
  { id: "evt_d1_spy_caught", title: "\u7EC6\u4F5C", description: "\u6293\u83B7\u90BB\u56FD\u7EC6\u4F5C\u3002", category: "diplomacy", trigger: { minTurn: 10 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u5904\u6B7B", effects: { influence: -5, stability: 3 }, aiWeight: 2 }, { text: "\u9063\u8FD4", effects: { influence: 3 }, aiWeight: 3 }] },
  { id: "evt_d1_trade_war", title: "\u5546\u6218", description: "\u90BB\u56FD\u5BF9\u6211\u52A0\u5F81\u5173\u7A0E\u3002", category: "diplomacy", trigger: { minTurn: 15 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u53CD\u5236", effects: { gold: -50, factionSat: fr("merchants", -8) }, aiWeight: 2 }, { text: "\u8C08\u5224", effects: { gold: -30, influence: 5 }, aiWeight: 3 }] },
  // religion +10
  { id: "evt_d1_heresy", title: "\u5F02\u7AEF", description: "\u5F02\u7AEF\u5B66\u8BF4\u8513\u5EF6\u3002", category: "religion", trigger: { minTurn: 12 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u8BA8\u4F10", effects: { gold: -60, factionSat: fr("clergy", 12), stability: -5 }, aiWeight: 2 }, { text: "\u8FA9\u8BBA", effects: { gold: -20, legitimacy: 3 }, aiWeight: 3 }] },
  { id: "evt_d1_shrine_build", title: "\u7ACB\u7960", description: "\u662F\u5426\u4E3A\u529F\u81E3\u7ACB\u7960\uFF1F", category: "religion", trigger: { minTurn: 15, minStability: 40 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u7ACB\u7960", effects: { gold: -80, legitimacy: 5, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u4E0D\u7ACB", effects: { factionSat: fr("clergy", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_omen", title: "\u5929\u8C61", description: "\u5F02\u8C61\u5F15\u53D1\u6050\u614C\u3002", category: "religion", trigger: { minTurn: 8 }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u796D\u7940", effects: { gold: -50, legitimacy: 5, stability: 3 }, aiWeight: 3 }, { text: "\u4E0D\u7406", effects: { stability: -5 }, aiWeight: 2 }] },
  { id: "evt_d1_conversion", title: "\u6539\u5B97", description: "\u90E8\u5206\u6C11\u4F17\u6539\u4FE1\u5F02\u6559\u3002", category: "religion", trigger: { minTurn: 15, provinceCultureDiff: true }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u4F20\u6559", effects: { gold: -60, factionSat: fr("clergy", 10) }, aiWeight: 3 }, { text: "\u5BBD\u5BB9", effects: { stability: 3, factionSat: fr("clergy", -8) }, aiWeight: 2 }] },
  { id: "evt_d1_temple_fire", title: "\u5BFA\u5E99\u706B\u707E", description: "\u4E3B\u5BFA\u5E99\u5931\u706B\u3002", category: "religion", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u91CD\u5EFA", effects: { gold: -100, factionSat: fr("clergy", 12) }, aiWeight: 3 }, { text: "\u6682\u7F6E", effects: { factionSat: fr("clergy", -10) }, aiWeight: 2 }] },
  { id: "evt_d1_festival", title: "\u5B97\u6559\u8282", description: "\u76DB\u5927\u5B97\u6559\u8282\u65E5\u5C06\u81F3\u3002", category: "religion", trigger: { minTurn: 8, notAtWar: true }, weight: 3, cooldown: 20, unique: false, options: [{ text: "\u5927\u529E", effects: { gold: -70, stability: 5, factionSat: fr("clergy", 10) }, aiWeight: 3 }, { text: "\u7B80\u529E", effects: { factionSat: fr("clergy", -5) }, aiWeight: 2 }] },
  { id: "evt_d1_sacrilege", title: "\u4EB5\u6E0E", description: "\u6709\u4EBA\u4EB5\u6E0E\u795E\u5E99\u3002", category: "religion", trigger: { minTurn: 12 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u4E25\u60E9", effects: { factionSat: fr("clergy", 12), stability: -3 }, aiWeight: 2 }, { text: "\u5BBD\u6055", effects: { factionSat: fr("clergy", -10) }, aiWeight: 3 }] },
  { id: "evt_d1_prophecy", title: "\u9884\u8A00", description: "\u5DEB\u5E08\u9884\u8A00\u56FD\u8FD0\u3002", category: "religion", trigger: { minTurn: 18 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u4FE1\u4E4B", effects: { gold: -40, legitimacy: -3 }, aiWeight: 2 }, { text: "\u65A5\u4E4B", effects: { factionSat: fr("clergy", -8), stability: 3 }, aiWeight: 3 }] },
  { id: "evt_d1_donation", title: "\u6350\u8D60", description: "\u5BCC\u5546\u6350\u8D60\u5BFA\u5E99\u3002", category: "religion", trigger: { minTurn: 12, notAtWar: true }, weight: 2, cooldown: 30, unique: false, options: [{ text: "\u9F13\u52B1", effects: { factionSat: fra({ faction: "clergy", delta: 8 }, { faction: "merchants", delta: 5 }) }, aiWeight: 3 }, { text: "\u8BFE\u7A0E", effects: { gold: 40, factionSat: fr("clergy", -8) }, aiWeight: 2 }] },
  { id: "evt_d1_relic", title: "\u5723\u7269", description: "\u53D1\u73B0\u5723\u7269\u3002", category: "religion", trigger: { minTurn: 20 }, weight: 2, cooldown: 60, unique: false, options: [{ text: "\u4F9B\u5949", effects: { gold: -50, legitimacy: 8, factionSat: fr("clergy", 15) }, aiWeight: 3 }, { text: "\u79D8\u85CF", effects: { legitimacy: 3 }, aiWeight: 2 }] },
  // science +10
  { id: "evt_d1_invention", title: "\u53D1\u660E", description: "\u5DE5\u5320\u53D1\u660E\u65B0\u5668\u5177\u3002", category: "science", trigger: { minTurn: 10, techLevelAbove: { branch: "admin", level: 1 } }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u63A8\u5E7F", effects: { gold: -80, sciPt: 15, factionSat: fr("merchants", 8) }, aiWeight: 3 }, { text: "\u8D4F\u8D50", effects: { gold: -20, sciPt: 5 }, aiWeight: 2 }] },
  { id: "evt_d1_academy", title: "\u4E66\u9662", description: "\u5B66\u8005\u8BF7\u7ACB\u4E66\u9662\u3002", category: "science", trigger: { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u6279\u51C6", effects: { gold: -100, sciPt: 20, legitimacy: 3 }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: { sciPt: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_scholar_invite", title: "\u62DB\u8D24", description: "\u5F02\u56FD\u8D24\u624D\u6765\u6295\u3002", category: "science", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u91CD\u7528", effects: { gold: -60, sciPt: 12, factionSat: fr("nobles", -5) }, aiWeight: 3 }, { text: "\u4E0D\u7528", effects: { sciPt: -2 }, aiWeight: 2 }] },
  { id: "evt_d1_experiment", title: "\u5B9E\u9A8C", description: "\u5B66\u8005\u8BF7\u6C42\u505A\u5371\u9669\u5B9E\u9A8C\u3002", category: "science", trigger: { minTurn: 15, techLevelAbove: { branch: "agri", level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u5141\u8BB8", effects: { sciPt: 15, stability: -3 }, aiWeight: 3 }, { text: "\u7981\u6B62", effects: { sciPt: -5, factionSat: fr("clergy", 5) }, aiWeight: 2 }] },
  { id: "evt_d1_translation", title: "\u8BD1\u4E66", description: "\u662F\u5426\u7FFB\u8BD1\u5F02\u56FD\u5178\u7C4D\uFF1F", category: "science", trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u7FFB\u8BD1", effects: { gold: -80, sciPt: 10, influence: 5 }, aiWeight: 3 }, { text: "\u4E0D\u8BD1", effects: { sciPt: -2 }, aiWeight: 2 }] },
  { id: "evt_d1_observation", title: "\u89C2\u6D4B", description: "\u5929\u6587\u5B66\u5BB6\u8BF7\u6C42\u5EFA\u89C2\u8C61\u53F0\u3002", category: "science", trigger: { minTurn: 20, techLevelAbove: { branch: "culture", level: 2 } }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u5174\u5EFA", effects: { gold: -120, sciPt: 20, legitimacy: 5 }, aiWeight: 3 }, { text: "\u7F13\u8BAE", effects: { sciPt: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_medicine", title: "\u533B\u672F", description: "\u540D\u533B\u732E\u4E0A\u65B0\u533B\u672F\u3002", category: "science", trigger: { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u63A8\u5E7F", effects: { gold: -60, population: 100, stability: 3 }, aiWeight: 3 }, { text: "\u89C2\u671B", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_engineering", title: "\u5DE5\u7A0B", description: "\u5DE5\u7A0B\u5E08\u732E\u65B0\u6CD5\u3002", category: "science", trigger: { minTurn: 18, techLevelAbove: { branch: "admin", level: 3 } }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u91C7\u7528", effects: { gold: -80, sciPt: 8 }, aiWeight: 3 }, { text: "\u4E0D\u7528", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_philosophy", title: "\u54F2\u5B66", description: "\u54F2\u5B66\u5BB6\u63D0\u51FA\u65B0\u8BF4\u3002", category: "science", trigger: { minTurn: 20, techLevelAbove: { branch: "culture", level: 3 } }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u8868\u5F70", effects: { gold: -30, sciPt: 10, legitimacy: 3 }, aiWeight: 3 }, { text: "\u7981\u7EDD", effects: { stability: -5, factionSat: fr("clergy", 8) }, aiWeight: 1 }] },
  { id: "evt_d1_archive", title: "\u6863\u6848", description: "\u662F\u5426\u6574\u7406\u56FD\u5BB6\u6863\u6848\uFF1F", category: "science", trigger: { minTurn: 15 }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u6574\u7406", effects: { gold: -50, sciPt: 8, legitimacy: 3 }, aiWeight: 3 }, { text: "\u4E0D\u7406", effects: {}, aiWeight: 2 }] },
  // opportunity +10
  { id: "evt_d1_talent", title: "\u8D24\u624D", description: "\u5728\u91CE\u8D24\u624D\u6C42\u4ED5\u3002", category: "opportunity", trigger: { minTurn: 8, minStability: 30 }, weight: 3, cooldown: 25, unique: false, options: [{ text: "\u7834\u683C", effects: { gold: -40, legitimacy: 5, factionSat: fr("nobles", -5) }, aiWeight: 3 }, { text: "\u5FAA\u4F8B", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_land_claim", title: "\u65E0\u4E3B\u4E4B\u5730", description: "\u8FB9\u5883\u53D1\u73B0\u65E0\u4E3B\u6C83\u571F\u3002", category: "opportunity", trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u5360\u9886", effects: { gold: -60, stability: 3 }, aiWeight: 3 }, { text: "\u653E\u5F03", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_ancient", title: "\u53E4\u8FF9", description: "\u53D1\u73B0\u53E4\u4EE3\u9057\u8FF9\u3002", category: "opportunity", trigger: { minTurn: 15 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u53D1\u6398", effects: { gold: -50, sciPt: 10, legitimacy: 3 }, aiWeight: 3 }, { text: "\u4FDD\u62A4", effects: { influence: 3 }, aiWeight: 2 }] },
  { id: "evt_d1_alliance_offer", title: "\u6765\u6295", description: "\u5C0F\u56FD\u6C42\u4E3A\u9644\u5EB8\u3002", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u63A5\u53D7", effects: { gold: -80, influence: 15, stability: -3 }, aiWeight: 3 }, { text: "\u62D2\u7EDD", effects: { influence: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_reform_open", title: "\u6539\u9769\u826F\u673A", description: "\u6C11\u5FC3\u53EF\u7528\uFF0C\u6539\u9769\u826F\u673A\u3002", category: "opportunity", trigger: { minTurn: 18, minStability: 50 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u63A8\u884C", effects: { gold: -100, legitimacy: 8, stability: -5 }, aiWeight: 3 }, { text: "\u7F13\u8BAE", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_feast", title: "\u76DB\u5BB4", description: "\u662F\u5426\u4E3E\u529E\u76DB\u5BB4\u5F70\u663E\u56FD\u529B\uFF1F", category: "opportunity", trigger: { minTurn: 12, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5927\u529E", effects: { gold: -100, influence: 12, legitimacy: 3 }, aiWeight: 3 }, { text: "\u7B80\u529E", effects: { gold: -20 }, aiWeight: 2 }] },
  { id: "evt_d1_tribute", title: "\u671D\u8D21", description: "\u5C0F\u56FD\u6765\u671D\u8D21\u3002", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u539A\u8D4F", effects: { gold: -80, influence: 15 }, aiWeight: 3 }, { text: "\u8584\u8D4F", effects: { gold: -20, influence: 3 }, aiWeight: 2 }] },
  { id: "evt_d1_explorer", title: "\u63A2\u9669", description: "\u63A2\u9669\u5BB6\u8BF7\u7F28\u8FDC\u5F81\u3002", category: "opportunity", trigger: { minTurn: 20 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u8D44\u52A9", effects: { gold: -120, influence: 10, sciPt: 5 }, aiWeight: 3 }, { text: "\u4E0D\u5141", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_census", title: "\u666E\u67E5", description: "\u662F\u5426\u666E\u67E5\u4EBA\u53E3\uFF1F", category: "opportunity", trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u666E\u67E5", effects: { gold: 20, corruption: -3 }, aiWeight: 3 }, { text: "\u4E0D\u67E5", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_diplomat", title: "\u7EB5\u6A2A", description: "\u7EB5\u6A2A\u5BB6\u6765\u6295\u3002", category: "opportunity", trigger: { minTurn: 15, notAtWar: true }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u91CD\u7528", effects: { gold: -50, influence: 12 }, aiWeight: 3 }, { text: "\u4E0D\u7528", effects: {}, aiWeight: 2 }] },
  // culture +10
  { id: "evt_d1_poet", title: "\u8BD7\u4EBA", description: "\u8457\u540D\u8BD7\u4EBA\u6765\u6E38\u3002", category: "culture", trigger: { minTurn: 10, minStability: 30 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u6B3E\u5F85", effects: { gold: -30, influence: 8, legitimacy: 3 }, aiWeight: 3 }, { text: "\u4E0D\u89C1", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_art", title: "\u827A\u672F", description: "\u827A\u672F\u5BB6\u8BF7\u8D5E\u52A9\u3002", category: "culture", trigger: { minTurn: 12, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u8D5E\u52A9", effects: { gold: -50, influence: 8 }, aiWeight: 3 }, { text: "\u5A49\u62D2", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_history", title: "\u4FEE\u53F2", description: "\u662F\u5426\u4FEE\u56FD\u53F2\uFF1F", category: "culture", trigger: { minTurn: 15 }, weight: 3, cooldown: 50, unique: false, options: [{ text: "\u4FEE\u53F2", effects: { gold: -80, legitimacy: 8, influence: 5 }, aiWeight: 3 }, { text: "\u7F13\u8BAE", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_etiquette", title: "\u793C\u5236", description: "\u662F\u5426\u9769\u65B0\u793C\u5236\uFF1F", category: "culture", trigger: { minTurn: 18 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u9769\u65B0", effects: { gold: -60, legitimacy: 5, stability: -3 }, aiWeight: 3 }, { text: "\u5B88\u65E7", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_architecture", title: "\u5EFA\u7B51", description: "\u65B0\u5EFA\u7B51\u98CE\u683C\u6D41\u884C\u3002", category: "culture", trigger: { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u91C7\u7528", effects: { gold: -80, influence: 8 }, aiWeight: 3 }, { text: "\u4E0D\u7528", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_music", title: "\u96C5\u4E50", description: "\u662F\u5426\u6574\u7406\u96C5\u4E50\uFF1F", category: "culture", trigger: { minTurn: 12, minStability: 40 }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u6574\u7406", effects: { gold: -40, legitimacy: 5, factionSat: fr("clergy", 5) }, aiWeight: 3 }, { text: "\u4E0D\u7406", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_fashion", title: "\u670D\u9970", description: "\u65B0\u670D\u9970\u98CE\u683C\u5174\u8D77\u3002", category: "culture", trigger: { minTurn: 15 }, weight: 2, cooldown: 40, unique: false, options: [{ text: "\u63A8\u5E7F", effects: { gold: -30, influence: 5 }, aiWeight: 3 }, { text: "\u7981\u7EDD", effects: { stability: -3 }, aiWeight: 2 }] },
  { id: "evt_d1_language", title: "\u6587\u5B57", description: "\u662F\u5426\u7EDF\u4E00\u6587\u5B57\uFF1F", category: "culture", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 3 } }, weight: 3, cooldown: 60, unique: false, options: [{ text: "\u7EDF\u4E00", effects: { gold: -100, legitimacy: 10, stability: -5 }, aiWeight: 3 }, { text: "\u4E0D\u7EDF", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_festival_art", title: "\u827A\u672F\u8282", description: "\u662F\u5426\u4E3E\u529E\u827A\u672F\u8282\uFF1F", category: "culture", trigger: { minTurn: 12, notAtWar: true, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u4E3E\u529E", effects: { gold: -60, influence: 10, stability: 3 }, aiWeight: 3 }, { text: "\u4E0D\u529E", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_legend", title: "\u4F20\u5947", description: "\u6C11\u95F4\u6D41\u4F20\u672C\u671D\u4F20\u5947\u3002", category: "culture", trigger: { minTurn: 18, minStability: 50 }, weight: 2, cooldown: 50, unique: false, options: [{ text: "\u9F13\u52B1", effects: { legitimacy: 5, influence: 5 }, aiWeight: 3 }, { text: "\u7981\u7EDD", effects: { stability: -3 }, aiWeight: 2 }] },
  // population +7
  { id: "evt_d1_migration", title: "\u8FC1\u5F99", description: "\u90E8\u5206\u6C11\u4F17\u6B32\u8FC1\u5F99\u4ED6\u4E61\u3002", category: "population", trigger: { minTurn: 10, maxStability: 40 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u633D\u7559", effects: { gold: -50, stability: 3 }, aiWeight: 3 }, { text: "\u4EFB\u5176", effects: { population: -200 }, aiWeight: 2 }] },
  { id: "evt_d1_birth_boom", title: "\u5A74\u513F\u6F6E", description: "\u4ECA\u5E74\u51FA\u751F\u7387\u5927\u589E\u3002", category: "population", trigger: { minTurn: 8, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u9F13\u52B1", effects: { gold: -40, population: 200 }, aiWeight: 3 }, { text: "\u4E0D\u7BA1", effects: { population: 100 }, aiWeight: 2 }] },
  { id: "evt_d1_plague_death", title: "\u75AB\u540E", description: "\u75AB\u75C5\u540E\u4EBA\u53E3\u9AA4\u51CF\u3002", category: "population", trigger: { minTurn: 15 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u4F11\u517B", effects: { gold: -60, population: 100, stability: 3 }, aiWeight: 3 }, { text: "\u4E0D\u7BA1", effects: { population: -100 }, aiWeight: 2 }] },
  { id: "evt_d1_labor_demand", title: "\u52B3\u529B", description: "\u767E\u4E1A\u5174\u65FA\u52B3\u529B\u4E0D\u8DB3\u3002", category: "population", trigger: { minTurn: 12, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u62DB\u629A", effects: { gold: -50, population: 150 }, aiWeight: 3 }, { text: "\u4E0D\u52A0", effects: {}, aiWeight: 2 }] },
  { id: "evt_d1_urban", title: "\u57CE\u5E02\u5316", description: "\u6C11\u4F17\u6D8C\u5165\u57CE\u5E02\u3002", category: "population", trigger: { minTurn: 15, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u5B89\u7F6E", effects: { gold: -80, stability: 3, factionSat: fr("commoners", 8) }, aiWeight: 3 }, { text: "\u4E0D\u7BA1", effects: { stability: -3, corruption: 3 }, aiWeight: 2 }] },
  { id: "evt_d1_emigration", title: "\u5916\u6D41", description: "\u6C11\u4F17\u5916\u6D41\u4ED6\u56FD\u3002", category: "population", trigger: { minTurn: 12, maxStability: 35 }, weight: 4, cooldown: 25, unique: false, options: [{ text: "\u963B\u6B62", effects: { gold: -40, stability: -3 }, aiWeight: 2 }, { text: "\u4EFB\u5176", effects: { population: -150, influence: -3 }, aiWeight: 3 }] },
  { id: "evt_d1_clan", title: "\u5B97\u65CF", description: "\u5927\u5B97\u65CF\u517C\u5E76\u5C0F\u6237\u3002", category: "population", trigger: { minTurn: 15, minCorruption: 30 }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u6291\u5236", effects: { gold: -50, factionSat: fra({ faction: "nobles", delta: -10 }, { faction: "commoners", delta: 8 }) }, aiWeight: 3 }, { text: "\u4E0D\u7BA1", effects: { corruption: 3 }, aiWeight: 2 }] },
  // ── D1 事件链 11-15（5 链 × 3 事件 = 15 事件）──
  // 链 11：蛮族入侵链——预警→入侵→和或战
  { id: "evt_chain_barbarian_1", title: "\u86EE\u65CF\u96C6\u7ED3", description: "\u8FB9\u62A5\uFF1A\u86EE\u65CF\u4E8E\u585E\u5916\u96C6\u7ED3\uFF0C\u4F3C\u6709\u5357\u4E0B\u4E4B\u610F\uFF01", category: "military", trigger: { minTurn: 12 }, weight: 5, cooldown: 80, unique: false, options: [
    { text: "\u589E\u5175\u6212\u5907", effects: { gold: -80, factionSat: fr("military", 5), triggerEvent: "evt_chain_barbarian_2" }, aiWeight: 3 },
    { text: "\u9063\u4F7F\u63A2\u865A\u5B9E", effects: { gold: -30, influence: -3, triggerEvent: "evt_chain_barbarian_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_barbarian_2", title: "\u86EE\u65CF\u5357\u4E0B", description: "\u86EE\u65CF\u94C1\u9A91\u5357\u4E0B\uFF0C\u8FDE\u9677\u6570\u9547\uFF01", category: "military", trigger: { minTurn: 13 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u4E3B\u529B\u51B3\u6218", effects: { gold: -150, factionSat: fr("military", 10), stability: -5, triggerEvent: "evt_chain_barbarian_3" }, aiWeight: 2 },
    { text: "\u575A\u58C1\u6E05\u91CE", effects: { food: -100, gold: -60, stability: -8, triggerEvent: "evt_chain_barbarian_3" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_barbarian_3", title: "\u86EE\u65CF\u4F59\u6CE2", description: "\u86EE\u65CF\u9000\u53BB\uFF0C\u8FB9\u5883\u6B8B\u7834\u3002", category: "military", trigger: { minTurn: 14 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u91CD\u5EFA\u8FB9\u5883", effects: { gold: -120, stability: 5, factionSat: fr("commoners", 8) }, aiWeight: 3 },
    { text: "\u6682\u7F6E", effects: { stability: -3, influence: -5 }, aiWeight: 2 }
  ] },
  // 链 12：继位内战链——驾崩→争位→内战或和解
  { id: "evt_chain_succession_1", title: "\u541B\u4E3B\u9A7E\u5D29", description: "\u541B\u4E3B\u7A81\u7136\u9A7E\u5D29\uFF0C\u672A\u7ACB\u592A\u5B50\uFF01", category: "politics", trigger: { minTurn: 25 }, weight: 6, cooldown: 100, unique: true, options: [
    { text: "\u7ACB\u957F\u5B50", effects: { legitimacy: 5, stability: -5, triggerEvent: "evt_chain_succession_2" }, aiWeight: 3 },
    { text: "\u62E9\u8D24\u7ACB", effects: { legitimacy: -5, stability: -8, factionSat: fr("nobles", -10), triggerEvent: "evt_chain_succession_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_succession_2", title: "\u8BF8\u738B\u4E89\u4F4D", description: "\u8BF8\u738B\u5B50\u5404\u7ACB\u515A\u7FBD\uFF0C\u671D\u91CE\u5206\u88C2\uFF01", category: "politics", trigger: { minTurn: 26 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5F3A\u529B\u9547\u538B", effects: { gold: -100, stability: -10, factionSat: fr("military", 8), triggerEvent: "evt_chain_succession_3" }, aiWeight: 2 },
    { text: "\u8C08\u5224\u548C\u89E3", effects: { gold: -150, legitimacy: -8, stability: 3, triggerEvent: "evt_chain_succession_3" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_succession_3", title: "\u5185\u6218\u7ED3\u675F", description: "\u4E89\u4F4D\u4E4B\u4E89\u7EC8\u89C1\u5206\u6653\u3002", category: "politics", trigger: { minTurn: 27 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5927\u8D66\u5929\u4E0B", effects: { gold: -80, legitimacy: 10, stability: 8 }, aiWeight: 3 },
    { text: "\u6E05\u7B97\u65E7\u8D26", effects: { gold: -40, legitimacy: 5, factionSat: fr("nobles", -15) }, aiWeight: 2 }
  ] },
  // 链 13：商业革命链——新兴→繁荣→泡沫或稳固
  { id: "evt_chain_commerce_1", title: "\u5546\u56E2\u5174\u8D77", description: "\u65B0\u5174\u5546\u56E2\u52BF\u529B\u5927\u589E\uFF0C\u8981\u6C42\u66F4\u591A\u7279\u6743\uFF01", category: "economy", trigger: { minTurn: 15, notAtWar: true, techLevelAbove: { branch: "admin", level: 2 } }, weight: 4, cooldown: 80, unique: false, options: [
    { text: "\u6388\u4E88\u7279\u6743", effects: { gold: 100, factionSat: fra({ faction: "merchants", delta: 12 }, { faction: "nobles", delta: -8 }), triggerEvent: "evt_chain_commerce_2" }, aiWeight: 3 },
    { text: "\u9650\u5236", effects: { gold: -20, factionSat: fr("merchants", -10), triggerEvent: "evt_chain_commerce_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_commerce_2", title: "\u5546\u4E1A\u7E41\u8363", description: "\u5546\u4E1A\u7A7A\u524D\u7E41\u8363\uFF0C\u91D1\u5E01\u5982\u96E8\uFF01", category: "economy", trigger: { minTurn: 16 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5927\u4E3E\u5F81\u7A0E", effects: { gold: 200, factionSat: fr("merchants", -12), triggerEvent: "evt_chain_commerce_3" }, aiWeight: 2 },
    { text: "\u8F7B\u7A0E\u4FC3\u5546", effects: { gold: 80, factionSat: fr("merchants", 10), stability: 3, triggerEvent: "evt_chain_commerce_3" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_commerce_3", title: "\u5546\u6F6E\u4F59\u6CE2", description: "\u5546\u4E1A\u6D6A\u6F6E\u540E\uFF0C\u7ECF\u6D4E\u683C\u5C40\u5DF2\u53D8\u3002", category: "economy", trigger: { minTurn: 17 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u89C4\u8303\u5E02\u573A", effects: { gold: -60, corruption: -5, factionSat: fr("merchants", 5) }, aiWeight: 3 },
    { text: "\u653E\u4EFB", effects: { corruption: 8, gold: 50 }, aiWeight: 2 }
  ] },
  // 链 14：宗教改革链——异端→分裂→宽容或镇压
  { id: "evt_chain_reform_1", title: "\u5B97\u6559\u5F02\u7AEF", description: "\u65B0\u6559\u6D3E\u5174\u8D77\uFF0C\u6311\u6218\u65E7\u6559\u6743\u5A01\uFF01", category: "religion", trigger: { minTurn: 18, techLevelAbove: { branch: "culture", level: 2 } }, weight: 4, cooldown: 100, unique: false, options: [
    { text: "\u9547\u538B", effects: { gold: -80, factionSat: fr("clergy", 12), stability: -5, triggerEvent: "evt_chain_reform_2" }, aiWeight: 2 },
    { text: "\u5BB9\u5FCD", effects: { factionSat: fr("clergy", -15), stability: 3, triggerEvent: "evt_chain_reform_2" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_reform_2", title: "\u5B97\u6559\u5206\u88C2", description: "\u6559\u6D3E\u5BF9\u7ACB\u5168\u56FD\u52A8\u8361\uFF01", category: "religion", trigger: { minTurn: 19 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5B9A\u4E00\u5C0A", effects: { gold: -150, legitimacy: 8, stability: -10, factionSat: fr("clergy", 15), triggerEvent: "evt_chain_reform_3" }, aiWeight: 2 },
    { text: "\u5BBD\u5BB9\u5E76\u7ACB", effects: { gold: -50, stability: 5, legitimacy: -5, factionSat: fr("clergy", -10), triggerEvent: "evt_chain_reform_3" }, aiWeight: 3 }
  ] },
  { id: "evt_chain_reform_3", title: "\u6559\u4E89\u7EC8\u5C40", description: "\u5B97\u6559\u4E4B\u4E89\u6682\u544A\u6BB5\u843D\u3002", category: "religion", trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u91CD\u5EFA\u6559\u6743", effects: { gold: -100, legitimacy: 5, factionSat: fr("clergy", 10) }, aiWeight: 3 },
    { text: "\u653F\u6559\u5206\u79BB", effects: { gold: -50, stability: 5, factionSat: fr("clergy", -8) }, aiWeight: 2 }
  ] },
  // 链 15：瘟疫大流行链——潜伏→爆发→余波或根治
  { id: "evt_chain_pandemic_1", title: "\u75AB\u75C5\u6F5C\u4F0F", description: "\u8FDC\u56FD\u75AB\u75C5\u4F20\u5165\uFF0C\u592A\u533B\u594F\u8BF7\u9632\u8303\uFF01", category: "crisis", trigger: { minTurn: 22 }, weight: 5, cooldown: 120, unique: true, options: [
    { text: "\u4E25\u9632\u8F93\u5165", effects: { gold: -100, stability: 3, triggerEvent: "evt_chain_pandemic_2" }, aiWeight: 3 },
    { text: "\u89C2\u671B", effects: { triggerEvent: "evt_chain_pandemic_2" }, aiWeight: 2 }
  ] },
  { id: "evt_chain_pandemic_2", title: "\u5927\u75AB\u7206\u53D1", description: "\u75AB\u75C5\u5168\u56FD\u8513\u5EF6\uFF0C\u6B7B\u8005\u751A\u4F17\uFF01", category: "crisis", trigger: { minTurn: 23 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u5C01\u57CE\u6551\u6CBB", effects: { gold: -200, population: -300, stability: -8, factionSat: fr("clergy", 8), triggerEvent: "evt_chain_pandemic_3" }, aiWeight: 3 },
    { text: "\u7948\u7977", effects: { population: -500, stability: -15, legitimacy: -8, triggerEvent: "evt_chain_pandemic_3" }, aiWeight: 1 }
  ] },
  { id: "evt_chain_pandemic_3", title: "\u75AB\u540E\u91CD\u5EFA", description: "\u5927\u75AB\u7EC8\u4E8E\u9000\u53BB\uFF0C\u767E\u5E9F\u5F85\u5174\u3002", category: "crisis", trigger: { minTurn: 24 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: "\u4F11\u517B\u751F\u606F", effects: { gold: -150, population: 200, stability: 8, legitimacy: 5 }, aiWeight: 3 },
    { text: "\u52A0\u7A0E\u91CD\u5EFA", effects: { gold: 100, factionSat: fr("commoners", -15), stability: -5 }, aiWeight: 2 }
  ] },
  // ── population 扩充 +10（21→31，增强人口系统事件多样性）──
  { id: "evt_pop_aging", title: "\u8006\u8001\u589E\u591A", description: "\u533B\u672F\u6E10\u8FDB\uFF0C\u8006\u5BFF\u589E\u591A\uFF0C\u8D61\u517B\u4E4B\u8BAE\u8D77\uFF01", category: "population", trigger: { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u8BBE\u517B\u6D4E\u9662", effects: { gold: -70, stability: 4, factionSat: fr("commoners", 10) }, aiWeight: 3 }, { text: "\u65CF\u517B\u4E3A\u4E3B", effects: { stability: 1, factionSat: fr("nobles", 5) }, aiWeight: 2 }] },
  { id: "evt_pop_orphan", title: "\u5B64\u513F\u6D41\u79BB", description: "\u6218\u4E71\u540E\u5B64\u513F\u6D41\u79BB\u9053\u65C1\uFF0C\u58EB\u6C11\u8BF7\u547D\uFF01", category: "population", trigger: { minTurn: 12, atWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: "\u5B98\u8BBE\u6148\u5E7C\u5C40", effects: { gold: -60, population: 80, stability: 5, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u6C11\u95F4\u6536\u517B", effects: { population: 40, stability: 1 }, aiWeight: 2 }] },
  { id: "evt_pop_refugee_return", title: "\u6D41\u6C11\u5F52\u4E61", description: "\u6545\u571F\u5B89\u9756\uFF0C\u6614\u65E5\u6D41\u6C11\u7EB7\u7EB7\u5F52\u4E61\uFF01", category: "population", trigger: { minTurn: 18, notAtWar: true, minStability: 50 }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u5B98\u52A9\u5F52\u8015", effects: { gold: -50, population: 150, food: 30, efficiency: 2 }, aiWeight: 3 }, { text: "\u542C\u5176\u81EA\u4FBF", effects: { population: 80 }, aiWeight: 2 }] },
  { id: "evt_pop_conscription_backlash", title: "\u5F81\u4E01\u6028\u58F0", description: "\u8FDE\u5E74\u5F81\u5175\uFF0C\u4E61\u91CE\u4E01\u58EE\u532E\u4E4F\uFF0C\u6C11\u6028\u6E10\u8D77\uFF01", category: "population", trigger: { minTurn: 10, atWar: true, maxStability: 50 }, weight: 5, cooldown: 25, unique: false, options: [{ text: "\u51CF\u514D\u6765\u5E74\u5F81\u53D1", effects: { gold: -40, stability: 5, factionSat: fr("commoners", 12) }, aiWeight: 3 }, { text: "\u4E25\u4EE4\u50AC\u5F81", effects: { stability: -8, factionSat: fr("commoners", -15), population: -100 }, aiWeight: 1 }] },
  { id: "evt_pop_market_town", title: "\u5E02\u9547\u5174\u8D77", description: "\u4EA4\u901A\u8981\u51B2\u5E02\u9547\u81EA\u53D1\u5174\u8D77\uFF0C\u5546\u8D3E\u4E91\u96C6\uFF01", category: "population", trigger: { minTurn: 14, minStability: 45, techLevelAbove: { branch: "admin", level: 1 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: "\u8BBE\u5B98\u6CBB\u7406", effects: { gold: -40, efficiency: 3, factionSat: fr("merchants", 10), corruption: -2 }, aiWeight: 3 }, { text: "\u4EFB\u5176\u81EA\u6D41", effects: { gold: 30, corruption: 4 }, aiWeight: 2 }] },
  { id: "evt_pop_famine_migration", title: "\u5C31\u98DF\u6D41\u79FB", description: "\u5317\u7701\u5927\u65F1\uFF0C\u9965\u6C11\u5C31\u98DF\u5357\u4E0B\uFF0C\u7EB7\u81F3\u6C93\u6765\uFF01", category: "population", trigger: { minTurn: 12, maxStability: 45 }, weight: 5, cooldown: 30, unique: false, options: [{ text: "\u5F00\u4ED3\u8D48\u6D4E", effects: { gold: -80, food: -60, population: 200, stability: 4 }, aiWeight: 3 }, { text: "\u95ED\u5883\u62D2\u4E4B", effects: { stability: -5, influence: -5, factionSat: fr("commoners", -10) }, aiWeight: 2 }] },
  { id: "evt_pop_noble_exodus", title: "\u8D35\u80C4\u5F99\u907F", description: "\u653F\u5C40\u52A8\u8361\uFF0C\u90E8\u5206\u8D35\u80C4\u643A\u5BB6\u5357\u8FC1\u90BB\u90A6\uFF01", category: "population", trigger: { minTurn: 15, maxStability: 40 }, weight: 4, cooldown: 35, unique: false, options: [{ text: "\u539A\u793C\u633D\u7559", effects: { gold: -100, legitimacy: 5, factionSat: fr("nobles", 12) }, aiWeight: 3 }, { text: "\u4EFB\u5176\u53BB\u7559", effects: { population: -80, influence: -5, factionSat: fr("nobles", -10) }, aiWeight: 2 }] },
  { id: "evt_pop_scholar_return", title: "\u6E38\u5B66\u5F52\u4E61", description: "\u6614\u65E5\u6E38\u5B66\u4E4B\u58EB\u5B66\u6210\u5F52\u56FD\uFF0C\u6B32\u6548\u529B\u5E99\u5802\uFF01", category: "population", trigger: { minTurn: 16, techLevelAbove: { branch: "admin", level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: "\u91CF\u624D\u5F55\u7528", effects: { gold: -40, sciPt: 20, efficiency: 3, factionSat: fr("clergy", 8) }, aiWeight: 3 }, { text: "\u5F85\u7F3A\u5019\u8865", effects: { sciPt: 5, stability: 1 }, aiWeight: 2 }] },
  { id: "evt_pop_border_trade", title: "\u8FB9\u6C11\u4E92\u5E02", description: "\u8FB9\u6C11\u8D8A\u754C\u4E92\u5E02\uFF0C\u5B98\u5E9C\u67E5\u5426\u4E24\u96BE\uFF01", category: "population", trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: "\u8BBE\u69B7\u573A\u89C4\u8303", effects: { gold: 60, factionSat: fr("merchants", 10), efficiency: 2 }, aiWeight: 3 }, { text: "\u4E25\u7981\u8D8A\u754C", effects: { gold: -20, stability: 2, factionSat: fr("merchants", -8) }, aiWeight: 2 }] },
  { id: "evt_pop_overcrowding", title: "\u4EBA\u7A20\u5730\u72ED", description: "\u6838\u5FC3\u7701\u4EFD\u4EBA\u7A20\u5730\u72ED\uFF0C\u751F\u8BA1\u65E5\u8E59\uFF01", category: "population", trigger: { minTurn: 22, minStability: 50 }, weight: 4, cooldown: 40, unique: false, options: [{ text: "\u79FB\u6C11\u5B9E\u8FB9", effects: { gold: -100, population: 100, stability: 4, efficiency: 2 }, aiWeight: 3 }, { text: "\u7CBE\u8015\u7EC6\u4F5C", effects: { gold: -50, food: 40, sciPt: 5 }, aiWeight: 2 }] }
];
var EVENT_BY_ID = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);
var EVENT_IDS = EVENTS.map((e) => e.id);
var EVENT_COUNT = EVENTS.length;

// src/engine/events.ts
function checkTrigger(trigger, nation, state) {
  if (trigger.isPlayerOnly && nation.id !== state.playerNationId) return false;
  if (trigger.minTurn !== void 0 && state.turn < trigger.minTurn) return false;
  if (trigger.maxTurn !== void 0 && state.turn > trigger.maxTurn) return false;
  if (trigger.minGold !== void 0 && nation.resources.gold < trigger.minGold) return false;
  if (trigger.minStability !== void 0 && nation.government.stability < trigger.minStability) return false;
  if (trigger.maxStability !== void 0 && nation.government.stability > trigger.maxStability) return false;
  if (trigger.maxLegitimacy !== void 0 && nation.government.legitimacy > trigger.maxLegitimacy) return false;
  if (trigger.maxFoodRatio !== void 0) {
    const totalPop = provincesOf(nation.id, state.provinces).reduce((s, p) => s + p.population, 0);
    const ratio = totalPop > 0 ? nation.resources.food / (totalPop * 0.8) : 1;
    if (ratio > trigger.maxFoodRatio) return false;
  }
  if (trigger.minCorruption !== void 0 && nation.government.corruption < trigger.minCorruption) return false;
  if (trigger.minWarExhaustion !== void 0 && nation.warExhaustion < trigger.minWarExhaustion) return false;
  if (trigger.atWar && !nation.atWar) return false;
  if (trigger.notAtWar && nation.atWar) return false;
  if (trigger.hasNewTerritory) {
    const cap = state.provinces[nation.capital];
    const hasNew = provincesOf(nation.id, state.provinces).some(
      (p) => cap && p.id !== nation.capital && (p.culture !== cap.culture || p.religion !== cap.religion || p.assimilation < 80)
    );
    if (!hasNew) return false;
  }
  if (trigger.provinceCultureDiff) {
    const hasDiff = provincesOf(nation.id, state.provinces).some((p) => {
      const cap = state.provinces[nation.capital];
      return cap && (p.culture !== cap.culture || p.religion !== cap.religion);
    });
    if (!hasDiff) return false;
  }
  if (trigger.factionSatBelow) {
    const f = nation.factions.find((x) => x.id === trigger.factionSatBelow.faction);
    if (!f || f.satisfaction >= trigger.factionSatBelow.threshold) return false;
  }
  if (trigger.techLevelAbove) {
    if (nation.tech[trigger.techLevelAbove.branch] < trigger.techLevelAbove.level) return false;
  }
  if (trigger.relationBelow) {
    const r = getRelationObj(nation.id, trigger.relationBelow.target, state);
    if (!r || r.relation >= trigger.relationBelow.threshold) return false;
  }
  if (trigger.govTransitionActive) {
    if (!nation.govTransitionTurns || nation.govTransitionTurns <= 0) return false;
  }
  return true;
}
function recordBelongsToNation(record, nationId, state) {
  return record.nationId !== void 0 ? record.nationId === nationId : nationId === state.playerNationId;
}
function addTriggered(index, nationId, eventId) {
  const events = index.triggeredByNation.get(nationId);
  if (events) events.add(eventId);
  else index.triggeredByNation.set(nationId, /* @__PURE__ */ new Set([eventId]));
}
function createEventAvailabilityIndex(state) {
  const index = {
    triggeredByNation: /* @__PURE__ */ new Map(),
    cooldownByNation: /* @__PURE__ */ new Map()
  };
  for (const entry of state.triggeredEvents) {
    addTriggered(index, entry.nationId ?? state.playerNationId, entry.eventId);
  }
  for (const entry of state.eventCooldowns) {
    const nationId = entry.nationId ?? state.playerNationId;
    const cooldowns = index.cooldownByNation.get(nationId);
    if (cooldowns) {
      cooldowns.set(entry.eventId, Math.max(cooldowns.get(entry.eventId) ?? -Infinity, entry.lastTriggeredTurn));
    } else {
      index.cooldownByNation.set(nationId, /* @__PURE__ */ new Map([[entry.eventId, entry.lastTriggeredTurn]]));
    }
  }
  return index;
}
function isEventAvailable(event, nation, state, availability = createEventAvailabilityIndex(state)) {
  const cooldownTurn = availability.cooldownByNation.get(nation.id)?.get(event.id);
  if (event.unique && (cooldownTurn !== void 0 || availability.triggeredByNation.get(nation.id)?.has(event.id))) return false;
  if (cooldownTurn !== void 0 && state.turn - cooldownTurn < event.cooldown) return false;
  return true;
}
function rollEvents(nation, state, rng, maxTrigger = 2, availability = createEventAvailabilityIndex(state)) {
  const candidates = [];
  for (const e of EVENTS) {
    if (!isEventAvailable(e, nation, state, availability)) continue;
    if (!checkTrigger(e.trigger, nation, state)) continue;
    candidates.push({ item: e.id, weight: e.weight });
  }
  if (candidates.length === 0) return [];
  const out = [];
  for (let i = 0; i < Math.min(maxTrigger, candidates.length); i++) {
    const pick = weightedPick(rng, candidates.filter((c) => !out.includes(c.item)));
    if (!pick) break;
    out.push(pick);
  }
  return out;
}
function aiChooseOption(event, rng) {
  const items = event.options.map((o, i) => ({ item: i, weight: o.aiWeight ?? 1 }));
  const pick = weightedPick(rng, items);
  return pick ?? 0;
}
function resolvePendingEventsForAI(nation, state, rng, maxChain = 8) {
  const resolved = [];
  const seen = /* @__PURE__ */ new Set();
  for (let step = 0; step < maxChain; step += 1) {
    const index = state.pendingEvents.findIndex((pending2) => pending2.nationId === nation.id);
    if (index < 0) break;
    const pending = state.pendingEvents[index];
    state.pendingEvents.splice(index, 1);
    if (seen.has(pending.eventId)) continue;
    seen.add(pending.eventId);
    const event = EVENT_BY_ID[pending.eventId];
    if (!event) continue;
    const optionIndex = aiChooseOption(event, rng);
    const option = event.options[optionIndex];
    if (option) applyEffect(nation, option.effects, state);
    recordEvent(state, nation.id, event.id, optionIndex);
    resolved.push(event.id);
  }
  state.pendingEvents = state.pendingEvents.filter((pending) => pending.nationId !== nation.id);
  return resolved;
}
function applyEffectPure(nation, effect, state) {
  const res = {
    resourceDeltas: {},
    relationOverrides: {},
    factionSatFinals: {},
    provPopDeltas: {},
    newPendingEvents: []
  };
  if (effect.gold) res.resourceDeltas.gold = effect.gold;
  if (effect.food) res.resourceDeltas.food = effect.food;
  if (effect.wood) res.resourceDeltas.wood = effect.wood;
  if (effect.iron) res.resourceDeltas.iron = effect.iron;
  if (effect.influence) res.resourceDeltas.influence = effect.influence;
  if (effect.adminPt) res.resourceDeltas.adminPt = effect.adminPt;
  if (effect.sciPt) res.resourceDeltas.sciPt = effect.sciPt;
  if (effect.warExhaustion) res.warExhaustionFinal = clamp2(nation.warExhaustion + effect.warExhaustion, 0, 100);
  if (effect.taxRate) res.taxRateFinal = clamp2(nation.taxRate + effect.taxRate, 0, 0.5);
  if (effect.assimilationMod) {
    res.assimilationModFinal = (nation.policyMods?.assimilationMod ?? 0) + effect.assimilationMod;
  }
  const govF = {};
  if (effect.stability) govF.stability = clamp2(nation.government.stability + effect.stability, 0, 100);
  if (effect.legitimacy) govF.legitimacy = clamp2(nation.government.legitimacy + effect.legitimacy, 0, 100);
  if (effect.corruption) govF.corruption = clamp2(nation.government.corruption + effect.corruption, 0, 100);
  if (effect.efficiency) govF.efficiency = clamp2(nation.government.efficiency + effect.efficiency, 0, 100);
  if (Object.keys(govF).length > 0) res.govFinal = govF;
  if (effect.relation) {
    const r = getRelationObj(nation.id, effect.relation.target, state);
    if (r) res.relationOverrides[`${nation.id}->${effect.relation.target}`] = { relation: clamp2(r.relation + effect.relation.delta, -100, 100) };
  }
  if (effect.factionSat) {
    for (const fr2 of effect.factionSat) {
      const f = nation.factions.find((x) => x.id === fr2.faction);
      if (f) res.factionSatFinals[fr2.faction] = clamp2(f.satisfaction + fr2.delta, 0, 100);
    }
  }
  if (effect.population) {
    const provs = provincesOf(nation.id, state.provinces);
    const populationDelta = Math.round(effect.population);
    if (populationDelta < 0) {
      let remaining = Math.min(
        -populationDelta,
        provs.reduce((sum, province) => sum + Math.max(0, province.population), 0)
      );
      for (let index = 0; index < provs.length && remaining > 0; index += 1) {
        const province = provs[index];
        const remainingProvinceCount = provs.length - index;
        const take = Math.min(
          Math.max(0, province.population),
          Math.ceil(remaining / remainingProvinceCount)
        );
        res.provPopDeltas[province.id] = (res.provPopDeltas[province.id] ?? 0) - take;
        remaining -= take;
      }
    } else if (populationDelta > 0 && provs.length > 0) {
      const perProvince = Math.floor(populationDelta / provs.length);
      let remainder = populationDelta % provs.length;
      for (const province of provs) {
        const delta = perProvince + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        if (delta !== 0) res.provPopDeltas[province.id] = delta;
      }
    }
  }
  if (effect.triggerEvent) {
    const nextEv = EVENT_BY_ID[effect.triggerEvent];
    const alreadyQueued = state.pendingEvents.some(
      (pending) => pending.eventId === effect.triggerEvent && pending.nationId === nation.id
    );
    const alreadyResolvedThisTurn = state.triggeredEvents.some(
      (entry) => entry.eventId === effect.triggerEvent && entry.turn === state.turn && recordBelongsToNation(entry, nation.id, state)
    );
    if (nextEv && !alreadyQueued && !alreadyResolvedThisTurn) {
      res.newPendingEvents.push({ nationId: nation.id, eventId: effect.triggerEvent });
    }
  }
  return res;
}
function applyEffectResult(nation, state, result) {
  const resources = ["gold", "food", "wood", "iron", "influence", "adminPt", "sciPt"];
  for (const resource of resources) {
    const delta = result.resourceDeltas[resource];
    if (delta !== void 0) nation.resources[resource] += delta;
  }
  if (result.warExhaustionFinal !== void 0) nation.warExhaustion = result.warExhaustionFinal;
  if (result.taxRateFinal !== void 0) nation.taxRate = result.taxRateFinal;
  if (result.assimilationModFinal !== void 0) {
    nation.policyMods ??= {};
    nation.policyMods.assimilationMod = result.assimilationModFinal;
  }
  if (result.govFinal) Object.assign(nation.government, result.govFinal);
  for (const [key, final] of Object.entries(result.relationOverrides)) {
    const separator = key.indexOf("->");
    const relation = separator >= 0 ? getRelationObj(key.slice(0, separator), key.slice(separator + 2), state) : void 0;
    if (relation) relation.relation = final.relation;
  }
  for (const [factionId, satisfaction] of Object.entries(result.factionSatFinals)) {
    const faction = nation.factions.find((entry) => entry.id === factionId);
    if (faction) faction.satisfaction = satisfaction;
  }
  for (const [provinceId, delta] of Object.entries(result.provPopDeltas)) {
    const province = state.provinces[provinceId];
    if (province) province.population = Math.max(0, province.population + delta);
  }
  state.pendingEvents.push(...result.newPendingEvents);
}
function applyEffect(nation, effect, state) {
  applyEffectResult(nation, state, applyEffectPure(nation, effect, state));
}
function recordEventPure(state, nationId, eventId, optionIndex) {
  const existing = state.eventCooldowns.find(
    (entry) => entry.eventId === eventId && recordBelongsToNation(entry, nationId, state)
  );
  return {
    newTriggeredEntry: { nationId, eventId, turn: state.turn, optionIndex },
    cooldownUpdate: { nationId, eventId, lastTriggeredTurn: state.turn, isNew: !existing }
  };
}
function applyRecordEventResult(state, result) {
  state.triggeredEvents.push(result.newTriggeredEntry);
  const update = result.cooldownUpdate;
  const existing = state.eventCooldowns.find(
    (entry) => entry.eventId === update.eventId && recordBelongsToNation(entry, update.nationId, state)
  );
  if (existing) {
    existing.nationId = update.nationId;
    existing.lastTriggeredTurn = update.lastTriggeredTurn;
  } else {
    state.eventCooldowns.push({
      nationId: update.nationId,
      eventId: update.eventId,
      lastTriggeredTurn: update.lastTriggeredTurn
    });
  }
}
function recordEvent(state, nationId, eventId, optionIndex) {
  applyRecordEventResult(state, recordEventPure(state, nationId, eventId, optionIndex));
}

// src/gameplay/warAssessment.ts
function clamp3(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
function n(v) {
  return Math.round(v);
}
function armyPower(nation) {
  if (!nation) return 0;
  return nation.army.reduce((sum, army) => {
    const quality = (army.morale * 0.35 + army.training * 0.3 + army.equipment * 0.25 + army.supply * 0.1) / 100;
    return sum + army.size * (0.65 + quality);
  }, 0);
}
function ownedProvinces(state, nationId) {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}
function relationScore(state, from, to) {
  const rel = state.relations.find((r) => r.from === from && r.to === to);
  if (!rel) return 0;
  return rel.relation - rel.threat + rel.trust * 0.25 + rel.tradeDep * 0.15;
}
function borderAccess(state, attackerId, target) {
  if (!target) return false;
  const attackerProvinceIds = new Set(ownedProvinces(state, attackerId).map((p) => p.id));
  return target.adjacent.some((id) => attackerProvinceIds.has(id));
}
function supplyScore(attacker, hasBorder = false) {
  if (!attacker) return 0;
  const stock = attacker.resources.supply;
  const food = attacker.resources.food;
  const base = Math.min(65, stock * 0.45) + Math.min(25, Math.max(0, food) * 0.05) + (hasBorder ? 10 : -12);
  return clamp3(base);
}
function fiscalScore(attacker) {
  if (!attacker) return 0;
  const gold = attacker.resources.gold;
  const corruptionPenalty = attacker.government.corruption * 0.25;
  return clamp3(55 + Math.min(25, gold / 20) - corruptionPenalty);
}
function stabilityScore(attacker) {
  if (!attacker) return 0;
  return clamp3(attacker.government.stability * 0.7 + attacker.government.legitimacy * 0.2 + attacker.government.efficiency * 0.1 - attacker.warExhaustion * 0.45);
}
function diplomaticRiskScore(state, attackerId, defenderId) {
  const rel = relationScore(state, attackerId, defenderId);
  const defenderAllies = state.relations.filter((r) => r.to === defenderId && r.treaty === "alliance" && r.relation >= 50).length;
  const attackerAllies = state.relations.filter((r) => r.to === attackerId && r.treaty === "alliance" && r.relation >= 50).length;
  return clamp3(42 + defenderAllies * 12 - attackerAllies * 7 + Math.max(0, rel) * 0.25);
}
function factor2(id, label, value, score, goodWhenHigh, detail) {
  const tone = goodWhenHigh ? score >= 65 ? "good" : score >= 40 ? "warn" : "danger" : score <= 35 ? "good" : score <= 60 ? "warn" : "danger";
  return { id, label, value, score: n(score), tone, detail };
}
function recLabel(rec) {
  if (rec === "attack_now") return "\u53EF\u4EE5\u5F00\u6218";
  if (rec === "prepare") return "\u5148\u51C6\u5907\u4E00\u5E74";
  return "\u907F\u514D\u5F00\u6218";
}
function assessWar(state, attackerId, defenderId, targetProvinceId) {
  const attacker = state.nations[attackerId];
  const defender = state.nations[defenderId];
  const target = state.provinces[targetProvinceId];
  const attPower = armyPower(attacker);
  const defPower = armyPower(defender) + (target?.garrison ?? 0) * 0.85;
  const powerRatio = defPower <= 0 ? 100 : clamp3(attPower / defPower * 50, 0, 100);
  const hasBorder = borderAccess(state, attackerId, target);
  const logistics = supplyScore(attacker, hasBorder);
  const fiscal = fiscalScore(attacker);
  const stability = stabilityScore(attacker);
  const diplomaticRisk = diplomaticRiskScore(state, attackerId, defenderId);
  const exhaustionRisk = clamp3((attacker?.warExhaustion ?? 100) + Math.max(0, 55 - stability) * 0.45 + (hasBorder ? 0 : 12));
  const readiness = clamp3(powerRatio * 0.42 + logistics * 0.22 + fiscal * 0.16 + stability * 0.14 + (100 - diplomaticRisk) * 0.06);
  const winChance = clamp3(30 + powerRatio * 0.48 + logistics * 0.12 + stability * 0.08 - diplomaticRisk * 0.08);
  const fiscalPressure = clamp3(100 - fiscal + Math.max(0, defPower - attPower) / 300);
  const logisticsPressure = clamp3(100 - logistics);
  const recommendation = readiness >= 70 && winChance >= 62 && diplomaticRisk < 62 ? "attack_now" : readiness >= 48 && winChance >= 45 ? "prepare" : "avoid";
  const summary = recommendation === "attack_now" ? "\u519B\u529B\u3001\u540E\u52E4\u548C\u653F\u6CBB\u6761\u4EF6\u57FA\u672C\u652F\u6301\u5F00\u6218\u3002" : recommendation === "prepare" ? "\u5177\u5907\u90E8\u5206\u673A\u4F1A\uFF0C\u4F46\u5EFA\u8BAE\u5148\u8865\u7ED9\u3001\u964D\u538C\u6218\u6216\u6539\u5584\u5916\u4EA4\u3002" : "\u5F53\u524D\u5F00\u6218\u4F1A\u653E\u5927\u8D22\u653F\u3001\u540E\u52E4\u6216\u5916\u4EA4\u98CE\u9669\u3002";
  return {
    attackerId,
    defenderId,
    targetProvinceId,
    title: `${attacker?.name ?? attackerId} \u2192 ${defender?.name ?? defenderId}`,
    winChance: n(winChance),
    readiness: n(readiness),
    logisticsPressure: n(logisticsPressure),
    fiscalPressure: n(fiscalPressure),
    exhaustionRisk: n(exhaustionRisk),
    diplomaticRisk: n(diplomaticRisk),
    recommendation,
    recommendationLabel: recLabel(recommendation),
    summary,
    factors: [
      factor2("power", "\u519B\u529B\u5BF9\u6BD4", `${n(attPower)} / ${n(defPower)}`, powerRatio, true, "\u7EFC\u5408\u5175\u529B\u3001\u58EB\u6C14\u3001\u8BAD\u7EC3\u3001\u88C5\u5907\u3001\u8865\u7ED9\u548C\u76EE\u6807\u9A7B\u519B\u3002"),
      factor2("logistics", "\u540E\u52E4\u51C6\u5907", `${n(logistics)}/100`, logistics, true, hasBorder ? "\u76EE\u6807\u63A5\u58E4\uFF0C\u8865\u7ED9\u7EBF\u8F83\u77ED\u3002" : "\u76EE\u6807\u4E0D\u63A5\u58E4\uFF0C\u8FDC\u5F81\u538B\u529B\u4E0A\u5347\u3002"),
      factor2("fiscal", "\u8D22\u653F\u627F\u53D7", `${n(fiscal)}/100`, fiscal, true, "\u56FD\u5E93\u4F59\u989D\u548C\u8150\u8D25\u4F1A\u5F71\u54CD\u957F\u671F\u6218\u4E89\u627F\u53D7\u529B\u3002"),
      factor2("stability", "\u56FD\u5185\u7A33\u5B9A", `${n(stability)}/100`, stability, true, "\u7A33\u5B9A\u3001\u6CD5\u7EDF\u3001\u6CBB\u80FD\u548C\u538C\u6218\u5171\u540C\u5F71\u54CD\u52A8\u5458\u98CE\u9669\u3002"),
      factor2("diplomacy", "\u5916\u4EA4\u98CE\u9669", `${n(diplomaticRisk)}/100`, diplomaticRisk, false, "\u9632\u5B88\u65B9\u76DF\u53CB\u3001\u53CC\u65B9\u5173\u7CFB\u548C\u5A01\u80C1\u503C\u4F1A\u5F71\u54CD\u5916\u90E8\u98CE\u9669\u3002")
    ]
  };
}

// src/gameplay/aiWarDecision.ts
function clamp4(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
function n2(v) {
  return Math.round(v);
}
function ownedProvinces2(state, nationId) {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}
function atWar(state, nationId) {
  return state.wars.some((w) => w.attackerId === nationId || w.defenderId === nationId);
}
function relationLine(state, from, to) {
  const rel = state.relations.find((r) => r.from === from && r.to === to);
  if (!rel) return "\u5916\u4EA4\u60C5\u62A5\u4E0D\u8DB3\u3002";
  if (rel.treaty === "truce" && rel.truceTurns > 0) return `\u4ECD\u6709 ${rel.truceTurns} \u56DE\u5408\u505C\u6218\u3002`;
  if (rel.treaty === "alliance") return "\u76EE\u6807\u662F\u540C\u76DF\uFF0C\u4E0D\u5E94\u5BA3\u6218\u3002";
  if (rel.relation < -40) return "\u53CC\u65B9\u5173\u7CFB\u6076\u52A3\uFF0C\u6218\u4E89\u7406\u7531\u5145\u5206\u3002";
  if (rel.threat > 60) return "\u76EE\u6807\u5A01\u80C1\u8FC7\u9AD8\uFF0C\u5B58\u5728\u5148\u53D1\u5236\u4EBA\u52A8\u673A\u3002";
  if (rel.tradeDep > 55) return "\u8D38\u6613\u4F9D\u8D56\u8F83\u9AD8\uFF0C\u5F00\u6218\u4F1A\u4F24\u5BB3\u7ECF\u6D4E\u3002";
  return "\u5916\u4EA4\u963B\u529B\u53EF\u63A7\u3002";
}
function canTarget(state, attackerId, defenderId) {
  if (attackerId === defenderId) return false;
  const rel = state.relations.find((r) => r.from === attackerId && r.to === defenderId);
  if (rel?.treaty === "alliance") return false;
  if (rel?.treaty === "truce" && rel.truceTurns > 0) return false;
  return true;
}
function buildCandidate(state, attackerId, target) {
  if (!canTarget(state, attackerId, target.ownerId)) return null;
  const assessment = assessWar(state, attackerId, target.ownerId, target.id);
  const nation = state.nations[attackerId];
  const expansionBias = nation?.tendency.expansionist ?? 50;
  const militarism = nation?.tendency.militarism ?? 50;
  const commercePenalty = Math.max(0, (nation?.tendency.commerce ?? 50) - 55) * 0.25;
  const score = clamp4(
    assessment.readiness * 0.34 + assessment.winChance * 0.32 + (100 - assessment.diplomaticRisk) * 0.12 + (100 - assessment.exhaustionRisk) * 0.1 + expansionBias * 0.07 + militarism * 0.05 - commercePenalty
  );
  const reasons = [
    `\u80DC\u7387 ${assessment.winChance}%\u3001\u5907\u6218\u5EA6 ${assessment.readiness}%\u3002`,
    relationLine(state, attackerId, target.ownerId)
  ];
  if (assessment.logisticsPressure > 60) reasons.push("\u540E\u52E4\u538B\u529B\u504F\u9AD8\uFF0C\u9700\u5148\u8C03\u5175\u6216\u8865\u7ED9\u3002");
  if (assessment.fiscalPressure > 60) reasons.push("\u8D22\u653F\u538B\u529B\u504F\u9AD8\uFF0C\u6218\u4E89\u53EF\u80FD\u62D6\u57AE\u56FD\u5E93\u3002");
  if (assessment.recommendation === "attack_now") reasons.push("\u6218\u4E89\u8BC4\u4F30\u5EFA\u8BAE\u53EF\u7ACB\u5373\u5F00\u6218\u3002");
  return { defenderId: target.ownerId, targetProvinceId: target.id, targetName: target.name, assessment, score: n2(score), reasons };
}
function decideAiWar(state, attackerId) {
  const nation = state.nations[attackerId];
  if (!nation) return { attackerId, type: "avoid", label: "\u56FD\u5BB6\u7F3A\u5931", confidence: 0, alternatives: [], reasons: ["\u627E\u4E0D\u5230\u8BE5 AI \u56FD\u5BB6\u3002"] };
  if (nation.defeated) return { attackerId, type: "avoid", label: "\u5DF2\u6218\u8D25", confidence: 0, alternatives: [], reasons: ["\u6218\u8D25\u56FD\u5BB6\u4E0D\u4F1A\u4E3B\u52A8\u5F00\u6218\u3002"] };
  if (atWar(state, attackerId)) return { attackerId, type: "avoid", label: "\u5DF2\u6709\u6218\u4E89", confidence: 80, alternatives: [], reasons: ["\u5F53\u524D\u5DF2\u6709\u6218\u4E89\uFF0C\u907F\u514D\u591A\u7EBF\u4F5C\u6218\u3002"] };
  const candidates = ownedProvinces2(state, attackerId).flatMap((p) => p.adjacent.map((id) => state.provinces[id]).filter(Boolean)).filter((p) => p.ownerId !== attackerId).map((p) => buildCandidate(state, attackerId, p)).filter((x) => !!x).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return { attackerId, type: "avoid", label: "\u65E0\u5408\u6CD5\u76EE\u6807", confidence: 75, alternatives: [], reasons: ["\u5468\u8FB9\u6CA1\u6709\u53EF\u653B\u51FB\u7684\u975E\u540C\u76DF/\u975E\u505C\u6218\u76EE\u6807\u3002"] };
  const aggression = (nation.tendency.expansionist + nation.tendency.militarism) / 2;
  const threshold = aggression >= 65 ? 66 : aggression >= 48 ? 72 : 80;
  if (best.score >= threshold && best.assessment.recommendation === "attack_now") {
    return {
      attackerId,
      type: "declare",
      label: `\u5BA3\u6218 ${best.targetName}`,
      confidence: clamp4(best.score),
      candidate: best,
      alternatives: candidates.slice(1, 4),
      reasons: [`\u8FDB\u653B\u503E\u5411 ${n2(aggression)}\uFF0C\u5F00\u6218\u9608\u503C ${threshold}\u3002`, ...best.reasons]
    };
  }
  if (best.score >= threshold - 14 && best.assessment.recommendation !== "avoid") {
    return {
      attackerId,
      type: "prepare",
      label: `\u51C6\u5907\u8FDB\u653B ${best.targetName}`,
      confidence: clamp4(best.score),
      candidate: best,
      alternatives: candidates.slice(1, 4),
      reasons: [`\u5019\u9009\u76EE\u6807\u63A5\u8FD1\u5BA3\u6218\u9608\u503C ${threshold}\uFF0C\u4F46\u4ECD\u9700\u6574\u5907\u3002`, ...best.reasons]
    };
  }
  return {
    attackerId,
    type: "avoid",
    label: "\u907F\u514D\u5F00\u6218",
    confidence: clamp4(100 - best.score),
    candidate: best,
    alternatives: candidates.slice(1, 4),
    reasons: [`\u6700\u4F73\u76EE\u6807\u8BC4\u5206 ${best.score}\uFF0C\u4F4E\u4E8E\u5BA3\u6218\u9608\u503C ${threshold}\u3002`, ...best.reasons]
  };
}

// src/gameplay/aiWarActionAdapter.ts
function weightFromConfidence(confidence) {
  if (confidence >= 85) return 18;
  if (confidence >= 75) return 14;
  if (confidence >= 66) return 11;
  return 0;
}
function buildAiWarActionPlan(state, attackerId) {
  const decision = decideAiWar(state, attackerId);
  if (decision.type !== "declare" || !decision.candidate) {
    return {
      action: null,
      label: decision.label,
      confidence: decision.confidence,
      reasons: decision.reasons
    };
  }
  return {
    action: {
      actionId: "declare_war",
      weight: weightFromConfidence(decision.confidence),
      target: decision.candidate.defenderId,
      targetProvinceId: decision.candidate.targetProvinceId,
      reason: "weak_neighbor"
    },
    label: decision.label,
    confidence: decision.confidence,
    reasons: decision.reasons
  };
}
function mergeAiWarActionPlan(state, attackerId, actions) {
  const plan = buildAiWarActionPlan(state, attackerId);
  const nonWar = actions.filter((a) => a.actionId !== "declare_war");
  const oldWar = actions.filter((a) => a.actionId === "declare_war");
  if (!plan.action) {
    return nonWar;
  }
  const bestOld = oldWar.slice().sort((a, b) => b.weight - a.weight)[0];
  const merged = plan.action;
  if (bestOld && bestOld.target === merged.target && bestOld.targetProvinceId === merged.targetProvinceId) {
    return [...nonWar, { ...bestOld, weight: Math.max(bestOld.weight, merged.weight), reason: bestOld.reason ?? merged.reason }];
  }
  return [...nonWar, merged];
}

// src/engine/ai.ts
function defaultAIWeights(tier) {
  const base = { taxUp: 1, buildFarm: 1, suppress: 0.8, expandArmy: 0.8, alliance: 1, declareWar: 0.6, research: 1 };
  if (tier === "S" || tier === "A") return { ...base, expandArmy: 1.2, declareWar: 0.9, research: 1.2 };
  if (tier === "D") return { ...base, taxUp: 0.6, buildFarm: 0.5, expandArmy: 0.4, declareWar: 0.3, alliance: 1.5 };
  return base;
}
function armySize(nation) {
  return nation ? nation.army.reduce((s, a) => s + a.size, 0) : 0;
}
function isAttackableProvince(nation, state, provinceId) {
  const target = state.provinces[provinceId];
  if (!target || target.ownerId === nation.id) return null;
  const defender = state.nations[target.ownerId];
  if (!defender || defender.defeated) return null;
  const rel = getRelationObj(nation.id, target.ownerId, state);
  if (rel?.treaty === "alliance") return null;
  if (hasActiveNonAggressionAccord(state, nation.id, target.ownerId)) return null;
  if (rel?.treaty === "truce" && rel.truceTurns > 0) return null;
  if (state.wars.some((w) => w.attackerId === nation.id && w.defenderId === target.ownerId || w.attackerId === target.ownerId && w.defenderId === nation.id)) return null;
  const ownFront = provincesOf(nation.id, state.provinces).some((p) => p.adjacent.includes(target.id));
  return ownFront ? target : null;
}
function hasMilitaryEdge(nation, defender, ratio = 1.5) {
  const myMil = armySize(nation);
  const theirMil = armySize(defender);
  return myMil > Math.max(1, theirMil) * ratio;
}
function scoreBorderProvince(nation, state, province) {
  const defender = state.nations[province.ownerId];
  const rel = getRelationObj(nation.id, province.ownerId, state);
  const richness = province.population * 0.012 + province.agriBase * 7 + province.buildings.length * 10 + (province.isCapital ? 28 : 0);
  const hostility = Math.max(0, -(rel?.relation ?? 0)) * 0.45 + (rel?.threat ?? 0) * 0.35;
  const weakness = Math.max(0, armySize(nation) - armySize(defender)) / Math.max(80, armySize(defender) + 1) * 12;
  return richness + hostility + weakness;
}
function chooseExpansionOpportunity(nation, state, w) {
  const memory = state.aiMemory?.[nation.id];
  const preferred = [
    { id: memory?.territory?.revengeProvinceId, reason: "revenge", baseWeight: 11 },
    { id: memory?.territory?.desiredProvinceId, reason: "desired", baseWeight: 10 }
  ];
  for (const item of preferred) {
    if (!item.id) continue;
    const target = isAttackableProvince(nation, state, item.id);
    if (!target) continue;
    if (!hasMilitaryEdge(nation, state.nations[target.ownerId], item.reason === "revenge" ? 1.2 : 1.35)) continue;
    const pressure = memory?.territory?.pressure ?? 0;
    return { actionId: "declare_war", weight: (item.baseWeight + pressure / 18) * w.declareWar, target: target.ownerId, targetProvinceId: target.id, reason: item.reason };
  }
  let best = null;
  const provs = provincesOf(nation.id, state.provinces);
  for (const p of provs) {
    for (const adjId of p.adjacent) {
      const adj = isAttackableProvince(nation, state, adjId);
      if (!adj) continue;
      const defender = state.nations[adj.ownerId];
      if (!hasMilitaryEdge(nation, defender, 1.5)) continue;
      const score = scoreBorderProvince(nation, state, adj);
      if (!best || score > best.score) best = { province: adj, score };
    }
  }
  if (!best) return null;
  return { actionId: "declare_war", weight: (6 + Math.min(8, best.score / 18)) * w.declareWar, target: best.province.ownerId, targetProvinceId: best.province.id, reason: "weak_neighbor" };
}
function planAITurn(nation, state, rng) {
  void rng;
  const actions = [];
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length === 0) return [];
  const def = NATIONS.find((n3) => n3.id === nation.id);
  const w = def ? def.aiWeights : defaultAIWeights(nation.tier);
  const lowGold = nation.resources.gold < 100;
  const lowFood = nation.resources.food < provs.reduce((s, p) => s + p.population, 0) * 0.3;
  const lowStab = nation.government.stability < 40;
  const hasRebellionRisk = provs.some((p) => p.rebellionRisk > 50);
  const atWar2 = nation.atWar;
  const lowTech = nation.tech.agri < 3 || nation.tech.mil < 3 || nation.tech.admin < 3 || nation.tech.culture < 3;
  if (lowGold) actions.push({ actionId: "tax_up", weight: 10 * w.taxUp });
  if (lowFood) actions.push({ actionId: "build_farm", weight: 12 * w.buildFarm, target: leastFarmProvince(provs) });
  if (hasRebellionRisk) actions.push({ actionId: "suppress", weight: 8 * w.suppress, target: provs.find((p) => p.rebellionRisk > 50)?.id });
  if (lowStab) actions.push({ actionId: "appease", weight: 6 });
  if (lowTech) actions.push({ actionId: "research", weight: 8 * w.research });
  if (!atWar2) {
    const expansion = chooseExpansionOpportunity(nation, state, w);
    if (expansion) actions.push(expansion);
    for (const r of state.relations) {
      if (r.from === nation.id && r.relation < 30 && r.treaty === "none") {
        actions.push({ actionId: "improve_relation", weight: 4 * w.alliance, target: r.to });
        break;
      }
    }
    let tradeTarget;
    for (const r of state.relations) {
      if (r.from === nation.id && r.relation > -10 && r.treaty === "none") {
        tradeTarget = r.to;
        break;
      }
    }
    if (!tradeTarget) {
      for (const p of provs) {
        for (const adjId of p.adjacent) {
          const adj = state.provinces[adjId];
          if (adj && adj.ownerId !== nation.id && state.nations[adj.ownerId]) {
            tradeTarget = adj.ownerId;
            break;
          }
        }
        if (tradeTarget) break;
      }
    }
    if (tradeTarget) actions.push({ actionId: "establish_trade", weight: 15 * w.alliance, target: tradeTarget });
  } else {
    if (nation.warExhaustion > 50) actions.push({ actionId: "make_peace", weight: 8 });
    for (const w2 of state.wars) {
      if (w2.attackerId !== nation.id) continue;
      const targetProv = state.provinces[w2.targetProvinceId];
      if (!targetProv) continue;
      const hasFrontArmy = nation.army.some(
        (a) => a.size > 0 && (a.location === w2.targetProvinceId || targetProv.adjacent.includes(a.location) && state.provinces[a.location]?.ownerId === nation.id)
      );
      if (!hasFrontArmy) {
        actions.push({ actionId: "move_army", weight: 10, target: w2.id });
        break;
      }
    }
    actions.push({ actionId: "recruit", weight: 8 * w.expandArmy, target: nation.capital });
  }
  if (nation.government.stability > 50 && nation.resources.gold > 200 && nation.activePolicies.length < 2) actions.push({ actionId: "enact_policy", weight: 5 * (w.research ?? 1) });
  const planned = !atWar2 ? mergeAiWarActionPlan(state, nation.id, actions) : actions;
  planned.sort((a, b) => b.weight - a.weight);
  const provsAll = provincesOf(nation.id, state.provinces);
  const foodConsume = provsAll.reduce((s, p) => s + p.population, 0) * 0.1;
  if (nation.resources.food < foodConsume * 2) {
    const target = leastFarmProvince(provsAll);
    if (target) planned.unshift({ actionId: "build_farm", weight: 99, target });
    if (nation.taxRate > 0.1) planned.push({ actionId: "tax_down", weight: 50 });
  }
  return planned.slice(0, 3);
}
function leastFarmProvince(provs) {
  let best = provs[0];
  for (const p of provs) {
    const farms = p.buildings.filter((b) => b.defId === "farm").length;
    const bestFarms = best.buildings.filter((b) => b.defId === "farm").length;
    if (farms < bestFarms) best = p;
  }
  return best?.id;
}
function moveCapitalArmyToFront(nation, state, targetProvinceId) {
  const target = state.provinces[targetProvinceId];
  if (!target) return;
  const provs = provincesOf(nation.id, state.provinces);
  const frontProv = provs.find((p) => p.adjacent.includes(target.id)) ?? provs[0];
  if (!frontProv) return;
  const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
  if (!capitalArmy || frontProv.id === capitalArmy.location) return;
  let dest = nation.army.find((a) => a.location === frontProv.id);
  if (!dest) {
    dest = { id: allocateEntityId(state, "army"), ownerId: nation.id, location: frontProv.id, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
    nation.army.push(dest);
  }
  dest.size += capitalArmy.size;
  nation.army = nation.army.filter((a) => a.id !== capitalArmy.id);
}
function executeAIAction(nation, action, state) {
  switch (action.actionId) {
    case "tax_up":
      nation.taxRate = clamp2(nation.taxRate + 0.02, 0, 0.5);
      break;
    case "tax_down":
      nation.taxRate = clamp2(nation.taxRate - 0.02, 0, 0.5);
      break;
    case "build_farm": {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 50) {
        nation.resources.gold -= 50;
        p.buildings.push({ id: allocateEntityId(state, "building"), defId: "farm", provinceId: p.id, level: 1 });
      }
      break;
    }
    case "build_market": {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 80) {
        nation.resources.gold -= 80;
        p.buildings.push({ id: allocateEntityId(state, "building"), defId: "market", provinceId: p.id, level: 1 });
      }
      break;
    }
    case "recruit": {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 75 && nation.resources.supply >= 10 && p.population > 50) {
        nation.resources.gold -= 75;
        nation.resources.supply -= 10;
        p.population -= 50;
        let army = nation.army.find((a) => a.location === action.target);
        if (!army) {
          army = { id: allocateEntityId(state, "army"), ownerId: nation.id, location: action.target, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
          nation.army.push(army);
        }
        army.size += 50;
      }
      break;
    }
    case "research": {
      const branches = ["agri", "mil", "admin", "culture"];
      const minBranch = branches.reduce((min, b) => nation.tech[b] < nation.tech[min] ? b : min, "agri");
      nation.tech[minBranch] = Math.min(8, nation.tech[minBranch] + 1);
      nation.resources.sciPt = Math.max(0, nation.resources.sciPt - 100);
      break;
    }
    case "appease": {
      const low = [...nation.factions].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      if (low && nation.resources.gold >= 30) {
        nation.resources.gold -= 30;
        low.satisfaction = clamp2(low.satisfaction + 8, 0, 100);
      }
      break;
    }
    case "suppress": {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p && nation.resources.gold >= 50) {
        nation.resources.gold -= 50;
        p.unrest = clamp2(p.unrest - 15, 0, 100);
      }
      break;
    }
    case "improve_relation": {
      if (!action.target) break;
      if (nation.resources.influence >= 20) {
        nation.resources.influence -= 20;
        const r = getRelationObj(nation.id, action.target, state);
        if (r) r.relation = clamp2(r.relation + 5, -100, 100);
      }
      break;
    }
    case "declare_war": {
      const targetProvince = action.targetProvinceId ? isAttackableProvince(nation, state, action.targetProvinceId) : null;
      const fallbackTarget = !targetProvince && action.target ? provincesOf(nation.id, state.provinces).flatMap((p) => p.adjacent.map((adj) => state.provinces[adj])).find((p) => p && p.ownerId === action.target) : null;
      const target = targetProvince ?? fallbackTarget ?? null;
      if (!target) break;
      const defenderId = target.ownerId;
      if (state.wars.some((war) => [war.attackerId, war.defenderId].includes(nation.id) && [war.attackerId, war.defenderId].includes(defenderId))) break;
      if (hasActiveNonAggressionAccord(state, nation.id, defenderId)) break;
      moveCapitalArmyToFront(nation, state, target.id);
      state.wars.push({ id: allocateEntityId(state, "war"), attackerId: nation.id, defenderId, targetProvinceId: target.id, progress: 0, turns: 0, battleReports: [] });
      nation.atWar = true;
      const defender = state.nations[defenderId];
      if (defender) defender.atWar = true;
      const r = getRelationObj(nation.id, defenderId, state);
      const rr = getRelationObj(defenderId, nation.id, state);
      if (r) {
        r.treaty = "war";
        r.relation = -100;
      }
      if (rr) {
        rr.treaty = "war";
        rr.relation = -100;
      }
      state._relMap = void 0;
      break;
    }
    case "make_peace": {
      const warsToEnd = state.wars.filter((w) => w.attackerId === nation.id || w.defenderId === nation.id);
      for (const w of warsToEnd) makePeace(state, w);
      break;
    }
    case "move_army": {
      if (!action.target) break;
      const war = state.wars.find((w) => w.id === action.target && w.attackerId === nation.id);
      if (!war) break;
      moveCapitalArmyToFront(nation, state, war.targetProvinceId);
      break;
    }
    case "establish_trade": {
      if (!action.target) break;
      if (nation.resources.influence >= 10) {
        nation.resources.influence -= 10;
        const r = getRelationObj(nation.id, action.target, state);
        const rr = getRelationObj(action.target, nation.id, state);
        if (r && r.treaty === "none" && r.relation >= -10) {
          r.treaty = "trade";
          r.tradeDep = 20;
        }
        if (rr && rr.treaty === "none" && rr.relation >= -10) {
          rr.treaty = "trade";
          rr.tradeDep = Math.max(rr.tradeDep, 20);
        }
      }
      break;
    }
    case "enact_policy": {
      const aiPolicyIds = /* @__PURE__ */ new Set(["census", "merchant_guild", "military_reform", "infrastructure_plan", "education_reform", "welfare"]);
      const avail = POLICIES.filter((policy) => aiPolicyIds.has(policy.id) && canEnactPolicy(nation, policy.id).ok);
      if (avail.length > 0) {
        const prng = mulberry32(state.seed ^ 6155982 ^ state.turn * 31 ^ nation.id.length * 7);
        const pick = avail[Math.floor(prng() * avail.length)];
        enactPolicy(nation, pick.id, state);
      }
      break;
    }
  }
}
function processAITurnFull(nation, state, rng) {
  const actions = planAITurn(nation, state, rng);
  for (const a of actions) executeAIAction(nation, a, state);
}
function processAITurnLite(nation, state, rng) {
  if (nation.taxRate > 0.2) nation.taxRate = clamp2(nation.taxRate - 0.01, 0, 0.5);
  if (nation.taxRate < 0.1) nation.taxRate = clamp2(nation.taxRate + 0.01, 0, 0.5);
  if (state.turn % 5 === 0 && nation.resources.gold >= 50) {
    const provs = provincesOf(nation.id, state.provinces);
    if (provs.length > 0) {
      const p = provs[Math.floor(rng() * provs.length)];
      const bType = rng() > 0.5 ? "farm" : "market";
      p.buildings.push({ id: allocateEntityId(state, "building"), defId: bType, provinceId: p.id, level: 1 });
      nation.resources.gold -= 50;
    }
  }
  if (state.turn % 2 === 0 && nation.resources.influence >= 5) {
    const ownRels = state.relations.filter((x) => x.from === nation.id && x.treaty === "none" && x.relation > 0);
    if (ownRels.length > 0) {
      const rel = ownRels[0];
      rel.treaty = "trade";
      rel.tradeDep = 20;
      nation.resources.influence -= 5;
    }
  }
}
function processAITurnStatic(nation, state) {
  if (nation.government.stability < 45) nation.government.stability += 0.5;
  if (nation.government.stability > 55) nation.government.stability -= 0.5;
  const provs = provincesOf(nation.id, state.provinces);
  if (provs.length > 0) {
    const foodConsume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
    if (nation.resources.food < foodConsume * 2) {
      const target = provs.slice().sort((a, b) => {
        const af = a.buildings.filter((x) => x.defId === "farm").length;
        const bf = b.buildings.filter((x) => x.defId === "farm").length;
        return af - bf;
      })[0];
      if (target && target.buildings.filter((x) => x.defId === "farm").length < 3) target.buildings.push({ id: allocateEntityId(state, "building"), defId: "farm", provinceId: target.id, level: 1 });
    }
  }
}
function buildPlayerNeighborSet(state) {
  const playerId = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId, state.provinces);
  const neighbors = /* @__PURE__ */ new Set();
  for (const p of playerProvs) {
    for (const adj of p.adjacent) {
      const adjProv = state.provinces[adj];
      if (adjProv && adjProv.ownerId !== playerId) neighbors.add(adjProv.ownerId);
    }
  }
  return neighbors;
}
function isPlayerNeighbor(nationId, state, neighborSet) {
  if (neighborSet) return neighborSet.has(nationId);
  const playerId = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId, state.provinces);
  return playerProvs.some((p) => p.adjacent.some((adj) => state.provinces[adj]?.ownerId === nationId));
}
function processAITurn(state, excludedNationIds = /* @__PURE__ */ new Set()) {
  const rng = mulberry32(state.seed ^ 25214903917);
  const playerNeighbors = buildPlayerNeighborSet(state);
  for (const nation of Object.values(state.nations)) {
    if (nation.isPlayer || excludedNationIds.has(nation.id)) continue;
    if (nation.defeated) continue;
    const tier = nation.tier;
    if (tier === "S" || tier === "A" || isPlayerNeighbor(nation.id, state, playerNeighbors)) processAITurnFull(nation, state, rng);
    else if (tier === "B" || tier === "C") processAITurnLite(nation, state, rng);
    else if (state.turn % 10 === 0) processAITurnStatic(nation, state);
  }
  return state;
}

// src/engine/dynasty.ts
var RULER_NAMES = ["\u5965\u53E4\u65AF\u90FD", "\u56FE\u62C9\u771F", "\u54C8\u5FB7\u826F", "\u5B89\u4E1C\u5C3C", "\u9A6C\u53EF", "\u5362\u4FEE\u65AF", "\u5EB7\u8302\u5FB7", "\u585E\u7EF4\u9C81", "\u5361\u62C9\u5361\u62C9", "\u6234\u514B\u91CC\u5148", "\u541B\u58EB\u5766\u4E01", "\u5C24\u5229\u5B89", "\u74E6\u4F26\u65AF", "\u683C\u62C9\u63D0\u5B89", "\u970D\u8BFA\u7559", "\u67E5\u58EB\u4E01\u5C3C", "\u5E0C\u62C9\u514B\u7565", "\u5229\u5965", "\u829D\u8BFA", "\u5DF4\u897F\u5C14"];
var HEIR_NAMES = ["\u5C0F\u5E03\u9C81\u56FE", "\u5C0F\u897F\u5E87\u963F", "\u5C0F\u51EF\u6492", "\u5C0F\u5E9E\u57F9", "\u5C0F\u5965\u53E4\u65AF\u90FD", "\u5C0F\u56FE\u62C9\u771F", "\u5C0F\u54C8\u5FB7\u826F", "\u5C0F\u9A6C\u53EF", "\u5C0F\u585E\u7EF4\u9C81", "\u5C0F\u541B\u58EB\u5766\u4E01", "\u5C0F\u67E5\u58EB\u4E01\u5C3C", "\u5C0F\u5E0C\u62C9\u514B\u7565", "\u5C0F\u5229\u5965", "\u5C0F\u5DF4\u897F\u5C14", "\u963F\u5C14\u5361\u8FEA\u4E4C\u65AF", "\u63D0\u5965\u591A\u897F", "\u74E6\u4F26\u63D0\u5C3C\u5B89", "\u963F\u5361\u8FEA\u4E4C\u65AF", "\u9A6C\u5C14\u57FA\u5B89", "\u829D\u8BFA\u4E8C\u4E16"];
function pickName(pool, rng) {
  return pool[Math.floor(rng() * pool.length)] ?? "\u65E0\u540D";
}
function reignLegitimacy(nation) {
  const years = nation.ruler.reignYears ?? 0;
  if (years <= 20) return 2;
  if (years <= 30) return 0;
  return -1;
}
function ageRulersPure(nation, rng) {
  const r = nation.ruler;
  const newAge = r.age + 1;
  const newReign = (r.reignYears ?? 0) + 1;
  let heirFinal = r.heir ? { ...r.heir, age: r.heir.age + 1 } : void 0;
  if (!heirFinal && newAge >= 25 && newAge <= 55 && rng() <= 0.6) {
    heirFinal = {
      name: pickName(HEIR_NAMES, rng),
      ability: 35 + Math.round(rng() * 30),
      age: 1 + Math.round(rng() * 8)
    };
  }
  const deathChance = newAge < 60 ? 0 : (newAge - 60) * 0.04 + 0.02;
  if (rng() >= deathChance) {
    return { died: false, rulerFinal: { ...r, age: newAge, reignYears: newReign, heir: heirFinal } };
  }
  const oldName = r.name;
  const heir = heirFinal;
  if (heir && heir.age >= 15) {
    return {
      died: true,
      newRulerName: heir.name,
      eventLog: `${oldName} \u9A7E\u5D29\uFF0C\u592A\u5B50 ${heir.name} \u5373\u4F4D\uFF08\u6CBB\u80FD ${heir.ability}\uFF09`,
      rulerFinal: { name: heir.name, ability: heir.ability, age: heir.age, reignYears: 0 }
    };
  }
  const successorAge = 25 + Math.round(rng() * 30);
  const successorAbility = 35 + Math.round(rng() * 30);
  const successorName = pickName(RULER_NAMES, rng);
  if (heir && heir.age < 15) {
    return {
      died: true,
      newRulerName: successorName,
      eventLog: `${oldName} \u9A7E\u5D29\uFF0C\u592A\u5B50\u5E74\u5E7C\uFF0C${successorName} \u6444\u653F\u5373\u4F4D\uFF08\u6CBB\u80FD ${successorAbility}\uFF09\uFF0C\u6CD5\u7EDF\u52A8\u6447`,
      rulerFinal: { name: successorName, ability: successorAbility, age: successorAge, reignYears: 0 },
      govLegitimacyDelta: -15
    };
  }
  return {
    died: true,
    newRulerName: successorName,
    eventLog: `${oldName} \u9A7E\u5D29\u65E0\u55E3\uFF0C${successorName} \u7EE7\u4F4D\uFF08\u6CBB\u80FD ${successorAbility}\uFF09`,
    rulerFinal: { name: successorName, ability: successorAbility, age: successorAge, reignYears: 0 },
    govLegitimacyDelta: -10
  };
}

// src/engine/stateClone.ts
function cloneGameState(state) {
  const serializable = { ...state, _relMap: void 0 };
  if (typeof structuredClone === "function") return structuredClone(serializable);
  return JSON.parse(JSON.stringify(serializable));
}

// src/engine/turnIntel.ts
function collectWorldEvents(previous, current2, playerId, playerProvinces) {
  const events = [];
  const neighbors = /* @__PURE__ */ new Set();
  for (const province of playerProvinces) {
    for (const adjacentId of province.adjacent) {
      const adjacent = current2.provinces[adjacentId];
      if (adjacent && adjacent.ownerId !== playerId) neighbors.add(adjacent.ownerId);
    }
  }
  for (const war of current2.wars) {
    if (previous.wars.some((candidate) => candidate.id === war.id)) continue;
    if (war.attackerId !== playerId && war.defenderId !== playerId && !neighbors.has(war.attackerId) && !neighbors.has(war.defenderId)) continue;
    const attacker = current2.nations[war.attackerId];
    const defender = current2.nations[war.defenderId];
    const target = current2.provinces[war.targetProvinceId];
    events.push(`\u2694 ${attacker?.name ?? war.attackerId} \u5411 ${defender?.name ?? war.defenderId} \u5BA3\u6218\uFF0C\u653B ${target?.name ?? war.targetProvinceId}`);
  }
  for (const [nationId, nation] of Object.entries(current2.nations)) {
    const oldNation = previous.nations[nationId];
    if (oldNation && !oldNation.defeated && nation.defeated && nationId !== playerId && neighbors.has(nationId)) {
      events.push(`\u2620 ${nation.name} \u706D\u4EA1`);
    }
  }
  for (const relation of current2.relations) {
    const oldRelation = previous.relations.find((candidate) => candidate.from === relation.from && candidate.to === relation.to);
    if (relation.treaty === "alliance" && oldRelation?.treaty !== "alliance") {
      if (relation.from === playerId || relation.to === playerId || neighbors.has(relation.from) || neighbors.has(relation.to)) {
        events.push(`\u{1F91D} ${current2.nations[relation.from]?.name ?? relation.from} \u4E0E ${current2.nations[relation.to]?.name ?? relation.to} \u7ED3\u76DF`);
      }
    }
    if (relation.treaty === "none" && oldRelation?.treaty === "truce" && oldRelation.truceTurns > 0) {
      if (relation.from === playerId || relation.to === playerId) {
        const other = relation.from === playerId ? relation.to : relation.from;
        events.push(`\u{1F54A} \u4E0E ${current2.nations[other]?.name ?? other} \u505C\u6218\u5230\u671F\uFF0C\u53EF\u518D\u5BA3\u6218`);
      }
    }
  }
  return events.slice(-10);
}
function collectPlayerProvinceChanges(previous, current2, playerId) {
  const changes = [];
  for (const [provinceId, province] of Object.entries(current2.provinces)) {
    const oldProvince = previous.provinces[provinceId];
    if (!oldProvince || oldProvince.ownerId === province.ownerId) continue;
    if (oldProvince.ownerId !== playerId && province.ownerId !== playerId) continue;
    changes.push({
      id: provinceId,
      name: province.name,
      from: oldProvince.ownerId,
      to: province.ownerId
    });
  }
  return changes;
}
function decayRebelNations(state) {
  const expired = [];
  for (const [nationId, nation] of Object.entries(state.nations)) {
    if (nation.rebellionDecay === void 0 || !nation.rebelOf) continue;
    nation.rebellionDecay -= 1;
    if (nation.rebellionDecay > 0) continue;
    for (const province of Object.values(state.provinces)) {
      if (province.ownerId !== nationId) continue;
      province.ownerId = nation.rebelOf;
      province.loyalty = 40;
      province.assimilation = 50;
      province.unrest = 30;
      province.rebellionRisk = 20;
    }
    addChronicle(state, {
      id: `rebel_return_${nationId}_${state.turn}`,
      turn: state.turn,
      kind: "milestone_rebellion",
      title: "\u53DB\u4E71\u5E73\u5B9A",
      desc: `${nation.name.replace("\u53DB\u519B\xB7", "")} \u5386\u7ECF 5 \u5E74\u672A\u9547\u538B\uFF0C\u81EA\u884C\u5F52\u987A ${state.nations[nation.rebelOf]?.name ?? "\u539F\u4E3B"}\u3002`,
      actorId: nation.rebelOf
    });
    expired.push(nationId);
  }
  for (const nationId of expired) delete state.nations[nationId];
}

// src/engine/aiTurnPhase.ts
function refreshActiveCharacters(nation) {
  const activated = activateTendency(nation.tendency);
  nation.activeCharacterBonuses = activated.filter((id) => id !== "balanced" && NATIONAL_CHARACTERS[id]);
}
function runAITurnPhase(state, playerId, rng, options = {}) {
  const humanNationIds = options.humanNationIds ?? /* @__PURE__ */ new Set();
  processAITurn(state, humanNationIds);
  const eventAvailability = createEventAvailabilityIndex(state);
  const provincesByOwner = /* @__PURE__ */ new Map();
  for (const province of Object.values(state.provinces)) {
    const owned = provincesByOwner.get(province.ownerId);
    if (owned) owned.push(province);
    else provincesByOwner.set(province.ownerId, [province]);
  }
  for (const nation of Object.values(state.nations)) {
    if (nation.id === playerId || nation.isPlayer || nation.defeated) continue;
    const provinces = provincesByOwner.get(nation.id) ?? [];
    if (provinces.length === 0) continue;
    settleEconomy(nation, state);
    const totalPopulation = provinces.reduce((sum, province) => sum + province.population, 0);
    settlePopulation(nation, provinces, nation.resources.food < totalPopulation * 0.4, true, nation.atWar, false);
    settlePolitics(nation, state);
    lawPerTurnEffects(nation, provinces);
    settleTechnology(nation, state);
    settleCultureReligion(nation, state);
    nation.resources.influence = Math.min(nation.resources.influence + 3, 100);
    for (const eventId of rollEvents(nation, state, rng, 1, eventAvailability)) {
      const event = EVENT_BY_ID[eventId];
      if (!event) continue;
      if (humanNationIds.has(nation.id)) {
        if (!state.pendingEvents.some((pending) => pending.nationId === nation.id && pending.eventId === eventId)) state.pendingEvents.push({ nationId: nation.id, eventId });
        continue;
      }
      const optionIndex = aiChooseOption(event, rng);
      const option = event.options[optionIndex];
      if (option) applyEffect(nation, option.effects, state);
      recordEvent(state, nation.id, eventId, optionIndex);
    }
    if (!humanNationIds.has(nation.id)) resolvePendingEventsForAI(nation, state, rng);
    if (state.turn % 10 === 0) {
      for (const key of Object.keys(nation.tendency)) {
        nation.tendency[key] = clamp2(nation.tendency[key] - 2, 0, 100);
      }
    }
    refreshActiveCharacters(nation);
  }
  const player = state.nations[playerId];
  if (player) refreshActiveCharacters(player);
}

// src/engine/turnConsequences.ts
function resolveFailuresAndRebellions(state, playerId) {
  if (state.victory.type) return;
  const player = state.nations[playerId];
  if (!player) return;
  const provinces = provincesOf(playerId, state.provinces);
  if (player.resources.gold <= 0) {
    state.bankruptTurns += 1;
    if (state.bankruptTurns >= 3) {
      state.victory.type = "fail_bankrupt";
      return;
    }
  } else state.bankruptTurns = 0;
  if (player.government.stability <= 10) {
    state.lowStabilityTurns += 1;
    if (state.lowStabilityTurns >= 3) {
      state.victory.type = "fail_collapse";
      return;
    }
  } else state.lowStabilityTurns = 0;
  if (player.capital && state.provinces[player.capital]?.ownerId !== playerId) {
    state.victory.type = "fail_capital_lost";
    return;
  }
  if (player.government.legitimacy <= 0) {
    state.victory.type = "fail_legitimacy";
    return;
  }
  const rebelProvinces = provinces.filter((province) => {
    if (province.rebellionRisk < 100) return false;
    const suppression = Math.min(60, Math.floor(province.garrison / 50) * 20);
    return province.rebellionRisk - suppression >= 100;
  });
  if (rebelProvinces.length >= 5) {
    state.victory.type = "fail_split";
    return;
  }
  const rebellionRng = mulberry32(state.seed ^ state.turn * 7919);
  for (const province of rebelProvinces) {
    const rebelId = `rebel_${province.id}`;
    if (!state.nations[rebelId]) {
      state.nations[rebelId] = {
        id: rebelId,
        name: `\u53DB\u519B\xB7${province.name}`,
        isPlayer: false,
        tier: "D",
        government: { type: "monarchy", legitimacy: 30, stability: 40, efficiency: 20, corruption: 60 },
        character: "balanced",
        tendency: { militarism: 50, commerce: 20, religiosity: 30, technocracy: 20, authoritarian: 60, welfare: 10, feudal: 40, revolutionary: 30, maritime: 10, centralization: 30, isolationist: 20, expansionist: 40, scholarly: 10, mercantilist: 20 },
        activeCharacterBonuses: [],
        capital: province.id,
        ruler: { name: "\u53DB\u519B\u9996\u9886", age: 35, ability: 2, reignYears: 0 },
        taxRate: 0.1,
        resources: { gold: 50, food: 100, wood: 0, iron: 0, adminPt: 1, sciPt: 0, influence: 0, supply: 0 },
        factions: [],
        tech: { agri: 0, mil: 1, admin: 0, culture: 0, researchProgress: null },
        army: [],
        activePolicies: [],
        activeLaws: [],
        activeTradeRoutes: [],
        embargoedRoutes: [],
        warExhaustion: 0,
        influence: 0,
        atWar: false,
        defeated: false,
        rebellionDecay: 6,
        rebelOf: playerId
      };
    }
    province.assimilation = 30;
    province.loyalty = 30;
    province.unrest = 60;
    province.ownerId = rebelId;
    province.garrison = 0;
    province.buildings = province.buildings.filter((building) => building.defId === "farm");
    addChronicle(state, {
      id: `rebel_${province.id}_${state.turn}`,
      turn: state.turn,
      kind: "milestone_rebellion",
      title: `${province.name} \u8131\u79BB\u72EC\u7ACB`,
      desc: `${province.name} \u53DB\u4E71\u6210\u529F\uFF0C\u8131\u79BB ${player.name}\u30025 \u5E74\u5185\u672A\u9547\u538B\u5C06\u81EA\u52A8\u5F52\u987A\u3002`,
      actorId: playerId
    });
    for (const adjacentId of province.adjacent) {
      const adjacent = state.provinces[adjacentId];
      if (!adjacent || adjacent.ownerId !== playerId || adjacent.culture !== province.culture || adjacent.rebellionRisk < 60) continue;
      if (rebellionRng() < 0.3) {
        adjacent.rebellionRisk = Math.min(100, adjacent.rebellionRisk + 40);
        adjacent.unrest = Math.min(100, adjacent.unrest + 20);
      }
    }
  }
  if (rebelProvinces.length >= 3) {
    player.government.legitimacy = clamp2(player.government.legitimacy - 25, 0, 100);
    player.government.stability = clamp2(player.government.stability - 15, 0, 100);
    player.civilWar = { active: true, rebels: rebelProvinces.map((province) => `rebel_${province.id}`) };
    addChronicle(state, {
      id: `civilwar_${playerId}_${state.turn}`,
      turn: state.turn,
      kind: "milestone_rebellion",
      title: `${player.name} \u9677\u5165\u5185\u6218`,
      desc: `${rebelProvinces.length} \u7701\u53DB\u4E71\uFF0C\u5185\u6218\u7206\u53D1\u3002\u73A9\u5BB6\u53EF\u9547\u538B\u6216\u8C08\u5224\u3002\u5185\u6218\u671F\u95F4\u7A33\u5B9A\u5EA6\u6301\u7EED\u4E0B\u964D\u3001\u7A0E\u6536\u51CF\u534A\u3002`,
      actorId: playerId
    });
  }
}

// src/engine/turn.ts
function findPlayerId(state) {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  const player = Object.values(state.nations).find((nation) => nation.isPlayer && !nation.defeated);
  return player?.id ?? Object.keys(state.nations)[0];
}
function buildReport(nation, provs, state, prev, econ, pol, pop, cr, events, worldEvents) {
  const warnings = [];
  if (nation.resources.gold < 0) warnings.push("\u26A0 \u56FD\u5E93\u8D64\u5B57");
  if (nation.resources.food < 0) warnings.push("\u26A0 \u7CAE\u98DF\u77ED\u7F3A");
  if (nation.government.stability < 20) warnings.push("\u26A0 \u7A33\u5B9A\u5EA6\u8FC7\u4F4E");
  if (nation.government.legitimacy < 25) warnings.push("\u26A0 \u5408\u6CD5\u6027\u5371\u673A");
  if (nation.warExhaustion > 70) warnings.push("\u26A0 \u538C\u6218\u9AD8\u6DA8");
  if (cr.rebellionTriggered.length > 0) warnings.push(`\u26A0 ${cr.rebellionTriggered.length} \u7701\u53DB\u4E71`);
  for (const f of nation.factions) {
    if (f.satisfaction < 20) warnings.push(`\u26A0 ${f.id} \u6D3E\u7CFB\u4E0D\u6EE1`);
  }
  const warProgress = [];
  for (const w of state.wars) {
    if (w.attackerId !== nation.id && w.defenderId !== nation.id) continue;
    const prevWar = prev.wars.find((pw) => pw.id === w.id);
    const prevReports = prevWar?.battleReports ?? [];
    const newReports = (w.battleReports ?? []).slice(prevReports.length);
    for (const r of newReports) {
      const targetProv = state.provinces[w.targetProvinceId];
      warProgress.push({
        target: targetProv?.name ?? w.targetProvinceId,
        progressDelta: r.progressDelta,
        outcome: r.outcome
      });
    }
  }
  const prevNation = prev.nations[nation.id];
  const factionDelta = [];
  if (prevNation) {
    for (const f of nation.factions) {
      const prevF = prevNation.factions.find((pf) => pf.id === f.id);
      if (prevF) {
        const d = Math.round(f.satisfaction - prevF.satisfaction);
        if (d !== 0) factionDelta.push({ id: f.id, delta: d });
      }
    }
  }
  let unrestDelta = 0;
  if (prevNation) {
    const prevProvs = Object.values(prev.provinces).filter((p) => p.ownerId === nation.id);
    for (const p of provs) {
      const prevP = prevProvs.find((pp) => pp.id === p.id);
      if (prevP) unrestDelta += Math.round(p.unrest - prevP.unrest);
    }
  }
  return {
    turn: state.turn,
    nationId: nation.id,
    income: { tax: Math.round(econ.taxIncome), trade: Math.round(econ.tradeIncome), building: Math.round(econ.buildingIncome) },
    expense: { military: Math.round(econ.militaryExpense), corruption: Math.round(econ.corruptionLoss) },
    foodDelta: Math.round(econ.foodProduced - econ.foodConsumed),
    popDelta: Math.round(pop.totalGrowth),
    stabilityDelta: Math.round(pol.stabilityDelta),
    legitimacyDelta: Math.round(pol.legitimacyDelta),
    unrestDelta,
    events,
    warnings,
    warProgress,
    factionDelta,
    exhaustSnapshot: Math.round(nation.warExhaustion),
    worldEvents: worldEvents.slice(-10),
    // A4: 上限 10 条防溢出
    provinceChanges: []
    // B2: 在 buildReport 外计算（需对比 prev/next 省份归属）
  };
}
function processTurn(state, options = {}) {
  const rng = mulberry32(state.seed);
  const newSeed = Math.floor(rng() * 4294967295) >>> 0;
  const next = cloneGameState(state);
  next.seed = newSeed;
  next.turn = state.turn + 1;
  const normalizedPlayerId = findPlayerId(next);
  next.playerNationId = normalizedPlayerId;
  for (const nation of Object.values(next.nations)) nation.isPlayer = nation.id === normalizedPlayerId;
  const playerId = findPlayerId(next);
  const player = next.nations[playerId];
  const playerProvs = provincesOf(playerId, next.provinces);
  const econPure = settleEconomyPure(player, next);
  applyEconomyResult(player, econPure);
  const econ = econPure;
  const foodShortage = player.resources.food < playerProvs.reduce((s, p) => s + p.population, 0) * 0.4;
  const popPure = settlePopulationPure(player, playerProvs, foodShortage, true, player.atWar, false);
  for (const [provId, popDelta] of Object.entries(popPure.popDelta)) {
    const p = next.provinces[provId];
    if (p) p.population = Math.max(10, p.population + popDelta);
  }
  for (const [provId, classDeltas] of Object.entries(popPure.classSatDelta)) {
    const p = next.provinces[provId];
    if (!p) continue;
    for (const [cls, delta] of Object.entries(classDeltas)) {
      const grp = p.classes.find((c) => c.classId === cls);
      if (grp) grp.satisfaction = clamp2(grp.satisfaction + delta, 0, 100);
    }
  }
  for (const [facId, finalSat] of Object.entries(popPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }
  const pop = popPure;
  const polPure = settlePoliticsPure(player, next);
  player.government.stability = polPure.govFinal.stability;
  player.government.legitimacy = polPure.govFinal.legitimacy;
  player.government.corruption = polPure.govFinal.corruption;
  player.government.efficiency = polPure.govFinal.efficiency;
  for (const [facId, finalSat] of Object.entries(polPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }
  const pol = polPure;
  applyLawPerTurnEffectFinals(playerProvs, lawPerTurnEffectsPure(player, playerProvs));
  const techPure = settleTechnologyPure(player, next);
  player.resources.sciPt += techPure.deltaSciPt;
  player.resources.gold += techPure.deltaGold;
  if (techPure.researchProgressFinal !== null) {
    player.tech.researchProgress = techPure.researchProgressFinal;
  } else if (techPure.techLevelUp !== null) {
    player.tech.researchProgress = null;
    player.tech[techPure.techLevelUp.branch] = techPure.techLevelUp.level;
  }
  const crPure = settleCultureReligionPure(player, next);
  for (const [provId, finals] of Object.entries(crPure.provFinal)) {
    const p = next.provinces[provId];
    if (!p) continue;
    p.assimilation = finals.assimilation;
    p.loyalty = finals.loyalty;
    p.rebellionRisk = finals.rebellionRisk;
  }
  const cr = crPure;
  if (playerProvs.length > 0 && player.tier !== "S") {
    const pen = overExtensionPenalty(player, playerProvs.length);
    const stabPen = player.tier === "A" ? Math.min(pen.stabilityLoss, 2) : Math.min(pen.stabilityLoss, 5);
    const effPen = player.tier === "A" ? Math.min(pen.taxEffLoss * 20, 5) : Math.min(pen.taxEffLoss * 20, 10);
    if (effPen > 0) player.government.efficiency = clamp2(player.government.efficiency - effPen, 0, 100);
    if (stabPen > 0) player.government.stability = clamp2(player.government.stability - stabPen, 0, 100);
  }
  const dipPure = settleDiplomacyPure(next);
  for (const r of next.relations) {
    const key = `${r.from}_${r.to}`;
    const f = dipPure.relationsFinal[key];
    if (f) {
      r.threat = f.threat;
      r.relation = f.relation;
      r.truceTurns = f.truceTurns;
      r.treaty = f.treaty;
    }
  }
  for (const [nid, govF] of Object.entries(dipPure.nationsGovFinal)) {
    const n3 = next.nations[nid];
    if (!n3) continue;
    n3.government.stability = govF.stability;
    n3.government.legitimacy = govF.legitimacy;
  }
  for (const entry of dipPure.newChronicle) {
    next.chronicle.push({ ...entry });
  }
  settleDiplomaticAccords(next);
  applySettleWarsResult(next, settleWarsPure(next));
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated) continue;
    const result = ageRulersPure(nation, rng);
    nation.ruler = result.rulerFinal;
    if (result.govLegitimacyDelta) {
      nation.government.legitimacy = clamp2(nation.government.legitimacy + result.govLegitimacyDelta, 0, 100);
    }
    if (result.died && result.eventLog && nation.id === playerId) {
      pol.stabilityDelta -= 3;
    }
    const reignMod = reignLegitimacy(nation);
    if (reignMod !== 0) {
      nation.government.legitimacy = clamp2(nation.government.legitimacy + reignMod, 0, 100);
    }
  }
  const playerEventIds = rollEvents(player, next, rng, 2);
  for (const eid of playerEventIds) {
    if (EVENT_BY_ID[eid] && !next.pendingEvents.some((pending) => pending.nationId === playerId && pending.eventId === eid)) {
      next.pendingEvents.push({ nationId: playerId, eventId: eid });
    }
  }
  if (player.govTransitionTurns && player.govTransitionTurns > 0) {
    player.govTransitionTurns -= 1;
  }
  runAITurnPhase(next, playerId, rng, { humanNationIds: new Set(options.humanNationIds ?? []) });
  if (next.triggeredEvents.length > 1e3) {
    next.triggeredEvents = next.triggeredEvents.slice(-1e3);
  }
  const worldEvents = collectWorldEvents(state, next, playerId, playerProvs);
  const report = buildReport(player, playerProvs, next, state, econ, pol, pop, cr, playerEventIds, worldEvents);
  if (!options.sharedWorld) resolveFailuresAndRebellions(next, playerId);
  decayRebelNations(next);
  report.provinceChanges = collectPlayerProvinceChanges(state, next, playerId);
  next.lastReport = report;
  next.history = [...next.history, report].slice(-10);
  detectMilestones(next, state);
  return { state: next, report };
}

// node_modules/immer/dist/immer.mjs
var NOTHING = /* @__PURE__ */ Symbol.for("immer-nothing");
var DRAFTABLE = /* @__PURE__ */ Symbol.for("immer-draftable");
var DRAFT_STATE = /* @__PURE__ */ Symbol.for("immer-state");
var errors = process.env.NODE_ENV !== "production" ? [
  // All error codes, starting by 0:
  function(plugin) {
    return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
  },
  function(thing) {
    return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
  },
  "This object has been frozen and should not be mutated",
  function(data) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
  },
  "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  "Immer forbids circular references",
  "The first or second argument to `produce` must be a function",
  "The third argument to `produce` must be a function or undefined",
  "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  "First argument to `finishDraft` must be a draft returned by `createDraft`",
  function(thing) {
    return `'current' expects a draft, got: ${thing}`;
  },
  "Object.defineProperty() cannot be used on an Immer draft",
  "Object.setPrototypeOf() cannot be used on an Immer draft",
  "Immer only supports deleting array indices",
  "Immer only supports setting array indices and the 'length' property",
  function(thing) {
    return `'original' expects a draft, got: ${thing}`;
  }
  // Note: if more errors are added, the errorOffset in Patches.ts should be increased
  // See Patches.ts for additional errors
] : [];
function die(error, ...args) {
  if (process.env.NODE_ENV !== "production") {
    const e = errors[error];
    const msg = typeof e === "function" ? e.apply(null, args) : e;
    throw new Error(`[Immer] ${msg}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var getPrototypeOf = Object.getPrototypeOf;
function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
function isDraftable(value) {
  if (!value)
    return false;
  return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString = Object.prototype.constructor.toString();
var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
function isPlainObject(value) {
  if (!value || typeof value !== "object")
    return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null || proto === Object.prototype)
    return true;
  const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object)
    return true;
  if (typeof Ctor !== "function")
    return false;
  let ctorString = cachedCtorStrings.get(Ctor);
  if (ctorString === void 0) {
    ctorString = Function.toString.call(Ctor);
    cachedCtorStrings.set(Ctor, ctorString);
  }
  return ctorString === objectCtorString;
}
function each(obj, iter, strict = true) {
  if (getArchtype(obj) === 0) {
    const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);
    keys.forEach((key) => {
      iter(key, obj[key], obj);
    });
  } else {
    obj.forEach((entry, index) => iter(index, entry, obj));
  }
}
function getArchtype(thing) {
  const state = thing[DRAFT_STATE];
  return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
function has(thing, prop) {
  return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
function set(thing, propOrOldValue, value) {
  const t = getArchtype(thing);
  if (t === 2)
    thing.set(propOrOldValue, value);
  else if (t === 3) {
    thing.add(value);
  } else
    thing[propOrOldValue] = value;
}
function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
function isMap(target) {
  return target instanceof Map;
}
function isSet(target) {
  return target instanceof Set;
}
function latest(state) {
  return state.copy_ || state.base_;
}
function shallowCopy(base, strict) {
  if (isMap(base)) {
    return new Map(base);
  }
  if (isSet(base)) {
    return new Set(base);
  }
  if (Array.isArray(base))
    return Array.prototype.slice.call(base);
  const isPlain = isPlainObject(base);
  if (strict === true || strict === "class_only" && !isPlain) {
    const descriptors = Object.getOwnPropertyDescriptors(base);
    delete descriptors[DRAFT_STATE];
    let keys = Reflect.ownKeys(descriptors);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const desc = descriptors[key];
      if (desc.writable === false) {
        desc.writable = true;
        desc.configurable = true;
      }
      if (desc.get || desc.set)
        descriptors[key] = {
          configurable: true,
          writable: true,
          // could live with !!desc.set as well here...
          enumerable: desc.enumerable,
          value: base[key]
        };
    }
    return Object.create(getPrototypeOf(base), descriptors);
  } else {
    const proto = getPrototypeOf(base);
    if (proto !== null && isPlain) {
      return { ...base };
    }
    const obj = Object.create(proto);
    return Object.assign(obj, base);
  }
}
function freeze(obj, deep = false) {
  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
    return obj;
  if (getArchtype(obj) > 1) {
    Object.defineProperties(obj, {
      set: dontMutateMethodOverride,
      add: dontMutateMethodOverride,
      clear: dontMutateMethodOverride,
      delete: dontMutateMethodOverride
    });
  }
  Object.freeze(obj);
  if (deep)
    Object.values(obj).forEach((value) => freeze(value, true));
  return obj;
}
function dontMutateFrozenCollections() {
  die(2);
}
var dontMutateMethodOverride = {
  value: dontMutateFrozenCollections
};
function isFrozen(obj) {
  if (obj === null || typeof obj !== "object")
    return true;
  return Object.isFrozen(obj);
}
var plugins = {};
function getPlugin(pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    die(0, pluginKey);
  }
  return plugin;
}
function loadPlugin(pluginKey, implementation) {
  if (!plugins[pluginKey])
    plugins[pluginKey] = implementation;
}
var currentScope;
function getCurrentScope() {
  return currentScope;
}
function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_,
    immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0
  };
}
function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches");
    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft);
  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer2) {
  return currentScope = createScope(currentScope, immer2);
}
function revokeDraft(draft) {
  const state = draft[DRAFT_STATE];
  if (state.type_ === 0 || state.type_ === 1)
    state.revoke_();
  else
    state.revoked_ = true;
}
function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  const baseDraft = scope.drafts_[0];
  const isReplaced = result !== void 0 && result !== baseDraft;
  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }
    if (isDraftable(result)) {
      result = finalize(scope, result);
      if (!scope.parent_)
        maybeFreeze(scope, result);
    }
    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(
        baseDraft[DRAFT_STATE].base_,
        result,
        scope.patches_,
        scope.inversePatches_
      );
    }
  } else {
    result = finalize(scope, baseDraft, []);
  }
  revokeScope(scope);
  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }
  return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value, path) {
  if (isFrozen(value))
    return value;
  const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();
  const state = value[DRAFT_STATE];
  if (!state) {
    each(
      value,
      (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path),
      useStrictIteration
    );
    return value;
  }
  if (state.scope_ !== rootScope)
    return value;
  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  }
  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    const result = state.copy_;
    let resultEach = result;
    let isSet2 = false;
    if (state.type_ === 3) {
      resultEach = new Set(result);
      result.clear();
      isSet2 = true;
    }
    each(
      resultEach,
      (key, childValue) => finalizeProperty(
        rootScope,
        state,
        result,
        key,
        childValue,
        path,
        isSet2
      ),
      useStrictIteration
    );
    maybeFreeze(rootScope, result, false);
    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(
        state,
        path,
        rootScope.patches_,
        rootScope.inversePatches_
      );
    }
  }
  return state.copy_;
}
function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
  if (childValue == null) {
    return;
  }
  if (typeof childValue !== "object" && !targetIsSet) {
    return;
  }
  const childIsFrozen = isFrozen(childValue);
  if (childIsFrozen && !targetIsSet) {
    return;
  }
  if (process.env.NODE_ENV !== "production" && childValue === targetObject)
    die(5);
  if (isDraft(childValue)) {
    const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
    !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
    const res = finalize(rootScope, childValue, path);
    set(targetObject, prop, res);
    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else
      return;
  } else if (targetIsSet) {
    targetObject.add(childValue);
  }
  if (isDraftable(childValue) && !childIsFrozen) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      return;
    }
    if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {
      return;
    }
    finalize(rootScope, childValue);
    if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
      maybeFreeze(rootScope, childValue);
  }
}
function maybeFreeze(scope, value, deep = false) {
  if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}
function createProxyProxy(base, parent) {
  const isArray = Array.isArray(base);
  const state = {
    type_: isArray ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false
  };
  let target = state;
  let traps = objectTraps;
  if (isArray) {
    target = [state];
    traps = arrayTraps;
  }
  const { revoke, proxy } = Proxy.revocable(target, traps);
  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
var objectTraps = {
  get(state, prop) {
    if (prop === DRAFT_STATE)
      return state;
    const source = latest(state);
    if (!has(source, prop)) {
      return readPropFromProto(state, source, prop);
    }
    const value = source[prop];
    if (state.finalized_ || !isDraftable(value)) {
      return value;
    }
    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return state.copy_[prop] = createProxy(value, state);
    }
    return value;
  },
  has(state, prop) {
    return prop in latest(state);
  },
  ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set(state, prop, value) {
    const desc = getDescriptorFromProto(latest(state), prop);
    if (desc?.set) {
      desc.set.call(state.draft_, value);
      return true;
    }
    if (!state.modified_) {
      const current2 = peek(latest(state), prop);
      const currentState = current2?.[DRAFT_STATE];
      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }
      if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
        return true;
      prepareCopy(state);
      markChanged(state);
    }
    if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
    (value !== void 0 || prop in state.copy_) || // special case: NaN
    Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
      return true;
    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty(state, prop) {
    if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      delete state.assigned_[prop];
    }
    if (state.copy_) {
      delete state.copy_[prop];
    }
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(state, prop) {
    const owner = latest(state);
    const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc)
      return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1 || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop]
    };
  },
  defineProperty() {
    die(11);
  },
  getPrototypeOf(state) {
    return getPrototypeOf(state.base_);
  },
  setPrototypeOf() {
    die(12);
  }
};
var arrayTraps = {};
each(objectTraps, (key, fn) => {
  arrayTraps[key] = function() {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});
arrayTraps.deleteProperty = function(state, prop) {
  if (process.env.NODE_ENV !== "production" && isNaN(parseInt(prop)))
    die(13);
  return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function(state, prop, value) {
  if (process.env.NODE_ENV !== "production" && prop !== "length" && isNaN(parseInt(prop)))
    die(14);
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
  const state = draft[DRAFT_STATE];
  const source = state ? latest(state) : draft;
  return source[prop];
}
function readPropFromProto(state, source, prop) {
  const desc = getDescriptorFromProto(source, prop);
  return desc ? `value` in desc ? desc.value : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    desc.get?.call(state.draft_)
  ) : void 0;
}
function getDescriptorFromProto(source, prop) {
  if (!(prop in source))
    return void 0;
  let proto = getPrototypeOf(source);
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc)
      return desc;
    proto = getPrototypeOf(proto);
  }
  return void 0;
}
function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;
    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(
      state.base_,
      state.scope_.immer_.useStrictShallowCopy_
    );
  }
}
var Immer2 = class {
  constructor(config) {
    this.autoFreeze_ = true;
    this.useStrictShallowCopy_ = false;
    this.useStrictIteration_ = true;
    this.produce = (base, recipe, patchListener) => {
      if (typeof base === "function" && typeof recipe !== "function") {
        const defaultBase = recipe;
        recipe = base;
        const self = this;
        return function curriedProduce(base2 = defaultBase, ...args) {
          return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
        };
      }
      if (typeof recipe !== "function")
        die(6);
      if (patchListener !== void 0 && typeof patchListener !== "function")
        die(7);
      let result;
      if (isDraftable(base)) {
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        let hasError = true;
        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          if (hasError)
            revokeScope(scope);
          else
            leaveScope(scope);
        }
        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === void 0)
          result = base;
        if (result === NOTHING)
          result = void 0;
        if (this.autoFreeze_)
          freeze(result, true);
        if (patchListener) {
          const p = [];
          const ip = [];
          getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
          patchListener(p, ip);
        }
        return result;
      } else
        die(1, base);
    };
    this.produceWithPatches = (base, recipe) => {
      if (typeof base === "function") {
        return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
      }
      let patches, inversePatches;
      const result = this.produce(base, recipe, (p, ip) => {
        patches = p;
        inversePatches = ip;
      });
      return [result, patches, inversePatches];
    };
    if (typeof config?.autoFreeze === "boolean")
      this.setAutoFreeze(config.autoFreeze);
    if (typeof config?.useStrictShallowCopy === "boolean")
      this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    if (typeof config?.useStrictIteration === "boolean")
      this.setUseStrictIteration(config.useStrictIteration);
  }
  createDraft(base) {
    if (!isDraftable(base))
      die(8);
    if (isDraft(base))
      base = current(base);
    const scope = enterScope(this);
    const proxy = createProxy(base, void 0);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  }
  finishDraft(draft, patchListener) {
    const state = draft && draft[DRAFT_STATE];
    if (!state || !state.isManual_)
      die(9);
    const { scope_: scope } = state;
    usePatchesInScope(scope, patchListener);
    return processResult(void 0, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(value) {
    this.useStrictShallowCopy_ = value;
  }
  /**
   * Pass false to use faster iteration that skips non-enumerable properties
   * but still handles symbols for compatibility.
   *
   * By default, strict iteration is enabled (includes all own properties).
   */
  setUseStrictIteration(value) {
    this.useStrictIteration_ = value;
  }
  shouldUseStrictIteration() {
    return this.useStrictIteration_;
  }
  applyPatches(base, patches) {
    let i;
    for (i = patches.length - 1; i >= 0; i--) {
      const patch = patches[i];
      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    }
    if (i > -1) {
      patches = patches.slice(i + 1);
    }
    const applyPatchesImpl = getPlugin("Patches").applyPatches_;
    if (isDraft(base)) {
      return applyPatchesImpl(base, patches);
    }
    return this.produce(
      base,
      (draft) => applyPatchesImpl(draft, patches)
    );
  }
};
function createProxy(value, parent) {
  const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
  const scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}
function current(value) {
  if (!isDraft(value))
    die(10, value);
  return currentImpl(value);
}
function currentImpl(value) {
  if (!isDraftable(value) || isFrozen(value))
    return value;
  const state = value[DRAFT_STATE];
  let copy;
  let strict = true;
  if (state) {
    if (!state.modified_)
      return state.base_;
    state.finalized_ = true;
    copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
    strict = state.scope_.immer_.shouldUseStrictIteration();
  } else {
    copy = shallowCopy(value, true);
  }
  each(
    copy,
    (key, childValue) => {
      set(copy, key, currentImpl(childValue));
    },
    strict
  );
  if (state) {
    state.finalized_ = false;
  }
  return copy;
}
function enableMapSet() {
  class DraftMap extends Map {
    constructor(target, parent) {
      super();
      this[DRAFT_STATE] = {
        type_: 2,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope(),
        modified_: false,
        finalized_: false,
        copy_: void 0,
        assigned_: void 0,
        base_: target,
        draft_: this,
        isManual_: false,
        revoked_: false
      };
    }
    get size() {
      return latest(this[DRAFT_STATE]).size;
    }
    has(key) {
      return latest(this[DRAFT_STATE]).has(key);
    }
    set(key, value) {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      if (!latest(state).has(key) || latest(state).get(key) !== value) {
        prepareMapCopy(state);
        markChanged(state);
        state.assigned_.set(key, true);
        state.copy_.set(key, value);
        state.assigned_.set(key, true);
      }
      return this;
    }
    delete(key) {
      if (!this.has(key)) {
        return false;
      }
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareMapCopy(state);
      markChanged(state);
      if (state.base_.has(key)) {
        state.assigned_.set(key, false);
      } else {
        state.assigned_.delete(key);
      }
      state.copy_.delete(key);
      return true;
    }
    clear() {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      if (latest(state).size) {
        prepareMapCopy(state);
        markChanged(state);
        state.assigned_ = /* @__PURE__ */ new Map();
        each(state.base_, (key) => {
          state.assigned_.set(key, false);
        });
        state.copy_.clear();
      }
    }
    forEach(cb, thisArg) {
      const state = this[DRAFT_STATE];
      latest(state).forEach((_value, key, _map) => {
        cb.call(thisArg, this.get(key), key, this);
      });
    }
    get(key) {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      const value = latest(state).get(key);
      if (state.finalized_ || !isDraftable(value)) {
        return value;
      }
      if (value !== state.base_.get(key)) {
        return value;
      }
      const draft = createProxy(value, state);
      prepareMapCopy(state);
      state.copy_.set(key, draft);
      return draft;
    }
    keys() {
      return latest(this[DRAFT_STATE]).keys();
    }
    values() {
      const iterator = this.keys();
      return {
        [Symbol.iterator]: () => this.values(),
        next: () => {
          const r = iterator.next();
          if (r.done)
            return r;
          const value = this.get(r.value);
          return {
            done: false,
            value
          };
        }
      };
    }
    entries() {
      const iterator = this.keys();
      return {
        [Symbol.iterator]: () => this.entries(),
        next: () => {
          const r = iterator.next();
          if (r.done)
            return r;
          const value = this.get(r.value);
          return {
            done: false,
            value: [r.value, value]
          };
        }
      };
    }
    [(DRAFT_STATE, Symbol.iterator)]() {
      return this.entries();
    }
  }
  function proxyMap_(target, parent) {
    return new DraftMap(target, parent);
  }
  function prepareMapCopy(state) {
    if (!state.copy_) {
      state.assigned_ = /* @__PURE__ */ new Map();
      state.copy_ = new Map(state.base_);
    }
  }
  class DraftSet extends Set {
    constructor(target, parent) {
      super();
      this[DRAFT_STATE] = {
        type_: 3,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope(),
        modified_: false,
        finalized_: false,
        copy_: void 0,
        base_: target,
        draft_: this,
        drafts_: /* @__PURE__ */ new Map(),
        revoked_: false,
        isManual_: false
      };
    }
    get size() {
      return latest(this[DRAFT_STATE]).size;
    }
    has(value) {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      if (!state.copy_) {
        return state.base_.has(value);
      }
      if (state.copy_.has(value))
        return true;
      if (state.drafts_.has(value) && state.copy_.has(state.drafts_.get(value)))
        return true;
      return false;
    }
    add(value) {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      if (!this.has(value)) {
        prepareSetCopy(state);
        markChanged(state);
        state.copy_.add(value);
      }
      return this;
    }
    delete(value) {
      if (!this.has(value)) {
        return false;
      }
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      markChanged(state);
      return state.copy_.delete(value) || (state.drafts_.has(value) ? state.copy_.delete(state.drafts_.get(value)) : (
        /* istanbul ignore next */
        false
      ));
    }
    clear() {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      if (latest(state).size) {
        prepareSetCopy(state);
        markChanged(state);
        state.copy_.clear();
      }
    }
    values() {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      return state.copy_.values();
    }
    entries() {
      const state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      return state.copy_.entries();
    }
    keys() {
      return this.values();
    }
    [(DRAFT_STATE, Symbol.iterator)]() {
      return this.values();
    }
    forEach(cb, thisArg) {
      const iterator = this.values();
      let result = iterator.next();
      while (!result.done) {
        cb.call(thisArg, result.value, result.value, this);
        result = iterator.next();
      }
    }
  }
  function proxySet_(target, parent) {
    return new DraftSet(target, parent);
  }
  function prepareSetCopy(state) {
    if (!state.copy_) {
      state.copy_ = /* @__PURE__ */ new Set();
      state.base_.forEach((value) => {
        if (isDraftable(value)) {
          const draft = createProxy(value, state);
          state.drafts_.set(value, draft);
          state.copy_.add(draft);
        } else {
          state.copy_.add(value);
        }
      });
    }
  }
  function assertUnrevoked(state) {
    if (state.revoked_)
      die(3, JSON.stringify(latest(state)));
  }
  loadPlugin("MapSet", { proxyMap_, proxySet_ });
}
var immer = new Immer2();
var produce = immer.produce;

// src/gameplay/stateOwnership.ts
var NEUTRAL_PROVINCE_OWNER_IDS = /* @__PURE__ */ new Set(["barbarian"]);
function isValidProvinceOwner(state, ownerId) {
  return !!state.nations[ownerId] || NEUTRAL_PROVINCE_OWNER_IDS.has(ownerId);
}

// src/gameplay/stateInvariants.ts
function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function auditStateInvariants(state) {
  const issues = [];
  const add = (id, severity, detail) => issues.push({ id, severity, detail });
  let maxEntitySequence = 0;
  const inspectEntityId = (id) => {
    maxEntitySequence = Math.max(maxEntitySequence, entitySequenceFromId(id));
  };
  if (![state.version, state.turn, state.seed, state.entityIdCounter, state.bankruptTurns, state.lowStabilityTurns].every(finite)) {
    add("state-number-invalid", "error", "\u9876\u5C42\u72B6\u6001\u542B NaN/Infinity\u3002");
  }
  if (!Number.isSafeInteger(state.entityIdCounter) || state.entityIdCounter < 0) {
    add("entity-id-counter-invalid", "error", `entityIdCounter=${state.entityIdCounter} \u975E\u6CD5\u3002`);
  }
  const player = state.nations[state.playerNationId];
  if (!player) add("player-missing", "error", `playerNationId=${state.playerNationId} \u4E0D\u5B58\u5728\u3002`);
  const markedPlayers = Object.values(state.nations).filter((nation) => nation.isPlayer);
  if (markedPlayers.length !== 1 || markedPlayers[0]?.id !== state.playerNationId) {
    add("player-marker-mismatch", "error", `isPlayer \u6807\u8BB0 ${markedPlayers.length} \u4E2A\uFF0C\u672A\u4E0E playerNationId \u5BF9\u9F50\u3002`);
  }
  const buildingIds = /* @__PURE__ */ new Set();
  for (const [provinceKey, province] of Object.entries(state.provinces)) {
    if (province.id !== provinceKey) add("province-key-mismatch", "error", `${provinceKey} \u7684\u5185\u90E8 id=${province.id}\u3002`);
    if (!isValidProvinceOwner(state, province.ownerId)) add("province-owner-invalid", "error", `${province.id} \u6307\u5411\u65E0\u6548 ownerId=${province.ownerId}\u3002`);
    if (![province.population, province.garrison, province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].every(finite)) {
      add("province-number-invalid", "error", `${province.id} \u542B NaN/Infinity\u3002`);
    }
    if (province.population < 0 || province.garrison < 0) add("province-negative", "error", `${province.id} \u542B\u8D1F\u4EBA\u53E3\u6216\u8D1F\u9A7B\u519B\u3002`);
    if ([province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].some((value) => value < 0 || value > 100)) {
      add("province-range-invalid", "error", `${province.id} \u7684\u767E\u5206\u6BD4\u5B57\u6BB5\u8D8A\u754C\u3002`);
    }
    for (const adjacentId of province.adjacent) {
      if (!state.provinces[adjacentId] || adjacentId === province.id) add("province-adjacency-invalid", "error", `${province.id} \u542B\u65E0\u6548\u90BB\u63A5 ${adjacentId}\u3002`);
      else if (!state.provinces[adjacentId].adjacent.includes(province.id)) add("province-adjacency-asymmetric", "warning", `${province.id}\u2192${adjacentId} \u7F3A\u5C11\u53CD\u5411\u90BB\u63A5\u3002`);
    }
    for (const building of province.buildings) {
      inspectEntityId(building.id);
      if (building.provinceId !== province.id) add("building-province-mismatch", "error", `${building.id} \u7684 provinceId \u4E0E\u5BB9\u5668\u4E0D\u4E00\u81F4\u3002`);
      if (buildingIds.has(building.id)) add("building-id-duplicate", "error", `\u5EFA\u7B51 id=${building.id} \u91CD\u590D\u3002`);
      buildingIds.add(building.id);
      if (!Number.isSafeInteger(building.level) || building.level < 1 || building.level > 3) add("building-level-invalid", "error", `${building.id} \u7B49\u7EA7\u975E\u6CD5\u3002`);
    }
  }
  const armyIds = /* @__PURE__ */ new Set();
  const activeWarNations = new Set(state.wars.flatMap((war) => [war.attackerId, war.defenderId]));
  for (const [nationKey, nation] of Object.entries(state.nations)) {
    if (nation.id !== nationKey) add("nation-key-mismatch", "error", `${nationKey} \u7684\u5185\u90E8 id=${nation.id}\u3002`);
    const resourceValues = Object.values(nation.resources);
    const governmentValues = [nation.government.stability, nation.government.legitimacy, nation.government.efficiency, nation.government.corruption];
    if (![...resourceValues, ...governmentValues, nation.warExhaustion].every(finite)) add("nation-number-invalid", "error", `${nation.id} \u542B NaN/Infinity\u3002`);
    if ([nation.resources.wood, nation.resources.iron, nation.resources.adminPt, nation.resources.sciPt, nation.resources.influence, nation.resources.supply].some((value) => value < 0)) {
      add("nation-resource-negative", "error", `${nation.id} \u542B\u4E0D\u5141\u8BB8\u4E3A\u8D1F\u7684\u8D44\u6E90\u3002`);
    }
    if ([...governmentValues, nation.warExhaustion].some((value) => value < 0 || value > 100)) add("nation-range-invalid", "error", `${nation.id} \u7684\u6CBB\u7406\u5B57\u6BB5\u8D8A\u754C\u3002`);
    const ownedProvinceCount = Object.values(state.provinces).filter((province) => province.ownerId === nation.id).length;
    if (!nation.defeated && ownedProvinceCount > 0 && (!state.provinces[nation.capital] || state.provinces[nation.capital].ownerId !== nation.id)) {
      add("nation-capital-invalid", "error", `${nation.id} \u6CA1\u6709\u6709\u6548\u7684\u672C\u56FD\u9996\u90FD\uFF08${nation.capital || "\u7A7A"}\uFF09\u3002`);
    }
    if (nation.atWar !== activeWarNations.has(nation.id)) add("nation-war-flag-mismatch", "error", `${nation.id} \u7684 atWar \u4E0E\u6218\u4E89\u5217\u8868\u4E0D\u4E00\u81F4\u3002`);
    if (new Set(nation.activePolicies.map((policy) => policy.policyId)).size !== nation.activePolicies.length) add("policy-duplicate", "error", `${nation.id} \u542B\u91CD\u590D\u653F\u7B56\u3002`);
    if (new Set(nation.activeLaws.map((law) => law.lawId)).size !== nation.activeLaws.length) add("law-duplicate", "error", `${nation.id} \u542B\u91CD\u590D\u6CD5\u5F8B\u3002`);
    if (new Set(nation.activeTradeRoutes.map((route) => route.routeId)).size !== nation.activeTradeRoutes.length) add("trade-route-duplicate", "error", `${nation.id} \u542B\u91CD\u590D\u8D38\u6613\u8DEF\u7EBF\u3002`);
    for (const army of nation.army) {
      inspectEntityId(army.id);
      if (armyIds.has(army.id)) add("army-id-duplicate", "error", `\u519B\u961F id=${army.id} \u91CD\u590D\u3002`);
      armyIds.add(army.id);
      if (army.ownerId !== nation.id) add("army-owner-mismatch", "error", `${army.id} ownerId \u4E0E\u6240\u5C5E\u56FD\u5BB6\u4E0D\u4E00\u81F4\u3002`);
      if (!state.provinces[army.location]) add("army-location-invalid", "error", `${army.id} \u4F4D\u4E8E\u4E0D\u5B58\u5728\u7684\u7701\u4EFD ${army.location}\u3002`);
      else if (state.provinces[army.location].ownerId !== nation.id) add("army-location-hostile", "error", `${army.id} \u4F4D\u4E8E\u975E\u5DF1\u65B9\u7701\u4EFD ${army.location}\u3002`);
      if (![army.size, army.morale, army.training, army.equipment, army.supply].every(finite)) add("army-number-invalid", "error", `${army.id} \u542B NaN/Infinity\u3002`);
      if (army.size <= 0 || [army.morale, army.training, army.equipment, army.supply].some((value) => value < 0 || value > 100)) add("army-range-invalid", "error", `${army.id} \u5175\u529B\u6216\u767E\u5206\u6BD4\u5B57\u6BB5\u8D8A\u754C\u3002`);
    }
  }
  const warPairs = /* @__PURE__ */ new Set();
  for (const war of state.wars) {
    inspectEntityId(war.id);
    if (!state.nations[war.attackerId] || !state.nations[war.defenderId] || !state.provinces[war.targetProvinceId]) add("war-reference-invalid", "error", `${war.id} \u542B\u65E0\u6548\u5F15\u7528\u3002`);
    if (war.attackerId === war.defenderId) add("war-self-reference", "error", `${war.id} \u7684\u653B\u5B88\u65B9\u76F8\u540C\u3002`);
    const target = state.provinces[war.targetProvinceId];
    if (target && target.ownerId !== war.defenderId) add("war-target-owner-mismatch", "error", `${war.id} \u7684\u76EE\u6807\u7701\u4E0D\u5C5E\u4E8E\u9632\u5B88\u65B9\u3002`);
    if (![war.progress, war.turns].every(finite) || war.progress < 0 || war.progress > 100 || war.turns < 0) add("war-number-invalid", "error", `${war.id} \u7684\u8FDB\u5EA6\u6216\u56DE\u5408\u975E\u6CD5\u3002`);
    const pair = [war.attackerId, war.defenderId].sort().join("|");
    if (warPairs.has(pair)) add("war-pair-duplicate", "error", `${pair} \u5B58\u5728\u91CD\u590D\u6218\u4E89\u3002`);
    warPairs.add(pair);
  }
  const summitIds = /* @__PURE__ */ new Set();
  for (const summit of state.diplomaticSummits) {
    inspectEntityId(summit.id);
    if (summitIds.has(summit.id)) add("summit-id-duplicate", "error", `\u4F1A\u8C08 id=${summit.id} \u91CD\u590D\u3002`);
    summitIds.add(summit.id);
    if (!state.nations[summit.initiatorId] || !state.nations[summit.targetId] || summit.initiatorId === summit.targetId) {
      add("summit-reference-invalid", "error", `${summit.id} \u542B\u65E0\u6548\u56FD\u5BB6\u5F15\u7528\u3002`);
    }
    if (!finite(summit.turn) || !finite(summit.score) || summit.score < 0 || summit.score > 100) {
      add("summit-number-invalid", "error", `${summit.id} \u7684\u56DE\u5408\u6216\u8BC4\u5206\u975E\u6CD5\u3002`);
    }
  }
  const accordIds = /* @__PURE__ */ new Set();
  const accordKeys = /* @__PURE__ */ new Set();
  for (const accord of state.diplomaticAccords) {
    inspectEntityId(accord.id);
    if (accordIds.has(accord.id)) add("accord-id-duplicate", "error", `\u534F\u8BAE id=${accord.id} \u91CD\u590D\u3002`);
    accordIds.add(accord.id);
    if (!state.nations[accord.partyA] || !state.nations[accord.partyB] || accord.partyA === accord.partyB) {
      add("accord-reference-invalid", "error", `${accord.id} \u542B\u65E0\u6548\u56FD\u5BB6\u5F15\u7528\u3002`);
    }
    if (!finite(accord.startedTurn) || !finite(accord.expiresTurn) || accord.startedTurn > accord.expiresTurn || ![1, 2].includes(accord.strength)) add("accord-number-invalid", "error", `${accord.id} \u7684\u671F\u9650\u6216\u5F3A\u5EA6\u975E\u6CD5\u3002`);
    const key = `${[accord.partyA, accord.partyB].sort().join("|")}|${accord.agenda}`;
    if (accordKeys.has(key)) add("accord-duplicate", "error", `${key} \u5B58\u5728\u91CD\u590D\u751F\u6548\u534F\u8BAE\u3002`);
    accordKeys.add(key);
  }
  if (state.entityIdCounter < maxEntitySequence) {
    add("entity-id-counter-stale", "error", `entityIdCounter=${state.entityIdCounter} \u843D\u540E\u4E8E\u5DF2\u5206\u914D\u5E8F\u5217 ${maxEntitySequence}\u3002`);
  }
  const relationKeys = /* @__PURE__ */ new Set();
  const relationMap = /* @__PURE__ */ new Map();
  for (const relation of state.relations) {
    const key = `${relation.from}|${relation.to}`;
    if (!state.nations[relation.from] || !state.nations[relation.to] || relation.from === relation.to) add("relation-reference-invalid", "error", `${key} \u542B\u65E0\u6548\u5F15\u7528\u3002`);
    if (relationKeys.has(key)) add("relation-duplicate", "error", `${key} \u91CD\u590D\u3002`);
    relationKeys.add(key);
    relationMap.set(key, relation);
    if (![relation.relation, relation.trust, relation.threat, relation.tradeDep, relation.truceTurns].every(finite)) add("relation-number-invalid", "error", `${key} \u542B NaN/Infinity\u3002`);
    if (relation.relation < -100 || relation.relation > 100 || [relation.trust, relation.threat, relation.tradeDep].some((value) => value < 0 || value > 100) || relation.truceTurns < 0) {
      add("relation-range-invalid", "error", `${key} \u7684\u5173\u7CFB\u5B57\u6BB5\u8D8A\u754C\u3002`);
    }
  }
  for (const relation of state.relations) {
    const reverse = relationMap.get(`${relation.to}|${relation.from}`);
    if (!reverse) add("relation-reverse-missing", "warning", `${relation.from}|${relation.to} \u7F3A\u5C11\u53CD\u5411\u5173\u7CFB\u3002`);
    else if (reverse.treaty !== relation.treaty || reverse.truceTurns !== relation.truceTurns) add("relation-treaty-asymmetric", "error", `${relation.from}|${relation.to} \u7684\u6761\u7EA6\u72B6\u6001\u4E0D\u5BF9\u79F0\u3002`);
  }
  for (const war of state.wars) {
    const left = relationMap.get(`${war.attackerId}|${war.defenderId}`);
    const right = relationMap.get(`${war.defenderId}|${war.attackerId}`);
    if (left?.treaty !== "war" || right?.treaty !== "war") add("war-treaty-mismatch", "error", `${war.id} \u672A\u540C\u6B65\u53CC\u5411\u6218\u4E89\u6761\u7EA6\u3002`);
  }
  for (const entry of state.triggeredEvents) {
    if (entry.nationId !== void 0 && !state.nations[entry.nationId]) {
      add("triggered-event-nation-invalid", "error", `${entry.eventId} \u6307\u5411\u4E0D\u5B58\u5728\u56FD\u5BB6 ${entry.nationId}\u3002`);
    }
    if (!finite(entry.turn) || !Number.isSafeInteger(entry.optionIndex) || entry.optionIndex < 0) {
      add("triggered-event-number-invalid", "error", `${entry.eventId} \u7684\u56DE\u5408\u6216\u9009\u9879\u7D22\u5F15\u975E\u6CD5\u3002`);
    }
  }
  const cooldownKeys = /* @__PURE__ */ new Set();
  for (const entry of state.eventCooldowns) {
    if (entry.nationId !== void 0 && !state.nations[entry.nationId]) {
      add("event-cooldown-nation-invalid", "error", `${entry.eventId} \u6307\u5411\u4E0D\u5B58\u5728\u56FD\u5BB6 ${entry.nationId}\u3002`);
    }
    if (!finite(entry.lastTriggeredTurn)) {
      add("event-cooldown-turn-invalid", "error", `${entry.eventId} \u7684\u51B7\u5374\u56DE\u5408\u975E\u6CD5\u3002`);
    }
    const key = `${entry.nationId ?? state.playerNationId}|${entry.eventId}`;
    if (cooldownKeys.has(key)) add("event-cooldown-duplicate", "error", `${key} \u51B7\u5374\u8BB0\u5F55\u91CD\u590D\u3002`);
    cooldownKeys.add(key);
  }
  const pendingKeys = /* @__PURE__ */ new Set();
  for (const pending of state.pendingEvents) {
    const key = `${pending.nationId}|${pending.eventId}`;
    if (!state.nations[pending.nationId]) add("pending-event-nation-invalid", "error", `${key} \u6307\u5411\u4E0D\u5B58\u5728\u56FD\u5BB6\u3002`);
    if (!EVENT_BY_ID[pending.eventId]) add("pending-event-definition-missing", "error", `${key} \u6307\u5411\u4E0D\u5B58\u5728\u4E8B\u4EF6\u3002`);
    if (pendingKeys.has(key)) add("pending-event-duplicate", "error", `${key} \u91CD\u590D\u5F85\u51B3\u3002`);
    pendingKeys.add(key);
  }
  if (state.pendingEventOptions && !state.nations[state.pendingEventOptions.nationId]) add("pending-options-nation-invalid", "error", "\u5F85\u51B3\u4E8B\u4EF6\u9009\u9879\u6307\u5411\u4E0D\u5B58\u5728\u56FD\u5BB6\u3002");
  if (state.pendingEventOptions && !EVENT_BY_ID[state.pendingEventOptions.eventId]) add("pending-options-definition-missing", "error", "\u5F85\u51B3\u4E8B\u4EF6\u9009\u9879\u6307\u5411\u4E0D\u5B58\u5728\u4E8B\u4EF6\u3002");
  if (state.lastReport && state.lastReport.turn !== state.turn) add("report-turn-stale", "warning", `lastReport=${state.lastReport.turn}\uFF0Cstate.turn=${state.turn}\u3002`);
  if (state.lastReport && state.lastReport.nationId !== state.playerNationId) add("report-player-mismatch", "error", `lastReport.nationId=${state.lastReport.nationId} \u672A\u6307\u5411\u73A9\u5BB6\u3002`);
  if (state.history.length > 12) add("history-unbounded", "warning", `history \u957F\u5EA6 ${state.history.length} \u8D85\u8FC7\u7EF4\u62A4\u4E0A\u9650\u3002`);
  if (state._relMap) add("transient-cache-present", "warning", "_relMap \u4E0D\u5E94\u8DE8\u5C42\u6301\u4E45\u5B58\u5728\u3002");
  return issues;
}
function invariantErrors(state) {
  return auditStateInvariants(state).filter((issue) => issue.severity === "error");
}

// src/gameplay/actions/actionCore.ts
enableMapSet();
function success(...messages) {
  return { ok: true, messages };
}
function failure(message) {
  return { ok: false, messages: [message] };
}
function runGameAction(state, execute) {
  let outcome = failure("\u64CD\u4F5C\u5931\u8D25");
  let candidate;
  try {
    candidate = produce(state, (draft) => {
      const working = draft;
      const player = working.nations[working.playerNationId];
      if (!player || player.defeated) {
        outcome = failure("\u73A9\u5BB6\u56FD\u5BB6\u4E0D\u5B58\u5728\u6216\u5DF2\u7ECF\u706D\u4EA1");
        return;
      }
      outcome = execute(working, player);
      if (outcome.ok) working._relMap = void 0;
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { state, ok: false, messages: [`\u64CD\u4F5C\u5F02\u5E38\uFF1A${detail}`] };
  }
  if (!outcome.ok) return { state, ...outcome };
  const errors2 = invariantErrors(candidate);
  if (errors2.length > 0) {
    return {
      state,
      ok: false,
      messages: [`\u64CD\u4F5C\u5DF2\u64A4\u9500\uFF1A\u72B6\u6001\u6821\u9A8C\u5931\u8D25\uFF08${errors2[0].detail}\uFF09`]
    };
  }
  return { state: candidate, ...outcome };
}
function spendAdmin(player, amount) {
  if (player.resources.adminPt < amount) return failure(`\u884C\u52A8\u70B9\u4E0D\u8DB3\uFF08\u9700 ${amount}\uFF09`);
  player.resources.adminPt -= amount;
  return null;
}
function clamp5(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function hasTech2(player, techId) {
  if (!techId) return true;
  const match = /^(agri|mil|admin|culture)_lv(\d+)$/.exec(techId);
  if (!match) return false;
  const branch = match[1];
  return player.tech[branch] >= Number(match[2]);
}
function relationPair2(state, from, to) {
  const left = state.relations.find((relation) => relation.from === from && relation.to === to);
  const right = state.relations.find((relation) => relation.from === to && relation.to === from);
  return left && right ? [left, right] : null;
}
function validForeignTarget(state, player, targetId) {
  if (!targetId || targetId === player.id) return null;
  const target = state.nations[targetId];
  return target && !target.defeated ? target : null;
}

// src/gameplay/actions/domesticActions.ts
function setTaxRateAction(state, rate) {
  return runGameAction(state, (_working, player) => {
    if (!Number.isFinite(rate)) return failure("\u7A0E\u7387\u5FC5\u987B\u662F\u6709\u6548\u6570\u5B57");
    player.taxRate = clamp5(rate, 0, 0.5);
    return success(`\u7A0E\u7387\u8C03\u6574\u4E3A ${Math.round(player.taxRate * 100)}%`);
  });
}
function appeaseFactionAction(state, factionId) {
  return runGameAction(state, (_working, player) => {
    const faction = player.factions.find((entry) => entry.id === factionId);
    if (!faction) return failure("\u76EE\u6807\u6D3E\u7CFB\u4E0D\u5B58\u5728");
    if (player.resources.gold < 30) return failure("\u91D1\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u5B89\u629A");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.gold -= 30;
    faction.satisfaction = clamp5(faction.satisfaction + 8, 0, 100);
    return success(`\u5B89\u629A\u4E86 ${factionId}`);
  });
}
function buildAction(state, provinceId, buildingDefId) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    const definition = BUILDINGS[buildingDefId];
    if (!province || province.ownerId !== player.id || !definition) return failure("\u65E0\u6CD5\u5728\u8BE5\u7701\u5EFA\u9020");
    if (!hasTech2(player, definition.prereqTech)) return failure(`\u7F3A\u5C11\u524D\u7F6E\u79D1\u6280\uFF1A${definition.prereqTech}`);
    if (definition.maxPerProvince > 0 && province.buildings.filter((entry) => entry.defId === definition.id).length >= definition.maxPerProvince) {
      return failure("\u5DF2\u8FBE\u5EFA\u9020\u4E0A\u9650");
    }
    if (player.resources.gold < definition.costGold || player.resources.wood < definition.costWood || player.resources.iron < definition.costIron) {
      return failure("\u5EFA\u9020\u8D44\u6E90\u4E0D\u8DB3");
    }
    const apFailure = spendAdmin(player, definition.costAction);
    if (apFailure) return apFailure;
    player.resources.gold -= definition.costGold;
    player.resources.wood -= definition.costWood;
    player.resources.iron -= definition.costIron;
    province.buildings.push({ id: allocateEntityId(working, "building"), defId: definition.id, provinceId, level: 1 });
    return success(`\u5728 ${province.name} \u5EFA\u9020\u4E86 ${definition.name}`);
  });
}
function researchAction(state, techId) {
  return runGameAction(state, (_working, player) => {
    const definition = TECHNOLOGIES.find((entry) => entry.id === techId);
    if (!definition) return failure("\u79D1\u6280\u4E0D\u5B58\u5728");
    const currentLevel = player.tech[definition.branch];
    if (definition.level <= currentLevel) return failure("\u8BE5\u79D1\u6280\u5DF2\u7ECF\u5B8C\u6210");
    if (definition.level !== currentLevel + 1 || !hasTech2(player, definition.prereqTech)) return failure("\u7F3A\u5C11\u524D\u7F6E\u79D1\u6280");
    if (player.resources.sciPt < definition.costSci || player.resources.gold < definition.costGold) return failure("\u79D1\u7814\u70B9\u6216\u91D1\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.sciPt -= definition.costSci;
    player.resources.gold -= definition.costGold;
    player.tech[definition.branch] = definition.level;
    return success(`\u7814\u53D1\u5B8C\u6210\uFF1A${definition.name}`);
  });
}

// src/gameplay/actions/diplomacyActions.ts
function peacefulPair(state, playerId, targetId) {
  const pair = relationPair2(state, playerId, targetId);
  if (!pair || pair.some((relation) => relation.treaty === "war" || relation.treaty === "truce")) return null;
  return pair;
}
function improveRelationAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure("\u5F53\u524D\u65E0\u6CD5\u6539\u5584\u5173\u7CFB");
    if (player.resources.influence < 20) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 20;
    for (const relation of pair) {
      relation.relation = clamp5(relation.relation + 5, -100, 100);
      relation.trust = clamp5(relation.trust + 4, 0, 100);
    }
    return success(`\u6539\u5584\u4E86\u4E0E ${target.name} \u7684\u5173\u7CFB`);
  });
}
function formTradeAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 0 || pair.some((relation) => relation.treaty === "alliance" || relation.treaty === "trade")) {
      return failure("\u65E0\u6CD5\u5EFA\u7ACB\u8D38\u6613");
    }
    if (player.resources.influence < 30) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    for (const relation of pair) {
      relation.treaty = "trade";
      relation.tradeDep = Math.max(relation.tradeDep, 20);
    }
    return success(`\u4E0E ${target.name} \u5EFA\u7ACB\u8D38\u6613`);
  });
}
function formAllianceAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 50 || pair.some((relation) => relation.treaty === "alliance")) return failure("\u65E0\u6CD5\u7ED3\u76DF");
    if (player.resources.influence < 50) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 50;
    for (const relation of pair) relation.treaty = "alliance";
    return success(`\u4E0E ${target.name} \u7ED3\u76DF`);
  });
}
function espionageAction(state, targetId, kind) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? relationPair2(working, player.id, target.id) : null;
    if (!target || !pair || pair.some((relation) => relation.treaty === "alliance")) return failure("\u95F4\u8C0D\u884C\u52A8\u6761\u4EF6\u4E0D\u8DB3");
    if (!["steal_tech", "foment_rebellion", "spy_military"].includes(kind)) return failure("\u672A\u77E5\u95F4\u8C0D\u884C\u52A8");
    if (player.resources.influence < 40) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 40;
    const messages = [];
    if (kind === "steal_tech") player.resources.sciPt += 30;
    if (kind === "foment_rebellion") {
      Object.values(working.provinces).filter((province) => province.ownerId === target.id).slice(0, 2).forEach((province) => {
        province.unrest = clamp5(province.unrest + 8, 0, 100);
        province.rebellionRisk = clamp5(province.rebellionRisk + 6, 0, 100);
      });
    }
    if (kind === "spy_military") messages.push(`${target.name} \u519B\u529B\u7EA6 ${target.army.reduce((total, army) => total + army.size, 0)}`);
    for (const relation of pair) relation.trust = clamp5(relation.trust - 5, 0, 100);
    messages.push("\u95F4\u8C0D\u884C\u52A8\u5B8C\u6210");
    return success(...messages);
  });
}
function dynasticMarriageAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 20) return failure("\u8054\u59FB\u6761\u4EF6\u4E0D\u8DB3");
    if (player.resources.influence < 30 || player.resources.gold < 80) return failure("\u8054\u59FB\u8D44\u6E90\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    player.resources.gold -= 80;
    for (const relation of pair) {
      relation.relation = clamp5(relation.relation + 15, -100, 100);
      relation.trust = clamp5(relation.trust + 10, 0, 100);
    }
    return success(`\u4E0E ${target.name} \u8054\u59FB\u6210\u529F`);
  });
}
function culturalExportAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure("\u5F53\u524D\u65E0\u6CD5\u8FDB\u884C\u6587\u5316\u8F93\u51FA");
    if (player.tech.culture < 5) return failure("\u6587\u5316\u8F93\u51FA\u9700\u8981\u6587\u5316\u79D1\u6280 Lv5");
    if (player.resources.sciPt < 30) return failure("\u79D1\u7814\u70B9\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.sciPt -= 30;
    player.resources.influence += 5;
    for (const relation of pair) relation.relation = clamp5(relation.relation + 8, -100, 100);
    return success(`\u5BF9 ${target.name} \u7684\u6587\u5316\u8F93\u51FA\u5B8C\u6210`);
  });
}

// src/gameplay/actions/militaryActions.ts
function recruitAction(state, provinceId, count) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure("\u53EA\u80FD\u5728\u672C\u56FD\u7701\u4EFD\u5F81\u5175");
    if (!Number.isSafeInteger(count) || count <= 0) return failure("\u5F81\u5175\u6570\u91CF\u5FC5\u987B\u662F\u6B63\u6574\u6570");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = recruit(working, player, province, count);
    if (!result.ok) return failure(`\u5F81\u5175\u5931\u8D25\uFF1A${result.reason ?? "\u6761\u4EF6\u4E0D\u8DB3"}`);
    return success(`\u5728 ${province.name} \u5F81\u5175 ${count} \u4EBA`);
  });
}
function declareWarAction(state, targetId, provinceId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const targetProvince = working.provinces[provinceId];
    if (!target || !targetProvince || targetProvince.ownerId !== target.id) return failure("\u5BA3\u6218\u76EE\u6807\u65E0\u6548");
    const pair = relationPair2(working, player.id, target.id);
    if (!pair) return failure("\u7F3A\u5C11\u5916\u4EA4\u5173\u7CFB\u6570\u636E");
    if (pair.some((relation) => relation.treaty === "alliance")) return failure("\u4E0D\u80FD\u5411\u76DF\u53CB\u5BA3\u6218");
    if (pair.some((relation) => relation.treaty === "truce" && relation.truceTurns > 0)) return failure("\u505C\u6218\u671F\u5185\u4E0D\u80FD\u5BA3\u6218");
    if (hasActiveNonAggressionAccord(working, player.id, target.id)) return failure("\u53CC\u65B9\u4ECD\u53D7\u5143\u9996\u4F1A\u8C08\u8FBE\u6210\u7684\u4E0D\u4FB5\u72AF\u534F\u8BAE\u7EA6\u675F");
    if (working.wars.some((war2) => [war2.attackerId, war2.defenderId].includes(player.id) && [war2.attackerId, war2.defenderId].includes(target.id))) {
      return failure("\u53CC\u65B9\u5DF2\u7ECF\u5904\u4E8E\u6218\u4E89\u4E2D");
    }
    const bordersTarget = Object.values(working.provinces).filter((province) => province.ownerId === player.id).some((province) => province.adjacent.includes(targetProvince.id));
    if (!bordersTarget) return failure("\u53EA\u80FD\u5411\u76F8\u90BB\u7701\u4EFD\u53D1\u52A8\u6218\u4E89");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const war = declareWar(working, player.id, target.id, targetProvince.id);
    if (!war) return failure("\u5BA3\u6218\u5931\u8D25");
    return success(`\u5411 ${target.name} \u5BA3\u6218`);
  });
}
function makePeaceAction(state, warId) {
  return runGameAction(state, (working, player) => {
    const war = working.wars.find((entry) => entry.id === warId);
    if (!war || war.attackerId !== player.id && war.defenderId !== player.id) return failure("\u65E0\u6CD5\u5904\u7406\u4E0D\u5C5E\u4E8E\u73A9\u5BB6\u7684\u6218\u4E89");
    if (player.resources.influence < 30) return failure("\u8BAE\u548C\u9700\u8981 30 \u5F71\u54CD\u529B");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    const otherId = war.attackerId === player.id ? war.defenderId : war.attackerId;
    makePeace(working, war);
    const pair = relationPair2(working, player.id, otherId);
    if (pair) {
      for (const relation of pair) {
        relation.treaty = "truce";
        relation.truceTurns = Math.max(relation.truceTurns, 10);
        relation.relation = Math.min(relation.relation, -35);
      }
    }
    return success(`\u4E0E ${working.nations[otherId]?.name ?? otherId} \u8BAE\u548C\u5B8C\u6210`);
  });
}
function moveArmyAction(state, armyId, toProvinceId) {
  return runGameAction(state, (working, player) => {
    const army = player.army.find((entry) => entry.id === armyId);
    const from = army ? working.provinces[army.location] : void 0;
    const to = working.provinces[toProvinceId];
    if (!army || !from || !to) return failure("\u519B\u961F\u6216\u7701\u4EFD\u4E0D\u5B58\u5728");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = moveArmy(working, player, armyId, toProvinceId, from, to);
    if (!result.ok) return failure(`\u8C03\u52A8\u5931\u8D25\uFF1A${result.reason ?? "\u4E0D\u53EF\u8FBE"}`);
    return success(`\u519B\u961F\u8C03\u81F3 ${to.name}`);
  });
}

// src/gameplay/actions/politicsActions.ts
function enactPolicyAction(state, policyId) {
  return runGameAction(state, (working, player) => {
    const definition = POLICY_BY_ID[policyId];
    if (!definition) return failure("\u653F\u7B56\u4E0D\u5B58\u5728");
    const apFailure = spendAdmin(player, definition.costAction);
    if (apFailure) return apFailure;
    const result = enactPolicy(player, policyId, working);
    if (!result.ok) return failure(`\u63A8\u884C\u5931\u8D25\uFF1A${result.reason ?? "\u6761\u4EF6\u4E0D\u8DB3"}`);
    return success(`\u63A8\u884C\u653F\u7B56\uFF1A${definition.name}`);
  });
}
function enactLawAction(state, lawId) {
  return runGameAction(state, (working, player) => {
    const definition = LAWS.find((entry) => entry.id === lawId);
    if (!definition) return failure("\u6CD5\u5F8B\u4E0D\u5B58\u5728");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    const result = enactLaw(player, lawId, working);
    if (!result.ok) return failure(`\u63A8\u884C\u5931\u8D25\uFF1A${result.reason ?? "\u6761\u4EF6\u4E0D\u8DB3"}`);
    return success(`\u63A8\u884C\u6CD5\u5F8B\uFF1A${definition.name}`);
  });
}

// src/gameplay/actions/provinceActions.ts
function establishTradeRouteAction(state, routeId) {
  return runGameAction(state, (working, player) => {
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const result = establishTradeRoute(player, routeId, working);
    if (!result.ok) return failure(`\u5EFA\u7ACB\u5931\u8D25\uFF1A${result.reason ?? "\u6761\u4EF6\u4E0D\u8DB3"}`);
    return success(`\u5EFA\u7ACB\u8D38\u6613\u8DEF\u7EBF\uFF1A${result.routeName ?? routeId}`);
  });
}
function embargoTradeRouteAction(state, routeId) {
  return runGameAction(state, (_working, player) => {
    if (!player.activeTradeRoutes.some((route) => route.routeId === routeId)) return failure("\u672A\u5EFA\u7ACB\u8BE5\u8DEF\u7EBF");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const embargoed = player.embargoedRoutes.includes(routeId);
    player.embargoedRoutes = embargoed ? player.embargoedRoutes.filter((entry) => entry !== routeId) : [...player.embargoedRoutes, routeId];
    return success(embargoed ? "\u5DF2\u89E3\u9664\u7981\u8FD0" : "\u5DF2\u7981\u8FD0");
  });
}
function developProvinceAction(state, provinceId, kind) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure("\u53EA\u80FD\u5F00\u53D1\u672C\u56FD\u7701\u4EFD");
    if (!["reclaim", "garrison_deploy", "garrison_recall"].includes(kind)) return failure("\u672A\u77E5\u7701\u4EFD\u64CD\u4F5C");
    if (kind === "reclaim") {
      if (province.agriBase >= 12) return failure("\u519C\u4E1A\u57FA\u7840\u5DF2\u8FBE\u4E0A\u9650");
      if (player.resources.gold < 60) return failure("\u91D1\u4E0D\u8DB3");
    }
    const capitalArmy = player.army.find((army) => army.location === player.capital);
    if (kind === "garrison_deploy" && (!capitalArmy || capitalArmy.size < 50)) return failure("\u9996\u90FD\u519B\u961F\u4E0D\u8DB3");
    if (kind === "garrison_recall" && province.garrison < 50) return failure("\u9A7B\u519B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    if (kind === "reclaim") {
      player.resources.gold -= 60;
      province.agriBase = Math.min(12, province.agriBase + 2);
    } else if (kind === "garrison_deploy" && capitalArmy) {
      capitalArmy.size -= 50;
      province.garrison += 50;
    } else if (kind === "garrison_recall") {
      province.garrison -= 50;
      let army = player.army.find((entry) => entry.location === player.capital);
      if (!army) {
        army = { id: allocateEntityId(working, "army"), ownerId: player.id, location: player.capital, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
        player.army.push(army);
      }
      army.size += 50;
    }
    return success("\u7701\u4EFD\u5F00\u53D1\u5B8C\u6210");
  });
}
function upgradeBuildingAction(state, provinceId, buildingInstanceId) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure("\u53EA\u80FD\u5347\u7EA7\u672C\u56FD\u5EFA\u7B51");
    const instance = province.buildings.find((building) => building.id === buildingInstanceId);
    const definition = instance ? BUILDINGS[instance.defId] : void 0;
    if (!instance || !definition) return failure("\u5EFA\u7B51\u4E0D\u5B58\u5728");
    if (instance.level >= 3) return failure("\u5EFA\u7B51\u5DF2\u8FBE\u6700\u9AD8\u7B49\u7EA7");
    const goldCost = Math.round(definition.costGold * 0.6 * instance.level);
    if (player.resources.gold < goldCost) return failure("\u91D1\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.gold -= goldCost;
    instance.level += 1;
    return success(`${definition.name} \u5347\u7EA7\u5B8C\u6210`);
  });
}
function demolishBuildingAction(state, provinceId, buildingInstanceId) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province || province.ownerId !== player.id) return failure("\u53EA\u80FD\u62C6\u9664\u672C\u56FD\u5EFA\u7B51");
    const instance = province.buildings.find((building) => building.id === buildingInstanceId);
    if (!instance) return failure("\u5EFA\u7B51\u4E0D\u5B58\u5728");
    const definition = BUILDINGS[instance.defId];
    const refund = Math.round((definition?.costGold ?? 50) * 0.3 * instance.level);
    province.buildings = province.buildings.filter((building) => building.id !== buildingInstanceId);
    player.resources.gold += refund;
    return success(`\u5EFA\u7B51\u5DF2\u62C6\u9664\uFF0C\u8FD4\u8FD8 ${refund} \u91D1`);
  });
}
function suppressRebellionAction(state) {
  return runGameAction(state, (working, player) => {
    if (!player.civilWar?.active) return failure("\u672A\u5904\u4E8E\u5185\u6218");
    if (player.army.reduce((total, army) => total + army.size, 0) < 200 || player.resources.gold < 150) return failure("\u9547\u538B\u6761\u4EF6\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.gold -= 150;
    for (const rebelId of player.civilWar.rebels) {
      Object.values(working.provinces).forEach((province) => {
        if (province.ownerId === rebelId) province.ownerId = player.id;
      });
      delete working.nations[rebelId];
      working.relations = working.relations.filter((relation) => relation.from !== rebelId && relation.to !== rebelId);
      working.wars = working.wars.filter((war) => war.attackerId !== rebelId && war.defenderId !== rebelId);
    }
    player.civilWar = { active: false, rebels: [] };
    player.government.stability = clamp5(player.government.stability - 10, 0, 100);
    addChronicle(working, { turn: working.turn, kind: "milestone_rebellion", title: "\u5185\u6218\u5E73\u5B9A", desc: "\u73A9\u5BB6\u4EE5\u6B66\u529B\u9547\u538B\u53DB\u4E71\u3002", actorId: player.id });
    return success("\u9547\u538B\u53DB\u4E71\u6210\u529F");
  });
}
function negotiateRebellionAction(state) {
  return runGameAction(state, (working, player) => {
    if (!player.civilWar?.active) return failure("\u672A\u5904\u4E8E\u5185\u6218");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    const rebelCount = player.civilWar.rebels.length;
    player.civilWar = { active: false, rebels: [] };
    player.government.legitimacy = clamp5(player.government.legitimacy - 15, 0, 100);
    player.government.stability = clamp5(player.government.stability + 15, 0, 100);
    addChronicle(working, {
      turn: working.turn,
      kind: "milestone_rebellion",
      title: "\u5185\u6218\u548C\u8BAE",
      desc: `\u671D\u5EF7\u627F\u8BA4 ${rebelCount} \u4E2A\u53DB\u4E71\u653F\u6743\u7684\u65E2\u6210\u5730\u4F4D\uFF0C\u6362\u53D6\u505C\u6218\u3002`,
      actorId: player.id
    });
    return success("\u5DF2\u901A\u8FC7\u8C08\u5224\u7ED3\u675F\u5185\u6218");
  });
}

// src/gameplay/actions/summitActions.ts
var VALID_AGENDAS = /* @__PURE__ */ new Set(["trade", "security", "normalization", "technology"]);
var VALID_STANCES = /* @__PURE__ */ new Set(["conciliatory", "pragmatic", "firm"]);
function conveneDiplomaticSummitAction(state, targetId, agenda, stance) {
  return runGameAction(state, (working, player) => {
    if (!VALID_AGENDAS.has(agenda) || !VALID_STANCES.has(stance)) return failure("\u4F1A\u8C08\u8BAE\u9898\u6216\u4EA4\u6D89\u59FF\u6001\u65E0\u6548");
    const preview = previewDiplomaticSummit(working, player.id, targetId, agenda, stance);
    if (!preview.eligible) return failure(`\u65E0\u6CD5\u4E3E\u884C\u5143\u9996\u4F1A\u8C08\uFF1A${preview.reasons[0] ?? "\u6761\u4EF6\u4E0D\u8DB3"}`);
    const resolution = calculateDiplomaticSummitResolution(working, player.id, targetId, agenda, stance);
    const record = applyDiplomaticSummitResolution(working, resolution);
    const commitmentText = record.commitments.length > 0 ? `\u627F\u8BFA\uFF1A${record.commitments.join("\uFF1B")}` : `${SUMMIT_AGENDAS[agenda].label}\u672A\u5F62\u6210\u957F\u671F\u534F\u8BAE`;
    return success(record.summary, commitmentText);
  });
}

// src/engine/turnIsolation.ts
function cloneGameStateForTurn(state) {
  return cloneGameState(state);
}

// src/gameplay/pendingEventResolution.ts
function pendingIndex(state, nationId, eventId) {
  return state.pendingEvents.findIndex((pending) => pending.nationId === nationId && pending.eventId === eventId);
}
function resolvePendingEventChoice(state, nationId, eventId, optionIndex) {
  const event = EVENT_BY_ID[eventId];
  const option = event?.options[optionIndex];
  if (!event || !option || !state.nations[nationId] || pendingIndex(state, nationId, eventId) < 0) {
    return { state, resolved: false };
  }
  const next = cloneGameStateForTurn(state);
  const index = pendingIndex(next, nationId, eventId);
  if (index < 0) return { state, resolved: false };
  applyEffect(next.nations[nationId], option.effects, next);
  recordEvent(next, nationId, eventId, optionIndex);
  next.pendingEvents.splice(index, 1);
  return {
    state: next,
    resolved: true,
    eventTitle: event.title,
    optionText: option.text
  };
}

// scripts/shared-world-engine-entry.ts
function selectNation(state, nationId) {
  if (!state.nations[nationId] || state.nations[nationId].defeated) throw new Error("\u56FD\u5BB6\u4E0D\u5B58\u5728\u6216\u5DF2\u7ECF\u8986\u4EA1");
  state.playerNationId = nationId;
  for (const nation of Object.values(state.nations)) nation.isPlayer = nation.id === nationId;
}
function createSharedWorldSnapshot() {
  return createWorldState(20260722);
}
function applySharedWorldCommand(state, nationId, payload) {
  const working = structuredClone(state);
  selectNation(working, nationId);
  const action = String(payload.action ?? "");
  const args = Array.isArray(payload.args) ? payload.args : [];
  const text = (index) => String(args[index] ?? "");
  const num = (index) => Number(args[index]);
  let result;
  switch (action) {
    case "resolve_event": {
      const eventResult = resolvePendingEventChoice(working, nationId, text(0), num(1));
      if (!eventResult.resolved) throw new Error("\u4E8B\u4EF6\u4E0D\u5B58\u5728\u6216\u5DF2\u7ECF\u5904\u7406");
      result = { ok: true, state: eventResult.state, messages: [`\u4E8B\u4EF6 ${eventResult.eventTitle}\uFF1A\u9009\u62E9\u300C${eventResult.optionText}\u300D`] };
      break;
    }
    case "set_strategy_focus":
      working.strategyFocus = text(0);
      result = { ok: true, state: working, messages: ["\u56FD\u7B56\u7126\u70B9\u5DF2\u66F4\u65B0"] };
      break;
    case "set_tax_rate":
      result = setTaxRateAction(working, num(0));
      break;
    case "appease_faction":
      result = appeaseFactionAction(working, text(0));
      break;
    case "build":
      result = buildAction(working, text(0), text(1));
      break;
    case "recruit":
      result = recruitAction(working, text(0), num(1));
      break;
    case "research":
      result = researchAction(working, text(0));
      break;
    case "improve_relation":
      result = improveRelationAction(working, text(0));
      break;
    case "form_trade":
      result = formTradeAction(working, text(0));
      break;
    case "form_alliance":
      result = formAllianceAction(working, text(0));
      break;
    case "summit":
      result = conveneDiplomaticSummitAction(working, text(0), text(1), text(2));
      break;
    case "espionage":
      result = espionageAction(working, text(0), text(1));
      break;
    case "dynastic_marriage":
      result = dynasticMarriageAction(working, text(0));
      break;
    case "cultural_export":
      result = culturalExportAction(working, text(0));
      break;
    case "declare_war":
      result = declareWarAction(working, text(0), text(1));
      break;
    case "make_peace":
      result = makePeaceAction(working, text(0));
      break;
    case "move_army":
      result = moveArmyAction(working, text(0), text(1));
      break;
    case "enact_policy":
      result = enactPolicyAction(working, text(0));
      break;
    case "enact_law":
      result = enactLawAction(working, text(0));
      break;
    case "establish_trade_route":
      result = establishTradeRouteAction(working, text(0));
      break;
    case "embargo_trade_route":
      result = embargoTradeRouteAction(working, text(0));
      break;
    case "develop_province":
      result = developProvinceAction(working, text(0), text(1));
      break;
    case "upgrade_building":
      result = upgradeBuildingAction(working, text(0), text(1));
      break;
    case "demolish_building":
      result = demolishBuildingAction(working, text(0), text(1));
      break;
    case "suppress_rebellion":
      result = suppressRebellionAction(working);
      break;
    case "negotiate_rebellion":
      result = negotiateRebellionAction(working);
      break;
    default:
      throw new Error("\u4E0D\u652F\u6301\u7684\u5171\u4EAB\u7248\u56FE\u884C\u52A8");
  }
  if (!result.ok) throw new Error(result.messages.join("\uFF1B") || "\u884C\u52A8\u6267\u884C\u5931\u8D25");
  return { state: result.state, messages: result.messages };
}
function advanceSharedWorld(state, humanNationIds) {
  const active = humanNationIds.find((id) => state.nations[id] && !state.nations[id].defeated) ?? Object.keys(state.nations)[0];
  selectNation(state, active);
  return processTurn(state, { humanNationIds, sharedWorld: true }).state;
}
export {
  advanceSharedWorld,
  applySharedWorldCommand,
  createSharedWorldSnapshot
};
