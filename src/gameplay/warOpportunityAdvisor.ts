// V41 战争机会顾问：扫描玩家/国家相邻目标，给出最值得考虑的战争机会。
// 纯函数，不改 GameState；可被 Dashboard、军事页和路线图复用。

import type { GameState, Province } from '../types/game';
import { assessWar, type WarAssessment, type WarAssessmentTone } from './warAssessment';
import { buildWarPreview, type WarPreview } from './warPreview';

export interface WarOpportunityCandidate {
  defenderId: string;
  defenderName: string;
  provinceId: string;
  provinceName: string;
  score: number;
  assessment: WarAssessment;
  preview: WarPreview;
}

export interface WarOpportunityAdvice {
  nationId: string;
  title: string;
  summary: string;
  tone: WarAssessmentTone;
  best?: WarOpportunityCandidate;
  candidates: WarOpportunityCandidate[];
  blockers: string[];
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

function legalTarget(state: GameState, attackerId: string, target: Province): boolean {
  if (target.ownerId === attackerId) return false;
  const defender = state.nations[target.ownerId];
  if (!defender || defender.defeated) return false;
  const rel = state.relations.find((r) => r.from === attackerId && r.to === target.ownerId);
  if (rel?.treaty === 'alliance') return false;
  if (rel?.treaty === 'truce' && rel.truceTurns > 0) return false;
  return !state.wars.some((w) =>
    (w.attackerId === attackerId && w.defenderId === target.ownerId) ||
    (w.attackerId === target.ownerId && w.defenderId === attackerId)
  );
}

function candidateScore(a: WarAssessment, p: Province): number {
  const richness = Math.min(18, p.population * 0.01 + p.agriBase * 2 + p.buildings.length * 3 + (p.isCapital ? 8 : 0));
  return n(clamp(a.winChance * 0.36 + a.readiness * 0.28 + (100 - a.diplomaticRisk) * 0.14 + (100 - a.logisticsPressure) * 0.12 + richness));
}

export function buildWarOpportunityAdvice(state: GameState, nationId: string = state.playerNationId): WarOpportunityAdvice {
  const nation = state.nations[nationId];
  if (!nation) return { nationId, title: '战争机会：国家缺失', summary: '无法找到该国家。', tone: 'danger', candidates: [], blockers: ['国家缺失。'] };
  const blockers: string[] = [];
  if (nation.atWar || state.wars.some((w) => w.attackerId === nationId || w.defenderId === nationId)) blockers.push('当前已有战争，避免多线作战。');
  if (nation.warExhaustion > 60) blockers.push('厌战过高，继续扩张会伤害稳定。');
  if (nation.resources.gold < 0) blockers.push('国库为负，战争财政承受不足。');
  if (nation.resources.supply < 30) blockers.push('补给不足，前线持续能力偏弱。');

  const seen = new Set<string>();
  const candidates = ownedProvinces(state, nationId).flatMap((p) => p.adjacent.map((id) => state.provinces[id]).filter(Boolean))
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return legalTarget(state, nationId, p);
    })
    .map((p) => {
      const assessment = assessWar(state, nationId, p.ownerId, p.id);
      const preview = buildWarPreview(assessment);
      return {
        defenderId: p.ownerId,
        defenderName: state.nations[p.ownerId]?.name ?? p.ownerId,
        provinceId: p.id,
        provinceName: p.name,
        score: candidateScore(assessment, p),
        assessment,
        preview,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const best = candidates[0];
  if (!best) {
    return {
      nationId,
      title: '战争机会：暂无目标',
      summary: blockers[0] ?? '周边没有可攻击的非同盟/非停战目标。',
      tone: blockers.length ? 'warn' : 'good',
      candidates,
      blockers,
    };
  }

  const blocked = blockers.length > 0;
  const attackable = best.assessment.recommendation === 'attack_now' && !blocked;
  const tone: WarAssessmentTone = attackable ? 'good' : best.assessment.recommendation === 'avoid' || blocked ? 'danger' : 'warn';
  const title = attackable ? `战争机会：可攻 ${best.provinceName}` : tone === 'warn' ? `战争机会：先整备 ${best.provinceName}` : '战争机会：暂缓扩张';
  const summary = blocked
    ? `${blockers[0]} 最佳候选为 ${best.provinceName}，胜率 ${best.assessment.winChance}%。`
    : `最佳候选为 ${best.provinceName}（${best.defenderName}），胜率 ${best.assessment.winChance}%，备战度 ${best.assessment.readiness}%。`;

  return { nationId, title, summary, tone, best, candidates, blockers };
}
