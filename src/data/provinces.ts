// Imperium Aeternum — 省份表（超庞大扩展版 v2）
// 50 个省份：含陆地、海洋、要塞、贸易节点
// 数据源：docs/01-design-bible.md §5 / 扩展决策 DEC-009
// FROZEN v2（扩展 A）

export type Terrain =
  | 'plain' | 'hill' | 'mountain' | 'coast' | 'forest' | 'desert'
  | 'tundra' | 'jungle' | 'swamp' | 'ocean' | 'island';

// 海拔（影响战斗与基建）
export type Elevation = 'low' | 'medium' | 'high' | 'peak';
// 气候（影响农业与人口增长）
export type Climate = 'temperate' | 'mediterranean' | 'arid' | 'tropical' | 'cold' | 'polar';
// 省份类型
export type ProvinceType = 'land' | 'ocean' | 'fortress' | 'trade_node' | 'capital';

export type CultureId =
  | 'latin' | 'hellenic' | 'orient' | 'nordic' | 'desert'
  | 'celtic' | 'germanic' | 'slavic' | 'iberian' | 'african' | 'persian' | 'indian' | 'sinic'
  // W2 扩展：11 新文化（DEC-011 24 文化目标）
  | 'sinic_offshoot' | 'maritime' | 'indigenous_americas' | 'indigenous_africa'
  | 'nomadic' | 'steppe' | 'mesoamerican' | 'andean' | 'polynesian' | 'arab' | 'turkic';
export type ReligionId =
  | 'polytheism' | 'monotheism_a' | 'monotheism_b' | 'animism'
  | 'sun_worship' | 'ancestor' | 'mystery_cult'
  // W2 扩展：7 新宗教（DEC-011 14 宗教目标）
  | 'sinic_religion' | 'indian_religion' | 'shamanism'
  | 'monotheism_c' | 'dualism' | 'fertility_cult' | 'sea_cult';

export interface ProvinceDef {
  id: string;            // 'p01'..'p50'
  name: string;
  terrain: Terrain;
  type: ProvinceType;
  ownerId: string;       // 国家 id（'barbarian' 表示无主/蛮族）
  isCapital: boolean;
  agriBase: number;      // 农业基础值 0-2.0（海洋=0）
  culture: CultureId;
  religion: ReligionId;
  initPop: number;       // 海洋省份=0
  initClassRatio: {
    peasants: number; workers: number; merchants: number;
    soldiers: number; scholars: number; nobles: number; clergy: number;
  };
  baseResources: { wood?: number; iron?: number; stone?: number; luxury?: number; spice?: number; silk?: number };
  adjacent: string[];
  distToPlayerCapital: number;
  // 扩展字段
  elevation: Elevation;
  climate: Climate;
  hasRiver: boolean;       // 河流：粮产+贸易
  isTradeNode: boolean;    // 贸易节点
  tradeNodeTier?: 1 | 2 | 3; // 节点等级（影响贸易量）
  fortressLevel?: number;  // 要塞等级 0-3
  // 地理坐标（用于 SVG 地图渲染）
  x: number; y: number;
}

// 工具：默认陆地阶层比例
const LAND_RATIO = {
  peasants: 0.55, workers: 0.15, merchants: 0.10, soldiers: 0.08, scholars: 0.04, nobles: 0.05, clergy: 0.03,
};
const POOR_RATIO = {
  peasants: 0.65, workers: 0.10, merchants: 0.05, soldiers: 0.10, scholars: 0.02, nobles: 0.05, clergy: 0.03,
};
const TRADE_RATIO = {
  peasants: 0.40, workers: 0.15, merchants: 0.20, soldiers: 0.08, scholars: 0.05, nobles: 0.07, clergy: 0.05,
};
const OCEAN_RATIO = { peasants: 0, workers: 0, merchants: 0, soldiers: 0, scholars: 0, nobles: 0, clergy: 0 };

