// V43 经济内政顾问面板：展示财政、粮食、补给、稳定、腐败和地方风险。

import { Tag } from './ui';
import type { EconomyAdvisorPlan, EconomyAdvisorTone } from '../gameplay/economyAdvisor';
import { createScopedTranslator } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';
const t = createScopedTranslator(dashboardCatalog);

function tagTone(tone: EconomyAdvisorTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: EconomyAdvisorTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function EconomyAdvisorPanel({ plan, jumpToTab }: { plan: EconomyAdvisorPlan; jumpToTab?: (tab: string) => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(plan.tone) }}>
    <header>
      <div><small>Economy</small><h3>{t('经济内政顾问')}</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={t(plan.tone === 'danger' ? '先止血' : plan.tone === 'warn' ? '需修正' : '可发展')} tone={tagTone(plan.tone)} />
        <Tag text={t(`健康 ${plan.health}`)} tone={tagTone(plan.tone)} />
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
      {plan.recommendations.map((r, i) => <button key={`${r.id}-${i}`} className={`tone-${r.tone === 'danger' ? 'danger' : r.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => jumpToTab?.(r.tab)} disabled={!jumpToTab}>
        <b>{i === 0 ? t(`优先：${r.title}`) : r.title}</b>
        <span>{r.body}</span>
      </button>)}
    </div>
  </section>;
}
