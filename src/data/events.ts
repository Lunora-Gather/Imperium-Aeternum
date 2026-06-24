// Imperium Aeternum — 事件表
// 数据源：docs/02-system-rules.md §15 / docs/formulas.md
// FROZEN v1（阶段 3b）
// 25 个 MVP 事件，每事件含触发条件、≥2 选项、AI 权重。

import type { NationId } from './nations';
import type { FactionId } from './factions';

// 触发条件表达式（运行时由 events.ts engine 求值）
// 字段为 undefined 表示无条件；多字段 AND
export interface EventTrigger {
  minTurn?: number;
  maxTurn?: number;
  minStability?: number;
  maxStability?: number;
  maxLegitimacy?: number;
  maxFoodRatio?: number;       // food/(pop×0.8)
  minCorruption?: number;
  minWarExhaustion?: number;
  atWar?: boolean;
  notAtWar?: boolean;
  hasNewTerritory?: boolean;   // 上回合刚占领新省
  provinceCultureDiff?: boolean; // 任省 dominantCulture ≠ stateCulture
  factionSatBelow?: { faction: FactionId; threshold: number };
  techLevelAbove?: { branch: 'agri' | 'mil' | 'admin' | 'culture'; level: number };
  relationBelow?: { target: NationId; threshold: number };
  isPlayerOnly?: boolean;
  minGold?: number;            // 国库下限（盛世衰落链用）
  govTransitionActive?: boolean; // B8: 政体切换反扑窗口内（govTransitionTurns > 0）
}

export interface FactionReaction {
  faction: FactionId;
  delta: number;
}

// 选项效果：声明式 patch
export interface EventEffect {
  gold?: number;
  food?: number;
  wood?: number;
  iron?: number;
  population?: number;
  stability?: number;
  legitimacy?: number;
  corruption?: number;
  efficiency?: number;
  warExhaustion?: number;
  influence?: number;
  taxRate?: number;
  adminPt?: number;
  sciPt?: number;
  relation?: { target: NationId; delta: number };
  factionSat?: FactionReaction[];   // 多派系反应用数组
  triggerEvent?: string;
  assimilationMod?: number;          // 同化速度加成（文化融合事件用）
}

export interface EventOption {
  text: string;
  effects: EventEffect;
  aiWeight?: number;
}

export interface EventDef {
  id: string;
  title: string;
  description: string;
  category: 'crisis' | 'politics' | 'economy' | 'military' | 'diplomacy' | 'religion' | 'science' | 'opportunity' | 'culture' | 'population';
  trigger: EventTrigger;
  weight: number;
  cooldown: number;
  unique: boolean;
  options: EventOption[];
}

// 工具：构造单派系反应数组
const fr = (faction: FactionId, delta: number): FactionReaction[] => [{ faction, delta }];
// 工具：合并多派系反应
const fra = (...items: FactionReaction[]): FactionReaction[] => items;

