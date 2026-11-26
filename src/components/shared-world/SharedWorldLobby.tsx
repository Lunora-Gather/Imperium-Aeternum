import { Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import { Btn } from '../ui';
import { useI18n } from '../../i18n';
import { useDialogFocus } from '../useDialogFocus';
import { lazyScreen, ScreenFallback } from '../lazyScreen';

const WorldDirectory = lazyScreen(() => import('./WorldDirectory'));

export function SharedWorldButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return <>
    <button className="ia-btn ia-btn--ghost ia-world-entry-btn" onClick={() => setOpen(true)}>◎ {t('共享活版图')}</button>
    {open && createPortal(<SharedWorldLobby onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function SharedWorldLobby({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const userId = useAccountStore((state) => state.user?.$id);
  const dialogRef = useDialogFocus<HTMLElement>(onClose);

  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section ref={dialogRef} tabIndex={-1} className="ia-shared-world-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="shared-world-title" onClick={(event) => event.stopPropagation()}>
      <header className="ia-shared-world-head">
        <div><span className="ia-up">Living Worlds</span><h2 id="shared-world-title" className="ia-display">{t('共享活版图')}</h2><p>{t('玩家控制部分国家，其余国家由 AI 持续治理；整个版图使用统一年份。')}</p></div>
        <Btn label={t('关闭')} variant="ghost" onClick={onClose} />
      </header>

      {userId ? <Suspense fallback={<ScreenFallback />}><WorldDirectory key={userId} userId={userId} onClose={onClose} /></Suspense> : <div className="ia-world-empty"><strong>{t('需要先登录账号')}</strong><p>{t('共享版图涉及国家控制权和多人世界状态，游客仍可继续使用完整单机模式。')}</p></div>}
    </section>
  </div>;
}
