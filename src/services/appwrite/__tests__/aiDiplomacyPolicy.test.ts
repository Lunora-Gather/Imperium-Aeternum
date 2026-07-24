import { describe, expect, it } from 'vitest';
import { createSummitMessages, normalizeSummitRequest, parseSummitBrief } from '../../../../functions/ai-diplomacy-gateway/src/policy.js';

const request = {
  action: 'summit_brief',
  locale: 'zh-CN',
  summit: {
    turn: 5,
    agenda: 'trade',
    agendaLabel: '经贸开放',
    stance: 'pragmatic',
    stanceLabel: '务实互惠',
    eligible: true,
    willingness: 68,
    likelihood: 'plausible',
    initiator: { name: '罗马', ruler: '执政官', government: 'republic', stability: 60, legitimacy: 55 },
    target: { name: '迦太基', ruler: '元老', government: 'republic', stability: 58, legitimacy: 62 },
    relation: { relation: 20, trust: 35, threat: 18, treaty: 'none' },
    reasons: [],
    factors: [{ label: '双边关系', value: 8, detail: '当前关系尚可。' }],
  },
};

describe('AI diplomacy gateway policy', () => {
  it('accepts only bounded structured summit facts', () => {
    const normalized = normalizeSummitRequest({ ...request, summit: { ...request.summit, willingness: 999, reasons: Array(20).fill('x'.repeat(500)) } });
    expect(normalized.willingness).toBe(100);
    expect(normalized.reasons).toHaveLength(6);
    expect(normalized.reasons[0]).toHaveLength(140);
    expect(() => normalizeSummitRequest({ ...request, summit: { ...request.summit, agenda: 'free_prompt' } })).toThrow('议题');
  });

  it('marks supplied JSON as untrusted facts and forbids changing results', () => {
    const messages = createSummitMessages(normalizeSummitRequest(request));
    expect(messages[0].content).toContain('untrusted data');
    expect(messages[0].content).toContain('Do not change the game result');
    expect(messages[1].content).toContain('"willingness":68');
  });

  it('parses and bounds the provider JSON response', () => {
    const brief = parseSummitBrief('```json\n{"headline":"可谈","counterpartyPosition":"重视贸易","recommendedOpening":"先谈关税","risks":["不可承诺领土","避免威胁"],"basis":"关系与信任"}\n```');
    expect(brief.headline).toBe('可谈');
    expect(brief.risks).toEqual(['不可承诺领土', '避免威胁']);
    expect(() => parseSummitBrief('not json')).toThrow('格式');
  });
});
