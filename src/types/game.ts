// Imperium Aeternum — 全局类型定义
// 数据源：docs/02-system-rules.md / docs/formulas.md
// FROZEN v1（阶段 4）

import type { NationId, NationTier } from '../data/nations';
import type { GovernmentId } from '../data/governments';
import type { NationalCharacterId } from '../data/national-characters';
import type { FactionId } from '../data/factions';
import type { BuildingId } from '../data/buildings';
import type {
  Terrain, CultureId, ReligionId,
} from '../data/provinces';
import type { PolicyId } from '../data/policies';

// ── 资源堆叠 ──
export interface ResourceStockpile {
  gold: number;
  food: number;
  wood: number;
  iron: number;
  adminPt: number;
  sciPt: number;
  influence: number;
  supply: number;
}

// ── 人口阶层（每省每阶层一份） ──
export type ClassId = 'peasants' | 'workers' | 'merchants' | 'soldiers' | 'scholars' | 'nobles' | 'clergy';

export interface PopulationGroup {
  classId: ClassId;
  count: number;
  satisfaction: number;       // 0-100
}

// ── 派系（国家级）──
export interface Faction {
  id: FactionId;
  power: number;              // 0-100
  satisfaction: number;       // 0-100
}

// ── 建筑（已建造实例）──
export interface BuildingInstance {
  id: string;                 // 实例唯一 uuid
  defId: BuildingId;
  provinceId: string;
  level: number;
}

// ── 省份（运行时状态） ──
export interface Province {
  id: string;
  name: string;
  terrain: Terrain;
  ownerId: NationId;
  isCapital: boolean;
  agriBase: number;
  culture: CultureId;
  religion: ReligionId;
  population: number;                    // 总人口
  classes: PopulationGroup[];            // 7 阶层
  assimilation: number;                  // 0-100 同化度
  loyalty: number;                       // 0-100 忠诚度
  unrest: number;                        // 0-100 不满度
  rebellionRisk: number;                 // 0-100 叛乱风险
  buildings: BuildingInstance[];
  garrison: number;                      // 驻军数量
  baseResources: { wood?: number; iron?: number };
  adjacent: string[];
  distToPlayerCapital: number;
  x: number;                              // SVG 坐标
  y: number;
}

// ── 军队 ──
export interface Army {
  id: string;
  ownerId: NationId;
  location: string;          // 省份 id
  size: number;
  morale: number;            // 0-100
  training: number;          // 0-100
  equipment: number;         // 0-100
  supply: number;            // 0-100
}

// ── 战争 ──
export interface BattleReport {
  turn: number;
  attSize: number;
  defSize: number;
  attLoss: number;
  defLoss: number;
  progressDelta: number;
  outcome: 'advance' | 'stalemate' | 'repelled';
  narrative: string;
}

export interface War {
  id: string;
  attackerId: NationId;
  defenderId: NationId;
  targetProvinceId: string;
  progress: number;          // 0-100，进攻方占
  turns: number;
  battleReports: BattleReport[];  // E13: 战报叙事
}

// ── 外交关系 ──
export type TreatyType = 'none' | 'trade' | 'alliance' | 'war' | 'truce';

export interface DiplomaticRelation {
  from: NationId;
  to: NationId;
  relation: number;          // -100-100
  trust: number;             // 0-100
  threat: number;            // 0-100
  tradeDep: number;          // 0-100
  treaty: TreatyType;
  truceTurns: number;
}

export type SummitAgenda = 'trade' | 'security' | 'normalization' | 'technology';
export type SummitStance = 'conciliatory' | 'pragmatic' | 'firm';
export type SummitOutcome = 'rejected' | 'breakdown' | 'stalemate' | 'agreement' | 'breakthrough';

export interface DiplomaticSummitRecord {
  id: string;
  turn: number;
  initiatorId: NationId;
  targetId: NationId;
  agenda: SummitAgenda;
  stance: SummitStance;
  outcome: SummitOutcome;
  score: number;
  summary: string;
  commitments: string[];
}

export interface DiplomaticAccord {
  id: string;
  partyA: NationId;
  partyB: NationId;
  agenda: SummitAgenda;
  startedTurn: number;
  expiresTurn: number;
  strength: 1 | 2;
}

// ── 国家性格倾向值 ──
export interface NationalTendency {
  militarism: number;
  commerce: number;
  religiosity: number;
  technocracy: number;
  authoritarian: number;
  welfare: number;
  feudal: number;
  revolutionary: number;
  maritime: number;
  centralization: number;
  // ── D6 扩充：+4 倾向到 14 ──
  isolationist: number;
  expansionist: number;
  scholarly: number;
  mercantilist: number;
}

