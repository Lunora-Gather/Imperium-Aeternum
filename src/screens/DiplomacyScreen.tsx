// Diplomacy v4 — 外交判断 + AI 记忆：宿敌、亲近、关注对象
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { findRelationExplicit } from '../engine/diplomacy';
import { Panel, Stat, Btn, Tag } from '../components/ui';
import type { Nation, DiplomaticRelation } from '../types/game';
import { getAIStrategyInfo } from '../gameplay/strategyFocus';

const TREATY_TONE: Record<string, 'danger' | 'warn' | 'info' | 'good'> = { war: 'danger', truce: 'warn', none: 'info', trade: 'good', alliance: 'good' };
const TREATY_LABEL: Record<string, string> = { none: '无', trade: '贸易', alliance: '同盟', war: '战争', truce: '停战' };
const TREATY_EDGE_COLOR: Record<string, string> = { war: 'var(--war)', alliance: 'var(--gold)', trade: 'var(--good)', truce: 'var(--warn)', none: 'var(--border)' };

type Row = { n: Nation; rel: DiplomaticRelation; ai: ReturnType<typeof getAIStrategyInfo> };

function treatyText(rel: DiplomaticRelation) {
  return rel.treaty === 'truce' && rel.truceTurns > 0 ? `${TREATY_LABEL[rel.treaty]} ${rel.truceTurns}回` : TREATY_LABEL[rel.treaty] ?? rel.treaty;
}
function intentTone(kind?: string): 'danger' | 'warn' | 'info' | 'good' {
  if (kind === 'expansion') return 'danger';
  if (kind === 'defense' || kind === 'recovery') return 'warn';
  if (kind === 'trade' || kind === 'research') return 'good';
  return 'info';
}
function memoryLevel(v?: number): 'danger' | 'warn' | 'info' | 'good' {
  const n = v ?? 0;
  if (n >= 75) return 'danger';
  if (n >= 55) return 'warn';
  if (n >= 35) return 'info';
  return 'good';
}

