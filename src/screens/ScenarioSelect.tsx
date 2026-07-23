// 剧本选择页 v35 — 开局大厅：玩法速查手册 + 难度挑战阶梯 + 存档健康继续
import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SCENARIOS, type ScenarioId } from '../store/scenarioCatalog';
import { clearAllSaves, SAVE_VERSION } from '../store/persistence';
import { inspectAllSaveSlots, type SaveRecoveryPreview } from '../gameplay/saveRecovery';
import { getScenarioProfile, nationStyleTags, recommendedScenarioIds, summarizeSavePreviews, type LaunchTone } from '../gameplay/launchHub';
import { buildScenarioChallengeGuide, recommendedChallengePath, summarizeChallengePath, type ScenarioChallengeGuide } from '../gameplay/difficultyGuide';
import { buildLaunchHandbook, type LaunchHandbook } from '../gameplay/launchHandbook';
import { BUILD_MARK } from '../buildInfo';
import { Btn, Tag } from '../components/ui';
import { AccountButton } from '../components/account/AccountPanel';
import { SharedWorldButton } from '../components/sharedWorld/SharedWorldLobby';
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

export default function ScenarioSelect() {
  const { t } = useI18n();
  const { startScenario, startWithNation, loadFromSlot, hasSave, log } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => { try { return localStorage.getItem('ia-theme') || 'night'; } catch { return 'night'; } });
  const [previews, setPreviews] = useState<SaveRecoveryPreview[]>(() => inspectAllSaveSlots());
  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = hasSave();
  const saveSummary = useMemo(() => summarizeSavePreviews(previews), [previews]);
  const recommended = useMemo(() => new Set(recommendedScenarioIds()), []);
  const challengePath = useMemo(() => summarizeChallengePath(), []);
  const handbook = useMemo(() => buildLaunchHandbook(), []);

  const applyTheme = (next: string) => { setTheme(next); document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next); try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ } };
  const refreshSaves = () => setPreviews(inspectAllSaveSlots());
  const clearLocal = () => { if (!window.confirm('确认清理本浏览器里的全部 Imperium Aeternum 存档？')) return; clearAllSaves(); refreshSaves(); };
  const continueBest = () => { if (saveSummary.best) loadFromSlot(saveSummary.best.slot); };
  const featuredScenario = SCENARIOS.find((s) => s.id === 'classic') ?? SCENARIOS[0];
  const featuredHint = getScenarioProfile(featuredScenario.id);
  const featuredChallenge = buildScenarioChallengeGuide(featuredScenario.id);
  const startPickedScenario = (id: ScenarioId) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    if (s.needsNationPick) {
      setSelected(id);
      setPickedNation(null);
      return;
    }
    startScenario(id);
  };

  if (scenario && scenario.needsNationPick && !pickedNation) {
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <div className="ia-menu ia-menu--compact">
      <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => { setSelected(null); setPickedNation(null); }}>← {t('剧本大厅')}</button><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><LocaleSwitch /><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div></div>
      <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">Choose Nation</div><h1 className="ia-display">{scenario.name}</h1><p>{scenario.description}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}><Tag text={hint.marketTag} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /><Tag text={challenge.label} tone={challenge.tone} /><Tag text={hint.audience} tone="info" /></div></header>
      <ChallengePanel guide={challenge} />
      <div className="ia-nation-advice">{hint.advice}</div>
      <div className="ia-menu-section-title ia-up">选择你的邦国</div>
      <div className="ia-nation-grid">{scenario.playableNations?.map((n) => <button key={n.id} className="ia-choice-card" onClick={() => setPickedNation(n.id)}><div className="ia-choice-head"><strong className="ia-display">{n.name}</strong><Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} /></div><p>{n.desc}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>{nationStyleTags(n.desc, n.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div></button>)}</div>
    </div>;
  }

  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <div className="ia-menu ia-menu--confirm">
      <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => setPickedNation(null)}>← {t('重选邦国')}</button><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><LocaleSwitch /><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div></div>
      <div className="ia-confirm-card"><p className="ia-up">即将开始</p><h1 className="ia-display">{scenario.name}</h1><p className="mute">{scenario.description}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}><Tag text={hint.marketTag} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /><Tag text={`${challenge.label} · 压力 ${challenge.pressure}`} tone={challenge.tone} /></div><div className="ia-confirm-nation"><span className="ia-up">你的邦国</span><h2 className="ia-display">{nation?.name}</h2><p>{nation?.desc}</p>{nation && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>{nationStyleTags(nation.desc, nation.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div>}</div><ChallengePanel guide={challenge} compact /><div className="ia-confirm-actions"><Btn label="← 返回" variant="ghost" onClick={() => setPickedNation(null)} /><Btn label="开启纪元 →" variant="primary" onClick={() => startWithNation(pickedNation)} /></div></div>
    </div>;
  }

  return <div className="ia-menu ia-menu--launch">
    <div className="ia-menu-toolbar"><div className="ia-menu-version"><Tag text={BUILD_MARK} tone="gold" /><Tag text={`${t('存档')} v${SAVE_VERSION}`} tone="info" /><Tag text={saveSummary.headline} tone={saveSummary.tone} /></div><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><SocialButton /><AccountButton /><LocaleSwitch /><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div></div>
    <header className="ia-launch-hero">
      <div className="ia-launch-copy">
        <div className="ia-up ia-menu-kicker">Grand Strategy Chronicle</div>
        <h1 className="ia-display">Imperium Aeternum</h1>
        <p className="ia-display ia-up">{t('永恒帝国')}</p>
        <div className="ia-menu-subtitle">{t('治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。')}</div>
        <div className="ia-launch-actions">
          <Btn label={saveSummary.best ? t('继续槽位 {{slot}}', { slot: saveSummary.best.slot }) : t('开始推荐剧本')} variant="primary" onClick={saveSummary.best ? continueBest : () => startPickedScenario(featuredScenario.id)} />
          <SharedWorldButton />
          <Btn label={t('查看全部剧本')} variant="ghost" onClick={() => document.getElementById('scenario-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
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
      <ContinuePanel summary={saveSummary} onContinue={continueBest} onStartRecommended={() => startPickedScenario(featuredScenario.id)} onRefresh={refreshSaves} />
      <DifficultyTrack path={challengePath.ids} headline={challengePath.headline} advice={challengePath.advice} onPick={startPickedScenario} />
    </section>
    <HandbookPanel handbook={handbook} />
    <div className="ia-launch-guide-grid"><Guide title={t('第一次玩')} body={t('选地中海黎明，最快理解财政、省份、战争和事件。')} tone="good" /><Guide title={t('喜欢经营')} body={t('选印度洋贸易，经济和海贸路线更清晰。')} tone="info" /><Guide title={t('喜欢冲突')} body={t('选地中海争霸，战争、贸易和外交都很密集。')} tone="warn" /><Guide title={t('追求旗舰长局')} body={t('选万邦纪元，但建议熟悉系统后再玩。')} tone="danger" /></div>
    <div id="scenario-library" className="ia-scenario-library-head"><div><span className="ia-up">Campaign Library</span><h2 className="ia-display">{t('选择剧本')}</h2></div><p>{t('按压力和玩法定位选择，不同剧本对应不同学习曲线。')}</p></div>
    <div className="ia-scenario-grid">{SCENARIOS.map((s) => { const hint = getScenarioProfile(s.id); const challenge = buildScenarioChallengeGuide(s.id); const isRecommended = recommended.has(s.id); return <button key={s.id} className={`ia-scenario-card ${isRecommended ? 'is-recommended' : ''}`} onClick={() => startPickedScenario(s.id)} style={{ borderColor: isRecommended ? `var(--${toneVar(hint.tone)})` : undefined }}><div className="ia-scenario-card__top"><h3 className="ia-display">{t(s.name)}</h3><Tag text={t(s.nationCount)} tone="gold" /></div><div className="ia-scenario-sub">{t(s.subtitle)}</div><p>{t(s.description)}</p><div className="ia-scenario-tags"><Tag text={t(hint.marketTag)} tone={hint.tone} /><Tag text={t(challenge.label)} tone={challenge.tone} /><Tag text={`${t('压力')} ${challenge.pressure}`} tone={challenge.tone} />{isRecommended && <Tag text={t('推荐')} tone="gold" />}</div><div className="ia-scenario-advice">{t(challenge.headline)} · {t(challenge.recommendedAfter)}</div><div className="ia-scenario-foot">{t(s.needsNationPick ? '选择邦国' : '开始剧本')}<span>→</span></div></button>; })}</div>
    <div className="ia-menu-actions">{saveExists && <Btn label="读取自动存档" variant="ghost" onClick={() => loadFromSlot(0)} />}{saveSummary.best && <Btn label={`继续槽位 ${saveSummary.best.slot}`} variant="primary" onClick={continueBest} />}{previews.some((p) => p.status !== 'empty') && <Btn label="刷新存档体检" variant="ghost" onClick={refreshSaves} />}{previews.some((p) => p.status !== 'empty') && <Btn label="清理本地存档" warn onClick={clearLocal} />}</div>
    {log.length > 0 && <p className="dim ia-menu-log">{log[log.length - 1]}</p>}
  </div>;
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
    <div className="ia-handbook-grid">
      {handbook.sections.map((section) => <article key={section.id} className={`ia-handbook-item ia-handbook-item--${section.tone}`}>
        <Tag text={section.kicker} tone={section.tone} />
        <strong>{t(section.title)}</strong>
        <p>{t(section.summary)}</p>
        <div>{section.steps.slice(0, 3).map((x) => <Tag key={x.id} text={t(x.label)} tone={x.tone} />)}</div>
      </article>)}
    </div>
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

function DifficultyTrack({ path, headline, advice, onPick }: { path: ScenarioId[]; headline: string; advice: string; onPick: (id: ScenarioId) => void }) {
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
        return <button key={id} className="ia-difficulty-step" onClick={() => onPick(id)}>
          <span>{t('第 {{index}} 阶', { index: index + 1 })}</span>
          <strong>{t(s?.name ?? id)}</strong>
          <em>{t(guide.label)} · {guide.pressure}</em>
        </button>;
      })}
    </div>
  </section>;
}

