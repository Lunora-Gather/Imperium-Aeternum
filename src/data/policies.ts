// Imperium Aeternum — 政策表
// 数据源：docs/02-system-rules.md §8 / §14
// FROZEN v1（阶段 3a）

import type { GovernmentId } from './governments';

export type PolicyId =
  | 'land_privilege'
  | 'royal_tax'
  | 'free_trade'
  | 'civic_reform'
  | 'state_religion'
  | 'holy_war'
  | 'martial_law'
  | 'conscription'
  | 'centralization'
  | 'imperial_tax'
  | 'anti_corruption'
  | 'welfare'
  // B 扩展：13 个新政策
  | 'education_reform'
  | 'merchant_guild'
  | 'land_reform'
  | 'toleration'
  | 'civil_service_exam'
  | 'military_reform'
  | 'naval_expansion'
  | 'agrarian_reform'
  | 'infrastructure_plan'
  | 'census'
  | 'diplomatic_corps'
  | 'cultural_patronage'
  | 'succession_law'
  // ── D2 扩充：4 个质变政策，绑定 Lv5 科技解锁 ──
  | 'crop_rotation'        // agri_lv5 轮作政策
  | 'total_mobilization'   // mil_lv5 总动员
  | 'civil_service_reform' // admin_lv5 科举改革
  | 'cultural_export';     // culture_lv5 文化输出

export interface PolicyDef {
  id: PolicyId;
  name: string;
  description: string;
  costAction: number;
  costGold: number;
  // 仅特定政体可推行（空数组表示皆可）
  allowedGovernments: GovernmentId[];
  // 推行后效果（叠到对应公式）
  effects: {
    taxRateMod?: number;          // 税率加成
    taxEffMod?: number;           // 税收效率
    corruptionMod?: number;       // 腐败增减
    stabilityMod?: number;        // 稳定度增减
    efficiencyMod?: number;       // 行政能力
    combatMod?: number;           // 战斗力
    mobilizationMod?: number;     // 征兵速度
    assimilationMod?: number;     // 同化速度
    popGrowthMod?: number;        // 人口增长
    influenceMod?: number;        // 外交影响力产出
  };
  // 派系满意度反应（推行当回合一次性）
  factionReaction: {
    nobles?: number; merchants?: number; military?: number;
    commoners?: number; clergy?: number;
  };
  // 是否需科技解锁
  prereqTech?: string;
}

