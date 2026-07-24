import { describe, expect, it } from 'vitest';
import { translate } from '../index';

describe('Traditional Chinese generated fallback', () => {
  it('covers Chinese text embedded in interpolated template literals', () => {
    expect(translate('农业科技树 · 当前 Lv1', {}, 'zh-TW')).toBe('農業科技樹 · 當前 Lv1');
  });
});
