import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../engine/init';
import { buildChronicleDigest } from '../chronicleDigest';
import type { ChronicleEntry } from '../../types/game';

function entry(turn: number, kind: ChronicleEntry['kind'], title: string, desc = '记事'): ChronicleEntry {
  return { turn, kind, title, desc };
}

describe('chronicle digest', () => {
  it('returns an empty-state chapter before meaningful records', () => {
    const state = createInitialState();
    state.turn = 0;
    state.chronicle = [];

    const digest = buildChronicleDigest(state);

    expect(digest.empty).toBe(true);
    expect(digest.era).toBe('开国元年');
    expect(digest.chapterTitle).toBe('史册尚未展开');
    expect(digest.recent).toHaveLength(0);
  });

  it('classifies expansion and victory records as glory', () => {
    const state = createInitialState();
    state.turn = 12;
    state.chronicle = [
      entry(1, 'founding', '立国'),
      entry(3, 'expansion', '疆土达 3 省'),
      entry(5, 'victory', '首战告捷'),
      entry(8, 'trade', '国库充盈'),
    ];

    const digest = buildChronicleDigest(state);

    expect(digest.empty).toBe(false);
    expect(digest.era).toBe('奠基纪');
    expect(digest.glory).toBe(3);
    expect(digest.chapterTitle).toMatch(/兵锋|富庶|均衡/);
    expect(digest.recent[0].turn).toBe(8);
  });

  it('detects crisis-heavy histories', () => {
    const state = createInitialState();
    state.turn = 18;
    state.chronicle = [
      entry(2, 'crisis', '乱世的序章'),
      entry(5, 'crisis', '财政危机'),
      entry(7, 'milestone_rebellion', '叛乱平定'),
    ];

    const digest = buildChronicleDigest(state);

    expect(digest.tone).toBe('warn');
    expect(digest.chapterTitle).toBe('危局与修复之书');
    expect(digest.crisis).toBe(3);
  });

  it('keeps important highlights before purely recent minor records', () => {
    const state = createInitialState();
    state.turn = 70;
    state.chronicle = [
      entry(1, 'founding', '开国'),
      entry(10, 'victory', '首战告捷'),
      entry(20, 'crisis', '财政危机'),
      entry(65, 'milestone_diplomacy', '远交近攻'),
      entry(66, 'tech', '学术兴盛'),
    ];

    const digest = buildChronicleDigest(state);

    expect(digest.era).toBe('永恒纪');
    expect(digest.highlights.map((x) => x.title)).toEqual(expect.arrayContaining(['开国', '首战告捷']));
    expect(digest.recent[0].title).toBe('学术兴盛');
  });
});
