// Dashboard v4 — 视觉标杆：核心指标铭文卡 + 治理仪表 + 警报置顶 + 国是摘要 + E10 趋势图
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { Panel, Stat, StatRow, Btn, Tag, Divider } from '../components/ui';
import type { TurnReport } from '../types/game';

// E10: sparkline 迷你趋势图
function Sparkline({ data, color, label }: { data: number[]; color: string; label: string }) {
  if (data.length < 2) return <span className="dim" style={{ fontSize: 10 }}>{label}: 数据不足</span>;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const last = data[data.length - 1];
  const first = data[0];
  const trend = last >= first ? '↑' : '↓';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 24 }}>{label}</span>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{trend}{Math.round(last)}</span>
    </div>
  );
}

// P1 杆组仪表盘——五根杆当前刻度 + 阻尼警告
// 让玩家直观看到自己拉杆的代价，体现“扩张越大治理越难”
import type { Nation, Province, GameState } from '../types/game';
import { overExtensionPenalty, maxManageableProvinces } from '../engine/politics';

interface LeverDef {
  name: string; icon: string; color: string;
  load: number;          // 当前负重 0-100（越高越危险）
  damping: string;       // 阻尼来源描述
  threshold: number;     // 阻尼触发阈值
}

function LeverBar({ def }: { def: LeverDef }) {
  const { name, icon, color, load, damping, threshold } = def;
  const safeLoad = Math.max(0, Math.min(100, load));
  const isOver = safeLoad >= threshold;
  const isWarn = safeLoad >= threshold * 0.7;
  const tone = isOver ? 'var(--war)' : isWarn ? 'var(--warn)' : 'var(--good)';
  const status = isOver ? '阻尼' : isWarn ? '接近' : '安全';
  return (
    <div className={`ia-lever ${isOver ? 'is-over' : isWarn ? 'is-warn' : 'is-safe'}`}>
      <div className="ia-lever-head">
        <span className="ia-lever-name" style={{ color }}>{icon} {name}</span>
        <span className="ia-lever-value" style={{ color: tone }}>{Math.round(safeLoad)} / 100 · {status}</span>
      </div>
      <div className="ia-lever-track" aria-label={`${name}负重 ${Math.round(safeLoad)}`}>
        <div className="ia-lever-fill" style={{ width: `${safeLoad}%`, background: `linear-gradient(90deg, ${color}, ${tone})` }} />
        <div className="ia-lever-threshold" style={{ left: `${threshold}%` }}>
          <span>{threshold}</span>
        </div>
        {isOver && <div className="ia-lever-danger" style={{ left: `${threshold}%` }} />}
      </div>
      <div className="ia-lever-foot">
        <span>阈值 {threshold}</span>
        <span>{isOver ? damping : isWarn ? '接近阈值，下一步扩张/改革需谨慎' : '当前负重可控'}</span>
      </div>
    </div>
  );
}

