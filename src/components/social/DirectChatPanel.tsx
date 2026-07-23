import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribeToDirectMessages, worldMessageMediaUrl } from '../../services/appwrite/socialService';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { Btn } from '../ui';
import { useI18n } from '../../i18n';

export function DirectChatPanel({ friendUserId, friendName, onBack }: { friendUserId: string; friendName: string; onBack: () => void }) {
  const { locale, t } = useI18n();
  const userId = useAccountStore((state) => state.user?.$id);
  const store = useSocialStore();
  const messages = store.directMessages[friendUserId] ?? [];
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const previewUrl = useMemo(() => attachment ? URL.createObjectURL(attachment) : null, [attachment]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { void store.refreshDirectMessages(friendUserId); }, [friendUserId]);
  useEffect(() => {
    if (!userId) return;
    let dispose: (() => Promise<void>) | undefined;
    void subscribeToDirectMessages(userId, store.receiveDirectMessage).then((cleanup) => { dispose = cleanup; });
    return () => { if (dispose) void dispose(); };
  }, [userId]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);

  const submit = async () => {
    const ok = attachment ? await store.sendDirectImage(friendUserId, attachment, body) : await store.sendDirect(friendUserId, body);
    if (ok) { setBody(''); setAttachment(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  return <section className="ia-direct-chat">
    <header><button className="ia-btn ia-btn--ghost" onClick={onBack}>← {t('好友列表')}</button><div><span>PRIVATE CHANNEL</span><strong>{friendName}</strong><small>{t('仅你与对方可见 · 实时文字与图片')}</small></div></header>
    <div ref={logRef} className="ia-world-chat-log ia-direct-chat-log ia-scroll">{messages.length ? messages.map((item) => {
      const mine = item.senderId === userId;
      return <article key={item.id} className={mine ? 'is-mine' : ''}><div><header><strong>{mine ? t('我') : item.senderName}</strong><time>{new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time></header>{item.kind === 'image' && item.mediaFileId && <a className="ia-chat-image" href={worldMessageMediaUrl(item.mediaFileId)} target="_blank" rel="noreferrer"><img src={worldMessageMediaUrl(item.mediaFileId)} alt={item.body === '图片' ? t('好友分享的图片') : item.body} loading="lazy" /></a>}{(item.kind !== 'image' || item.body !== '图片') && <p>{item.body}</p>}</div></article>;
    }) : <div className="ia-chat-empty"><span>♧</span><strong>{t('开始私密对话')}</strong><p>{t('消息只授权给你和这位好友读取。')}</p></div>}</div>
    {attachment && <div className="ia-chat-attachment">{previewUrl && <img src={previewUrl} alt="待发送图片预览" />}<div><strong>{attachment.name}</strong><span>{Math.max(1, Math.round(attachment.size / 1024))} KB · 可附带说明</span></div><button type="button" aria-label="移除图片" onClick={() => setAttachment(null)}>×</button></div>}
    <form className="ia-world-chat-compose ia-direct-chat-compose" onSubmit={(event) => { event.preventDefault(); void submit(); }}><textarea className="ia-input" value={body} maxLength={attachment ? 300 : 500} placeholder={t(attachment ? '给图片附带一句说明（可选）' : '发送消息给 {{name}}', { name: friendName })} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !attachment) { event.preventDefault(); void submit(); } }} /><div><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /><button className="ia-chat-attach-btn" type="button" onClick={() => fileRef.current?.click()}>▧ {t('图片')}</button><span>{body.length}/{attachment ? 300 : 500}</span><Btn type="submit" label={t(attachment ? '发送图片' : '发送')} variant="primary" busy={store.loading} disabled={store.loading || (!attachment && !body.trim())} /></div></form>
  </section>;
}
