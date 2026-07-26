import { describe, expect, it } from 'vitest';
import { translate } from '../index';

describe('Traditional Chinese generated fallback', () => {
  it('covers Chinese text embedded in interpolated template literals', () => {
    expect(translate('农业科技树 · 当前 Lv1', {}, 'zh-TW')).toBe('農業科技樹 · 當前 Lv1');
  });

  it('covers player-facing text stored in game data', () => {
    expect(translate('静观其变', {}, 'zh-TW')).toBe('靜觀其變');
  });

  it('repairs context-sensitive event and diplomacy terms', () => {
    expect(translate('改善关系并签订条约', {}, 'zh-TW')).toBe('改善關係並簽訂條約');
    expect(translate('持续干旱，等待复苏', {}, 'zh-TW')).toBe('持續乾旱，等待復甦');
  });

  it('keeps transliterated place and ruler names readable', () => {
    expect(translate('亚得里亚海 · 里昂 · 亚拉里克', {}, 'zh-TW')).toBe('亞得里亞海 · 里昂 · 亞拉里克');
  });

  it('does not overcorrect unrelated uses of contextual characters', () => {
    expect(translate('补给系统 · 发掘古物 · 家里', {}, 'zh-TW')).toBe('補給系統 · 發掘古物 · 家裡');
  });
});
