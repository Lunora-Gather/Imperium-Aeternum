// V34 难度与挑战体系：把剧本难度转成开局前可读的挑战阶梯、风险解释和检查清单。
// 纯函数，不改 GameState；ScenarioSelect 展示，测试复用。

import type { ScenarioId } from '../store/gameStore';
import type { LaunchTone } from './launchHub';

export type DifficultyBand = 'relaxed' | 'standard' | 'hard' | 'hardcore' | 'unknown';

export interface ChallengeChecklistItem {
  id: string;
  text: string;
  tone: LaunchTone;
}

export interface ScenarioChallengeGuide {
  scenarioId: ScenarioId;
  band: DifficultyBand;
  label: string;
  tone: LaunchTone;
  pressure: number;
  headline: string;
  why: string;
  recommendedAfter: string;
  likelyFailure: string;
  checklist: ChallengeChecklistItem[];
}

const GUIDE: Record<ScenarioId, ScenarioChallengeGuide> = {
  classic: {
    scenarioId: 'classic', band: 'relaxed', label: '休闲入门', tone: 'good', pressure: 18,
    headline: '最适合第一局建立基本循环',
    why: '国家少、信息密度低、战争和外交压力可控，适合学习财政、省份、事件和年报。',
    recommendedAfter: '无需前置经验。', likelyFailure: '通常不是被打崩，而是忽略年报和财政趋势。',
    checklist: [
      { id: 'read-roadmap', text: '先看路线图和情境提示', tone: 'good' },
      { id: 'first-report', text: '第一年后读年报复盘', tone: 'info' },
    ],
  },
  w8_indianocean: {
    scenarioId: 'w8_indianocean', band: 'standard', label: '标准经营', tone: 'good', pressure: 42,
    headline: '适合经营玩家的贸易成长线',
    why: '海贸、粮食、外交和区域战争都有存在感，但不会像完整世界那样一开始信息过载。',
    recommendedAfter: '完成一局地中海黎明，理解财政和省份。', likelyFailure: '贸易优势没有及时转成国库安全垫，或忽略海贸外交。',
    checklist: [
      { id: 'trade-route', text: '优先理解贸易和经济页', tone: 'good' },
      { id: 'diplomacy', text: '关注外交情报里的合作对象', tone: 'info' },
      { id: 'save', text: '开战前手动存档', tone: 'warn' },
    ],
  },
  eastasia: {
    scenarioId: 'eastasia', band: 'standard', label: '标准扩张', tone: 'info', pressure: 46,
    headline: '区域扩张和内政稳定并重',
    why: '秦汉、草原和南亚互动清晰，适合学习扩张后如何维持安定。',
    recommendedAfter: '至少熟悉行动中心和省份页。', likelyFailure: '扩张太快导致地方不稳，安定掉到危险线。',
    checklist: [
      { id: 'stability', text: '扩张前确认安定不低于 40', tone: 'warn' },
      { id: 'province', text: '每次扩张后检查省份忠诚', tone: 'info' },
    ],
  },
  w3_eastasia: {
    scenarioId: 'w3_eastasia', band: 'hard', label: '困难长线', tone: 'warn', pressure: 58,
    headline: '东方大区长期博弈',
    why: '国家和地区更多，战争、外交和内政会更频繁地叠在一起。',
    recommendedAfter: '熟悉路线图、作战会议、年报复盘。', likelyFailure: '同时开太多战线，财政和厌战一起恶化。',
    checklist: [
      { id: 'war-check', text: '每次战争前看预演和存档', tone: 'warn' },
      { id: 'diplomacy-buffer', text: '用外交降低多线压力', tone: 'info' },
    ],
  },
  w5_mediterranean: {
    scenarioId: 'w5_mediterranean', band: 'hard', label: '困难冲突', tone: 'warn', pressure: 62,
    headline: '战争、贸易和外交都很密集',
    why: '罗马、迦太基、波斯等强权互相牵制，适合喜欢高互动局势的玩家。',
    recommendedAfter: '至少能稳定处理战争、补给、外交情报。', likelyFailure: '只看兵力不看补给和厌战，或忽略敌对 AI 的领土意图。',
    checklist: [
      { id: 'military', text: '开战前看士气、补给、厌战', tone: 'warn' },
      { id: 'intel', text: '外交页确认谁觊觎你的省份', tone: 'danger' },
      { id: 'manual-save', text: '关键战争前保存', tone: 'gold' },
    ],
  },
  w4_europe: {
    scenarioId: 'w4_europe', band: 'hard', label: '困难外交', tone: 'warn', pressure: 64,
    headline: '联盟、边境和多国关系压力高',
    why: '欧洲多国接壤，关系网复杂，适合练习外交缓冲和边境管理。',
    recommendedAfter: '熟悉外交情报和作战会议。', likelyFailure: '被多个邻国同时施压，来不及修财政与军队。',
    checklist: [
      { id: 'alliances', text: '优先经营至少一个友好对象', tone: 'good' },
      { id: 'border', text: '盯住高威胁邻国', tone: 'warn' },
    ],
  },
  w6_americas: {
    scenarioId: 'w6_americas', band: 'standard', label: '标准成长', tone: 'info', pressure: 44,
    headline: '较少外部干扰的文明成长线',
    why: '国家较少，适合专注科技、人口和区域扩张节奏。',
    recommendedAfter: '适合第二局或喜欢独立发展线的玩家。', likelyFailure: '成长期忽略粮食和地方忠诚，导致扩张后不稳。',
    checklist: [
      { id: 'food', text: '扩张前确认粮食趋势', tone: 'info' },
      { id: 'tech', text: '和平期投入科技', tone: 'good' },
    ],
  },
  w7_random: {
    scenarioId: 'w7_random', band: 'unknown', label: '随机挑战', tone: 'warn', pressure: 68,
    headline: '每局压力不同，考验适应能力',
    why: '随机抽取地区，开局信息不确定，适合老手用来测试系统理解。',
    recommendedAfter: '至少完成一局标准或困难剧本。', likelyFailure: '用固定套路处理随机开局，没有先看总览和情报。',
    checklist: [
      { id: 'inspect', text: '开局先看路线图和外交情报', tone: 'warn' },
      { id: 'adapt', text: '第一年不要直接连跳', tone: 'danger' },
    ],
  },
  world: {
    scenarioId: 'world', band: 'hard', label: '旗舰困难', tone: 'danger', pressure: 82,
    headline: '完整世界沙盘，信息密度最高',
    why: '国家最多、关系最复杂、长期变量最多，适合已经熟悉核心循环的玩家。',
    recommendedAfter: '建议先完成至少一局标准或困难区域剧本。', likelyFailure: '信息过载，忽略行动中心、年报复盘和存档体检。',
    checklist: [
      { id: 'choose-nation', text: '选国时优先看国家风格标签', tone: 'info' },
      { id: 'dashboard-loop', text: '每年按总览闭环推进', tone: 'warn' },
      { id: 'slots', text: '关键节点保留多个手动档', tone: 'gold' },
    ],
  },
  challenge_survival: {
    scenarioId: 'challenge_survival', band: 'hardcore', label: '硬核挑战', tone: 'danger', pressure: 96,
    headline: '资源少、叛乱高、外交孤立',
    why: '这是故意设计的高压生存局。目标不是舒服发展，而是在危机里学习优先级。',
    recommendedAfter: '熟悉存档体检、作战会议、下一回合预演后再挑战。', likelyFailure: '连续推进导致财政、粮食、安定和叛乱同时爆炸。',
    checklist: [
      { id: 'no-rush', text: '不要空格连跳', tone: 'danger' },
      { id: 'fix-red', text: '红色项必须先修', tone: 'danger' },
      { id: 'save-first', text: '每次关键选择前先存档', tone: 'gold' },
    ],
  },
};

