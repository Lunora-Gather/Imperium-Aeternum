// Imperium Aeternum — 法律表（C2 法律树 v1）
// 3 大类 × 4 条 = 12 条法律。每条含政体限制、前置科技、效果、派系反应。
// 数据源：docs/02-system-rules.md §8 政治系统 + v2 §4 轨道 C2

export type LawCategory = 'civil' | 'criminal' | 'administrative';

export interface LawDef {
  id: string;
  name: string;
  category: LawCategory;
  description: string;
  costGold: number;
  // 允许的政体（空数组=所有政体均可）
  allowedGovernments: string[];
  // 前置行政科技等级
  prereqAdminLevel: number;
  // 互斥法律（已推行则不可推行本条）
  conflictsWith?: string[];
  // 效果（与 Policy.effects 类似的声明式 patch）
  effects: {
    corruptionMod?: number;       // 腐败变化
    stabilityMod?: number;        // 稳定度变化
    efficiencyMod?: number;       // 行政能力变化
    legitimacyMod?: number;       // 合法性变化
    taxEffMod?: number;           // 税收效率乘数（1.0=不变）
    unrestReduction?: number;     // 每回合不满度额外减少
    rebellionReduction?: number;  // 叛乱风险额外减少
  };
  // 派系反应（推行时一次性）
  factionReaction: Record<string, number>;
}

