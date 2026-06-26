// V41 AI 战争决策：让 AI 基于 warAssessment 做宣战判断，而不是随机开战。
// 纯函数，不改 GameState；后续可接入 AI 回合。

import type { GameState, Province } from '../types/game';
import { assessWar, type WarAssessment } from './warAssessment';

export type AiWarDecisionType = 'declare' | 'prepare' | 'avoid';

export interface AiWarCandidate {
  defenderId: string;
  targetProvinceId: string;
  targetName: string;
  assessment: WarAssessment;
  score: number;
  reasons: string[];
}

export interface AiWarDecision {
  attackerId: string;
  type: AiWarDecisionType;
  label: string;
  confidence: number;
  candidate?: AiWarCandidate;
  alternatives: AiWarCandidate[];
  reasons: string[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function n(v: number): number {
  return Math.round(v);
}

function ownedProvinces(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function atWar(state: GameState, nationId: string): boolean {
  return state.wars.some((w) => w.attackerId === nationId || w.defenderId === nationId);
}

function relationLine(state: GameState, from: string, to: string): string {
  const rel = state.relations.find((r) => r.from === from && r.to === to);
  if (!rel) return '外交情报不足。';
  if (rel.treaty === 'truce' && rel.truceTurns > 0) return `仍有 ${rel.truceTurns} 回合停战。`;
  if (rel.treaty === 'alliance') return '目标是同盟，不应宣战。';
  if (rel.relation < -40) return '双方关系恶劣，战争理由充分。';
  if (rel.threat > 60) return '目标威胁过高，存在先发制人动机。';
  if (rel.tradeDep > 55) return '贸易依赖较高，开战会伤害经济。';
  return '外交阻力可控。';
}

function canTarget(state: GameState, attackerId: string, defenderId: string): boolean {
  if (attackerId === defenderId) return false;
  const rel = state.relations.find((r) => r.from === attackerId && r.to === defenderId);
  if (rel?.treaty === 'alliance') return false;
  if (rel?.treaty === 'truce' && rel.truceTurns > 0) return false;
  return true;
}

function buildCandidate(state: GameState, attackerId: string, target: Province): AiWarCandidate | null {
  if (!canTarget(state, attackerId, target.ownerId)) return null;
  const assessment = assessWar(state, attackerId, target.ownerId, target.id);
  const nation = state.nations[attackerId];
  const expansionBias = nation?.tendency.expansionist ?? 50;
  const militarism = nation?.tendency.militarism ?? 50;
  const commercePenalty = Math.max(0, (nation?.tendency.commerce ?? 50) - 55) * 0.25;
  const score = clamp(
    assessment.readiness * 0.34 +
    assessment.winChance * 0.32 +
    (100 - assessment.diplomaticRisk) * 0.12 +
    (100 - assessment.exhaustionRisk) * 0.1 +
    expansionBias * 0.07 +
    militarism * 0.05 -
    commercePenalty,
  );
  const reasons = [
    `胜率 ${assessment.winChance}%、备战度 ${assessment.readiness}%。`,
    relationLine(state, attackerId, target.ownerId),
  ];
  if (assessment.logisticsPressure > 60) reasons.push('后勤压力偏高，需先调兵或补给。');
  if (assessment.fiscalPressure > 60) reasons.push('财政压力偏高，战争可能拖垮国库。');
  if (assessment.recommendation === 'attack_now') reasons.push('战争评估建议可立即开战。');
  return { defenderId: target.ownerId, targetProvinceId: target.id, targetName: target.name, assessment, score: n(score), reasons };
}

export function decideAiWar(state: GameState, attackerId: string): AiWarDecision {
  const nation = state.nations[attackerId];
  if (!nation) return { attackerId, type: 'avoid', label: '国家缺失', confidence: 0, alternatives: [], reasons: ['找不到该 AI 国家。'] };
  if (nation.defeated) return { attackerId, type: 'avoid', label: '已战败', confidence: 0, alternatives: [], reasons: ['战败国家不会主动开战。'] };
  if (atWar(state, attackerId)) return { attackerId, type: 'avoid', label: '已有战争', confidence: 80, alternatives: [], reasons: ['当前已有战争，避免多线作战。'] };

  const candidates = ownedProvinces(state, attackerId).flatMap((p) => p.adjacent.map((id) => state.provinces[id]).filter(Boolean))
    .filter((p) => p.ownerId !== attackerId)
    .map((p) => buildCandidate(state, attackerId, p))
    .filter((x): x is AiWarCandidate => !!x)
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best) return { attackerId, type: 'avoid', label: '无合法目标', confidence: 75, alternatives: [], reasons: ['周边没有可攻击的非同盟/非停战目标。'] };

  const aggression = (nation.tendency.expansionist + nation.tendency.militarism) / 2;
  const threshold = aggression >= 65 ? 66 : aggression >= 48 ? 72 : 80;
  if (best.score >= threshold && best.assessment.recommendation === 'attack_now') {
    return {
      attackerId,
      type: 'declare',
      label: `宣战 ${best.targetName}`,
      confidence: clamp(best.score),
      candidate: best,
      alternatives: candidates.slice(1, 4),
      reasons: [`进攻倾向 ${n(aggression)}，开战阈值 ${threshold}。`, ...best.reasons],
    };
  }
  if (best.score >= threshold - 14 && best.assessment.recommendation !== 'avoid') {
    return {
      attackerId,
      type: 'prepare',
      label: `准备进攻 ${best.targetName}`,
      confidence: clamp(best.score),
      candidate: best,
      alternatives: candidates.slice(1, 4),
      reasons: [`候选目标接近宣战阈值 ${threshold}，但仍需整备。`, ...best.reasons],
    };
  }
  return {
    attackerId,
    type: 'avoid',
    label: '避免开战',
    confidence: clamp(100 - best.score),
    candidate: best,
    alternatives: candidates.slice(1, 4),
    reasons: [`最佳目标评分 ${best.score}，低于宣战阈值 ${threshold}。`, ...best.reasons],
  };
}
