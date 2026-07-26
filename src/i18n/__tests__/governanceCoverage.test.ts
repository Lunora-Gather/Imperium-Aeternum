import { beforeAll, describe, expect, it } from 'vitest';
import { translate } from '..';
import { registerGovernanceTranslations } from '../catalogs/governance';
import { registerNationalPurposeTranslations } from '../catalogs/nationalPurpose';
import { GOVERNMENTS } from '../../data/governments';
import { NATIONAL_CHARACTERS } from '../../data/national-characters';

beforeAll(() => {
  registerGovernanceTranslations();
  registerNationalPurposeTranslations();
});

describe('governance English coverage', () => {
  it.each([
    ['当前税', 'Current tax'],
    ['金/年', 'gold/year'],
    ['权力 25', 'Power 25'],
    ['需行政Lv3', 'Requires Administration Lv.3'],
    ['▸ 可建（19）', '▸ Available (19)'],
    ['▸ 待解锁（23·需科技）', '▸ Locked (23 · technology required)'],
    ['50金·20木', '50 gold · 20 wood'],
    ['+1.2影 +1.2政', '+1.2 influence +1.2 admin'],
    ['+24金 · +5影 · +10粮 · 长途', '+24 gold · +5 influence · +10 food · Long-distance'],
    ['军队部署（1）', 'Army Deployment (1)'],
    ['(1200人)', '(1200 people)'],
    ['➤ 战略军队调动请至 军事页 · 农业基础 1.4 · 驻军 200', '➤ Move strategic armies on the Military screen · Agriculture 1.4 · Garrison 200'],
  ])('translates dynamic economy and management copy: %s', (source, expected) => {
    expect(translate(source, {}, 'en')).toBe(expected);
  });

  it('translates dynamic war opportunity copy with localized names', () => {
    expect(translate('战争机会：先整备 维尼托', {}, 'en')).toBe('War opportunity: prepare first in Veneto');
    expect(translate('最佳候选为 维尼托（维尼托联邦），胜率 56%，备战度 49%。', {}, 'en'))
      .toBe('Best candidate: Veneto (Veneto Federation), 56% win chance and 49% readiness.');
    expect(translate('维尼托联邦 · 胜率 56% · 备战 49%', {}, 'en'))
      .toBe('Veneto Federation · 56% win chance · 49% readiness');
  });

  it('translates chronicle and shortened mission labels', () => {
    expect(translate('罗马 · 执政官布鲁图 治下 · 已历 0 年', {}, 'en'))
      .toBe('Rome · under Consul Brutus · 0 years elapsed');
    expect(translate('稳住朝局', {}, 'en')).toBe('Secure the Court');
    expect(translate('留下国祚', {}, 'en')).toBe('Secure the Legacy');
    expect(translate('🌾 农业科技树 · 当前 Lv1', {}, 'en')).toBe('🌾 Agriculture Technology · Current Lv.1');
    expect(translate('贸易站', {}, 'en')).toBe('Trade Post');
  });

  it('translates player-facing government and national character names', () => {
    for (const definition of [...Object.values(GOVERNMENTS), ...Object.values(NATIONAL_CHARACTERS)]) {
      expect(translate(definition.name, {}, 'en'), definition.id).not.toBe(definition.name);
    }
    expect(translate('未知政体', {}, 'en')).toBe('Unknown government');
    expect(translate('未知国性', {}, 'en')).toBe('Unknown national character');
  });
});
