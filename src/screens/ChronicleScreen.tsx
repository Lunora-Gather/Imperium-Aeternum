// Chronicle v2 — 编年史判断 + 时间线叙事 + 分类索引
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Panel, Tag, Divider, Btn } from '../components/ui';
import type { ChronicleEntry } from '../types/game';

type ChronicleKind = 'founding' | 'expansion' | 'population' | 'victory' | 'crisis' | 'reform' | 'trade' | 'tech' | 'reign';
const KIND_META: Record<ChronicleKind, { label: string; icon: string; color: string; tone: 'gold' | 'info' | 'warn' | 'danger' | 'good' }> = {
  founding: { label: '开国', icon: '◈', color: 'var(--gold)', tone: 'gold' },
  expansion: { label: '扩张', icon: '⬡', color: 'var(--accent)', tone: 'info' },
  population: { label: '人口', icon: '◯', color: 'var(--text-soft)', tone: 'info' },
  victory: { label: '武功', icon: '⚔', color: 'var(--war)', tone: 'danger' },
  crisis: { label: '危局', icon: '☠', color: 'var(--war)', tone: 'danger' },
  reform: { label: '改革', icon: '⚖', color: 'var(--accent)', tone: 'info' },
  trade: { label: '财赋', icon: '◉', color: 'var(--gold)', tone: 'gold' },
  tech: { label: '科技', icon: '✦', color: 'var(--accent)', tone: 'good' },
  reign: { label: '治世', icon: '✶', color: 'var(--gold)', tone: 'gold' },
};
const KIND_ORDER: ChronicleKind[] = ['founding', 'reign', 'expansion', 'population', 'trade', 'tech', 'reform', 'victory', 'crisis'];

export default function ChronicleScreen() {
  const { state } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const [view, setView] = useState<'timeline' | 'category'>('timeline');
  const chronicle = [...state.chronicle].sort((a, b) => a.turn - b.turn);
  const grouped: Record<string, ChronicleEntry[]> = {};
  for (const c of chronicle) (grouped[c.kind] ??= []).push(c);
  const stats = {
    total: chronicle.length,
    reign: chronicle.filter((c) => c.kind === 'reign').length,
    expansion: chronicle.filter((c) => c.kind === 'expansion').length,
    victory: chronicle.filter((c) => c.kind === 'victory').length,
    crisis: chronicle.filter((c) => c.kind === 'crisis').length,
    reform: chronicle.filter((c) => c.kind === 'reform').length,
    trade: chronicle.filter((c) => c.kind === 'trade').length,
  };
  const recent = chronicle.slice(-5).reverse();
  const crisisRatio = stats.total ? stats.crisis / stats.total : 0;
  const warRatio = stats.total ? stats.victory / stats.total : 0;
  const eraTone = crisisRatio > 0.28 ? 'danger' : warRatio > 0.25 ? 'warn' : stats.reform + stats.trade + stats.reign > stats.victory + stats.crisis ? 'good' : 'info';
  const eraText = crisisRatio > 0.28 ? '危机纪元' : warRatio > 0.25 ? '征伐纪元' : stats.reform >= 3 ? '改革纪元' : stats.trade >= 3 ? '富庶纪元' : '奠基纪元';
  const nextHint = stats.total < 3 ? '继续推进回合，史册会记录开国、扩张、危机和改革。' : stats.crisis > stats.victory ? '危局记录偏多，建议先稳财政、稳定和派系。' : stats.expansion > stats.reign + stats.reform ? '扩张记录偏多，建议补治理、法律和省份稳定。' : '史册结构较稳，可继续按国运目标推进。';

  return <div>
    <Panel title="史册判断" icon="✶" accent actions={<div style={{ display: 'flex', gap: 4 }}><Btn label="时间线" variant={view === 'timeline' ? 'primary' : 'ghost'} onClick={() => setView('timeline')} /><Btn label="分类" variant={view === 'category' ? 'primary' : 'ghost'} onClick={() => setView('category')} /></div>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}><Stat label="总条目" value={stats.total} color="var(--gold)" /><Stat label="治世" value={stats.reign} color="var(--gold)" /><Stat label="扩张" value={stats.expansion} color="var(--accent)" /><Stat label="武功" value={stats.victory} color="var(--war)" /><Stat label="危局" value={stats.crisis} color="var(--war)" /><Stat label="改革" value={stats.reform} color="var(--accent)" /></div>
      <div className="ia-card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><div><Tag text={eraText} tone={eraTone} /><span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-mute)' }}>{player.name} · {player.ruler.name} 治下 · 已历 {state.turn} 年</span></div><div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{nextHint}</div></div>
    </Panel>

    {chronicle.length === 0 ? <Panel title="尚无史载"><p className="dim" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>帝国初立，史册未开。推进回合，开国、扩张、武功、危局诸事将载入史册。</p></Panel> : view === 'timeline' ? <Panel title="帝国时间线"><div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 18, borderLeft: '2px solid var(--border)' }}>{chronicle.map((c, i) => { const meta = KIND_META[c.kind as ChronicleKind] ?? KIND_META.reign; return <div key={`${c.turn}-${i}`} className="ia-card" style={{ padding: 9, position: 'relative' }}><div style={{ position: 'absolute', left: -26, top: 12, width: 12, height: 12, borderRadius: 999, background: meta.color, border: '2px solid var(--bg-panel)' }} /><div style={{ display: 'grid', gridTemplateColumns: '60px 76px 1fr', gap: 8, alignItems: 'start' }}><span style={{ fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>第{c.turn}年</span><Tag text={`${meta.icon} ${meta.label}`} tone={meta.tone} /><div><strong style={{ fontSize: 12, color: 'var(--text-soft)' }}>{c.title}</strong><div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2, lineHeight: 1.5 }}>{c.desc}</div></div></div></div>; })}</div>{recent.length > 0 && <><Divider label="近年摘要" /><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{recent.map((c, i) => <Tag key={i} text={`第${c.turn}年 ${c.title}`} tone={(KIND_META[c.kind as ChronicleKind] ?? KIND_META.reign).tone} />)}</div></>}</Panel> : <Panel title="纪事本末">{KIND_ORDER.map((kind) => { const entries = grouped[kind]; if (!entries || entries.length === 0) return null; const meta = KIND_META[kind]; return <div key={kind} style={{ marginBottom: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><span style={{ color: meta.color, fontSize: 14 }}>{meta.icon}</span><strong className="ia-display" style={{ fontSize: 13, color: meta.color, letterSpacing: '0.05em' }}>{meta.label}</strong><Tag text={`${entries.length}`} tone="info" /></div><div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 20, borderLeft: `2px solid var(--border)` }}>{entries.map((c, i) => <div key={i} className="ia-card" style={{ padding: 8, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 8, alignItems: 'flex-start' }}><span style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>第{c.turn}年</span><div><strong style={{ fontSize: 12, color: 'var(--text-soft)' }}>{c.title}</strong><div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2, lineHeight: 1.5 }}>{c.desc}</div></div></div>)}</div></div>; })}</Panel>}
  </div>;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) { return <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--bg-inset)', borderRadius: 'var(--radius)' }}><div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div><div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div></div>; }
