// V31 国家风格与 AI 意图透明化：把国家性格、外交关系和 AI 记忆转成玩家可读的情报说明。
// 纯函数，不改 GameState；外交页和测试复用。

import { NATIONAL_CHARACTERS, type NationalCharacterId } from '../data/national-characters';
import type { DiplomaticRelation, GameState, Nation, NationalTendency } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { getAIStrategyInfo, type AIStrategyInfo } from './strategyFocus';

export type IntelTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';
export type StyleAxis = keyof NationalTendency;

export interface StyleTag {
  text: string;
  tone: IntelTone;
}

export interface NationStyleProfile {
  nationId: string;
  label: string;
  archetype: string;
  summary: string;
  tags: StyleTag[];
  strengths: string[];
  vulnerabilities: string[];
  suggestedApproach: string;
}

export interface DiplomaticIntelBrief {
  nationId: string;
  tone: IntelTone;
  headline: string;
  explanation: string;
  action: string;
  tab: NavigationTab;
  evidence: StyleTag[];
  riskScore: number;
  opportunityScore: number;
}

export interface DiplomaticIntelRow {
  nation: Nation;
  relation: DiplomaticRelation;
  ai: AIStrategyInfo | null;
  style: NationStyleProfile;
  intel: DiplomaticIntelBrief;
}

const AXIS_LABEL: Record<StyleAxis, string> = {
  militarism: '军国', commerce: '商业', religiosity: '宗教', technocracy: '科技', authoritarian: '高压', welfare: '福利', feudal: '封建', revolutionary: '革命', maritime: '海贸', centralization: '集权', isolationist: '孤立', expansionist: '扩张', scholarly: '文治', mercantilist: '重商',
};

function clamp(v: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, Math.round(v))); }
function relOf(state: GameState, from: string, to: string): DiplomaticRelation | undefined { return state.relations.find((r) => r.from === from && r.to === to); }
function provincesOf(state: GameState, nationId: string) { return Object.values(state.provinces).filter((p) => p.ownerId === nationId); }
function armySize(n: Nation): number { return n.army.reduce((s, a) => s + a.size, 0); }
function toneFromRisk(risk: number, opp: number): IntelTone { if (risk >= 72) return 'danger'; if (risk >= 48) return 'warn'; if (opp >= 62) return 'good'; return 'info'; }
function axisTone(axis: StyleAxis): IntelTone { return axis === 'militarism' || axis === 'expansionist' || axis === 'authoritarian' || axis === 'revolutionary' ? 'warn' : axis === 'commerce' || axis === 'maritime' || axis === 'welfare' ? 'good' : axis === 'technocracy' || axis === 'scholarly' ? 'info' : axis === 'mercantilist' ? 'gold' : 'info'; }

function topAxes(t: NationalTendency, count = 3): { axis: StyleAxis; value: number }[] {
  return (Object.entries(t) as [StyleAxis, number][]).sort((a, b) => b[1] - a[1]).slice(0, count).map(([axis, value]) => ({ axis, value }));
}

function archetypeFrom(axis: StyleAxis, character: NationalCharacterId): string {
  if (character !== 'balanced' && NATIONAL_CHARACTERS[character]) return NATIONAL_CHARACTERS[character].name;
  if (axis === 'militarism' || axis === 'expansionist') return '边境强权';
  if (axis === 'commerce' || axis === 'maritime' || axis === 'mercantilist') return '贸易国家';
  if (axis === 'technocracy' || axis === 'scholarly') return '文治科研国';
  if (axis === 'authoritarian' || axis === 'centralization') return '集权国家';
  if (axis === 'welfare') return '民生国家';
  if (axis === 'religiosity') return '宗教国家';
  return '均衡国家';
}

