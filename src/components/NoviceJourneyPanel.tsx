import type { NavigationTab } from '../gameplay/navigationTabs';
import type { NoviceJourneyStep } from '../gameplay/noviceJourney';

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
  if (collapsed) {
    return <button className="ia-novice-pill ia-fade-in" onClick={onToggleCollapsed} aria-label={`展开新手引导，第 ${current} 步，共 ${total} 步`}>
      <span>✦ 新手引导</span><strong>{current}/{total}</strong>
    </button>;
  }

  const canConfirm = step.completion === 'manual' && currentTab === step.tab;
  return <aside className="ia-novice-coach ia-fade-in" aria-label="首局实战引导">
    <header>
      <div>
        <small>FIRST CAMPAIGN · {percent}%</small>
        <strong>第 {current}/{total} 步 · {step.title}</strong>
      </div>
      <button className="ia-icon-btn" onClick={onToggleCollapsed} title="收起引导" aria-label="收起新手引导">—</button>
    </header>
    <div className="ia-novice-progress" aria-label={`引导进度 ${percent}%`}><span style={{ width: `${percent}%` }} /></div>
    <p>{step.body}</p>
    <div className="ia-novice-why"><b>为什么：</b>{step.why}</div>
    <div className="ia-novice-hint">{step.completionHint}</div>
    <div className="ia-novice-actions">
      <button className="ia-btn ia-btn--ghost" onClick={onDismiss}>结束引导</button>
      {currentTab !== step.tab && <button className="ia-btn ia-btn--primary" onClick={onGo}>{step.cta}</button>}
      {canConfirm && <button className="ia-btn ia-btn--primary" onClick={onComplete}>我看懂了，下一步</button>}
    </div>
  </aside>;
}
