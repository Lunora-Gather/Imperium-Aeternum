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
const commonersReaction = (delta: number) => fr('commoners', delta);
const noblesReaction = (delta: number) => fr('nobles', delta);
const militaryReaction = (delta: number) => fr('military', delta);
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

function fromTurn(minTurn: number, conditions?: EventTrigger): EventTrigger {
  return { minTurn, ...conditions };
}

function defineEvent(
  id: string, title: string, description: string, category: EventDef['category'],
  trigger: EventTrigger, frequency: Pick<EventDef, 'weight' | 'cooldown' | 'unique'>, options: EventOption[],
): EventDef {
  return { id, title, description, category, trigger, ...frequency, options };
}

export const EVENTS: EventDef[] = [
  defineEvent('evt_eastern_reform', '开国议政', '地方税册多年未厘清。朝廷要拨款清查田亩，还是把征收权交给地方？',
    'politics', {}, uniqueFollowUp, [
      option('拨款丈量田亩', { gold: -80, efficiency: 8, corruption: -4, factionSat: noblesReaction(-8) }, 1),
      option('请地方代征', { gold: 80, legitimacy: 5, efficiency: -4, factionSat: noblesReaction(8) }, 1),
    ]),
  defineEvent('evt_eastern_envoy', '边境使团', '邻国使节带来五年互不侵犯的提议。签约可安定边境，双方也将暂时放弃向对方宣战。',
    'diplomacy', {}, uniqueFollowUp, [
      option('签下五年约书', { gold: -50, stability: 4 }, 1),
      option('婉拒并整备边防', { iron: 20, stability: -2, factionSat: militaryReaction(8) }, 1),
    ]),
  defineEvent('evt_eastern_renewal', '边约期满', '五年之约将满，昔日的使节带来了新的条件。',
    'diplomacy', {}, uniqueFollowUp, [option('接受续约', {}, 1), option('让原约期满', {}, 1)]),
  defineEvent('evt_grain_budget', '余粮的去向', '境外商人愿以每石二金收购三年粮食。地方也在请款修渠，希望把盈余留给下一季收成。',
    'economy', {}, uniqueFollowUp, [
      option('承接三年供粮约', {}, 1), option('出资修渠', {}, 1), option('暂留粮款', {}, 1),
    ]),
  // ── 危机类 ──
  defineEvent('evt_famine', '粮食危机', '多地粮仓告急，粮价飞涨，民众惶恐。',
    'crisis', { maxFoodRatio: 0.6 }, recurring(10, 15), [
      option('紧急开仓放粮', { food: -100, stability: 5, factionSat: commonersReaction(10) }, 2),
      option('从邻国高价购粮', { gold: -150, food: 80, influence: -3 }, 3),
      option('坐视不管', { stability: -10, population: -50, factionSat: commonersReaction(-15) }, 1),
    ]),
  defineEvent('evt_plague', '瘟疫', '瘟疫蔓延，人口骤减。',
    'crisis', fromTurn(20), recurring(4, 40), [
      option('隔离疫区', { population: -80, stability: -5, gold: -50 }, 3),
      option('祈神禳灾', { population: -150, factionSat: fr('clergy', 10) }, 2),
      option('召集学者研究', { population: -60, sciPt: 5, gold: -80 }, 2),
    ]),
  defineEvent('evt_drought', '旱灾', '持续干旱，粮食减产。',
    'crisis', {}, recurring(6, 20), [
      option('减免农税', { taxRate: -0.02, food: -50, factionSat: commonersReaction(10) }, 3),
      option('强行征粮', { food: 50, stability: -8, factionSat: commonersReaction(-15) }, 2),
    ]),
  // ── 政治类 ──
  defineEvent('evt_noble_coup', '贵族逼宫', '不满的贵族密谋反对你的统治。',
    'politics', { factionSatBelow: { faction: 'nobles', threshold: 20 } }, recurring(8, 25), [
      option('让步分权', { legitimacy: -10, efficiency: -5, factionSat: noblesReaction(20) }, 3),
      option('铁腕镇压', { stability: -10, legitimacy: -5, factionSat: fra({ faction: 'nobles', delta: -10 }, { faction: 'military', delta: 5 }) }, 2),
    ]),
  defineEvent('evt_merchant_strike', '商人罢市', '商人关闭店铺抗议税政。',
    'politics', { factionSatBelow: { faction: 'merchants', threshold: 20 } }, recurring(8, 25), [
      option('减免商税', { taxRate: -0.02, gold: -50, factionSat: fr('merchants', 20) }, 3),
      option('强制开市', { gold: -100, stability: -5, factionSat: fr('merchants', -10) }, 2),
    ]),
  defineEvent('evt_military_unrest', '军方不满', '欠饷的军队骚动不安。',
    'politics', { factionSatBelow: { faction: 'military', threshold: 20 } }, recurring(9, 20), [
      option('补发军饷', { gold: -120, factionSat: militaryReaction(25) }, 3),
      option('裁撤老兵', { population: -30, stability: -5, factionSat: militaryReaction(-10) }, 2),
    ]),
  defineEvent('evt_peasant_uprising', '农民起义', '不堪重税的农民揭竿而起。',
    'politics', { factionSatBelow: { faction: 'commoners', threshold: 20 } }, recurring(9, 20), [
      option('镇压起义', { gold: -80, population: -40, stability: -5, factionSat: fra({ faction: 'commoners', delta: -15 }, { faction: 'military', delta: 5 }) }, 3),
      option('允诺减税', { taxRate: -0.03, gold: -30, factionSat: commonersReaction(25) }, 2),
    ]),
  defineEvent('evt_clergy_interference', '神职干政', '神职人员要求更大的宗教话语权。',
    'politics', { factionSatBelow: { faction: 'clergy', threshold: 30 }, minCorruption: 30 }, recurring(5, 30), [
      option('授予宗教特权', { influence: 5, efficiency: -5, factionSat: fra({ faction: 'clergy', delta: 20 }, { faction: 'merchants', delta: -5 }) }, 3),
      option('拒绝并限制教权', { stability: -3, legitimacy: -3, factionSat: fr('clergy', -15) }, 2),
    ]),
  defineEvent('evt_succession_crisis', '王位继承危机', '继承合法性受到质疑。',
    'politics', { maxLegitimacy: 25 }, recurring(12, 30), [
      option('争取贵族支持', { gold: -100, legitimacy: 15, factionSat: noblesReaction(15) }, 3),
      option('民众拥戴路线', { gold: -80, legitimacy: 10, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -5 }) }, 2),
    ]),
  defineEvent('evt_corruption_scandal', '腐败丑闻', '高官贪腐案曝光，朝野震动。',
    'politics', { minCorruption: 60 }, recurring(8, 20), [
      option('严惩涉案官员', { corruption: -10, gold: -50, factionSat: noblesReaction(-10) }, 3),
      option('大事化小', { corruption: 5, legitimacy: -5, factionSat: commonersReaction(-10) }, 2),
    ]),
  // ── 经济类 ──
  defineEvent('evt_treasury_alarm', '国库告急', '国库即将见底，财政告急。',
    'economy', fromTurn(1), recurring(7, 15), [
      option('临时加征特别税', { gold: 100, stability: -5, factionSat: commonersReaction(-10) }, 3),
      option('出售王室珍藏', { gold: 150, legitimacy: -3 }, 2),
    ]),
  defineEvent('evt_trade_route_open', '商路开通', '一条新的商路被发现。',
    'economy', { notAtWar: true }, recurring(5, 30), [
      option('鼓励商人开拓', { gold: 50, influence: 3, factionSat: fr('merchants', 10) }, 3),
      option('王室垄断贸易', { gold: 100, factionSat: fr('merchants', -10) }, 2),
    ]),
  defineEvent('evt_mineral_discovery', '矿藏发现', '勘探者发现新矿藏。',
    'economy', {}, recurring(4, 40), [
      option('立即开采', { iron: 50, gold: -30 }, 3),
      option('长期开发', { iron: 20, gold: 20 }, 2),
    ]),
  defineEvent('evt_harvest_bumper', '丰收', '今年风调雨顺，粮食大丰。',
    'economy', {}, recurring(5, 15), [
      option('充实粮仓', { food: 200, stability: 3 }, 3),
      option('出口换金', { food: 100, gold: 80 }, 2),
    ]),
  // ── 军事类 ──
  defineEvent('evt_war_weariness', '厌战民变', '长期战争引发民众厌战抗议。',
    'military', { minWarExhaustion: 70 }, recurring(10, 20), [
      option('承诺尽快停战', { warExhaustion: -10, factionSat: commonersReaction(10) }, 3),
      option('强硬镇压反战', { stability: -10, warExhaustion: -5, factionSat: commonersReaction(-15) }, 2),
    ]),
  defineEvent('evt_peace_proposal', '和谈提议', '敌方派出使者提议停战。',
    'military', { atWar: true }, recurring(8, 15), [
      option('接受和谈', { influence: 10, warExhaustion: -20 }, 3),
      option('拒绝继续战争', { stability: -3, factionSat: militaryReaction(5) }, 2),
    ]),
  defineEvent('evt_new_territory', '新领土治理', '刚占领的省份需要治理方案。',
    'military', { hasNewTerritory: true }, recurring(12, 5), [
      option('怀柔安抚', { gold: -80, stability: 3, influence: 5 }, 3),
      option('驻军镇压', { gold: -40, stability: -3, factionSat: militaryReaction(5) }, 2),
    ]),
  // ── 外交类 ──
  defineEvent('evt_border_clash', '边境外交危机', '与邻国边境发生小规模冲突。',
    'diplomacy', { relationBelow: { target: 'n02', threshold: -30 } }, recurring(7, 20), [
      option('外交斡旋', { influence: -10, relation: { target: 'n02', delta: 10 } }, 3),
      option('强硬反制', { relation: { target: 'n02', delta: -15 }, factionSat: militaryReaction(8) }, 2),
    ]),
  defineEvent('evt_foreign_envoy', '外国使团到访', '邻国派出使团寻求合作。',
    'diplomacy', { notAtWar: true, minTurn: 5 }, recurring(5, 25), [
      option('热情接待', { gold: -30, influence: 8, relation: { target: 'n03', delta: 5 } }, 3),
      option('冷淡回绝', { influence: -3, relation: { target: 'n03', delta: -5 } }, 2),
    ]),
  defineEvent('evt_neighbor_threat', '邻国威胁', '邻国陈兵边境发出威胁。',
    'diplomacy', fromTurn(10), recurring(6, 30), [
      option('外交妥协', { influence: -5, gold: -50, relation: { target: 'n04', delta: 10 } }, 3),
      option('扩军备战', { gold: -100, factionSat: militaryReaction(10), relation: { target: 'n04', delta: -10 } }, 2),
    ]),
  // ── 宗教类 ──
  defineEvent('evt_religion_dispute', '宗教争端', '不同信仰者发生冲突。',
    'religion', { provinceCultureDiff: true }, recurring(6, 25), [
      option('推行宽容政策', { stability: 3, influence: 3, factionSat: fr('clergy', -10) }, 3),
      option('支持国教压制', { stability: -5, factionSat: fra({ faction: 'clergy', delta: 15 }, { faction: 'commoners', delta: -10 }) }, 2),
    ]),
  // ── 科技类 ──
  defineEvent('evt_tech_breakthrough', '科技突破', '学者取得重大突破！',
    'science', { techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 20), [
      option('推广新技术', { sciPt: 20, gold: -50 }, 3),
      option('保密御用', { sciPt: 10, legitimacy: 3, factionSat: noblesReaction(5) }, 2),
    ]),
  defineEvent('evt_scholar_petition', '学者请愿', '学者请求加大科研投入。',
    'science', fromTurn(5), recurring(4, 25), [
      option('拨金支持', { gold: -80, sciPt: 10 }, 3),
      option('婉拒', { factionSat: commonersReaction(-5) }, 2),
    ]),
  // ── 机会类 ──
  defineEvent('evt_reform_call', '改革呼声', '民众与商人呼吁体制改革。',
    'opportunity', fromTurn(15, { maxStability: 40 }), recurring(5, 30), [
      option('启动渐进改革', { legitimacy: -5, stability: 5, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, 3),
      option('拒绝改革', { stability: -5, factionSat: commonersReaction(-10) }, 2),
    ]),
  defineEvent('evt_coup_risk', '军事政变风险', '军方密谋发动政变！',
    'politics', { factionSatBelow: { faction: 'military', threshold: 10 }, maxLegitimacy: 40 }, recurring(8, 50), [
      option('密谋分化将领', { gold: -150, legitimacy: -5, factionSat: militaryReaction(15) }, 3),
      option('先发制人清洗', { stability: -15, legitimacy: -10, factionSat: militaryReaction(-20) }, 1),
    ]),
  // ── 扩展事件 26-55（世界级） ──
  defineEvent('evt_gold_rush', '淘金热', '边境发现金矿！', 'economy', fromTurn(10), recurring(3, 40), [option('开采', { gold: 200, corruption: 5 }, 3), option('限制开采', { gold: 50, stability: 3 }, 2)]),
  defineEvent('evt_trade_boom', '贸易繁荣', '商路畅通，贸易量激增！', 'economy', fromTurn(5, { notAtWar: true }), recurring(4, 25), [option('鼓励贸易', { gold: 100, factionSat: fr('merchants', 10) }, 3), option('征收商税', { gold: 150, factionSat: fr('merchants', -8) }, 2)]),
  defineEvent('evt_drought_severe', '大旱', '久旱不雨，粮食减产！', 'crisis', fromTurn(3), recurring(5, 30), [option('开仓放粮', { food: -100, stability: 5 }, 3), option('加重赋税救灾', { gold: -80, food: 50, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent('evt_refugee_wave', '边境难民潮', '邻国战乱，难民涌入边境！', 'crisis', fromTurn(10), recurring(4, 35), [option('接纳安置', { population: 500, food: -50, stability: -3 }, 2), option('关闭边境', { legitimacy: -5, factionSat: commonersReaction(5) }, 3)]),
  defineEvent('evt_merchant_guild', '商人行会', '商人组建行会要求特权！', 'politics', fromTurn(8), recurring(4, 30), [option('授予特权', { gold: 80, factionSat: fra({ faction: 'merchants', delta: 15 }, { faction: 'nobles', delta: -8 }) }, 3), option('拒绝', { factionSat: fr('merchants', -12) }, 2)]),
  defineEvent('evt_military_reform', '军事改革', '将领提议改革军制！', 'military', fromTurn(10), recurring(3, 40), [option('推行改革', { gold: -120, factionSat: militaryReaction(10), stability: -3 }, 3), option('维持现状', { factionSat: militaryReaction(-5) }, 2)]),
  defineEvent('evt_cultural_flourish', '文化繁荣', '学者艺术家汇聚，文化昌盛！', 'culture', fromTurn(15, { minStability: 40 }), recurring(3, 30), [option('大力资助', { gold: -80, sciPt: 15, legitimacy: 5 }, 3), option('适度支持', { gold: -30, sciPt: 5 }, 2)]),
  defineEvent('evt_border_incident', '边军冲突', '边防军与邻国发生小规模冲突！', 'military', fromTurn(5), recurring(5, 20), [option('强硬回应', { stability: 3, factionSat: fra({ faction: 'military', delta: 8 }, { faction: 'merchants', delta: -5 }) }, 2), option('外交斡旋', { gold: -30, legitimacy: 3 }, 3)]),
  defineEvent('evt_earthquake', '地震', '强烈地震袭击省份！', 'crisis', fromTurn(3), recurring(3, 50), [option('全力救灾', { gold: -150, food: -50, stability: 5 }, 3), option('有限救援', { gold: -50, stability: -5 }, 2)]),
  defineEvent('evt_tax_evasion', '大规模逃税', '富商大族逃税严重！', 'economy', { minCorruption: 30 }, recurring(5, 25), [option('严查重罚', { gold: 100, factionSat: noblesReaction(-10), corruption: -5 }, 2), option('从轻发落', { factionSat: noblesReaction(5), corruption: 3 }, 3)]),
  defineEvent('evt_succession_war', '继承危机', '多位继承人选争夺大位！', 'politics', { maxLegitimacy: 50 }, recurring(6, 40), [option('立长子', { legitimacy: 10, stability: -5 }, 3), option('择贤立', { legitimacy: 5, stability: -8, factionSat: noblesReaction(-10) }, 2)]),
  defineEvent('evt_foreign_aid', '外国援助', '友邦送来物资援助！', 'economy', fromTurn(10, { notAtWar: true }), recurring(3, 30), [option('欣然接受', { gold: 80, food: 60 }, 3), option('婉拒以保独立', { legitimacy: 5 }, 2)]),
  defineEvent('evt_pop_boom', '人口激增', '丰收带来人口快速增长！', 'population', fromTurn(8, { minStability: 50 }), recurring(3, 30), [option('鼓励增长', { population: 300, food: -30 }, 3), option('适度控制', { population: 100 }, 2)]),
  defineEvent('evt_slave_revolt', '奴役起义', '被压迫者揭竿而起！', 'crisis', fromTurn(10, { maxStability: 40 }), recurring(5, 35), [option('镇压', { gold: -80, stability: -5, factionSat: militaryReaction(5) }, 2), option('适度改革', { gold: -50, legitimacy: 5, factionSat: noblesReaction(-8) }, 3)]),
  defineEvent('evt_spy_scandal', '间谍丑闻', '外国间谍被抓获！', 'diplomacy', fromTurn(5), recurring(4, 25), [option('公开处刑', { legitimacy: 5, stability: -3 }, 2), option('秘密利用', { gold: 50, corruption: 3 }, 3)]),
  defineEvent('evt_temple_dispute', '寺庙争端', '宗教团体间爆发冲突！', 'religion', fromTurn(5, { provinceCultureDiff: true }), recurring(4, 30), [option('仲裁调停', { gold: -30, stability: 3 }, 3), option('支持一方', { factionSat: fr('clergy', 10), stability: -5 }, 2)]),
  defineEvent('evt_road_building', '修路热潮', '各方要求修建道路！', 'economy', fromTurn(8, { notAtWar: true }), recurring(4, 25), [option('大兴土木', { gold: -120, stability: 3, factionSat: fr('merchants', 8) }, 3), option('量力而行', { gold: -40 }, 2)]),
  defineEvent('evt_weapon_advance', '武器革新', '工匠发明新型武器！', 'military', { techLevelAbove: { branch: 'mil', level: 2 } }, recurring(3, 35), [option('装备全军', { gold: -100, iron: -20, factionSat: militaryReaction(12) }, 3), option('限量装备', { gold: -40, factionSat: militaryReaction(5) }, 2)]),
  defineEvent('evt_noble_feud', '贵族内斗', '两大贵族家族公开对立！', 'politics', fromTurn(5), recurring(4, 20), [option('居中调停', { gold: -50, stability: 3 }, 3), option('支持强势方', { factionSat: noblesReaction(-8), legitimacy: -3 }, 2)]),
  defineEvent('evt_harvest_festival', '丰收节', '五谷丰登，万民同庆！', 'culture', fromTurn(5, { notAtWar: true, minStability: 30 }), recurring(5, 15), [option('大肆庆祝', { gold: -50, food: -20, stability: 5, factionSat: commonersReaction(10) }, 3), option('简朴从事', { stability: 2 }, 2)]),
  defineEvent('evt_corruption_expose', '贪腐曝光', '大臣贪墨被揭发！', 'politics', { minCorruption: 40 }, recurring(5, 25), [option('严惩不贷', { corruption: -8, legitimacy: 5, factionSat: noblesReaction(-12) }, 3), option('罚酒三杯', { corruption: -2, legitimacy: -3 }, 2)]),
  defineEvent('evt_bandit_outbreak', '盗匪猖獗', '盗匪占据山头劫掠商路！', 'crisis', { maxStability: 50 }, recurring(5, 20), [option('派兵清剿', { gold: -60, stability: 5, factionSat: militaryReaction(5) }, 3), option('招安安抚', { gold: -30, corruption: 3 }, 2)]),
  defineEvent('evt_foreign_merchants', '外商涌入', '外国商人带来新奇商品！', 'economy', fromTurn(8, { notAtWar: true }), recurring(3, 25), [option('开放市场', { gold: 60, factionSat: fra({ faction: 'merchants', delta: 8 }, { faction: 'commoners', delta: -3 }) }, 3), option('限制准入', { factionSat: fr('merchants', -5) }, 2)]),
  defineEvent('evt_land_reform', '土地改革', '农民要求重新分配土地！', 'politics', { minTurn: 15, factionSatBelow: { faction: 'commoners', threshold: 30 } }, recurring(5, 40), [option('推行改革', { gold: -100, stability: -8, factionSat: fra({ faction: 'commoners', delta: 20 }, { faction: 'nobles', delta: -15 }) }, 2), option('拒绝', { factionSat: commonersReaction(-10), stability: -3 }, 3)]),
  defineEvent('evt_witch_hunt', '猎巫运动', '民间掀起猎巫狂潮！', 'religion', { maxStability: 40 }, recurring(4, 30), [option('顺从民意', { stability: 3, legitimacy: -3, population: -100 }, 2), option('禁止迫害', { stability: -5, factionSat: fr('clergy', -8) }, 3)]),
  defineEvent('evt_diplomatic_envoy', '外交使团', '他国派遣使团来访！', 'diplomacy', fromTurn(5, { notAtWar: true }), recurring(4, 20), [option('隆重接待', { gold: -40, legitimacy: 3, influence: 5 }, 3), option('冷淡应对', { legitimacy: -2 }, 2)]),
  defineEvent('evt_mint_debasement', '劣币铸造之议', '国库吃紧，有人建议铸劣币！', 'economy', fromTurn(10), recurring(4, 30), [option('铸劣币', { gold: 150, corruption: 8, legitimacy: -8 }, 2), option('维持信用', { legitimacy: 5 }, 3)]),
  defineEvent('evt_wall_construction', '城墙修建', '边境省份请求修筑城墙！', 'economy', fromTurn(10), recurring(3, 30), [option('拨款修墙', { gold: -100, stability: 3, factionSat: militaryReaction(5) }, 3), option('暂缓', { stability: -2 }, 2)]),
  defineEvent('evt_scholar_exchange', '学者交流', '异国学者前来交流！', 'science', fromTurn(10, { notAtWar: true }), recurring(3, 25), [option('热情接待', { sciPt: 15, gold: -30 }, 3), option('谨慎对待', { sciPt: 5 }, 2)]),
  defineEvent('evt_granary_fire', '粮仓火灾', '主要粮仓突发大火！', 'crisis', fromTurn(5), recurring(4, 40), [option('全力抢救', { food: -80, gold: -30 }, 3), option('听之任之', { food: -150, stability: -5 }, 1)]),
  defineEvent('evt_naval_discovery', '航海发现', '探险船队发现新岛屿！', 'science', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(2, 50), [option('建立据点', { gold: -100, influence: 10, food: 40 }, 3), option('只绘图记录', { sciPt: 10 }, 2)]),
  defineEvent('evt_conscription_unrest', '征兵暴动', '强制征兵引发民众抗议！', 'crisis', fromTurn(5, { atWar: true }), recurring(5, 20), [option('坚持征兵', { stability: -8, factionSat: fra({ faction: 'military', delta: 5 }, { faction: 'commoners', delta: -12 }) }, 2), option('减少征兵', { factionSat: fra({ faction: 'commoners', delta: 8 }, { faction: 'military', delta: -5 }) }, 3)]),
  // ── B 扩展：35 个新事件，补齐 culture/population/opportunity 等 ──
  defineEvent('evt_culture_flourish', '文治鼎盛', '诗人学者云集京畿，文运昌隆！', 'culture', fromTurn(15, { notAtWar: true, minStability: 50 }), recurring(4, 30), [option('设立翰林院', { gold: -80, sciPt: 20, legitimacy: 8, factionSat: fr('clergy', 15) }, 3), option('民间自流', { sciPt: 5, stability: 3 }, 2)]),
  defineEvent('evt_culture_patron', '艺匠求庇', '名匠寻求皇室庇护，献上奇技！', 'culture', fromTurn(10, { notAtWar: true }), recurring(3, 25), [option('重金礼遇', { gold: -60, influence: 5, factionSat: fr('clergy', 8) }, 3), option('婉拒', { influence: -2 }, 2)]),
  defineEvent('evt_culture_renaissance', '古典文艺复兴', '古典学术复兴，新思潮涌动！', 'culture', { minTurn: 30, techLevelAbove: { branch: 'admin', level: 3 } }, oneTime(2, 60), [option('大力倡导', { gold: -150, sciPt: 40, stability: 5, factionSat: fra({ faction: 'merchants', delta: 20 }, { faction: 'clergy', delta: -8 }) }, 3), option('顺其自然', { sciPt: 15 }, 2)]),
  defineEvent('evt_culture_ban', '异端学说', '新奇学说挑战传统，教会要求查禁！', 'culture', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(4, 35), [option('查禁异端', { stability: 3, sciPt: -10, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'merchants', delta: -15 }) }, 2), option('保护学术', { stability: -4, sciPt: 15, factionSat: fr('clergy', -10) }, 3)]),
  defineEvent('evt_culture_festival', '诸邦朝贺', '诸邦遣使朝贺，国威远扬！', 'culture', fromTurn(25, { notAtWar: true, minStability: 60 }), recurring(3, 50), [option('盛典礼之', { gold: -120, legitimacy: 10, influence: 15 }, 3), option('简礼相待', { legitimacy: 3, influence: 5 }, 2)]),
  defineEvent('evt_pop_boom2', '人丁兴旺', '连年丰稔，人口激增！', 'population', fromTurn(10, { notAtWar: true }), recurring(4, 30), [option('鼓励生育', { food: -50, population: 200, stability: 3 }, 3), option('顺其自然', { population: 100 }, 2)]),
  defineEvent('evt_pop_migration', '流民涌入', '邻邦战乱，大批流民涌入边境！', 'population', fromTurn(8), recurring(4, 25), [option('编户齐民', { population: 150, food: -40, stability: -3, factionSat: commonersReaction(-5) }, 3), option('驱逐出境', { influence: -5, stability: 2 }, 2)]),
  defineEvent('evt_pop_urban', '城市膨胀', '都城人口过载，坊市拥挤！', 'population', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('扩建城郭', { gold: -100, population: 100, stability: 3 }, 3), option('限制流入', { stability: -2, factionSat: fr('merchants', -8) }, 2)]),
  defineEvent('evt_pop_plague_end', '疫后余生', '大疫平息，幸存者休养生息！', 'population', fromTurn(30, { maxStability: 60 }), recurring(3, 50), [option('轻徭薄赋', { gold: -30, population: 100, stability: 5, factionSat: commonersReaction(10) }, 3), option('常态治理', { population: 50 }, 2)]),
  defineEvent('evt_pop_labor_short', '战后劳力短缺', '战乱后田地荒芜，劳力匮乏！', 'population', fromTurn(15, { atWar: true }), recurring(4, 30), [option('招募流民', { gold: -50, population: 80, food: 20 }, 3), option('强制征发', { population: 50, stability: -5, factionSat: commonersReaction(-10) }, 1)]),
  defineEvent('evt_opp_ancient_treasure', '古墓现宝', '农夫掘出上古宝藏！', 'opportunity', fromTurn(10), recurring(2, 50), [option('充公国库', { gold: 200, legitimacy: 3 }, 3), option('赏赐农夫', { gold: 50, stability: 5, factionSat: commonersReaction(8) }, 2)]),
  defineEvent('evt_opp_strategic_location', '险隘归附', '边境险隘守将献关投诚！', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(2, 60), [option('纳降重赏', { gold: -80, influence: 10, stability: 3 }, 3), option('谨慎接纳', { influence: 3 }, 2)]),
  defineEvent('evt_opp_talent', '贤才投效', '异国名士慕名来投！', 'opportunity', fromTurn(12, { notAtWar: true }), recurring(3, 40), [option('破格录用', { gold: -40, sciPt: 15, efficiency: 3 }, 3), option('考察后用', { sciPt: 5 }, 2)]),
  defineEvent('evt_opp_good_omen', '祥瑞降临', '天现祥瑞，万民称庆！', 'opportunity', fromTurn(20, { notAtWar: true, minStability: 40 }), recurring(2, 50), [option('昭告天下', { legitimacy: 8, stability: 5, influence: 5 }, 3), option('秘而不宣', { legitimacy: 2 }, 2)]),
  defineEvent('evt_opp_trade_windfall', '商路暴利', '罕见商队带来巨额利润！', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(2, 45), [option('抽取重税', { gold: 180, factionSat: fr('merchants', -5) }, 3), option('轻税惠民', { gold: 80, factionSat: fr('merchants', 10) }, 2)]),
  defineEvent('evt_opp_mercenary', '雇佣军来投', '百战雇佣军寻求效命！', 'opportunity', fromTurn(10, { atWar: true }), recurring(3, 30), [option('高价雇佣', { gold: -100, factionSat: militaryReaction(10) }, 3), option('婉拒', { stability: 2 }, 2)]),
  defineEvent('evt_opp_dynastic_match', '联姻良缘', '强国王室提议联姻！', 'opportunity', fromTurn(18, { notAtWar: true }), recurring(3, 40), [option('欣然允诺', { gold: -60, influence: 15, legitimacy: 5 }, 3), option('婉言谢绝', { influence: -3 }, 2)]),
  defineEvent('evt_relig_heresy', '异端蔓延', '异端教派在民间扩散！', 'religion', fromTurn(20, { maxStability: 60 }), recurring(4, 35), [option('宗教裁判', { stability: 3, population: -50, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'commoners', delta: -10 }) }, 2), option('辩论感化', { sciPt: 8, stability: -2 }, 3)]),
  defineEvent('evt_relig_temple_grant', '寺庙请田', '大寺请求赐田养僧！', 'religion', fromTurn(15, { notAtWar: true }), recurring(3, 40), [option('慷慨赐田', { gold: -50, food: -30, legitimacy: 5, factionSat: fr('clergy', 15) }, 2), option('限田抑寺', { factionSat: fra({ faction: 'clergy', delta: -12 }, { faction: 'nobles', delta: 5 }) }, 3)]),
  defineEvent('evt_relig_pilgrimage', '朝圣热潮', '信众掀起朝圣热潮！', 'religion', fromTurn(20, { notAtWar: true }), recurring(3, 30), [option('官方护持', { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, 3), option('民间自理', { stability: 2 }, 2)]),
  defineEvent('evt_relig_schism', '教派分裂', '宗教内部爆发教义之争！', 'religion', fromTurn(30), recurring(3, 50), [option('支持正统', { stability: 3, factionSat: fra({ faction: 'clergy', delta: 10 }, { faction: 'commoners', delta: -5 }) }, 2), option('保持中立', { stability: -3, factionSat: fr('clergy', -8) }, 3)]),
  defineEvent('evt_relig_conversion', '异教归化', '边境异教部落请求归化！', 'religion', fromTurn(15, { hasNewTerritory: true }), recurring(3, 40), [option('隆重受礼', { gold: -30, legitimacy: 5, stability: 3, factionSat: fr('clergy', 12) }, 3), option('因俗而治', { stability: 2, factionSat: fr('clergy', -5) }, 2)]),
  defineEvent('evt_sci_astronomy', '天文异象', '客星昼见，司天监请解！', 'science', { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('详记观测', { sciPt: 20, gold: -20 }, 3), option('视为天谴', { stability: -3, legitimacy: -3, factionSat: fr('clergy', 8) }, 1)]),
  defineEvent('evt_sci_invention', '巧匠献器', '工匠发明新式器械！', 'science', { minTurn: 20, techLevelAbove: { branch: 'agri', level: 2 } }, recurring(3, 35), [option('推广民用', { gold: -60, food: 30, sciPt: 10 }, 3), option('军用保密', { gold: -40, factionSat: militaryReaction(8) }, 2)]),
  defineEvent('evt_sci_academy', '学院筹建', '学者请求设立皇家学院！', 'science', { minTurn: 25, techLevelAbove: { branch: 'admin', level: 3 } }, oneTime(2, 60), [option('拨款兴建', { gold: -200, sciPt: 50, efficiency: 5, factionSat: fr('clergy', 20) }, 3), option('暂缓', { factionSat: fr('clergy', -8) }, 2)]),
  defineEvent('evt_sci_translation', '译经运动', '异域典籍传入，请旨翻译！', 'science', fromTurn(20, { notAtWar: true }), recurring(3, 40), [option('设译场', { gold: -80, sciPt: 25, factionSat: fra({ faction: 'clergy', delta: 12 }, { faction: 'merchants', delta: 5 }) }, 3), option('民间自译', { sciPt: 8 }, 2)]),
  defineEvent('evt_dip_alliance_proposal', '结盟之议', '强国主动提议结盟！', 'diplomacy', fromTurn(12, { notAtWar: true }), recurring(3, 30), [option('欣然结盟', { influence: 10, legitimacy: 3, gold: -30 }, 3), option('保持独立', { influence: -2 }, 2)]),
  defineEvent('evt_dip_hostage', '质子之约', '邻国提议互送质子以固盟约！', 'diplomacy', fromTurn(15, { notAtWar: true }), recurring(3, 40), [option('接受', { influence: 8, legitimacy: -3, stability: -2 }, 2), option('拒绝', { influence: -5 }, 3)]),
  defineEvent('evt_dip_trade_embassy', '通商使团', '远方国度遣通商使团！', 'diplomacy', fromTurn(18, { notAtWar: true }), recurring(3, 35), [option('签订条约', { gold: 80, influence: 5, factionSat: fr('merchants', 12) }, 3), option('观望', { influence: 2 }, 2)]),
  defineEvent('evt_dip_border_incident', '边境事件', '边军误入邻邦引发纠纷！', 'diplomacy', fromTurn(8), recurring(4, 25), [option('遣使致歉', { gold: -30, influence: 3 }, 3), option('强硬立场', { influence: -5, stability: 3, factionSat: militaryReaction(8) }, 2)]),
  defineEvent('evt_dip_refugee_crisis', '外交难民危机', '邻邦内乱，难民涌入！', 'diplomacy', fromTurn(20), recurring(3, 35), [option('设营安置', { gold: -80, food: -40, population: 100, influence: 8 }, 3), option('封闭边境', { influence: -8, stability: 2 }, 2)]),
  defineEvent('evt_mil_traitor', '叛将投敌', '边关守将叛逃敌国！', 'military', fromTurn(15, { maxStability: 60 }), recurring(3, 40), [option('悬赏缉拿', { gold: -50, influence: 3, factionSat: militaryReaction(5) }, 3), option('申斥边镇', { stability: -5, factionSat: militaryReaction(-8) }, 2)]),
  defineEvent('evt_mil_victory_parade', '凯旋献俘', '大军凯旋，请行献俘礼！', 'military', fromTurn(10, { notAtWar: true }), recurring(3, 30), [option('隆重献俘', { gold: -40, legitimacy: 8, factionSat: militaryReaction(15) }, 3), option('低调处置', { legitimacy: 2 }, 2)]),
  defineEvent('evt_mil_supply_line', '粮道被断', '敌军袭扰粮道，前线告急！', 'military', fromTurn(10, { atWar: true }), recurring(4, 25), [option('重兵护粮', { gold: -80, food: -30, factionSat: militaryReaction(8) }, 3), option('就地征粮', { food: 20, stability: -8, factionSat: commonersReaction(-15) }, 1)]),
  defineEvent('evt_mil_defection', '敌将来投', '敌国名将率部来降！', 'military', fromTurn(15, { atWar: true }), recurring(3, 40), [option('厚礼接纳', { gold: -60, factionSat: militaryReaction(12), influence: 5 }, 3), option('疑而不用', { stability: -2 }, 2)]),
  defineEvent('evt_mil_fortress_siege', '孤城死守', '边城被围，守将请援！', 'military', fromTurn(12, { atWar: true }), recurring(4, 30), [option('倾国驰援', { gold: -100, food: -50, factionSat: militaryReaction(10) }, 3), option('弃车保帅', { stability: -10, legitimacy: -5, factionSat: militaryReaction(-12) }, 1)]),
  defineEvent('evt_mil_weapon_upgrade', '军械革新', '工坊献上新式兵器！', 'military', { minTurn: 20, techLevelAbove: { branch: 'mil', level: 2 } }, recurring(3, 40), [option('全军换装', { gold: -150, factionSat: militaryReaction(15) }, 3), option('局部试用', { gold: -50, factionSat: militaryReaction(5) }, 2)]),

  // ── C1 事件链（3 条链 × 3 事件 = 9 事件）──
  // 链 1：瘟疫链——爆发→蔓延→余波
  defineEvent('evt_chain_plague_1', '瘟疫爆发', '边镇突发怪病，死者甚众！太医请旨处置。',
    'crisis', fromTurn(15, { maxFoodRatio: 0.8 }), recurring(4, 60), [
    option('封锁疫区', { stability: -5, population: -100, triggerEvent: 'evt_chain_plague_2' }, 3),
    option('请神祈福', { gold: -50, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_plague_2' }, 2),
  ]),
  defineEvent('evt_chain_plague_2', '瘟疫蔓延', '疫病蔓延至京畿，人心惶惶！',
    'crisis', fromTurn(15), followUp, [
    option('隔离救治', { gold: -120, population: -200, stability: -3, triggerEvent: 'evt_chain_plague_3' }, 3),
    option('弃城避疫', { gold: -30, stability: -15, legitimacy: -10, population: -150, triggerEvent: 'evt_chain_plague_3' }, 1),
  ]),
  defineEvent('evt_chain_plague_3', '瘟疫余波', '疫病终于平息，但民生凋敝，请旨善后。',
    'crisis', fromTurn(15), uniqueFollowUp, [
    option('减免赋税', { gold: -80, stability: 8, factionSat: commonersReaction(15), legitimacy: 5 }, 3),
    option('如常征赋', { stability: -5, factionSat: commonersReaction(-12) }, 2),
  ]),

  // 链 2：王位继承链——储君薨→争夺→新朝
  defineEvent('evt_chain_heir_1', '储君暴薨', '太子无疾而终！诸皇子暗中争位。',
    'politics', fromTurn(20, { maxLegitimacy: 70 }), recurring(3, 80), [
    option('立次子为储', { legitimacy: -5, stability: -3, triggerEvent: 'evt_chain_heir_2' }, 3),
    option('暂不立储', { legitimacy: -10, stability: -8, factionSat: noblesReaction(-8), triggerEvent: 'evt_chain_heir_2' }, 1),
  ]),
  defineEvent('evt_chain_heir_2', '夺位之争', '诸皇子明争暗斗，朝臣各立其主！',
    'politics', fromTurn(20), followUp, [
    option('强立一系', { gold: -100, legitimacy: 5, stability: -5, factionSat: noblesReaction(-10), triggerEvent: 'evt_chain_heir_3' }, 2),
    option('廷议公推', { gold: -50, legitimacy: 8, stability: 3, efficiency: -3, triggerEvent: 'evt_chain_heir_3' }, 3),
  ]),
  defineEvent('evt_chain_heir_3', '新储即位', '新储登基，大赦天下以固位。',
    'politics', fromTurn(20), uniqueFollowUp, [
    option('大赦天下', { gold: -60, legitimacy: 15, stability: 10, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: 5 }) }, 3),
    option('低调即位', { legitimacy: 5, stability: 2 }, 2),
    // P3 继承链内战结局——强压异议触发宗室起兵
    option('强压异议', { legitimacy: -10, stability: -8, factionSat: militaryReaction(15), triggerEvent: 'evt_chain_heir_civil' }, 1),
  ]),
  // P3 继承链内战结局——宗室起兵→决战→新朝或割据
  defineEvent('evt_chain_heir_civil', '宗室起兵', '不满新储的宗室藩镇举兵向阙！天下震动，社稷危殆！',
    'crisis', fromTurn(20, { maxLegitimacy: 50 }), followUp, [
    option('御驾亲征', { gold: -200, stability: -10, legitimacy: 8, factionSat: fra({ faction: 'military', delta: 20 }, { faction: 'commoners', delta: -15 }), triggerEvent: 'evt_chain_heir_civil_2' }, 2),
    option('割地安抚', { gold: -100, stability: 5, legitimacy: -15, influence: -10, factionSat: noblesReaction(10), triggerEvent: 'evt_chain_heir_civil_2' }, 3),
  ]),
  defineEvent('evt_chain_heir_civil_2', '内战终局', '叛乱平定或割据成定局，新朝格局已成。',
    'politics', fromTurn(20), uniqueFollowUp, [
    option('重整山河', { gold: -150, stability: 15, legitimacy: 20, efficiency: 5, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'nobles', delta: -8 }) }, 3),
    option('默许割据', { stability: -20, legitimacy: -25, corruption: 10, factionSat: noblesReaction(15) }, 1),
  ]),

  // 链 3：边境冲突链——摩擦→升级→议和
  defineEvent('evt_chain_border_1', '边民冲突', '边民越界耕牧，与邻邦起争执！',
    'diplomacy', fromTurn(10, { notAtWar: true }), recurring(4, 50), [
    option('遣使交涉', { gold: -20, influence: 3, triggerEvent: 'evt_chain_border_2' }, 3),
    option('强硬驱赶', { influence: -3, stability: 2, factionSat: militaryReaction(8), triggerEvent: 'evt_chain_border_2' }, 2),
  ]),
  defineEvent('evt_chain_border_2', '边军对峙', '双方边军对峙，剑拔弩张！',
    'diplomacy', fromTurn(10), followUp, [
    option('主动撤军', { influence: -5, stability: 3, triggerEvent: 'evt_chain_border_3' }, 3),
    option('增兵施压', { gold: -80, factionSat: militaryReaction(12), influence: 2, stability: -2, triggerEvent: 'evt_chain_border_3' }, 2),
  ]),
  defineEvent('evt_chain_border_3', '边境议和', '双方遣使议和，重定疆界。',
    'diplomacy', fromTurn(10), uniqueFollowUp, [
    option('缔结和约', { gold: -40, influence: 8, legitimacy: 3, stability: 5 }, 3),
    option('暂置不议', { stability: -2, influence: -2 }, 2),
  ]),

  // ── E15 扩展事件链（2 条 × 3 事件 = 6 事件）──
  // 链 4：旱灾链——大旱→饥荒→流民
  defineEvent('evt_chain_drought_1', '赤地千里', '连月不雨，禾苗枯焦，赤地千里！太史奏旱。',
    'crisis', fromTurn(8, { maxFoodRatio: 0.9 }), recurring(5, 70), [
    option('开仓赈灾', { food: -120, stability: 5, factionSat: commonersReaction(8), triggerEvent: 'evt_chain_drought_2' }, 3),
    option('祈雨祭天', { gold: -60, legitimacy: 3, stability: 2, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_drought_2' }, 2),
  ]),
  defineEvent('evt_chain_drought_2', '饥荒蔓延', '粮价飞涨，饿殍遍野，饥民聚众求食！',
    'crisis', fromTurn(8), followUp, [
    option('强制平粜', { gold: -100, stability: 3, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'merchants', delta: -15 }), triggerEvent: 'evt_chain_drought_3' }, 3),
    option('放任粮价', { population: -300, stability: -10, factionSat: commonersReaction(-20), triggerEvent: 'evt_chain_drought_3' }, 1),
  ]),
  defineEvent('evt_chain_drought_3', '流民四散', '灾民背井离乡，流民潮席卷诸省！',
    'crisis', fromTurn(8), uniqueFollowUp, [
    option('编户安置', { gold: -80, food: -40, stability: 8, population: 200, factionSat: commonersReaction(12) }, 3),
    option('遣散回乡', { population: -150, stability: -5, legitimacy: -5 }, 2),
  ]),

  // 链 5：盛世衰落链——奢靡→乱政→中兴
  defineEvent('evt_chain_decline_1', '奢靡之风', '宫廷奢靡，权贵斗富，民风渐浮！',
    'politics', fromTurn(25, { minStability: 50, minGold: 500 }), recurring(3, 100), [
    option('提倡节俭', { stability: 5, legitimacy: 5, factionSat: noblesReaction(-10), triggerEvent: 'evt_chain_decline_2' }, 3),
    option('纵容浮华', { gold: -100, corruption: 8, stability: -3, factionSat: noblesReaction(12), triggerEvent: 'evt_chain_decline_2' }, 1),
  ]),
  defineEvent('evt_chain_decline_2', '吏治败坏', '贪墨横行，政令不出京畿，行政瘫痪！',
    'politics', fromTurn(25, { minCorruption: 40 }), followUp, [
    option('严惩贪吏', { gold: -120, corruption: -10, stability: -5, factionSat: noblesReaction(-15), triggerEvent: 'evt_chain_decline_3' }, 3),
    option('得过且过', { corruption: 5, efficiency: -5, legitimacy: -8, triggerEvent: 'evt_chain_decline_3' }, 1),
  ]),
  defineEvent('evt_chain_decline_3', '中兴之机', '乱象毕露，朝野呼吁改革图强！',
    'opportunity', fromTurn(25), uniqueFollowUp, [
    option('力行新政', { gold: -200, stability: -8, legitimacy: 15, efficiency: 8, factionSat: fra({ faction: 'commoners', delta: 15 }, { faction: 'nobles', delta: -10 }) }, 3),
    option('徐图整顿', { gold: -80, stability: 3, efficiency: 3, legitimacy: 5 }, 2),
  ]),

  // ── E15 王朝继位玩家干预事件（dynasty 引擎触发）──
  defineEvent('evt_dynasty_heir_birth', '储君降生', '后宫诞下龙裔，举国欢庆！请定储君之名。',
    'politics', fromTurn(1), followUp, [
    option('立为储君', { legitimacy: 10, stability: 5, factionSat: noblesReaction(12) }, 3),
    option('暂不立储', { legitimacy: -3, stability: -2, factionSat: noblesReaction(-8) }, 1),
  ]),
  defineEvent('evt_dynasty_ruler_decline', '君王老迈', '主春秋年迈，精力渐衰，朝臣请预立储以固国本。',
    'politics', fromTurn(30), followUp, [
    option('禅让储君', { legitimacy: 5, stability: 8, factionSat: noblesReaction(10) }, 3),
    option('勉力视朝', { stability: -3, legitimacy: -5, factionSat: noblesReaction(-5) }, 2),
  ]),

  // ── P3 扩展事件链 6-9 + 独立事件（目标 150+）──
  // 链 6：科技突破链——灵感→试验→应用或事故
  defineEvent('evt_chain_tech_1', '异象启思', '夜观星象，学者忽得灵感，称可革新农具！',
    'science', { minTurn: 12, techLevelAbove: { branch: 'agri', level: 1 } }, recurring(4, 80), [
    option('拨金资助', { gold: -80, sciPt: 10, factionSat: fr('clergy', -5), triggerEvent: 'evt_chain_tech_2' }, 3),
    option('观其自成', { sciPt: 3, triggerEvent: 'evt_chain_tech_2' }, 2),
  ]),
  defineEvent('evt_chain_tech_2', '工坊试验', '学者于工坊中反复试验，成败参半！',
    'science', fromTurn(12), followUp, [
    option('追加投入', { gold: -120, sciPt: 8, efficiency: 3, triggerEvent: 'evt_chain_tech_3' }, 3),
    option('谨慎推进', { gold: -40, sciPt: 4, triggerEvent: 'evt_chain_tech_3' }, 2),
  ]),
  defineEvent('evt_chain_tech_3', '革新问世', '新农具问世，粮产可期！然旧匠抵制新技术。',
    'opportunity', fromTurn(12), uniqueFollowUp, [
    option('全面推广', { gold: -60, food: 80, factionSat: fra({ faction: 'commoners', delta: 12 }, { faction: 'nobles', delta: -8 }) }, 3),
    option('缓慢渗透', { food: 30, sciPt: 5 }, 2),
  ]),

  // 链 7：文化输入链——异邦艺术→风靡→本土化或文化冲突
  defineEvent('evt_chain_culture_1', '异邦献艺', '异邦使团献上奇珍乐舞，朝野为之倾倒！',
    'culture', fromTurn(15, { notAtWar: true }), recurring(4, 90), [
    option('盛情接纳', { gold: -40, influence: 5, legitimacy: 3, triggerEvent: 'evt_chain_culture_2' }, 3),
    option('谨慎观赏', { influence: 2, triggerEvent: 'evt_chain_culture_2' }, 2),
  ]),
  defineEvent('evt_chain_culture_2', '风尚风靡', '异邦艺术在上流社会风靡，本土艺人抗议声起！',
    'culture', fromTurn(15), followUp, [
    option('提倡融合', { gold: -60, influence: 8, factionSat: fr('clergy', -8), triggerEvent: 'evt_chain_culture_3' }, 3),
    option('压制异风', { influence: -5, stability: 3, factionSat: fr('clergy', 10), triggerEvent: 'evt_chain_culture_3' }, 2),
  ]),
  defineEvent('evt_chain_culture_3', '文化定调', '风气之争终有定论，帝国文化走向何方？',
    'culture', fromTurn(15), uniqueFollowUp, [
    option('兼容并蓄', { gold: -80, influence: 12, legitimacy: 8, assimilationMod: 1 }, 3),
    option('固守正统', { legitimacy: 5, influence: -3, factionSat: fr('clergy', 15) }, 2),
  ]),

  // 链 8：联盟瓦解链——盟国生疑→摩擦→决裂或修复
  defineEvent('evt_chain_alliance_1', '盟国生疑', '盟国使臣旁敲侧击，疑你有背盟之意！',
    'diplomacy', fromTurn(10, { notAtWar: true }), recurring(4, 70), [
    option('遣使重申盟约', { gold: -50, influence: 5, triggerEvent: 'evt_chain_alliance_2' }, 3),
    option('置之不理', { influence: -8, stability: 2, triggerEvent: 'evt_chain_alliance_2' }, 2),
  ]),
  defineEvent('evt_chain_alliance_2', '边境摩擦', '盟国边军与己方商队发生摩擦！',
    'diplomacy', fromTurn(10), followUp, [
    option('赔礼道歉', { gold: -80, influence: 3, legitimacy: -3, triggerEvent: 'evt_chain_alliance_3' }, 3),
    option('强硬索赔', { gold: 30, influence: -10, factionSat: militaryReaction(8), triggerEvent: 'evt_chain_alliance_3' }, 2),
  ]),
  defineEvent('evt_chain_alliance_3', '盟约抉择', '盟国递交最后通牒，是和是裂？',
    'diplomacy', fromTurn(10), uniqueFollowUp, [
    option('修复盟约', { gold: -100, influence: 10, legitimacy: 5, factionSat: fr('merchants', 8) }, 3),
    option('听任决裂', { influence: -15, stability: 5, factionSat: militaryReaction(12) }, 2),
  ]),

  // 链 9：移民潮链——流民入境→安置压力→同化或排斥
  defineEvent('evt_chain_migrate_1', '流民叩边', '邻邦大乱，数万流民叩关求附！',
    'population', fromTurn(12), recurring(5, 80), [
    option('开关纳之', { food: -80, population: 400, stability: -3, triggerEvent: 'evt_chain_migrate_2' }, 2),
    option('闭关拒之', { legitimacy: -5, influence: -3, factionSat: commonersReaction(5), triggerEvent: 'evt_chain_migrate_2' }, 3),
  ]),
  defineEvent('evt_chain_migrate_2', '安置之困', '流民聚居边省，与本地民众争田争水！',
    'population', fromTurn(12), followUp, [
    option('编户齐民', { gold: -100, food: -40, population: 200, efficiency: 3, triggerEvent: 'evt_chain_migrate_3' }, 3),
    option('设栅隔离', { gold: -30, stability: -5, factionSat: commonersReaction(-10), triggerEvent: 'evt_chain_migrate_3' }, 2),
  ]),
  defineEvent('evt_chain_migrate_3', '融合或排斥', '流民问题终须解决，帝国包容性面临考验。',
    'population', fromTurn(12), uniqueFollowUp, [
    option('一视同仁', { gold: -60, population: 150, influence: 8, assimilationMod: 1, factionSat: commonersReaction(8) }, 3),
    option('区别对待', { stability: -8, corruption: 5, factionSat: noblesReaction(8) }, 2),
  ]),

  // ── 独立事件扩展（覆盖 science/culture/population/diplomacy 稀缺分类）──
  defineEvent('evt_library_fire', '学院失火', '皇家学院深夜失火，典籍付之一炬！', 'science', { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 50), [option('全力抢救', { gold: -100, sciPt: -10, stability: 3 }, 3), option('听之任之', { sciPt: -25, legitimacy: -5 }, 2)]),
  defineEvent('evt_scientist_defect', '学者投奔', '异邦知名学者请求政治庇护！', 'science', fromTurn(12, { notAtWar: true }), recurring(3, 40), [option('接纳重用', { gold: 50, sciPt: 20, influence: -3 }, 3), option('婉拒遣返', { influence: 5, legitimacy: 3 }, 2)]),
  defineEvent('evt_alchemy_craze', '炼金狂热', '宫廷兴起炼金热潮，方士声称能点石成金！', 'science', fromTurn(15), recurring(4, 35), [option('资助试验', { gold: -150, corruption: 5, factionSat: fr('clergy', -10) }, 2), option('斥为邪术', { legitimacy: 3, factionSat: fr('clergy', 12) }, 3)]),
  defineEvent('evt_cultural_revival', '文化复兴运动', '古典文化复兴运动席卷学界！', 'culture', { minTurn: 20, minStability: 50, techLevelAbove: { branch: 'culture', level: 2 } }, recurring(3, 60), [option('大力倡导', { gold: -100, influence: 15, legitimacy: 8, sciPt: 10 }, 3), option('顺其自然', { influence: 5, sciPt: 3 }, 2)]),
  defineEvent('evt_temple_construction', '庙宇大兴', '神职团体请建大庙，信众踊跃捐资！', 'culture', fromTurn(10, { minStability: 40 }), recurring(4, 40), [option('钦准督建', { gold: -80, legitimacy: 8, influence: 5, factionSat: fr('clergy', 15) }, 3), option('民办官助', { gold: -30, factionSat: fr('clergy', 8) }, 2)]),
  defineEvent('evt_festival_grand', '帝国大典', '藩属遣使朝贺，帝国威仪远播！', 'culture', fromTurn(25, { minStability: 60, notAtWar: true }), recurring(3, 50), [option('盛大庆贺', { gold: -150, influence: 20, legitimacy: 10, factionSat: noblesReaction(10) }, 3), option('简礼相待', { gold: -40, influence: 8 }, 2)]),
  defineEvent('evt_plague_quarantine', '检疫之争', '边境发现疫病，是否封锁边境？', 'population', fromTurn(15), recurring(4, 40), [option('严格隔离', { gold: -60, population: -50, stability: -3, factionSat: fr('merchants', -12) }, 3), option('有限检查', { population: -150, stability: 2 }, 2)]),
  defineEvent('evt_diplomatic_marriage', '和亲之议', '强国遣使求和亲，欲结秦晋之好！', 'diplomacy', fromTurn(15, { notAtWar: true }), recurring(4, 50), [option('允诺和亲', { gold: 100, influence: 15, legitimacy: -3, factionSat: noblesReaction(-8) }, 3), option('婉言谢绝', { influence: -5, stability: 3 }, 2)]),
  defineEvent('evt_trade_embargo', '他国禁运', '邻邦联合对你的商品实施禁运！', 'diplomacy', fromTurn(18), recurring(5, 40), [option('寻求新商路', { gold: -100, influence: 5, factionSat: fr('merchants', 8) }, 3), option('反制禁运', { gold: -50, influence: -8, stability: 3 }, 2)]),
  defineEvent('evt_border_demarcate', '勘界定疆', '与邻国勘定边界，争议之地如何处置？', 'diplomacy', fromTurn(10, { notAtWar: true }), recurring(3, 50), [option('据理力争', { gold: -40, influence: 5, factionSat: militaryReaction(8) }, 2), option('互让妥协', { gold: 20, influence: 8, legitimacy: 3 }, 3)]),
  defineEvent('evt_secret_treaty', '密约曝光', '你与他国的秘密条约被泄露，朝野哗然！', 'diplomacy', fromTurn(20), recurring(4, 60), [option('公开承认', { legitimacy: -8, influence: 5, stability: -3 }, 2), option('矢口否认', { legitimacy: -3, influence: -10, corruption: 3 }, 3)]),

  // ── P-fix 补齐事件到 150（覆盖 science/culture/population/diplomacy/opportunity）──
  defineEvent('evt_sci_observatory', '观星台', '天文学家请建观星台，观测星象以推历法！', 'science', { minTurn: 18, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 50), [option('拨款兴建', { gold: -120, sciPt: 30, influence: 5 }, 3), option('民间观测', { sciPt: 8 }, 2)]),
  defineEvent('evt_sci_water_mill', '水力磨坊', '工匠发明水力磨坊，粮产加工效率大增！', 'science', { minTurn: 14, techLevelAbove: { branch: 'agri', level: 2 } }, recurring(4, 40), [option('推广全国', { gold: -80, food: 50, factionSat: commonersReaction(8) }, 3), option('限皇家专用', { gold: -30, food: 15 }, 2)]),
  defineEvent('evt_sci_medical_text', '医典编纂', '太医奉旨编纂医典，汇天下方术！', 'science', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 3 } }, recurring(3, 50), [option('颁行天下', { gold: -100, sciPt: 20, stability: 5, population: 100 }, 3), option('秘藏内府', { sciPt: 10, factionSat: fr('clergy', 5) }, 2)]),
  defineEvent('evt_culture_poet', '诗人献赋', '名诗人献颂赋，辞藻华美，朝野传诵！', 'culture', fromTurn(12, { minStability: 40 }), recurring(4, 30), [option('厚赏赐爵', { gold: -40, legitimacy: 5, influence: 3, factionSat: fr('clergy', 8) }, 3), option('口头嘉奖', { legitimacy: 2 }, 2)]),
  defineEvent('evt_culture_architecture', '宫室营建', '匠师献新图样，请建宏伟宫室以彰国威！', 'culture', fromTurn(22, { minStability: 50, minGold: 300 }), recurring(3, 60), [option('大兴土木', { gold: -250, legitimacy: 10, influence: 8, factionSat: noblesReaction(12) }, 2), option('简朴从事', { legitimacy: 3, factionSat: commonersReaction(5) }, 3)]),
  defineEvent('evt_culture_relic', '古寺圣物出土', '古寺出土圣物，信众蜂拥朝拜！', 'culture', fromTurn(18, { notAtWar: true }), recurring(3, 50), [option('迎入京畿', { gold: -60, legitimacy: 8, factionSat: fr('clergy', 15), influence: 5 }, 3), option('留寺供奉', { stability: 3, factionSat: fr('clergy', 8) }, 2)]),
  defineEvent('evt_pop_urbanization', '市井繁兴', '都城商市繁兴，百业云集！', 'population', { minTurn: 16, minStability: 50, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('规范市坊', { gold: 60, efficiency: 3, factionSat: fr('merchants', 10) }, 3), option('任其发展', { gold: 40, corruption: 3 }, 2)]),
  defineEvent('evt_pop_infant', '婴殇之痛', '都城婴夭率高，太医请设育婴局！', 'population', fromTurn(14), recurring(4, 40), [option('设局哺育', { gold: -80, population: 80, stability: 3, factionSat: commonersReaction(12) }, 3), option('听天由命', { population: -50, factionSat: commonersReaction(-8) }, 2)]),
  defineEvent('evt_dip_tribute', '藩属朝贡', '远方藩属遣使朝贡珍异物产！', 'diplomacy', fromTurn(20, { notAtWar: true, minStability: 50 }), recurring(3, 40), [option('厚往薄来', { gold: -100, influence: 15, legitimacy: 8 }, 3), option('常礼相待', { gold: -30, influence: 5 }, 2)]),
  defineEvent('evt_dip_mediation', '邻邦请调', '两邻邦开战，双方皆请我国调停！', 'diplomacy', fromTurn(18, { notAtWar: true }), recurring(3, 50), [option('出面斡旋', { gold: -60, influence: 20, legitimacy: 5, sciPt: 5 }, 3), option('保持中立', { influence: -3, stability: 2 }, 2)]),
  defineEvent('evt_opp_granary_surplus', '粮仓充盈', '连年丰收，粮仓满溢，如何处置？', 'opportunity', fromTurn(12, { notAtWar: true }), recurring(3, 30), [option('平价出粜', { gold: 100, food: -80, factionSat: fr('merchants', 8) }, 3), option('备荒储备', { stability: 5, factionSat: commonersReaction(5) }, 2)]),
  defineEvent('evt_opp_mercenary_captain', '雇佣兵首领', '百战雇佣兵首领率部来投，愿为前锋！', 'opportunity', fromTurn(14, { atWar: true }), recurring(3, 40), [option('委以重任', { gold: -80, factionSat: militaryReaction(15), influence: 3 }, 3), option('存疑不用', { stability: -2, factionSat: militaryReaction(-5) }, 2)]),
  defineEvent('evt_opp_good_harvest_chain', '连年丰稔', '连续丰收，百姓富足，国库充盈！', 'opportunity', fromTurn(16, { notAtWar: true, minStability: 60 }), recurring(2, 60), [option('减免赋税', { gold: -100, stability: 8, factionSat: commonersReaction(15), legitimacy: 5 }, 3), option('充实国库', { gold: 200, factionSat: commonersReaction(-5) }, 2)]),
  // ── D1: 扩充至 300+ 事件（每类别 ≥8） ──
  defineEvent('evt_locust', '蝗灾', '蝗虫过境，寸草不生！', 'crisis', fromTurn(8), recurring(4, 35), [option('组织灭蝗', { gold: -60, food: -80, stability: 3 }, 3), option('祈天求雨', { food: -120, legitimacy: -3 }, 2)]),
  defineEvent('evt_flood', '洪涝', '暴雨成灾，良田被淹！', 'crisis', fromTurn(6), recurring(5, 30), [option('筑堤救灾', { gold: -100, food: -60, stability: 4 }, 3), option('转移高地', { food: -40, population: -80 }, 2)]),
  defineEvent('evt_blight', '疫病侵袭庄稼', '作物大面积枯萎！', 'crisis', fromTurn(10), recurring(3, 40), [option('焚田防疫', { food: -150, stability: -3 }, 2), option('寻求良种', { gold: -50, food: -80 }, 3)]),
  defineEvent('evt_hail', '冰雹', '突降冰雹，毁坏庄稼！', 'crisis', {}, recurring(3, 50), [option('开仓赈济', { food: -60, gold: -40, stability: 5 }, 3), option('自力更生', { food: -100, stability: -3 }, 2)]),
  defineEvent('evt_famine_riot', '饥民暴动', '饥饿的民众冲击粮仓！', 'crisis', { maxFoodRatio: 0.4 }, recurring(8, 20), [option('镇压', { gold: -40, stability: -5, factionSat: militaryReaction(5) }, 2), option('放粮安抚', { food: -100, stability: 5, factionSat: commonersReaction(10) }, 3)]),
  defineEvent('evt_wolf_plague', '兽疫', '牲畜大批死亡！', 'crisis', fromTurn(12), recurring(3, 40), [option('隔离焚烧', { food: -50, gold: -30 }, 3), option('求医问药', { gold: -60, food: -30 }, 2)]),
  defineEvent('evt_noble_exile', '贵族流亡', '失势贵族逃亡他国！', 'politics', { maxLegitimacy: 30 }, recurring(4, 30), [option('通缉追回', { gold: -50, legitimacy: 3 }, 2), option('任其去留', { factionSat: noblesReaction(-8), stability: 2 }, 3)]),
  defineEvent('evt_noble_marriage', '贵族联姻', '两大贵族家族联姻，势力坐大！', 'politics', fromTurn(10), recurring(3, 35), [option('赐婚支持', { gold: -40, factionSat: noblesReaction(12), legitimacy: 3 }, 3), option('从中作梗', { factionSat: noblesReaction(-10), stability: -3 }, 2)]),
  defineEvent('evt_noble_disinherit', '夺爵', '贵族子弟被夺爵，引发争议！', 'politics', fromTurn(8), recurring(4, 25), [option('维持原判', { factionSat: noblesReaction(-12), legitimacy: 5 }, 2), option('恢复爵位', { factionSat: noblesReaction(8), gold: -60 }, 3)]),
  defineEvent('evt_faction_civil_war', '派系内战', '两大派系公开冲突！', 'politics', { maxStability: 35 }, recurring(7, 20), [option('支持一方', { stability: -8, legitimacy: -5 }, 2), option('调停', { gold: -80, stability: 3 }, 3)]),
  defineEvent('evt_merchant_smuggle', '走私猖獗', '商人走私逃税严重！', 'politics', { minCorruption: 25 }, recurring(5, 20), [option('严打走私', { gold: 60, factionSat: fr('merchants', -10), corruption: -3 }, 2), option('睁只眼闭只眼', { corruption: 5, factionSat: fr('merchants', 5) }, 3)]),
  defineEvent('evt_merchant_monopoly', '行会垄断', '商人行会垄断市场！', 'politics', fromTurn(15), recurring(3, 35), [option('打破垄断', { gold: -50, factionSat: fra({ faction: 'merchants', delta: -15 }, { faction: 'commoners', delta: 10 }) }, 3), option('收税了事', { gold: 80, corruption: 3 }, 2)]),
  defineEvent('evt_military_coup_attempt', '兵变未遂', '部分将领密谋兵变！', 'politics', { factionSatBelow: { faction: 'military', threshold: 15 }, maxLegitimacy: 35 }, recurring(9, 50), [option('铁腕镇压', { gold: -100, stability: -8, factionSat: militaryReaction(-15) }, 2), option('安抚军心', { gold: -80, factionSat: militaryReaction(10), stability: -3 }, 3)]),
  defineEvent('evt_military_veteran', '老兵安置', '退役老兵无以为生！', 'politics', fromTurn(12), recurring(4, 25), [option('赐田安置', { gold: -60, factionSat: militaryReaction(10), stability: 3 }, 3), option('不予理睬', { factionSat: militaryReaction(-12), stability: -3 }, 2)]),
  defineEvent('evt_military_mutiny', '哗变', '欠饷士兵哗变！', 'politics', { factionSatBelow: { faction: 'military', threshold: 10 } }, recurring(10, 30), [option('镇压', { gold: -80, stability: -10, factionSat: militaryReaction(-8) }, 2), option('补发欠饷', { gold: -120, factionSat: militaryReaction(15), stability: 3 }, 3)]),
  defineEvent('evt_trade_embargo_hit', '贸易禁运冲击', '他国对我国禁运！', 'economy', fromTurn(10), recurring(5, 30), [option('自给自足', { gold: -50, stability: 3 }, 3), option('寻找替代', { gold: -80, influence: 3 }, 2)]),
  defineEvent('evt_inflation', '通胀', '物价飞涨，民怨沸腾！', 'economy', { minCorruption: 40 }, recurring(5, 25), [option('紧缩银根', { gold: -80, stability: 3, corruption: -3 }, 3), option('放任不管', { factionSat: commonersReaction(-12), corruption: 5 }, 2)]),
  defineEvent('evt_devaluation', '币值崩跌', '铸币掺假，币值暴跌！', 'economy', { minCorruption: 50 }, recurring(4, 30), [option('整顿币制', { gold: -100, legitimacy: 5, corruption: -5 }, 3), option('借机牟利', { gold: 150, corruption: 8, factionSat: fr('merchants', -10) }, 2)]),
  defineEvent('evt_resource_shortage', '资源短缺', '铁矿木材严重不足！', 'economy', fromTurn(8), recurring(4, 25), [option('高价采购', { gold: -80, iron: 20, wood: 20 }, 3), option('限制消耗', { factionSat: militaryReaction(-8), stability: -2 }, 2)]),
  defineEvent('evt_caravan_arrival', '商队抵达', '远方商队带来珍奇货物！', 'economy', fromTurn(5, { notAtWar: true }), recurring(4, 20), [option('设市交易', { gold: 80, factionSat: fr('merchants', 8) }, 3), option('征收关税', { gold: 120, factionSat: fr('merchants', -5) }, 2)]),
  defineEvent('evt_bank_loan', '钱庄借贷', '钱庄愿借巨款！', 'economy', fromTurn(10), recurring(3, 40), [option('接受借贷', { gold: 300, corruption: 5 }, 3), option('婉拒', { legitimacy: 3 }, 2)]),
  defineEvent('evt_market_crash', '市崩', '市场恐慌，物价暴跌！', 'economy', fromTurn(15), recurring(3, 50), [option('抄底收购', { gold: -150, stability: -5 }, 2), option('稳定市价', { gold: -80, stability: 5 }, 3)]),
  defineEvent('evt_frontline_victory', '前线大捷', '我军大破敌军！', 'military', { atWar: true }, recurring(6, 10), [option('乘胜追击', { gold: -50, factionSat: militaryReaction(12), stability: 5 }, 2), option('见好就收', { legitimacy: 5, factionSat: militaryReaction(-3) }, 3)]),
  defineEvent('evt_siege', '围城', '敌军围困我方城池！', 'military', { atWar: true }, recurring(7, 15), [option('死守待援', { food: -80, gold: -40, stability: 3 }, 3), option('突围', { gold: -60, stability: -5, factionSat: militaryReaction(5) }, 2)]),
  defineEvent('evt_deserter', '逃兵', '大批士兵逃亡！', 'military', { minWarExhaustion: 50 }, recurring(6, 20), [option('严惩逃兵', { factionSat: militaryReaction(5), stability: -3 }, 2), option('改善待遇', { gold: -80, factionSat: militaryReaction(10) }, 3)]),
  defineEvent('evt_conscription_resistance', '抗征', '民众抗拒征兵！', 'military', fromTurn(8), recurring(5, 20), [option('强制征兵', { factionSat: commonersReaction(-15), stability: -5 }, 2), option('减少征额', { factionSat: commonersReaction(8), stability: 2 }, 3)]),
  defineEvent('evt_war_profit', '战争财', '军需旺盛，商人发战争财！', 'military', { atWar: true, minTurn: 10 }, recurring(3, 25), [option('征收战争税', { gold: 100, factionSat: fr('merchants', -8) }, 2), option('鼓励供应', { gold: 50, factionSat: fr('merchants', 5) }, 3)]),
  defineEvent('evt_alliance_proposal', '同盟邀请', '他国提议结盟！', 'diplomacy', { notAtWar: true, minTurn: 8 }, recurring(5, 25), [option('同意结盟', { influence: 10, legitimacy: 3 }, 3), option('婉拒', { influence: -3 }, 2)]),
  defineEvent('evt_treaty_break', '毁约', '盟国单方面撕毁条约！', 'diplomacy', fromTurn(15), recurring(4, 30), [option('强烈抗议', { legitimacy: 5, stability: -3 }, 2), option('忍气吞声', { legitimacy: -8, factionSat: noblesReaction(-10) }, 3)]),
  defineEvent('evt_hostage_return', '质子归还', '他国归还人质！', 'diplomacy', fromTurn(20, { notAtWar: true }), recurring(3, 40), [option('善待归国', { legitimacy: 5, stability: 3 }, 3), option('冷待', { factionSat: noblesReaction(-5) }, 2)]),
  defineEvent('evt_pirate_attack', '海盗袭击', '海盗劫掠沿海！', 'diplomacy', fromTurn(8), recurring(5, 20), [option('出兵剿灭', { gold: -60, factionSat: militaryReaction(8), stability: 3 }, 3), option('招安', { gold: -30, corruption: 5 }, 2)]),
  defineEvent('evt_tribute_demand', '索贡', '强国要求进贡！', 'diplomacy', fromTurn(12), recurring(4, 30), [option('忍辱进贡', { gold: -100, legitimacy: -5, stability: -3 }, 3), option('拒绝', { legitimacy: 8, stability: -5 }, 2)]),
  defineEvent('evt_cultural_exchange', '文化交流', '他国学者来访交流！', 'diplomacy', { notAtWar: true, minTurn: 10 }, recurring(3, 30), [option('热烈欢迎', { sciPt: 8, influence: 5, gold: -30 }, 3), option('谨慎对待', { sciPt: 3 }, 2)]),
  defineEvent('evt_heresy', '异端', '异端教派兴起！', 'religion', fromTurn(10, { maxStability: 50 }), recurring(5, 25), [option('镇压异端', { stability: -5, factionSat: fr('clergy', 10), legitimacy: 3 }, 2), option('宽容对待', { factionSat: fr('clergy', -12), stability: 3 }, 3)]),
  defineEvent('evt_holy_war_call', '圣战号召', '宗教领袖号召圣战！', 'religion', fromTurn(20), recurring(3, 50), [option('响应号召', { factionSat: fr('clergy', 15), stability: -5, legitimacy: 5 }, 2), option('拒绝', { factionSat: fr('clergy', -15), stability: 3 }, 3)]),
  defineEvent('evt_shrine_miracle', '神迹', '神殿现异象，信徒蜂拥！', 'religion', fromTurn(15, { minStability: 40 }), recurring(2, 60), [option('大肆宣扬', { legitimacy: 8, factionSat: fr('clergy', 12), influence: 5 }, 3), option('低调处理', { legitimacy: 2 }, 2)]),
  defineEvent('evt_monastery_land', '寺院占地', '寺院广占良田！', 'religion', fromTurn(12, { minCorruption: 20 }), recurring(4, 30), [option('没收还田', { food: 50, factionSat: fr('clergy', -15), legitimacy: -3 }, 3), option('维持现状', { factionSat: fr('clergy', 5), corruption: 3 }, 2)]),
  defineEvent('evt_tech_academy', '学府争鸣', '各学派激烈论战！', 'science', { minTurn: 10, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 30), [option('资助研究', { gold: -60, sciPt: 10, factionSat: noblesReaction(-5) }, 3), option('限制争论', { stability: 3, sciPt: -3 }, 2)]),
  defineEvent('evt_tech_leak', '技术外流', '核心机密被他国窃取！', 'science', fromTurn(15), recurring(3, 40), [option('追查内鬼', { gold: -50, stability: -3 }, 3), option('加速研发', { gold: -80, sciPt: 8 }, 2)]),
  defineEvent('evt_tech_craft_guild', '工匠行会', '工匠组织行会保护秘方！', 'science', fromTurn(8), recurring(3, 30), [option('支持行会', { gold: -30, sciPt: 5, factionSat: fr('merchants', 5) }, 3), option('打破垄断', { sciPt: -2, factionSat: fr('merchants', -8) }, 2)]),
  defineEvent('evt_tech_invention', '发明', '工匠发明新工具！', 'science', { techLevelAbove: { branch: 'agri', level: 2 } }, recurring(3, 35), [option('推广使用', { gold: -40, food: 30, sciPt: 3 }, 3), option('保守秘密', { sciPt: 5, influence: 2 }, 2)]),
  defineEvent('evt_granary_rot', '粮仓霉变', '储粮大量霉变！', 'crisis', fromTurn(10), recurring(4, 30), [option('紧急清理', { food: -80, gold: -30 }, 3), option('听之任之', { food: -150, stability: -5 }, 2)]),
  defineEvent('evt_road_bandit', '路匪', '盗匪盘踞要道！', 'crisis', { maxStability: 45 }, recurring(5, 20), [option('派兵清剿', { gold: -40, stability: 5, factionSat: militaryReaction(5) }, 3), option('绕道', { gold: -20, factionSat: fr('merchants', -5) }, 2)]),
  defineEvent('evt_pop_plague', '时疫', '疫病在都城蔓延！', 'population', fromTurn(15), recurring(5, 30), [option('封城隔离', { gold: -80, population: -100, stability: -3 }, 3), option('放任', { population: -300, stability: -8 }, 2)]),
  defineEvent('evt_pop_festival', '万民同庆', '国泰民安，万民欢庆！', 'population', { minStability: 60, notAtWar: true, minTurn: 10 }, recurring(3, 30), [option('大赦天下', { gold: -50, stability: 8, legitimacy: 5, factionSat: commonersReaction(10) }, 3), option('照常', { stability: 2 }, 2)]),
  defineEvent('evt_opp_relic', '传说圣物现世', '传说圣物被发掘！', 'opportunity', fromTurn(20), recurring(2, 60), [option('供奉展示', { gold: -30, legitimacy: 10, factionSat: fr('clergy', 15), influence: 8 }, 3), option('秘藏', { legitimacy: 3 }, 2)]),
  defineEvent('evt_opp_annex', '邻国内乱', '邻国陷入内乱，有机可乘！', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(3, 40), [option('趁虚而入', { gold: -100, stability: -5, influence: 10 }, 2), option('静观其变', { stability: 3 }, 3)]),
  defineEvent('evt_opp_trade_monopoly', '独占商路', '竞争对手退出，商路独占！', 'opportunity', { notAtWar: true, minTurn: 12 }, recurring(2, 40), [option('大举扩张', { gold: 150, factionSat: fr('merchants', 12) }, 3), option('稳扎稳打', { gold: 60, stability: 3 }, 2)]),
  defineEvent('evt_opp_goldmine', '金矿发现', '探矿者发现大金矿！', 'opportunity', fromTurn(20), recurring(2, 50), [option('全力开采', { gold: 300, corruption: 8, factionSat: noblesReaction(10) }, 3), option('适度开采', { gold: 100, corruption: 3 }, 2)]),
  defineEvent('evt_culture_propaganda', '文化输出', '他国仰慕我国文化！', 'culture', fromTurn(15, { notAtWar: true, minStability: 50 }), recurring(3, 30), [option('积极推广', { gold: -40, influence: 12, legitimacy: 3 }, 3), option('来者不拒', { influence: 5 }, 2)]),
  defineEvent('evt_culture_decay', '文化衰落', '文脉断绝，礼崩乐坏！', 'culture', { maxStability: 30 }, recurring(5, 25), [option('兴学重教', { gold: -80, stability: 5, legitimacy: 3 }, 3), option('听之任之', { legitimacy: -5, factionSat: noblesReaction(-8) }, 2)]),
  // ── B8: 政体切换反扑事件（3 个，仅 govTransitionActive 窗口内可触发）──
  defineEvent('evt_gov_nobles_plot', '旧贵族密谋复辟', '失去特权的旧贵族暗中密谋，企图复辟旧制！', 'politics', { govTransitionActive: true }, recurring(10, 5), [option('铁腕镇压', { gold: -100, stability: -8, factionSat: noblesReaction(-20), legitimacy: 5 }, 2), option('安抚妥协', { gold: -50, factionSat: noblesReaction(15), legitimacy: -8 }, 3)]),
  defineEvent('evt_gov_republican_push', '共和派逼宫', '共和派借新政之机要求扩大议会权力！', 'politics', { govTransitionActive: true }, recurring(8, 5), [option('顺应扩权', { legitimacy: -5, stability: 5, factionSat: fr('merchants', 12) }, 3), option('坚守王权', { stability: -10, factionSat: fr('merchants', -15), legitimacy: 3 }, 2)]),
  defineEvent('evt_gov_clergy_backlash', '教士反扑', '失势的教士煽动信众，指新政为异端！', 'religion', { govTransitionActive: true }, recurring(8, 5), [option('政教分离', { gold: -80, stability: -5, factionSat: fr('clergy', -18), legitimacy: 5 }, 2), option('拉拢教士', { gold: -40, factionSat: fr('clergy', 10), legitimacy: -3 }, 3)]),
  // ── D1 扩充：+97 事件到 300，每类 +10 + 5 链 15 事件 ──
  // crisis +10
  defineEvent('evt_d1_flood', '洪水泛滥', '暴雨成灾，河水泛滥。', 'crisis', fromTurn(5), recurring(5, 25), [option('筑堤救灾', { gold: -80, stability: 3 }, 3), option('任其自然', { food: -40, stability: -5 }, 2)]),
  defineEvent('evt_d1_fire', '大火', '城中大火，连烧数坊。', 'crisis', fromTurn(6), recurring(4, 35), [option('全力扑救', { gold: -70, stability: 3 }, 3), option('抢救财物', { gold: -20, stability: -4 }, 2)]),
  defineEvent('evt_d1_famine_locust', '蝗后饥荒', '蝗灾之后粮仓空虚。', 'crisis', { maxFoodRatio: 0.5 }, recurring(6, 20), [option('外购粮食', { gold: -100, food: 80 }, 3), option('勒紧腰带', { food: -30, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent('evt_d1_epidemic', '疫病', '城中疫病流行。', 'crisis', fromTurn(12), recurring(5, 40), [option('隔离救治', { gold: -90, population: -50, stability: 3 }, 3), option('不管不问', { population: -200, stability: -8 }, 1)]),
  defineEvent('evt_d1_riot', '民变', '民众聚众闹事，冲击府衙。', 'crisis', { maxStability: 30 }, recurring(7, 15), [option('弹压', { gold: -50, stability: -3, factionSat: militaryReaction(5) }, 2), option('答应诉求', { gold: -80, stability: 5, factionSat: commonersReaction(10) }, 3)]),
  defineEvent('evt_d1_collapse', '建筑坍塌', '年久失修的建筑坍塌。', 'crisis', fromTurn(10), recurring(3, 30), [option('重建', { gold: -100, stability: 2 }, 3), option('暂置', { stability: -3 }, 2)]),
  defineEvent('evt_d1_invasion_raid', '蛮族劫掠', '蛮族骑兵劫掠边境！', 'crisis', fromTurn(8), recurring(5, 20), [option('出击', { gold: -60, factionSat: militaryReaction(8), stability: 3 }, 3), option('坚壁清野', { food: -30, gold: -30 }, 2)]),
  defineEvent('evt_d1_starvation', '饥馑', '粮尽民饥，饿殍载道。', 'crisis', { maxFoodRatio: 0.4 }, recurring(8, 15), [option('开仓', { food: -80, stability: 4 }, 3), option('加税购粮', { gold: -50, factionSat: commonersReaction(-15) }, 1)]),
  defineEvent('evt_d1_unrest_spread', '骚乱蔓延', '一省骚乱蔓延邻省。', 'crisis', { maxStability: 35 }, recurring(6, 18), [option('派兵镇压', { gold: -70, factionSat: militaryReaction(6) }, 2), option('安抚', { gold: -100, stability: 5 }, 3)]),
  // politics +10
  defineEvent('evt_d1_court_intrigue', '宫廷阴谋', '后宫与朝臣暗中勾结。', 'politics', fromTurn(10), recurring(4, 30), [option('彻查', { gold: -50, legitimacy: 5, factionSat: noblesReaction(-8) }, 3), option('装作不知', { legitimacy: -5, corruption: 5 }, 2)]),
  defineEvent('evt_d1_minister_dismiss', '罢相', '宰相失职，朝野弹劾。', 'politics', { minCorruption: 40 }, recurring(5, 25), [option('罢免', { legitimacy: 3, stability: -3, factionSat: noblesReaction(-10) }, 3), option('留任', { corruption: 5, legitimacy: -5 }, 1)]),
  defineEvent('evt_d1_faction_feud', '派系倾轧', '两大派系公开对立。', 'politics', fromTurn(8), recurring(5, 20), [option('居中调停', { gold: -40, stability: 3 }, 3), option('支持一方', { stability: -5, legitimacy: -3 }, 2)]),
  defineEvent('evt_d1_edict', '诏令风波', '新诏引发朝野争议。', 'politics', fromTurn(12), recurring(4, 25), [option('坚持', { legitimacy: 5, stability: -5 }, 2), option('收回', { legitimacy: -8, stability: 3 }, 3)]),
  defineEvent('evt_d1_tax_revolt', '抗税', '某省拒不纳税。', 'politics', { maxStability: 40 }, recurring(6, 20), [option('武力催税', { gold: 30, stability: -8, factionSat: commonersReaction(-12) }, 1), option('减免', { gold: -50, stability: 5 }, 3)]),
  defineEvent('evt_d1_audit', '审计', '审计发现账目亏空。', 'politics', { minCorruption: 30 }, recurring(4, 30), [option('追缴', { gold: 60, corruption: -5, factionSat: noblesReaction(-8) }, 3), option('不了了之', { corruption: 3 }, 2)]),
  defineEvent('evt_d1_promotion', '擢升', '功臣请赏。', 'politics', fromTurn(10, { minStability: 40 }), recurring(3, 25), [option('重赏', { gold: -80, legitimacy: 5, factionSat: noblesReaction(8) }, 3), option('薄赏', { factionSat: noblesReaction(-5) }, 2)]),
  defineEvent('evt_d1_law_dispute', '律法争议', '新律引发法理争议。', 'politics', fromTurn(15), recurring(4, 30), [option('修订', { gold: -60, legitimacy: 3 }, 3), option('维持', { stability: -3 }, 2)]),
  defineEvent('evt_d1_generalissimo', '将权过重', '大将权倾朝野。', 'politics', fromTurn(20), recurring(5, 40), [option('削权', { factionSat: militaryReaction(-15), stability: 3 }, 3), option('纵容', { legitimacy: -8, corruption: 5 }, 1)]),
  defineEvent('evt_d1_reform_backlash', '改革反弹', '旧势力反扑新政。', 'politics', fromTurn(15), recurring(6, 25), [option('坚持改革', { stability: -8, legitimacy: 5 }, 2), option('妥协', { stability: 3, legitimacy: -5 }, 3)]),
  // economy +10
  defineEvent('evt_d1_depression', '萧条', '商业萧条，市场冷清。', 'economy', fromTurn(15, { notAtWar: true }), recurring(4, 35), [option('刺激', { gold: -120, factionSat: fr('merchants', 10) }, 3), option('等待复苏', { gold: -20, factionSat: fr('merchants', -8) }, 2)]),
  defineEvent('evt_d1_coinage', '币制改革', '钱币贬值引发混乱。', 'economy', fromTurn(18), recurring(4, 40), [option('整顿币制', { gold: -150, stability: 5, corruption: -5 }, 3), option('放任', { factionSat: fr('merchants', -10) }, 2)]),
  defineEvent('evt_d1_harvest_tax', '秋收征税', '丰收之年该征多少？', 'economy', fromTurn(5), recurring(5, 15), [option('重税', { gold: 120, factionSat: commonersReaction(-10) }, 2), option('薄税', { gold: 50, factionSat: commonersReaction(8) }, 3)]),
  defineEvent('evt_d1_trade_disrupt', '商路阻断', '商路被匪徒阻断。', 'economy', fromTurn(10), recurring(4, 20), [option('清剿', { gold: -60, factionSat: fr('merchants', 10) }, 3), option('绕道', { gold: -20, factionSat: fr('merchants', -5) }, 2)]),
  defineEvent('evt_d1_usury', '高利贷', '富商放高利贷盘剥百姓。', 'economy', { minCorruption: 25 }, recurring(4, 30), [option('限制利率', { gold: -30, factionSat: fra({ faction: 'commoners', delta: 10 }, { faction: 'merchants', delta: -8 }) }, 3), option('放任', { corruption: 3 }, 2)]),
  defineEvent('evt_d1_grain_store', '粮储', '粮储是否充实？', 'economy', fromTurn(8), recurring(3, 20), [option('广储', { gold: -80, food: 100, stability: 3 }, 3), option('少储', { gold: 20, food: -20 }, 2)]),
  defineEvent('evt_d1_market_tax', '市税', '是否提高市场税？', 'economy', fromTurn(6), recurring(4, 20), [option('提高', { gold: 80, factionSat: fr('merchants', -10) }, 2), option('维持', { factionSat: fr('merchants', 5) }, 3)]),
  defineEvent('evt_d1_labor_short', '工程劳力短缺', '兴建大工程劳力不足。', 'economy', fromTurn(12), recurring(3, 25), [option('征役', { factionSat: commonersReaction(-10), stability: -3 }, 2), option('募工', { gold: -100 }, 3)]),
  // military +10
  defineEvent('evt_d1_general_die', '名将陨落', '一代名将病逝。', 'military', fromTurn(20), recurring(4, 50), [option('厚葬', { gold: -60, legitimacy: 3, factionSat: militaryReaction(8) }, 3), option('简葬', { factionSat: militaryReaction(-5) }, 2)]),
  defineEvent('evt_d1_border_warn', '边警', '边报频传，敌国异动。', 'military', fromTurn(8), recurring(5, 20), [option('增兵', { gold: -80, factionSat: militaryReaction(5) }, 3), option('观望', { stability: -3 }, 2)]),
  defineEvent('evt_d1_conscript_wave', '征兵', '是否大规模征兵？', 'military', { atWar: true }, recurring(6, 15), [option('大征', { factionSat: fra({ faction: 'commoners', delta: -15 }, { faction: 'military', delta: 10 }) }, 2), option('小征', { factionSat: militaryReaction(3) }, 3)]),
  defineEvent('evt_d1_supply_cut', '补给线断', '前线补给被切断！', 'military', { atWar: true, minTurn: 5 }, recurring(6, 20), [option('打通', { gold: -100, factionSat: militaryReaction(8) }, 3), option('就地征粮', { factionSat: commonersReaction(-12), stability: -5 }, 1)]),
  defineEvent('evt_d1_veteran_return', '老兵归乡', '战后老兵归乡安置。', 'military', fromTurn(15), recurring(3, 30), [option('授田', { gold: -100, factionSat: fra({ faction: 'military', delta: 12 }, { faction: 'commoners', delta: 5 }) }, 3), option('不管', { factionSat: militaryReaction(-10), stability: -3 }, 2)]),
  defineEvent('evt_d1_fortify', '筑城', '是否加固城防？', 'military', fromTurn(10), recurring(3, 30), [option('大兴', { gold: -120, stability: 5 }, 3), option('小修', { gold: -30 }, 2)]),
  defineEvent('evt_d1_alliance_call', '盟友求援', '盟国遭入侵求援。', 'military', fromTurn(12, { notAtWar: true }), recurring(4, 25), [option('出兵', { gold: -100, factionSat: militaryReaction(8), influence: 5 }, 3), option('婉拒', { influence: -8 }, 2)]),
  defineEvent('evt_d1_pirate', '海盗', '海盗袭扰沿海！', 'military', fromTurn(10), recurring(4, 25), [option('剿灭', { gold: -80, factionSat: militaryReaction(6) }, 3), option('招安', { gold: -40, corruption: 4 }, 2)]),
  defineEvent('evt_d1_war_debt', '战债', '战争耗费巨大，国库告急。', 'military', { atWar: true, minTurn: 8 }, recurring(5, 20), [option('加税偿债', { gold: 80, factionSat: commonersReaction(-12) }, 2), option('举债', { gold: 100, corruption: 5 }, 3)]),
  // diplomacy +10
  defineEvent('evt_d1_envoy_gift', '使节献礼', '外国使节带来厚礼。', 'diplomacy', fromTurn(8, { notAtWar: true }), recurring(3, 25), [option('回礼', { gold: -50, influence: 8 }, 3), option('收下', { gold: 30, influence: -3 }, 2)]),
  defineEvent('evt_d1_marriage', '联姻', '邻国提议联姻结盟。', 'diplomacy', fromTurn(10, { notAtWar: true }), recurring(4, 40), [option('应允', { gold: -80, influence: 15, legitimacy: 3 }, 3), option('拒绝', { influence: -8 }, 2)]),
  defineEvent('evt_d1_trade_pact', '商约', '邻国提议签订商约。', 'diplomacy', fromTurn(8, { notAtWar: true }), recurring(4, 30), [option('签订', { gold: 60, influence: 5, factionSat: fr('merchants', 10) }, 3), option('观望', { factionSat: fr('merchants', -5) }, 2)]),
  defineEvent('evt_d1_insult', '受辱', '邻国使节出言不逊。', 'diplomacy', fromTurn(12), recurring(4, 20), [option('抗议', { influence: -5, stability: 3 }, 2), option('忍让', { legitimacy: -3 }, 3)]),
  defineEvent('evt_d1_refugee_return', '遣返', '邻国要求遣返流民。', 'diplomacy', fromTurn(15), recurring(3, 30), [option('遣返', { influence: 5, stability: -3 }, 3), option('拒绝', { influence: -8 }, 2)]),
  defineEvent('evt_d1_embassy', '设使馆', '是否在各国设使馆？', 'diplomacy', fromTurn(12, { notAtWar: true }), recurring(3, 40), [option('设立', { gold: -100, influence: 12 }, 3), option('暂缓', { influence: -3 }, 2)]),
  defineEvent('evt_d1_hostage', '质子', '邻国送质子以求和。', 'diplomacy', fromTurn(15), recurring(3, 50), [option('接受', { influence: 10, stability: -3 }, 3), option('拒绝', { influence: -5 }, 2)]),
  defineEvent('evt_d1_summit', '会盟', '诸国提议会盟。', 'diplomacy', fromTurn(20, { notAtWar: true }), recurring(3, 60), [option('主盟', { gold: -150, influence: 20, legitimacy: 5 }, 3), option('列席', { influence: 5 }, 2)]),
  defineEvent('evt_d1_spy_caught', '细作', '抓获邻国细作。', 'diplomacy', fromTurn(10), recurring(4, 25), [option('处死', { influence: -5, stability: 3 }, 2), option('遣返', { influence: 3 }, 3)]),
  defineEvent('evt_d1_trade_war', '商战', '邻国对我加征关税。', 'diplomacy', fromTurn(15), recurring(4, 30), [option('反制', { gold: -50, factionSat: fr('merchants', -8) }, 2), option('谈判', { gold: -30, influence: 5 }, 3)]),
  // religion +10
  defineEvent('evt_d1_shrine_build', '立祠', '是否为功臣立祠？', 'religion', fromTurn(15, { minStability: 40 }), recurring(3, 40), [option('立祠', { gold: -80, legitimacy: 5, factionSat: fr('clergy', 8) }, 3), option('不立', { factionSat: fr('clergy', -5) }, 2)]),
  defineEvent('evt_d1_omen', '天象', '异象引发恐慌。', 'religion', fromTurn(8), recurring(4, 30), [option('祭祀', { gold: -50, legitimacy: 5, stability: 3 }, 3), option('不理', { stability: -5 }, 2)]),
  defineEvent('evt_d1_conversion', '改宗', '部分民众改信异教。', 'religion', fromTurn(15, { provinceCultureDiff: true }), recurring(4, 35), [option('传教', { gold: -60, factionSat: fr('clergy', 10) }, 3), option('宽容', { stability: 3, factionSat: fr('clergy', -8) }, 2)]),
  defineEvent('evt_d1_temple_fire', '寺庙火灾', '主寺庙失火。', 'religion', fromTurn(10), recurring(3, 40), [option('重建', { gold: -100, factionSat: fr('clergy', 12) }, 3), option('暂置', { factionSat: fr('clergy', -10) }, 2)]),
  defineEvent('evt_d1_festival', '宗教节', '盛大宗教节日将至。', 'religion', fromTurn(8, { notAtWar: true }), recurring(3, 20), [option('大办', { gold: -70, stability: 5, factionSat: fr('clergy', 10) }, 3), option('简办', { factionSat: fr('clergy', -5) }, 2)]),
  defineEvent('evt_d1_sacrilege', '亵渎', '有人亵渎神庙。', 'religion', fromTurn(12), recurring(3, 30), [option('严惩', { factionSat: fr('clergy', 12), stability: -3 }, 2), option('宽恕', { factionSat: fr('clergy', -10) }, 3)]),
  defineEvent('evt_d1_prophecy', '预言', '巫师预言国运。', 'religion', fromTurn(18), recurring(3, 50), [option('信之', { gold: -40, legitimacy: -3 }, 2), option('斥之', { factionSat: fr('clergy', -8), stability: 3 }, 3)]),
  defineEvent('evt_d1_donation', '捐赠', '富商捐赠寺庙。', 'religion', fromTurn(12, { notAtWar: true }), recurring(2, 30), [option('鼓励', { factionSat: fra({ faction: 'clergy', delta: 8 }, { faction: 'merchants', delta: 5 }) }, 3), option('课税', { gold: 40, factionSat: fr('clergy', -8) }, 2)]),
  defineEvent('evt_d1_relic', '圣物', '发现圣物。', 'religion', fromTurn(20), recurring(2, 60), [option('供奉', { gold: -50, legitimacy: 8, factionSat: fr('clergy', 15) }, 3), option('秘藏', { legitimacy: 3 }, 2)]),
  // science +10
  defineEvent('evt_d1_academy', '书院', '学者请立书院。', 'science', { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('批准', { gold: -100, sciPt: 20, legitimacy: 3 }, 3), option('婉拒', { sciPt: -3 }, 2)]),
  defineEvent('evt_d1_scholar_invite', '招贤', '异国贤才来投。', 'science', fromTurn(12, { notAtWar: true }), recurring(3, 30), [option('重用', { gold: -60, sciPt: 12, factionSat: noblesReaction(-5) }, 3), option('不用', { sciPt: -2 }, 2)]),
  defineEvent('evt_d1_experiment', '实验', '学者请求做危险实验。', 'science', { minTurn: 15, techLevelAbove: { branch: 'agri', level: 2 } }, recurring(3, 35), [option('允许', { sciPt: 15, stability: -3 }, 3), option('禁止', { sciPt: -5, factionSat: fr('clergy', 5) }, 2)]),
  defineEvent('evt_d1_translation', '译书', '是否翻译异国典籍？', 'science', fromTurn(18, { notAtWar: true }), recurring(3, 40), [option('翻译', { gold: -80, sciPt: 10, influence: 5 }, 3), option('不译', { sciPt: -2 }, 2)]),
  defineEvent('evt_d1_observation', '观测', '天文学家请求建观象台。', 'science', { minTurn: 20, techLevelAbove: { branch: 'culture', level: 2 } }, recurring(2, 50), [option('兴建', { gold: -120, sciPt: 20, legitimacy: 5 }, 3), option('缓议', { sciPt: -3 }, 2)]),
  defineEvent('evt_d1_medicine', '医术', '名医献上新医术。', 'science', { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 35), [option('推广', { gold: -60, population: 100, stability: 3 }, 3), option('观望', { }, 2)]),
  defineEvent('evt_d1_engineering', '工程', '工程师献新法。', 'science', { minTurn: 18, techLevelAbove: { branch: 'admin', level: 3 } }, recurring(2, 40), [option('采用', { gold: -80, sciPt: 8 }, 3), option('不用', { }, 2)]),
  defineEvent('evt_d1_philosophy', '哲学', '哲学家提出新说。', 'science', { minTurn: 20, techLevelAbove: { branch: 'culture', level: 3 } }, recurring(2, 50), [option('表彰', { gold: -30, sciPt: 10, legitimacy: 3 }, 3), option('禁绝', { stability: -5, factionSat: fr('clergy', 8) }, 1)]),
  defineEvent('evt_d1_archive', '档案', '是否整理国家档案？', 'science', fromTurn(15), recurring(2, 40), [option('整理', { gold: -50, sciPt: 8, legitimacy: 3 }, 3), option('不理', { }, 2)]),
  // opportunity +10
  defineEvent('evt_d1_talent', '贤才', '在野贤才求仕。', 'opportunity', fromTurn(8, { minStability: 30 }), recurring(3, 25), [option('破格', { gold: -40, legitimacy: 5, factionSat: noblesReaction(-5) }, 3), option('循例', { }, 2)]),
  defineEvent('evt_d1_land_claim', '无主之地', '边境发现无主沃土。', 'opportunity', fromTurn(12, { notAtWar: true }), recurring(3, 40), [option('占领', { gold: -60, stability: 3 }, 3), option('放弃', { }, 2)]),
  defineEvent('evt_d1_ancient', '古迹', '发现古代遗迹。', 'opportunity', fromTurn(15), recurring(2, 50), [option('发掘', { gold: -50, sciPt: 10, legitimacy: 3 }, 3), option('保护', { influence: 3 }, 2)]),
  defineEvent('evt_d1_alliance_offer', '来投', '小国求为附庸。', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(3, 40), [option('接受', { gold: -80, influence: 15, stability: -3 }, 3), option('拒绝', { influence: -3 }, 2)]),
  defineEvent('evt_d1_reform_open', '改革良机', '民心可用，改革良机。', 'opportunity', fromTurn(18, { minStability: 50 }), recurring(3, 50), [option('推行', { gold: -100, legitimacy: 8, stability: -5 }, 3), option('缓议', { }, 2)]),
  defineEvent('evt_d1_feast', '盛宴', '是否举办盛宴彰显国力？', 'opportunity', fromTurn(12, { minStability: 40 }), recurring(3, 30), [option('大办', { gold: -100, influence: 12, legitimacy: 3 }, 3), option('简办', { gold: -20 }, 2)]),
  defineEvent('evt_d1_tribute', '朝贡', '小国来朝贡。', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(3, 40), [option('厚赏', { gold: -80, influence: 15 }, 3), option('薄赏', { gold: -20, influence: 3 }, 2)]),
  defineEvent('evt_d1_explorer', '探险', '探险家请缨远征。', 'opportunity', fromTurn(20), recurring(2, 50), [option('资助', { gold: -120, influence: 10, sciPt: 5 }, 3), option('不允', { }, 2)]),
  defineEvent('evt_d1_census', '普查', '是否普查人口？', 'opportunity', fromTurn(10), recurring(3, 40), [option('普查', { gold: 20, corruption: -3 }, 3), option('不查', { }, 2)]),
  defineEvent('evt_d1_diplomat', '纵横', '纵横家来投。', 'opportunity', fromTurn(15, { notAtWar: true }), recurring(2, 40), [option('重用', { gold: -50, influence: 12 }, 3), option('不用', { }, 2)]),
  // culture +10
  defineEvent('evt_d1_poet', '诗人', '著名诗人来游。', 'culture', fromTurn(10, { minStability: 30 }), recurring(3, 30), [option('款待', { gold: -30, influence: 8, legitimacy: 3 }, 3), option('不见', { }, 2)]),
  defineEvent('evt_d1_art', '艺术', '艺术家请赞助。', 'culture', fromTurn(12, { minStability: 40 }), recurring(3, 30), [option('赞助', { gold: -50, influence: 8 }, 3), option('婉拒', { }, 2)]),
  defineEvent('evt_d1_history', '修史', '是否修国史？', 'culture', fromTurn(15), recurring(3, 50), [option('修史', { gold: -80, legitimacy: 8, influence: 5 }, 3), option('缓议', { }, 2)]),
  defineEvent('evt_d1_etiquette', '礼制', '是否革新礼制？', 'culture', fromTurn(18), recurring(3, 40), [option('革新', { gold: -60, legitimacy: 5, stability: -3 }, 3), option('守旧', { }, 2)]),
  defineEvent('evt_d1_architecture', '建筑', '新建筑风格流行。', 'culture', { minTurn: 15, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(2, 40), [option('采用', { gold: -80, influence: 8 }, 3), option('不用', { }, 2)]),
  defineEvent('evt_d1_music', '雅乐', '是否整理雅乐？', 'culture', fromTurn(12, { minStability: 40 }), recurring(2, 40), [option('整理', { gold: -40, legitimacy: 5, factionSat: fr('clergy', 5) }, 3), option('不理', { }, 2)]),
  defineEvent('evt_d1_fashion', '服饰', '新服饰风格兴起。', 'culture', fromTurn(15), recurring(2, 40), [option('推广', { gold: -30, influence: 5 }, 3), option('禁绝', { stability: -3 }, 2)]),
  defineEvent('evt_d1_language', '文字', '是否统一文字？', 'culture', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 3 } }, recurring(3, 60), [option('统一', { gold: -100, legitimacy: 10, stability: -5 }, 3), option('不统', { }, 2)]),
  defineEvent('evt_d1_festival_art', '艺术节', '是否举办艺术节？', 'culture', fromTurn(12, { notAtWar: true, minStability: 40 }), recurring(3, 30), [option('举办', { gold: -60, influence: 10, stability: 3 }, 3), option('不办', { }, 2)]),
  defineEvent('evt_d1_legend', '传奇', '民间流传本朝传奇。', 'culture', fromTurn(18, { minStability: 50 }), recurring(2, 50), [option('鼓励', { legitimacy: 5, influence: 5 }, 3), option('禁绝', { stability: -3 }, 2)]),
  // population +7
  defineEvent('evt_d1_migration', '迁徙', '部分民众欲迁徙他乡。', 'population', fromTurn(10, { maxStability: 40 }), recurring(4, 25), [option('挽留', { gold: -50, stability: 3 }, 3), option('任其', { population: -200 }, 2)]),
  defineEvent('evt_d1_birth_boom', '婴儿潮', '今年出生率大增。', 'population', fromTurn(8, { minStability: 50 }), recurring(3, 30), [option('鼓励', { gold: -40, population: 200 }, 3), option('不管', { population: 100 }, 2)]),
  defineEvent('evt_d1_plague_death', '疫后', '疫病后人口骤减。', 'population', fromTurn(15), recurring(4, 40), [option('休养', { gold: -60, population: 100, stability: 3 }, 3), option('不管', { population: -100 }, 2)]),
  defineEvent('evt_d1_labor_demand', '劳力', '百业兴旺劳力不足。', 'population', fromTurn(12, { minStability: 50 }), recurring(3, 30), [option('招抚', { gold: -50, population: 150 }, 3), option('不加', { }, 2)]),
  defineEvent('evt_d1_urban', '城市化', '民众涌入城市。', 'population', fromTurn(15, { minStability: 40 }), recurring(3, 30), [option('安置', { gold: -80, stability: 3, factionSat: commonersReaction(8) }, 3), option('不管', { stability: -3, corruption: 3 }, 2)]),
  defineEvent('evt_d1_emigration', '外流', '民众外流他国。', 'population', fromTurn(12, { maxStability: 35 }), recurring(4, 25), [option('阻止', { gold: -40, stability: -3 }, 2), option('任其', { population: -150, influence: -3 }, 3)]),
  defineEvent('evt_d1_clan', '宗族', '大宗族兼并小户。', 'population', fromTurn(15, { minCorruption: 30 }), recurring(3, 35), [option('抑制', { gold: -50, factionSat: fra({ faction: 'nobles', delta: -10 }, { faction: 'commoners', delta: 8 }) }, 3), option('不管', { corruption: 3 }, 2)]),
  // ── D1 事件链 11-15（5 链 × 3 事件 = 15 事件）──
  // 链 11：蛮族入侵链——预警→入侵→和或战
  defineEvent('evt_chain_barbarian_1', '蛮族集结', '边报：蛮族于塞外集结，似有南下之意！',
    'military', fromTurn(12), recurring(5, 80), [
    option('增兵戒备', { gold: -80, factionSat: militaryReaction(5), triggerEvent: 'evt_chain_barbarian_2' }, 3),
    option('遣使探虚实', { gold: -30, influence: -3, triggerEvent: 'evt_chain_barbarian_2' }, 2),
  ]),
  defineEvent('evt_chain_barbarian_2', '蛮族南下', '蛮族铁骑南下，连陷数镇！',
    'military', fromTurn(13), followUp, [
    option('主力决战', { gold: -150, factionSat: militaryReaction(10), stability: -5, triggerEvent: 'evt_chain_barbarian_3' }, 2),
    option('坚壁清野', { food: -100, gold: -60, stability: -8, triggerEvent: 'evt_chain_barbarian_3' }, 3),
  ]),
  defineEvent('evt_chain_barbarian_3', '蛮族余波', '蛮族退去，边境残破。',
    'military', fromTurn(14), followUp, [
    option('重建边境', { gold: -120, stability: 5, factionSat: commonersReaction(8) }, 3),
    option('暂置', { stability: -3, influence: -5 }, 2),
  ]),
  // 链 12：继位内战链——驾崩→争位→内战或和解
  defineEvent('evt_chain_succession_1', '君主驾崩', '君主突然驾崩，未立太子！',
    'politics', fromTurn(25), oneTime(6, 100), [
    option('立长子', { legitimacy: 5, stability: -5, triggerEvent: 'evt_chain_succession_2' }, 3),
    option('择贤立', { legitimacy: -5, stability: -8, factionSat: noblesReaction(-10), triggerEvent: 'evt_chain_succession_2' }, 2),
  ]),
  defineEvent('evt_chain_succession_2', '诸王争位', '诸王子各立党羽，朝野分裂！',
    'politics', fromTurn(26), followUp, [
    option('强力镇压', { gold: -100, stability: -10, factionSat: militaryReaction(8), triggerEvent: 'evt_chain_succession_3' }, 2),
    option('谈判和解', { gold: -150, legitimacy: -8, stability: 3, triggerEvent: 'evt_chain_succession_3' }, 3),
  ]),
  defineEvent('evt_chain_succession_3', '内战结束', '争位之争终见分晓。',
    'politics', fromTurn(27), followUp, [
    option('大赦天下', { gold: -80, legitimacy: 10, stability: 8 }, 3),
    option('清算旧账', { gold: -40, legitimacy: 5, factionSat: noblesReaction(-15) }, 2),
  ]),
  // 链 13：商业革命链——新兴→繁荣→泡沫或稳固
  defineEvent('evt_chain_commerce_1', '商团兴起', '新兴商团势力大增，要求更多特权！',
    'economy', { minTurn: 15, notAtWar: true, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(4, 80), [
    option('授予特权', { gold: 100, factionSat: fra({ faction: 'merchants', delta: 12 }, { faction: 'nobles', delta: -8 }), triggerEvent: 'evt_chain_commerce_2' }, 3),
    option('限制', { gold: -20, factionSat: fr('merchants', -10), triggerEvent: 'evt_chain_commerce_2' }, 2),
  ]),
  defineEvent('evt_chain_commerce_2', '商业繁荣', '商业空前繁荣，金币如雨！',
    'economy', fromTurn(16), followUp, [
    option('大举征税', { gold: 200, factionSat: fr('merchants', -12), triggerEvent: 'evt_chain_commerce_3' }, 2),
    option('轻税促商', { gold: 80, factionSat: fr('merchants', 10), stability: 3, triggerEvent: 'evt_chain_commerce_3' }, 3),
  ]),
  defineEvent('evt_chain_commerce_3', '商潮余波', '商业浪潮后，经济格局已变。',
    'economy', fromTurn(17), followUp, [
    option('规范市场', { gold: -60, corruption: -5, factionSat: fr('merchants', 5) }, 3),
    option('放任', { corruption: 8, gold: 50 }, 2),
  ]),
  // 链 14：宗教改革链——异端→分裂→宽容或镇压
  defineEvent('evt_chain_reform_1', '宗教异端', '新教派兴起，挑战旧教权威！',
    'religion', { minTurn: 18, techLevelAbove: { branch: 'culture', level: 2 } }, recurring(4, 100), [
    option('镇压', { gold: -80, factionSat: fr('clergy', 12), stability: -5, triggerEvent: 'evt_chain_reform_2' }, 2),
    option('容忍', { factionSat: fr('clergy', -15), stability: 3, triggerEvent: 'evt_chain_reform_2' }, 3),
  ]),
  defineEvent('evt_chain_reform_2', '宗教分裂', '教派对立全国动荡！',
    'religion', fromTurn(19), followUp, [
    option('定一尊', { gold: -150, legitimacy: 8, stability: -10, factionSat: fr('clergy', 15), triggerEvent: 'evt_chain_reform_3' }, 2),
    option('宽容并立', { gold: -50, stability: 5, legitimacy: -5, factionSat: fr('clergy', -10), triggerEvent: 'evt_chain_reform_3' }, 3),
  ]),
  defineEvent('evt_chain_reform_3', '教争终局', '宗教之争暂告段落。',
    'religion', fromTurn(20), followUp, [
    option('重建教权', { gold: -100, legitimacy: 5, factionSat: fr('clergy', 10) }, 3),
    option('政教分离', { gold: -50, stability: 5, factionSat: fr('clergy', -8) }, 2),
  ]),
  // 链 15：瘟疫大流行链——潜伏→爆发→余波或根治
  defineEvent('evt_chain_pandemic_1', '疫病潜伏', '远国疫病传入，太医奏请防范！',
    'crisis', fromTurn(22), oneTime(5, 120), [
    option('严防输入', { gold: -100, stability: 3, triggerEvent: 'evt_chain_pandemic_2' }, 3),
    option('观望', { triggerEvent: 'evt_chain_pandemic_2' }, 2),
  ]),
  defineEvent('evt_chain_pandemic_2', '大疫爆发', '疫病全国蔓延，死者甚众！',
    'crisis', fromTurn(23), followUp, [
    option('封城救治', { gold: -200, population: -300, stability: -8, factionSat: fr('clergy', 8), triggerEvent: 'evt_chain_pandemic_3' }, 3),
    option('祈祷', { population: -500, stability: -15, legitimacy: -8, triggerEvent: 'evt_chain_pandemic_3' }, 1),
  ]),
  defineEvent('evt_chain_pandemic_3', '疫后重建', '大疫终于退去，百废待兴。',
    'crisis', fromTurn(24), followUp, [
    option('休养生息', { gold: -150, population: 200, stability: 8, legitimacy: 5 }, 3),
    option('加税重建', { gold: 100, factionSat: commonersReaction(-15), stability: -5 }, 2),
  ]),
  // ── population 扩充 +10（21→31，增强人口系统事件多样性）──
  defineEvent('evt_pop_aging', '耆老增多', '医术渐进，耆寿增多，赡养之议起！', 'population', { minTurn: 20, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('设养济院', { gold: -70, stability: 4, factionSat: commonersReaction(10) }, 3), option('族养为主', { stability: 1, factionSat: noblesReaction(5) }, 2)]),
  defineEvent('evt_pop_orphan', '孤儿流离', '战乱后孤儿流离道旁，士民请命！', 'population', fromTurn(12, { atWar: true }), recurring(4, 30), [option('官设慈幼局', { gold: -60, population: 80, stability: 5, factionSat: fr('clergy', 8) }, 3), option('民间收养', { population: 40, stability: 1 }, 2)]),
  defineEvent('evt_pop_refugee_return', '流民归乡', '故土安靖，昔日流民纷纷归乡！', 'population', fromTurn(18, { notAtWar: true, minStability: 50 }), recurring(3, 40), [option('官助归耕', { gold: -50, population: 150, food: 30, efficiency: 2 }, 3), option('听其自便', { population: 80 }, 2)]),
  defineEvent('evt_pop_conscription_backlash', '征丁怨声', '连年征兵，乡野丁壮匮乏，民怨渐起！', 'population', fromTurn(10, { atWar: true, maxStability: 50 }), recurring(5, 25), [option('减免来年征发', { gold: -40, stability: 5, factionSat: commonersReaction(12) }, 3), option('严令催征', { stability: -8, factionSat: commonersReaction(-15), population: -100 }, 1)]),
  defineEvent('evt_pop_market_town', '市镇兴起', '交通要冲市镇自发兴起，商贾云集！', 'population', { minTurn: 14, minStability: 45, techLevelAbove: { branch: 'admin', level: 1 } }, recurring(3, 35), [option('设官治理', { gold: -40, efficiency: 3, factionSat: fr('merchants', 10), corruption: -2 }, 3), option('任其自流', { gold: 30, corruption: 4 }, 2)]),
  defineEvent('evt_pop_famine_migration', '就食流移', '北省大旱，饥民就食南下，纷至沓来！', 'population', fromTurn(12, { maxStability: 45 }), recurring(5, 30), [option('开仓赈济', { gold: -80, food: -60, population: 200, stability: 4 }, 3), option('闭境拒之', { stability: -5, influence: -5, factionSat: commonersReaction(-10) }, 2)]),
  defineEvent('evt_pop_noble_exodus', '贵胄徙避', '政局动荡，部分贵胄携家南迁邻邦！', 'population', fromTurn(15, { maxStability: 40 }), recurring(4, 35), [option('厚礼挽留', { gold: -100, legitimacy: 5, factionSat: noblesReaction(12) }, 3), option('任其去留', { population: -80, influence: -5, factionSat: noblesReaction(-10) }, 2)]),
  defineEvent('evt_pop_scholar_return', '游学归乡', '昔日游学之士学成归国，欲效力庙堂！', 'population', { minTurn: 16, techLevelAbove: { branch: 'admin', level: 2 } }, recurring(3, 40), [option('量才录用', { gold: -40, sciPt: 20, efficiency: 3, factionSat: fr('clergy', 8) }, 3), option('待缺候补', { sciPt: 5, stability: 1 }, 2)]),
  defineEvent('evt_pop_border_trade', '边民互市', '边民越界互市，官府查否两难！', 'population', fromTurn(10, { notAtWar: true }), recurring(3, 30), [option('设榷场规范', { gold: 60, factionSat: fr('merchants', 10), efficiency: 2 }, 3), option('严禁越界', { gold: -20, stability: 2, factionSat: fr('merchants', -8) }, 2)]),
  defineEvent('evt_pop_overcrowding', '人稠地狭', '核心省份人稠地狭，生计日蹙！', 'population', fromTurn(22, { minStability: 50 }), recurring(4, 40), [option('移民实边', { gold: -100, population: 100, stability: 4, efficiency: 2 }, 3), option('精耕细作', { gold: -50, food: 40, sciPt: 5 }, 2)]),
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
export const EVENT_IDS: string[] = EVENTS.map((e) => e.id);
export const EVENT_COUNT = EVENTS.length;
