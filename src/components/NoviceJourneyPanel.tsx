import type { NavigationTab } from '../gameplay/navigationTabs';
import type { NoviceJourneyStep } from '../gameplay/noviceJourney';
import { useI18n } from '../i18n';

interface Props {
  step: NoviceJourneyStep;
  current: number;
  total: number;
  percent: number;
  currentTab: NavigationTab;
  collapsed: boolean;
  onGo: () => void;
  onComplete: () => void;
  onToggleCollapsed: () => void;
  onDismiss: () => void;
}

export default function NoviceJourneyPanel({ step, current, total, percent, currentTab, collapsed, onGo, onComplete, onToggleCollapsed, onDismiss }: Props) {
  const { t } = useI18n();
  if (collapsed) {
    return <button className="ia-novice-pill ia-fade-in" onClick={onToggleCollapsed} aria-label={t('展开新手引导，第 {{current}} 步，共 {{total}} 步', { current, total })}>
      <span>✦ {t('新手引导')}</span><strong>{current}/{total}</strong>
    </button>;
  }

  const canConfirm = step.completion === 'manual' && currentTab === step.tab;
  return <aside className="ia-novice-coach ia-fade-in" aria-label={t('首局实战引导')}>
    <header>
      <div>
        <small>FIRST CAMPAIGN · {percent}%</small>
        <strong>{t('第 {{current}}/{{total}} 步 · {{title}}', { current, total, title: t(step.title) })}</strong>
      </div>
      <button className="ia-icon-btn" onClick={onToggleCollapsed} title={t('收起引导')} aria-label={t('收起新手引导')}>—</button>
    </header>
    <div className="ia-novice-progress" aria-label={t('引导进度 {{percent}}%', { percent })}><span style={{ width: `${percent}%` }} /></div>
    <p>{t(step.body)}</p>
    <div className="ia-novice-why"><b>{t('为什么：')}</b>{t(step.why)}</div>
    <div className="ia-novice-hint">{t(step.completionHint)}</div>
    <div className="ia-novice-actions">
      <button className="ia-btn ia-btn--ghost" onClick={onDismiss}>{t('结束引导')}</button>
      {currentTab !== step.tab && <button className="ia-btn ia-btn--primary" onClick={onGo}>{t(step.cta)}</button>}
      {canConfirm && <button className="ia-btn ia-btn--primary" onClick={onComplete}>{t('我看懂了，下一步')}</button>}
    </div>
  </aside>;
}
