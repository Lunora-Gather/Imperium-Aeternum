import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildDiplomaticIntelBoard, buildDiplomaticIntelBrief, buildNationStyleProfile } from '../nationIntel';
import type { GameState } from '../../types/game';

function firstForeign(state: GameState) {
  return Object.values(state.nations).find((n) => n.id !== state.playerNationId && !n.defeated)!;
}

function playerProvince(state: GameState) {
  return Object.values(state.provinces).find((p) => p.ownerId === state.playerNationId)!;
}

describe('nation style and diplomatic intel', () => {
  it('builds a readable nation style profile from character and tendencies', () => {
    const state = createInitialState();
    const target = firstForeign(state);
    target.character = 'expansionist';
    target.tendency.expansionist = 90;
    target.tendency.militarism = 75;

    const profile = buildNationStyleProfile(state, target.id);

    expect(profile.label).toBe('扩张主义');
    expect(profile.archetype).toBe('扩张主义');
    expect(profile.tags.map((x) => x.text)).toEqual(expect.arrayContaining(['扩张主义']));
    expect(profile.strengths.join('')).toContain('边境');
  });

  it('explains hostile AI intent when a nation wants a player province', () => {
    const state = createInitialState();
    const target = firstForeign(state);
    const province = playerProvince(state);
    const rel = state.relations.find((r) => r.from === state.playerNationId && r.to === target.id)!;
    rel.relation = -60;
    rel.threat = 82;
    (state as GameState & { aiStrategyMeta: Record<string, unknown>; aiMemory: Record<string, unknown> }).aiStrategyMeta = {
      [target.id]: { kind: 'expansion', targetId: state.playerNationId, intensity: 5, sinceTurn: state.turn },
    };
    (state as GameState & { aiStrategyMeta: Record<string, unknown>; aiMemory: Record<string, unknown> }).aiMemory = {
      [target.id]: {
        rivalId: state.playerNationId,
        rivalScore: 88,
        partnerScore: 0,
        watchScore: 60,
        territory: { desiredProvinceId: province.id, pressure: 84, lastUpdated: state.turn },
        lastUpdated: state.turn,
      },
    };

    const intel = buildDiplomaticIntelBrief(state, target.id);

    expect(intel.tone).toBe('danger');
    expect(intel.riskScore).toBeGreaterThan(80);
    expect(intel.explanation).toContain(province.name);
    expect(intel.evidence.some((x) => x.text.includes('觊觎'))).toBe(true);
    expect(intel.tab).toBe('military');
  });

  it('recognizes cooperative opportunity from trust, treaty and AI partner memory', () => {
    const state = createInitialState();
    const target = firstForeign(state);
    const rel = state.relations.find((r) => r.from === state.playerNationId && r.to === target.id)!;
    rel.relation = 68;
    rel.trust = 70;
    rel.threat = 5;
    rel.treaty = 'trade';
    (state as GameState & { aiStrategyMeta: Record<string, unknown>; aiMemory: Record<string, unknown> }).aiStrategyMeta = {
      [target.id]: { kind: 'trade', targetId: state.playerNationId, intensity: 4, sinceTurn: state.turn },
    };
    (state as GameState & { aiStrategyMeta: Record<string, unknown>; aiMemory: Record<string, unknown> }).aiMemory = {
      [target.id]: { partnerId: state.playerNationId, partnerScore: 80, rivalScore: 0, watchScore: 0, lastUpdated: state.turn },
    };

    const intel = buildDiplomaticIntelBrief(state, target.id);

    expect(intel.tone).toBe('good');
    expect(intel.opportunityScore).toBeGreaterThan(intel.riskScore);
    expect(intel.action).toContain('贸易');
    expect(intel.evidence.some((x) => x.text.includes('亲近'))).toBe(true);
  });

  it('sorts the intel board by risk before opportunity', () => {
    const state = createInitialState();
    const [danger, good] = Object.values(state.nations).filter((n) => n.id !== state.playerNationId && !n.defeated).slice(0, 2);
    const dRel = state.relations.find((r) => r.from === state.playerNationId && r.to === danger.id)!;
    dRel.relation = -80;
    dRel.threat = 90;
    const gRel = state.relations.find((r) => r.from === state.playerNationId && r.to === good.id)!;
    gRel.relation = 80;
    gRel.trust = 80;
    gRel.threat = 0;

    const board = buildDiplomaticIntelBoard(state, 2);

    expect(board[0].nation.id).toBe(danger.id);
    expect(board[0].intel.riskScore).toBeGreaterThan(board[1].intel.riskScore);
  });
});
