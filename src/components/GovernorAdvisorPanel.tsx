// V50 RC Governor Advisor 面板：把多个顾问的建议整理为一条执政路线。

import { Tag } from './ui';
import type { GovernorAdvisorPlan } from '../gameplay/governorAdvisor';
import type { TurnRiskTone } from '../gameplay/turnRiskCenter';

function tagTone(tone: TurnRiskTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function border(tone: TurnRiskTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function GovernorAdvisorPanel({ plan, jumpToTab }: { plan: GovernorAdvisorPlan; jumpToTab?: (tab: string) => void }) {
  const tone = plan.primaryAction?.tone ?? 'good';
  return <section className="ia-dash-section" style={{ borderColor: border(tone) }}>
    <header>
      <div><small>Governor</small><h3>Governor Advisor</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={plan.guidanceLabel} tone={tagTone(tone)} />
        <Tag text={`信心 ${plan.confidence}`} tone={tagTone(tone)} />
      </div>
    </header>

    <button className="ia-card" onClick={() => plan.primaryAction && jumpToTab?.(plan.primaryAction.tab)} disabled={!plan.primaryAction || !jumpToTab} style={{ width: '100%', padding: 12, textAlign: 'left', cursor: plan.primaryAction && jumpToTab ? 'pointer' : 'default', border: `1px solid ${border(tone)}`, marginBottom: 8 }}>
      <strong style={{ fontSize: 14 }}>{plan.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{plan.summary}</div>
    </button>

    <div className="ia-action-list">
      {plan.queue.slice(0, 5).map((a, i) => <button key={a.id} className={`tone-${a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => jumpToTab?.(a.tab)} disabled={!jumpToTab}>
        <b>{i === 0 ? `首要：${a.title}` : a.title}</b>
        <span>{a.body}</span>
      </button>)}
    </div>
  </section>;
}
