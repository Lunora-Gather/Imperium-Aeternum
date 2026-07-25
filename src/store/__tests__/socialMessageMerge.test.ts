import { describe, expect, it } from 'vitest';
import { applyIncomingUnread, directMessageCursor, mergeChatMessages, reconcileSentMessage, recoverDirectInbox } from '../socialStore';
import type { DirectMessage } from '../../social/types';

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

  it('keeps an optimistic message while history refreshes', () => {
    const pending = entry('local:pending', '2026-07-24T10:00:02.000Z', 'sending');
    const history = [entry('old', '2026-07-24T10:00:00.000Z')];

    expect(mergeChatMessages([pending], history).map((item) => item.id)).toEqual(['old', 'local:pending']);
  });

  it('replaces an optimistic message with its authoritative row', () => {
    const pending = entry('local:pending', '2026-07-24T10:00:00.000Z', 'sending');
    const sent = entry('server-row', '2026-07-24T10:00:01.000Z', 'sent');

    expect(reconcileSentMessage([pending], pending.id, sent)).toEqual([sent]);
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

  it('increments unread only for incoming messages outside the active conversation', () => {
    expect(applyIncomingUnread({}, 'friend-a', null, true)).toEqual({ 'friend-a': 1 });
    expect(applyIncomingUnread({ 'friend-a': 2 }, 'friend-a', null, true)).toEqual({ 'friend-a': 3 });
    expect(applyIncomingUnread({ 'friend-a': 2 }, 'friend-a', 'friend-a', true)).toEqual({ 'friend-a': 2 });
    expect(applyIncomingUnread({ 'friend-a': 2 }, 'friend-a', null, false)).toEqual({ 'friend-a': 2 });
  });

  it('recovers unread conversations after a reload without exposing non-friends', () => {
    const direct = (id: string, senderId: string, createdAt: string): DirectMessage => ({
      id,
      conversationKey: `self:${senderId}`,
      senderId,
      recipientId: 'self',
      senderName: senderId,
      body: id,
      kind: 'text',
      mediaFileId: null,
      mediaMime: null,
      createdAt,
    });
    const read = direct('read', 'friend-a', '2026-07-24T10:00:00.000Z');
    const unread = direct('unread', 'friend-a', '2026-07-24T10:00:01.000Z');
    const removed = direct('removed', 'former-friend', '2026-07-24T10:00:02.000Z');

    const recovered = recoverDirectInbox(
      [read, unread, removed],
      'self',
      new Set(['friend-a']),
      { 'friend-a': directMessageCursor(read) },
    );

    expect(recovered.unread).toEqual({ 'friend-a': 1 });
    expect(recovered.messages['friend-a']?.map((message) => message.id)).toEqual(['read', 'unread']);
    expect(recovered.messages['former-friend']).toBeUndefined();
  });
});
