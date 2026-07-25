import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../store/scenarioCatalog';
import { buildScenarioChallengeGuide } from '../../gameplay/difficultyGuide';
import { SCENARIO_PROFILES } from '../../gameplay/launchHub';
import { hasExplicitTranslation, translate } from '..';

describe('i18n catalog', () => {
  it('translates core navigation into all supported languages', () => {
    expect(translate('总览', {}, 'zh-CN')).toBe('总览');
    expect(translate('总览', {}, 'zh-TW')).toBe('總覽');
    expect(translate('总览', {}, 'en')).toBe('Overview');
  });

  it('interpolates values without exposing template tokens', () => {
    expect(translate('第 {{year}} 年 · 修订 {{revision}}', { year: 12, revision: 7 }, 'en')).toBe('Year 12 · Revision 7');
    expect(translate('{{value}}/年', { value: '+451' }, 'en')).toBe('+451/year');
    expect(translate('第 {{year}} 年 · 年度报告', { year: 1 }, 'en')).toBe('Year 1 · Annual Report');
  });

  it('falls back to the source text when a translation is not ready', () => {
    expect(translate('动态史实名称', {}, 'en')).toBe('动态史实名称');
  });

  it('keeps every launch campaign summary explicitly translated in English', () => {
    const sources = SCENARIOS.flatMap((scenario) => {
      const profile = SCENARIO_PROFILES[scenario.id];
      const guide = buildScenarioChallengeGuide(scenario.id);
      return [scenario.name, scenario.subtitle, scenario.description, scenario.nationCount, profile.marketTag, guide.label, guide.headline, guide.recommendedAfter];
    });
    expect(sources.filter((source) => /[\p{Script=Han}]/u.test(source) && !hasExplicitTranslation(source, 'en'))).toEqual([]);
  });

  it('keeps save-health summaries fully translated in English', () => {
    expect(translate('存档健康', {}, 'en')).toBe('Saves healthy');
    expect(translate('健康', {}, 'en')).toBe('Healthy');
    expect(translate('2 个存档可自动修复', {}, 'en')).toBe('2 saves can be repaired automatically');
    expect(translate('1 个存档可读但有风险', {}, 'en')).toBe('1 playable save has risks');
    expect(translate('1 个槽位损坏', {}, 'en')).toBe('1 damaged slot');
  });
});
