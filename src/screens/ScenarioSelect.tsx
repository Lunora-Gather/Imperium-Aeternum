// 剧本选择页 v35 — 开局大厅：玩法速查手册 + 难度挑战阶梯 + 存档健康继续
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SCENARIOS, type ScenarioId } from '../store/scenarioCatalog';
import type { SaveRecoveryPreview } from '../gameplay/saveRecovery';
import { SAVE_VERSION } from '../store/persistence';
import { useSavePreviews } from '../components/useSavePreviews';
import { getScenarioProfile, nationStyleTags, recommendedScenarioIds, summarizeSavePreviews, type LaunchTone } from '../gameplay/launchHub';
import { buildScenarioChallengeGuide, summarizeChallengePath, type ScenarioChallengeGuide } from '../gameplay/difficultyGuide';
import { buildLaunchHandbook, type LaunchHandbook } from '../gameplay/launchHandbook';
import { BUILD_MARK } from '../buildInfo';
import { Btn, Tag } from '../components/ui';
import { AccountButton, CloudSaveSlots } from '../components/account/AccountPanel';
import { SharedWorldButton } from '../components/shared-world/SharedWorldLobby';
import { SocialButton } from '../components/social/SocialPanel';
import { LocaleSwitch } from '../components/LocaleSwitch';
import { useI18n } from '../i18n';

const THEMES = [
  { id: 'night', label: '暗夜', icon: '☾' },
  { id: 'day', label: '羊皮', icon: '☀' },
  { id: 'bamboo', label: '竹简', icon: '筠' },
  { id: 'ink', label: '水墨', icon: '墨' },
] as const;

function toneVar(tone: LaunchTone): string { return tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : tone === 'gold' ? 'gold' : 'border'; }

type Theme = typeof THEMES[number]['id'];
interface ThemeControls { theme: Theme; applyTheme: (next: Theme) => void }

