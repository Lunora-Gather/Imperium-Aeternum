// Imperium Aeternum — App shell
// V23：主导航使用统一 NavigationTab 合约，避免各模块手写 tab 字符串漂移。
import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { playSfx, useSfxMute } from './utils/audio';
import { BUILD_MARK } from './buildInfo';
import { getOnboardingStep, nextOnboardingIndex, onboardingProgress, prevOnboardingIndex } from './gameplay/onboarding';
import { pushPageHistory, resetPageHistory, resolveBackTarget } from './gameplay/pageHistory';
import { isNavigationTab, type NavigationTab } from './gameplay/navigationTabs';
import {
  completeNoviceJourneyStep,
  createNoviceJourney,
  getNextNoviceJourneyStep,
  normalizeNoviceJourney,
  noviceJourneyProgress,
  reconcileNoviceJourney,
  type NoviceJourneyProgress,
} from './gameplay/noviceJourney';

import { provincesOf } from './engine/init';
import { ResourceStrip } from './components/ui';
import LogToast from './components/LogToast';
import ErrorBoundary from './components/ErrorBoundary';
import { AccountButton } from './components/account/AccountPanel';
import { LocaleSwitch } from './components/LocaleSwitch';
import { useI18n } from './i18n';

const ScenarioSelect = lazy(() => import('./screens/ScenarioSelect'));
const WorldMap = lazy(() => import('./screens/WorldMap'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const ProvinceScreen = lazy(() => import('./screens/ProvinceScreen'));
const EconomyScreen = lazy(() => import('./screens/EconomyScreen'));
const PopulationScreen = lazy(() => import('./screens/PopulationScreen'));
const PoliticsScreen = lazy(() => import('./screens/PoliticsScreen'));
const MilitaryScreen = lazy(() => import('./screens/MilitaryScreen'));
const DiplomacyScreen = lazy(() => import('./screens/DiplomacyScreen'));
const TechnologyScreen = lazy(() => import('./screens/TechnologyScreen'));
const StatsScreen = lazy(() => import('./screens/StatsScreen'));
const TurnReportScreen = lazy(() => import('./screens/TurnReportScreen'));
const ChronicleScreen = lazy(() => import('./screens/ChronicleScreen'));
const SaveLoadScreen = lazy(() => import('./screens/SaveLoadScreen'));
const EventModal = lazy(() => import('./screens/EventModal'));
const NoviceJourneyPanel = lazy(() => import('./components/NoviceJourneyPanel'));
const NoviceJourneyCompletion = lazy(() => import('./components/NoviceJourneyCompletion'));

type Tab = NavigationTab;

const TAB_GROUPS: { group: string; tabs: { id: Tab; label: string; key: string; icon: string }[] }[] = [
  { group: '治理', tabs: [
    { id: 'dashboard', label: '总览', key: '1', icon: '◈' },
    { id: 'map', label: '舆图', key: 'm', icon: '⬡' },
    { id: 'province', label: '省份', key: '2', icon: '▣' },
    { id: 'economy', label: '经济', key: '3', icon: '◉' },
    { id: 'population', label: '人口', key: '4', icon: '◯' },
    { id: 'politics', label: '政治', key: '5', icon: '⚖' },
    { id: 'tech', label: '科技', key: '6', icon: '✦' },
    { id: 'stats', label: '统计', key: 's', icon: '◇' },
  ]},
  { group: '征伐', tabs: [
    { id: 'military', label: '军事', key: '7', icon: '⚔' },
    { id: 'diplomacy', label: '外交', key: '8', icon: '✉' },
  ]},
  { group: '纪事', tabs: [
    { id: 'report', label: '年报', key: '9', icon: '✶' },
    { id: 'chronicle', label: '史册', key: 'c', icon: '✧' },
    { id: 'save', label: '存档', key: '0', icon: '⌶' },
  ]},
];
const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);
const NOVICE_JOURNEY_KEY = 'ia-novice-journey-v1';

function loadNoviceJourney(): NoviceJourneyProgress {
  try {
    const stored = localStorage.getItem(NOVICE_JOURNEY_KEY);
    if (stored) return normalizeNoviceJourney(JSON.parse(stored));
    if (localStorage.getItem('ia-tutorial-done')) return createNoviceJourney('dismissed');
  } catch { /* use a safe first-run default */ }
  return createNoviceJourney();
}

function persistNoviceJourney(progress: NoviceJourneyProgress): void {
  try { localStorage.setItem(NOVICE_JOURNEY_KEY, JSON.stringify(progress)); } catch { /* non-critical preference */ }
}

function ScreenFallback() {
  const { t } = useI18n();
  return <div className="ia-display" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>{t('正在展开卷宗…')}</div>;
}

export default function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [tabHistory, setTabHistory] = useState<Tab[]>([]);
  const [preReportTab, setPreReportTab] = useState<Tab>('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [noviceJourney, setNoviceJourney] = useState<NoviceJourneyProgress>(loadNoviceJourney);
  const [noviceCollapsed, setNoviceCollapsed] = useState(false);
  const [showNoviceCompletion, setShowNoviceCompletion] = useState(false);
  const previousNoviceStatus = useRef(noviceJourney.status);
  const [theme, setTheme] = useState<'night' | 'day' | 'bamboo' | 'ink'>(() => {
    try {
      const saved = localStorage.getItem('ia-theme');
      if (saved === 'day' || saved === 'night' || saved === 'bamboo' || saved === 'ink') return saved;
    } catch { /* ignore */ }
    return 'night';
  });

  const { state, nextTurn, scene, justProcessedTurn, clearTurnFlag, pendingTab, consumePendingTab, backToMenu, hasSave } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = player ? provincesOf(pid, state.provinces) : [];
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const atWar = state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const pendingCount = state.pendingEvents.filter((p) => p.nationId === pid).length;
  const netIncome = state.lastReport
    ? state.lastReport.income.tax + state.lastReport.income.trade + state.lastReport.income.building - state.lastReport.expense.military - state.lastReport.expense.corruption
    : null;

  const sfxMute = useSfxMute();
  const prevPendingCount = useRef(state.pendingEvents.length);
  const prevVictory = useRef(state.victory.type);

  const goToTab = useCallback((next: Tab, remember = true) => {
    if (next === tab) return;
    if (remember) setTabHistory((history) => pushPageHistory(history, tab, next));
    setTab(next);
  }, [tab]);

  const goBackPage = useCallback(() => {
    const resolved = resolveBackTarget(tabHistory, tab, 'dashboard');
    setTabHistory(resolved.history);
    setTab(resolved.target);
  }, [tab, tabHistory]);

  const dismissGuidance = useCallback(() => {
    setShowHelp(false);
    setTutorialStep(0);
    const dismissed = { ...noviceJourney, status: 'dismissed' as const };
    setNoviceJourney(dismissed);
    persistNoviceJourney(dismissed);
    try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ }
  }, [noviceJourney]);

  const startNoviceJourney = useCallback(() => {
    const started = createNoviceJourney();
    setNoviceJourney(started);
    persistNoviceJourney(started);
    setNoviceCollapsed(false);
    setShowHelp(false);
    setTutorialStep(0);
    goToTab('dashboard');
    try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ }
  }, [goToTab]);

  useEffect(() => {
    try {
      if (!localStorage.getItem('ia-tutorial-done') && noviceJourney.status === 'active' && noviceJourney.completed.length === 0) {
        setShowHelp(true);
        setTutorialStep(0);
      }
    } catch {
      setShowHelp(true);
      setTutorialStep(0);
    }
  }, [noviceJourney.status, noviceJourney.completed.length]);

  const localSaveAvailable = hasSave();
  useEffect(() => {
    setNoviceJourney((current) => {
      const next = reconcileNoviceJourney(current, { turn: state.turn, currentTab: tab, hasLocalSave: localSaveAvailable });
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      persistNoviceJourney(next);
      return next;
    });
  }, [state.turn, tab, localSaveAvailable]);

  useEffect(() => {
    if (previousNoviceStatus.current === 'active' && noviceJourney.status === 'completed') {
      setShowNoviceCompletion(true);
      setNoviceCollapsed(false);
    }
    previousNoviceStatus.current = noviceJourney.status;
  }, [noviceJourney.status]);

  useEffect(() => {
    if (pendingTab) {
      if (isNavigationTab(pendingTab)) goToTab(pendingTab);
      consumePendingTab();
    }
  }, [pendingTab, consumePendingTab, goToTab]);

  useEffect(() => {
    if (!justProcessedTurn) return;
    if (state.turn <= 1) goToTab('report', false);
    else {
      setPreReportTab(tab);
      goToTab('report', false);
    }
    clearTurnFlag();
  }, [justProcessedTurn, clearTurnFlag, state.turn, tab, goToTab]);

  useEffect(() => {
    if (justProcessedTurn) playSfx('bell');
  }, [justProcessedTurn]);

  useEffect(() => {
    const cur = state.pendingEvents.filter((p) => p.nationId === pid).length;
    if (cur > prevPendingCount.current) playSfx('scroll');
    prevPendingCount.current = cur;
  }, [state.pendingEvents, pid]);

  useEffect(() => {
    if (state.victory.type && !prevVictory.current) {
      playSfx(state.victory.type.startsWith('win') ? 'victory' : 'defeat');
    }
    prevVictory.current = state.victory.type;
  }, [state.victory.type]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'night' ? '' : theme);
  }, [theme]);

  useEffect(() => {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  }, [scene, tab]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const order: ('night' | 'day' | 'bamboo' | 'ink')[] = ['night', 'day', 'bamboo', 'ink'];
      const next = order[(order.indexOf(t) + 1) % order.length];
      document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next);
      try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const safeBackToMenu = useCallback(() => {
    const ok = window.confirm(t('返回标题页？当前进度不会自动保存。建议先到“存档”页保存。'));
    if (!ok) return;
    setTabHistory(resetPageHistory<Tab>());
    setTab('dashboard');
    backToMenu();
  }, [backToMenu, t]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (scene !== 'playing') return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'Escape') {
      if (showHelp) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }
      e.preventDefault();
      goBackPage();
      return;
    }

    const hasPending = state.pendingEvents.some((p) => p.nationId === pid);
    if (hasPending) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.victory.type) nextTurn();
      return;
    }
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      goToTab('economy');
      return;
    }
    const hit = ALL_TABS.find((x) => x.key === e.key);
    if (hit) {
      e.preventDefault();
      goToTab(hit.id);
    }
  }, [scene, showHelp, state.pendingEvents, state.victory.type, pid, nextTurn, goToTab, goBackPage]);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (scene === 'menu') return <Suspense fallback={<ScreenFallback />}><ScenarioSelect /></Suspense>;
  if (!player) {
    return (
      <div className="ia-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="ia-display" style={{ color: 'var(--gold)', fontSize: 18 }}>{t('载入中...')}</div>
      </div>
    );
  }

  const helpProgress = onboardingProgress(tutorialStep);
  const helpStep = getOnboardingStep(tutorialStep);
  const noviceStep = getNextNoviceJourneyStep(noviceJourney);
  const noviceProgress = noviceJourneyProgress(noviceJourney);
  const goHelpTab = () => {
    if (noviceJourney.status !== 'active') {
      const started = createNoviceJourney();
      setNoviceJourney(started);
      persistNoviceJourney(started);
    }
    if (isNavigationTab(helpStep.tab)) goToTab(helpStep.tab);
    setShowHelp(false);
  };

  const completeCurrentNoviceStep = () => {
    if (!noviceStep || noviceStep.completion !== 'manual' || tab !== noviceStep.tab) return;
    const next = completeNoviceJourneyStep(noviceJourney, noviceStep.id);
    setNoviceJourney(next);
    persistNoviceJourney(next);
  };

  const dismissNoviceJourney = () => {
    const next = { ...noviceJourney, status: 'dismissed' as const };
    setNoviceJourney(next);
    persistNoviceJourney(next);
  };

  return (
    <div className="ia-shell">
      <header className="ia-topbar">
        <section className="ia-ruler-card">
          <div className="ia-ruler-kicker ia-up">Imperium Aeternum</div>
          <div className="ia-ruler-main">
            <div>
              <h1 className="ia-ruler-title">{player?.name ?? t('未名之国')}</h1>
              <div className="ia-ruler-subline">
                <span>Anno · {state.turn + 1}</span>
                <span>{t('永恒帝国')}</span>
                <span>{player?.ruler?.name ? `Ruler · ${player.ruler.name}` : t('君主 · 无名')}</span>
                {atWar && <span className="danger">⚔ {t('战时')}</span>}
                {pendingCount > 0 && <span className="warn">✦ {t('待决事件 {{count}}', { count: pendingCount })}</span>}
                {state.victory.type && <span className={state.victory.type.startsWith('win') ? 'good' : 'danger'}>{state.victory.type.startsWith('win') ? `🏆 ${t('已胜利')}` : `💀 ${t('已陨落')}`}</span>}
              </div>
            </div>
            <div className="ia-header-actions">
              <AccountButton compact />
              <LocaleSwitch compact />
              <button className="ia-icon-btn ia-icon-btn--gold" onClick={toggleTheme} title={t('切换主题')} aria-label={t('切换主题')}>
                {theme === 'night' ? '☾' : theme === 'day' ? '☀' : theme === 'bamboo' ? '筠' : '墨'}
              </button>
              <button className="ia-icon-btn" onClick={() => { setShowHelp(true); setTutorialStep(0); }} title={t('治国引导')} aria-label={t('治国引导')}>?</button>
              <button className="ia-icon-btn" onClick={sfxMute.toggle} title={t(sfxMute.muted ? '音效已关（点击开启）' : '音效已开（点击静音）')} aria-label={t('音效开关')}>{sfxMute.muted ? '🔇' : '🔊'}</button>
              <button className="ia-icon-btn ia-icon-btn--back" onClick={goBackPage} title={t('返回上一页')} aria-label={t('返回上一页')}>↩</button>
              <button className="ia-icon-btn ia-icon-btn--back" onClick={safeBackToMenu} title={t('返回标题页')} aria-label={t('返回标题页')}>⌂</button>
            </div>
          </div>

          {player && (
            <div className="ia-resource-dock">
              <ResourceStrip items={[
                { label: t('国库'), value: player.resources.gold, warn: player.resources.gold < 0, color: 'var(--gold)', icon: '◉' },
                { label: t('粮储'), value: player.resources.food, warn: player.resources.food < 0, color: 'var(--food)', icon: '✦' },
                { label: t('子民'), value: totalPop, color: 'var(--text)', icon: '◯' },
                { label: t('安定'), value: player.government.stability, warn: player.government.stability < 30, color: 'var(--stable)', icon: '◈' },
                { label: t('疆土'), value: provs.length, color: 'var(--accent)', icon: '⬡' },
              ]} />
            </div>
          )}
        </section>

        <aside className="ia-status-panel">
          <div className="ia-status-row"><span>{t('行政点')}</span><strong>{Math.round(player?.resources.adminPt ?? 0)}</strong></div>
          <div className="ia-status-row"><span>{t('科研点')}</span><strong>{Math.round(player?.resources.sciPt ?? 0)}</strong></div>
          <div className="ia-status-row"><span>{t('影响力')}</span><strong>{Math.round(player?.resources.influence ?? 0)}</strong></div>
          <div className="ia-status-row"><span>{t('净收入')}</span><strong className={netIncome === null ? '' : netIncome >= 0 ? 'good' : 'danger'}>{netIncome === null ? '—' : `${netIncome >= 0 ? '+' : ''}${Math.round(netIncome)}/年`}</strong></div>
        </aside>
      </header>

      <nav className="ia-main-nav" aria-label={t('主导航')}>
        {TAB_GROUPS.map((g) => (
          <div className="ia-nav-group" key={g.group}>
            <span className="ia-nav-label ia-up">{t(g.group)}</span>
            <div className="ia-tab-cluster">
              {g.tabs.map((tabInfo) => (
                <button key={tabInfo.id} onClick={() => goToTab(tabInfo.id)} title={t('快捷键 {{key}}', { key: tabInfo.key })} className={`ia-tab-btn ${tab === tabInfo.id ? 'is-active' : ''} ${noviceStep?.tab === tabInfo.id && noviceJourney.status === 'active' ? 'is-tutorial-target' : ''}`}>
                  <span className="ia-tab-icon">{tabInfo.icon}</span>
                  <span>{t(tabInfo.label)}</span>
                  <kbd>{tabInfo.key}</kbd>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="ia-nav-hint">{t('Esc / ↩ 返回上一页 · 空格下一回合 · T 经济 · {{build}}', { build: BUILD_MARK })}</div>
      </nav>

      <main className="ia-content-shell ia-fade">
        <ErrorBoundary onReset={() => goToTab('dashboard', false)}>
          <Suspense fallback={<ScreenFallback />}>
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'map' && <WorldMap />}
            {tab === 'province' && <ProvinceScreen />}
            {tab === 'economy' && <EconomyScreen />}
            {tab === 'population' && <PopulationScreen />}
            {tab === 'politics' && <PoliticsScreen />}
            {tab === 'military' && <MilitaryScreen />}
            {tab === 'diplomacy' && <DiplomacyScreen />}
            {tab === 'tech' && <TechnologyScreen />}
            {tab === 'stats' && <StatsScreen />}
            {tab === 'report' && <TurnReportScreen onContinue={() => goToTab(preReportTab, false)} />}
            {tab === 'chronicle' && <ChronicleScreen />}
            {tab === 'save' && <SaveLoadScreen />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {state.pendingEvents.some((p) => p.nationId === pid) && <Suspense fallback={null}><EventModal /></Suspense>}
      <LogToast />

      {noviceJourney.status === 'active' && noviceStep && !showHelp && (
        <Suspense fallback={null}>
          <NoviceJourneyPanel
            step={noviceStep}
            current={noviceProgress.current}
            total={noviceProgress.total}
            percent={noviceProgress.percent}
            currentTab={tab}
            collapsed={noviceCollapsed}
            onGo={() => goToTab(noviceStep.tab)}
            onComplete={completeCurrentNoviceStep}
            onToggleCollapsed={() => setNoviceCollapsed((value) => !value)}
            onDismiss={dismissNoviceJourney}
          />
        </Suspense>
      )}

      {showNoviceCompletion && !showHelp && (
        <Suspense fallback={null}>
          <NoviceJourneyCompletion
            onClose={() => setShowNoviceCompletion(false)}
            onReview={() => {
              setShowNoviceCompletion(false);
              goToTab('dashboard');
            }}
          />
        </Suspense>
      )}

      <footer className="ia-footer ia-display ia-up">
        Imperium Aeternum · 永恒帝国 · {BUILD_MARK}
      </footer>

      {showHelp && scene === 'playing' && (
        <div className="ia-modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="ia-help-card" role="dialog" aria-modal="true" aria-label="治国路线说明" onClick={(e) => e.stopPropagation()}>
            <div className="ia-display ia-help-title">✦ 治国路线 · 第 {helpProgress.current} / {helpProgress.total} 步</div>
            <div className="ia-help-step-title">{helpStep.title}</div>
            <div className="ia-help-step-body">{helpStep.body}</div>
            <div className="ia-dash-note" style={{ marginTop: 10 }}>
              推荐页面：{ALL_TABS.find((x) => x.id === helpStep.tab)?.label ?? helpStep.tab}{helpStep.shortcut ? ` · 快捷键 ${helpStep.shortcut}` : ''}
            </div>
            <div className="ia-help-actions">
              <button className="ia-btn ia-btn--ghost" onClick={dismissGuidance}>不再提示</button>
              {tutorialStep > 0 && <button className="ia-btn" onClick={() => setTutorialStep((s) => prevOnboardingIndex(s))}>上一步</button>}
              <button className="ia-btn" onClick={goHelpTab}>{helpStep.cta}</button>
              {!helpProgress.done ? <button className="ia-btn ia-btn--primary" onClick={() => setTutorialStep((s) => nextOnboardingIndex(s))}>下一步</button> : <button className="ia-btn ia-btn--primary" onClick={startNoviceJourney}>开始实战引导</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
