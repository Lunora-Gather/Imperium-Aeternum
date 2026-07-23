import { describe, expect, it } from 'vitest';
import { translate } from '..';

describe('i18n catalog', () => {
  it('translates core navigation into all supported languages', () => {
    expect(translate('总览', {}, 'zh-CN')).toBe('总览');
    expect(translate('总览', {}, 'zh-TW')).toBe('總覽');
    expect(translate('总览', {}, 'en')).toBe('Overview');
  });

  it('interpolates values without exposing template tokens', () => {
    expect(translate('第 {{year}} 年 · 修订 {{revision}}', { year: 12, revision: 7 }, 'en')).toBe('Year 12 · Revision 7');
  });

  it('falls back to the source text when a translation is not ready', () => {
    expect(translate('动态史实名称', {}, 'en')).toBe('动态史实名称');
  });
});