export function buildNationStyleProfile(state: GameState, nationId: string): NationStyleProfile {
  const n = state.nations[nationId];
  if (!n) return { nationId, label: '未知国家', archetype: '未知', summary: '缺少国家资料。', tags: [], strengths: [], vulnerabilities: [], suggestedApproach: '先观察其外交关系和边境态势。' };
  const axes = topAxes(n.tendency, 4);
  const primary = axes[0]?.axis ?? 'centralization';
  const def = NATIONAL_CHARACTERS[n.character] ?? NATIONAL_CHARACTERS.balanced;
  const tags = [
    { text: def.name, tone: n.character === 'balanced' ? 'info' : axisTone(n.character as StyleAxis) },
    ...axes.filter((x) => x.value >= 20).slice(0, 3).map((x) => ({ text: `${AXIS_LABEL[x.axis]} ${Math.round(x.value)}`, tone: axisTone(x.axis) })),
  ];
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  if (n.tendency.militarism >= 45 || n.tendency.expansionist >= 45) strengths.push('战争动员和边境施压更积极');
  if (n.tendency.commerce >= 45 || n.tendency.maritime >= 45 || n.tendency.mercantilist >= 45) strengths.push('贸易和金钱循环更强');
  if (n.tendency.technocracy >= 45 || n.tendency.scholarly >= 45) strengths.push('科研与长期效率更高');
  if (n.tendency.centralization >= 45 || n.tendency.authoritarian >= 45) strengths.push('行政控制和短期稳定能力强');
  if (n.government.corruption >= 55) vulnerabilities.push('腐败偏高，长期效率会被拖累');
  if (n.government.stability < 45) vulnerabilities.push('安定不足，容易转向修复或防御');
  if (n.warExhaustion >= 45) vulnerabilities.push('厌战偏高，持续战争会削弱其行动能力');
  if (armySize(n) < Math.max(80, provincesOf(state, n.id).length * 45)) vulnerabilities.push('军力与国土规模不完全匹配');
  if (strengths.length === 0) strengths.push('路线较均衡，短期意图需要看外交关系判断');
  if (vulnerabilities.length === 0) vulnerabilities.push('暂无明显结构短板');
  const approach = primary === 'militarism' || primary === 'expansionist'
    ? '优先观察其边境目标和军力，不要只看关系值。'
    : primary === 'commerce' || primary === 'maritime' || primary === 'mercantilist'
      ? '优先尝试贸易和互利关系，但警惕贸易依赖。'
      : primary === 'technocracy' || primary === 'scholarly'
        ? '适合长期合作或文化/科技互动，战争威胁通常低于扩张型国家。'
        : '以关系、信任和威胁三项综合判断，不宜单看条约状态。';
  return { nationId, label: def.name, archetype: archetypeFrom(primary, n.character), summary: `${n.name} 偏向${archetypeFrom(primary, n.character)}：${def.description}`, tags: tags.slice(0, 5), strengths: strengths.slice(0, 3), vulnerabilities: vulnerabilities.slice(0, 3), suggestedApproach: approach };
}

