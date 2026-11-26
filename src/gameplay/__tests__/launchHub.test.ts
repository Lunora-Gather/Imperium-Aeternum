import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../store/scenarioCatalog';
import { getScenarioProfile, nationStyleTags, pickBestContinueSave, recommendedScenarioIds, summarizeSavePreviews } from '../launchHub';
import type { SaveRecoveryPreview } from '../saveRecovery';

function save(slot: number, status: SaveRecoveryPreview['status'], turn: number, score = 80): SaveRecoveryPreview {
  return {
    slot,
    status,
    tone: status === 'healthy' ? 'good' : status === 'broken' ? 'danger' : 'warn',
    label: status,
    details: [],
    repairs: [],
    turn,
    score,
    nationName: `国家${slot}`,
  };
}

describe('launch hub intelligence', () => {
  it('keeps every scenario covered by a launch profile', () => {
    for (const scenario of SCENARIOS) {
      const profile = getScenarioProfile(scenario.id);
      expect(profile.style.length).toBeGreaterThan(1);
      expect(profile.advice.length).toBeGreaterThan(8);
      expect(profile.marketTag.length).toBeGreaterThan(1);
    }
  });

  it('picks the best playable continue save by safety, turn and manual slot preference', () => {
    const previews = [
      save(0, 'repairable', 20),
      save(1, 'healthy', 10),
      save(2, 'risky', 99),
      save(3, 'broken', 300),
      save(4, 'empty', 0),
    ];

    expect(pickBestContinueSave(previews)).toMatchObject({ slot: 1, status: 'healthy' });
  });

  it('recommends a campaign that can continue ahead of a later defeat, while allowing a lone ending to be reviewed', () => {
    const ended = { ...save(0, 'healthy', 35), defeated: true };
    const active = save(2, 'repairable', 10);
    expect(pickBestContinueSave([ended, active])).toBe(active);
    expect(pickBestContinueSave([ended])).toBe(ended);
  });

  it('continues the latest action in the same year even when an older manual checkpoint exists', () => {
    const older = { ...save(2, 'healthy', 12), createdAt: '2026-01-02T12:00:00Z' };
    const later = { ...save(0, 'healthy', 12), createdAt: '2026-01-02T12:00:03Z' };
    const undated = { ...save(1, 'healthy', 12), createdAt: 'unknown' };
    expect(pickBestContinueSave([older, later, undated])).toBe(later);
    expect(pickBestContinueSave([later, { ...older, createdAt: later.createdAt }])?.slot).toBe(2);
  });

  it('prefers manual slots when status, turn and save time are equal', () => {
    const previews = [save(0, 'healthy', 12), save(2, 'healthy', 12)];

    expect(pickBestContinueSave(previews)).toMatchObject({ slot: 2 });
  });

  it('summarizes save health for the launch page', () => {
    const summary = summarizeSavePreviews([
      save(0, 'healthy', 4),
      save(1, 'repairable', 9),
      save(2, 'risky', 8),
      save(3, 'broken', 1),
      save(4, 'empty', 0),
    ]);

    expect(summary).toMatchObject({ total: 5, playable: 3, healthy: 1, repairable: 1, risky: 1, broken: 1, empty: 1, tone: 'danger' });
    expect(summary.best).toMatchObject({ slot: 0, status: 'healthy' });
  });

  it('produces nation style tags from playable nation descriptions', () => {
    expect(nationStyleTags('商业共和，海贸强国', 'A').map((x) => x.text)).toContain('贸易');
    expect(nationStyleTags('东方霸主，军力强盛', 'S').map((x) => x.text)).toEqual(expect.arrayContaining(['强国', '军事']));
  });

  it('exposes a stable curated recommendation row', () => {
    expect(recommendedScenarioIds()).toEqual(['classic', 'w8_indianocean', 'w5_mediterranean', 'world', 'challenge_survival']);
  });
});
