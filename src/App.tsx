// Imperium Aeternum — App v4（青铜铭文设计语言）
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import ErrorBoundary from './components/ErrorBoundary';

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
import TurnReportScreen from './screens/TurnReportScreen';
import ChronicleScreen from './screens/ChronicleScreen';
import SaveLoadScreen from './screens/SaveLoadScreen';
import EventModal from './screens/EventModal';
import LogToast from './components/LogToast';

type Tab = 'dashboard' | 'map' | 'province' | 'economy' | 'population' | 'politics' | 'military' | 'diplomacy' | 'tech' | 'report' | 'chronicle' | 'save';

const TAB_GROUPS: { group: string; tabs: { id: Tab; label: string; key: string; icon: string }[] }[] = [
  { group: '治理', tabs: [
    { id: 'dashboard', label: '总览', key: '1', icon: '◈' },
    { id: 'map', label: '舆图', key: 'm', icon: '⬡' },
    { id: 'province', label: '省份', key: '2', icon: '⬡' },
    { id: 'economy', label: '经济', key: '3', icon: '◉' },
    { id: 'population', label: '人口', key: '4', icon: '◯' },
    { id: 'politics', label: '政治', key: '5', icon: '⚖' },
    { id: 'tech', label: '科技', key: '6', icon: '✦' },
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

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [preReportTab, setPreReportTab] = useState<Tab>('dashboard');  // P0: 记住结算前所在页，年报可一键返回
  const [showHelp, setShowHelp] = useState(false);  // P3: 帮助按钮常驻，重显引导卡
  const [theme, setTheme] = useState<'night' | 'day' | 'bamboo' | 'ink'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ia-theme');
      if (saved === 'day' || saved === 'night' || saved === 'bamboo' || saved === 'ink') return saved as 'night' | 'day' | 'bamboo' | 'ink';
    }
    return 'night';
  });
  const { state, nextTurn, scene, justProcessedTurn, clearTurnFlag, pendingTab, consumePendingTab } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];

  // P2: 跨页跳转——地图/骚动徽章点击设 pendingTab，App 监听切 tab
  useEffect(() => {
    if (pendingTab) { setTab(pendingTab as Tab); consumePendingTab(); }
  }, [pendingTab, consumePendingTab]);

  // E11: 回合结算后自动跳年报（体验：玩家立刻看到"今年发生了什么"）
  // P0: 仅首回合强制跳（教学），之后记住结算前所在页 → 年报顶部可一键返回
  useEffect(() => {
    if (justProcessedTurn) {
      if (state.turn <= 1) setTab('report');
      else { setPreReportTab(tab); setTab('report'); }
      clearTurnFlag();
    }
  }, [justProcessedTurn, clearTurnFlag, state.turn, tab]);

  // 开场：剧本选择
  if (scene === 'menu') return <ScenarioSelect />;
  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const atWar = state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);

  // 主题切换：写 <html data-theme> + localStorage（循环 night→day→bamboo→ink）
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const order: ('night' | 'day' | 'bamboo' | 'ink')[] = ['night', 'day', 'bamboo', 'ink'];
      const idx = order.indexOf(t);
      const next = order[(idx + 1) % order.length];
      document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next);
      try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);
  // 初始化：应用 saved theme 到 <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'night' ? '' : theme);
  }, [theme]);

  const onKey = useCallback((e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    // E3: Esc 关帮助浮层（事件弹窗不拦，EventModal 自己处理 1/2/3）
    if (e.key === 'Escape') {
      if (showHelp) { e.preventDefault(); setShowHelp(false); return; }
      return;
    }
    // P0: 事件未处理时空格不推回合（避免误触），交由 EventModal 的 1/2/3 选
    const hasPending = state.pendingEvents.some((p) => p.nationId === pid);
    if (e.code === 'Space') {
      if (hasPending) return;
      e.preventDefault();
      if (!state.victory.type) nextTurn();
    } else {
      const hit = ALL_TABS.find((x) => x.key === e.key);
      if (hit) { e.preventDefault(); setTab(hit.id); }
    }
  }, [nextTurn, state.victory.type, state.pendingEvents, pid, showHelp]);
  useEffect(() => { window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onKey]);

  return (
    <div style={{ padding: '20px 28px 40px', maxWidth: 1160, margin: '0 auto', minHeight: '100vh' }}>
      {/* ── Header：国号铭文 + 资源速览 ── */}
      <header style={{ marginBottom: 'var(--space-6)', position: 'relative' }}>
        {/* 金色顶饰线 */}
        <div style={{ position: 'absolute', top: -20, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold) 30%, var(--border-gold) 70%, transparent)', opacity: 0.5 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
          <div>
            <h1 className="ia-display" style={{
              margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--text)',
              letterSpacing: '0.08em', lineHeight: 1,
            }}>
              {player?.name ?? 'Imperium Aeternum'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <span className="ia-display ia-up" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em' }}>
                Anno · {state.turn + 1}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>永恒帝国</span>
              {atWar && <><span style={{ color: 'var(--text-dim)' }}>·</span><span style={{ fontSize: 11, color: 'var(--war)' }}>⚔ 战时</span></>}
              {state.victory.type && <span className={state.victory.type.startsWith('win') ? 'good' : 'danger'} style={{ fontSize: 11 }}>
                {state.victory.type.startsWith('win') ? '🏆 已胜利' : '💀 已陨落'}
              </span>}
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
              {/* P3: 国库净收入小字——从上次年报取，玩家看国库时知道下回合变多少 */}
              {state.lastReport && (() => {
                const r = state.lastReport!;
                const net = r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
                return (
                  <span style={{ fontSize: 10, color: net >= 0 ? 'var(--good)' : 'var(--war)', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }} title="上回合净收入/年">
                    {net >= 0 ? '+' : ''}{Math.round(net)}/年
                  </span>
                );
              })()}
              {/* 日月切换 */}
              <button onClick={toggleTheme} title={`主题：${theme === 'night' ? '暗夜烛火' : theme === 'day' ? '象牙羊皮' : theme === 'bamboo' ? '竹简青简' : '水墨丹青'}（点击切换）`}
                aria-label="切换昼夜主题"
                style={{
                  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                  background: theme === 'night' ? 'radial-gradient(circle at 35% 35%, #3a3220, #14110d)' : theme === 'day' ? 'radial-gradient(circle at 35% 35%, #fdf7e8, #c4b088)' : theme === 'bamboo' ? 'radial-gradient(circle at 35% 35%, #4a5a3e, #1a2412)' : 'radial-gradient(circle at 35% 35%, #e8e0d8, #6a5a4a)',
                  border: `1px solid var(--border-gold)`,
                  color: 'var(--gold)', fontSize: 16, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease', boxShadow: theme === 'night' ? '0 0 12px rgba(201,164,78,0.2)' : '0 0 12px rgba(154,116,48,0.3)',
                }}>
                <span>{theme === 'night' ? '☾' : theme === 'day' ? '☀' : theme === 'bamboo' ? '筠' : '墨'}</span>
              </button>
              {/* P3: 帮助按钮常驻——重显治国引导卡 */}
              <button onClick={() => setShowHelp(true)} title="治国引导"
                style={{
                  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                  background: 'transparent', border: `1px solid var(--border)`,
                  color: 'var(--text-mute)', fontSize: 14, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>?</button>
            </div>
          )}
        </div>
      </header>

      {/* ── Tab 导航：分组 + 图标 + 激活金色下划线 ── */}
      <nav style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
        {TAB_GROUPS.map((g) => (
          <div key={g.group} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span className="ia-up" style={{ fontSize: 9, color: 'var(--text-dim)', marginRight: 2 }}>{g.group}</span>
            {g.tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={tab === t.id ? {
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--gold)', fontWeight: 600, fontSize: 13,
                  padding: '6px 4px', borderBottom: '2px solid var(--gold)',
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
                } : {
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-mute)', fontSize: 13, padding: '6px 4px',
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--text-soft)'; }}
                onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--text-mute)'; }}
                title={`快捷键 ${t.key}`}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
          空格 = 下一回合 · 数字键切换
        </div>
      </nav>

      {/* ── 当前页 ── */}
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
        {tab === 'report' && <TurnReportScreen onContinue={() => setTab(preReportTab)} />}
        {tab === 'chronicle' && <ChronicleScreen />}
        {tab === 'save' && <SaveLoadScreen />}
      </main>

      {state.pendingEvents.some((p) => p.nationId === pid) && <EventModal />}
      <LogToast />

      <footer style={{
        marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)',
        color: 'var(--text-dim)', fontSize: 10, textAlign: 'center', letterSpacing: '0.1em',
      }} className="ia-display ia-up">
        Imperium Aeternum · 永恒帝国 · MVP
      </footer>

      {/* P3: 帮助浮层——点「？」重显治国引导 */}
      {showHelp && (
        <div onClick={() => setShowHelp(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--bg-panel)', borderRadius: 10, padding: 22, maxWidth: 560, width: '90%',
            border: '1px solid var(--border-gold)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div className="ia-display" style={{ fontSize: 16, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
              ✦ 治国之要
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12, color: 'var(--text-soft)' }}>
              <div><span style={{ color: 'var(--gold)' }}>①</span> 看<strong>警报</strong>置顶，红危黄警先处理</div>
              <div><span style={{ color: 'var(--gold)' }}>②</span> 调<strong>税率</strong>（经济页）平衡民心与国库</div>
              <div><span style={{ color: 'var(--gold)' }}>③</span> 建农田<strong>保粮</strong>、建市场<strong>生金</strong></div>
              <div><span style={{ color: 'var(--gold)' }}>④</span> 安抚派系、研发科技稳根基</div>
              <div><span style={{ color: 'var(--gold)' }}>⑤</span> 点<strong>下一回合</strong>或按空格结算</div>
              <div><span style={{ color: 'var(--gold)' }}>⑥</span> 事件弹窗可按 <strong>1/2/3</strong> 键选择</div>
              <div><span style={{ color: 'var(--text-dim)' }}>扩张越大治理越难，永恒之道在于稳</span></div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="ia-btn ia-btn--primary" onClick={() => setShowHelp(false)}>明白了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
