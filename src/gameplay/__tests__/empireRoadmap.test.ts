import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildEmpireRoadmap } from '../empireRoadmap';
import { buildReadinessReport } from '../readiness';
import { buildStrategicBrief } from '../strategicAdvisor';
import type { AmbitionSnapshot } from '../ambitions';
import type { CommandCenterAction } from '../commandCenterActions';

const ambition: AmbitionSnapshot = {
  conquest: { current: 2, target: 10, done: false },
  economy: { current: 100, target: 2000, turns: 0, needTurns: 6, done: false },
  diplomacy: { influence: 180, influenceTarget: 200, goodRelations: 4, goodTarget: 5, done: false },
  eternal: { turns: 4, target: 80, done: false },
  worldScale: 'local',
};

function action(id: string, tab: CommandCenterAction['tab'], level: number, source: CommandCenterAction['source'] = 'fallback'): CommandCenterAction {
  return { id, label: `行动${id}`, desc: `处理${id}`, tab, level, tone: level > 88 ? 'danger' : level > 55 ? 'warn' : 'normal', source };
}

describe('empire roadmap', () => {
  it('builds a three-step roadmap with the closest victory route', () => {
    const state = createInitialState();
    const roadmap = buildEmpireRoadmap(state, { ambition });

    expect(roadmap.steps).toHaveLength(3);
    expect(roadmap.route).toMatchObject({ id: 'diplomacy', label: '合纵路线', tab: 'diplomacy' });
    expect(roadmap.route.progress).toBeGreaterThan(70);
  });

  it('puts hard blockers into a collapse-tier roadmap', () => {
    const state = createInitialState();
    state.pendingEvents.push({ nationId: state.playerNationId, eventId: 'roadmap_blocker' });

    const roadmap = buildEmpireRoadmap(state);

    expect(roadmap.tier).toBe('collapse');
    expect(roadmap.tone).toBe('danger');
    expect(roadmap.steps[0].horizon).toBe('现在');
  });

  it('reuses supplied diagnostics and command actions for deterministic planning', () => {
    const state = createInitialState();
    const brief = buildStrategicBrief(state);
    const readiness = buildReadinessReport(state);
    const commandActions = [action('a', 'economy', 80, 'readiness'), action('b', 'province', 70, 'strategy')];

    const roadmap = buildEmpireRoadmap(state, { brief, readiness, commandActions, ambition });

    expect(roadmap.steps[0]).toMatchObject({ id: 'action-a', tab: 'economy', horizon: '现在', reason: '回合前体检 · 优先级 80' });
    expect(roadmap.steps[1]).toMatchObject({ id: 'action-b', tab: 'province', horizon: '本年', reason: '战略参谋 · 优先级 70' });
  });

  it('keeps route progress clamped to 100 percent', () => {
    const state = createInitialState();
    const maxed: AmbitionSnapshot = {
      conquest: { current: 999, target: 1, done: true },
      economy: { current: 9999, target: 1, turns: 99, needTurns: 1, done: true },
      diplomacy: { influence: 999, influenceTarget: 1, goodRelations: 99, goodTarget: 1, done: true },
      eternal: { turns: 999, target: 1, done: true },
      worldScale: 'world',
    };

    const roadmap = buildEmpireRoadmap(state, { ambition: maxed });

    expect(roadmap.route.progress).toBe(100);
  });

  it('adds evidence and impact text to make the roadmap explainable', () => {
    const state = createInitialState();
    const brief = buildStrategicBrief(state);
    const readiness = buildReadinessReport(state);
    const commandActions = [action('finance', 'economy', 80, 'readiness')];

    const roadmap = buildEmpireRoadmap(state, { brief, readiness, commandActions, ambition });

    expect(roadmap.evidence.length).toBeGreaterThanOrEqual(4);
    expect(roadmap.evidenceLine).toContain('体检');
    expect(roadmap.evidenceLine).toContain('主线');
    expect(roadmap.steps[0].body).toContain('依据：回合前体检 · 优先级 80');
    expect(roadmap.steps[0].body).toContain('影响：优先保护财政与粮食循环');
  });
});
