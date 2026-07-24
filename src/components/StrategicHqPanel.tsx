// V40 帝国总参面板：Dashboard 2.0 的首屏决策卡片。
// 只负责展示，不计算策略；策略由 gameplay/strategicHq.ts 提供。

import { Tag } from './ui';
import type { StrategicHqPlan } from '../gameplay/strategicHq';
import { createScopedTranslator } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';
const t = createScopedTranslator(dashboardCatalog);

function tagTone(tone: string): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : tone === 'gold' ? 'gold' : 'info';
}

function toneBorder(tone: string): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : tone === 'gold' ? 'var(--gold)' : tone === 'good' ? 'var(--good)' : 'var(--border)';
}

export default function StrategicHqPanel({ plan, jumpToPrimary }: { plan: StrategicHqPlan; jumpToPrimary?: () => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(plan.risk) }}>
    <header>
      <div><small>Strategic HQ</small><h3>{t('帝国总参')}</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={plan.riskLabel} tone={tagTone(plan.risk)} />
        <Tag text={t(`把握 ${plan.confidence}`)} tone={plan.confidence >= 75 ? 'good' : plan.confidence >= 55 ? 'warn' : 'danger'} />
      </div>
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${toneBorder(plan.risk)}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>{plan.summaryView.kicker}</div>
          <strong style={{ fontSize: 15 }}>{plan.objective}</strong>
        </div>
        <Tag text={plan.horizon} tone={tagTone(plan.risk)} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{plan.summary}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 6, marginBottom: 8 }}>
      {plan.impacts.slice(0, 5).map((impact) => <div key={impact.id} className={`ia-card tone-${impact.tone === 'danger' ? 'danger' : impact.tone === 'warn' ? 'warn' : 'normal'}`} style={{ padding: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{impact.label}</div>
        <strong style={{ fontSize: 13 }}>{impact.value}</strong>
      </div>)}
    </div>

    <div className="ia-action-list" style={{ marginBottom: 8 }}>
      {plan.summaryView.lines.slice(0, 3).map((line, i) => <button key={line.id} className={`tone-${line.tone === 'danger' ? 'danger' : line.tone === 'warn' ? 'warn' : 'normal'}`} onClick={i === 0 ? jumpToPrimary : undefined} disabled={i !== 0 || !jumpToPrimary}>
        <b>{i === 0 ? t(`首要：${line.title}`) : line.title}</b>
        <span>{line.body}{line.actionLabel ? ` · ${line.actionLabel}` : ''}</span>
      </button>)}
    </div>

    <div className="ia-dash-note">
      {t('为什么：')}{plan.why.slice(0, 2).join(' / ')}
    </div>
  </section>;
}