export const EVENTS: EventDef[] = [
  // ── 危机类 ──
  {
    id: 'evt_famine', title: '粮食危机', description: '多地粮仓告急，粮价飞涨，民众惶恐。',
    category: 'crisis',
    trigger: { maxFoodRatio: 0.6 },
    weight: 10, cooldown: 15, unique: false,
    options: [
      { text: '紧急开仓放粮', effects: { food: -100, stability: 5, factionSat: fr('commoners', 10) }, aiWeight: 2 },
      { text: '从邻国高价购粮', effects: { gold: -150, food: 80, influence: -3 }, aiWeight: 3 },
      { text: '坐视不管', effects: { stability: -10, population: -50, factionSat: fr('commoners', -15) }, aiWeight: 1 },
    ],
  },
  {
    id: 'evt_plague', title: '瘟疫', description: '瘟疫蔓延，人口骤减。',
    category: 'crisis',
    trigger: { minTurn: 20 },
    weight: 4, cooldown: 40, unique: false,
    options: [
      { text: '隔离疫区', effects: { population: -80, stability: -5, gold: -50 }, aiWeight: 3 },
      { text: '祈神禳灾', effects: { population: -150, factionSat: fr('clergy', 10) }, aiWeight: 2 },
      { text: '召集学者研究', effects: { population: -60, sciPt: 5, gold: -80 }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_drought', title: '旱灾', description: '持续干旱，粮食减产。',
    category: 'crisis',
    trigger: {},
    weight: 6, cooldown: 20, unique: false,
    options: [
      { text: '减免农税', effects: { taxRate: -0.02, food: -50, factionSat: fr('commoners', 10) }, aiWeight: 3 },
      { text: '强行征粮', effects: { food: 50, stability: -8, factionSat: fr('commoners', -15) }, aiWeight: 2 },
    ],
  },
  // ── 政治类 ──
  {
    id: 'evt_noble_coup', title: '贵族逼宫', description: '不满的贵族密谋反对你的统治。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'nobles', threshold: 20 } },
    weight: 8, cooldown: 25, unique: false,
    options: [
      { text: '让步分权', effects: { legitimacy: -10, efficiency: -5, factionSat: fr('nobles', 20) }, aiWeight: 3 },
      { text: '铁腕镇压', effects: { stability: -10, legitimacy: -5, factionSat: fra({ faction: 'nobles', delta: -10 }, { faction: 'military', delta: 5 }) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_merchant_strike', title: '商人罢市', description: '商人关闭店铺抗议税政。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'merchants', threshold: 20 } },
    weight: 8, cooldown: 25, unique: false,
    options: [
      { text: '减免商税', effects: { taxRate: -0.02, gold: -50, factionSat: fr('merchants', 20) }, aiWeight: 3 },
      { text: '强制开市', effects: { gold: -100, stability: -5, factionSat: fr('merchants', -10) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_military_unrest', title: '军方不满', description: '欠饷的军队骚动不安。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'military', threshold: 20 } },
    weight: 9, cooldown: 20, unique: false,
    options: [
      { text: '补发军饷', effects: { gold: -120, factionSat: fr('military', 25) }, aiWeight: 3 },
      { text: '裁撤老兵', effects: { population: -30, stability: -5, factionSat: fr('military', -10) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_peasant_uprising', title: '农民起义', description: '不堪重税的农民揭竿而起。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'commoners', threshold: 20 } },
    weight: 9, cooldown: 20, unique: false,
    options: [
      { text: '镇压起义', effects: { gold: -80, population: -40, stability: -5, factionSat: fra({ faction: 'commoners', delta: -15 }, { faction: 'military', delta: 5 }) }, aiWeight: 3 },
      { text: '允诺减税', effects: { taxRate: -0.03, gold: -30, factionSat: fr('commoners', 25) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_clergy_interference', title: '神职干政', description: '神职人员要求更大的宗教话语权。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'clergy', threshold: 30 }, minCorruption: 30 },
    weight: 5, cooldown: 30, unique: false,
    options: [
      { text: '授予宗教特权', effects: { influence: 5, efficiency: -5, factionSat: fra({ faction: 'clergy', delta: 20 }, { faction: 'merchants', delta: -5 }) }, aiWeight: 3 },
      { text: '拒绝并限制教权', effects: { stability: -3, legitimacy: -3, factionSat: fr('clergy', -15) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_succession_crisis', title: '王位继承危机', description: '继承合法性受到质疑。',
    category: 'politics',
    trigger: { maxLegitimacy: 25 },
    weight: 12, cooldown: 30, unique: false,
    options: [
      { text: '争取贵族支持', effects: { gold: -100, legitimacy: 15, factionSat: fr('nobles', 15) }, aiWeight: 3 },
      { text: '民众拥戴路线', effects: { gold: -80, legitimacy: 10, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -5 }) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_corruption_scandal', title: '腐败丑闻', description: '高官贪腐案曝光，朝野震动。',
    category: 'politics',
    trigger: { minCorruption: 60 },
    weight: 8, cooldown: 20, unique: false,
    options: [
      { text: '严惩涉案官员', effects: { corruption: -10, gold: -50, factionSat: fr('nobles', -10) }, aiWeight: 3 },
      { text: '大事化小', effects: { corruption: 5, legitimacy: -5, factionSat: fr('commoners', -10) }, aiWeight: 2 },
    ],
  },
  // ── 经济类 ──
  {
    id: 'evt_treasury_alarm', title: '国库告急', description: '国库即将见底，财政告急。',
    category: 'economy',
    trigger: { minTurn: 1 },
    weight: 7, cooldown: 15, unique: false,
    options: [
      { text: '临时加征特别税', effects: { gold: 100, stability: -5, factionSat: fr('commoners', -10) }, aiWeight: 3 },
      { text: '出售王室珍藏', effects: { gold: 150, legitimacy: -3 }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_trade_route_open', title: '商路开通', description: '一条新的商路被发现。',
    category: 'economy',
    trigger: { notAtWar: true },
    weight: 5, cooldown: 30, unique: false,
    options: [
      { text: '鼓励商人开拓', effects: { gold: 50, influence: 3, factionSat: fr('merchants', 10) }, aiWeight: 3 },
      { text: '王室垄断贸易', effects: { gold: 100, factionSat: fr('merchants', -10) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_mineral_discovery', title: '矿藏发现', description: '勘探者发现新矿藏。',
    category: 'economy',
    trigger: {},
    weight: 4, cooldown: 40, unique: false,
    options: [
      { text: '立即开采', effects: { iron: 50, gold: -30 }, aiWeight: 3 },
      { text: '长期开发', effects: { iron: 20, gold: 20 }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_harvest_bumper', title: '丰收', description: '今年风调雨顺，粮食大丰。',
    category: 'economy',
    trigger: {},
    weight: 5, cooldown: 15, unique: false,
    options: [
      { text: '充实粮仓', effects: { food: 200, stability: 3 }, aiWeight: 3 },
      { text: '出口换金', effects: { food: 100, gold: 80 }, aiWeight: 2 },
    ],
  },
  // ── 军事类 ──
  {
    id: 'evt_war_weariness', title: '厌战民变', description: '长期战争引发民众厌战抗议。',
    category: 'military',
    trigger: { minWarExhaustion: 70 },
    weight: 10, cooldown: 20, unique: false,
    options: [
      { text: '承诺尽快停战', effects: { warExhaustion: -10, factionSat: fr('commoners', 10) }, aiWeight: 3 },
      { text: '强硬镇压反战', effects: { stability: -10, warExhaustion: -5, factionSat: fr('commoners', -15) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_peace_proposal', title: '和谈提议', description: '敌方派出使者提议停战。',
    category: 'military',
    trigger: { atWar: true },
    weight: 8, cooldown: 15, unique: false,
    options: [
      { text: '接受和谈', effects: { influence: 10, warExhaustion: -20 }, aiWeight: 3 },
      { text: '拒绝继续战争', effects: { stability: -3, factionSat: fr('military', 5) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_new_territory', title: '新领土治理', description: '刚占领的省份需要治理方案。',
    category: 'military',
    trigger: { hasNewTerritory: true },
    weight: 12, cooldown: 5, unique: false,
    options: [
      { text: '怀柔安抚', effects: { gold: -80, stability: 3, influence: 5 }, aiWeight: 3 },
      { text: '驻军镇压', effects: { gold: -40, stability: -3, factionSat: fr('military', 5) }, aiWeight: 2 },
    ],
  },
  // ── 外交类 ──
  {
    id: 'evt_border_clash', title: '边境冲突', description: '与邻国边境发生小规模冲突。',
    category: 'diplomacy',
    trigger: { relationBelow: { target: 'n02', threshold: -30 } },
    weight: 7, cooldown: 20, unique: false,
    options: [
      { text: '外交斡旋', effects: { influence: -10, relation: { target: 'n02', delta: 10 } }, aiWeight: 3 },
      { text: '强硬反制', effects: { relation: { target: 'n02', delta: -15 }, factionSat: fr('military', 8) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_foreign_envoy', title: '外国使团到访', description: '邻国派出使团寻求合作。',
    category: 'diplomacy',
    trigger: { notAtWar: true, minTurn: 5 },
    weight: 5, cooldown: 25, unique: false,
    options: [
      { text: '热情接待', effects: { gold: -30, influence: 8, relation: { target: 'n03', delta: 5 } }, aiWeight: 3 },
      { text: '冷淡回绝', effects: { influence: -3, relation: { target: 'n03', delta: -5 } }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_neighbor_threat', title: '邻国威胁', description: '邻国陈兵边境发出威胁。',
    category: 'diplomacy',
    trigger: { minTurn: 10 },
    weight: 6, cooldown: 30, unique: false,
    options: [
      { text: '外交妥协', effects: { influence: -5, gold: -50, relation: { target: 'n04', delta: 10 } }, aiWeight: 3 },
      { text: '扩军备战', effects: { gold: -100, factionSat: fr('military', 10), relation: { target: 'n04', delta: -10 } }, aiWeight: 2 },
    ],
  },
  // ── 宗教类 ──
  {
    id: 'evt_religion_dispute', title: '宗教争端', description: '不同信仰者发生冲突。',
    category: 'religion',
    trigger: { provinceCultureDiff: true },
    weight: 6, cooldown: 25, unique: false,
    options: [
      { text: '推行宽容政策', effects: { stability: 3, influence: 3, factionSat: fr('clergy', -10) }, aiWeight: 3 },
      { text: '支持国教压制', effects: { stability: -5, factionSat: fra({ faction: 'clergy', delta: 15 }, { faction: 'commoners', delta: -10 }) }, aiWeight: 2 },
    ],
  },
  // ── 科技类 ──
  {
    id: 'evt_tech_breakthrough', title: '科技突破', description: '学者取得重大突破！',
    category: 'science',
    trigger: { techLevelAbove: { branch: 'admin', level: 2 } },
    weight: 3, cooldown: 20, unique: false,
    options: [
      { text: '推广新技术', effects: { sciPt: 20, gold: -50 }, aiWeight: 3 },
      { text: '保密御用', effects: { sciPt: 10, legitimacy: 3, factionSat: fr('nobles', 5) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_scholar_petition', title: '学者请愿', description: '学者请求加大科研投入。',
    category: 'science',
    trigger: { minTurn: 5 },
    weight: 4, cooldown: 25, unique: false,
    options: [
      { text: '拨金支持', effects: { gold: -80, sciPt: 10 }, aiWeight: 3 },
      { text: '婉拒', effects: { factionSat: fr('commoners', -5) }, aiWeight: 2 },
    ],
  },
  // ── 机会类 ──
  {
    id: 'evt_reform_call', title: '改革呼声', description: '民众与商人呼吁体制改革。',
    category: 'opportunity',
    trigger: { minTurn: 15, maxStability: 40 },
    weight: 5, cooldown: 30, unique: false,
    options: [
      { text: '启动渐进改革', effects: { legitimacy: -5, stability: 5, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, aiWeight: 3 },
      { text: '拒绝改革', effects: { stability: -5, factionSat: fr('commoners', -10) }, aiWeight: 2 },
    ],
  },
  {
    id: 'evt_coup_risk', title: '军事政变风险', description: '军方密谋发动政变！',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'military', threshold: 10 }, maxLegitimacy: 40 },
    weight: 8, cooldown: 50, unique: false,
    options: [
      { text: '密谋分化将领', effects: { gold: -150, legitimacy: -5, factionSat: fr('military', 15) }, aiWeight: 3 },
      { text: '先发制人清洗', effects: { stability: -15, legitimacy: -10, factionSat: fr('military', -20) }, aiWeight: 1 },
    ],
  },
  // ── 扩展事件 26-55（世界级） ──
  { id: 'evt_gold_rush', title: '淘金热', description: '边境发现金矿！', category: 'economy', trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '开采', effects: { gold: 200, corruption: 5 }, aiWeight: 3 }, { text: '限制开采', effects: { gold: 50, stability: 3 }, aiWeight: 2 }] },
  { id: 'evt_trade_boom', title: '贸易繁荣', description: '商路畅通，贸易量激增！', category: 'economy', trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: '鼓励贸易', effects: { gold: 100, factionSat: fr('merchants', 10) }, aiWeight: 3 }, { text: '征收商税', effects: { gold: 150, factionSat: fr('merchants', -8) }, aiWeight: 2 }] },
  { id: 'evt_drought_severe', title: '大旱', description: '久旱不雨，粮食减产！', category: 'crisis', trigger: { minTurn: 3 }, weight: 5, cooldown: 30, unique: false, options: [{ text: '开仓放粮', effects: { food: -100, stability: 5 }, aiWeight: 3 }, { text: '加重赋税救灾', effects: { gold: -80, food: 50, factionSat: fr('commoners', -10) }, aiWeight: 2 }] },
  { id: 'evt_refugee_wave', title: '难民潮', description: '邻国战乱，难民涌入边境！', category: 'crisis', trigger: { minTurn: 10 }, weight: 4, cooldown: 35, unique: false, options: [{ text: '接纳安置', effects: { population: 500, food: -50, stability: -3 }, aiWeight: 2 }, { text: '关闭边境', effects: { legitimacy: -5, factionSat: fr('commoners', 5) }, aiWeight: 3 }] },
  { id: 'evt_merchant_guild', title: '商人行会', description: '商人组建行会要求特权！', category: 'politics', trigger: { minTurn: 8 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '授予特权', effects: { gold: 80, factionSat: fra({ faction: 'merchants', delta: 15 }, { faction: 'nobles', delta: -8 }) }, aiWeight: 3 }, { text: '拒绝', effects: { factionSat: fr('merchants', -12) }, aiWeight: 2 }] },
  { id: 'evt_military_reform', title: '军事改革', description: '将领提议改革军制！', category: 'military', trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '推行改革', effects: { gold: -120, factionSat: fr('military', 10), stability: -3 }, aiWeight: 3 }, { text: '维持现状', effects: { factionSat: fr('military', -5) }, aiWeight: 2 }] },
  { id: 'evt_cultural_flourish', title: '文化繁荣', description: '学者艺术家汇聚，文化昌盛！', category: 'culture', trigger: { minTurn: 15, minStability: 40 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '大力资助', effects: { gold: -80, sciPt: 15, legitimacy: 5 }, aiWeight: 3 }, { text: '适度支持', effects: { gold: -30, sciPt: 5 }, aiWeight: 2 }] },
  { id: 'evt_border_incident', title: '边境冲突', description: '边防军与邻国发生小规模冲突！', category: 'military', trigger: { minTurn: 5 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '强硬回应', effects: { stability: 3, factionSat: fra({ faction: 'military', delta: 8 }, { faction: 'merchants', delta: -5 }) }, aiWeight: 2 }, { text: '外交斡旋', effects: { gold: -30, legitimacy: 3 }, aiWeight: 3 }] },
  { id: 'evt_earthquake', title: '地震', description: '强烈地震袭击省份！', category: 'crisis', trigger: { minTurn: 3 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '全力救灾', effects: { gold: -150, food: -50, stability: 5 }, aiWeight: 3 }, { text: '有限救援', effects: { gold: -50, stability: -5 }, aiWeight: 2 }] },
  { id: 'evt_tax_evasion', title: '大规模逃税', description: '富商大族逃税严重！', category: 'economy', trigger: { minCorruption: 30 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '严查重罚', effects: { gold: 100, factionSat: fr('nobles', -10), corruption: -5 }, aiWeight: 2 }, { text: '从轻发落', effects: { factionSat: fr('nobles', 5), corruption: 3 }, aiWeight: 3 }] },
  { id: 'evt_succession_war', title: '继承危机', description: '多位继承人选争夺大位！', category: 'politics', trigger: { maxLegitimacy: 50 }, weight: 6, cooldown: 40, unique: false, options: [{ text: '立长子', effects: { legitimacy: 10, stability: -5 }, aiWeight: 3 }, { text: '择贤立', effects: { legitimacy: 5, stability: -8, factionSat: fr('nobles', -10) }, aiWeight: 2 }] },
  { id: 'evt_foreign_aid', title: '外国援助', description: '友邦送来物资援助！', category: 'economy', trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '欣然接受', effects: { gold: 80, food: 60 }, aiWeight: 3 }, { text: '婉拒以保独立', effects: { legitimacy: 5 }, aiWeight: 2 }] },
  { id: 'evt_pop_boom', title: '人口激增', description: '丰收带来人口快速增长！', category: 'population', trigger: { minTurn: 8, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '鼓励增长', effects: { population: 300, food: -30 }, aiWeight: 3 }, { text: '适度控制', effects: { population: 100 }, aiWeight: 2 }] },
  { id: 'evt_slave_revolt', title: '奴役起义', description: '被压迫者揭竿而起！', category: 'crisis', trigger: { minTurn: 10, maxStability: 40 }, weight: 5, cooldown: 35, unique: false, options: [{ text: '镇压', effects: { gold: -80, stability: -5, factionSat: fr('military', 5) }, aiWeight: 2 }, { text: '适度改革', effects: { gold: -50, legitimacy: 5, factionSat: fr('nobles', -8) }, aiWeight: 3 }] },
  { id: 'evt_spy_scandal', title: '间谍丑闻', description: '外国间谍被抓获！', category: 'diplomacy', trigger: { minTurn: 5 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '公开处刑', effects: { legitimacy: 5, stability: -3 }, aiWeight: 2 }, { text: '秘密利用', effects: { gold: 50, corruption: 3 }, aiWeight: 3 }] },
  { id: 'evt_temple_dispute', title: '寺庙争端', description: '宗教团体间爆发冲突！', category: 'religion', trigger: { minTurn: 5, provinceCultureDiff: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: '仲裁调停', effects: { gold: -30, stability: 3 }, aiWeight: 3 }, { text: '支持一方', effects: { factionSat: fr('clergy', 10), stability: -5 }, aiWeight: 2 }] },
  { id: 'evt_road_building', title: '修路热潮', description: '各方要求修建道路！', category: 'economy', trigger: { minTurn: 8, notAtWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: '大兴土木', effects: { gold: -120, stability: 3, factionSat: fr('merchants', 8) }, aiWeight: 3 }, { text: '量力而行', effects: { gold: -40 }, aiWeight: 2 }] },
  { id: 'evt_weapon_advance', title: '武器革新', description: '工匠发明新型武器！', category: 'military', trigger: { techLevelAbove: { branch: 'mil', level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: '装备全军', effects: { gold: -100, iron: -20, factionSat: fr('military', 12) }, aiWeight: 3 }, { text: '限量装备', effects: { gold: -40, factionSat: fr('military', 5) }, aiWeight: 2 }] },
  { id: 'evt_noble_feud', title: '贵族内斗', description: '两大贵族家族公开对立！', category: 'politics', trigger: { minTurn: 5 }, weight: 4, cooldown: 20, unique: false, options: [{ text: '居中调停', effects: { gold: -50, stability: 3 }, aiWeight: 3 }, { text: '支持强势方', effects: { factionSat: fr('nobles', -8), legitimacy: -3 }, aiWeight: 2 }] },
  { id: 'evt_harvest_festival', title: '丰收节', description: '五谷丰登，万民同庆！', category: 'culture', trigger: { minTurn: 5, notAtWar: true, minStability: 30 }, weight: 5, cooldown: 15, unique: false, options: [{ text: '大肆庆祝', effects: { gold: -50, food: -20, stability: 5, factionSat: fr('commoners', 10) }, aiWeight: 3 }, { text: '简朴从事', effects: { stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_corruption_expose', title: '贪腐曝光', description: '大臣贪墨被揭发！', category: 'politics', trigger: { minCorruption: 40 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '严惩不贷', effects: { corruption: -8, legitimacy: 5, factionSat: fr('nobles', -12) }, aiWeight: 3 }, { text: '罚酒三杯', effects: { corruption: -2, legitimacy: -3 }, aiWeight: 2 }] },
  { id: 'evt_bandit_outbreak', title: '盗匪猖獗', description: '盗匪占据山头劫掠商路！', category: 'crisis', trigger: { maxStability: 50 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '派兵清剿', effects: { gold: -60, stability: 5, factionSat: fr('military', 5) }, aiWeight: 3 }, { text: '招安安抚', effects: { gold: -30, corruption: 3 }, aiWeight: 2 }] },
  { id: 'evt_foreign_merchants', title: '外商涌入', description: '外国商人带来新奇商品！', category: 'economy', trigger: { minTurn: 8, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: '开放市场', effects: { gold: 60, factionSat: fra({ faction: 'merchants', delta: 8 }, { faction: 'commoners', delta: -3 }) }, aiWeight: 3 }, { text: '限制准入', effects: { factionSat: fr('merchants', -5) }, aiWeight: 2 }] },
  { id: 'evt_land_reform', title: '土地改革', description: '农民要求重新分配土地！', category: 'politics', trigger: { minTurn: 15, factionSatBelow: { faction: 'commoners', threshold: 30 } }, weight: 5, cooldown: 40, unique: false, options: [{ text: '推行改革', effects: { gold: -100, stability: -8, factionSat: fra({ faction: 'commoners', delta: 20 }, { faction: 'nobles', delta: -15 }) }, aiWeight: 2 }, { text: '拒绝', effects: { factionSat: fr('commoners', -10), stability: -3 }, aiWeight: 3 }] },
  { id: 'evt_witch_hunt', title: '猎巫运动', description: '民间掀起猎巫狂潮！', category: 'religion', trigger: { maxStability: 40 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '顺从民意', effects: { stability: 3, legitimacy: -3, population: -100 }, aiWeight: 2 }, { text: '禁止迫害', effects: { stability: -5, factionSat: fr('clergy', -8) }, aiWeight: 3 }] },
  { id: 'evt_diplomatic_envoy', title: '外交使团', description: '他国派遣使团来访！', category: 'diplomacy', trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 20, unique: false, options: [{ text: '隆重接待', effects: { gold: -40, legitimacy: 3, influence: 5 }, aiWeight: 3 }, { text: '冷淡应对', effects: { legitimacy: -2 }, aiWeight: 2 }] },
  { id: 'evt_mint_debasement', title: '货币贬值', description: '国库吃紧，有人建议铸劣币！', category: 'economy', trigger: { minTurn: 10 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '铸劣币', effects: { gold: 150, corruption: 8, legitimacy: -8 }, aiWeight: 2 }, { text: '维持信用', effects: { legitimacy: 5 }, aiWeight: 3 }] },
  { id: 'evt_wall_construction', title: '城墙修建', description: '边境省份请求修筑城墙！', category: 'economy', trigger: { minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '拨款修墙', effects: { gold: -100, stability: 3, factionSat: fr('military', 5) }, aiWeight: 3 }, { text: '暂缓', effects: { stability: -2 }, aiWeight: 2 }] },
  { id: 'evt_scholar_exchange', title: '学者交流', description: '异国学者前来交流！', category: 'science', trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: '热情接待', effects: { sciPt: 15, gold: -30 }, aiWeight: 3 }, { text: '谨慎对待', effects: { sciPt: 5 }, aiWeight: 2 }] },
  { id: 'evt_granary_fire', title: '粮仓火灾', description: '主要粮仓突发大火！', category: 'crisis', trigger: { minTurn: 5 }, weight: 4, cooldown: 40, unique: false, options: [{ text: '全力抢救', effects: { food: -80, gold: -30 }, aiWeight: 3 }, { text: '听之任之', effects: { food: -150, stability: -5 }, aiWeight: 1 }] },
  { id: 'evt_naval_discovery', title: '航海发现', description: '探险船队发现新岛屿！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 2, cooldown: 50, unique: false, options: [{ text: '建立据点', effects: { gold: -100, influence: 10, food: 40 }, aiWeight: 3 }, { text: '只绘图记录', effects: { sciPt: 10 }, aiWeight: 2 }] },
  { id: 'evt_conscription_unrest', title: '征兵暴动', description: '强制征兵引发民众抗议！', category: 'crisis', trigger: { minTurn: 5, atWar: true }, weight: 5, cooldown: 20, unique: false, options: [{ text: '坚持征兵', effects: { stability: -8, factionSat: fra({ faction: 'military', delta: 5 }, { faction: 'commoners', delta: -12 }) }, aiWeight: 2 }, { text: '减少征兵', effects: { factionSat: fra({ faction: 'commoners', delta: 8 }, { faction: 'military', delta: -5 }) }, aiWeight: 3 }] },
  // ── B 扩展：35 个新事件，补齐 culture/population/opportunity 等 ──
  { id: 'evt_culture_flourish', title: '文治鼎盛', description: '诗人学者云集京畿，文运昌隆！', category: 'culture', trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '设立翰林院', effects: { gold: -80, sciPt: 20, legitimacy: 8, factionSat: fr('clergy', 15) }, aiWeight: 3 }, { text: '民间自流', effects: { sciPt: 5, stability: 3 }, aiWeight: 2 }] },
  { id: 'evt_culture_patron', title: '艺匠求庇', description: '名匠寻求皇室庇护，献上奇技！', category: 'culture', trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 25, unique: false, options: [{ text: '重金礼遇', effects: { gold: -60, influence: 5, factionSat: fr('clergy', 8) }, aiWeight: 3 }, { text: '婉拒', effects: { influence: -2 }, aiWeight: 2 }] },
  { id: 'evt_culture_renaissance', title: '文艺复兴', description: '古典学术复兴，新思潮涌动！', category: 'culture', trigger: { minTurn: 30, techLevelAbove: { branch: 'admin', level: 3 } }, weight: 2, cooldown: 60, unique: true, options: [{ text: '大力倡导', effects: { gold: -150, sciPt: 40, stability: 5, factionSat: fra({ faction: 'clergy', delta: 20 }, { faction: 'clergy', delta: -8 }) }, aiWeight: 3 }, { text: '顺其自然', effects: { sciPt: 15 }, aiWeight: 2 }] },
  { id: 'evt_culture_ban', title: '异端学说', description: '新奇学说挑战传统，教会要求查禁！', category: 'culture', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 4, cooldown: 35, unique: false, options: [{ text: '查禁异端', effects: { stability: 3, sciPt: -10, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'clergy', delta: -15 }) }, aiWeight: 2 }, { text: '保护学术', effects: { stability: -4, sciPt: 15, factionSat: fr('clergy', -10) }, aiWeight: 3 }] },
  { id: 'evt_culture_festival', title: '万国来朝', description: '诸邦遣使朝贺，国威远扬！', category: 'culture', trigger: { minTurn: 25, notAtWar: true, minStability: 60 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '盛典礼之', effects: { gold: -120, legitimacy: 10, influence: 15 }, aiWeight: 3 }, { text: '简礼相待', effects: { legitimacy: 3, influence: 5 }, aiWeight: 2 }] },
  { id: 'evt_pop_boom2', title: '人丁兴旺', description: '连年丰稔，人口激增！', category: 'population', trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: '鼓励生育', effects: { food: -50, population: 200, stability: 3 }, aiWeight: 3 }, { text: '顺其自然', effects: { population: 100 }, aiWeight: 2 }] },
  { id: 'evt_pop_migration', title: '流民涌入', description: '邻邦战乱，大批流民涌入边境！', category: 'population', trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '编户齐民', effects: { population: 150, food: -40, stability: -3, factionSat: fr('commoners', -5) }, aiWeight: 3 }, { text: '驱逐出境', effects: { influence: -5, stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_pop_urban', title: '城市膨胀', description: '都城人口过载，坊市拥挤！', category: 'population', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: '扩建城郭', effects: { gold: -100, population: 100, stability: 3 }, aiWeight: 3 }, { text: '限制流入', effects: { stability: -2, factionSat: fr('merchants', -8) }, aiWeight: 2 }] },
  { id: 'evt_pop_plague_end', title: '疫后余生', description: '大疫平息，幸存者休养生息！', category: 'population', trigger: { minTurn: 30, maxStability: 60 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '轻徭薄赋', effects: { gold: -30, population: 100, stability: 5, factionSat: fr('commoners', 10) }, aiWeight: 3 }, { text: '常态治理', effects: { population: 50 }, aiWeight: 2 }] },
  { id: 'evt_pop_labor_short', title: '劳力短缺', description: '战乱后田地荒芜，劳力匮乏！', category: 'population', trigger: { minTurn: 15, atWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: '招募流民', effects: { gold: -50, population: 80, food: 20 }, aiWeight: 3 }, { text: '强制征发', effects: { population: 50, stability: -5, factionSat: fr('commoners', -10) }, aiWeight: 1 }] },
  { id: 'evt_opp_ancient_treasure', title: '古墓现宝', description: '农夫掘出上古宝藏！', category: 'opportunity', trigger: { minTurn: 10 }, weight: 2, cooldown: 50, unique: false, options: [{ text: '充公国库', effects: { gold: 200, legitimacy: 3 }, aiWeight: 3 }, { text: '赏赐农夫', effects: { gold: 50, stability: 5, factionSat: fr('commoners', 8) }, aiWeight: 2 }] },
  { id: 'evt_opp_strategic_location', title: '险隘归附', description: '边境险隘守将献关投诚！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, weight: 2, cooldown: 60, unique: false, options: [{ text: '纳降重赏', effects: { gold: -80, influence: 10, stability: 3 }, aiWeight: 3 }, { text: '谨慎接纳', effects: { influence: 3 }, aiWeight: 2 }] },
  { id: 'evt_opp_talent', title: '贤才投效', description: '异国名士慕名来投！', category: 'opportunity', trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '破格录用', effects: { gold: -40, sciPt: 15, efficiency: 3 }, aiWeight: 3 }, { text: '考察后用', effects: { sciPt: 5 }, aiWeight: 2 }] },
  { id: 'evt_opp_good_omen', title: '祥瑞降临', description: '天现祥瑞，万民称庆！', category: 'opportunity', trigger: { minTurn: 20, notAtWar: true, minStability: 40 }, weight: 2, cooldown: 50, unique: false, options: [{ text: '昭告天下', effects: { legitimacy: 8, stability: 5, influence: 5 }, aiWeight: 3 }, { text: '秘而不宣', effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: 'evt_opp_trade_windfall', title: '商路暴利', description: '罕见商队带来巨额利润！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, weight: 2, cooldown: 45, unique: false, options: [{ text: '抽取重税', effects: { gold: 180, factionSat: fr('merchants', -5) }, aiWeight: 3 }, { text: '轻税惠民', effects: { gold: 80, factionSat: fr('merchants', 10) }, aiWeight: 2 }] },
  { id: 'evt_opp_mercenary', title: '雇佣军来投', description: '百战雇佣军寻求效命！', category: 'opportunity', trigger: { minTurn: 10, atWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '高价雇佣', effects: { gold: -100, factionSat: fr('military', 10) }, aiWeight: 3 }, { text: '婉拒', effects: { stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_opp_dynastic_match', title: '联姻良缘', description: '强国王室提议联姻！', category: 'opportunity', trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '欣然允诺', effects: { gold: -60, influence: 15, legitimacy: 5 }, aiWeight: 3 }, { text: '婉言谢绝', effects: { influence: -3 }, aiWeight: 2 }] },
  { id: 'evt_relig_heresy', title: '异端蔓延', description: '异端教派在民间扩散！', category: 'religion', trigger: { minTurn: 20, maxStability: 60 }, weight: 4, cooldown: 35, unique: false, options: [{ text: '宗教裁判', effects: { stability: 3, population: -50, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'commoners', delta: -10 }) }, aiWeight: 2 }, { text: '辩论感化', effects: { sciPt: 8, stability: -2 }, aiWeight: 3 }] },
  { id: 'evt_relig_temple_grant', title: '寺庙请田', description: '大寺请求赐田养僧！', category: 'religion', trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '慷慨赐田', effects: { gold: -50, food: -30, legitimacy: 5, factionSat: fr('clergy', 15) }, aiWeight: 2 }, { text: '限田抑寺', effects: { factionSat: fra({ faction: 'clergy', delta: -12 }, { faction: 'nobles', delta: 5 }) }, aiWeight: 3 }] },
  { id: 'evt_relig_pilgrimage', title: '朝圣热潮', description: '信众掀起朝圣热潮！', category: 'religion', trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '官方护持', effects: { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, aiWeight: 3 }, { text: '民间自理', effects: { stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_relig_schism', title: '教派分裂', description: '宗教内部爆发教义之争！', category: 'religion', trigger: { minTurn: 30 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '支持正统', effects: { stability: 3, factionSat: fra({ faction: 'clergy', delta: 10 }, { faction: 'commoners', delta: -5 }) }, aiWeight: 2 }, { text: '保持中立', effects: { stability: -3, factionSat: fr('clergy', -8) }, aiWeight: 3 }] },
  { id: 'evt_relig_conversion', title: '异教归化', description: '边境异教部落请求归化！', category: 'religion', trigger: { minTurn: 15, hasNewTerritory: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '隆重受礼', effects: { gold: -30, legitimacy: 5, stability: 3, factionSat: fr('clergy', 12) }, aiWeight: 3 }, { text: '因俗而治', effects: { stability: 2, factionSat: fr('clergy', -5) }, aiWeight: 2 }] },
  { id: 'evt_sci_astronomy', title: '天文异象', description: '客星昼见，司天监请解！', category: 'science', trigger: { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: '详记观测', effects: { sciPt: 20, gold: -20 }, aiWeight: 3 }, { text: '视为天谴', effects: { stability: -3, legitimacy: -3, factionSat: fr('clergy', 8) }, aiWeight: 1 }] },
  { id: 'evt_sci_invention', title: '巧匠献器', description: '工匠发明新式器械！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'agri', level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: '推广民用', effects: { gold: -60, food: 30, sciPt: 10 }, aiWeight: 3 }, { text: '军用保密', effects: { gold: -40, factionSat: fr('military', 8) }, aiWeight: 2 }] },
  { id: 'evt_sci_academy', title: '学院筹建', description: '学者请求设立皇家学院！', category: 'science', trigger: { minTurn: 25, techLevelAbove: { branch: 'admin', level: 3 } }, weight: 2, cooldown: 60, unique: true, options: [{ text: '拨款兴建', effects: { gold: -200, sciPt: 50, efficiency: 5, factionSat: fr('clergy', 20) }, aiWeight: 3 }, { text: '暂缓', effects: { factionSat: fr('clergy', -8) }, aiWeight: 2 }] },
  { id: 'evt_sci_translation', title: '译经运动', description: '异域典籍传入，请旨翻译！', category: 'science', trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '设译场', effects: { gold: -80, sciPt: 25, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'clergy', delta: 5 }) }, aiWeight: 3 }, { text: '民间自译', effects: { sciPt: 8 }, aiWeight: 2 }] },
  { id: 'evt_dip_alliance_proposal', title: '结盟之议', description: '强国主动提议结盟！', category: 'diplomacy', trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '欣然结盟', effects: { influence: 10, legitimacy: 3, gold: -30 }, aiWeight: 3 }, { text: '保持独立', effects: { influence: -2 }, aiWeight: 2 }] },
  { id: 'evt_dip_hostage', title: '质子之约', description: '邻国提议互送质子以固盟约！', category: 'diplomacy', trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '接受', effects: { influence: 8, legitimacy: -3, stability: -2 }, aiWeight: 2 }, { text: '拒绝', effects: { influence: -5 }, aiWeight: 3 }] },
  { id: 'evt_dip_trade_embassy', title: '通商使团', description: '远方国度遣通商使团！', category: 'diplomacy', trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 35, unique: false, options: [{ text: '签订条约', effects: { gold: 80, influence: 5, factionSat: fr('merchants', 12) }, aiWeight: 3 }, { text: '观望', effects: { influence: 2 }, aiWeight: 2 }] },
  { id: 'evt_dip_border_incident', title: '边境事件', description: '边军误入邻邦引发纠纷！', category: 'diplomacy', trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '遣使致歉', effects: { gold: -30, influence: 3 }, aiWeight: 3 }, { text: '强硬立场', effects: { influence: -5, stability: 3, factionSat: fr('military', 8) }, aiWeight: 2 }] },
  { id: 'evt_dip_refugee_crisis', title: '难民潮', description: '邻邦内乱，难民涌入！', category: 'diplomacy', trigger: { minTurn: 20 }, weight: 3, cooldown: 35, unique: false, options: [{ text: '设营安置', effects: { gold: -80, food: -40, population: 100, influence: 8 }, aiWeight: 3 }, { text: '封闭边境', effects: { influence: -8, stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_mil_traitor', title: '叛将投敌', description: '边关守将叛逃敌国！', category: 'military', trigger: { minTurn: 15, maxStability: 60 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '悬赏缉拿', effects: { gold: -50, influence: 3, factionSat: fr('military', 5) }, aiWeight: 3 }, { text: '申斥边镇', effects: { stability: -5, factionSat: fr('military', -8) }, aiWeight: 2 }] },
  { id: 'evt_mil_victory_parade', title: '凯旋献俘', description: '大军凯旋，请行献俘礼！', category: 'military', trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '隆重献俘', effects: { gold: -40, legitimacy: 8, factionSat: fr('military', 15) }, aiWeight: 3 }, { text: '低调处置', effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: 'evt_mil_supply_line', title: '粮道被断', description: '敌军袭扰粮道，前线告急！', category: 'military', trigger: { minTurn: 10, atWar: true }, weight: 4, cooldown: 25, unique: false, options: [{ text: '重兵护粮', effects: { gold: -80, food: -30, factionSat: fr('military', 8) }, aiWeight: 3 }, { text: '就地征粮', effects: { food: 20, stability: -8, factionSat: fr('commoners', -15) }, aiWeight: 1 }] },
  { id: 'evt_mil_defection', title: '敌将来投', description: '敌国名将率部来降！', category: 'military', trigger: { minTurn: 15, atWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '厚礼接纳', effects: { gold: -60, factionSat: fr('military', 12), influence: 5 }, aiWeight: 3 }, { text: '疑而不用', effects: { stability: -2 }, aiWeight: 2 }] },
  { id: 'evt_mil_fortress_siege', title: '孤城死守', description: '边城被围，守将请援！', category: 'military', trigger: { minTurn: 12, atWar: true }, weight: 4, cooldown: 30, unique: false, options: [{ text: '倾国驰援', effects: { gold: -100, food: -50, factionSat: fr('military', 10) }, aiWeight: 3 }, { text: '弃车保帅', effects: { stability: -10, legitimacy: -5, factionSat: fr('military', -12) }, aiWeight: 1 }] },
  { id: 'evt_mil_weapon_upgrade', title: '军械革新', description: '工坊献上新式兵器！', category: 'military', trigger: { minTurn: 20, techLevelAbove: { branch: 'mil', level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: '全军换装', effects: { gold: -150, factionSat: fr('military', 15) }, aiWeight: 3 }, { text: '局部试用', effects: { gold: -50, factionSat: fr('military', 5) }, aiWeight: 2 }] },

  // ── C1 事件链（3 条链 × 3 事件 = 9 事件）──
  // 链 1：瘟疫链——爆发→蔓延→余波
  { id: 'evt_chain_plague_1', title: '瘟疫爆发', description: '边镇突发怪病，死者甚众！太医请旨处置。', category: 'crisis', trigger: { minTurn: 15, maxFoodRatio: 0.8 }, weight: 4, cooldown: 60, unique: false, options: [
    { text: '封锁疫区', effects: { stability: -5, population: -100, triggerEvent: 'evt_chain_plague_2' }, aiWeight: 3 },
    { text: '请神祈福', effects: { gold: -50, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_plague_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_plague_2', title: '瘟疫蔓延', description: '疫病蔓延至京畿，人心惶惶！', category: 'crisis', trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '隔离救治', effects: { gold: -120, population: -200, stability: -3, triggerEvent: 'evt_chain_plague_3' }, aiWeight: 3 },
    { text: '弃城避疫', effects: { gold: -30, stability: -15, legitimacy: -10, population: -150, triggerEvent: 'evt_chain_plague_3' }, aiWeight: 1 },
  ] },
  { id: 'evt_chain_plague_3', title: '瘟疫余波', description: '疫病终于平息，但民生凋敝，请旨善后。', category: 'crisis', trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '减免赋税', effects: { gold: -80, stability: 8, factionSat: fr('commoners', 15), legitimacy: 5 }, aiWeight: 3 },
    { text: '如常征赋', effects: { stability: -5, factionSat: fr('commoners', -12) }, aiWeight: 2 },
  ] },

  // 链 2：王位继承链——储君薨→争夺→新朝
  { id: 'evt_chain_heir_1', title: '储君暴薨', description: '太子无疾而终！诸皇子暗中争位。', category: 'politics', trigger: { minTurn: 20, maxLegitimacy: 70 }, weight: 3, cooldown: 80, unique: false, options: [
    { text: '立次子为储', effects: { legitimacy: -5, stability: -3, triggerEvent: 'evt_chain_heir_2' }, aiWeight: 3 },
    { text: '暂不立储', effects: { legitimacy: -10, stability: -8, factionSat: fr('nobles', -8), triggerEvent: 'evt_chain_heir_2' }, aiWeight: 1 },
  ] },
  { id: 'evt_chain_heir_2', title: '夺位之争', description: '诸皇子明争暗斗，朝臣各立其主！', category: 'politics', trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '强立一系', effects: { gold: -100, legitimacy: 5, stability: -5, factionSat: fr('nobles', -10), triggerEvent: 'evt_chain_heir_3' }, aiWeight: 2 },
    { text: '廷议公推', effects: { gold: -50, legitimacy: 8, stability: 3, efficiency: -3, triggerEvent: 'evt_chain_heir_3' }, aiWeight: 3 },
  ] },
  { id: 'evt_chain_heir_3', title: '新储即位', description: '新储登基，大赦天下以固位。', category: 'politics', trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '大赦天下', effects: { gold: -60, legitimacy: 15, stability: 10, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: 5 }) }, aiWeight: 3 },
    { text: '低调即位', effects: { legitimacy: 5, stability: 2 }, aiWeight: 2 },
    // P3 继承链内战结局——强压异议触发宗室起兵
    { text: '强压异议', effects: { legitimacy: -10, stability: -8, factionSat: fr('military', 15), triggerEvent: 'evt_chain_heir_civil' }, aiWeight: 1 },
  ] },
  // P3 继承链内战结局——宗室起兵→决战→新朝或割据
  { id: 'evt_chain_heir_civil', title: '宗室起兵', description: '不满新储的宗室藩镇举兵向阙！天下震动，社稷危殆！', category: 'crisis', trigger: { minTurn: 20, maxLegitimacy: 50 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '御驾亲征', effects: { gold: -200, stability: -10, legitimacy: 8, factionSat: fra({ faction: 'military', delta: 20 }, { faction: 'commoners', delta: -15 }), triggerEvent: 'evt_chain_heir_civil_2' }, aiWeight: 2 },
    { text: '割地安抚', effects: { gold: -100, stability: 5, legitimacy: -15, influence: -10, factionSat: fr('nobles', 10), triggerEvent: 'evt_chain_heir_civil_2' }, aiWeight: 3 },
  ] },
  { id: 'evt_chain_heir_civil_2', title: '内战终局', description: '叛乱平定或割据成定局，新朝格局已成。', category: 'politics', trigger: { minTurn: 20 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '重整山河', effects: { gold: -150, stability: 15, legitimacy: 20, efficiency: 5, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'nobles', delta: -8 }) }, aiWeight: 3 },
    { text: '默许割据', effects: { stability: -20, legitimacy: -25, corruption: 10, factionSat: fr('nobles', 15) }, aiWeight: 1 },
  ] },

  // 链 3：边境冲突链——摩擦→升级→议和
  { id: 'evt_chain_border_1', title: '边民冲突', description: '边民越界耕牧，与邻邦起争执！', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 50, unique: false, options: [
    { text: '遣使交涉', effects: { gold: -20, influence: 3, triggerEvent: 'evt_chain_border_2' }, aiWeight: 3 },
    { text: '强硬驱赶', effects: { influence: -3, stability: 2, factionSat: fr('military', 8), triggerEvent: 'evt_chain_border_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_border_2', title: '边军对峙', description: '双方边军对峙，剑拔弩张！', category: 'diplomacy', trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '主动撤军', effects: { influence: -5, stability: 3, triggerEvent: 'evt_chain_border_3' }, aiWeight: 3 },
    { text: '增兵施压', effects: { gold: -80, factionSat: fr('military', 12), influence: 2, stability: -2, triggerEvent: 'evt_chain_border_3' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_border_3', title: '边境议和', description: '双方遣使议和，重定疆界。', category: 'diplomacy', trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '缔结和约', effects: { gold: -40, influence: 8, legitimacy: 3, stability: 5 }, aiWeight: 3 },
    { text: '暂置不议', effects: { stability: -2, influence: -2 }, aiWeight: 2 },
  ] },

  // ── E15 扩展事件链（2 条 × 3 事件 = 6 事件）──
  // 链 4：旱灾链——大旱→饥荒→流民
  { id: 'evt_chain_drought_1', title: '赤地千里', description: '连月不雨，禾苗枯焦，赤地千里！太史奏旱。', category: 'crisis', trigger: { minTurn: 8, maxFoodRatio: 0.9 }, weight: 5, cooldown: 70, unique: false, options: [
    { text: '开仓赈灾', effects: { food: -120, stability: 5, factionSat: fr('commoners', 8), triggerEvent: 'evt_chain_drought_2' }, aiWeight: 3 },
    { text: '祈雨祭天', effects: { gold: -60, legitimacy: 3, stability: 2, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_drought_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_drought_2', title: '饥荒蔓延', description: '粮价飞涨，饿殍遍野，饥民聚众求食！', category: 'crisis', trigger: { minTurn: 8 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '强制平粜', effects: { gold: -100, stability: 3, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'merchants', delta: -15 }), triggerEvent: 'evt_chain_drought_3' }, aiWeight: 3 },
    { text: '放任粮价', effects: { population: -300, stability: -10, factionSat: fr('commoners', -20), triggerEvent: 'evt_chain_drought_3' }, aiWeight: 1 },
  ] },
  { id: 'evt_chain_drought_3', title: '流民四散', description: '灾民背井离乡，流民潮席卷诸省！', category: 'crisis', trigger: { minTurn: 8 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '编户安置', effects: { gold: -80, food: -40, stability: 8, population: 200, factionSat: fr('commoners', 12) }, aiWeight: 3 },
    { text: '遣散回乡', effects: { population: -150, stability: -5, legitimacy: -5 }, aiWeight: 2 },
  ] },

  // 链 5：盛世衰落链——奢靡→乱政→中兴
  { id: 'evt_chain_decline_1', title: '奢靡之风', description: '宫廷奢靡，权贵斗富，民风渐浮！', category: 'politics', trigger: { minTurn: 25, minStability: 50, minGold: 500 }, weight: 3, cooldown: 100, unique: false, options: [
    { text: '提倡节俭', effects: { stability: 5, legitimacy: 5, factionSat: fr('nobles', -10), triggerEvent: 'evt_chain_decline_2' }, aiWeight: 3 },
    { text: '纵容浮华', effects: { gold: -100, corruption: 8, stability: -3, factionSat: fr('nobles', 12), triggerEvent: 'evt_chain_decline_2' }, aiWeight: 1 },
  ] },
  { id: 'evt_chain_decline_2', title: '吏治败坏', description: '贪墨横行，政令不出京畿，行政瘫痪！', category: 'politics', trigger: { minTurn: 25, minCorruption: 40 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '严惩贪吏', effects: { gold: -120, corruption: -10, stability: -5, factionSat: fr('nobles', -15), triggerEvent: 'evt_chain_decline_3' }, aiWeight: 3 },
    { text: '得过且过', effects: { corruption: 5, efficiency: -5, legitimacy: -8, triggerEvent: 'evt_chain_decline_3' }, aiWeight: 1 },
  ] },
  { id: 'evt_chain_decline_3', title: '中兴之机', description: '乱象毕露，朝野呼吁改革图强！', category: 'opportunity', trigger: { minTurn: 25 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '力行新政', effects: { gold: -200, stability: -8, legitimacy: 15, efficiency: 8, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, aiWeight: 3 },
    { text: '徐图整顿', effects: { gold: -80, stability: 3, efficiency: 3, legitimacy: 5 }, aiWeight: 2 },
  ] },

  // ── E15 王朝继位玩家干预事件（dynasty 引擎触发）──
  { id: 'evt_dynasty_heir_birth', title: '储君降生', description: '后宫诞下龙裔，举国欢庆！请定储君之名。', category: 'politics', trigger: { minTurn: 1 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '立为储君', effects: { legitimacy: 10, stability: 5, factionSat: fr('nobles', 12) }, aiWeight: 3 },
    { text: '暂不立储', effects: { legitimacy: -3, stability: -2, factionSat: fr('nobles', -8) }, aiWeight: 1 },
  ] },
  { id: 'evt_dynasty_ruler_decline', title: '君王老迈', description: '主春秋年迈，精力渐衰，朝臣请预立储以固国本。', category: 'politics', trigger: { minTurn: 30 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '禅让储君', effects: { legitimacy: 5, stability: 8, factionSat: fr('nobles', 10) }, aiWeight: 3 },
    { text: '勉力视朝', effects: { stability: -3, legitimacy: -5, factionSat: fr('nobles', -5) }, aiWeight: 2 },
  ] },

  // ── P3 扩展事件链 6-9 + 独立事件（目标 150+）──
  // 链 6：科技突破链——灵感→试验→应用或事故
  { id: 'evt_chain_tech_1', title: '异象启思', description: '夜观星象，学者忽得灵感，称可革新农具！', category: 'science', trigger: { minTurn: 12, techLevelAbove: { branch: 'agri', level: 1 } }, weight: 4, cooldown: 80, unique: false, options: [
    { text: '拨金资助', effects: { gold: -80, sciPt: 10, factionSat: fr('clergy', -5), triggerEvent: 'evt_chain_tech_2' }, aiWeight: 3 },
    { text: '观其自成', effects: { sciPt: 3, triggerEvent: 'evt_chain_tech_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_tech_2', title: '工坊试验', description: '学者于工坊中反复试验，成败参半！', category: 'science', trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '追加投入', effects: { gold: -120, sciPt: 8, efficiency: 3, triggerEvent: 'evt_chain_tech_3' }, aiWeight: 3 },
    { text: '谨慎推进', effects: { gold: -40, sciPt: 4, triggerEvent: 'evt_chain_tech_3' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_tech_3', title: '革新问世', description: '新农具问世，粮产可期！然旧匠抵制新技术。', category: 'opportunity', trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '全面推广', effects: { gold: -60, food: 80, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: -8 }) }, aiWeight: 3 },
    { text: '缓慢渗透', effects: { food: 30, sciPt: 5 }, aiWeight: 2 },
  ] },

  // 链 7：文化输入链——异邦艺术→风靡→本土化或文化冲突
  { id: 'evt_chain_culture_1', title: '异邦献艺', description: '异邦使团献上奇珍乐舞，朝野为之倾倒！', category: 'culture', trigger: { minTurn: 15, notAtWar: true }, weight: 4, cooldown: 90, unique: false, options: [
    { text: '盛情接纳', effects: { gold: -40, influence: 5, legitimacy: 3, triggerEvent: 'evt_chain_culture_2' }, aiWeight: 3 },
    { text: '谨慎观赏', effects: { influence: 2, triggerEvent: 'evt_chain_culture_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_culture_2', title: '风尚风靡', description: '异邦艺术在上流社会风靡，本土艺人抗议声起！', category: 'culture', trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '提倡融合', effects: { gold: -60, influence: 8, factionSat: fr('clergy', -8), triggerEvent: 'evt_chain_culture_3' }, aiWeight: 3 },
    { text: '压制异风', effects: { influence: -5, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_culture_3' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_culture_3', title: '文化定调', description: '风气之争终有定论，帝国文化走向何方？', category: 'culture', trigger: { minTurn: 15 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '兼容并蓄', effects: { gold: -80, influence: 12, legitimacy: 8, assimilationMod: 1 }, aiWeight: 3 },
    { text: '固守正统', effects: { legitimacy: 5, influence: -3, factionSat: fr('clergy', 15) }, aiWeight: 2 },
  ] },

  // 链 8：联盟瓦解链——盟国生疑→摩擦→决裂或修复
  { id: 'evt_chain_alliance_1', title: '盟国生疑', description: '盟国使臣旁敲侧击，疑你有背盟之意！', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, weight: 4, cooldown: 70, unique: false, options: [
    { text: '遣使重申盟约', effects: { gold: -50, influence: 5, triggerEvent: 'evt_chain_alliance_2' }, aiWeight: 3 },
    { text: '置之不理', effects: { influence: -8, stability: 2, triggerEvent: 'evt_chain_alliance_2' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_alliance_2', title: '边境摩擦', description: '盟国边军与己方商队发生摩擦！', category: 'diplomacy', trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '赔礼道歉', effects: { gold: -80, influence: 3, legitimacy: -3, triggerEvent: 'evt_chain_alliance_3' }, aiWeight: 3 },
    { text: '强硬索赔', effects: { gold: 30, influence: -10, factionSat: fr('military', 8), triggerEvent: 'evt_chain_alliance_3' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_alliance_3', title: '盟约抉择', description: '盟国递交最后通牒，是和是裂？', category: 'diplomacy', trigger: { minTurn: 10 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '修复盟约', effects: { gold: -100, influence: 10, legitimacy: 5, factionSat: fr('merchants', 8) }, aiWeight: 3 },
    { text: '听任决裂', effects: { influence: -15, stability: 5, factionSat: fr('military', 12) }, aiWeight: 2 },
  ] },

  // 链 9：移民潮链——流民入境→安置压力→同化或排斥
  { id: 'evt_chain_migrate_1', title: '流民叩边', description: '邻邦大乱，数万流民叩关求附！', category: 'population', trigger: { minTurn: 12 }, weight: 5, cooldown: 80, unique: false, options: [
    { text: '开关纳之', effects: { food: -80, population: 400, stability: -3, triggerEvent: 'evt_chain_migrate_2' }, aiWeight: 2 },
    { text: '闭关拒之', effects: { legitimacy: -5, influence: -3, factionSat: fr('commoners', 5), triggerEvent: 'evt_chain_migrate_2' }, aiWeight: 3 },
  ] },
  { id: 'evt_chain_migrate_2', title: '安置之困', description: '流民聚居边省，与本地民众争田争水！', category: 'population', trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: false, options: [
    { text: '编户齐民', effects: { gold: -100, food: -40, population: 200, efficiency: 3, triggerEvent: 'evt_chain_migrate_3' }, aiWeight: 3 },
    { text: '设栅隔离', effects: { gold: -30, stability: -5, factionSat: fr('commoners', -10), triggerEvent: 'evt_chain_migrate_3' }, aiWeight: 2 },
  ] },
  { id: 'evt_chain_migrate_3', title: '融合或排斥', description: '流民问题终须解决，帝国包容性面临考验。', category: 'population', trigger: { minTurn: 12 }, weight: 0, cooldown: 0, unique: true, options: [
    { text: '一视同仁', effects: { gold: -60, population: 150, influence: 8, assimilationMod: 1, factionSat: fr('commoners', 8) }, aiWeight: 3 },
    { text: '区别对待', effects: { stability: -8, corruption: 5, factionSat: fr('nobles', 8) }, aiWeight: 2 },
  ] },

  // ── 独立事件扩展（覆盖 science/culture/population/diplomacy 稀缺分类）──
  { id: 'evt_library_fire', title: '学院失火', description: '皇家学院深夜失火，典籍付之一炬！', category: 'science', trigger: { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: '全力抢救', effects: { gold: -100, sciPt: -10, stability: 3 }, aiWeight: 3 }, { text: '听之任之', effects: { sciPt: -25, legitimacy: -5 }, aiWeight: 2 }] },
  { id: 'evt_scientist_defect', title: '学者投奔', description: '异邦知名学者请求政治庇护！', category: 'science', trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '接纳重用', effects: { gold: 50, sciPt: 20, influence: -3 }, aiWeight: 3 }, { text: '婉拒遣返', effects: { influence: 5, legitimacy: 3 }, aiWeight: 2 }] },
  { id: 'evt_alchemy_craze', title: '炼金狂热', description: '宫廷兴起炼金热潮，方士声称能点石成金！', category: 'science', trigger: { minTurn: 15 }, weight: 4, cooldown: 35, unique: false, options: [{ text: '资助试验', effects: { gold: -150, corruption: 5, factionSat: fr('clergy', -10) }, aiWeight: 2 }, { text: '斥为邪术', effects: { legitimacy: 3, factionSat: fr('clergy', 12) }, aiWeight: 3 }] },
  { id: 'evt_cultural_revival', title: '文艺复兴', description: '古典文化复兴运动席卷学界！', category: 'culture', trigger: { minTurn: 20, minStability: 50, techLevelAbove: { branch: 'culture', level: 2 } }, weight: 3, cooldown: 60, unique: false, options: [{ text: '大力倡导', effects: { gold: -100, influence: 15, legitimacy: 8, sciPt: 10 }, aiWeight: 3 }, { text: '顺其自然', effects: { influence: 5, sciPt: 3 }, aiWeight: 2 }] },
  { id: 'evt_temple_construction', title: '庙宇大兴', description: '神职团体请建大庙，信众踊跃捐资！', category: 'culture', trigger: { minTurn: 10, minStability: 40 }, weight: 4, cooldown: 40, unique: false, options: [{ text: '钦准督建', effects: { gold: -80, legitimacy: 8, influence: 5, factionSat: fr('clergy', 15) }, aiWeight: 3 }, { text: '民办官助', effects: { gold: -30, factionSat: fr('clergy', 8) }, aiWeight: 2 }] },
  { id: 'evt_festival_grand', title: '万国来朝', description: '藩属遣使朝贺，帝国威仪远播！', category: 'culture', trigger: { minTurn: 25, minStability: 60, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: '盛大庆贺', effects: { gold: -150, influence: 20, legitimacy: 10, factionSat: fr('nobles', 10) }, aiWeight: 3 }, { text: '简礼相待', effects: { gold: -40, influence: 8 }, aiWeight: 2 }] },
  { id: 'evt_plague_quarantine', title: '检疫之争', description: '边境发现疫病，是否封锁边境？', category: 'population', trigger: { minTurn: 15 }, weight: 4, cooldown: 40, unique: false, options: [{ text: '严格隔离', effects: { gold: -60, population: -50, stability: -3, factionSat: fr('merchants', -12) }, aiWeight: 3 }, { text: '有限检查', effects: { population: -150, stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_diplomatic_marriage', title: '和亲之议', description: '强国遣使求和亲，欲结秦晋之好！', category: 'diplomacy', trigger: { minTurn: 15, notAtWar: true }, weight: 4, cooldown: 50, unique: false, options: [{ text: '允诺和亲', effects: { gold: 100, influence: 15, legitimacy: -3, factionSat: fr('nobles', -8) }, aiWeight: 3 }, { text: '婉言谢绝', effects: { influence: -5, stability: 3 }, aiWeight: 2 }] },
  { id: 'evt_trade_embargo', title: '他国禁运', description: '邻邦联合对你的商品实施禁运！', category: 'diplomacy', trigger: { minTurn: 18 }, weight: 5, cooldown: 40, unique: false, options: [{ text: '寻求新商路', effects: { gold: -100, influence: 5, factionSat: fr('merchants', 8) }, aiWeight: 3 }, { text: '反制禁运', effects: { gold: -50, influence: -8, stability: 3 }, aiWeight: 2 }] },
  { id: 'evt_border_demarcate', title: '勘界定疆', description: '与邻国勘定边界，争议之地如何处置？', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: '据理力争', effects: { gold: -40, influence: 5, factionSat: fr('military', 8) }, aiWeight: 2 }, { text: '互让妥协', effects: { gold: 20, influence: 8, legitimacy: 3 }, aiWeight: 3 }] },
  { id: 'evt_secret_treaty', title: '密约曝光', description: '你与他国的秘密条约被泄露，朝野哗然！', category: 'diplomacy', trigger: { minTurn: 20 }, weight: 4, cooldown: 60, unique: false, options: [{ text: '公开承认', effects: { legitimacy: -8, influence: 5, stability: -3 }, aiWeight: 2 }, { text: '矢口否认', effects: { legitimacy: -3, influence: -10, corruption: 3 }, aiWeight: 3 }] },

  // ── P-fix 补齐事件到 150（覆盖 science/culture/population/diplomacy/opportunity）──
  { id: 'evt_sci_observatory', title: '观星台', description: '天文学家请建观星台，观测星象以推历法！', category: 'science', trigger: { minTurn: 18, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: '拨款兴建', effects: { gold: -120, sciPt: 30, influence: 5 }, aiWeight: 3 }, { text: '民间观测', effects: { sciPt: 8 }, aiWeight: 2 }] },
  { id: 'evt_sci_water_mill', title: '水力磨坊', description: '工匠发明水力磨坊，粮产加工效率大增！', category: 'science', trigger: { minTurn: 14, techLevelAbove: { branch: 'agri', level: 2 } }, weight: 4, cooldown: 40, unique: false, options: [{ text: '推广全国', effects: { gold: -80, food: 50, factionSat: fr('commoners', 8) }, aiWeight: 3 }, { text: '限皇家专用', effects: { gold: -30, food: 15 }, aiWeight: 2 }] },
  { id: 'evt_sci_medical_text', title: '医典编纂', description: '太医奉旨编纂医典，汇天下方术！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 3 } }, weight: 3, cooldown: 50, unique: false, options: [{ text: '颁行天下', effects: { gold: -100, sciPt: 20, stability: 5, population: 100 }, aiWeight: 3 }, { text: '秘藏内府', effects: { sciPt: 10, factionSat: fr('clergy', 5) }, aiWeight: 2 }] },
  { id: 'evt_culture_poet', title: '诗人献赋', description: '名诗人献颂赋，辞藻华美，朝野传诵！', category: 'culture', trigger: { minTurn: 12, minStability: 40 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '厚赏赐爵', effects: { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, aiWeight: 3 }, { text: '口头嘉奖', effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: 'evt_culture_architecture', title: '宫室营建', description: '匠师献新图样，请建宏伟宫室以彰国威！', category: 'culture', trigger: { minTurn: 22, minStability: 50, minGold: 300 }, weight: 3, cooldown: 60, unique: false, options: [{ text: '大兴土木', effects: { gold: -250, legitimacy: 10, influence: 8, factionSat: fr('nobles', 12) }, aiWeight: 2 }, { text: '简朴从事', effects: { legitimacy: 3, factionSat: fr('commoners', 5) }, aiWeight: 3 }] },
  { id: 'evt_culture_relic', title: '圣物现世', description: '古寺出土圣物，信众蜂拥朝拜！', category: 'culture', trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: '迎入京畿', effects: { gold: -60, legitimacy: 8, factionSat: fr('clergy', 15), influence: 5 }, aiWeight: 3 }, { text: '留寺供奉', effects: { stability: 3, factionSat: fr('clergy', 8) }, aiWeight: 2 }] },
  { id: 'evt_pop_urbanization', title: '市井繁兴', description: '都城商市繁兴，百业云集！', category: 'population', trigger: { minTurn: 16, minStability: 50, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 40, unique: false, options: [{ text: '规范市坊', effects: { gold: 60, efficiency: 3, factionSat: fr('merchants', 10) }, aiWeight: 3 }, { text: '任其发展', effects: { gold: 40, corruption: 3 }, aiWeight: 2 }] },
  { id: 'evt_pop_infant', title: '婴殇之痛', description: '都城婴夭率高，太医请设育婴局！', category: 'population', trigger: { minTurn: 14 }, weight: 4, cooldown: 40, unique: false, options: [{ text: '设局哺育', effects: { gold: -80, population: 80, stability: 3, factionSat: fr('commoners', 12) }, aiWeight: 3 }, { text: '听天由命', effects: { population: -50, factionSat: fr('commoners', -8) }, aiWeight: 2 }] },
  { id: 'evt_dip_tribute', title: '藩属朝贡', description: '远方藩属遣使朝贡珍异物产！', category: 'diplomacy', trigger: { minTurn: 20, notAtWar: true, minStability: 50 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '厚往薄来', effects: { gold: -100, influence: 15, legitimacy: 8 }, aiWeight: 3 }, { text: '常礼相待', effects: { gold: -30, influence: 5 }, aiWeight: 2 }] },
  { id: 'evt_dip_mediation', title: '邻邦请调', description: '两邻邦开战，双方皆请我国调停！', category: 'diplomacy', trigger: { minTurn: 18, notAtWar: true }, weight: 3, cooldown: 50, unique: false, options: [{ text: '出面斡旋', effects: { gold: -60, influence: 20, legitimacy: 5, sciPt: 5 }, aiWeight: 3 }, { text: '保持中立', effects: { influence: -3, stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_opp_granary_surplus', title: '粮仓充盈', description: '连年丰收，粮仓满溢，如何处置？', category: 'opportunity', trigger: { minTurn: 12, notAtWar: true }, weight: 3, cooldown: 30, unique: false, options: [{ text: '平价出粜', effects: { gold: 100, food: -80, factionSat: fr('merchants', 8) }, aiWeight: 3 }, { text: '备荒储备', effects: { stability: 5, factionSat: fr('commoners', 5) }, aiWeight: 2 }] },
  { id: 'evt_opp_mercenary_captain', title: '雇佣兵首领', description: '百战雇佣兵首领率部来投，愿为前锋！', category: 'opportunity', trigger: { minTurn: 14, atWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '委以重任', effects: { gold: -80, factionSat: fr('military', 15), influence: 3 }, aiWeight: 3 }, { text: '存疑不用', effects: { stability: -2, factionSat: fr('military', -5) }, aiWeight: 2 }] },
  { id: 'evt_opp_good_harvest_chain', title: '连年丰稔', description: '连续丰收，百姓富足，国库充盈！', category: 'opportunity', trigger: { minTurn: 16, notAtWar: true, minStability: 60 }, weight: 2, cooldown: 60, unique: false, options: [{ text: '减免赋税', effects: { gold: -100, stability: 8, factionSat: fr('commoners', 15), legitimacy: 5 }, aiWeight: 3 }, { text: '充实国库', effects: { gold: 200, factionSat: fr('commoners', -5) }, aiWeight: 2 }] },
  // ── D1: 扩充至 300+ 事件（每类别 ≥8） ──
  { id: 'evt_locust', title: '蝗灾', description: '蝗虫过境，寸草不生！', category: 'crisis', trigger: { minTurn: 8 }, weight: 4, cooldown: 35, unique: false, options: [{ text: '组织灭蝗', effects: { gold: -60, food: -80, stability: 3 }, aiWeight: 3 }, { text: '祈天求雨', effects: { food: -120, legitimacy: -3 }, aiWeight: 2 }] },
  { id: 'evt_flood', title: '洪涝', description: '暴雨成灾，良田被淹！', category: 'crisis', trigger: { minTurn: 6 }, weight: 5, cooldown: 30, unique: false, options: [{ text: '筑堤救灾', effects: { gold: -100, food: -60, stability: 4 }, aiWeight: 3 }, { text: '转移高地', effects: { food: -40, population: -80 }, aiWeight: 2 }] },
  { id: 'evt_blight', title: '疫病侵袭庄稼', description: '作物大面积枯萎！', category: 'crisis', trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '焚田防疫', effects: { food: -150, stability: -3 }, aiWeight: 2 }, { text: '寻求良种', effects: { gold: -50, food: -80 }, aiWeight: 3 }] },
  { id: 'evt_hail', title: '冰雹', description: '突降冰雹，毁坏庄稼！', category: 'crisis', trigger: {}, weight: 3, cooldown: 50, unique: false, options: [{ text: '开仓赈济', effects: { food: -60, gold: -40, stability: 5 }, aiWeight: 3 }, { text: '自力更生', effects: { food: -100, stability: -3 }, aiWeight: 2 }] },
  { id: 'evt_famine_riot', title: '饥民暴动', description: '饥饿的民众冲击粮仓！', category: 'crisis', trigger: { maxFoodRatio: 0.4 }, weight: 8, cooldown: 20, unique: false, options: [{ text: '镇压', effects: { gold: -40, stability: -5, factionSat: fr('military', 5) }, aiWeight: 2 }, { text: '放粮安抚', effects: { food: -100, stability: 5, factionSat: fr('commoners', 10) }, aiWeight: 3 }] },
  { id: 'evt_wolf_plague', title: '兽疫', description: '牲畜大批死亡！', category: 'crisis', trigger: { minTurn: 12 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '隔离焚烧', effects: { food: -50, gold: -30 }, aiWeight: 3 }, { text: '求医问药', effects: { gold: -60, food: -30 }, aiWeight: 2 }] },
  { id: 'evt_noble_exile', title: '贵族流亡', description: '失势贵族逃亡他国！', category: 'politics', trigger: { maxLegitimacy: 30 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '通缉追回', effects: { gold: -50, legitimacy: 3 }, aiWeight: 2 }, { text: '任其去留', effects: { factionSat: fr('nobles', -8), stability: 2 }, aiWeight: 3 }] },
  { id: 'evt_noble_marriage', title: '贵族联姻', description: '两大贵族家族联姻，势力坐大！', category: 'politics', trigger: { minTurn: 10 }, weight: 3, cooldown: 35, unique: false, options: [{ text: '赐婚支持', effects: { gold: -40, factionSat: fr('nobles', 12), legitimacy: 3 }, aiWeight: 3 }, { text: '从中作梗', effects: { factionSat: fr('nobles', -10), stability: -3 }, aiWeight: 2 }] },
  { id: 'evt_noble_disinherit', title: '夺爵', description: '贵族子弟被夺爵，引发争议！', category: 'politics', trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '维持原判', effects: { factionSat: fr('nobles', -12), legitimacy: 5 }, aiWeight: 2 }, { text: '恢复爵位', effects: { factionSat: fr('nobles', 8), gold: -60 }, aiWeight: 3 }] },
  { id: 'evt_faction_civil_war', title: '派系内战', description: '两大派系公开冲突！', category: 'politics', trigger: { maxStability: 35 }, weight: 7, cooldown: 20, unique: false, options: [{ text: '支持一方', effects: { stability: -8, legitimacy: -5 }, aiWeight: 2 }, { text: '调停', effects: { gold: -80, stability: 3 }, aiWeight: 3 }] },
  { id: 'evt_merchant_smuggle', title: '走私猖獗', description: '商人走私逃税严重！', category: 'politics', trigger: { minCorruption: 25 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '严打走私', effects: { gold: 60, factionSat: fr('merchants', -10), corruption: -3 }, aiWeight: 2 }, { text: '睁只眼闭只眼', effects: { corruption: 5, factionSat: fr('merchants', 5) }, aiWeight: 3 }] },
  { id: 'evt_merchant_monopoly', title: '行会垄断', description: '商人行会垄断市场！', category: 'politics', trigger: { minTurn: 15 }, weight: 3, cooldown: 35, unique: false, options: [{ text: '打破垄断', effects: { gold: -50, factionSat: fra({ faction: 'merchants', delta: -15 }, { faction: 'commoners', delta: 10 }) }, aiWeight: 3 }, { text: '收税了事', effects: { gold: 80, corruption: 3 }, aiWeight: 2 }] },
  { id: 'evt_military_coup_attempt', title: '兵变未遂', description: '部分将领密谋兵变！', category: 'politics', trigger: { factionSatBelow: { faction: 'military', threshold: 15 }, maxLegitimacy: 35 }, weight: 9, cooldown: 50, unique: false, options: [{ text: '铁腕镇压', effects: { gold: -100, stability: -8, factionSat: fr('military', -15) }, aiWeight: 2 }, { text: '安抚军心', effects: { gold: -80, factionSat: fr('military', 10), stability: -3 }, aiWeight: 3 }] },
  { id: 'evt_military_veteran', title: '老兵安置', description: '退役老兵无以为生！', category: 'politics', trigger: { minTurn: 12 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '赐田安置', effects: { gold: -60, factionSat: fr('military', 10), stability: 3 }, aiWeight: 3 }, { text: '不予理睬', effects: { factionSat: fr('military', -12), stability: -3 }, aiWeight: 2 }] },
  { id: 'evt_military_mutiny', title: '哗变', description: '欠饷士兵哗变！', category: 'politics', trigger: { factionSatBelow: { faction: 'military', threshold: 10 } }, weight: 10, cooldown: 30, unique: false, options: [{ text: '镇压', effects: { gold: -80, stability: -10, factionSat: fr('military', -8) }, aiWeight: 2 }, { text: '补发欠饷', effects: { gold: -120, factionSat: fr('military', 15), stability: 3 }, aiWeight: 3 }] },
  { id: 'evt_trade_embargo_hit', title: '贸易禁运冲击', description: '他国对我国禁运！', category: 'economy', trigger: { minTurn: 10 }, weight: 5, cooldown: 30, unique: false, options: [{ text: '自给自足', effects: { gold: -50, stability: 3 }, aiWeight: 3 }, { text: '寻找替代', effects: { gold: -80, influence: 3 }, aiWeight: 2 }] },
  { id: 'evt_inflation', title: '通胀', description: '物价飞涨，民怨沸腾！', category: 'economy', trigger: { minCorruption: 40 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '紧缩银根', effects: { gold: -80, stability: 3, corruption: -3 }, aiWeight: 3 }, { text: '放任不管', effects: { factionSat: fr('commoners', -12), corruption: 5 }, aiWeight: 2 }] },
  { id: 'evt_devaluation', title: '货币贬值', description: '铸币掺假，币值暴跌！', category: 'economy', trigger: { minCorruption: 50 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '整顿币制', effects: { gold: -100, legitimacy: 5, corruption: -5 }, aiWeight: 3 }, { text: '借机牟利', effects: { gold: 150, corruption: 8, factionSat: fr('merchants', -10) }, aiWeight: 2 }] },
  { id: 'evt_resource_shortage', title: '资源短缺', description: '铁矿木材严重不足！', category: 'economy', trigger: { minTurn: 8 }, weight: 4, cooldown: 25, unique: false, options: [{ text: '高价采购', effects: { gold: -80, iron: 20, wood: 20 }, aiWeight: 3 }, { text: '限制消耗', effects: { factionSat: fr('military', -8), stability: -2 }, aiWeight: 2 }] },
  { id: 'evt_caravan_arrival', title: '商队抵达', description: '远方商队带来珍奇货物！', category: 'economy', trigger: { minTurn: 5, notAtWar: true }, weight: 4, cooldown: 20, unique: false, options: [{ text: '设市交易', effects: { gold: 80, factionSat: fr('merchants', 8) }, aiWeight: 3 }, { text: '征收关税', effects: { gold: 120, factionSat: fr('merchants', -5) }, aiWeight: 2 }] },
  { id: 'evt_bank_loan', title: '钱庄借贷', description: '钱庄愿借巨款！', category: 'economy', trigger: { minTurn: 10 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '接受借贷', effects: { gold: 300, corruption: 5 }, aiWeight: 3 }, { text: '婉拒', effects: { legitimacy: 3 }, aiWeight: 2 }] },
  { id: 'evt_market_crash', title: '市崩', description: '市场恐慌，物价暴跌！', category: 'economy', trigger: { minTurn: 15 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '抄底收购', effects: { gold: -150, stability: -5 }, aiWeight: 2 }, { text: '稳定市价', effects: { gold: -80, stability: 5 }, aiWeight: 3 }] },
  { id: 'evt_frontline_victory', title: '前线大捷', description: '我军大破敌军！', category: 'military', trigger: { atWar: true }, weight: 6, cooldown: 10, unique: false, options: [{ text: '乘胜追击', effects: { gold: -50, factionSat: fr('military', 12), stability: 5 }, aiWeight: 2 }, { text: '见好就收', effects: { legitimacy: 5, factionSat: fr('military', -3) }, aiWeight: 3 }] },
  { id: 'evt_siege', title: '围城', description: '敌军围困我方城池！', category: 'military', trigger: { atWar: true }, weight: 7, cooldown: 15, unique: false, options: [{ text: '死守待援', effects: { food: -80, gold: -40, stability: 3 }, aiWeight: 3 }, { text: '突围', effects: { gold: -60, stability: -5, factionSat: fr('military', 5) }, aiWeight: 2 }] },
  { id: 'evt_deserter', title: '逃兵', description: '大批士兵逃亡！', category: 'military', trigger: { minWarExhaustion: 50 }, weight: 6, cooldown: 20, unique: false, options: [{ text: '严惩逃兵', effects: { factionSat: fr('military', 5), stability: -3 }, aiWeight: 2 }, { text: '改善待遇', effects: { gold: -80, factionSat: fr('military', 10) }, aiWeight: 3 }] },
  { id: 'evt_conscription_resistance', title: '抗征', description: '民众抗拒征兵！', category: 'military', trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '强制征兵', effects: { factionSat: fr('commoners', -15), stability: -5 }, aiWeight: 2 }, { text: '减少征额', effects: { factionSat: fr('commoners', 8), stability: 2 }, aiWeight: 3 }] },
  { id: 'evt_war_profit', title: '战争财', description: '军需旺盛，商人发战争财！', category: 'military', trigger: { atWar: true, minTurn: 10 }, weight: 3, cooldown: 25, unique: false, options: [{ text: '征收战争税', effects: { gold: 100, factionSat: fr('merchants', -8) }, aiWeight: 2 }, { text: '鼓励供应', effects: { gold: 50, factionSat: fr('merchants', 5) }, aiWeight: 3 }] },
  { id: 'evt_alliance_proposal', title: '同盟邀请', description: '他国提议结盟！', category: 'diplomacy', trigger: { notAtWar: true, minTurn: 8 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '同意结盟', effects: { influence: 10, legitimacy: 3 }, aiWeight: 3 }, { text: '婉拒', effects: { influence: -3 }, aiWeight: 2 }] },
  { id: 'evt_treaty_break', title: '毁约', description: '盟国单方面撕毁条约！', category: 'diplomacy', trigger: { minTurn: 15 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '强烈抗议', effects: { legitimacy: 5, stability: -3 }, aiWeight: 2 }, { text: '忍气吞声', effects: { legitimacy: -8, factionSat: fr('nobles', -10) }, aiWeight: 3 }] },
  { id: 'evt_hostage_return', title: '质子归还', description: '他国归还人质！', category: 'diplomacy', trigger: { minTurn: 20, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '善待归国', effects: { legitimacy: 5, stability: 3 }, aiWeight: 3 }, { text: '冷待', effects: { factionSat: fr('nobles', -5) }, aiWeight: 2 }] },
  { id: 'evt_pirate_attack', title: '海盗袭击', description: '海盗劫掠沿海！', category: 'diplomacy', trigger: { minTurn: 8 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '出兵剿灭', effects: { gold: -60, factionSat: fr('military', 8), stability: 3 }, aiWeight: 3 }, { text: '招安', effects: { gold: -30, corruption: 5 }, aiWeight: 2 }] },
  { id: 'evt_tribute_demand', title: '索贡', description: '强国要求进贡！', category: 'diplomacy', trigger: { minTurn: 12 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '忍辱进贡', effects: { gold: -100, legitimacy: -5, stability: -3 }, aiWeight: 3 }, { text: '拒绝', effects: { legitimacy: 8, stability: -5 }, aiWeight: 2 }] },
  { id: 'evt_cultural_exchange', title: '文化交流', description: '他国学者来访交流！', category: 'diplomacy', trigger: { notAtWar: true, minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '热烈欢迎', effects: { sciPt: 8, influence: 5, gold: -30 }, aiWeight: 3 }, { text: '谨慎对待', effects: { sciPt: 3 }, aiWeight: 2 }] },
  { id: 'evt_heresy', title: '异端', description: '异端教派兴起！', category: 'religion', trigger: { minTurn: 10, maxStability: 50 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '镇压异端', effects: { stability: -5, factionSat: fr('clergy', 10), legitimacy: 3 }, aiWeight: 2 }, { text: '宽容对待', effects: { factionSat: fr('clergy', -12), stability: 3 }, aiWeight: 3 }] },
  { id: 'evt_holy_war_call', title: '圣战号召', description: '宗教领袖号召圣战！', category: 'religion', trigger: { minTurn: 20 }, weight: 3, cooldown: 50, unique: false, options: [{ text: '响应号召', effects: { factionSat: fr('clergy', 15), stability: -5, legitimacy: 5 }, aiWeight: 2 }, { text: '拒绝', effects: { factionSat: fr('clergy', -15), stability: 3 }, aiWeight: 3 }] },
  { id: 'evt_shrine_miracle', title: '神迹', description: '神殿现异象，信徒蜂拥！', category: 'religion', trigger: { minTurn: 15, minStability: 40 }, weight: 2, cooldown: 60, unique: false, options: [{ text: '大肆宣扬', effects: { legitimacy: 8, factionSat: fr('clergy', 12), influence: 5 }, aiWeight: 3 }, { text: '低调处理', effects: { legitimacy: 2 }, aiWeight: 2 }] },
  { id: 'evt_monastery_land', title: '寺院占地', description: '寺院广占良田！', category: 'religion', trigger: { minTurn: 12, minCorruption: 20 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '没收还田', effects: { food: 50, factionSat: fr('clergy', -15), legitimacy: -3 }, aiWeight: 3 }, { text: '维持现状', effects: { factionSat: fr('clergy', 5), corruption: 3 }, aiWeight: 2 }] },
  { id: 'evt_tech_academy', title: '学府争鸣', description: '各学派激烈论战！', category: 'science', trigger: { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, weight: 3, cooldown: 30, unique: false, options: [{ text: '资助研究', effects: { gold: -60, sciPt: 10, factionSat: fr('nobles', -5) }, aiWeight: 3 }, { text: '限制争论', effects: { stability: 3, sciPt: -3 }, aiWeight: 2 }] },
  { id: 'evt_tech_leak', title: '技术外流', description: '核心机密被他国窃取！', category: 'science', trigger: { minTurn: 15 }, weight: 3, cooldown: 40, unique: false, options: [{ text: '追查内鬼', effects: { gold: -50, stability: -3 }, aiWeight: 3 }, { text: '加速研发', effects: { gold: -80, sciPt: 8 }, aiWeight: 2 }] },
  { id: 'evt_tech_craft_guild', title: '工匠行会', description: '工匠组织行会保护秘方！', category: 'science', trigger: { minTurn: 8 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '支持行会', effects: { gold: -30, sciPt: 5, factionSat: fr('merchants', 5) }, aiWeight: 3 }, { text: '打破垄断', effects: { sciPt: -2, factionSat: fr('merchants', -8) }, aiWeight: 2 }] },
  { id: 'evt_tech_invention', title: '发明', description: '工匠发明新工具！', category: 'science', trigger: { techLevelAbove: { branch: 'agri', level: 2 } }, weight: 3, cooldown: 35, unique: false, options: [{ text: '推广使用', effects: { gold: -40, food: 30, sciPt: 3 }, aiWeight: 3 }, { text: '保守秘密', effects: { sciPt: 5, influence: 2 }, aiWeight: 2 }] },
  { id: 'evt_granary_rot', title: '粮仓霉变', description: '储粮大量霉变！', category: 'crisis', trigger: { minTurn: 10 }, weight: 4, cooldown: 30, unique: false, options: [{ text: '紧急清理', effects: { food: -80, gold: -30 }, aiWeight: 3 }, { text: '听之任之', effects: { food: -150, stability: -5 }, aiWeight: 2 }] },
  { id: 'evt_road_bandit', title: '路匪', description: '盗匪盘踞要道！', category: 'crisis', trigger: { maxStability: 45 }, weight: 5, cooldown: 20, unique: false, options: [{ text: '派兵清剿', effects: { gold: -40, stability: 5, factionSat: fr('military', 5) }, aiWeight: 3 }, { text: '绕道', effects: { gold: -20, factionSat: fr('merchants', -5) }, aiWeight: 2 }] },
  { id: 'evt_pop_plague', title: '时疫', description: '疫病在都城蔓延！', category: 'population', trigger: { minTurn: 15 }, weight: 5, cooldown: 30, unique: false, options: [{ text: '封城隔离', effects: { gold: -80, population: -100, stability: -3 }, aiWeight: 3 }, { text: '放任', effects: { population: -300, stability: -8 }, aiWeight: 2 }] },
  { id: 'evt_pop_festival', title: '万民同庆', description: '国泰民安，万民欢庆！', category: 'population', trigger: { minStability: 60, notAtWar: true, minTurn: 10 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '大赦天下', effects: { gold: -50, stability: 8, legitimacy: 5, factionSat: fr('commoners', 10) }, aiWeight: 3 }, { text: '照常', effects: { stability: 2 }, aiWeight: 2 }] },
  { id: 'evt_opp_relic', title: '圣物现世', description: '传说圣物被发掘！', category: 'opportunity', trigger: { minTurn: 20 }, weight: 2, cooldown: 60, unique: false, options: [{ text: '供奉展示', effects: { gold: -30, legitimacy: 10, factionSat: fr('clergy', 15), influence: 8 }, aiWeight: 3 }, { text: '秘藏', effects: { legitimacy: 3 }, aiWeight: 2 }] },
  { id: 'evt_opp_annex', title: '邻国内乱', description: '邻国陷入内乱，有机可乘！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, weight: 3, cooldown: 40, unique: false, options: [{ text: '趁虚而入', effects: { gold: -100, stability: -5, influence: 10 }, aiWeight: 2 }, { text: '静观其变', effects: { stability: 3 }, aiWeight: 3 }] },
  { id: 'evt_opp_trade_monopoly', title: '独占商路', description: '竞争对手退出，商路独占！', category: 'opportunity', trigger: { notAtWar: true, minTurn: 12 }, weight: 2, cooldown: 40, unique: false, options: [{ text: '大举扩张', effects: { gold: 150, factionSat: fr('merchants', 12) }, aiWeight: 3 }, { text: '稳扎稳打', effects: { gold: 60, stability: 3 }, aiWeight: 2 }] },
  { id: 'evt_opp_goldmine', title: '金矿发现', description: '探矿者发现大金矿！', category: 'opportunity', trigger: { minTurn: 20 }, weight: 2, cooldown: 50, unique: false, options: [{ text: '全力开采', effects: { gold: 300, corruption: 8, factionSat: fr('nobles', 10) }, aiWeight: 3 }, { text: '适度开采', effects: { gold: 100, corruption: 3 }, aiWeight: 2 }] },
  { id: 'evt_culture_propaganda', title: '文化输出', description: '他国仰慕我国文化！', category: 'culture', trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, weight: 3, cooldown: 30, unique: false, options: [{ text: '积极推广', effects: { gold: -40, influence: 12, legitimacy: 3 }, aiWeight: 3 }, { text: '来者不拒', effects: { influence: 5 }, aiWeight: 2 }] },
  { id: 'evt_culture_decay', title: '文化衰落', description: '文脉断绝，礼崩乐坏！', category: 'culture', trigger: { maxStability: 30 }, weight: 5, cooldown: 25, unique: false, options: [{ text: '兴学重教', effects: { gold: -80, stability: 5, legitimacy: 3 }, aiWeight: 3 }, { text: '听之任之', effects: { legitimacy: -5, factionSat: fr('nobles', -8) }, aiWeight: 2 }] },
  // ── B8: 政体切换反扑事件（3 个，仅 govTransitionActive 窗口内可触发）──
  { id: 'evt_gov_nobles_plot', title: '旧贵族密谋复辟', description: '失去特权的旧贵族暗中密谋，企图复辟旧制！', category: 'politics', trigger: { govTransitionActive: true }, weight: 10, cooldown: 5, unique: false, options: [{ text: '铁腕镇压', effects: { gold: -100, stability: -8, factionSat: fr('nobles', -20), legitimacy: 5 }, aiWeight: 2 }, { text: '安抚妥协', effects: { gold: -50, factionSat: fr('nobles', 15), legitimacy: -8 }, aiWeight: 3 }] },
  { id: 'evt_gov_republican_push', title: '共和派逼宫', description: '共和派借新政之机要求扩大议会权力！', category: 'politics', trigger: { govTransitionActive: true }, weight: 8, cooldown: 5, unique: false, options: [{ text: '顺应扩权', effects: { legitimacy: -5, stability: 5, factionSat: fr('merchants', 12) }, aiWeight: 3 }, { text: '坚守王权', effects: { stability: -10, factionSat: fr('merchants', -15), legitimacy: 3 }, aiWeight: 2 }] },
  { id: 'evt_gov_clergy_backlash', title: '教士反扑', description: '失势的教士煽动信众，指新政为异端！', category: 'religion', trigger: { govTransitionActive: true }, weight: 8, cooldown: 5, unique: false, options: [{ text: '政教分离', effects: { gold: -80, stability: -5, factionSat: fr('clergy', -18), legitimacy: 5 }, aiWeight: 2 }, { text: '拉拢教士', effects: { gold: -40, factionSat: fr('clergy', 10), legitimacy: -3 }, aiWeight: 3 }] },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
export const EVENT_IDS: string[] = EVENTS.map((e) => e.id);
export const EVENT_COUNT = EVENTS.length;
