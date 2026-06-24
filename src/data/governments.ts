// Imperium Aeternum — 政体表
// 数据源：docs/02-system-rules.md §8 / docs/formulas.md §3
// FROZEN v1（阶段 3a）

export type GovernmentId =
  | 'monarchy'
  | 'republic'
  | 'theocracy'
  | 'junta'
  | 'empire'
  | 'tribe'
  | 'federation'
  | 'tyrant'
  | 'constitutional'
  | 'merchant_republic'
  | 'priest_king'
  | 'nomad_khanate';

export interface GovernmentDef {
  id: GovernmentId;
  name: string;          // 中文显示名
  description: string;
  // 基础修正（叠加到对应公式）
  legitimacyBase: number;     // 起始合法性
  stabilityBase: number;      // 起始稳定度
  efficiencyBase: number;     // 起始行政能力
  corruptionBase: number;     // 起始腐败
  // 派系起始满意度修正（叠加到 Faction 起始值）
  factionSatMod: {
    nobles: number;
    merchants: number;
    military: number;
    commoners: number;
    clergy: number;
  };
  // 改革成本倍率（§3.3 改革成功率基础）
  reformCostMultiplier: number;
  // 战争动员效率（征兵速度倍率）
  mobilizationMultiplier: number;
  // 可解锁政策 id（在 policies.ts 中定义）
  unlockedPolicies: string[];
  // P1-3: 每回合被动效果
  perTurn?: {
    legitimacy?: number;   // 合法性/回合
    stability?: number;    // 稳定度/回合
    efficiency?: number;   // 行政效率/回合
    corruption?: number;   // 腐败/回合
    tradeMod?: number;     // 贸易收入乘数
    sciPtMod?: number;     // 科研乘数
    mobilizationMod?: number; // 动员乘数
    factionSat?: { nobles?: number; merchants?: number; military?: number; commoners?: number; clergy?: number };
  };
}