export const PROVINCES: ProvinceDef[] = [
  // ── 玩家罗马核心区（p01-p06）──
  { id: 'p01', name: '罗马', terrain: 'plain', type: 'capital', ownerId: 'n01', isCapital: true,
    agriBase: 1.4, culture: 'latin', religion: 'polytheism', initPop: 1200, initClassRatio: TRADE_RATIO,
    baseResources: { wood: 20, stone: 10 }, adjacent: ['p02', 'p03', 'p04', 'p07'],
    distToPlayerCapital: 0, elevation: 'low', climate: 'mediterranean', hasRiver: true, isTradeNode: true, tradeNodeTier: 2, fortressLevel: 2, x: 500, y: 380 },
  { id: 'p02', name: '埃特鲁里亚', terrain: 'hill', type: 'land', ownerId: 'n01', isCapital: false,
    agriBase: 0.9, culture: 'latin', religion: 'polytheism', initPop: 500, initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, iron: 10, stone: 15 }, adjacent: ['p01', 'p04', 'p05', 'p08'],
    distToPlayerCapital: 1, elevation: 'medium', climate: 'mediterranean', hasRiver: false, isTradeNode: false, fortressLevel: 1, x: 470, y: 340 },
  { id: 'p03', name: '大希腊', terrain: 'coast', type: 'land', ownerId: 'n01', isCapital: false,
    agriBase: 1.1, culture: 'hellenic', religion: 'polytheism', initPop: 600, initClassRatio: TRADE_RATIO,
    baseResources: { wood: 10 }, adjacent: ['p01', 'p06', 'p09'],
    distToPlayerCapital: 1, elevation: 'low', climate: 'mediterranean', hasRiver: true, isTradeNode: true, tradeNodeTier: 1, x: 540, y: 420 },
  { id: 'p04', name: '萨莫奈', terrain: 'mountain', type: 'land', ownerId: 'n01', isCapital: false,
    agriBase: 0.5, culture: 'latin', religion: 'polytheism', initPop: 300, initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 20, stone: 20 }, adjacent: ['p01', 'p02', 'p05', 'p10'],
    distToPlayerCapital: 1, elevation: 'high', climate: 'temperate', hasRiver: false, isTradeNode: false, fortressLevel: 1, x: 520, y: 360 },
  { id: 'p05', name: '翁布里亚', terrain: 'hill', type: 'land', ownerId: 'n01', isCapital: false,
    agriBase: 0.9, culture: 'latin', religion: 'polytheism', initPop: 400, initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, stone: 10 }, adjacent: ['p02', 'p04', 'p08', 'p11'],
    distToPlayerCapital: 2, elevation: 'medium', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 480, y: 310 },
  { id: 'p06', name: '坎帕尼亚', terrain: 'plain', type: 'land', ownerId: 'n01', isCapital: false,
    agriBase: 1.5, culture: 'hellenic', religion: 'polytheism', initPop: 700, initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, luxury: 5 }, adjacent: ['p03', 'p09', 'p10'],
    distToPlayerCapital: 2, elevation: 'low', climate: 'mediterranean', hasRiver: true, isTradeNode: true, tradeNodeTier: 1, x: 530, y: 450 },

  // ── 北意大利联邦 n02（p07-p12）──
  { id: 'p07', name: '维尼托', terrain: 'plain', type: 'capital', ownerId: 'n02', isCapital: true,
    agriBase: 1.2, culture: 'nordic', religion: 'monotheism_a', initPop: 800, initClassRatio: TRADE_RATIO,
    baseResources: { wood: 20 }, adjacent: ['p01', 'p08', 'p11', 'p13'],
    distToPlayerCapital: 2, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: true, tradeNodeTier: 2, fortressLevel: 1, x: 510, y: 260 },
  { id: 'p08', name: '山南高卢', terrain: 'mountain', type: 'land', ownerId: 'n02', isCapital: false,
    agriBase: 0.5, culture: 'celtic', religion: 'animism', initPop: 350, initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 25, stone: 15 }, adjacent: ['p02', 'p05', 'p07', 'p11', 'p14', 'p34'],
    distToPlayerCapital: 2, elevation: 'high', climate: 'temperate', hasRiver: false, isTradeNode: false, fortressLevel: 2, x: 450, y: 280 },
  { id: 'p09', name: '卢卡尼亚', terrain: 'hill', type: 'land', ownerId: 'n02', isCapital: false,
    agriBase: 0.7, culture: 'hellenic', religion: 'polytheism', initPop: 300, initClassRatio: LAND_RATIO,
    baseResources: { wood: 12 }, adjacent: ['p03', 'p06', 'p10', 'p18'],
    distToPlayerCapital: 3, elevation: 'medium', climate: 'mediterranean', hasRiver: false, isTradeNode: false, x: 510, y: 490 },
  { id: 'p10', name: '普利亚', terrain: 'plain', type: 'land', ownerId: 'n02', isCapital: false,
    agriBase: 1.0, culture: 'hellenic', religion: 'polytheism', initPop: 450, initClassRatio: LAND_RATIO,
    baseResources: { wood: 8, luxury: 3 }, adjacent: ['p04', 'p06', 'p09', 'p18'],
    distToPlayerCapital: 3, elevation: 'low', climate: 'mediterranean', hasRiver: false, isTradeNode: false, x: 570, y: 460 },
  { id: 'p11', name: '雷蒂亚', terrain: 'mountain', type: 'fortress', ownerId: 'n02', isCapital: false,
    agriBase: 0.4, culture: 'germanic', religion: 'animism', initPop: 250, initClassRatio: POOR_RATIO,
    baseResources: { wood: 15, iron: 20, stone: 25 }, adjacent: ['p05', 'p07', 'p08', 'p14'],
    distToPlayerCapital: 3, elevation: 'high', climate: 'cold', hasRiver: true, isTradeNode: false, fortressLevel: 3, x: 470, y: 220 },
  { id: 'p12', name: '亚得里亚海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'hellenic', religion: 'polytheism', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p07', 'p09', 'p10', 'p18', 'p22', 'p23'],
    distToPlayerCapital: 3, elevation: 'low', climate: 'mediterranean', hasRiver: false, isTradeNode: true, tradeNodeTier: 2, x: 580, y: 320 },

  // ── 大希腊叙拉古 n03（p13-p18）──
  { id: 'p13', name: '叙拉古', terrain: 'coast', type: 'capital', ownerId: 'n03', isCapital: true,
    agriBase: 1.0, culture: 'hellenic', religion: 'polytheism', initPop: 700, initClassRatio: TRADE_RATIO,
    baseResources: { wood: 10, luxury: 8 }, adjacent: ['p07', 'p14', 'p15', 'p18', 'p22'],
    distToPlayerCapital: 3, elevation: 'low', climate: 'mediterranean', hasRiver: true, isTradeNode: true, tradeNodeTier: 3, fortressLevel: 2, x: 560, y: 540 },
  { id: 'p14', name: '诺里库姆', terrain: 'mountain', type: 'land', ownerId: 'n03', isCapital: false,
    agriBase: 0.4, culture: 'germanic', religion: 'animism', initPop: 280, initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 30, stone: 10 }, adjacent: ['p08', 'p11', 'p13', 'p16'],
    distToPlayerCapital: 4, elevation: 'high', climate: 'cold', hasRiver: true, isTradeNode: false, fortressLevel: 1, x: 420, y: 200 },
  { id: 'p15', name: '昔兰尼', terrain: 'desert', type: 'land', ownerId: 'n03', isCapital: false,
    agriBase: 0.3, culture: 'african', religion: 'monotheism_a', initPop: 300, initClassRatio: POOR_RATIO,
    baseResources: { spice: 10, luxury: 5 }, adjacent: ['p13', 'p22', 'p27'],
    distToPlayerCapital: 5, elevation: 'low', climate: 'arid', hasRiver: false, isTradeNode: true, tradeNodeTier: 2, x: 600, y: 600 },
  { id: 'p16', name: '潘诺尼亚', terrain: 'plain', type: 'land', ownerId: 'n03', isCapital: false,
    agriBase: 1.1, culture: 'slavic', religion: 'monotheism_b', initPop: 450, initClassRatio: LAND_RATIO,
    baseResources: { wood: 20 }, adjacent: ['p14', 'p17', 'p24'],
    distToPlayerCapital: 4, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 440, y: 180 },
  { id: 'p17', name: '达尔马提亚', terrain: 'coast', type: 'land', ownerId: 'n03', isCapital: false,
    agriBase: 0.6, culture: 'slavic', religion: 'monotheism_b', initPop: 320, initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, stone: 10 }, adjacent: ['p12', 'p16', 'p19', 'p22', 'p23', 'p24'],
    distToPlayerCapital: 4, elevation: 'medium', climate: 'mediterranean', hasRiver: false, isTradeNode: false, x: 500, y: 200 },
  { id: 'p18', name: '布鲁提乌姆', terrain: 'coast', type: 'land', ownerId: 'n03', isCapital: false,
    agriBase: 0.8, culture: 'hellenic', religion: 'polytheism', initPop: 350, initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, luxury: 4 }, adjacent: ['p09', 'p10', 'p12', 'p13'],
    distToPlayerCapital: 4, elevation: 'medium', climate: 'mediterranean', hasRiver: false, isTradeNode: false, x: 540, y: 510 },

  // ── 东方帝国 n04（p19-p26）──
  { id: 'p19', name: '达契亚', terrain: 'forest', type: 'capital', ownerId: 'n04', isCapital: true,
    agriBase: 0.7, culture: 'orient', religion: 'animism', initPop: 600, initClassRatio: LAND_RATIO,
    baseResources: { wood: 30, iron: 15, stone: 10 }, adjacent: ['p17', 'p20', 'p24', 'p25'],
    distToPlayerCapital: 5, elevation: 'medium', climate: 'temperate', hasRiver: true, isTradeNode: true, tradeNodeTier: 1, fortressLevel: 2, x: 460, y: 130 },
  { id: 'p20', name: '本都', terrain: 'mountain', type: 'land', ownerId: 'n04', isCapital: false,
    agriBase: 0.4, culture: 'persian', religion: 'monotheism_b', initPop: 350, initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 25, stone: 15 }, adjacent: ['p19', 'p21', 'p25', 'p29'],
    distToPlayerCapital: 6, elevation: 'high', climate: 'temperate', hasRiver: true, isTradeNode: false, fortressLevel: 2, x: 540, y: 100 },
  { id: 'p21', name: '卡帕多西亚', terrain: 'plain', type: 'land', ownerId: 'n04', isCapital: false,
    agriBase: 0.9, culture: 'persian', religion: 'monotheism_b', initPop: 400, initClassRatio: LAND_RATIO,
    baseResources: { wood: 10, spice: 5 }, adjacent: ['p20', 'p25', 'p29', 'p30'],
    distToPlayerCapital: 6, elevation: 'medium', climate: 'arid', hasRiver: true, isTradeNode: true, tradeNodeTier: 1, x: 580, y: 110 },
  { id: 'p22', name: '爱琴海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'hellenic', religion: 'polytheism', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p12', 'p13', 'p15', 'p17', 'p23', 'p27'],
    distToPlayerCapital: 5, elevation: 'low', climate: 'mediterranean', hasRiver: false, isTradeNode: true, tradeNodeTier: 3, x: 580, y: 480 },
  { id: 'p23', name: '色雷斯', terrain: 'plain', type: 'land', ownerId: 'n04', isCapital: false,
    agriBase: 1.0, culture: 'hellenic', religion: 'monotheism_b', initPop: 420, initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, iron: 10 }, adjacent: ['p12', 'p17', 'p22', 'p24', 'p29'],
    distToPlayerCapital: 5, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 540, y: 180 },
  { id: 'p24', name: '默西亚', terrain: 'forest', type: 'land', ownerId: 'n04', isCapital: false,
    agriBase: 0.6, culture: 'slavic', religion: 'animism', initPop: 300, initClassRatio: POOR_RATIO,
    baseResources: { wood: 25, iron: 8 }, adjacent: ['p16', 'p17', 'p19', 'p23'],
    distToPlayerCapital: 5, elevation: 'medium', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 480, y: 160 },
  { id: 'p25', name: '亚美尼亚', terrain: 'mountain', type: 'fortress', ownerId: 'n04', isCapital: false,
    agriBase: 0.3, culture: 'persian', religion: 'monotheism_b', initPop: 280, initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 20, stone: 20 }, adjacent: ['p19', 'p20', 'p21', 'p29'],
    distToPlayerCapital: 6, elevation: 'high', climate: 'cold', hasRiver: true, isTradeNode: false, fortressLevel: 3, x: 600, y: 80 },
  { id: 'p26', name: '黑海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'hellenic', religion: 'polytheism', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p12', 'p17', 'p20', 'p23', 'p25'],
    distToPlayerCapital: 6, elevation: 'low', climate: 'cold', hasRiver: false, isTradeNode: true, tradeNodeTier: 2, x: 600, y: 200 },

  // ── 蛮族联盟 n05（p27-p32 边缘蛮区）──
  { id: 'p27', name: '昔提亚', terrain: 'tundra', type: 'capital', ownerId: 'n05', isCapital: true,
    agriBase: 0.2, culture: 'slavic', religion: 'animism', initPop: 200, initClassRatio: POOR_RATIO,
    baseResources: { wood: 8, iron: 15 }, adjacent: ['p15', 'p22', 'p28'],
    distToPlayerCapital: 7, elevation: 'low', climate: 'cold', hasRiver: true, isTradeNode: false, x: 640, y: 580 },
  { id: 'p28', name: '萨尔马提亚', terrain: 'plain', type: 'land', ownerId: 'n05', isCapital: false,
    agriBase: 0.5, culture: 'slavic', religion: 'animism', initPop: 250, initClassRatio: POOR_RATIO,
    baseResources: { wood: 10, iron: 12 }, adjacent: ['p27', 'p29', 'p31'],
    distToPlayerCapital: 8, elevation: 'low', climate: 'cold', hasRiver: true, isTradeNode: false, x: 640, y: 300 },
  { id: 'p29', name: '科尔基斯', terrain: 'mountain', type: 'land', ownerId: 'n05', isCapital: false,
    agriBase: 0.3, culture: 'persian', religion: 'animism', initPop: 180, initClassRatio: POOR_RATIO,
    baseResources: { wood: 12, iron: 18 }, adjacent: ['p20', 'p21', 'p23', 'p25', 'p28', 'p30'],
    distToPlayerCapital: 7, elevation: 'high', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 620, y: 140 },
  { id: 'p30', name: '米底', terrain: 'desert', type: 'land', ownerId: 'n05', isCapital: false,
    agriBase: 0.2, culture: 'persian', religion: 'monotheism_b', initPop: 220, initClassRatio: POOR_RATIO,
    baseResources: { spice: 8, luxury: 4 }, adjacent: ['p21', 'p29', 'p31', 'p38'],
    distToPlayerCapital: 8, elevation: 'medium', climate: 'arid', hasRiver: false, isTradeNode: true, tradeNodeTier: 1, x: 660, y: 120 },
  { id: 'p31', name: '里海草原', terrain: 'plain', type: 'land', ownerId: 'n05', isCapital: false,
    agriBase: 0.4, culture: 'persian', religion: 'animism', initPop: 200, initClassRatio: POOR_RATIO,
    baseResources: { wood: 6, iron: 10 }, adjacent: ['p28', 'p30', 'p32', 'p38'],
    distToPlayerCapital: 9, elevation: 'low', climate: 'cold', hasRiver: false, isTradeNode: false, x: 680, y: 200 },
  { id: 'p32', name: '里海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'persian', religion: 'animism', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p26', 'p28', 'p31', 'p38'],
    distToPlayerCapital: 9, elevation: 'low', climate: 'cold', hasRiver: false, isTradeNode: true, tradeNodeTier: 1, x: 700, y: 160 },

  // ── 中立未开发省份（p33-p42，开局属 'barbarian'）──
  { id: 'p33', name: '不列颠', terrain: 'forest', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.5, culture: 'celtic', religion: 'animism', initPop: 300, initClassRatio: POOR_RATIO,
    baseResources: { wood: 25, iron: 15, stone: 10 }, adjacent: ['p34', 'p35'],
    distToPlayerCapital: 10, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 280, y: 120 },
  { id: 'p34', name: '高卢', terrain: 'forest', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.8, culture: 'celtic', religion: 'animism', initPop: 500, initClassRatio: POOR_RATIO,
    baseResources: { wood: 20, iron: 12 }, adjacent: ['p08', 'p33', 'p35', 'p36'],
    distToPlayerCapital: 4, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: false, x: 380, y: 200 },
  { id: 'p35', name: '伊比利亚', terrain: 'hill', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.6, culture: 'iberian', religion: 'animism', initPop: 400, initClassRatio: POOR_RATIO,
    baseResources: { wood: 15, iron: 20, stone: 10 }, adjacent: ['p33', 'p34', 'p36'],
    distToPlayerCapital: 6, elevation: 'medium', climate: 'mediterranean', hasRiver: true, isTradeNode: false, x: 300, y: 280 },
  { id: 'p36', name: '阿非利加', terrain: 'coast', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.4, culture: 'african', religion: 'monotheism_a', initPop: 350, initClassRatio: POOR_RATIO,
    baseResources: { wood: 8, spice: 6 }, adjacent: ['p34', 'p35', 'p37', 'p39'],
    distToPlayerCapital: 6, elevation: 'low', climate: 'arid', hasRiver: false, isTradeNode: true, tradeNodeTier: 1, x: 340, y: 480 },
  { id: 'p37', name: '毛里塔尼亚', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.2, culture: 'african', religion: 'monotheism_a', initPop: 200, initClassRatio: POOR_RATIO,
    baseResources: { spice: 5, luxury: 3 }, adjacent: ['p36', 'p39'],
    distToPlayerCapital: 8, elevation: 'low', climate: 'arid', hasRiver: false, isTradeNode: false, x: 320, y: 560 },
  { id: 'p38', name: '帕提亚', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.3, culture: 'persian', religion: 'monotheism_b', initPop: 400, initClassRatio: LAND_RATIO,
    baseResources: { spice: 10, silk: 5, luxury: 6 }, adjacent: ['p30', 'p31', 'p32', 'p40', 'p41'],
    distToPlayerCapital: 10, elevation: 'medium', climate: 'arid', hasRiver: true, isTradeNode: true, tradeNodeTier: 2, x: 720, y: 100 },
  { id: 'p39', name: '努米底亚', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.2, culture: 'african', religion: 'monotheism_a', initPop: 250, initClassRatio: POOR_RATIO,
    baseResources: { wood: 5, spice: 4 }, adjacent: ['p36', 'p37', 'p42'],
    distToPlayerCapital: 9, elevation: 'low', climate: 'arid', hasRiver: false, isTradeNode: false, x: 360, y: 600 },
  { id: 'p40', name: '波斯', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.4, culture: 'persian', religion: 'monotheism_b', initPop: 500, initClassRatio: LAND_RATIO,
    baseResources: { spice: 12, silk: 8, luxury: 8 }, adjacent: ['p38', 'p41', 'p43'],
    distToPlayerCapital: 12, elevation: 'medium', climate: 'arid', hasRiver: true, isTradeNode: true, tradeNodeTier: 3, x: 760, y: 120 },
  { id: 'p41', name: '巴比伦', terrain: 'plain', type: 'trade_node', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.8, culture: 'persian', religion: 'monotheism_b', initPop: 600, initClassRatio: TRADE_RATIO,
    baseResources: { spice: 15, silk: 10, luxury: 12 }, adjacent: ['p38', 'p40', 'p42', 'p43'],
    distToPlayerCapital: 13, elevation: 'low', climate: 'arid', hasRiver: true, isTradeNode: true, tradeNodeTier: 3, x: 760, y: 180 },
  { id: 'p42', name: '阿拉伯', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.1, culture: 'orient', religion: 'monotheism_a', initPop: 300, initClassRatio: POOR_RATIO,
    baseResources: { spice: 8, luxury: 4 }, adjacent: ['p39', 'p41', 'p43', 'p44'],
    distToPlayerCapital: 14, elevation: 'medium', climate: 'arid', hasRiver: false, isTradeNode: false, x: 700, y: 280 },

  // ── 远东贸易圈（p43-p50，开局均属 'barbarian'，是高端贸易节点）──
  { id: 'p43', name: '印度河口', terrain: 'coast', type: 'trade_node', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.6, culture: 'indian', religion: 'polytheism', initPop: 500, initClassRatio: TRADE_RATIO,
    baseResources: { spice: 20, silk: 8, luxury: 10 }, adjacent: ['p40', 'p41', 'p42', 'p44', 'p45', 'p46'],
    distToPlayerCapital: 16, elevation: 'low', climate: 'tropical', hasRiver: true, isTradeNode: true, tradeNodeTier: 3, x: 800, y: 240 },
  { id: 'p44', name: '阿拉伯海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'indian', religion: 'polytheism', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p42', 'p43', 'p45', 'p46'],
    distToPlayerCapital: 16, elevation: 'low', climate: 'tropical', hasRiver: false, isTradeNode: true, tradeNodeTier: 2, x: 780, y: 320 },
  { id: 'p45', name: '恒河', terrain: 'jungle', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 1.2, culture: 'indian', religion: 'polytheism', initPop: 700, initClassRatio: LAND_RATIO,
    baseResources: { wood: 20, spice: 15, silk: 6 }, adjacent: ['p43', 'p44', 'p46', 'p47'],
    distToPlayerCapital: 18, elevation: 'low', climate: 'tropical', hasRiver: true, isTradeNode: true, tradeNodeTier: 2, x: 840, y: 260 },
  { id: 'p46', name: '德干', terrain: 'jungle', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.7, culture: 'indian', religion: 'polytheism', initPop: 400, initClassRatio: LAND_RATIO,
    baseResources: { wood: 15, spice: 8, luxury: 5 }, adjacent: ['p43', 'p44', 'p45', 'p47'],
    distToPlayerCapital: 18, elevation: 'medium', climate: 'tropical', hasRiver: true, isTradeNode: false, x: 840, y: 320 },
  { id: 'p47', name: '丝路东段', terrain: 'desert', type: 'trade_node', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.2, culture: 'sinic', religion: 'ancestor', initPop: 350, initClassRatio: TRADE_RATIO,
    baseResources: { silk: 25, spice: 10, luxury: 8 }, adjacent: ['p45', 'p46', 'p48', 'p49'],
    distToPlayerCapital: 20, elevation: 'medium', climate: 'arid', hasRiver: false, isTradeNode: true, tradeNodeTier: 3, x: 880, y: 240 },
  { id: 'p48', name: '西域', terrain: 'desert', type: 'land', ownerId: 'barbarian', isCapital: false,
    agriBase: 0.1, culture: 'sinic', religion: 'ancestor', initPop: 200, initClassRatio: POOR_RATIO,
    baseResources: { silk: 12, luxury: 4 }, adjacent: ['p47', 'p49'],
    distToPlayerCapital: 22, elevation: 'medium', climate: 'arid', hasRiver: false, isTradeNode: false, x: 900, y: 200 },
  { id: 'p49', name: '中原', terrain: 'plain', type: 'trade_node', ownerId: 'barbarian', isCapital: false,
    agriBase: 1.6, culture: 'sinic', religion: 'ancestor', initPop: 1000, initClassRatio: LAND_RATIO,
    baseResources: { wood: 25, silk: 15, luxury: 10 }, adjacent: ['p47', 'p48', 'p50'],
    distToPlayerCapital: 24, elevation: 'low', climate: 'temperate', hasRiver: true, isTradeNode: true, tradeNodeTier: 3, x: 920, y: 240 },
  { id: 'p50', name: '东海', terrain: 'ocean', type: 'ocean', ownerId: 'barbarian', isCapital: false,
    agriBase: 0, culture: 'sinic', religion: 'ancestor', initPop: 0, initClassRatio: OCEAN_RATIO,
    baseResources: {}, adjacent: ['p49'],
    distToPlayerCapital: 26, elevation: 'low', climate: 'temperate', hasRiver: false, isTradeNode: true, tradeNodeTier: 2, x: 940, y: 280 },
];

