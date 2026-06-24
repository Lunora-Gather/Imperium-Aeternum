// Imperium Aeternum — 贸易路线表（C3 贸易路线 v1）
// 8 条预设贸易路线，连接关键省份。玩家花金建立后每回合产金/影响。
// 数据源：docs/02-system-rules.md §9 经济系统 + v2 §4 轨道 C3

export interface TradeRouteDef {
  id: string;
  name: string;
  description: string;
  // 路线两端省份（任一端属于玩家即可建立）
  endpoints: [string, string];
  // 建立成本（金）
  costGold: number;
  // 前置科技：行政等级
  prereqAdminLevel: number;
  // 每回合基础收益
  yield: {
    gold: number;       // 基础金币
    influence: number;  // 影响力
    food?: number;      // 部分路线运粮
  };
  // 路线长度修正（长路线收益高但易断）
  length: 'short' | 'medium' | 'long';
  // 经过的地形（影响收益，预留扩展）
  throughTerrain?: string[];
}

export const TRADE_ROUTES: TradeRouteDef[] = [
  {
    id: 'route_silk_road', name: '丝绸之路', description: '横贯东西的商道，运丝绸香料。',
    endpoints: ['p03', 'p15'], costGold: 300, prereqAdminLevel: 3,
    yield: { gold: 60, influence: 4 }, length: 'long',
    throughTerrain: ['desert', 'mountain'],
  },
  {
    id: 'route_mediterranean', name: '地中海商路', description: '连接地中海各港的海上商路。',
    endpoints: ['p01', 'p08'], costGold: 180, prereqAdminLevel: 2,
    yield: { gold: 40, influence: 3, food: 10 }, length: 'medium',
  },
  {
    id: 'route_amber_road', name: '琥珀之路', description: '北方琥珀南运的古老商道。',
    endpoints: ['p05', 'p12'], costGold: 120, prereqAdminLevel: 2,
    yield: { gold: 25, influence: 2 }, length: 'medium',
  },
  {
    id: 'route_grain_route', name: '粮道', description: '内陆粮运专线，保障京师供给。',
    endpoints: ['p02', 'p01'], costGold: 80, prereqAdminLevel: 1,
    yield: { gold: 15, influence: 1, food: 30 }, length: 'short',
  },
  {
    id: 'route_iron_route', name: '铁料商路', description: '铁矿产地到冶炼中心的运输线。',
    endpoints: ['p07', 'p04'], costGold: 100, prereqAdminLevel: 2,
    yield: { gold: 20, influence: 1 }, length: 'short',
  },
  {
    id: 'route_salt_road', name: '盐道', description: '盐运专线，民生刚需。',
    endpoints: ['p09', 'p03'], costGold: 90, prereqAdminLevel: 1,
    yield: { gold: 18, influence: 1, food: 5 }, length: 'short',
  },
  {
    id: 'route_luxury_route', name: '奢侈品商路', description: '运送丝绸香料宝石的高端商路。',
    endpoints: ['p15', 'p06'], costGold: 220, prereqAdminLevel: 3,
    yield: { gold: 50, influence: 5 }, length: 'medium',
  },
  {
    id: 'route_frontier_trade', name: '边关互市', description: '与边境民族的互市贸易。',
    endpoints: ['p10', 'p14'], costGold: 70, prereqAdminLevel: 1,
    yield: { gold: 12, influence: 2 }, length: 'short',
  },
];

export const TRADE_ROUTE_BY_ID: Record<string, TradeRouteDef> = Object.fromEntries(
  TRADE_ROUTES.map((r) => [r.id, r]),
);
export const TRADE_ROUTE_IDS: string[] = TRADE_ROUTES.map((r) => r.id);
export const TRADE_ROUTE_COUNT = TRADE_ROUTES.length;

// 长度修正系数（长路线收益高）
export const LENGTH_MOD: Record<TradeRouteDef['length'], number> = {
  short: 1.0,
  medium: 1.3,
  long: 1.6,
};
