import { describe, expect, it } from 'vitest';
import { mergeChatMessages } from '../socialStore';

const entry = (id: string, createdAt: string, body = id) => ({ id, createdAt, body });

describe('social message reconciliation', () => {
  it('keeps a realtime message that arrives while history is loading', () => {
    const realtime = entry('live', '2026-07-24T10:00:02.000Z');
    const history = [entry('old', '2026-07-24T10:00:00.000Z')];

    expect(mergeChatMessages([realtime], history).map((item) => item.id)).toEqual(['old', 'live']);
  });

  it('deduplicates the send response and realtime echo by Appwrite row id', () => {
    const sent = entry('same-row', '2026-07-24T10:00:00.000Z', 'server response');
    const echo = entry('same-row', '2026-07-24T10:00:00.000Z', 'realtime echo');

    expect(mergeChatMessages([sent], [echo])).toEqual([echo]);
  });

  it('sorts out-of-order events deterministically and retains only the newest 50', () => {
    const messages = Array.from({ length: 55 }, (_, index) => entry(
      `message-${String(index).padStart(2, '0')}`,
      `2026-07-24T10:00:${String(index).padStart(2, '0')}.000Z`,
    )).reverse();

    const merged = mergeChatMessages([], messages);
    expect(merged).toHaveLength(50);
    expect(merged[0].id).toBe('message-05');
    expect(merged[merged.length - 1]?.id).toBe('message-54');
  });
});
