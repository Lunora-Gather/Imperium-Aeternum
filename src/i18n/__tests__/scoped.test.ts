import { describe, expect, it } from 'vitest';
import { localizeDeep, translateScoped } from '../scoped';

const catalog = {
  'zh-TW': { '国政总览': '國政總覽' },
  en: { '国政总览': 'State Overview', '第 {{year}} 年': 'Year {{year}}' },
} as const;

describe('lazy scoped translations', () => {
  it('uses the screen catalog before the global fallback', () => {
    expect(translateScoped('国政总览', catalog, {}, 'en')).toBe('State Overview');
    expect(translateScoped('国政总览', catalog, {}, 'zh-TW')).toBe('國政總覽');
  });

  it('interpolates scoped values and preserves the source locale', () => {
    expect(translateScoped('第 {{year}} 年', catalog, { year: 3 }, 'en')).toBe('Year 3');
    expect(translateScoped('第 {{year}} 年', catalog, { year: 3 }, 'zh-CN')).toBe('第 3 年');
  });

  it('supports dynamic presentation patterns and deep view-model localization', () => {
    const dynamic = { en: { patterns: [{ pattern: /^体检 (\d+)\/100$/, replacement: 'Check $1/100' }] } };
    expect(localizeDeep({ title: '体检 86/100', nested: ['国政总览'] }, (source) => translateScoped(source, dynamic, {}, 'en'))).toEqual({ title: 'Check 86/100', nested: ['国政总览'] });
  });

  it('composes translated fragments for runtime-generated advisor prose', () => {
    const dynamic = { en: { fragments: { '主线：': 'Route: ', '征服路线': 'Conquest Route', '可以推进': 'Ready' } } };
    expect(translateScoped('主线：征服路线 · 可以推进', dynamic, {}, 'en')).toBe('Route: Conquest Route · Ready');
  });
});
