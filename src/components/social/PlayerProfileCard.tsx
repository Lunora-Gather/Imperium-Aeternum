import type { GameProfile } from '../../social/types';
import { Btn, Tag } from '../ui';
import { useI18n } from '../../i18n';

export const PROFILE_COLORS = ['gold', 'jade', 'azure', 'crimson', 'violet', 'silver'] as const;

function relativeSeen(value: string, now = Date.now()): { key: string; count?: number } {
  const elapsed = Math.max(0, now - Date.parse(value));
  if (elapsed < 5 * 60_000) return { key: '刚刚在线' };
  if (elapsed < 60 * 60_000) return { key: '{{count}} 分钟前在线', count: Math.floor(elapsed / 60_000) };
  if (elapsed < 24 * 60 * 60_000) return { key: '{{count}} 小时前在线', count: Math.floor(elapsed / 3_600_000) };
  return { key: '{{count}} 天前在线', count: Math.floor(elapsed / 86_400_000) };
}

export function ProfileAvatar({ profile, size = 'normal' }: { profile: GameProfile; size?: 'small' | 'normal' | 'large' }) {
  return <span className={`ia-profile-avatar ia-profile-avatar--${size} tone-${profile.avatarColor}`} aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</span>;
}

export function PlayerProfileCard({ profile, relation, isSelf = false, onAdd, onAccept, onChat, onClose }: {
  profile: GameProfile;
  relation?: 'none' | 'outgoing' | 'incoming' | 'friend';
  isSelf?: boolean;
  onAdd?: () => void;
  onAccept?: () => void;
  onChat?: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const seen = relativeSeen(profile.lastSeenAt);
  return <div className="ia-profile-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}>
    <section className={`ia-player-card tone-${profile.avatarColor} ia-fade-in`} role="dialog" aria-modal="true" aria-label={t('{{name}} 的玩家名片', { name: profile.displayName })} onClick={(event) => event.stopPropagation()}>
      <div className="ia-player-card-rail" aria-hidden="true"><strong>IA</strong><i /><span>IDENTITY</span></div>
      <header className="ia-player-card-head">
        <div><span>IMPERIUM AETERNUM</span><strong>{t('统治者档案')}</strong></div>
        <button className="ia-modal-close" onClick={onClose} aria-label={t('关闭玩家名片')}>×</button>
      </header>
      <div className="ia-player-card-identity">
        <ProfileAvatar profile={profile} size="large" />
        <div><span className="ia-player-card-title">{t(profile.title)}</span><h2 className="ia-display">{profile.displayName}</h2><p><i />{t(seen.key, { count: seen.count ?? 0 })}</p></div>
      </div>
      <div className="ia-player-card-rule"><span>{t('统治宣言')}</span></div>
      <blockquote><span aria-hidden="true">“</span><p>{t(profile.bio)}</p></blockquote>
      <div className="ia-player-card-meta">
        <div><span>PLAYER ID · {t('好友码')}</span><strong>{profile.friendCode}</strong></div>
        <div><span>ERA ENTRY · {t('加入纪元')}</span><strong>{new Date(profile.createdAt).toLocaleDateString()}</strong></div>
      </div>
      <footer>
        <span className="ia-player-card-mark">{t('公开身份 · 不展示邮箱')}</span>
        {isSelf && <Tag text={t('这是你的公开名片')} tone="info" />}
        {!isSelf && relation === 'none' && <Btn label={t('加为好友')} variant="primary" onClick={onAdd} />}
        {!isSelf && relation === 'outgoing' && <Btn label={t('申请已发送')} disabled />}
        {!isSelf && relation === 'incoming' && (onAccept ? <Btn label={t('接受好友申请')} variant="primary" onClick={onAccept} /> : <Tag text={t('对方正在等待你的回应')} tone="warn" />)}
        {!isSelf && relation === 'friend' && (onChat ? <Btn label={t('发送消息')} variant="primary" onClick={onChat} /> : <Tag text={t('已经是好友')} tone="good" />)}
      </footer>
    </section>
  </div>;
}
