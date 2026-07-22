import { useEffect, useState } from 'react';
import { subscribeToWorldChat } from '../../services/appwrite/socialService';
import { useSocialStore } from '../../store/socialStore';
import { Btn } from '../ui';

export function WorldChatPanel({ worldId, nationId }: { worldId: string; nationId?: string }) {
  const store = useSocialStore();
  const [body, setBody] = useState('');
  const messages = store.messages[worldId] ?? [];
  useEffect(() => {
    void store.refreshMessages(worldId);
    let dispose: (() => Promise<void>) | undefined;
    void subscribeToWorldChat(worldId, () => void store.refreshMessages(worldId)).then((cleanup) => { dispose = cleanup; });
    return () => { if (dispose) void dispose(); };
  }, [worldId]);
  return <section className="ia-world-chat">
    <div className="ia-world-chat-head"><div><span className="ia-up">World Channel</span><strong>版图聊天室</strong></div><em>仅本版图成员可读写</em></div>
    {store.message && <div className="ia-world-message" role="status">{store.message}</div>}
    <div className="ia-world-chat-log" aria-live="polite">{messages.length ? messages.map((item) => <article key={item.id}><div><strong>{item.displayName}</strong><time>{new Date(item.createdAt).toLocaleString()}</time></div><p>{item.body}</p></article>) : <p className="dim">还没有消息。可以先向同版图玩家问候。</p>}</div>
    <form className="ia-world-chat-compose" onSubmit={(event) => { event.preventDefault(); void store.sendMessage(worldId, body, nationId).then((ok) => { if (ok) setBody(''); }); }}><input className="ia-input" value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} placeholder="发送版图消息（最多 500 字）" /><Btn type="submit" label="发送" variant="primary" disabled={!body.trim()} onClick={() => undefined} /></form>
  </section>;
}
