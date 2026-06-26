// V41 战争预演摘要：把 warAssessment 评分转成玩家/AI 可直接阅读的宣战前判断。
// 纯函数，不改 GameState；后续军事页和 AI 决策可复用。

import type { WarAssessment, WarAssessmentTone } from './warAssessment';

export interface WarPreviewLine {
  id: string;
  label: string;
  value: string;
  tone: WarAssessmentTone;
}

export interface WarPreviewRisk {
  id: string;
  title: string;
  body: string;
  tone: WarAssessmentTone;
}

export interface WarPreview {
  title: string;
  verdict: string;
  summary: string;
  actionLabel: string;
  tone: WarAssessmentTone;
  lines: WarPreviewLine[];
  risks: WarPreviewRisk[];
  strengths: WarPreviewRisk[];
  saveAdvice: string;
}

function toneFromScore(score: number, goodWhenHigh = true): WarAssessmentTone {
  if (goodWhenHigh) return score >= 65 ? 'good' : score >= 40 ? 'warn' : 'danger';
  return score <= 35 ? 'good' : score <= 60 ? 'warn' : 'danger';
}

function titleFor(a: WarAssessment): string {
  if (a.recommendation === 'attack_now') return '战前预演：可以主动开战';
  if (a.recommendation === 'prepare') return '战前预演：先整备再开战';
  return '战前预演：暂不宜开战';
}

function verdictFor(a: WarAssessment): string {
  if (a.recommendation === 'attack_now') return `胜率 ${a.winChance}% · ${a.recommendationLabel}`;
  if (a.recommendation === 'prepare') return `胜率 ${a.winChance}% · 建议准备`;
  return `胜率 ${a.winChance}% · 风险过高`;
}

function riskTitle(id: string): string {
  if (id === 'power') return '军力不足';
  if (id === 'logistics') return '补给线吃紧';
  if (id === 'fiscal') return '财政承压';
  if (id === 'stability') return '国内不稳';
  if (id === 'diplomacy') return '外交风险';
  return '战争风险';
}

function strengthTitle(id: string): string {
  if (id === 'power') return '军力占优';
  if (id === 'logistics') return '后勤可支撑';
  if (id === 'fiscal') return '财政可承受';
  if (id === 'stability') return '国内可动员';
  if (id === 'diplomacy') return '外交阻力低';
  return '战争优势';
}

export function buildWarPreview(a: WarAssessment): WarPreview {
  const tone: WarAssessmentTone = a.recommendation === 'attack_now' ? 'good' : a.recommendation === 'prepare' ? 'warn' : 'danger';
  const risks = a.factors
    .filter((f) => f.tone !== 'good')
    .map((f) => ({ id: f.id, title: riskTitle(f.id), body: `${f.label}：${f.value}。${f.detail}`, tone: f.tone }))
    .slice(0, 3);
  const strengths = a.factors
    .filter((f) => f.tone === 'good')
    .map((f) => ({ id: f.id, title: strengthTitle(f.id), body: `${f.label}：${f.value}。${f.detail}`, tone: f.tone }))
    .slice(0, 3);

  return {
    title: titleFor(a),
    verdict: verdictFor(a),
    summary: a.summary,
    actionLabel: a.recommendation === 'attack_now' ? '发动战争' : a.recommendation === 'prepare' ? '整备一年' : '暂缓开战',
    tone,
    lines: [
      { id: 'win', label: '预计胜率', value: `${a.winChance}%`, tone: toneFromScore(a.winChance) },
      { id: 'readiness', label: '备战度', value: `${a.readiness}%`, tone: toneFromScore(a.readiness) },
      { id: 'logistics', label: '后勤压力', value: `${a.logisticsPressure}%`, tone: toneFromScore(a.logisticsPressure, false) },
      { id: 'fiscal', label: '财政压力', value: `${a.fiscalPressure}%`, tone: toneFromScore(a.fiscalPressure, false) },
      { id: 'exhaustion', label: '厌战风险', value: `${a.exhaustionRisk}%`, tone: toneFromScore(a.exhaustionRisk, false) },
      { id: 'diplomacy', label: '外交风险', value: `${a.diplomaticRisk}%`, tone: toneFromScore(a.diplomaticRisk, false) },
    ],
    risks,
    strengths,
    saveAdvice: a.recommendation === 'attack_now'
      ? '开战前仍建议存档；若后勤或外交突然恶化，应重新评估。'
      : a.recommendation === 'prepare'
        ? '建议先存档并补给、降厌战或改善外交，再重新评估。'
        : '不建议在当前状态存档后立即宣战；先处理红色风险。',
  };
}
