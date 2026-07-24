// V45 推进前风险中枢面板：进入下一年之前的综合检查。

import { Tag } from './ui';
import type { TurnRiskCenterPlan, TurnRiskTone } from '../gameplay/turnRiskCenter';
import { createScopedTranslator } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';
const t = createScopedTranslator(dashboardCatalog);

function tagTone(tone: TurnRiskTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: TurnRiskTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function TurnRiskCenterPanel({ plan, jumpToPrimary }: { plan: TurnRiskCenterPlan; jumpToPrimary?: () => void }) {
  const visible = plan.blockers.length > 0 ? plan.blockers : plan.warnings.length > 0 ? plan.warnings : plan.opportunities;
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(plan.tone) }}>
    <header>
      <div><small>Pre-turn Risk</small><h3>{t('推进前风险中枢')}</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={t(plan.decision === 'block' ? '先处理' : plan.decision === 'prepare' ? '建议整备' : '可推进')} tone={tagTone(plan.tone)} />
        <Tag text={t(`准备 ${plan.readiness}`)} tone={tagTone(plan.tone)} />
      </div>
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${toneBorder(plan.tone)}` }}>
      <strong style={{ fontSize: 14 }}>{plan.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{plan.summary}</div>
    </div>

    <div className="ia-action-list" style={{ marginBottom: 8 }}>
      {visible.length === 0 ? <div className="ia-risk-empty">{t('暂无风险或机会。')}</div> : visible.map((item, i) => <button key={`${item.id}-${i}`} className={`tone-${item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal'}`} onClick={jumpToPrimary} disabled={!jumpToPrimary}>
        <b>{i === 0 ? t(`优先：${item.title}`) : item.title}</b>
        <span>{item.body}</span>
      </button>)}
    </div>

    <button className="ia-card" onClick={jumpToPrimary} disabled={!jumpToPrimary} style={{ width: '100%', padding: 10, textAlign: 'left', cursor: jumpToPrimary ? 'pointer' : 'default', border: `1px solid ${toneBorder(plan.tone)}` }}>
      <strong>{plan.primaryCta}</strong>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{t(plan.primaryTab ? '点击跳转到首要处理页面。' : '当前没有明确处理页面。')}</div>
    </button>
  </section>;
}
