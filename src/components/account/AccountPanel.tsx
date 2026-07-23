import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import { Btn, Tag } from '../ui';
import { AccountAccessForm } from './AccountAccessForm';
import { useI18n } from '../../i18n';

export function AccountButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { initialize, status, user } = useAccountStore();
  useEffect(() => { void initialize(); }, [initialize]);

  return <>
    <button className={compact ? 'ia-icon-btn' : 'ia-btn ia-btn--ghost'} onClick={() => setOpen(true)} title={t('账号与云存档')} aria-label={t('账号与云存档')}>
      {compact ? (user ? '☁' : '♙') : (user ? `☁ ${user.name || user.email}` : status === 'loading' ? t('连接账号…') : t('账号 / 云存档'))}
    </button>
    {open && createPortal(<AccountModal onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const store = useAccountStore();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section className="ia-account-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="ia-account-title" onClick={(event) => event.stopPropagation()}>
      <div className="ia-account-head">
        <div>
          <div className="ia-up">Imperium Identity</div>
          <h2 id="ia-account-title" className="ia-display">{t('账号与云端纪元')}</h2>
          <p>{t('游客模式始终可玩；验证邮箱后解锁云存档、共享版图、好友与聊天。')}</p>
        </div>
        <button className="ia-modal-close" onClick={onClose} aria-label={t('关闭账号窗口')}>×</button>
      </div>

      {!store.configured && <div className="ia-card" style={{ marginTop: 12, borderColor: 'var(--warn)' }}>{t('Appwrite 尚未配置，当前仅提供本地存档。')}</div>}

      {store.user ? <div className="ia-account-profile">
        <div className="ia-account-identity">
          <div className="ia-account-avatar">{(store.user.name || store.user.email).slice(0, 1).toUpperCase()}</div>
          <div><strong>{store.user.name || t('未设置昵称')}</strong><span>{store.user.email}</span></div>
          <Tag text={t(store.user.emailVerification ? '邮箱已验证' : '待验证')} tone={store.user.emailVerification ? 'good' : 'warn'} />
        </div>
        <div className="ia-account-benefits"><span>☁ {t('私有云存档')}</span><span>◎ {t('共享版图')}</span><span>♧ {t('好友联络')}</span></div>
        <div className="ia-account-actions">
          <Btn label={t('刷新云存档')} variant="ghost" busy={store.status === 'loading'} onClick={() => void store.refreshCloudSaves()} />
          <Btn label={t('退出登录')} warn onClick={() => void store.logout()} />
        </div>
        <p className="dim">{t('云端保存使用用户专属行与文件权限。上传、下载和冲突选择请在游戏“存档”页操作。')}</p>
      </div> : <AccountAccessForm />}

      {store.message && <div className="ia-auth-status" role="status">
        <span>{/成功|通过|已发送/.test(store.message) ? '✓' : '!'}</span><p>{store.message}</p>
      </div>}
      <footer className="ia-account-foot"><span>{t('Appwrite 安全认证')}</span><span>{t('邮箱不会向其他玩家公开')}</span></footer>
    </section>
  </div>;
}