export default function ScenarioSelect({ theme, applyTheme }: ThemeControls) {
  const { t } = useI18n();
  const { startScenario, loadFromSlot, log, logMsg } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const { slots: lastPreviews, rescan: refreshSaves, checking, withReviewedSlot, clearReviewed, deletionDialog } = useSavePreviews(logMsg);
  const previews = checking ? null : lastPreviews;
  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = previews?.some((slot) => slot.slot === 0 && slot.status !== 'empty' && slot.status !== 'broken');
  const saveSummary = useMemo(() => previews && summarizeSavePreviews(previews), [previews]);
  const recommended = useMemo(() => new Set(recommendedScenarioIds()), []);
  const challengePath = useMemo(() => summarizeChallengePath(), []);
  const handbook = useMemo(() => buildLaunchHandbook(), []);
  useEffect(() => {
    if (!libraryOpen) return;
    const frame = window.requestAnimationFrame(() => document.getElementById('scenario-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [libraryOpen]);

  const clearLocal = () => clearReviewed(t('确认清理本浏览器里的全部 Imperium Aeternum 存档？'));
  const resume = (slot: number) => withReviewedSlot(slot, stored => { if (!loadFromSlot(slot, stored)) refreshSaves(); });
  const continueBest = () => { if (saveSummary?.best) resume(saveSummary.best.slot); };
  const best = saveSummary?.best;
  const resumeLabel = best && t(best.defeated ? '查看结局 · 槽位 {{slot}}' : '继续槽位 {{slot}}', { slot: best.slot });
  const featuredScenario = SCENARIOS.find((s) => s.id === 'classic') ?? SCENARIOS[0];
  const featuredHint = getScenarioProfile(featuredScenario.id);
  const featuredChallenge = buildScenarioChallengeGuide(featuredScenario.id);
  const origin = useRef('');
  const focusAfterStep = useRef('');
  useLayoutEffect(() => {
    const id = focusAfterStep.current;
    if (!id) return;
    focusAfterStep.current = '';
    const target = document.getElementById(id);
    if (id === 'campaign-step-title') {
      target?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } else target?.focus();
  }, [selected, pickedNation]);

  const startPickedScenario = (id: ScenarioId, triggerId = '') => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    if (s.needsNationPick) {
      origin.current = triggerId;
      focusAfterStep.current = 'campaign-step-title';
      setSelected(id);
      setPickedNation(null);
      return;
    }
    startScenario(id);
  };
  const chooseNation = (id: string) => {
    focusAfterStep.current = 'campaign-step-title';
    setPickedNation(id);
  };
  const reselectNation = () => {
    focusAfterStep.current = 'nation-' + pickedNation;
    setPickedNation(null);
  };

  const preferences = <><LocaleSwitch /><ThemeSwitch theme={theme} applyTheme={applyTheme} /></>;
  const navigation = (label: string, back: () => void) => <div className="ia-menu-toolbar">
    <button className="ia-btn ia-btn--ghost" onClick={back}>← {t(label)}</button>
    <div className="ia-menu-controls">{preferences}</div>
  </div>;

  if (scenario && scenario.needsNationPick && !pickedNation) {
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <main className="ia-menu ia-menu--compact">
      {navigation('剧本大厅', () => { focusAfterStep.current = origin.current; setSelected(null); })}
      <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">{t('选择邦国')}</div><h1 id="campaign-step-title" tabIndex={-1} className="ia-display">{t(scenario.name)}</h1><p>{t(scenario.description)}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}><Tag text={t(hint.marketTag)} tone={hint.tone} /><Tag text={t('难度 {{level}}', { level: t(hint.difficulty) })} tone={hint.tone} /><Tag text={t(challenge.label)} tone={challenge.tone} /><Tag text={t(hint.audience)} tone="info" /></div></header>
      <ChallengePanel guide={challenge} />
      <div className="ia-nation-advice">{t(hint.advice)}</div>
      <div className="ia-menu-section-title ia-up">{t('选择你的邦国')}</div>
      <div className="ia-nation-grid">{scenario.playableNations?.map((n) => <button key={n.id} id={'nation-' + n.id} className="ia-choice-card" onClick={() => chooseNation(n.id)}><div className="ia-choice-head"><strong className="ia-display">{t(n.name)}</strong><Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} /></div><p>{t(n.desc)}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>{nationStyleTags(n.desc, n.tier).map((x) => <Tag key={x.text} text={t(x.text)} tone={x.tone} />)}</div></button>)}</div>
    </main>;
  }

  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <main className="ia-menu ia-menu--confirm">
      {navigation('重选邦国', reselectNation)}
      <div className="ia-confirm-card"><p className="ia-up">{t('即将开始')}</p><h1 id="campaign-step-title" tabIndex={-1} className="ia-display">{t(scenario.name)}</h1><p className="mute">{t(scenario.description)}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}><Tag text={t(hint.marketTag)} tone={hint.tone} /><Tag text={t('难度 {{level}}', { level: t(hint.difficulty) })} tone={hint.tone} /><Tag text={`${t(challenge.label)} · ${t('压力')} ${challenge.pressure}`} tone={challenge.tone} /></div><div className="ia-confirm-nation"><span className="ia-up">{t('你的邦国')}</span><h2 className="ia-display">{t(nation?.name ?? '')}</h2><p>{t(nation?.desc ?? '')}</p>{nation && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>{nationStyleTags(nation.desc, nation.tier).map((x) => <Tag key={x.text} text={t(x.text)} tone={x.tone} />)}</div>}</div><ChallengePanel guide={challenge} compact /><div className="ia-confirm-actions"><Btn label={t('← 返回')} variant="ghost" onClick={reselectNation} /><Btn label={t('开启纪元 →')} variant="primary" onClick={() => startScenario(scenario.id, pickedNation)} /></div></div>
    </main>;
  }

  return <main className="ia-menu ia-menu--launch">
    {deletionDialog}
    <div className="ia-menu-toolbar"><div className="ia-menu-version"><Tag text={BUILD_MARK} tone="gold" /><Tag text={`${t('存档')} v${SAVE_VERSION}`} tone="info" />{saveSummary && <Tag text={t(saveSummary.headline)} tone={saveSummary.tone} />}</div><div className="ia-menu-controls"><SocialButton />
      <AccountButton>
        <CloudSaveSlots slots={lastPreviews ?? []} checking={checking} withReviewedSlot={withReviewedSlot} onRestore={refreshSaves} onContinue={resume} />
      </AccountButton>{preferences}</div></div>
    <header className="ia-launch-hero">
      <div className="ia-launch-copy">
        <div className="ia-up ia-menu-kicker">Grand Strategy Chronicle</div>
        <h1 className="ia-display">Imperium Aeternum</h1>
        <p className="ia-display ia-up">{t('永恒帝国')}</p>
        <div className="ia-menu-subtitle">{t('治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。')}</div>
        <div className="ia-launch-actions">
          <Btn label={resumeLabel ?? t(saveSummary ? '开始推荐剧本' : '正在检查存档…')} variant="primary" disabled={!saveSummary} onClick={best ? continueBest : () => startPickedScenario(featuredScenario.id)} />
          <SharedWorldButton />
          <button type="button" className="ia-btn ia-btn--ghost" aria-expanded={libraryOpen} aria-controls="scenario-library" onClick={() => setLibraryOpen((open) => !open)}>{t(libraryOpen ? '收起剧本列表' : '查看全部剧本')}</button>
        </div>
      </div>
      <button className="ia-featured-scenario" onClick={() => startPickedScenario(featuredScenario.id)}>
        <div className="ia-featured-top">
          <span className="ia-up">Recommended Campaign</span>
          <Tag text={t(featuredHint.marketTag)} tone={featuredHint.tone} />
        </div>
        <h2 className="ia-display">{t(featuredScenario.name)}</h2>
        <p>{t(featuredScenario.description)}</p>
        <div className="ia-featured-meta">
          <span>{t(featuredScenario.subtitle)}</span>
          <span>{t(featuredChallenge.label)}</span>
          <span>{t('压力')} {featuredChallenge.pressure}</span>
        </div>
        <strong>{t(featuredChallenge.headline)}</strong>
        <em>{t(featuredScenario.needsNationPick ? '选择邦国后开始' : '立即开始')}</em>
      </button>
    </header>
    <section className="ia-launch-ops">
      {saveSummary ? <ContinuePanel summary={saveSummary} slots={previews ?? []} onPick={resume} onStartRecommended={() => startPickedScenario(featuredScenario.id)} onRefresh={refreshSaves} /> : <div className="ia-continue-panel" role="status">{t('正在检查存档…')}</div>}
      <DifficultyTrack path={challengePath.ids} headline={challengePath.headline} advice={challengePath.advice} onPick={startPickedScenario} />
    </section>
    <HandbookPanel handbook={handbook} />
    <section id="scenario-library" aria-label={t('选择剧本')} hidden={!libraryOpen}>
      {libraryOpen && <><div className="ia-scenario-library-head"><div><span className="ia-up">Campaign Library</span><h2 className="ia-display">{t('选择剧本')}</h2></div><p>{t('按压力和玩法定位选择，不同剧本对应不同学习曲线。')}</p></div>
      <div className="ia-scenario-grid">{SCENARIOS.map((s) => { const hint = getScenarioProfile(s.id); const challenge = buildScenarioChallengeGuide(s.id); const isRecommended = recommended.has(s.id); return <button key={s.id} id={'scenario-' + s.id} className={`ia-scenario-card ${isRecommended ? 'is-recommended' : ''}`} onClick={(event) => startPickedScenario(s.id, event.currentTarget.id)} style={{ borderColor: isRecommended ? `var(--${toneVar(hint.tone)})` : undefined }}><div className="ia-scenario-card__top"><h3 className="ia-display">{t(s.name)}</h3><Tag text={t(s.nationCount)} tone="gold" /></div><div className="ia-scenario-sub">{t(s.subtitle)}</div><p>{t(s.description)}</p><div className="ia-scenario-tags"><Tag text={t(hint.marketTag)} tone={hint.tone} /><Tag text={t(challenge.label)} tone={challenge.tone} /><Tag text={`${t('压力')} ${challenge.pressure}`} tone={challenge.tone} />{isRecommended && <Tag text={t('推荐')} tone="gold" />}</div><div className="ia-scenario-advice">{t(challenge.headline)} · {t(challenge.recommendedAfter)}</div><div className="ia-scenario-foot">{t(s.needsNationPick ? '选择邦国' : '开始剧本')}<span>→</span></div></button>; })}</div>
      <div className="ia-menu-actions">{saveExists && <Btn label={t('读取自动存档')} variant="ghost" onClick={() => resume(0)} />}{resumeLabel && <Btn label={resumeLabel} variant="primary" onClick={continueBest} />}{previews?.some((p) => p.status !== 'empty') && <Btn label={t('刷新存档体检')} variant="ghost" onClick={refreshSaves} />}{previews?.some((p) => p.status !== 'empty') && <Btn label={t('清理本地存档')} warn onClick={clearLocal} />}</div>
    </>}
    </section>
    {log.length > 0 && <p className="dim ia-menu-log">{t(log[log.length - 1])}</p>}
  </main>;
}

