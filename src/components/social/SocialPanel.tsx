import { useEffect, useMemo, useState } from 'react';
import { useAccountStore } from '../../store/accountStore';
import { useSocialStore } from '../../store/socialStore';
import { Btn, Tag } from '../ui';

export function SocialButton() {
  const [open, setOpen] = useState(false);
  return <><button className="ia-btn ia-btn--ghost" onClick={() => setOpen(true)}>♧ 好友</button>{open && <SocialPanel onClose={() => setOpen(false)} />}</>;
}

function SocialPanel({ onClose }: { onClose: () => void }) {
  const user = useAccountStore((state) => state.user);
  const store = useSocialStore();
  const [friendCode, setFriendCode] = useState('');
  const pending = useMemo(() => store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === user?.$id), [store.friendships, user?.$id]);
  const friends = useMemo(() => store.friendships.filter((item) => item.status === 'accepted'), [store.friendships]);
  useEffect(() => { if (user) void store.initialize(); }, [user]);
  return <div className="ia-modal-backdrop" onClick={onClose}><section className="ia-social-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="social-title" onClick={(event) => event.stopPropagation()}>
    <header><div><span className="ia-up">Imperium Social</span><h2 id="social-title" className="ia-display">好友与联络</h2></div><Btn label="关闭" variant="ghost" onClick={onClose} /></header>
    {!user ? <div className="ia-world-empty">登录后可以使用好友码添加玩家，并在共同版图中聊天。</div> : <>
      <div className="ia-social-code"><div><span>我的好友码</span><strong>{store.profile?.friendCode ?? '读取中…'}</strong></div><p>好友码可以公开分享，不显示登录邮箱。</p></div>
      <form className="ia-social-add" onSubmit={(event) => { event.preventDefault(); void store.addByCode(friendCode).then((ok) => { if (ok) setFriendCode(''); }); }}><input className="ia-input" value={friendCode} onChange={(event) => setFriendCode(event.target.value.toUpperCase())} maxLength={12} placeholder="输入好友码" /><Btn type="submit" label="发送申请" variant="primary" disabled={store.loading || friendCode.trim().length < 4} onClick={() => undefined} /></form>
      {pending.length > 0 && <section className="ia-social-section"><h3>待处理申请</h3>{pending.map((item) => <article key={item.id}><div><strong>{item.requesterName}</strong><Tag text="申请添加你" tone="warn" /></div><span><Btn label="接受" variant="primary" onClick={() => void store.respond(item.id, true)} /><Btn label="拒绝" variant="ghost" onClick={() => void store.respond(item.id, false)} /></span></article>)}</section>}
      <section className="ia-social-section"><h3>我的好友 · {friends.length}</h3>{friends.length ? friends.map((item) => { const otherName = item.requesterId === user.$id ? item.addresseeName : item.requesterName; return <article key={item.id}><div><strong>{otherName}</strong><Tag text="好友" tone="good" /></div><Btn label="移除" warn onClick={() => void store.remove(item.id)} /></article>; }) : <p className="dim">暂时还没有好友，可以使用好友码添加。</p>}</section>
    </>}
    {store.message && <div className="ia-world-message">{store.message}</div>}
  </section></div>;
}