export const LAWS: LawDef[] = [
  // ── 民法类（civil）── 关乎产权、婚姻、契约
  {
    id: 'law_civil_code', name: '成文法典', category: 'civil',
    description: '颁布成文法，明示律令，限制官吏擅权。',
    costGold: 120, allowedGovernments: [], prereqAdminLevel: 2,
    effects: { corruptionMod: -5, stabilityMod: 5, legitimacyMod: 8, efficiencyMod: 3 },
    factionReaction: { nobles: -10, commoners: 12, merchants: 8 },
  },
  {
    id: 'law_land_reform', name: '土地改革', category: 'civil',
    description: '限制贵族占地，重分土地于农民。',
    costGold: 200, allowedGovernments: ['republic', 'monarchy', 'empire', 'theocracy'], prereqAdminLevel: 3,
    conflictsWith: ['law_noble_privilege'],
    effects: { stabilityMod: 3, efficiencyMod: 5, taxEffMod: 1.05, unrestReduction: 1 },
    factionReaction: { nobles: -20, commoners: 18, merchants: 5 },
  },
  {
    id: 'law_noble_privilege', name: '贵族特权法', category: 'civil',
    description: '以法律固化贵族特权，换取其支持。',
    costGold: 80, allowedGovernments: ['monarchy', 'empire', 'feudal'], prereqAdminLevel: 1,
    conflictsWith: ['law_land_reform', 'law_equal_tax'],
    effects: { stabilityMod: 4, legitimacyMod: 5, efficiencyMod: -3, corruptionMod: 3 },
    factionReaction: { nobles: 20, commoners: -10, merchants: -5 },
  },
  {
    id: 'law_equal_tax', name: '均税法', category: 'civil',
    description: '贵族商人一体纳税，废除免税特权。',
    costGold: 150, allowedGovernments: ['republic', 'empire', 'theocracy'], prereqAdminLevel: 3,
    conflictsWith: ['law_noble_privilege'],
    effects: { taxEffMod: 1.10, corruptionMod: -3, efficiencyMod: 4 },
    factionReaction: { nobles: -15, merchants: -8, commoners: 10 },
  },
  // ── 刑法类（criminal）── 关乎治安、刑罚
  {
    id: 'law_strict_punishment', name: '严刑峻法', category: 'criminal',
    description: '重刑惩治盗匪叛乱，震慑地方。',
    costGold: 60, allowedGovernments: [], prereqAdminLevel: 1,
    effects: { stabilityMod: 3, efficiencyMod: 2, unrestReduction: 2, rebellionReduction: 3 },
    factionReaction: { military: 8, commoners: -8, nobles: 3 },
  },
  {
    id: 'law_mercy_policy', name: '宽刑省罚', category: 'criminal',
    description: '减轻刑罚，以仁政收人心。',
    costGold: 50, allowedGovernments: ['republic', 'theocracy', 'monarchy'], prereqAdminLevel: 2,
    conflictsWith: ['law_strict_punishment'],
    effects: { stabilityMod: 5, legitimacyMod: 3, efficiencyMod: -2 },
    factionReaction: { commoners: 12, clergy: 8, military: -6 },
  },
  {
    id: 'law_conscription', name: '征兵法', category: 'criminal',
    description: '依法强制征兵，扩充军力。',
    costGold: 100, allowedGovernments: [], prereqAdminLevel: 2,
    effects: { efficiencyMod: 3, stabilityMod: -2, unrestReduction: -1 },
    factionReaction: { military: 15, commoners: -12, nobles: 3 },
  },
  {
    id: 'law_anti_corruption', name: '反腐律', category: 'criminal',
    description: '严惩贪墨，设监察之职。',
    costGold: 180, allowedGovernments: [], prereqAdminLevel: 3,
    effects: { corruptionMod: -10, efficiencyMod: 5, stabilityMod: 2 },
    factionReaction: { nobles: -12, merchants: 5, commoners: 10 },
  },
  // ── 行政法类（administrative）── 关乎官僚、地方、税收
  {
    id: 'law_civil_service', name: '科举考绩法', category: 'administrative',
    description: '以考试选官，打破世袭。',
    costGold: 150, allowedGovernments: ['empire', 'republic', 'monarchy'], prereqAdminLevel: 3,
    effects: { efficiencyMod: 8, corruptionMod: -4, legitimacyMod: 4 },
    factionReaction: { nobles: -15, clergy: 5, scholars: 15 },
  },
  {
    id: 'law_decentralization', name: '地方自治法', category: 'administrative',
    description: '放权地方，减轻中央负担。',
    costGold: 100, allowedGovernments: ['republic', 'feudal', 'tribal'], prereqAdminLevel: 2,
    conflictsWith: ['law_centralization'],
    effects: { efficiencyMod: -3, stabilityMod: 4, taxEffMod: 0.97, unrestReduction: 1 },
    factionReaction: { nobles: 10, commoners: 5, merchants: 3 },
  },
  {
    id: 'law_centralization', name: '中央集权法', category: 'administrative',
    description: '收归地方权力于中央。',
    costGold: 200, allowedGovernments: ['empire', 'monarchy', 'theocracy', 'military'], prereqAdminLevel: 3,
    conflictsWith: ['law_decentralization'],
    effects: { efficiencyMod: 6, taxEffMod: 1.04, stabilityMod: -2 },
    factionReaction: { nobles: -8, military: 8, commoners: -3 },
  },
  {
    id: 'law_trade_regulation', name: '商律', category: 'administrative',
    description: '规范市场，保护契约。',
    costGold: 120, allowedGovernments: [], prereqAdminLevel: 2,
    effects: { taxEffMod: 1.03, efficiencyMod: 2, corruptionMod: -2 },
    factionReaction: { merchants: 15, nobles: -3, commoners: 3 },
  },
];

export const LAW_BY_ID: Record<string, LawDef> = Object.fromEntries(
  LAWS.map((l) => [l.id, l]),
);
export const LAW_IDS: string[] = LAWS.map((l) => l.id);
export const LAW_COUNT = LAWS.length;

// 按类别分组（UI 用）
export const LAWS_BY_CATEGORY: Record<LawCategory, LawDef[]> = {
  civil: LAWS.filter((l) => l.category === 'civil'),
  criminal: LAWS.filter((l) => l.category === 'criminal'),
  administrative: LAWS.filter((l) => l.category === 'administrative'),
};

export const LAW_CATEGORY_LABEL: Record<LawCategory, string> = {
  civil: '民法',
  criminal: '刑法',
  administrative: '行政法',
};
