import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import type { SocialNotifications } from './socialNotifications';
import { useI18n } from '../../i18n';
import { lazyScreen, ScreenFallback } from '../lazyScreen';
import { useDialogFocus } from '../useDialogFocus';
import type { GameProfile } from '../../social/types';

const SocialDirectory = lazyScreen(() => import('./SocialDirectory'));

function useSocialConnection(userId?: string) {
  const [activity, setActivity] = useState<SocialNotifications>();
  useEffect(() => {
    setActivity(undefined);
    if (!userId) return;
    let active = true;
    let stop: (() => void) | undefined;
    const connect = async () => {
      try {
        // Load both entries directly so a failed request can be retried on reconnect.
        const [{ watchSocialNotifications }, inbox] = await Promise.all([
          import('./socialNotifications'),
          import('../../store/socialStore'),
        ]);
        if (active && !stop && useAccountStore.getState().user?.$id === userId) {
          stop = watchSocialNotifications(userId, setActivity, inbox);
          window.removeEventListener('online', connect);
        }
      } catch { /* An offline first load can retry on reconnect. */ }
    };
    window.addEventListener('online', connect);
    void connect();
    return () => { active = false; window.removeEventListener('online', connect); stop?.(); };
  }, [userId]);
  return activity?.userId === userId ? activity : undefined;
}

export function SocialButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const userId = useAccountStore((state) => state.user?.$id);
  const unread = useSocialConnection(userId)?.unread ?? 0;
  return <><button className={`ia-btn ia-btn--ghost ia-social-entry ${unread ? 'has-unread' : ''}`} onClick={() => setOpen(true)} aria-label={unread ? t('社交，有 {{count}} 条新动态', { count: unread }) : t('社交与好友')}><span>♧</span><b>{t('社交')}</b>{unread > 0 && <em>{unread > 99 ? '99+' : unread}</em>}</button>{open && createPortal(<SocialPanel key={userId} onClose={() => setOpen(false)} />, document.body)}</>;
}

export function SocialDock() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const user = useAccountStore((state) => state.user);
  const activity = useSocialConnection(user?.$id);
  if (!user) return null;
  const unread = activity?.unread ?? 0;
  const senderName = activity?.senderName;
  return <>
    <button className={`ia-social-dock ${unread ? 'has-unread' : ''}`} onClick={() => setOpen(true)} aria-label={unread ? t('打开消息中心，{{count}} 条未读', { count: unread }) : t('打开消息中心')}>
      <span>♧</span>{unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
      <em>{unread ? t(senderName !== undefined ? '{{name}} 发来新消息' : '有新的好友申请', { name: senderName ?? '' }) : t('消息')}</em>
    </button>
    {open && createPortal(<SocialPanel key={user.$id} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

export function SocialPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const user = useAccountStore(state => state.user);
  const [chatFriend, setChatFriend] = useState<Pick<GameProfile, 'userId' | 'displayName'> | null>(null);
  const dialogRef = useDialogFocus<HTMLElement>(chatFriend ? () => setChatFriend(null) : onClose);
  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section ref={dialogRef} tabIndex={-1} className="ia-social-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="social-title" onClick={event => event.stopPropagation()}>
      <header><div><span className="ia-up">Imperium Social</span><h2 id="social-title" className="ia-display">{t('帝国通讯录')}</h2><p>{t('发现统治者、交换名片，并在治理途中随时收到消息。')}</p></div><button className="ia-modal-close" onClick={onClose} aria-label={t('关闭社交窗口')}>×</button></header>
      {user ? <Suspense fallback={<ScreenFallback />}>
        <SocialDirectory user={user} chatFriend={chatFriend} onChat={setChatFriend} />
      </Suspense> : <div className="ia-world-empty">{t('登录后可以发现玩家、添加好友并发送私信。')}</div>}
    </section>
  </div>;
}
