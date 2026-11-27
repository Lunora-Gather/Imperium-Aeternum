import { registerGovernanceTranslations } from '../i18n/catalogs/governance';
import { localizeReactTree } from '../i18n/reactTree';
registerGovernanceTranslations();
// 世界地图 SVG — 羊皮战略舆图：底纹、国土光晕、首都、悬停情报
import { memo, useCallback, useState, useMemo } from 'react';
import { translate, useI18n, type Locale } from '../i18n';
import { TERRAIN_LABELS, terrainLabel } from '../data/terrain';
import type { Terrain } from '../data/provinces';
import type { Province } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { tradeOffers, tradeRouteById } from '../engine/tradeNetwork';
import { Tag, StatusDot } from '../components/ui';

function nationColor(id: string, isPlayer: boolean): string {
  if (isPlayer) return 'var(--gold)';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 38%, 44%)`;
}

const TERRAIN_COLOR: Record<Terrain, string> = {
  plain: '#7b8f58', hill: '#a88e5a', mountain: '#80644d', coast: '#5f8793', desert: '#c1a15b', forest: '#557a49',
  tundra: '#9ea9a8', jungle: '#366750', swamp: '#657b64', ocean: '#486f96', island: '#a79b67',
};
function terrainColor(terrain: Terrain): string { return TERRAIN_COLOR[terrain] ?? '#8a8370'; }

type MapEntry = { province: Province; name: string; owner: string; search: string };
type Edge = readonly [Province, Province];

export default function WorldMap() {
  const { state, setPendingProvince, jumpToTab } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const { locale } = useI18n();
  const provs = useMemo(() => Object.values(state.provinces), [state.provinces]);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'player' | 'neighbors' | 'risk' | 'routes'>('all');
  const [query, setQuery] = useState('');
  const selectProvince = useCallback((id: string) => {
    setHover(null);
    setSelected(id);
  }, []);

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

  const { edges, frontier } = useMemo(() => {
    const edges: Edge[] = [];
    const frontier = new Set<string>();
    for (const p of provs) {
      for (const id of p.adjacent) {
        const q = state.provinces[id];
        if (!q || id === p.id || (id < p.id && q.adjacent.includes(p.id))) continue;
        edges.push([p, q]);
        if ((p.ownerId === pid) !== (q.ownerId === pid)) {
          frontier.add(p.id);
          frontier.add(q.id);
        }
      }
    }
    return { edges, frontier };
  }, [pid, provs, state.provinces]);
  const tradeEdges = useMemo(() => {
    if (filter !== 'routes' || !player) return [];
    const lines = new Map<string, Edge>();
    const owned = player.activeTradeRoutes.map(r => tradeRouteById(r.routeId));
    for (const def of [...owned, ...tradeOffers(state, player)]) {
      if (!def) continue;
      const [a, b] = def.endpoints.map(id => state.provinces[id]);
      if (a && b && (a.ownerId === pid || b.ownerId === pid)) lines.set(def.endpoints.join(':'), [a, b]);
    }
    return [...lines.values()];
  }, [filter, pid, player, state]);
  const tradePlaces = useMemo(() => new Set(tradeEdges.flatMap(([a, b]) => [a.id, b.id])), [tradeEdges]);
  const entries = useMemo(() => provs.map((province) => {
    const ownerName = state.nations[province.ownerId]?.name ?? '中立省份';
    const terrain = terrainLabel(province.terrain);
    const name = translate(province.name, {}, locale);
    const owner = translate(ownerName, {}, locale);
    const search = [province.name, name, ownerName, owner, province.terrain, terrain, translate(terrain, {}, locale)].join(' ').toLocaleLowerCase();
    return { province, name, owner, search };
  }), [provs, state.nations, locale]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return entries.filter(({ province: p, search }) => {
      if (normalized && !search.includes(normalized)) return false;
      if (filter === 'player') return p.ownerId === pid;
      if (filter === 'neighbors') return frontier.has(p.id);
      if (filter === 'routes') return tradePlaces.has(p.id);
      if (filter === 'risk') return p.ownerId === pid && (p.rebellionRisk >= 45 || p.unrest >= 40 || p.loyalty < 50);
      return true;
    });
  }, [entries, query, filter, pid, frontier, tradePlaces]);
  const visibleIds = useMemo(() => new Set(visible.map(({ province }) => province.id)), [visible]);
  const shownEdges = useMemo(() => (filter === 'routes' ? tradeEdges : edges).filter(([p, q]) => visibleIds.has(p.id) && visibleIds.has(q.id)), [edges, visibleIds, filter, tradeEdges]);
  const armySizes = useMemo(() => {
    const sizes = new Map<string, number>();
    for (const army of player?.army ?? []) {
      if (army.size > 0) sizes.set(army.location, (sizes.get(army.location) ?? 0) + army.size);
    }
    return sizes;
  }, [player?.army]);
  const selectedId = selected && visibleIds.has(selected) ? selected : visible.length === 1 ? visible[0].province.id : '';
  const activeId = hover && visibleIds.has(hover) ? hover : selectedId;
  const activeProv = state.provinces[activeId];
  const activeNation = activeProv && state.nations[activeProv.ownerId];
  const playerCount = useMemo(() => provs.filter((p) => p.ownerId === pid).length, [pid, provs]);
  const capitalCount = useMemo(() => visible.filter(({ province }) => province.isCapital).length, [visible]);

  return localizeReactTree(
    <section className="ia-map-page">
      <header className="ia-map-head">
        <div>
          <div className="ia-up ia-map-kicker">Orbis Terrarum</div>
          <h2 className="ia-display">天下舆图</h2>
          <p>羊皮战略图 · 点为省份，光晕为国土影响，线为道路/边境联系。</p>
        </div>
        <div className="ia-map-controls">
          <input className="ia-input ia-map-search" value={query} onChange={(event) => { setHover(null); setQuery(event.target.value); }} aria-label="搜索地图" placeholder="搜索省份、国家或地形" />
          <button aria-pressed={filter === 'all'} className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>全图</button>
          <button aria-pressed={filter === 'player'} className={filter === 'player' ? 'is-active' : ''} onClick={() => setFilter('player')}>吾土</button>
          <button aria-pressed={filter === 'neighbors'} className={filter === 'neighbors' ? 'is-active' : ''} onClick={() => setFilter('neighbors')}>边境</button>
          <button aria-pressed={filter === 'routes'} className={filter === 'routes' ? 'is-active' : ''} onClick={() => setFilter('routes')}>商路</button>
          <button aria-pressed={filter === 'risk'} className={filter === 'risk' ? 'is-active' : ''} onClick={() => setFilter('risk')}>风险</button>
        </div>
      </header>

      <div className="ia-map-layout">
        <div className="ia-map-atlas">
          <div className="ia-map-compass">N</div>
          <ProvinceAtlas bounds={bounds} visible={visible} edges={shownEdges} trade={filter === 'routes'} pid={pid} armySizes={armySizes}
            selected={selectedId} onPreview={setHover} onSelect={selectProvince} locale={locale} />
        </div>

        <aside className="ia-map-info">
          <div className="ia-map-stat-grid">
            <div><span>显示省份</span><strong>{visible.length}</strong></div>
            <div><span>首都</span><strong>{capitalCount}</strong></div>
            <div><span>吾土</span><strong>{playerCount}</strong></div>
            <div><span>边境点</span><strong>{frontier.size}</strong></div>
          </div>

          {filter === 'routes' && <button className="ia-btn" onClick={() => jumpToTab('economy')}>管理商路</button>}
          <ProvincePicker visible={visible} selected={selectedId} onSelect={selectProvince} locale={locale} />
          {activeProv ? (
            <div className="ia-map-detail">
              <div className="ia-map-detail-head">
                <div>
                  <p className="ia-up">Province Intel</p>
                  <h3 className="ia-display">{activeProv.name}{activeProv.isCapital ? ' ★' : ''}</h3>
                </div>
                <Tag text={activeProv.ownerId === pid ? '吾土' : activeNation?.name ?? '中立省份'} tone={activeProv.ownerId === pid ? 'gold' : 'info'} />
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
              <h3 className="ia-display">{visible.length === 0 ? '没有符合条件的省份' : '选择省份查看详情'}</h3>
              <p>{visible.length === 0 ? '清空搜索或切换地图筛选后继续。' : '点选地图或从列表选省，再选择治理此省。'}</p>
            </div>
          )}

          <div className="ia-map-legend">
            {(Object.keys(TERRAIN_LABELS) as Terrain[]).map((key) => (
              <span key={key}><i style={{ background: terrainColor(key) }} />{terrainLabel(key)}</span>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

type PickerProps = {
  visible: MapEntry[];
  selected: string;
  onSelect: (id: string) => void;
  locale: Locale;
};

const ProvincePicker = memo(function ProvincePicker({ visible, selected, onSelect, locale }: PickerProps) {
  const label = translate('选择省份', {}, locale);
  return <select className="ia-input" aria-label={label} value={selected} disabled={!visible.length}
    onChange={(event) => onSelect(event.target.value)}>
    <option value="">{label}</option>
    {visible.map(({ province, name, owner }) => <option key={province.id} value={province.id}>{name} · {owner}</option>)}
  </select>;
});

type AtlasProps = PickerProps & {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  edges: Edge[];
  trade: boolean;
  pid: string;
  armySizes: Map<string, number>;
  onPreview: (id: string | null) => void;
};

const ProvinceAtlas = memo(function ProvinceAtlas({ bounds, visible, edges, trade, pid, armySizes, selected, onPreview, onSelect, locale }: AtlasProps) {
  const W = Math.max(320, bounds.maxX - bounds.minX);
  const H = Math.max(240, bounds.maxY - bounds.minY);
  return (
    <svg viewBox={`${bounds.minX} ${bounds.minY} ${W} ${H}`} className="ia-world-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="wmParchment" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stopColor="var(--bg-raised)" />
          <stop offset="62%" stopColor="var(--bg-panel)" />
          <stop offset="100%" stopColor="var(--bg-inset)" />
        </radialGradient>
        <filter id="wmGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="wmGrid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M 42 0 L 0 0 0 42" fill="none" stroke="var(--border)" strokeWidth="0.55" />
        </pattern>
        <pattern id="wmTinyDots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="var(--border)" />
        </pattern>
      </defs>

      <rect x={bounds.minX} y={bounds.minY} width={W} height={H} rx="18" fill="url(#wmParchment)" />
      <rect x={bounds.minX} y={bounds.minY} width={W} height={H} fill="url(#wmGrid)" opacity="0.42" />
      <rect x={bounds.minX} y={bounds.minY} width={W} height={H} fill="url(#wmTinyDots)" opacity="0.55" />

      {/* 地缘联系线 */}
      <g className="wm-links">
        {edges.map(([p, q]) => {
          const sameOwner = p.ownerId === q.ownerId;
          const touchesPlayer = p.ownerId === pid || q.ownerId === pid;
          return <line key={`${p.id}-${q.id}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
            stroke={trade ? 'var(--gold)' : touchesPlayer ? 'rgba(184,146,74,0.48)' : sameOwner ? 'rgba(80,72,50,0.42)' : 'rgba(130,90,64,0.22)'}
            strokeDasharray={trade ? '6 3' : undefined} strokeWidth={trade ? 2.5 : touchesPlayer ? 1.25 : sameOwner ? 0.75 : 0.45} />;
        })}
      </g>

      {/* 国土/地形光晕，先铺大块，避免只有零散圆点 */}
      <g className="wm-terrain-halos">
        {visible.map(({ province: p }) => {
          const isPlayer = p.ownerId === pid;
          const isCapital = p.isCapital;
          const haloR = isCapital ? 26 : p.population > 900 ? 20 : p.population > 450 ? 16 : 12;
          return <circle key={`halo-${p.id}`} cx={p.x} cy={p.y} r={haloR}
            fill={isPlayer ? 'var(--gold)' : terrainColor(p.terrain)}
            opacity={isPlayer ? 0.26 : 0.18} filter="url(#wmGlow)" />;
        })}
      </g>

      {/* 省份节点 */}
      <g className="wm-provinces">
        {visible.map(({ province: p, name, owner }, index) => {
          const isPlayer = p.ownerId === pid;
          const isSelected = selected === p.id;
          const isCapital = p.isCapital;
          const r = isCapital ? 8 : (p.population > 800 ? 5.6 : p.population > 420 ? 4.5 : 3.5);
          const armySize = armySizes.get(p.id);
          return (
            <g key={p.id} className="wm-province" role="button" tabIndex={(selected ? isSelected : index === 0) ? 0 : -1}
              aria-label={`${name} · ${owner}`} aria-pressed={isSelected}
              onMouseEnter={() => onPreview(p.id)} onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview(p.id)} onBlur={() => onPreview(null)} onClick={() => onSelect(p.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(p.id);
                } else if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
                  event.preventDefault();
                  const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
                  const next = (index + step + visible.length) % visible.length;
                  onSelect(visible[next].province.id);
                  (event.currentTarget.parentElement?.children[next] as SVGElement | undefined)?.focus();
                }
              }}>
              <circle cx={p.x} cy={p.y} r={r + 4} fill="rgba(24,20,16,0.26)" />
              {isCapital && <circle cx={p.x} cy={p.y} r={r + 7} fill="none" stroke={nationColor(p.ownerId, isPlayer)} strokeWidth={1.2} opacity="0.58" />}
              <circle className="wm-selection-ring" cx={p.x} cy={p.y} r={r + 9} fill="none" stroke="var(--gold)" strokeWidth={1.5} pointerEvents="none" />
              <circle cx={p.x} cy={p.y} r={r}
                fill={terrainColor(p.terrain)}
                stroke={isPlayer ? 'var(--gold)' : isSelected ? 'var(--text)' : nationColor(p.ownerId, false)}
                strokeWidth={isPlayer ? 2 : isSelected ? 1.7 : 0.9}
                style={{ cursor: 'pointer' }} />
              {isCapital && <text x={p.x} y={p.y - r - 10} textAnchor="middle" className="wm-capital-label">{owner.slice(0, 4)}</text>}
              {armySize && (
                <g>
                  <title>{translate('{{count}} 兵', { count: armySize }, locale)}</title>
                  <polygon points={`${p.x},${p.y - r - 7} ${p.x - 5},${p.y - r + 1} ${p.x + 5},${p.y - r + 1}`} fill="var(--war)" stroke="var(--gold)" strokeWidth={0.7} />
                  <text x={p.x} y={p.y - r - 10} textAnchor="middle" fontSize={7} fill="var(--war)" style={{ pointerEvents: 'none' }}>{armySize}</text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
});
