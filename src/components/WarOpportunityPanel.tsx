// V41 战争机会面板：展示最佳扩张目标、阻断项和候选战场。

import { Tag } from './ui';
import type { WarOpportunityAdvice } from '../gameplay/warOpportunityAdvisor';
import type { WarAssessmentTone } from '../gameplay/warAssessment';

function tagTone(tone: WarAssessmentTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: WarAssessmentTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function WarOpportunityPanel({ advice, onPreview }: { advice: WarOpportunityAdvice; onPreview?: (defenderId: string, provinceId: string) => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(advice.tone) }}>
    <header>
      <div><small>War Opportunity</small><h3>战争机会顾问</h3></div>
      <Tag text={advice.tone === 'good' ? '可扩张' : advice.tone === 'warn' ? '先整备' : '暂缓'} tone={tagTone(advice.tone)} />
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${toneBorder(advice.tone)}` }}>
      <strong style={{ fontSize: 14 }}>{advice.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{advice.summary}</div>
    </div>

    {advice.blockers.length > 0 && <div className="ia-card" style={{ padding: 10, marginBottom: 8, border: '1px solid var(--warn)' }}>
      <strong style={{ fontSize: 12 }}>扩张阻断</strong>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
        {advice.blockers.slice(0, 4).map((b, i) => <Tag key={i} text={b} tone="warn" />)}
      </div>
    </div>}

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
      {advice.candidates.length === 0 ? <div className="ia-risk-empty">暂无合法战争目标。</div> : advice.candidates.slice(0, 4).map((c, i) => <button key={c.provinceId} className="ia-card" onClick={() => onPreview?.(c.defenderId, c.provinceId)} style={{ padding: 10, textAlign: 'left', cursor: onPreview ? 'pointer' : 'default', border: `1px solid ${toneBorder(c.preview.tone)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
          <strong style={{ fontSize: 12 }}>{i === 0 ? `首选：${c.provinceName}` : c.provinceName}</strong>
          <Tag text={`${c.score}`} tone={tagTone(c.preview.tone)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45 }}>{c.defenderName} · 胜率 {c.assessment.winChance}% · 备战 {c.assessment.readiness}%</div>
      </button>)}
    </div>
  </section>;
}