const BAND_ORDER: Record<DifficultyBand, number> = { relaxed: 1, standard: 2, hard: 3, hardcore: 4, unknown: 5 };

export function buildScenarioChallengeGuide(id: ScenarioId): ScenarioChallengeGuide {
  return GUIDE[id];
}

export function compareScenarioDifficulty(a: ScenarioId, b: ScenarioId): number {
  const ga = buildScenarioChallengeGuide(a);
  const gb = buildScenarioChallengeGuide(b);
  const band = BAND_ORDER[ga.band] - BAND_ORDER[gb.band];
  if (band !== 0) return band;
  return ga.pressure - gb.pressure;
}

export function recommendedChallengePath(): ScenarioId[] {
  return ['classic', 'w8_indianocean', 'eastasia', 'w5_mediterranean', 'world', 'challenge_survival'];
}

export function isHardScenario(id: ScenarioId): boolean {
  const g = buildScenarioChallengeGuide(id);
  return g.band === 'hard' || g.band === 'hardcore' || g.pressure >= 65;
}

export function summarizeChallengePath(ids: ScenarioId[] = recommendedChallengePath()): { ids: ScenarioId[]; headline: string; advice: string } {
  const sorted = [...ids].sort(compareScenarioDifficulty);
  const first = buildScenarioChallengeGuide(sorted[0]);
  const last = buildScenarioChallengeGuide(sorted[sorted.length - 1]);
  return {
    ids: sorted,
    headline: `${first.label} → ${last.label}`,
    advice: '推荐按挑战阶梯逐步解锁：先学财政和省份，再学战争外交，最后进入完整世界或硬核生存。',
  };
}
