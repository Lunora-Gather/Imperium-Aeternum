import { describe, expect, it } from 'vitest';
import { analyzeCampaignReports } from '../campaignHealth';
import type { TurnReport } from '../../types/game';

function report(overrides: Partial<TurnReport> = {}): TurnReport {
  return {
    turn: 1,
    nationId: 'n01',
    income: { tax: 100, trade: 30, building: 20 },
    expense: { military: 40, corruption: 10 },
    foodDelta: 15,
    popDelta: 10,
    stabilityDelta: 1,
    legitimacyDelta: 0,
    unrestDelta: -1,
    events: ['evt'],
    warnings: [],
    warProgress: [],
    factionDelta: [],
    exhaustSnapshot: 5,
    worldEvents: [],
    provinceChanges: [],
    strategicNotes: [],
    ...overrides,
  };
}

describe('campaign health analysis', () => {
  it('recognizes a resilient campaign window', () => {
    const health = analyzeCampaignReports([report(), report({ turn: 2 }), report({ turn: 3 })]);
    expect(health.score).toBeGreaterThanOrEqual(80);
    expect(health.negativeIncomeTurns).toBe(0);
    expect(health.findings.some((finding) => finding.id === 'fiscal-stable')).toBe(true);
  });

  it('surfaces fiscal, food, war and density pressure together', () => {
    const bad = report({
      income: { tax: 10, trade: 0, building: 0 },
      expense: { military: 90, corruption: 25 },
      foodDelta: -80,
      warnings: ['危机'],
      exhaustSnapshot: 82,
    });
    const health = analyzeCampaignReports([bad, { ...bad, turn: 2 }, { ...bad, turn: 3 }, { ...bad, turn: 4 }]);
    expect(health.tone).toBe('danger');
    expect(health.findings.map((finding) => finding.id)).toEqual(expect.arrayContaining(['fiscal-spiral', 'food-spiral', 'war-fatigue', 'high-density']));
  });

  it('does not pretend an empty history is healthy', () => {
    const health = analyzeCampaignReports([]);
    expect(health.horizon).toBe(0);
    expect(health.tone).toBe('info');
    expect(health.findings[0].id).toBe('no-history');
  });
});
