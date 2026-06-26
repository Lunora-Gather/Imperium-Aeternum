import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildPreTurnCouncil } from '../preTurnCouncil';
import { buildReadinessReport, type ReadinessReport } from '../readiness';
import type { EmpireRoadmap } from '../empireRoadmap';
import type { TurnPreview } from '../turnPreview';
import type { CommandCenterAction } from '../commandCenterActions';

function readiness(patch: Partial<ReadinessReport> = {}): ReadinessReport {
  return { score: 88, label: '稳健', tone: 'good', canAdvance: true, blockers: [], warnings: [], advice: [], devChecks: [], ...patch };
}

function roadmap(progress = 35, tier: EmpireRoadmap['tier'] = 'stable'): EmpireRoadmap {
  return {
    tier,
    score: 70,
    headline: '局势稳定',
    summary: '测试路线图',
    tone: tier === 'strained' ? 'warn' : 'good',
    route: { id: 'economy', label: '富国路线', progress, tab: 'economy', hint: '测试主线' },
    steps: [
      { id: 'route-economy', title: '胜利路线：富国路线', body: '推进富国路线', tab: 'economy', tone: 'info', horizon: '长期', reason: '测试', impact: '测试' },
    ],
    riskLine: '暂无主要系统性风险',
    opportunityLine: '测试机会',
    evidence: [],
    evidenceLine: '体检 88/100',
  };
}

function preview(patch: Partial<TurnPreview> = {}): TurnPreview {
  return {
    status: 'ready',
    tone: 'good',
    canAdvance: true,
    title: '可以推进',
    summary: '测试预演',
    signals: [],
    likelyChanges: [],
    beforePress: [],
    saveAdvice: { id: 'save-normal', title: '可正常推进', body: '推进后看年报。', tone: 'good', tab: 'report' },
    ...patch,
  };
}

function action(id: string, tone: CommandCenterAction['tone'] = 'normal', tab: CommandCenterAction['tab'] = 'economy'): CommandCenterAction {
  return { id, label: `行动${id}`, desc: `处理${id}`, tab, level: tone === 'danger' ? 95 : tone === 'warn' ? 70 : 35, tone, source: 'fallback' };
}

describe('pre-turn council', () => {
  it('holds the turn when preview is blocked', () => {
    const state = createInitialState();
    const council = buildPreTurnCouncil(state, {
      readiness: readiness({ canAdvance: false, tone: 'danger', score: 40 }),
      roadmap: roadmap(),
      preview: preview({
        status: 'blocked',
        tone: 'danger',
        canAdvance: false,
        beforePress: [{ id: 'blocker', title: '处理待决事件', body: '先处理事件再推进。', tone: 'danger', tab: 'dashboard' }],
      }),
      commandActions: [action('block', 'danger')],
    });

    expect(council.decision).toBe('hold');
    expect(council.tone).toBe('danger');
    expect(council.blockers.length).toBeGreaterThan(0);
  });

  it('recommends saving first near a victory window', () => {
    const state = createInitialState();
    const council = buildPreTurnCouncil(state, {
      readiness: readiness(),
      roadmap: roadmap(82),
      preview: preview({ saveAdvice: { id: 'save-route', title: '胜利窗口前保存', body: '先保存。', tone: 'gold', tab: 'save' } }),
      commandActions: [action('safe')],
    });

    expect(council.decision).toBe('save-first');
    expect(council.title).toContain('先存档');
    expect(council.recommendations.some((item) => item.tab === 'save')).toBe(true);
  });

  it('allows careful advancement when warnings exist but no blockers exist', () => {
    const state = createInitialState();
    const council = buildPreTurnCouncil(state, {
      readiness: readiness({ tone: 'warn', score: 72 }),
      roadmap: roadmap(45, 'strained'),
      preview: preview({ status: 'caution', tone: 'warn' }),
      commandActions: [action('warn', 'warn', 'province')],
    });

    expect(council.decision).toBe('advance-carefully');
    expect(council.tone).toBe('warn');
    expect(council.footer).toContain('预演');
  });

  it('deduplicates agenda entries and preserves priorities', () => {
    const state = createInitialState();
    const council = buildPreTurnCouncil(state, {
      readiness: readiness(),
      roadmap: roadmap(),
      preview: preview({ beforePress: [{ id: 'same', title: '处理财政', body: '来自预演', tone: 'warn', tab: 'economy' }], likelyChanges: [{ id: 'same2', title: '处理财政', body: '重复标题', tone: 'warn', tab: 'economy' }] }),
      commandActions: [action('same', 'warn', 'economy')],
    });

    const keys = council.agenda.map((item) => `${item.title}|${item.tab}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(council.agenda[0].priority).toMatch(/must|should|could/);
  });

  it('builds from real state without explicit context', () => {
    const state = createInitialState();
    const report = buildReadinessReport(state);
    const council = buildPreTurnCouncil(state);

    expect(council.confidence).toBeGreaterThanOrEqual(0);
    expect(council.confidence).toBeLessThanOrEqual(100);
    expect(council.footer).toContain(report.label);
  });
});
