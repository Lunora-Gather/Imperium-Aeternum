import { describe, expect, it } from 'vitest';
import { buildLaunchHandbook, findHandbookSection, firstTimeChecklist } from '../launchHandbook';

describe('launch handbook', () => {
  it('builds product-facing handbook sections', () => {
    const handbook = buildLaunchHandbook();
    const sectionIds = handbook.sections.map((x) => x.id);

    expect(sectionIds).toEqual(expect.arrayContaining(['loop', 'decision', 'risk', 'story']));
    expect(handbook.headline).toContain('治理');
    expect(handbook.primaryAdvice).toContain('地中海黎明');
  });

  it('explains the yearly loop with the expected core surfaces', () => {
    const loop = findHandbookSection('loop');

    expect(loop.steps.map((x) => x.id)).toEqual(expect.arrayContaining(['roadmap', 'council', 'preview', 'report']));
    expect(loop.summary).toContain('复盘');
    expect(loop.tone).toBe('gold');
  });

  it('keeps risk guidance actionable before the player starts', () => {
    const risk = findHandbookSection('risk');

    expect(risk.steps.map((x) => x.id)).toEqual(expect.arrayContaining(['save', 'red', 'intel']));
    expect(risk.steps.find((x) => x.id === 'red')?.tone).toBe('danger');
    expect(risk.summary).toContain('红色项');
  });

  it('provides a compact first-time checklist', () => {
    const checklist = firstTimeChecklist();

    expect(checklist).toEqual(expect.arrayContaining(['帝国路线图', '作战会议', '下一回合预演', '年度复盘', '先存档']));
    expect(checklist.length).toBeGreaterThanOrEqual(5);
  });
});
