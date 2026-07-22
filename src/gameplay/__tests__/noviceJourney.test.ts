import { describe, expect, it } from 'vitest';
import {
  completeNoviceJourneyStep,
  createNoviceJourney,
  getNextNoviceJourneyStep,
  normalizeNoviceJourney,
  noviceJourneyProgress,
  reconcileNoviceJourney,
} from '../noviceJourney';

describe('first-run novice journey', () => {
  it('starts at overview and advances manual learning steps in order', () => {
    const start = createNoviceJourney();
    expect(getNextNoviceJourneyStep(start)?.id).toBe('orient');

    const afterOverview = completeNoviceJourneyStep(start, 'orient');
    expect(getNextNoviceJourneyStep(afterOverview)?.id).toBe('economy');
    expect(noviceJourneyProgress(afterOverview)).toEqual({ current: 2, total: 6, percent: 17 });
  });

  it('automatically recognizes save, turn and report milestones', () => {
    let progress = createNoviceJourney();
    progress = completeNoviceJourneyStep(progress, 'orient');
    progress = completeNoviceJourneyStep(progress, 'economy');
    progress = completeNoviceJourneyStep(progress, 'province');
    progress = reconcileNoviceJourney(progress, { turn: 1, currentTab: 'report', hasLocalSave: true });

    expect(progress.status).toBe('completed');
    expect(progress.completed).toEqual(['orient', 'economy', 'province', 'save', 'turn', 'report']);
    expect(getNextNoviceJourneyStep(progress)).toBeNull();
  });

  it('does not complete report merely because a turn advanced', () => {
    const progress = reconcileNoviceJourney(createNoviceJourney(), { turn: 1, currentTab: 'dashboard', hasLocalSave: false });

    expect(progress.completed).toContain('turn');
    expect(progress.completed).not.toContain('report');
  });

  it('keeps the visible step number aligned when a later milestone completed early', () => {
    const progress = reconcileNoviceJourney(createNoviceJourney(), { turn: 0, currentTab: 'dashboard', hasLocalSave: true });

    expect(getNextNoviceJourneyStep(progress)?.id).toBe('orient');
    expect(noviceJourneyProgress(progress)).toEqual({ current: 1, total: 6, percent: 17 });
  });

  it('normalizes corrupt persisted values and preserves dismissal', () => {
    expect(normalizeNoviceJourney({ status: 'dismissed', completed: ['orient', 'unknown', 'orient'] })).toEqual({
      version: 1,
      status: 'dismissed',
      completed: ['orient'],
    });
    expect(normalizeNoviceJourney('{broken')).toEqual(createNoviceJourney());
  });
});
