import { getNationalCrisisView, getNationalMissionView } from '../gameplay/nationalPurpose';
import type { GameState } from '../types/game';
import { Tag } from './ui';
import { localizeReactTree } from '../i18n/reactTree';
import { registerNationalPurposeTranslations } from '../i18n/catalogs/nationalPurpose';

registerNationalPurposeTranslations();

function tone(stage: number): 'warn' | 'danger' {
  return stage >= 3 ? 'danger' : 'warn';
}

export default function NationalPurposePanel({ state, compact = false }: { state: GameState; compact?: boolean }) {
  const mission = getNationalMissionView(state);
  const crisis = getNationalCrisisView(state);
  const current = mission.current;
  return localizeReactTree(<section className={`ia-purpose ${crisis ? 'has-crisis' : ''} ${compact ? 'is-compact' : ''}`}>
    <header>
      <div><small>National Purpose</small><h3>国家使命</h3></div>
      <div><Tag text={`${mission.completed}/3 章`} tone={mission.completed === 3 ? 'gold' : 'info'} />{crisis && <Tag text={`危机 ${crisis.stage} 阶`} tone={tone(crisis.stage)} />}</div>
    </header>
    <div className="ia-purpose-grid">
      <article className="ia-purpose-mission">
        <div className="ia-purpose-title"><div><span>使命路线</span><strong>{mission.title}</strong></div><em>{current.progress}%</em></div>
        <p>{mission.motto}</p>
        <div className="ia-purpose-progress"><i><b style={{ width: `${current.progress}%` }} /></i></div>
        <div className="ia-purpose-current">
          <span>{current.done ? '使命完成' : current.title}</span>
          <strong>{current.body}</strong>
          <em>完成奖励：{current.reward}</em>
        </div>
        {!compact && <div className="ia-purpose-stages">{mission.stages.map((stage, index) => <div key={stage.id} className={stage.done ? 'is-done' : stage.id === current.id ? 'is-current' : ''}><i>{stage.done ? '✓' : index + 1}</i><span>{stage.title.replace(/^.+ · /, '')}</span></div>)}</div>}
      </article>
      {crisis ? <article className={`ia-purpose-crisis stage-${crisis.stage}`}>
        <div className="ia-purpose-title"><div><span>国家危机 · 第 {crisis.stage} 阶段</span><strong>{crisis.title}</strong></div><em>{crisis.pressure}</em></div>
        <p>{crisis.summary}</p>
        <div className="ia-purpose-crisis-line"><span>化解办法</span><strong>{crisis.remedy}</strong></div>
        <div className="ia-purpose-crisis-line"><span>当前后果</span><strong>{crisis.consequence}</strong></div>
      </article> : <article className="ia-purpose-calm">
        <span>Realm Status</span><strong>国家处于常态治理</strong><p>危机会在财政、法统、地方或厌战持续越过危险线时出现，并提前给出化解办法。</p>
      </article>}
    </div>
  </section>);
}