export const POLICIES: PolicyDef[] = [
  {
    id: 'land_privilege', name: '贵族土地特权', description: '保障贵族土地权益，提贵族满意度，但行政能力下降。',
    costAction: 1, costGold: 50, allowedGovernments: ['monarchy', 'empire'],
    effects: { efficiencyMod: -5 },
    factionReaction: { nobles: 15, merchants: -5, commoners: -10 },
  },
  {
    id: 'royal_tax', name: '王家税', description: '王室直辖税收，效率升但民心降。',
    costAction: 1, costGold: 80, allowedGovernments: ['monarchy', 'empire'],
    effects: { taxEffMod: 1.10, stabilityMod: -3 },
    factionReaction: { nobles: 5, merchants: -5, commoners: -10 },
  },
  {
    id: 'free_trade', name: '自由贸易', description: '放宽贸易管制，贸易收入与商人满意度升。',
    costAction: 1, costGold: 100, allowedGovernments: ['republic', 'empire'],
    effects: { influenceMod: 3 },
    factionReaction: { merchants: 20, nobles: -5, commoners: 5 },
  },
  {
    id: 'civic_reform', name: '公民改革', description: '扩大公民权，民众满意度升，但贵族不满。',
    costAction: 2, costGold: 200, allowedGovernments: ['republic'],
    effects: { stabilityMod: 5, popGrowthMod: 1.05 },
    factionReaction: { nobles: -15, commoners: 20, merchants: 5 },
  },
  {
    id: 'state_religion', name: '国教立国', description: '确立国教，神职满意度与合法性升，但异教地区叛乱升。',
    costAction: 1, costGold: 100, allowedGovernments: ['theocracy', 'monarchy'],
    effects: { stabilityMod: 3, influenceMod: 5 },
    factionReaction: { clergy: 25, nobles: 5, commoners: -5 },
  },
  {
    id: 'holy_war', name: '圣战', description: '对异教国宣战加成，军方与神职满意度升，但外交恶化。',
    costAction: 1, costGold: 150, allowedGovernments: ['theocracy'],
    effects: { combatMod: 1.10, mobilizationMod: 1.20 },
    factionReaction: { military: 15, clergy: 15, merchants: -15, commoners: -10 },
  },
  {
    id: 'martial_law', name: '戒严令', description: '强化镇压，叛乱风险降，但民心与外交降。',
    costAction: 1, costGold: 80, allowedGovernments: ['junta', 'empire'],
    effects: { stabilityMod: 5, efficiencyMod: 5, influenceMod: -3 },
    factionReaction: { military: 10, commoners: -15, merchants: -10 },
  },
  {
    id: 'conscription', name: '全民征兵', description: '征兵速度大幅提升，但民众满意度降。',
    costAction: 1, costGold: 100, allowedGovernments: ['junta', 'empire', 'monarchy'],
    effects: { mobilizationMod: 1.30 },
    factionReaction: { military: 15, commoners: -15, merchants: -5 },
  },
  {
    id: 'centralization', name: '中央集权', description: '集权行政，税收与行政能力升，但地方叛乱升。',
    costAction: 2, costGold: 200, allowedGovernments: ['empire', 'monarchy'],
    effects: { taxEffMod: 1.10, efficiencyMod: 10, assimilationMod: 2 },
    factionReaction: { nobles: -10, merchants: -5, commoners: -5 },
  },
  {
    id: 'imperial_tax', name: '帝国税', description: '行省重税，国库升但地方不满。',
    costAction: 1, costGold: 120, allowedGovernments: ['empire'],
    effects: { taxEffMod: 1.15, stabilityMod: -5 },
    factionReaction: { nobles: 5, merchants: -10, commoners: -15 },
  },
  {
    id: 'anti_corruption', name: '反腐改革', description: '强力反腐，腐败大降但贵族不满。需行政科技 Lv3。',
    costAction: 2, costGold: 300, allowedGovernments: [],
    effects: { corruptionMod: -15, efficiencyMod: 10 },
    factionReaction: { nobles: -20, merchants: 10, commoners: 10 },
    prereqTech: 'admin_lv3',
  },
  {
    id: 'welfare', name: '福利政策', description: '安抚民众，满意度与人口增长升，但国库负担。',
    costAction: 1, costGold: 150, allowedGovernments: [],
    effects: { popGrowthMod: 1.10, stabilityMod: 3, taxRateMod: -0.02 },
    factionReaction: { commoners: 20, nobles: -10, merchants: -5 },
  },
  // ── B 扩展：13 个新政策 ──
  { id: 'education_reform', name: '教育改革', description: '广设学宫，提升科研与同化。', costAction: 2, costGold: 200, allowedGovernments: [], effects: { assimilationMod: 5, efficiencyMod: 3 }, factionReaction: { clergy: -8, commoners: 8 }, prereqTech: 'admin_lv3' },
  { id: 'merchant_guild', name: '商团特许', description: '授予商团专营权，贸易升但贵族不满。', costAction: 1, costGold: 120, allowedGovernments: ['republic', 'merchant_republic', 'monarchy'], effects: { taxEffMod: 1.08 }, factionReaction: { merchants: 18, nobles: -12 } },
  { id: 'land_reform', name: '均田令', description: '重新分配土地，民众大悦但贵族反弹。', costAction: 2, costGold: 180, allowedGovernments: ['empire', 'monarchy', 'republic'], effects: { popGrowthMod: 1.08, stabilityMod: 5 }, factionReaction: { commoners: 25, nobles: -25 } },
  { id: 'toleration', name: '宗教宽容', description: '宽容异教，降冲突但神职不满。', costAction: 1, costGold: 100, allowedGovernments: [], effects: { stabilityMod: 3, assimilationMod: 8 }, factionReaction: { clergy: -20, commoners: 5 } },
  { id: 'civil_service_exam', name: '科举制', description: '以考试选拔官吏，行政大升。需行政 Lv3。', costAction: 2, costGold: 250, allowedGovernments: ['empire', 'monarchy'], effects: { efficiencyMod: 15, corruptionMod: -8 }, factionReaction: { nobles: -18, commoners: 10 }, prereqTech: 'admin_lv3' },
  { id: 'military_reform', name: '军事改革', description: '重组军制，战斗力升但耗金。', costAction: 2, costGold: 200, allowedGovernments: ['empire', 'monarchy', 'junta'], effects: { combatMod: 1.15, mobilizationMod: 1.20 }, factionReaction: { military: 20, commoners: -8 } },
  { id: 'naval_expansion', name: '扩张舰队', description: '大力发展海军，海上贸易与战力升。', costAction: 2, costGold: 180, allowedGovernments: ['republic', 'merchant_republic', 'empire'], effects: { influenceMod: 1.10, combatMod: 1.10 }, factionReaction: { military: 12, merchants: 10 } },
  { id: 'agrarian_reform', name: '农本政策', description: '重农抑商，粮产升但贸易降。', costAction: 1, costGold: 100, allowedGovernments: ['empire', 'monarchy'], effects: { popGrowthMod: 1.06, taxRateMod: -0.01 }, factionReaction: { commoners: 12, merchants: -15 } },
  { id: 'infrastructure_plan', name: '基建振兴', description: '全国修路建桥，行政与贸易升。需行政 Lv2。', costAction: 2, costGold: 220, allowedGovernments: [], effects: { efficiencyMod: 8, taxEffMod: 1.05 }, factionReaction: { commoners: 8, merchants: 8 }, prereqTech: 'admin_lv2' },
  { id: 'census', name: '编户齐民', description: '普查人口，税收效率升。需行政 Lv2。', costAction: 1, costGold: 150, allowedGovernments: ['empire', 'monarchy'], effects: { taxEffMod: 1.10, efficiencyMod: 5 }, factionReaction: { nobles: -8 }, prereqTech: 'admin_lv2' },
  { id: 'diplomatic_corps', name: '外交使团', description: '设立专职外交机构，影响力产出升。', costAction: 1, costGold: 130, allowedGovernments: [], effects: { influenceMod: 1.15 }, factionReaction: { nobles: 5, merchants: 5 } },
  { id: 'cultural_patronage', name: '文化赞助', description: '赞助艺术学术，威望与同化升。', costAction: 1, costGold: 110, allowedGovernments: [], effects: { influenceMod: 1.08, assimilationMod: 3 }, factionReaction: { clergy: 5, commoners: 3 } },
  { id: 'succession_law', name: '继承法', description: '确立继承顺序，合法性大升但限制君主。', costAction: 2, costGold: 200, allowedGovernments: ['monarchy', 'empire'], effects: { stabilityMod: 8 }, factionReaction: { nobles: 15, military: -5 } },
  // ── D2 扩充：4 个质变政策，绑定 Lv5 科技解锁 ──
  { id: 'crop_rotation', name: '轮作政策', description: '科学轮作养地，粮产 +15%。需农业 Lv5。', costAction: 2, costGold: 280, allowedGovernments: [], effects: { popGrowthMod: 1.15 }, factionReaction: { commoners: 15, nobles: -5 }, prereqTech: 'agri_lv5' },
  { id: 'total_mobilization', name: '总动员', description: '全国动员，征兵 ×2 但厌战 +15。需军事 Lv5。', costAction: 3, costGold: 350, allowedGovernments: ['empire', 'junta', 'monarchy'], effects: { mobilizationMod: 2.0 }, factionReaction: { military: 25, commoners: -20 }, prereqTech: 'mil_lv5' },
  { id: 'civil_service_reform', name: '科举改革', description: '深化科举，腐败 -10、行政 +10。需行政 Lv5。', costAction: 3, costGold: 320, allowedGovernments: ['empire', 'monarchy', 'republic'], effects: { corruptionMod: -10, efficiencyMod: 10 }, factionReaction: { nobles: -22, commoners: 12, clergy: 5 }, prereqTech: 'admin_lv5' },
  { id: 'cultural_export', name: '文化输出', description: '向诸邦输出文化，影响力 +25%、外交 +10。需文化 Lv5。', costAction: 2, costGold: 260, allowedGovernments: [], effects: { influenceMod: 1.25, assimilationMod: 8 }, factionReaction: { clergy: 8, commoners: 5 }, prereqTech: 'culture_lv5' },
];

export const POLICY_BY_ID: Record<PolicyId, PolicyDef> = Object.fromEntries(
  POLICIES.map((p) => [p.id, p]),
) as Record<PolicyId, PolicyDef>;