export function buildDiplomaticIntelBrief(state: GameState, nationId: string): DiplomaticIntelBrief {
  const pid = state.playerNationId;
  const n = state.nations[nationId];
  const rel = relOf(state, pid, nationId);
  const ai = getAIStrategyInfo(state, nationId);
  const style = buildNationStyleProfile(state, nationId);
  if (!n || !rel) return { nationId, tone: 'info', headline: '情报不足', explanation: '缺少外交关系或国家资料，暂时只能观察。', action: '先查看外交关系变化。', tab: 'diplomacy', evidence: [], riskScore: 0, opportunityScore: 0 };

  const desiredMine = !!(ai?.desiredProvinceId && state.provinces[ai.desiredProvinceId]?.ownerId === pid);
  const atWar = rel.treaty === 'war';
  const hostile = atWar || rel.relation <= -45 || rel.threat >= 55 || ai?.rivalId === pid || desiredMine;
  const cooperative = rel.treaty === 'alliance' || rel.treaty === 'trade' || ai?.partnerId === pid || (rel.relation >= 35 && rel.trust >= 40);
  const expansionPressure = ai?.kind === 'expansion' ? 18 : 0;
  const memoryPressure = (ai?.rivalId === pid ? 20 : 0) + (desiredMine ? 30 : 0) + Math.min(20, Math.round((ai?.territorialPressure ?? 0) / 5));
  const riskScore = clamp((rel.threat * 0.55) + Math.max(0, -rel.relation) * 0.35 + expansionPressure + memoryPressure + (atWar ? 28 : 0));
  const opportunityScore = clamp(Math.max(0, rel.relation) * 0.45 + rel.trust * 0.35 + (rel.treaty === 'trade' ? 18 : 0) + (rel.treaty === 'alliance' ? 25 : 0) + (ai?.partnerId === pid ? 18 : 0));
  const tone = toneFromRisk(riskScore, opportunityScore);
  const evidence: StyleTag[] = [
    { text: `关系 ${Math.round(rel.relation)}`, tone: rel.relation < -30 ? 'danger' : rel.relation > 35 ? 'good' : 'info' },
    { text: `威胁 ${Math.round(rel.threat)}`, tone: rel.threat > 55 ? 'danger' : rel.threat > 30 ? 'warn' : 'good' },
    { text: style.archetype, tone: style.tags[0]?.tone ?? 'info' },
  ];
  if (ai) evidence.push({ text: `AI ${ai.label} ${ai.intensity}/6`, tone: ai.kind === 'expansion' ? 'danger' : ai.kind === 'defense' || ai.kind === 'recovery' ? 'warn' : 'good' });
  if (desiredMine && ai?.desiredProvinceName) evidence.push({ text: `觊觎 ${ai.desiredProvinceName}`, tone: 'danger' });
  if (ai?.rivalId === pid) evidence.push({ text: '将你视作宿敌', tone: 'danger' });
  if (ai?.partnerId === pid) evidence.push({ text: '倾向亲近你', tone: 'good' });

  const headline = hostile
    ? `${n.name} 对你构成现实压力`
    : cooperative
      ? `${n.name} 是可经营对象`
      : `${n.name} 处于观察区`;
  const explanation = desiredMine && ai?.desiredProvinceName
    ? `${n.name} 当前${ai?.label ?? '观察'}，且对你的 ${ai.desiredProvinceName} 有领土压力。不要只看关系值，边境风险更重要。`
    : ai?.rivalId === pid
      ? `${n.name} 已把你列入主要对手，威胁和关系恶化可能继续累积。`
      : cooperative
        ? `${n.name} 的关系、信任或 AI 记忆显示出合作空间，适合经营贸易、同盟或文化输出。`
        : `${n.name} 的当前风格是${style.archetype}，AI 倾向为${ai?.label ?? '观察'}，建议继续跟踪关系、威胁和目标变化。`;
  const action = hostile
    ? (atWar ? '先处理战争与停战窗口，避免外交页只做改善关系。' : '优先降低威胁、观察边境，必要时准备军事或结盟对冲。')
    : cooperative
      ? '优先考虑贸易、同盟或文化输出，把关系优势转成长期收益。'
      : '先用低成本改善关系或保留影响力，等待更明确的合作/威胁信号。';
  const tab: NavigationTab = hostile ? (atWar || desiredMine ? 'military' : 'diplomacy') : 'diplomacy';
  return { nationId, tone, headline, explanation, action, tab, evidence: evidence.slice(0, 7), riskScore, opportunityScore };
}

export function buildDiplomaticIntelBoard(state: GameState, limit = 5): DiplomaticIntelRow[] {
  const pid = state.playerNationId;
  return Object.values(state.nations)
    .filter((n) => n.id !== pid && !n.defeated)
    .map((nation) => {
      const relation = relOf(state, pid, nation.id);
      if (!relation) return null;
      const ai = getAIStrategyInfo(state, nation.id);
      const style = buildNationStyleProfile(state, nation.id);
      const intel = buildDiplomaticIntelBrief(state, nation.id);
      return { nation, relation, ai, style, intel };
    })
    .filter((x): x is DiplomaticIntelRow => !!x)
    .sort((a, b) => b.intel.riskScore - a.intel.riskScore || b.intel.opportunityScore - a.intel.opportunityScore)
    .slice(0, limit);
}