export const GOVERNMENTS: Record<GovernmentId, GovernmentDef> = {
  monarchy: {
    id: 'monarchy',
    name: '君主制',
    description: '王权世袭，贵族支持高，但改革缓慢，商人与学者不满。',
    legitimacyBase: 60,
    stabilityBase: 55,
    efficiencyBase: 40,
    corruptionBase: 25,
    factionSatMod: { nobles: 15, merchants: -5, military: 5, commoners: 0, clergy: 5 },
    reformCostMultiplier: 1.3,
    mobilizationMultiplier: 1.0,
    unlockedPolicies: ['land_privilege', 'royal_tax'],
    perTurn: { legitimacy: 0.2, factionSat: { nobles: 0.5, merchants: -0.3 } },
  },
  republic: {
    id: 'republic',
    name: '共和国',
    description: '议事决断，贸易与科技较强，但派系斗争激烈，动员较慢。',
    legitimacyBase: 50,
    stabilityBase: 50,
    efficiencyBase: 55,
    corruptionBase: 20,
    factionSatMod: { nobles: -10, merchants: 15, military: -5, commoners: 5, clergy: -5 },
    reformCostMultiplier: 0.9,
    mobilizationMultiplier: 0.85,
    unlockedPolicies: ['free_trade', 'civic_reform'],
    perTurn: { tradeMod: 1.1, sciPtMod: 1.03, factionSat: { merchants: 0.3, military: -0.2 } },
  },
  theocracy: {
    id: 'theocracy',
    name: '神权制',
    description: '教权至上，神职满意，异教地区治理压力大。',
    legitimacyBase: 55,
    stabilityBase: 55,
    efficiencyBase: 35,
    corruptionBase: 30,
    factionSatMod: { nobles: 0, merchants: -5, military: 0, commoners: 5, clergy: 25 },
    reformCostMultiplier: 1.2,
    mobilizationMultiplier: 0.9,
    unlockedPolicies: ['state_religion', 'holy_war'],
    perTurn: { legitimacy: 0.1, factionSat: { clergy: 0.5, commoners: -0.2 } },
  },
  junta: {
    id: 'junta',
    name: '军政府',
    description: '武力掌国，军队强大镇压高效，民心低外交声望差。',
    legitimacyBase: 35,
    stabilityBase: 50,
    efficiencyBase: 45,
    corruptionBase: 35,
    factionSatMod: { nobles: -5, merchants: -10, military: 25, commoners: -15, clergy: -10 },
    reformCostMultiplier: 1.1,
    mobilizationMultiplier: 1.3,
    unlockedPolicies: ['martial_law', 'conscription'],
    perTurn: { stability: 0.3, factionSat: { military: 0.5, commoners: -1 } },
  },
  empire: {
    id: 'empire',
    name: '帝国制',
    description: '中央集权，行政与税收强，但地方叛乱压力高。',
    legitimacyBase: 55,
    stabilityBase: 50,
    efficiencyBase: 60,
    corruptionBase: 30,
    factionSatMod: { nobles: 5, merchants: 5, military: 10, commoners: -5, clergy: 0 },
    reformCostMultiplier: 1.0,
    mobilizationMultiplier: 1.1,
    unlockedPolicies: ['centralization', 'imperial_tax'],
    perTurn: { efficiency: 0.3, corruption: 0.3, factionSat: { nobles: 0.2, merchants: 0.2 } },
  },
  tribe: {
    id: 'tribe', name: '部落制', description: '部落联盟，军事强但行政弱，难集权。',
    legitimacyBase: 40, stabilityBase: 60, efficiencyBase: 25, corruptionBase: 15,
    factionSatMod: { nobles: 10, merchants: -10, military: 15, commoners: 5, clergy: 5 },
    reformCostMultiplier: 1.5, mobilizationMultiplier: 1.2,
    unlockedPolicies: ['conscription'],
    perTurn: { factionSat: { military: 0.3, merchants: -0.3 } },
  },
  federation: {
    id: 'federation', name: '联邦制', description: '多邦联合，地方自治强，外交灵活但动员慢。',
    legitimacyBase: 50, stabilityBase: 60, efficiencyBase: 50, corruptionBase: 20,
    factionSatMod: { nobles: 5, merchants: 10, military: 0, commoners: 10, clergy: 0 },
    reformCostMultiplier: 0.95, mobilizationMultiplier: 0.9,
    unlockedPolicies: ['free_trade', 'civic_reform'],
    perTurn: { stability: 0.1, tradeMod: 1.05 },
  },
  tyrant: {
    id: 'tyrant', name: '僭主制', description: '武力篡权，军方拥戴但合法性低。',
    legitimacyBase: 25, stabilityBase: 45, efficiencyBase: 50, corruptionBase: 40,
    factionSatMod: { nobles: -20, merchants: -10, military: 20, commoners: -10, clergy: -15 },
    reformCostMultiplier: 0.8, mobilizationMultiplier: 1.3,
    unlockedPolicies: ['martial_law', 'conscription'],
    perTurn: { legitimacy: -0.3, factionSat: { military: 0.5, nobles: -0.5 } },
  },
  constitutional: {
    id: 'constitutional', name: '君主立宪', description: '王权受限，行政高效，改革快但王权弱。',
    legitimacyBase: 60, stabilityBase: 65, efficiencyBase: 65, corruptionBase: 15,
    factionSatMod: { nobles: 5, merchants: 15, military: -5, commoners: 10, clergy: 0 },
    reformCostMultiplier: 0.85, mobilizationMultiplier: 0.95,
    unlockedPolicies: ['free_trade', 'civic_reform', 'anti_corruption'],
    perTurn: { efficiency: 0.2, corruption: -0.2, factionSat: { merchants: 0.3 } },
  },
  merchant_republic: {
    id: 'merchant_republic', name: '商业共和国', description: '商人掌国，贸易极强但军事弱。',
    legitimacyBase: 45, stabilityBase: 50, efficiencyBase: 60, corruptionBase: 25,
    factionSatMod: { nobles: -15, merchants: 30, military: -10, commoners: 5, clergy: -5 },
    reformCostMultiplier: 0.9, mobilizationMultiplier: 0.75,
    unlockedPolicies: ['free_trade', 'welfare'],
    perTurn: { tradeMod: 1.15, factionSat: { merchants: 0.5, military: -0.3 } },
  },
  priest_king: {
    id: 'priest_king', name: '祭司王制', description: '王权与教权合一，神职极拥戴但异教省难治。',
    legitimacyBase: 65, stabilityBase: 60, efficiencyBase: 40, corruptionBase: 25,
    factionSatMod: { nobles: 5, merchants: -5, military: 5, commoners: 5, clergy: 30 },
    reformCostMultiplier: 1.3, mobilizationMultiplier: 0.95,
    unlockedPolicies: ['state_religion', 'holy_war'],
    perTurn: { legitimacy: 0.15, factionSat: { clergy: 0.5 } },
  },
  nomad_khanate: {
    id: 'nomad_khanate', name: '游牧汗国', description: '骑兵为王，机动极强但农耕弱、难定居。',
    legitimacyBase: 35, stabilityBase: 45, efficiencyBase: 30, corruptionBase: 20,
    factionSatMod: { nobles: 15, merchants: -5, military: 25, commoners: 0, clergy: -5 },
    reformCostMultiplier: 1.4, mobilizationMultiplier: 1.5,
    unlockedPolicies: ['conscription', 'holy_war'],
    perTurn: { factionSat: { military: 0.5, merchants: -0.3 } },
  },
};

export const GOVERNMENT_LIST: GovernmentDef[] = Object.values(GOVERNMENTS);