function LeverGauge({ player, provs, state }: { player: Nation; provs: Province[]; state: GameState }) {
  const overExt = overExtensionPenalty(player, provs.length);
  const maxProv = maxManageableProvinces(player);
  const playerRels = state.relations.filter((r) => r.from === player.id || r.to === player.id);
  const maxThreat = playerRels.length > 0 ? Math.max(...playerRels.map((r) => r.threat ?? 0)) : 0;
  const tradeDep = player.activeTradeRoutes.length * 8;
  const levers: LeverDef[] = [
    { name: '财政', icon: '①', color: 'var(--gold)', load: player.government.corruption, damping: '腐败吞收入：tax × corruption/100', threshold: 60 },
    { name: '军事', icon: '②', color: 'var(--war)', load: player.warExhaustion, damping: '厌战→兵变 + 和约割让/赔款', threshold: 70 },
    { name: '扩张', icon: '③', color: 'var(--good)', load: Math.min(100, provs.length > maxProv ? (provs.length - maxProv) * 15 + 50 : 50), damping: `行政超载：${provs.length}/${maxProv} 省，稳定 -${Math.round(overExt.stabilityLoss)}`, threshold: 70 },
    { name: '改革', icon: '④', color: 'var(--accent)', load: player.activePolicies.filter((p) => state.turn - p.enactedTurn < 3).length * 25 + player.activeLaws.filter((l) => state.turn - l.enactedTurn < 3).length * 20, damping: '派系反弹 + 改革冲击（3 回合内稳定 -）', threshold: 60 },
    { name: '外交', icon: '⑤', color: '#8e24aa', load: Math.max(maxThreat, tradeDep), damping: '联军反制：≥3 邻国抵制则稳定 -5/合法性 -3', threshold: 70 },
  ];
  return (
    <div className="ia-lever-panel">
      <div className="ia-lever-panel-head">
        <div>
          <div className="ia-up">五根杆仪表</div>
          <p>负重越高，行动代价越重；超过阈值会触发阻尼。</p>
        </div>
        <Tag text="实时" tone="gold" />
      </div>
      <div className="ia-lever-grid">
        {levers.map((l) => <LeverBar key={l.name} def={l} />)}
      </div>
    </div>
  );
}

