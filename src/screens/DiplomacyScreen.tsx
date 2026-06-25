import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { findRelationExplicit } from '../engine/diplomacy';
import { Panel, Stat, Btn, Tag, Bar } from '../components/ui';
import type { Nation, DiplomaticRelation } from '../types/game';

const TREATY_TONE: Record<string, 'danger' | 'warn' | 'info' | 'good'> = {
  war: 'danger', truce: 'warn', none: 'info', trade: 'good', alliance: 'good',
};
const TREATY_LABEL: Record<string, string> = {
  none: '无', trade: '贸易', alliance: '同盟', war: '战争', truce: '停战',
};
const TREATY_EDGE_COLOR: Record<string, string> = {
  war: 'var(--war)', alliance: 'var(--gold)', trade: 'var(--good)', truce: 'var(--warn)', none: 'var(--border)',
};

// E14: 外交关系网络图——玩家居中，邻国环形布局，边色区分条约
// P3: expand 状态由父组件持有，nodes 由父计算传入
function DiplomacyGraph({ onNodeClick, nodes }: {
  onNodeClick: (nationId: string) => void;
  nodes: { n: Nation; rel: DiplomaticRelation }[];
}) {
  const { state } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];

  const CX = 200, CY = 200, R = 150;
  // 角度：按关系值排，正关系（盟友）放上方，负关系（敌人）放下方
  const sorted = [...nodes].sort((a, b) => (b.rel!.relation) - (a.rel!.relation));
  const angle = (i: number) => (i / Math.max(sorted.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
  const pos = sorted.map((x, i) => ({
    ...x,
    x: CX + R * Math.cos(angle(i)),
    y: CY + R * Math.sin(angle(i)),
  }));

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
      <svg width={400} height={400} viewBox="0 0 400 400" style={{ maxWidth: '100%' }}>
        {/* 边 */}
        {pos.map((p, i) => {
          const treaty = p.rel!.treaty;
          const color = TREATY_EDGE_COLOR[treaty] ?? 'var(--border)';
          const isWar = treaty === 'war';
          return (
            <line key={`e${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke={color} strokeWidth={isWar ? 2 : 1}
              strokeDasharray={isWar ? '4 2' : treaty === 'alliance' ? undefined : '2 3'}
              opacity={0.7} />
          );
        })}
        {/* 玩家节点（居中） */}
        <circle cx={CX} cy={CY} r={14} fill="var(--gold)" stroke="var(--border-hi)" strokeWidth={2} />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize={9} fill="var(--bg)" fontWeight={700}>{player.name.slice(0, 2)}</text>
        {/* 邻国节点 */}
        {pos.map((p, i) => {
          const treaty = p.rel!.treaty;
          const rel = p.rel!.relation;
          const fill = treaty === 'war' ? 'var(--war)' : treaty === 'alliance' ? 'var(--gold)' : treaty === 'trade' ? 'var(--good)' : rel > 30 ? 'var(--stable)' : rel < -30 ? 'var(--war)' : 'var(--bg-inset)';
          return (
            <g key={`n${i}`} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(p.n.id)}>
              <circle cx={p.x} cy={p.y} r={8} fill={fill} stroke="var(--border)" strokeWidth={1} />
              <title>{p.n.name} · 关系 {rel} · {TREATY_LABEL[treaty]}（点击查看）</title>
            </g>
          );
        })}
        {/* 图例 */}
        <g fontSize={9} fill="var(--text-mute)">
          <circle cx={12} cy={12} r={5} fill="var(--gold)" /><text x={22} y={15}>同盟</text>
          <circle cx={60} cy={12} r={5} fill="var(--good)" /><text x={70} y={15}>贸易</text>
          <circle cx={108} cy={12} r={5} fill="var(--war)" /><text x={118} y={15}>战争</text>
          <circle cx={156} cy={12} r={5} fill="var(--bg-inset)" stroke="var(--border)" /><text x={166} y={15}>中立</text>
        </g>
      </svg>
    </div>
  );
}

export default function DiplomacyScreen() {
  const { state, logMsg, espionage, dynasticMarriage, culturalExport, improveRelation, formTrade, formAlliance } = useGameStore();
  // C2: pid/player 用 selector 精确订阅
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const [view, setView] = useState<'list' | 'graph'>('list');
  const [spyTarget, setSpyTarget] = useState<string | null>(null);  // E17: 间谍操作面板选中的目标
  const [focusNation, setFocusNation] = useState<string | null>(null);  // E23: 图谱点击聚焦
  const [graphExpanded, setGraphExpanded] = useState(false);  // P3: 图谱展开全部
  // E23: 聚焦国家卡片滚动+高亮
  useEffect(() => {
    if (focusNation) {
      const el = document.getElementById(`diplo-${focusNation}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => setFocusNation(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [focusNation]);
  const otherNations = Object.values(state.nations).filter((n) => n.id !== pid && !n.defeated);
  // P3: 图谱 nodes 由父计算（避免 DiplomacyGraph 内重复算 + 父拿不到 count）
  const graphSorted = otherNations
    .map((n) => ({ n, rel: findRelationExplicit(pid, n.id, state) }))
    .filter((x) => x.rel && Math.abs(x.rel.relation) > 5)
    .sort((a, b) => Math.abs(b.rel!.relation) - Math.abs(a.rel!.relation));
  const graphNodes = (graphExpanded ? graphSorted : graphSorted.slice(0, 8)) as { n: Nation; rel: DiplomaticRelation }[];
  // E9: 用 Map 索引替代 sort 比较器内 .find（192 国排序 O(n log n) × 1717 relations）
  const sortedNations = [...otherNations].sort((a, b) => {
    const ra = findRelationExplicit(pid, a.id, state);
    const rb = findRelationExplicit(pid, b.id, state);
    return (ra?.relation ?? 0) - (rb?.relation ?? 0);
  });
  // E9: 一次遍历统计条约数（替代三次 .filter）
  let tradeCount = 0, allyCount = 0, warCount = 0;
  for (const r of state.relations) {
    if (r.from !== pid) continue;
    if (r.treaty === 'trade') tradeCount++;
    else if (r.treaty === 'alliance') allyCount++;
    else if (r.treaty === 'war') warCount++;
  }

  const doAct = (target: string, kind: 'improve' | 'trade' | 'alliance') => {
    if (kind === 'improve') improveRelation(target);
    else if (kind === 'trade') formTrade(target);
    else formAlliance(target);
  };

  return (
    <div>
      <Panel title="外交总览" accent actions={
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn label="列表" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')} />
          <Btn label="图谱" variant={view === 'graph' ? 'primary' : 'ghost'} onClick={() => setView('graph')} />
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          <Stat kind="core" accent="var(--stable)" label="影响力" value={player.resources.influence} />
          <Stat kind="core" accent="var(--good)" label="贸易协定" value={tradeCount} />
          <Stat kind="core" accent="var(--border-hi)" label="同盟" value={allyCount} />
          <Stat kind="core" accent="var(--war)" label="战争" value={warCount} />
        </div>
        {view === 'graph' && (
          <div className="ia-fade-in">
            <p className="dim" style={{ fontSize: 11, marginBottom: 8, textAlign: 'center' }}>
              玩家居中，邻国按关系值环形布局。金=同盟 · 绿=贸易 · 红=战争 · 灰=中立。悬停节点看详情。
            </p>
            <DiplomacyGraph onNodeClick={(id) => { setView('list'); setFocusNation(id); }} nodes={graphNodes} />
            {graphSorted.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <button className="ia-btn ia-btn--ghost" onClick={() => setGraphExpanded((x) => !x)} style={{ fontSize: 11 }}>
                  {graphExpanded ? `收起（仅显前 8）` : `展开全部（${graphSorted.length}）`}
                </button>
              </div>
            )}
          </div>
        )}
      </Panel>

      {view === 'list' && (
      <Panel title="各国关系">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {sortedNations.map((n) => {
            const rel = state.relations.find((r) => r.from === pid && r.to === n.id);
            if (!rel) return null;
            const relation = rel.relation;
            const relTone = relation < -30 ? 'danger' : relation < 30 ? 'warn' : 'good';
            const treatyTone = TREATY_TONE[rel.treaty] ?? 'info';
            return (
              <div key={n.id} id={`diplo-${n.id}`} className="ia-card" style={{ padding: 12, border: focusNation === n.id ? '2px solid var(--gold)' : undefined, transition: 'border 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{n.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{n.government.type} · {n.character} · {n.tier}级</div>
                  </div>
                  <Tag text={rel.treaty === 'truce' && rel.truceTurns > 0 ? `${TREATY_LABEL[rel.treaty]} ${rel.truceTurns}回` : TREATY_LABEL[rel.treaty] ?? rel.treaty} tone={treatyTone} />
                </div>
                {/* 三条关系 */}
                <RelBar label="关系" value={relation} tone={relTone} />
                <RelBar label="信任" value={rel.trust} tone={rel.trust > 50 ? 'good' : rel.trust > 20 ? 'warn' : 'danger'} />
                <RelBar label="威胁" value={rel.threat} tone={rel.threat > 50 ? 'danger' : rel.threat > 20 ? 'warn' : 'good'} invert />
                {/* 行动 */}
                <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                  <Btn label="改善 20影" variant="ghost" onClick={() => doAct(n.id, 'improve')} disabled={player.resources.influence < 20} />
                  <Btn label="贸易 30影" variant="ghost" onClick={() => doAct(n.id, 'trade')} disabled={player.resources.influence < 30 || rel.relation < 0} />
                  <Btn label="同盟 50影" variant="ghost" onClick={() => doAct(n.id, 'alliance')} disabled={player.resources.influence < 50 || rel.relation < 50} />
                  <Btn label="联姻 30影80金" variant="ghost" onClick={() => dynasticMarriage(n.id)} disabled={player.resources.influence < 30 || player.resources.gold < 80 || rel.relation < 20 || rel.treaty === 'war'} />
                  <Btn label="文化输出 30科" variant="ghost" onClick={() => culturalExport(n.id)} disabled={player.resources.sciPt < 30 || rel.treaty === 'war'} />
                  <Btn label={spyTarget === n.id ? '✦间谍' : '间谍 40影'} variant={spyTarget === n.id ? 'primary' : 'ghost'} onClick={() => setSpyTarget(spyTarget === n.id ? null : n.id)} disabled={player.resources.influence < 40 || rel.treaty === 'alliance'} />
                </div>
                {/* E17: 间谍操作面板 */}
                {spyTarget === n.id && (
                  <div className="ia-fade-in" style={{ marginTop: 8, padding: 8, background: 'var(--bg-inset)', borderRadius: 6, border: '1px solid var(--war)' }}>
                    <div style={{ fontSize: 11, color: 'var(--war)', fontWeight: 700, marginBottom: 6 }}>⚔ 间谍行动 · 败露则信任骤降</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Btn label="窃取科技" variant="ghost" onClick={() => { espionage(n.id, 'steal_tech'); setSpyTarget(null); }} />
                      <Btn label="煽动叛乱" variant="ghost" onClick={() => { espionage(n.id, 'foment_rebellion'); setSpyTarget(null); }} />
                      <Btn label="刺探军情" variant="ghost" onClick={() => { espionage(n.id, 'spy_military'); setSpyTarget(null); }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
      )}
    </div>
  );
}

function RelBar({ label, value, tone, invert }: { label: string; value: number; tone: 'good' | 'warn' | 'danger'; invert?: boolean }) {
  const v = Math.max(-100, Math.min(100, value));
  const pct = invert ? 100 - Math.max(0, v) : (v + 100) / 2;
  const color = tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--war)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 32px', gap: 6, alignItems: 'center', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{label}</span>
      <div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.25s' }} />
      </div>
      <span style={{ fontSize: 11, textAlign: 'right', color, fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
    </div>
  );
}
