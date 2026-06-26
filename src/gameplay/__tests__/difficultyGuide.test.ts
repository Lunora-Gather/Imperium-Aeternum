import { describe, expect, it } from 'vitest';
import { buildScenarioChallengeGuide, compareScenarioDifficulty, isHardScenario, recommendedChallengePath, summarizeChallengePath } from '../difficultyGuide';

describe('difficulty and challenge guide', () => {
  it('marks classic as the relaxed entry point', () => {
    const guide = buildScenarioChallengeGuide('classic');

    expect(guide.band).toBe('relaxed');
    expect(guide.tone).toBe('good');
    expect(guide.pressure).toBeLessThan(30);
    expect(guide.checklist.some((x) => x.id === 'first-report')).toBe(true);
  });

  it('marks survival challenge as hardcore with explicit safeguards', () => {
    const guide = buildScenarioChallengeGuide('challenge_survival');

    expect(guide.band).toBe('hardcore');
    expect(guide.tone).toBe('danger');
    expect(guide.pressure).toBeGreaterThan(90);
    expect(guide.checklist.map((x) => x.id)).toEqual(expect.arrayContaining(['no-rush', 'fix-red', 'save-first']));
  });

  it('orders scenarios by difficulty band and pressure', () => {
    const ids = ['challenge_survival', 'world', 'classic', 'w8_indianocean'] as const;
    const sorted = [...ids].sort(compareScenarioDifficulty);

    expect(sorted[0]).toBe('classic');
    expect(sorted.at(-1)).toBe('challenge_survival');
  });

  it('detects hard scenarios for launch hub warnings', () => {
    expect(isHardScenario('classic')).toBe(false);
    expect(isHardScenario('w5_mediterranean')).toBe(false); // hard label but pressure below the warning threshold
    expect(isHardScenario('world')).toBe(true);
    expect(isHardScenario('challenge_survival')).toBe(true);
  });

  it('summarizes a recommended challenge path from entry to hardcore', () => {
    const path = recommendedChallengePath();
    const summary = summarizeChallengePath(path);

    expect(path[0]).toBe('classic');
    expect(path.at(-1)).toBe('challenge_survival');
    expect(summary.ids[0]).toBe('classic');
    expect(summary.headline).toContain('休闲入门');
    expect(summary.advice).toContain('挑战阶梯');
  });
});