// ── 政府与政策 ──
export interface Government {
  type: GovernmentId;
  legitimacy: number;
  stability: number;
  efficiency: number;
  corruption: number;
}

export interface ActivePolicy {
  policyId: PolicyId;
  enactedTurn: number;
}

// ── 已推行法律（C2 法律树）──
export interface ActiveLaw {
  lawId: string;
  enactedTurn: number;
}

// ── 已建立贸易路线（C3 贸易路线）──
export interface ActiveTradeRoute {
  routeId: string;
  establishedTurn: number;
}

// ── 科技状态 ──
export interface TechState {
  agri: number;              // 1-8
  mil: number;
  admin: number;
  culture: number;           // E18: 文化科技 1-8
  researchProgress: { techId: string; sciPtInvested: number } | null;
}

// ── 统治者 ──
export interface Ruler {
  name: string;
  ability: number;           // 35-65
  age: number;
  // 王朝系统：继承人（未即位）
  heir?: { name: string; ability: number; age: number };
  // 在位年数（影响合法性演变）
  reignYears?: number;
}

// ── 事件触发冷却记录 ──
export interface EventCooldown {
  /** Missing only on legacy saves; new records are always scoped to one nation. */
  nationId?: NationId;
  eventId: string;
  lastTriggeredTurn: number;
}

// ── 已触发的唯一事件 ──
export interface TriggeredEvent {
  /** Missing only on legacy saves; new records are always scoped to one nation. */
  nationId?: NationId;
  eventId: string;
  turn: number;
  optionIndex: number;
}

// ── 回合报告 ──
export interface TurnReport {
  turn: number;
  nationId: NationId;
  income: { tax: number; trade: number; building: number };
  expense: { military: number; corruption: number };
  foodDelta: number;
  popDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  events: string[];                 // 触发的事件 id
  warnings: string[];               // 警告文案
  // E23: 战争进展叙事 + 派系动态
  warProgress: { target: string; progressDelta: number; outcome: string }[];  // 本回合玩家参与的战争进展
  factionDelta: { id: string; delta: number }[];   // 本回合派系满意度变化
  exhaustSnapshot: number;   // P2: 本回合结算时的厌战值快照（sparkline 用，避免历史填当前值导致平线）
  // A4: 天下大势——本回合 AI 重要行为叙事（仅玩家邻国/相关，上限 10 条防溢出）
  worldEvents: string[];
  // B2: 省份归属变化——本回合玩家获得/失去的省份
  provinceChanges: { id: string; name: string; from: string; to: string }[];
}

// ── 国家运行时状态 ──
export interface Nation {
  id: NationId;
  name: string;
  isPlayer: boolean;
  tier: NationTier;             // W1.2: 体量分级（AI 分层结算依据）
  government: Government;
  character: NationalCharacterId;
  tendency: NationalTendency;
  activeCharacterBonuses: NationalCharacterId[];  // 已激活的性格
  capital: string;
  ruler: Ruler;
  taxRate: number;                  // 0-0.5
  resources: ResourceStockpile;
  factions: Faction[];
  tech: TechState;
  army: Army[];
  activePolicies: ActivePolicy[];
  activeLaws: ActiveLaw[];          // C2: 已推行法律
  activeTradeRoutes: ActiveTradeRoute[];  // C3: 已建立贸易路线
  embargoedRoutes: string[];              // E16: 禁运的贸易路线 id
  warExhaustion: number;            // 0-100
  influence: number;
  atWar: boolean;
  defeated: boolean;
  // A1: 叛军临时 Nation 字段——叛乱省创建临时 Nation，rebellionDecay 每回合递减，归 0 时省归顺原主
  rebellionDecay?: number;          // 叛军剩余回合数（仅 rebel_* Nation 用，未定义=非叛军）
  rebelOf?: string;                 // 叛军原主国 id（归顺时恢复 ownerId）
  // A2: 内战状态——3-4 省叛乱时激活，玩家可镇压或谈判
  civilWar?: { active: boolean; rebels: string[] };  // rebels=叛军 Nation id 列表
  // B8: 政体切换反扑窗口——changeGovernment 设 3，每回合递减，归 0 关闭；rollEvents 检测此字段触发反扑事件
  govTransitionTurns?: number;
  // P-fix: 政策/法律的修正系数（引擎读取，弥补原 effects 静默忽略的漏洞）
  policyMods?: {
    combatMod?: number;          // 战斗力倍率（军事改革等）
    assimilationMod?: number;    // 同化速度加成（教育改革/宗教宽容等）
    popGrowthMod?: number;       // 人口增长倍率（均田令/福利等）
    mobilizationMod?: number;    // 征兵速度倍率（军事改革/圣战等）
    taxEffMod?: number;          // 税收效率倍率（中央集权/编户齐民等）
    influenceMod?: number;       // 影响力产出倍率（外交使团/文化赞助等）
  };
}