// P1 胜利进度条组件
function WinProgress({ label, cur, need, extra, ok, color }: { label: string; cur: number; need: number; extra: string; ok: boolean; color: string }) {
  const pct = Math.min(100, (cur / need) * 100);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 90px', gap: 'var(--space-2)', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: ok ? 'var(--good)' : color }}>{ok ? '✓' : '○'} {label}</span>
      <div style={{ position: 'relative', height: 10, background: 'var(--bg-inset)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color, opacity: ok ? 1 : 0.6, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'right' }}>{cur}/{need} · {extra}</span>
    </div>
  );
}

export default function Dashboard() {
  const { state, nextTurn, save, load, hasSave, newGame, log, setPendingProvince, jumpToTab } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const armySize = player.army.reduce((s, a) => s + a.size, 0);
  const warCount = state.wars.filter((w) => w.attackerId === pid || w.defenderId === pid).length;
  const g = player.government;
  const hist = state.history;

  const goldTrend = hist.map((r: TurnReport) => r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption);
  const foodTrend = hist.map((r: TurnReport) => r.foodDelta);
  const stabTrend = hist.map((r: TurnReport) => r.stabilityDelta);
  const popTrend = hist.map((r: TurnReport) => r.popDelta);
  const warTrend = hist.map((r: TurnReport) => r.warProgress.reduce((s, w) => s + w.progressDelta, 0));
  const exhaustTrend = hist.map((r: TurnReport) => r.exhaustSnapshot);

  const alerts: { txt: string; tone: 'danger' | 'warn' }[] = [];
  if (player.resources.gold < 0) alerts.push({ txt: `国库赤字 ${Math.round(player.resources.gold)}`, tone: 'danger' });
  if (player.resources.food < 0) alerts.push({ txt: `粮储告竭 ${Math.round(player.resources.food)}`, tone: 'danger' });
  if (g.stability < 30) alerts.push({ txt: `安定危殆 ${Math.round(g.stability)}`, tone: 'danger' });
  if (g.legitimacy < 30) alerts.push({ txt: `法统动摇 ${Math.round(g.legitimacy)}`, tone: 'warn' });
  if (g.corruption > 50) alerts.push({ txt: `吏治败坏 ${Math.round(g.corruption)}`, tone: 'warn' });
  if (player.warExhaustion > 50) alerts.push({ txt: `民疲于战 ${Math.round(player.warExhaustion)}`, tone: 'warn' });
  const unrestProv = provs.filter((p) => p.rebellionRisk > 70 || p.unrest > 50);
  if (unrestProv.length > 0) alerts.push({ txt: `${unrestProv.length} 省骚动`, tone: 'warn' });

  const crisisLevel: 'none' | 'warn' | 'critical' = (() => {
    const dangerCount = alerts.filter((a) => a.tone === 'danger').length;
    if (g.stability < 20 || dangerCount >= 3) return 'critical';
    if (g.stability < 30 || dangerCount >= 1) return 'warn';
    return 'none';
  })();

  let deficitStreak = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    const r = hist[i];
    const net = r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
    if (net < 0) deficitStreak++; else break;
  }

  const failWarns: { txt: string; turnsLeft: number }[] = [];
  if (state.bankruptTurns >= 1) failWarns.push({ txt: `国库破产 ${state.bankruptTurns} 年`, turnsLeft: 3 - state.bankruptTurns });
  if (state.lowStabilityTurns >= 1) failWarns.push({ txt: `安定崩落 ${state.lowStabilityTurns} 年`, turnsLeft: 3 - state.lowStabilityTurns });
  if (g.legitimacy <= 10) failWarns.push({ txt: `法统仅余 ${Math.round(g.legitimacy)}`, turnsLeft: 1 });
  const nearSplit = provs.filter((p) => p.rebellionRisk > 80).length;
  if (nearSplit >= 3) failWarns.push({ txt: `${nearSplit} 省叛乱临界`, turnsLeft: 1 });
  failWarns.sort((a, b) => a.turnsLeft - b.turnsLeft);

  return (
    <div>
      {state.turn === 0 && (
        <div className="ia-fade-in" style={{
          background: 'linear-gradient(90deg, rgba(201,164,78,0.10), rgba(122,154,62,0.06))',
          border: '1px solid var(--border-gold)', borderRadius: 'var(--radius)',
          padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-4)',
        }}>
          <div className="ia-display" style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>
            ✦ 治国之要
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', fontSize: 12, color: 'var(--text-soft)' }}>
            <div><span style={{ color: 'var(--gold)' }}>①</span> 看<strong>警报</strong>置顶，红危黄警先处理</div>
            <div><span style={{ color: 'var(--gold)' }}>②</span> 调<strong>税率</strong>（经济页）平衡民心与国库</div>
            <div><span style={{ color: 'var(--gold)' }}>③</span> 建农田<strong>保粮</strong>、建市场<strong>生金</strong></div>
            <div><span style={{ color: 'var(--gold)' }}>④</span> 安抚派系、研发科技稳根基</div>
            <div><span style={{ color: 'var(--gold)' }}>⑤</span> 点<strong>下一回合</strong>或按空格结算</div>
            <div><span style={{ color: 'var(--text-dim)' }}>扩张越大治理越难，永恒之道在于稳</span></div>
          </div>
        </div>
      )}

      {crisisLevel !== 'none' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 50,
          boxShadow: crisisLevel === 'critical'
            ? 'inset 0 0 60px rgba(162,61,40,0.45), inset 0 0 120px rgba(162,61,40,0.2)'
            : 'inset 0 0 40px rgba(201,120,40,0.3)',
          animation: crisisLevel === 'critical' ? 'ia-crisis-pulse 1.8s ease-in-out infinite' : 'none',
        }} />
      )}

      {failWarns.length > 0 && (
        <div className="ia-fade-in" style={{
          background: 'linear-gradient(90deg, rgba(162,61,40,0.35), rgba(162,61,40,0.18))',
          border: '2px solid var(--war)', borderRadius: 'var(--radius)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-3)',
          display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center',
          animation: 'ia-pulse 1s ease-in-out infinite',
        }}>
          <span className="ia-display" style={{ color: 'var(--war)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em' }}>☠ 倾覆在即</span>
          {failWarns.map((w, i) => <Tag key={i} text={`${w.txt} · 仅余 ${w.turnsLeft} 年`} tone="danger" />)}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="ia-fade-in" style={{
          background: crisisLevel === 'critical' ? 'linear-gradient(90deg, rgba(162,61,40,0.25), rgba(162,61,40,0.12))' : 'linear-gradient(90deg, rgba(162,61,40,0.12), rgba(201,120,40,0.08))',
          border: crisisLevel === 'critical' ? '2px solid var(--war)' : '1px solid var(--war)',
          borderRadius: 'var(--radius)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center',
          animation: crisisLevel === 'critical' ? 'ia-pulse 1.2s ease-in-out infinite' : 'none',
        }}>
          <span className="ia-display" style={{ color: 'var(--war)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em' }}>{crisisLevel === 'critical' ? '☠ 社稷危急' : '⚠ 警报'}</span>
          {alerts.map((w, i) => <Tag key={i} text={w.txt} tone={w.tone} />)}
          {deficitStreak >= 2 && <Tag text={`连续 ${deficitStreak} 年赤字`} tone={deficitStreak >= 3 ? 'danger' : 'warn'} />}
        </div>
      )}

      {unrestProv.length > 0 && (
        <div style={{
          background: 'rgba(201,120,40,0.06)', border: '1px solid var(--warn)', borderRadius: 'var(--radius)',
          padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-3)',
          display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', fontSize: 11,
        }}>
          <span style={{ color: 'var(--warn)', fontWeight: 600, fontSize: 10, letterSpacing: '0.05em' }}>⚠ 骚动省份</span>
          {unrestProv.slice(0, 8).map((p) => {
            const tone = p.rebellionRisk > 85 ? 'danger' : 'warn';
            const icon = p.rebellionRisk > 85 ? '☠' : '⚠';
            return (
              <button key={p.id} onClick={() => { setPendingProvince(p.id); jumpToTab('province'); }} title={`跳转至 ${p.name} 处理`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                background: tone === 'danger' ? 'rgba(162,61,40,0.2)' : 'rgba(201,120,40,0.12)',
                color: tone === 'danger' ? 'var(--war)' : 'var(--warn)', border: `1px solid ${tone === 'danger' ? 'var(--war)' : 'var(--warn)'}`,
              }}>
                {icon} {p.name}<span style={{ fontSize: 9, opacity: 0.8 }}>叛{Math.round(p.rebellionRisk)} 乱{Math.round(p.unrest)}</span>
              </button>
            );
          })}
          {unrestProv.length > 8 && <span className="dim" style={{ fontSize: 10 }}>+{unrestProv.length - 8} 省</span>}
          <button onClick={() => jumpToTab('province')} style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>→ 省份页处理（部署驻军/安抚）</button>
        </div>
      )}

      <Panel title="国是" icon="◈" accent actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Btn label="新局" variant="ghost" onClick={newGame} />
          <Btn label="读档" variant="ghost" onClick={() => load()} disabled={!hasSave()} />
          <Btn label="存档" variant="ghost" onClick={() => save()} />
          <Btn label="下一回合 →" variant="primary" onClick={() => nextTurn()} disabled={!!state.victory.type} />
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <Stat kind="core" accent="var(--gold)" icon="◉" label="国库" value={player.resources.gold} warn={player.resources.gold < 0} />
          <Stat kind="core" accent="var(--food)" icon="✦" label="粮储" value={player.resources.food} warn={player.resources.food < 0} />
          <Stat kind="core" accent="var(--stable)" icon="◈" label="安定" value={g.stability} warn={g.stability < 30} />
          <Stat kind="core" accent="var(--accent)" icon="◯" label="子民" value={totalPop} />
        </div>

        {hist.length >= 2 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-inset)', borderRadius: 'var(--radius)' }}>
              <Sparkline data={goldTrend} color="var(--gold)" label="金" />
              <Sparkline data={foodTrend} color="var(--food)" label="粮" />
              <Sparkline data={stabTrend} color="var(--stable)" label="稳" />
              <Sparkline data={popTrend} color="var(--accent)" label="人" />
            </div>
            {warCount > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(162,61,40,0.06)', borderRadius: 'var(--radius)', border: '1px solid var(--war)' }}>
                <Sparkline data={warTrend} color="var(--war)" label="战" />
                <Sparkline data={exhaustTrend} color="var(--warn)" label="疲" />
              </div>
            )}
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <Stat label="木材" value={player.resources.wood} />
          <Stat label="铁矿" value={player.resources.iron} />
          <Stat label="威望" value={player.resources.influence} />
          <Stat label="学问" value={player.resources.sciPt} />
        </div>

        <Divider label="治术" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div>
            <StatRow label="安定" value={g.stability} kind="high" warn={g.stability < 30} />
            <StatRow label="法统" value={g.legitimacy} kind="high" warn={g.legitimacy < 30} />
            <StatRow label="治能" value={g.efficiency} kind="high" />
          </div>
          <div>
            <StatRow label="腐败" value={g.corruption} kind="low" warn={g.corruption > 50} />
            <StatRow label="厌战" value={player.warExhaustion} kind="low" warn={player.warExhaustion > 50} />
            <StatRow label="补给" value={player.resources.supply} kind="high" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: player.resources.adminPt <= 1 ? 'rgba(162,61,40,0.10)' : 'var(--bg-inset)', border: player.resources.adminPt <= 1 ? '1px solid var(--war)' : '1px solid transparent', borderRadius: 'var(--radius)', marginTop: 'var(--space-2)', animation: player.resources.adminPt <= 1 ? 'ia-pulse 1.2s ease-in-out infinite' : 'none' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>◈ 行动点</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: player.resources.adminPt > 0 ? 'var(--good)' : 'var(--war)' }}>{Math.floor(player.resources.adminPt)}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>本回合剩余（行动消耗 1-2 点，下回合补充 3-7 点）</span>
          {player.resources.adminPt <= 0 && <span style={{ fontSize: 10, color: 'var(--war)', fontWeight: 600 }}>⚠ 已耗尽，需下一回合</span>}
          {player.resources.adminPt === 1 && <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600 }}>⚠ 仅余 1 点</span>}
        </div>

        <Divider label="杆组仪表 · 五根杆的实时负重" />
        <LeverGauge player={player} provs={provs} state={state} />

        <Divider label="邦国" />
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span className="ia-up" style={{ fontSize: 10, color: 'var(--text-dim)' }}>政体</span><Tag text={player.government.type} tone="gold" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span className="ia-up" style={{ fontSize: 10, color: 'var(--text-dim)' }}>国性</span><Tag text={player.character} tone="info" /></div>
          {player.activeCharacterBonuses.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span className="ia-up" style={{ fontSize: 10, color: 'var(--text-dim)' }}>已启</span>{player.activeCharacterBonuses.map((b) => <Tag key={b} text={b} tone="good" />)}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-5)', fontSize: 12.5, color: 'var(--text-mute)' }}>
          <span>疆土 <strong className="ia-num" style={{ color: 'var(--text)' }}>{provs.length}</strong> 省</span>
          <span>军备 <strong className="ia-num" style={{ color: 'var(--text)' }}>{armySize}</strong> 卒</span>
          <span>战事 <strong className="ia-num" style={{ color: warCount > 0 ? 'var(--war)' : 'var(--text)' }}>{warCount}</strong> 起</span>
          <span>主君 <strong style={{ color: 'var(--text)' }}>{player.ruler.name}</strong> · {player.ruler.age}岁 · 治能{player.ruler.ability} · 在位{player.ruler.reignYears ?? 0}年</span>
          {player.ruler.heir && <span> · 储君 <strong style={{ color: 'var(--gold)' }}>{player.ruler.heir.name}</strong> {player.ruler.heir.age}岁 治能{player.ruler.heir.ability}</span>}
        </div>

        {!state.victory.type && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-inset)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 'var(--space-2)', letterSpacing: '0.05em' }}>◈ 万世之业 · 四道进度</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 11 }}>
              <WinProgress label="征服" cur={provs.length} need={7} extra={`稳定${Math.round(g.stability)}/40`} ok={provs.length >= 7 && g.stability >= 40} color="var(--war)" />
              <WinProgress label="经济" cur={Math.min(10, state.highEconomyStableTurns)} need={10} extra={`金${Math.round(player.resources.gold)}/2000`} ok={state.highEconomyStableTurns >= 10} color="var(--gold)" />
              <WinProgress label="文化" cur={Math.min(150, Math.round(player.resources.influence))} need={150} extra={`${state.relations.filter((r) => r.from === pid && r.relation >= 70).length}/3盟`} ok={player.resources.influence >= 150 && state.relations.filter((r) => r.from === pid && r.relation >= 70).length >= 3} color="var(--accent)" />
              <WinProgress label="永恒" cur={Math.min(200, state.stableTurnsCount)} need={200} extra={`${warCount === 0 && g.stability >= 30 ? '✓' : '✗'}稳${Math.round(g.stability)}/30 无战`} ok={state.stableTurnsCount >= 200} color="var(--stable)" />
            </div>
          </div>
        )}

        {state.victory.type && (
          <div className="ia-card--raised" style={{ marginTop: 'var(--space-5)', textAlign: 'center', padding: 'var(--space-5)' }}>
            <div className="ia-display ia-victory-glow" style={{ fontSize: 20, fontWeight: 700 }} >{state.victory.type.startsWith('win') ? '🏆 万世之业已成' : '💀 社稷倾覆'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 'var(--space-2)' }}>
              {state.victory.type === 'win_conquest' ? `征服胜利：疆土 ${provs.length} 省，安定 ${Math.round(g.stability)}`
                : state.victory.type === 'win_economy' ? `经济胜利：国库 ${Math.round(player.resources.gold)} 金`
                : state.victory.type === 'win_culture' ? `文化胜利：影响力 ${Math.round(player.resources.influence)}`
                : state.victory.type === 'win_eternal' ? `永恒帝国：连续 ${state.stableTurnsCount} 年太平`
                : state.victory.type === 'fail_bankrupt' ? '国库破产三载，社稷崩颓'
                : state.victory.type === 'fail_collapse' ? '稳定度崩落，天下大乱'
                : state.victory.type === 'fail_capital_lost' ? '首都被陷，国祚终绝'
                : state.victory.type === 'fail_legitimacy' ? '法统尽失，人心离散'
                : state.victory.type === 'fail_split' ? '叛乱四起，国家分裂'
                : state.victory.type}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>第 {state.turn} 年 · {player.name}</div>
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Panel title="近事纪" icon="✶">
          <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
            {log.length === 0 ? <span className="dim">尚无纪事</span> : log.slice(-20).reverse().map((l, i) => (
              <div key={i} style={{ padding: '5px 0', color: 'var(--text-mute)', borderBottom: i < 19 ? '1px solid rgba(61,51,36,0.4)' : 'none', display: 'flex', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--gold)', opacity: 0.6 }}>·</span><span>{l}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="本朝大事" icon="✦" accent>
          <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
            {state.chronicle.length === 0 ? <span className="dim">尚无大事</span> : state.chronicle.slice().reverse().map((c, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: i < state.chronicle.length - 1 ? '1px solid rgba(61,51,36,0.4)' : 'none', display: 'flex', gap: 'var(--space-3)' }}>
                <span className="ia-display" style={{ color: 'var(--gold)', fontSize: 10, width: 28, flexShrink: 0 }}>Anno {c.turn + 1}</span>
                <div><strong style={{ color: 'var(--text)', fontSize: 12 }}>{c.title}</strong><div style={{ color: 'var(--text-mute)', fontSize: 11, marginTop: 2 }}>{c.desc}</div></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
