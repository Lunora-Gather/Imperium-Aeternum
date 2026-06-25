// Stats — 统计图表页（E2：50 回合折线，玩家看国家发展趋势）
// 纯 SVG 折线图，零依赖。从 history（最近 10 回合）+ chronicle 取数据。
import { useGameStore } from '../store/gameStore';
import { Panel, Tag } from '../components/ui';
import { FACTIONS } from '../data/factions';

// SVG 折线图组件
function LineChart({ data, color, label, unit }: { data: { x: number; y: number }[]; color: string; label: string; unit: string }) {
  if (data.length < 2) return <Panel title={label}><p className="dim" style={{ padding: 8 }}>数据不足（需 ≥2 回合）</p></Panel>;
  const W = 480, H = 140, PAD = 28;
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 0);
  const yRange = yMax - yMin || 1;
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y - yMin) / yRange) * (H - PAD * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(d.x).toFixed(1)} ${sy(d.y).toFixed(1)}`).join(' ');
  const zeroY = sy(0);
  return (
    <Panel title={label}>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        {/* 零线 */}
        <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
        {/* 折线 */}
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        {/* 数据点 */}
        {data.map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={2.5} fill={color} />
        ))}
        {/* X 轴标签（首末回合） */}
        <text x={PAD} y={H - 6} fontSize={9} fill="var(--text-dim)" textAnchor="start">回合 {xMin}</text>
        <text x={W - PAD} y={H - 6} fontSize={9} fill="var(--text-dim)" textAnchor="end">回合 {xMax}</text>
        {/* Y 轴标签（最大最小） */}
        <text x={4} y={PAD + 4} fontSize={9} fill="var(--text-dim)" textAnchor="start">{yMax.toFixed(0)}{unit}</text>
        <text x={4} y={H - PAD} fontSize={9} fill="var(--text-dim)" textAnchor="start">{yMin.toFixed(0)}{unit}</text>
      </svg>
    </Panel>
  );
}

export default function StatsScreen() {
  const { state } = useGameStore();
  // C2: pid/player 用 selector 精确订阅
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const history = state.history.filter((r) => r.nationId === pid);

  if (history.length === 0) return <Panel title="统计图表"><p className="dim" style={{ padding: 16 }}>尚无回合数据，推进一步后可见趋势。</p></Panel>;

  // 各指标折线数据
  const goldData = history.map((r) => ({ x: r.turn, y: r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption }));
  const foodData = history.map((r) => ({ x: r.turn, y: r.foodDelta }));
  const popData = history.map((r) => ({ x: r.turn, y: r.popDelta }));
  const stabData = history.map((r) => ({ x: r.turn, y: r.stabilityDelta }));
  const unrestData = history.map((r) => ({ x: r.turn, y: r.unrestDelta }));
  const exhaustData = history.map((r) => ({ x: r.turn, y: r.exhaustSnapshot }));

  // 派系满意度雷达（当前快照，非历史）
  const factions = player.factions;
  const hasFactions = factions.length > 0;
  const FR = 90, FCX = 110, FCY = 100;
  const factionPts = hasFactions ? factions.map((f, i) => {
    const angle = (i / factions.length) * Math.PI * 2 - Math.PI / 2;
    const r = (f.satisfaction / 100) * FR;
    return { x: FCX + Math.cos(angle) * r, y: FCY + Math.sin(angle) * r, label: FACTIONS[f.id]?.name ?? f.id, sat: f.satisfaction };
  }) : [];
  const radarPath = factionPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 'var(--space-4)' }}>
      <LineChart data={goldData} color="var(--gold)" label="国库净收入（金/年）" unit="" />
      <LineChart data={foodData} color="var(--food)" label="粮食变化（粮/年）" unit="" />
      <LineChart data={popData} color="var(--text-soft)" label="人口变化（人/年）" unit="" />
      <LineChart data={stabData} color="var(--stable)" label="稳定度变化" unit="" />
      <LineChart data={unrestData} color="var(--warn)" label="不满度变化" unit="" />
      <LineChart data={exhaustData} color="var(--war)" label="厌战值" unit="" />

      {/* 派系满意度雷达 */}
      {hasFactions && (
        <Panel title="派系满意度雷达">
          <svg width={220} height={200} style={{ display: 'block' }}>
            {/* 同心圆（20/40/60/80/100） */}
            {[20, 40, 60, 80, 100].map((r) => (
              <circle key={r} cx={FCX} cy={FCY} r={(r / 100) * FR} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.5} />
            ))}
            {/* 雷达多边形 */}
            <path d={radarPath} fill="var(--accent)" fillOpacity={0.2} stroke="var(--accent)" strokeWidth={1.5} />
            {/* 顶点 + 标签 */}
            {factionPts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={2.5} fill="var(--accent)" />
                <text x={p.x} y={p.y - 6} fontSize={9} fill="var(--text-mute)" textAnchor="middle">{p.label} {p.sat}</text>
              </g>
            ))}
          </svg>
        </Panel>
      )}

      {/* 军力对比条形（玩家 vs 最强 AI） */}
      <Panel title="军力对比">
        {(() => {
          const playerArmy = player.army.reduce((s, a) => s + a.size, 0);
          const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer);
          const topAi = aiNations.sort((a, b) => b.army.reduce((s, a) => s + a.size, 0) - a.army.reduce((s, a) => s + a.size, 0)).slice(0, 3);
          const maxArmy = Math.max(playerArmy, topAi[0]?.army.reduce((s, a) => s + a.size, 0) || 1, 1);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, fontSize: 11, color: 'var(--gold)' }}>{player.name}</span>
                <div style={{ flex: 1, height: 14, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(playerArmy / maxArmy) * 100}%`, height: '100%', background: 'var(--gold)' }} />
                </div>
                <span className="ia-num" style={{ fontSize: 11, color: 'var(--text-soft)', width: 40 }}>{playerArmy}</span>
              </div>
              {topAi.map((n) => {
                const army = n.army.reduce((s, a) => s + a.size, 0);
                return (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 80, fontSize: 11, color: 'var(--text-mute)' }}>{n.name}</span>
                    <div style={{ flex: 1, height: 14, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(army / maxArmy) * 100}%`, height: '100%', background: 'var(--war)' }} />
                    </div>
                    <span className="ia-num" style={{ fontSize: 11, color: 'var(--text-soft)', width: 40 }}>{army}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Panel>

      {/* 科技进度甘特（4 分支当前等级） */}
      <Panel title="科技进度">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
          {(['agri', 'mil', 'admin', 'culture'] as const).map((branch) => {
            const lv = player.tech[branch] || 0;
            const pct = (lv / 8) * 100;
            const labels: Record<string, string> = { agri: '农业', mil: '军事', admin: '行政', culture: '文化' };
            const colors: Record<string, string> = { agri: 'var(--food)', mil: 'var(--war)', admin: 'var(--accent)', culture: 'var(--faith)' };
            return (
              <div key={branch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 50, fontSize: 11, color: colors[branch] }}>{labels[branch]}</span>
                <div style={{ flex: 1, height: 12, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: colors[branch] }} />
                  <span style={{ position: 'absolute', right: 4, top: -1, fontSize: 10, color: 'var(--text-soft)' }}>Lv {lv}/8</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
