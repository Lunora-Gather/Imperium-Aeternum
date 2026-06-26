import { describe, expect, it } from 'vitest';
import { buildLaunchHandbook, findHandbookSection, firstTimeChecklist } from '../launchHandbook';

describe('launch handbook', () => {
  it('builds product-facing handbook sections', () => {
    const handbook = buildLaunchHandbook();

    expect(handbook.sections).toHaveLength(4);
    expect(handbook.sections.every((x) => x.title.length > 0 && x.steps.length > 0)).toBe(true);
    expect(handbook.headline).toContain('治理');
    expect(handbook.primaryAdvice).toContain('地中海黎明');
  });

  it('explains the yearly loop with core surfaces', () => {
    const loop = findHandbookSection('loop');
    const ids = new Set(loop.steps.map((x) => x.id));

    expect(ids.has('roadmap')).toBe(true);
    expect(ids.has('council')).toBe(true);
    expect(ids.has('preview')).toBe(true);
    expect(ids.has('report')).toBe(true);
    expect(loop.tone).toBe('gold');
  });

  it('keeps risk guidance actionable before the player starts', () => {
    const risk = findHandbookSection('risk');
    const red = risk.steps.find((x) => x.id === 'red');

    expect(risk.steps.some((x) => x.id === 'save')).toBe(true);
    expect(red?.tone).toBe('danger');
    expect(red?.body).toContain('不要连跳');
  });

  it('provides a compact first-time checklist', () => {
    const checklist = firstTimeChecklist();

    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.every((x) => x.length > 0)).toBe(true);
    expect(checklist.join(' / ')).toContain('帝国路线图');
  });
});
