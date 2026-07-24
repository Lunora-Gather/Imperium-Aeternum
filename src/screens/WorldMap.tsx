import { registerGovernanceTranslations } from '../i18n/catalogs/governance';
import { localizeReactTree } from '../i18n/reactTree';
registerGovernanceTranslations();
// 世界地图 SVG — 羊皮战略舆图：底纹、国土光晕、首都、悬停情报
import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Tag, StatusDot } from '../components/ui';

function nationColor(id: string, isPlayer: boolean): string {
  if (isPlayer) return 'var(--gold)';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 38%, 44%)`;
}

const TERRAIN_COLOR: Record<string, string> = {
  plain: '#7b8f58',
  hill: '#a88e5a',
  mountain: '#80644d',
  coast: '#5f8793',
  desert: '#c1a15b',
  forest: '#557a49',
  river: '#6d8fac',
  marsh: '#657b64',
};
const TERRAIN_LABEL: Record<string, string> = {
  plain: '平原', hill: '丘陵', mountain: '山地', coast: '海岸', desert: '沙漠', forest: '森林', river: '河谷', marsh: '湿地',
};
function terrainColor(terrain: string): string { return TERRAIN_COLOR[terrain] ?? '#8a8370'; }
function terrainLabel(terrain: string): string { return TERRAIN_LABEL[terrain] ?? terrain; }

export default function WorldMap() {
  const { state, setPendingProvince, jumpToTab } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = Object.values(state.provinces);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'player' | 'neighbors'>('all');

  const bounds = useMemo(() => {
    if (provs.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 620 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of provs) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX: minX - 60, minY: minY - 60, maxX: maxX + 60, maxY: maxY + 60 };
  }, [provs]);

  const playerProvs = provs.filter((p) => p.ownerId === pid);
  const playerNeighborIds = new Set<string>();
  playerProvs.forEach((p) => p.adjacent.forEach((a) => playerNeighborIds.add(a)));

  const visible = provs.filter((p) => {
    if (filter === 'player') return p.ownerId === pid;
    if (filter === 'neighbors') return p.ownerId === pid || playerNeighborIds.has(p.id);
    return true;
  });
  const visibleIds = new Set(visible.map((p) => p.id));

  const activeId = hover ?? selected;
  const activeProv = activeId ? state.provinces[activeId] : null;
  const activeNation = activeProv ? state.nations[activeProv.ownerId] : null;
  const W = Math.max(320, bounds.maxX - bounds.minX);
  const H = Math.max(240, bounds.maxY - bounds.minY);
  const capitalCount = visible.filter((p) => p.isCapital).length;

  return localizeReactTree(
    <section className="ia-map-page">
      <header className="ia-map-head">
        <div>
          <div className="ia-up ia-map-kicker">Orbis Terrarum</div>
          <h2 className="ia-display">天下舆图</h2>
          <p>羊皮战略图 · 点为省份，光晕为国土影响，线为道路/边境联系。</p>
        </div>
        <div className="ia-map-controls">
          <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>全图</button>
          <button className={filter === 'player' ? 'is-active' : ''} onClick={() => setFilter('player')}>吾土</button>
          <button className={filter === 'neighbors' ? 'is-active' : ''} onClick={() => setFilter('neighbors')}>边境</button>
        </div>
      </header>

      <div className="ia-map-layout">
        <div className="ia-map-atlas">
          <div className="ia-map-compass">N</div>
          <svg viewBox={`${bounds.minX} ${bounds.minY} ${W} ${H}`} className="ia-world-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="wmParchment" cx="50%" cy="42%" r="78%">
                <stop offset="0%" stopColor="rgba(255,248,222,0.42)" />
                <stop offset="62%" stopColor="rgba(201,164,78,0.10)" />
                <stop offset="100%" stopColor="rgba(80,61,35,0.18)" />
              </radialGradient>
              <filter id="wmGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <pattern id="wmGrid" width="42" height="42" patternUnits="userSpaceOnUse">
                <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(90,78,54,0.16)" strokeWidth="0.55" />
              </pattern>
              <pattern id="wmTinyDots" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.7" fill="rgba(90,78,54,0.18)" />
              </pattern>
            </defs>

            <rect x={bounds.minX} y={bounds.minY} width={W} height={H} rx="18" fill="url(#wmParchment)" />
            <rect x={bounds.minX} y={bounds.minY} width={W} height={H} fill="url(#wmGrid)" opacity="0.42" />
            <rect x={bounds.minX} y={bounds.minY} width={W} height={H} fill="url(#wmTinyDots)" opacity="0.55" />

            {/* 地缘联系线 */}
            <g className="wm-links">
              {visible.flatMap((p) => p.adjacent.filter((a) => state.provinces[a] && visibleIds.has(a) && p.id < a).map((a) => {
                const q = state.provinces[a];
                const sameOwner = p.ownerId === q.ownerId;
                const touchesPlayer = p.ownerId === pid || q.ownerId === pid;
                return <line key={`${p.id}-${a}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                  stroke={touchesPlayer ? 'rgba(184,146,74,0.48)' : sameOwner ? 'rgba(80,72,50,0.42)' : 'rgba(130,90,64,0.22)'}
                  strokeWidth={touchesPlayer ? 1.25 : sameOwner ? 0.75 : 0.45} />;
              }))}
            </g>

            {/* 国土/地形光晕，先铺大块，避免只有零散圆点 */}
            <g className="wm-terrain-halos">
              {visible.map((p) => {
                const isPlayer = p.ownerId === pid;
                const isCapital = p.isCapital;
                const haloR = isCapital ? 26 : p.population > 900 ? 20 : p.population > 450 ? 16 : 12;
                return <circle key={`halo-${p.id}`} cx={p.x} cy={p.y} r={haloR}
                  fill={isPlayer ? 'rgba(201,164,78,0.16)' : terrainColor(p.terrain)}
                  opacity={isPlayer ? 0.52 : 0.18} filter="url(#wmGlow)" />;
              })}
            </g>

            {/* 省份节点 */}
            <g className="wm-provinces">
              {visible.map((p) => {
                const isPlayer = p.ownerId === pid;
                const isHover = hover === p.id;
                const isSelected = selected === p.id;
                const isCapital = p.isCapital;
                const r = isCapital ? 8 : (p.population > 800 ? 5.6 : p.population > 420 ? 4.5 : 3.5);
                const playerArmyHere = isPlayer ? player?.army.find((a) => a.location === p.id && a.size > 0) : null;
                return (
                  <g key={p.id} className="wm-province" onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} onClick={() => { setSelected(p.id); if (isPlayer) { setPendingProvince(p.id); } }}>
                    <circle cx={p.x} cy={p.y} r={r + 4} fill="rgba(24,20,16,0.26)" />
                    {isCapital && <circle cx={p.x} cy={p.y} r={r + 7} fill="none" stroke={nationColor(p.ownerId, isPlayer)} strokeWidth={1.2} opacity="0.58" />}
                    {(isHover || isSelected) && <circle cx={p.x} cy={p.y} r={r + 9} fill="none" stroke="var(--gold)" strokeWidth={1.5} opacity="0.9" />}
                    <circle cx={p.x} cy={p.y} r={r}
                      fill={terrainColor(p.terrain)}
                      stroke={isPlayer ? 'var(--gold)' : isHover || isSelected ? 'var(--text)' : nationColor(p.ownerId, false)}
                      strokeWidth={isPlayer ? 2 : isHover || isSelected ? 1.7 : 0.9}
                      style={{ cursor: 'pointer' }} />
                    {isCapital && <text x={p.x} y={p.y - r - 10} textAnchor="middle" className="wm-capital-label">{state.nations[p.ownerId]?.name?.slice(0, 4)}</text>}
                    {playerArmyHere && (
                      <g>
                        <title>{`${playerArmyHere.size} 兵`}</title>
                        <polygon points={`${p.x},${p.y - r - 7} ${p.x - 5},${p.y - r + 1} ${p.x + 5},${p.y - r + 1}`} fill="var(--war)" stroke="var(--gold)" strokeWidth={0.7} />
                        <text x={p.x} y={p.y - r - 10} textAnchor="middle" fontSize={7} fill="var(--war)" style={{ pointerEvents: 'none' }}>{playerArmyHere.size}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="ia-map-info">
          <div className="ia-map-stat-grid">
            <div><span>显示省份</span><strong>{visible.length}</strong></div>
            <div><span>首都</span><strong>{capitalCount}</strong></div>
            <div><span>吾土</span><strong>{playerProvs.length}</strong></div>
            <div><span>边境点</span><strong>{playerNeighborIds.size}</strong></div>
          </div>

          {activeProv && activeNation ? (
            <div className="ia-map-detail">
              <div className="ia-map-detail-head">
                <div>
                  <p className="ia-up">Province Intel</p>
                  <h3 className="ia-display">{activeProv.name}{activeProv.isCapital ? ' ★' : ''}</h3>
                </div>
                <Tag text={activeProv.ownerId === pid ? '吾土' : activeNation.name} tone={activeProv.ownerId === pid ? 'gold' : 'info'} />
              </div>
              <div className="ia-map-tags">
                <span style={{ background: terrainColor(activeProv.terrain) }} />
                <Tag text={terrainLabel(activeProv.terrain)} />
                <Tag text={activeProv.isCapital ? '首都' : '省份'} tone={activeProv.isCapital ? 'gold' : 'info'} />
              </div>
              <div className="ia-map-detail-list">
                <div><span>人口</span><strong>{activeProv.population}</strong></div>
                <div><span>驻军</span><strong>{activeProv.garrison}</strong></div>
                <div><span>忠诚</span><strong className={activeProv.loyalty < 40 ? 'danger' : ''}>{Math.round(activeProv.loyalty)}</strong></div>
                <div><span>不满</span><strong className={activeProv.unrest > 50 ? 'warn' : ''}>{Math.round(activeProv.unrest)}</strong></div>
              </div>
              <div className="ia-map-state-line">
                <StatusDot status={activeProv.rebellionRisk > 70 ? 'danger' : activeProv.unrest > 50 ? 'warn' : 'good'} />
                {activeProv.rebellionRisk > 70 ? '叛乱风险极高' : activeProv.unrest > 50 ? '地方骚动' : '秩序安定'}
              </div>
              {activeProv.ownerId === pid && <button className="ia-btn ia-btn--primary" onClick={() => { setPendingProvince(activeProv.id); jumpToTab('province'); }}>治理此省 →</button>}
            </div>
          ) : (
            <div className="ia-map-detail ia-map-detail--empty">
              <p className="ia-up">Map Guide</p>
              <h3 className="ia-display">悬停省份查看详情</h3>
              <p>金色外圈为吾土，大圆为首都。点击吾土省份可进入省份治理。</p>
            </div>
          )}

          <div className="ia-map-legend">
            {Object.entries(TERRAIN_LABEL).slice(0, 8).map(([key, label]) => (
              <span key={key}><i style={{ background: terrainColor(key) }} />{label}</span>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
