// Imperium Aeternum — 事件表
// 数据源：docs/reference/02-system-rules.md §15 / docs/reference/formulas.md
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

function option(text: string, effects: EventEffect, aiWeight: number): EventOption {
  return { text, effects, aiWeight };
}

// Draw weight and cooldown in turns; chain-only stages enter through triggerEvent.
function recurring(weight: number, cooldown: number) {
  return { weight, cooldown, unique: false };
}
function oneTime(weight: number, cooldown: number) {
  return { weight, cooldown, unique: true };
}
const followUp = recurring(0, 0);
const uniqueFollowUp = oneTime(0, 0);

export const EVENTS: EventDef[] = [
  // ── 危机类 ──
  {
    id: 'evt_famine', title: '粮食危机', description: '多地粮仓告急，粮价飞涨，民众惶恐。',
    category: 'crisis',
    trigger: { maxFoodRatio: 0.6 },
    ...recurring(10, 15),
    options: [
      option('紧急开仓放粮', { food: -100, stability: 5, factionSat: fr('commoners', 10) }, 2),
      option('从邻国高价购粮', { gold: -150, food: 80, influence: -3 }, 3),
      option('坐视不管', { stability: -10, population: -50, factionSat: fr('commoners', -15) }, 1),
    ],
  },
  {
    id: 'evt_plague', title: '瘟疫', description: '瘟疫蔓延，人口骤减。',
    category: 'crisis',
    trigger: { minTurn: 20 },
    ...recurring(4, 40),
    options: [
      option('隔离疫区', { population: -80, stability: -5, gold: -50 }, 3),
      option('祈神禳灾', { population: -150, factionSat: fr('clergy', 10) }, 2),
      option('召集学者研究', { population: -60, sciPt: 5, gold: -80 }, 2),
    ],
  },
  {
    id: 'evt_drought', title: '旱灾', description: '持续干旱，粮食减产。',
    category: 'crisis',
    trigger: {},
    ...recurring(6, 20),
    options: [
      option('减免农税', { taxRate: -0.02, food: -50, factionSat: fr('commoners', 10) }, 3),
      option('强行征粮', { food: 50, stability: -8, factionSat: fr('commoners', -15) }, 2),
    ],
  },
  // ── 政治类 ──
  {
    id: 'evt_noble_coup', title: '贵族逼宫', description: '不满的贵族密谋反对你的统治。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'nobles', threshold: 20 } },
    ...recurring(8, 25),
    options: [
      option('让步分权', { legitimacy: -10, efficiency: -5, factionSat: fr('nobles', 20) }, 3),
      option('铁腕镇压', { stability: -10, legitimacy: -5, factionSat: fra({ faction: 'nobles', delta: -10 }, { faction: 'military', delta: 5 }) }, 2),
    ],
  },
  {
    id: 'evt_merchant_strike', title: '商人罢市', description: '商人关闭店铺抗议税政。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'merchants', threshold: 20 } },
    ...recurring(8, 25),
    options: [
      option('减免商税', { taxRate: -0.02, gold: -50, factionSat: fr('merchants', 20) }, 3),
      option('强制开市', { gold: -100, stability: -5, factionSat: fr('merchants', -10) }, 2),
    ],
  },
  {
    id: 'evt_military_unrest', title: '军方不满', description: '欠饷的军队骚动不安。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'military', threshold: 20 } },
    ...recurring(9, 20),
    options: [
      option('补发军饷', { gold: -120, factionSat: fr('military', 25) }, 3),
      option('裁撤老兵', { population: -30, stability: -5, factionSat: fr('military', -10) }, 2),
    ],
  },
  {
    id: 'evt_peasant_uprising', title: '农民起义', description: '不堪重税的农民揭竿而起。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'commoners', threshold: 20 } },
    ...recurring(9, 20),
    options: [
      option('镇压起义', { gold: -80, population: -40, stability: -5, factionSat: fra({ faction: 'commoners', delta: -15 }, { faction: 'military', delta: 5 }) }, 3),
      option('允诺减税', { taxRate: -0.03, gold: -30, factionSat: fr('commoners', 25) }, 2),
    ],
  },
  {
    id: 'evt_clergy_interference', title: '神职干政', description: '神职人员要求更大的宗教话语权。',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'clergy', threshold: 30 }, minCorruption: 30 },
    ...recurring(5, 30),
    options: [
      option('授予宗教特权', { influence: 5, efficiency: -5, factionSat: fra({ faction: 'clergy', delta: 20 }, { faction: 'merchants', delta: -5 }) }, 3),
      option('拒绝并限制教权', { stability: -3, legitimacy: -3, factionSat: fr('clergy', -15) }, 2),
    ],
  },
  {
    id: 'evt_succession_crisis', title: '王位继承危机', description: '继承合法性受到质疑。',
    category: 'politics',
    trigger: { maxLegitimacy: 25 },
    ...recurring(12, 30),
    options: [
      option('争取贵族支持', { gold: -100, legitimacy: 15, factionSat: fr('nobles', 15) }, 3),
      option('民众拥戴路线', { gold: -80, legitimacy: 10, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -5 }) }, 2),
    ],
  },
  {
    id: 'evt_corruption_scandal', title: '腐败丑闻', description: '高官贪腐案曝光，朝野震动。',
    category: 'politics',
    trigger: { minCorruption: 60 },
    ...recurring(8, 20),
    options: [
      option('严惩涉案官员', { corruption: -10, gold: -50, factionSat: fr('nobles', -10) }, 3),
      option('大事化小', { corruption: 5, legitimacy: -5, factionSat: fr('commoners', -10) }, 2),
    ],
  },
  // ── 经济类 ──
  {
    id: 'evt_treasury_alarm', title: '国库告急', description: '国库即将见底，财政告急。',
    category: 'economy',
    trigger: { minTurn: 1 },
    ...recurring(7, 15),
    options: [
      option('临时加征特别税', { gold: 100, stability: -5, factionSat: fr('commoners', -10) }, 3),
      option('出售王室珍藏', { gold: 150, legitimacy: -3 }, 2),
    ],
  },
  {
    id: 'evt_trade_route_open', title: '商路开通', description: '一条新的商路被发现。',
    category: 'economy',
    trigger: { notAtWar: true },
    ...recurring(5, 30),
    options: [
      option('鼓励商人开拓', { gold: 50, influence: 3, factionSat: fr('merchants', 10) }, 3),
      option('王室垄断贸易', { gold: 100, factionSat: fr('merchants', -10) }, 2),
    ],
  },
  {
    id: 'evt_mineral_discovery', title: '矿藏发现', description: '勘探者发现新矿藏。',
    category: 'economy',
    trigger: {},
    ...recurring(4, 40),
    options: [
      option('立即开采', { iron: 50, gold: -30 }, 3),
      option('长期开发', { iron: 20, gold: 20 }, 2),
    ],
  },
  {
    id: 'evt_harvest_bumper', title: '丰收', description: '今年风调雨顺，粮食大丰。',
    category: 'economy',
    trigger: {},
    ...recurring(5, 15),
    options: [
      option('充实粮仓', { food: 200, stability: 3 }, 3),
      option('出口换金', { food: 100, gold: 80 }, 2),
    ],
  },
  // ── 军事类 ──
  {
    id: 'evt_war_weariness', title: '厌战民变', description: '长期战争引发民众厌战抗议。',
    category: 'military',
    trigger: { minWarExhaustion: 70 },
    ...recurring(10, 20),
    options: [
      option('承诺尽快停战', { warExhaustion: -10, factionSat: fr('commoners', 10) }, 3),
      option('强硬镇压反战', { stability: -10, warExhaustion: -5, factionSat: fr('commoners', -15) }, 2),
    ],
  },
  {
    id: 'evt_peace_proposal', title: '和谈提议', description: '敌方派出使者提议停战。',
    category: 'military',
    trigger: { atWar: true },
    ...recurring(8, 15),
    options: [
      option('接受和谈', { influence: 10, warExhaustion: -20 }, 3),
      option('拒绝继续战争', { stability: -3, factionSat: fr('military', 5) }, 2),
    ],
  },
  {
    id: 'evt_new_territory', title: '新领土治理', description: '刚占领的省份需要治理方案。',
    category: 'military',
    trigger: { hasNewTerritory: true },
    ...recurring(12, 5),
    options: [
      option('怀柔安抚', { gold: -80, stability: 3, influence: 5 }, 3),
      option('驻军镇压', { gold: -40, stability: -3, factionSat: fr('military', 5) }, 2),
    ],
  },
  // ── 外交类 ──
  {
    id: 'evt_border_clash', title: '边境外交危机', description: '与邻国边境发生小规模冲突。',
    category: 'diplomacy',
    trigger: { relationBelow: { target: 'n02', threshold: -30 } },
    ...recurring(7, 20),
    options: [
      option('外交斡旋', { influence: -10, relation: { target: 'n02', delta: 10 } }, 3),
      option('强硬反制', { relation: { target: 'n02', delta: -15 }, factionSat: fr('military', 8) }, 2),
    ],
  },
  {
    id: 'evt_foreign_envoy', title: '外国使团到访', description: '邻国派出使团寻求合作。',
    category: 'diplomacy',
    trigger: { notAtWar: true, minTurn: 5 },
    ...recurring(5, 25),
    options: [
      option('热情接待', { gold: -30, influence: 8, relation: { target: 'n03', delta: 5 } }, 3),
      option('冷淡回绝', { influence: -3, relation: { target: 'n03', delta: -5 } }, 2),
    ],
  },
  {
    id: 'evt_neighbor_threat', title: '邻国威胁', description: '邻国陈兵边境发出威胁。',
    category: 'diplomacy',
    trigger: { minTurn: 10 },
    ...recurring(6, 30),
    options: [
      option('外交妥协', { influence: -5, gold: -50, relation: { target: 'n04', delta: 10 } }, 3),
      option('扩军备战', { gold: -100, factionSat: fr('military', 10), relation: { target: 'n04', delta: -10 } }, 2),
    ],
  },
  // ── 宗教类 ──
  {
    id: 'evt_religion_dispute', title: '宗教争端', description: '不同信仰者发生冲突。',
    category: 'religion',
    trigger: { provinceCultureDiff: true },
    ...recurring(6, 25),
    options: [
      option('推行宽容政策', { stability: 3, influence: 3, factionSat: fr('clergy', -10) }, 3),
      option('支持国教压制', { stability: -5, factionSat: fra({ faction: 'clergy', delta: 15 }, { faction: 'commoners', delta: -10 }) }, 2),
    ],
  },
  // ── 科技类 ──
  {
    id: 'evt_tech_breakthrough', title: '科技突破', description: '学者取得重大突破！',
    category: 'science',
    trigger: { techLevelAbove: { branch: 'admin', level: 2 } },
    ...recurring(3, 20),
    options: [
      option('推广新技术', { sciPt: 20, gold: -50 }, 3),
      option('保密御用', { sciPt: 10, legitimacy: 3, factionSat: fr('nobles', 5) }, 2),
    ],
  },
  {
    id: 'evt_scholar_petition', title: '学者请愿', description: '学者请求加大科研投入。',
    category: 'science',
    trigger: { minTurn: 5 },
    ...recurring(4, 25),
    options: [
      option('拨金支持', { gold: -80, sciPt: 10 }, 3),
      option('婉拒', { factionSat: fr('commoners', -5) }, 2),
    ],
  },
  // ── 机会类 ──
  {
    id: 'evt_reform_call', title: '改革呼声', description: '民众与商人呼吁体制改革。',
    category: 'opportunity',
    trigger: { minTurn: 15, maxStability: 40 },
    ...recurring(5, 30),
    options: [
      option('启动渐进改革', { legitimacy: -5, stability: 5, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, 3),
      option('拒绝改革', { stability: -5, factionSat: fr('commoners', -10) }, 2),
    ],
  },
  {
    id: 'evt_coup_risk', title: '军事政变风险', description: '军方密谋发动政变！',
    category: 'politics',
    trigger: { factionSatBelow: { faction: 'military', threshold: 10 }, maxLegitimacy: 40 },
    ...recurring(8, 50),
    options: [
      option('密谋分化将领', { gold: -150, legitimacy: -5, factionSat: fr('military', 15) }, 3),
      option('先发制人清洗', { stability: -15, legitimacy: -10, factionSat: fr('military', -20) }, 1),
    ],
  },
  // ── 扩展事件 26-55（世界级） ──
  { id: 'evt_gold_rush', title: '淘金热', description: '边境发现金矿！', category: 'economy', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('开采', { gold: 200, corruption: 5 }, 3), option('限制开采', { gold: 50, stability: 3 }, 2)] },
  { id: 'evt_trade_boom', title: '贸易繁荣', description: '商路畅通，贸易量激增！', category: 'economy', trigger: { minTurn: 5, notAtWar: true }, ...recurring(4, 25), options: [option('鼓励贸易', { gold: 100, factionSat: fr('merchants', 10) }, 3), option('征收商税', { gold: 150, factionSat: fr('merchants', -8) }, 2)] },
  { id: 'evt_drought_severe', title: '大旱', description: '久旱不雨，粮食减产！', category: 'crisis', trigger: { minTurn: 3 }, ...recurring(5, 30), options: [option('开仓放粮', { food: -100, stability: 5 }, 3), option('加重赋税救灾', { gold: -80, food: 50, factionSat: fr('commoners', -10) }, 2)] },
  { id: 'evt_refugee_wave', title: '边境难民潮', description: '邻国战乱，难民涌入边境！', category: 'crisis', trigger: { minTurn: 10 }, ...recurring(4, 35), options: [option('接纳安置', { population: 500, food: -50, stability: -3 }, 2), option('关闭边境', { legitimacy: -5, factionSat: fr('commoners', 5) }, 3)] },
  { id: 'evt_merchant_guild', title: '商人行会', description: '商人组建行会要求特权！', category: 'politics', trigger: { minTurn: 8 }, ...recurring(4, 30), options: [option('授予特权', { gold: 80, factionSat: fra({ faction: 'merchants', delta: 15 }, { faction: 'nobles', delta: -8 }) }, 3), option('拒绝', { factionSat: fr('merchants', -12) }, 2)] },
  { id: 'evt_military_reform', title: '军事改革', description: '将领提议改革军制！', category: 'military', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('推行改革', { gold: -120, factionSat: fr('military', 10), stability: -3 }, 3), option('维持现状', { factionSat: fr('military', -5) }, 2)] },
  { id: 'evt_cultural_flourish', title: '文化繁荣', description: '学者艺术家汇聚，文化昌盛！', category: 'culture', trigger: { minTurn: 15, minStability: 40 }, ...recurring(3, 30), options: [option('大力资助', { gold: -80, sciPt: 15, legitimacy: 5 }, 3), option('适度支持', { gold: -30, sciPt: 5 }, 2)] },
  { id: 'evt_border_incident', title: '边军冲突', description: '边防军与邻国发生小规模冲突！', category: 'military', trigger: { minTurn: 5 }, ...recurring(5, 20), options: [option('强硬回应', { stability: 3, factionSat: fra({ faction: 'military', delta: 8 }, { faction: 'merchants', delta: -5 }) }, 2), option('外交斡旋', { gold: -30, legitimacy: 3 }, 3)] },
  { id: 'evt_earthquake', title: '地震', description: '强烈地震袭击省份！', category: 'crisis', trigger: { minTurn: 3 }, ...recurring(3, 50), options: [option('全力救灾', { gold: -150, food: -50, stability: 5 }, 3), option('有限救援', { gold: -50, stability: -5 }, 2)] },
  { id: 'evt_tax_evasion', title: '大规模逃税', description: '富商大族逃税严重！', category: 'economy', trigger: { minCorruption: 30 }, ...recurring(5, 25), options: [option('严查重罚', { gold: 100, factionSat: fr('nobles', -10), corruption: -5 }, 2), option('从轻发落', { factionSat: fr('nobles', 5), corruption: 3 }, 3)] },
  { id: 'evt_succession_war', title: '继承危机', description: '多位继承人选争夺大位！', category: 'politics', trigger: { maxLegitimacy: 50 }, ...recurring(6, 40), options: [option('立长子', { legitimacy: 10, stability: -5 }, 3), option('择贤立', { legitimacy: 5, stability: -8, factionSat: fr('nobles', -10) }, 2)] },
  { id: 'evt_foreign_aid', title: '外国援助', description: '友邦送来物资援助！', category: 'economy', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 30), options: [option('欣然接受', { gold: 80, food: 60 }, 3), option('婉拒以保独立', { legitimacy: 5 }, 2)] },
  { id: 'evt_pop_boom', title: '人口激增', description: '丰收带来人口快速增长！', category: 'population', trigger: { minTurn: 8, minStability: 50 }, ...recurring(3, 30), options: [option('鼓励增长', { population: 300, food: -30 }, 3), option('适度控制', { population: 100 }, 2)] },
  { id: 'evt_slave_revolt', title: '奴役起义', description: '被压迫者揭竿而起！', category: 'crisis', trigger: { minTurn: 10, maxStability: 40 }, ...recurring(5, 35), options: [option('镇压', { gold: -80, stability: -5, factionSat: fr('military', 5) }, 2), option('适度改革', { gold: -50, legitimacy: 5, factionSat: fr('nobles', -8) }, 3)] },
  { id: 'evt_spy_scandal', title: '间谍丑闻', description: '外国间谍被抓获！', category: 'diplomacy', trigger: { minTurn: 5 }, ...recurring(4, 25), options: [option('公开处刑', { legitimacy: 5, stability: -3 }, 2), option('秘密利用', { gold: 50, corruption: 3 }, 3)] },
  { id: 'evt_temple_dispute', title: '寺庙争端', description: '宗教团体间爆发冲突！', category: 'religion', trigger: { minTurn: 5, provinceCultureDiff: true }, ...recurring(4, 30), options: [option('仲裁调停', { gold: -30, stability: 3 }, 3), option('支持一方', { factionSat: fr('clergy', 10), stability: -5 }, 2)] },
  { id: 'evt_road_building', title: '修路热潮', description: '各方要求修建道路！', category: 'economy', trigger: { minTurn: 8, notAtWar: true }, ...recurring(4, 25), options: [option('大兴土木', { gold: -120, stability: 3, factionSat: fr('merchants', 8) }, 3), option('量力而行', { gold: -40 }, 2)] },
  { id: 'evt_weapon_advance', title: '武器革新', description: '工匠发明新型武器！', category: 'military', trigger: { techLevelAbove: { branch: 'mil', level: 2 } }, ...recurring(3, 35), options: [option('装备全军', { gold: -100, iron: -20, factionSat: fr('military', 12) }, 3), option('限量装备', { gold: -40, factionSat: fr('military', 5) }, 2)] },
  { id: 'evt_noble_feud', title: '贵族内斗', description: '两大贵族家族公开对立！', category: 'politics', trigger: { minTurn: 5 }, ...recurring(4, 20), options: [option('居中调停', { gold: -50, stability: 3 }, 3), option('支持强势方', { factionSat: fr('nobles', -8), legitimacy: -3 }, 2)] },
  { id: 'evt_harvest_festival', title: '丰收节', description: '五谷丰登，万民同庆！', category: 'culture', trigger: { minTurn: 5, notAtWar: true, minStability: 30 }, ...recurring(5, 15), options: [option('大肆庆祝', { gold: -50, food: -20, stability: 5, factionSat: fr('commoners', 10) }, 3), option('简朴从事', { stability: 2 }, 2)] },
  { id: 'evt_corruption_expose', title: '贪腐曝光', description: '大臣贪墨被揭发！', category: 'politics', trigger: { minCorruption: 40 }, ...recurring(5, 25), options: [option('严惩不贷', { corruption: -8, legitimacy: 5, factionSat: fr('nobles', -12) }, 3), option('罚酒三杯', { corruption: -2, legitimacy: -3 }, 2)] },
  { id: 'evt_bandit_outbreak', title: '盗匪猖獗', description: '盗匪占据山头劫掠商路！', category: 'crisis', trigger: { maxStability: 50 }, ...recurring(5, 20), options: [option('派兵清剿', { gold: -60, stability: 5, factionSat: fr('military', 5) }, 3), option('招安安抚', { gold: -30, corruption: 3 }, 2)] },
  { id: 'evt_foreign_merchants', title: '外商涌入', description: '外国商人带来新奇商品！', category: 'economy', trigger: { minTurn: 8, notAtWar: true }, ...recurring(3, 25), options: [option('开放市场', { gold: 60, factionSat: fra({ faction: 'merchants', delta: 8 }, { faction: 'commoners', delta: -3 }) }, 3), option('限制准入', { factionSat: fr('merchants', -5) }, 2)] },
  { id: 'evt_land_reform', title: '土地改革', description: '农民要求重新分配土地！', category: 'politics', trigger: { minTurn: 15, factionSatBelow: { faction: 'commoners', threshold: 30 } }, ...recurring(5, 40), options: [option('推行改革', { gold: -100, stability: -8, factionSat: fra({ faction: 'commoners', delta: 20 }, { faction: 'nobles', delta: -15 }) }, 2), option('拒绝', { factionSat: fr('commoners', -10), stability: -3 }, 3)] },
  { id: 'evt_witch_hunt', title: '猎巫运动', description: '民间掀起猎巫狂潮！', category: 'religion', trigger: { maxStability: 40 }, ...recurring(4, 30), options: [option('顺从民意', { stability: 3, legitimacy: -3, population: -100 }, 2), option('禁止迫害', { stability: -5, factionSat: fr('clergy', -8) }, 3)] },
  { id: 'evt_diplomatic_envoy', title: '外交使团', description: '他国派遣使团来访！', category: 'diplomacy', trigger: { minTurn: 5, notAtWar: true }, ...recurring(4, 20), options: [option('隆重接待', { gold: -40, legitimacy: 3, influence: 5 }, 3), option('冷淡应对', { legitimacy: -2 }, 2)] },
  { id: 'evt_mint_debasement', title: '劣币铸造之议', description: '国库吃紧，有人建议铸劣币！', category: 'economy', trigger: { minTurn: 10 }, ...recurring(4, 30), options: [option('铸劣币', { gold: 150, corruption: 8, legitimacy: -8 }, 2), option('维持信用', { legitimacy: 5 }, 3)] },
  { id: 'evt_wall_construction', title: '城墙修建', description: '边境省份请求修筑城墙！', category: 'economy', trigger: { minTurn: 10 }, ...recurring(3, 30), options: [option('拨款修墙', { gold: -100, stability: 3, factionSat: fr('military', 5) }, 3), option('暂缓', { stability: -2 }, 2)] },
  { id: 'evt_scholar_exchange', title: '学者交流', description: '异国学者前来交流！', category: 'science', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 25), options: [option('热情接待', { sciPt: 15, gold: -30 }, 3), option('谨慎对待', { sciPt: 5 }, 2)] },
  { id: 'evt_granary_fire', title: '粮仓火灾', description: '主要粮仓突发大火！', category: 'crisis', trigger: { minTurn: 5 }, ...recurring(4, 40), options: [option('全力抢救', { food: -80, gold: -30 }, 3), option('听之任之', { food: -150, stability: -5 }, 1)] },
  { id: 'evt_naval_discovery', title: '航海发现', description: '探险船队发现新岛屿！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(2, 50), options: [option('建立据点', { gold: -100, influence: 10, food: 40 }, 3), option('只绘图记录', { sciPt: 10 }, 2)] },
  { id: 'evt_conscription_unrest', title: '征兵暴动', description: '强制征兵引发民众抗议！', category: 'crisis', trigger: { minTurn: 5, atWar: true }, ...recurring(5, 20), options: [option('坚持征兵', { stability: -8, factionSat: fra({ faction: 'military', delta: 5 }, { faction: 'commoners', delta: -12 }) }, 2), option('减少征兵', { factionSat: fra({ faction: 'commoners', delta: 8 }, { faction: 'military', delta: -5 }) }, 3)] },
  // ── B 扩展：35 个新事件，补齐 culture/population/opportunity 等 ──
  { id: 'evt_culture_flourish', title: '文治鼎盛', description: '诗人学者云集京畿，文运昌隆！', category: 'culture', trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, ...recurring(4, 30), options: [option('设立翰林院', { gold: -80, sciPt: 20, legitimacy: 8, factionSat: fr('clergy', 15) }, 3), option('民间自流', { sciPt: 5, stability: 3 }, 2)] },
  { id: 'evt_culture_patron', title: '艺匠求庇', description: '名匠寻求皇室庇护，献上奇技！', category: 'culture', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 25), options: [option('重金礼遇', { gold: -60, influence: 5, factionSat: fr('clergy', 8) }, 3), option('婉拒', { influence: -2 }, 2)] },
  { id: 'evt_culture_renaissance', title: '古典文艺复兴', description: '古典学术复兴，新思潮涌动！', category: 'culture', trigger: { minTurn: 30, techLevelAbove: { branch: 'admin', level: 3 } }, ...oneTime(2, 60), options: [option('大力倡导', { gold: -150, sciPt: 40, stability: 5, factionSat: fra({ faction: 'merchants', delta: 20 }, { faction: 'clergy', delta: -8 }) }, 3), option('顺其自然', { sciPt: 15 }, 2)] },
  { id: 'evt_culture_ban', title: '异端学说', description: '新奇学说挑战传统，教会要求查禁！', category: 'culture', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(4, 35), options: [option('查禁异端', { stability: 3, sciPt: -10, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'merchants', delta: -15 }) }, 2), option('保护学术', { stability: -4, sciPt: 15, factionSat: fr('clergy', -10) }, 3)] },
  { id: 'evt_culture_festival', title: '诸邦朝贺', description: '诸邦遣使朝贺，国威远扬！', category: 'culture', trigger: { minTurn: 25, notAtWar: true, minStability: 60 }, ...recurring(3, 50), options: [option('盛典礼之', { gold: -120, legitimacy: 10, influence: 15 }, 3), option('简礼相待', { legitimacy: 3, influence: 5 }, 2)] },
  { id: 'evt_pop_boom2', title: '人丁兴旺', description: '连年丰稔，人口激增！', category: 'population', trigger: { minTurn: 10, notAtWar: true }, ...recurring(4, 30), options: [option('鼓励生育', { food: -50, population: 200, stability: 3 }, 3), option('顺其自然', { population: 100 }, 2)] },
  { id: 'evt_pop_migration', title: '流民涌入', description: '邻邦战乱，大批流民涌入边境！', category: 'population', trigger: { minTurn: 8 }, ...recurring(4, 25), options: [option('编户齐民', { population: 150, food: -40, stability: -3, factionSat: fr('commoners', -5) }, 3), option('驱逐出境', { influence: -5, stability: 2 }, 2)] },
  { id: 'evt_pop_urban', title: '城市膨胀', description: '都城人口过载，坊市拥挤！', category: 'population', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('扩建城郭', { gold: -100, population: 100, stability: 3 }, 3), option('限制流入', { stability: -2, factionSat: fr('merchants', -8) }, 2)] },
  { id: 'evt_pop_plague_end', title: '疫后余生', description: '大疫平息，幸存者休养生息！', category: 'population', trigger: { minTurn: 30, maxStability: 60 }, ...recurring(3, 50), options: [option('轻徭薄赋', { gold: -30, population: 100, stability: 5, factionSat: fr('commoners', 10) }, 3), option('常态治理', { population: 50 }, 2)] },
  { id: 'evt_pop_labor_short', title: '战后劳力短缺', description: '战乱后田地荒芜，劳力匮乏！', category: 'population', trigger: { minTurn: 15, atWar: true }, ...recurring(4, 30), options: [option('招募流民', { gold: -50, population: 80, food: 20 }, 3), option('强制征发', { population: 50, stability: -5, factionSat: fr('commoners', -10) }, 1)] },
  { id: 'evt_opp_ancient_treasure', title: '古墓现宝', description: '农夫掘出上古宝藏！', category: 'opportunity', trigger: { minTurn: 10 }, ...recurring(2, 50), options: [option('充公国库', { gold: 200, legitimacy: 3 }, 3), option('赏赐农夫', { gold: 50, stability: 5, factionSat: fr('commoners', 8) }, 2)] },
  { id: 'evt_opp_strategic_location', title: '险隘归附', description: '边境险隘守将献关投诚！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(2, 60), options: [option('纳降重赏', { gold: -80, influence: 10, stability: 3 }, 3), option('谨慎接纳', { influence: 3 }, 2)] },
  { id: 'evt_opp_talent', title: '贤才投效', description: '异国名士慕名来投！', category: 'opportunity', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 40), options: [option('破格录用', { gold: -40, sciPt: 15, efficiency: 3 }, 3), option('考察后用', { sciPt: 5 }, 2)] },
  { id: 'evt_opp_good_omen', title: '祥瑞降临', description: '天现祥瑞，万民称庆！', category: 'opportunity', trigger: { minTurn: 20, notAtWar: true, minStability: 40 }, ...recurring(2, 50), options: [option('昭告天下', { legitimacy: 8, stability: 5, influence: 5 }, 3), option('秘而不宣', { legitimacy: 2 }, 2)] },
  { id: 'evt_opp_trade_windfall', title: '商路暴利', description: '罕见商队带来巨额利润！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(2, 45), options: [option('抽取重税', { gold: 180, factionSat: fr('merchants', -5) }, 3), option('轻税惠民', { gold: 80, factionSat: fr('merchants', 10) }, 2)] },
  { id: 'evt_opp_mercenary', title: '雇佣军来投', description: '百战雇佣军寻求效命！', category: 'opportunity', trigger: { minTurn: 10, atWar: true }, ...recurring(3, 30), options: [option('高价雇佣', { gold: -100, factionSat: fr('military', 10) }, 3), option('婉拒', { stability: 2 }, 2)] },
  { id: 'evt_opp_dynastic_match', title: '联姻良缘', description: '强国王室提议联姻！', category: 'opportunity', trigger: { minTurn: 18, notAtWar: true }, ...recurring(3, 40), options: [option('欣然允诺', { gold: -60, influence: 15, legitimacy: 5 }, 3), option('婉言谢绝', { influence: -3 }, 2)] },
  { id: 'evt_relig_heresy', title: '异端蔓延', description: '异端教派在民间扩散！', category: 'religion', trigger: { minTurn: 20, maxStability: 60 }, ...recurring(4, 35), options: [option('宗教裁判', { stability: 3, population: -50, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'commoners', delta: -10 }) }, 2), option('辩论感化', { sciPt: 8, stability: -2 }, 3)] },
  { id: 'evt_relig_temple_grant', title: '寺庙请田', description: '大寺请求赐田养僧！', category: 'religion', trigger: { minTurn: 15, notAtWar: true }, ...recurring(3, 40), options: [option('慷慨赐田', { gold: -50, food: -30, legitimacy: 5, factionSat: fr('clergy', 15) }, 2), option('限田抑寺', { factionSat: fra({ faction: 'clergy', delta: -12 }, { faction: 'nobles', delta: 5 }) }, 3)] },
  { id: 'evt_relig_pilgrimage', title: '朝圣热潮', description: '信众掀起朝圣热潮！', category: 'religion', trigger: { minTurn: 20, notAtWar: true }, ...recurring(3, 30), options: [option('官方护持', { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, 3), option('民间自理', { stability: 2 }, 2)] },
  { id: 'evt_relig_schism', title: '教派分裂', description: '宗教内部爆发教义之争！', category: 'religion', trigger: { minTurn: 30 }, ...recurring(3, 50), options: [option('支持正统', { stability: 3, factionSat: fra({ faction: 'clergy', delta: 10 }, { faction: 'commoners', delta: -5 }) }, 2), option('保持中立', { stability: -3, factionSat: fr('clergy', -8) }, 3)] },
  { id: 'evt_relig_conversion', title: '异教归化', description: '边境异教部落请求归化！', category: 'religion', trigger: { minTurn: 15, hasNewTerritory: true }, ...recurring(3, 40), options: [option('隆重受礼', { gold: -30, legitimacy: 5, stability: 3, factionSat: fr('clergy', 12) }, 3), option('因俗而治', { stability: 2, factionSat: fr('clergy', -5) }, 2)] },
  { id: 'evt_sci_astronomy', title: '天文异象', description: '客星昼见，司天监请解！', category: 'science', trigger: { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('详记观测', { sciPt: 20, gold: -20 }, 3), option('视为天谴', { stability: -3, legitimacy: -3, factionSat: fr('clergy', 8) }, 1)] },
  { id: 'evt_sci_invention', title: '巧匠献器', description: '工匠发明新式器械！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'agri', level: 2 } }, ...recurring(3, 35), options: [option('推广民用', { gold: -60, food: 30, sciPt: 10 }, 3), option('军用保密', { gold: -40, factionSat: fr('military', 8) }, 2)] },
  { id: 'evt_sci_academy', title: '学院筹建', description: '学者请求设立皇家学院！', category: 'science', trigger: { minTurn: 25, techLevelAbove: { branch: 'admin', level: 3 } }, ...oneTime(2, 60), options: [option('拨款兴建', { gold: -200, sciPt: 50, efficiency: 5, factionSat: fr('clergy', 20) }, 3), option('暂缓', { factionSat: fr('clergy', -8) }, 2)] },
  { id: 'evt_sci_translation', title: '译经运动', description: '异域典籍传入，请旨翻译！', category: 'science', trigger: { minTurn: 20, notAtWar: true }, ...recurring(3, 40), options: [option('设译场', { gold: -80, sciPt: 25, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'merchants', delta: 5 }) }, 3), option('民间自译', { sciPt: 8 }, 2)] },
  { id: 'evt_dip_alliance_proposal', title: '结盟之议', description: '强国主动提议结盟！', category: 'diplomacy', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 30), options: [option('欣然结盟', { influence: 10, legitimacy: 3, gold: -30 }, 3), option('保持独立', { influence: -2 }, 2)] },
  { id: 'evt_dip_hostage', title: '质子之约', description: '邻国提议互送质子以固盟约！', category: 'diplomacy', trigger: { minTurn: 15, notAtWar: true }, ...recurring(3, 40), options: [option('接受', { influence: 8, legitimacy: -3, stability: -2 }, 2), option('拒绝', { influence: -5 }, 3)] },
  { id: 'evt_dip_trade_embassy', title: '通商使团', description: '远方国度遣通商使团！', category: 'diplomacy', trigger: { minTurn: 18, notAtWar: true }, ...recurring(3, 35), options: [option('签订条约', { gold: 80, influence: 5, factionSat: fr('merchants', 12) }, 3), option('观望', { influence: 2 }, 2)] },
  { id: 'evt_dip_border_incident', title: '边境事件', description: '边军误入邻邦引发纠纷！', category: 'diplomacy', trigger: { minTurn: 8 }, ...recurring(4, 25), options: [option('遣使致歉', { gold: -30, influence: 3 }, 3), option('强硬立场', { influence: -5, stability: 3, factionSat: fr('military', 8) }, 2)] },
  { id: 'evt_dip_refugee_crisis', title: '外交难民危机', description: '邻邦内乱，难民涌入！', category: 'diplomacy', trigger: { minTurn: 20 }, ...recurring(3, 35), options: [option('设营安置', { gold: -80, food: -40, population: 100, influence: 8 }, 3), option('封闭边境', { influence: -8, stability: 2 }, 2)] },
  { id: 'evt_mil_traitor', title: '叛将投敌', description: '边关守将叛逃敌国！', category: 'military', trigger: { minTurn: 15, maxStability: 60 }, ...recurring(3, 40), options: [option('悬赏缉拿', { gold: -50, influence: 3, factionSat: fr('military', 5) }, 3), option('申斥边镇', { stability: -5, factionSat: fr('military', -8) }, 2)] },
  { id: 'evt_mil_victory_parade', title: '凯旋献俘', description: '大军凯旋，请行献俘礼！', category: 'military', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 30), options: [option('隆重献俘', { gold: -40, legitimacy: 8, factionSat: fr('military', 15) }, 3), option('低调处置', { legitimacy: 2 }, 2)] },
  { id: 'evt_mil_supply_line', title: '粮道被断', description: '敌军袭扰粮道，前线告急！', category: 'military', trigger: { minTurn: 10, atWar: true }, ...recurring(4, 25), options: [option('重兵护粮', { gold: -80, food: -30, factionSat: fr('military', 8) }, 3), option('就地征粮', { food: 20, stability: -8, factionSat: fr('commoners', -15) }, 1)] },
  { id: 'evt_mil_defection', title: '敌将来投', description: '敌国名将率部来降！', category: 'military', trigger: { minTurn: 15, atWar: true }, ...recurring(3, 40), options: [option('厚礼接纳', { gold: -60, factionSat: fr('military', 12), influence: 5 }, 3), option('疑而不用', { stability: -2 }, 2)] },
  { id: 'evt_mil_fortress_siege', title: '孤城死守', description: '边城被围，守将请援！', category: 'military', trigger: { minTurn: 12, atWar: true }, ...recurring(4, 30), options: [option('倾国驰援', { gold: -100, food: -50, factionSat: fr('military', 10) }, 3), option('弃车保帅', { stability: -10, legitimacy: -5, factionSat: fr('military', -12) }, 1)] },
  { id: 'evt_mil_weapon_upgrade', title: '军械革新', description: '工坊献上新式兵器！', category: 'military', trigger: { minTurn: 20, techLevelAbove: { branch: 'mil', level: 2 } }, ...recurring(3, 40), options: [option('全军换装', { gold: -150, factionSat: fr('military', 15) }, 3), option('局部试用', { gold: -50, factionSat: fr('military', 5) }, 2)] },

  // ── C1 事件链（3 条链 × 3 事件 = 9 事件）──
  // 链 1：瘟疫链——爆发→蔓延→余波
  { id: 'evt_chain_plague_1', title: '瘟疫爆发', description: '边镇突发怪病，死者甚众！太医请旨处置。', category: 'crisis', trigger: { minTurn: 15, maxFoodRatio: 0.8 }, ...recurring(4, 60), options: [
    option('封锁疫区', { stability: -5, population: -100, triggerEvent: 'evt_chain_plague_2' }, 3),
    option('请神祈福', { gold: -50, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_plague_2' }, 2),
  ] },
  { id: 'evt_chain_plague_2', title: '瘟疫蔓延', description: '疫病蔓延至京畿，人心惶惶！', category: 'crisis', trigger: { minTurn: 15 }, ...followUp, options: [
    option('隔离救治', { gold: -120, population: -200, stability: -3, triggerEvent: 'evt_chain_plague_3' }, 3),
    option('弃城避疫', { gold: -30, stability: -15, legitimacy: -10, population: -150, triggerEvent: 'evt_chain_plague_3' }, 1),
  ] },
  { id: 'evt_chain_plague_3', title: '瘟疫余波', description: '疫病终于平息，但民生凋敝，请旨善后。', category: 'crisis', trigger: { minTurn: 15 }, ...uniqueFollowUp, options: [
    option('减免赋税', { gold: -80, stability: 8, factionSat: fr('commoners', 15), legitimacy: 5 }, 3),
    option('如常征赋', { stability: -5, factionSat: fr('commoners', -12) }, 2),
  ] },

  // 链 2：王位继承链——储君薨→争夺→新朝
  { id: 'evt_chain_heir_1', title: '储君暴薨', description: '太子无疾而终！诸皇子暗中争位。', category: 'politics', trigger: { minTurn: 20, maxLegitimacy: 70 }, ...recurring(3, 80), options: [
    option('立次子为储', { legitimacy: -5, stability: -3, triggerEvent: 'evt_chain_heir_2' }, 3),
    option('暂不立储', { legitimacy: -10, stability: -8, factionSat: fr('nobles', -8), triggerEvent: 'evt_chain_heir_2' }, 1),
  ] },
  { id: 'evt_chain_heir_2', title: '夺位之争', description: '诸皇子明争暗斗，朝臣各立其主！', category: 'politics', trigger: { minTurn: 20 }, ...followUp, options: [
    option('强立一系', { gold: -100, legitimacy: 5, stability: -5, factionSat: fr('nobles', -10), triggerEvent: 'evt_chain_heir_3' }, 2),
    option('廷议公推', { gold: -50, legitimacy: 8, stability: 3, efficiency: -3, triggerEvent: 'evt_chain_heir_3' }, 3),
  ] },
  { id: 'evt_chain_heir_3', title: '新储即位', description: '新储登基，大赦天下以固位。', category: 'politics', trigger: { minTurn: 20 }, ...uniqueFollowUp, options: [
    option('大赦天下', { gold: -60, legitimacy: 15, stability: 10, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: 5 }) }, 3),
    option('低调即位', { legitimacy: 5, stability: 2 }, 2),
    // P3 继承链内战结局——强压异议触发宗室起兵
    option('强压异议', { legitimacy: -10, stability: -8, factionSat: fr('military', 15), triggerEvent: 'evt_chain_heir_civil' }, 1),
  ] },
  // P3 继承链内战结局——宗室起兵→决战→新朝或割据
  { id: 'evt_chain_heir_civil', title: '宗室起兵', description: '不满新储的宗室藩镇举兵向阙！天下震动，社稷危殆！', category: 'crisis', trigger: { minTurn: 20, maxLegitimacy: 50 }, ...followUp, options: [
    option('御驾亲征', { gold: -200, stability: -10, legitimacy: 8, factionSat: fra({ faction: 'military', delta: 20 }, { faction: 'commoners', delta: -15 }), triggerEvent: 'evt_chain_heir_civil_2' }, 2),
    option('割地安抚', { gold: -100, stability: 5, legitimacy: -15, influence: -10, factionSat: fr('nobles', 10), triggerEvent: 'evt_chain_heir_civil_2' }, 3),
  ] },
  { id: 'evt_chain_heir_civil_2', title: '内战终局', description: '叛乱平定或割据成定局，新朝格局已成。', category: 'politics', trigger: { minTurn: 20 }, ...uniqueFollowUp, options: [
    option('重整山河', { gold: -150, stability: 15, legitimacy: 20, efficiency: 5, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'nobles', delta: -8 }) }, 3),
    option('默许割据', { stability: -20, legitimacy: -25, corruption: 10, factionSat: fr('nobles', 15) }, 1),
  ] },

  // 链 3：边境冲突链——摩擦→升级→议和
  { id: 'evt_chain_border_1', title: '边民冲突', description: '边民越界耕牧，与邻邦起争执！', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, ...recurring(4, 50), options: [
    option('遣使交涉', { gold: -20, influence: 3, triggerEvent: 'evt_chain_border_2' }, 3),
    option('强硬驱赶', { influence: -3, stability: 2, factionSat: fr('military', 8), triggerEvent: 'evt_chain_border_2' }, 2),
  ] },
  { id: 'evt_chain_border_2', title: '边军对峙', description: '双方边军对峙，剑拔弩张！', category: 'diplomacy', trigger: { minTurn: 10 }, ...followUp, options: [
    option('主动撤军', { influence: -5, stability: 3, triggerEvent: 'evt_chain_border_3' }, 3),
    option('增兵施压', { gold: -80, factionSat: fr('military', 12), influence: 2, stability: -2, triggerEvent: 'evt_chain_border_3' }, 2),
  ] },
  { id: 'evt_chain_border_3', title: '边境议和', description: '双方遣使议和，重定疆界。', category: 'diplomacy', trigger: { minTurn: 10 }, ...uniqueFollowUp, options: [
    option('缔结和约', { gold: -40, influence: 8, legitimacy: 3, stability: 5 }, 3),
    option('暂置不议', { stability: -2, influence: -2 }, 2),
  ] },

  // ── E15 扩展事件链（2 条 × 3 事件 = 6 事件）──
  // 链 4：旱灾链——大旱→饥荒→流民
  { id: 'evt_chain_drought_1', title: '赤地千里', description: '连月不雨，禾苗枯焦，赤地千里！太史奏旱。', category: 'crisis', trigger: { minTurn: 8, maxFoodRatio: 0.9 }, ...recurring(5, 70), options: [
    option('开仓赈灾', { food: -120, stability: 5, factionSat: fr('commoners', 8), triggerEvent: 'evt_chain_drought_2' }, 3),
    option('祈雨祭天', { gold: -60, legitimacy: 3, stability: 2, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_drought_2' }, 2),
  ] },
  { id: 'evt_chain_drought_2', title: '饥荒蔓延', description: '粮价飞涨，饿殍遍野，饥民聚众求食！', category: 'crisis', trigger: { minTurn: 8 }, ...followUp, options: [
    option('强制平粜', { gold: -100, stability: 3, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'merchants', delta: -15 }), triggerEvent: 'evt_chain_drought_3' }, 3),
    option('放任粮价', { population: -300, stability: -10, factionSat: fr('commoners', -20), triggerEvent: 'evt_chain_drought_3' }, 1),
  ] },
  { id: 'evt_chain_drought_3', title: '流民四散', description: '灾民背井离乡，流民潮席卷诸省！', category: 'crisis', trigger: { minTurn: 8 }, ...uniqueFollowUp, options: [
    option('编户安置', { gold: -80, food: -40, stability: 8, population: 200, factionSat: fr('commoners', 12) }, 3),
    option('遣散回乡', { population: -150, stability: -5, legitimacy: -5 }, 2),
  ] },

  // 链 5：盛世衰落链——奢靡→乱政→中兴
  { id: 'evt_chain_decline_1', title: '奢靡之风', description: '宫廷奢靡，权贵斗富，民风渐浮！', category: 'politics', trigger: { minTurn: 25, minStability: 50, minGold: 500 }, ...recurring(3, 100), options: [
    option('提倡节俭', { stability: 5, legitimacy: 5, factionSat: fr('nobles', -10), triggerEvent: 'evt_chain_decline_2' }, 3),
    option('纵容浮华', { gold: -100, corruption: 8, stability: -3, factionSat: fr('nobles', 12), triggerEvent: 'evt_chain_decline_2' }, 1),
  ] },
  { id: 'evt_chain_decline_2', title: '吏治败坏', description: '贪墨横行，政令不出京畿，行政瘫痪！', category: 'politics', trigger: { minTurn: 25, minCorruption: 40 }, ...followUp, options: [
    option('严惩贪吏', { gold: -120, corruption: -10, stability: -5, factionSat: fr('nobles', -15), triggerEvent: 'evt_chain_decline_3' }, 3),
    option('得过且过', { corruption: 5, efficiency: -5, legitimacy: -8, triggerEvent: 'evt_chain_decline_3' }, 1),
  ] },
  { id: 'evt_chain_decline_3', title: '中兴之机', description: '乱象毕露，朝野呼吁改革图强！', category: 'opportunity', trigger: { minTurn: 25 }, ...uniqueFollowUp, options: [
    option('力行新政', { gold: -200, stability: -8, legitimacy: 15, efficiency: 8, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, 3),
    option('徐图整顿', { gold: -80, stability: 3, efficiency: 3, legitimacy: 5 }, 2),
  ] },

  // ── E15 王朝继位玩家干预事件（dynasty 引擎触发）──
  { id: 'evt_dynasty_heir_birth', title: '储君降生', description: '后宫诞下龙裔，举国欢庆！请定储君之名。', category: 'politics', trigger: { minTurn: 1 }, ...followUp, options: [
    option('立为储君', { legitimacy: 10, stability: 5, factionSat: fr('nobles', 12) }, 3),
    option('暂不立储', { legitimacy: -3, stability: -2, factionSat: fr('nobles', -8) }, 1),
  ] },
  { id: 'evt_dynasty_ruler_decline', title: '君王老迈', description: '主春秋年迈，精力渐衰，朝臣请预立储以固国本。', category: 'politics', trigger: { minTurn: 30 }, ...followUp, options: [
    option('禅让储君', { legitimacy: 5, stability: 8, factionSat: fr('nobles', 10) }, 3),
    option('勉力视朝', { stability: -3, legitimacy: -5, factionSat: fr('nobles', -5) }, 2),
  ] },

  // ── P3 扩展事件链 6-9 + 独立事件（目标 150+）──
  // 链 6：科技突破链——灵感→试验→应用或事故
  { id: 'evt_chain_tech_1', title: '异象启思', description: '夜观星象，学者忽得灵感，称可革新农具！', category: 'science', trigger: { minTurn: 12, techLevelAbove: { branch: 'agri', level: 1 } }, ...recurring(4, 80), options: [
    option('拨金资助', { gold: -80, sciPt: 10, factionSat: fr('clergy', -5), triggerEvent: 'evt_chain_tech_2' }, 3),
    option('观其自成', { sciPt: 3, triggerEvent: 'evt_chain_tech_2' }, 2),
  ] },
  { id: 'evt_chain_tech_2', title: '工坊试验', description: '学者于工坊中反复试验，成败参半！', category: 'science', trigger: { minTurn: 12 }, ...followUp, options: [
    option('追加投入', { gold: -120, sciPt: 8, efficiency: 3, triggerEvent: 'evt_chain_tech_3' }, 3),
    option('谨慎推进', { gold: -40, sciPt: 4, triggerEvent: 'evt_chain_tech_3' }, 2),
  ] },
  { id: 'evt_chain_tech_3', title: '革新问世', description: '新农具问世，粮产可期！然旧匠抵制新技术。', category: 'opportunity', trigger: { minTurn: 12 }, ...uniqueFollowUp, options: [
    option('全面推广', { gold: -60, food: 80, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: -8 }) }, 3),
    option('缓慢渗透', { food: 30, sciPt: 5 }, 2),
  ] },

  // 链 7：文化输入链——异邦艺术→风靡→本土化或文化冲突
  { id: 'evt_chain_culture_1', title: '异邦献艺', description: '异邦使团献上奇珍乐舞，朝野为之倾倒！', category: 'culture', trigger: { minTurn: 15, notAtWar: true }, ...recurring(4, 90), options: [
    option('盛情接纳', { gold: -40, influence: 5, legitimacy: 3, triggerEvent: 'evt_chain_culture_2' }, 3),
    option('谨慎观赏', { influence: 2, triggerEvent: 'evt_chain_culture_2' }, 2),
  ] },
  { id: 'evt_chain_culture_2', title: '风尚风靡', description: '异邦艺术在上流社会风靡，本土艺人抗议声起！', category: 'culture', trigger: { minTurn: 15 }, ...followUp, options: [
    option('提倡融合', { gold: -60, influence: 8, factionSat: fr('clergy', -8), triggerEvent: 'evt_chain_culture_3' }, 3),
    option('压制异风', { influence: -5, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_culture_3' }, 2),
  ] },
  { id: 'evt_chain_culture_3', title: '文化定调', description: '风气之争终有定论，帝国文化走向何方？', category: 'culture', trigger: { minTurn: 15 }, ...uniqueFollowUp, options: [
    option('兼容并蓄', { gold: -80, influence: 12, legitimacy: 8, assimilationMod: 1 }, 3),
    option('固守正统', { legitimacy: 5, influence: -3, factionSat: fr('clergy', 15) }, 2),
  ] },

  // 链 8：联盟瓦解链——盟国生疑→摩擦→决裂或修复
  { id: 'evt_chain_alliance_1', title: '盟国生疑', description: '盟国使臣旁敲侧击，疑你有背盟之意！', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, ...recurring(4, 70), options: [
    option('遣使重申盟约', { gold: -50, influence: 5, triggerEvent: 'evt_chain_alliance_2' }, 3),
    option('置之不理', { influence: -8, stability: 2, triggerEvent: 'evt_chain_alliance_2' }, 2),
  ] },
  { id: 'evt_chain_alliance_2', title: '边境摩擦', description: '盟国边军与己方商队发生摩擦！', category: 'diplomacy', trigger: { minTurn: 10 }, ...followUp, options: [
    option('赔礼道歉', { gold: -80, influence: 3, legitimacy: -3, triggerEvent: 'evt_chain_alliance_3' }, 3),
    option('强硬索赔', { gold: 30, influence: -10, factionSat: fr('military', 8), triggerEvent: 'evt_chain_alliance_3' }, 2),
  ] },
  { id: 'evt_chain_alliance_3', title: '盟约抉择', description: '盟国递交最后通牒，是和是裂？', category: 'diplomacy', trigger: { minTurn: 10 }, ...uniqueFollowUp, options: [
    option('修复盟约', { gold: -100, influence: 10, legitimacy: 5, factionSat: fr('merchants', 8) }, 3),
    option('听任决裂', { influence: -15, stability: 5, factionSat: fr('military', 12) }, 2),
  ] },

  // 链 9：移民潮链——流民入境→安置压力→同化或排斥
  { id: 'evt_chain_migrate_1', title: '流民叩边', description: '邻邦大乱，数万流民叩关求附！', category: 'population', trigger: { minTurn: 12 }, ...recurring(5, 80), options: [
    option('开关纳之', { food: -80, population: 400, stability: -3, triggerEvent: 'evt_chain_migrate_2' }, 2),
    option('闭关拒之', { legitimacy: -5, influence: -3, factionSat: fr('commoners', 5), triggerEvent: 'evt_chain_migrate_2' }, 3),
  ] },
  { id: 'evt_chain_migrate_2', title: '安置之困', description: '流民聚居边省，与本地民众争田争水！', category: 'population', trigger: { minTurn: 12 }, ...followUp, options: [
    option('编户齐民', { gold: -100, food: -40, population: 200, efficiency: 3, triggerEvent: 'evt_chain_migrate_3' }, 3),
    option('设栅隔离', { gold: -30, stability: -5, factionSat: fr('commoners', -10), triggerEvent: 'evt_chain_migrate_3' }, 2),
  ] },
  { id: 'evt_chain_migrate_3', title: '融合或排斥', description: '流民问题终须解决，帝国包容性面临考验。', category: 'population', trigger: { minTurn: 12 }, ...uniqueFollowUp, options: [
    option('一视同仁', { gold: -60, population: 150, influence: 8, assimilationMod: 1, factionSat: fr('commoners', 8) }, 3),
    option('区别对待', { stability: -8, corruption: 5, factionSat: fr('nobles', 8) }, 2),
  ] },

  // ── 独立事件扩展（覆盖 science/culture/population/diplomacy 稀缺分类）──
  { id: 'evt_library_fire', title: '学院失火', description: '皇家学院深夜失火，典籍付之一炬！', category: 'science', trigger: { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 50), options: [option('全力抢救', { gold: -100, sciPt: -10, stability: 3 }, 3), option('听之任之', { sciPt: -25, legitimacy: -5 }, 2)] },
  { id: 'evt_scientist_defect', title: '学者投奔', description: '异邦知名学者请求政治庇护！', category: 'science', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 40), options: [option('接纳重用', { gold: 50, sciPt: 20, influence: -3 }, 3), option('婉拒遣返', { influence: 5, legitimacy: 3 }, 2)] },
  { id: 'evt_alchemy_craze', title: '炼金狂热', description: '宫廷兴起炼金热潮，方士声称能点石成金！', category: 'science', trigger: { minTurn: 15 }, ...recurring(4, 35), options: [option('资助试验', { gold: -150, corruption: 5, factionSat: fr('clergy', -10) }, 2), option('斥为邪术', { legitimacy: 3, factionSat: fr('clergy', 12) }, 3)] },
  { id: 'evt_cultural_revival', title: '文化复兴运动', description: '古典文化复兴运动席卷学界！', category: 'culture', trigger: { minTurn: 20, minStability: 50, techLevelAbove: { branch: 'culture', level: 2 } }, ...recurring(3, 60), options: [option('大力倡导', { gold: -100, influence: 15, legitimacy: 8, sciPt: 10 }, 3), option('顺其自然', { influence: 5, sciPt: 3 }, 2)] },
  { id: 'evt_temple_construction', title: '庙宇大兴', description: '神职团体请建大庙，信众踊跃捐资！', category: 'culture', trigger: { minTurn: 10, minStability: 40 }, ...recurring(4, 40), options: [option('钦准督建', { gold: -80, legitimacy: 8, influence: 5, factionSat: fr('clergy', 15) }, 3), option('民办官助', { gold: -30, factionSat: fr('clergy', 8) }, 2)] },
  { id: 'evt_festival_grand', title: '帝国大典', description: '藩属遣使朝贺，帝国威仪远播！', category: 'culture', trigger: { minTurn: 25, minStability: 60, notAtWar: true }, ...recurring(3, 50), options: [option('盛大庆贺', { gold: -150, influence: 20, legitimacy: 10, factionSat: fr('nobles', 10) }, 3), option('简礼相待', { gold: -40, influence: 8 }, 2)] },
  { id: 'evt_plague_quarantine', title: '检疫之争', description: '边境发现疫病，是否封锁边境？', category: 'population', trigger: { minTurn: 15 }, ...recurring(4, 40), options: [option('严格隔离', { gold: -60, population: -50, stability: -3, factionSat: fr('merchants', -12) }, 3), option('有限检查', { population: -150, stability: 2 }, 2)] },
  { id: 'evt_diplomatic_marriage', title: '和亲之议', description: '强国遣使求和亲，欲结秦晋之好！', category: 'diplomacy', trigger: { minTurn: 15, notAtWar: true }, ...recurring(4, 50), options: [option('允诺和亲', { gold: 100, influence: 15, legitimacy: -3, factionSat: fr('nobles', -8) }, 3), option('婉言谢绝', { influence: -5, stability: 3 }, 2)] },
  { id: 'evt_trade_embargo', title: '他国禁运', description: '邻邦联合对你的商品实施禁运！', category: 'diplomacy', trigger: { minTurn: 18 }, ...recurring(5, 40), options: [option('寻求新商路', { gold: -100, influence: 5, factionSat: fr('merchants', 8) }, 3), option('反制禁运', { gold: -50, influence: -8, stability: 3 }, 2)] },
  { id: 'evt_border_demarcate', title: '勘界定疆', description: '与邻国勘定边界，争议之地如何处置？', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 50), options: [option('据理力争', { gold: -40, influence: 5, factionSat: fr('military', 8) }, 2), option('互让妥协', { gold: 20, influence: 8, legitimacy: 3 }, 3)] },
  { id: 'evt_secret_treaty', title: '密约曝光', description: '你与他国的秘密条约被泄露，朝野哗然！', category: 'diplomacy', trigger: { minTurn: 20 }, ...recurring(4, 60), options: [option('公开承认', { legitimacy: -8, influence: 5, stability: -3 }, 2), option('矢口否认', { legitimacy: -3, influence: -10, corruption: 3 }, 3)] },

  // ── P-fix 补齐事件到 150（覆盖 science/culture/population/diplomacy/opportunity）──
  { id: 'evt_sci_observatory', title: '观星台', description: '天文学家请建观星台，观测星象以推历法！', category: 'science', trigger: { minTurn: 18, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 50), options: [option('拨款兴建', { gold: -120, sciPt: 30, influence: 5 }, 3), option('民间观测', { sciPt: 8 }, 2)] },
  { id: 'evt_sci_water_mill', title: '水力磨坊', description: '工匠发明水力磨坊，粮产加工效率大增！', category: 'science', trigger: { minTurn: 14, techLevelAbove: { branch: 'agri', level: 2 } }, ...recurring(4, 40), options: [option('推广全国', { gold: -80, food: 50, factionSat: fr('commoners', 8) }, 3), option('限皇家专用', { gold: -30, food: 15 }, 2)] },
  { id: 'evt_sci_medical_text', title: '医典编纂', description: '太医奉旨编纂医典，汇天下方术！', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 3 } }, ...recurring(3, 50), options: [option('颁行天下', { gold: -100, sciPt: 20, stability: 5, population: 100 }, 3), option('秘藏内府', { sciPt: 10, factionSat: fr('clergy', 5) }, 2)] },
  { id: 'evt_culture_poet', title: '诗人献赋', description: '名诗人献颂赋，辞藻华美，朝野传诵！', category: 'culture', trigger: { minTurn: 12, minStability: 40 }, ...recurring(4, 30), options: [option('厚赏赐爵', { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, 3), option('口头嘉奖', { legitimacy: 2 }, 2)] },
  { id: 'evt_culture_architecture', title: '宫室营建', description: '匠师献新图样，请建宏伟宫室以彰国威！', category: 'culture', trigger: { minTurn: 22, minStability: 50, minGold: 300 }, ...recurring(3, 60), options: [option('大兴土木', { gold: -250, legitimacy: 10, influence: 8, factionSat: fr('nobles', 12) }, 2), option('简朴从事', { legitimacy: 3, factionSat: fr('commoners', 5) }, 3)] },
  { id: 'evt_culture_relic', title: '古寺圣物出土', description: '古寺出土圣物，信众蜂拥朝拜！', category: 'culture', trigger: { minTurn: 18, notAtWar: true }, ...recurring(3, 50), options: [option('迎入京畿', { gold: -60, legitimacy: 8, factionSat: fr('clergy', 15), influence: 5 }, 3), option('留寺供奉', { stability: 3, factionSat: fr('clergy', 8) }, 2)] },
  { id: 'evt_pop_urbanization', title: '市井繁兴', description: '都城商市繁兴，百业云集！', category: 'population', trigger: { minTurn: 16, minStability: 50, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('规范市坊', { gold: 60, efficiency: 3, factionSat: fr('merchants', 10) }, 3), option('任其发展', { gold: 40, corruption: 3 }, 2)] },
  { id: 'evt_pop_infant', title: '婴殇之痛', description: '都城婴夭率高，太医请设育婴局！', category: 'population', trigger: { minTurn: 14 }, ...recurring(4, 40), options: [option('设局哺育', { gold: -80, population: 80, stability: 3, factionSat: fr('commoners', 12) }, 3), option('听天由命', { population: -50, factionSat: fr('commoners', -8) }, 2)] },
  { id: 'evt_dip_tribute', title: '藩属朝贡', description: '远方藩属遣使朝贡珍异物产！', category: 'diplomacy', trigger: { minTurn: 20, notAtWar: true, minStability: 50 }, ...recurring(3, 40), options: [option('厚往薄来', { gold: -100, influence: 15, legitimacy: 8 }, 3), option('常礼相待', { gold: -30, influence: 5 }, 2)] },
  { id: 'evt_dip_mediation', title: '邻邦请调', description: '两邻邦开战，双方皆请我国调停！', category: 'diplomacy', trigger: { minTurn: 18, notAtWar: true }, ...recurring(3, 50), options: [option('出面斡旋', { gold: -60, influence: 20, legitimacy: 5, sciPt: 5 }, 3), option('保持中立', { influence: -3, stability: 2 }, 2)] },
  { id: 'evt_opp_granary_surplus', title: '粮仓充盈', description: '连年丰收，粮仓满溢，如何处置？', category: 'opportunity', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 30), options: [option('平价出粜', { gold: 100, food: -80, factionSat: fr('merchants', 8) }, 3), option('备荒储备', { stability: 5, factionSat: fr('commoners', 5) }, 2)] },
  { id: 'evt_opp_mercenary_captain', title: '雇佣兵首领', description: '百战雇佣兵首领率部来投，愿为前锋！', category: 'opportunity', trigger: { minTurn: 14, atWar: true }, ...recurring(3, 40), options: [option('委以重任', { gold: -80, factionSat: fr('military', 15), influence: 3 }, 3), option('存疑不用', { stability: -2, factionSat: fr('military', -5) }, 2)] },
  { id: 'evt_opp_good_harvest_chain', title: '连年丰稔', description: '连续丰收，百姓富足，国库充盈！', category: 'opportunity', trigger: { minTurn: 16, notAtWar: true, minStability: 60 }, ...recurring(2, 60), options: [option('减免赋税', { gold: -100, stability: 8, factionSat: fr('commoners', 15), legitimacy: 5 }, 3), option('充实国库', { gold: 200, factionSat: fr('commoners', -5) }, 2)] },
  // ── D1: 扩充至 300+ 事件（每类别 ≥8） ──
  { id: 'evt_locust', title: '蝗灾', description: '蝗虫过境，寸草不生！', category: 'crisis', trigger: { minTurn: 8 }, ...recurring(4, 35), options: [option('组织灭蝗', { gold: -60, food: -80, stability: 3 }, 3), option('祈天求雨', { food: -120, legitimacy: -3 }, 2)] },
  { id: 'evt_flood', title: '洪涝', description: '暴雨成灾，良田被淹！', category: 'crisis', trigger: { minTurn: 6 }, ...recurring(5, 30), options: [option('筑堤救灾', { gold: -100, food: -60, stability: 4 }, 3), option('转移高地', { food: -40, population: -80 }, 2)] },
  { id: 'evt_blight', title: '疫病侵袭庄稼', description: '作物大面积枯萎！', category: 'crisis', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('焚田防疫', { food: -150, stability: -3 }, 2), option('寻求良种', { gold: -50, food: -80 }, 3)] },
  { id: 'evt_hail', title: '冰雹', description: '突降冰雹，毁坏庄稼！', category: 'crisis', trigger: {}, ...recurring(3, 50), options: [option('开仓赈济', { food: -60, gold: -40, stability: 5 }, 3), option('自力更生', { food: -100, stability: -3 }, 2)] },
  { id: 'evt_famine_riot', title: '饥民暴动', description: '饥饿的民众冲击粮仓！', category: 'crisis', trigger: { maxFoodRatio: 0.4 }, ...recurring(8, 20), options: [option('镇压', { gold: -40, stability: -5, factionSat: fr('military', 5) }, 2), option('放粮安抚', { food: -100, stability: 5, factionSat: fr('commoners', 10) }, 3)] },
  { id: 'evt_wolf_plague', title: '兽疫', description: '牲畜大批死亡！', category: 'crisis', trigger: { minTurn: 12 }, ...recurring(3, 40), options: [option('隔离焚烧', { food: -50, gold: -30 }, 3), option('求医问药', { gold: -60, food: -30 }, 2)] },
  { id: 'evt_noble_exile', title: '贵族流亡', description: '失势贵族逃亡他国！', category: 'politics', trigger: { maxLegitimacy: 30 }, ...recurring(4, 30), options: [option('通缉追回', { gold: -50, legitimacy: 3 }, 2), option('任其去留', { factionSat: fr('nobles', -8), stability: 2 }, 3)] },
  { id: 'evt_noble_marriage', title: '贵族联姻', description: '两大贵族家族联姻，势力坐大！', category: 'politics', trigger: { minTurn: 10 }, ...recurring(3, 35), options: [option('赐婚支持', { gold: -40, factionSat: fr('nobles', 12), legitimacy: 3 }, 3), option('从中作梗', { factionSat: fr('nobles', -10), stability: -3 }, 2)] },
  { id: 'evt_noble_disinherit', title: '夺爵', description: '贵族子弟被夺爵，引发争议！', category: 'politics', trigger: { minTurn: 8 }, ...recurring(4, 25), options: [option('维持原判', { factionSat: fr('nobles', -12), legitimacy: 5 }, 2), option('恢复爵位', { factionSat: fr('nobles', 8), gold: -60 }, 3)] },
  { id: 'evt_faction_civil_war', title: '派系内战', description: '两大派系公开冲突！', category: 'politics', trigger: { maxStability: 35 }, ...recurring(7, 20), options: [option('支持一方', { stability: -8, legitimacy: -5 }, 2), option('调停', { gold: -80, stability: 3 }, 3)] },
  { id: 'evt_merchant_smuggle', title: '走私猖獗', description: '商人走私逃税严重！', category: 'politics', trigger: { minCorruption: 25 }, ...recurring(5, 20), options: [option('严打走私', { gold: 60, factionSat: fr('merchants', -10), corruption: -3 }, 2), option('睁只眼闭只眼', { corruption: 5, factionSat: fr('merchants', 5) }, 3)] },
  { id: 'evt_merchant_monopoly', title: '行会垄断', description: '商人行会垄断市场！', category: 'politics', trigger: { minTurn: 15 }, ...recurring(3, 35), options: [option('打破垄断', { gold: -50, factionSat: fra({ faction: 'merchants', delta: -15 }, { faction: 'commoners', delta: 10 }) }, 3), option('收税了事', { gold: 80, corruption: 3 }, 2)] },
  { id: 'evt_military_coup_attempt', title: '兵变未遂', description: '部分将领密谋兵变！', category: 'politics', trigger: { factionSatBelow: { faction: 'military', threshold: 15 }, maxLegitimacy: 35 }, ...recurring(9, 50), options: [option('铁腕镇压', { gold: -100, stability: -8, factionSat: fr('military', -15) }, 2), option('安抚军心', { gold: -80, factionSat: fr('military', 10), stability: -3 }, 3)] },
  { id: 'evt_military_veteran', title: '老兵安置', description: '退役老兵无以为生！', category: 'politics', trigger: { minTurn: 12 }, ...recurring(4, 25), options: [option('赐田安置', { gold: -60, factionSat: fr('military', 10), stability: 3 }, 3), option('不予理睬', { factionSat: fr('military', -12), stability: -3 }, 2)] },
  { id: 'evt_military_mutiny', title: '哗变', description: '欠饷士兵哗变！', category: 'politics', trigger: { factionSatBelow: { faction: 'military', threshold: 10 } }, ...recurring(10, 30), options: [option('镇压', { gold: -80, stability: -10, factionSat: fr('military', -8) }, 2), option('补发欠饷', { gold: -120, factionSat: fr('military', 15), stability: 3 }, 3)] },
  { id: 'evt_trade_embargo_hit', title: '贸易禁运冲击', description: '他国对我国禁运！', category: 'economy', trigger: { minTurn: 10 }, ...recurring(5, 30), options: [option('自给自足', { gold: -50, stability: 3 }, 3), option('寻找替代', { gold: -80, influence: 3 }, 2)] },
  { id: 'evt_inflation', title: '通胀', description: '物价飞涨，民怨沸腾！', category: 'economy', trigger: { minCorruption: 40 }, ...recurring(5, 25), options: [option('紧缩银根', { gold: -80, stability: 3, corruption: -3 }, 3), option('放任不管', { factionSat: fr('commoners', -12), corruption: 5 }, 2)] },
  { id: 'evt_devaluation', title: '币值崩跌', description: '铸币掺假，币值暴跌！', category: 'economy', trigger: { minCorruption: 50 }, ...recurring(4, 30), options: [option('整顿币制', { gold: -100, legitimacy: 5, corruption: -5 }, 3), option('借机牟利', { gold: 150, corruption: 8, factionSat: fr('merchants', -10) }, 2)] },
  { id: 'evt_resource_shortage', title: '资源短缺', description: '铁矿木材严重不足！', category: 'economy', trigger: { minTurn: 8 }, ...recurring(4, 25), options: [option('高价采购', { gold: -80, iron: 20, wood: 20 }, 3), option('限制消耗', { factionSat: fr('military', -8), stability: -2 }, 2)] },
  { id: 'evt_caravan_arrival', title: '商队抵达', description: '远方商队带来珍奇货物！', category: 'economy', trigger: { minTurn: 5, notAtWar: true }, ...recurring(4, 20), options: [option('设市交易', { gold: 80, factionSat: fr('merchants', 8) }, 3), option('征收关税', { gold: 120, factionSat: fr('merchants', -5) }, 2)] },
  { id: 'evt_bank_loan', title: '钱庄借贷', description: '钱庄愿借巨款！', category: 'economy', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('接受借贷', { gold: 300, corruption: 5 }, 3), option('婉拒', { legitimacy: 3 }, 2)] },
  { id: 'evt_market_crash', title: '市崩', description: '市场恐慌，物价暴跌！', category: 'economy', trigger: { minTurn: 15 }, ...recurring(3, 50), options: [option('抄底收购', { gold: -150, stability: -5 }, 2), option('稳定市价', { gold: -80, stability: 5 }, 3)] },
  { id: 'evt_frontline_victory', title: '前线大捷', description: '我军大破敌军！', category: 'military', trigger: { atWar: true }, ...recurring(6, 10), options: [option('乘胜追击', { gold: -50, factionSat: fr('military', 12), stability: 5 }, 2), option('见好就收', { legitimacy: 5, factionSat: fr('military', -3) }, 3)] },
  { id: 'evt_siege', title: '围城', description: '敌军围困我方城池！', category: 'military', trigger: { atWar: true }, ...recurring(7, 15), options: [option('死守待援', { food: -80, gold: -40, stability: 3 }, 3), option('突围', { gold: -60, stability: -5, factionSat: fr('military', 5) }, 2)] },
  { id: 'evt_deserter', title: '逃兵', description: '大批士兵逃亡！', category: 'military', trigger: { minWarExhaustion: 50 }, ...recurring(6, 20), options: [option('严惩逃兵', { factionSat: fr('military', 5), stability: -3 }, 2), option('改善待遇', { gold: -80, factionSat: fr('military', 10) }, 3)] },
  { id: 'evt_conscription_resistance', title: '抗征', description: '民众抗拒征兵！', category: 'military', trigger: { minTurn: 8 }, ...recurring(5, 20), options: [option('强制征兵', { factionSat: fr('commoners', -15), stability: -5 }, 2), option('减少征额', { factionSat: fr('commoners', 8), stability: 2 }, 3)] },
  { id: 'evt_war_profit', title: '战争财', description: '军需旺盛，商人发战争财！', category: 'military', trigger: { atWar: true, minTurn: 10 }, ...recurring(3, 25), options: [option('征收战争税', { gold: 100, factionSat: fr('merchants', -8) }, 2), option('鼓励供应', { gold: 50, factionSat: fr('merchants', 5) }, 3)] },
  { id: 'evt_alliance_proposal', title: '同盟邀请', description: '他国提议结盟！', category: 'diplomacy', trigger: { notAtWar: true, minTurn: 8 }, ...recurring(5, 25), options: [option('同意结盟', { influence: 10, legitimacy: 3 }, 3), option('婉拒', { influence: -3 }, 2)] },
  { id: 'evt_treaty_break', title: '毁约', description: '盟国单方面撕毁条约！', category: 'diplomacy', trigger: { minTurn: 15 }, ...recurring(4, 30), options: [option('强烈抗议', { legitimacy: 5, stability: -3 }, 2), option('忍气吞声', { legitimacy: -8, factionSat: fr('nobles', -10) }, 3)] },
  { id: 'evt_hostage_return', title: '质子归还', description: '他国归还人质！', category: 'diplomacy', trigger: { minTurn: 20, notAtWar: true }, ...recurring(3, 40), options: [option('善待归国', { legitimacy: 5, stability: 3 }, 3), option('冷待', { factionSat: fr('nobles', -5) }, 2)] },
  { id: 'evt_pirate_attack', title: '海盗袭击', description: '海盗劫掠沿海！', category: 'diplomacy', trigger: { minTurn: 8 }, ...recurring(5, 20), options: [option('出兵剿灭', { gold: -60, factionSat: fr('military', 8), stability: 3 }, 3), option('招安', { gold: -30, corruption: 5 }, 2)] },
  { id: 'evt_tribute_demand', title: '索贡', description: '强国要求进贡！', category: 'diplomacy', trigger: { minTurn: 12 }, ...recurring(4, 30), options: [option('忍辱进贡', { gold: -100, legitimacy: -5, stability: -3 }, 3), option('拒绝', { legitimacy: 8, stability: -5 }, 2)] },
  { id: 'evt_cultural_exchange', title: '文化交流', description: '他国学者来访交流！', category: 'diplomacy', trigger: { notAtWar: true, minTurn: 10 }, ...recurring(3, 30), options: [option('热烈欢迎', { sciPt: 8, influence: 5, gold: -30 }, 3), option('谨慎对待', { sciPt: 3 }, 2)] },
  { id: 'evt_heresy', title: '异端', description: '异端教派兴起！', category: 'religion', trigger: { minTurn: 10, maxStability: 50 }, ...recurring(5, 25), options: [option('镇压异端', { stability: -5, factionSat: fr('clergy', 10), legitimacy: 3 }, 2), option('宽容对待', { factionSat: fr('clergy', -12), stability: 3 }, 3)] },
  { id: 'evt_holy_war_call', title: '圣战号召', description: '宗教领袖号召圣战！', category: 'religion', trigger: { minTurn: 20 }, ...recurring(3, 50), options: [option('响应号召', { factionSat: fr('clergy', 15), stability: -5, legitimacy: 5 }, 2), option('拒绝', { factionSat: fr('clergy', -15), stability: 3 }, 3)] },
  { id: 'evt_shrine_miracle', title: '神迹', description: '神殿现异象，信徒蜂拥！', category: 'religion', trigger: { minTurn: 15, minStability: 40 }, ...recurring(2, 60), options: [option('大肆宣扬', { legitimacy: 8, factionSat: fr('clergy', 12), influence: 5 }, 3), option('低调处理', { legitimacy: 2 }, 2)] },
  { id: 'evt_monastery_land', title: '寺院占地', description: '寺院广占良田！', category: 'religion', trigger: { minTurn: 12, minCorruption: 20 }, ...recurring(4, 30), options: [option('没收还田', { food: 50, factionSat: fr('clergy', -15), legitimacy: -3 }, 3), option('维持现状', { factionSat: fr('clergy', 5), corruption: 3 }, 2)] },
  { id: 'evt_tech_academy', title: '学府争鸣', description: '各学派激烈论战！', category: 'science', trigger: { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 30), options: [option('资助研究', { gold: -60, sciPt: 10, factionSat: fr('nobles', -5) }, 3), option('限制争论', { stability: 3, sciPt: -3 }, 2)] },
  { id: 'evt_tech_leak', title: '技术外流', description: '核心机密被他国窃取！', category: 'science', trigger: { minTurn: 15 }, ...recurring(3, 40), options: [option('追查内鬼', { gold: -50, stability: -3 }, 3), option('加速研发', { gold: -80, sciPt: 8 }, 2)] },
  { id: 'evt_tech_craft_guild', title: '工匠行会', description: '工匠组织行会保护秘方！', category: 'science', trigger: { minTurn: 8 }, ...recurring(3, 30), options: [option('支持行会', { gold: -30, sciPt: 5, factionSat: fr('merchants', 5) }, 3), option('打破垄断', { sciPt: -2, factionSat: fr('merchants', -8) }, 2)] },
  { id: 'evt_tech_invention', title: '发明', description: '工匠发明新工具！', category: 'science', trigger: { techLevelAbove: { branch: 'agri', level: 2 } }, ...recurring(3, 35), options: [option('推广使用', { gold: -40, food: 30, sciPt: 3 }, 3), option('保守秘密', { sciPt: 5, influence: 2 }, 2)] },
  { id: 'evt_granary_rot', title: '粮仓霉变', description: '储粮大量霉变！', category: 'crisis', trigger: { minTurn: 10 }, ...recurring(4, 30), options: [option('紧急清理', { food: -80, gold: -30 }, 3), option('听之任之', { food: -150, stability: -5 }, 2)] },
  { id: 'evt_road_bandit', title: '路匪', description: '盗匪盘踞要道！', category: 'crisis', trigger: { maxStability: 45 }, ...recurring(5, 20), options: [option('派兵清剿', { gold: -40, stability: 5, factionSat: fr('military', 5) }, 3), option('绕道', { gold: -20, factionSat: fr('merchants', -5) }, 2)] },
  { id: 'evt_pop_plague', title: '时疫', description: '疫病在都城蔓延！', category: 'population', trigger: { minTurn: 15 }, ...recurring(5, 30), options: [option('封城隔离', { gold: -80, population: -100, stability: -3 }, 3), option('放任', { population: -300, stability: -8 }, 2)] },
  { id: 'evt_pop_festival', title: '万民同庆', description: '国泰民安，万民欢庆！', category: 'population', trigger: { minStability: 60, notAtWar: true, minTurn: 10 }, ...recurring(3, 30), options: [option('大赦天下', { gold: -50, stability: 8, legitimacy: 5, factionSat: fr('commoners', 10) }, 3), option('照常', { stability: 2 }, 2)] },
  { id: 'evt_opp_relic', title: '传说圣物现世', description: '传说圣物被发掘！', category: 'opportunity', trigger: { minTurn: 20 }, ...recurring(2, 60), options: [option('供奉展示', { gold: -30, legitimacy: 10, factionSat: fr('clergy', 15), influence: 8 }, 3), option('秘藏', { legitimacy: 3 }, 2)] },
  { id: 'evt_opp_annex', title: '邻国内乱', description: '邻国陷入内乱，有机可乘！', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(3, 40), options: [option('趁虚而入', { gold: -100, stability: -5, influence: 10 }, 2), option('静观其变', { stability: 3 }, 3)] },
  { id: 'evt_opp_trade_monopoly', title: '独占商路', description: '竞争对手退出，商路独占！', category: 'opportunity', trigger: { notAtWar: true, minTurn: 12 }, ...recurring(2, 40), options: [option('大举扩张', { gold: 150, factionSat: fr('merchants', 12) }, 3), option('稳扎稳打', { gold: 60, stability: 3 }, 2)] },
  { id: 'evt_opp_goldmine', title: '金矿发现', description: '探矿者发现大金矿！', category: 'opportunity', trigger: { minTurn: 20 }, ...recurring(2, 50), options: [option('全力开采', { gold: 300, corruption: 8, factionSat: fr('nobles', 10) }, 3), option('适度开采', { gold: 100, corruption: 3 }, 2)] },
  { id: 'evt_culture_propaganda', title: '文化输出', description: '他国仰慕我国文化！', category: 'culture', trigger: { minTurn: 15, notAtWar: true, minStability: 50 }, ...recurring(3, 30), options: [option('积极推广', { gold: -40, influence: 12, legitimacy: 3 }, 3), option('来者不拒', { influence: 5 }, 2)] },
  { id: 'evt_culture_decay', title: '文化衰落', description: '文脉断绝，礼崩乐坏！', category: 'culture', trigger: { maxStability: 30 }, ...recurring(5, 25), options: [option('兴学重教', { gold: -80, stability: 5, legitimacy: 3 }, 3), option('听之任之', { legitimacy: -5, factionSat: fr('nobles', -8) }, 2)] },
  // ── B8: 政体切换反扑事件（3 个，仅 govTransitionActive 窗口内可触发）──
  { id: 'evt_gov_nobles_plot', title: '旧贵族密谋复辟', description: '失去特权的旧贵族暗中密谋，企图复辟旧制！', category: 'politics', trigger: { govTransitionActive: true }, ...recurring(10, 5), options: [option('铁腕镇压', { gold: -100, stability: -8, factionSat: fr('nobles', -20), legitimacy: 5 }, 2), option('安抚妥协', { gold: -50, factionSat: fr('nobles', 15), legitimacy: -8 }, 3)] },
  { id: 'evt_gov_republican_push', title: '共和派逼宫', description: '共和派借新政之机要求扩大议会权力！', category: 'politics', trigger: { govTransitionActive: true }, ...recurring(8, 5), options: [option('顺应扩权', { legitimacy: -5, stability: 5, factionSat: fr('merchants', 12) }, 3), option('坚守王权', { stability: -10, factionSat: fr('merchants', -15), legitimacy: 3 }, 2)] },
  { id: 'evt_gov_clergy_backlash', title: '教士反扑', description: '失势的教士煽动信众，指新政为异端！', category: 'religion', trigger: { govTransitionActive: true }, ...recurring(8, 5), options: [option('政教分离', { gold: -80, stability: -5, factionSat: fr('clergy', -18), legitimacy: 5 }, 2), option('拉拢教士', { gold: -40, factionSat: fr('clergy', 10), legitimacy: -3 }, 3)] },
  // ── D1 扩充：+97 事件到 300，每类 +10 + 5 链 15 事件 ──
  // crisis +10
  { id: 'evt_d1_flood', title: '洪水泛滥', description: '暴雨成灾，河水泛滥。', category: 'crisis', trigger: { minTurn: 5 }, ...recurring(5, 25), options: [option('筑堤救灾', { gold: -80, stability: 3 }, 3), option('任其自然', { food: -40, stability: -5 }, 2)] },
  { id: 'evt_d1_fire', title: '大火', description: '城中大火，连烧数坊。', category: 'crisis', trigger: { minTurn: 6 }, ...recurring(4, 35), options: [option('全力扑救', { gold: -70, stability: 3 }, 3), option('抢救财物', { gold: -20, stability: -4 }, 2)] },
  { id: 'evt_d1_famine_locust', title: '蝗后饥荒', description: '蝗灾之后粮仓空虚。', category: 'crisis', trigger: { maxFoodRatio: 0.5 }, ...recurring(6, 20), options: [option('外购粮食', { gold: -100, food: 80 }, 3), option('勒紧腰带', { food: -30, factionSat: fr('commoners', -10) }, 2)] },
  { id: 'evt_d1_epidemic', title: '疫病', description: '城中疫病流行。', category: 'crisis', trigger: { minTurn: 12 }, ...recurring(5, 40), options: [option('隔离救治', { gold: -90, population: -50, stability: 3 }, 3), option('不管不问', { population: -200, stability: -8 }, 1)] },
  { id: 'evt_d1_riot', title: '民变', description: '民众聚众闹事，冲击府衙。', category: 'crisis', trigger: { maxStability: 30 }, ...recurring(7, 15), options: [option('弹压', { gold: -50, stability: -3, factionSat: fr('military', 5) }, 2), option('答应诉求', { gold: -80, stability: 5, factionSat: fr('commoners', 10) }, 3)] },
  { id: 'evt_d1_collapse', title: '建筑坍塌', description: '年久失修的建筑坍塌。', category: 'crisis', trigger: { minTurn: 10 }, ...recurring(3, 30), options: [option('重建', { gold: -100, stability: 2 }, 3), option('暂置', { stability: -3 }, 2)] },
  { id: 'evt_d1_invasion_raid', title: '蛮族劫掠', description: '蛮族骑兵劫掠边境！', category: 'crisis', trigger: { minTurn: 8 }, ...recurring(5, 20), options: [option('出击', { gold: -60, factionSat: fr('military', 8), stability: 3 }, 3), option('坚壁清野', { food: -30, gold: -30 }, 2)] },
  { id: 'evt_d1_starvation', title: '饥馑', description: '粮尽民饥，饿殍载道。', category: 'crisis', trigger: { maxFoodRatio: 0.4 }, ...recurring(8, 15), options: [option('开仓', { food: -80, stability: 4 }, 3), option('加税购粮', { gold: -50, factionSat: fr('commoners', -15) }, 1)] },
  { id: 'evt_d1_unrest_spread', title: '骚乱蔓延', description: '一省骚乱蔓延邻省。', category: 'crisis', trigger: { maxStability: 35 }, ...recurring(6, 18), options: [option('派兵镇压', { gold: -70, factionSat: fr('military', 6) }, 2), option('安抚', { gold: -100, stability: 5 }, 3)] },
  // politics +10
  { id: 'evt_d1_court_intrigue', title: '宫廷阴谋', description: '后宫与朝臣暗中勾结。', category: 'politics', trigger: { minTurn: 10 }, ...recurring(4, 30), options: [option('彻查', { gold: -50, legitimacy: 5, factionSat: fr('nobles', -8) }, 3), option('装作不知', { legitimacy: -5, corruption: 5 }, 2)] },
  { id: 'evt_d1_minister_dismiss', title: '罢相', description: '宰相失职，朝野弹劾。', category: 'politics', trigger: { minCorruption: 40 }, ...recurring(5, 25), options: [option('罢免', { legitimacy: 3, stability: -3, factionSat: fr('nobles', -10) }, 3), option('留任', { corruption: 5, legitimacy: -5 }, 1)] },
  { id: 'evt_d1_faction_feud', title: '派系倾轧', description: '两大派系公开对立。', category: 'politics', trigger: { minTurn: 8 }, ...recurring(5, 20), options: [option('居中调停', { gold: -40, stability: 3 }, 3), option('支持一方', { stability: -5, legitimacy: -3 }, 2)] },
  { id: 'evt_d1_edict', title: '诏令风波', description: '新诏引发朝野争议。', category: 'politics', trigger: { minTurn: 12 }, ...recurring(4, 25), options: [option('坚持', { legitimacy: 5, stability: -5 }, 2), option('收回', { legitimacy: -8, stability: 3 }, 3)] },
  { id: 'evt_d1_tax_revolt', title: '抗税', description: '某省拒不纳税。', category: 'politics', trigger: { maxStability: 40 }, ...recurring(6, 20), options: [option('武力催税', { gold: 30, stability: -8, factionSat: fr('commoners', -12) }, 1), option('减免', { gold: -50, stability: 5 }, 3)] },
  { id: 'evt_d1_audit', title: '审计', description: '审计发现账目亏空。', category: 'politics', trigger: { minCorruption: 30 }, ...recurring(4, 30), options: [option('追缴', { gold: 60, corruption: -5, factionSat: fr('nobles', -8) }, 3), option('不了了之', { corruption: 3 }, 2)] },
  { id: 'evt_d1_promotion', title: '擢升', description: '功臣请赏。', category: 'politics', trigger: { minTurn: 10, minStability: 40 }, ...recurring(3, 25), options: [option('重赏', { gold: -80, legitimacy: 5, factionSat: fr('nobles', 8) }, 3), option('薄赏', { factionSat: fr('nobles', -5) }, 2)] },
  { id: 'evt_d1_law_dispute', title: '律法争议', description: '新律引发法理争议。', category: 'politics', trigger: { minTurn: 15 }, ...recurring(4, 30), options: [option('修订', { gold: -60, legitimacy: 3 }, 3), option('维持', { stability: -3 }, 2)] },
  { id: 'evt_d1_generalissimo', title: '将权过重', description: '大将权倾朝野。', category: 'politics', trigger: { minTurn: 20 }, ...recurring(5, 40), options: [option('削权', { factionSat: fr('military', -15), stability: 3 }, 3), option('纵容', { legitimacy: -8, corruption: 5 }, 1)] },
  { id: 'evt_d1_reform_backlash', title: '改革反弹', description: '旧势力反扑新政。', category: 'politics', trigger: { minTurn: 15 }, ...recurring(6, 25), options: [option('坚持改革', { stability: -8, legitimacy: 5 }, 2), option('妥协', { stability: 3, legitimacy: -5 }, 3)] },
  // economy +10
  { id: 'evt_d1_depression', title: '萧条', description: '商业萧条，市场冷清。', category: 'economy', trigger: { minTurn: 15, notAtWar: true }, ...recurring(4, 35), options: [option('刺激', { gold: -120, factionSat: fr('merchants', 10) }, 3), option('等待复苏', { gold: -20, factionSat: fr('merchants', -8) }, 2)] },
  { id: 'evt_d1_coinage', title: '币制改革', description: '钱币贬值引发混乱。', category: 'economy', trigger: { minTurn: 18 }, ...recurring(4, 40), options: [option('整顿币制', { gold: -150, stability: 5, corruption: -5 }, 3), option('放任', { factionSat: fr('merchants', -10) }, 2)] },
  { id: 'evt_d1_harvest_tax', title: '秋收征税', description: '丰收之年该征多少？', category: 'economy', trigger: { minTurn: 5 }, ...recurring(5, 15), options: [option('重税', { gold: 120, factionSat: fr('commoners', -10) }, 2), option('薄税', { gold: 50, factionSat: fr('commoners', 8) }, 3)] },
  { id: 'evt_d1_trade_disrupt', title: '商路阻断', description: '商路被匪徒阻断。', category: 'economy', trigger: { minTurn: 10 }, ...recurring(4, 20), options: [option('清剿', { gold: -60, factionSat: fr('merchants', 10) }, 3), option('绕道', { gold: -20, factionSat: fr('merchants', -5) }, 2)] },
  { id: 'evt_d1_usury', title: '高利贷', description: '富商放高利贷盘剥百姓。', category: 'economy', trigger: { minCorruption: 25 }, ...recurring(4, 30), options: [option('限制利率', { gold: -30, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'merchants', delta: -8 }) }, 3), option('放任', { corruption: 3 }, 2)] },
  { id: 'evt_d1_grain_store', title: '粮储', description: '粮储是否充实？', category: 'economy', trigger: { minTurn: 8 }, ...recurring(3, 20), options: [option('广储', { gold: -80, food: 100, stability: 3 }, 3), option('少储', { gold: 20, food: -20 }, 2)] },
  { id: 'evt_d1_market_tax', title: '市税', description: '是否提高市场税？', category: 'economy', trigger: { minTurn: 6 }, ...recurring(4, 20), options: [option('提高', { gold: 80, factionSat: fr('merchants', -10) }, 2), option('维持', { factionSat: fr('merchants', 5) }, 3)] },
  { id: 'evt_d1_labor_short', title: '工程劳力短缺', description: '兴建大工程劳力不足。', category: 'economy', trigger: { minTurn: 12 }, ...recurring(3, 25), options: [option('征役', { factionSat: fr('commoners', -10), stability: -3 }, 2), option('募工', { gold: -100 }, 3)] },
  // military +10
  { id: 'evt_d1_general_die', title: '名将陨落', description: '一代名将病逝。', category: 'military', trigger: { minTurn: 20 }, ...recurring(4, 50), options: [option('厚葬', { gold: -60, legitimacy: 3, factionSat: fr('military', 8) }, 3), option('简葬', { factionSat: fr('military', -5) }, 2)] },
  { id: 'evt_d1_border_warn', title: '边警', description: '边报频传，敌国异动。', category: 'military', trigger: { minTurn: 8 }, ...recurring(5, 20), options: [option('增兵', { gold: -80, factionSat: fr('military', 5) }, 3), option('观望', { stability: -3 }, 2)] },
  { id: 'evt_d1_conscript_wave', title: '征兵', description: '是否大规模征兵？', category: 'military', trigger: { atWar: true }, ...recurring(6, 15), options: [option('大征', { factionSat: fra({ faction: 'commoners', delta: -15 }, { faction: 'military', delta: 10 }) }, 2), option('小征', { factionSat: fr('military', 3) }, 3)] },
  { id: 'evt_d1_supply_cut', title: '补给线断', description: '前线补给被切断！', category: 'military', trigger: { atWar: true, minTurn: 5 }, ...recurring(6, 20), options: [option('打通', { gold: -100, factionSat: fr('military', 8) }, 3), option('就地征粮', { factionSat: fr('commoners', -12), stability: -5 }, 1)] },
  { id: 'evt_d1_veteran_return', title: '老兵归乡', description: '战后老兵归乡安置。', category: 'military', trigger: { minTurn: 15 }, ...recurring(3, 30), options: [option('授田', { gold: -100, factionSat: fra({ faction: 'military', delta: 12 }, { faction: 'commoners', delta: 5 }) }, 3), option('不管', { factionSat: fr('military', -10), stability: -3 }, 2)] },
  { id: 'evt_d1_fortify', title: '筑城', description: '是否加固城防？', category: 'military', trigger: { minTurn: 10 }, ...recurring(3, 30), options: [option('大兴', { gold: -120, stability: 5 }, 3), option('小修', { gold: -30 }, 2)] },
  { id: 'evt_d1_alliance_call', title: '盟友求援', description: '盟国遭入侵求援。', category: 'military', trigger: { minTurn: 12, notAtWar: true }, ...recurring(4, 25), options: [option('出兵', { gold: -100, factionSat: fr('military', 8), influence: 5 }, 3), option('婉拒', { influence: -8 }, 2)] },
  { id: 'evt_d1_pirate', title: '海盗', description: '海盗袭扰沿海！', category: 'military', trigger: { minTurn: 10 }, ...recurring(4, 25), options: [option('剿灭', { gold: -80, factionSat: fr('military', 6) }, 3), option('招安', { gold: -40, corruption: 4 }, 2)] },
  { id: 'evt_d1_war_debt', title: '战债', description: '战争耗费巨大，国库告急。', category: 'military', trigger: { atWar: true, minTurn: 8 }, ...recurring(5, 20), options: [option('加税偿债', { gold: 80, factionSat: fr('commoners', -12) }, 2), option('举债', { gold: 100, corruption: 5 }, 3)] },
  // diplomacy +10
  { id: 'evt_d1_envoy_gift', title: '使节献礼', description: '外国使节带来厚礼。', category: 'diplomacy', trigger: { minTurn: 8, notAtWar: true }, ...recurring(3, 25), options: [option('回礼', { gold: -50, influence: 8 }, 3), option('收下', { gold: 30, influence: -3 }, 2)] },
  { id: 'evt_d1_marriage', title: '联姻', description: '邻国提议联姻结盟。', category: 'diplomacy', trigger: { minTurn: 10, notAtWar: true }, ...recurring(4, 40), options: [option('应允', { gold: -80, influence: 15, legitimacy: 3 }, 3), option('拒绝', { influence: -8 }, 2)] },
  { id: 'evt_d1_trade_pact', title: '商约', description: '邻国提议签订商约。', category: 'diplomacy', trigger: { minTurn: 8, notAtWar: true }, ...recurring(4, 30), options: [option('签订', { gold: 60, influence: 5, factionSat: fr('merchants', 10) }, 3), option('观望', { factionSat: fr('merchants', -5) }, 2)] },
  { id: 'evt_d1_insult', title: '受辱', description: '邻国使节出言不逊。', category: 'diplomacy', trigger: { minTurn: 12 }, ...recurring(4, 20), options: [option('抗议', { influence: -5, stability: 3 }, 2), option('忍让', { legitimacy: -3 }, 3)] },
  { id: 'evt_d1_refugee_return', title: '遣返', description: '邻国要求遣返流民。', category: 'diplomacy', trigger: { minTurn: 15 }, ...recurring(3, 30), options: [option('遣返', { influence: 5, stability: -3 }, 3), option('拒绝', { influence: -8 }, 2)] },
  { id: 'evt_d1_embassy', title: '设使馆', description: '是否在各国设使馆？', category: 'diplomacy', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 40), options: [option('设立', { gold: -100, influence: 12 }, 3), option('暂缓', { influence: -3 }, 2)] },
  { id: 'evt_d1_hostage', title: '质子', description: '邻国送质子以求和。', category: 'diplomacy', trigger: { minTurn: 15 }, ...recurring(3, 50), options: [option('接受', { influence: 10, stability: -3 }, 3), option('拒绝', { influence: -5 }, 2)] },
  { id: 'evt_d1_summit', title: '会盟', description: '诸国提议会盟。', category: 'diplomacy', trigger: { minTurn: 20, notAtWar: true }, ...recurring(3, 60), options: [option('主盟', { gold: -150, influence: 20, legitimacy: 5 }, 3), option('列席', { influence: 5 }, 2)] },
  { id: 'evt_d1_spy_caught', title: '细作', description: '抓获邻国细作。', category: 'diplomacy', trigger: { minTurn: 10 }, ...recurring(4, 25), options: [option('处死', { influence: -5, stability: 3 }, 2), option('遣返', { influence: 3 }, 3)] },
  { id: 'evt_d1_trade_war', title: '商战', description: '邻国对我加征关税。', category: 'diplomacy', trigger: { minTurn: 15 }, ...recurring(4, 30), options: [option('反制', { gold: -50, factionSat: fr('merchants', -8) }, 2), option('谈判', { gold: -30, influence: 5 }, 3)] },
  // religion +10
  { id: 'evt_d1_shrine_build', title: '立祠', description: '是否为功臣立祠？', category: 'religion', trigger: { minTurn: 15, minStability: 40 }, ...recurring(3, 40), options: [option('立祠', { gold: -80, legitimacy: 5, factionSat: fr('clergy', 8) }, 3), option('不立', { factionSat: fr('clergy', -5) }, 2)] },
  { id: 'evt_d1_omen', title: '天象', description: '异象引发恐慌。', category: 'religion', trigger: { minTurn: 8 }, ...recurring(4, 30), options: [option('祭祀', { gold: -50, legitimacy: 5, stability: 3 }, 3), option('不理', { stability: -5 }, 2)] },
  { id: 'evt_d1_conversion', title: '改宗', description: '部分民众改信异教。', category: 'religion', trigger: { minTurn: 15, provinceCultureDiff: true }, ...recurring(4, 35), options: [option('传教', { gold: -60, factionSat: fr('clergy', 10) }, 3), option('宽容', { stability: 3, factionSat: fr('clergy', -8) }, 2)] },
  { id: 'evt_d1_temple_fire', title: '寺庙火灾', description: '主寺庙失火。', category: 'religion', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('重建', { gold: -100, factionSat: fr('clergy', 12) }, 3), option('暂置', { factionSat: fr('clergy', -10) }, 2)] },
  { id: 'evt_d1_festival', title: '宗教节', description: '盛大宗教节日将至。', category: 'religion', trigger: { minTurn: 8, notAtWar: true }, ...recurring(3, 20), options: [option('大办', { gold: -70, stability: 5, factionSat: fr('clergy', 10) }, 3), option('简办', { factionSat: fr('clergy', -5) }, 2)] },
  { id: 'evt_d1_sacrilege', title: '亵渎', description: '有人亵渎神庙。', category: 'religion', trigger: { minTurn: 12 }, ...recurring(3, 30), options: [option('严惩', { factionSat: fr('clergy', 12), stability: -3 }, 2), option('宽恕', { factionSat: fr('clergy', -10) }, 3)] },
  { id: 'evt_d1_prophecy', title: '预言', description: '巫师预言国运。', category: 'religion', trigger: { minTurn: 18 }, ...recurring(3, 50), options: [option('信之', { gold: -40, legitimacy: -3 }, 2), option('斥之', { factionSat: fr('clergy', -8), stability: 3 }, 3)] },
  { id: 'evt_d1_donation', title: '捐赠', description: '富商捐赠寺庙。', category: 'religion', trigger: { minTurn: 12, notAtWar: true }, ...recurring(2, 30), options: [option('鼓励', { factionSat: fra({ faction: 'clergy', delta: 8 }, { faction: 'merchants', delta: 5 }) }, 3), option('课税', { gold: 40, factionSat: fr('clergy', -8) }, 2)] },
  { id: 'evt_d1_relic', title: '圣物', description: '发现圣物。', category: 'religion', trigger: { minTurn: 20 }, ...recurring(2, 60), options: [option('供奉', { gold: -50, legitimacy: 8, factionSat: fr('clergy', 15) }, 3), option('秘藏', { legitimacy: 3 }, 2)] },
  // science +10
  { id: 'evt_d1_academy', title: '书院', description: '学者请立书院。', category: 'science', trigger: { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('批准', { gold: -100, sciPt: 20, legitimacy: 3 }, 3), option('婉拒', { sciPt: -3 }, 2)] },
  { id: 'evt_d1_scholar_invite', title: '招贤', description: '异国贤才来投。', category: 'science', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 30), options: [option('重用', { gold: -60, sciPt: 12, factionSat: fr('nobles', -5) }, 3), option('不用', { sciPt: -2 }, 2)] },
  { id: 'evt_d1_experiment', title: '实验', description: '学者请求做危险实验。', category: 'science', trigger: { minTurn: 15, techLevelAbove: { branch: 'agri', level: 2 } }, ...recurring(3, 35), options: [option('允许', { sciPt: 15, stability: -3 }, 3), option('禁止', { sciPt: -5, factionSat: fr('clergy', 5) }, 2)] },
  { id: 'evt_d1_translation', title: '译书', description: '是否翻译异国典籍？', category: 'science', trigger: { minTurn: 18, notAtWar: true }, ...recurring(3, 40), options: [option('翻译', { gold: -80, sciPt: 10, influence: 5 }, 3), option('不译', { sciPt: -2 }, 2)] },
  { id: 'evt_d1_observation', title: '观测', description: '天文学家请求建观象台。', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'culture', level: 2 } }, ...recurring(2, 50), options: [option('兴建', { gold: -120, sciPt: 20, legitimacy: 5 }, 3), option('缓议', { sciPt: -3 }, 2)] },
  { id: 'evt_d1_medicine', title: '医术', description: '名医献上新医术。', category: 'science', trigger: { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 35), options: [option('推广', { gold: -60, population: 100, stability: 3 }, 3), option('观望', { }, 2)] },
  { id: 'evt_d1_engineering', title: '工程', description: '工程师献新法。', category: 'science', trigger: { minTurn: 18, techLevelAbove: { branch: 'admin', level: 3 } }, ...recurring(2, 40), options: [option('采用', { gold: -80, sciPt: 8 }, 3), option('不用', { }, 2)] },
  { id: 'evt_d1_philosophy', title: '哲学', description: '哲学家提出新说。', category: 'science', trigger: { minTurn: 20, techLevelAbove: { branch: 'culture', level: 3 } }, ...recurring(2, 50), options: [option('表彰', { gold: -30, sciPt: 10, legitimacy: 3 }, 3), option('禁绝', { stability: -5, factionSat: fr('clergy', 8) }, 1)] },
  { id: 'evt_d1_archive', title: '档案', description: '是否整理国家档案？', category: 'science', trigger: { minTurn: 15 }, ...recurring(2, 40), options: [option('整理', { gold: -50, sciPt: 8, legitimacy: 3 }, 3), option('不理', { }, 2)] },
  // opportunity +10
  { id: 'evt_d1_talent', title: '贤才', description: '在野贤才求仕。', category: 'opportunity', trigger: { minTurn: 8, minStability: 30 }, ...recurring(3, 25), options: [option('破格', { gold: -40, legitimacy: 5, factionSat: fr('nobles', -5) }, 3), option('循例', { }, 2)] },
  { id: 'evt_d1_land_claim', title: '无主之地', description: '边境发现无主沃土。', category: 'opportunity', trigger: { minTurn: 12, notAtWar: true }, ...recurring(3, 40), options: [option('占领', { gold: -60, stability: 3 }, 3), option('放弃', { }, 2)] },
  { id: 'evt_d1_ancient', title: '古迹', description: '发现古代遗迹。', category: 'opportunity', trigger: { minTurn: 15 }, ...recurring(2, 50), options: [option('发掘', { gold: -50, sciPt: 10, legitimacy: 3 }, 3), option('保护', { influence: 3 }, 2)] },
  { id: 'evt_d1_alliance_offer', title: '来投', description: '小国求为附庸。', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(3, 40), options: [option('接受', { gold: -80, influence: 15, stability: -3 }, 3), option('拒绝', { influence: -3 }, 2)] },
  { id: 'evt_d1_reform_open', title: '改革良机', description: '民心可用，改革良机。', category: 'opportunity', trigger: { minTurn: 18, minStability: 50 }, ...recurring(3, 50), options: [option('推行', { gold: -100, legitimacy: 8, stability: -5 }, 3), option('缓议', { }, 2)] },
  { id: 'evt_d1_feast', title: '盛宴', description: '是否举办盛宴彰显国力？', category: 'opportunity', trigger: { minTurn: 12, minStability: 40 }, ...recurring(3, 30), options: [option('大办', { gold: -100, influence: 12, legitimacy: 3 }, 3), option('简办', { gold: -20 }, 2)] },
  { id: 'evt_d1_tribute', title: '朝贡', description: '小国来朝贡。', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(3, 40), options: [option('厚赏', { gold: -80, influence: 15 }, 3), option('薄赏', { gold: -20, influence: 3 }, 2)] },
  { id: 'evt_d1_explorer', title: '探险', description: '探险家请缨远征。', category: 'opportunity', trigger: { minTurn: 20 }, ...recurring(2, 50), options: [option('资助', { gold: -120, influence: 10, sciPt: 5 }, 3), option('不允', { }, 2)] },
  { id: 'evt_d1_census', title: '普查', description: '是否普查人口？', category: 'opportunity', trigger: { minTurn: 10 }, ...recurring(3, 40), options: [option('普查', { gold: 20, corruption: -3 }, 3), option('不查', { }, 2)] },
  { id: 'evt_d1_diplomat', title: '纵横', description: '纵横家来投。', category: 'opportunity', trigger: { minTurn: 15, notAtWar: true }, ...recurring(2, 40), options: [option('重用', { gold: -50, influence: 12 }, 3), option('不用', { }, 2)] },
  // culture +10
  { id: 'evt_d1_poet', title: '诗人', description: '著名诗人来游。', category: 'culture', trigger: { minTurn: 10, minStability: 30 }, ...recurring(3, 30), options: [option('款待', { gold: -30, influence: 8, legitimacy: 3 }, 3), option('不见', { }, 2)] },
  { id: 'evt_d1_art', title: '艺术', description: '艺术家请赞助。', category: 'culture', trigger: { minTurn: 12, minStability: 40 }, ...recurring(3, 30), options: [option('赞助', { gold: -50, influence: 8 }, 3), option('婉拒', { }, 2)] },
  { id: 'evt_d1_history', title: '修史', description: '是否修国史？', category: 'culture', trigger: { minTurn: 15 }, ...recurring(3, 50), options: [option('修史', { gold: -80, legitimacy: 8, influence: 5 }, 3), option('缓议', { }, 2)] },
  { id: 'evt_d1_etiquette', title: '礼制', description: '是否革新礼制？', category: 'culture', trigger: { minTurn: 18 }, ...recurring(3, 40), options: [option('革新', { gold: -60, legitimacy: 5, stability: -3 }, 3), option('守旧', { }, 2)] },
  { id: 'evt_d1_architecture', title: '建筑', description: '新建筑风格流行。', category: 'culture', trigger: { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(2, 40), options: [option('采用', { gold: -80, influence: 8 }, 3), option('不用', { }, 2)] },
  { id: 'evt_d1_music', title: '雅乐', description: '是否整理雅乐？', category: 'culture', trigger: { minTurn: 12, minStability: 40 }, ...recurring(2, 40), options: [option('整理', { gold: -40, legitimacy: 5, factionSat: fr('clergy', 5) }, 3), option('不理', { }, 2)] },
  { id: 'evt_d1_fashion', title: '服饰', description: '新服饰风格兴起。', category: 'culture', trigger: { minTurn: 15 }, ...recurring(2, 40), options: [option('推广', { gold: -30, influence: 5 }, 3), option('禁绝', { stability: -3 }, 2)] },
  { id: 'evt_d1_language', title: '文字', description: '是否统一文字？', category: 'culture', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 3 } }, ...recurring(3, 60), options: [option('统一', { gold: -100, legitimacy: 10, stability: -5 }, 3), option('不统', { }, 2)] },
  { id: 'evt_d1_festival_art', title: '艺术节', description: '是否举办艺术节？', category: 'culture', trigger: { minTurn: 12, notAtWar: true, minStability: 40 }, ...recurring(3, 30), options: [option('举办', { gold: -60, influence: 10, stability: 3 }, 3), option('不办', { }, 2)] },
  { id: 'evt_d1_legend', title: '传奇', description: '民间流传本朝传奇。', category: 'culture', trigger: { minTurn: 18, minStability: 50 }, ...recurring(2, 50), options: [option('鼓励', { legitimacy: 5, influence: 5 }, 3), option('禁绝', { stability: -3 }, 2)] },
  // population +7
  { id: 'evt_d1_migration', title: '迁徙', description: '部分民众欲迁徙他乡。', category: 'population', trigger: { minTurn: 10, maxStability: 40 }, ...recurring(4, 25), options: [option('挽留', { gold: -50, stability: 3 }, 3), option('任其', { population: -200 }, 2)] },
  { id: 'evt_d1_birth_boom', title: '婴儿潮', description: '今年出生率大增。', category: 'population', trigger: { minTurn: 8, minStability: 50 }, ...recurring(3, 30), options: [option('鼓励', { gold: -40, population: 200 }, 3), option('不管', { population: 100 }, 2)] },
  { id: 'evt_d1_plague_death', title: '疫后', description: '疫病后人口骤减。', category: 'population', trigger: { minTurn: 15 }, ...recurring(4, 40), options: [option('休养', { gold: -60, population: 100, stability: 3 }, 3), option('不管', { population: -100 }, 2)] },
  { id: 'evt_d1_labor_demand', title: '劳力', description: '百业兴旺劳力不足。', category: 'population', trigger: { minTurn: 12, minStability: 50 }, ...recurring(3, 30), options: [option('招抚', { gold: -50, population: 150 }, 3), option('不加', { }, 2)] },
  { id: 'evt_d1_urban', title: '城市化', description: '民众涌入城市。', category: 'population', trigger: { minTurn: 15, minStability: 40 }, ...recurring(3, 30), options: [option('安置', { gold: -80, stability: 3, factionSat: fr('commoners', 8) }, 3), option('不管', { stability: -3, corruption: 3 }, 2)] },
  { id: 'evt_d1_emigration', title: '外流', description: '民众外流他国。', category: 'population', trigger: { minTurn: 12, maxStability: 35 }, ...recurring(4, 25), options: [option('阻止', { gold: -40, stability: -3 }, 2), option('任其', { population: -150, influence: -3 }, 3)] },
  { id: 'evt_d1_clan', title: '宗族', description: '大宗族兼并小户。', category: 'population', trigger: { minTurn: 15, minCorruption: 30 }, ...recurring(3, 35), options: [option('抑制', { gold: -50, factionSat: fra({ faction: 'nobles', delta: -10 }, { faction: 'commoners', delta: 8 }) }, 3), option('不管', { corruption: 3 }, 2)] },
  // ── D1 事件链 11-15（5 链 × 3 事件 = 15 事件）──
  // 链 11：蛮族入侵链——预警→入侵→和或战
  { id: 'evt_chain_barbarian_1', title: '蛮族集结', description: '边报：蛮族于塞外集结，似有南下之意！', category: 'military', trigger: { minTurn: 12 }, ...recurring(5, 80), options: [
    option('增兵戒备', { gold: -80, factionSat: fr('military', 5), triggerEvent: 'evt_chain_barbarian_2' }, 3),
    option('遣使探虚实', { gold: -30, influence: -3, triggerEvent: 'evt_chain_barbarian_2' }, 2),
  ] },
  { id: 'evt_chain_barbarian_2', title: '蛮族南下', description: '蛮族铁骑南下，连陷数镇！', category: 'military', trigger: { minTurn: 13 }, ...followUp, options: [
    option('主力决战', { gold: -150, factionSat: fr('military', 10), stability: -5, triggerEvent: 'evt_chain_barbarian_3' }, 2),
    option('坚壁清野', { food: -100, gold: -60, stability: -8, triggerEvent: 'evt_chain_barbarian_3' }, 3),
  ] },
  { id: 'evt_chain_barbarian_3', title: '蛮族余波', description: '蛮族退去，边境残破。', category: 'military', trigger: { minTurn: 14 }, ...followUp, options: [
    option('重建边境', { gold: -120, stability: 5, factionSat: fr('commoners', 8) }, 3),
    option('暂置', { stability: -3, influence: -5 }, 2),
  ] },
  // 链 12：继位内战链——驾崩→争位→内战或和解
  { id: 'evt_chain_succession_1', title: '君主驾崩', description: '君主突然驾崩，未立太子！', category: 'politics', trigger: { minTurn: 25 }, ...oneTime(6, 100), options: [
    option('立长子', { legitimacy: 5, stability: -5, triggerEvent: 'evt_chain_succession_2' }, 3),
    option('择贤立', { legitimacy: -5, stability: -8, factionSat: fr('nobles', -10), triggerEvent: 'evt_chain_succession_2' }, 2),
  ] },
  { id: 'evt_chain_succession_2', title: '诸王争位', description: '诸王子各立党羽，朝野分裂！', category: 'politics', trigger: { minTurn: 26 }, ...followUp, options: [
    option('强力镇压', { gold: -100, stability: -10, factionSat: fr('military', 8), triggerEvent: 'evt_chain_succession_3' }, 2),
    option('谈判和解', { gold: -150, legitimacy: -8, stability: 3, triggerEvent: 'evt_chain_succession_3' }, 3),
  ] },
  { id: 'evt_chain_succession_3', title: '内战结束', description: '争位之争终见分晓。', category: 'politics', trigger: { minTurn: 27 }, ...followUp, options: [
    option('大赦天下', { gold: -80, legitimacy: 10, stability: 8 }, 3),
    option('清算旧账', { gold: -40, legitimacy: 5, factionSat: fr('nobles', -15) }, 2),
  ] },
  // 链 13：商业革命链——新兴→繁荣→泡沫或稳固
  { id: 'evt_chain_commerce_1', title: '商团兴起', description: '新兴商团势力大增，要求更多特权！', category: 'economy', trigger: { minTurn: 15, notAtWar: true, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(4, 80), options: [
    option('授予特权', { gold: 100, factionSat: fra({ faction: 'merchants', delta: 12 }, { faction: 'nobles', delta: -8 }), triggerEvent: 'evt_chain_commerce_2' }, 3),
    option('限制', { gold: -20, factionSat: fr('merchants', -10), triggerEvent: 'evt_chain_commerce_2' }, 2),
  ] },
  { id: 'evt_chain_commerce_2', title: '商业繁荣', description: '商业空前繁荣，金币如雨！', category: 'economy', trigger: { minTurn: 16 }, ...followUp, options: [
    option('大举征税', { gold: 200, factionSat: fr('merchants', -12), triggerEvent: 'evt_chain_commerce_3' }, 2),
    option('轻税促商', { gold: 80, factionSat: fr('merchants', 10), stability: 3, triggerEvent: 'evt_chain_commerce_3' }, 3),
  ] },
  { id: 'evt_chain_commerce_3', title: '商潮余波', description: '商业浪潮后，经济格局已变。', category: 'economy', trigger: { minTurn: 17 }, ...followUp, options: [
    option('规范市场', { gold: -60, corruption: -5, factionSat: fr('merchants', 5) }, 3),
    option('放任', { corruption: 8, gold: 50 }, 2),
  ] },
  // 链 14：宗教改革链——异端→分裂→宽容或镇压
  { id: 'evt_chain_reform_1', title: '宗教异端', description: '新教派兴起，挑战旧教权威！', category: 'religion', trigger: { minTurn: 18, techLevelAbove: { branch: 'culture', level: 2 } }, ...recurring(4, 100), options: [
    option('镇压', { gold: -80, factionSat: fr('clergy', 12), stability: -5, triggerEvent: 'evt_chain_reform_2' }, 2),
    option('容忍', { factionSat: fr('clergy', -15), stability: 3, triggerEvent: 'evt_chain_reform_2' }, 3),
  ] },
  { id: 'evt_chain_reform_2', title: '宗教分裂', description: '教派对立全国动荡！', category: 'religion', trigger: { minTurn: 19 }, ...followUp, options: [
    option('定一尊', { gold: -150, legitimacy: 8, stability: -10, factionSat: fr('clergy', 15), triggerEvent: 'evt_chain_reform_3' }, 2),
    option('宽容并立', { gold: -50, stability: 5, legitimacy: -5, factionSat: fr('clergy', -10), triggerEvent: 'evt_chain_reform_3' }, 3),
  ] },
  { id: 'evt_chain_reform_3', title: '教争终局', description: '宗教之争暂告段落。', category: 'religion', trigger: { minTurn: 20 }, ...followUp, options: [
    option('重建教权', { gold: -100, legitimacy: 5, factionSat: fr('clergy', 10) }, 3),
    option('政教分离', { gold: -50, stability: 5, factionSat: fr('clergy', -8) }, 2),
  ] },
  // 链 15：瘟疫大流行链——潜伏→爆发→余波或根治
  { id: 'evt_chain_pandemic_1', title: '疫病潜伏', description: '远国疫病传入，太医奏请防范！', category: 'crisis', trigger: { minTurn: 22 }, ...oneTime(5, 120), options: [
    option('严防输入', { gold: -100, stability: 3, triggerEvent: 'evt_chain_pandemic_2' }, 3),
    option('观望', { triggerEvent: 'evt_chain_pandemic_2' }, 2),
  ] },
  { id: 'evt_chain_pandemic_2', title: '大疫爆发', description: '疫病全国蔓延，死者甚众！', category: 'crisis', trigger: { minTurn: 23 }, ...followUp, options: [
    option('封城救治', { gold: -200, population: -300, stability: -8, factionSat: fr('clergy', 8), triggerEvent: 'evt_chain_pandemic_3' }, 3),
    option('祈祷', { population: -500, stability: -15, legitimacy: -8, triggerEvent: 'evt_chain_pandemic_3' }, 1),
  ] },
  { id: 'evt_chain_pandemic_3', title: '疫后重建', description: '大疫终于退去，百废待兴。', category: 'crisis', trigger: { minTurn: 24 }, ...followUp, options: [
    option('休养生息', { gold: -150, population: 200, stability: 8, legitimacy: 5 }, 3),
    option('加税重建', { gold: 100, factionSat: fr('commoners', -15), stability: -5 }, 2),
  ] },
  // ── population 扩充 +10（21→31，增强人口系统事件多样性）──
  { id: 'evt_pop_aging', title: '耆老增多', description: '医术渐进，耆寿增多，赡养之议起！', category: 'population', trigger: { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('设养济院', { gold: -70, stability: 4, factionSat: fr('commoners', 10) }, 3), option('族养为主', { stability: 1, factionSat: fr('nobles', 5) }, 2)] },
  { id: 'evt_pop_orphan', title: '孤儿流离', description: '战乱后孤儿流离道旁，士民请命！', category: 'population', trigger: { minTurn: 12, atWar: true }, ...recurring(4, 30), options: [option('官设慈幼局', { gold: -60, population: 80, stability: 5, factionSat: fr('clergy', 8) }, 3), option('民间收养', { population: 40, stability: 1 }, 2)] },
  { id: 'evt_pop_refugee_return', title: '流民归乡', description: '故土安靖，昔日流民纷纷归乡！', category: 'population', trigger: { minTurn: 18, notAtWar: true, minStability: 50 }, ...recurring(3, 40), options: [option('官助归耕', { gold: -50, population: 150, food: 30, efficiency: 2 }, 3), option('听其自便', { population: 80 }, 2)] },
  { id: 'evt_pop_conscription_backlash', title: '征丁怨声', description: '连年征兵，乡野丁壮匮乏，民怨渐起！', category: 'population', trigger: { minTurn: 10, atWar: true, maxStability: 50 }, ...recurring(5, 25), options: [option('减免来年征发', { gold: -40, stability: 5, factionSat: fr('commoners', 12) }, 3), option('严令催征', { stability: -8, factionSat: fr('commoners', -15), population: -100 }, 1)] },
  { id: 'evt_pop_market_town', title: '市镇兴起', description: '交通要冲市镇自发兴起，商贾云集！', category: 'population', trigger: { minTurn: 14, minStability: 45, techLevelAbove: { branch: 'admin', level: 1 } }, ...recurring(3, 35), options: [option('设官治理', { gold: -40, efficiency: 3, factionSat: fr('merchants', 10), corruption: -2 }, 3), option('任其自流', { gold: 30, corruption: 4 }, 2)] },
  { id: 'evt_pop_famine_migration', title: '就食流移', description: '北省大旱，饥民就食南下，纷至沓来！', category: 'population', trigger: { minTurn: 12, maxStability: 45 }, ...recurring(5, 30), options: [option('开仓赈济', { gold: -80, food: -60, population: 200, stability: 4 }, 3), option('闭境拒之', { stability: -5, influence: -5, factionSat: fr('commoners', -10) }, 2)] },
  { id: 'evt_pop_noble_exodus', title: '贵胄徙避', description: '政局动荡，部分贵胄携家南迁邻邦！', category: 'population', trigger: { minTurn: 15, maxStability: 40 }, ...recurring(4, 35), options: [option('厚礼挽留', { gold: -100, legitimacy: 5, factionSat: fr('nobles', 12) }, 3), option('任其去留', { population: -80, influence: -5, factionSat: fr('nobles', -10) }, 2)] },
  { id: 'evt_pop_scholar_return', title: '游学归乡', description: '昔日游学之士学成归国，欲效力庙堂！', category: 'population', trigger: { minTurn: 16, techLevelAbove: { branch: 'admin', level: 2 } }, ...recurring(3, 40), options: [option('量才录用', { gold: -40, sciPt: 20, efficiency: 3, factionSat: fr('clergy', 8) }, 3), option('待缺候补', { sciPt: 5, stability: 1 }, 2)] },
  { id: 'evt_pop_border_trade', title: '边民互市', description: '边民越界互市，官府查否两难！', category: 'population', trigger: { minTurn: 10, notAtWar: true }, ...recurring(3, 30), options: [option('设榷场规范', { gold: 60, factionSat: fr('merchants', 10), efficiency: 2 }, 3), option('严禁越界', { gold: -20, stability: 2, factionSat: fr('merchants', -8) }, 2)] },
  { id: 'evt_pop_overcrowding', title: '人稠地狭', description: '核心省份人稠地狭，生计日蹙！', category: 'population', trigger: { minTurn: 22, minStability: 50 }, ...recurring(4, 40), options: [option('移民实边', { gold: -100, population: 100, stability: 4, efficiency: 2 }, 3), option('精耕细作', { gold: -50, food: 40, sciPt: 5 }, 2)] },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
export const EVENT_IDS: string[] = EVENTS.map((e) => e.id);
export const EVENT_COUNT = EVENTS.length;
