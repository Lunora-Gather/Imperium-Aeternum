// Imperium Aeternum — 国家表
// 数据源：docs/01-design-bible.md §5 / docs/02-system-rules.md §17
// FROZEN v1（阶段 3a）
// 5 国：玩家 n01（罗马小国）+ 4 AI n02..n05

import type { GovernmentId } from './governments';
import type { NationalCharacterId } from './national-characters';

// W1 架构重构：NationId 改为 string（支持 192 国数据驱动生成）
// DEC-012: union literal 无法表达 192 国，改为 string + 运行时校验
export type NationId = string;

// DEC-014: 国家体量分级（AI 分层结算依据）
export type NationTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface NationDef {
  id: NationId;
  name: string;
  isPlayer: boolean;
  tier: NationTier;              // W1.2: 体量分级
  government: GovernmentId;
  character: NationalCharacterId;   // 起始国家性格（倾向阈值起步）
  capital: string;                  // 省份 id
  // 起始资源
  initGold: number;
  initFood: number;
  initWood: number;
  initIron: number;
  // 起始税率
  initTaxRate: number;
  // 起始科技等级（每条路线 1-5）
  initTech: { agri: number; mil: number; admin: number };
  // 起始军队（部署于首都）
  initArmy: { size: number; morale: number; training: number; equipment: number };
  // 起始统治者能力（综合 35-65，影响多个公式修正）
  ruler: { name: string; ability: number; age: number };
  // AI 决策权重倍率（玩家忽略）
  aiWeights: {
    taxUp: number; buildFarm: number; suppress: number; expandArmy: number;
    alliance: number; declareWar: number; research: number;
  };
  // 起始外交关系（对其他国家）
  initRelations: { target: NationId; relation: number; trust: number }[];
}

export const NATIONS: NationDef[] = [
  // ── 玩家：罗马式小国 ──
  {
    id: 'n01', name: '罗马', isPlayer: true, tier: 'A',
    government: 'monarchy', character: 'balanced',
    capital: 'p01',
    initGold: 300, initFood: 400, initWood: 80, initIron: 30,
    initTaxRate: 0.15,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: { size: 200, morale: 60, training: 50, equipment: 40 },
    ruler: { name: '执政官布鲁图', ability: 50, age: 40 },
    aiWeights: { taxUp: 0, buildFarm: 0, suppress: 0, expandArmy: 0, alliance: 0, declareWar: 0, research: 0 },
    initRelations: [
      { target: 'n02', relation: -10, trust: 40 },
      { target: 'n03', relation: 20, trust: 55 },
      { target: 'n04', relation: -20, trust: 35 },
      { target: 'n05', relation: 0, trust: 50 },
    ],
  },
  // ── AI n02：北意大利联邦（商业共和） ──
  {
    id: 'n02', name: '维尼托联邦', isPlayer: false, tier: 'B',
    government: 'republic', character: 'commerce',
    capital: 'p05',
    initGold: 500, initFood: 350, initWood: 100, initIron: 60,
    initTaxRate: 0.18,
    initTech: { agri: 1, mil: 1, admin: 2 },
    initArmy: { size: 150, morale: 50, training: 45, equipment: 50 },
    ruler: { name: '执政官马尔科', ability: 55, age: 45 },
    aiWeights: { taxUp: 0.8, buildFarm: 1.0, suppress: 0.7, expandArmy: 0.6, alliance: 1.2, declareWar: 0.5, research: 1.0 },
    initRelations: [
      { target: 'n01', relation: -10, trust: 40 },
      { target: 'n03', relation: 0, trust: 50 },
      { target: 'n04', relation: 10, trust: 55 },
      { target: 'n05', relation: 0, trust: 50 },
    ],
  },
  // ── AI n03：大希腊叙拉古（科技国家） ──
  {
    id: 'n03', name: '叙拉古', isPlayer: false, tier: 'B',
    government: 'republic', character: 'technocracy',
    capital: 'p06',
    initGold: 350, initFood: 300, initWood: 70, initIron: 40,
    initTaxRate: 0.16,
    initTech: { agri: 2, mil: 1, admin: 2 },
    initArmy: { size: 180, morale: 55, training: 55, equipment: 55 },
    ruler: { name: '执政官阿基米德', ability: 60, age: 50 },
    aiWeights: { taxUp: 0.9, buildFarm: 1.0, suppress: 0.8, expandArmy: 0.7, alliance: 1.0, declareWar: 0.6, research: 1.8 },
    initRelations: [
      { target: 'n01', relation: 20, trust: 55 },
      { target: 'n02', relation: 0, trust: 50 },
      { target: 'n04', relation: -10, trust: 45 },
      { target: 'n05', relation: 10, trust: 55 },
    ],
  },
  // ── AI n04：东方帝国（高压帝国） ──
  {
    id: 'n04', name: '潘诺尼亚帝国', isPlayer: false, tier: 'A',
    government: 'empire', character: 'authoritarian',
    capital: 'p10',
    initGold: 400, initFood: 380, initWood: 120, initIron: 80,
    initTaxRate: 0.20,
    initTech: { agri: 1, mil: 2, admin: 1 },
    initArmy: { size: 250, morale: 60, training: 55, equipment: 55 },
    ruler: { name: '皇帝戴克里', ability: 50, age: 48 },
    aiWeights: { taxUp: 1.3, buildFarm: 0.9, suppress: 1.8, expandArmy: 1.2, alliance: 0.6, declareWar: 1.3, research: 0.7 },
    initRelations: [
      { target: 'n01', relation: -20, trust: 35 },
      { target: 'n02', relation: 10, trust: 55 },
      { target: 'n03', relation: -10, trust: 45 },
      { target: 'n05', relation: -30, trust: 30 },
    ],
  },
  // ── AI n05：蛮族联盟（军国主义，无开局省份，靠侵占领土） ──
  // 设计：开局在地图外，每 30 回合有概率入侵边境省份；玩家击退可获声望
  {
    id: 'n05', name: '蛮族联盟', isPlayer: false, tier: 'C',
    government: 'junta', character: 'militarism',
    capital: '',  // 无开局首都
    initGold: 200, initFood: 200, initWood: 50, initIron: 30,
    initTaxRate: 0.10,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: { size: 300, morale: 70, training: 40, equipment: 30 },
    ruler: { name: '蛮王亚拉里克', ability: 45, age: 35 },
    aiWeights: { taxUp: 1.2, buildFarm: 0.8, suppress: 1.5, expandArmy: 1.5, alliance: 0.7, declareWar: 1.8, research: 0.8 },
    initRelations: [
      { target: 'n01', relation: 0, trust: 50 },
      { target: 'n02', relation: 0, trust: 50 },
      { target: 'n03', relation: 10, trust: 55 },
      { target: 'n04', relation: -30, trust: 30 },
    ],
  },
];

export const NATION_BY_ID: Record<string, NationDef> = Object.fromEntries(
  NATIONS.map((n) => [n.id, n]),
) as Record<string, NationDef>;

export const PLAYER_ID: NationId = 'n01';
export const PLAYER_NATION = NATION_BY_ID['n01'];
export const AI_NATIONS = NATIONS.filter((n) => !n.isPlayer);
