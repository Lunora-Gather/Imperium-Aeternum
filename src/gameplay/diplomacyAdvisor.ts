// V44 外交顾问：统一判断威胁、贸易、同盟和孤立风险。
// 纯函数，不改 GameState；供 Dashboard、外交页和后续 AI 外交使用。

import type { DiplomaticRelation, GameState, Nation } from '../types/game';

export type DiplomacyAdvisorTone = 'good' | 'warn' | 'danger';
export type DiplomacyAdvisorAction = 'make_trade' | 'seek_alliance' | 'improve_relation' | 'prepare_defense' | 'avoid_war' | 'use_influence' | 'hold';

export interface DiplomacyAdvisorMetric {
  id: string;
  label: string;
  value: string;
  tone: DiplomacyAdvisorTone;
  detail: string;
}

export interface DiplomacyAdvisorCandidate {
  id: string;
  nationId: string;
  nationName: string;
  title: string;
  body: string;
  tone: DiplomacyAdvisorTone;
  score: number;
  action: DiplomacyAdvisorAction;
  tab: string;
}

export interface DiplomacyAdvisorPlan {
  nationId: string;
  title: string;
  summary: string;
  tone: DiplomacyAdvisorTone;
  posture: number;
  tradeCount: number;
  allyCount: number;
  warCount: number;
  threatCount: number;
  metrics: DiplomacyAdvisorMetric[];
  candidates: DiplomacyAdvisorCandidate[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function toneFromPosture(posture: number): DiplomacyAdvisorTone {
  return posture < 42 ? 'danger' : posture < 66 ? 'warn' : 'good';
}

function relsFrom(state: GameState, nationId: string): DiplomaticRelation[] {
  return state.relations.filter((r) => r.from === nationId && state.nations[r.to] && !state.nations[r.to].defeated);
}

function armyPower(nation?: Nation): number {
  if (!nation) return 0;
  return nation.army.reduce((s, a) => s + a.size * (0.55 + (a.morale + a.training + a.equipment + a.supply) / 400), 0);
}

function candidateFor(state: GameState, rel: DiplomaticRelation, self: Nation): DiplomacyAdvisorCandidate | null {
  const other = state.nations[rel.to];
  if (!other) return null;
  const theirPower = armyPower(other);
  const myPower = Math.max(1, armyPower(self));
  const powerThreat = clamp((theirPower / myPower) * 40);
  const hostility = clamp(-rel.relation * 0.55 + rel.threat * 0.45 + powerThreat * 0.35);
  const opportunity = clamp(rel.relation * 0.45 + rel.trust * 0.25 + rel.tradeDep * 0.15 + self.resources.influence * 0.1);

  if (rel.treaty === 'war') return { id: `war-${rel.to}`, nationId: rel.to, nationName: other.name, title: `稳定 ${other.name} 战线`, body: '当前处于战争状态，优先判断是否求和、调兵或寻找同盟。', tone: 'danger', score: n(90 + powerThreat * 0.08), action: 'prepare_defense', tab: 'military' };
  if (rel.treaty === 'truce' && rel.truceTurns > 0) return { id: `truce-${rel.to}`, nationId: rel.to, nationName: other.name, title: `利用 ${other.name} 停战窗口`, body: `还有 ${rel.truceTurns} 回合停战，可趁机恢复财政、补给或改善关系。`, tone: 'warn', score: n(62 + rel.truceTurns), action: 'hold', tab: 'diplomacy' };
  if (hostility >= 62) return { id: `threat-${rel.to}`, nationId: rel.to, nationName: other.name, title: `防范 ${other.name}`, body: `关系 ${n(rel.relation)}、威胁 ${n(rel.threat)}，应改善关系或准备边防。`, tone: 'danger', score: n(hostility), action: self.resources.influence >= 20 ? 'improve_relation' : 'prepare_defense', tab: self.resources.influence >= 20 ? 'diplomacy' : 'military' };
  if (rel.treaty === 'none' && rel.relation >= 50 && self.resources.influence >= 50) return { id: `alliance-${rel.to}`, nationId: rel.to, nationName: other.name, title: `争取 ${other.name} 同盟`, body: '关系和影响力已经接近同盟窗口，可用于形成安全纵深。', tone: 'good', score: n(opportunity + 18), action: 'seek_alliance', tab: 'diplomacy' };
  if (rel.treaty === 'none' && rel.relation >= -10 && self.resources.influence >= 10) return { id: `trade-${rel.to}`, nationId: rel.to, nationName: other.name, title: `建立 ${other.name} 贸易`, body: '关系尚可，贸易能提升长期收入并减少敌意。', tone: 'good', score: n(opportunity + 10), action: 'make_trade', tab: 'diplomacy' };
  if (rel.relation < 10 && self.resources.influence >= 20) return { id: `improve-${rel.to}`, nationId: rel.to, nationName: other.name, title: `改善 ${other.name} 关系`, body: '投入影响力降低未来战争和外交孤立风险。', tone: 'warn', score: n(45 - rel.relation * 0.2 + rel.threat * 0.15), action: 'improve_relation', tab: 'diplomacy' };
  return null;
}

export function buildDiplomacyAdvisorPlan(state: GameState, nationId: string = state.playerNationId): DiplomacyAdvisorPlan {
  const self = state.nations[nationId];
  if (!self) {
    return { nationId, title: '外交顾问：国家缺失', summary: '无法读取国家外交状态。', tone: 'danger', posture: 0, tradeCount: 0, allyCount: 0, warCount: 0, threatCount: 0, metrics: [], candidates: [] };
  }

  const rels = relsFrom(state, nationId);
  const tradeCount = rels.filter((r) => r.treaty === 'trade').length;
  const allyCount = rels.filter((r) => r.treaty === 'alliance').length;
  const warCount = rels.filter((r) => r.treaty === 'war').length;
  const threatCount = rels.filter((r) => r.treaty === 'war' || r.threat >= 60 || r.relation <= -45).length;
  const avgRelation = rels.length ? rels.reduce((s, r) => s + r.relation, 0) / rels.length : 0;
  const avgTrust = rels.length ? rels.reduce((s, r) => s + r.trust, 0) / rels.length : 0;
  const influence = self.resources.influence;
  const isolationPenalty = allyCount === 0 ? 9 : 0;
  const posture = clamp(58 + avgRelation * 0.16 + avgTrust * 0.08 + Math.min(10, influence / 10) + tradeCount * 2.5 + allyCount * 5 - warCount * 18 - threatCount * 8 - isolationPenalty);
  const tone = toneFromPosture(posture);
  const candidates = rels.map((r) => candidateFor(state, r, self)).filter((x): x is DiplomacyAdvisorCandidate => !!x).sort((a, b) => b.score - a.score).slice(0, 5);

  const metrics: DiplomacyAdvisorMetric[] = [
    { id: 'posture', label: '外交态势', value: `${n(posture)}/100`, tone, detail: '综合平均关系、信任、影响力、贸易、同盟、战争和威胁。' },
    { id: 'influence', label: '影响力', value: `${n(influence)}`, tone: influence < 10 ? 'danger' : influence < 30 ? 'warn' : 'good', detail: '影响力决定贸易、改善关系和同盟操作空间。' },
    { id: 'trade', label: '贸易协定', value: `${tradeCount}`, tone: tradeCount === 0 ? 'warn' : 'good', detail: '贸易可提高收入并降低外交摩擦。' },
    { id: 'alliance', label: '同盟', value: `${allyCount}`, tone: allyCount === 0 && threatCount > 0 ? 'danger' : allyCount === 0 ? 'warn' : 'good', detail: '同盟可缓冲威胁和多线战争风险。' },
    { id: 'war', label: '战争', value: `${warCount}`, tone: warCount > 0 ? 'danger' : 'good', detail: '战争会压低外交态势并放大内政压力。' },
    { id: 'threat', label: '威胁对象', value: `${threatCount}`, tone: threatCount >= 3 ? 'danger' : threatCount > 0 ? 'warn' : 'good', detail: '高威胁、高敌意或战争对象需要优先处理。' },
  ];

  const title = tone === 'danger' ? '外交顾问：先解除孤立' : tone === 'warn' ? '外交顾问：修补关系网' : '外交顾问：可主动结盟贸易';
  const summary = tone === 'danger'
    ? `外交态势 ${n(posture)}。战争、威胁或孤立正在限制战略空间。`
    : tone === 'warn'
      ? `外交态势 ${n(posture)}。仍有可修补关系或可开发贸易窗口。`
      : `外交态势 ${n(posture)}。可以主动推进贸易、同盟或战略包围。`;

  return { nationId, title, summary, tone, posture: n(posture), tradeCount, allyCount, warCount, threatCount, metrics, candidates };
}
