import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildTurnPreview } from '../turnPreview';
import { buildReadinessReport, type ReadinessReport } from '../readiness';
import type { EmpireRoadmap } from '../empireRoadmap';
import type { CommandCenterAction } from '../commandCenterActions';

function roadmap(progress = 20): EmpireRoadmap {
  return {
    tier: 'stable',
    score: 66,
    headline: '局势稳定',
    summary: '测试路线图',
    tone: 'good',
    route: { id: 'diplomacy', label: '合纵路线', progress, tab: 'diplomacy', hint: '测试主线' },
    steps: [],
    riskLine: '暂无主要系统性风险',
    opportunityLine: '测试机会',
    evidence: [],
    evidenceLine: '体检 66/100',
  };
}

function goodReadiness(): ReadinessReport {
  return { score: 90, label: '稳健', tone: 'good', canAdvance: true, blockers: [], warnings: [], advice: [], devChecks: [] };
}

function action(id: string, tab: CommandCenterAction['tab'], level = 40): CommandCenterAction {
  return { id, label: `行动${id}`, desc: `处理${id}`, tab, level, tone: level > 88 ? 'danger' : level > 55 ? 'warn' : 'normal', source: 'fallback' };
}

describe('turn preview', () => {
  it('blocks advancing when there are pending events', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'preview_event' });

    const preview = buildTurnPreview(state);

    expect(preview.status).toBe('blocked');
    expect(preview.canAdvance).toBe(false);
    expect(preview.signals.find((s) => s.id === 'events')).toMatchObject({ value: '1', tone: 'danger' });
  });

  it('flags dangerous resource and stability signals', () => {
    const state = createInitialState();
    const player = state.nations[state.playerNationId];
    player.resources.gold = -20;
    player.resources.food = -5;
    player.government.stability = 25;

    const preview = buildTurnPreview(state);

    expect(preview.signals.find((s) => s.id === 'gold')).toMatchObject({ tone: 'danger' });
    expect(preview.signals.find((s) => s.id === 'food')).toMatchObject({ tone: 'danger' });
    expect(preview.signals.find((s) => s.id === 'stability')).toMatchObject({ tone: 'danger' });
    expect(preview.saveAdvice.tab).toBe('save');
  });

  it('uses last report trends to explain likely next-turn changes', () => {
    const state = createInitialState();
    state.lastReport = {
      turn: 2,
      nationId: state.playerNationId,
      income: { tax: 10, trade: 0, building: 0 },
      expense: { military: 60, corruption: 5 },
      foodDelta: -70,
      popDelta: 0,
      stabilityDelta: 0,
      legitimacyDelta: 0,
      unrestDelta: 0,
      events: [],
      warnings: [],
      warProgress: [],
      factionDelta: [],
      exhaustSnapshot: 0,
      worldEvents: [],
      provinceChanges: [],
    };

    const preview = buildTurnPreview(state);

    expect(preview.likelyChanges.map((x) => x.id)).toEqual(expect.arrayContaining(['gold-drop', 'food-drop']));
  });

  it('reuses supplied diagnostics and command actions for before-press guidance', () => {
    const state = createInitialState();
    const readiness = buildReadinessReport(state);
    const commandActions = [action('economy', 'economy', 80), action('province', 'province', 70)];

    const preview = buildTurnPreview(state, { readiness, commandActions, roadmap: roadmap() });

    expect(preview.beforePress).toHaveLength(2);
    expect(preview.beforePress[0]).toMatchObject({ title: '先处理：行动economy', tab: 'economy' });
  });

  it('recommends saving near a victory window', () => {
    const state = createInitialState();
    const preview = buildTurnPreview(state, { readiness: goodReadiness(), roadmap: roadmap(82), commandActions: [action('stable', 'dashboard')] });

    expect(preview.saveAdvice.id).toBe('save-route');
    expect(preview.saveAdvice.tone).toBe('gold');
  });
});