function DiplomacyGraph({ onNodeClick, nodes }: { onNodeClick: (nationId: string) => void; nodes: { n: Nation; rel: DiplomaticRelation }[] }) {
  const { state } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const CX = 200, CY = 200, R = 150;
  const sorted = [...nodes].sort((a, b) => b.rel.relation - a.rel.relation);
  const angle = (i: number) => (i / Math.max(sorted.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
  const pos = sorted.map((x, i) => ({ ...x, x: CX + R * Math.cos(angle(i)), y: CY + R * Math.sin(angle(i)) }));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
      <svg width={400} height={400} viewBox="0 0 400 400" style={{ maxWidth: '100%' }}>
        {pos.map((p, i) => <line key={`e${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={TREATY_EDGE_COLOR[p.rel.treaty] ?? 'var(--border)'} strokeWidth={p.rel.treaty === 'war' ? 2 : 1} strokeDasharray={p.rel.treaty === 'war' ? '4 2' : p.rel.treaty === 'alliance' ? undefined : '2 3'} opacity={0.7} />)}
        <circle cx={CX} cy={CY} r={14} fill="var(--gold)" stroke="var(--border-hi)" strokeWidth={2} />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize={9} fill="var(--bg)" fontWeight={700}>{player?.name.slice(0, 2)}</text>
        {pos.map((p, i) => {
          const treaty = p.rel.treaty;
          const rel = p.rel.relation;
          const fill = treaty === 'war' ? 'var(--war)' : treaty === 'alliance' ? 'var(--gold)' : treaty === 'trade' ? 'var(--good)' : rel > 30 ? 'var(--stable)' : rel < -30 ? 'var(--war)' : 'var(--bg-inset)';
          return <g key={`n${i}`} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(p.n.id)}><circle cx={p.x} cy={p.y} r={8} fill={fill} stroke="var(--border)" strokeWidth={1} /><title>{p.n.name} · 关系 {rel} · {TREATY_LABEL[treaty]}</title></g>;
        })}
      </svg>
    </div>
  );
}

export default function DiplomacyScreen() {
  const { state, espionage, dynasticMarriage, culturalExport, improveRelation, formTrade, formAlliance } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const [view, setView] = useState<'list' | 'graph'>('list');
  const [intelTarget, setIntelTarget] = useState<string | null>(null);
  const [focusNation, setFocusNation] = useState<string | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);

  useEffect(() => {
    if (!focusNation) return;
    const el = document.getElementById(`diplo-${focusNation}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setFocusNation(null), 2000);
    return () => clearTimeout(timer);
  }, [focusNation]);

  const rows: Row[] = Object.values(state.nations)
    .filter((n) => n.id !== pid && !n.defeated)
    .map((n) => ({ n, rel: findRelationExplicit(pid, n.id, state), ai: getAIStrategyInfo(state, n.id) }))
    .filter((x): x is Row => !!x.rel);

  const sortedRows = [...rows].sort((a, b) => (a.rel.treaty === 'war' ? -1000 : 0) - (b.rel.treaty === 'war' ? -1000 : 0) || a.rel.relation - b.rel.relation);
  const graphSorted = rows.filter((x) => Math.abs(x.rel.relation) > 5).sort((a, b) => Math.abs(b.rel.relation) - Math.abs(a.rel.relation));
  const graphNodes = (graphExpanded ? graphSorted : graphSorted.slice(0, 8)).map((x) => ({ n: x.n, rel: x.rel }));

  let tradeCount = 0, allyCount = 0, warCount = 0;
  for (const r of state.relations) if (r.from === pid) { if (r.treaty === 'trade') tradeCount++; else if (r.treaty === 'alliance') allyCount++; else if (r.treaty === 'war') warCount++; }

  const threats = [...rows].filter((x) => x.rel.treaty === 'war' || x.rel.threat >= 45 || x.rel.relation <= -45 || x.ai?.kind === 'expansion' || x.ai?.rivalId === pid).sort((a, b) => (b.rel.threat + (b.ai?.kind === 'expansion' ? 35 : 0) + (b.ai?.rivalId === pid ? 40 : 0)) - (a.rel.threat + (a.ai?.kind === 'expansion' ? 35 : 0) + (a.ai?.rivalId === pid ? 40 : 0))).slice(0, 3);
  const tradeTargets = [...rows].filter((x) => x.rel.treaty === 'none' && x.rel.relation >= 0 && player.resources.influence >= 30).sort((a, b) => b.rel.relation + b.rel.trust + (b.ai?.partnerId === pid ? 30 : 0) - (a.rel.relation + a.rel.trust + (a.ai?.partnerId === pid ? 30 : 0))).slice(0, 3);
  const allianceTargets = [...rows].filter((x) => x.rel.treaty !== 'alliance' && x.rel.relation >= 50 && player.resources.influence >= 50).sort((a, b) => b.rel.relation - a.rel.relation).slice(0, 3);
  const strategicAdvice = threats.length > 0 ? `优先关注 ${threats[0].n.name}：${threats[0].ai?.rivalId === pid ? '已将你视作宿敌' : threats[0].rel.treaty === 'war' ? '已处战争' : threats[0].ai?.kind === 'expansion' ? '有扩张意图' : '威胁偏高'}。` : tradeTargets.length > 0 ? `可先与 ${tradeTargets[0].n.name} 建立贸易，增加长期收益。` : allianceTargets.length > 0 ? `可考虑与 ${allianceTargets[0].n.name} 结盟，稳定周边。` : '当前外交格局较平稳，可积累影响力等待机会。';
  const pick = (id: string) => { setView('list'); setFocusNation(id); };

  return (
    <div>
      <Panel title="外交判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginBottom: 10 }}>
          <div className="ia-card" style={{ padding: 10 }}><Tag text="建议" tone={threats.length ? 'warn' : 'info'} /><div style={{ fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>{strategicAdvice}</div></div>
          <MiniList title="威胁" rows={threats} empty="暂无迫切威胁" tone="danger" onPick={pick} />
          <MiniList title="贸易" rows={tradeTargets} empty="暂无合适贸易对象" tone="good" onPick={pick} />
          <MiniList title="同盟" rows={allianceTargets} empty="暂无可结盟对象" tone="info" onPick={pick} />
        </div>
      </Panel>

      <Panel title="外交总览" accent actions={<div style={{ display: 'flex', gap: 4 }}><Btn label="列表" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')} /><Btn label="图谱" variant={view === 'graph' ? 'primary' : 'ghost'} onClick={() => setView('graph')} /></div>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}><Stat kind="core" accent="var(--stable)" label="影响力" value={player.resources.influence} /><Stat kind="core" accent="var(--good)" label="贸易协定" value={tradeCount} /><Stat kind="core" accent="var(--border-hi)" label="同盟" value={allyCount} /><Stat kind="core" accent="var(--war)" label="战争" value={warCount} /></div>
        {view === 'graph' && <div className="ia-fade-in"><p className="dim" style={{ fontSize: 11, marginBottom: 8, textAlign: 'center' }}>玩家居中，邻国按关系值环形布局。金=同盟 · 绿=贸易 · 红=战争 · 灰=中立。</p><DiplomacyGraph onNodeClick={pick} nodes={graphNodes} />{graphSorted.length > 8 && <div style={{ textAlign: 'center', marginTop: 6 }}><button className="ia-btn ia-btn--ghost" onClick={() => setGraphExpanded((x) => !x)} style={{ fontSize: 11 }}>{graphExpanded ? '收起（仅显前 8）' : `展开全部（${graphSorted.length}）`}</button></div>}</div>}
      </Panel>

      {view === 'list' && <Panel title="各国关系"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>{sortedRows.map(({ n, rel, ai }) => {
        const relTone = rel.relation < -30 ? 'danger' : rel.relation < 30 ? 'warn' : 'good'; const targetText = ai?.targetName ? ` → ${ai.targetName}` : '';
        return <div key={n.id} id={`diplo-${n.id}`} className="ia-card" style={{ padding: 12, border: focusNation === n.id ? '2px solid var(--gold)' : rel.treaty === 'war' ? '1px solid var(--war)' : undefined, transition: 'border 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}><div><strong style={{ fontSize: 14 }}>{n.name}</strong><div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{n.government.type} · {n.character} · {n.tier}级</div></div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{ai && <Tag text={`${ai.label}${targetText}`} tone={intentTone(ai.kind)} />}<Tag text={treatyText(rel)} tone={TREATY_TONE[rel.treaty] ?? 'info'} /></div></div>
          {ai && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}><Tag text={`意图 ${ai.label} ${ai.intensity}/6`} tone={intentTone(ai.kind)} />{ai.rivalName && <Tag text={`宿敌 ${ai.rivalName} ${Math.round(ai.rivalScore ?? 0)}`} tone={memoryLevel(ai.rivalScore)} />}{ai.partnerName && <Tag text={`亲近 ${ai.partnerName} ${Math.round(ai.partnerScore ?? 0)}`} tone="good" />}{ai.watchName && <Tag text={`关注 ${ai.watchName} ${Math.round(ai.watchScore ?? 0)}`} tone="warn" />}</div>}
          <RelBar label="关系" value={rel.relation} tone={relTone} /><RelBar label="信任" value={rel.trust} tone={rel.trust > 50 ? 'good' : rel.trust > 20 ? 'warn' : 'danger'} /><RelBar label="威胁" value={rel.threat} tone={rel.threat > 50 ? 'danger' : rel.threat > 20 ? 'warn' : 'good'} invert />
          <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}><Btn label="改善 20影" variant="ghost" onClick={() => improveRelation(n.id)} disabled={player.resources.influence < 20} /><Btn label="贸易 30影" variant="ghost" onClick={() => formTrade(n.id)} disabled={player.resources.influence < 30 || rel.relation < 0 || rel.treaty === 'war'} /><Btn label="同盟 50影" variant="ghost" onClick={() => formAlliance(n.id)} disabled={player.resources.influence < 50 || rel.relation < 50 || rel.treaty === 'war'} /><Btn label="联姻 30影80金" variant="ghost" onClick={() => dynasticMarriage(n.id)} disabled={player.resources.influence < 30 || player.resources.gold < 80 || rel.relation < 20 || rel.treaty === 'war'} /><Btn label="文化输出 30科" variant="ghost" onClick={() => culturalExport(n.id)} disabled={player.resources.sciPt < 30 || rel.treaty === 'war'} /><Btn label={intelTarget === n.id ? '✦情报' : '情报 40影'} variant={intelTarget === n.id ? 'primary' : 'ghost'} onClick={() => setIntelTarget(intelTarget === n.id ? null : n.id)} disabled={player.resources.influence < 40 || rel.treaty === 'alliance'} /></div>
          {intelTarget === n.id && <div className="ia-fade-in" style={{ marginTop: 8, padding: 8, background: 'var(--bg-inset)', borderRadius: 6, border: '1px solid var(--warn)' }}><div style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 700, marginBottom: 6 }}>情报行动 · 会影响双方信任</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}><Btn label="科技情报" variant="ghost" onClick={() => { espionage(n.id, 'steal_tech'); setIntelTarget(null); }} /><Btn label="地方扰动" variant="ghost" onClick={() => { espionage(n.id, 'foment_rebellion'); setIntelTarget(null); }} /><Btn label="军情观察" variant="ghost" onClick={() => { espionage(n.id, 'spy_military'); setIntelTarget(null); }} /></div></div>}
        </div>;
      })}</div></Panel>}
    </div>
  );
}

function MiniList({ title, rows, empty, tone, onPick }: { title: string; rows: Row[]; empty: string; tone: 'danger' | 'warn' | 'good' | 'info'; onPick: (id: string) => void }) {
  return <div className="ia-card" style={{ padding: 10 }}><Tag text={title} tone={tone} /><div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>{rows.length === 0 ? <span className="dim" style={{ fontSize: 11 }}>{empty}</span> : rows.map((x) => <button key={x.n.id} className="ia-btn" onClick={() => onPick(x.n.id)} style={{ justifyContent: 'space-between', fontSize: 11, padding: '5px 7px' }}><span>{x.n.name}</span><span className="dim">关 {Math.round(x.rel.relation)} · 威 {Math.round(x.rel.threat)}</span></button>)}</div></div>;
}
function RelBar({ label, value, tone, invert }: { label: string; value: number; tone: 'good' | 'warn' | 'danger'; invert?: boolean }) {
  const v = Math.max(-100, Math.min(100, value)); const pct = invert ? 100 - Math.max(0, v) : (v + 100) / 2; const color = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--war)';
  return <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 32px', gap: 6, alignItems: 'center', marginBottom: 3 }}><span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{label}</span><div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 7, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.25s' }} /></div><span style={{ fontSize: 11, textAlign: 'right', color, fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span></div>;
}