function HandbookPanel({ handbook }: { handbook: LaunchHandbook }) {
  const { t } = useI18n();
  return <section className="ia-launch-handbook">
    <div className="ia-handbook-head">
      <div>
        <Tag text={t('玩法速查')} tone="gold" />
        <strong>{t(handbook.headline)}</strong>
        <p>{t(handbook.subtitle)}</p>
      </div>
      <Tag text={t(handbook.primaryAdvice)} tone="good" />
    </div>
    <div className="ia-first-year-grid">
      {handbook.quickStart.map((step) => <article key={step.id} className={`ia-handbook-item ia-handbook-item--${step.tone}`}>
        <strong>{t(step.label)}</strong>
        <p>{t(step.body)}</p>
      </article>)}
    </div>
    <details className="ia-handbook-details">
      <summary>{t('展开完整玩法速查')}</summary>
      <div className="ia-handbook-grid">
        {handbook.sections.map((section) => <article key={section.id} className={`ia-handbook-item ia-handbook-item--${section.tone}`}>
          <Tag text={section.kicker} tone={section.tone} />
          <strong>{t(section.title)}</strong>
          <p>{t(section.summary)}</p>
          <div>{section.steps.slice(0, 3).map((x) => <Tag key={x.id} text={t(x.label)} tone={x.tone} />)}</div>
        </article>)}
      </div>
    </details>
  </section>;
}

