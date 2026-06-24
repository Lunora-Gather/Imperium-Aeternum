// Imperium Aeternum — 科技表
// 数据源：docs/02-system-rules.md §13 / docs/formulas.md §7
// FROZEN v1（阶段 3a）

export type TechBranch = 'agri' | 'mil' | 'admin' | 'culture';

export interface TechnologyDef {
  id: string;             // 唯一 id，如 'agri_lv1'
  branch: TechBranch;
  level: number;          // 1-5
  name: string;
  description: string;
  costSci: number;        // §7.2 baseCost × level²
  costGold: number;
  prereqTech?: string;    // 上一级 id（线性树）
  // 加成（叠到对应公式修正系数）
  effects: {
    agriYieldMod?: number;       // 粮产倍率（1 + Lv×0.08）
    popGrowthMod?: number;       // 人口增长倍率
    combatMod?: number;          // 战斗力倍率
    equipMod?: number;           // 装备修正
    supplyMod?: number;          // 补给效率
    taxEffMod?: number;          // 税收效率倍率（1 + Lv×0.06）
    corruptionReduction?: number; // 腐败 -5/级
    efficiencyMod?: number;      // 行政能力 +5/级
    maxProvinceBonus?: number;   // 可管省 +1/级
    legitimacyMod?: number;      // E18: 合法性加成
    influenceMod?: number;       // E18: 影响力产出加成
    assimilationMod?: number;    // E18: 同化速度加成
    cultureExportMod?: number;   // E18: 文化输出效果倍率
  };
}

