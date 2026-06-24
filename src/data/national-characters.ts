// Imperium Aeternum — 国家性格倾向表
// 数据源：docs/02-system-rules.md §16
// FROZEN v1（阶段 3a）

export type NationalCharacterId =
  | 'militarism'
  | 'commerce'
  | 'religiosity'
  | 'technocracy'
  | 'authoritarian'
  | 'welfare'
  | 'feudal'
  | 'revolutionary'
  | 'maritime'
  | 'centralization'
  | 'balanced'; // 玩家默认未定

export interface NationalCharacterDef {
  id: NationalCharacterId;
  name: string;
  description: string;
  // 激活阈值（tendency ≥ 此值即激活）
  threshold: number;
  // 激活后加成（叠到对应公式）。bonuses 与 penalties 字段集合相同，
  // 同一字段可在任一侧出现（数值为加/减效果），避免分类纠结。
  bonuses: NationalCharacterMods;
  // 激活后副作用
  penalties: NationalCharacterMods;
}

// 共享字段集：bonuses 与 penalties 都允许这些字段
export interface NationalCharacterMods {
  combatMod?: number;
  moraleMod?: number;
  conscriptionMod?: number;
  tradeMod?: number;
  marketCostMod?: number;
  mobilizationMod?: number;
  sciPtMod?: number;
  legitimacyMod?: number;
  stabilityMod?: number;
  efficiencyMod?: number;
  assimilationMod?: number;
  popGrowthMod?: number;
  corruptionMod?: number;
  influenceMod?: number;
  relationMod?: number;
  warExhaustionMod?: number;
  noblesSat?: number;
  merchantsSat?: number;
  militarySat?: number;
  commonersSat?: number;
  clergySat?: number;
  adminMod?: number;
  rebellionMod?: number;
  goldMod?: number;
}

export const NATIONAL_CHARACTERS: Record<NationalCharacterId, NationalCharacterDef> = {
  militarism: {
    id: 'militarism', name: '军国主义', description: '黩武扩张，军队强但外交孤立。',
    threshold: 70,
    bonuses: { conscriptionMod: 1.20, moraleMod: 1.10 },
    penalties: { relationMod: -10, warExhaustionMod: 1.15 },
  },
  commerce: {
    id: 'commerce', name: '商业共和国', description: '重商轻武，贸易富但动员慢。',
    threshold: 70,
    bonuses: { tradeMod: 1.25, marketCostMod: 0.90 },
    penalties: { noblesSat: -10, mobilizationMod: 0.85 },
  },
  religiosity: {
    id: 'religiosity', name: '宗教帝国', description: '教权至上，神职拥戴但异教省叛乱。',
    threshold: 70,
    bonuses: { clergySat: 20, legitimacyMod: 5 },
    penalties: { rebellionMod: 1.20, sciPtMod: 0.90 },
  },
  technocracy: {
    id: 'technocracy', name: '科技国家', description: '科研强国，但贵族抵制。',
    threshold: 70,
    bonuses: { sciPtMod: 1.25 },
    penalties: { noblesSat: -10, stabilityMod: -5 },
  },
  authoritarian: {
    id: 'authoritarian', name: '高压帝国', description: '铁腕镇压，稳定但民心低。',
    threshold: 70,
    bonuses: { stabilityMod: 10, efficiencyMod: 5 },
    penalties: { commonersSat: -20, relationMod: -15 },
  },
  welfare: {
    id: 'welfare', name: '福利国家', description: '怀柔惠民，民众拥戴但国库负担。',
    threshold: 70,
    bonuses: { commonersSat: 15, popGrowthMod: 1.10 },
    penalties: { goldMod: -15, noblesSat: -10 },
  },
  feudal: {
    id: 'feudal', name: '封建国家', description: '贵族特权，王权稳固但行政低效。',
    threshold: 70,
    bonuses: { noblesSat: 20, legitimacyMod: 5 },
    penalties: { efficiencyMod: -10, merchantsSat: -10 },
  },
  revolutionary: {
    id: 'revolutionary', name: '革命共和国', description: '激进改革，民众拥护但邻国警惕。',
    threshold: 70,
    bonuses: { commonersSat: 15 },
    penalties: { noblesSat: -30 },
  },
  maritime: {
    id: 'maritime', name: '海洋贸易', description: '重视海贸，贸易强但陆军弱。',
    threshold: 70,
    bonuses: { tradeMod: 1.30 },
    penalties: { combatMod: 0.90 },
  },
  centralization: {
    id: 'centralization', name: '中央集权', description: '集权高效，但地方反弹。',
    threshold: 70,
    bonuses: { efficiencyMod: 15, tradeMod: 1.10 },
    penalties: { rebellionMod: 1.15, merchantsSat: -5 },
  },
  balanced: {
    id: 'balanced', name: '均衡发展', description: '无明显倾向，玩家默认。',
    threshold: 0,
    bonuses: {},
    penalties: {},
  },
};

// 玩家行为 → 倾向值累积映射（每行为权重）
export interface BehaviorMapping {
  actionId: string;
  tendencyGain: Partial<Record<NationalCharacterId, number>>;
}

export const BEHAVIOR_MAPPINGS: BehaviorMapping[] = [
  { actionId: 'declare_war', tendencyGain: { militarism: 3 } },
  { actionId: 'build_market', tendencyGain: { commerce: 2, maritime: 1 } },
  { actionId: 'research_tech', tendencyGain: { technocracy: 2 } },
  { actionId: 'suppress_populace', tendencyGain: { authoritarian: 3 } },
  { actionId: 'appease_populace', tendencyGain: { welfare: 2 } },
  { actionId: 'protect_nobles', tendencyGain: { feudal: 2 } },
  { actionId: 'persecute_religion', tendencyGain: { religiosity: 3, authoritarian: 1 } },
  { actionId: 'radical_reform', tendencyGain: { revolutionary: 2 } },
  { actionId: 'centralize', tendencyGain: { centralization: 2 } },
  { actionId: 'build_farm', tendencyGain: { welfare: 1 } },
  { actionId: 'build_road', tendencyGain: { centralization: 1 } },
  { actionId: 'conscription', tendencyGain: { militarism: 1 } },
];

export const BEHAVIOR_MAP_BY_ACTION: Record<string, BehaviorMapping> = Object.fromEntries(
  BEHAVIOR_MAPPINGS.map((b) => [b.actionId, b]),
);
