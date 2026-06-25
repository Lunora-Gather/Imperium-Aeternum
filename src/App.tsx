// Imperium Aeternum — App shell
// 修复 React #310：所有 Hooks 必须在任何条件 return 之前调用。
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
    { id: 'province', label: '省份', key: '2', icon: '⬡' },
    { id: 'economy', label: '经济', key: '3', icon: '◉' },
    { id: 'population', label: '人口', key: '4', icon: '◯' },
    { id: 'politics', label: '政治', key: '5', icon: '⚖' },
    { id: 'tech', label: '科技', key: '6', icon: '✦' },
    { id: 'stats', label: '统计', key: 's', icon: '📊' },
  ]},
  { group: '征伐', tabs: [
    { id: 'military', label: '军事', key: '7', icon: '⚔' },
    { id: 'diplomacy', label: '外交', key: '8', icon: '✉' },
  ]},
  { group: '纪事', tabs: [
    { id: 'report', label: '年报', key: '9', icon: '✶' },
    { id: 'chronicle', label: '史册', key: 'c', icon: '✶' },
    { id: 'save', label: '存档', key: '0', icon: '⌶' },
  ]},
];
const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);
const BUILD_MARK = 'build hookfix-310';

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

  // 重点：条件 return 必须放在所有 Hooks 之后，否则从 menu 进入 playing 会触发 React #310。
  if (scene === 'menu') return <ScenarioSelect />;

  return (
    <div style={{ padding: '20px 28px 40px', maxWidth: 1160, margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ marginBottom: 'var(--space-6)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -20, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold) 30%, var(--border-gold) 70%, transparent)', opacity: 0.5 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
          <div>
            <h1 className="ia-display" style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.08em', lineHeight: 1 }}>
              {player?.name ?? 'Imperium Aeternum'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <span className="ia-display ia-up" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em' }}>Anno · {state.turn + 1}</span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>永恒帝国</span>
              {atWar && <><span style={{ color: 'var(--text-dim)' }}>·</span><span style={{ fontSize: 11, color: 'var(--war)' }}>⚔ 战时</span></>}
              {state.victory.type && <span className={state.victory.type.startsWith('win') ? 'good' : 'danger'} style={{ fontSize: 11 }}>{state.victory.type.startsWith('win') ? '🏆 已胜利' : '💀 已陨落'}</span>}
            </div>
          </div>

          {player && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <ResourceStrip items={[
                { label: '国库', value: player.resources.gold, warn: player.resources.gold < 0, color: 'var(--gold)', icon: '◉' },
                { label: '粮储', value: player.resources.food, warn: player.resources.food < 0, color: 'var(--food)', icon: '✦' },
                { label: '子民', value: totalPop, color: 'var(--text)', icon: '◯' },
                { label: '安定', value: player.government.stability, warn: player.government.stability < 30, color: 'var(--stable)', icon: '◈' },
                { label: '疆土', value: provs.length, color: 'var(--accent)', icon: '⬡' },
              ]} />
              <button onClick={toggleTheme} title={`主题：${theme}`} aria-label="切换主题" style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--gold)', fontSize: 16, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>{theme === 'night' ? '☾' : theme === 'day' ? '☀' : theme === 'bamboo' ? '筠' : '墨'}</span>
              </button>
              <button onClick={() => { setShowHelp(true); setTutorialStep(0); }} title="治国引导" style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-mute)', fontSize: 14, padding: 0 }}>?</button>
              <button onClick={sfxMute.toggle} title={sfxMute.muted ? '音效已关（点击开启）' : '音效已开（点击静音）'} style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: sfxMute.muted ? 'var(--text-dim)' : 'var(--gold)', fontSize: 14, padding: 0 }}>{sfxMute.muted ? '🔇' : '🔊'}</button>
            </div>
          )}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
        {TAB_GROUPS.map((g) => (
          <div key={g.group} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span className="ia-up" style={{ fontSize: 9, color: 'var(--text-dim)', marginRight: 2 }}>{g.group}</span>
            {g.tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} title={`快捷键 ${t.key}`} style={tab === t.id ? {
                background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, fontSize: 13, padding: '6px 4px', borderBottom: '2px solid var(--gold)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
              } : {
                background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 13, padding: '6px 4px', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
          空格 = 下一回合 · 数字键切换 · {BUILD_MARK}
        </div>
      </nav>

      <main className="ia-fade-in" key={tab}>
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

      <footer style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 10, textAlign: 'center', letterSpacing: '0.1em' }} className="ia-display ia-up">
        Imperium Aeternum · 永恒帝国 · MVP · {BUILD_MARK}
      </footer>

      {showHelp && scene === 'playing' && (
        <div onClick={() => { setShowHelp(false); setTutorialStep(-1); try { localStorage.setItem('ia-tutorial-done', '1'); } catch { /* ignore */ } }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: 22, maxWidth: 560, width: '90%', border: '1px solid var(--border-gold)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div className="ia-display" style={{ fontSize: 16, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>✦ 治国之要 · 第 {Math.max(tutorialStep, 0) + 1} / 5 步</div>
            {(() => {
              const steps = [
                { title: '① 总览警报', body: '看总览页警报置顶，红危黄警先处理。稳定度<40 或国库<0 是致命的。' },
                { title: '② 调税率', body: '去经济页调税率平衡民心与国库。高税多金但降民心，低税反之。' },
                { title: '③ 建设省份', body: '省份页建农田保粮、建市场生金、建兵营强军。' },
                { title: '④ 派系与科技', body: '政治页安抚派系，科技页研发科技稳根基。扩张越大治理越难。' },
                { title: '⑤ 推回合', body: '点下一回合或按空格结算。事件弹窗可按 1/2/3 键选择。' },
              ];
              const cur = steps[Math.max(tutorialStep, 0)] ?? steps[0];
              return <><div style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>{cur.title}</div><div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.7, minHeight: 60 }}>{cur.body}</div></>;
            })()}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
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
