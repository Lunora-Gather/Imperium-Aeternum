// Economy v2 — 税率滑块 + 收支对比 + 警告 + C3 贸易路线
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { availableTradeRoutes, routeYieldEstimate } from '../engine/economy';
import { computeTax } from '../engine/formulas';
import { provincesOf } from '../engine/init';
import { TRADE_ROUTE_BY_ID } from '../data/trade-routes';
import { Panel, Stat, StatRow, Btn, Tag, Divider } from '../components/ui';

export default function EconomyScreen() {
  const { state, setTaxRate, establishTradeRoute, embargoTradeRoute } = useGameStore();
  const player = state.nations[state.playerNationId];
  const report = state.lastReport;
  const taxPct = Math.round(player.taxRate * 100);
  const netIncome = report ? (report.income.tax + report.income.trade + report.income.building - report.expense.military - report.expense.corruption) : 0;

  // C3: 贸易路线
  const routes = availableTradeRoutes(player, state);
  const activeRoutes = player.activeTradeRoutes.map((ar) => TRADE_ROUTE_BY_ID[ar.routeId]).filter(Boolean);

  // 税率建议档
  const taxAdvice = taxPct <= 10 ? { txt: '低税·民心稳', tone: 'good' as const }
    : taxPct <= 20 ? { txt: '均衡·推荐', tone: 'info' as const }
    : taxPct <= 30 ? { txt: '高税·民心略降', tone: 'warn' as const }
    : { txt: '苛税·民心大降', tone: 'danger' as const };

  // E3: ←/→ 调税 ±2%（切到此页后键盘微调）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setTaxRate(Math.max(0, player.taxRate - 0.02)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setTaxRate(Math.min(0.5, player.taxRate + 0.02)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player.taxRate, setTaxRate]);

  // P1-3: 税率调整实时预估——算当前税率 vs +5% 的税收差与民心影响
  const provs = provincesOf(player.id, state.provinces);
  const taxEff = (1 + player.tech.admin * 0.06) * (player.policyMods?.taxEffMod ?? 1);
  const estTaxAt = (rate: number) => provs.reduce((s, p) => s + computeTax({
    population: p.population, baseTaxRate: rate, taxEfficiency: taxEff,
    stability: player.government.stability, corruption: player.government.corruption,
    assimilation: p.assimilation,
  }), 0);
  const curTaxEst = Math.round(estTaxAt(player.taxRate));
  const higherTaxEst = Math.round(estTaxAt(Math.min(0.5, player.taxRate + 0.05)));
  const taxDeltaIfUp = higherTaxEst - curTaxEst;
  // 民心影响近似：税率每 +5% 约 -3 满意度（与 settleEconomy 中民心修正一致量级）
  const moodDeltaIfUp = -3;

  return (
    <Panel title="经济总览" accent>
      {/* 资源卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <Stat kind="core" accent="var(--gold)" label="国库" value={player.resources.gold} warn={player.resources.gold < 0} />
        <Stat kind="core" accent="var(--food)" label="粮食" value={player.resources.food} warn={player.resources.food < 0} />
        <Stat kind="core" accent="var(--stable)" label="净收入/年" value={netIncome} warn={netIncome < 0} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <Stat label="木材" value={player.resources.wood} />
        <Stat label="铁矿" value={player.resources.iron} />
        <Stat label="补给" value={player.resources.supply} />
        <Stat label="影响力" value={player.resources.influence} />
      </div>

      <Divider label="税率调整" />

      {/* 税率滑块 */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>当前税率</span>
        <strong style={{ fontSize: 22, color: 'var(--warn)' }}>{taxPct}%</strong>
        <Tag text={taxAdvice.txt} tone={taxAdvice.tone} />
      </div>
      <div style={{ marginBottom: 8, width: '100%' }}>
        <Bar value={taxPct} max={50} kind="low" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
          <span>0%</span><span>25%</span><span>50%</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <Btn label="-5%" variant="ghost" onClick={() => setTaxRate(Math.max(0, player.taxRate - 0.05))} />
        <Btn label="-2%" variant="ghost" onClick={() => setTaxRate(Math.max(0, player.taxRate - 0.02))} />
        <Btn label="重置 15%" variant="ghost" onClick={() => setTaxRate(0.15)} />
        <Btn label="+2%" variant="ghost" onClick={() => setTaxRate(Math.min(0.5, player.taxRate + 0.02))} />
        <Btn label="+5%" variant="ghost" onClick={() => setTaxRate(Math.min(0.5, player.taxRate + 0.05))} />
      </div>
      <p className="dim" style={{ fontSize: 11 }}>⚠ 高税增收但降民心；建议 10%-25%。键盘 ←/→ 微调 ±2%</p>

      {/* P1-3: 税率调整实时预估——消除盲调 */}
      <div className="ia-card" style={{ marginTop: 8, padding: 10, background: 'var(--bg-inset)', fontSize: 11 }}>
        <div style={{ color: 'var(--text-dim)', marginBottom: 4, letterSpacing: '0.05em' }}>➤ 若调高 5% 预估</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>当前税 <strong className="ia-num" style={{ color: 'var(--gold)' }}>{curTaxEst}</strong> 金/年</span>
          <span>→ +5% 后 <strong className="ia-num" style={{ color: 'var(--good)' }}>{higherTaxEst}</strong> 金/年</span>
          <span>税收 <strong style={{ color: 'var(--good)' }}>+{taxDeltaIfUp}</strong></span>
          <span>民心 <strong style={{ color: 'var(--war)' }}>{moodDeltaIfUp}</strong></span>
        </div>
      </div>

      {report && (
        <>
          <Divider label="上回合收支" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--good)' }}>收入 +</strong>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <Row k="税收" v={report.income.tax} />
                <Row k="贸易" v={report.income.trade} />
                <Row k="建筑" v={report.income.building} />
              </div>
            </div>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--war)' }}>支出 −</strong>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <Row k="军费" v={-report.expense.military} negative />
                <Row k="腐败" v={-report.expense.corruption} negative />
              </div>
            </div>
          </div>
          <Divider />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <Stat label="粮食变化" value={`${report.foodDelta >= 0 ? '+' : ''}${report.foodDelta}`} warn={report.foodDelta < 0} />
            <Stat label="人口变化" value={`+${report.popDelta}`} />
            <Stat label="稳定变化" value={`${report.stabilityDelta >= 0 ? '+' : ''}${report.stabilityDelta}`} warn={report.stabilityDelta < 0} />
            <Stat label="合法变化" value={`${report.legitimacyDelta >= 0 ? '+' : ''}${report.legitimacyDelta}`} warn={report.legitimacyDelta < 0} />
          </div>
        </>
      )}

      {/* C3: 贸易路线 */}
      <Divider label="贸易路线" />
      {/* E22: 贸易依赖风险提示——贸易国关系<0 时收入打折 */}
      {(() => {
        const risky = state.relations.filter((r) => r.from === player.id && r.treaty === 'trade' && r.relation < 0);
        if (risky.length === 0) return null;
        return (
          <div className="ia-card" style={{ marginBottom: 10, padding: 8, background: 'rgba(201,120,40,0.08)', border: '1px solid var(--warn)' }}>
            <span style={{ fontSize: 11, color: 'var(--warn)' }}>⚠ 贸易依赖风险：</span>
            {risky.map((r) => {
              const dep = Math.round(r.tradeDep ?? 0);
              const cut = Math.round((1 - Math.max(0.5, 1 - dep / 200)) * 100);
              const target = state.nations[r.to];
              return <Tag key={r.to} text={`${target?.name ?? r.to}·依赖${dep}%·收入-${cut}%`} tone="warn" />;
            })}
          </div>
        );
      })()}
      {activeRoutes.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <strong style={{ fontSize: 13, color: 'var(--good)' }}>已建立（{activeRoutes.length}）</strong>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {activeRoutes.map((r) => {
              const y = routeYieldEstimate(r.id);
              const embargoed = player.embargoedRoutes?.includes(r.id);
              return (
                <div key={r.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '2px 6px', background: embargoed ? 'var(--bg-inset)' : 'rgba(122,154,62,0.08)', borderRadius: 3, opacity: embargoed ? 0.6 : 1 }}>
                  <span style={{ fontSize: 11, color: embargoed ? 'var(--text-dim)' : 'var(--good)' }}>{r.name}{embargoed ? '·禁运' : `·+${y.gold}金/+${y.influence}影`}</span>
                  <Btn label={embargoed ? '解除' : '禁运'} variant="ghost" onClick={() => embargoTradeRoute(r.id)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {routes.map(({ def, can, blocker }) => {
          const y = routeYieldEstimate(def.id);
          return (
            <div key={def.id} className="ia-card" style={{ padding: 10, opacity: can ? 1 : 0.7, border: can ? '1px solid var(--border-gold)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <strong style={{ fontSize: 12 }}>{def.name}</strong>
                {blocker ? <Tag text={blocker} tone="danger" /> : <Tag text={`${def.costGold}金`} tone="info" />}
              </div>
              <p className="dim" style={{ fontSize: 10, margin: '0 0 6px 0', lineHeight: 1.4 }}>{def.description}</p>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
                +{y.gold}金 · +{y.influence}影{y.food > 0 ? ` · +${y.food}粮` : ''} · {def.length === 'long' ? '长途' : def.length === 'medium' ? '中途' : '短途'}
              </div>
              <Btn label="建立" variant={can ? 'primary' : 'ghost'} onClick={() => establishTradeRoute(def.id)} disabled={!can} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Row({ k, v, negative }: { k: string; v: number; negative?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(42,58,90,0.3)' }}>
      <span style={{ color: 'var(--text-mute)' }}>{k}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: negative ? 'var(--war)' : 'var(--good)', fontWeight: 600 }}>
        {v >= 0 ? '+' : ''}{Math.round(v)}
      </span>
    </div>
  );
}

function Bar({ value, max = 100, kind = 'neutral' }: { value: number; max?: number; kind?: 'high' | 'low' | 'neutral' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let c = 'var(--bar-ok)';
  if (kind === 'low') {
    if (pct <= 40) c = 'var(--bar-good)';
    else if (pct <= 70) c = 'var(--bar-warn)';
    else c = 'var(--bar-bad)';
  }
  return (
    <div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 10, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width 0.25s' }} />
    </div>
  );
}
