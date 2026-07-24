// V41 Dashboard 战争机会卡：把战争机会顾问压缩成总览页可读摘要。

import { useMemo } from 'react';
import { Tag } from './ui';
import { buildWarOpportunityAdvice } from '../gameplay/warOpportunityAdvisor';
import type { GameState } from '../types/game';
import type { WarAssessmentTone } from '../gameplay/warAssessment';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

function tagTone(tone: WarAssessmentTone): 'danger' | 'warn' | 'good' | 'info' | 'gold' {
  return tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : 'good';
}

function toneBorder(tone: WarAssessmentTone): string {
  return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)';
}

export default function DashboardWarOpportunity({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const advice = useMemo(() => localizeDeep(buildWarOpportunityAdvice(state, state.playerNationId), t), [state]);
  const best = advice.best;

  return <section className="ia-dash-section" style={{ borderColor: toneBorder(advice.tone) }}>
    <header>
      <div><small>War</small><h3>{t('战争机会')}</h3></div>
      <Tag text={t(advice.tone === 'good' ? '可扩张' : advice.tone === 'warn' ? '先整备' : '暂缓')} tone={tagTone(advice.tone)} />
    </header>
    <button className="ia-card" onClick={() => jumpToTab('military')} style={{ width: '100%', padding: 10, textAlign: 'left', cursor: 'pointer', border: `1px solid ${toneBorder(advice.tone)}`, marginBottom: 8 }}>
      <strong style={{ fontSize: 13 }}>{advice.title}</strong>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55, marginTop: 5 }}>{advice.summary}</div>
      {best && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
        <Tag text={t(`胜率 ${best.assessment.winChance}%`)} tone={tagTone(best.preview.tone)} />
        <Tag text={t(`备战 ${best.assessment.readiness}%`)} tone={tagTone(best.preview.tone)} />
        <Tag text={best.preview.actionLabel} tone={tagTone(best.preview.tone)} />
      </div>}
    </button>
    <div className="ia-dash-note">
      {advice.blockers.length > 0 ? t(`阻断：${advice.blockers.slice(0, 2).join(' / ')}`) : t('点击进入军事页查看完整预演与候选目标。')}
    </div>
  </section>;
}
