import { useEffect, useRef } from 'react';
import { worldMessageMediaUrl } from '../../services/appwrite/socialService';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { ChatComposer } from './ChatComposer';
import { useI18n } from '../../i18n';

export function DirectChatPanel({ friendUserId, friendName, onBack }: { friendUserId: string; friendName: string; onBack: () => void }) {
  const { locale, t } = useI18n();
  const userId = useAccountStore((state) => state.user?.$id);
  const store = useSocialStore();
  const messages = store.directMessages[friendUserId] ?? [];
  const sending = Boolean(store.sending[`direct:${friendUserId}`]);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { void store.refreshDirectMessages(friendUserId); }, [friendUserId]);
  useEffect(() => { store.markConversationRead(friendUserId); return () => store.markConversationRead(null); }, [friendUserId]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);

  return <section className="ia-direct-chat">
    <header><button className="ia-btn ia-btn--ghost" onClick={onBack}>← {t('好友列表')}</button><div><span>PRIVATE CHANNEL</span><strong>{friendName}</strong><small>{t('跨版图好友私聊 · 仅双方可见 · 支持文字与图片')}</small></div></header>
    <div ref={logRef} className="ia-world-chat-log ia-direct-chat-log ia-scroll">{messages.length ? messages.map((item) => {
      const mine = item.delivery === 'pending' || item.senderId === userId;
      return <article key={item.id} className={mine ? 'is-mine' : ''}><div><header><strong>{mine ? t('我') : item.senderName}</strong>{item.delivery === 'pending' && <em>{t('发送中…')}</em>}<time>{new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time></header>{item.kind === 'image' && item.mediaFileId && <a className="ia-chat-image" href={worldMessageMediaUrl(item.mediaFileId)} target="_blank" rel="noreferrer"><img src={worldMessageMediaUrl(item.mediaFileId)} alt={item.body === '图片' ? t('好友分享的图片') : item.body} loading="lazy" /></a>}{(item.kind !== 'image' || item.body !== '图片') && <p>{item.body}</p>}</div></article>;
    }) : <div className="ia-chat-empty"><span>♧</span><strong>{t('开始私密对话')}</strong><p>{t('消息只授权给你和这位好友读取。')}</p></div>}</div>
    <ChatComposer direct label={t('给 {{name}} 的消息', { name: friendName })} placeholder={t('发送消息给 {{name}}', { name: friendName })}
      sending={sending} onSend={(body, file) => file ? store.sendDirectImage(friendUserId, file, body) : store.sendDirect(friendUserId, body)} />
  </section>;
}