export const PROVINCE_BY_ID: Record<string, ProvinceDef> = Object.fromEntries(
  PROVINCES.map((p) => [p.id, p]),
);

export const PROVINCE_IDS: string[] = PROVINCES.map((p) => p.id);
export const PROVINCE_COUNT = PROVINCES.length;

// 统计辅助
export const LAND_PROVINCES = PROVINCES.filter((p) => p.type !== 'ocean');
export const OCEAN_PROVINCES = PROVINCES.filter((p) => p.type === 'ocean');
export const TRADE_NODES = PROVINCES.filter((p) => p.isTradeNode);
export const FORTRESSES = PROVINCES.filter((p) => p.type === 'fortress' || (p.fortressLevel ?? 0) > 0);

export const TERRAIN_FOOD_MOD: Record<Terrain, number> = {
  plain: 1.2, hill: 0.8, mountain: 0.3, coast: 1.0, forest: 0.6, desert: 0.3,
  tundra: 0.2, jungle: 0.9, swamp: 0.5, ocean: 0, island: 0.7,
};

export const CLIMATE_FOOD_MOD: Record<Climate, number> = {
  temperate: 1.0, mediterranean: 1.1, arid: 0.5, tropical: 1.2, cold: 0.6, polar: 0.2,
};

export const ELEVATION_COMBAT_MOD: Record<Elevation, number> = {
  low: 1.0, medium: 1.1, high: 1.25, peak: 1.4,
};
