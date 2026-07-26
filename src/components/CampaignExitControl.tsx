import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { useSharedWorldSessionStore } from '../store/sharedWorldSessionStore';
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
    '当前正在治理 {{nation}} · 第 {{year}} 年。返回大厅前，可以先保存当前进度。': 'You are governing {{nation}} · Year {{year}}. Save your current progress before returning to the lobby.',
    '{{world}} 的进度由服务器持续保存。退出后可从共享版图大厅再次进入。': '{{world}} is continuously saved by the server. You can re-enter it later from the shared-world lobby.',
    '未保存的行动将丢失': 'Unsaved actions will be lost',
    '服务器已保存共享进度': 'Shared progress is saved on the server',
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const state = useGameStore((current) => current.state);
  const save = useGameStore((current) => current.save);
  const backToMenu = useGameStore((current) => current.backToMenu);
  const sharedSession = useSharedWorldSessionStore((current) => current.session);
  const player = state.nations[state.playerNationId];
  const policy = buildCampaignExitPolicy(!!sharedSession);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('[data-safe-action]')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const leave = (saveFirst: boolean) => {
    if (saveFirst && !sharedSession) save();
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
              ? t('{{world}} 的进度由服务器持续保存。退出后可从共享版图大厅再次进入。', { world: sharedSession.worldName })
              : t('当前正在治理 {{nation}} · 第 {{year}} 年。返回大厅前，可以先保存当前进度。', { nation: player?.name ?? '—', year: state.turn + 1 })}
          </div>
          <div className="ia-card" style={{ marginTop: 14, padding: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag text={t(policy.statusLabel)} tone={policy.statusTone} />
          </div>
          <div className="ia-help-actions" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" className="ia-btn ia-btn--ghost" data-safe-action onClick={close}>{t('继续治理')}</button>
            {policy.showDiscardAction && <button type="button" className="ia-btn ia-btn--warn" onClick={() => leave(false)}>{t('不保存，返回大厅')}</button>}
            <button type="button" className="ia-btn ia-btn--primary" onClick={() => leave(policy.saveBeforePrimary)}>{t(policy.primaryLabel)}</button>
          </div>
        </div>
      </div>,
      document.body,
    )}
  </>;
}
