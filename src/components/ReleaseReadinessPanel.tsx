// V50 RC 发布准备中心面板：显示当前预览版本的构建标记、覆盖度和验收状态。

import { Tag } from './ui';
import type { ReleaseReadinessPlan } from '../gameplay/releaseReadiness';
import type { TurnRiskTone } from '../gameplay/turnRiskCenter';

function tagTone(tone: TurnRiskTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function border(tone: TurnRiskTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function ReleaseReadinessPanel({ plan }: { plan: ReleaseReadinessPlan }) {
  return <section className="ia-dash-section" style={{ borderColor: border(plan.tone) }}>
    <header>
      <div><small>Release</small><h3>发布准备中心</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={`评分 ${plan.score}`} tone={tagTone(plan.tone)} />
        <Tag text={plan.buildMark} tone={tagTone(plan.tone)} />
      </div>
    </header>

    <div className="ia-card" style={{ padding: 12, marginBottom: 8, borderLeft: `3px solid ${border(plan.tone)}` }}>
      <strong style={{ fontSize: 14 }}>{plan.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{plan.summary}</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
      {plan.items.map((item) => <div key={item.id} className={`ia-card tone-${item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal'}`} style={{ padding: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5, marginBottom: 4 }}>
          <strong style={{ fontSize: 12 }}>{item.title}</strong>
          <Tag text={item.tone === 'danger' ? '修复' : item.tone === 'warn' ? '注意' : '通过'} tone={tagTone(item.tone)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45 }}>{item.body}</div>
      </div>)}
    </div>
  </section>;
}
