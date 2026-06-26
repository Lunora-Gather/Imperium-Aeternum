// Dashboard v25 — 帝国路线图：把总览强面板升级为一条可执行治理路线
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { Panel, Btn, Tag } from '../components/ui';
import type { TurnReport } from '../types/game';
import type { StrategyFocusId } from '../gameplay/strategyFocus';
import { getAmbitionSnapshot } from '../gameplay/ambitions';
import { buildReadinessReport, type ReadinessReport, type ReadinessItem } from '../gameplay/readiness';
import { buildStrategicBrief, type StrategicBrief, type StrategicItem } from '../gameplay/strategicAdvisor';
import { buildTurnReportActions } from '../gameplay/turnReportActions';
import { buildCommandCenterActions, type CommandCenterAction } from '../gameplay/commandCenterActions';
import { buildEmpireRoadmap, type EmpireRoadmap } from '../gameplay/empireRoadmap';

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
function tagTone(t: string): 'danger' | 'warn' | 'good' | 'info' | 'gold' { return t === 'danger' ? 'danger' : t === 'warn' ? 'warn' : t === 'good' ? 'good' : t === 'gold' ? 'gold' : 'info'; }
function actionSourceLabel(source: CommandCenterAction['source']) { return source === 'readiness' ? '体检' : source === 'report' ? '年报' : source === 'strategy' ? '参谋' : '规划'; }
function toneBorder(tone: string) { return tone === 'danger' ? 'var(--war)' : tone === 'warn' ? 'var(--warn)' : tone === 'gold' ? 'var(--gold)' : tone === 'good' ? 'var(--good)' : 'var(--border)'; }

function Metric({ label, value, tone = 'normal', hint }: { label: string; value: string | number; tone?: 'normal' | 'good' | 'warn' | 'danger' | 'gold'; hint?: string }) {
  return <div className={`ia-dash-metric tone-${tone}`}><span>{label}</span><strong>{value}</strong>{hint && <em>{hint}</em>}</div>;
}

function Meter({ label, value, lowBad = false }: { label: string; value: number; lowBad?: boolean }) {
  const pct = clamp(value);
  const danger = lowBad ? pct < 30 : pct > 70;
  const warn = lowBad ? pct < 50 : pct > 50;
  return <div className="ia-dash-meter"><div><span>{label}</span><strong className={danger ? 'danger' : warn ? 'warn' : ''}>{n(pct)}</strong></div><i><b style={{ width: `${pct}%` }} /></i></div>;
}

function ProgressLine({ label, current, target, done, hint }: { label: string; current: string | number; target: string | number; done: boolean; hint?: string }) {
  const curNum = typeof current === 'number' ? current : Number(String(current).split('/')[0]) || 0;
  const targetNum = typeof target === 'number' ? target : Number(String(target).split('/')[0]) || 1;
  const pct = clamp((curNum / Math.max(1, targetNum)) * 100);
  return <div className={`ia-goal-line ${done ? 'is-done' : ''}`}><div><span>{label}</span><strong>{current}/{target}</strong></div><i><b style={{ width: `${done ? 100 : pct}%` }} /></i>{hint && <em>{hint}</em>}</div>;
}

function AmbitionPanel({ state }: { state: ReturnType<typeof useGameStore.getState>['state'] }) {
  const a = getAmbitionSnapshot(state);
  const scaleLabel = a.worldScale === 'world' ? '天下局' : a.worldScale === 'regional' ? '区域局' : '小局';
  return <section className="ia-dash-section ia-ambitions"><header><div><small>Ambition</small><h3>国运目标</h3></div><Tag text={scaleLabel} tone="gold" /></header><div className="ia-goal-list"><ProgressLine label="征服" current={a.conquest.current} target={a.conquest.target} done={a.conquest.done} hint="疆土达标且安定 ≥40" /><ProgressLine label="富国" current={a.economy.current} target={a.economy.target} done={a.economy.done} hint={`连续 ${a.economy.turns}/${a.economy.needTurns} 年`} /><ProgressLine label="合纵" current={a.diplomacy.goodRelations} target={a.diplomacy.goodTarget} done={a.diplomacy.done} hint={`影响力 ${a.diplomacy.influence}/${a.diplomacy.influenceTarget}`} /><ProgressLine label="永恒" current={a.eternal.turns} target={a.eternal.target} done={a.eternal.done} hint="和平、安定、法统维持" /></div></section>;
}

