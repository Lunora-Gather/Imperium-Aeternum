// TurnReport v10 — 年报接入帝国总参谋部：年度总结 + 下一阶段路线
import { useGameStore } from '../store/gameStore';
import { Panel, Tag, Btn, Divider } from '../components/ui';
import { buildStrategicBrief, type StrategicItem } from '../gameplay/strategicAdvisor';

const FACTION_LABEL: Record<string, string> = { nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职' };

function adviceTone(level: number): 'good' | 'warn' | 'danger' | 'info' { if (level >= 90) return 'danger'; if (level >= 60) return 'warn'; return 'info'; }
function itemTone(t: string): 'good' | 'warn' | 'danger' | 'info' | 'gold' { return t === 'danger' ? 'danger' : t === 'warn' ? 'warn' : t === 'good' ? 'good' : t === 'gold' ? 'gold' : 'info'; }

export default function TurnReportScreen({ onContinue }: { onContinue?: () => void }) {
  const { state, jumpToTab } = useGameStore();
  const r = state.lastReport;
  if (!r) return <Panel title="回合报告"><p className="dim">尚无报告。点击「下一回合」开始。</p></Panel>;

  const pid = state.playerNationId;
  const player = state.nations[pid];
  const income = r.income.tax + r.income.trade + r.income.building;
  const expense = r.expense.military + r.expense.corruption;
  const net = income - expense;
  const atWar = state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const brief = buildStrategicBrief(state);

  const advice: { title: string; body: string; tab: string; level: number }[] = [];
  if (player) {
    for (const x of brief.urgent.slice(0, 4)) advice.push({ title: x.title, body: x.body, tab: x.tab, level: x.level });
    if (r.worldEvents.some((e) => e.includes('扩张战略') || e.includes('宣战') || e.includes('觊觎'))) advice.push({ title: '关注邻国动向', body: '周边战略或领土野心正在变化，建议查看外交与军事页。', tab: 'diplomacy', level: 72 });
    if (player.resources.sciPt > 250) advice.push({ title: '可推进科技', body: '科研点已有积累，下一步可以解锁建筑、政策或治理效率。', tab: 'tech', level: 42 });
    if (atWar && r.warProgress.length === 0) advice.push({ title: '检查前线', body: '战争中但本年没有明显战果，可能缺前线军队或补给不足。', tab: 'military', level: 70 });
  }
  if (advice.length === 0) advice.push({ title: '局势尚稳', body: '可以按长期目标推进：发展经济、研发科技、扩展外交或准备下一场战争。', tab: 'dashboard', level: 20 });
  advice.sort((a, b) => b.level - a.level);

  const stories: { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] = [];
  if (net > 0) stories.push({ txt: `国库净增 ${Math.round(net)} 金`, tone: 'good' }); else if (net < 0) stories.push({ txt: `国库净减 ${Math.round(-net)} 金`, tone: 'danger' });
  if (r.foodDelta > 0) stories.push({ txt: `粮食增收 ${r.foodDelta}`, tone: 'good' }); else if (r.foodDelta < 0) stories.push({ txt: `粮食减产 ${-r.foodDelta}`, tone: 'warn' });
  if (r.popDelta > 0) stories.push({ txt: `人口增长 +${r.popDelta}`, tone: 'good' });
  if (r.stabilityDelta > 0) stories.push({ txt: `稳定度 +${r.stabilityDelta}`, tone: 'good' }); else if (r.stabilityDelta < 0) stories.push({ txt: `稳定度 ${r.stabilityDelta}`, tone: 'warn' });
  if (r.legitimacyDelta < 0) stories.push({ txt: `合法性 ${r.legitimacyDelta}`, tone: 'warn' });
  if (r.events.length > 0) stories.push({ txt: `发生 ${r.events.length} 起事件`, tone: 'info' });

  return <div>
    <Panel title={`第 ${r.turn} 年 · 年度报告`} accent actions={onContinue ? <Btn label="← 继续治理" variant="primary" onClick={onContinue} /> : undefined}>
      <div style={{ marginBottom: 12 }}>
        <strong style={{ fontSize: 13, color: 'var(--text-mute)' }}>下一年优先级</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginTop: 8 }}>{advice.slice(0, 3).map((a, i) => <button key={i} className="ia-card" onClick={() => jumpToTab(a.tab)} style={{ textAlign: 'left', padding: 10, cursor: 'pointer', border: `1px solid var(--${adviceTone(a.level) === 'danger' ? 'war' : adviceTone(a.level) === 'warn' ? 'warn' : 'border'})` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{a.title}</strong><Tag text={a.level >= 80 ? '紧急' : a.level >= 55 ? '建议' : '规划'} tone={adviceTone(a.level)} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{a.body}</div></button>)}</div>
      </div>

      <Divider label="下一阶段路线" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
        <div className="ia-card" style={{ padding: 10 }}><Tag text={brief.phase} tone={brief.score < 40 ? 'danger' : brief.score < 60 ? 'warn' : 'gold'} /><div style={{ marginTop: 6, fontSize: 12 }}><strong>{brief.doctrine}</strong></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4 }}>{brief.doctrineBody}</div></div>
        {brief.horizon.map((x, i) => <div key={i} className="ia-card" style={{ padding: 10 }}><Tag text={i === 0 ? '今年' : i === 1 ? '三年内' : '长期'} tone={i === 0 && brief.score < 50 ? 'warn' : 'info'} /><div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5 }}>{x}</div></div>)}
      </div>
      {brief.opportunities.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>{brief.opportunities.slice(0, 4).map((x: StrategicItem) => <button key={x.title} className="ia-btn ia-btn--ghost" onClick={() => jumpToTab(x.tab)}><Tag text={x.title} tone={itemTone(x.tone)} /></button>)}</div>}

      <div style={{ marginBottom: 12 }}><strong style={{ fontSize: 13, color: 'var(--text-mute)' }}>今年发生了什么</strong><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>{stories.length === 0 ? <span className="dim">风平浪静的一年</span> : stories.map((s, i) => <Tag key={i} text={s.txt} tone={s.tone} />)}</div></div>
      <Divider label="财政收支" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}><div><strong style={{ fontSize: 13, color: 'var(--good)' }}>收入 +{Math.round(income)}</strong><div style={{ fontSize: 13, marginTop: 6 }}><Row k="税收" v={r.income.tax} /><Row k="贸易" v={r.income.trade} /><Row k="建筑" v={r.income.building} /></div></div><div><strong style={{ fontSize: 13, color: 'var(--war)' }}>支出 −{Math.round(expense)}</strong><div style={{ fontSize: 13, marginTop: 6 }}><Row k="军费" v={-r.expense.military} neg /><Row k="腐败" v={-r.expense.corruption} neg /></div></div></div>
      <div style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-mute)' }}>净收入</span><strong style={{ color: net >= 0 ? 'var(--good)' : 'var(--war)', fontVariantNumeric: 'tabular-nums' }}>{net >= 0 ? '+' : ''}{Math.round(net)} 金</strong></div><Bar value={Math.abs(net)} max={Math.max(100, Math.abs(net) * 1.5)} positive={net >= 0} /></div>
      <Divider label="社会变化" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}><DeltaBox label="粮食" v={r.foodDelta} /><DeltaBox label="人口" v={r.popDelta} /><DeltaBox label="稳定度" v={r.stabilityDelta} /><DeltaBox label="合法性" v={r.legitimacyDelta} /></div>
      {r.events.length > 0 && <><Divider label="事件" /><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>{r.events.map((e, i) => <Tag key={i} text={e} tone="info" />)}</div></>}
      {r.warProgress.length > 0 && <><Divider label="战事进展" /><div className="ia-battle-in" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, padding: 10, background: 'rgba(162,61,40,0.06)', border: '1px solid var(--war)', borderRadius: 6 }}>{r.warProgress.map((w, i) => { const tone = w.outcome === 'advance' ? 'good' : w.outcome === 'repelled' ? 'danger' : 'warn'; const icon = w.outcome === 'advance' ? '▲' : w.outcome === 'repelled' ? '▼' : '◆'; const txt = w.outcome === 'advance' ? `推进 ${w.target}（+${w.progressDelta}%）` : w.outcome === 'repelled' ? `受挫 ${w.target}（${w.progressDelta}%）` : `胶着 ${w.target}（${w.progressDelta >= 0 ? '+' : ''}${w.progressDelta}%）`; return <Tag key={i} text={`${icon} ${txt}`} tone={tone} />; })}</div></>}
      {r.factionDelta.length > 0 && <><Divider label="派系动向" /><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>{r.factionDelta.map((f, i) => { const tone = f.delta > 0 ? 'good' : 'danger'; const label = FACTION_LABEL[f.id] ?? f.id; return <Tag key={i} text={`${label} ${f.delta >= 0 ? '+' : ''}${f.delta}`} tone={tone} />; })}</div></>}
      {r.worldEvents.length > 0 && <><Divider label="天下大势" /><div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, padding: 10, background: 'rgba(42,90,140,0.06)', border: '1px solid var(--border)', borderRadius: 6 }}>{r.worldEvents.map((w, i) => <div key={i} style={{ fontSize: 13, padding: '2px 0' }}>{w}</div>)}</div></>}
      {r.provinceChanges.length > 0 && <><Divider label="疆域变动" /><div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>{r.provinceChanges.map((pc, i) => { const gained = pc.to === state.playerNationId; return <div key={i} style={{ fontSize: 13, color: gained ? 'var(--good)' : 'var(--war)' }}>{gained ? '获得' : '失去'} {pc.name}</div>; })}</div></>}
      {r.warnings.length > 0 && <><Divider label="警告" /><div className="ia-pulse" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--warn)', borderRadius: 6, padding: 10 }}>{r.warnings.map((w, i) => <div key={i} className="warn" style={{ fontSize: 13, padding: '2px 0' }}>⚠ {w}</div>)}</div></>}
    </Panel>
  </div>;
}

function Row({ k, v, neg }: { k: string; v: number; neg?: boolean }) { return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(42,58,90,0.3)' }}><span style={{ color: 'var(--text-mute)' }}>{k}</span><span style={{ fontVariantNumeric: 'tabular-nums', color: neg ? 'var(--war)' : 'var(--good)', fontWeight: 600 }}>{v >= 0 ? '+' : ''}{Math.round(v)}</span></div>; }
function DeltaBox({ label, v }: { label: string; v: number }) { const good = v >= 0; return <div className="ia-card" style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 4 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: good ? 'var(--good)' : 'var(--war)' }}>{good ? '+' : ''}{Math.round(v)}</div></div>; }
function Bar({ value, max, positive }: { value: number; max: number; positive: boolean }) { const pct = Math.max(0, Math.min(100, (value / max) * 100)); return <div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 10, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: positive ? 'var(--good)' : 'var(--war)', transition: 'width 0.3s' }} /></div>; }
