import { describe, expect, it } from 'vitest';
import { createInitialState } from '../init';
import { applyLawPerTurnEffectFinals, lawPerTurnEffects, lawPerTurnEffectsPure } from '../politics';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('law per-turn pure effects', () => {
  it('computes unrest and rebellion finals without mutating provinces', () => {
    const state = createInitialState();
    const nation = state.nations.n01;
    const provs = Object.values(state.provinces).filter((p) => p.ownerId === nation.id);

    nation.activeLaws = [
      { lawId: 'law_strict_punishment', enactedTurn: 0 },
      { lawId: 'law_land_reform', enactedTurn: 0 },
    ];
    for (const p of provs) {
      p.unrest = 10;
      p.rebellionRisk = 10;
    }

    const before = clone(provs);
    const finals = lawPerTurnEffectsPure(nation, provs);

    expect(provs).toEqual(before);
    for (const p of provs) {
      expect(finals[p.id]).toEqual({ unrest: 7, rebellionRisk: 7 });
    }
  });

  it('keeps the legacy mutating wrapper equivalent to applying pure finals', () => {
    const legacyState = createInitialState();
    const pureState = clone(legacyState);
    const legacyNation = legacyState.nations.n01;
    const pureNation = pureState.nations.n01;
    const legacyProvs = Object.values(legacyState.provinces).filter((p) => p.ownerId === legacyNation.id);
    const pureProvs = Object.values(pureState.provinces).filter((p) => p.ownerId === pureNation.id);

    legacyNation.activeLaws = [
      { lawId: 'law_strict_punishment', enactedTurn: 0 },
      { lawId: 'law_conscription', enactedTurn: 0 },
    ];
    pureNation.activeLaws = clone(legacyNation.activeLaws);

    for (const p of legacyProvs) {
      p.unrest = 4;
      p.rebellionRisk = 4;
    }
    for (const p of pureProvs) {
      p.unrest = 4;
      p.rebellionRisk = 4;
    }

    lawPerTurnEffects(legacyNation, legacyProvs);
    applyLawPerTurnEffectFinals(pureProvs, lawPerTurnEffectsPure(pureNation, pureProvs));

    expect(
      legacyProvs.map((p) => ({ id: p.id, unrest: p.unrest, rebellionRisk: p.rebellionRisk })),
    ).toEqual(
      pureProvs.map((p) => ({ id: p.id, unrest: p.unrest, rebellionRisk: p.rebellionRisk })),
    );
  });
});