function ChallengePanel({ guide, compact = false }: { guide: ScenarioChallengeGuide; compact?: boolean }) {
  const { t } = useI18n();
  return <section className={`ia-challenge-panel ${compact ? 'ia-challenge-panel--compact' : ''}`} style={{ borderColor: `var(--${toneVar(guide.tone)})` }}>
    <div className="ia-challenge-head">
      <div>
        <Tag text={t(guide.label)} tone={guide.tone} />
        <strong>{t(guide.headline)}</strong>
      </div>
      <Tag text={`${t('压力')} ${guide.pressure}/100`} tone={guide.tone} />
    </div>
    <p>{t(guide.why)}</p>
    {!compact && <em>{t('推荐前置：')} {t(guide.recommendedAfter)} · {t('常见失败：')} {t(guide.likelyFailure)}</em>}
    <div className="ia-challenge-tags">{guide.checklist.map((x) => <Tag key={x.id} text={t(x.text)} tone={x.tone} />)}</div>
  </section>;
}

function DifficultyTrack({ path, headline, advice, onPick }: { path: ScenarioId[]; headline: string; advice: string; onPick: (id: ScenarioId, triggerId: string) => void }) {
  const { t } = useI18n();
  return <section className="ia-difficulty-track">
    <div className="ia-difficulty-copy">
      <Tag text={t('挑战阶梯')} tone="gold" />
      <strong>{headline.split(' → ').map((label) => t(label)).join(' → ')}</strong>
      <p>{t(advice)}</p>
    </div>
    <div className="ia-difficulty-steps">
      {path.map((id, index) => {
        const s = SCENARIOS.find((x) => x.id === id);
        const guide = buildScenarioChallengeGuide(id);
        return <button key={id} id={'difficulty-' + id} className="ia-difficulty-step" onClick={(event) => onPick(id, event.currentTarget.id)}>
          <span>{t('第 {{index}} 阶', { index: index + 1 })}</span>
          <strong>{t(s?.name ?? id)}</strong>
          <em>{t(guide.label)} · {guide.pressure}</em>
        </button>;
      })}
    </div>
  </section>;
}

