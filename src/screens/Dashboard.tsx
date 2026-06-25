// Dashboard v5 — 三栏总览：国家摘要 / 行动建议 / 风险与国策
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { Panel, Btn, Tag } from '../components/ui';
import type { TurnReport } from '../types/game';
import type { StrategyFocusId } from '../gameplay/strategyFocus';

const FOCUSES: { id: StrategyFocusId; label: string; short: string; desc: string; effect: string }[] = [
  { id: 'balance', label: '均衡', short: '守中', desc: '保留行政弹性，应对不确定局势。', effect: '行政点 +1' },
  { id: 'stability', label: '安民', short: '稳国', desc: '安抚地方，压低内乱风险。', effect: '安定 +1，不满下降' },
  { id: 'prosperity', label: '富国', short: '生财', desc: '优先税源和粮储，适合和平发展。', effect: '金粮增长，腐败略升' },
  { id: 'military', label: '强军', short: '备战', desc: '积累补给和战力，准备扩张。', effect: '补给、士气、训练上升' },
  { id: 'diplomacy', label: '睦邻', short: '合纵', desc: '改善关系，积累影响力。', effect: '影响力 +4，关系略升' },
  { id: 'reform', label: '改革', short: '变法', desc: '推动科研行政，但短期承压。', effect: '科研 +4、行政 +1、安定 -1' },
];

function n(v: number) { return Math.round(v); }
function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