// ── 史册（E12：里程碑叙事）──
export interface ChronicleEntry {
  id?: string;                 // 可选唯一标识（milestone 类用）
  turn: number;
  kind: 'founding' | 'expansion' | 'population' | 'victory' | 'crisis' | 'reform' | 'trade' | 'tech' | 'reign'
      | 'milestone_war' | 'milestone_diplomacy' | 'milestone_rebellion';
  title: string;
  desc: string;
  actorId?: string;            // 可选当事国 id（milestone 类用）
}

// ── 长期目标与战略状态 ──
export type StrategyFocusId = 'balance' | 'stability' | 'prosperity' | 'military' | 'diplomacy' | 'reform';
export type AIFocusKind = 'expansion' | 'trade' | 'recovery' | 'defense' | 'research';

export interface AIStrategyEntry {
  kind: AIFocusKind;
  sinceTurn: number;
  targetId?: string;
  intensity: number;
}

export interface AITerritoryMemory {
  coreProvinceId?: string;
  desiredProvinceId?: string;
  revengeProvinceId?: string;
  pressure: number;
  lastUpdated: number;
}

export interface AIMemoryEntry {
  rivalId?: string;
  rivalScore: number;
  partnerId?: string;
  partnerScore: number;
  watchId?: string;
  watchScore: number;
  territory?: AITerritoryMemory;
  lastUpdated: number;
}

export interface AmbitionMeta {
  playerNationId: string;
  startTurn: number;
  startProvinces: number;
  startGold: number;
  worldProvinces: number;
  economyTurns: number;
  peaceTurns: number;
  lastProgressTurn?: number;
  warnedPremature?: boolean;
}

export type PersistedAmbitionMeta = Partial<AmbitionMeta> & Pick<AmbitionMeta, 'playerNationId' | 'worldProvinces'>;

// ── 全局游戏状态 ──
export interface GameState {
  version: number;                  // 存档 schema 版本
  turn: number;                     // 当前回合（0 起，回合末 +1）
  seed: number;                     // seeded RNG 种子
  entityIdCounter: number;          // 存档内实体 id 序列，保证确定性回放
  playerNationId: string;           // 玩家国家 id（替代硬编码 PLAYER_ID）
  nations: Record<string, Nation>;  // W1.1: Record<NationId,Nation> → Record<string,Nation>（支持 192 国数据驱动）
  provinces: Record<string, Province>;
  relations: DiplomaticRelation[];  // 双向都存，便于 UI 和外交行动 O(1) 查询
  _relMap?: Map<string, DiplomaticRelation>;  // E9: transient 索引，key=`${from}|${to}`，不序列化
  diplomaticSummits: DiplomaticSummitRecord[];
  diplomaticAccords: DiplomaticAccord[];
  wars: War[];
  triggeredEvents: TriggeredEvent[];
  eventCooldowns: EventCooldown[];
  pendingEvents: { nationId: NationId; eventId: string }[];  // 等待玩家选择的弹窗
  pendingEventOptions: { nationId: NationId; eventId: string; options: { text: string; index: number }[] } | null;
  lastReport: TurnReport | null;
  history: TurnReport[];            // E10: 最近 10 回合报告（sparkline 用）
  victory: { type: string | null };
  bankruptTurns: number;            // 国库破产连续回合
  lowStabilityTurns: number;        // 稳定度过低连续回合
  chronicle: ChronicleEntry[];      // E12: 史册（里程碑叙事，上限 50）
  strategyFocus?: StrategyFocusId;
  aiStrategyMeta?: Record<string, AIStrategyEntry>;
  aiMemory?: Record<string, AIMemoryEntry>;
  ambitionMeta?: PersistedAmbitionMeta;
}

// ── 存档 ──
export interface SaveGame {
  version: number;
  createdAt: string;
  gameState: GameState;
}

// v6：加入可持久化的元首会谈记录与双边协议。
export const SAVE_VERSION = 6;
