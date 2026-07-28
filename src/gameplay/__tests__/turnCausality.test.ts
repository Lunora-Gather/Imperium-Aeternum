import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildTurnCausality } from '../turnCausality';

describe('turn causality', () => {
  it('explains the exact fiscal equation and strategic/world causes', () => {
    const state = createInitialState();
    state.lastReport = {
      turn: 1, nationId: state.playerNationId,
      income: { tax: 80, trade: 20, building: 10 }, expense: { military: 30, corruption: 5 },
      foodDelta: 12, popDelta: 4, stabilityDelta: -1, legitimacyDelta: 2, unrestDelta: 1,
      events: ['evt_test'], warnings: [], warProgress: [], factionDelta: [], exhaustSnapshot: 0,
      worldEvents: ['邻国转向扩张战略。'], provinceChanges: [], strategicNotes: ['富国国策：国库与粮储增长'],
    };

    const causality = buildTurnCausality(state);

    expect(causality?.netGold).toBe(75);
    expect(causality?.lines.find((line) => line.id === 'finance')?.detail).toContain('= +75 金');
    expect(causality?.lines.map((line) => line.title)).toEqual(expect.arrayContaining(['国策与制度', '事件影响', 'AI 与天下大势']));
  });
});
