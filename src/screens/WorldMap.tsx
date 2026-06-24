// 世界地图 SVG — 省份色块按归属着色 + 玩家金边高亮 + 点击选省
import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Panel, Tag, StatusDot } from '../components/ui';

// 国家颜色：基于 id hash 生成稳定色，玩家用金色
function nationColor(id: string, isPlayer: boolean): string {
  if (isPlayer) return 'var(--gold)';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 45%, 45%)`;
}

export default function WorldMap() {
  const { state, setPendingProvince, jumpToTab } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = Object.values(state.provinces);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'player' | 'neighbors'>('all');

  // 视口：基于实际坐标范围
  const bounds = useMemo(() => {
    if (provs.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of provs) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
    return { minX: minX - 20, minY: minY - 20, maxX: maxX + 20, maxY: maxY + 20 };
  }, [provs]);

  const playerProvs = provs.filter((p) => p.ownerId === pid);
  const playerNeighborIds = new Set<string>();
  playerProvs.forEach((p) => p.adjacent.forEach((a) => playerNeighborIds.add(a)));

  const visible = provs.filter((p) => {
    if (filter === 'player') return p.ownerId === pid;
    if (filter === 'neighbors') return p.ownerId === pid || playerNeighborIds.has(p.id);
    return true;
  });

  const hoverProv = hover ? state.provinces[hover] : null;
  const hoverNation = hoverProv ? state.nations[hoverProv.ownerId] : null;
  const W = bounds.maxX - bounds.minX;
  const H = bounds.maxY - bounds.minY;

  return (
    <Panel title="天下舆图" icon="⬡" accent actions={
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="ia-btn ia-btn--ghost" onClick={() => setFilter('all')} style={filter === 'all' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>全图</button>
        <button className="ia-btn ia-btn--ghost" onClick={() => setFilter('player')} style={filter === 'player' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>吾土</button>
        <button className="ia-btn ia-btn--ghost" onClick={() => setFilter('neighbors')} style={filter === 'neighbors' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>边境</button>
      </div>
    }>
      <div style={{ background: 'var(--bg-inset)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', border: '1px solid var(--border)' }}>
        <svg viewBox={`${bounds.minX} ${bounds.minY} ${W} ${H}`} style={{ width: '100%', height: 480, display: 'block' }}>
          {/* 海洋底 */}
          <rect x={bounds.minX} y={bounds.minY} width={W} height={H} fill="rgba(74,122,122,0.08)" />
          {/* 省份点 */}
          {visible.map((p) => {
            const isPlayer = p.ownerId === pid;
            const isHover = hover === p.id;
            const r = p.isCapital ? 7 : (p.population > 500 ? 5 : 3.5);
            // E22: 玩家军队位置标记（剑形小三角）
            const playerArmyHere = isPlayer ? player.army.find((a) => a.location === p.id && a.size > 0) : null;
            return (
              <g key={p.id}>
                <circle
                  cx={p.x} cy={p.y} r={r}
                  fill={nationColor(p.ownerId, isPlayer)}
                  stroke={isPlayer ? 'var(--border-gold)' : isHover ? 'var(--text)' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={isPlayer ? 2 : isHover ? 1.5 : 0.8}
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => { if (isPlayer) { setPendingProvince(p.id); jumpToTab('province'); } }}
                />
                {p.isCapital && <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke={nationColor(p.ownerId, isPlayer)} strokeWidth={1} opacity={0.4} />}
                {playerArmyHere && (
                  <g>
                    <title>{`${playerArmyHere.size} 兵`}</title>
                    <polygon
                      points={`${p.x},${p.y - r - 5} ${p.x - 4},${p.y - r + 1} ${p.x + 4},${p.y - r + 1}`}
                      fill="var(--war)" stroke="var(--gold)" strokeWidth={0.6}
                    />
                    <text x={p.x} y={p.y - r - 7} textAnchor="middle" fontSize={7} fill="var(--war)" style={{ pointerEvents: 'none' }}>{playerArmyHere.size}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 悬停信息 */}
      <div style={{ marginTop: 'var(--space-3)', minHeight: 56, display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        {hoverProv && hoverNation ? (
          <div className="ia-card--inset" style={{ padding: 'var(--space-3)', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <strong className="ia-display" style={{ fontSize: 14 }}>{hoverProv.name}{hoverProv.isCapital ? ' ★' : ''}</strong>
              <div style={{ display: 'flex', gap: 4 }}>
                <Tag text={hoverNation.name} tone={hoverProv.ownerId === pid ? 'gold' : 'info'} />
                <Tag text={hoverProv.terrain} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 11.5, color: 'var(--text-mute)' }}>
              <span>人口 <strong className="ia-num" style={{ color: 'var(--text)' }}>{hoverProv.population}</strong></span>
              <span>驻军 <strong className="ia-num" style={{ color: 'var(--text)' }}>{hoverProv.garrison}</strong></span>
              <span>忠诚 <strong className="ia-num" style={{ color: hoverProv.loyalty < 40 ? 'var(--war)' : 'var(--text)' }}>{Math.round(hoverProv.loyalty)}</strong></span>
              <span>不满 <strong className="ia-num" style={{ color: hoverProv.unrest > 50 ? 'var(--warn)' : 'var(--text)' }}>{Math.round(hoverProv.unrest)}</strong></span>
              <span><StatusDot status={hoverProv.rebellionRisk > 70 ? 'danger' : hoverProv.unrest > 50 ? 'warn' : 'good'} />{hoverProv.rebellionRisk > 70 ? '叛乱' : hoverProv.unrest > 50 ? '骚动' : '安定'}</span>
            </div>
          </div>
        ) : (
          <p className="dim" style={{ fontSize: 12, margin: 0 }}>悬停省份查看详情 · 金色为吾土 · 大点为首都 · {visible.length} 省显示中</p>
        )}
      </div>
    </Panel>
  );
}
