// V41 战争预演面板：把战争评估/预演转成可直接放入军事页或宣战弹窗的 UI。

import { Tag } from './ui';
import type { WarPreview } from '../gameplay/warPreview';
import type { WarAssessmentTone } from '../gameplay/warAssessment';

function tagTone(tone: WarAssessmentTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: WarAssessmentTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function WarPreviewPanel({ preview, onPrimary }: { preview: WarPreview; onPrimary?: () => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(preview.tone) }}>
    <header>
      <div><small>War Preview</small><h3>战争预演</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={preview.verdict} tone={tagTone(preview.tone)} />
      </div>
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${toneBorder(preview.tone)}` }}>
      <strong style={{ fontSize: 14 }}>{preview.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{preview.summary}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 6, marginBottom: 8 }}>
      {preview.lines.map((line) => <div key={line.id} className={`ia-card tone-${line.tone === 'danger' ? 'danger' : line.tone === 'warn' ? 'warn' : 'normal'}`} style={{ padding: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{line.label}</div>
        <strong style={{ fontSize: 13 }}>{line.value}</strong>
      </div>)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 8 }}>
      <div className="ia-card" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><strong style={{ fontSize: 12 }}>主要风险</strong><Tag text={`${preview.risks.length} 项`} tone={preview.risks.some((x) => x.tone === 'danger') ? 'danger' : preview.risks.length ? 'warn' : 'good'} /></div>
        <div className="ia-action-list">{preview.risks.length === 0 ? <div className="ia-risk-empty">暂无突出风险。</div> : preview.risks.map((risk) => <div key={risk.id} className={`tone-${risk.tone === 'danger' ? 'danger' : 'warn'}`}><b>{risk.title}</b><span>{risk.body}</span></div>)}</div>
      </div>
      <div className="ia-card" style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><strong style={{ fontSize: 12 }}>可用优势</strong><Tag text={`${preview.strengths.length} 项`} tone="good" /></div>
        <div className="ia-action-list">{preview.strengths.length === 0 ? <div className="ia-risk-empty">暂无决定性优势。</div> : preview.strengths.map((s) => <div key={s.id} className="tone-normal"><b>{s.title}</b><span>{s.body}</span></div>)}</div>
      </div>
    </div>

    <div className="ia-dash-note" style={{ marginBottom: 8 }}>{preview.saveAdvice}</div>
    {onPrimary && <button className="ia-card" onClick={onPrimary} style={{ width: '100%', padding: 10, textAlign: 'left', cursor: 'pointer', border: `1px solid ${toneBorder(preview.tone)}` }}>
      <strong>{preview.actionLabel}</strong>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>按当前预演结论执行或返回整备。</div>
    </button>}
  </section>;
}
