// V46 新手目标教练面板：告诉玩家下一步点哪里、做什么、为什么。

import { Tag } from './ui';
import type { CoachStepStatus, OnboardingCoachPlan } from '../gameplay/onboardingCoach';
import type { TurnRiskTone } from '../gameplay/turnRiskCenter';

function tagTone(tone: TurnRiskTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function statusText(status: CoachStepStatus): string {
  if (status === 'done') return '已完成';
  if (status === 'ready') return '可执行';
  if (status === 'blocked') return '阻断';
  return '待办';
}

function toneBorder(tone: TurnRiskTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function OnboardingCoachPanel({ plan, jumpToTab }: { plan: OnboardingCoachPlan; jumpToTab?: (tab: string) => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(plan.tone) }}>
    <header>
      <div><small>Coach</small><h3>目标教练</h3></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Tag text={plan.stage === 'survive' ? '生存' : plan.stage === 'stabilize' ? '稳定' : plan.stage === 'expand' ? '扩张' : '优化'} tone={tagTone(plan.tone)} />
        <Tag text={`${plan.progress}%`} tone={tagTone(plan.tone)} />
      </div>
    </header>

    <button className="ia-card" onClick={() => plan.nextStep && jumpToTab?.(plan.nextStep.tab)} disabled={!plan.nextStep || !jumpToTab} style={{ width: '100%', padding: 12, textAlign: 'left', cursor: plan.nextStep && jumpToTab ? 'pointer' : 'default', border: `1px solid ${toneBorder(plan.tone)}`, marginBottom: 8 }}>
      <strong style={{ fontSize: 14 }}>{plan.title}</strong>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 5 }}>{plan.summary}</div>
    </button>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
      {plan.steps.slice(0, 6).map((s) => <button key={s.id} className="ia-card" onClick={() => jumpToTab?.(s.tab)} disabled={!jumpToTab} style={{ padding: 10, textAlign: 'left', cursor: jumpToTab ? 'pointer' : 'default', borderLeft: `3px solid ${toneBorder(s.tone)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 5 }}>
          <strong style={{ fontSize: 12 }}>{s.title}</strong>
          <Tag text={statusText(s.status)} tone={tagTone(s.tone)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45 }}>{s.body}</div>
      </button>)}
    </div>
  </section>;
}
