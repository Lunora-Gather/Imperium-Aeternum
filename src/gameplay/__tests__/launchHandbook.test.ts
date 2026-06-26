import { describe, expect, it } from 'vitest';
import { buildLaunchHandbook, findHandbookSection, firstTimeChecklist } from '../launchHandbook';

describe('launch handbook', () => {
  it('builds four product-facing handbook sections', () => {
    const handbook = buildLaunchHandbook();

    expect(handbook.sections.map((x) => x.id)).toEqual(['loop', 'decision', 'risk', 'story']);
    expect(handbook.headline).toContain('治理');
    expect(handbook.primaryAdvice).toContain('地中海黎明');
  });

  it('explains the yearly loop in the intended order', () => {
    const loop = findHandbookSection('loop');

    expect(loop.steps.map((x) => x.id)).toEqual(['roadmap', 'council', 'preview', 'report']);
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

    expect(checklist).toEqual(expect.arrayContaining(['帝国路线图', '情境提示', '作战会议', '下一回合预演', '年度复盘', '先存档']));
    expect(checklist.length).toBe(6);
  });
});
