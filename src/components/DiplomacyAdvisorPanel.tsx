// V44 外交顾问面板：展示外交态势、威胁、贸易与同盟窗口。

import { Tag } from './ui';
import type { DiplomacyAdvisorPlan, DiplomacyAdvisorTone } from '../gameplay/diplomacyAdvisor';

function tagTone(tone: DiplomacyAdvisorTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: DiplomacyAdvisorTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function DiplomacyAdvisorPanel({ plan, jumpToTab }: { plan: DiplomacyAdvisorPlan; jumpToTab?: (tab: string) => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(plan.tone) }}>
    <header>
      <div><small>Diplomacy</small><h3>外交顾问</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={plan.tone === 'danger' ? '解除孤立' : plan.tone === 'warn' ? '修补关系' : '主动布局'} tone={tagTone(plan.tone)} />
        <Tag text={`态势 ${plan.posture}`} tone={tagTone(plan.tone)} />
      </div>
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${toneBorder(plan.tone)}` }}>
      <strong style={{ fontSize: 14 }}>{plan.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{plan.summary}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 6, marginBottom: 8 }}>
      {plan.metrics.map((m) => <div key={m.id} className={`ia-card tone-${m.tone === 'danger' ? 'danger' : m.tone === 'warn' ? 'warn' : 'normal'}`} style={{ padding: 8 }} title={m.detail}>
        <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{m.label}</div>
        <strong style={{ fontSize: 13 }}>{m.value}</strong>
      </div>)}
    </div>

    <div className="ia-action-list">
      {plan.candidates.length === 0 ? <div className="ia-risk-empty">暂无迫切外交动作，可以积累影响力。</div> : plan.candidates.slice(0, 4).map((c, i) => <button key={c.id} className={`tone-${c.tone === 'danger' ? 'danger' : c.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => jumpToTab?.(c.tab)} disabled={!jumpToTab}>
        <b>{i === 0 ? `优先：${c.title}` : c.title}</b>
        <span>{c.body}</span>
      </button>)}
    </div>
  </section>;
}
