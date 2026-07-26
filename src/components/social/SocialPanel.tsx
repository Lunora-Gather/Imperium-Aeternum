import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToDirectMessages, subscribeToFriendships } from '../../services/appwrite/socialService';
import type { Friendship, GameProfile } from '../../social/types';
import { useAccountStore } from '../../store/accountStore';
import { useSharedWorldSessionStore } from '../../store/sharedWorldSessionStore';
import { acceptedFriendUserIds, latestUnreadDirectMessage, useSocialStore } from '../../store/socialStore';
import { Btn, Tag } from '../ui';
import { DirectChatPanel } from './DirectChatPanel';
import { PlayerProfileCard, PROFILE_COLORS, ProfileAvatar } from './PlayerProfileCard';
import { useI18n } from '../../i18n';

type SocialTab = 'discover' | 'friends' | 'me';

function useSocialConnection(userId?: string) {
  const store = useSocialStore();
  useEffect(() => {
    if (!userId) { store.reset(); return; }
    void store.initialize().catch(() => undefined);
    let cancelled = false;
    const cleanups: Array<() => Promise<void>> = [];
    void subscribeToDirectMessages(userId, store.receiveDirectMessage)
      .then((cleanup) => { if (cancelled) void cleanup(); else cleanups.push(cleanup); })
      .catch(() => undefined);
    void subscribeToFriendships(() => void store.refreshFriendships())
      .then((cleanup) => { if (cancelled) void cleanup(); else cleanups.push(cleanup); })
      .catch(() => undefined);
    return () => { cancelled = true; for (const cleanup of cleanups) void cleanup(); };
  }, [userId]);
}

function relationFor(friendships: Friendship[], selfId: string, targetId: string): 'none' | 'outgoing' | 'incoming' | 'friend' {
  const relation = friendships.find((item) => [item.requesterId, item.addresseeId].includes(selfId) && [item.requesterId, item.addresseeId].includes(targetId));
  if (!relation) return 'none';
  if (relation.status === 'accepted') return 'friend';
  return relation.requesterId === selfId ? 'outgoing' : 'incoming';
}

function totalUnread(store: { friendships: Friendship[]; unreadDirect: Record<string, number> }, userId?: string) {
  const requests = store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === userId).length;
  const acceptedIds = acceptedFriendUserIds(store.friendships, userId);
  return requests + Object.entries(store.unreadDirect).reduce((sum, [friendId, value]) => sum + (acceptedIds.has(friendId) ? value : 0), 0);
}

export function SocialButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const userId = useAccountStore((state) => state.user?.$id);
  const store = useSocialStore();
  useSocialConnection(userId);
  const unread = totalUnread(store, userId);
  return <><button className={`ia-btn ia-btn--ghost ia-social-entry ${unread ? 'has-unread' : ''}`} onClick={() => setOpen(true)} aria-label={unread ? t('社交，有 {{count}} 条新动态', { count: unread }) : t('社交与好友')}><span>♧</span><b>{t('社交')}</b>{unread > 0 && <em>{unread > 99 ? '99+' : unread}</em>}</button>{open && createPortal(<SocialPanel onClose={() => setOpen(false)} />, document.body)}</>;
}

export function SocialDock() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const user = useAccountStore((state) => state.user);
  const store = useSocialStore();
  useSocialConnection(user?.$id);
  if (!user) return null;
  const unread = totalUnread(store, user.$id);
  const newest = latestUnreadDirectMessage(store.directMessages, store.unreadDirect, user.$id);
  return <>
    <button className={`ia-social-dock ${unread ? 'has-unread' : ''}`} onClick={() => setOpen(true)} aria-label={unread ? t('打开消息中心，{{count}} 条未读', { count: unread }) : t('打开消息中心')}>
      <span>♧</span>{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
      <em>{unread ? t(newest ? '{{name}} 发来新消息' : '有新的好友申请', { name: newest?.senderName ?? '' }) : t('消息')}</em>
    </button>
    {open && createPortal(<SocialPanel onClose={() => setOpen(false)} />, document.body)}
  </>;
}

