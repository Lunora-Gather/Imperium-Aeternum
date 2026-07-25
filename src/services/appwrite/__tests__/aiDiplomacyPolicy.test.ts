import { describe, expect, it } from 'vitest';
import { aiErrorStatus, buildAIQuotaPlan, createSummitMessages, normalizeSummitRequest, parseSummitBrief } from '../../../../functions/ai-diplomacy-gateway/src/policy.js';
import { readBoundedJsonResponse } from '../../../../functions/ai-diplomacy-gateway/src/provider.js';
import { releaseAIQuota, reserveAIQuota } from '../../../../functions/ai-diplomacy-gateway/src/quota.js';

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
  it('bounds and parses provider response bodies', async () => {
    await expect(readBoundedJsonResponse(new Response('{"ok":true}'), 32)).resolves.toEqual({ ok: true });
    await expect(readBoundedJsonResponse(new Response('x'.repeat(33)), 32)).rejects.toThrow('过大');
    await expect(readBoundedJsonResponse(new Response('not-json'), 32)).rejects.toThrow('格式');
  });

  it('builds bounded per-user and global cost limits', () => {
    const plan = buildAIQuotaPlan('user-a', { AI_DAILY_LIMIT: '999', AI_GLOBAL_DAILY_LIMIT: '0', AI_GLOBAL_MONTHLY_LIMIT: '250' }, new Date('2026-07-24T12:00:00Z'));
    expect(plan.map((entry) => [entry.scope, entry.limit, entry.period])).toEqual([
      ['user', 20, '2026-07-24'],
      ['global-day', 1, '2026-07-24'],
      ['global-month', 250, '2026-07'],
    ]);
    expect(plan[0].rowId).toBe(buildAIQuotaPlan('user-a', {}, new Date('2026-07-24T23:00:00Z'))[0].rowId);
  });

  it('reports exhausted user or global budgets as rate limits', () => {
    expect(aiErrorStatus('今日 AI 研判次数已用完')).toBe(429);
    expect(aiErrorStatus('本月全站 AI 额度已用完')).toBe(429);
    expect(aiErrorStatus('AI 返回格式无效')).toBe(400);
  });

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

class QuotaDbMock {
  rows = new Map<string, { count: number; userKey: string; day: string; updatedAt: string }>();
  transaction = 0;

  async createTransaction() { this.transaction += 1; return { $id: `tx-${this.transaction}` }; }
  async updateTransaction() { return {}; }
  async getRow({ rowId }: { rowId: string }) {
    const row = this.rows.get(rowId);
    if (!row) throw Object.assign(new Error('missing'), { code: 404 });
    return { $id: rowId, ...row };
  }
  async createRow({ rowId, data }: { rowId: string; data: { count: number; userKey: string; day: string; updatedAt: string } }) {
    if (this.rows.has(rowId)) throw Object.assign(new Error('conflict'), { code: 409 });
    this.rows.set(rowId, data);
    return { $id: rowId, ...data };
  }
  async updateRow({ rowId, data }: { rowId: string; data: { count: number; updatedAt: string } }) {
    const current = this.rows.get(rowId);
    if (!current) throw Object.assign(new Error('missing'), { code: 404 });
    this.rows.set(rowId, { ...current, ...data });
    return { $id: rowId, ...this.rows.get(rowId) };
  }
}

describe('AI diplomacy quota transactions', () => {
  it('reserves all counters and refunds a failed inference', async () => {
    const db = new QuotaDbMock();
    const reservation = await reserveAIQuota(db, 'user-a', { AI_DAILY_LIMIT: '5', AI_GLOBAL_DAILY_LIMIT: '20', AI_GLOBAL_MONTHLY_LIMIT: '200' });
    expect(reservation.quota).toEqual({ used: 1, limit: 5 });
    expect([...db.rows.values()].map((row) => row.count)).toEqual([1, 1, 1]);

    await releaseAIQuota(db, reservation.plan);
    expect([...db.rows.values()].map((row) => row.count)).toEqual([0, 0, 0]);
  });

  it('enforces one global budget across different users', async () => {
    const db = new QuotaDbMock();
    const env = { AI_DAILY_LIMIT: '5', AI_GLOBAL_DAILY_LIMIT: '1', AI_GLOBAL_MONTHLY_LIMIT: '200' };
    await reserveAIQuota(db, 'user-a', env);
    await expect(reserveAIQuota(db, 'user-b', env)).rejects.toThrow('全站 AI 额度');
  });
});
