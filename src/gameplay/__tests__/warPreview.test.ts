import { describe, expect, it } from 'vitest';
import { buildWarPreview } from '../warPreview';
import type { WarAssessment } from '../warAssessment';

function assessment(patch: Partial<WarAssessment> = {}): WarAssessment {
  return {
    attackerId: 'a',
    defenderId: 'd',
    targetProvinceId: 'p',
    title: 'A → D',
    winChance: 72,
    readiness: 76,
    logisticsPressure: 25,
    fiscalPressure: 22,
    exhaustionRisk: 18,
    diplomaticRisk: 30,
    recommendation: 'attack_now',
    recommendationLabel: '可以开战',
    summary: '军力、后勤和政治条件基本支持开战。',
    factors: [
      { id: 'power', label: '军力对比', value: '9000 / 1200', score: 80, tone: 'good', detail: '综合兵力质量。' },
      { id: 'logistics', label: '后勤准备', value: '78/100', score: 78, tone: 'good', detail: '目标接壤。' },
      { id: 'diplomacy', label: '外交风险', value: '30/100', score: 30, tone: 'good', detail: '外部阻力低。' },
    ],
    ...patch,
  };
}

describe('war preview', () => {
  it('turns attack recommendations into an aggressive preview', () => {
    const preview = buildWarPreview(assessment());

    expect(preview.title).toContain('可以主动开战');
    expect(preview.actionLabel).toBe('发动战争');
    expect(preview.tone).toBe('good');
    expect(preview.lines.map((x) => x.id)).toEqual(['win', 'readiness', 'logistics', 'fiscal', 'exhaustion', 'diplomacy']);
    expect(preview.strengths.length).toBeGreaterThan(0);
    expect(preview.saveAdvice).toContain('开战前');
  });

  it('turns prepare recommendations into warning guidance', () => {
    const preview = buildWarPreview(assessment({ recommendation: 'prepare', recommendationLabel: '先准备一年', winChance: 54, readiness: 58, logisticsPressure: 55, fiscalPressure: 44, factors: [
      { id: 'logistics', label: '后勤准备', value: '45/100', score: 45, tone: 'warn', detail: '远征压力上升。' },
      { id: 'fiscal', label: '财政承受', value: '52/100', score: 52, tone: 'warn', detail: '需要更多国库。' },
    ] }));

    expect(preview.title).toContain('先整备');
    expect(preview.actionLabel).toBe('整备一年');
    expect(preview.tone).toBe('warn');
    expect(preview.risks.map((r) => r.title)).toEqual(['补给线吃紧', '财政承压']);
  });

  it('turns avoid recommendations into hard stop guidance', () => {
    const preview = buildWarPreview(assessment({ recommendation: 'avoid', recommendationLabel: '避免开战', winChance: 31, readiness: 29, logisticsPressure: 88, fiscalPressure: 91, exhaustionRisk: 95, diplomaticRisk: 80, factors: [
      { id: 'power', label: '军力对比', value: '300 / 5000', score: 15, tone: 'danger', detail: '敌军明显占优。' },
      { id: 'stability', label: '国内稳定', value: '18/100', score: 18, tone: 'danger', detail: '厌战极高。' },
      { id: 'diplomacy', label: '外交风险', value: '80/100', score: 80, tone: 'danger', detail: '防守方盟友较多。' },
    ] }));

    expect(preview.title).toContain('暂不宜开战');
    expect(preview.actionLabel).toBe('暂缓开战');
    expect(preview.tone).toBe('danger');
    expect(preview.saveAdvice).toContain('不建议');
    expect(preview.risks.length).toBe(3);
  });
});