function Sparkline({ data, label }: { data: number[]; label: string }) {
  if (data.length < 2) return <span className="ia-mini-empty">{label}：暂无趋势</span>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 92},${24 - ((v - min) / range) * 22}`).join(' ');
  const last = data[data.length - 1], first = data[0];
  return <div className="ia-dash-spark"><span>{label}</span><svg viewBox="0 0 92 24" preserveAspectRatio="none"><polyline points={points} /></svg><strong className={last >= first ? 'good' : 'danger'}>{last >= first ? '↑' : '↓'}{n(last)}</strong></div>;
}

function FocusPanel({ focus, onChange }: { focus: StrategyFocusId; onChange: (id: StrategyFocusId) => void }) {
  const current = FOCUSES.find((f) => f.id === focus) ?? FOCUSES[0];
  return <section className="ia-dash-section"><header><div><small>Strategy</small><h3>国策焦点</h3></div><Tag text={current.label} tone="gold" /></header><p className="ia-dash-muted">{current.desc}</p><div className="ia-focus-inline">{FOCUSES.map((f) => <button key={f.id} className={f.id === focus ? 'is-active' : ''} onClick={() => onChange(f.id)} title={`${f.desc}\n${f.effect}`}><span>{f.short}</span><em>{f.label}</em></button>)}</div><div className="ia-dash-note">本回合倾向：{current.effect}</div></section>;
}

function RoadmapPanel({ roadmap, jumpToTab }: { roadmap: EmpireRoadmap; jumpToTab: (tab: string) => void }) {
  return <section className="ia-dash-section" style={{ borderColor: toneBorder(roadmap.tone) }}>
    <header><div><small>Roadmap</small><h3>帝国路线图</h3></div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}><Tag text={roadmap.headline} tone={tagTone(roadmap.tone)} /><Tag text={`国势 ${roadmap.score}`} tone={tagTone(roadmap.tone)} /></div></header>
    <div className="ia-card" style={{ padding: 10, marginBottom: 8, borderLeft: `3px solid ${toneBorder(roadmap.tone)}` }}><strong style={{ fontSize: 13 }}>{roadmap.summary}</strong><div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5, lineHeight: 1.55 }}>胜利主线：{roadmap.route.label} · {roadmap.route.hint} · 约 {roadmap.route.progress}%</div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 8, marginBottom: 8 }}>{roadmap.steps.map((s) => <button key={s.id} className={`ia-card tone-${s.tone === 'danger' ? 'danger' : s.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => jumpToTab(s.tab)} style={{ padding: 10, textAlign: 'left', cursor: 'pointer', border: `1px solid ${toneBorder(s.tone)}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{s.title}</strong><Tag text={s.horizon} tone={tagTone(s.tone)} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{s.body}</div></button>)}</div>
    <div className="ia-dash-note"><span className={roadmap.tone === 'danger' ? 'danger' : roadmap.tone === 'warn' ? 'warn' : 'good'}>风险：{roadmap.riskLine}</span> · 机会：{roadmap.opportunityLine}</div>
  </section>;
}

function CommandCenterPanel({ items, jumpToTab }: { items: CommandCenterAction[]; jumpToTab: (tab: string) => void }) {
  const primary = items[0];
  return <section className="ia-dash-section ia-dash-actions" style={{ borderColor: primary?.tone === 'danger' ? 'var(--war)' : primary?.tone === 'warn' ? 'var(--warn)' : 'var(--border)' }}><header><div><small>Command</small><h3>行动中心</h3></div>{primary && <Tag text={actionSourceLabel(primary.source)} tone={primary.tone === 'danger' ? 'danger' : primary.tone === 'warn' ? 'warn' : 'info'} />}</header><div className="ia-action-list">{items.map((a, i) => <button key={`${a.id}-${i}`} className={`tone-${a.tone}`} onClick={() => jumpToTab(a.tab)}><b>{i === 0 ? `优先：${a.label}` : a.label}</b><span>{a.desc}</span></button>)}</div></section>;
}

function RiskPanel({ risks }: { risks: { label: string; value: string; tone: 'warn' | 'danger' | 'good' }[] }) {
  return <section className="ia-dash-section"><header><div><small>Risk</small><h3>风险状态</h3></div></header><div className="ia-risk-list">{risks.length === 0 ? <div className="ia-risk-empty">暂无迫切风险</div> : risks.map((r) => <div key={r.label} className={`tone-${r.tone}`}><span>{r.label}</span><strong>{r.value}</strong></div>)}</div></section>;
}

function ReadinessButton({ item, jumpToTab }: { item: ReadinessItem; jumpToTab: (tab: string) => void }) {
  return <button className={`tone-${item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => item.tab && jumpToTab(item.tab)} disabled={!item.tab}><b>{item.title}</b><span>{item.detail}</span></button>;
}

function ReadinessPanel({ report, jumpToTab }: { report: ReadinessReport; jumpToTab: (tab: string) => void }) {
  const visible = report.advice.length > 0 ? report.advice.slice(0, 4) : [];
  const devWarn = report.devChecks.length;
  return <section className="ia-dash-section" style={{ borderColor: report.tone === 'danger' ? 'var(--war)' : report.tone === 'warn' ? 'var(--warn)' : 'var(--border)' }}>
    <header><div><small>Pre-turn</small><h3>下一回合前检查</h3></div><Tag text={`${report.label} ${report.score}`} tone={tagTone(report.tone)} /></header>
    <div className="ia-goal-line" style={{ marginBottom: 8 }}><div><span>综合健康度</span><strong>{report.score}/100</strong></div><i><b style={{ width: `${report.score}%` }} /></i><em>{report.canAdvance ? '没有硬性阻断，仍建议先处理红黄项' : '存在高危项，推进前请先处理'}</em></div>
    <div className="ia-action-list">{visible.length === 0 ? <div className="ia-risk-empty">暂无阻断项，可以稳步推进。</div> : visible.map((item) => <ReadinessButton key={item.id} item={item} jumpToTab={jumpToTab} />)}</div>
    {devWarn > 0 && <div className="ia-dash-note" style={{ marginTop: 8 }}><span className={report.devChecks.some((x) => x.tone === 'danger') ? 'danger' : 'warn'}>开发体检：{devWarn} 项</span> · {report.devChecks.slice(0, 2).map((x) => x.title).join(' / ')}</div>}
  </section>;
}

function StrategicDirectorPanel({ brief, jumpToTab }: { brief: StrategicBrief; jumpToTab: (tab: string) => void }) {
  const top = brief.urgent[0] ?? brief.opportunities[0];
  return <section className="ia-dash-section" style={{ borderColor: brief.score < 40 ? 'var(--war)' : brief.score < 60 ? 'var(--warn)' : 'var(--border)' }}>
    <header><div><small>Grand Strategy</small><h3>帝国总参谋部</h3></div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}><Tag text={brief.phase} tone={brief.score < 40 ? 'danger' : brief.score < 60 ? 'warn' : 'gold'} /><Tag text={`${brief.scoreLabel} ${Math.round(brief.score)}`} tone={brief.score < 40 ? 'danger' : brief.score < 60 ? 'warn' : 'good'} /></div></header>
    <div className="ia-card" style={{ padding: 10, marginBottom: 8 }}><strong style={{ fontSize: 13 }}>{brief.doctrine}</strong><div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.55 }}>{brief.doctrineBody}</div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 6, marginBottom: 8 }}>{brief.horizon.map((x, i) => <div key={i} className="ia-card" style={{ padding: 8 }}><Tag text={i === 0 ? '今年' : i === 1 ? '三年' : '长期'} tone={i === 0 && brief.score < 45 ? 'warn' : 'info'} /><div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 5 }}>{x}</div></div>)}</div>
    {top && <button className="ia-card" onClick={() => jumpToTab(top.tab)} style={{ width: '100%', padding: 10, textAlign: 'left', cursor: 'pointer', border: `1px solid var(--${top.tone === 'danger' ? 'war' : top.tone === 'warn' ? 'warn' : 'border'})` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{top.title}</strong><Tag text={top.tone === 'danger' ? '最高优先' : top.tone === 'warn' ? '需处理' : '可推进'} tone={tagTone(top.tone)} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{top.body}</div></button>}
  </section>;
}

function AdvisorList({ title, items, empty, jumpToTab }: { title: string; items: StrategicItem[]; empty: string; jumpToTab: (tab: string) => void }) {
  return <section className="ia-dash-section"><header><div><small>Advisor</small><h3>{title}</h3></div></header><div className="ia-action-list">{items.length === 0 ? <div className="ia-risk-empty">{empty}</div> : items.slice(0, 4).map((x, i) => <button key={`${x.title}-${i}`} className={`tone-${x.tone === 'danger' ? 'danger' : x.tone === 'warn' ? 'warn' : 'normal'}`} onClick={() => jumpToTab(x.tab)}><b>{x.title}</b><span>{x.body}</span></button>)}</div></section>;
}

export default function Dashboard() {
  const { state, nextTurn, save, load, hasSave, newGame, log, jumpToTab } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  if (!player) return <Panel title="国政总览"><p className="dim">玩家国家缺失，请读档或开始新局。</p></Panel>;

  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const armySize = player.army.reduce((s, a) => s + a.size, 0);
  const wars = state.wars.filter((w) => w.attackerId === pid || w.defenderId === pid);
  const hist = state.history;
  const g = player.government;
  const focus = (((state as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus) ?? 'balance') as StrategyFocusId;
  const brief = useMemo(() => buildStrategicBrief(state), [state]);
  const readiness = useMemo(() => buildReadinessReport(state), [state]);
  const reportActions = useMemo(() => buildTurnReportActions(state, { brief }), [state, brief]);
  const commandActions = useMemo(() => buildCommandCenterActions(state, 5, { brief, readiness, reportActions }), [state, brief, readiness, reportActions]);
  const roadmap = useMemo(() => buildEmpireRoadmap(state, { brief, readiness, reportActions, commandActions }), [state, brief, readiness, reportActions, commandActions]);

  const lastNet = state.lastReport ? state.lastReport.income.tax + state.lastReport.income.trade + state.lastReport.income.building - state.lastReport.expense.military - state.lastReport.expense.corruption : 0;
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
    if (brief.risks.length > 0) out.push({ label: '参谋风险', value: `${brief.risks.length} 项`, tone: brief.score < 45 ? 'danger' : 'warn' });
    if (out.length === 0) out.push({ label: '秩序', value: '稳定', tone: 'good' });
    return out;
  }, [player.resources.gold, player.resources.food, player.warExhaustion, g.stability, g.legitimacy, g.corruption, unrest.length, brief.risks.length, brief.score]);

  const setFocus = (id: StrategyFocusId) => {
    const action = (useGameStore.getState() as unknown as { setStrategyFocus?: (id: StrategyFocusId) => void }).setStrategyFocus;
    action?.(id);
  };

  const hasPendingEventBlocker = readiness.blockers.some((item) => item.id === 'pending-events');

  return <div className="ia-dashboard">
    <div className="ia-dash-command"><div><small>Overview</small><h2 className="ia-display">国政总览</h2><p>先看帝国路线图，再按行动中心和体检推进回合。</p></div><div className="ia-dash-command-actions"><Btn label="新局" variant="ghost" onClick={newGame} /><Btn label="读档" variant="ghost" onClick={() => load()} disabled={!hasSave()} /><Btn label="存档" variant="ghost" onClick={() => save()} /><Btn label="下一回合 →" variant="primary" onClick={() => nextTurn()} disabled={!!state.victory.type || hasPendingEventBlocker} title={hasPendingEventBlocker ? '先处理待决事件' : readiness.label} /></div></div>
    <div className="ia-dash-grid">
      <aside className="ia-dash-col"><Panel title="国家摘要" icon="◈"><div className="ia-dash-metrics"><Metric label="国库" value={n(player.resources.gold)} tone={player.resources.gold < 0 ? 'danger' : 'gold'} hint={lastNet ? `${lastNet >= 0 ? '+' : ''}${n(lastNet)}/年` : '—'} /><Metric label="粮储" value={n(player.resources.food)} tone={player.resources.food < 0 ? 'danger' : 'good'} /><Metric label="人口" value={n(totalPop)} /><Metric label="疆土" value={`${provs.length} 省`} /><Metric label="军力" value={`${n(armySize)} 卒`} tone={wars.length > 0 ? 'warn' : 'normal'} /><Metric label="战事" value={`${wars.length} 起`} tone={wars.length > 0 ? 'danger' : 'normal'} /></div><div className="ia-dash-sep" /><div className="ia-dash-kv"><span>政体</span><strong>{player.government.type}</strong></div><div className="ia-dash-kv"><span>国性</span><strong>{player.character}</strong></div><div className="ia-dash-kv"><span>统治者</span><strong>{player.ruler.name} · {player.ruler.age}岁</strong></div><div className="ia-dash-kv"><span>盟友倾向</span><strong>{allies} 个高关系对象</strong></div></Panel></aside>
      <main className="ia-dash-main"><RoadmapPanel roadmap={roadmap} jumpToTab={jumpToTab} /><CommandCenterPanel items={commandActions} jumpToTab={jumpToTab} /><StrategicDirectorPanel brief={brief} jumpToTab={jumpToTab} /><ReadinessPanel report={readiness} jumpToTab={jumpToTab} /><section className="ia-dash-section"><header><div><small>State</small><h3>治理指标</h3></div></header><div className="ia-dash-meter-grid"><Meter label="安定" value={g.stability} lowBad /><Meter label="法统" value={g.legitimacy} lowBad /><Meter label="治能" value={g.efficiency} lowBad /><Meter label="腐败" value={g.corruption} /><Meter label="厌战" value={player.warExhaustion} /><Meter label="补给" value={player.resources.supply} lowBad /></div></section><section className="ia-dash-section"><header><div><small>Trend</small><h3>近年趋势</h3></div></header><div className="ia-dash-trends"><Sparkline data={goldTrend} label="财政" /><Sparkline data={foodTrend} label="粮食" /><Sparkline data={stabilityTrend} label="安定" /></div></section>{state.victory.type && <section className="ia-dash-section ia-dash-victory"><h3>{state.victory.type.startsWith('win') ? '万世之业已成' : '社稷倾覆'}</h3><p>第 {state.turn} 年 · {player.name}</p></section>}</main>
      <aside className="ia-dash-col"><AmbitionPanel state={state} /><FocusPanel focus={focus} onChange={setFocus} /><RiskPanel risks={risks} /><AdvisorList title="战略机会" items={brief.opportunities} empty="暂无明确机会" jumpToTab={jumpToTab} /><section className="ia-dash-section"><header><div><small>Chronicle</small><h3>近事</h3></div></header><div className="ia-dash-log">{log.length === 0 ? <p>尚无纪事</p> : log.slice(-6).reverse().map((l, i) => <p key={`${l}-${i}`}>{l}</p>)}</div></section></aside>
    </div>
  </div>;
}