function ContinuePanel({ summary, onContinue, onStartRecommended, onRefresh }: { summary: ReturnType<typeof summarizeSavePreviews>; onContinue: () => void; onStartRecommended: () => void; onRefresh: () => void }) {
  const { t } = useI18n();
  const best = summary.best;
  return <section className="ia-continue-panel" style={{ borderColor: `var(--${toneVar(summary.tone)})` }}>
    <div className="ia-continue-copy">
      <div className="ia-continue-tags">
        <Tag text={t('继续游戏')} tone={summary.tone} />
        <Tag text={`可读 ${summary.playable}/${summary.total}`} tone="info" />
        {summary.repairable > 0 && <Tag text={`可修复 ${summary.repairable}`} tone="warn" />}
        {summary.broken > 0 && <Tag text={`损坏 ${summary.broken}`} tone="danger" />}
      </div>
      <strong>{best ? t('推荐继续：槽位 {{slot}} · {{nation}} · 第 {{year}} 年', { slot: best.slot, nation: best.nationName ?? t('未知国家'), year: (best.turn ?? 0) + 1 }) : t(summary.headline)}</strong>
      <p>{best ? `${best.label} · 体检 ${best.score ?? 0}/100${best.repairs.length ? ` · 将自动：${best.repairs.slice(0, 2).join('、')}` : ''}` : summary.advice}</p>
    </div>
    <div className="ia-continue-actions">
      {best && <Btn label={best.status === 'repairable' ? '修复并继续' : '继续最佳存档'} variant="primary" onClick={onContinue} />}
      {!best && <Btn label={t('开始推荐剧本')} variant="primary" onClick={onStartRecommended} />}
      <Btn label={t('刷新体检')} variant="ghost" onClick={onRefresh} />
    </div>
  </section>;
}

function Guide({ title, body, tone }: { title: string; body: string; tone: 'good' | 'warn' | 'danger' | 'info' }) {
  return <article className={`ia-launch-guide ia-launch-guide--${tone}`}><Tag text={title} tone={tone} /><p>{body}</p></article>;
}

function ThemeSwitch({ theme, applyTheme }: { theme: string; applyTheme: (theme: string) => void }) {
  const { t } = useI18n();
  return <div className="ia-theme-switch" aria-label={t('主题模式')}>{THEMES.map((item) => <button key={item.id} onClick={() => applyTheme(item.id)} className={theme === item.id || (theme === '' && item.id === 'night') ? 'is-active' : ''} title={t('{{theme}}主题', { theme: t(item.label) })}><span>{item.icon}</span><em>{t(item.label)}</em></button>)}</div>;
}
