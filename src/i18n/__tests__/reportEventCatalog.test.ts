import { beforeAll, describe, expect, it } from 'vitest';
import { translate } from '..';
import { registerGovernanceTranslations } from '../catalogs/governance';

const en = (source: string) => translate(source, {}, 'en');

beforeAll(() => registerGovernanceTranslations());

describe('annual report and event English copy', () => {
  it('translates the report shell and dynamic yearly values', () => {
    expect(en('第 12 年 · 年度报告')).toBe('Year 12 · Annual Report');
    expect(en('复盘：先处理待决事件')).toBe('Review: Resolve pending events first');
    expect(en('国库净增 451 金')).toBe('Treasury gained 451 gold');
    expect(en('粮食增收 1851')).toBe('Food increased by 1851');
    expect(en('+451/年')).toBe('+451/year');
  });

  it('translates review findings, routes, and world affairs', () => {
    expect(en('年度复盘 100/100。没有明显恶化项，建议围绕 征服路线 继续推进。')).toBe(
      'Annual review 100/100. Nothing clearly worsened; keep advancing the Conquest Route.',
    );
    expect(en('本年净收入 +451，国家机器有继续运转空间。')).toBe(
      'Net income rose by 451, leaving room to keep the state functioning.',
    );
    expect(en('6 省 / 9 省')).toBe('6 provinces / 9 provinces');
    expect(en('1 年 / 80 年')).toBe('1 year / 80 years');
    expect(en('◇ 维尼托联邦 将 罗马 视为宿敌')).toBe(
      '◇ Veneto Federation now regards Rome as a rival',
    );
  });

  it('translates common event content, effects, choices, and logs', () => {
    expect(en('新领土治理')).toBe('Governing New Territory');
    expect(en('1. 怀柔安抚')).toBe('1. Conciliate the population');
    expect(en('金 -80')).toBe('Gold -80');
    expect(en('事件 新领土治理：选择「怀柔安抚」')).toBe(
      'Event Governing New Territory: chose “Conciliate the population”',
    );
    expect(en('粮储下降，后续饥荒风险升高。')).toBe(
      'Food reserves will fall, increasing the risk of famine.',
    );
  });
});
