// Stats v2 — 大局诊断 + 趋势图表
import { useGameStore } from '../store/gameStore';
import { Panel, Tag } from '../components/ui';
import { FACTIONS } from '../data/factions';

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
  return <Panel title={label}><svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}><line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" /><path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />{data.map((d, i) => <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={2.5} fill={color} />)}<text x={PAD} y={H - 6} fontSize={9} fill="var(--text-dim)" textAnchor="start">回合 {xMin}</text><text x={W - PAD} y={H - 6} fontSize={9} fill="var(--text-dim)" textAnchor="end">回合 {xMax}</text><text x={4} y={PAD + 4} fontSize={9} fill="var(--text-dim)" textAnchor="start">{yMax.toFixed(0)}{unit}</text><text x={4} y={H - PAD} fontSize={9} fill="var(--text-dim)" textAnchor="start">{yMin.toFixed(0)}{unit}</text></svg></Panel>;
}

function avg(v: number[]) { return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; }
function trend(v: number[]) { if (v.length < 2) return 0; const n = Math.min(5, v.length); const recent = avg(v.slice(-n)); const before = avg(v.slice(Math.max(0, v.length - n * 2), v.length - n)); return recent - before; }

export default function StatsScreen() {
  const { state } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const history = state.history.filter((r) => r.nationId === pid);
  if (history.length === 0) return <Panel title="统计图表"><p className="dim" style={{ padding: 16 }}>尚无回合数据，推进一步后可见趋势。</p></Panel>;

  const goldData = history.map((r) => ({ x: r.turn, y: r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption }));
  const foodData = history.map((r) => ({ x: r.turn, y: r.foodDelta }));
  const popData = history.map((r) => ({ x: r.turn, y: r.popDelta }));
  const stabData = history.map((r) => ({ x: r.turn, y: r.stabilityDelta }));
  const unrestData = history.map((r) => ({ x: r.turn, y: r.unrestDelta }));
  const exhaustData = history.map((r) => ({ x: r.turn, y: r.exhaustSnapshot }));

  const netTrend = trend(goldData.map((d) => d.y));
  const foodTrend = trend(foodData.map((d) => d.y));
  const unrestTrend = trend(unrestData.map((d) => d.y));
  const exhaustTrend = trend(exhaustData.map((d) => d.y));
  const weakestTech = (['agri', 'mil', 'admin', 'culture'] as const).map((b) => ({ b, lv: player.tech[b] })).sort((a, b) => a.lv - b.lv)[0];
  const playerArmy = player.army.reduce((s, a) => s + a.size, 0);
  const aiNations = Object.values(state.nations).filter((n) => !n.isPlayer && !n.defeated);
  const topAi = aiNations.sort((a, b) => b.army.reduce((s, x) => s + x.size, 0) - a.army.reduce((s, x) => s + x.size, 0)).slice(0, 3);
  const topArmy = topAi[0]?.army.reduce((s, a) => s + a.size, 0) ?? 0;
  const labels: Record<string, string> = { agri: '农业', mil: '军事', admin: '行政', culture: '文化' };

  const advice: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info' }[] = [];
  if (netTrend < -20) advice.push({ title: '财政趋势变差', body: '最近几回合净收入下滑，优先检查军费、腐败和税收。', tone: 'warn' });
  if (foodTrend < -30) advice.push({ title: '粮食趋势变差', body: '粮食变化持续恶化，优先农业、农田和开垦。', tone: 'danger' });
  if (unrestTrend > 8) advice.push({ title: '不满上升', body: '社会不满趋势上升，应降低税率、安抚派系或处理高风险省份。', tone: 'warn' });
  if (exhaustTrend > 8) advice.push({ title: '厌战上升', body: '战争压力正在积累，拖久会影响稳定和财政。', tone: 'warn' });
  if (topArmy > playerArmy * 1.5) advice.push({ title: '外部军力压制', body: `${topAi[0]?.name ?? '强国'} 军力明显高于你，避免孤立作战。`, tone: 'danger' });
  if (advice.length === 0) advice.push({ title: '趋势尚稳', body: `当前短板科技为${labels[weakestTech.b]}，可按国运路线补齐。`, tone: 'good' });

  const factions = player.factions;
  const hasFactions = factions.length > 0;
  const FR = 90, FCX = 110, FCY = 100;
  const factionPts = hasFactions ? factions.map((f, i) => { const angle = (i / factions.length) * Math.PI * 2 - Math.PI / 2; const r = (f.satisfaction / 100) * FR; return { x: FCX + Math.cos(angle) * r, y: FCY + Math.sin(angle) * r, label: FACTIONS[f.id]?.name ?? f.id, sat: f.satisfaction }; }) : [];
  const radarPath = factionPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  const maxArmy = Math.max(playerArmy, topArmy || 1, 1);

  return <div>
    <Panel title="大局诊断" accent>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
        {advice.slice(0, 4).map((a) => <Guide key={a.title} {...a} />)}
      </div>
    </Panel>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 'var(--space-4)' }}>
      <LineChart data={goldData} color="var(--gold)" label="国库净收入（金/年）" unit="" />
      <LineChart data={foodData} color="var(--food)" label="粮食变化（粮/年）" unit="" />
      <LineChart data={popData} color="var(--text-soft)" label="人口变化（人/年）" unit="" />
      <LineChart data={stabData} color="var(--stable)" label="稳定度变化" unit="" />
      <LineChart data={unrestData} color="var(--warn)" label="不满度变化" unit="" />
      <LineChart data={exhaustData} color="var(--war)" label="厌战值" unit="" />

      {hasFactions && <Panel title="派系满意度雷达"><svg width={220} height={200} style={{ display: 'block' }}>{[20, 40, 60, 80, 100].map((r) => <circle key={r} cx={FCX} cy={FCY} r={(r / 100) * FR} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.5} />)}<path d={radarPath} fill="var(--accent)" fillOpacity={0.2} stroke="var(--accent)" strokeWidth={1.5} />{factionPts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r={2.5} fill="var(--accent)" /><text x={p.x} y={p.y - 6} fontSize={9} fill="var(--text-mute)" textAnchor="middle">{p.label} {Math.round(p.sat)}</text></g>)}</svg></Panel>}

      <Panel title="军力对比"><div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}><ArmyRow name={player.name} value={playerArmy} max={maxArmy} color="var(--gold)" />{topAi.map((n) => <ArmyRow key={n.id} name={n.name} value={n.army.reduce((s, a) => s + a.size, 0)} max={maxArmy} color="var(--war)" />)}</div></Panel>
      <Panel title="科技进度"><div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>{(['agri', 'mil', 'admin', 'culture'] as const).map((branch) => { const lv = player.tech[branch] || 0; const pct = (lv / 8) * 100; const colors: Record<string, string> = { agri: 'var(--food)', mil: 'var(--war)', admin: 'var(--accent)', culture: 'var(--faith)' }; return <div key={branch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 50, fontSize: 11, color: colors[branch] }}>{labels[branch]}</span><div style={{ flex: 1, height: 12, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}><div style={{ width: `${pct}%`, height: '100%', background: colors[branch] }} /><span style={{ position: 'absolute', right: 4, top: -1, fontSize: 10, color: 'var(--text-soft)' }}>Lv {lv}/8</span></div></div>; })}</div></Panel>
    </div>
  </div>;
}

function Guide({ title, body, tone }: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info' }) {
  return <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{title}</strong><Tag text={tone === 'danger' ? '紧急' : tone === 'warn' ? '注意' : tone === 'good' ? '良好' : '建议'} tone={tone} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{body}</div></div>;
}
function ArmyRow({ name, value, max, color }: { name: string; value: number; max: number; color: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 80, fontSize: 11, color }}>{name}</span><div style={{ flex: 1, height: 14, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color }} /></div><span className="ia-num" style={{ fontSize: 11, color: 'var(--text-soft)', width: 40 }}>{value}</span></div>;
}
