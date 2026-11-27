// src/types/game.ts
var CLASS_IDS = ["peasants", "workers", "merchants", "soldiers", "scholars", "nobles", "clergy"];
var SAVE_VERSION = 7;

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
var multiplicativeMods = /* @__PURE__ */ new Set([
  "combatMod",
  "moraleMod",
  "conscriptionMod",
  "tradeMod",
  "marketCostMod",
  "mobilizationMod",
  "sciPtMod",
  "popGrowthMod",
  "warExhaustionMod",
  "rebellionMod"
]);
function nationalCharacterMods(ids) {
  const result = {};
  for (const id of ids) {
    const def = NATIONAL_CHARACTERS[id];
    if (!def) continue;
    for (const mods of [def.bonuses, def.penalties]) {
      for (const key of Object.keys(mods)) {
        const value = mods[key];
        result[key] = multiplicativeMods.has(key) ? (result[key] ?? 1) * value : (result[key] ?? 0) + value;
      }
    }
  }
  return result;
}

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
    nationCount: { S: 1, A: 1, B: 3, C: 6, D: 5 },
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
  const entry = pickWeightedEntry(rng, items);
  return entry ? entry.item : null;
}
function pickWeightedEntry(rng, items) {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const it of items) {
    const weight = Math.max(0, it.weight);
    if (weight <= 0) continue;
    if (r < weight) return it;
    r -= weight;
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].weight > 0) return items[i];
  return null;
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
function buildKeyNation(key, nationId, _region, rng) {
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
function buildAIWeights(tier, _rng) {
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
  const drawnTerrain = region.terrainBias[terrainIdx];
  const terrain = isCapital && drawnTerrain === "ocean" ? "coast" : drawnTerrain;
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
    agriBase: drawnTerrain === "ocean" ? Number(isCapital) : lerp(0.5, 1.5, rng()),
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
function legacyOceanCapital(state, p) {
  return p.terrain === "ocean" && p.id.startsWith("p_") && state.nations[p.ownerId]?.capital === p.id;
}
function restoreCapitalTerrain(p) {
  p.terrain = "coast";
  p.agriBase = Math.max(1, p.agriBase);
}

// src/engine/provincePopulation.ts
function setProvincePopulation(province, population) {
  const total = province.terrain === "ocean" ? 0 : Math.max(0, Math.round(population));
  province.population = total;
  if (!province.classes.length && total > 0) {
    province.classes = CLASS_IDS.map((classId) => ({ classId, count: 0, satisfaction: 50 }));
  }
  let weightSum = 0;
  for (const group of province.classes) {
    if (group.weight === void 0 || !Number.isFinite(group.weight) || group.weight < 0) {
      group.weight = Number.isFinite(group.count) ? Math.max(0, group.count) : 0;
    }
    weightSum += group.weight;
  }
  if (weightSum === 0 && total > 0) {
    for (const group of province.classes) {
      group.weight = LAND_RATIO[group.classId];
      weightSum += group.weight;
    }
  }
  let cumulativeWeight = 0;
  let assigned = 0;
  for (const group of province.classes) {
    cumulativeWeight += group.weight ?? 0;
    const throughGroup = weightSum > 0 ? Math.round(total * (cumulativeWeight / weightSum)) : 0;
    group.count = throughGroup - assigned;
    assigned = throughGroup;
  }
}

// src/utils/math.ts
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// src/engine/init.ts
function buildClasses(ratio) {
  return CLASS_IDS.map((classId) => ({
    classId,
    weight: ratio[classId],
    count: 0,
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
function buildResources(n3) {
  return {
    gold: n3.initGold,
    food: n3.initFood,
    wood: n3.initWood,
    iron: n3.initIron,
    adminPt: 5,
    sciPt: 0,
    influence: 20,
    supply: 50
  };
}
function buildArmy(n3) {
  if (!n3.capital) return [];
  return [{
    id: `initial_army_${n3.id}`,
    ownerId: n3.id,
    location: n3.capital,
    size: n3.initArmy.size,
    morale: n3.initArmy.morale,
    training: n3.initArmy.training,
    equipment: n3.initArmy.equipment,
    supply: 80
  }];
}
function openingRelation(from, to, relation, trust) {
  return { from, to, relation, trust, threat: 0, tradeDep: 0, treaty: "none", truceTurns: 0 };
}
function buildProvinces(definitions, rulers, playerId2) {
  const out = {};
  for (const p of definitions) {
    out[p.id] = {
      id: p.id,
      name: p.name,
      terrain: p.terrain,
      ownerId: p.ownerId,
      isCapital: p.isCapital,
      agriBase: p.agriBase,
      culture: p.culture,
      religion: p.religion,
      population: p.initPop,
      classes: buildClasses(p.initClassRatio),
      assimilation: p.ownerId === playerId2 ? 100 : 50,
      loyalty: p.ownerId === playerId2 ? 70 : 50,
      unrest: 0,
      rebellionRisk: 0,
      buildings: [],
      garrison: 0,
      baseResources: { ...p.baseResources },
      adjacent: [...p.adjacent],
      distToPlayerCapital: p.distToPlayerCapital,
      x: p.x,
      y: p.y
    };
    setProvincePopulation(out[p.id], p.initPop);
  }
  for (const n3 of rulers) {
    if (n3.capital && out[n3.capital]) {
      out[n3.capital].garrison = n3.initArmy.size;
    }
  }
  return out;
}
function buildNations(rulers, playerId2) {
  const out = {};
  for (const n3 of rulers) {
    out[n3.id] = {
      id: n3.id,
      name: n3.name,
      isPlayer: n3.id === playerId2,
      tier: n3.tier,
      government: buildGovernment(n3.government),
      character: n3.character,
      tendency: buildTendency(),
      activeCharacterBonuses: [],
      capital: n3.capital,
      ruler: { ...n3.ruler },
      taxRate: n3.initTaxRate,
      resources: buildResources(n3),
      factions: buildFactions(n3.government),
      tech: { agri: n3.initTech.agri, mil: n3.initTech.mil, admin: n3.initTech.admin, culture: 0, researchProgress: null },
      army: buildArmy(n3),
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
  return out;
}
function createCampaign(scenarioId, seed, playerNationId, rulers, map, relations) {
  const state = {
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
    chronicle: []
  };
  buildRelationMap(state);
  return state;
}
function createWorldState(seed, playerNationId, regionFilter) {
  const world = generateWorld(seed, playerNationId, regionFilter);
  let playerId2 = playerNationId ?? "";
  if (!world.nations.some((n3) => n3.id === playerId2)) {
    const marked = world.nations.find((n3) => n3.isPlayer);
    playerId2 = marked?.id ?? world.nations.find((n3) => n3.tier === "S" || n3.tier === "A")?.id ?? world.nations[0].id;
  }
  const relations = world.relations.map((r) => openingRelation(r.from, r.to, r.relation, r.trust));
  return createCampaign("world", seed, playerId2, world.nations, world.provinces, relations);
}
function relationPair(state, from, to) {
  const left = getRelationObj(from, to, state);
  const right = getRelationObj(to, from, state);
  return left && right ? [left, right] : null;
}
function findRelation(relations, from, to) {
  return relations.find((r) => r.from === from && r.to === to);
}
var relationIndices = /* @__PURE__ */ new WeakMap();
function buildRelationMap(state) {
  const positions = /* @__PURE__ */ new Map();
  state.relations.forEach((r, i) => positions.set(`${r.from}|${r.to}`, i));
  relationIndices.set(state.relations, { length: state.relations.length, positions });
}
function getRelationObj(from, to, state) {
  let index = relationIndices.get(state.relations);
  if (!index || index.length !== state.relations.length) {
    buildRelationMap(state);
    index = relationIndices.get(state.relations);
  }
  const position = index.positions.get(`${from}|${to}`);
  return position === void 0 ? void 0 : state.relations[position];
}
function invalidateRelationMap(state) {
  relationIndices.delete(state.relations);
  if (Object.isExtensible(state)) state._relMap = void 0;
}
function provincesOf(nationId, provinces) {
  return Object.values(provinces).filter((p) => p.ownerId === nationId);
}

// src/gameplay/reportFinances.ts
function operatingNet(report) {
  return report.income.tax + report.income.trade + report.income.building - report.expense.military - report.expense.corruption;
}

// src/engine/chronicle.ts
var CHRONICLE_MAX = 50;
function personalChronicleOwner(entry) {
  if (entry.kind !== "milestone_war" && entry.kind !== "milestone_diplomacy") return entry.actorId;
}
function addChronicle(state, entry) {
  const owner = personalChronicleOwner(entry);
  const entries = owner && state.sharedChronicles ? state.sharedChronicles[owner] ??= [] : state.chronicle;
  const duplicate = entry.kind === "milestone_war" && entry.id ? entries.some((c) => c.id === entry.id) : entries.some((c) => c.kind === entry.kind && c.title === entry.title);
  if (duplicate) return;
  entries.push(entry);
  if (entries.length > CHRONICLE_MAX) entries.splice(0, entries.length - CHRONICLE_MAX);
}
function detectMilestones(state, prev) {
  const playerId2 = state.playerNationId;
  const player = state.nations[playerId2];
  if (!player) return;
  const prevPlayer = prev.nations[playerId2];
  if (!prevPlayer) return;
  const turn = state.turn;
  const provs = provincesOf(playerId2, state.provinces);
  const prevProvs = provincesOf(playerId2, prev.provinces);
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
    const war = state.wars.find((w) => w.attackerId === playerId2 || w.defenderId === playerId2);
    const enemy = war ? state.nations[war.attackerId === playerId2 ? war.defenderId : war.attackerId] : null;
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
    const net = operatingNet(r);
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
}
function detectBattleMilestones(state, prev, warUpdates) {
  const { playerNationId: playerId2, turn } = state;
  for (const war of prev.wars) {
    const isAttacker = war.attackerId === playerId2;
    if (!isAttacker && war.defenderId !== playerId2) continue;
    const reports = warUpdates[war.id]?.battleReports;
    if (!reports?.length) continue;
    const r = reports[reports.length - 1];
    const location = state.provinces[war.targetProvinceId]?.name ?? "\u524D\u7EBF";
    const ownLoss = isAttacker ? r.attLoss : r.defLoss;
    if (r.outcome === (isAttacker ? "advance" : "repelled")) {
      addChronicle(state, {
        turn,
        kind: "victory",
        title: "\u9996\u6218\u544A\u6377",
        desc: `\u6211\u519B\u4E8E ${location} \u53D6\u80DC\uFF0C\u65A9\u654C ${isAttacker ? r.defLoss : r.attLoss}\u3002`
      });
    } else if (r.outcome !== "stalemate" && r.attLoss + r.defLoss > 100) {
      addChronicle(state, {
        turn,
        kind: "crisis",
        title: "\u5175\u8D25\u4E4B\u8FB1",
        desc: `\u6211\u519B\u4E8E ${location} \u60E8\u8D25\uFF0C\u6298\u635F ${ownLoss} \u4EBA\u3002`
      });
    }
  }
}

// src/engine/stateClone.ts
function cloneGameState(state) {
  const serializable = { ...state, _relMap: void 0 };
  if (typeof structuredClone === "function") return structuredClone(serializable);
  return JSON.parse(JSON.stringify(serializable));
}

// src/engine/turnIntel.ts
function collectWorldEvents(previous, current2, playerId2, playerProvinces) {
  const events = [];
  const neighbors = /* @__PURE__ */ new Set();
  for (const province of playerProvinces) {
    for (const adjacentId of province.adjacent) {
      const oldOwner = previous.provinces[adjacentId]?.ownerId;
      if (oldOwner && oldOwner !== playerId2) neighbors.add(oldOwner);
      const adjacent = current2.provinces[adjacentId];
      if (adjacent && adjacent.ownerId !== playerId2) neighbors.add(adjacent.ownerId);
    }
  }
  for (const war of current2.wars) {
    if (previous.wars.some((candidate) => candidate.id === war.id)) continue;
    if (war.attackerId !== playerId2 && war.defenderId !== playerId2 && !neighbors.has(war.attackerId) && !neighbors.has(war.defenderId)) continue;
    const attacker = current2.nations[war.attackerId];
    const defender = current2.nations[war.defenderId];
    const target = current2.provinces[war.targetProvinceId];
    events.push(`\u2694 ${attacker?.name ?? war.attackerId} \u5411 ${defender?.name ?? war.defenderId} \u5BA3\u6218\uFF0C\u653B ${target?.name ?? war.targetProvinceId}`);
  }
  for (const [nationId, nation] of Object.entries(current2.nations)) {
    const oldNation = previous.nations[nationId];
    if (oldNation && !oldNation.defeated && nation.defeated && nationId !== playerId2 && neighbors.has(nationId)) {
      events.push(`\u2620 ${nation.name} \u706D\u4EA1`);
    }
  }
  const oldTreaties = new Map(previous.relations.map((r) => [`${r.from}|${r.to}`, r]));
  const announced = /* @__PURE__ */ new Set();
  for (const { from, to, treaty } of current2.relations) {
    const involvesPlayer = from === playerId2 || to === playerId2;
    if (!involvesPlayer && !neighbors.has(from) && !neighbors.has(to)) continue;
    const pair = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (announced.has(pair)) continue;
    const old = oldTreaties.get(`${from}|${to}`);
    if (treaty === "alliance" && old?.treaty !== "alliance") {
      events.push(`\u{1F91D} ${current2.nations[from]?.name ?? from} \u4E0E ${current2.nations[to]?.name ?? to} \u7ED3\u76DF`);
    } else if (involvesPlayer && treaty === "none" && old?.treaty === "truce" && old.truceTurns > 0) {
      const other = from === playerId2 ? to : from;
      events.push(`\u{1F54A} \u4E0E ${current2.nations[other]?.name ?? other} \u505C\u6218\u5230\u671F\uFF0C\u53EF\u518D\u5BA3\u6218`);
    } else continue;
    announced.add(pair);
  }
  return events.slice(-10);
}
function collectPlayerProvinceChanges(previous, current2, playerId2) {
  const changes = [];
  for (const [provinceId, province] of Object.entries(current2.provinces)) {
    const oldProvince = previous.provinces[provinceId];
    if (!oldProvince || oldProvince.ownerId === province.ownerId) continue;
    if (oldProvince.ownerId !== playerId2 && province.ownerId !== playerId2) continue;
    changes.push({
      id: provinceId,
      name: province.name,
      from: oldProvince.ownerId,
      to: province.ownerId
    });
  }
  return changes;
}
function recognizeRebelIndependence(nation) {
  delete nation.rebellionDecay;
  delete nation.rebelOf;
  nation.name = nation.name.replace(/^叛军·/, "");
}
function decayRebelNations(state) {
  const expired = [];
  for (const [nationId, nation] of Object.entries(state.nations)) {
    if (nation.rebellionDecay === void 0 || !nation.rebelOf) continue;
    if (nation.defeated) {
      expired.push(nationId);
      continue;
    }
    nation.rebellionDecay -= 1;
    if (nation.rebellionDecay > 0) continue;
    const parent = state.nations[nation.rebelOf];
    if (!parent || parent.defeated) {
      recognizeRebelIndependence(nation);
      if (parent?.civilWar?.active) parent.civilWar = { active: false, rebels: [] };
      continue;
    }
    for (const province of Object.values(state.provinces)) {
      if (province.ownerId !== nationId) continue;
      province.ownerId = parent.id;
      province.isCapital = parent.capital === province.id;
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
      desc: `${nation.name.replace("\u53DB\u519B\xB7", "")} \u5386\u7ECF 5 \u5E74\u672A\u9547\u538B\uFF0C\u81EA\u884C\u5F52\u987A ${parent.name}\u3002`,
      actorId: parent.id
    });
    expired.push(nationId);
  }
  removeRebelNations(state, expired);
}
function syncWarFlags(state) {
  const atWar2 = new Set(state.wars.flatMap((war) => [war.attackerId, war.defenderId]));
  for (const nation of Object.values(state.nations)) nation.atWar = atWar2.has(nation.id);
}
function removeRebelNations(state, ids) {
  if (!ids.length) return;
  const removed = new Set(ids);
  for (const id of removed) {
    delete state.nations[id];
    if (state.aiMemory) delete state.aiMemory[id];
    if (state.aiStrategyMeta) delete state.aiStrategyMeta[id];
  }
  for (const nation of Object.values(state.nations)) {
    if (!nation.civilWar?.active) continue;
    const rebels = nation.civilWar.rebels.filter((id) => !removed.has(id));
    nation.civilWar = { active: rebels.length > 0, rebels };
  }
  state.wars = state.wars.filter((w) => !removed.has(w.attackerId) && !removed.has(w.defenderId));
  syncWarFlags(state);
  state.relations = state.relations.filter((r) => !removed.has(r.from) && !removed.has(r.to));
  invalidateRelationMap(state);
  state.diplomaticSummits = state.diplomaticSummits.filter((s) => !removed.has(s.initiatorId) && !removed.has(s.targetId));
  state.diplomaticAccords = state.diplomaticAccords.filter((a) => !removed.has(a.partyA) && !removed.has(a.partyB));
  const keepEvent = (e) => !e.nationId || !removed.has(e.nationId);
  state.triggeredEvents = state.triggeredEvents.filter(keepEvent);
  state.eventCooldowns = state.eventCooldowns.filter(keepEvent);
  state.pendingEvents = state.pendingEvents.filter(keepEvent);
  if (state.pendingEventOptions && !keepEvent(state.pendingEventOptions)) state.pendingEventOptions = null;
}

// src/data/events.ts
var fr = (faction, delta) => [{ faction, delta }];
var commonersReaction = (delta) => fr("commoners", delta);
var noblesReaction = (delta) => fr("nobles", delta);
var militaryReaction = (delta) => fr("military", delta);
var fra = (...items) => items;
function option(text, effects, aiWeight) {
  return { text, effects, aiWeight };
}
function recurring(weight, cooldown) {
  return { weight, cooldown, unique: false };
}
function oneTime(weight, cooldown) {
  return { weight, cooldown, unique: true };
}
var followUp = recurring(0, 0);
var uniqueFollowUp = oneTime(0, 0);
function fromTurn(minTurn, conditions) {
  return { minTurn, ...conditions };
}
function defineEvent(id, title, description, category, trigger, frequency, options) {
  return { id, title, description, category, trigger, ...frequency, options };
}
var EVENTS = [
  defineEvent(
    "evt_eastern_reform",
    "\u5F00\u56FD\u8BAE\u653F",
    "\u5730\u65B9\u7A0E\u518C\u591A\u5E74\u672A\u5398\u6E05\u3002\u671D\u5EF7\u8981\u62E8\u6B3E\u6E05\u67E5\u7530\u4EA9\uFF0C\u8FD8\u662F\u628A\u5F81\u6536\u6743\u4EA4\u7ED9\u5730\u65B9\uFF1F",
    "politics",
    {},
    uniqueFollowUp,
    [
      option("\u62E8\u6B3E\u4E08\u91CF\u7530\u4EA9", { gold: -80, efficiency: 8, corruption: -4, factionSat: noblesReaction(-8) }, 1),
      option("\u8BF7\u5730\u65B9\u4EE3\u5F81", { gold: 80, legitimacy: 5, efficiency: -4, factionSat: noblesReaction(8) }, 1)
    ]
  ),
  defineEvent(
    "evt_eastern_envoy",
    "\u8FB9\u5883\u4F7F\u56E2",
    "\u90BB\u56FD\u4F7F\u8282\u5E26\u6765\u4E94\u5E74\u4E92\u4E0D\u4FB5\u72AF\u7684\u63D0\u8BAE\u3002\u7B7E\u7EA6\u53EF\u5B89\u5B9A\u8FB9\u5883\uFF0C\u53CC\u65B9\u4E5F\u5C06\u6682\u65F6\u653E\u5F03\u5411\u5BF9\u65B9\u5BA3\u6218\u3002",
    "diplomacy",
    {},
    uniqueFollowUp,
    [
      option("\u7B7E\u4E0B\u4E94\u5E74\u7EA6\u4E66", { gold: -50, stability: 4 }, 1),
      option("\u5A49\u62D2\u5E76\u6574\u5907\u8FB9\u9632", { iron: 20, stability: -2, factionSat: militaryReaction(8) }, 1)
    ]
  ),
  defineEvent(
    "evt_eastern_renewal",
    "\u8FB9\u7EA6\u671F\u6EE1",
    "\u4E94\u5E74\u4E4B\u7EA6\u5C06\u6EE1\uFF0C\u6614\u65E5\u7684\u4F7F\u8282\u5E26\u6765\u4E86\u65B0\u7684\u6761\u4EF6\u3002",
    "diplomacy",
    {},
    uniqueFollowUp,
    [option("\u63A5\u53D7\u7EED\u7EA6", {}, 1), option("\u8BA9\u539F\u7EA6\u671F\u6EE1", {}, 1)]
  ),
  defineEvent(
    "evt_grain_budget",
    "\u4F59\u7CAE\u7684\u53BB\u5411",
    "\u5883\u5916\u5546\u4EBA\u613F\u4EE5\u6BCF\u77F3\u4E8C\u91D1\u6536\u8D2D\u4E09\u5E74\u7CAE\u98DF\u3002\u5730\u65B9\u4E5F\u5728\u8BF7\u6B3E\u4FEE\u6E20\uFF0C\u5E0C\u671B\u628A\u76C8\u4F59\u7559\u7ED9\u4E0B\u4E00\u5B63\u6536\u6210\u3002",
    "economy",
    {},
    uniqueFollowUp,
    [
      option("\u627F\u63A5\u4E09\u5E74\u4F9B\u7CAE\u7EA6", {}, 1),
      option("\u51FA\u8D44\u4FEE\u6E20", {}, 1),
      option("\u6682\u7559\u7CAE\u6B3E", {}, 1)
    ]
  ),
  // ── 危机类 ──
  defineEvent(
    "evt_famine",
    "\u7CAE\u98DF\u5371\u673A",
    "\u591A\u5730\u7CAE\u4ED3\u544A\u6025\uFF0C\u7CAE\u4EF7\u98DE\u6DA8\uFF0C\u6C11\u4F17\u60F6\u6050\u3002",
    "crisis",
    { maxFoodRatio: 0.6 },
    recurring(10, 15),
    [
      option("\u7D27\u6025\u5F00\u4ED3\u653E\u7CAE", { food: -100, stability: 5, factionSat: commonersReaction(10) }, 2),
      option("\u4ECE\u90BB\u56FD\u9AD8\u4EF7\u8D2D\u7CAE", { gold: -150, food: 80, influence: -3 }, 3),
      option("\u5750\u89C6\u4E0D\u7BA1", { stability: -10, population: -50, factionSat: commonersReaction(-15) }, 1)
    ]
  ),
  defineEvent(
    "evt_plague",
    "\u761F\u75AB",
    "\u761F\u75AB\u8513\u5EF6\uFF0C\u4EBA\u53E3\u9AA4\u51CF\u3002",
    "crisis",
    fromTurn(20),
    recurring(4, 40),
    [
      option("\u9694\u79BB\u75AB\u533A", { population: -80, stability: -5, gold: -50 }, 3),
      option("\u7948\u795E\u79B3\u707E", { population: -150, factionSat: fr("clergy", 10) }, 2),
      option("\u53EC\u96C6\u5B66\u8005\u7814\u7A76", { population: -60, sciPt: 5, gold: -80 }, 2)
    ]
  ),
  defineEvent(
    "evt_drought",
    "\u65F1\u707E",
    "\u6301\u7EED\u5E72\u65F1\uFF0C\u7CAE\u98DF\u51CF\u4EA7\u3002",
    "crisis",
    {},
    recurring(6, 20),
    [
      option("\u51CF\u514D\u519C\u7A0E", { taxRate: -0.02, food: -50, factionSat: commonersReaction(10) }, 3),
      option("\u5F3A\u884C\u5F81\u7CAE", { food: 50, stability: -8, factionSat: commonersReaction(-15) }, 2)
    ]
  ),
  // ── 政治类 ──
  defineEvent(
    "evt_noble_coup",
    "\u8D35\u65CF\u903C\u5BAB",
    "\u4E0D\u6EE1\u7684\u8D35\u65CF\u5BC6\u8C0B\u53CD\u5BF9\u4F60\u7684\u7EDF\u6CBB\u3002",
    "politics",
    { factionSatBelow: { faction: "nobles", threshold: 20 } },
    recurring(8, 25),
    [
      option("\u8BA9\u6B65\u5206\u6743", { legitimacy: -10, efficiency: -5, factionSat: noblesReaction(20) }, 3),
      option("\u94C1\u8155\u9547\u538B", { stability: -10, legitimacy: -5, factionSat: fra({ faction: "nobles", delta: -10 }, { faction: "military", delta: 5 }) }, 2)
    ]
  ),
  defineEvent(
    "evt_merchant_strike",
    "\u5546\u4EBA\u7F62\u5E02",
    "\u5546\u4EBA\u5173\u95ED\u5E97\u94FA\u6297\u8BAE\u7A0E\u653F\u3002",
    "politics",
    { factionSatBelow: { faction: "merchants", threshold: 20 } },
    recurring(8, 25),
    [
      option("\u51CF\u514D\u5546\u7A0E", { taxRate: -0.02, gold: -50, factionSat: fr("merchants", 20) }, 3),
      option("\u5F3A\u5236\u5F00\u5E02", { gold: -100, stability: -5, factionSat: fr("merchants", -10) }, 2)
    ]
  ),
  defineEvent(
    "evt_military_unrest",
    "\u519B\u65B9\u4E0D\u6EE1",
    "\u6B20\u9977\u7684\u519B\u961F\u9A9A\u52A8\u4E0D\u5B89\u3002",
    "politics",
    { factionSatBelow: { faction: "military", threshold: 20 } },
    recurring(9, 20),
    [
      option("\u8865\u53D1\u519B\u9977", { gold: -120, factionSat: militaryReaction(25) }, 3),
      option("\u88C1\u64A4\u8001\u5175", { population: -30, stability: -5, factionSat: militaryReaction(-10) }, 2)
    ]
  ),
  defineEvent(
    "evt_peasant_uprising",
    "\u519C\u6C11\u8D77\u4E49",
    "\u4E0D\u582A\u91CD\u7A0E\u7684\u519C\u6C11\u63ED\u7AFF\u800C\u8D77\u3002",
    "politics",
    { factionSatBelow: { faction: "commoners", threshold: 20 } },
    recurring(9, 20),
    [
      option("\u9547\u538B\u8D77\u4E49", { gold: -80, population: -40, stability: -5, factionSat: fra({ faction: "commoners", delta: -15 }, { faction: "military", delta: 5 }) }, 3),
      option("\u5141\u8BFA\u51CF\u7A0E", { taxRate: -0.03, gold: -30, factionSat: commonersReaction(25) }, 2)
    ]
  ),
  defineEvent(
    "evt_clergy_interference",
    "\u795E\u804C\u5E72\u653F",
    "\u795E\u804C\u4EBA\u5458\u8981\u6C42\u66F4\u5927\u7684\u5B97\u6559\u8BDD\u8BED\u6743\u3002",
    "politics",
    { factionSatBelow: { faction: "clergy", threshold: 30 }, minCorruption: 30 },
    recurring(5, 30),
    [
      option("\u6388\u4E88\u5B97\u6559\u7279\u6743", { influence: 5, efficiency: -5, factionSat: fra({ faction: "clergy", delta: 20 }, { faction: "merchants", delta: -5 }) }, 3),
      option("\u62D2\u7EDD\u5E76\u9650\u5236\u6559\u6743", { stability: -3, legitimacy: -3, factionSat: fr("clergy", -15) }, 2)
    ]
  ),
  defineEvent(
    "evt_succession_crisis",
    "\u738B\u4F4D\u7EE7\u627F\u5371\u673A",
    "\u7EE7\u627F\u5408\u6CD5\u6027\u53D7\u5230\u8D28\u7591\u3002",
    "politics",
    { maxLegitimacy: 25 },
    recurring(12, 30),
    [
      option("\u4E89\u53D6\u8D35\u65CF\u652F\u6301", { gold: -100, legitimacy: 15, factionSat: noblesReaction(15) }, 3),
      option("\u6C11\u4F17\u62E5\u6234\u8DEF\u7EBF", { gold: -80, legitimacy: 10, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -5 }) }, 2)
    ]
  ),
  defineEvent(
    "evt_corruption_scandal",
    "\u8150\u8D25\u4E11\u95FB",
    "\u9AD8\u5B98\u8D2A\u8150\u6848\u66DD\u5149\uFF0C\u671D\u91CE\u9707\u52A8\u3002",
    "politics",
    { minCorruption: 60 },
    recurring(8, 20),
    [
      option("\u4E25\u60E9\u6D89\u6848\u5B98\u5458", { corruption: -10, gold: -50, factionSat: noblesReaction(-10) }, 3),
      option("\u5927\u4E8B\u5316\u5C0F", { corruption: 5, legitimacy: -5, factionSat: commonersReaction(-10) }, 2)
    ]
  ),
  // ── 经济类 ──
  defineEvent(
    "evt_treasury_alarm",
    "\u56FD\u5E93\u544A\u6025",
    "\u56FD\u5E93\u5373\u5C06\u89C1\u5E95\uFF0C\u8D22\u653F\u544A\u6025\u3002",
    "economy",
    fromTurn(1),
    recurring(7, 15),
    [
      option("\u4E34\u65F6\u52A0\u5F81\u7279\u522B\u7A0E", { gold: 100, stability: -5, factionSat: commonersReaction(-10) }, 3),
      option("\u51FA\u552E\u738B\u5BA4\u73CD\u85CF", { gold: 150, legitimacy: -3 }, 2)
    ]
  ),
  defineEvent(
    "evt_trade_route_open",
    "\u5546\u8DEF\u5F00\u901A",
    "\u4E00\u6761\u65B0\u7684\u5546\u8DEF\u88AB\u53D1\u73B0\u3002",
    "economy",
    { notAtWar: true },
    recurring(5, 30),
    [
      option("\u9F13\u52B1\u5546\u4EBA\u5F00\u62D3", { gold: 50, influence: 3, factionSat: fr("merchants", 10) }, 3),
      option("\u738B\u5BA4\u5784\u65AD\u8D38\u6613", { gold: 100, factionSat: fr("merchants", -10) }, 2)
    ]
  ),
  defineEvent(
    "evt_mineral_discovery",
    "\u77FF\u85CF\u53D1\u73B0",
    "\u52D8\u63A2\u8005\u53D1\u73B0\u65B0\u77FF\u85CF\u3002",
    "economy",
    {},
    recurring(4, 40),
    [
      option("\u7ACB\u5373\u5F00\u91C7", { iron: 50, gold: -30 }, 3),
      option("\u957F\u671F\u5F00\u53D1", { iron: 20, gold: 20 }, 2)
    ]
  ),
  defineEvent(
    "evt_harvest_bumper",
    "\u4E30\u6536",
    "\u4ECA\u5E74\u98CE\u8C03\u96E8\u987A\uFF0C\u7CAE\u98DF\u5927\u4E30\u3002",
    "economy",
    {},
    recurring(5, 15),
    [
      option("\u5145\u5B9E\u7CAE\u4ED3", { food: 200, stability: 3 }, 3),
      option("\u51FA\u53E3\u6362\u91D1", { food: 100, gold: 80 }, 2)
    ]
  ),
  // ── 军事类 ──
  defineEvent(
    "evt_war_weariness",
    "\u538C\u6218\u6C11\u53D8",
    "\u957F\u671F\u6218\u4E89\u5F15\u53D1\u6C11\u4F17\u538C\u6218\u6297\u8BAE\u3002",
    "military",
    { minWarExhaustion: 70 },
    recurring(10, 20),
    [
      option("\u627F\u8BFA\u5C3D\u5FEB\u505C\u6218", { warExhaustion: -10, factionSat: commonersReaction(10) }, 3),
      option("\u5F3A\u786C\u9547\u538B\u53CD\u6218", { stability: -10, warExhaustion: -5, factionSat: commonersReaction(-15) }, 2)
    ]
  ),
  defineEvent(
    "evt_peace_proposal",
    "\u548C\u8C08\u63D0\u8BAE",
    "\u654C\u65B9\u6D3E\u51FA\u4F7F\u8005\u63D0\u8BAE\u505C\u6218\u3002",
    "military",
    { atWar: true },
    recurring(8, 15),
    [
      option("\u63A5\u53D7\u548C\u8C08", { influence: 10, warExhaustion: -20 }, 3),
      option("\u62D2\u7EDD\u7EE7\u7EED\u6218\u4E89", { stability: -3, factionSat: militaryReaction(5) }, 2)
    ]
  ),
  defineEvent(
    "evt_new_territory",
    "\u65B0\u9886\u571F\u6CBB\u7406",
    "\u521A\u5360\u9886\u7684\u7701\u4EFD\u9700\u8981\u6CBB\u7406\u65B9\u6848\u3002",
    "military",
    { hasNewTerritory: true },
    recurring(12, 5),
    [
      option("\u6000\u67D4\u5B89\u629A", { gold: -80, stability: 3, influence: 5 }, 3),
      option("\u9A7B\u519B\u9547\u538B", { gold: -40, stability: -3, factionSat: militaryReaction(5) }, 2)
    ]
  ),
  // ── 外交类 ──
  defineEvent(
    "evt_border_clash",
    "\u8FB9\u5883\u5916\u4EA4\u5371\u673A",
    "\u4E0E\u90BB\u56FD\u8FB9\u5883\u53D1\u751F\u5C0F\u89C4\u6A21\u51B2\u7A81\u3002",
    "diplomacy",
    { relationBelow: { target: "n02", threshold: -30 } },
    recurring(7, 20),
    [
      option("\u5916\u4EA4\u65A1\u65CB", { influence: -10, relation: { target: "n02", delta: 10 } }, 3),
      option("\u5F3A\u786C\u53CD\u5236", { relation: { target: "n02", delta: -15 }, factionSat: militaryReaction(8) }, 2)
    ]
  ),
  defineEvent(
    "evt_foreign_envoy",
    "\u5916\u56FD\u4F7F\u56E2\u5230\u8BBF",
    "\u90BB\u56FD\u6D3E\u51FA\u4F7F\u56E2\u5BFB\u6C42\u5408\u4F5C\u3002",
    "diplomacy",
    { notAtWar: true, minTurn: 5 },
    recurring(5, 25),
    [
      option("\u70ED\u60C5\u63A5\u5F85", { gold: -30, influence: 8, relation: { target: "n03", delta: 5 } }, 3),
      option("\u51B7\u6DE1\u56DE\u7EDD", { influence: -3, relation: { target: "n03", delta: -5 } }, 2)
    ]
  ),
  defineEvent(
    "evt_neighbor_threat",
    "\u90BB\u56FD\u5A01\u80C1",
    "\u90BB\u56FD\u9648\u5175\u8FB9\u5883\u53D1\u51FA\u5A01\u80C1\u3002",
    "diplomacy",
    fromTurn(10),
    recurring(6, 30),
    [
      option("\u5916\u4EA4\u59A5\u534F", { influence: -5, gold: -50, relation: { target: "n04", delta: 10 } }, 3),
      option("\u6269\u519B\u5907\u6218", { gold: -100, factionSat: militaryReaction(10), relation: { target: "n04", delta: -10 } }, 2)
    ]
  ),
  // ── 宗教类 ──
  defineEvent(
    "evt_religion_dispute",
    "\u5B97\u6559\u4E89\u7AEF",
    "\u4E0D\u540C\u4FE1\u4EF0\u8005\u53D1\u751F\u51B2\u7A81\u3002",
    "religion",
    { provinceCultureDiff: true },
    recurring(6, 25),
    [
      option("\u63A8\u884C\u5BBD\u5BB9\u653F\u7B56", { stability: 3, influence: 3, factionSat: fr("clergy", -10) }, 3),
      option("\u652F\u6301\u56FD\u6559\u538B\u5236", { stability: -5, factionSat: fra({ faction: "clergy", delta: 15 }, { faction: "commoners", delta: -10 }) }, 2)
    ]
  ),
  // ── 科技类 ──
  defineEvent(
    "evt_tech_breakthrough",
    "\u79D1\u6280\u7A81\u7834",
    "\u5B66\u8005\u53D6\u5F97\u91CD\u5927\u7A81\u7834\uFF01",
    "science",
    { techLevelAbove: { branch: "admin", level: 2 } },
    recurring(3, 20),
    [
      option("\u63A8\u5E7F\u65B0\u6280\u672F", { sciPt: 20, gold: -50 }, 3),
      option("\u4FDD\u5BC6\u5FA1\u7528", { sciPt: 10, legitimacy: 3, factionSat: noblesReaction(5) }, 2)
    ]
  ),
  defineEvent(
    "evt_scholar_petition",
    "\u5B66\u8005\u8BF7\u613F",
    "\u5B66\u8005\u8BF7\u6C42\u52A0\u5927\u79D1\u7814\u6295\u5165\u3002",
    "science",
    fromTurn(5),
    recurring(4, 25),
    [
      option("\u62E8\u91D1\u652F\u6301", { gold: -80, sciPt: 10 }, 3),
      option("\u5A49\u62D2", { factionSat: commonersReaction(-5) }, 2)
    ]
  ),
  // ── 机会类 ──
  defineEvent(
    "evt_reform_call",
    "\u6539\u9769\u547C\u58F0",
    "\u6C11\u4F17\u4E0E\u5546\u4EBA\u547C\u5401\u4F53\u5236\u6539\u9769\u3002",
    "opportunity",
    fromTurn(15, { maxStability: 40 }),
    recurring(5, 30),
    [
      option("\u542F\u52A8\u6E10\u8FDB\u6539\u9769", { legitimacy: -5, stability: 5, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -10 }) }, 3),
      option("\u62D2\u7EDD\u6539\u9769", { stability: -5, factionSat: commonersReaction(-10) }, 2)
    ]
  ),
  defineEvent(
    "evt_coup_risk",
    "\u519B\u4E8B\u653F\u53D8\u98CE\u9669",
    "\u519B\u65B9\u5BC6\u8C0B\u53D1\u52A8\u653F\u53D8\uFF01",
    "politics",
    { factionSatBelow: { faction: "military", threshold: 10 }, maxLegitimacy: 40 },
    recurring(8, 50),
    [
      option("\u5BC6\u8C0B\u5206\u5316\u5C06\u9886", { gold: -150, legitimacy: -5, factionSat: militaryReaction(15) }, 3),
      option("\u5148\u53D1\u5236\u4EBA\u6E05\u6D17", { stability: -15, legitimacy: -10, factionSat: militaryReaction(-20) }, 1)
    ]
  ),
  // ── 扩展事件 26-55（世界级） ──
  defineEvent("evt_gold_rush", "\u6DD8\u91D1\u70ED", "\u8FB9\u5883\u53D1\u73B0\u91D1\u77FF\uFF01", "economy", fromTurn(10), recurring(3, 40), [option("\u5F00\u91C7", { gold: 200, corruption: 5 }, 3), option("\u9650\u5236\u5F00\u91C7", { gold: 50, stability: 3 }, 2)]),
  defineEvent("evt_trade_boom", "\u8D38\u6613\u7E41\u8363", "\u5546\u8DEF\u7545\u901A\uFF0C\u8D38\u6613\u91CF\u6FC0\u589E\uFF01", "economy", fromTurn(5, { notAtWar: true }), recurring(4, 25), [option("\u9F13\u52B1\u8D38\u6613", { gold: 100, factionSat: fr("merchants", 10) }, 3), option("\u5F81\u6536\u5546\u7A0E", { gold: 150, factionSat: fr("merchants", -8) }, 2)]),
  defineEvent("evt_drought_severe", "\u5927\u65F1", "\u4E45\u65F1\u4E0D\u96E8\uFF0C\u7CAE\u98DF\u51CF\u4EA7\uFF01", "crisis", fromTurn(3), recurring(5, 30), [option("\u5F00\u4ED3\u653E\u7CAE", { food: -100, stability: 5 }, 3), option("\u52A0\u91CD\u8D4B\u7A0E\u6551\u707E", { gold: -80, food: 50, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent("evt_refugee_wave", "\u8FB9\u5883\u96BE\u6C11\u6F6E", "\u90BB\u56FD\u6218\u4E71\uFF0C\u96BE\u6C11\u6D8C\u5165\u8FB9\u5883\uFF01", "crisis", fromTurn(10), recurring(4, 35), [option("\u63A5\u7EB3\u5B89\u7F6E", { population: 500, food: -50, stability: -3 }, 2), option("\u5173\u95ED\u8FB9\u5883", { legitimacy: -5, factionSat: commonersReaction(5) }, 3)]),
  defineEvent("evt_merchant_guild", "\u5546\u4EBA\u884C\u4F1A", "\u5546\u4EBA\u7EC4\u5EFA\u884C\u4F1A\u8981\u6C42\u7279\u6743\uFF01", "politics", fromTurn(8), recurring(4, 30), [option("\u6388\u4E88\u7279\u6743", { gold: 80, factionSat: fra({ faction: "merchants", delta: 15 }, { faction: "nobles", delta: -8 }) }, 3), option("\u62D2\u7EDD", { factionSat: fr("merchants", -12) }, 2)]),
  defineEvent("evt_military_reform", "\u519B\u4E8B\u6539\u9769", "\u5C06\u9886\u63D0\u8BAE\u6539\u9769\u519B\u5236\uFF01", "military", fromTurn(10), recurring(3, 40), [option("\u63A8\u884C\u6539\u9769", { gold: -120, factionSat: militaryReaction(10), stability: -3 }, 3), option("\u7EF4\u6301\u73B0\u72B6", { factionSat: militaryReaction(-5) }, 2)]),
  defineEvent("evt_cultural_flourish", "\u6587\u5316\u7E41\u8363", "\u5B66\u8005\u827A\u672F\u5BB6\u6C47\u805A\uFF0C\u6587\u5316\u660C\u76DB\uFF01", "culture", fromTurn(15, { minStability: 40 }), recurring(3, 30), [option("\u5927\u529B\u8D44\u52A9", { gold: -80, sciPt: 15, legitimacy: 5 }, 3), option("\u9002\u5EA6\u652F\u6301", { gold: -30, sciPt: 5 }, 2)]),
  defineEvent("evt_border_incident", "\u8FB9\u519B\u51B2\u7A81", "\u8FB9\u9632\u519B\u4E0E\u90BB\u56FD\u53D1\u751F\u5C0F\u89C4\u6A21\u51B2\u7A81\uFF01", "military", fromTurn(5), recurring(5, 20), [option("\u5F3A\u786C\u56DE\u5E94", { stability: 3, factionSat: fra({ faction: "military", delta: 8 }, { faction: "merchants", delta: -5 }) }, 2), option("\u5916\u4EA4\u65A1\u65CB", { gold: -30, legitimacy: 3 }, 3)]),
  defineEvent("evt_earthquake", "\u5730\u9707", "\u5F3A\u70C8\u5730\u9707\u88AD\u51FB\u7701\u4EFD\uFF01", "crisis", fromTurn(3), recurring(3, 50), [option("\u5168\u529B\u6551\u707E", { gold: -150, food: -50, stability: 5 }, 3), option("\u6709\u9650\u6551\u63F4", { gold: -50, stability: -5 }, 2)]),
  defineEvent("evt_tax_evasion", "\u5927\u89C4\u6A21\u9003\u7A0E", "\u5BCC\u5546\u5927\u65CF\u9003\u7A0E\u4E25\u91CD\uFF01", "economy", { minCorruption: 30 }, recurring(5, 25), [option("\u4E25\u67E5\u91CD\u7F5A", { gold: 100, factionSat: noblesReaction(-10), corruption: -5 }, 2), option("\u4ECE\u8F7B\u53D1\u843D", { factionSat: noblesReaction(5), corruption: 3 }, 3)]),
  defineEvent("evt_succession_war", "\u7EE7\u627F\u5371\u673A", "\u591A\u4F4D\u7EE7\u627F\u4EBA\u9009\u4E89\u593A\u5927\u4F4D\uFF01", "politics", { maxLegitimacy: 50 }, recurring(6, 40), [option("\u7ACB\u957F\u5B50", { legitimacy: 10, stability: -5 }, 3), option("\u62E9\u8D24\u7ACB", { legitimacy: 5, stability: -8, factionSat: noblesReaction(-10) }, 2)]),
  defineEvent("evt_foreign_aid", "\u5916\u56FD\u63F4\u52A9", "\u53CB\u90A6\u9001\u6765\u7269\u8D44\u63F4\u52A9\uFF01", "economy", fromTurn(10, { notAtWar: true }), recurring(3, 30), [option("\u6B23\u7136\u63A5\u53D7", { gold: 80, food: 60 }, 3), option("\u5A49\u62D2\u4EE5\u4FDD\u72EC\u7ACB", { legitimacy: 5 }, 2)]),
  defineEvent("evt_pop_boom", "\u4EBA\u53E3\u6FC0\u589E", "\u4E30\u6536\u5E26\u6765\u4EBA\u53E3\u5FEB\u901F\u589E\u957F\uFF01", "population", fromTurn(8, { minStability: 50 }), recurring(3, 30), [option("\u9F13\u52B1\u589E\u957F", { population: 300, food: -30 }, 3), option("\u9002\u5EA6\u63A7\u5236", { population: 100 }, 2)]),
  defineEvent("evt_slave_revolt", "\u5974\u5F79\u8D77\u4E49", "\u88AB\u538B\u8FEB\u8005\u63ED\u7AFF\u800C\u8D77\uFF01", "crisis", fromTurn(10, { maxStability: 40 }), recurring(5, 35), [option("\u9547\u538B", { gold: -80, stability: -5, factionSat: militaryReaction(5) }, 2), option("\u9002\u5EA6\u6539\u9769", { gold: -50, legitimacy: 5, factionSat: noblesReaction(-8) }, 3)]),
  defineEvent("evt_spy_scandal", "\u95F4\u8C0D\u4E11\u95FB", "\u5916\u56FD\u95F4\u8C0D\u88AB\u6293\u83B7\uFF01", "diplomacy", fromTurn(5), recurring(4, 25), [option("\u516C\u5F00\u5904\u5211", { legitimacy: 5, stability: -3 }, 2), option("\u79D8\u5BC6\u5229\u7528", { gold: 50, corruption: 3 }, 3)]),
  defineEvent("evt_temple_dispute", "\u5BFA\u5E99\u4E89\u7AEF", "\u5B97\u6559\u56E2\u4F53\u95F4\u7206\u53D1\u51B2\u7A81\uFF01", "religion", fromTurn(5, { provinceCultureDiff: true }), recurring(4, 30), [option("\u4EF2\u88C1\u8C03\u505C", { gold: -30, stability: 3 }, 3), option("\u652F\u6301\u4E00\u65B9", { factionSat: fr("clergy", 10), stability: -5 }, 2)]),
  defineEvent("evt_road_building", "\u4FEE\u8DEF\u70ED\u6F6E", "\u5404\u65B9\u8981\u6C42\u4FEE\u5EFA\u9053\u8DEF\uFF01", "economy", fromTurn(8, { notAtWar: true }), recurring(4, 25), [option("\u5927\u5174\u571F\u6728", { gold: -120, stability: 3, factionSat: fr("merchants", 8) }, 3), option("\u91CF\u529B\u800C\u884C", { gold: -40 }, 2)]),
  defineEvent("evt_weapon_advance", "\u6B66\u5668\u9769\u65B0", "\u5DE5\u5320\u53D1\u660E\u65B0\u578B\u6B66\u5668\uFF01", "military", { techLevelAbove: { branch: "mil", level: 2 } }, recurring(3, 35), [option("\u88C5\u5907\u5168\u519B", { gold: -100, iron: -20, factionSat: militaryReaction(12) }, 3), option("\u9650\u91CF\u88C5\u5907", { gold: -40, factionSat: militaryReaction(5) }, 2)]),
  defineEvent("evt_noble_feud", "\u8D35\u65CF\u5185\u6597", "\u4E24\u5927\u8D35\u65CF\u5BB6\u65CF\u516C\u5F00\u5BF9\u7ACB\uFF01", "politics", fromTurn(5), recurring(4, 20), [option("\u5C45\u4E2D\u8C03\u505C", { gold: -50, stability: 3 }, 3), option("\u652F\u6301\u5F3A\u52BF\u65B9", { factionSat: noblesReaction(-8), legitimacy: -3 }, 2)]),
  defineEvent("evt_harvest_festival", "\u4E30\u6536\u8282", "\u4E94\u8C37\u4E30\u767B\uFF0C\u4E07\u6C11\u540C\u5E86\uFF01", "culture", fromTurn(5, { notAtWar: true, minStability: 30 }), recurring(5, 15), [option("\u5927\u8086\u5E86\u795D", { gold: -50, food: -20, stability: 5, factionSat: commonersReaction(10) }, 3), option("\u7B80\u6734\u4ECE\u4E8B", { stability: 2 }, 2)]),
  defineEvent("evt_corruption_expose", "\u8D2A\u8150\u66DD\u5149", "\u5927\u81E3\u8D2A\u58A8\u88AB\u63ED\u53D1\uFF01", "politics", { minCorruption: 40 }, recurring(5, 25), [option("\u4E25\u60E9\u4E0D\u8D37", { corruption: -8, legitimacy: 5, factionSat: noblesReaction(-12) }, 3), option("\u7F5A\u9152\u4E09\u676F", { corruption: -2, legitimacy: -3 }, 2)]),
  defineEvent("evt_bandit_outbreak", "\u76D7\u532A\u7316\u7357", "\u76D7\u532A\u5360\u636E\u5C71\u5934\u52AB\u63A0\u5546\u8DEF\uFF01", "crisis", { maxStability: 50 }, recurring(5, 20), [option("\u6D3E\u5175\u6E05\u527F", { gold: -60, stability: 5, factionSat: militaryReaction(5) }, 3), option("\u62DB\u5B89\u5B89\u629A", { gold: -30, corruption: 3 }, 2)]),
  defineEvent("evt_foreign_merchants", "\u5916\u5546\u6D8C\u5165", "\u5916\u56FD\u5546\u4EBA\u5E26\u6765\u65B0\u5947\u5546\u54C1\uFF01", "economy", fromTurn(8, { notAtWar: true }), recurring(3, 25), [option("\u5F00\u653E\u5E02\u573A", { gold: 60, factionSat: fra({ faction: "merchants", delta: 8 }, { faction: "commoners", delta: -3 }) }, 3), option("\u9650\u5236\u51C6\u5165", { factionSat: fr("merchants", -5) }, 2)]),
  defineEvent("evt_land_reform", "\u571F\u5730\u6539\u9769", "\u519C\u6C11\u8981\u6C42\u91CD\u65B0\u5206\u914D\u571F\u5730\uFF01", "politics", { minTurn: 15, factionSatBelow: { faction: "commoners", threshold: 30 } }, recurring(5, 40), [option("\u63A8\u884C\u6539\u9769", { gold: -100, stability: -8, factionSat: fra({ faction: "commoners", delta: 20 }, { faction: "nobles", delta: -15 }) }, 2), option("\u62D2\u7EDD", { factionSat: commonersReaction(-10), stability: -3 }, 3)]),
  defineEvent("evt_witch_hunt", "\u730E\u5DEB\u8FD0\u52A8", "\u6C11\u95F4\u6380\u8D77\u730E\u5DEB\u72C2\u6F6E\uFF01", "religion", { maxStability: 40 }, recurring(4, 30), [option("\u987A\u4ECE\u6C11\u610F", { stability: 3, legitimacy: -3, population: -100 }, 2), option("\u7981\u6B62\u8FEB\u5BB3", { stability: -5, factionSat: fr("clergy", -8) }, 3)]),
  defineEvent("evt_diplomatic_envoy", "\u5916\u4EA4\u4F7F\u56E2", "\u4ED6\u56FD\u6D3E\u9063\u4F7F\u56E2\u6765\u8BBF\uFF01", "diplomacy", fromTurn(5, { notAtWar: true }), recurring(4, 20), [option("\u9686\u91CD\u63A5\u5F85", { gold: -40, legitimacy: 3, influence: 5 }, 3), option("\u51B7\u6DE1\u5E94\u5BF9", { legitimacy: -2 }, 2)]),
  defineEvent("evt_mint_debasement", "\u52A3\u5E01\u94F8\u9020\u4E4B\u8BAE", "\u56FD\u5E93\u5403\u7D27\uFF0C\u6709\u4EBA\u5EFA\u8BAE\u94F8\u52A3\u5E01\uFF01", "economy", fromTurn(10), recurring(4, 30), [option("\u94F8\u52A3\u5E01", { gold: 150, corruption: 8, legitimacy: -8 }, 2), option("\u7EF4\u6301\u4FE1\u7528", { legitimacy: 5 }, 3)]),
  defineEvent("evt_wall_construction", "\u57CE\u5899\u4FEE\u5EFA", "\u8FB9\u5883\u7701\u4EFD\u8BF7\u6C42\u4FEE\u7B51\u57CE\u5899\uFF01", "economy", fromTurn(10), recurring(3, 30), [option("\u62E8\u6B3E\u4FEE\u5899", { gold: -100, stability: 3, factionSat: militaryReaction(5) }, 3), option("\u6682\u7F13", { stability: -2 }, 2)]),
  defineEvent("evt_scholar_exchange", "\u5B66\u8005\u4EA4\u6D41", "\u5F02\u56FD\u5B66\u8005\u524D\u6765\u4EA4\u6D41\uFF01", "science", fromTurn(10, { notAtWar: true }), recurring(3, 25), [option("\u70ED\u60C5\u63A5\u5F85", { sciPt: 15, gold: -30 }, 3), option("\u8C28\u614E\u5BF9\u5F85", { sciPt: 5 }, 2)]),
  defineEvent("evt_granary_fire", "\u7CAE\u4ED3\u706B\u707E", "\u4E3B\u8981\u7CAE\u4ED3\u7A81\u53D1\u5927\u706B\uFF01", "crisis", fromTurn(5), recurring(4, 40), [option("\u5168\u529B\u62A2\u6551", { food: -80, gold: -30 }, 3), option("\u542C\u4E4B\u4EFB\u4E4B", { food: -150, stability: -5 }, 1)]),
  defineEvent("evt_naval_discovery", "\u822A\u6D77\u53D1\u73B0", "\u63A2\u9669\u8239\u961F\u53D1\u73B0\u65B0\u5C9B\u5C7F\uFF01", "science", { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, recurring(2, 50), [option("\u5EFA\u7ACB\u636E\u70B9", { gold: -100, influence: 10, food: 40 }, 3), option("\u53EA\u7ED8\u56FE\u8BB0\u5F55", { sciPt: 10 }, 2)]),
  defineEvent("evt_conscription_unrest", "\u5F81\u5175\u66B4\u52A8", "\u5F3A\u5236\u5F81\u5175\u5F15\u53D1\u6C11\u4F17\u6297\u8BAE\uFF01", "crisis", fromTurn(5, { atWar: true }), recurring(5, 20), [option("\u575A\u6301\u5F81\u5175", { stability: -8, factionSat: fra({ faction: "military", delta: 5 }, { faction: "commoners", delta: -12 }) }, 2), option("\u51CF\u5C11\u5F81\u5175", { factionSat: fra({ faction: "commoners", delta: 8 }, { faction: "military", delta: -5 }) }, 3)]),
  // ── B 扩展：35 个新事件，补齐 culture/population/opportunity 等 ──
  defineEvent("evt_culture_flourish", "\u6587\u6CBB\u9F0E\u76DB", "\u8BD7\u4EBA\u5B66\u8005\u4E91\u96C6\u4EAC\u757F\uFF0C\u6587\u8FD0\u660C\u9686\uFF01", "culture", fromTurn(15, { notAtWar: true, minStability: 50 }), recurring(4, 30), [option("\u8BBE\u7ACB\u7FF0\u6797\u9662", { gold: -80, sciPt: 20, legitimacy: 8, factionSat: fr("clergy", 15) }, 3), option("\u6C11\u95F4\u81EA\u6D41", { sciPt: 5, stability: 3 }, 2)]),
  defineEvent("evt_culture_patron", "\u827A\u5320\u6C42\u5E87", "\u540D\u5320\u5BFB\u6C42\u7687\u5BA4\u5E87\u62A4\uFF0C\u732E\u4E0A\u5947\u6280\uFF01", "culture", fromTurn(10, { notAtWar: true }), recurring(3, 25), [option("\u91CD\u91D1\u793C\u9047", { gold: -60, influence: 5, factionSat: fr("clergy", 8) }, 3), option("\u5A49\u62D2", { influence: -2 }, 2)]),
  defineEvent("evt_culture_renaissance", "\u53E4\u5178\u6587\u827A\u590D\u5174", "\u53E4\u5178\u5B66\u672F\u590D\u5174\uFF0C\u65B0\u601D\u6F6E\u6D8C\u52A8\uFF01", "culture", { minTurn: 30, techLevelAbove: { branch: "admin", level: 3 } }, oneTime(2, 60), [option("\u5927\u529B\u5021\u5BFC", { gold: -150, sciPt: 40, stability: 5, factionSat: fra({ faction: "merchants", delta: 20 }, { faction: "clergy", delta: -8 }) }, 3), option("\u987A\u5176\u81EA\u7136", { sciPt: 15 }, 2)]),
  defineEvent("evt_culture_ban", "\u5F02\u7AEF\u5B66\u8BF4", "\u65B0\u5947\u5B66\u8BF4\u6311\u6218\u4F20\u7EDF\uFF0C\u6559\u4F1A\u8981\u6C42\u67E5\u7981\uFF01", "culture", { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, recurring(4, 35), [option("\u67E5\u7981\u5F02\u7AEF", { stability: 3, sciPt: -10, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "merchants", delta: -15 }) }, 2), option("\u4FDD\u62A4\u5B66\u672F", { stability: -4, sciPt: 15, factionSat: fr("clergy", -10) }, 3)]),
  defineEvent("evt_culture_festival", "\u8BF8\u90A6\u671D\u8D3A", "\u8BF8\u90A6\u9063\u4F7F\u671D\u8D3A\uFF0C\u56FD\u5A01\u8FDC\u626C\uFF01", "culture", fromTurn(25, { notAtWar: true, minStability: 60 }), recurring(3, 50), [option("\u76DB\u5178\u793C\u4E4B", { gold: -120, legitimacy: 10, influence: 15 }, 3), option("\u7B80\u793C\u76F8\u5F85", { legitimacy: 3, influence: 5 }, 2)]),
  defineEvent("evt_pop_boom2", "\u4EBA\u4E01\u5174\u65FA", "\u8FDE\u5E74\u4E30\u7A14\uFF0C\u4EBA\u53E3\u6FC0\u589E\uFF01", "population", fromTurn(10, { notAtWar: true }), recurring(4, 30), [option("\u9F13\u52B1\u751F\u80B2", { food: -50, population: 200, stability: 3 }, 3), option("\u987A\u5176\u81EA\u7136", { population: 100 }, 2)]),
  defineEvent("evt_pop_migration", "\u6D41\u6C11\u6D8C\u5165", "\u90BB\u90A6\u6218\u4E71\uFF0C\u5927\u6279\u6D41\u6C11\u6D8C\u5165\u8FB9\u5883\uFF01", "population", fromTurn(8), recurring(4, 25), [option("\u7F16\u6237\u9F50\u6C11", { population: 150, food: -40, stability: -3, factionSat: commonersReaction(-5) }, 3), option("\u9A71\u9010\u51FA\u5883", { influence: -5, stability: 2 }, 2)]),
  defineEvent("evt_pop_urban", "\u57CE\u5E02\u81A8\u80C0", "\u90FD\u57CE\u4EBA\u53E3\u8FC7\u8F7D\uFF0C\u574A\u5E02\u62E5\u6324\uFF01", "population", { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u6269\u5EFA\u57CE\u90ED", { gold: -100, population: 100, stability: 3 }, 3), option("\u9650\u5236\u6D41\u5165", { stability: -2, factionSat: fr("merchants", -8) }, 2)]),
  defineEvent("evt_pop_plague_end", "\u75AB\u540E\u4F59\u751F", "\u5927\u75AB\u5E73\u606F\uFF0C\u5E78\u5B58\u8005\u4F11\u517B\u751F\u606F\uFF01", "population", fromTurn(30, { maxStability: 60 }), recurring(3, 50), [option("\u8F7B\u5FAD\u8584\u8D4B", { gold: -30, population: 100, stability: 5, factionSat: commonersReaction(10) }, 3), option("\u5E38\u6001\u6CBB\u7406", { population: 50 }, 2)]),
  defineEvent("evt_pop_labor_short", "\u6218\u540E\u52B3\u529B\u77ED\u7F3A", "\u6218\u4E71\u540E\u7530\u5730\u8352\u829C\uFF0C\u52B3\u529B\u532E\u4E4F\uFF01", "population", fromTurn(15, { atWar: true }), recurring(4, 30), [option("\u62DB\u52DF\u6D41\u6C11", { gold: -50, population: 80, food: 20 }, 3), option("\u5F3A\u5236\u5F81\u53D1", { population: 50, stability: -5, factionSat: commonersReaction(-10) }, 1)]),
  defineEvent("evt_opp_ancient_treasure", "\u53E4\u5893\u73B0\u5B9D", "\u519C\u592B\u6398\u51FA\u4E0A\u53E4\u5B9D\u85CF\uFF01", "opportunity", fromTurn(10), recurring(2, 50), [option("\u5145\u516C\u56FD\u5E93", { gold: 200, legitimacy: 3 }, 3), option("\u8D4F\u8D50\u519C\u592B", { gold: 50, stability: 5, factionSat: commonersReaction(8) }, 2)]),
  defineEvent("evt_opp_strategic_location", "\u9669\u9698\u5F52\u9644", "\u8FB9\u5883\u9669\u9698\u5B88\u5C06\u732E\u5173\u6295\u8BDA\uFF01", "opportunity", fromTurn(15, { notAtWar: true }), recurring(2, 60), [option("\u7EB3\u964D\u91CD\u8D4F", { gold: -80, influence: 10, stability: 3 }, 3), option("\u8C28\u614E\u63A5\u7EB3", { influence: 3 }, 2)]),
  defineEvent("evt_opp_talent", "\u8D24\u624D\u6295\u6548", "\u5F02\u56FD\u540D\u58EB\u6155\u540D\u6765\u6295\uFF01", "opportunity", fromTurn(12, { notAtWar: true }), recurring(3, 40), [option("\u7834\u683C\u5F55\u7528", { gold: -40, sciPt: 15, efficiency: 3 }, 3), option("\u8003\u5BDF\u540E\u7528", { sciPt: 5 }, 2)]),
  defineEvent("evt_opp_good_omen", "\u7965\u745E\u964D\u4E34", "\u5929\u73B0\u7965\u745E\uFF0C\u4E07\u6C11\u79F0\u5E86\uFF01", "opportunity", fromTurn(20, { notAtWar: true, minStability: 40 }), recurring(2, 50), [option("\u662D\u544A\u5929\u4E0B", { legitimacy: 8, stability: 5, influence: 5 }, 3), option("\u79D8\u800C\u4E0D\u5BA3", { legitimacy: 2 }, 2)]),
  defineEvent("evt_opp_trade_windfall", "\u5546\u8DEF\u66B4\u5229", "\u7F55\u89C1\u5546\u961F\u5E26\u6765\u5DE8\u989D\u5229\u6DA6\uFF01", "opportunity", fromTurn(15, { notAtWar: true }), recurring(2, 45), [option("\u62BD\u53D6\u91CD\u7A0E", { gold: 180, factionSat: fr("merchants", -5) }, 3), option("\u8F7B\u7A0E\u60E0\u6C11", { gold: 80, factionSat: fr("merchants", 10) }, 2)]),
  defineEvent("evt_opp_mercenary", "\u96C7\u4F63\u519B\u6765\u6295", "\u767E\u6218\u96C7\u4F63\u519B\u5BFB\u6C42\u6548\u547D\uFF01", "opportunity", fromTurn(10, { atWar: true }), recurring(3, 30), [option("\u9AD8\u4EF7\u96C7\u4F63", { gold: -100, factionSat: militaryReaction(10) }, 3), option("\u5A49\u62D2", { stability: 2 }, 2)]),
  defineEvent("evt_opp_dynastic_match", "\u8054\u59FB\u826F\u7F18", "\u5F3A\u56FD\u738B\u5BA4\u63D0\u8BAE\u8054\u59FB\uFF01", "opportunity", fromTurn(18, { notAtWar: true }), recurring(3, 40), [option("\u6B23\u7136\u5141\u8BFA", { gold: -60, influence: 15, legitimacy: 5 }, 3), option("\u5A49\u8A00\u8C22\u7EDD", { influence: -3 }, 2)]),
  defineEvent("evt_relig_heresy", "\u5F02\u7AEF\u8513\u5EF6", "\u5F02\u7AEF\u6559\u6D3E\u5728\u6C11\u95F4\u6269\u6563\uFF01", "religion", fromTurn(20, { maxStability: 60 }), recurring(4, 35), [option("\u5B97\u6559\u88C1\u5224", { stability: 3, population: -50, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "commoners", delta: -10 }) }, 2), option("\u8FA9\u8BBA\u611F\u5316", { sciPt: 8, stability: -2 }, 3)]),
  defineEvent("evt_relig_temple_grant", "\u5BFA\u5E99\u8BF7\u7530", "\u5927\u5BFA\u8BF7\u6C42\u8D50\u7530\u517B\u50E7\uFF01", "religion", fromTurn(15, { notAtWar: true }), recurring(3, 40), [option("\u6177\u6168\u8D50\u7530", { gold: -50, food: -30, legitimacy: 5, factionSat: fr("clergy", 15) }, 2), option("\u9650\u7530\u6291\u5BFA", { factionSat: fra({ faction: "clergy", delta: -12 }, { faction: "nobles", delta: 5 }) }, 3)]),
  defineEvent("evt_relig_pilgrimage", "\u671D\u5723\u70ED\u6F6E", "\u4FE1\u4F17\u6380\u8D77\u671D\u5723\u70ED\u6F6E\uFF01", "religion", fromTurn(20, { notAtWar: true }), recurring(3, 30), [option("\u5B98\u65B9\u62A4\u6301", { gold: -40, legitimacy: 5, influence: 3, factionSat: fr("clergy", 8) }, 3), option("\u6C11\u95F4\u81EA\u7406", { stability: 2 }, 2)]),
  defineEvent("evt_relig_schism", "\u6559\u6D3E\u5206\u88C2", "\u5B97\u6559\u5185\u90E8\u7206\u53D1\u6559\u4E49\u4E4B\u4E89\uFF01", "religion", fromTurn(30), recurring(3, 50), [option("\u652F\u6301\u6B63\u7EDF", { stability: 3, factionSat: fra({ faction: "clergy", delta: 10 }, { faction: "commoners", delta: -5 }) }, 2), option("\u4FDD\u6301\u4E2D\u7ACB", { stability: -3, factionSat: fr("clergy", -8) }, 3)]),
  defineEvent("evt_relig_conversion", "\u5F02\u6559\u5F52\u5316", "\u8FB9\u5883\u5F02\u6559\u90E8\u843D\u8BF7\u6C42\u5F52\u5316\uFF01", "religion", fromTurn(15, { hasNewTerritory: true }), recurring(3, 40), [option("\u9686\u91CD\u53D7\u793C", { gold: -30, legitimacy: 5, stability: 3, factionSat: fr("clergy", 12) }, 3), option("\u56E0\u4FD7\u800C\u6CBB", { stability: 2, factionSat: fr("clergy", -5) }, 2)]),
  defineEvent("evt_sci_astronomy", "\u5929\u6587\u5F02\u8C61", "\u5BA2\u661F\u663C\u89C1\uFF0C\u53F8\u5929\u76D1\u8BF7\u89E3\uFF01", "science", { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u8BE6\u8BB0\u89C2\u6D4B", { sciPt: 20, gold: -20 }, 3), option("\u89C6\u4E3A\u5929\u8C34", { stability: -3, legitimacy: -3, factionSat: fr("clergy", 8) }, 1)]),
  defineEvent("evt_sci_invention", "\u5DE7\u5320\u732E\u5668", "\u5DE5\u5320\u53D1\u660E\u65B0\u5F0F\u5668\u68B0\uFF01", "science", { minTurn: 20, techLevelAbove: { branch: "agri", level: 2 } }, recurring(3, 35), [option("\u63A8\u5E7F\u6C11\u7528", { gold: -60, food: 30, sciPt: 10 }, 3), option("\u519B\u7528\u4FDD\u5BC6", { gold: -40, factionSat: militaryReaction(8) }, 2)]),
  defineEvent("evt_sci_academy", "\u5B66\u9662\u7B79\u5EFA", "\u5B66\u8005\u8BF7\u6C42\u8BBE\u7ACB\u7687\u5BB6\u5B66\u9662\uFF01", "science", { minTurn: 25, techLevelAbove: { branch: "admin", level: 3 } }, oneTime(2, 60), [option("\u62E8\u6B3E\u5174\u5EFA", { gold: -200, sciPt: 50, efficiency: 5, factionSat: fr("clergy", 20) }, 3), option("\u6682\u7F13", { factionSat: fr("clergy", -8) }, 2)]),
  defineEvent("evt_sci_translation", "\u8BD1\u7ECF\u8FD0\u52A8", "\u5F02\u57DF\u5178\u7C4D\u4F20\u5165\uFF0C\u8BF7\u65E8\u7FFB\u8BD1\uFF01", "science", fromTurn(20, { notAtWar: true }), recurring(3, 40), [option("\u8BBE\u8BD1\u573A", { gold: -80, sciPt: 25, factionSat: fra({ faction: "clergy", delta: 12 }, { faction: "merchants", delta: 5 }) }, 3), option("\u6C11\u95F4\u81EA\u8BD1", { sciPt: 8 }, 2)]),
  defineEvent("evt_dip_alliance_proposal", "\u7ED3\u76DF\u4E4B\u8BAE", "\u5F3A\u56FD\u4E3B\u52A8\u63D0\u8BAE\u7ED3\u76DF\uFF01", "diplomacy", fromTurn(12, { notAtWar: true }), recurring(3, 30), [option("\u6B23\u7136\u7ED3\u76DF", { influence: 10, legitimacy: 3, gold: -30 }, 3), option("\u4FDD\u6301\u72EC\u7ACB", { influence: -2 }, 2)]),
  defineEvent("evt_dip_hostage", "\u8D28\u5B50\u4E4B\u7EA6", "\u90BB\u56FD\u63D0\u8BAE\u4E92\u9001\u8D28\u5B50\u4EE5\u56FA\u76DF\u7EA6\uFF01", "diplomacy", fromTurn(15, { notAtWar: true }), recurring(3, 40), [option("\u63A5\u53D7", { influence: 8, legitimacy: -3, stability: -2 }, 2), option("\u62D2\u7EDD", { influence: -5 }, 3)]),
  defineEvent("evt_dip_trade_embassy", "\u901A\u5546\u4F7F\u56E2", "\u8FDC\u65B9\u56FD\u5EA6\u9063\u901A\u5546\u4F7F\u56E2\uFF01", "diplomacy", fromTurn(18, { notAtWar: true }), recurring(3, 35), [option("\u7B7E\u8BA2\u6761\u7EA6", { gold: 80, influence: 5, factionSat: fr("merchants", 12) }, 3), option("\u89C2\u671B", { influence: 2 }, 2)]),
  defineEvent("evt_dip_border_incident", "\u8FB9\u5883\u4E8B\u4EF6", "\u8FB9\u519B\u8BEF\u5165\u90BB\u90A6\u5F15\u53D1\u7EA0\u7EB7\uFF01", "diplomacy", fromTurn(8), recurring(4, 25), [option("\u9063\u4F7F\u81F4\u6B49", { gold: -30, influence: 3 }, 3), option("\u5F3A\u786C\u7ACB\u573A", { influence: -5, stability: 3, factionSat: militaryReaction(8) }, 2)]),
  defineEvent("evt_dip_refugee_crisis", "\u5916\u4EA4\u96BE\u6C11\u5371\u673A", "\u90BB\u90A6\u5185\u4E71\uFF0C\u96BE\u6C11\u6D8C\u5165\uFF01", "diplomacy", fromTurn(20), recurring(3, 35), [option("\u8BBE\u8425\u5B89\u7F6E", { gold: -80, food: -40, population: 100, influence: 8 }, 3), option("\u5C01\u95ED\u8FB9\u5883", { influence: -8, stability: 2 }, 2)]),
  defineEvent("evt_mil_traitor", "\u53DB\u5C06\u6295\u654C", "\u8FB9\u5173\u5B88\u5C06\u53DB\u9003\u654C\u56FD\uFF01", "military", fromTurn(15, { maxStability: 60 }), recurring(3, 40), [option("\u60AC\u8D4F\u7F09\u62FF", { gold: -50, influence: 3, factionSat: militaryReaction(5) }, 3), option("\u7533\u65A5\u8FB9\u9547", { stability: -5, factionSat: militaryReaction(-8) }, 2)]),
  defineEvent("evt_mil_victory_parade", "\u51EF\u65CB\u732E\u4FD8", "\u5927\u519B\u51EF\u65CB\uFF0C\u8BF7\u884C\u732E\u4FD8\u793C\uFF01", "military", fromTurn(10, { notAtWar: true }), recurring(3, 30), [option("\u9686\u91CD\u732E\u4FD8", { gold: -40, legitimacy: 8, factionSat: militaryReaction(15) }, 3), option("\u4F4E\u8C03\u5904\u7F6E", { legitimacy: 2 }, 2)]),
  defineEvent("evt_mil_supply_line", "\u7CAE\u9053\u88AB\u65AD", "\u654C\u519B\u88AD\u6270\u7CAE\u9053\uFF0C\u524D\u7EBF\u544A\u6025\uFF01", "military", fromTurn(10, { atWar: true }), recurring(4, 25), [option("\u91CD\u5175\u62A4\u7CAE", { gold: -80, food: -30, factionSat: militaryReaction(8) }, 3), option("\u5C31\u5730\u5F81\u7CAE", { food: 20, stability: -8, factionSat: commonersReaction(-15) }, 1)]),
  defineEvent("evt_mil_defection", "\u654C\u5C06\u6765\u6295", "\u654C\u56FD\u540D\u5C06\u7387\u90E8\u6765\u964D\uFF01", "military", fromTurn(15, { atWar: true }), recurring(3, 40), [option("\u539A\u793C\u63A5\u7EB3", { gold: -60, factionSat: militaryReaction(12), influence: 5 }, 3), option("\u7591\u800C\u4E0D\u7528", { stability: -2 }, 2)]),
  defineEvent("evt_mil_fortress_siege", "\u5B64\u57CE\u6B7B\u5B88", "\u8FB9\u57CE\u88AB\u56F4\uFF0C\u5B88\u5C06\u8BF7\u63F4\uFF01", "military", fromTurn(12, { atWar: true }), recurring(4, 30), [option("\u503E\u56FD\u9A70\u63F4", { gold: -100, food: -50, factionSat: militaryReaction(10) }, 3), option("\u5F03\u8F66\u4FDD\u5E05", { stability: -10, legitimacy: -5, factionSat: militaryReaction(-12) }, 1)]),
  defineEvent("evt_mil_weapon_upgrade", "\u519B\u68B0\u9769\u65B0", "\u5DE5\u574A\u732E\u4E0A\u65B0\u5F0F\u5175\u5668\uFF01", "military", { minTurn: 20, techLevelAbove: { branch: "mil", level: 2 } }, recurring(3, 40), [option("\u5168\u519B\u6362\u88C5", { gold: -150, factionSat: militaryReaction(15) }, 3), option("\u5C40\u90E8\u8BD5\u7528", { gold: -50, factionSat: militaryReaction(5) }, 2)]),
  // ── C1 事件链（3 条链 × 3 事件 = 9 事件）──
  // 链 1：瘟疫链——爆发→蔓延→余波
  defineEvent(
    "evt_chain_plague_1",
    "\u761F\u75AB\u7206\u53D1",
    "\u8FB9\u9547\u7A81\u53D1\u602A\u75C5\uFF0C\u6B7B\u8005\u751A\u4F17\uFF01\u592A\u533B\u8BF7\u65E8\u5904\u7F6E\u3002",
    "crisis",
    fromTurn(15, { maxFoodRatio: 0.8 }),
    recurring(4, 60),
    [
      option("\u5C01\u9501\u75AB\u533A", { stability: -5, population: -100, triggerEvent: "evt_chain_plague_2" }, 3),
      option("\u8BF7\u795E\u7948\u798F", { gold: -50, stability: 3, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_plague_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_plague_2",
    "\u761F\u75AB\u8513\u5EF6",
    "\u75AB\u75C5\u8513\u5EF6\u81F3\u4EAC\u757F\uFF0C\u4EBA\u5FC3\u60F6\u60F6\uFF01",
    "crisis",
    fromTurn(15),
    followUp,
    [
      option("\u9694\u79BB\u6551\u6CBB", { gold: -120, population: -200, stability: -3, triggerEvent: "evt_chain_plague_3" }, 3),
      option("\u5F03\u57CE\u907F\u75AB", { gold: -30, stability: -15, legitimacy: -10, population: -150, triggerEvent: "evt_chain_plague_3" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_plague_3",
    "\u761F\u75AB\u4F59\u6CE2",
    "\u75AB\u75C5\u7EC8\u4E8E\u5E73\u606F\uFF0C\u4F46\u6C11\u751F\u51CB\u655D\uFF0C\u8BF7\u65E8\u5584\u540E\u3002",
    "crisis",
    fromTurn(15),
    uniqueFollowUp,
    [
      option("\u51CF\u514D\u8D4B\u7A0E", { gold: -80, stability: 8, factionSat: commonersReaction(15), legitimacy: 5 }, 3),
      option("\u5982\u5E38\u5F81\u8D4B", { stability: -5, factionSat: commonersReaction(-12) }, 2)
    ]
  ),
  // 链 2：王位继承链——储君薨→争夺→新朝
  defineEvent(
    "evt_chain_heir_1",
    "\u50A8\u541B\u66B4\u85A8",
    "\u592A\u5B50\u65E0\u75BE\u800C\u7EC8\uFF01\u8BF8\u7687\u5B50\u6697\u4E2D\u4E89\u4F4D\u3002",
    "politics",
    fromTurn(20, { maxLegitimacy: 70 }),
    recurring(3, 80),
    [
      option("\u7ACB\u6B21\u5B50\u4E3A\u50A8", { legitimacy: -5, stability: -3, triggerEvent: "evt_chain_heir_2" }, 3),
      option("\u6682\u4E0D\u7ACB\u50A8", { legitimacy: -10, stability: -8, factionSat: noblesReaction(-8), triggerEvent: "evt_chain_heir_2" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_heir_2",
    "\u593A\u4F4D\u4E4B\u4E89",
    "\u8BF8\u7687\u5B50\u660E\u4E89\u6697\u6597\uFF0C\u671D\u81E3\u5404\u7ACB\u5176\u4E3B\uFF01",
    "politics",
    fromTurn(20),
    followUp,
    [
      option("\u5F3A\u7ACB\u4E00\u7CFB", { gold: -100, legitimacy: 5, stability: -5, factionSat: noblesReaction(-10), triggerEvent: "evt_chain_heir_3" }, 2),
      option("\u5EF7\u8BAE\u516C\u63A8", { gold: -50, legitimacy: 8, stability: 3, efficiency: -3, triggerEvent: "evt_chain_heir_3" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_heir_3",
    "\u65B0\u50A8\u5373\u4F4D",
    "\u65B0\u50A8\u767B\u57FA\uFF0C\u5927\u8D66\u5929\u4E0B\u4EE5\u56FA\u4F4D\u3002",
    "politics",
    fromTurn(20),
    uniqueFollowUp,
    [
      option("\u5927\u8D66\u5929\u4E0B", { gold: -60, legitimacy: 15, stability: 10, factionSat: fra({ faction: "commoners", delta: 12 }, { faction: "nobles", delta: 5 }) }, 3),
      option("\u4F4E\u8C03\u5373\u4F4D", { legitimacy: 5, stability: 2 }, 2),
      // P3 继承链内战结局——强压异议触发宗室起兵
      option("\u5F3A\u538B\u5F02\u8BAE", { legitimacy: -10, stability: -8, factionSat: militaryReaction(15), triggerEvent: "evt_chain_heir_civil" }, 1)
    ]
  ),
  // P3 继承链内战结局——宗室起兵→决战→新朝或割据
  defineEvent(
    "evt_chain_heir_civil",
    "\u5B97\u5BA4\u8D77\u5175",
    "\u4E0D\u6EE1\u65B0\u50A8\u7684\u5B97\u5BA4\u85E9\u9547\u4E3E\u5175\u5411\u9619\uFF01\u5929\u4E0B\u9707\u52A8\uFF0C\u793E\u7A37\u5371\u6B86\uFF01",
    "crisis",
    fromTurn(20, { maxLegitimacy: 50 }),
    followUp,
    [
      option("\u5FA1\u9A7E\u4EB2\u5F81", { gold: -200, stability: -10, legitimacy: 8, factionSat: fra({ faction: "military", delta: 20 }, { faction: "commoners", delta: -15 }), triggerEvent: "evt_chain_heir_civil_2" }, 2),
      option("\u5272\u5730\u5B89\u629A", { gold: -100, stability: 5, legitimacy: -15, influence: -10, factionSat: noblesReaction(10), triggerEvent: "evt_chain_heir_civil_2" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_heir_civil_2",
    "\u5185\u6218\u7EC8\u5C40",
    "\u53DB\u4E71\u5E73\u5B9A\u6216\u5272\u636E\u6210\u5B9A\u5C40\uFF0C\u65B0\u671D\u683C\u5C40\u5DF2\u6210\u3002",
    "politics",
    fromTurn(20),
    uniqueFollowUp,
    [
      option("\u91CD\u6574\u5C71\u6CB3", { gold: -150, stability: 15, legitimacy: 20, efficiency: 5, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "nobles", delta: -8 }) }, 3),
      option("\u9ED8\u8BB8\u5272\u636E", { stability: -20, legitimacy: -25, corruption: 10, factionSat: noblesReaction(15) }, 1)
    ]
  ),
  // 链 3：边境冲突链——摩擦→升级→议和
  defineEvent(
    "evt_chain_border_1",
    "\u8FB9\u6C11\u51B2\u7A81",
    "\u8FB9\u6C11\u8D8A\u754C\u8015\u7267\uFF0C\u4E0E\u90BB\u90A6\u8D77\u4E89\u6267\uFF01",
    "diplomacy",
    fromTurn(10, { notAtWar: true }),
    recurring(4, 50),
    [
      option("\u9063\u4F7F\u4EA4\u6D89", { gold: -20, influence: 3, triggerEvent: "evt_chain_border_2" }, 3),
      option("\u5F3A\u786C\u9A71\u8D76", { influence: -3, stability: 2, factionSat: militaryReaction(8), triggerEvent: "evt_chain_border_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_border_2",
    "\u8FB9\u519B\u5BF9\u5CD9",
    "\u53CC\u65B9\u8FB9\u519B\u5BF9\u5CD9\uFF0C\u5251\u62D4\u5F29\u5F20\uFF01",
    "diplomacy",
    fromTurn(10),
    followUp,
    [
      option("\u4E3B\u52A8\u64A4\u519B", { influence: -5, stability: 3, triggerEvent: "evt_chain_border_3" }, 3),
      option("\u589E\u5175\u65BD\u538B", { gold: -80, factionSat: militaryReaction(12), influence: 2, stability: -2, triggerEvent: "evt_chain_border_3" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_border_3",
    "\u8FB9\u5883\u8BAE\u548C",
    "\u53CC\u65B9\u9063\u4F7F\u8BAE\u548C\uFF0C\u91CD\u5B9A\u7586\u754C\u3002",
    "diplomacy",
    fromTurn(10),
    uniqueFollowUp,
    [
      option("\u7F14\u7ED3\u548C\u7EA6", { gold: -40, influence: 8, legitimacy: 3, stability: 5 }, 3),
      option("\u6682\u7F6E\u4E0D\u8BAE", { stability: -2, influence: -2 }, 2)
    ]
  ),
  // ── E15 扩展事件链（2 条 × 3 事件 = 6 事件）──
  // 链 4：旱灾链——大旱→饥荒→流民
  defineEvent(
    "evt_chain_drought_1",
    "\u8D64\u5730\u5343\u91CC",
    "\u8FDE\u6708\u4E0D\u96E8\uFF0C\u79BE\u82D7\u67AF\u7126\uFF0C\u8D64\u5730\u5343\u91CC\uFF01\u592A\u53F2\u594F\u65F1\u3002",
    "crisis",
    fromTurn(8, { maxFoodRatio: 0.9 }),
    recurring(5, 70),
    [
      option("\u5F00\u4ED3\u8D48\u707E", { food: -120, stability: 5, factionSat: commonersReaction(8), triggerEvent: "evt_chain_drought_2" }, 3),
      option("\u7948\u96E8\u796D\u5929", { gold: -60, legitimacy: 3, stability: 2, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_drought_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_drought_2",
    "\u9965\u8352\u8513\u5EF6",
    "\u7CAE\u4EF7\u98DE\u6DA8\uFF0C\u997F\u6B8D\u904D\u91CE\uFF0C\u9965\u6C11\u805A\u4F17\u6C42\u98DF\uFF01",
    "crisis",
    fromTurn(8),
    followUp,
    [
      option("\u5F3A\u5236\u5E73\u7C9C", { gold: -100, stability: 3, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "merchants", delta: -15 }), triggerEvent: "evt_chain_drought_3" }, 3),
      option("\u653E\u4EFB\u7CAE\u4EF7", { population: -300, stability: -10, factionSat: commonersReaction(-20), triggerEvent: "evt_chain_drought_3" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_drought_3",
    "\u6D41\u6C11\u56DB\u6563",
    "\u707E\u6C11\u80CC\u4E95\u79BB\u4E61\uFF0C\u6D41\u6C11\u6F6E\u5E2D\u5377\u8BF8\u7701\uFF01",
    "crisis",
    fromTurn(8),
    uniqueFollowUp,
    [
      option("\u7F16\u6237\u5B89\u7F6E", { gold: -80, food: -40, stability: 8, population: 200, factionSat: commonersReaction(12) }, 3),
      option("\u9063\u6563\u56DE\u4E61", { population: -150, stability: -5, legitimacy: -5 }, 2)
    ]
  ),
  // 链 5：盛世衰落链——奢靡→乱政→中兴
  defineEvent(
    "evt_chain_decline_1",
    "\u5962\u9761\u4E4B\u98CE",
    "\u5BAB\u5EF7\u5962\u9761\uFF0C\u6743\u8D35\u6597\u5BCC\uFF0C\u6C11\u98CE\u6E10\u6D6E\uFF01",
    "politics",
    fromTurn(25, { minStability: 50, minGold: 500 }),
    recurring(3, 100),
    [
      option("\u63D0\u5021\u8282\u4FED", { stability: 5, legitimacy: 5, factionSat: noblesReaction(-10), triggerEvent: "evt_chain_decline_2" }, 3),
      option("\u7EB5\u5BB9\u6D6E\u534E", { gold: -100, corruption: 8, stability: -3, factionSat: noblesReaction(12), triggerEvent: "evt_chain_decline_2" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_decline_2",
    "\u540F\u6CBB\u8D25\u574F",
    "\u8D2A\u58A8\u6A2A\u884C\uFF0C\u653F\u4EE4\u4E0D\u51FA\u4EAC\u757F\uFF0C\u884C\u653F\u762B\u75EA\uFF01",
    "politics",
    fromTurn(25, { minCorruption: 40 }),
    followUp,
    [
      option("\u4E25\u60E9\u8D2A\u540F", { gold: -120, corruption: -10, stability: -5, factionSat: noblesReaction(-15), triggerEvent: "evt_chain_decline_3" }, 3),
      option("\u5F97\u8FC7\u4E14\u8FC7", { corruption: 5, efficiency: -5, legitimacy: -8, triggerEvent: "evt_chain_decline_3" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_decline_3",
    "\u4E2D\u5174\u4E4B\u673A",
    "\u4E71\u8C61\u6BD5\u9732\uFF0C\u671D\u91CE\u547C\u5401\u6539\u9769\u56FE\u5F3A\uFF01",
    "opportunity",
    fromTurn(25),
    uniqueFollowUp,
    [
      option("\u529B\u884C\u65B0\u653F", { gold: -200, stability: -8, legitimacy: 15, efficiency: 8, factionSat: fra({ faction: "commoners", delta: 15 }, { faction: "nobles", delta: -10 }) }, 3),
      option("\u5F90\u56FE\u6574\u987F", { gold: -80, stability: 3, efficiency: 3, legitimacy: 5 }, 2)
    ]
  ),
  // ── E15 王朝继位玩家干预事件（dynasty 引擎触发）──
  defineEvent(
    "evt_dynasty_heir_birth",
    "\u50A8\u541B\u964D\u751F",
    "\u540E\u5BAB\u8BDE\u4E0B\u9F99\u88D4\uFF0C\u4E3E\u56FD\u6B22\u5E86\uFF01\u8BF7\u5B9A\u50A8\u541B\u4E4B\u540D\u3002",
    "politics",
    fromTurn(1),
    followUp,
    [
      option("\u7ACB\u4E3A\u50A8\u541B", { legitimacy: 10, stability: 5, factionSat: noblesReaction(12) }, 3),
      option("\u6682\u4E0D\u7ACB\u50A8", { legitimacy: -3, stability: -2, factionSat: noblesReaction(-8) }, 1)
    ]
  ),
  defineEvent(
    "evt_dynasty_ruler_decline",
    "\u541B\u738B\u8001\u8FC8",
    "\u4E3B\u6625\u79CB\u5E74\u8FC8\uFF0C\u7CBE\u529B\u6E10\u8870\uFF0C\u671D\u81E3\u8BF7\u9884\u7ACB\u50A8\u4EE5\u56FA\u56FD\u672C\u3002",
    "politics",
    fromTurn(30),
    followUp,
    [
      option("\u7985\u8BA9\u50A8\u541B", { legitimacy: 5, stability: 8, factionSat: noblesReaction(10) }, 3),
      option("\u52C9\u529B\u89C6\u671D", { stability: -3, legitimacy: -5, factionSat: noblesReaction(-5) }, 2)
    ]
  ),
  // ── P3 扩展事件链 6-9 + 独立事件（目标 150+）──
  // 链 6：科技突破链——灵感→试验→应用或事故
  defineEvent(
    "evt_chain_tech_1",
    "\u5F02\u8C61\u542F\u601D",
    "\u591C\u89C2\u661F\u8C61\uFF0C\u5B66\u8005\u5FFD\u5F97\u7075\u611F\uFF0C\u79F0\u53EF\u9769\u65B0\u519C\u5177\uFF01",
    "science",
    { minTurn: 12, techLevelAbove: { branch: "agri", level: 1 } },
    recurring(4, 80),
    [
      option("\u62E8\u91D1\u8D44\u52A9", { gold: -80, sciPt: 10, factionSat: fr("clergy", -5), triggerEvent: "evt_chain_tech_2" }, 3),
      option("\u89C2\u5176\u81EA\u6210", { sciPt: 3, triggerEvent: "evt_chain_tech_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_tech_2",
    "\u5DE5\u574A\u8BD5\u9A8C",
    "\u5B66\u8005\u4E8E\u5DE5\u574A\u4E2D\u53CD\u590D\u8BD5\u9A8C\uFF0C\u6210\u8D25\u53C2\u534A\uFF01",
    "science",
    fromTurn(12),
    followUp,
    [
      option("\u8FFD\u52A0\u6295\u5165", { gold: -120, sciPt: 8, efficiency: 3, triggerEvent: "evt_chain_tech_3" }, 3),
      option("\u8C28\u614E\u63A8\u8FDB", { gold: -40, sciPt: 4, triggerEvent: "evt_chain_tech_3" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_tech_3",
    "\u9769\u65B0\u95EE\u4E16",
    "\u65B0\u519C\u5177\u95EE\u4E16\uFF0C\u7CAE\u4EA7\u53EF\u671F\uFF01\u7136\u65E7\u5320\u62B5\u5236\u65B0\u6280\u672F\u3002",
    "opportunity",
    fromTurn(12),
    uniqueFollowUp,
    [
      option("\u5168\u9762\u63A8\u5E7F", { gold: -60, food: 80, factionSat: fra({ faction: "commoners", delta: 12 }, { faction: "nobles", delta: -8 }) }, 3),
      option("\u7F13\u6162\u6E17\u900F", { food: 30, sciPt: 5 }, 2)
    ]
  ),
  // 链 7：文化输入链——异邦艺术→风靡→本土化或文化冲突
  defineEvent(
    "evt_chain_culture_1",
    "\u5F02\u90A6\u732E\u827A",
    "\u5F02\u90A6\u4F7F\u56E2\u732E\u4E0A\u5947\u73CD\u4E50\u821E\uFF0C\u671D\u91CE\u4E3A\u4E4B\u503E\u5012\uFF01",
    "culture",
    fromTurn(15, { notAtWar: true }),
    recurring(4, 90),
    [
      option("\u76DB\u60C5\u63A5\u7EB3", { gold: -40, influence: 5, legitimacy: 3, triggerEvent: "evt_chain_culture_2" }, 3),
      option("\u8C28\u614E\u89C2\u8D4F", { influence: 2, triggerEvent: "evt_chain_culture_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_culture_2",
    "\u98CE\u5C1A\u98CE\u9761",
    "\u5F02\u90A6\u827A\u672F\u5728\u4E0A\u6D41\u793E\u4F1A\u98CE\u9761\uFF0C\u672C\u571F\u827A\u4EBA\u6297\u8BAE\u58F0\u8D77\uFF01",
    "culture",
    fromTurn(15),
    followUp,
    [
      option("\u63D0\u5021\u878D\u5408", { gold: -60, influence: 8, factionSat: fr("clergy", -8), triggerEvent: "evt_chain_culture_3" }, 3),
      option("\u538B\u5236\u5F02\u98CE", { influence: -5, stability: 3, factionSat: fr("clergy", 10), triggerEvent: "evt_chain_culture_3" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_culture_3",
    "\u6587\u5316\u5B9A\u8C03",
    "\u98CE\u6C14\u4E4B\u4E89\u7EC8\u6709\u5B9A\u8BBA\uFF0C\u5E1D\u56FD\u6587\u5316\u8D70\u5411\u4F55\u65B9\uFF1F",
    "culture",
    fromTurn(15),
    uniqueFollowUp,
    [
      option("\u517C\u5BB9\u5E76\u84C4", { gold: -80, influence: 12, legitimacy: 8, assimilationMod: 1 }, 3),
      option("\u56FA\u5B88\u6B63\u7EDF", { legitimacy: 5, influence: -3, factionSat: fr("clergy", 15) }, 2)
    ]
  ),
  // 链 8：联盟瓦解链——盟国生疑→摩擦→决裂或修复
  defineEvent(
    "evt_chain_alliance_1",
    "\u76DF\u56FD\u751F\u7591",
    "\u76DF\u56FD\u4F7F\u81E3\u65C1\u6572\u4FA7\u51FB\uFF0C\u7591\u4F60\u6709\u80CC\u76DF\u4E4B\u610F\uFF01",
    "diplomacy",
    fromTurn(10, { notAtWar: true }),
    recurring(4, 70),
    [
      option("\u9063\u4F7F\u91CD\u7533\u76DF\u7EA6", { gold: -50, influence: 5, triggerEvent: "evt_chain_alliance_2" }, 3),
      option("\u7F6E\u4E4B\u4E0D\u7406", { influence: -8, stability: 2, triggerEvent: "evt_chain_alliance_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_alliance_2",
    "\u8FB9\u5883\u6469\u64E6",
    "\u76DF\u56FD\u8FB9\u519B\u4E0E\u5DF1\u65B9\u5546\u961F\u53D1\u751F\u6469\u64E6\uFF01",
    "diplomacy",
    fromTurn(10),
    followUp,
    [
      option("\u8D54\u793C\u9053\u6B49", { gold: -80, influence: 3, legitimacy: -3, triggerEvent: "evt_chain_alliance_3" }, 3),
      option("\u5F3A\u786C\u7D22\u8D54", { gold: 30, influence: -10, factionSat: militaryReaction(8), triggerEvent: "evt_chain_alliance_3" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_alliance_3",
    "\u76DF\u7EA6\u6289\u62E9",
    "\u76DF\u56FD\u9012\u4EA4\u6700\u540E\u901A\u7252\uFF0C\u662F\u548C\u662F\u88C2\uFF1F",
    "diplomacy",
    fromTurn(10),
    uniqueFollowUp,
    [
      option("\u4FEE\u590D\u76DF\u7EA6", { gold: -100, influence: 10, legitimacy: 5, factionSat: fr("merchants", 8) }, 3),
      option("\u542C\u4EFB\u51B3\u88C2", { influence: -15, stability: 5, factionSat: militaryReaction(12) }, 2)
    ]
  ),
  // 链 9：移民潮链——流民入境→安置压力→同化或排斥
  defineEvent(
    "evt_chain_migrate_1",
    "\u6D41\u6C11\u53E9\u8FB9",
    "\u90BB\u90A6\u5927\u4E71\uFF0C\u6570\u4E07\u6D41\u6C11\u53E9\u5173\u6C42\u9644\uFF01",
    "population",
    fromTurn(12),
    recurring(5, 80),
    [
      option("\u5F00\u5173\u7EB3\u4E4B", { food: -80, population: 400, stability: -3, triggerEvent: "evt_chain_migrate_2" }, 2),
      option("\u95ED\u5173\u62D2\u4E4B", { legitimacy: -5, influence: -3, factionSat: commonersReaction(5), triggerEvent: "evt_chain_migrate_2" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_migrate_2",
    "\u5B89\u7F6E\u4E4B\u56F0",
    "\u6D41\u6C11\u805A\u5C45\u8FB9\u7701\uFF0C\u4E0E\u672C\u5730\u6C11\u4F17\u4E89\u7530\u4E89\u6C34\uFF01",
    "population",
    fromTurn(12),
    followUp,
    [
      option("\u7F16\u6237\u9F50\u6C11", { gold: -100, food: -40, population: 200, efficiency: 3, triggerEvent: "evt_chain_migrate_3" }, 3),
      option("\u8BBE\u6805\u9694\u79BB", { gold: -30, stability: -5, factionSat: commonersReaction(-10), triggerEvent: "evt_chain_migrate_3" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_migrate_3",
    "\u878D\u5408\u6216\u6392\u65A5",
    "\u6D41\u6C11\u95EE\u9898\u7EC8\u987B\u89E3\u51B3\uFF0C\u5E1D\u56FD\u5305\u5BB9\u6027\u9762\u4E34\u8003\u9A8C\u3002",
    "population",
    fromTurn(12),
    uniqueFollowUp,
    [
      option("\u4E00\u89C6\u540C\u4EC1", { gold: -60, population: 150, influence: 8, assimilationMod: 1, factionSat: commonersReaction(8) }, 3),
      option("\u533A\u522B\u5BF9\u5F85", { stability: -8, corruption: 5, factionSat: noblesReaction(8) }, 2)
    ]
  ),
  // ── 独立事件扩展（覆盖 science/culture/population/diplomacy 稀缺分类）──
  defineEvent("evt_library_fire", "\u5B66\u9662\u5931\u706B", "\u7687\u5BB6\u5B66\u9662\u6DF1\u591C\u5931\u706B\uFF0C\u5178\u7C4D\u4ED8\u4E4B\u4E00\u70AC\uFF01", "science", { minTurn: 10, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 50), [option("\u5168\u529B\u62A2\u6551", { gold: -100, sciPt: -10, stability: 3 }, 3), option("\u542C\u4E4B\u4EFB\u4E4B", { sciPt: -25, legitimacy: -5 }, 2)]),
  defineEvent("evt_scientist_defect", "\u5B66\u8005\u6295\u5954", "\u5F02\u90A6\u77E5\u540D\u5B66\u8005\u8BF7\u6C42\u653F\u6CBB\u5E87\u62A4\uFF01", "science", fromTurn(12, { notAtWar: true }), recurring(3, 40), [option("\u63A5\u7EB3\u91CD\u7528", { gold: 50, sciPt: 20, influence: -3 }, 3), option("\u5A49\u62D2\u9063\u8FD4", { influence: 5, legitimacy: 3 }, 2)]),
  defineEvent("evt_alchemy_craze", "\u70BC\u91D1\u72C2\u70ED", "\u5BAB\u5EF7\u5174\u8D77\u70BC\u91D1\u70ED\u6F6E\uFF0C\u65B9\u58EB\u58F0\u79F0\u80FD\u70B9\u77F3\u6210\u91D1\uFF01", "science", fromTurn(15), recurring(4, 35), [option("\u8D44\u52A9\u8BD5\u9A8C", { gold: -150, corruption: 5, factionSat: fr("clergy", -10) }, 2), option("\u65A5\u4E3A\u90AA\u672F", { legitimacy: 3, factionSat: fr("clergy", 12) }, 3)]),
  defineEvent("evt_cultural_revival", "\u6587\u5316\u590D\u5174\u8FD0\u52A8", "\u53E4\u5178\u6587\u5316\u590D\u5174\u8FD0\u52A8\u5E2D\u5377\u5B66\u754C\uFF01", "culture", { minTurn: 20, minStability: 50, techLevelAbove: { branch: "culture", level: 2 } }, recurring(3, 60), [option("\u5927\u529B\u5021\u5BFC", { gold: -100, influence: 15, legitimacy: 8, sciPt: 10 }, 3), option("\u987A\u5176\u81EA\u7136", { influence: 5, sciPt: 3 }, 2)]),
  defineEvent("evt_temple_construction", "\u5E99\u5B87\u5927\u5174", "\u795E\u804C\u56E2\u4F53\u8BF7\u5EFA\u5927\u5E99\uFF0C\u4FE1\u4F17\u8E0A\u8DC3\u6350\u8D44\uFF01", "culture", fromTurn(10, { minStability: 40 }), recurring(4, 40), [option("\u94A6\u51C6\u7763\u5EFA", { gold: -80, legitimacy: 8, influence: 5, factionSat: fr("clergy", 15) }, 3), option("\u6C11\u529E\u5B98\u52A9", { gold: -30, factionSat: fr("clergy", 8) }, 2)]),
  defineEvent("evt_festival_grand", "\u5E1D\u56FD\u5927\u5178", "\u85E9\u5C5E\u9063\u4F7F\u671D\u8D3A\uFF0C\u5E1D\u56FD\u5A01\u4EEA\u8FDC\u64AD\uFF01", "culture", fromTurn(25, { minStability: 60, notAtWar: true }), recurring(3, 50), [option("\u76DB\u5927\u5E86\u8D3A", { gold: -150, influence: 20, legitimacy: 10, factionSat: noblesReaction(10) }, 3), option("\u7B80\u793C\u76F8\u5F85", { gold: -40, influence: 8 }, 2)]),
  defineEvent("evt_plague_quarantine", "\u68C0\u75AB\u4E4B\u4E89", "\u8FB9\u5883\u53D1\u73B0\u75AB\u75C5\uFF0C\u662F\u5426\u5C01\u9501\u8FB9\u5883\uFF1F", "population", fromTurn(15), recurring(4, 40), [option("\u4E25\u683C\u9694\u79BB", { gold: -60, population: -50, stability: -3, factionSat: fr("merchants", -12) }, 3), option("\u6709\u9650\u68C0\u67E5", { population: -150, stability: 2 }, 2)]),
  defineEvent("evt_diplomatic_marriage", "\u548C\u4EB2\u4E4B\u8BAE", "\u5F3A\u56FD\u9063\u4F7F\u6C42\u548C\u4EB2\uFF0C\u6B32\u7ED3\u79E6\u664B\u4E4B\u597D\uFF01", "diplomacy", fromTurn(15, { notAtWar: true }), recurring(4, 50), [option("\u5141\u8BFA\u548C\u4EB2", { gold: 100, influence: 15, legitimacy: -3, factionSat: noblesReaction(-8) }, 3), option("\u5A49\u8A00\u8C22\u7EDD", { influence: -5, stability: 3 }, 2)]),
  defineEvent("evt_trade_embargo", "\u4ED6\u56FD\u7981\u8FD0", "\u90BB\u90A6\u8054\u5408\u5BF9\u4F60\u7684\u5546\u54C1\u5B9E\u65BD\u7981\u8FD0\uFF01", "diplomacy", fromTurn(18), recurring(5, 40), [option("\u5BFB\u6C42\u65B0\u5546\u8DEF", { gold: -100, influence: 5, factionSat: fr("merchants", 8) }, 3), option("\u53CD\u5236\u7981\u8FD0", { gold: -50, influence: -8, stability: 3 }, 2)]),
  defineEvent("evt_border_demarcate", "\u52D8\u754C\u5B9A\u7586", "\u4E0E\u90BB\u56FD\u52D8\u5B9A\u8FB9\u754C\uFF0C\u4E89\u8BAE\u4E4B\u5730\u5982\u4F55\u5904\u7F6E\uFF1F", "diplomacy", fromTurn(10, { notAtWar: true }), recurring(3, 50), [option("\u636E\u7406\u529B\u4E89", { gold: -40, influence: 5, factionSat: militaryReaction(8) }, 2), option("\u4E92\u8BA9\u59A5\u534F", { gold: 20, influence: 8, legitimacy: 3 }, 3)]),
  defineEvent("evt_secret_treaty", "\u5BC6\u7EA6\u66DD\u5149", "\u4F60\u4E0E\u4ED6\u56FD\u7684\u79D8\u5BC6\u6761\u7EA6\u88AB\u6CC4\u9732\uFF0C\u671D\u91CE\u54D7\u7136\uFF01", "diplomacy", fromTurn(20), recurring(4, 60), [option("\u516C\u5F00\u627F\u8BA4", { legitimacy: -8, influence: 5, stability: -3 }, 2), option("\u77E2\u53E3\u5426\u8BA4", { legitimacy: -3, influence: -10, corruption: 3 }, 3)]),
  // ── P-fix 补齐事件到 150（覆盖 science/culture/population/diplomacy/opportunity）──
  defineEvent("evt_sci_observatory", "\u89C2\u661F\u53F0", "\u5929\u6587\u5B66\u5BB6\u8BF7\u5EFA\u89C2\u661F\u53F0\uFF0C\u89C2\u6D4B\u661F\u8C61\u4EE5\u63A8\u5386\u6CD5\uFF01", "science", { minTurn: 18, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 50), [option("\u62E8\u6B3E\u5174\u5EFA", { gold: -120, sciPt: 30, influence: 5 }, 3), option("\u6C11\u95F4\u89C2\u6D4B", { sciPt: 8 }, 2)]),
  defineEvent("evt_sci_water_mill", "\u6C34\u529B\u78E8\u574A", "\u5DE5\u5320\u53D1\u660E\u6C34\u529B\u78E8\u574A\uFF0C\u7CAE\u4EA7\u52A0\u5DE5\u6548\u7387\u5927\u589E\uFF01", "science", { minTurn: 14, techLevelAbove: { branch: "agri", level: 2 } }, recurring(4, 40), [option("\u63A8\u5E7F\u5168\u56FD", { gold: -80, food: 50, factionSat: commonersReaction(8) }, 3), option("\u9650\u7687\u5BB6\u4E13\u7528", { gold: -30, food: 15 }, 2)]),
  defineEvent("evt_sci_medical_text", "\u533B\u5178\u7F16\u7E82", "\u592A\u533B\u5949\u65E8\u7F16\u7E82\u533B\u5178\uFF0C\u6C47\u5929\u4E0B\u65B9\u672F\uFF01", "science", { minTurn: 20, techLevelAbove: { branch: "admin", level: 3 } }, recurring(3, 50), [option("\u9881\u884C\u5929\u4E0B", { gold: -100, sciPt: 20, stability: 5, population: 100 }, 3), option("\u79D8\u85CF\u5185\u5E9C", { sciPt: 10, factionSat: fr("clergy", 5) }, 2)]),
  defineEvent("evt_culture_poet", "\u8BD7\u4EBA\u732E\u8D4B", "\u540D\u8BD7\u4EBA\u732E\u9882\u8D4B\uFF0C\u8F9E\u85FB\u534E\u7F8E\uFF0C\u671D\u91CE\u4F20\u8BF5\uFF01", "culture", fromTurn(12, { minStability: 40 }), recurring(4, 30), [option("\u539A\u8D4F\u8D50\u7235", { gold: -40, legitimacy: 5, influence: 3, factionSat: fr("clergy", 8) }, 3), option("\u53E3\u5934\u5609\u5956", { legitimacy: 2 }, 2)]),
  defineEvent("evt_culture_architecture", "\u5BAB\u5BA4\u8425\u5EFA", "\u5320\u5E08\u732E\u65B0\u56FE\u6837\uFF0C\u8BF7\u5EFA\u5B8F\u4F1F\u5BAB\u5BA4\u4EE5\u5F70\u56FD\u5A01\uFF01", "culture", fromTurn(22, { minStability: 50, minGold: 300 }), recurring(3, 60), [option("\u5927\u5174\u571F\u6728", { gold: -250, legitimacy: 10, influence: 8, factionSat: noblesReaction(12) }, 2), option("\u7B80\u6734\u4ECE\u4E8B", { legitimacy: 3, factionSat: commonersReaction(5) }, 3)]),
  defineEvent("evt_culture_relic", "\u53E4\u5BFA\u5723\u7269\u51FA\u571F", "\u53E4\u5BFA\u51FA\u571F\u5723\u7269\uFF0C\u4FE1\u4F17\u8702\u62E5\u671D\u62DC\uFF01", "culture", fromTurn(18, { notAtWar: true }), recurring(3, 50), [option("\u8FCE\u5165\u4EAC\u757F", { gold: -60, legitimacy: 8, factionSat: fr("clergy", 15), influence: 5 }, 3), option("\u7559\u5BFA\u4F9B\u5949", { stability: 3, factionSat: fr("clergy", 8) }, 2)]),
  defineEvent("evt_pop_urbanization", "\u5E02\u4E95\u7E41\u5174", "\u90FD\u57CE\u5546\u5E02\u7E41\u5174\uFF0C\u767E\u4E1A\u4E91\u96C6\uFF01", "population", { minTurn: 16, minStability: 50, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u89C4\u8303\u5E02\u574A", { gold: 60, efficiency: 3, factionSat: fr("merchants", 10) }, 3), option("\u4EFB\u5176\u53D1\u5C55", { gold: 40, corruption: 3 }, 2)]),
  defineEvent("evt_pop_infant", "\u5A74\u6B87\u4E4B\u75DB", "\u90FD\u57CE\u5A74\u592D\u7387\u9AD8\uFF0C\u592A\u533B\u8BF7\u8BBE\u80B2\u5A74\u5C40\uFF01", "population", fromTurn(14), recurring(4, 40), [option("\u8BBE\u5C40\u54FA\u80B2", { gold: -80, population: 80, stability: 3, factionSat: commonersReaction(12) }, 3), option("\u542C\u5929\u7531\u547D", { population: -50, factionSat: commonersReaction(-8) }, 2)]),
  defineEvent("evt_dip_tribute", "\u85E9\u5C5E\u671D\u8D21", "\u8FDC\u65B9\u85E9\u5C5E\u9063\u4F7F\u671D\u8D21\u73CD\u5F02\u7269\u4EA7\uFF01", "diplomacy", fromTurn(20, { notAtWar: true, minStability: 50 }), recurring(3, 40), [option("\u539A\u5F80\u8584\u6765", { gold: -100, influence: 15, legitimacy: 8 }, 3), option("\u5E38\u793C\u76F8\u5F85", { gold: -30, influence: 5 }, 2)]),
  defineEvent("evt_dip_mediation", "\u90BB\u90A6\u8BF7\u8C03", "\u4E24\u90BB\u90A6\u5F00\u6218\uFF0C\u53CC\u65B9\u7686\u8BF7\u6211\u56FD\u8C03\u505C\uFF01", "diplomacy", fromTurn(18, { notAtWar: true }), recurring(3, 50), [option("\u51FA\u9762\u65A1\u65CB", { gold: -60, influence: 20, legitimacy: 5, sciPt: 5 }, 3), option("\u4FDD\u6301\u4E2D\u7ACB", { influence: -3, stability: 2 }, 2)]),
  defineEvent("evt_opp_granary_surplus", "\u7CAE\u4ED3\u5145\u76C8", "\u8FDE\u5E74\u4E30\u6536\uFF0C\u7CAE\u4ED3\u6EE1\u6EA2\uFF0C\u5982\u4F55\u5904\u7F6E\uFF1F", "opportunity", fromTurn(12, { notAtWar: true }), recurring(3, 30), [option("\u5E73\u4EF7\u51FA\u7C9C", { gold: 100, food: -80, factionSat: fr("merchants", 8) }, 3), option("\u5907\u8352\u50A8\u5907", { stability: 5, factionSat: commonersReaction(5) }, 2)]),
  defineEvent("evt_opp_mercenary_captain", "\u96C7\u4F63\u5175\u9996\u9886", "\u767E\u6218\u96C7\u4F63\u5175\u9996\u9886\u7387\u90E8\u6765\u6295\uFF0C\u613F\u4E3A\u524D\u950B\uFF01", "opportunity", fromTurn(14, { atWar: true }), recurring(3, 40), [option("\u59D4\u4EE5\u91CD\u4EFB", { gold: -80, factionSat: militaryReaction(15), influence: 3 }, 3), option("\u5B58\u7591\u4E0D\u7528", { stability: -2, factionSat: militaryReaction(-5) }, 2)]),
  defineEvent("evt_opp_good_harvest_chain", "\u8FDE\u5E74\u4E30\u7A14", "\u8FDE\u7EED\u4E30\u6536\uFF0C\u767E\u59D3\u5BCC\u8DB3\uFF0C\u56FD\u5E93\u5145\u76C8\uFF01", "opportunity", fromTurn(16, { notAtWar: true, minStability: 60 }), recurring(2, 60), [option("\u51CF\u514D\u8D4B\u7A0E", { gold: -100, stability: 8, factionSat: commonersReaction(15), legitimacy: 5 }, 3), option("\u5145\u5B9E\u56FD\u5E93", { gold: 200, factionSat: commonersReaction(-5) }, 2)]),
  // ── D1: 扩充至 300+ 事件（每类别 ≥8） ──
  defineEvent("evt_locust", "\u8757\u707E", "\u8757\u866B\u8FC7\u5883\uFF0C\u5BF8\u8349\u4E0D\u751F\uFF01", "crisis", fromTurn(8), recurring(4, 35), [option("\u7EC4\u7EC7\u706D\u8757", { gold: -60, food: -80, stability: 3 }, 3), option("\u7948\u5929\u6C42\u96E8", { food: -120, legitimacy: -3 }, 2)]),
  defineEvent("evt_flood", "\u6D2A\u6D9D", "\u66B4\u96E8\u6210\u707E\uFF0C\u826F\u7530\u88AB\u6DF9\uFF01", "crisis", fromTurn(6), recurring(5, 30), [option("\u7B51\u5824\u6551\u707E", { gold: -100, food: -60, stability: 4 }, 3), option("\u8F6C\u79FB\u9AD8\u5730", { food: -40, population: -80 }, 2)]),
  defineEvent("evt_blight", "\u75AB\u75C5\u4FB5\u88AD\u5E84\u7A3C", "\u4F5C\u7269\u5927\u9762\u79EF\u67AF\u840E\uFF01", "crisis", fromTurn(10), recurring(3, 40), [option("\u711A\u7530\u9632\u75AB", { food: -150, stability: -3 }, 2), option("\u5BFB\u6C42\u826F\u79CD", { gold: -50, food: -80 }, 3)]),
  defineEvent("evt_hail", "\u51B0\u96F9", "\u7A81\u964D\u51B0\u96F9\uFF0C\u6BC1\u574F\u5E84\u7A3C\uFF01", "crisis", {}, recurring(3, 50), [option("\u5F00\u4ED3\u8D48\u6D4E", { food: -60, gold: -40, stability: 5 }, 3), option("\u81EA\u529B\u66F4\u751F", { food: -100, stability: -3 }, 2)]),
  defineEvent("evt_famine_riot", "\u9965\u6C11\u66B4\u52A8", "\u9965\u997F\u7684\u6C11\u4F17\u51B2\u51FB\u7CAE\u4ED3\uFF01", "crisis", { maxFoodRatio: 0.4 }, recurring(8, 20), [option("\u9547\u538B", { gold: -40, stability: -5, factionSat: militaryReaction(5) }, 2), option("\u653E\u7CAE\u5B89\u629A", { food: -100, stability: 5, factionSat: commonersReaction(10) }, 3)]),
  defineEvent("evt_wolf_plague", "\u517D\u75AB", "\u7272\u755C\u5927\u6279\u6B7B\u4EA1\uFF01", "crisis", fromTurn(12), recurring(3, 40), [option("\u9694\u79BB\u711A\u70E7", { food: -50, gold: -30 }, 3), option("\u6C42\u533B\u95EE\u836F", { gold: -60, food: -30 }, 2)]),
  defineEvent("evt_noble_exile", "\u8D35\u65CF\u6D41\u4EA1", "\u5931\u52BF\u8D35\u65CF\u9003\u4EA1\u4ED6\u56FD\uFF01", "politics", { maxLegitimacy: 30 }, recurring(4, 30), [option("\u901A\u7F09\u8FFD\u56DE", { gold: -50, legitimacy: 3 }, 2), option("\u4EFB\u5176\u53BB\u7559", { factionSat: noblesReaction(-8), stability: 2 }, 3)]),
  defineEvent("evt_noble_marriage", "\u8D35\u65CF\u8054\u59FB", "\u4E24\u5927\u8D35\u65CF\u5BB6\u65CF\u8054\u59FB\uFF0C\u52BF\u529B\u5750\u5927\uFF01", "politics", fromTurn(10), recurring(3, 35), [option("\u8D50\u5A5A\u652F\u6301", { gold: -40, factionSat: noblesReaction(12), legitimacy: 3 }, 3), option("\u4ECE\u4E2D\u4F5C\u6897", { factionSat: noblesReaction(-10), stability: -3 }, 2)]),
  defineEvent("evt_noble_disinherit", "\u593A\u7235", "\u8D35\u65CF\u5B50\u5F1F\u88AB\u593A\u7235\uFF0C\u5F15\u53D1\u4E89\u8BAE\uFF01", "politics", fromTurn(8), recurring(4, 25), [option("\u7EF4\u6301\u539F\u5224", { factionSat: noblesReaction(-12), legitimacy: 5 }, 2), option("\u6062\u590D\u7235\u4F4D", { factionSat: noblesReaction(8), gold: -60 }, 3)]),
  defineEvent("evt_faction_civil_war", "\u6D3E\u7CFB\u5185\u6218", "\u4E24\u5927\u6D3E\u7CFB\u516C\u5F00\u51B2\u7A81\uFF01", "politics", { maxStability: 35 }, recurring(7, 20), [option("\u652F\u6301\u4E00\u65B9", { stability: -8, legitimacy: -5 }, 2), option("\u8C03\u505C", { gold: -80, stability: 3 }, 3)]),
  defineEvent("evt_merchant_smuggle", "\u8D70\u79C1\u7316\u7357", "\u5546\u4EBA\u8D70\u79C1\u9003\u7A0E\u4E25\u91CD\uFF01", "politics", { minCorruption: 25 }, recurring(5, 20), [option("\u4E25\u6253\u8D70\u79C1", { gold: 60, factionSat: fr("merchants", -10), corruption: -3 }, 2), option("\u7741\u53EA\u773C\u95ED\u53EA\u773C", { corruption: 5, factionSat: fr("merchants", 5) }, 3)]),
  defineEvent("evt_merchant_monopoly", "\u884C\u4F1A\u5784\u65AD", "\u5546\u4EBA\u884C\u4F1A\u5784\u65AD\u5E02\u573A\uFF01", "politics", fromTurn(15), recurring(3, 35), [option("\u6253\u7834\u5784\u65AD", { gold: -50, factionSat: fra({ faction: "merchants", delta: -15 }, { faction: "commoners", delta: 10 }) }, 3), option("\u6536\u7A0E\u4E86\u4E8B", { gold: 80, corruption: 3 }, 2)]),
  defineEvent("evt_military_coup_attempt", "\u5175\u53D8\u672A\u9042", "\u90E8\u5206\u5C06\u9886\u5BC6\u8C0B\u5175\u53D8\uFF01", "politics", { factionSatBelow: { faction: "military", threshold: 15 }, maxLegitimacy: 35 }, recurring(9, 50), [option("\u94C1\u8155\u9547\u538B", { gold: -100, stability: -8, factionSat: militaryReaction(-15) }, 2), option("\u5B89\u629A\u519B\u5FC3", { gold: -80, factionSat: militaryReaction(10), stability: -3 }, 3)]),
  defineEvent("evt_military_veteran", "\u8001\u5175\u5B89\u7F6E", "\u9000\u5F79\u8001\u5175\u65E0\u4EE5\u4E3A\u751F\uFF01", "politics", fromTurn(12), recurring(4, 25), [option("\u8D50\u7530\u5B89\u7F6E", { gold: -60, factionSat: militaryReaction(10), stability: 3 }, 3), option("\u4E0D\u4E88\u7406\u776C", { factionSat: militaryReaction(-12), stability: -3 }, 2)]),
  defineEvent("evt_military_mutiny", "\u54D7\u53D8", "\u6B20\u9977\u58EB\u5175\u54D7\u53D8\uFF01", "politics", { factionSatBelow: { faction: "military", threshold: 10 } }, recurring(10, 30), [option("\u9547\u538B", { gold: -80, stability: -10, factionSat: militaryReaction(-8) }, 2), option("\u8865\u53D1\u6B20\u9977", { gold: -120, factionSat: militaryReaction(15), stability: 3 }, 3)]),
  defineEvent("evt_trade_embargo_hit", "\u8D38\u6613\u7981\u8FD0\u51B2\u51FB", "\u4ED6\u56FD\u5BF9\u6211\u56FD\u7981\u8FD0\uFF01", "economy", fromTurn(10), recurring(5, 30), [option("\u81EA\u7ED9\u81EA\u8DB3", { gold: -50, stability: 3 }, 3), option("\u5BFB\u627E\u66FF\u4EE3", { gold: -80, influence: 3 }, 2)]),
  defineEvent("evt_inflation", "\u901A\u80C0", "\u7269\u4EF7\u98DE\u6DA8\uFF0C\u6C11\u6028\u6CB8\u817E\uFF01", "economy", { minCorruption: 40 }, recurring(5, 25), [option("\u7D27\u7F29\u94F6\u6839", { gold: -80, stability: 3, corruption: -3 }, 3), option("\u653E\u4EFB\u4E0D\u7BA1", { factionSat: commonersReaction(-12), corruption: 5 }, 2)]),
  defineEvent("evt_devaluation", "\u5E01\u503C\u5D29\u8DCC", "\u94F8\u5E01\u63BA\u5047\uFF0C\u5E01\u503C\u66B4\u8DCC\uFF01", "economy", { minCorruption: 50 }, recurring(4, 30), [option("\u6574\u987F\u5E01\u5236", { gold: -100, legitimacy: 5, corruption: -5 }, 3), option("\u501F\u673A\u725F\u5229", { gold: 150, corruption: 8, factionSat: fr("merchants", -10) }, 2)]),
  defineEvent("evt_resource_shortage", "\u8D44\u6E90\u77ED\u7F3A", "\u94C1\u77FF\u6728\u6750\u4E25\u91CD\u4E0D\u8DB3\uFF01", "economy", fromTurn(8), recurring(4, 25), [option("\u9AD8\u4EF7\u91C7\u8D2D", { gold: -80, iron: 20, wood: 20 }, 3), option("\u9650\u5236\u6D88\u8017", { factionSat: militaryReaction(-8), stability: -2 }, 2)]),
  defineEvent("evt_caravan_arrival", "\u5546\u961F\u62B5\u8FBE", "\u8FDC\u65B9\u5546\u961F\u5E26\u6765\u73CD\u5947\u8D27\u7269\uFF01", "economy", fromTurn(5, { notAtWar: true }), recurring(4, 20), [option("\u8BBE\u5E02\u4EA4\u6613", { gold: 80, factionSat: fr("merchants", 8) }, 3), option("\u5F81\u6536\u5173\u7A0E", { gold: 120, factionSat: fr("merchants", -5) }, 2)]),
  defineEvent("evt_bank_loan", "\u94B1\u5E84\u501F\u8D37", "\u94B1\u5E84\u613F\u501F\u5DE8\u6B3E\uFF01", "economy", fromTurn(10), recurring(3, 40), [option("\u63A5\u53D7\u501F\u8D37", { gold: 300, corruption: 5 }, 3), option("\u5A49\u62D2", { legitimacy: 3 }, 2)]),
  defineEvent("evt_market_crash", "\u5E02\u5D29", "\u5E02\u573A\u6050\u614C\uFF0C\u7269\u4EF7\u66B4\u8DCC\uFF01", "economy", fromTurn(15), recurring(3, 50), [option("\u6284\u5E95\u6536\u8D2D", { gold: -150, stability: -5 }, 2), option("\u7A33\u5B9A\u5E02\u4EF7", { gold: -80, stability: 5 }, 3)]),
  defineEvent("evt_frontline_victory", "\u524D\u7EBF\u5927\u6377", "\u6211\u519B\u5927\u7834\u654C\u519B\uFF01", "military", { atWar: true }, recurring(6, 10), [option("\u4E58\u80DC\u8FFD\u51FB", { gold: -50, factionSat: militaryReaction(12), stability: 5 }, 2), option("\u89C1\u597D\u5C31\u6536", { legitimacy: 5, factionSat: militaryReaction(-3) }, 3)]),
  defineEvent("evt_siege", "\u56F4\u57CE", "\u654C\u519B\u56F4\u56F0\u6211\u65B9\u57CE\u6C60\uFF01", "military", { atWar: true }, recurring(7, 15), [option("\u6B7B\u5B88\u5F85\u63F4", { food: -80, gold: -40, stability: 3 }, 3), option("\u7A81\u56F4", { gold: -60, stability: -5, factionSat: militaryReaction(5) }, 2)]),
  defineEvent("evt_deserter", "\u9003\u5175", "\u5927\u6279\u58EB\u5175\u9003\u4EA1\uFF01", "military", { minWarExhaustion: 50 }, recurring(6, 20), [option("\u4E25\u60E9\u9003\u5175", { factionSat: militaryReaction(5), stability: -3 }, 2), option("\u6539\u5584\u5F85\u9047", { gold: -80, factionSat: militaryReaction(10) }, 3)]),
  defineEvent("evt_conscription_resistance", "\u6297\u5F81", "\u6C11\u4F17\u6297\u62D2\u5F81\u5175\uFF01", "military", fromTurn(8), recurring(5, 20), [option("\u5F3A\u5236\u5F81\u5175", { factionSat: commonersReaction(-15), stability: -5 }, 2), option("\u51CF\u5C11\u5F81\u989D", { factionSat: commonersReaction(8), stability: 2 }, 3)]),
  defineEvent("evt_war_profit", "\u6218\u4E89\u8D22", "\u519B\u9700\u65FA\u76DB\uFF0C\u5546\u4EBA\u53D1\u6218\u4E89\u8D22\uFF01", "military", { atWar: true, minTurn: 10 }, recurring(3, 25), [option("\u5F81\u6536\u6218\u4E89\u7A0E", { gold: 100, factionSat: fr("merchants", -8) }, 2), option("\u9F13\u52B1\u4F9B\u5E94", { gold: 50, factionSat: fr("merchants", 5) }, 3)]),
  defineEvent("evt_alliance_proposal", "\u540C\u76DF\u9080\u8BF7", "\u4ED6\u56FD\u63D0\u8BAE\u7ED3\u76DF\uFF01", "diplomacy", { notAtWar: true, minTurn: 8 }, recurring(5, 25), [option("\u540C\u610F\u7ED3\u76DF", { influence: 10, legitimacy: 3 }, 3), option("\u5A49\u62D2", { influence: -3 }, 2)]),
  defineEvent("evt_treaty_break", "\u6BC1\u7EA6", "\u76DF\u56FD\u5355\u65B9\u9762\u6495\u6BC1\u6761\u7EA6\uFF01", "diplomacy", fromTurn(15), recurring(4, 30), [option("\u5F3A\u70C8\u6297\u8BAE", { legitimacy: 5, stability: -3 }, 2), option("\u5FCD\u6C14\u541E\u58F0", { legitimacy: -8, factionSat: noblesReaction(-10) }, 3)]),
  defineEvent("evt_hostage_return", "\u8D28\u5B50\u5F52\u8FD8", "\u4ED6\u56FD\u5F52\u8FD8\u4EBA\u8D28\uFF01", "diplomacy", fromTurn(20, { notAtWar: true }), recurring(3, 40), [option("\u5584\u5F85\u5F52\u56FD", { legitimacy: 5, stability: 3 }, 3), option("\u51B7\u5F85", { factionSat: noblesReaction(-5) }, 2)]),
  defineEvent("evt_pirate_attack", "\u6D77\u76D7\u88AD\u51FB", "\u6D77\u76D7\u52AB\u63A0\u6CBF\u6D77\uFF01", "diplomacy", fromTurn(8), recurring(5, 20), [option("\u51FA\u5175\u527F\u706D", { gold: -60, factionSat: militaryReaction(8), stability: 3 }, 3), option("\u62DB\u5B89", { gold: -30, corruption: 5 }, 2)]),
  defineEvent("evt_tribute_demand", "\u7D22\u8D21", "\u5F3A\u56FD\u8981\u6C42\u8FDB\u8D21\uFF01", "diplomacy", fromTurn(12), recurring(4, 30), [option("\u5FCD\u8FB1\u8FDB\u8D21", { gold: -100, legitimacy: -5, stability: -3 }, 3), option("\u62D2\u7EDD", { legitimacy: 8, stability: -5 }, 2)]),
  defineEvent("evt_cultural_exchange", "\u6587\u5316\u4EA4\u6D41", "\u4ED6\u56FD\u5B66\u8005\u6765\u8BBF\u4EA4\u6D41\uFF01", "diplomacy", { notAtWar: true, minTurn: 10 }, recurring(3, 30), [option("\u70ED\u70C8\u6B22\u8FCE", { sciPt: 8, influence: 5, gold: -30 }, 3), option("\u8C28\u614E\u5BF9\u5F85", { sciPt: 3 }, 2)]),
  defineEvent("evt_heresy", "\u5F02\u7AEF", "\u5F02\u7AEF\u6559\u6D3E\u5174\u8D77\uFF01", "religion", fromTurn(10, { maxStability: 50 }), recurring(5, 25), [option("\u9547\u538B\u5F02\u7AEF", { stability: -5, factionSat: fr("clergy", 10), legitimacy: 3 }, 2), option("\u5BBD\u5BB9\u5BF9\u5F85", { factionSat: fr("clergy", -12), stability: 3 }, 3)]),
  defineEvent("evt_holy_war_call", "\u5723\u6218\u53F7\u53EC", "\u5B97\u6559\u9886\u8896\u53F7\u53EC\u5723\u6218\uFF01", "religion", fromTurn(20), recurring(3, 50), [option("\u54CD\u5E94\u53F7\u53EC", { factionSat: fr("clergy", 15), stability: -5, legitimacy: 5 }, 2), option("\u62D2\u7EDD", { factionSat: fr("clergy", -15), stability: 3 }, 3)]),
  defineEvent("evt_shrine_miracle", "\u795E\u8FF9", "\u795E\u6BBF\u73B0\u5F02\u8C61\uFF0C\u4FE1\u5F92\u8702\u62E5\uFF01", "religion", fromTurn(15, { minStability: 40 }), recurring(2, 60), [option("\u5927\u8086\u5BA3\u626C", { legitimacy: 8, factionSat: fr("clergy", 12), influence: 5 }, 3), option("\u4F4E\u8C03\u5904\u7406", { legitimacy: 2 }, 2)]),
  defineEvent("evt_monastery_land", "\u5BFA\u9662\u5360\u5730", "\u5BFA\u9662\u5E7F\u5360\u826F\u7530\uFF01", "religion", fromTurn(12, { minCorruption: 20 }), recurring(4, 30), [option("\u6CA1\u6536\u8FD8\u7530", { food: 50, factionSat: fr("clergy", -15), legitimacy: -3 }, 3), option("\u7EF4\u6301\u73B0\u72B6", { factionSat: fr("clergy", 5), corruption: 3 }, 2)]),
  defineEvent("evt_tech_academy", "\u5B66\u5E9C\u4E89\u9E23", "\u5404\u5B66\u6D3E\u6FC0\u70C8\u8BBA\u6218\uFF01", "science", { minTurn: 10, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 30), [option("\u8D44\u52A9\u7814\u7A76", { gold: -60, sciPt: 10, factionSat: noblesReaction(-5) }, 3), option("\u9650\u5236\u4E89\u8BBA", { stability: 3, sciPt: -3 }, 2)]),
  defineEvent("evt_tech_leak", "\u6280\u672F\u5916\u6D41", "\u6838\u5FC3\u673A\u5BC6\u88AB\u4ED6\u56FD\u7A83\u53D6\uFF01", "science", fromTurn(15), recurring(3, 40), [option("\u8FFD\u67E5\u5185\u9B3C", { gold: -50, stability: -3 }, 3), option("\u52A0\u901F\u7814\u53D1", { gold: -80, sciPt: 8 }, 2)]),
  defineEvent("evt_tech_craft_guild", "\u5DE5\u5320\u884C\u4F1A", "\u5DE5\u5320\u7EC4\u7EC7\u884C\u4F1A\u4FDD\u62A4\u79D8\u65B9\uFF01", "science", fromTurn(8), recurring(3, 30), [option("\u652F\u6301\u884C\u4F1A", { gold: -30, sciPt: 5, factionSat: fr("merchants", 5) }, 3), option("\u6253\u7834\u5784\u65AD", { sciPt: -2, factionSat: fr("merchants", -8) }, 2)]),
  defineEvent("evt_tech_invention", "\u53D1\u660E", "\u5DE5\u5320\u53D1\u660E\u65B0\u5DE5\u5177\uFF01", "science", { techLevelAbove: { branch: "agri", level: 2 } }, recurring(3, 35), [option("\u63A8\u5E7F\u4F7F\u7528", { gold: -40, food: 30, sciPt: 3 }, 3), option("\u4FDD\u5B88\u79D8\u5BC6", { sciPt: 5, influence: 2 }, 2)]),
  defineEvent("evt_granary_rot", "\u7CAE\u4ED3\u9709\u53D8", "\u50A8\u7CAE\u5927\u91CF\u9709\u53D8\uFF01", "crisis", fromTurn(10), recurring(4, 30), [option("\u7D27\u6025\u6E05\u7406", { food: -80, gold: -30 }, 3), option("\u542C\u4E4B\u4EFB\u4E4B", { food: -150, stability: -5 }, 2)]),
  defineEvent("evt_road_bandit", "\u8DEF\u532A", "\u76D7\u532A\u76D8\u8E1E\u8981\u9053\uFF01", "crisis", { maxStability: 45 }, recurring(5, 20), [option("\u6D3E\u5175\u6E05\u527F", { gold: -40, stability: 5, factionSat: militaryReaction(5) }, 3), option("\u7ED5\u9053", { gold: -20, factionSat: fr("merchants", -5) }, 2)]),
  defineEvent("evt_pop_plague", "\u65F6\u75AB", "\u75AB\u75C5\u5728\u90FD\u57CE\u8513\u5EF6\uFF01", "population", fromTurn(15), recurring(5, 30), [option("\u5C01\u57CE\u9694\u79BB", { gold: -80, population: -100, stability: -3 }, 3), option("\u653E\u4EFB", { population: -300, stability: -8 }, 2)]),
  defineEvent("evt_pop_festival", "\u4E07\u6C11\u540C\u5E86", "\u56FD\u6CF0\u6C11\u5B89\uFF0C\u4E07\u6C11\u6B22\u5E86\uFF01", "population", { minStability: 60, notAtWar: true, minTurn: 10 }, recurring(3, 30), [option("\u5927\u8D66\u5929\u4E0B", { gold: -50, stability: 8, legitimacy: 5, factionSat: commonersReaction(10) }, 3), option("\u7167\u5E38", { stability: 2 }, 2)]),
  defineEvent("evt_opp_relic", "\u4F20\u8BF4\u5723\u7269\u73B0\u4E16", "\u4F20\u8BF4\u5723\u7269\u88AB\u53D1\u6398\uFF01", "opportunity", fromTurn(20), recurring(2, 60), [option("\u4F9B\u5949\u5C55\u793A", { gold: -30, legitimacy: 10, factionSat: fr("clergy", 15), influence: 8 }, 3), option("\u79D8\u85CF", { legitimacy: 3 }, 2)]),
  defineEvent("evt_opp_annex", "\u90BB\u56FD\u5185\u4E71", "\u90BB\u56FD\u9677\u5165\u5185\u4E71\uFF0C\u6709\u673A\u53EF\u4E58\uFF01", "opportunity", fromTurn(15, { notAtWar: true }), recurring(3, 40), [option("\u8D81\u865A\u800C\u5165", { gold: -100, stability: -5, influence: 10 }, 2), option("\u9759\u89C2\u5176\u53D8", { stability: 3 }, 3)]),
  defineEvent("evt_opp_trade_monopoly", "\u72EC\u5360\u5546\u8DEF", "\u7ADE\u4E89\u5BF9\u624B\u9000\u51FA\uFF0C\u5546\u8DEF\u72EC\u5360\uFF01", "opportunity", { notAtWar: true, minTurn: 12 }, recurring(2, 40), [option("\u5927\u4E3E\u6269\u5F20", { gold: 150, factionSat: fr("merchants", 12) }, 3), option("\u7A33\u624E\u7A33\u6253", { gold: 60, stability: 3 }, 2)]),
  defineEvent("evt_opp_goldmine", "\u91D1\u77FF\u53D1\u73B0", "\u63A2\u77FF\u8005\u53D1\u73B0\u5927\u91D1\u77FF\uFF01", "opportunity", fromTurn(20), recurring(2, 50), [option("\u5168\u529B\u5F00\u91C7", { gold: 300, corruption: 8, factionSat: noblesReaction(10) }, 3), option("\u9002\u5EA6\u5F00\u91C7", { gold: 100, corruption: 3 }, 2)]),
  defineEvent("evt_culture_propaganda", "\u6587\u5316\u8F93\u51FA", "\u4ED6\u56FD\u4EF0\u6155\u6211\u56FD\u6587\u5316\uFF01", "culture", fromTurn(15, { notAtWar: true, minStability: 50 }), recurring(3, 30), [option("\u79EF\u6781\u63A8\u5E7F", { gold: -40, influence: 12, legitimacy: 3 }, 3), option("\u6765\u8005\u4E0D\u62D2", { influence: 5 }, 2)]),
  defineEvent("evt_culture_decay", "\u6587\u5316\u8870\u843D", "\u6587\u8109\u65AD\u7EDD\uFF0C\u793C\u5D29\u4E50\u574F\uFF01", "culture", { maxStability: 30 }, recurring(5, 25), [option("\u5174\u5B66\u91CD\u6559", { gold: -80, stability: 5, legitimacy: 3 }, 3), option("\u542C\u4E4B\u4EFB\u4E4B", { legitimacy: -5, factionSat: noblesReaction(-8) }, 2)]),
  // ── B8: 政体切换反扑事件（3 个，仅 govTransitionActive 窗口内可触发）──
  defineEvent("evt_gov_nobles_plot", "\u65E7\u8D35\u65CF\u5BC6\u8C0B\u590D\u8F9F", "\u5931\u53BB\u7279\u6743\u7684\u65E7\u8D35\u65CF\u6697\u4E2D\u5BC6\u8C0B\uFF0C\u4F01\u56FE\u590D\u8F9F\u65E7\u5236\uFF01", "politics", { govTransitionActive: true }, recurring(10, 5), [option("\u94C1\u8155\u9547\u538B", { gold: -100, stability: -8, factionSat: noblesReaction(-20), legitimacy: 5 }, 2), option("\u5B89\u629A\u59A5\u534F", { gold: -50, factionSat: noblesReaction(15), legitimacy: -8 }, 3)]),
  defineEvent("evt_gov_republican_push", "\u5171\u548C\u6D3E\u903C\u5BAB", "\u5171\u548C\u6D3E\u501F\u65B0\u653F\u4E4B\u673A\u8981\u6C42\u6269\u5927\u8BAE\u4F1A\u6743\u529B\uFF01", "politics", { govTransitionActive: true }, recurring(8, 5), [option("\u987A\u5E94\u6269\u6743", { legitimacy: -5, stability: 5, factionSat: fr("merchants", 12) }, 3), option("\u575A\u5B88\u738B\u6743", { stability: -10, factionSat: fr("merchants", -15), legitimacy: 3 }, 2)]),
  defineEvent("evt_gov_clergy_backlash", "\u6559\u58EB\u53CD\u6251", "\u5931\u52BF\u7684\u6559\u58EB\u717D\u52A8\u4FE1\u4F17\uFF0C\u6307\u65B0\u653F\u4E3A\u5F02\u7AEF\uFF01", "religion", { govTransitionActive: true }, recurring(8, 5), [option("\u653F\u6559\u5206\u79BB", { gold: -80, stability: -5, factionSat: fr("clergy", -18), legitimacy: 5 }, 2), option("\u62C9\u62E2\u6559\u58EB", { gold: -40, factionSat: fr("clergy", 10), legitimacy: -3 }, 3)]),
  // ── D1 扩充：+97 事件到 300，每类 +10 + 5 链 15 事件 ──
  // crisis +10
  defineEvent("evt_d1_flood", "\u6D2A\u6C34\u6CDB\u6EE5", "\u66B4\u96E8\u6210\u707E\uFF0C\u6CB3\u6C34\u6CDB\u6EE5\u3002", "crisis", fromTurn(5), recurring(5, 25), [option("\u7B51\u5824\u6551\u707E", { gold: -80, stability: 3 }, 3), option("\u4EFB\u5176\u81EA\u7136", { food: -40, stability: -5 }, 2)]),
  defineEvent("evt_d1_fire", "\u5927\u706B", "\u57CE\u4E2D\u5927\u706B\uFF0C\u8FDE\u70E7\u6570\u574A\u3002", "crisis", fromTurn(6), recurring(4, 35), [option("\u5168\u529B\u6251\u6551", { gold: -70, stability: 3 }, 3), option("\u62A2\u6551\u8D22\u7269", { gold: -20, stability: -4 }, 2)]),
  defineEvent("evt_d1_famine_locust", "\u8757\u540E\u9965\u8352", "\u8757\u707E\u4E4B\u540E\u7CAE\u4ED3\u7A7A\u865A\u3002", "crisis", { maxFoodRatio: 0.5 }, recurring(6, 20), [option("\u5916\u8D2D\u7CAE\u98DF", { gold: -100, food: 80 }, 3), option("\u52D2\u7D27\u8170\u5E26", { food: -30, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent("evt_d1_epidemic", "\u75AB\u75C5", "\u57CE\u4E2D\u75AB\u75C5\u6D41\u884C\u3002", "crisis", fromTurn(12), recurring(5, 40), [option("\u9694\u79BB\u6551\u6CBB", { gold: -90, population: -50, stability: 3 }, 3), option("\u4E0D\u7BA1\u4E0D\u95EE", { population: -200, stability: -8 }, 1)]),
  defineEvent("evt_d1_riot", "\u6C11\u53D8", "\u6C11\u4F17\u805A\u4F17\u95F9\u4E8B\uFF0C\u51B2\u51FB\u5E9C\u8859\u3002", "crisis", { maxStability: 30 }, recurring(7, 15), [option("\u5F39\u538B", { gold: -50, stability: -3, factionSat: militaryReaction(5) }, 2), option("\u7B54\u5E94\u8BC9\u6C42", { gold: -80, stability: 5, factionSat: commonersReaction(10) }, 3)]),
  defineEvent("evt_d1_collapse", "\u5EFA\u7B51\u574D\u584C", "\u5E74\u4E45\u5931\u4FEE\u7684\u5EFA\u7B51\u574D\u584C\u3002", "crisis", fromTurn(10), recurring(3, 30), [option("\u91CD\u5EFA", { gold: -100, stability: 2 }, 3), option("\u6682\u7F6E", { stability: -3 }, 2)]),
  defineEvent("evt_d1_invasion_raid", "\u86EE\u65CF\u52AB\u63A0", "\u86EE\u65CF\u9A91\u5175\u52AB\u63A0\u8FB9\u5883\uFF01", "crisis", fromTurn(8), recurring(5, 20), [option("\u51FA\u51FB", { gold: -60, factionSat: militaryReaction(8), stability: 3 }, 3), option("\u575A\u58C1\u6E05\u91CE", { food: -30, gold: -30 }, 2)]),
  defineEvent("evt_d1_starvation", "\u9965\u9991", "\u7CAE\u5C3D\u6C11\u9965\uFF0C\u997F\u6B8D\u8F7D\u9053\u3002", "crisis", { maxFoodRatio: 0.4 }, recurring(8, 15), [option("\u5F00\u4ED3", { food: -80, stability: 4 }, 3), option("\u52A0\u7A0E\u8D2D\u7CAE", { gold: -50, factionSat: commonersReaction(-15) }, 1)]),
  defineEvent("evt_d1_unrest_spread", "\u9A9A\u4E71\u8513\u5EF6", "\u4E00\u7701\u9A9A\u4E71\u8513\u5EF6\u90BB\u7701\u3002", "crisis", { maxStability: 35 }, recurring(6, 18), [option("\u6D3E\u5175\u9547\u538B", { gold: -70, factionSat: militaryReaction(6) }, 2), option("\u5B89\u629A", { gold: -100, stability: 5 }, 3)]),
  // politics +10
  defineEvent("evt_d1_court_intrigue", "\u5BAB\u5EF7\u9634\u8C0B", "\u540E\u5BAB\u4E0E\u671D\u81E3\u6697\u4E2D\u52FE\u7ED3\u3002", "politics", fromTurn(10), recurring(4, 30), [option("\u5F7B\u67E5", { gold: -50, legitimacy: 5, factionSat: noblesReaction(-8) }, 3), option("\u88C5\u4F5C\u4E0D\u77E5", { legitimacy: -5, corruption: 5 }, 2)]),
  defineEvent("evt_d1_minister_dismiss", "\u7F62\u76F8", "\u5BB0\u76F8\u5931\u804C\uFF0C\u671D\u91CE\u5F39\u52BE\u3002", "politics", { minCorruption: 40 }, recurring(5, 25), [option("\u7F62\u514D", { legitimacy: 3, stability: -3, factionSat: noblesReaction(-10) }, 3), option("\u7559\u4EFB", { corruption: 5, legitimacy: -5 }, 1)]),
  defineEvent("evt_d1_faction_feud", "\u6D3E\u7CFB\u503E\u8F67", "\u4E24\u5927\u6D3E\u7CFB\u516C\u5F00\u5BF9\u7ACB\u3002", "politics", fromTurn(8), recurring(5, 20), [option("\u5C45\u4E2D\u8C03\u505C", { gold: -40, stability: 3 }, 3), option("\u652F\u6301\u4E00\u65B9", { stability: -5, legitimacy: -3 }, 2)]),
  defineEvent("evt_d1_edict", "\u8BCF\u4EE4\u98CE\u6CE2", "\u65B0\u8BCF\u5F15\u53D1\u671D\u91CE\u4E89\u8BAE\u3002", "politics", fromTurn(12), recurring(4, 25), [option("\u575A\u6301", { legitimacy: 5, stability: -5 }, 2), option("\u6536\u56DE", { legitimacy: -8, stability: 3 }, 3)]),
  defineEvent("evt_d1_tax_revolt", "\u6297\u7A0E", "\u67D0\u7701\u62D2\u4E0D\u7EB3\u7A0E\u3002", "politics", { maxStability: 40 }, recurring(6, 20), [option("\u6B66\u529B\u50AC\u7A0E", { gold: 30, stability: -8, factionSat: commonersReaction(-12) }, 1), option("\u51CF\u514D", { gold: -50, stability: 5 }, 3)]),
  defineEvent("evt_d1_audit", "\u5BA1\u8BA1", "\u5BA1\u8BA1\u53D1\u73B0\u8D26\u76EE\u4E8F\u7A7A\u3002", "politics", { minCorruption: 30 }, recurring(4, 30), [option("\u8FFD\u7F34", { gold: 60, corruption: -5, factionSat: noblesReaction(-8) }, 3), option("\u4E0D\u4E86\u4E86\u4E4B", { corruption: 3 }, 2)]),
  defineEvent("evt_d1_promotion", "\u64E2\u5347", "\u529F\u81E3\u8BF7\u8D4F\u3002", "politics", fromTurn(10, { minStability: 40 }), recurring(3, 25), [option("\u91CD\u8D4F", { gold: -80, legitimacy: 5, factionSat: noblesReaction(8) }, 3), option("\u8584\u8D4F", { factionSat: noblesReaction(-5) }, 2)]),
  defineEvent("evt_d1_law_dispute", "\u5F8B\u6CD5\u4E89\u8BAE", "\u65B0\u5F8B\u5F15\u53D1\u6CD5\u7406\u4E89\u8BAE\u3002", "politics", fromTurn(15), recurring(4, 30), [option("\u4FEE\u8BA2", { gold: -60, legitimacy: 3 }, 3), option("\u7EF4\u6301", { stability: -3 }, 2)]),
  defineEvent("evt_d1_generalissimo", "\u5C06\u6743\u8FC7\u91CD", "\u5927\u5C06\u6743\u503E\u671D\u91CE\u3002", "politics", fromTurn(20), recurring(5, 40), [option("\u524A\u6743", { factionSat: militaryReaction(-15), stability: 3 }, 3), option("\u7EB5\u5BB9", { legitimacy: -8, corruption: 5 }, 1)]),
  defineEvent("evt_d1_reform_backlash", "\u6539\u9769\u53CD\u5F39", "\u65E7\u52BF\u529B\u53CD\u6251\u65B0\u653F\u3002", "politics", fromTurn(15), recurring(6, 25), [option("\u575A\u6301\u6539\u9769", { stability: -8, legitimacy: 5 }, 2), option("\u59A5\u534F", { stability: 3, legitimacy: -5 }, 3)]),
  // economy +10
  defineEvent("evt_d1_depression", "\u8427\u6761", "\u5546\u4E1A\u8427\u6761\uFF0C\u5E02\u573A\u51B7\u6E05\u3002", "economy", fromTurn(15, { notAtWar: true }), recurring(4, 35), [option("\u523A\u6FC0", { gold: -120, factionSat: fr("merchants", 10) }, 3), option("\u7B49\u5F85\u590D\u82CF", { gold: -20, factionSat: fr("merchants", -8) }, 2)]),
  defineEvent("evt_d1_coinage", "\u5E01\u5236\u6539\u9769", "\u94B1\u5E01\u8D2C\u503C\u5F15\u53D1\u6DF7\u4E71\u3002", "economy", fromTurn(18), recurring(4, 40), [option("\u6574\u987F\u5E01\u5236", { gold: -150, stability: 5, corruption: -5 }, 3), option("\u653E\u4EFB", { factionSat: fr("merchants", -10) }, 2)]),
  defineEvent("evt_d1_harvest_tax", "\u79CB\u6536\u5F81\u7A0E", "\u4E30\u6536\u4E4B\u5E74\u8BE5\u5F81\u591A\u5C11\uFF1F", "economy", fromTurn(5), recurring(5, 15), [option("\u91CD\u7A0E", { gold: 120, factionSat: commonersReaction(-10) }, 2), option("\u8584\u7A0E", { gold: 50, factionSat: commonersReaction(8) }, 3)]),
  defineEvent("evt_d1_trade_disrupt", "\u5546\u8DEF\u963B\u65AD", "\u5546\u8DEF\u88AB\u532A\u5F92\u963B\u65AD\u3002", "economy", fromTurn(10), recurring(4, 20), [option("\u6E05\u527F", { gold: -60, factionSat: fr("merchants", 10) }, 3), option("\u7ED5\u9053", { gold: -20, factionSat: fr("merchants", -5) }, 2)]),
  defineEvent("evt_d1_usury", "\u9AD8\u5229\u8D37", "\u5BCC\u5546\u653E\u9AD8\u5229\u8D37\u76D8\u5265\u767E\u59D3\u3002", "economy", { minCorruption: 25 }, recurring(4, 30), [option("\u9650\u5236\u5229\u7387", { gold: -30, factionSat: fra({ faction: "commoners", delta: 10 }, { faction: "merchants", delta: -8 }) }, 3), option("\u653E\u4EFB", { corruption: 3 }, 2)]),
  defineEvent("evt_d1_grain_store", "\u7CAE\u50A8", "\u7CAE\u50A8\u662F\u5426\u5145\u5B9E\uFF1F", "economy", fromTurn(8), recurring(3, 20), [option("\u5E7F\u50A8", { gold: -80, food: 100, stability: 3 }, 3), option("\u5C11\u50A8", { gold: 20, food: -20 }, 2)]),
  defineEvent("evt_d1_market_tax", "\u5E02\u7A0E", "\u662F\u5426\u63D0\u9AD8\u5E02\u573A\u7A0E\uFF1F", "economy", fromTurn(6), recurring(4, 20), [option("\u63D0\u9AD8", { gold: 80, factionSat: fr("merchants", -10) }, 2), option("\u7EF4\u6301", { factionSat: fr("merchants", 5) }, 3)]),
  defineEvent("evt_d1_labor_short", "\u5DE5\u7A0B\u52B3\u529B\u77ED\u7F3A", "\u5174\u5EFA\u5927\u5DE5\u7A0B\u52B3\u529B\u4E0D\u8DB3\u3002", "economy", fromTurn(12), recurring(3, 25), [option("\u5F81\u5F79", { factionSat: commonersReaction(-10), stability: -3 }, 2), option("\u52DF\u5DE5", { gold: -100 }, 3)]),
  // military +10
  defineEvent("evt_d1_general_die", "\u540D\u5C06\u9668\u843D", "\u4E00\u4EE3\u540D\u5C06\u75C5\u901D\u3002", "military", fromTurn(20), recurring(4, 50), [option("\u539A\u846C", { gold: -60, legitimacy: 3, factionSat: militaryReaction(8) }, 3), option("\u7B80\u846C", { factionSat: militaryReaction(-5) }, 2)]),
  defineEvent("evt_d1_border_warn", "\u8FB9\u8B66", "\u8FB9\u62A5\u9891\u4F20\uFF0C\u654C\u56FD\u5F02\u52A8\u3002", "military", fromTurn(8), recurring(5, 20), [option("\u589E\u5175", { gold: -80, factionSat: militaryReaction(5) }, 3), option("\u89C2\u671B", { stability: -3 }, 2)]),
  defineEvent("evt_d1_conscript_wave", "\u5F81\u5175", "\u662F\u5426\u5927\u89C4\u6A21\u5F81\u5175\uFF1F", "military", { atWar: true }, recurring(6, 15), [option("\u5927\u5F81", { factionSat: fra({ faction: "commoners", delta: -15 }, { faction: "military", delta: 10 }) }, 2), option("\u5C0F\u5F81", { factionSat: militaryReaction(3) }, 3)]),
  defineEvent("evt_d1_supply_cut", "\u8865\u7ED9\u7EBF\u65AD", "\u524D\u7EBF\u8865\u7ED9\u88AB\u5207\u65AD\uFF01", "military", { atWar: true, minTurn: 5 }, recurring(6, 20), [option("\u6253\u901A", { gold: -100, factionSat: militaryReaction(8) }, 3), option("\u5C31\u5730\u5F81\u7CAE", { factionSat: commonersReaction(-12), stability: -5 }, 1)]),
  defineEvent("evt_d1_veteran_return", "\u8001\u5175\u5F52\u4E61", "\u6218\u540E\u8001\u5175\u5F52\u4E61\u5B89\u7F6E\u3002", "military", fromTurn(15), recurring(3, 30), [option("\u6388\u7530", { gold: -100, factionSat: fra({ faction: "military", delta: 12 }, { faction: "commoners", delta: 5 }) }, 3), option("\u4E0D\u7BA1", { factionSat: militaryReaction(-10), stability: -3 }, 2)]),
  defineEvent("evt_d1_fortify", "\u7B51\u57CE", "\u662F\u5426\u52A0\u56FA\u57CE\u9632\uFF1F", "military", fromTurn(10), recurring(3, 30), [option("\u5927\u5174", { gold: -120, stability: 5 }, 3), option("\u5C0F\u4FEE", { gold: -30 }, 2)]),
  defineEvent("evt_d1_alliance_call", "\u76DF\u53CB\u6C42\u63F4", "\u76DF\u56FD\u906D\u5165\u4FB5\u6C42\u63F4\u3002", "military", fromTurn(12, { notAtWar: true }), recurring(4, 25), [option("\u51FA\u5175", { gold: -100, factionSat: militaryReaction(8), influence: 5 }, 3), option("\u5A49\u62D2", { influence: -8 }, 2)]),
  defineEvent("evt_d1_pirate", "\u6D77\u76D7", "\u6D77\u76D7\u88AD\u6270\u6CBF\u6D77\uFF01", "military", fromTurn(10), recurring(4, 25), [option("\u527F\u706D", { gold: -80, factionSat: militaryReaction(6) }, 3), option("\u62DB\u5B89", { gold: -40, corruption: 4 }, 2)]),
  defineEvent("evt_d1_war_debt", "\u6218\u503A", "\u6218\u4E89\u8017\u8D39\u5DE8\u5927\uFF0C\u56FD\u5E93\u544A\u6025\u3002", "military", { atWar: true, minTurn: 8 }, recurring(5, 20), [option("\u52A0\u7A0E\u507F\u503A", { gold: 80, factionSat: commonersReaction(-12) }, 2), option("\u4E3E\u503A", { gold: 100, corruption: 5 }, 3)]),
  // diplomacy +10
  defineEvent("evt_d1_envoy_gift", "\u4F7F\u8282\u732E\u793C", "\u5916\u56FD\u4F7F\u8282\u5E26\u6765\u539A\u793C\u3002", "diplomacy", fromTurn(8, { notAtWar: true }), recurring(3, 25), [option("\u56DE\u793C", { gold: -50, influence: 8 }, 3), option("\u6536\u4E0B", { gold: 30, influence: -3 }, 2)]),
  defineEvent("evt_d1_marriage", "\u8054\u59FB", "\u90BB\u56FD\u63D0\u8BAE\u8054\u59FB\u7ED3\u76DF\u3002", "diplomacy", fromTurn(10, { notAtWar: true }), recurring(4, 40), [option("\u5E94\u5141", { gold: -80, influence: 15, legitimacy: 3 }, 3), option("\u62D2\u7EDD", { influence: -8 }, 2)]),
  defineEvent("evt_d1_trade_pact", "\u5546\u7EA6", "\u90BB\u56FD\u63D0\u8BAE\u7B7E\u8BA2\u5546\u7EA6\u3002", "diplomacy", fromTurn(8, { notAtWar: true }), recurring(4, 30), [option("\u7B7E\u8BA2", { gold: 60, influence: 5, factionSat: fr("merchants", 10) }, 3), option("\u89C2\u671B", { factionSat: fr("merchants", -5) }, 2)]),
  defineEvent("evt_d1_insult", "\u53D7\u8FB1", "\u90BB\u56FD\u4F7F\u8282\u51FA\u8A00\u4E0D\u900A\u3002", "diplomacy", fromTurn(12), recurring(4, 20), [option("\u6297\u8BAE", { influence: -5, stability: 3 }, 2), option("\u5FCD\u8BA9", { legitimacy: -3 }, 3)]),
  defineEvent("evt_d1_refugee_return", "\u9063\u8FD4", "\u90BB\u56FD\u8981\u6C42\u9063\u8FD4\u6D41\u6C11\u3002", "diplomacy", fromTurn(15), recurring(3, 30), [option("\u9063\u8FD4", { influence: 5, stability: -3 }, 3), option("\u62D2\u7EDD", { influence: -8 }, 2)]),
  defineEvent("evt_d1_embassy", "\u8BBE\u4F7F\u9986", "\u662F\u5426\u5728\u5404\u56FD\u8BBE\u4F7F\u9986\uFF1F", "diplomacy", fromTurn(12, { notAtWar: true }), recurring(3, 40), [option("\u8BBE\u7ACB", { gold: -100, influence: 12 }, 3), option("\u6682\u7F13", { influence: -3 }, 2)]),
  defineEvent("evt_d1_hostage", "\u8D28\u5B50", "\u90BB\u56FD\u9001\u8D28\u5B50\u4EE5\u6C42\u548C\u3002", "diplomacy", fromTurn(15), recurring(3, 50), [option("\u63A5\u53D7", { influence: 10, stability: -3 }, 3), option("\u62D2\u7EDD", { influence: -5 }, 2)]),
  defineEvent("evt_d1_summit", "\u4F1A\u76DF", "\u8BF8\u56FD\u63D0\u8BAE\u4F1A\u76DF\u3002", "diplomacy", fromTurn(20, { notAtWar: true }), recurring(3, 60), [option("\u4E3B\u76DF", { gold: -150, influence: 20, legitimacy: 5 }, 3), option("\u5217\u5E2D", { influence: 5 }, 2)]),
  defineEvent("evt_d1_spy_caught", "\u7EC6\u4F5C", "\u6293\u83B7\u90BB\u56FD\u7EC6\u4F5C\u3002", "diplomacy", fromTurn(10), recurring(4, 25), [option("\u5904\u6B7B", { influence: -5, stability: 3 }, 2), option("\u9063\u8FD4", { influence: 3 }, 3)]),
  defineEvent("evt_d1_trade_war", "\u5546\u6218", "\u90BB\u56FD\u5BF9\u6211\u52A0\u5F81\u5173\u7A0E\u3002", "diplomacy", fromTurn(15), recurring(4, 30), [option("\u53CD\u5236", { gold: -50, factionSat: fr("merchants", -8) }, 2), option("\u8C08\u5224", { gold: -30, influence: 5 }, 3)]),
  // religion +10
  defineEvent("evt_d1_shrine_build", "\u7ACB\u7960", "\u662F\u5426\u4E3A\u529F\u81E3\u7ACB\u7960\uFF1F", "religion", fromTurn(15, { minStability: 40 }), recurring(3, 40), [option("\u7ACB\u7960", { gold: -80, legitimacy: 5, factionSat: fr("clergy", 8) }, 3), option("\u4E0D\u7ACB", { factionSat: fr("clergy", -5) }, 2)]),
  defineEvent("evt_d1_omen", "\u5929\u8C61", "\u5F02\u8C61\u5F15\u53D1\u6050\u614C\u3002", "religion", fromTurn(8), recurring(4, 30), [option("\u796D\u7940", { gold: -50, legitimacy: 5, stability: 3 }, 3), option("\u4E0D\u7406", { stability: -5 }, 2)]),
  defineEvent("evt_d1_conversion", "\u6539\u5B97", "\u90E8\u5206\u6C11\u4F17\u6539\u4FE1\u5F02\u6559\u3002", "religion", fromTurn(15, { provinceCultureDiff: true }), recurring(4, 35), [option("\u4F20\u6559", { gold: -60, factionSat: fr("clergy", 10) }, 3), option("\u5BBD\u5BB9", { stability: 3, factionSat: fr("clergy", -8) }, 2)]),
  defineEvent("evt_d1_temple_fire", "\u5BFA\u5E99\u706B\u707E", "\u4E3B\u5BFA\u5E99\u5931\u706B\u3002", "religion", fromTurn(10), recurring(3, 40), [option("\u91CD\u5EFA", { gold: -100, factionSat: fr("clergy", 12) }, 3), option("\u6682\u7F6E", { factionSat: fr("clergy", -10) }, 2)]),
  defineEvent("evt_d1_festival", "\u5B97\u6559\u8282", "\u76DB\u5927\u5B97\u6559\u8282\u65E5\u5C06\u81F3\u3002", "religion", fromTurn(8, { notAtWar: true }), recurring(3, 20), [option("\u5927\u529E", { gold: -70, stability: 5, factionSat: fr("clergy", 10) }, 3), option("\u7B80\u529E", { factionSat: fr("clergy", -5) }, 2)]),
  defineEvent("evt_d1_sacrilege", "\u4EB5\u6E0E", "\u6709\u4EBA\u4EB5\u6E0E\u795E\u5E99\u3002", "religion", fromTurn(12), recurring(3, 30), [option("\u4E25\u60E9", { factionSat: fr("clergy", 12), stability: -3 }, 2), option("\u5BBD\u6055", { factionSat: fr("clergy", -10) }, 3)]),
  defineEvent("evt_d1_prophecy", "\u9884\u8A00", "\u5DEB\u5E08\u9884\u8A00\u56FD\u8FD0\u3002", "religion", fromTurn(18), recurring(3, 50), [option("\u4FE1\u4E4B", { gold: -40, legitimacy: -3 }, 2), option("\u65A5\u4E4B", { factionSat: fr("clergy", -8), stability: 3 }, 3)]),
  defineEvent("evt_d1_donation", "\u6350\u8D60", "\u5BCC\u5546\u6350\u8D60\u5BFA\u5E99\u3002", "religion", fromTurn(12, { notAtWar: true }), recurring(2, 30), [option("\u9F13\u52B1", { factionSat: fra({ faction: "clergy", delta: 8 }, { faction: "merchants", delta: 5 }) }, 3), option("\u8BFE\u7A0E", { gold: 40, factionSat: fr("clergy", -8) }, 2)]),
  defineEvent("evt_d1_relic", "\u5723\u7269", "\u53D1\u73B0\u5723\u7269\u3002", "religion", fromTurn(20), recurring(2, 60), [option("\u4F9B\u5949", { gold: -50, legitimacy: 8, factionSat: fr("clergy", 15) }, 3), option("\u79D8\u85CF", { legitimacy: 3 }, 2)]),
  // science +10
  defineEvent("evt_d1_academy", "\u4E66\u9662", "\u5B66\u8005\u8BF7\u7ACB\u4E66\u9662\u3002", "science", { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u6279\u51C6", { gold: -100, sciPt: 20, legitimacy: 3 }, 3), option("\u5A49\u62D2", { sciPt: -3 }, 2)]),
  defineEvent("evt_d1_scholar_invite", "\u62DB\u8D24", "\u5F02\u56FD\u8D24\u624D\u6765\u6295\u3002", "science", fromTurn(12, { notAtWar: true }), recurring(3, 30), [option("\u91CD\u7528", { gold: -60, sciPt: 12, factionSat: noblesReaction(-5) }, 3), option("\u4E0D\u7528", { sciPt: -2 }, 2)]),
  defineEvent("evt_d1_experiment", "\u5B9E\u9A8C", "\u5B66\u8005\u8BF7\u6C42\u505A\u5371\u9669\u5B9E\u9A8C\u3002", "science", { minTurn: 15, techLevelAbove: { branch: "agri", level: 2 } }, recurring(3, 35), [option("\u5141\u8BB8", { sciPt: 15, stability: -3 }, 3), option("\u7981\u6B62", { sciPt: -5, factionSat: fr("clergy", 5) }, 2)]),
  defineEvent("evt_d1_translation", "\u8BD1\u4E66", "\u662F\u5426\u7FFB\u8BD1\u5F02\u56FD\u5178\u7C4D\uFF1F", "science", fromTurn(18, { notAtWar: true }), recurring(3, 40), [option("\u7FFB\u8BD1", { gold: -80, sciPt: 10, influence: 5 }, 3), option("\u4E0D\u8BD1", { sciPt: -2 }, 2)]),
  defineEvent("evt_d1_observation", "\u89C2\u6D4B", "\u5929\u6587\u5B66\u5BB6\u8BF7\u6C42\u5EFA\u89C2\u8C61\u53F0\u3002", "science", { minTurn: 20, techLevelAbove: { branch: "culture", level: 2 } }, recurring(2, 50), [option("\u5174\u5EFA", { gold: -120, sciPt: 20, legitimacy: 5 }, 3), option("\u7F13\u8BAE", { sciPt: -3 }, 2)]),
  defineEvent("evt_d1_medicine", "\u533B\u672F", "\u540D\u533B\u732E\u4E0A\u65B0\u533B\u672F\u3002", "science", { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 35), [option("\u63A8\u5E7F", { gold: -60, population: 100, stability: 3 }, 3), option("\u89C2\u671B", {}, 2)]),
  defineEvent("evt_d1_engineering", "\u5DE5\u7A0B", "\u5DE5\u7A0B\u5E08\u732E\u65B0\u6CD5\u3002", "science", { minTurn: 18, techLevelAbove: { branch: "admin", level: 3 } }, recurring(2, 40), [option("\u91C7\u7528", { gold: -80, sciPt: 8 }, 3), option("\u4E0D\u7528", {}, 2)]),
  defineEvent("evt_d1_philosophy", "\u54F2\u5B66", "\u54F2\u5B66\u5BB6\u63D0\u51FA\u65B0\u8BF4\u3002", "science", { minTurn: 20, techLevelAbove: { branch: "culture", level: 3 } }, recurring(2, 50), [option("\u8868\u5F70", { gold: -30, sciPt: 10, legitimacy: 3 }, 3), option("\u7981\u7EDD", { stability: -5, factionSat: fr("clergy", 8) }, 1)]),
  defineEvent("evt_d1_archive", "\u6863\u6848", "\u662F\u5426\u6574\u7406\u56FD\u5BB6\u6863\u6848\uFF1F", "science", fromTurn(15), recurring(2, 40), [option("\u6574\u7406", { gold: -50, sciPt: 8, legitimacy: 3 }, 3), option("\u4E0D\u7406", {}, 2)]),
  // opportunity +10
  defineEvent("evt_d1_talent", "\u8D24\u624D", "\u5728\u91CE\u8D24\u624D\u6C42\u4ED5\u3002", "opportunity", fromTurn(8, { minStability: 30 }), recurring(3, 25), [option("\u7834\u683C", { gold: -40, legitimacy: 5, factionSat: noblesReaction(-5) }, 3), option("\u5FAA\u4F8B", {}, 2)]),
  defineEvent("evt_d1_land_claim", "\u65E0\u4E3B\u4E4B\u5730", "\u8FB9\u5883\u53D1\u73B0\u65E0\u4E3B\u6C83\u571F\u3002", "opportunity", fromTurn(12, { notAtWar: true }), recurring(3, 40), [option("\u5360\u9886", { gold: -60, stability: 3 }, 3), option("\u653E\u5F03", {}, 2)]),
  defineEvent("evt_d1_ancient", "\u53E4\u8FF9", "\u53D1\u73B0\u53E4\u4EE3\u9057\u8FF9\u3002", "opportunity", fromTurn(15), recurring(2, 50), [option("\u53D1\u6398", { gold: -50, sciPt: 10, legitimacy: 3 }, 3), option("\u4FDD\u62A4", { influence: 3 }, 2)]),
  defineEvent("evt_d1_alliance_offer", "\u6765\u6295", "\u5C0F\u56FD\u6C42\u4E3A\u9644\u5EB8\u3002", "opportunity", fromTurn(15, { notAtWar: true }), recurring(3, 40), [option("\u63A5\u53D7", { gold: -80, influence: 15, stability: -3 }, 3), option("\u62D2\u7EDD", { influence: -3 }, 2)]),
  defineEvent("evt_d1_reform_open", "\u6539\u9769\u826F\u673A", "\u6C11\u5FC3\u53EF\u7528\uFF0C\u6539\u9769\u826F\u673A\u3002", "opportunity", fromTurn(18, { minStability: 50 }), recurring(3, 50), [option("\u63A8\u884C", { gold: -100, legitimacy: 8, stability: -5 }, 3), option("\u7F13\u8BAE", {}, 2)]),
  defineEvent("evt_d1_feast", "\u76DB\u5BB4", "\u662F\u5426\u4E3E\u529E\u76DB\u5BB4\u5F70\u663E\u56FD\u529B\uFF1F", "opportunity", fromTurn(12, { minStability: 40 }), recurring(3, 30), [option("\u5927\u529E", { gold: -100, influence: 12, legitimacy: 3 }, 3), option("\u7B80\u529E", { gold: -20 }, 2)]),
  defineEvent("evt_d1_tribute", "\u671D\u8D21", "\u5C0F\u56FD\u6765\u671D\u8D21\u3002", "opportunity", fromTurn(15, { notAtWar: true }), recurring(3, 40), [option("\u539A\u8D4F", { gold: -80, influence: 15 }, 3), option("\u8584\u8D4F", { gold: -20, influence: 3 }, 2)]),
  defineEvent("evt_d1_explorer", "\u63A2\u9669", "\u63A2\u9669\u5BB6\u8BF7\u7F28\u8FDC\u5F81\u3002", "opportunity", fromTurn(20), recurring(2, 50), [option("\u8D44\u52A9", { gold: -120, influence: 10, sciPt: 5 }, 3), option("\u4E0D\u5141", {}, 2)]),
  defineEvent("evt_d1_census", "\u666E\u67E5", "\u662F\u5426\u666E\u67E5\u4EBA\u53E3\uFF1F", "opportunity", fromTurn(10), recurring(3, 40), [option("\u666E\u67E5", { gold: 20, corruption: -3 }, 3), option("\u4E0D\u67E5", {}, 2)]),
  defineEvent("evt_d1_diplomat", "\u7EB5\u6A2A", "\u7EB5\u6A2A\u5BB6\u6765\u6295\u3002", "opportunity", fromTurn(15, { notAtWar: true }), recurring(2, 40), [option("\u91CD\u7528", { gold: -50, influence: 12 }, 3), option("\u4E0D\u7528", {}, 2)]),
  // culture +10
  defineEvent("evt_d1_poet", "\u8BD7\u4EBA", "\u8457\u540D\u8BD7\u4EBA\u6765\u6E38\u3002", "culture", fromTurn(10, { minStability: 30 }), recurring(3, 30), [option("\u6B3E\u5F85", { gold: -30, influence: 8, legitimacy: 3 }, 3), option("\u4E0D\u89C1", {}, 2)]),
  defineEvent("evt_d1_art", "\u827A\u672F", "\u827A\u672F\u5BB6\u8BF7\u8D5E\u52A9\u3002", "culture", fromTurn(12, { minStability: 40 }), recurring(3, 30), [option("\u8D5E\u52A9", { gold: -50, influence: 8 }, 3), option("\u5A49\u62D2", {}, 2)]),
  defineEvent("evt_d1_history", "\u4FEE\u53F2", "\u662F\u5426\u4FEE\u56FD\u53F2\uFF1F", "culture", fromTurn(15), recurring(3, 50), [option("\u4FEE\u53F2", { gold: -80, legitimacy: 8, influence: 5 }, 3), option("\u7F13\u8BAE", {}, 2)]),
  defineEvent("evt_d1_etiquette", "\u793C\u5236", "\u662F\u5426\u9769\u65B0\u793C\u5236\uFF1F", "culture", fromTurn(18), recurring(3, 40), [option("\u9769\u65B0", { gold: -60, legitimacy: 5, stability: -3 }, 3), option("\u5B88\u65E7", {}, 2)]),
  defineEvent("evt_d1_architecture", "\u5EFA\u7B51", "\u65B0\u5EFA\u7B51\u98CE\u683C\u6D41\u884C\u3002", "culture", { minTurn: 15, techLevelAbove: { branch: "admin", level: 2 } }, recurring(2, 40), [option("\u91C7\u7528", { gold: -80, influence: 8 }, 3), option("\u4E0D\u7528", {}, 2)]),
  defineEvent("evt_d1_music", "\u96C5\u4E50", "\u662F\u5426\u6574\u7406\u96C5\u4E50\uFF1F", "culture", fromTurn(12, { minStability: 40 }), recurring(2, 40), [option("\u6574\u7406", { gold: -40, legitimacy: 5, factionSat: fr("clergy", 5) }, 3), option("\u4E0D\u7406", {}, 2)]),
  defineEvent("evt_d1_fashion", "\u670D\u9970", "\u65B0\u670D\u9970\u98CE\u683C\u5174\u8D77\u3002", "culture", fromTurn(15), recurring(2, 40), [option("\u63A8\u5E7F", { gold: -30, influence: 5 }, 3), option("\u7981\u7EDD", { stability: -3 }, 2)]),
  defineEvent("evt_d1_language", "\u6587\u5B57", "\u662F\u5426\u7EDF\u4E00\u6587\u5B57\uFF1F", "culture", { minTurn: 20, techLevelAbove: { branch: "admin", level: 3 } }, recurring(3, 60), [option("\u7EDF\u4E00", { gold: -100, legitimacy: 10, stability: -5 }, 3), option("\u4E0D\u7EDF", {}, 2)]),
  defineEvent("evt_d1_festival_art", "\u827A\u672F\u8282", "\u662F\u5426\u4E3E\u529E\u827A\u672F\u8282\uFF1F", "culture", fromTurn(12, { notAtWar: true, minStability: 40 }), recurring(3, 30), [option("\u4E3E\u529E", { gold: -60, influence: 10, stability: 3 }, 3), option("\u4E0D\u529E", {}, 2)]),
  defineEvent("evt_d1_legend", "\u4F20\u5947", "\u6C11\u95F4\u6D41\u4F20\u672C\u671D\u4F20\u5947\u3002", "culture", fromTurn(18, { minStability: 50 }), recurring(2, 50), [option("\u9F13\u52B1", { legitimacy: 5, influence: 5 }, 3), option("\u7981\u7EDD", { stability: -3 }, 2)]),
  // population +7
  defineEvent("evt_d1_migration", "\u8FC1\u5F99", "\u90E8\u5206\u6C11\u4F17\u6B32\u8FC1\u5F99\u4ED6\u4E61\u3002", "population", fromTurn(10, { maxStability: 40 }), recurring(4, 25), [option("\u633D\u7559", { gold: -50, stability: 3 }, 3), option("\u4EFB\u5176", { population: -200 }, 2)]),
  defineEvent("evt_d1_birth_boom", "\u5A74\u513F\u6F6E", "\u4ECA\u5E74\u51FA\u751F\u7387\u5927\u589E\u3002", "population", fromTurn(8, { minStability: 50 }), recurring(3, 30), [option("\u9F13\u52B1", { gold: -40, population: 200 }, 3), option("\u4E0D\u7BA1", { population: 100 }, 2)]),
  defineEvent("evt_d1_plague_death", "\u75AB\u540E", "\u75AB\u75C5\u540E\u4EBA\u53E3\u9AA4\u51CF\u3002", "population", fromTurn(15), recurring(4, 40), [option("\u4F11\u517B", { gold: -60, population: 100, stability: 3 }, 3), option("\u4E0D\u7BA1", { population: -100 }, 2)]),
  defineEvent("evt_d1_labor_demand", "\u52B3\u529B", "\u767E\u4E1A\u5174\u65FA\u52B3\u529B\u4E0D\u8DB3\u3002", "population", fromTurn(12, { minStability: 50 }), recurring(3, 30), [option("\u62DB\u629A", { gold: -50, population: 150 }, 3), option("\u4E0D\u52A0", {}, 2)]),
  defineEvent("evt_d1_urban", "\u57CE\u5E02\u5316", "\u6C11\u4F17\u6D8C\u5165\u57CE\u5E02\u3002", "population", fromTurn(15, { minStability: 40 }), recurring(3, 30), [option("\u5B89\u7F6E", { gold: -80, stability: 3, factionSat: commonersReaction(8) }, 3), option("\u4E0D\u7BA1", { stability: -3, corruption: 3 }, 2)]),
  defineEvent("evt_d1_emigration", "\u5916\u6D41", "\u6C11\u4F17\u5916\u6D41\u4ED6\u56FD\u3002", "population", fromTurn(12, { maxStability: 35 }), recurring(4, 25), [option("\u963B\u6B62", { gold: -40, stability: -3 }, 2), option("\u4EFB\u5176", { population: -150, influence: -3 }, 3)]),
  defineEvent("evt_d1_clan", "\u5B97\u65CF", "\u5927\u5B97\u65CF\u517C\u5E76\u5C0F\u6237\u3002", "population", fromTurn(15, { minCorruption: 30 }), recurring(3, 35), [option("\u6291\u5236", { gold: -50, factionSat: fra({ faction: "nobles", delta: -10 }, { faction: "commoners", delta: 8 }) }, 3), option("\u4E0D\u7BA1", { corruption: 3 }, 2)]),
  // ── D1 事件链 11-15（5 链 × 3 事件 = 15 事件）──
  // 链 11：蛮族入侵链——预警→入侵→和或战
  defineEvent(
    "evt_chain_barbarian_1",
    "\u86EE\u65CF\u96C6\u7ED3",
    "\u8FB9\u62A5\uFF1A\u86EE\u65CF\u4E8E\u585E\u5916\u96C6\u7ED3\uFF0C\u4F3C\u6709\u5357\u4E0B\u4E4B\u610F\uFF01",
    "military",
    fromTurn(12),
    recurring(5, 80),
    [
      option("\u589E\u5175\u6212\u5907", { gold: -80, factionSat: militaryReaction(5), triggerEvent: "evt_chain_barbarian_2" }, 3),
      option("\u9063\u4F7F\u63A2\u865A\u5B9E", { gold: -30, influence: -3, triggerEvent: "evt_chain_barbarian_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_barbarian_2",
    "\u86EE\u65CF\u5357\u4E0B",
    "\u86EE\u65CF\u94C1\u9A91\u5357\u4E0B\uFF0C\u8FDE\u9677\u6570\u9547\uFF01",
    "military",
    fromTurn(13),
    followUp,
    [
      option("\u4E3B\u529B\u51B3\u6218", { gold: -150, factionSat: militaryReaction(10), stability: -5, triggerEvent: "evt_chain_barbarian_3" }, 2),
      option("\u575A\u58C1\u6E05\u91CE", { food: -100, gold: -60, stability: -8, triggerEvent: "evt_chain_barbarian_3" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_barbarian_3",
    "\u86EE\u65CF\u4F59\u6CE2",
    "\u86EE\u65CF\u9000\u53BB\uFF0C\u8FB9\u5883\u6B8B\u7834\u3002",
    "military",
    fromTurn(14),
    followUp,
    [
      option("\u91CD\u5EFA\u8FB9\u5883", { gold: -120, stability: 5, factionSat: commonersReaction(8) }, 3),
      option("\u6682\u7F6E", { stability: -3, influence: -5 }, 2)
    ]
  ),
  // 链 12：继位内战链——驾崩→争位→内战或和解
  defineEvent(
    "evt_chain_succession_1",
    "\u541B\u4E3B\u9A7E\u5D29",
    "\u541B\u4E3B\u7A81\u7136\u9A7E\u5D29\uFF0C\u672A\u7ACB\u592A\u5B50\uFF01",
    "politics",
    fromTurn(25),
    oneTime(6, 100),
    [
      option("\u7ACB\u957F\u5B50", { legitimacy: 5, stability: -5, triggerEvent: "evt_chain_succession_2" }, 3),
      option("\u62E9\u8D24\u7ACB", { legitimacy: -5, stability: -8, factionSat: noblesReaction(-10), triggerEvent: "evt_chain_succession_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_succession_2",
    "\u8BF8\u738B\u4E89\u4F4D",
    "\u8BF8\u738B\u5B50\u5404\u7ACB\u515A\u7FBD\uFF0C\u671D\u91CE\u5206\u88C2\uFF01",
    "politics",
    fromTurn(26),
    followUp,
    [
      option("\u5F3A\u529B\u9547\u538B", { gold: -100, stability: -10, factionSat: militaryReaction(8), triggerEvent: "evt_chain_succession_3" }, 2),
      option("\u8C08\u5224\u548C\u89E3", { gold: -150, legitimacy: -8, stability: 3, triggerEvent: "evt_chain_succession_3" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_succession_3",
    "\u5185\u6218\u7ED3\u675F",
    "\u4E89\u4F4D\u4E4B\u4E89\u7EC8\u89C1\u5206\u6653\u3002",
    "politics",
    fromTurn(27),
    followUp,
    [
      option("\u5927\u8D66\u5929\u4E0B", { gold: -80, legitimacy: 10, stability: 8 }, 3),
      option("\u6E05\u7B97\u65E7\u8D26", { gold: -40, legitimacy: 5, factionSat: noblesReaction(-15) }, 2)
    ]
  ),
  // 链 13：商业革命链——新兴→繁荣→泡沫或稳固
  defineEvent(
    "evt_chain_commerce_1",
    "\u5546\u56E2\u5174\u8D77",
    "\u65B0\u5174\u5546\u56E2\u52BF\u529B\u5927\u589E\uFF0C\u8981\u6C42\u66F4\u591A\u7279\u6743\uFF01",
    "economy",
    { minTurn: 15, notAtWar: true, techLevelAbove: { branch: "admin", level: 2 } },
    recurring(4, 80),
    [
      option("\u6388\u4E88\u7279\u6743", { gold: 100, factionSat: fra({ faction: "merchants", delta: 12 }, { faction: "nobles", delta: -8 }), triggerEvent: "evt_chain_commerce_2" }, 3),
      option("\u9650\u5236", { gold: -20, factionSat: fr("merchants", -10), triggerEvent: "evt_chain_commerce_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_commerce_2",
    "\u5546\u4E1A\u7E41\u8363",
    "\u5546\u4E1A\u7A7A\u524D\u7E41\u8363\uFF0C\u91D1\u5E01\u5982\u96E8\uFF01",
    "economy",
    fromTurn(16),
    followUp,
    [
      option("\u5927\u4E3E\u5F81\u7A0E", { gold: 200, factionSat: fr("merchants", -12), triggerEvent: "evt_chain_commerce_3" }, 2),
      option("\u8F7B\u7A0E\u4FC3\u5546", { gold: 80, factionSat: fr("merchants", 10), stability: 3, triggerEvent: "evt_chain_commerce_3" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_commerce_3",
    "\u5546\u6F6E\u4F59\u6CE2",
    "\u5546\u4E1A\u6D6A\u6F6E\u540E\uFF0C\u7ECF\u6D4E\u683C\u5C40\u5DF2\u53D8\u3002",
    "economy",
    fromTurn(17),
    followUp,
    [
      option("\u89C4\u8303\u5E02\u573A", { gold: -60, corruption: -5, factionSat: fr("merchants", 5) }, 3),
      option("\u653E\u4EFB", { corruption: 8, gold: 50 }, 2)
    ]
  ),
  // 链 14：宗教改革链——异端→分裂→宽容或镇压
  defineEvent(
    "evt_chain_reform_1",
    "\u5B97\u6559\u5F02\u7AEF",
    "\u65B0\u6559\u6D3E\u5174\u8D77\uFF0C\u6311\u6218\u65E7\u6559\u6743\u5A01\uFF01",
    "religion",
    { minTurn: 18, techLevelAbove: { branch: "culture", level: 2 } },
    recurring(4, 100),
    [
      option("\u9547\u538B", { gold: -80, factionSat: fr("clergy", 12), stability: -5, triggerEvent: "evt_chain_reform_2" }, 2),
      option("\u5BB9\u5FCD", { factionSat: fr("clergy", -15), stability: 3, triggerEvent: "evt_chain_reform_2" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_reform_2",
    "\u5B97\u6559\u5206\u88C2",
    "\u6559\u6D3E\u5BF9\u7ACB\u5168\u56FD\u52A8\u8361\uFF01",
    "religion",
    fromTurn(19),
    followUp,
    [
      option("\u5B9A\u4E00\u5C0A", { gold: -150, legitimacy: 8, stability: -10, factionSat: fr("clergy", 15), triggerEvent: "evt_chain_reform_3" }, 2),
      option("\u5BBD\u5BB9\u5E76\u7ACB", { gold: -50, stability: 5, legitimacy: -5, factionSat: fr("clergy", -10), triggerEvent: "evt_chain_reform_3" }, 3)
    ]
  ),
  defineEvent(
    "evt_chain_reform_3",
    "\u6559\u4E89\u7EC8\u5C40",
    "\u5B97\u6559\u4E4B\u4E89\u6682\u544A\u6BB5\u843D\u3002",
    "religion",
    fromTurn(20),
    followUp,
    [
      option("\u91CD\u5EFA\u6559\u6743", { gold: -100, legitimacy: 5, factionSat: fr("clergy", 10) }, 3),
      option("\u653F\u6559\u5206\u79BB", { gold: -50, stability: 5, factionSat: fr("clergy", -8) }, 2)
    ]
  ),
  // 链 15：瘟疫大流行链——潜伏→爆发→余波或根治
  defineEvent(
    "evt_chain_pandemic_1",
    "\u75AB\u75C5\u6F5C\u4F0F",
    "\u8FDC\u56FD\u75AB\u75C5\u4F20\u5165\uFF0C\u592A\u533B\u594F\u8BF7\u9632\u8303\uFF01",
    "crisis",
    fromTurn(22),
    oneTime(5, 120),
    [
      option("\u4E25\u9632\u8F93\u5165", { gold: -100, stability: 3, triggerEvent: "evt_chain_pandemic_2" }, 3),
      option("\u89C2\u671B", { triggerEvent: "evt_chain_pandemic_2" }, 2)
    ]
  ),
  defineEvent(
    "evt_chain_pandemic_2",
    "\u5927\u75AB\u7206\u53D1",
    "\u75AB\u75C5\u5168\u56FD\u8513\u5EF6\uFF0C\u6B7B\u8005\u751A\u4F17\uFF01",
    "crisis",
    fromTurn(23),
    followUp,
    [
      option("\u5C01\u57CE\u6551\u6CBB", { gold: -200, population: -300, stability: -8, factionSat: fr("clergy", 8), triggerEvent: "evt_chain_pandemic_3" }, 3),
      option("\u7948\u7977", { population: -500, stability: -15, legitimacy: -8, triggerEvent: "evt_chain_pandemic_3" }, 1)
    ]
  ),
  defineEvent(
    "evt_chain_pandemic_3",
    "\u75AB\u540E\u91CD\u5EFA",
    "\u5927\u75AB\u7EC8\u4E8E\u9000\u53BB\uFF0C\u767E\u5E9F\u5F85\u5174\u3002",
    "crisis",
    fromTurn(24),
    followUp,
    [
      option("\u4F11\u517B\u751F\u606F", { gold: -150, population: 200, stability: 8, legitimacy: 5 }, 3),
      option("\u52A0\u7A0E\u91CD\u5EFA", { gold: 100, factionSat: commonersReaction(-15), stability: -5 }, 2)
    ]
  ),
  // ── population 扩充 +10（21→31，增强人口系统事件多样性）──
  defineEvent("evt_pop_aging", "\u8006\u8001\u589E\u591A", "\u533B\u672F\u6E10\u8FDB\uFF0C\u8006\u5BFF\u589E\u591A\uFF0C\u8D61\u517B\u4E4B\u8BAE\u8D77\uFF01", "population", { minTurn: 20, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u8BBE\u517B\u6D4E\u9662", { gold: -70, stability: 4, factionSat: commonersReaction(10) }, 3), option("\u65CF\u517B\u4E3A\u4E3B", { stability: 1, factionSat: noblesReaction(5) }, 2)]),
  defineEvent("evt_pop_orphan", "\u5B64\u513F\u6D41\u79BB", "\u6218\u4E71\u540E\u5B64\u513F\u6D41\u79BB\u9053\u65C1\uFF0C\u58EB\u6C11\u8BF7\u547D\uFF01", "population", fromTurn(12, { atWar: true }), recurring(4, 30), [option("\u5B98\u8BBE\u6148\u5E7C\u5C40", { gold: -60, population: 80, stability: 5, factionSat: fr("clergy", 8) }, 3), option("\u6C11\u95F4\u6536\u517B", { population: 40, stability: 1 }, 2)]),
  defineEvent("evt_pop_refugee_return", "\u6D41\u6C11\u5F52\u4E61", "\u6545\u571F\u5B89\u9756\uFF0C\u6614\u65E5\u6D41\u6C11\u7EB7\u7EB7\u5F52\u4E61\uFF01", "population", fromTurn(18, { notAtWar: true, minStability: 50 }), recurring(3, 40), [option("\u5B98\u52A9\u5F52\u8015", { gold: -50, population: 150, food: 30, efficiency: 2 }, 3), option("\u542C\u5176\u81EA\u4FBF", { population: 80 }, 2)]),
  defineEvent("evt_pop_conscription_backlash", "\u5F81\u4E01\u6028\u58F0", "\u8FDE\u5E74\u5F81\u5175\uFF0C\u4E61\u91CE\u4E01\u58EE\u532E\u4E4F\uFF0C\u6C11\u6028\u6E10\u8D77\uFF01", "population", fromTurn(10, { atWar: true, maxStability: 50 }), recurring(5, 25), [option("\u51CF\u514D\u6765\u5E74\u5F81\u53D1", { gold: -40, stability: 5, factionSat: commonersReaction(12) }, 3), option("\u4E25\u4EE4\u50AC\u5F81", { stability: -8, factionSat: commonersReaction(-15), population: -100 }, 1)]),
  defineEvent("evt_pop_market_town", "\u5E02\u9547\u5174\u8D77", "\u4EA4\u901A\u8981\u51B2\u5E02\u9547\u81EA\u53D1\u5174\u8D77\uFF0C\u5546\u8D3E\u4E91\u96C6\uFF01", "population", { minTurn: 14, minStability: 45, techLevelAbove: { branch: "admin", level: 1 } }, recurring(3, 35), [option("\u8BBE\u5B98\u6CBB\u7406", { gold: -40, efficiency: 3, factionSat: fr("merchants", 10), corruption: -2 }, 3), option("\u4EFB\u5176\u81EA\u6D41", { gold: 30, corruption: 4 }, 2)]),
  defineEvent("evt_pop_famine_migration", "\u5C31\u98DF\u6D41\u79FB", "\u5317\u7701\u5927\u65F1\uFF0C\u9965\u6C11\u5C31\u98DF\u5357\u4E0B\uFF0C\u7EB7\u81F3\u6C93\u6765\uFF01", "population", fromTurn(12, { maxStability: 45 }), recurring(5, 30), [option("\u5F00\u4ED3\u8D48\u6D4E", { gold: -80, food: -60, population: 200, stability: 4 }, 3), option("\u95ED\u5883\u62D2\u4E4B", { stability: -5, influence: -5, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent("evt_pop_noble_exodus", "\u8D35\u80C4\u5F99\u907F", "\u653F\u5C40\u52A8\u8361\uFF0C\u90E8\u5206\u8D35\u80C4\u643A\u5BB6\u5357\u8FC1\u90BB\u90A6\uFF01", "population", fromTurn(15, { maxStability: 40 }), recurring(4, 35), [option("\u539A\u793C\u633D\u7559", { gold: -100, legitimacy: 5, factionSat: noblesReaction(12) }, 3), option("\u4EFB\u5176\u53BB\u7559", { population: -80, influence: -5, factionSat: noblesReaction(-10) }, 2)]),
  defineEvent("evt_pop_scholar_return", "\u6E38\u5B66\u5F52\u4E61", "\u6614\u65E5\u6E38\u5B66\u4E4B\u58EB\u5B66\u6210\u5F52\u56FD\uFF0C\u6B32\u6548\u529B\u5E99\u5802\uFF01", "population", { minTurn: 16, techLevelAbove: { branch: "admin", level: 2 } }, recurring(3, 40), [option("\u91CF\u624D\u5F55\u7528", { gold: -40, sciPt: 20, efficiency: 3, factionSat: fr("clergy", 8) }, 3), option("\u5F85\u7F3A\u5019\u8865", { sciPt: 5, stability: 1 }, 2)]),
  defineEvent("evt_pop_border_trade", "\u8FB9\u6C11\u4E92\u5E02", "\u8FB9\u6C11\u8D8A\u754C\u4E92\u5E02\uFF0C\u5B98\u5E9C\u67E5\u5426\u4E24\u96BE\uFF01", "population", fromTurn(10, { notAtWar: true }), recurring(3, 30), [option("\u8BBE\u69B7\u573A\u89C4\u8303", { gold: 60, factionSat: fr("merchants", 10), efficiency: 2 }, 3), option("\u4E25\u7981\u8D8A\u754C", { gold: -20, stability: 2, factionSat: fr("merchants", -8) }, 2)]),
  defineEvent("evt_pop_overcrowding", "\u4EBA\u7A20\u5730\u72ED", "\u6838\u5FC3\u7701\u4EFD\u4EBA\u7A20\u5730\u72ED\uFF0C\u751F\u8BA1\u65E5\u8E59\uFF01", "population", fromTurn(22, { minStability: 50 }), recurring(4, 40), [option("\u79FB\u6C11\u5B9E\u8FB9", { gold: -100, population: 100, stability: 4, efficiency: 2 }, 3), option("\u7CBE\u8015\u7EC6\u4F5C", { gold: -50, food: 40, sciPt: 5 }, 2)])
];
var EVENT_BY_ID = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);
var EVENT_IDS = EVENTS.map((e) => e.id);
var EVENT_COUNT = EVENTS.length;

// src/gameplay/stateOwnership.ts
var NEUTRAL_PROVINCE_OWNER_IDS = /* @__PURE__ */ new Set(["barbarian"]);
function isValidProvinceOwner(state, ownerId) {
  return !!state.nations[ownerId] || NEUTRAL_PROVINCE_OWNER_IDS.has(ownerId);
}

// src/gameplay/stateHygiene.ts
function validPendingEvents(state) {
  const pendingKeys = /* @__PURE__ */ new Set();
  return (state.pendingEvents ?? []).filter((entry) => {
    if (!entry || !state.nations[entry.nationId] || state.nations[entry.nationId].defeated || !Object.prototype.hasOwnProperty.call(EVENT_BY_ID, entry.eventId)) return false;
    const key = `${entry.nationId}|${entry.eventId}`;
    if (pendingKeys.has(key)) return false;
    pendingKeys.add(key);
    return true;
  });
}

// src/shared-world/nationView.ts
function sharedNationView(state, nationId) {
  const history = state.sharedHistories?.[nationId] ?? state.history.filter((r) => r.nationId === nationId);
  const lastReport = history[history.length - 1] ?? (state.lastReport?.nationId === nationId ? state.lastReport : null);
  return {
    ...state,
    playerNationId: nationId,
    history,
    lastReport,
    strategyFocus: state.sharedFocuses?.[nationId] ?? (state.playerNationId === nationId ? state.strategyFocus : void 0) ?? "balance",
    nations: Object.fromEntries(Object.entries(state.nations).map(([id, n3]) => [id, n3.isPlayer === (id === nationId) ? n3 : { ...n3, isPlayer: id === nationId }]))
  };
}

// src/engine/formulas.ts
function stabilityTaxModifier(stability) {
  if (stability >= 60) return 1.2;
  if (stability >= 40) return 1;
  if (stability >= 30) return 0.8;
  return 0.5;
}
function corruptionModifier(corruption) {
  return clamp(1 - corruption / 200, 0.5, 1);
}
function assimilationModifier(assimilation) {
  return clamp(0.7 + assimilation / 300, 0.7, 1);
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
  const charMod = input.tradeMod ?? (input.commerceActive ? 1.25 : 1);
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
  const foodMod = clamp(input.foodNeed > 0 ? input.food / input.foodNeed : 1, 0.3, 1.5);
  const warMod = input.atWar ? 0.7 : 1;
  const plagueMod = input.plague ? 0.5 : 1;
  const welfareMod = input.growthMod ?? (input.welfareActive ? 1.1 : 1);
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
  const garrisonMod = clamp(1 - input.garrison / 1e3, 0.3, 1);
  const stabMod = clamp((100 - input.stability) / 50, 0.5, 1.5);
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
  const attackerLoss = clamp(defPower / Math.max(attPower, 1) * baseLoss * attSize, 0, attSize);
  const defenderLoss = clamp(attPower / Math.max(defPower, 1) * baseLoss * defSize, 0, defSize);
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
  return clamp(milPart + provPart + relPart, 0, 100);
}
function computeSciPt(scholarCount, libraryCount, technocracyActive) {
  const base = scholarCount * 0.5 + libraryCount * 2;
  return technocracyActive ? base * 1.25 : base;
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
  { id: "agrarian_reform", name: "\u519C\u672C\u653F\u7B56", description: "\u4EBA\u53E3\u589E\u957F\u52A0\u5FEB 6%\uFF0C\u7A0E\u7387\u964D\u4F4E 1 \u4E2A\u767E\u5206\u70B9\u3002", costAction: 1, costGold: 100, allowedGovernments: ["empire", "monarchy"], effects: { popGrowthMod: 1.06, taxRateMod: -0.01 }, factionReaction: { commoners: 12, merchants: -15 } },
  { id: "infrastructure_plan", name: "\u57FA\u5EFA\u632F\u5174", description: "\u5168\u56FD\u4FEE\u8DEF\u5EFA\u6865\uFF0C\u884C\u653F\u4E0E\u8D38\u6613\u5347\u3002\u9700\u884C\u653F Lv2\u3002", costAction: 2, costGold: 220, allowedGovernments: [], effects: { efficiencyMod: 8, taxEffMod: 1.05 }, factionReaction: { commoners: 8, merchants: 8 }, prereqTech: "admin_lv2" },
  { id: "census", name: "\u7F16\u6237\u9F50\u6C11", description: "\u666E\u67E5\u4EBA\u53E3\uFF0C\u7A0E\u6536\u6548\u7387\u5347\u3002\u9700\u884C\u653F Lv2\u3002", costAction: 1, costGold: 150, allowedGovernments: ["empire", "monarchy"], effects: { taxEffMod: 1.1, efficiencyMod: 5 }, factionReaction: { nobles: -8 }, prereqTech: "admin_lv2" },
  { id: "diplomatic_corps", name: "\u5916\u4EA4\u4F7F\u56E2", description: "\u8BBE\u7ACB\u4E13\u804C\u5916\u4EA4\u673A\u6784\uFF0C\u5F71\u54CD\u529B\u4EA7\u51FA\u5347\u3002", costAction: 1, costGold: 130, allowedGovernments: [], effects: { influenceMod: 1.15 }, factionReaction: { nobles: 5, merchants: 5 } },
  { id: "cultural_patronage", name: "\u6587\u5316\u8D5E\u52A9", description: "\u8D5E\u52A9\u827A\u672F\u5B66\u672F\uFF0C\u5A01\u671B\u4E0E\u540C\u5316\u5347\u3002", costAction: 1, costGold: 110, allowedGovernments: [], effects: { influenceMod: 1.08, assimilationMod: 3 }, factionReaction: { clergy: 5, commoners: 3 } },
  { id: "succession_law", name: "\u7EE7\u627F\u6CD5", description: "\u786E\u7ACB\u7EE7\u627F\u987A\u5E8F\uFF0C\u5408\u6CD5\u6027\u5927\u5347\u4F46\u9650\u5236\u541B\u4E3B\u3002", costAction: 2, costGold: 200, allowedGovernments: ["monarchy", "empire"], effects: { stabilityMod: 8 }, factionReaction: { nobles: 15, military: -5 } },
  // ── D2 扩充：4 个质变政策，绑定 Lv5 科技解锁 ──
  { id: "crop_rotation", name: "\u8F6E\u4F5C\u653F\u7B56", description: "\u79D1\u5B66\u8F6E\u4F5C\u517B\u5730\uFF0C\u7CAE\u4EA7 +15%\u3002\u9700\u519C\u4E1A Lv5\u3002", costAction: 2, costGold: 280, allowedGovernments: [], effects: { foodOutputMod: 1.15 }, factionReaction: { commoners: 15, nobles: -5 }, prereqTech: "agri_lv5" },
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
function settlePolitics(nation, state, provs = provincesOf(nation.id, state.provinces)) {
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
  nation.government.stability = clamp(nation.government.stability + finalDelta, 0, 100);
  const reformShockTurns = nation.activePolicies.filter(
    (p) => state.turn - p.enactedTurn < 3
  ).length > 0 ? 1 : 0;
  const dLegit = legitimacyDelta(fw.avgSat, nation.government.corruption, nation.warExhaustion, reformShockTurns);
  nation.government.legitimacy = clamp(nation.government.legitimacy + dLegit, 0, 100);
  nation.government.legitimacy = clamp(nation.government.legitimacy + nation.tech.culture * 0.3, 0, 100);
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
  nation.government.corruption = clamp(nation.government.corruption + corruptionDelta, 0, 100);
  const cm = nationalCharacterMods(nation.activeCharacterBonuses);
  if (cm.stabilityMod) nation.government.stability = clamp(nation.government.stability + cm.stabilityMod, 0, 100);
  if (cm.legitimacyMod) nation.government.legitimacy = clamp(nation.government.legitimacy + cm.legitimacyMod, 0, 100);
  if (cm.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + cm.efficiencyMod, 0, 100);
  if (cm.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + cm.corruptionMod, 0, 100);
  const factionSatMap = { nobles: cm.noblesSat, merchants: cm.merchantsSat, military: cm.militarySat, commoners: cm.commonersSat, clergy: cm.clergySat };
  for (const f of nation.factions) {
    const delta = factionSatMap[f.id];
    if (delta) f.satisfaction = clamp(f.satisfaction + delta * 0.1, 0, 100);
  }
  const govDef = GOVERNMENTS[nation.government.type];
  if (govDef?.perTurn) {
    const pt = govDef.perTurn;
    if (pt.legitimacy) nation.government.legitimacy = clamp(nation.government.legitimacy + pt.legitimacy, 0, 100);
    if (pt.stability) nation.government.stability = clamp(nation.government.stability + pt.stability, 0, 100);
    if (pt.efficiency) nation.government.efficiency = clamp(nation.government.efficiency + pt.efficiency, 0, 100);
    if (pt.corruption) nation.government.corruption = clamp(nation.government.corruption + pt.corruption, 0, 100);
    if (pt.factionSat) {
      const fsMap = pt.factionSat;
      for (const f of nation.factions) {
        const d = fsMap[f.id];
        if (d) f.satisfaction = clamp(f.satisfaction + d, 0, 100);
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
  if (def.effects.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + def.effects.corruptionMod, 0, 100);
  if (def.effects.stabilityMod) nation.government.stability = clamp(nation.government.stability + def.effects.stabilityMod, 0, 100);
  if (def.effects.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + def.effects.efficiencyMod, 0, 100);
  if (def.effects.taxRateMod) nation.taxRate = clamp(nation.taxRate + (def.effects.taxRateMod ?? 0), 0, 0.5);
  nation.policyMods = derivePolicyMods(nation, def.effects.assimilationMod);
  for (const [fid, delta] of Object.entries(def.factionReaction)) {
    const f = nation.factions.find((x) => x.id === fid);
    if (f) f.satisfaction = clamp(f.satisfaction + delta, 0, 100);
  }
  return { ok: true };
}
function hasTech(nation, techId) {
  const match = /^(agri|mil|admin|culture)_lv(\d+)$/.exec(techId);
  if (!match) return false;
  const branch = match[1];
  return nation.tech[branch] >= Number(match[2]);
}
function derivePolicyMods(nation, addedAssimilation = 0) {
  const mods = {};
  for (const active of nation.activePolicies) {
    const effects = POLICIES.find((policy) => policy.id === active.policyId)?.effects;
    if (!effects) continue;
    if (effects.taxEffMod) mods.taxEffMod = (mods.taxEffMod ?? 1) * effects.taxEffMod;
    if (effects.combatMod) mods.combatMod = (mods.combatMod ?? 1) * effects.combatMod;
    if (effects.mobilizationMod) mods.mobilizationMod = (mods.mobilizationMod ?? 1) * effects.mobilizationMod;
    if (effects.foodOutputMod) mods.foodOutputMod = (mods.foodOutputMod ?? 1) * effects.foodOutputMod;
    if (effects.popGrowthMod) mods.popGrowthMod = (mods.popGrowthMod ?? 1) * effects.popGrowthMod;
    if (effects.influenceMod) {
      const influenceMultiplier = Math.abs(effects.influenceMod) >= 2 ? 1 + effects.influenceMod / 100 : effects.influenceMod;
      mods.influenceMod = (mods.influenceMod ?? 1) * influenceMultiplier;
    }
    if (effects.assimilationMod) mods.assimilationMod = (mods.assimilationMod ?? 0) + effects.assimilationMod;
  }
  const saved = nation.policyMods?.assimilationMod;
  if (saved !== void 0 && Number.isFinite(saved)) {
    mods.assimilationMod = Math.max(mods.assimilationMod ?? 0, saved + addedAssimilation);
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
  if (e.corruptionMod) nation.government.corruption = clamp(nation.government.corruption + e.corruptionMod, 0, 100);
  if (e.stabilityMod) nation.government.stability = clamp(nation.government.stability + e.stabilityMod, 0, 100);
  if (e.efficiencyMod) nation.government.efficiency = clamp(nation.government.efficiency + e.efficiencyMod, 0, 100);
  if (e.legitimacyMod) nation.government.legitimacy = clamp(nation.government.legitimacy + e.legitimacyMod, 0, 100);
  if (e.taxEffMod && e.taxEffMod !== 1) nation.government.efficiency = clamp(nation.government.efficiency * e.taxEffMod, 0, 100);
  for (const f of nation.factions) {
    const delta = def.factionReaction[f.id];
    if (delta) f.satisfaction = clamp(f.satisfaction + delta, 0, 100);
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
        finals[p.id] = { ...finals[p.id], unrest: clamp(cur - e.unrestReduction, 0, 100) };
      }
    }
    if (e.rebellionReduction) {
      for (const p of provs) {
        const cur = finals[p.id]?.rebellionRisk ?? p.rebellionRisk;
        finals[p.id] = { ...finals[p.id], rebellionRisk: clamp(cur - e.rebellionReduction, 0, 100) };
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
function settlePoliticsPure(nation, state, provs = provincesOf(nation.id, state.provinces)) {
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
  let finalStab = clamp(nation.government.stability + finalDelta, 0, 100);
  const reformShockTurns = nation.activePolicies.filter((p) => state.turn - p.enactedTurn < 3).length > 0 ? 1 : 0;
  const dLegit = legitimacyDelta(fw.avgSat, nation.government.corruption, nation.warExhaustion, reformShockTurns);
  let finalLegit = clamp(nation.government.legitimacy + dLegit, 0, 100);
  finalLegit = clamp(finalLegit + nation.tech.culture * 0.3, 0, 100);
  const hasAntiCorruption = nation.activePolicies.some((p) => p.policyId === "anti_corruption");
  let corruptionDelta;
  if (hasAntiCorruption) corruptionDelta = -1;
  else if (finalStab >= 70) corruptionDelta = -0.2;
  else if (finalStab >= 50) corruptionDelta = 0.1;
  else corruptionDelta = 0.4;
  let finalCorruption = clamp(nation.government.corruption + corruptionDelta, 0, 100);
  let finalEfficiency = nation.government.efficiency;
  const cm = nationalCharacterMods(nation.activeCharacterBonuses);
  if (cm.stabilityMod) finalStab = clamp(finalStab + cm.stabilityMod, 0, 100);
  if (cm.legitimacyMod) finalLegit = clamp(finalLegit + cm.legitimacyMod, 0, 100);
  if (cm.efficiencyMod) finalEfficiency = clamp(finalEfficiency + cm.efficiencyMod, 0, 100);
  if (cm.corruptionMod) finalCorruption = clamp(finalCorruption + cm.corruptionMod, 0, 100);
  const factionSatFinal = {};
  const factionSatMap = { nobles: cm.noblesSat, merchants: cm.merchantsSat, military: cm.militarySat, commoners: cm.commonersSat, clergy: cm.clergySat };
  for (const f of nation.factions) {
    let sat = f.satisfaction;
    const d = factionSatMap[f.id];
    if (d) sat = clamp(sat + d * 0.1, 0, 100);
    factionSatFinal[f.id] = sat;
  }
  const govDef = GOVERNMENTS[nation.government.type];
  if (govDef?.perTurn) {
    const pt = govDef.perTurn;
    if (pt.legitimacy) finalLegit = clamp(finalLegit + pt.legitimacy, 0, 100);
    if (pt.stability) finalStab = clamp(finalStab + pt.stability, 0, 100);
    if (pt.efficiency) finalEfficiency = clamp(finalEfficiency + pt.efficiency, 0, 100);
    if (pt.corruption) finalCorruption = clamp(finalCorruption + pt.corruption, 0, 100);
    if (pt.factionSat) {
      const fsMap = pt.factionSat;
      for (const f of nation.factions) {
        const d = fsMap[f.id];
        if (d) factionSatFinal[f.id] = clamp(factionSatFinal[f.id] + d, 0, 100);
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

// src/engine/tradeNetwork.ts
var contracts = [
  {
    id: "grain_import",
    name: "\u7CAE\u98DF\u8F93\u5165\u7EBF",
    description: "\u8FD0\u56DE\u53E3\u7CAE\uFF0C\u517C\u6536\u6CBF\u9014\u5546\u7A0E\u3002",
    costGold: 80,
    prereqAdminLevel: 1,
    length: "short",
    yield: { gold: 15, food: 30, influence: 1 }
  },
  {
    id: "grain_export",
    name: "\u7CAE\u98DF\u8F93\u51FA\u7EBF",
    description: "\u6BCF\u5E74\u4EA4\u4ED8\u7CAE\u50A8\uFF0C\u6362\u53D6\u8D27\u6B3E\u4E0E\u5F71\u54CD\u529B\u3002",
    costGold: 120,
    prereqAdminLevel: 1,
    length: "medium",
    yield: { gold: 50, food: -45, influence: 3 }
  }
];
function connect(contract, start, end) {
  return { ...contract, id: [contract.id, start, end].join(":"), endpoints: [start, end] };
}
function tradeRouteById(id) {
  if (Object.prototype.hasOwnProperty.call(TRADE_ROUTE_BY_ID, id)) return TRADE_ROUTE_BY_ID[id];
  if (typeof id !== "string") return;
  const parts = id.split(":");
  if (parts.length !== 3 || !parts[1] || !parts[2] || parts[1] === parts[2]) return;
  const contract = contracts.find((entry) => entry.id === parts[0]);
  return contract && connect(contract, parts[1], parts[2]);
}
function marketRank(province) {
  const coastal = province.terrain === "coast" || province.terrain === "island";
  return Number(coastal) * 2 + Number(province.isCapital);
}
function tradeOffers(state, nation) {
  if (state.provinces.p01) return TRADE_ROUTES;
  const markets = /* @__PURE__ */ new Map();
  for (const p of Object.values(state.provinces)) {
    if (p.terrain === "ocean") continue;
    const previous = markets.get(p.ownerId);
    if (!previous || marketRank(p) > marketRank(previous) || marketRank(p) === marketRank(previous) && p.id < previous.id) {
      markets.set(p.ownerId, p);
    }
  }
  const home = markets.get(nation.id);
  if (!home) return [];
  const distance = (p) => (p.x - home.x) ** 2 + (p.y - home.y) ** 2;
  const contacts = new Map(state.relations.filter((r) => r.from === nation.id).map((r) => [r.to, r]));
  const marketsAbroad = [...markets.values()].filter((p) => contacts.has(p.ownerId) && state.nations[p.ownerId] && !state.nations[p.ownerId].defeated);
  const accessible = (p) => {
    const r = contacts.get(p.ownerId);
    return Number(r.treaty === "trade" || r.treaty === "alliance" || r.treaty === "none" && r.relation >= 0);
  };
  marketsAbroad.sort((a, b) => accessible(b) - accessible(a) || distance(a) - distance(b) || a.id.localeCompare(b.id));
  const pactPartners = new Set(state.diplomaticAccords.filter((a) => a.agenda === "security" && a.expiresTurn >= state.turn && (a.partyA === nation.id || a.partyB === nation.id)).map((a) => a.partyA === nation.id ? a.partyB : a.partyA));
  return marketsAbroad.filter((port, i) => i < 3 || pactPartners.has(port.ownerId)).flatMap((port) => contracts.map((contract) => connect(contract, home.id, port.id)));
}
function routeAccessBlocker(def, state, nation) {
  const [start, end] = def.endpoints.map((id) => state.provinces[id]);
  if (!start || !end) return "\u8DEF\u7EBF\u7AEF\u70B9\u7701\u4EFD\u4E0D\u5B58\u5728";
  if (!def.id.includes(":")) return start.ownerId === nation.id || end.ownerId === nation.id ? null : "\u4E24\u7AEF\u5747\u4E0D\u5F52\u672C\u56FD";
  if (start.ownerId !== nation.id) return "\u8D77\u8FD0\u5730\u5DF2\u6613\u4E3B";
  if (end.ownerId === nation.id) return null;
  const relation = state.relations.find((r) => r.from === nation.id && r.to === end.ownerId);
  if (state.nations[end.ownerId]?.defeated || !relation || !["trade", "alliance"].includes(relation.treaty)) return "\u9700\u4E0E\u5BF9\u65B9\u7B7E\u8BA2\u8D38\u6613\u534F\u5B9A";
  return null;
}
function operatingRoutes(nation, state) {
  return (nation.activeTradeRoutes ?? []).flatMap((entry) => {
    const def = tradeRouteById(entry.routeId);
    return def && !nation.embargoedRoutes?.includes(def.id) && !routeAccessBlocker(def, state, nation) ? [def] : [];
  });
}

// src/engine/economy.ts
function computeBuildingYield(buildingDefId, level, terrain) {
  const totals = { gold: 0, food: 0, wood: 0, iron: 0, sciPt: 0, adminPt: 0, influence: 0, supply: 0 };
  const definition = BUILDINGS[buildingDefId];
  if (!definition) return totals;
  const safeLevel = clamp(Math.round(level), 1, 3);
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
function settleEconomy(nation, state, provs, relations = state.relations) {
  const result = settleEconomyPure(nation, state, provs, relations);
  applyEconomyResult(nation, result);
  return result;
}
function settleEconomyPure(nation, state, provs = provincesOf(nation.id, state.provinces), relations = state.relations) {
  let taxIncome = 0, foodProduced = 0;
  let wood = 0, iron = 0, scholars = 0;
  let dInfluence = 0;
  const harvests = [];
  const taxEff = (1 + nation.tech.admin * 0.06) * (nation.policyMods?.taxEffMod ?? 1);
  for (const p of provs) {
    const peasants = p.classes.find((c) => c.classId === "peasants")?.count ?? 0;
    scholars += p.classes.find((c) => c.classId === "scholars")?.count ?? 0;
    const farms = p.buildings.filter((b) => b.defId === "farm").length;
    const field = {
      agriBase: p.agriBase,
      peasantCount: peasants,
      terrain: p.terrain,
      agriLv: nation.tech.agri,
      farmCount: farms
    };
    const harvest = computeFood(field);
    foodProduced += harvest;
    if (p.priorAgriBase !== void 0) {
      const gain = harvest - computeFood({ ...field, agriBase: p.priorAgriBase });
      harvests.push({ provinceId: p.id, food: gain * (nation.policyMods?.foodOutputMod ?? 1) });
    }
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
  foodProduced = (foodProduced + buildingYields.food) * (nation.policyMods?.foodOutputMod ?? 1);
  wood += buildingYields.wood;
  iron += buildingYields.iron;
  dInfluence += buildingYields.influence;
  if (nation.civilWar?.active) taxIncome *= 0.7;
  const corruptionLoss = computeCorruptionLoss(taxIncome, nation.government.corruption);
  const netTax = taxIncome - corruptionLoss;
  const cm = nationalCharacterMods(nation.activeCharacterBonuses);
  const marketCount = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === "market").length, 0);
  let tradeDeals = 0;
  let tradeDepSafety = 1;
  for (const r of relations) {
    if (r.from !== nation.id || r.treaty !== "trade") continue;
    tradeDeals++;
    if (r.relation < 0) tradeDepSafety = Math.min(tradeDepSafety, 1 - r.tradeDep / 200);
  }
  const tradeMod = cm.tradeMod ?? 1;
  const baseTrade = 80 + nation.tech.admin * 20;
  let tradeIncome = computeTrade({
    baseTrade,
    marketCount,
    tradeDealCount: tradeDeals,
    tradeMod,
    tradeDepSafety: Math.max(0.5, tradeDepSafety)
  });
  const govDef = GOVERNMENTS[nation.government.type];
  const shipments = [];
  const armySize2 = nation.army.reduce((s, a) => s + a.size, 0);
  const milCostMult = nation.tier === "D" ? 0.25 : 0.5;
  const militaryExpense = armySize2 * milCostMult;
  const subsidy = nation.tier === "D" ? 8 : 0;
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const foodMilConsume = nation.tier === "D" ? armySize2 * 0.1 : totalPop < 50 ? 0 : armySize2 * 0.5;
  const civilianRations = totalPop * 0.1;
  const foodConsumed = foodMilConsume + civilianRations;
  const routes = operatingRoutes(nation, state);
  const imports = routes.reduce((sum, def) => sum + Math.max(0, def.yield.food ?? 0), 0);
  foodProduced += imports;
  const receipts = foodProduced + subsidy;
  let routeInfluence = 0, exports = 0;
  for (const def of routes) {
    const yields = tradeRouteYield(def, nation);
    if (yields.food < 0) {
      const available = Math.max(0, Math.floor(nation.resources.food + receipts - foodConsumed - exports));
      const delivered = Math.min(available, -yields.food);
      const fulfilled = delivered / -yields.food;
      yields.food = -delivered;
      yields.gold *= fulfilled;
      yields.influence = Math.floor(yields.influence * fulfilled);
      exports += delivered;
    }
    tradeIncome += yields.gold;
    routeInfluence += yields.influence;
    const opening = nation.activeTradeRoutes.find((r) => r.routeId === def.id);
    shipments.push({ routeId: def.id, ...yields, opened: opening?.establishedTurn === state.turn - 1 });
  }
  let contract;
  const agreement = nation.grainContract;
  if (agreement) {
    const partner = state.nations[agreement.partnerId];
    const atWar2 = relations.some((r) => r.from === nation.id && r.to === agreement.partnerId && r.treaty === "war");
    const trading = partner && !partner.defeated && !atWar2;
    const available = Math.max(0, Math.floor(nation.resources.food + receipts - foodConsumed - exports));
    const delivered = trading ? Math.min(available, agreement.quantity) : 0;
    contract = {
      partnerId: agreement.partnerId,
      food: -delivered,
      gold: 2 * delivered,
      yearsLeft: trading ? Math.max(0, agreement.yearsLeft - 1) : 0
    };
    tradeIncome += contract.gold;
    exports += delivered;
  }
  const income = netTax + tradeIncome + buildingIncome;
  const dGold = income + Math.round(income * (cm.goldMod ?? 0) / 100) + subsidy - militaryExpense;
  dInfluence += routeInfluence + nation.tech.culture * 0.5 * (nation.policyMods?.influenceMod ?? 1);
  const researchProduced = computeSciPt(scholars, 0, false) + buildingYields.sciPt;
  const finalAdminPt = 3 + Math.floor(nation.government.efficiency / 25) + buildingYields.adminPt;
  const netFood = receipts - foodConsumed - exports;
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
    ...shipments.length || harvests.length || contract ? { economicReturns: { ...contract && { contract }, routes: shipments, harvests, grainBalance: netFood } } : {},
    grain: {
      exports,
      receipts,
      civilianRations,
      armyRations: foodMilConsume,
      net: netFood,
      shortageExpected: nation.resources.food + netFood < totalPop * 0.4
    },
    delta: {
      gold: Math.max(-50 - nation.resources.gold, dGold),
      wood,
      iron,
      influence: dInfluence,
      adminPt: finalAdminPt - nation.resources.adminPt,
      // 覆写转 delta
      sciPt: Math.round(researchProduced * (cm.sciPtMod ?? 1) * (govDef?.perTurn?.sciPtMod ?? 1)),
      supply: buildingYields.supply,
      food: netFood
    }
  };
}
function applyEconomyResult(nation, result) {
  const contract = result.economicReturns?.contract;
  if (contract && nation.grainContract) {
    if (contract.yearsLeft === 0) delete nation.grainContract;
    else nation.grainContract = { ...nation.grainContract, yearsLeft: contract.yearsLeft };
  }
  nation.resources.gold += result.delta.gold;
  nation.resources.food += result.delta.food;
  nation.resources.wood += result.delta.wood;
  nation.resources.iron += result.delta.iron;
  nation.resources.influence += result.delta.influence;
  nation.resources.adminPt += result.delta.adminPt;
  nation.resources.sciPt += result.delta.sciPt;
  nation.resources.supply += result.delta.supply;
}
function openingBlocker(nation, def, state) {
  if (nation.activeTradeRoutes.some((r) => r.routeId === def.id)) return "\u5DF2\u5EFA\u7ACB";
  const blocked = routeAccessBlocker(def, state, nation);
  if (blocked) return blocked;
  if (nation.tech.admin < def.prereqAdminLevel) return `\u9700\u884C\u653FLv${def.prereqAdminLevel}`;
  return nation.resources.gold < def.costGold ? "\u91D1\u4E0D\u8DB3" : null;
}
function establishTradeRoute(nation, routeId, state) {
  const def = tradeOffers(state, nation).find((r) => r.id === routeId);
  if (!def) return { ok: false, reason: "\u8DEF\u7EBF\u4E0D\u5B58\u5728" };
  const blocker = openingBlocker(nation, def, state);
  if (blocker) return { ok: false, reason: blocker };
  nation.resources.gold -= def.costGold;
  nation.activeTradeRoutes.push({ routeId, establishedTurn: state.turn });
  return { ok: true, routeName: def.name };
}
function tradeRouteYield(def, nation) {
  const government = nation && GOVERNMENTS[nation.government.type];
  const character = nation && nationalCharacterMods(nation.activeCharacterBonuses);
  const multiplier = LENGTH_MOD[def.length] * (government?.perTurn?.tradeMod ?? 1) * (character?.tradeMod ?? 1);
  return { gold: def.yield.gold * multiplier, influence: def.yield.influence, food: def.yield.food ?? 0 };
}
function canAfford(nation, gold, wood = 0, iron = 0) {
  return nation.resources.gold >= gold && nation.resources.wood >= wood && nation.resources.iron >= iron;
}
function spend(nation, gold, wood = 0, iron = 0) {
  nation.resources.gold -= gold;
  nation.resources.wood -= wood;
  nation.resources.iron -= iron;
}

// src/engine/population.ts
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
  const result = settlePopulationPure(nation, provinces, foodShortage, tradeFree, atWar2, warWonRecent);
  for (const p of provinces) {
    setProvincePopulation(p, p.population + result.popDelta[p.id]);
    for (const group of p.classes) group.satisfaction += result.classSatDelta[p.id][group.classId];
  }
  for (const faction of nation.factions) faction.satisfaction = result.factionSatFinal[faction.id] ?? faction.satisfaction;
  return result;
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
  const growthMod = (nationalCharacterMods(nation.activeCharacterBonuses).popGrowthMod ?? 1) * (nation.policyMods?.popGrowthMod ?? 1);
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
      growthMod
    });
    const newPop = p.terrain === "ocean" ? 0 : Math.max(10, Math.round(p.population + delta));
    popDelta[p.id] = newPop - p.population;
    totalGrowth += popDelta[p.id];
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
      const newSat = clamp(grp.satisfaction + d, 0, 100);
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
    let avgSum = 0, cnt = 0;
    for (const p of provinces) {
      const newSat = classSatNew[p.id]?.[fid];
      if (newSat !== void 0) {
        avgSum += newSat;
        cnt++;
      }
    }
    if (!cnt) continue;
    const current2 = factionSatFinal[factionId] ?? faction.satisfaction;
    factionSatFinal[factionId] = clamp(current2 + (avgSum / cnt - current2) * 0.3, 0, 100);
  }
  return { totalGrowth, classSatChanges, popDelta, classSatDelta, factionSatFinal };
}

// src/data/terrain.ts
var TERRAIN_LABELS = {
  plain: "\u5E73\u539F",
  hill: "\u4E18\u9675",
  mountain: "\u5C71\u5730",
  coast: "\u6D77\u5CB8",
  forest: "\u68EE\u6797",
  desert: "\u6C99\u6F20",
  tundra: "\u82D4\u539F",
  jungle: "\u4E1B\u6797",
  swamp: "\u6CBC\u6CFD",
  ocean: "\u6D77\u6D0B",
  island: "\u5C9B\u5C7F"
};
function terrainLabel(terrain) {
  return TERRAIN_LABELS[terrain] ?? terrain;
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
function relationPair2(state, left, right) {
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
  const relations = initiator && target ? relationPair2(state, initiatorId, targetId) : null;
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
  const willingness = clamp(Math.round(38 + factors.reduce((sum, entry) => sum + entry.value, 0)), 0, 100);
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
  const score = clamp(preview.willingness + Math.floor(rng() * 17) - 8, 0, 100);
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
  const pair = relationPair2(state, resolution.record.initiatorId, resolution.record.targetId);
  if (pair) {
    for (const relation of pair) {
      relation.relation = clamp(relation.relation + resolution.relationDelta, -100, 100);
      relation.trust = clamp(relation.trust + resolution.trustDelta, 0, 100);
      relation.threat = clamp(relation.threat + resolution.threatDelta, 0, 100);
      relation.tradeDep = clamp(relation.tradeDep + resolution.tradeDepDelta, 0, 100);
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
  const pair = relationPair2(state, accord.partyA, accord.partyB);
  if (!pair) return;
  for (const relation of pair) {
    const min = field === "relation" ? -100 : 0;
    relation[field] = clamp(relation[field] + amount, min, 100);
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
function warDeclarationBlocker(state, from, to) {
  const attacker = state.nations[from], defender = state.nations[to];
  if (from === to || !attacker || !defender || attacker.defeated || defender.defeated) return "\u5BA3\u6218\u76EE\u6807\u65E0\u6548";
  const pair = relationPair(state, from, to);
  if (!pair) return "\u7F3A\u5C11\u5916\u4EA4\u5173\u7CFB\u6570\u636E";
  if (pair.some((r) => r.treaty === "alliance")) return "\u4E0D\u80FD\u5411\u76DF\u53CB\u5BA3\u6218";
  if (pair.some((r) => r.treaty === "truce" && r.truceTurns > 0)) return "\u505C\u6218\u671F\u5185\u4E0D\u80FD\u5BA3\u6218";
  if (hasActiveNonAggressionAccord(state, from, to)) return "\u53CC\u65B9\u4ECD\u53D7\u4E0D\u4FB5\u72AF\u534F\u8BAE\u7EA6\u675F";
  if (state.wars.some((w) => w.attackerId === from && w.defenderId === to || w.attackerId === to && w.defenderId === from)) return "\u53CC\u65B9\u5DF2\u7ECF\u5904\u4E8E\u6218\u4E89\u4E2D";
  return null;
}
function declareWar(state, attackerId, defenderId, targetProvinceId) {
  if (state.provinces[targetProvinceId]?.ownerId !== defenderId || warDeclarationBlocker(state, attackerId, defenderId)) return null;
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
  for (const r of relationPair(state, attackerId, defenderId)) {
    r.treaty = "war";
    r.relation = -100;
    r.truceTurns = 0;
  }
  state.nations[attackerId].atWar = true;
  state.nations[defenderId].atWar = true;
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
  relocateArmy(state, nation, army, toProvinceId);
  return { ok: true };
}
function relocateArmy(state, nation, army, destination) {
  if (army.location === destination) return;
  const dest = nation.army.find((a) => a.location === destination);
  if (!dest) {
    const moved = { ...army, id: allocateEntityId(state, "army"), location: destination };
    nation.army = [...nation.army.filter((a) => a.id !== army.id), moved];
    return;
  }
  const total = dest.size + army.size;
  for (const field of ["morale", "training", "equipment", "supply"]) {
    dest[field] = Math.round((dest[field] * dest.size + army[field] * army.size) / Math.max(1, total));
  }
  dest.size = total;
  nation.army = nation.army.filter((a) => a.id !== army.id);
}
function makePeace(state, war) {
  const current2 = state.wars.find((w) => w.id === war.id);
  if (!current2) return;
  const result = emptyWarResult();
  const outcome = current2.progress >= 60 ? "attacker" : current2.progress <= 40 ? "defender" : "draw";
  finishWar(state, result, current2, outcome, current2.progress);
  finalizeWars(state, result);
  applySettleWarsResult(state, result);
}
function emptyWarResult() {
  return { warUpdates: {}, peaceWarIds: [], armyFinals: {}, provFinals: {}, nationDeltas: {}, relationFinals: {}, newChronicle: [], atWarClear: [] };
}
function projectedOwner(result, province) {
  return result.provFinals[province.id]?.ownerId ?? province.ownerId;
}
function nationDelta(result, id) {
  return result.nationDeltas[id] ??= { goldDelta: 0, foodDelta: 0 };
}
function chargeWarCost(res, nation, size) {
  const cost = warCostPerTurn(size);
  const delta = nationDelta(res, nation.id);
  delta.goldDelta -= cost.gold;
  delta.foodDelta -= cost.food;
  delta.warExhaustionFinal = clamp((delta.warExhaustionFinal ?? nation.warExhaustion) + cost.exhaustionDelta, 0, 100);
  return { cost, delta };
}
function frontArmy(result, nation, onFront) {
  const changes = result.nationDeltas[nation.id];
  for (const army of nation.army) {
    const location = changes?.armyLocationOverrides?.[army.id] ?? army.location;
    if (!onFront(location) || changes?.armyRemovals?.includes(army.id)) continue;
    const final = result.armyFinals[`${nation.id}:${army.id}`];
    if ((final?.size ?? army.size) > 0) return { ...army, ...final, location };
  }
}
function cedeProvince(state, res, target, attacker, defender, war) {
  const changes = nationDelta(res, defender.id);
  res.provFinals[target.id] = { ownerId: attacker.id, loyalty: 30, assimilation: 20, unrest: 40, garrison: 0, isCapital: false };
  const remaining = Object.values(state.provinces).filter((p) => projectedOwner(res, p) === defender.id);
  const capital = changes.capital ?? defender.capital;
  const fallback = remaining.find((p) => target.adjacent.includes(p.id)) ?? remaining.find((p) => p.id === capital) ?? remaining[0];
  res.newChronicle.push({
    id: `peace_win_${war.id}_${state.turn}`,
    turn: state.turn,
    kind: "milestone_war",
    title: `${attacker.name} \u653B\u5360 ${target.name}`,
    desc: `${defender.name} \u5272\u8BA9 ${target.name}\u3002`,
    actorId: attacker.id
  });
  if (!fallback) {
    changes.defeated = true;
    if (attacker.isPlayer || state.sharedChronicles) res.newChronicle.push({
      turn: state.turn,
      kind: "victory",
      title: `\u706D ${defender.name}`,
      desc: `${defender.name} \u56FD\u795A\u7EC8\u7EDD\uFF0C\u6211\u519B\u653B\u4E0B\u5176\u6700\u540E\u4E00\u7701${target.name}\u3002`,
      actorId: attacker.id
    });
  } else if (capital === target.id) {
    changes.capital = fallback.id;
    (res.provFinals[fallback.id] ??= {}).isCapital = true;
  }
  for (const army of defender.army) {
    const location = changes.armyLocationOverrides?.[army.id] ?? army.location;
    if (fallback && location !== target.id) continue;
    if (fallback) (changes.armyLocationOverrides ??= {})[army.id] = fallback.id;
    else {
      (changes.armyRemovals ??= []).push(army.id);
      res.newChronicle.push({
        id: `orphan_disband_${army.id}_${state.turn}`,
        turn: state.turn,
        kind: "milestone_war",
        title: "\u6B8B\u519B\u6E83\u6563",
        desc: `${defender.name} \u5728 ${target.name} \u7684\u9A7B\u519B\u56E0\u65E0\u672C\u571F\u53EF\u64A4\uFF0C\u6E83\u6563\u6D88\u5931\u3002`,
        actorId: defender.id
      });
    }
  }
}
function objectiveIsValid(state, res, war) {
  const target = state.provinces[war.targetProvinceId];
  return !!target && projectedOwner(res, target) === war.defenderId && [war.attackerId, war.defenderId].every((id) => state.nations[id] && !state.nations[id].defeated && !res.nationDeltas[id]?.defeated);
}
function finishWar(state, res, war, outcome, progress) {
  res.peaceWarIds.push(war.id);
  if (outcome !== "draw" && objectiveIsValid(state, res, war)) {
    const attacker = state.nations[war.attackerId], defender = state.nations[war.defenderId];
    const a = nationDelta(res, attacker.id), d = nationDelta(res, defender.id);
    if (outcome === "attacker") {
      cedeProvince(state, res, state.provinces[war.targetProvinceId], attacker, defender, war);
      const tribute = Math.min(Math.max(0, defender.resources.gold + d.goldDelta), 100 + progress);
      d.goldDelta -= tribute;
      a.goldDelta += tribute;
    } else {
      const indemnity = Math.min(Math.max(0, attacker.resources.gold + a.goldDelta), 80);
      a.goldDelta -= indemnity;
      d.goldDelta += indemnity;
      a.warExhaustionFinal = clamp((a.warExhaustionFinal ?? attacker.warExhaustion) + 10, 0, 100);
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
  for (const relation of relationPair(state, war.attackerId, war.defenderId) ?? []) {
    res.relationFinals[`${relation.from}->${relation.to}`] = { treaty: "truce", truceTurns: 10, relation: -45, trust: Math.min(clamp(relation.trust - 20, 0, 100), 25) };
  }
}
function finalizeWars(state, res) {
  const ended = new Set(res.peaceWarIds);
  const stillFighting = /* @__PURE__ */ new Set();
  for (const war of state.wars) {
    if (ended.has(war.id)) continue;
    if (!objectiveIsValid(state, res, war)) finishWar(state, res, war, "draw", war.progress);
    else {
      stillFighting.add(war.attackerId);
      stillFighting.add(war.defenderId);
    }
  }
  res.atWarClear = Object.keys(state.nations).filter((id) => !stillFighting.has(id));
}
function settleWarsPure(state) {
  const res = emptyWarResult();
  for (const war of state.wars) {
    const newTurns = war.turns + 1;
    const attacker = state.nations[war.attackerId];
    const defender = state.nations[war.defenderId];
    if (!objectiveIsValid(state, res, war)) {
      finishWar(state, res, war, "draw", war.progress);
      continue;
    }
    const prov = state.provinces[war.targetProvinceId];
    const attackerArmy = frontArmy(res, attacker, (id) => id === prov.id || prov.adjacent.includes(id) && !!state.provinces[id] && projectedOwner(res, state.provinces[id]) === attacker.id);
    const defenderArmy = frontArmy(res, defender, (id) => id === prov.id);
    if (!attackerArmy) {
      finishWar(state, res, war, "defender", war.progress);
      continue;
    }
    const garrison = res.provFinals[prov.id]?.garrison ?? prov.garrison;
    const terrain = prov?.terrain ?? "plain";
    const terrainMod = TERRAIN_COMBAT_MOD[terrain];
    const attPower = computeCombat({
      army: attackerArmy,
      milLv: attacker.tech.mil,
      general: attacker.ruler.ability,
      terrainMod
    }) * (nationalCharacterMods(attacker.activeCharacterBonuses).combatMod ?? 1) * (attacker.policyMods?.combatMod ?? 1);
    const defPower = defenderArmy ? computeCombat({
      army: defenderArmy,
      milLv: defender.tech.mil,
      general: defender.ruler.ability,
      terrainMod: terrainMod * 1.1
    }) * (nationalCharacterMods(defender.activeCharacterBonuses).combatMod ?? 1) * (defender.policyMods?.combatMod ?? 1) : garrison * 0.5;
    const result = resolveBattle(attPower, defPower, attackerArmy.size, defenderArmy?.size ?? garrison);
    const newProgress = clamp(war.progress + result.progressDelta, 0, 100);
    const reports = war.battleReports?.slice(-19) ?? [];
    const outcome = result.progressDelta > 5 ? "advance" : result.progressDelta < -5 ? "repelled" : "stalemate";
    const provName = prov?.name ?? war.targetProvinceId;
    const narrative = outcome === "advance" ? `\u7B2C${newTurns}\u5E74\uFF0C\u6211\u519B\u4E8E${provName}${terrainLabel(terrain)}\u63A8\u8FDB\uFF0C\u65A9\u654C${Math.round(result.defenderLoss)}\uFF0C\u58EB\u6C14\u5927\u632F\u3002` : outcome === "repelled" ? `\u7B2C${newTurns}\u5E74\uFF0C${provName}\u653B\u52BF\u53D7\u632B\uFF0C\u6298\u635F${Math.round(result.attackerLoss)}\u4EBA\uFF0C\u654C\u9635\u7A33\u56FA\u3002` : `\u7B2C${newTurns}\u5E74\uFF0C${provName}\u6218\u4E8B\u80F6\u7740\uFF0C\u53CC\u65B9\u5404\u6298${Math.round(result.attackerLoss)}\u3001${Math.round(result.defenderLoss)}\u4EBA\u3002`;
    reports.push({
      turn: state.turn,
      attSize: attackerArmy.size,
      defSize: defenderArmy?.size ?? garrison,
      attLoss: Math.round(result.attackerLoss),
      defLoss: Math.round(result.defenderLoss),
      progressDelta: Math.round(result.progressDelta),
      outcome,
      narrative
    });
    res.warUpdates[war.id] = { turns: newTurns, progress: newProgress, battleReports: reports };
    let attSizeAfterBattle = Math.max(0, Math.round(attackerArmy.size - result.attackerLoss));
    const attMoraleAfter = clamp(attackerArmy.morale + result.attackerMoraleDelta, 0, 100);
    if (defenderArmy) {
      res.armyFinals[`${defender.id}:${defenderArmy.id}`] = {
        size: Math.max(0, Math.round(defenderArmy.size - result.defenderLoss)),
        morale: clamp(defenderArmy.morale + result.defenderMoraleDelta, 0, 100)
      };
    } else if (prov) {
      res.provFinals[prov.id] = { ...res.provFinals[prov.id], garrison: Math.max(0, garrison - Math.round(result.defenderLoss)) };
    }
    const { cost, delta } = chargeWarCost(res, attacker, attSizeAfterBattle);
    delta.stabilityFinal = clamp((delta.stabilityFinal ?? attacker.government.stability) + cost.stabilityDelta, 0, 100);
    attSizeAfterBattle = Math.max(0, Math.round(attSizeAfterBattle - cost.attrition));
    res.armyFinals[`${attacker.id}:${attackerArmy.id}`] = { size: attSizeAfterBattle, morale: attMoraleAfter };
    const defenderSizeAfterBattle = defenderArmy ? res.armyFinals[`${defender.id}:${defenderArmy.id}`]?.size ?? defenderArmy.size : res.provFinals[prov?.id ?? ""]?.garrison ?? prov?.garrison ?? 0;
    chargeWarCost(res, defender, defenderSizeAfterBattle);
    const defendersGone = !frontArmy(res, defender, (id) => id === prov.id) && (res.provFinals[prov.id]?.garrison ?? garrison) <= 0;
    if (attSizeAfterBattle > 0 && (newProgress >= 100 || defendersGone)) finishWar(state, res, war, "attacker", newProgress);
    else if (attSizeAfterBattle === 0 || newProgress === 0 && result.progressDelta < 0) finishWar(state, res, war, "defender", newProgress);
  }
  finalizeWars(state, res);
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
    if (army) {
      if (final.size > 0) Object.assign(army, final);
      else nation.army = nation.army.filter((a) => a.id !== army.id);
    }
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
    if (delta.capital !== void 0) nation.capital = delta.capital;
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
    const relation = findRelation(state.relations, key.slice(0, separator), key.slice(separator + 2));
    if (relation) Object.assign(relation, final);
  }
  for (const entry of result.newChronicle) addChronicle(state, entry);
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
  setProvincePopulation(province, province.population - actualCount);
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
function settleDiplomacy(state) {
  const result = settleDiplomacyPure(state);
  for (const r of state.relations) Object.assign(r, result.relationsFinal[`${r.from}_${r.to}`]);
  for (const [id, final] of Object.entries(result.nationsGovFinal)) Object.assign(state.nations[id].government, final);
  for (const entry of result.newChronicle) addChronicle(state, entry);
}
function peacefulRelationPair(state, from, to) {
  if (from === to || !state.nations[to] || state.nations[to].defeated) return null;
  const pair = relationPair(state, from, to);
  return pair?.every((r) => r.treaty !== "war" && r.treaty !== "truce") ? pair : null;
}
function settleDiplomacyPure(state) {
  const counts = /* @__PURE__ */ new Map();
  const neighbors = /* @__PURE__ */ new Map();
  for (const p of Object.values(state.provinces)) {
    counts.set(p.ownerId, (counts.get(p.ownerId) ?? 0) + 1);
    let borders = neighbors.get(p.ownerId);
    if (!borders) {
      borders = /* @__PURE__ */ new Set();
      neighbors.set(p.ownerId, borders);
    }
    for (const id of p.adjacent) {
      const owner = state.provinces[id]?.ownerId;
      if (owner && owner !== p.ownerId) borders.add(owner);
    }
  }
  const armies = new Map(Object.values(state.nations).map((n3) => [n3.id, n3.army.reduce((sum, a) => sum + a.size, 0)]));
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
  for (const r of state.relations) {
    let finalTruceTurns = r.truceTurns;
    let finalTreaty = r.treaty;
    if (r.treaty === "truce") {
      finalTruceTurns = Math.max(0, r.truceTurns - 1);
      if (finalTruceTurns === 0) finalTreaty = "none";
    }
    const borderClash = neighbors.get(r.from)?.has(r.to) ?? false;
    const fromOps = warOpponents.get(r.from);
    const toOps = warOpponents.get(r.to);
    const atWarWithEachOther = !!fromOps?.has(r.to);
    const commonEnemy = atWarWithEachOther ? false : !!(fromOps && toOps && [...fromOps].some((o) => toOps.has(o)));
    const fromMil = armies.get(r.from), toMil = armies.get(r.to);
    const finalThreat = fromMil === void 0 || toMil === void 0 ? r.threat : computeThreat(fromMil, toMil, counts.get(r.to) ?? 0, r.relation);
    let finalRelation = r.relation;
    if (finalTreaty !== "war") {
      const d = relationDrift(finalTreaty, borderClash, finalThreat, commonEnemy);
      finalRelation = clamp(r.relation + d, -100, 100);
    }
    relationsFinal[relKey(r)] = { threat: finalThreat, relation: finalRelation, truceTurns: finalTruceTurns, treaty: finalTreaty };
  }
  const threatThreshold = 70;
  const coalitionMin = 3;
  for (const nation of Object.values(state.nations)) {
    if (nation.defeated) continue;
    const neighborIds = neighbors.get(nation.id);
    if (!neighborIds) continue;
    let resisters = 0;
    const resisterIds = [];
    for (const nid of neighborIds) {
      if (nid === "rebel" || state.nations[nid]?.rebelOf) continue;
      const rf = relationsFinal[`${nid}_${nation.id}`];
      if (rf && rf.threat >= threatThreshold) {
        resisters++;
        resisterIds.push(nid);
      }
    }
    if (resisters >= coalitionMin) {
      nationsGovFinal[nation.id] = {
        stability: clamp(nation.government.stability - 5, 0, 100),
        legitimacy: clamp(nation.government.legitimacy - 3, 0, 100)
      };
      for (const nid of resisterIds) {
        const rf = relationsFinal[`${nid}_${nation.id}`];
        if (rf) {
          rf.relation = clamp(rf.relation - 10, -100, 100);
          rf.threat = clamp(rf.threat + 5, 0, 100);
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
  const result = settleTechnologyPure(nation, state);
  nation.resources.sciPt += result.deltaSciPt;
  nation.resources.gold += result.deltaGold;
  nation.tech.researchProgress = result.researchProgressFinal;
  if (result.techLevelUp) nation.tech[result.techLevelUp.branch] = result.techLevelUp.level;
}
function instantResearchBlocker(nation, tech) {
  if (nation.tech[tech.branch] >= tech.level) return "\u5DF2\u5B66";
  const prereq = tech.prereqTech && TECH_BY_ID[tech.prereqTech];
  if (nation.tech[tech.branch] + 1 !== tech.level || prereq && nation.tech[prereq.branch] < prereq.level) return "\u9501\u5B9A";
  if (nation.tech.researchProgress) return "\u7814\u53D1\u4E2D";
  if (nation.resources.sciPt < tech.costSci) return "\u79D1\u7814\u4E0D\u8DB3";
  if (nation.resources.gold < tech.costGold) return "\u91D1\u4E0D\u8DB3";
  if (nation.resources.adminPt < 1) return "\u884C\u52A8\u70B9\u4E0D\u8DB3\uFF08\u9700 1\uFF09";
  return null;
}
function startResearch(nation, techId) {
  const tech = TECH_BY_ID[techId];
  if (!tech) return { ok: false, reason: "\u79D1\u6280\u4E0D\u5B58\u5728" };
  if (nation.tech[tech.branch] >= tech.level) return { ok: false, reason: "\u5DF2\u7814\u53D1" };
  if (tech.prereqTech) {
    const pre = TECH_BY_ID[tech.prereqTech];
    if (pre && nation.tech[pre.branch] < pre.level) return { ok: false, reason: "\u7F3A\u5C11\u524D\u7F6E" };
  }
  if (nation.tech.researchProgress) return { ok: false, reason: "\u6B63\u5728\u7814\u53D1\u5176\u4ED6" };
  nation.tech.researchProgress = { techId, sciPtInvested: 0 };
  return { ok: true };
}
function settleTechnologyPure(nation, _state) {
  const progress = nation.tech.researchProgress;
  const tech = progress && TECH_BY_ID[progress.techId];
  if (!progress || !tech || nation.tech[tech.branch] >= tech.level) {
    return { deltaSciPt: 0, deltaGold: 0, researchProgressFinal: null, techLevelUp: null };
  }
  const invested = Math.min(tech.costSci, Math.max(0, Number.isFinite(progress.sciPtInvested) ? progress.sciPtInvested : 0));
  const invest = Math.min(Math.max(0, nation.resources.sciPt), tech.costSci - invested);
  const newInvested = invested + invest;
  if (newInvested >= tech.costSci && nation.resources.gold >= tech.costGold) {
    return {
      deltaSciPt: -invest,
      deltaGold: -tech.costGold,
      researchProgressFinal: null,
      // 完成，清空
      techLevelUp: { branch: tech.branch, level: tech.level }
    };
  }
  return {
    deltaSciPt: -invest,
    deltaGold: 0,
    researchProgressFinal: { techId: tech.id, sciPtInvested: newInvested },
    techLevelUp: null
  };
}

// src/engine/culture.ts
function settleCulture(nation, state, provs, provFinal) {
  const triggered = [];
  const culturePolicy = "assimilate";
  const religionPolicy = "tolerant";
  const capital = state.provinces[nation.capital];
  const cultureTechBonus = nation.tech.culture * 0.5 + (nation.policyMods?.assimilationMod ?? 0);
  for (const p of provs) {
    const cultureDiff = !!capital && p.culture !== capital.culture;
    const religionDiff = !!capital && p.religion !== capital.religion;
    const farFromCapital = !capital || p.id !== capital.id && !capital.adjacent.includes(p.id) && !capital.adjacent.some((id) => state.provinces[id]?.adjacent.includes(p.id));
    const dAssim = assimilationDelta(
      p.buildings.filter((b) => b.defId === "road").length,
      culturePolicy,
      nation.government.efficiency,
      cultureDiff,
      farFromCapital
    ) + cultureTechBonus;
    const finalAssim = clamp(p.assimilation + dAssim, 0, 100);
    const dLoy = loyaltyDelta(
      nation.government.stability,
      finalAssim,
      p.garrison > 0,
      p.unrest,
      nation.activeCharacterBonuses.includes("welfare")
    );
    const finalLoy = clamp(p.loyalty + dLoy, 0, 100);
    const finalReb = clamp(computeRebellion({
      unrest: p.unrest,
      cultureDiff,
      religionDiff,
      religionPolicy,
      garrison: p.garrison,
      stability: nation.government.stability
    }), 0, 100);
    if (provFinal) provFinal[p.id] = { assimilation: finalAssim, loyalty: finalLoy, rebellionRisk: finalReb };
    else {
      p.assimilation = finalAssim;
      p.loyalty = finalLoy;
      p.rebellionRisk = finalReb;
    }
    if (finalReb >= 100 && p.garrison === 0) triggered.push(p.id);
  }
  return triggered;
}
function settleCultureReligion(nation, state, provs = provincesOf(nation.id, state.provinces)) {
  return { rebellionTriggered: settleCulture(nation, state, provs) };
}
function settleCultureReligionPure(nation, state, provs = provincesOf(nation.id, state.provinces)) {
  const provFinal = {};
  return { rebellionTriggered: settleCulture(nation, state, provs, provFinal), provFinal };
}

// src/engine/events.ts
function matchesTurnAndWar(trigger, turn, atWar2) {
  return (trigger.minTurn === void 0 || turn >= trigger.minTurn) && (trigger.maxTurn === void 0 || turn <= trigger.maxTurn) && !(trigger.atWar && !atWar2) && !(trigger.notAtWar && atWar2);
}
function meetsNationRequirements(trigger, nation, state, owned) {
  if (trigger.isPlayerOnly && nation.id !== state.playerNationId) return false;
  if (trigger.minGold !== void 0 && nation.resources.gold < trigger.minGold) return false;
  if (trigger.minStability !== void 0 && nation.government.stability < trigger.minStability) return false;
  if (trigger.maxStability !== void 0 && nation.government.stability > trigger.maxStability) return false;
  if (trigger.maxLegitimacy !== void 0 && nation.government.legitimacy > trigger.maxLegitimacy) return false;
  if (trigger.maxFoodRatio !== void 0) {
    const totalPop = (owned ?? provincesOf(nation.id, state.provinces)).reduce((s, p) => s + p.population, 0);
    const ratio = totalPop > 0 ? nation.resources.food / (totalPop * 0.8) : 1;
    if (ratio > trigger.maxFoodRatio) return false;
  }
  if (trigger.minCorruption !== void 0 && nation.government.corruption < trigger.minCorruption) return false;
  if (trigger.minWarExhaustion !== void 0 && nation.warExhaustion < trigger.minWarExhaustion) return false;
  if (trigger.hasNewTerritory) {
    const cap = state.provinces[nation.capital];
    const hasNew = (owned ?? provincesOf(nation.id, state.provinces)).some(
      (p) => cap && p.id !== nation.capital && (p.culture !== cap.culture || p.religion !== cap.religion || p.assimilation < 80)
    );
    if (!hasNew) return false;
  }
  if (trigger.provinceCultureDiff) {
    const hasDiff = (owned ?? provincesOf(nation.id, state.provinces)).some((p) => {
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
function indexCooldown(index, nationId, entry) {
  let cooldowns = index.cooldownByNation.get(nationId);
  if (!cooldowns) {
    cooldowns = /* @__PURE__ */ new Map();
    index.cooldownByNation.set(nationId, cooldowns);
  }
  const previous = cooldowns.get(entry.eventId);
  if (previous) previous.otherLastTurn = Math.max(previous.otherLastTurn, entry.lastTriggeredTurn);
  else cooldowns.set(entry.eventId, { first: entry, otherLastTurn: -Infinity });
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
    indexCooldown(index, entry.nationId ?? state.playerNationId, entry);
  }
  return index;
}
function isEventAvailable(event, nation, state, availability = createEventAvailabilityIndex(state)) {
  return availableInHistory(event, state.turn, availability.cooldownByNation.get(nation.id), availability.triggeredByNation.get(nation.id));
}
function availableInHistory(event, turn, cooldowns, triggered) {
  const cooldown = cooldowns?.get(event.id);
  if (event.unique && (cooldown !== void 0 || triggered?.has(event.id))) return false;
  if (cooldown && turn - Math.max(cooldown.first.lastTriggeredTurn, cooldown.otherLastTurn) < event.cooldown) return false;
  return true;
}
var randomEvents = EVENTS.filter((event) => event.weight > 0);
var drawPools;
function eventPool(turn, atWar2) {
  if (drawPools?.turn !== turn) {
    drawPools = {
      turn,
      war: randomEvents.filter((event) => matchesTurnAndWar(event.trigger, turn, true)),
      peace: randomEvents.filter((event) => matchesTurnAndWar(event.trigger, turn, false))
    };
  }
  return atWar2 ? drawPools.war : drawPools.peace;
}
function rollEvents(nation, state, rng, maxTrigger = 2, availability = createEventAvailabilityIndex(state), owned = provincesOf(nation.id, state.provinces)) {
  const candidates = [];
  const cooldowns = availability.cooldownByNation.get(nation.id);
  const triggered = availability.triggeredByNation.get(nation.id);
  for (const event of eventPool(state.turn, nation.atWar)) {
    if (!meetsNationRequirements(event.trigger, nation, state, owned)) continue;
    if (availableInHistory(event, state.turn, cooldowns, triggered)) candidates.push(event);
  }
  const out = [];
  while (out.length < maxTrigger && candidates.length) {
    const pick = pickWeightedEntry(rng, candidates);
    if (!pick) break;
    out.push(pick.id);
    if (out.length < maxTrigger) candidates.splice(candidates.indexOf(pick), 1);
  }
  return out;
}
function aiChooseOption(event, rng) {
  const items = event.options.map((o, i) => ({ item: i, weight: o.aiWeight ?? 1 }));
  const pick = weightedPick(rng, items);
  return pick ?? 0;
}
function resolvePendingEventsForAI(nation, state, rng, maxChain = 8, availability) {
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
    const option2 = event.options[optionIndex];
    if (option2) applyEffect(nation, option2.effects, state, availability);
    recordEvent(state, nation.id, event.id, optionIndex, availability);
    resolved.push(event.id);
  }
  state.pendingEvents = state.pendingEvents.filter((pending) => pending.nationId !== nation.id);
  return resolved;
}
function applyEffectPure(nation, effect, state, availability) {
  const res = {
    resourceDeltas: {},
    relationOverrides: {},
    factionSatFinals: {},
    provPopDeltas: {},
    newPendingEvents: []
  };
  if (effect.gold) res.resourceDeltas.gold = effect.gold;
  if (effect.food) res.resourceDeltas.food = effect.food;
  for (const key of ["wood", "iron", "influence", "adminPt", "sciPt"]) {
    const delta = effect[key];
    if (delta) res.resourceDeltas[key] = Math.max(delta, -nation.resources[key]);
  }
  if (effect.warExhaustion) res.warExhaustionFinal = clamp(nation.warExhaustion + effect.warExhaustion, 0, 100);
  if (effect.taxRate) res.taxRateFinal = clamp(nation.taxRate + effect.taxRate, 0, 0.5);
  if (effect.assimilationMod) {
    res.assimilationModFinal = (nation.policyMods?.assimilationMod ?? 0) + effect.assimilationMod;
  }
  const govF = {};
  if (effect.stability) govF.stability = clamp(nation.government.stability + effect.stability, 0, 100);
  if (effect.legitimacy) govF.legitimacy = clamp(nation.government.legitimacy + effect.legitimacy, 0, 100);
  if (effect.corruption) govF.corruption = clamp(nation.government.corruption + effect.corruption, 0, 100);
  if (effect.efficiency) govF.efficiency = clamp(nation.government.efficiency + effect.efficiency, 0, 100);
  if (Object.keys(govF).length > 0) res.govFinal = govF;
  if (effect.relation) {
    const r = getRelationObj(nation.id, effect.relation.target, state);
    if (r) res.relationOverrides[`${nation.id}->${effect.relation.target}`] = { relation: clamp(r.relation + effect.relation.delta, -100, 100) };
  }
  if (effect.factionSat) {
    for (const fr2 of effect.factionSat) {
      const f = nation.factions.find((x) => x.id === fr2.faction);
      if (f) res.factionSatFinals[fr2.faction] = clamp(f.satisfaction + fr2.delta, 0, 100);
    }
  }
  if (effect.population) {
    const provs = provincesOf(nation.id, state.provinces).filter((p) => p.terrain !== "ocean");
    const populationDelta = Math.round(effect.population);
    if (populationDelta < 0 && provs.length > 0) {
      let remaining = -populationDelta;
      const share = Math.floor(remaining / provs.length);
      const remainder = remaining % provs.length;
      if (provs.some((p, i) => p.population < share + (i < remainder ? 1 : 0))) {
        provs.sort((a, b) => a.population - b.population);
      }
      for (let index = 0; index < provs.length && remaining > 0; index += 1) {
        const province = provs[index];
        const take = Math.min(Math.max(0, province.population), Math.ceil(remaining / (provs.length - index)));
        if (take > 0) res.provPopDeltas[province.id] = -take;
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
    if (nextEv && !alreadyQueued && !alreadyResolvedThisTurn && (!nextEv.unique && !nextEv.cooldown || isEventAvailable(nextEv, nation, state, availability))) {
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
    if (province) setProvincePopulation(province, province.population + delta);
  }
  state.pendingEvents.push(...result.newPendingEvents);
}
function applyEffect(nation, effect, state, availability) {
  applyEffectResult(nation, state, applyEffectPure(nation, effect, state, availability));
}
function findCooldown(state, nationId, eventId, index) {
  return index ? index.cooldownByNation.get(nationId)?.get(eventId)?.first : state.eventCooldowns.find((entry) => entry.eventId === eventId && recordBelongsToNation(entry, nationId, state));
}
function recordEventPure(state, nationId, eventId, optionIndex, index) {
  const existing = findCooldown(state, nationId, eventId, index);
  return {
    newTriggeredEntry: { nationId, eventId, turn: state.turn, optionIndex },
    cooldownUpdate: { nationId, eventId, lastTriggeredTurn: state.turn, isNew: !existing }
  };
}
function applyRecordEventResult(state, result, index) {
  state.triggeredEvents.push(result.newTriggeredEntry);
  const update = result.cooldownUpdate;
  const existing = findCooldown(state, update.nationId, update.eventId, index);
  if (existing) {
    existing.nationId = update.nationId;
    existing.lastTriggeredTurn = update.lastTriggeredTurn;
  } else {
    const entry = { nationId: update.nationId, eventId: update.eventId, lastTriggeredTurn: update.lastTriggeredTurn };
    state.eventCooldowns.push(entry);
    if (index) indexCooldown(index, update.nationId, entry);
  }
}
function recordEvent(state, nationId, eventId, optionIndex, index) {
  applyRecordEventResult(state, recordEventPure(state, nationId, eventId, optionIndex, index), index);
}

// src/gameplay/warAssessment.ts
function clamp2(v, min = 0, max = 100) {
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
function warDiplomacy(state, attackerId) {
  const outgoing = /* @__PURE__ */ new Map();
  const allies = /* @__PURE__ */ new Map();
  for (const relation of state.relations) {
    if (relation.from === attackerId && !outgoing.has(relation.to)) outgoing.set(relation.to, relation);
    if (relation.treaty === "alliance" && relation.relation >= 50) allies.set(relation.to, (allies.get(relation.to) ?? 0) + 1);
  }
  return { outgoing, allies };
}
function borderAccess(state, attackerId, target) {
  return target?.adjacent.some((id) => state.provinces[id]?.ownerId === attackerId) ?? false;
}
function supplyScore(attacker, hasBorder = false) {
  if (!attacker) return 0;
  const stock = attacker.resources.supply;
  const food = attacker.resources.food;
  const base = Math.min(65, stock * 0.45) + Math.min(25, Math.max(0, food) * 0.05) + (hasBorder ? 10 : -12);
  return clamp2(base);
}
function fiscalScore(attacker) {
  if (!attacker) return 0;
  const gold = attacker.resources.gold;
  const corruptionPenalty = attacker.government.corruption * 0.25;
  return clamp2(55 + Math.min(25, gold / 20) - corruptionPenalty);
}
function stabilityScore(attacker) {
  if (!attacker) return 0;
  return clamp2(attacker.government.stability * 0.7 + attacker.government.legitimacy * 0.2 + attacker.government.efficiency * 0.1 - attacker.warExhaustion * 0.45);
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
function assessWar(state, attackerId, defenderId, targetProvinceId, diplomacy = warDiplomacy(state, attackerId)) {
  const attacker = state.nations[attackerId];
  const defender = state.nations[defenderId];
  const target = state.provinces[targetProvinceId];
  const attPower = armyPower(attacker);
  const defPower = armyPower(defender) + (target?.garrison ?? 0) * 0.85;
  const powerRatio = defPower <= 0 ? 100 : clamp2(attPower / defPower * 50, 0, 100);
  const hasBorder = borderAccess(state, attackerId, target);
  const logistics = supplyScore(attacker, hasBorder);
  const fiscal = fiscalScore(attacker);
  const stability = stabilityScore(attacker);
  const relation = diplomacy.outgoing.get(defenderId);
  const goodwill = relation ? relation.relation - relation.threat + relation.trust * 0.25 + relation.tradeDep * 0.15 : 0;
  const diplomaticRisk = clamp2(42 + (diplomacy.allies.get(defenderId) ?? 0) * 12 - (diplomacy.allies.get(attackerId) ?? 0) * 7 + Math.max(0, goodwill) * 0.25);
  const exhaustionRisk = clamp2((attacker?.warExhaustion ?? 100) + Math.max(0, 55 - stability) * 0.45 + (hasBorder ? 0 : 12));
  const readiness = clamp2(powerRatio * 0.42 + logistics * 0.22 + fiscal * 0.16 + stability * 0.14 + (100 - diplomaticRisk) * 0.06);
  const winChance = clamp2(30 + powerRatio * 0.48 + logistics * 0.12 + stability * 0.08 - diplomaticRisk * 0.08);
  const fiscalPressure = clamp2(100 - fiscal + Math.max(0, defPower - attPower) / 300);
  const logisticsPressure = clamp2(100 - logistics);
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
function clamp3(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
function n2(v) {
  return Math.round(v);
}
function ownedProvinces(state, nationId) {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}
function atWar(state, nationId) {
  return state.wars.some((w) => w.attackerId === nationId || w.defenderId === nationId);
}
function relationLine(rel) {
  if (!rel) return "\u5916\u4EA4\u60C5\u62A5\u4E0D\u8DB3\u3002";
  if (rel.treaty === "truce" && rel.truceTurns > 0) return `\u4ECD\u6709 ${rel.truceTurns} \u56DE\u5408\u505C\u6218\u3002`;
  if (rel.treaty === "alliance") return "\u76EE\u6807\u662F\u540C\u76DF\uFF0C\u4E0D\u5E94\u5BA3\u6218\u3002";
  if (rel.relation < -40) return "\u53CC\u65B9\u5173\u7CFB\u6076\u52A3\uFF0C\u6218\u4E89\u7406\u7531\u5145\u5206\u3002";
  if (rel.threat > 60) return "\u76EE\u6807\u5A01\u80C1\u8FC7\u9AD8\uFF0C\u5B58\u5728\u5148\u53D1\u5236\u4EBA\u52A8\u673A\u3002";
  if (rel.tradeDep > 55) return "\u8D38\u6613\u4F9D\u8D56\u8F83\u9AD8\uFF0C\u5F00\u6218\u4F1A\u4F24\u5BB3\u7ECF\u6D4E\u3002";
  return "\u5916\u4EA4\u963B\u529B\u53EF\u63A7\u3002";
}
function buildCandidate(state, attackerId, target, diplomacy) {
  if (warDeclarationBlocker(state, attackerId, target.ownerId)) return null;
  const assessment = assessWar(state, attackerId, target.ownerId, target.id, diplomacy);
  const nation = state.nations[attackerId];
  const expansionBias = nation?.tendency.expansionist ?? 50;
  const militarism = nation?.tendency.militarism ?? 50;
  const commercePenalty = Math.max(0, (nation?.tendency.commerce ?? 50) - 55) * 0.25;
  const score = clamp3(
    assessment.readiness * 0.34 + assessment.winChance * 0.32 + (100 - assessment.diplomaticRisk) * 0.12 + (100 - assessment.exhaustionRisk) * 0.1 + expansionBias * 0.07 + militarism * 0.05 - commercePenalty
  );
  const reasons = [
    `\u80DC\u7387 ${assessment.winChance}%\u3001\u5907\u6218\u5EA6 ${assessment.readiness}%\u3002`,
    relationLine(diplomacy.outgoing.get(target.ownerId))
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
  const diplomacy = warDiplomacy(state, attackerId);
  const frontier = new Set(ownedProvinces(state, attackerId).flatMap((p) => p.adjacent));
  const candidates = [...frontier].map((id) => state.provinces[id]).filter((p) => p && p.ownerId !== attackerId).map((p) => buildCandidate(state, attackerId, p, diplomacy)).filter((x) => !!x).sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return { attackerId, type: "avoid", label: "\u65E0\u5408\u6CD5\u76EE\u6807", confidence: 75, alternatives: [], reasons: ["\u5468\u8FB9\u6CA1\u6709\u53EF\u653B\u51FB\u7684\u975E\u540C\u76DF/\u975E\u505C\u6218\u76EE\u6807\u3002"] };
  const aggression = (nation.tendency.expansionist + nation.tendency.militarism) / 2;
  const threshold = aggression >= 65 ? 66 : aggression >= 48 ? 72 : 80;
  if (best.score >= threshold && best.assessment.recommendation === "attack_now") {
    return {
      attackerId,
      type: "declare",
      label: `\u5BA3\u6218 ${best.targetName}`,
      confidence: clamp3(best.score),
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
      confidence: clamp3(best.score),
      candidate: best,
      alternatives: candidates.slice(1, 4),
      reasons: [`\u5019\u9009\u76EE\u6807\u63A5\u8FD1\u5BA3\u6218\u9608\u503C ${threshold}\uFF0C\u4F46\u4ECD\u9700\u6574\u5907\u3002`, ...best.reasons]
    };
  }
  return {
    attackerId,
    type: "avoid",
    label: "\u907F\u514D\u5F00\u6218",
    confidence: clamp3(100 - best.score),
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
function isAttackableProvince(nation, state, provinceId, owned) {
  const target = state.provinces[provinceId];
  if (!target || target.ownerId === nation.id) return null;
  if (warDeclarationBlocker(state, nation.id, target.ownerId)) return null;
  const ownFront = (owned ?? provincesOf(nation.id, state.provinces)).some((p) => p.adjacent.includes(target.id));
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
function chooseExpansionOpportunity(nation, state, w, provs) {
  const memory = state.aiMemory?.[nation.id];
  const preferred = [
    { id: memory?.territory?.revengeProvinceId, reason: "revenge", baseWeight: 11 },
    { id: memory?.territory?.desiredProvinceId, reason: "desired", baseWeight: 10 }
  ];
  for (const item of preferred) {
    if (!item.id) continue;
    const target = isAttackableProvince(nation, state, item.id, provs);
    if (!target) continue;
    if (!hasMilitaryEdge(nation, state.nations[target.ownerId], item.reason === "revenge" ? 1.2 : 1.35)) continue;
    const pressure = memory?.territory?.pressure ?? 0;
    return { actionId: "declare_war", weight: (item.baseWeight + pressure / 18) * w.declareWar, target: target.ownerId, targetProvinceId: target.id, reason: item.reason };
  }
  let best = null;
  for (const p of provs) {
    for (const adjId of p.adjacent) {
      const adj = isAttackableProvince(nation, state, adjId, provs);
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
  const farm = BUILDINGS.farm;
  const farmTarget = lowFood && canAfford(nation, farm.costGold, farm.costWood, farm.costIron) ? leastFarmProvince(provs) : void 0;
  if (farmTarget) actions.push({ actionId: "build_farm", weight: 12 * w.buildFarm, target: farmTarget });
  if (hasRebellionRisk) actions.push({ actionId: "suppress", weight: 8 * w.suppress, target: provs.find((p) => p.rebellionRisk > 50)?.id });
  if (lowStab) actions.push({ actionId: "appease", weight: 6 });
  if (lowTech && !nation.tech.researchProgress) actions.push({ actionId: "research", weight: 8 * w.research });
  if (!atWar2) {
    const expansion = chooseExpansionOpportunity(nation, state, w, provs);
    if (expansion) actions.push(expansion);
    for (const r of state.relations) {
      if (r.from === nation.id && r.relation < 30 && r.treaty === "none") {
        actions.push({ actionId: "improve_relation", weight: 4 * w.alliance, target: r.to });
        break;
      }
    }
    const tradeTarget = nation.resources.influence >= 10 && state.relations.find((r) => r.from === nation.id && r.treaty === "none" && r.relation >= -10 && aiTradePair(state, nation, r.to));
    if (tradeTarget) actions.push({ actionId: "establish_trade", weight: 15 * w.alliance, target: tradeTarget.to });
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
  const foodConsume = provs.reduce((s, p) => s + p.population, 0) * 0.1;
  if (nation.resources.food < foodConsume * 2) {
    const existingFarm = planned.findIndex((action) => action.actionId === "build_farm");
    if (existingFarm >= 0) planned.splice(existingFarm, 1);
    if (farmTarget) planned.unshift({ actionId: "build_farm", weight: 99, target: farmTarget });
    if (nation.taxRate > 0.1) planned.push({ actionId: "tax_down", weight: 50 });
  }
  return planned.slice(0, 3);
}
function leastFarmProvince(provs) {
  let best;
  let fewest = BUILDINGS.farm.maxPerProvince;
  for (const p of provs) {
    const count = p.buildings.filter((b) => b.defId === "farm").length;
    if (count < fewest) {
      best = p.id;
      fewest = count;
    }
  }
  return best;
}
function buildAIImprovement(state, nation, province, id) {
  const def = BUILDINGS[id];
  if (!province || province.ownerId !== nation.id || province.buildings.filter((b) => b.defId === id).length >= def.maxPerProvince) return;
  if (!canAfford(nation, def.costGold, def.costWood, def.costIron)) return;
  spend(nation, def.costGold, def.costWood, def.costIron);
  province.buildings.push({ id: allocateEntityId(state, "building"), defId: id, provinceId: province.id, level: 1 });
}
function moveCapitalArmyToFront(nation, state, targetProvinceId) {
  const target = state.provinces[targetProvinceId];
  if (!target) return;
  const provs = provincesOf(nation.id, state.provinces);
  const frontProv = provs.find((p) => p.adjacent.includes(target.id));
  if (!frontProv) return;
  const capitalArmy = nation.army.find((a) => a.location === nation.capital && a.size > 0);
  if (!capitalArmy || frontProv.id === capitalArmy.location) return;
  relocateArmy(state, nation, capitalArmy, frontProv.id);
}
function aiTradePair(state, nation, target) {
  const partner = state.nations[target];
  if (!partner || partner.defeated || target === nation.id) return null;
  const pair = relationPair(state, nation.id, target);
  return pair?.every((r) => r.treaty === "none" && r.relation >= -10) ? pair : null;
}
function signAITrade(state, nation, target, cost) {
  const pair = aiTradePair(state, nation, target);
  if (!pair || nation.resources.influence < cost) return;
  nation.resources.influence -= cost;
  for (const r of pair) {
    r.treaty = "trade";
    r.tradeDep = Math.max(r.tradeDep, 20);
  }
}
function executeAIAction(nation, action, state) {
  switch (action.actionId) {
    case "tax_up":
      nation.taxRate = clamp(nation.taxRate + 0.02, 0, 0.5);
      break;
    case "tax_down":
      nation.taxRate = clamp(nation.taxRate - 0.02, 0, 0.5);
      break;
    case "build_farm":
    case "build_market":
      if (action.target) buildAIImprovement(state, nation, state.provinces[action.target], action.actionId === "build_farm" ? "farm" : "market");
      break;
    case "recruit": {
      const province = action.target && state.provinces[action.target];
      if (province && province.population > 50) recruit(state, nation, province, 50);
      break;
    }
    case "research": {
      const branches = ["agri", "mil", "admin", "culture"];
      const minBranch = branches.reduce((min, b) => nation.tech[b] < nation.tech[min] ? b : min, "agri");
      startResearch(nation, `${minBranch}_lv${nation.tech[minBranch] + 1}`);
      break;
    }
    case "appease": {
      const low = [...nation.factions].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      if (low && nation.resources.gold >= 30) {
        nation.resources.gold -= 30;
        low.satisfaction = clamp(low.satisfaction + 8, 0, 100);
      }
      break;
    }
    case "suppress": {
      if (!action.target) break;
      const p = state.provinces[action.target];
      if (p?.ownerId === nation.id && nation.resources.gold >= 50) {
        nation.resources.gold -= 50;
        p.unrest = clamp(p.unrest - 15, 0, 100);
      }
      break;
    }
    case "improve_relation": {
      if (!action.target) break;
      const pair = relationPair(state, nation.id, action.target);
      if (nation.resources.influence >= 20 && pair?.every((r) => r.treaty === "none") && !state.nations[action.target]?.defeated) {
        nation.resources.influence -= 20;
        for (const r of pair) r.relation = clamp(r.relation + 5, -100, 100);
      }
      break;
    }
    case "declare_war": {
      const id = action.targetProvinceId ?? provincesOf(nation.id, state.provinces).flatMap((p) => p.adjacent).find((id2) => state.provinces[id2]?.ownerId === action.target);
      const target = id && isAttackableProvince(nation, state, id);
      if (!target || action.target && target.ownerId !== action.target) break;
      if (declareWar(state, nation.id, target.ownerId, target.id)) moveCapitalArmyToFront(nation, state, target.id);
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
    case "establish_trade":
      if (action.target) signAITrade(state, nation, action.target, 10);
      break;
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
  if (nation.taxRate > 0.2) nation.taxRate = clamp(nation.taxRate - 0.01, 0, 0.5);
  if (nation.taxRate < 0.1) nation.taxRate = clamp(nation.taxRate + 0.01, 0, 0.5);
  if (state.turn % 5 === 0 && nation.resources.gold >= 50) {
    const provs = provincesOf(nation.id, state.provinces);
    if (provs.length > 0) {
      const p = provs[Math.floor(rng() * provs.length)];
      const bType = rng() > 0.5 ? "farm" : "market";
      buildAIImprovement(state, nation, p, bType);
    }
  }
  if (state.turn % 2 === 0 && nation.resources.influence >= 5) {
    const partner = state.relations.find((r) => r.from === nation.id && r.relation > 0 && r.treaty === "none" && aiTradePair(state, nation, r.to));
    if (partner) signAITrade(state, nation, partner.to, 5);
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
  const playerId2 = state.playerNationId || PLAYER_ID;
  const playerProvs = provincesOf(playerId2, state.provinces);
  const neighbors = /* @__PURE__ */ new Set();
  for (const p of playerProvs) {
    for (const adj of p.adjacent) {
      const adjProv = state.provinces[adj];
      if (adjProv && adjProv.ownerId !== playerId2) neighbors.add(adjProv.ownerId);
    }
  }
  return neighbors;
}
function processAITurn(state, excludedNationIds = /* @__PURE__ */ new Set()) {
  const rng = mulberry32(state.seed ^ 25214903917);
  const playerNeighbors = buildPlayerNeighborSet(state);
  for (const nation of Object.values(state.nations)) {
    if (nation.isPlayer || excludedNationIds.has(nation.id)) continue;
    if (nation.defeated) continue;
    const tier = nation.tier;
    if (tier === "S" || tier === "A" || playerNeighbors.has(nation.id)) processAITurnFull(nation, state, rng);
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

// src/gameplay/strategyFocus.ts
function clamp4(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
function playerId(state) {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  return Object.values(state.nations).find((n3) => n3.isPlayer && !n3.defeated)?.id ?? Object.keys(state.nations)[0];
}
function provincesOf2(state, nationId, index) {
  return index?.provincesByOwner.get(nationId) ?? Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}
function applyPlayerFocus(state, focus, pid = playerId(state)) {
  const player = state.nations[pid];
  if (!player) return { state, note: "" };
  const next = { ...state, nations: { ...state.nations, [pid]: { ...player, resources: { ...player.resources }, government: { ...player.government }, army: player.army.map((a) => ({ ...a })) } }, provinces: { ...state.provinces }, relations: focus === "diplomacy" ? state.relations.map((r) => r.from === pid || r.to === pid ? { ...r } : r) : state.relations };
  if (pid === next.playerNationId) next.strategyFocus = focus;
  const p = next.nations[pid];
  const provs = provincesOf2(next, pid);
  const scale = Math.max(1, Math.min(12, provs.length));
  if (focus === "balance") {
    p.resources.adminPt += 1;
    return { state: next, note: "\u5747\u8861\u56FD\u7B56\uFF1A\u884C\u653F\u70B9 +1" };
  }
  if (focus === "stability") {
    p.government.stability = clamp4(p.government.stability + 1);
    p.resources.gold -= Math.max(4, Math.round(scale * 1.5));
    for (const prov of provs) next.provinces[prov.id] = { ...prov, unrest: clamp4(prov.unrest - 1), rebellionRisk: clamp4(prov.rebellionRisk - 1) };
    return { state: next, note: "\u5B89\u6C11\u56FD\u7B56\uFF1A\u5B89\u5B9A +1\uFF0C\u5730\u65B9\u4E0D\u6EE1\u4E0B\u964D" };
  }
  if (focus === "prosperity") {
    p.resources.gold += Math.round(6 + scale * 3);
    p.resources.food += Math.round(8 + scale * 4);
    p.government.corruption = clamp4(p.government.corruption + 0.5);
    return { state: next, note: "\u5BCC\u56FD\u56FD\u7B56\uFF1A\u56FD\u5E93\u4E0E\u7CAE\u50A8\u589E\u957F\uFF0C\u8150\u8D25\u7565\u5347" };
  }
  if (focus === "military") {
    p.resources.supply += 8;
    p.warExhaustion = clamp4(p.warExhaustion + 0.5);
    p.army = p.army.map((a) => ({ ...a, morale: clamp4(a.morale + 1), training: clamp4(a.training + 1), supply: clamp4(a.supply + 2) }));
    return { state: next, note: "\u5F3A\u519B\u56FD\u7B56\uFF1A\u8865\u7ED9\u589E\u957F\uFF0C\u519B\u961F\u58EB\u6C14\u4E0E\u8BAD\u7EC3\u63D0\u5347" };
  }
  if (focus === "diplomacy") {
    p.resources.influence += 4;
    for (const r of next.relations) if (r.from === pid || r.to === pid) {
      r.relation = clamp4(r.relation + 1, -100, 100);
      r.trust = clamp4(r.trust + 0.5, 0, 100);
      r.threat = clamp4(r.threat - 0.5, 0, 100);
    }
    return { state: next, note: "\u7766\u90BB\u56FD\u7B56\uFF1A\u5F71\u54CD\u529B\u589E\u52A0\uFF0C\u5468\u8FB9\u5173\u7CFB\u7565\u6709\u6539\u5584" };
  }
  p.resources.sciPt += 4;
  p.resources.adminPt += 1;
  p.government.stability = clamp4(p.government.stability - 1);
  return { state: next, note: "\u6539\u9769\u56FD\u7B56\uFF1A\u79D1\u7814\u4E0E\u884C\u653F\u589E\u957F\uFF0C\u77ED\u671F\u5B89\u5B9A\u627F\u538B" };
}

// src/engine/aiTurnPhase.ts
function refreshActiveCharacters(nation) {
  const activated = activateTendency(nation.tendency);
  nation.activeCharacterBonuses = activated.filter((id) => id !== "balanced" && NATIONAL_CHARACTERS[id]);
}
function groupByNation(items, nationId) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of items) {
    const id = nationId(item);
    const group = groups.get(id);
    if (group) group.push(item);
    else groups.set(id, [item]);
  }
  return groups;
}
function runAITurnPhase(state, playerId2, rng, options = {}) {
  const humanNationIds = options.humanNationIds ?? /* @__PURE__ */ new Set();
  processAITurn(state, humanNationIds);
  const eventAvailability = options.eventAvailability ?? createEventAvailabilityIndex(state);
  const provincesByOwner = groupByNation(Object.values(state.provinces), (p) => p.ownerId);
  const relationsBySource = groupByNation(state.relations, (r) => r.from);
  for (const nation of Object.values(state.nations)) {
    if (nation.id === playerId2 || nation.isPlayer || nation.defeated) continue;
    if (humanNationIds.has(nation.id)) {
      refreshActiveCharacters(nation);
      continue;
    }
    const provinces = provincesByOwner.get(nation.id) ?? [];
    if (provinces.length === 0) continue;
    const economy = settleEconomy(nation, state, provinces, relationsBySource.get(nation.id) ?? []);
    for (const province of provinces) if (province.priorAgriBase !== void 0) delete province.priorAgriBase;
    settlePopulation(nation, provinces, economy.grain.shortageExpected, true, nation.atWar, false);
    settlePolitics(nation, state, provinces);
    lawPerTurnEffects(nation, provinces);
    settleTechnology(nation, state);
    settleCultureReligion(nation, state, provinces);
    nation.resources.influence = Math.min(nation.resources.influence + 3, 100);
    for (const eventId of rollEvents(nation, state, rng, 1, eventAvailability, provinces)) {
      const event = EVENT_BY_ID[eventId];
      if (!event) continue;
      const optionIndex = aiChooseOption(event, rng);
      const option2 = event.options[optionIndex];
      if (option2) applyEffect(nation, option2.effects, state, eventAvailability);
      recordEvent(state, nation.id, eventId, optionIndex, eventAvailability);
    }
    resolvePendingEventsForAI(nation, state, rng, void 0, eventAvailability);
    if (state.turn % 10 === 0) {
      for (const key of Object.keys(nation.tendency)) {
        nation.tendency[key] = clamp(nation.tendency[key] - 2, 0, 100);
      }
    }
    refreshActiveCharacters(nation);
  }
  const player = state.nations[playerId2];
  if (player) refreshActiveCharacters(player);
}

// src/engine/turnConsequences.ts
function resolveFailuresAndRebellions(state, playerId2, startingCapital = state.nations[playerId2]?.capital) {
  if (state.victory.type) return;
  const player = state.nations[playerId2];
  if (!player) return;
  const provinces = provincesOf(playerId2, state.provinces);
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
  if (startingCapital && state.provinces[startingCapital]?.ownerId !== playerId2) {
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
  const newRebels = [];
  for (const province of rebelProvinces) {
    const originalId = `rebel_${province.id}`;
    const previous = state.nations[originalId];
    const rebelId = previous && (previous.defeated || previous.rebelOf !== playerId2) ? allocateEntityId(state, "rebel") : originalId;
    newRebels.push(rebelId);
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
        rebelOf: playerId2
      };
    }
    province.assimilation = 30;
    province.loyalty = 30;
    province.unrest = 60;
    province.ownerId = rebelId;
    province.isCapital = state.nations[rebelId].capital === province.id;
    province.garrison = 0;
    province.buildings = province.buildings.filter((building) => building.defId === "farm");
    addChronicle(state, {
      id: `rebel_${province.id}_${state.turn}`,
      turn: state.turn,
      kind: "milestone_rebellion",
      title: `${province.name} \u8131\u79BB\u72EC\u7ACB`,
      desc: `${province.name} \u53DB\u4E71\u6210\u529F\uFF0C\u8131\u79BB ${player.name}\u30025 \u5E74\u5185\u672A\u9547\u538B\u5C06\u81EA\u52A8\u5F52\u987A\u3002`,
      actorId: playerId2
    });
    for (const adjacentId of province.adjacent) {
      const adjacent = state.provinces[adjacentId];
      if (!adjacent || adjacent.ownerId !== playerId2 || adjacent.culture !== province.culture || adjacent.rebellionRisk < 60) continue;
      if (rebellionRng() < 0.3) {
        adjacent.rebellionRisk = Math.min(100, adjacent.rebellionRisk + 40);
        adjacent.unrest = Math.min(100, adjacent.unrest + 20);
      }
    }
  }
  if (!newRebels.length) return;
  if (state.provinces[player.capital]?.ownerId !== playerId2) {
    state.victory.type = "fail_capital_lost";
    const fallback = provinces.find((p) => p.ownerId === playerId2);
    if (fallback) {
      player.capital = fallback.id;
      fallback.isCapital = true;
    } else {
      player.defeated = true;
      player.army = [];
    }
  }
  for (const army of player.army) {
    if (state.provinces[army.location]?.ownerId !== playerId2) relocateArmy(state, player, army, player.capital);
  }
  if (player.civilWar?.active) {
    player.civilWar.rebels = [.../* @__PURE__ */ new Set([...player.civilWar.rebels, ...newRebels])];
  } else if (newRebels.length >= 3) {
    player.government.legitimacy = clamp(player.government.legitimacy - 25, 0, 100);
    player.government.stability = clamp(player.government.stability - 15, 0, 100);
    player.civilWar = { active: true, rebels: newRebels };
    addChronicle(state, {
      id: `civilwar_${playerId2}_${state.turn}`,
      turn: state.turn,
      kind: "milestone_rebellion",
      title: `${player.name} \u9677\u5165\u5185\u6218`,
      desc: `${rebelProvinces.length} \u7701\u53DB\u4E71\uFF0C\u5185\u6218\u7206\u53D1\u3002\u73A9\u5BB6\u53EF\u9547\u538B\u6216\u8C08\u5224\u3002\u5185\u6218\u671F\u95F4\u6BCF\u5E74\u7A33\u5B9A\u5EA6 -3\uFF0C\u7A0E\u6536\u51CF\u5C11 30%\u3002`,
      actorId: playerId2
    });
  }
}

// src/engine/turn.ts
function findPlayerId(state) {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  const player = Object.values(state.nations).find((nation) => nation.isPlayer && !nation.defeated);
  return player?.id ?? Object.keys(state.nations)[0];
}
function yearEndChanges(prev, state, id, owned = provincesOf(id, state.provinces)) {
  const before = prev.nations[id], after = state.nations[id];
  let unrestDelta = 0;
  for (const p of owned) {
    const previous = prev.provinces[p.id];
    if (previous?.ownerId === id) unrestDelta += Math.round(p.unrest - previous.unrest);
  }
  return {
    unrestDelta,
    exhaustSnapshot: Math.round(after.warExhaustion),
    goldDelta: Math.round(after.resources.gold - before.resources.gold),
    foodDelta: Math.round(after.resources.food - before.resources.food),
    stabilityDelta: Math.round(after.government.stability - before.government.stability),
    legitimacyDelta: Math.round(after.government.legitimacy - before.government.legitimacy)
  };
}
function nationWarnings(nation) {
  const warnings = [];
  if (nation.resources.gold < 0) warnings.push("\u26A0 \u56FD\u5E93\u8D64\u5B57");
  if (nation.resources.food < 0) warnings.push("\u26A0 \u7CAE\u98DF\u77ED\u7F3A");
  if (nation.government.stability < 20) warnings.push("\u26A0 \u7A33\u5B9A\u5EA6\u8FC7\u4F4E");
  if (nation.government.legitimacy < 25) warnings.push("\u26A0 \u5408\u6CD5\u6027\u5371\u673A");
  if (nation.warExhaustion > 70) warnings.push("\u26A0 \u538C\u6218\u9AD8\u6DA8");
  for (const f of nation.factions) {
    if (f.satisfaction < 20) warnings.push(`\u26A0 ${f.id} \u6D3E\u7CFB\u4E0D\u6EE1`);
  }
  return warnings;
}
function buildReport(nation, provs, state, prev, econ, pop, cr, events, worldEvents, warUpdates) {
  const warnings = nationWarnings(nation);
  if (cr.rebellionTriggered.length > 0) warnings.push(`\u26A0 ${cr.rebellionTriggered.length} \u7701\u53DB\u4E71`);
  const warProgress = [];
  for (const war of prev.wars) {
    if (war.attackerId !== nation.id && war.defenderId !== nation.id) continue;
    const reports = warUpdates[war.id]?.battleReports;
    if (!reports?.length) continue;
    const battle = reports[reports.length - 1];
    const defending = war.defenderId === nation.id;
    const outcome = defending && battle.outcome !== "stalemate" ? battle.outcome === "advance" ? "repelled" : "advance" : battle.outcome;
    warProgress.push({
      target: state.provinces[war.targetProvinceId]?.name ?? war.targetProvinceId,
      progressDelta: defending ? -battle.progressDelta : battle.progressDelta,
      outcome
    });
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
  return {
    turn: state.turn,
    nationId: nation.id,
    income: { tax: Math.round(econ.taxIncome), trade: Math.round(econ.tradeIncome), building: Math.round(econ.buildingIncome) },
    expense: { military: Math.round(econ.militaryExpense), corruption: Math.round(econ.corruptionLoss) },
    ...econ.economicReturns && { economicReturns: econ.economicReturns },
    ...yearEndChanges(prev, state, nation.id, provs),
    popDelta: Math.round(pop.totalGrowth),
    events,
    warnings,
    warProgress,
    factionDelta,
    worldEvents: worldEvents.slice(-10),
    // A4: 上限 10 条防溢出
    provinceChanges: [],
    // B2: 在 buildReport 外计算（需对比 prev/next 省份归属）
    strategicNotes: []
  };
}
function settleRuler(next, playerId2) {
  const player = next.nations[playerId2];
  const playerProvs = provincesOf(playerId2, next.provinces);
  const econPure = settleEconomyPure(player, next, playerProvs);
  applyEconomyResult(player, econPure);
  for (const p of playerProvs) if (p.priorAgriBase !== void 0) delete p.priorAgriBase;
  const econ = econPure;
  const foodShortage = econ.grain.shortageExpected;
  const pop = settlePopulation(player, playerProvs, foodShortage, true, player.atWar, false);
  const polPure = settlePoliticsPure(player, next, playerProvs);
  player.government.stability = polPure.govFinal.stability;
  player.government.legitimacy = polPure.govFinal.legitimacy;
  player.government.corruption = polPure.govFinal.corruption;
  player.government.efficiency = polPure.govFinal.efficiency;
  for (const [facId, finalSat] of Object.entries(polPure.factionSatFinal)) {
    const f = player.factions.find((x) => x.id === facId);
    if (f) f.satisfaction = finalSat;
  }
  applyLawPerTurnEffectFinals(playerProvs, lawPerTurnEffectsPure(player, playerProvs));
  settleTechnology(player, next);
  const crPure = settleCultureReligionPure(player, next, playerProvs);
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
    if (effPen > 0) player.government.efficiency = clamp(player.government.efficiency - effPen, 0, 100);
    if (stabPen > 0) player.government.stability = clamp(player.government.stability - stabPen, 0, 100);
  }
  return { playerProvs, econ, pop, cr, eventIds: [] };
}
function processTurn(state, options = {}) {
  const rng = mulberry32(state.seed);
  const newSeed = Math.floor(rng() * 4294967295) >>> 0;
  let next = cloneGameState(state);
  if (options.sharedWorld) next.sharedChronicles ??= {};
  next.seed = newSeed;
  next.turn = state.turn + 1;
  const normalizedPlayerId = findPlayerId(next);
  next.playerNationId = normalizedPlayerId;
  for (const nation of Object.values(next.nations)) nation.isPlayer = nation.id === normalizedPlayerId;
  const playerId2 = findPlayerId(next);
  const humanIds = new Set(options.humanNationIds ?? []);
  const rulers = new Map([playerId2, ...[...humanIds].sort().filter((id) => id !== playerId2 && next.nations[id] && !next.nations[id].defeated)].map((id) => [id, settleRuler(next, id)]));
  settleDiplomacy(next);
  settleDiplomaticAccords(next);
  const battles = settleWarsPure(next);
  applySettleWarsResult(next, battles);
  for (const nation of Object.values(next.nations)) {
    if (nation.defeated) continue;
    const result = ageRulersPure(nation, rng);
    nation.ruler = result.rulerFinal;
    if (result.govLegitimacyDelta) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + result.govLegitimacyDelta, 0, 100);
    }
    const reignMod = reignLegitimacy(nation);
    if (reignMod !== 0) {
      nation.government.legitimacy = clamp(nation.government.legitimacy + reignMod, 0, 100);
    }
  }
  const availableEvents = createEventAvailabilityIndex(next);
  for (const [id, settlement] of rulers) {
    const nation = next.nations[id];
    if (nation.defeated) continue;
    settlement.eventIds = rollEvents(nation, { ...next, playerNationId: id }, rng, 2, availableEvents);
    for (const eid of settlement.eventIds) {
      if (EVENT_BY_ID[eid] && !next.pendingEvents.some((p) => p.nationId === id && p.eventId === eid)) {
        next.pendingEvents.push({ nationId: id, eventId: eid });
      }
    }
    if (nation.govTransitionTurns && nation.govTransitionTurns > 0) nation.govTransitionTurns -= 1;
  }
  const aiCaretaker = !!options.sharedWorld && !humanIds.size;
  if (aiCaretaker) next.nations[playerId2].isPlayer = false;
  runAITurnPhase(next, playerId2, rng, { humanNationIds: humanIds, eventAvailability: availableEvents });
  if (aiCaretaker) {
    resolvePendingEventsForAI(next.nations[playerId2], next, rng, void 0, availableEvents);
    next.nations[playerId2].isPlayer = true;
  }
  if (next.triggeredEvents.length > 1e3) {
    next.triggeredEvents = next.triggeredEvents.slice(-1e3);
  }
  const eventsByNation = new Map([...rulers].map(([id, data]) => [id, collectWorldEvents(state, next, id, data.playerProvs)]));
  if (!options.sharedWorld) resolveFailuresAndRebellions(next, playerId2, state.nations[playerId2].capital);
  decayRebelNations(next);
  const previousHistory = next.history;
  for (const [id, data] of rulers) {
    const isHuman = options.sharedWorld && humanIds.has(id);
    let focusNote;
    if (isHuman && !next.nations[id].defeated) {
      const focus = applyPlayerFocus(next, next.sharedFocuses?.[id] ?? "balance", id);
      next = focus.state;
      focusNote = focus.note;
    }
    const report = buildReport(
      next.nations[id],
      provincesOf(id, next.provinces),
      next,
      state,
      data.econ,
      data.pop,
      data.cr,
      data.eventIds,
      eventsByNation.get(id),
      battles.warUpdates
    );
    if (focusNote) report.strategicNotes = [focusNote];
    report.provinceChanges = collectPlayerProvinceChanges(state, next, id);
    const history = [...next.sharedHistories?.[id] ?? previousHistory.filter((r) => r.nationId === id), report].slice(-10);
    if (isHuman) {
      (next.sharedHistories ??= {})[id] = history;
      const chronicle = next.sharedChronicles[id] ??= [];
      const ruler = { ...next, playerNationId: id, history, chronicle };
      detectMilestones(ruler, state);
      detectBattleMilestones(ruler, state, battles.warUpdates);
    }
    if (id === playerId2) {
      next.lastReport = report;
      next.history = history;
    }
  }
  if (!options.sharedWorld) {
    if (!options.deferNationalMilestones) detectMilestones(next, state);
    detectBattleMilestones(next, state, battles.warUpdates);
  }
  return { state: next, report: next.lastReport };
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
  const provinceOwners = /* @__PURE__ */ new Set();
  for (const [provinceKey, province] of Object.entries(state.provinces)) {
    provinceOwners.add(province.ownerId);
    if (province.id !== provinceKey) add("province-key-mismatch", "error", `${provinceKey} \u7684\u5185\u90E8 id=${province.id}\u3002`);
    if (!isValidProvinceOwner(state, province.ownerId)) add("province-owner-invalid", "error", `${province.id} \u6307\u5411\u65E0\u6548 ownerId=${province.ownerId}\u3002`);
    if (![province.population, province.garrison, province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].every(finite)) {
      add("province-number-invalid", "error", `${province.id} \u542B NaN/Infinity\u3002`);
    }
    if (province.classes.reduce((sum, group) => sum + group.count, 0) !== province.population) {
      add("province-class-total", "error", `${province.id} \u7684\u9636\u5C42\u4EBA\u6570\u5408\u8BA1\u4E0E\u603B\u4EBA\u53E3\u4E0D\u7B26\u3002`);
    }
    if (province.population < 0 || province.garrison < 0) add("province-negative", "error", `${province.id} \u542B\u8D1F\u4EBA\u53E3\u6216\u8D1F\u9A7B\u519B\u3002`);
    if ([province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].some((value) => value < 0 || value > 100)) {
      add("province-range-invalid", "error", `${province.id} \u7684\u767E\u5206\u6BD4\u5B57\u6BB5\u8D8A\u754C\u3002`);
    }
    for (const adjacentId of province.adjacent) {
      if (!state.provinces[adjacentId] || adjacentId === province.id) add("province-adjacency-invalid", "error", `${province.id} \u542B\u65E0\u6548\u90BB\u63A5 ${adjacentId}\u3002`);
      else if (province.terrain !== "ocean" && state.provinces[adjacentId].terrain !== "ocean" && !state.provinces[adjacentId].adjacent.includes(province.id)) add("province-adjacency-asymmetric", "warning", `${province.id}\u2192${adjacentId} \u7F3A\u5C11\u53CD\u5411\u90BB\u63A5\u3002`);
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
    if (!nation.defeated && provinceOwners.has(nation.id) && (!state.provinces[nation.capital] || state.provinces[nation.capital].ownerId !== nation.id)) {
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
function constructionBlocker(player, province, definition) {
  if (!hasTech2(player, definition.prereqTech)) return `\u7F3A\u5C11\u524D\u7F6E\u79D1\u6280\uFF1A${definition.prereqTech}`;
  if (definition.maxPerProvince > 0 && province.buildings.filter((b) => b.defId === definition.id).length >= definition.maxPerProvince) return "\u5DF2\u8FBE\u5EFA\u9020\u4E0A\u9650";
  if (player.resources.gold < definition.costGold || player.resources.wood < definition.costWood || player.resources.iron < definition.costIron) return "\u5EFA\u9020\u8D44\u6E90\u4E0D\u8DB3";
  if (player.resources.adminPt < definition.costAction) return `\u884C\u52A8\u70B9\u4E0D\u8DB3\uFF08\u9700 ${definition.costAction}\uFF09`;
  return null;
}
function buildAction(state, provinceId, buildingDefId) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    const definition = BUILDINGS[buildingDefId];
    if (!province || province.ownerId !== player.id || !definition) return failure("\u65E0\u6CD5\u5728\u8BE5\u7701\u5EFA\u9020");
    const blocker = constructionBlocker(player, province, definition);
    if (blocker) return failure(blocker);
    player.resources.adminPt -= definition.costAction;
    player.resources.gold -= definition.costGold;
    player.resources.wood -= definition.costWood;
    player.resources.iron -= definition.costIron;
    province.buildings.push({ id: allocateEntityId(working, "building"), defId: definition.id, provinceId, level: 1 });
    return success(`\u5728 ${province.name} \u5EFA\u9020\u4E86 ${definition.name}`);
  });
}
function researchAction(state, techId) {
  return runGameAction(state, (_working, player) => {
    const definition = TECH_BY_ID[techId];
    if (!definition) return failure("\u79D1\u6280\u4E0D\u5B58\u5728");
    const blocker = instantResearchBlocker(player, definition);
    if (blocker) return failure(blocker);
    player.resources.adminPt -= 1;
    player.resources.sciPt -= definition.costSci;
    player.resources.gold -= definition.costGold;
    player.tech[definition.branch] = definition.level;
    return success(`\u7814\u53D1\u5B8C\u6210\uFF1A${definition.name}`);
  });
}

// src/gameplay/diplomaticMemory.ts
function recordDiplomaticIncident(state, observerId, actorId, kind, impact, summary) {
  state.aiMemory = state.aiMemory ?? {};
  const memory = state.aiMemory[observerId] ?? {
    rivalScore: 0,
    partnerScore: 0,
    watchScore: 0,
    lastUpdated: state.turn
  };
  const incident = {
    actorId,
    kind,
    impact: Math.max(-30, Math.min(30, Math.round(impact))),
    turn: state.turn,
    summary
  };
  memory.incidents = [...(memory.incidents ?? []).filter((entry) => state.turn - entry.turn <= 30), incident].slice(-8);
  memory.lastUpdated = state.turn;
  if (impact < 0) {
    memory.rivalId = actorId;
    memory.rivalScore = Math.min(100, Math.max(memory.rivalScore, Math.abs(impact) * 2.5));
  } else {
    memory.partnerId = actorId;
    memory.partnerScore = Math.min(100, Math.max(memory.partnerScore, impact * 2.5));
  }
  state.aiMemory[observerId] = memory;
}

// src/gameplay/actions/diplomacyActions.ts
function improveRelationAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulRelationPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure("\u5F53\u524D\u65E0\u6CD5\u6539\u5584\u5173\u7CFB");
    if (player.resources.influence < 20) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 20;
    for (const relation of pair) {
      relation.relation = clamp5(relation.relation + 5, -100, 100);
      relation.trust = clamp5(relation.trust + 4, 0, 100);
    }
    recordDiplomaticIncident(working, target.id, player.id, "envoy", 7, "\u6D3E\u9063\u4F7F\u8282\u5E76\u5151\u73B0\u4E86\u6539\u5584\u5173\u7CFB\u7684\u627F\u8BFA");
    return success(`\u6539\u5584\u4E86\u4E0E ${target.name} \u7684\u5173\u7CFB`);
  });
}
function tradeTreatyBlocker(state, targetId) {
  const player = state.nations[state.playerNationId];
  const pair = peacefulRelationPair(state, player.id, targetId);
  if (!pair || pair.some((r) => r.treaty !== "none")) return "\u65E0\u6CD5\u5EFA\u7ACB\u8D38\u6613";
  if (pair[0].relation < 0) return "\u9700\u5148\u6539\u5584\u5173\u7CFB";
  if (player.resources.influence < 30) return "\u5F71\u54CD\u529B\u4E0D\u8DB3";
  return player.resources.adminPt < 1 ? "\u884C\u52A8\u70B9\u4E0D\u8DB3\uFF08\u9700 1\uFF09" : null;
}
function formTradeAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const blocker = tradeTreatyBlocker(working, targetId);
    if (blocker) return failure(blocker);
    const target = working.nations[targetId];
    const pair = relationPair(working, player.id, targetId);
    player.resources.adminPt -= 1;
    player.resources.influence -= 30;
    for (const relation of pair) {
      relation.treaty = "trade";
      relation.tradeDep = Math.max(relation.tradeDep, 20);
    }
    recordDiplomaticIncident(working, target.id, player.id, "trade", 12, "\u5EFA\u7ACB\u4E86\u4E92\u5229\u8D38\u6613\u5173\u7CFB");
    return success(`\u4E0E ${target.name} \u5EFA\u7ACB\u8D38\u6613`);
  });
}
function formAllianceAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulRelationPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 50 || pair.some((relation) => relation.treaty === "alliance")) return failure("\u65E0\u6CD5\u7ED3\u76DF");
    if (player.resources.influence < 50) return failure("\u5F71\u54CD\u529B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 50;
    for (const relation of pair) relation.treaty = "alliance";
    recordDiplomaticIncident(working, target.id, player.id, "alliance", 20, "\u7B7E\u8BA2\u4E86\u6B63\u5F0F\u540C\u76DF");
    return success(`\u4E0E ${target.name} \u7ED3\u76DF`);
  });
}
function espionageAction(state, targetId, kind) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? relationPair(working, player.id, target.id) : null;
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
    recordDiplomaticIncident(working, target.id, player.id, "espionage", -18, "\u9488\u5BF9\u672C\u56FD\u5B9E\u65BD\u4E86\u79D8\u5BC6\u884C\u52A8");
    messages.push("\u95F4\u8C0D\u884C\u52A8\u5B8C\u6210");
    return success(...messages);
  });
}
function dynasticMarriageAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulRelationPair(working, player.id, target.id) : null;
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
    recordDiplomaticIncident(working, target.id, player.id, "marriage", 18, "\u901A\u8FC7\u738B\u5BA4\u8054\u59FB\u5EFA\u7ACB\u4E86\u957F\u671F\u7EBD\u5E26");
    return success(`\u4E0E ${target.name} \u8054\u59FB\u6210\u529F`);
  });
}
function culturalExportAction(state, targetId) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulRelationPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure("\u5F53\u524D\u65E0\u6CD5\u8FDB\u884C\u6587\u5316\u8F93\u51FA");
    if (player.tech.culture < 5) return failure("\u6587\u5316\u8F93\u51FA\u9700\u8981\u6587\u5316\u79D1\u6280 Lv5");
    if (player.resources.sciPt < 30) return failure("\u79D1\u7814\u70B9\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.sciPt -= 30;
    player.resources.influence += 5;
    for (const relation of pair) relation.relation = clamp5(relation.relation + 8, -100, 100);
    recordDiplomaticIncident(working, target.id, player.id, "culture", 8, "\u63A8\u52A8\u4E86\u53D7\u5230\u6B22\u8FCE\u7684\u6587\u5316\u4EA4\u6D41");
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
    const blocker = warDeclarationBlocker(working, player.id, target.id);
    if (blocker) return failure(blocker);
    const bordersTarget = Object.values(working.provinces).filter((province) => province.ownerId === player.id).some((province) => province.adjacent.includes(targetProvince.id));
    if (!bordersTarget) return failure("\u53EA\u80FD\u5411\u76F8\u90BB\u7701\u4EFD\u53D1\u52A8\u6218\u4E89");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    const war = declareWar(working, player.id, target.id, targetProvince.id);
    if (!war) return failure("\u5BA3\u6218\u5931\u8D25");
    recordDiplomaticIncident(working, target.id, player.id, "war", -30, `\u5411 ${targetProvince.name} \u53D1\u52A8\u4E86\u6218\u4E89`);
    return success(`\u5411 ${target.name} \u5BA3\u6218`);
  });
}
function makePeaceAction(state, warId, sharedWorld = false) {
  return runGameAction(state, (working, player) => {
    const war = working.wars.find((entry) => entry.id === warId);
    if (!war || war.attackerId !== player.id && war.defenderId !== player.id) return failure("\u65E0\u6CD5\u5904\u7406\u4E0D\u5C5E\u4E8E\u73A9\u5BB6\u7684\u6218\u4E89");
    if (player.resources.influence < 30) return failure("\u8BAE\u548C\u9700\u8981 30 \u5F71\u54CD\u529B");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    const otherId = war.attackerId === player.id ? war.defenderId : war.attackerId;
    const startingCapital = player.capital;
    makePeace(working, war);
    if (!sharedWorld && working.provinces[startingCapital]?.ownerId !== player.id) working.victory.type = "fail_capital_lost";
    recordDiplomaticIncident(working, otherId, player.id, "peace", 5, "\u63A5\u53D7\u8BAE\u548C\u5E76\u8FDB\u5165\u505C\u6218\u671F");
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
function reclamationBlocker(player, province) {
  if (province.terrain === "ocean") return "\u6D77\u57DF\u65E0\u6CD5\u5F00\u57A6";
  if (province.agriBase >= 12) return "\u519C\u4E1A\u57FA\u7840\u5DF2\u8FBE\u4E0A\u9650";
  if (player.resources.gold < 60) return "\u91D1\u4E0D\u8DB3";
  if (player.resources.adminPt < 1) return "\u884C\u52A8\u70B9\u4E0D\u8DB3\uFF08\u9700 1\uFF09";
  return null;
}
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
function bordersNation(province, provinces, nationId) {
  return province.adjacent.some((id) => provinces[id]?.ownerId === nationId);
}
function occupationTroops(province) {
  return Math.max(100, province.garrison + 50);
}
function developProvinceAction(state, provinceId, kind) {
  return runGameAction(state, (working, player) => {
    const province = working.provinces[provinceId];
    if (!province) return failure("\u7701\u4EFD\u4E0D\u5B58\u5728");
    const neutralAction = kind === "neutral_negotiate" || kind === "neutral_colonize" || kind === "neutral_occupy";
    if (neutralAction) {
      if (working.nations[province.ownerId]) return failure("\u8BE5\u7701\u4EFD\u5DF2\u6709\u56FD\u5BB6\u7EDF\u6CBB\uFF0C\u5E94\u901A\u8FC7\u5916\u4EA4\u6216\u6218\u4E89\u5904\u7406");
      if (!bordersNation(province, working.provinces, player.id)) return failure("\u53EA\u80FD\u62D3\u5C55\u4E0E\u672C\u56FD\u63A5\u58E4\u7684\u4E2D\u7ACB\u7701\u4EFD");
      if (kind === "neutral_negotiate" && (player.resources.gold < 80 || player.resources.influence < 40)) return failure("\u4EA4\u6D89\u9700\u8981 80 \u91D1\u4E0E 40 \u5F71\u54CD\u529B");
      if (kind === "neutral_colonize" && (player.resources.gold < 120 || player.resources.food < 150)) return failure("\u79FB\u6C11\u5F00\u62D3\u9700\u8981 120 \u91D1\u4E0E 150 \u7CAE");
      const armySize2 = player.army.reduce((total, army) => total + army.size, 0);
      if (kind === "neutral_occupy" && (player.resources.supply < 60 || armySize2 < occupationTroops(province))) return failure("\u519B\u4E8B\u5360\u9886\u9700\u8981 60 \u8865\u7ED9\u4E0E\u8DB3\u591F\u519B\u529B");
      const apFailure2 = spendAdmin(player, kind === "neutral_occupy" ? 1 : 2);
      if (apFailure2) return apFailure2;
      if (kind === "neutral_negotiate") {
        player.resources.gold -= 80;
        player.resources.influence -= 40;
        province.loyalty = 55;
        province.assimilation = Math.max(35, province.assimilation);
        province.unrest = Math.min(25, province.unrest);
        province.rebellionRisk = Math.min(25, province.rebellionRisk);
      } else if (kind === "neutral_colonize") {
        player.resources.gold -= 120;
        player.resources.food -= 150;
        province.loyalty = 42;
        province.assimilation = Math.max(25, province.assimilation);
        province.unrest = Math.max(25, province.unrest);
        province.rebellionRisk = Math.max(20, province.rebellionRisk);
      } else {
        player.resources.supply -= 60;
        province.loyalty = 20;
        province.assimilation = Math.min(20, province.assimilation);
        province.unrest = Math.max(60, province.unrest);
        province.rebellionRisk = Math.max(55, province.rebellionRisk);
        province.garrison = Math.max(50, province.garrison);
        player.warExhaustion = Math.min(100, player.warExhaustion + 4);
      }
      province.ownerId = player.id;
      addChronicle(working, { turn: working.turn, kind: "expansion", title: "\u8FB9\u7586\u7EB3\u5165\u7248\u56FE", desc: `${province.name}\u901A\u8FC7${kind === "neutral_negotiate" ? "\u4EA4\u6D89\u5F52\u9644" : kind === "neutral_colonize" ? "\u79FB\u6C11\u5F00\u62D3" : "\u519B\u4E8B\u5360\u9886"}\u7EB3\u5165\u56FD\u5BB6\u3002`, actorId: player.id });
      return success(`${province.name}\u5DF2\u7EB3\u5165\u7248\u56FE`);
    }
    if (province.ownerId !== player.id) return failure("\u53EA\u80FD\u5F00\u53D1\u672C\u56FD\u7701\u4EFD");
    if (!["reclaim", "garrison_deploy", "garrison_recall"].includes(kind)) return failure("\u672A\u77E5\u7701\u4EFD\u64CD\u4F5C");
    if (kind === "reclaim") {
      const blocker = reclamationBlocker(player, province);
      if (blocker) return failure(blocker);
    }
    const capitalArmy = player.army.find((army) => army.location === player.capital);
    if (kind === "garrison_deploy" && (!capitalArmy || capitalArmy.size < 50)) return failure("\u9996\u90FD\u519B\u961F\u4E0D\u8DB3");
    if (kind === "garrison_recall" && province.garrison < 50) return failure("\u9A7B\u519B\u4E0D\u8DB3");
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    if (kind === "reclaim") {
      player.resources.gold -= 60;
      province.priorAgriBase ??= province.agriBase;
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
    const rebels = player.civilWar.rebels;
    for (const province of Object.values(working.provinces)) {
      if (rebels.includes(province.ownerId)) {
        province.ownerId = player.id;
        province.isCapital = province.id === player.capital;
      }
    }
    removeRebelNations(working, rebels);
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
    const rebels = player.civilWar.rebels;
    for (const id of rebels) {
      const rebel = working.nations[id];
      if (!rebel) continue;
      recognizeRebelIndependence(rebel);
      for (const [from, to] of [[player.id, id], [id, player.id]]) {
        const relation = working.relations.find((r) => r.from === from && r.to === to);
        if (relation) {
          relation.treaty = "truce";
          relation.truceTurns = 10;
        } else {
          working.relations.push({ from, to, treaty: "truce", truceTurns: 10, relation: -45, trust: 0, threat: 0, tradeDep: 0 });
        }
      }
    }
    working.wars = working.wars.filter((war) => !(war.attackerId === player.id && rebels.includes(war.defenderId)) && !(war.defenderId === player.id && rebels.includes(war.attackerId)));
    syncWarFlags(working);
    player.civilWar = { active: false, rebels: [] };
    player.government.legitimacy = clamp5(player.government.legitimacy - 15, 0, 100);
    player.government.stability = clamp5(player.government.stability + 15, 0, 100);
    addChronicle(working, {
      turn: working.turn,
      kind: "milestone_rebellion",
      title: "\u5185\u6218\u548C\u8BAE",
      desc: `\u671D\u5EF7\u627F\u8BA4 ${rebels.length} \u4E2A\u53DB\u4E71\u653F\u6743\u7684\u65E2\u6210\u5730\u4F4D\uFF0C\u6362\u53D6\u505C\u6218\u3002`,
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
    const summitImpact = record.outcome === "breakthrough" ? 16 : record.outcome === "agreement" ? 10 : record.outcome === "breakdown" ? -12 : record.outcome === "rejected" ? -6 : 2;
    recordDiplomaticIncident(working, targetId, player.id, "summit", summitImpact, record.summary);
    const commitmentText = record.commitments.length > 0 ? `\u627F\u8BFA\uFF1A${record.commitments.join("\uFF1B")}` : `${SUMMIT_AGENDAS[agenda].label}\u672A\u5F62\u6210\u957F\u671F\u534F\u8BAE`;
    return success(record.summary, commitmentText);
  });
}

// src/gameplay/borderPact.ts
var RENEWAL_EVENT = "evt_eastern_renewal";
var pactTerms = {
  trade: { years: 5, gold: 0, reason: "\u4E24\u5E74\u5546\u8DEF\u4EA4\u5272\uFF0C\u90BB\u56FD\u613F\u514D\u6536\u793C\u91D1\u3002" },
  peace: { years: 5, gold: 50, reason: "\u8FB9\u5883\u5B88\u7EA6\uFF0C\u90BB\u56FD\u613F\u6309\u65E7\u793C\u7EED\u7B7E\u3002" },
  wary: { years: 3, gold: 120, reason: "\u90BB\u56FD\u4ECD\u6709\u6212\u5FC3\uFF0C\u53EA\u80AF\u7B7E\u77ED\u7EA6\u3002" }
};
function openingPact(state) {
  return state.diplomaticAccords.find((a) => a.partyA === state.playerNationId && a.agenda === "security" && a.startedTurn === 0 && a.expiresTurn === 5);
}
function renewalBlocker(state, pending) {
  const quote = pending.renewal;
  const pact = openingPact(state);
  const partner = state.nations[pending.partnerId ?? ""];
  if (!quote || !Object.prototype.hasOwnProperty.call(pactTerms, quote.terms) || !pact || pact.id !== quote.accordId || pact.partyA !== pending.nationId || pact.partyB !== partner?.id || !partner || partner.defeated || pact.expiresTurn !== state.turn || !peacefulRelationPair(state, pact.partyA, pact.partyB)) return "\u63D0\u8BAE\u5DF2\u5931\u6548";
  return state.nations[pending.nationId].resources.gold < pactTerms[quote.terms].gold ? "\u91D1\u4E0D\u8DB3" : null;
}
function renewBorderPact(state, pending) {
  const pact = openingPact(state);
  const { gold, years } = pactTerms[pending.renewal.terms];
  state.nations[pact.partyA].resources.gold -= gold;
  state.nations[pact.partyB].resources.gold += gold;
  pact.expiresTurn += years;
  return `\u4E0E${state.nations[pact.partyB].name}\u7EED\u7EA6${years}\u5E74\uFF0C\u793C\u91D1${gold}\u91D1\u3002`;
}

// src/gameplay/campaignDecisions.ts
function decisionBlocker(state, pending, option2) {
  if (pending.eventId === RENEWAL_EVENT && option2 === 0) return renewalBlocker(state, pending);
  const needsPartner = option2 === 0 && (pending.eventId === "evt_eastern_envoy" || pending.eventId === "evt_grain_budget");
  if (needsPartner && (!pending.partnerId || !state.nations[pending.partnerId] || state.nations[pending.partnerId].defeated || state.relations.some((r) => r.from === pending.nationId && r.to === pending.partnerId && r.treaty === "war"))) return "\u63D0\u8BAE\u5DF2\u5931\u6548";
  if (pending.eventId !== "evt_grain_budget" || option2 === 2) return null;
  const nation = state.nations[pending.nationId];
  if (!nation || !pending.works) return "\u63D0\u8BAE\u5DF2\u5931\u6548";
  if (option2 === 0) return null;
  const place = state.provinces[pending.works.provinceId];
  if (place?.ownerId !== nation.id || place.agriBase >= 12) return "\u63D0\u8BAE\u5DF2\u5931\u6548";
  return nation.resources.gold < pending.works.price ? "\u91D1\u4E0D\u8DB3" : null;
}
function settleCampaignDecision(state, pending, option2) {
  const nation = state.nations[pending.nationId];
  let detail;
  if (pending.eventId === "evt_eastern_envoy" && option2 === 0 && pending.partnerId) {
    state.diplomaticAccords.push({
      id: allocateEntityId(state, "accord"),
      partyA: nation.id,
      partyB: pending.partnerId,
      agenda: "security",
      strength: 1,
      tradeYears: 0,
      startedTurn: state.turn,
      expiresTurn: state.turn + 5
    });
    recordDiplomaticIncident(state, pending.partnerId, nation.id, "alliance", 8, "\u7B7E\u4E0B\u4E94\u5E74\u7EA6\u4E66");
  } else if (pending.eventId === RENEWAL_EVENT) {
    if (option2 === 0) detail = renewBorderPact(state, pending);
    else if (pending.partnerId && state.nations[pending.partnerId]) detail = `\u4E0E${state.nations[pending.partnerId].name}\u7684\u8FB9\u7EA6\u6309\u671F\u7ED3\u675F\u3002`;
  } else if (pending.eventId === "evt_grain_budget" && pending.works && pending.partnerId) {
    const { price, provinceId, quantity } = pending.works;
    if (option2 === 0) nation.grainContract = { partnerId: pending.partnerId, quantity, yearsLeft: 3 };
    if (option2 === 1) {
      const province = state.provinces[provinceId];
      nation.resources.gold -= price;
      province.priorAgriBase ??= province.agriBase;
      province.agriBase = Math.min(12, province.agriBase + 2);
    }
  } else if (pending.eventId !== "evt_eastern_reform" && pending.eventId !== "evt_eastern_envoy") return;
  const event = EVENT_BY_ID[pending.eventId];
  addChronicle(state, {
    turn: state.turn,
    kind: pending.eventId === "evt_eastern_envoy" || pending.eventId === RENEWAL_EVENT ? "milestone_diplomacy" : "reform",
    actorId: nation.id,
    title: event.title,
    desc: detail ?? event.options[option2].text
  });
}

// src/gameplay/pendingEventResolution.ts
var eventUpdates = new Immer2({ autoFreeze: false });
function pendingIndex(state, nationId, eventId) {
  return state.pendingEvents.findIndex((pending) => pending.nationId === nationId && pending.eventId === eventId);
}
function resolvePendingEventChoice(state, nationId, eventId, optionIndex) {
  const event = EVENT_BY_ID[eventId];
  const option2 = event?.options[optionIndex];
  const index = pendingIndex(state, nationId, eventId);
  if (!event || !option2 || !state.nations[nationId] || index < 0 || decisionBlocker(state, state.pendingEvents[index], optionIndex)) {
    return { state, resolved: false };
  }
  const next = eventUpdates.produce(state, (draft) => {
    draft._relMap = void 0;
    applyEffect(draft.nations[nationId], option2.effects, draft);
    settleCampaignDecision(draft, draft.pendingEvents[index], optionIndex);
    recordEvent(draft, nationId, eventId, optionIndex);
    draft.pendingEvents.splice(index, 1);
    if (draft.pendingEventOptions?.nationId === nationId && draft.pendingEventOptions.eventId === eventId) draft.pendingEventOptions = null;
  });
  return {
    state: next,
    resolved: true,
    eventTitle: event.title,
    optionText: option2.text
  };
}

// scripts/shared-world-engine-entry.ts
function prepareSharedSnapshot(state) {
  const next = { ...state, pendingEvents: validPendingEvents(state) };
  for (const province of Object.values(state.provinces)) {
    const oceanCapital = legacyOceanCapital(state, province);
    if (!oceanCapital && province.classes?.length && province.classes.every((group) => group.weight !== void 0)) continue;
    if (next.provinces === state.provinces) next.provinces = { ...state.provinces };
    const restored = { ...province, classes: (province.classes ?? []).map((group) => ({ ...group })) };
    if (oceanCapital) restoreCapitalTerrain(restored);
    setProvincePopulation(restored, province.population);
    next.provinces[province.id] = restored;
  }
  for (const nation of Object.values(state.nations)) {
    if (!nation.activePolicies?.some((policy) => policy.policyId === "crop_rotation") || nation.policyMods?.foodOutputMod !== void 0) continue;
    if (next.nations === state.nations) next.nations = { ...state.nations };
    next.nations[nation.id] = { ...nation, policyMods: derivePolicyMods(nation) };
  }
  const options = next.pendingEventOptions;
  if (!next.pendingEvents.some((p) => p.eventId === options?.eventId && p.nationId === options?.nationId)) next.pendingEventOptions = null;
  if (!next.sharedChronicles) {
    next.chronicle = [];
    next.sharedChronicles = {};
    for (const entry of state.chronicle ?? []) {
      const owner = entry.kind === "founding" ? Object.values(state.nations).find((n3) => entry.title === `${n3.name} \u7ACB\u56FD`)?.id : void 0;
      if (personalChronicleOwner(entry) || owner) addChronicle(next, owner ? { ...entry, actorId: owner } : entry);
      else next.chronicle.push(entry);
    }
  }
  return next;
}
function sharedRulerSnapshot(state, nationId) {
  const { sharedFocuses, sharedHistories, sharedChronicles, ...view } = sharedNationView(state, nationId);
  view.chronicle = [...state.chronicle, ...sharedChronicles?.[nationId] ?? []].sort((a, b) => a.turn - b.turn).slice(-CHRONICLE_MAX);
  view.pendingEvents = state.pendingEvents.filter((entry) => entry.nationId === nationId);
  const options = state.pendingEventOptions;
  view.pendingEventOptions = options?.nationId === nationId ? options : null;
  return view;
}
var STRATEGY_FOCUSES = /* @__PURE__ */ new Set(["balance", "stability", "prosperity", "military", "diplomacy", "reform"]);
function createSharedWorldSnapshot() {
  return prepareSharedSnapshot(createWorldState(20260722));
}
function workingNationView(state, nationId) {
  const view = sharedNationView(state.sharedChronicles ? state : prepareSharedSnapshot(state), nationId);
  view.sharedFocuses ??= { [state.playerNationId]: state.strategyFocus ?? "balance" };
  if (!view.sharedHistories) {
    view.sharedHistories = {};
    for (const report of state.history) (view.sharedHistories[report.nationId] ??= []).push(report);
  }
  view.triggeredEvents = state.triggeredEvents.map((e) => e.nationId ? e : { ...e, nationId: state.playerNationId });
  view.eventCooldowns = state.eventCooldowns.map((e) => e.nationId ? e : { ...e, nationId: state.playerNationId });
  return view;
}
function applySharedWorldCommand(state, nationId, payload) {
  if (!state.nations[nationId] || state.nations[nationId].defeated) throw new Error("\u56FD\u5BB6\u4E0D\u5B58\u5728\u6216\u5DF2\u7ECF\u8986\u4EA1");
  const working = workingNationView(structuredClone(state), nationId);
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
    case "set_strategy_focus": {
      const focus = text(0);
      if (!STRATEGY_FOCUSES.has(focus)) throw new Error("\u56FD\u7B56\u7126\u70B9\u65E0\u6548");
      working.sharedFocuses[nationId] = working.strategyFocus = focus;
      result = { ok: true, state: working, messages: ["\u56FD\u7B56\u7126\u70B9\u5DF2\u66F4\u65B0"] };
      break;
    }
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
      result = makePeaceAction(working, text(0), true);
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
  const rulers = [...new Set(humanNationIds)].filter((id) => state.nations[id] && !state.nations[id].defeated).sort();
  const reference = rulers[0] ?? Object.values(state.nations).find((n3) => !n3.defeated)?.id;
  if (!reference) throw new Error("\u7248\u56FE\u5DF2\u65E0\u5B58\u7EED\u56FD\u5BB6");
  const view = workingNationView(state, reference);
  return processTurn(view, { humanNationIds: rulers, sharedWorld: true }).state;
}
export {
  advanceSharedWorld,
  applySharedWorldCommand,
  createSharedWorldSnapshot,
  prepareSharedSnapshot,
  sharedNationView,
  sharedRulerSnapshot
};
