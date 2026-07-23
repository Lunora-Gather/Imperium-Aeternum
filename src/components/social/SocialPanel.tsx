import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { Btn, Tag } from '../ui';
import { DirectChatPanel } from './DirectChatPanel';
import { useI18n } from '../../i18n';

export function SocialButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const user = useAccountStore((state) => state.user);
  const store = useSocialStore();
  const pendingCount = store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === user?.$id).length;
  useEffect(() => { if (user) void store.initialize(); else store.reset(); }, [user]);
  return <><button className="ia-btn ia-btn--ghost ia-social-entry" onClick={() => setOpen(true)} aria-label={pendingCount ? t('社交，有 {{count}} 个待处理好友申请', { count: pendingCount }) : t('社交与好友')}><span>♧</span><b>{t('社交')}</b>{pendingCount > 0 && <em>{pendingCount}</em>}</button>{open && createPortal(<SocialPanel onClose={() => setOpen(false)} />, document.body)}</>;
}

function SocialPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const user = useAccountStore((state) => state.user);
  const store = useSocialStore();
  const [friendCode, setFriendCode] = useState('');
  const [chatFriend, setChatFriend] = useState<{ id: string; name: string } | null>(null);
  const pending = useMemo(() => store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === user?.$id), [store.friendships, user?.$id]);
  const friends = useMemo(() => store.friendships.filter((item) => item.status === 'accepted'), [store.friendships]);
  useEffect(() => { if (user) void store.initialize(); }, [user]);
  return <div className="ia-modal-backdrop" onClick={onClose}><section className="ia-social-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="social-title" onClick={(event) => event.stopPropagation()}>
    <header><div><span className="ia-up">Imperium Social</span><h2 id="social-title" className="ia-display">{t('好友与联络')}</h2><p>{t('建立跨版图联系；聊天内容仍只在共同版图内可见。')}</p></div><button className="ia-modal-close" onClick={onClose} aria-label={t('关闭社交窗口')}>×</button></header>
    {!user ? <div className="ia-world-empty">{t('登录后可以使用好友码添加玩家，并在共同版图中聊天。')}</div> : chatFriend ? <DirectChatPanel friendUserId={chatFriend.id} friendName={chatFriend.name} onBack={() => setChatFriend(null)} /> : <>
      <div className="ia-social-overview"><div><strong>{friends.length}</strong><span>{t('已建立好友')}</span></div><div><strong>{pending.length}</strong><span>{t('待处理申请')}</span></div><div><strong>{t('版图内')}</strong><span>{t('聊天可见范围')}</span></div></div>
      <div className="ia-social-code"><div><span>{t('我的好友码')}</span><strong>{store.profile?.friendCode ?? t('读取中…')}</strong></div><p>{t('可以公开分享，不会显示登录邮箱。')}</p></div>
      <form className="ia-social-add" onSubmit={(event) => { event.preventDefault(); void store.addByCode(friendCode).then((ok) => { if (ok) setFriendCode(''); }); }}><input className="ia-input" aria-label={t('好友码')} value={friendCode} onChange={(event) => setFriendCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={12} placeholder={t('输入 IA 开头的好友码')} /><Btn type="submit" label={t('发送好友申请')} variant="primary" busy={store.loading} disabled={store.loading || friendCode.trim().length < 4} /></form>
      {pending.length > 0 && <section className="ia-social-section"><h3>{t('待处理申请')}</h3>{pending.map((item) => <article key={item.id}><div><strong>{item.requesterName}</strong><Tag text={t('申请添加你')} tone="warn" /></div><span><Btn label={t('接受')} variant="primary" onClick={() => void store.respond(item.id, true)} /><Btn label={t('拒绝')} variant="ghost" onClick={() => void store.respond(item.id, false)} /></span></article>)}</section>}
      <section className="ia-social-section"><h3>{t('我的好友 · {{count}}', { count: friends.length })}</h3>{friends.length ? friends.map((item) => { const otherId = item.requesterId === user.$id ? item.addresseeId : item.requesterId; const otherName = item.requesterId === user.$id ? item.addresseeName : item.requesterName; return <article key={item.id}><div><strong>{otherName}</strong><Tag text={t('好友')} tone="good" /></div><span><Btn label={t('对话')} variant="primary" onClick={() => setChatFriend({ id: otherId, name: otherName })} /><Btn label={t('移除')} warn onClick={() => void store.remove(item.id)} /></span></article>; }) : <p className="dim">{t('暂时还没有好友，可以使用好友码添加。')}</p>}</section>
    </>}
    {store.message && <div className="ia-world-message" role="status">{store.message}</div>}
  </section></div>;
}