function ContinuePanel({ summary, slots, onPick, onStartRecommended, onRefresh }: {
  summary: ReturnType<typeof summarizeSavePreviews>;
  slots: SaveRecoveryPreview[];
  onPick: (slot: number) => void;
  onStartRecommended: () => void;
  onRefresh: () => void;
}) {
  const { t } = useI18n();
  const best = summary.best;
  const others = slots.filter(s => s.slot !== best?.slot && s.status !== 'empty' && s.status !== 'broken');
  return <section className="ia-continue-panel" style={{ borderColor: `var(--${toneVar(summary.tone)})` }}>
    <div className="ia-continue-copy">
      <div className="ia-continue-tags">
        <Tag text={t('继续游戏')} tone={summary.tone} />
        <Tag text={t('可读 {{playable}}/{{total}}', { playable: summary.playable, total: summary.total })} tone="info" />
        {summary.repairable > 0 && <Tag text={t('可修复 {{count}}', { count: summary.repairable })} tone="warn" />}
        {summary.broken > 0 && <Tag text={t('损坏 {{count}}', { count: summary.broken })} tone="danger" />}
      </div>
      <strong>{best ? t(best.defeated ? '战局结局：槽位 {{slot}} · {{nation}} · 第 {{year}} 年' : '推荐继续：槽位 {{slot}} · {{nation}} · 第 {{year}} 年', { slot: best.slot, nation: t(best.nationName ?? '未知国家'), year: (best.turn ?? 0) + 1 }) : t(summary.headline)}</strong>
      <p>{best ? t('{{label}} · 体检 {{score}}/100{{repairs}}', { label: t(best.label), score: best.score ?? 0, repairs: best.repairs.length ? t(' · 将自动：{{items}}', { items: best.repairs.slice(0, 2).map((item) => t(item)).join(t('、')) }) : '' }) : t(summary.advice)}</p>
      {others.length > 0 && <details>
        <summary>{t('其他本地存档')}</summary>
        <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
          {others.map(save => <Btn key={save.slot} variant="ghost" onClick={() => onPick(save.slot)}
            label={[t(save.defeated ? '查看结局 · 槽位 {{slot}}' : '继续槽位 {{slot}}', { slot: save.slot }),
              t(save.nationName ?? '未知国家'), t('第 {{year}} 年', { year: (save.turn ?? 0) + 1 })].join(' · ')} />)}
        </div>
      </details>}
    </div>
    <div className="ia-continue-actions">
      {best && <Btn label={t(best.defeated ? '查看战局结局' : best.status === 'repairable' ? '修复并继续' : '继续最佳存档')} variant="primary" onClick={() => onPick(best.slot)} />}
      {!best && <Btn label={t('开始推荐剧本')} variant="primary" onClick={onStartRecommended} />}
      <Btn label={t('刷新体检')} variant="ghost" onClick={onRefresh} />
    </div>
  </section>;
}

function ThemeSwitch({ theme, applyTheme }: ThemeControls) {
  const { t } = useI18n();
  return <div className="ia-theme-switch" role="group" aria-label={t('主题模式')}>
    {THEMES.map(item => <button key={item.id} type="button" data-palette={item.id} aria-pressed={theme === item.id}
      onClick={() => applyTheme(item.id)} title={t('{{theme}}主题', { theme: t(item.label) })}>
      <span aria-hidden="true" className="ia-palette-swatch">{item.icon}</span><em>{t(item.label)}</em>
    </button>)}
  </div>;
}
