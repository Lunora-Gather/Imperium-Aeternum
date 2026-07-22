import { useEffect, useRef, useState } from 'react';
import { subscribeToWorldChat } from '../../services/appwrite/socialService';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { Btn } from '../ui';

export function WorldChatPanel({ worldId, nationId }: { worldId: string; nationId?: string }) {
  const store = useSocialStore();
  const userId = useAccountStore((state) => state.user?.$id);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [seenMessageId, setSeenMessageId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const messages = store.messages[worldId] ?? [];
  const newest = messages[messages.length - 1];
  const seenIndex = seenMessageId ? messages.findIndex((item) => item.id === seenMessageId) : messages.length - 1;
  const unread = seenIndex < 0 ? 0 : Math.max(0, messages.length - seenIndex - 1);

  useEffect(() => {
    setOpen(false);
    setSeenMessageId(null);
    void store.refreshMessages(worldId);
    let dispose: (() => Promise<void>) | undefined;
    void subscribeToWorldChat(worldId, () => void store.refreshMessages(worldId)).then((cleanup) => { dispose = cleanup; });
    return () => { if (dispose) void dispose(); };
  }, [worldId]);

  useEffect(() => {
    if (!newest) return;
    if (seenMessageId === null || open) setSeenMessageId(newest.id);
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [newest?.id, open]);

  const send = async () => {
    if (!body.trim()) return;
    const ok = await store.sendMessage(worldId, body, nationId);
    if (ok) setBody('');
  };

  return <section className={`ia-world-chat ${open ? 'is-open' : ''}`}>
    <button className="ia-world-chat-entry" type="button" aria-expanded={open} onClick={() => { setOpen((value) => !value); if (newest) setSeenMessageId(newest.id); }}>
      <span className="ia-chat-emblem">✦</span>
      <span><small>World Channel</small><strong>版图频道</strong><em><i /> 同版图成员实时联络</em></span>
      {unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
      <span className="ia-chat-chevron">{open ? '收起 ↑' : '打开 →'}</span>
    </button>
    {open && <div className="ia-world-chat-body ia-fade-in">
      <div className="ia-world-chat-head"><div><strong>万邦会谈室</strong><span>纯文本 · 最近 50 条</span></div><em>仅本版图成员可读写</em></div>
      {store.message && <div className="ia-world-message" role="status">{store.message}</div>}
      <div ref={logRef} className="ia-world-chat-log" aria-live="polite">{messages.length ? messages.map((item) => {
        const mine = item.userId === userId;
        return <article key={item.id} className={mine ? 'is-mine' : ''}><span className="ia-chat-avatar">{item.displayName.slice(0, 1).toUpperCase()}</span><div><header><strong>{mine ? '我' : item.displayName}</strong>{item.nationId && <em>{item.nationId === nationId ? '当前执政国' : '版图成员'}</em>}<time>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></header><p>{item.body}</p></div></article>;
      }) : <div className="ia-chat-empty"><span>✦</span><strong>频道尚未留下记录</strong><p>向同版图统治者发送第一条消息。</p></div>}</div>
      <form className="ia-world-chat-compose" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <textarea className="ia-input" aria-label="版图消息" value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} maxLength={500} rows={2} placeholder="输入消息；Enter 发送，Shift + Enter 换行" />
        <div><span>{body.length}/500</span><Btn type="submit" label="发送" variant="primary" busy={store.loading} disabled={store.loading || !body.trim()} /></div>
      </form>
    </div>}
  </section>;
}
