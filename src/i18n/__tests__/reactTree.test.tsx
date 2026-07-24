import { afterEach, describe, expect, it } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { setLocale } from '..';
import { registerGovernanceTranslations } from '../catalogs/governance';
import { localizeReactTree } from '../reactTree';

function Card(_: { title: string; body: string; children?: ReactNode }) { return null; }

afterEach(() => setLocale('zh-CN'));

describe('localizeReactTree', () => {
  it('localizes nested literal children and presentation props without invoking components', () => {
    registerGovernanceTranslations();
    setLocale('en');
    const tree = localizeReactTree(<section><h1>天下舆图</h1><Card title="省政判断" body="局势尚可，可按国运目标选择经济、科研或军事建设。" /></section>);
    expect(isValidElement(tree)).toBe(true);
    const root = tree as ReactElement<{ children: ReactElement[] }>;
    const [heading, card] = root.props.children;
    expect(heading.props.children).toBe('World Map');
    expect(card.type).toBe(Card);
    expect(card.props.title).toBe('Provincial Assessment');
    expect(card.props.body).toContain('Conditions are manageable');
  });

  it('uses the generated lightweight Traditional Chinese fallback', () => {
    setLocale('zh-TW');
    const tree = localizeReactTree(<p>当前为游客模式</p>) as ReactElement<{ children: string }>;
    expect(tree.props.children).toBe('當前為遊客模式');
  });
});