export const TECHNOLOGIES: TechnologyDef[] = [
  // ── 农业科技 ──
  {
    id: 'agri_lv1', branch: 'agri', level: 1, name: '休耕轮作',
    description: '基础耕作改进，提升粮食产量。',
    costSci: 100, costGold: 50,
    effects: { agriYieldMod: 1.08, popGrowthMod: 1.05 },
  },
  {
    id: 'agri_lv2', branch: 'agri', level: 2, name: '铁制农具',
    description: '推广铁犁铁锄，粮产再提升。',
    costSci: 400, costGold: 100, prereqTech: 'agri_lv1',
    effects: { agriYieldMod: 1.16, popGrowthMod: 1.10 },
  },
  {
    id: 'agri_lv3', branch: 'agri', level: 3, name: '水利工程',
    description: '灌溉系统，旱涝保收。',
    costSci: 900, costGold: 200, prereqTech: 'agri_lv2',
    effects: { agriYieldMod: 1.24, popGrowthMod: 1.15 },
  },
  {
    id: 'agri_lv4', branch: 'agri', level: 4, name: '选种育种',
    description: '良种繁育，粮食大幅提升。',
    costSci: 1600, costGold: 400, prereqTech: 'agri_lv3',
    effects: { agriYieldMod: 1.32, popGrowthMod: 1.20 },
  },
  {
    id: 'agri_lv5', branch: 'agri', level: 5, name: '农业革命',
    description: '系统化农业科学，粮产登顶。',
    costSci: 2500, costGold: 800, prereqTech: 'agri_lv4',
    effects: { agriYieldMod: 1.40, popGrowthMod: 1.25 },
  },
  // ── 军事科技 ──
  {
    id: 'mil_lv1', branch: 'mil', level: 1, name: '常备军制',
    description: '建立职业军队，提升训练度。',
    costSci: 100, costGold: 100,
    effects: { combatMod: 1.08 },
  },
  {
    id: 'mil_lv2', branch: 'mil', level: 2, name: '铁制武器',
    description: '装备铁兵器，战斗力提升。',
    costSci: 400, costGold: 200, prereqTech: 'mil_lv1',
    effects: { combatMod: 1.16, equipMod: 1.05 },
  },
  {
    id: 'mil_lv3', branch: 'mil', level: 3, name: '后勤体系',
    description: '补给系统，远征能力提升。',
    costSci: 900, costGold: 400, prereqTech: 'mil_lv2',
    effects: { combatMod: 1.24, supplyMod: 1.05 },
  },
  {
    id: 'mil_lv4', branch: 'mil', level: 4, name: '精锐部队',
    description: '解锁精锐兵营，装备顶级。',
    costSci: 1600, costGold: 800, prereqTech: 'mil_lv3',
    effects: { combatMod: 1.32, equipMod: 1.10, supplyMod: 1.10 },
  },
  {
    id: 'mil_lv5', branch: 'mil', level: 5, name: '军事学说',
    description: '系统化军事理论，战力登顶。',
    costSci: 2500, costGold: 1600, prereqTech: 'mil_lv4',
    effects: { combatMod: 1.40, equipMod: 1.15, supplyMod: 1.15 },
  },
  // ── 行政科技 ──
  {
    id: 'admin_lv1', branch: 'admin', level: 1, name: '官僚体系',
    description: '建立文官制度，税收效率提升。',
    costSci: 100, costGold: 80,
    effects: { taxEffMod: 1.06, efficiencyMod: 5, maxProvinceBonus: 1 },
  },
  {
    id: 'admin_lv2', branch: 'admin', level: 2, name: '律法编纂',
    description: '统一律法，腐败下降。解锁学院。',
    costSci: 400, costGold: 160, prereqTech: 'admin_lv1',
    effects: { taxEffMod: 1.12, corruptionReduction: 5, efficiencyMod: 10, maxProvinceBonus: 2 },
  },
  {
    id: 'admin_lv3', branch: 'admin', level: 3, name: '审计制度',
    description: '反腐审计，腐败大降。解锁法院、反腐改革。',
    costSci: 900, costGold: 320, prereqTech: 'admin_lv2',
    effects: { taxEffMod: 1.18, corruptionReduction: 10, efficiencyMod: 15, maxProvinceBonus: 3 },
  },
  {
    id: 'admin_lv4', branch: 'admin', level: 4, name: '行省制度',
    description: '地方分权，可管省大增。',
    costSci: 1600, costGold: 640, prereqTech: 'admin_lv3',
    effects: { taxEffMod: 1.24, corruptionReduction: 15, efficiencyMod: 20, maxProvinceBonus: 4 },
  },
  {
    id: 'admin_lv5', branch: 'admin', level: 5, name: '中央集权',
    description: '高度集权，行政登顶。',
    costSci: 2500, costGold: 1280, prereqTech: 'admin_lv4',
    effects: { taxEffMod: 1.30, corruptionReduction: 20, efficiencyMod: 25, maxProvinceBonus: 5 },
  },
  // ── B 扩展：每路加 Lv6-8，扩到 24 科技 ──
  // 农业 Lv6-8
  { id: 'agri_lv6', branch: 'agri', level: 6, name: '杂交选育', description: '选育良种，粮产飞跃。', costSci: 3600, costGold: 1000, prereqTech: 'agri_lv5', effects: { agriYieldMod: 1.48, popGrowthMod: 1.30 } },
  { id: 'agri_lv7', branch: 'agri', level: 7, name: '农学集大成', description: '农学体系化，旱涝保收。', costSci: 4900, costGold: 1400, prereqTech: 'agri_lv6', effects: { agriYieldMod: 1.56, popGrowthMod: 1.35 } },
  { id: 'agri_lv8', branch: 'agri', level: 8, name: '万顷膏壤', description: '全面改良土壤，粮产登顶。', costSci: 6400, costGold: 1800, prereqTech: 'agri_lv7', effects: { agriYieldMod: 1.64, popGrowthMod: 1.40 } },
  // 军事 Lv6-8
  { id: 'mil_lv6', branch: 'mil', level: 6, name: '重装步兵', description: '重甲精锐，摧枯拉朽。', costSci: 3600, costGold: 1000, prereqTech: 'mil_lv5', effects: { combatMod: 1.48, equipMod: 1.20, supplyMod: 1.16 } },
  { id: 'mil_lv7', branch: 'mil', level: 7, name: '机动战法', description: '高度机动，出奇制胜。', costSci: 4900, costGold: 1400, prereqTech: 'mil_lv6', effects: { combatMod: 1.56, equipMod: 1.25, supplyMod: 1.20 } },
  { id: 'mil_lv8', branch: 'mil', level: 8, name: '天下雄师', description: '军威震四方，战无不胜。', costSci: 6400, costGold: 1800, prereqTech: 'mil_lv7', effects: { combatMod: 1.64, equipMod: 1.30, supplyMod: 1.25 } },
  // 行政 Lv6-8
  { id: 'admin_lv6', branch: 'admin', level: 6, name: '文官制度', description: '专业文官体系，行政登顶。', costSci: 3600, costGold: 1000, prereqTech: 'admin_lv5', effects: { taxEffMod: 1.36, corruptionReduction: 25, efficiencyMod: 30, maxProvinceBonus: 6 } },
  { id: 'admin_lv7', branch: 'admin', level: 7, name: '帝国律令', description: '统一律令，四海归治。', costSci: 4900, costGold: 1400, prereqTech: 'admin_lv6', effects: { taxEffMod: 1.42, corruptionReduction: 30, efficiencyMod: 35, maxProvinceBonus: 7 } },
  { id: 'admin_lv8', branch: 'admin', level: 8, name: '万世之法', description: '永恒法度，社稷长治。', costSci: 6400, costGold: 1800, prereqTech: 'admin_lv7', effects: { taxEffMod: 1.50, corruptionReduction: 40, efficiencyMod: 45, maxProvinceBonus: 10 } },
  // ── E18: 文化科技 Lv1-8（第四分支，影响合法性/影响力/同化/文化输出）──
  { id: 'culture_lv1', branch: 'culture', level: 1, name: '礼乐初兴', description: '确立礼乐制度，合法性根基初固。', costSci: 100, costGold: 60, effects: { legitimacyMod: 5, assimilationMod: 1 } },
  { id: 'culture_lv2', branch: 'culture', level: 2, name: '典籍编纂', description: '汇编典籍，文化影响力扩散。', costSci: 400, costGold: 180, prereqTech: 'culture_lv1', effects: { legitimacyMod: 8, influenceMod: 2, assimilationMod: 2 } },
  { id: 'culture_lv3', branch: 'culture', level: 3, name: '教化万民', description: '推行教化，同化速度大增。', costSci: 900, costGold: 360, prereqTech: 'culture_lv2', effects: { legitimacyMod: 12, influenceMod: 3, assimilationMod: 3, cultureExportMod: 1.10 } },
  { id: 'culture_lv4', branch: 'culture', level: 4, name: '盛世文运', description: '文艺鼎盛，影响力辐射邻邦。', costSci: 1600, costGold: 720, prereqTech: 'culture_lv3', effects: { legitimacyMod: 16, influenceMod: 5, assimilationMod: 4, cultureExportMod: 1.20 } },
  { id: 'culture_lv5', branch: 'culture', level: 5, name: '万邦来朝', description: '文化鼎盛，诸邦仰慕归心。', costSci: 2500, costGold: 1440, prereqTech: 'culture_lv4', effects: { legitimacyMod: 20, influenceMod: 7, assimilationMod: 5, cultureExportMod: 1.30 } },
  { id: 'culture_lv6', branch: 'culture', level: 6, name: '学术百家', description: '百家争鸣，科研与影响力双升。', costSci: 3600, costGold: 1000, prereqTech: 'culture_lv5', effects: { legitimacyMod: 25, influenceMod: 9, assimilationMod: 6, cultureExportMod: 1.40 } },
  { id: 'culture_lv7', branch: 'culture', level: 7, name: '文明之光', description: '文明登顶，光照四海。', costSci: 4900, costGold: 1400, prereqTech: 'culture_lv6', effects: { legitimacyMod: 30, influenceMod: 12, assimilationMod: 8, cultureExportMod: 1.55 } },
  { id: 'culture_lv8', branch: 'culture', level: 8, name: '永恒文脉', description: '文脉永续，帝国精神不朽。', costSci: 6400, costGold: 1800, prereqTech: 'culture_lv7', effects: { legitimacyMod: 40, influenceMod: 15, assimilationMod: 10, cultureExportMod: 1.70 } },
];

export const TECH_BY_ID: Record<string, TechnologyDef> = Object.fromEntries(
  TECHNOLOGIES.map((t) => [t.id, t]),
);
