import { describe, expect, it } from 'vitest';
import { resolveBattle } from '../formulas';

function expectFiniteBattle(result: ReturnType<typeof resolveBattle>) {
  expect(Number.isFinite(result.progressDelta)).toBe(true);
  expect(Number.isFinite(result.attackerLoss)).toBe(true);
  expect(Number.isFinite(result.defenderLoss)).toBe(true);
  expect(Number.isFinite(result.attackerMoraleDelta)).toBe(true);
  expect(Number.isFinite(result.defenderMoraleDelta)).toBe(true);
}

describe('resolveBattle stability guards', () => {
  it('returns a stalemate without NaN when both sides have zero effective power', () => {
    const result = resolveBattle(0, 0, 120, 80);

    expectFiniteBattle(result);
    expect(result.progressDelta).toBe(0);
    expect(result.attackerLoss).toBe(0);
    expect(result.defenderLoss).toBe(0);
  });

  it('keeps equal power battles as a true stalemate instead of favoring one side', () => {
    const result = resolveBattle(100, 100, 100, 100);

    expectFiniteBattle(result);
    expect(result.progressDelta).toBe(0);
    expect(result.attackerLoss).toBeGreaterThan(0);
    expect(result.defenderLoss).toBeGreaterThan(0);
  });

  it('never reports losses above the committed force size', () => {
    const result = resolveBattle(1, 10_000, 40, 25);

    expectFiniteBattle(result);
    expect(result.attackerLoss).toBeLessThanOrEqual(40);
    expect(result.defenderLoss).toBeLessThanOrEqual(25);
    expect(result.progressDelta).toBeLessThan(0);
  });
});