function Metric({ label, value, tone = 'normal', hint }: { label: string; value: string | number; tone?: 'normal' | 'good' | 'warn' | 'danger' | 'gold'; hint?: string }) {
  return (
    <div className={`ia-dash-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <em>{hint}</em>}
    </div>
  );
}

function Meter({ label, value, lowBad = false }: { label: string; value: number; lowBad?: boolean }) {
  const pct = clamp(value);
  const danger = lowBad ? pct < 30 : pct > 70;
  const warn = lowBad ? pct < 50 : pct > 50;
  return (
    <div className="ia-dash-meter">
      <div><span>{label}</span><strong className={danger ? 'danger' : warn ? 'warn' : ''}>{n(pct)}</strong></div>
      <i><b style={{ width: `${pct}%` }} /></i>
    </div>
  );
}

function Sparkline({ data, label }: { data: number[]; label: string }) {
  if (data.length < 2) return <span className="ia-mini-empty">{label}：暂无趋势</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 92},${24 - ((v - min) / range) * 22}`).join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  return (
    <div className="ia-dash-spark">
      <span>{label}</span>
      <svg viewBox="0 0 92 24" preserveAspectRatio="none"><polyline points={points} /></svg>
      <strong className={last >= first ? 'good' : 'danger'}>{last >= first ? '↑' : '↓'}{n(last)}</strong>
    </div>
  );
}

function FocusPanel({ focus, onChange }: { focus: StrategyFocusId; onChange: (id: StrategyFocusId) => void }) {
  const current = FOCUSES.find((f) => f.id === focus) ?? FOCUSES[0];
  return (
    <section className="ia-dash-section">
      <header>
        <div><small>Strategy</small><h3>国策焦点</h3></div>
        <Tag text={current.label} tone="gold" />
      </header>
      <p className="ia-dash-muted">{current.desc}</p>
      <div className="ia-focus-inline">
        {FOCUSES.map((f) => (
          <button key={f.id} className={f.id === focus ? 'is-active' : ''} onClick={() => onChange(f.id)} title={`${f.desc}\n${f.effect}`}>
            <span>{f.short}</span><em>{f.label}</em>
          </button>
        ))}
      </div>
      <div className="ia-dash-note">本回合倾向：{current.effect}</div>
    </section>
  );
}

function ActionSuggestions({ items }: { items: { label: string; desc: string; tone?: 'normal' | 'warn' | 'danger'; onClick: () => void }[] }) {
  return (
    <section className="ia-dash-section ia-dash-actions">
      <header><div><small>Priority</small><h3>建议行动</h3></div></header>
      <div className="ia-action-list">
        {items.map((a, i) => (
          <button key={`${a.label}-${i}`} className={`tone-${a.tone ?? 'normal'}`} onClick={a.onClick}>
            <b>{a.label}</b><span>{a.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RiskPanel({ risks }: { risks: { label: string; value: string; tone: 'warn' | 'danger' | 'good' }[] }) {
  return (
    <section className="ia-dash-section">
      <header><div><small>Risk</small><h3>风险状态</h3></div></header>
      <div className="ia-risk-list">
        {risks.length === 0 ? <div className="ia-risk-empty">暂无迫切风险</div> : risks.map((r) => (
          <div key={r.label} className={`tone-${r.tone}`}><span>{r.label}</span><strong>{r.value}</strong></div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { state, nextTurn, save, load, hasSave, newGame, log, jumpToTab } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const armySize = player.army.reduce((s, a) => s + a.size, 0);
  const wars = state.wars.filter((w) => w.attackerId === pid || w.defenderId === pid);
  const hist = state.history;
  const g = player.government;
  const focus = (((state as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus) ?? 'balance') as StrategyFocusId;

  const lastNet = state.lastReport
    ? state.lastReport.income.tax + state.lastReport.income.trade + state.lastReport.income.building - state.lastReport.expense.military - state.lastReport.expense.corruption
    : 0;
  const unrest = provs.filter((p) => p.rebellionRisk > 70 || p.unrest > 50);
  const relations = state.relations.filter((r) => r.from === pid);
  const allies = relations.filter((r) => r.relation >= 70).length;
  const goldTrend = hist.map((r: TurnReport) => r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption);
  const foodTrend = hist.map((r: TurnReport) => r.foodDelta);
  const stabilityTrend = hist.map((r: TurnReport) => r.stabilityDelta);

  const risks = useMemo(() => {
    const out: { label: string; value: string; tone: 'warn' | 'danger' | 'good' }[] = [];
    if (player.resources.gold < 0) out.push({ label: '国库赤字', value: `${n(player.resources.gold)}`, tone: 'danger' });
    if (player.resources.food < 0) out.push({ label: '粮储告竭', value: `${n(player.resources.food)}`, tone: 'danger' });
    if (g.stability < 30) out.push({ label: '安定危殆', value: `${n(g.stability)}`, tone: 'danger' });
    if (g.legitimacy < 35) out.push({ label: '法统不足', value: `${n(g.legitimacy)}`, tone: 'warn' });
    if (g.corruption > 50) out.push({ label: '腐败偏高', value: `${n(g.corruption)}`, tone: 'warn' });
    if (player.warExhaustion > 50) out.push({ label: '厌战偏高', value: `${n(player.warExhaustion)}`, tone: 'warn' });
    if (unrest.length > 0) out.push({ label: '骚动省份', value: `${unrest.length} 省`, tone: unrest.length >= 3 ? 'danger' : 'warn' });
    if (out.length === 0) out.push({ label: '秩序', value: '稳定', tone: 'good' });
    return out;
  }, [player.resources.gold, player.resources.food, player.warExhaustion, g.stability, g.legitimacy, g.corruption, unrest.length]);

  const actions = useMemo(() => {
    const out: { label: string; desc: string; tone?: 'normal' | 'warn' | 'danger'; onClick: () => void }[] = [];
    if (player.resources.gold < 0 || lastNet < 0) out.push({ label: '修正财政', desc: '去经济页调整税率或增加收入。', tone: player.resources.gold < 0 ? 'danger' : 'warn', onClick: () => jumpToTab('economy') });
    if (player.resources.food < 0) out.push({ label: '保粮', desc: '优先建设农田或降低消耗。', tone: 'danger', onClick: () => jumpToTab('province') });
    if (g.stability < 45 || unrest.length > 0) out.push({ label: '安抚地方', desc: '处理不满、叛乱风险和派系压力。', tone: g.stability < 30 ? 'danger' : 'warn', onClick: () => jumpToTab('province') });
    if (player.resources.sciPt >= 20 || player.resources.adminPt >= 3) out.push({ label: '推进科技/政策', desc: '有资源可用于长期建设。', onClick: () => jumpToTab('tech') });
    if (wars.length > 0 || player.warExhaustion > 35) out.push({ label: '检查战事', desc: '查看军队、补给、厌战和战线。', tone: player.warExhaustion > 50 ? 'warn' : 'normal', onClick: () => jumpToTab('military') });
    if (out.length < 3) out.push({ label: '发展省份', desc: '选择核心省份建设经济基础。', onClick: () => jumpToTab('province') });
    if (out.length < 4) out.push({ label: '经营外交', desc: '改善关系，准备贸易或联盟。', onClick: () => jumpToTab('diplomacy') });
    return out.slice(0, 5);
  }, [player.resources.gold, player.resources.food, player.resources.sciPt, player.resources.adminPt, player.warExhaustion, lastNet, g.stability, unrest.length, wars.length, jumpToTab]);

  const setFocus = (id: StrategyFocusId) => {
    const action = (useGameStore.getState() as unknown as { setStrategyFocus?: (id: StrategyFocusId) => void }).setStrategyFocus;
    action?.(id);
  };

  return (
    <div className="ia-dash">
      <div className="ia-dash-command">
        <div>
          <small>Overview</small>
          <h2 className="ia-display">国政总览</h2>
          <p>先处理红色风险，再选择国策方向，最后推进回合。</p>
        </div>
        <div className="ia-dash-command-actions">
          <Btn label="新局" variant="ghost" onClick={newGame} />
          <Btn label="读档" variant="ghost" onClick={() => load()} disabled={!hasSave()} />
          <Btn label="存档" variant="ghost" onClick={() => save()} />
          <Btn label="下一回合 →" variant="primary" onClick={() => nextTurn()} disabled={!!state.victory.type} />
        </div>
      </div>

      <div className="ia-dash-grid">
        <aside className="ia-dash-col">
          <Panel title="国家摘要" icon="◈">
            <div className="ia-dash-metrics">
              <Metric label="国库" value={n(player.resources.gold)} tone={player.resources.gold < 0 ? 'danger' : 'gold'} hint={lastNet ? `${lastNet >= 0 ? '+' : ''}${n(lastNet)}/年` : '—'} />
              <Metric label="粮储" value={n(player.resources.food)} tone={player.resources.food < 0 ? 'danger' : 'good'} />
              <Metric label="人口" value={n(totalPop)} />
              <Metric label="疆土" value={`${provs.length} 省`} />
              <Metric label="军力" value={`${n(armySize)} 卒`} tone={wars.length > 0 ? 'warn' : 'normal'} />
              <Metric label="战事" value={`${wars.length} 起`} tone={wars.length > 0 ? 'danger' : 'normal'} />
            </div>
            <div className="ia-dash-sep" />
            <div className="ia-dash-kv"><span>政体</span><strong>{player.government.type}</strong></div>
            <div className="ia-dash-kv"><span>国性</span><strong>{player.character}</strong></div>
            <div className="ia-dash-kv"><span>统治者</span><strong>{player.ruler.name} · {player.ruler.age}岁</strong></div>
            <div className="ia-dash-kv"><span>盟友倾向</span><strong>{allies} 个高关系对象</strong></div>
          </Panel>
        </aside>

        <main className="ia-dash-main">
          <ActionSuggestions items={actions} />
          <section className="ia-dash-section">
            <header><div><small>State</small><h3>治理指标</h3></div></header>
            <div className="ia-dash-meter-grid">
              <Meter label="安定" value={g.stability} lowBad />
              <Meter label="法统" value={g.legitimacy} lowBad />
              <Meter label="治能" value={g.efficiency} lowBad />
              <Meter label="腐败" value={g.corruption} />
              <Meter label="厌战" value={player.warExhaustion} />
              <Meter label="补给" value={player.resources.supply} lowBad />
            </div>
          </section>

          <section className="ia-dash-section">
            <header><div><small>Trend</small><h3>近年趋势</h3></div></header>
            <div className="ia-dash-trends">
              <Sparkline data={goldTrend} label="财政" />
              <Sparkline data={foodTrend} label="粮食" />
              <Sparkline data={stabilityTrend} label="安定" />
            </div>
          </section>

          {state.victory.type && (
            <section className="ia-dash-section ia-dash-victory">
              <h3>{state.victory.type.startsWith('win') ? '万世之业已成' : '社稷倾覆'}</h3>
              <p>第 {state.turn} 年 · {player.name}</p>
            </section>
          )}
        </main>

        <aside className="ia-dash-col">
          <FocusPanel focus={focus} onChange={setFocus} />
          <RiskPanel risks={risks} />
          <section className="ia-dash-section">
            <header><div><small>Chronicle</small><h3>近事</h3></div></header>
            <div className="ia-dash-log">
              {log.length === 0 ? <p>尚无纪事</p> : log.slice(-6).reverse().map((l, i) => <p key={`${l}-${i}`}>{l}</p>)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