export function SocialPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const user = useAccountStore((state) => state.user);
  const worldSession = useSharedWorldSessionStore((state) => state.session);
  const store = useSocialStore();
  const [tab, setTab] = useState<SocialTab>(() => !worldSession || totalUnread(store, user?.$id) > 0 ? 'friends' : 'discover');
  const [friendCode, setFriendCode] = useState('');
  const [chatFriend, setChatFriend] = useState<{ id: string; name: string } | null>(null);
  const [viewProfile, setViewProfile] = useState<GameProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({ displayName: store.profile?.displayName ?? '', title: store.profile?.title ?? '', bio: store.profile?.bio ?? '', avatarColor: store.profile?.avatarColor ?? 'gold' }));
  const pending = useMemo(() => store.friendships.filter((item) => item.status === 'pending' && item.addresseeId === user?.$id), [store.friendships, user?.$id]);
  const friends = useMemo(() => store.friendships.filter((item) => item.status === 'accepted'), [store.friendships]);

  useEffect(() => {
    if (!user) return;
    void store.initialize();
    void store.discover(worldSession?.worldId ?? null);
  }, [user?.$id, worldSession?.worldId]);
  useEffect(() => {
    if (!store.profile || editing) return;
    setDraft({
      displayName: store.profile.displayName,
      title: store.profile.title,
      bio: store.profile.bio,
      avatarColor: store.profile.avatarColor,
    });
  }, [editing, store.profile]);
  useEffect(() => {
    if (!user) return;
    for (const friendship of friends) {
      const otherId = friendship.requesterId === user.$id ? friendship.addresseeId : friendship.requesterId;
      void store.loadProfile(otherId).catch(() => undefined);
    }
  }, [friends, user?.$id]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (viewProfile) setViewProfile(null);
      else if (chatFriend) setChatFriend(null);
      else onClose();
    };
    window.addEventListener('keydown', close, true);
    return () => window.removeEventListener('keydown', close, true);
  }, [viewProfile, chatFriend, onClose]);

  const openProfile = async (userId: string) => {
    const profile = await store.loadProfile(userId);
    if (profile) setViewProfile(profile);
  };
  const openChat = (id: string, name: string) => { setViewProfile(null); setChatFriend({ id, name }); };
  const add = async (profile: GameProfile) => {
    const ok = await store.addPlayer(profile);
    if (ok) setViewProfile(null);
  };
  const acceptProfile = async (profile: GameProfile) => {
    const relation = store.friendships.find((item) => item.status === 'pending' && item.addresseeId === user?.$id && item.requesterId === profile.userId);
    if (!relation) return;
    await store.respond(relation.id, true);
    setViewProfile(null);
  };

  return <div className="ia-modal-backdrop" onClick={onClose}><section className="ia-social-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="social-title" onClick={(event) => event.stopPropagation()}>
    <header><div><span className="ia-up">Imperium Social</span><h2 id="social-title" className="ia-display">{t('帝国通讯录')}</h2><p>{t('发现统治者、交换名片，并在治理途中随时收到消息。')}</p></div><button className="ia-modal-close" onClick={onClose} aria-label={t('关闭社交窗口')}>×</button></header>
    {!user ? <div className="ia-world-empty">{t('登录后可以发现玩家、添加好友并发送私信。')}</div> : chatFriend ? <DirectChatPanel friendUserId={chatFriend.id} friendName={chatFriend.name} onBack={() => setChatFriend(null)} /> : <>
      <nav className="ia-social-tabs" aria-label={t('社交页面')}>
        {([['discover', t('发现玩家')], ['friends', t('好友 {{count}}', { count: friends.length })], ['me', t('我的名片')]] as const).map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}{id === 'friends' && pending.length > 0 && <b>{pending.length}</b>}</button>)}
      </nav>

      {tab === 'discover' && <section className="ia-social-content">
        <div className="ia-social-discover-head"><div><strong>{t(worldSession ? '{{world}} · 同图统治者' : '当前没有共享版图', { world: worldSession?.worldName ?? '' })}</strong><p>{t(worldSession ? '这里只显示当前版图的成员；成为好友后可以一直聊天。' : '进入共享版图后，可以发现同一版图的统治者。')}</p></div>{worldSession && <button className="ia-btn ia-btn--ghost" onClick={() => void store.discover(worldSession.worldId)}>{t('刷新')}</button>}</div>
        {!worldSession ? <div className="ia-social-context-empty"><span>⌾</span><strong>{t('先进入一张共享版图')}</strong><p>{t('发现列表不会展示全站玩家，避免人数增长后变得庞大混乱。已有好友仍可在“好友”页随时聊天。')}</p></div> : <div className="ia-player-grid">{store.discoveredProfiles.length ? store.discoveredProfiles.map((profile) => {
          const relation = relationFor(store.friendships, user.$id, profile.userId);
          return <article key={profile.userId} className="ia-player-tile"><button className="ia-player-tile-main" onClick={() => setViewProfile(profile)}><ProfileAvatar profile={profile} /><span><strong>{profile.displayName}</strong><em>{t(profile.title)}</em></span></button><p>{t(profile.bio)}</p><div>{relation === 'none' ? <Btn label={t('加为好友')} variant="primary" onClick={() => void add(profile)} /> : relation === 'incoming' ? <Btn label={t('接受申请')} variant="primary" onClick={() => void acceptProfile(profile)} /> : relation === 'friend' ? <Btn label={t('发消息')} onClick={() => openChat(profile.userId, profile.displayName)} /> : <Tag text={t('申请已发送')} tone="info" />}<button onClick={() => setViewProfile(profile)}>{t('查看名片')}</button></div></article>;
        }) : <div className="ia-chat-empty"><span>♧</span><strong>{t(store.loading ? '正在读取同图玩家…' : '当前版图暂时没有其他玩家')}</strong></div>}</div>}
        <details className="ia-friend-code-entry"><summary>{t('使用好友码添加')}</summary><form className="ia-social-add" onSubmit={(event) => { event.preventDefault(); void store.addByCode(friendCode).then((ok) => { if (ok) setFriendCode(''); }); }}><input className="ia-input" aria-label={t('好友码')} value={friendCode} onChange={(event) => setFriendCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={12} placeholder={t('输入 IA 开头的好友码')} /><Btn type="submit" label={t('发送申请')} variant="primary" busy={store.loading} disabled={store.loading || friendCode.trim().length < 4} /></form></details>
      </section>}

      {tab === 'friends' && <section className="ia-social-content">
        {pending.length > 0 && <div className="ia-social-section"><h3>{t('等待你的回应')}</h3>{pending.map((item) => <article key={item.id}><button className="ia-friend-identity" onClick={() => void openProfile(item.requesterId)}><span className="ia-mini-avatar">{item.requesterName.slice(0, 1)}</span><strong>{item.requesterName}</strong></button><span><Btn label={t('接受')} variant="primary" onClick={() => void store.respond(item.id, true)} /><Btn label={t('拒绝')} variant="ghost" onClick={() => void store.respond(item.id, false)} /></span></article>)}</div>}
        <div className="ia-social-section"><h3>{t('我的好友 · {{count}}', { count: friends.length })}</h3><p className="ia-social-scope-note">{t('好友关系不受当前版图限制，可随时继续私聊。')}</p>{friends.length ? friends.map((item) => { const otherId = item.requesterId === user.$id ? item.addresseeId : item.requesterId; const storedName = item.requesterId === user.$id ? item.addresseeName : item.requesterName; const otherName = store.profileCache[otherId]?.displayName ?? storedName; const unread = store.unreadDirect[otherId] ?? 0; return <article key={item.id}><button className="ia-friend-identity" onClick={() => void openProfile(otherId)}><span className="ia-mini-avatar">{otherName.slice(0, 1)}</span><span><strong>{otherName}</strong><em>{unread ? t('{{count}} 条未读', { count: unread }) : t('点击查看名片')}</em></span></button><span><Btn label={t(unread ? '查看消息' : '对话')} variant="primary" onClick={() => openChat(otherId, otherName)} /><Btn label={t('移除')} warn onClick={() => void store.remove(item.id)} /></span></article>; }) : <p className="dim">{t('还没有好友，可以去“发现玩家”直接添加。')}</p>}</div>
      </section>}

      {tab === 'me' && store.profile && <section className="ia-social-content">
        <div className="ia-my-profile"><div className="ia-my-profile-preview"><ProfileAvatar profile={{ ...store.profile, ...draft }} size="large" /><div><Tag text={t(draft.title || '初来乍到的统治者')} tone="gold" /><h3>{draft.displayName || store.profile.displayName}</h3><p>{draft.bio || t('写一句你的统治宣言。')}</p></div></div>
        {!editing ? <><div className="ia-social-code"><div><span>{t('我的好友码')}</span><strong>{store.profile.friendCode}</strong></div><p>{t('好友码仍然可以复制分享。')}</p></div><div className="ia-my-profile-actions"><Btn label={t('编辑我的名片')} variant="primary" onClick={() => setEditing(true)} /><Btn label={t('预览公开名片')} onClick={() => setViewProfile(store.profile)} /></div></> : <form className="ia-profile-form" onSubmit={(event) => { event.preventDefault(); void store.updateProfile(draft).then((ok) => { if (ok) setEditing(false); }); }}><label>{t('显示名称')}<input className="ia-input" value={draft.displayName} maxLength={32} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label><label>{t('个人称号')}<input className="ia-input" value={draft.title} maxLength={48} placeholder={t('例如：海上贸易的守望者')} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>{t('个人宣言')}<textarea className="ia-input" value={draft.bio} maxLength={240} placeholder={t('介绍你的玩法、目标或想结识的伙伴')} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label><fieldset><legend>{t('头像主题')}</legend>{PROFILE_COLORS.map((color) => <button type="button" key={color} className={`ia-color-choice tone-${color} ${draft.avatarColor === color ? 'is-active' : ''}`} onClick={() => setDraft({ ...draft, avatarColor: color })} aria-label={color} />)}</fieldset><div><Btn type="submit" label={t('保存名片')} variant="primary" busy={store.loading} disabled={draft.displayName.trim().length < 2} /><Btn label={t('取消')} variant="ghost" onClick={() => setEditing(false)} /></div></form>}</div>
      </section>}
    </>}
    {store.message && <div className="ia-world-message" role="status">{t(store.message)}</div>}
  </section>{viewProfile && user && <PlayerProfileCard profile={viewProfile} isSelf={viewProfile.userId === user.$id} relation={relationFor(store.friendships, user.$id, viewProfile.userId)} onAdd={() => void add(viewProfile)} onAccept={() => void acceptProfile(viewProfile)} onChat={() => openChat(viewProfile.userId, viewProfile.displayName)} onClose={() => setViewProfile(null)} />}</div>;
}
