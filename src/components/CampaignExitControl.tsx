import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from './useDialogFocus';
import { saveCampaignForExit, useGameStore } from '../store/gameStore';
import { currentSharedSession, useSharedWorldSessionStore, waitForSharedCommands } from '../store/sharedWorldSessionStore';
import { createScopedTranslator, type ScopedCatalog } from '../i18n/scoped';
import { useI18n } from '../i18n';
import { buildCampaignExitPolicy } from '../gameplay/campaignExit';
import { Tag } from './ui';

const catalog: ScopedCatalog = {
  en: {
    '选择新剧本': 'Choose another campaign',
    '退出共享治理': 'Leave shared governance',
    '返回标题页': 'Title screen',
    '关闭离场确认': 'Close campaign exit confirmation',
    '战局去留': 'Campaign control',
    '离开当前战局？': 'Leave this campaign?',
    '退出共享治理？': 'Leave shared governance?',
    '{{nation}} · 第 {{year}} 年': '{{nation}} · Year {{year}}',
    '{{world}} · 可从共享版图大厅继续。': '{{world}} · Resume from the shared-world lobby.',
    '未保存的行动将丢失': 'Unsaved actions will be lost',
    '共享进度由服务器保存': 'The server saves shared progress',
    '正在等待共享操作完成…': 'Waiting for shared actions…',
    '有行动未获确认，请核对当前版图后再退出。': 'An action was not confirmed. Review the world before leaving.',
    '继续查看': 'Continue reading',
    '继续治理': 'Continue governing',
    '不保存，返回大厅': 'Return without saving',
    '保存并返回大厅': 'Save and return',
    '退出并返回大厅': 'Leave and return',
  },
};

const t = createScopedTranslator(catalog);

export default function CampaignExitControl({ presentation }: { presentation: 'icon' | 'dashboard' | 'save' }) {
  useI18n();
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const exitRequest = useRef(0);
  const [waiting, setWaiting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const state = useGameStore((current) => current.state);
  const backToMenu = useGameStore((current) => current.backToMenu);
  const sharedSession = useSharedWorldSessionStore((current) => current.session);
  const player = state.nations[state.playerNationId];
  const policy = buildCampaignExitPolicy(!!sharedSession);

  useEffect(() => () => { exitRequest.current++; }, [open]);

  const close = () => {
    exitRequest.current++;
    setWaiting(false);
    setOpen(false);
    setSaveError(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const dialogRef = useDialogFocus<HTMLDivElement>(close, open);

  const leave = async (saveFirst: boolean) => {
    if (sharedSession) {
      const request = ++exitRequest.current;
      setWaiting(true);
      const confirmed = await waitForSharedCommands();
      if (request !== exitRequest.current || !dialogRef.current?.isConnected) return;
      setWaiting(false);
      if (!currentSharedSession(sharedSession)) return;
      if (!confirmed) {
        setSaveError('有行动未获确认，请核对当前版图后再退出。');
        return;
      }
    }
    if (saveFirst && !sharedSession) {
      const error = saveCampaignForExit();
      if (error) {
        setSaveError(error);
        return;
      }
    }
    setOpen(false);
    backToMenu();
  };

  const label = sharedSession ? '退出共享治理' : presentation === 'icon' ? '返回标题页' : '选择新剧本';
  const trigger = presentation === 'icon'
    ? <button ref={triggerRef} className="ia-icon-btn ia-icon-btn--back" onClick={() => setOpen(true)} title={t(label)} aria-label={t(label)}><span aria-hidden="true">⌂</span></button>
    : <button ref={triggerRef} type="button" className={`ia-btn ia-btn--${presentation === 'save' ? 'primary' : 'ghost'}`} onClick={() => setOpen(true)}>{t(label)}</button>;

  return <>
    {trigger}
    {open && createPortal(
      <div className="ia-modal-backdrop" onClick={close}>
        <div ref={dialogRef} className="ia-help-card" role="dialog" aria-modal="true" aria-labelledby="campaign-exit-title" onClick={(event) => event.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div className="ia-display ia-help-title">{t('战局去留')}</div>
              <div id="campaign-exit-title" className="ia-help-step-title">{t(sharedSession ? '退出共享治理？' : '离开当前战局？')}</div>
            </div>
            <button className="ia-modal-close" onClick={close} aria-label={t('关闭离场确认')}>×</button>
          </div>
          <div className="ia-help-step-body" style={{ marginTop: 12 }}>
            {sharedSession
              ? t('{{world}} · 可从共享版图大厅继续。', { world: sharedSession.worldName })
              : t('{{nation}} · 第 {{year}} 年', { nation: t(player?.name ?? '—'), year: state.turn + 1 })}
          </div>
          <div className="ia-card" style={{ marginTop: 14, padding: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag text={t(policy.statusLabel)} tone={policy.statusTone} />
          </div>
          {saveError && <p className="danger" role="alert">{t(saveError)}</p>}
          <div className="ia-help-actions" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" className="ia-btn ia-btn--ghost" data-safe-action onClick={close}>{t(sharedSession && player?.defeated ? '继续查看' : '继续治理')}</button>
            {policy.showDiscardAction && <button type="button" className="ia-btn ia-btn--warn" onClick={() => leave(false)}>{t('不保存，返回大厅')}</button>}
            <button type="button" className="ia-btn ia-btn--primary" disabled={waiting} onClick={() => leave(policy.saveBeforePrimary)}>{t(waiting ? '正在等待共享操作完成…' : policy.primaryLabel)}</button>
          </div>
        </div>
      </div>,
      document.body,
    )}
  </>;
}
