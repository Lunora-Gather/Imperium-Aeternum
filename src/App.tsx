// Imperium Aeternum — App shell
// 布局优化：总控台式顶部、分组导航、内容画布。Hooks 保持在条件 return 前，避免 React #310。
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { playSfx, useSfxMute } from './utils/audio';

import { provincesOf } from './engine/init';
import { ResourceStrip } from './components/ui';
import ScenarioSelect from './screens/ScenarioSelect';
import WorldMap from './screens/WorldMap';
import Dashboard from './screens/Dashboard';
import ProvinceScreen from './screens/ProvinceScreen';
import EconomyScreen from './screens/EconomyScreen';
import PopulationScreen from './screens/PopulationScreen';
import PoliticsScreen from './screens/PoliticsScreen';
import MilitaryScreen from './screens/MilitaryScreen';
import DiplomacyScreen from './screens/DiplomacyScreen';
import TechnologyScreen from './screens/TechnologyScreen';
import StatsScreen from './screens/StatsScreen';
import TurnReportScreen from './screens/TurnReportScreen';
import ChronicleScreen from './screens/ChronicleScreen';
import SaveLoadScreen from './screens/SaveLoadScreen';
import EventModal from './screens/EventModal';
import LogToast from './components/LogToast';

type Tab = 'dashboard' | 'map' | 'province' | 'economy' | 'population' | 'politics' | 'military' | 'diplomacy' | 'tech' | 'stats' | 'report' | 'chronicle' | 'save';

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
const BUILD_MARK = '布局优化 v1';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [preReportTab, setPreReportTab] = useState<Tab>('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [theme, setTheme] = useState<'night' | 'day' | 'bamboo' | 'ink'>(() => {
    try {
      const saved = localStorage.getItem('ia-theme');
      if (saved === 'day' || saved === 'night' || saved === 'bamboo' || saved === 'ink') return saved;
    } catch { /* ignore */ }
    return 'night';
  });

  const { state, nextTurn, scene, justProcessedTurn, clearTurnFlag, pendingTab, consumePendingTab } = useGameStore();
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

  useEffect(() => {
    try {
      if (!localStorage.getItem('ia-tutorial-done')) {
        setShowHelp(true);
        setTutorialStep(0);
      }
    } catch {
      setShowHelp(true);
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (pendingTab) {
      setTab(pendingTab as Tab);
      consumePendingTab();
    }
  }, [pendingTab, consumePendingTab]);

  useEffect(() => {
    if (!justProcessedTurn) return;
    if (state.turn <= 1) setTab('report');
    else {
      setPreReportTab(tab);
      setTab('report');
    }
    clearTurnFlag();
  }, [justProcessedTurn, clearTurnFlag, state.turn, tab]);

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

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const order: ('night' | 'day' | 'bamboo' | 'ink')[] = ['night', 'day', 'bamboo', 'ink'];
      const next = order[(order.indexOf(t) + 1) % order.length];
      document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next);
      try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (scene !== 'playing') return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'Escape') {
      if (showHelp) {
        e.preventDefault();
        setShowHelp(false);
      }
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
      setTab('economy');
      return;
    }
    const hit = ALL_TABS.find((x) => x.key === e.key);
    if (hit) {
      e.preventDefault();
      setTab(hit.id);
    }
  }, [scene, showHelp, state.pendingEvents, state.victory.type, pid, nextTurn]);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (scene === 'menu') return <ScenarioSelect />;

  return (
    <div className="ia-shell">
      <header className="ia-topbar">
        <section className="ia-ruler-card">
          <div className="ia-ruler-kicker ia-up">Imperium Aeternum</div>
          <div className="ia-ruler-main">
            <div>
              <h1 className="ia-ruler-title">{player?.name ?? '未名之国'}</h1>
              <div className="ia-ruler-subline">
                <span>Anno · {state.turn + 1}</span>
                <span>永恒帝国</span>
                <span>{player?.ruler?.name ? `君主 · ${player.ruler.name}` : '君主 · 无名'}</span>
                {atWar && <span className="danger">⚔ 战时</span>}
                {pendingCount > 0 && <span className="warn">✦ 待决事件 {pendingCount}</span>}
                {state.victory.type && <span className={state.victory.type.startsWith('win') ? 'good' : 'danger'}>{state.victory.type.startsWith('win') ? '🏆 已胜利' : '💀 已陨落'}</span>}
              </div>
            </div>
            <div className="ia-header-actions">
              <button className="ia-icon-btn ia-icon-btn--gold" onClick={toggleTheme} title={`主题：${theme}`} aria-label="切换主题">
                {theme === 'night' ? '☾' : theme === 'day' ? '☀' : theme === 'bamboo' ? '筠' : '墨'}
              </button>
              <button className="ia-icon-btn" onClick={() => { setShowHelp(true); setTutorialStep(0); }} title="治国引导" aria-label="治国引导">?</button>
              <button className="ia-icon-btn" onClick={sfxMute.toggle} title={sfxMute.muted ? '音效已关（点击开启）' : '音效已开（点击静音）'} aria-label="音效开关">{sfxMute.muted ? '🔇' : '🔊'}</button>
            </div>
          </div>

          {player && (
            <div className="ia-resource-dock">
              <ResourceStrip items={[
                { label: '国库', value: player.resources.gold, warn: player.resources.gold < 0, color: 'var(--gold)', icon: '◉' },
                { label: '粮储', value: player.resources.food, warn: player.resources.food < 0, color: 'var(--food)', icon: '✦' },
                { label: '子民', value: totalPop, color: 'var(--text)', icon: '◯' },
                { label: '安定', value: player.government.stability, warn: player.government.stability < 30, color: 'var(--stable)', icon: '◈' },
                { label: '疆土', value: provs.length, color: 'var(--accent)', icon: '⬡' },
              ]} />
            </div>
          )}
        </section>

        <aside className="ia-status-panel">
          <div className="ia-status-row"><span>行政点</span><strong>{Math.round(player?.resources.adminPt ?? 0)}</strong></div>
          <div className="ia-status-row"><span>科研点</span><strong>{Math.round(player?.resources.sciPt ?? 0)}</strong></div>
          <div className="ia-status-row"><span>影响力</span><strong>{Math.round(player?.resources.influence ?? 0)}</strong></div>
          <div className="ia-status-row"><span>净收入</span><strong className={netIncome === null ? '' : netIncome >= 0 ? 'good' : 'danger'}>{netIncome === null ? '—' : `${netIncome >= 0 ? '+' : ''}${Math.round(netIncome)}/年`}</strong></div>
        </aside>
      </header>

      <nav className="ia-main-nav" aria-label="主导航">
        {TAB_GROUPS.map((g) => (
          <div className="ia-nav-group" key={g.group}>
            <span className="ia-nav-label ia-up">{g.group}</span>
            <div className="ia-tab-cluster">
              {g.tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} title={`快捷键 ${t.key}`} className={`ia-tab-btn ${tab === t.id ? 'is-active' : ''}`}>
                  <span className="ia-tab-icon">{t.icon}</span>
                  <span>{t.label}</span>
                  <kbd>{t.key}</kbd>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="ia-nav-hint">空格下一回合 · T 经济 · {BUILD_MARK}</div>
      </nav>

      <main className="ia-content-shell ia-fade-in" key={tab}>
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
        {tab === 'report' && <TurnReportScreen onContinue={() => setTab(preReportTab)} />}
        {tab === 'chronicle' && <ChronicleScreen />}
        {tab === 'save' && <SaveLoadScreen />}
      </main>

      {state.pendingEvents.some((p) => p.nationId === pid) && <EventModal />}
      <LogToast />

      <footer className="ia-footer ia-display ia-up">
        Imperium Aeternum · 永恒帝国 · {BUILD_MARK}
      </footer>

      {showHelp && scene === 'playing' && (
        <div className="ia-modal-backdrop" onClick={() => { setShowHelp(false); setTutorialStep(-1); try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ } }}>
          <div className="ia-help-card" onClick={(e) => e.stopPropagation()}>
            <div className="ia-display ia-help-title">✦ 治国之要 · 第 {Math.max(tutorialStep, 0) + 1} / 5 步</div>
            {(() => {
              const steps = [
                { title: '① 总览警报', body: '看总览页警报置顶，红危黄警先处理。稳定度<40 或国库<0 是致命的。' },
                { title: '② 调税率', body: '去经济页调税率平衡民心与国库。高税多金但降民心，低税反之。' },
                { title: '③ 建设省份', body: '省份页建农田保粮、建市场生金、建兵营强军。' },
                { title: '④ 派系与科技', body: '政治页安抚派系，科技页研发科技稳根基。扩张越大治理越难。' },
                { title: '⑤ 推回合', body: '点下一回合或按空格结算。事件弹窗可按 1/2/3 键选择。' },
              ];
              const cur = steps[Math.max(tutorialStep, 0)] ?? steps[0];
              return <><div className="ia-help-step-title">{cur.title}</div><div className="ia-help-step-body">{cur.body}</div></>;
            })()}
            <div className="ia-help-actions">
              <button className="ia-btn ia-btn--ghost" onClick={() => { setShowHelp(false); setTutorialStep(-1); try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ } }}>跳过</button>
              {tutorialStep > 0 && <button className="ia-btn" onClick={() => setTutorialStep((s) => Math.max(s - 1, 0))}>上一步</button>}
              {tutorialStep < 4 ? <button className="ia-btn ia-btn--primary" onClick={() => setTutorialStep((s) => Math.min(s + 1, 4))}>下一步</button> : <button className="ia-btn ia-btn--primary" onClick={() => { setShowHelp(false); setTutorialStep(-1); try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ } }}>开始治国</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
