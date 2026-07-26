import { describe, expect, it } from 'vitest';
import { collectNewLogEntries } from '../LogToast';

describe('LogToast log sequence', () => {
  it('keeps detecting feedback after the bounded log starts rolling', () => {
    const rolledLog = Array.from({ length: 31 }, (_, index) => `消息 ${index + 2}`);

    expect(collectNewLogEntries(rolledLog, 32, 31)).toEqual(['消息 32']);
  });

  it('treats repeated messages as distinct actions', () => {
    const log = Array.from({ length: 31 }, () => '请先处理待决事件');

    expect(collectNewLogEntries(log, 48, 46)).toEqual([
      '请先处理待决事件',
      '请先处理待决事件',
    ]);
  });

  it('returns every available message after a batched update and ignores a clear', () => {
    expect(collectNewLogEntries(['警告一', '警告二', '进入第 3 年'], 13, 10)).toEqual([
      '警告一',
      '警告二',
      '进入第 3 年',
    ]);
    expect(collectNewLogEntries([], 13, 13)).toEqual([]);
  });
});
