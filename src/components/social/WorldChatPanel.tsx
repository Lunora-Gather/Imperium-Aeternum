import { useEffect, useRef, useState } from 'react';
import { subscribeToWorldChat, worldMessageMediaUrl } from '../../services/appwrite/socialService';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { Btn } from '../ui';
import { useI18n } from '../../i18n';

export function WorldChatPanel({ worldId, nationId }: { worldId: string; nationId?: string }) {
  const { locale, t } = useI18n();
  const store = useSocialStore();
  const userId = useAccountStore((state) => state.user?.$id);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [seenMessageId, setSeenMessageId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messages = store.messages[worldId] ?? [];
  const newest = messages[messages.length - 1];
  const seenIndex = seenMessageId ? messages.findIndex((item) => item.id === seenMessageId) : messages.length - 1;
  const unread = seenIndex < 0 ? 0 : Math.max(0, messages.length - seenIndex - 1);

  useEffect(() => {
    setOpen(false);
    setSeenMessageId(null);
    void store.refreshMessages(worldId);
    let cancelled = false;
    let dispose: (() => Promise<void>) | undefined;
    void subscribeToWorldChat(worldId, (entry) => store.receiveMessage(entry))
      .then((cleanup) => { if (cancelled) void cleanup(); else dispose = cleanup; })
      .catch((error) => { if (!cancelled) useSocialStore.setState({ message: error instanceof Error ? error.message : '实时频道连接失败' }); });
    return () => { cancelled = true; if (dispose) void dispose(); };
  }, [worldId]);

  useEffect(() => {
    if (!attachment) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(attachment);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  useEffect(() => {
    if (!newest) return;
    if (seenMessageId === null || open) setSeenMessageId(newest.id);
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [newest?.id, open]);

  const send = async () => {
    if (!body.trim() && !attachment) return;
    const ok = attachment
      ? await store.sendImage(worldId, attachment, body, nationId)
      : await store.sendMessage(worldId, body, nationId);
    if (ok) { setBody(''); setAttachment(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  return <section className={`ia-world-chat ${open ? 'is-open' : ''}`}>
    <button className="ia-world-chat-entry" type="button" aria-expanded={open} onClick={() => { setOpen((value) => !value); if (newest) setSeenMessageId(newest.id); }}>
      <span className="ia-chat-emblem">✦</span>
      <span><small>World Channel</small><strong>{t('版图频道')}</strong><em><i /> {t('同版图成员实时联络')}</em></span>
      {unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
      <span className="ia-chat-chevron">{t(open ? '收起 ↑' : '打开 →')}</span>
    </button>
    {open && <div className="ia-world-chat-body ia-fade-in">
      <div className="ia-world-chat-head"><div><strong>{t('万邦会谈室')}</strong><span>{t('实时消息 · 最近 50 条')}</span></div><em>{t('文字与图片仅本版图成员可见')}</em></div>
      {store.message && <div className="ia-world-message" role="status">{store.message}</div>}
      <div ref={logRef} className="ia-world-chat-log" aria-live="polite">{messages.length ? messages.map((item) => {
        const mine = item.userId === userId;
        return <article key={item.id} className={mine ? 'is-mine' : ''}><span className="ia-chat-avatar">{item.displayName.slice(0, 1).toUpperCase()}</span><div><header><strong>{mine ? t('我') : item.displayName}</strong>{item.nationId && <em>{t(item.nationId === nationId ? '当前执政国' : '版图成员')}</em>}<time>{new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time></header>{item.kind === 'image' && item.mediaFileId && <a className="ia-chat-image" href={worldMessageMediaUrl(item.mediaFileId)} target="_blank" rel="noreferrer"><img src={worldMessageMediaUrl(item.mediaFileId)} alt={item.body === '图片' ? t('{{name}} 分享的图片', { name: item.displayName }) : item.body} loading="lazy" /></a>}{(item.kind !== 'image' || item.body !== '图片') && <p>{item.body}</p>}</div></article>;
      }) : <div className="ia-chat-empty"><span>✦</span><strong>{t('频道尚未留下记录')}</strong><p>{t('向同版图统治者发送第一条消息。')}</p></div>}</div>
      <form className="ia-world-chat-compose" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        {attachment && <div className="ia-chat-attachment">{previewUrl && <img src={previewUrl} alt="待发送图片预览" />}<div><strong>{attachment.name}</strong><span>{Math.max(1, Math.round(attachment.size / 1024))} KB · 可附带说明</span></div><button type="button" aria-label="移除待发送图片" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = ''; }}>×</button></div>}
        <textarea className="ia-input" aria-label={t('版图消息')} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !attachment) { event.preventDefault(); void send(); } }} maxLength={attachment ? 300 : 500} rows={2} placeholder={t(attachment ? '为图片添加说明（可选）' : '输入消息；Enter 发送，Shift + Enter 换行')} />
        <div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /><button className="ia-chat-attach-btn" type="button" disabled={store.sending} onClick={() => fileRef.current?.click()}>▧ {t('图片')}</button><span>{body.length}/{attachment ? 300 : 500}</span><Btn type="submit" label={t(attachment ? '发送图片' : '发送')} variant="primary" busy={store.sending} disabled={store.sending || (!body.trim() && !attachment)} /></div>
      </form>
    </div>}
  </section>;
}
