import { describe, expect, it } from 'vitest';
import { translate } from '../index';

describe('dynamic game log translations', () => {
  it.each([
    ['新游戏开始：地中海黎明 · 第 1 年', 'New campaign: Mediterranean Dawn · Year 1'],
    ['新游戏开始：万邦纪元 · 你执掌 罗马 · 第 1 年', 'New campaign: Age of Nations · You govern Rome · Year 1'],
    ['已选剧本：东方破晓，请选择你的邦国', 'Campaign selected: Eastern Dawn. Choose your nation.'],
  ])('translates %s without mutating canonical log data', (source, expected) => {
    expect(translate(source, {}, 'en')).toBe(expected);
  });
});
