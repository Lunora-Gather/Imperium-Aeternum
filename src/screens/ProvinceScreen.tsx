// Province v3 — 摘要 → 风险 → 省份操作，减少盲点选省
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { BUILDINGS } from '../data/buildings';
import { TECHNOLOGIES } from '../data/technologies';
import { computeBuildingYield } from '../engine/economy';
import { Panel, StatRow, Btn, Tag, StatusDot, Divider } from '../components/ui';
import type { BuildingId } from '../data/buildings';
import type { Nation, Province } from '../types/game';

function techUnlocked(player: Nation, prereqTech?: string): boolean {
  if (!prereqTech) return true;
  const m = prereqTech.match(/^([a-z]+)_lv(\d+)$/);
  if (!m) return true;
  const branch = m[1] as 'agri' | 'mil' | 'admin' | 'culture';
  return (player.tech[branch] ?? 0) >= Number(m[2]);
}
function techLabel(prereqTech?: string): string {
  if (!prereqTech) return '';
  const t = TECHNOLOGIES.find((x) => x.id === prereqTech);
  return t ? t.name : prereqTech;
}

const CLASS_LABEL: Record<string, string> = {
  peasants: '农民', workers: '工人', merchants: '商人', soldiers: '士兵', scholars: '学者', nobles: '贵族', clergy: '神职',
};

function provStatus(p: Province): 'good' | 'warn' | 'danger' | 'neutral' {
  if (p.rebellionRisk > 70) return 'danger';
  if (p.unrest > 50 || p.loyalty < 40) return 'warn';
  if (p.loyalty > 70 && p.unrest < 20) return 'good';
  return 'neutral';
}
function riskScore(p: Province): number {
  return Math.round(p.rebellionRisk * 1.2 + p.unrest + Math.max(0, 50 - p.loyalty) * 0.8 + Math.max(0, 45 - p.assimilation) * 0.35);
}
function formatYield(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}
function yieldText(bid: BuildingId, province: Province, level = 1): string {
  const y = computeBuildingYield(bid, level, province.terrain);
  const parts = [
    y.gold ? `+${formatYield(y.gold)}金` : '', y.food ? `+${formatYield(y.food)}粮` : '',
    y.wood ? `+${formatYield(y.wood)}木` : '', y.iron ? `+${formatYield(y.iron)}铁` : '',
    y.influence ? `+${formatYield(y.influence)}影` : '', y.sciPt ? `+${formatYield(y.sciPt)}科` : '',
    y.supply ? `+${formatYield(y.supply)}补` : '', y.adminPt ? `+${formatYield(y.adminPt)}政` : '',
  ].filter(Boolean);
  return parts.join(' ') || '治理加成';
}

export default function ProvinceScreen() {
  const { state, build, recruit, upgradeBuilding, demolishBuilding, developProvince } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const pendingId = useGameStore((s) => s.pendingProvinceId);
  const setPendingProvince = useGameStore((s) => s.setPendingProvince);
  const [selected, setSelected] = useState(provs[0]?.id ?? '');

  useEffect(() => {
    if (pendingId && provs.some((p) => p.id === pendingId)) {
      setSelected(pendingId);
      setPendingProvince(null);
    }
  }, [pendingId, provs, setPendingProvince]);

  useEffect(() => {
    if (provs.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const hasPending = state.pendingEvents.some((p) => p.nationId === pid);
      if (hasPending || (e.key !== '[' && e.key !== ']')) return;
      e.preventDefault();
      const idx = provs.findIndex((p) => p.id === selected);
      if (idx < 0) return;
      const next = e.key === '[' ? (idx - 1 + provs.length) % provs.length : (idx + 1) % provs.length;
      setSelected(provs[next].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [provs, selected, state.pendingEvents, pid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const hasPending = state.pendingEvents.some((p) => p.nationId === pid);
      if (hasPending || !selected) return;
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); build(selected, 'farm'); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); recruit(selected, 50); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, build, recruit, state.pendingEvents, pid]);

  const prov = state.provinces[selected];
  if (!player || !prov) return <Panel title="省份管理"><p className="dim">无省份</p></Panel>;

  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const avgUnrest = provs.length ? provs.reduce((s, p) => s + p.unrest, 0) / provs.length : 0;
  const avgLoyalty = provs.length ? provs.reduce((s, p) => s + p.loyalty, 0) / provs.length : 0;
  const dangerous = [...provs].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, 4);
  const allIds = Object.keys(BUILDINGS) as BuildingId[];
  const unlocked = allIds.filter((bid) => techUnlocked(player, BUILDINGS[bid].prereqTech));
  const locked = allIds.filter((bid) => !techUnlocked(player, BUILDINGS[bid].prereqTech));
  const advice = riskScore(dangerous[0] ?? prov) > 110
    ? '优先处理高风险省：加驻军、降不满、提高忠诚，避免叛乱扩大。'
    : player.resources.food < 0
      ? '粮储为负，优先建农田或开垦农业基础。'
      : player.resources.gold < 100
        ? '国库偏紧，优先建市场或保留行政点处理危机。'
        : '局势尚可，可按国运目标选择经济、科研或军事建设。';

  const BuildGrid = ({ ids, locked: isLocked }: { ids: BuildingId[]; locked?: boolean }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 6, opacity: isLocked ? 0.58 : 1 }}>
      {ids.map((bid) => {
        const b = BUILDINGS[bid];
        const goldOk = player.resources.gold >= b.costGold;
        return (
          <button key={bid} className="ia-btn" onClick={() => build(prov.id, bid)} disabled={!goldOk || isLocked}
            title={isLocked ? `需科技：${techLabel(b.prereqTech)}` : `${prov.terrain} · ${yieldText(bid, prov)}`}
            style={{ flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', fontSize: 12, padding: 8 }}>
            <div style={{ fontWeight: 600 }}>{b.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
              {b.costGold}金{b.costWood > 0 ? `·${b.costWood}木` : ''}{b.costIron > 0 ? `·${b.costIron}铁` : ''}
              {isLocked && <span style={{ color: 'var(--war)' }}> · 🔒{techLabel(b.prereqTech)}</span>}
            </div>
            <div style={{ fontSize: 9, color: isLocked ? 'var(--text-dim)' : 'var(--good)', marginTop: 2 }}>{yieldText(bid, prov)}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <Panel title="省政判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
          <div className="ia-card" style={{ padding: 10 }}><Tag text="疆土" tone="info" /><div style={{ fontSize: 18, marginTop: 6 }}>{provs.length} 省</div><div className="dim" style={{ fontSize: 11 }}>人口 {Math.round(totalPop)}</div></div>
          <div className="ia-card" style={{ padding: 10 }}><Tag text="平均不满" tone={avgUnrest > 50 ? 'danger' : avgUnrest > 30 ? 'warn' : 'good'} /><div style={{ fontSize: 18, marginTop: 6 }}>{Math.round(avgUnrest)}</div><div className="dim" style={{ fontSize: 11 }}>越低越稳</div></div>
          <div className="ia-card" style={{ padding: 10 }}><Tag text="平均忠诚" tone={avgLoyalty < 40 ? 'danger' : avgLoyalty < 60 ? 'warn' : 'good'} /><div style={{ fontSize: 18, marginTop: 6 }}>{Math.round(avgLoyalty)}</div><div className="dim" style={{ fontSize: 11 }}>越高越稳</div></div>
          <div className="ia-card" style={{ padding: 10 }}><Tag text="建议" tone={riskScore(dangerous[0] ?? prov) > 110 ? 'danger' : 'info'} /><div style={{ fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{advice}</div></div>
        </div>
        <Divider label="高风险省份" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 6 }}>
          {dangerous.map((p) => <button key={p.id} className="ia-btn" onClick={() => setSelected(p.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}><StatusDot status={provStatus(p)} />{p.name}<span className="dim" style={{ marginLeft: 'auto', fontSize: 10 }}>风险 {riskScore(p)}</span></button>)}
        </div>
      </Panel>

      <Panel title={`省份列表（${provs.length}）`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
          {provs.map((p) => {
            const st = provStatus(p);
            return (
              <button key={p.id} onClick={() => setSelected(p.id)} className="ia-btn" style={selected === p.id ? { background: 'var(--border-hi)', borderColor: 'var(--gold)', color: '#fff', justifyContent: 'flex-start' } : { justifyContent: 'flex-start', fontSize: 12 }}>
                <StatusDot status={st} />{p.name}{p.isCapital ? ' ★' : ''}<span className="dim" style={{ marginLeft: 'auto', fontSize: 10 }}>{p.population}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}><StatusDot status="good" />稳定 <StatusDot status="warn" />不满 <StatusDot status="danger" />叛乱风险</div>
      </Panel>

      <Panel title={`${prov.name} ${prov.isCapital ? '★ 首都' : ''}`} accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}><Tag text={prov.terrain} /><Tag text={prov.culture} tone="info" /><Tag text={prov.religion} tone="info" /><Tag text={`风险 ${riskScore(prov)}`} tone={provStatus(prov) === 'danger' ? 'danger' : provStatus(prov) === 'warn' ? 'warn' : 'info'} /></div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13 }}><span>人口 <strong>{prov.population}</strong></span><span>驻军 <strong>{prov.garrison}</strong></span><span>建筑 <strong>{prov.buildings.length}</strong></span></div>
            <StatRow label="同化" value={prov.assimilation} kind="high" />
            <StatRow label="忠诚" value={prov.loyalty} kind="high" warn={prov.loyalty < 40} />
            <StatRow label="不满" value={prov.unrest} kind="low" warn={prov.unrest > 50} />
            <StatRow label="叛乱" value={prov.rebellionRisk} kind="low" warn={prov.rebellionRisk > 70} />
          </div>
          <div>
            <strong style={{ fontSize: 13 }}>阶层</strong>
            <div style={{ marginTop: 6 }}>{prov.classes.length === 0 ? <span className="dim">暂无阶层数据</span> : prov.classes.map((c) => <div key={c.classId} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 40px', gap: 6, alignItems: 'center', marginBottom: 4 }}><span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{CLASS_LABEL[c.classId] ?? c.classId}</span><Bar value={c.satisfaction} kind="high" /><span style={{ fontSize: 11, textAlign: 'right' }}>{Math.round(c.satisfaction)}</span></div>)}</div>
            <Divider />
            <strong style={{ fontSize: 13 }}>建筑</strong>
            <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {prov.buildings.length === 0 ? <span className="dim">无</span> : prov.buildings.map((b) => {
                const def = BUILDINGS[b.defId];
                const upgCost = def ? Math.round(def.costGold * 0.6 * b.level) : 0;
                const canUpg = b.level < 3 && player.resources.gold >= upgCost;
                const demolishRefund = def ? Math.round(def.costGold * 0.3 * b.level) : 0;
                return <div key={b.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}><Tag text={`${def?.name ?? b.defId} Lv${b.level}`} tone={b.level >= 3 ? 'good' : 'info'} /><span className="dim" style={{ fontSize: 10 }}>{def ? yieldText(def.id, prov, b.level) : ''}</span>{b.level < 3 && <Btn label={`↑${upgCost}金`} variant="ghost" onClick={() => upgradeBuilding(prov.id, b.id)} disabled={!canUpg} />}<Btn label={`拆除 +${demolishRefund}金`} variant="ghost" warn onClick={() => demolishBuilding(prov.id, b.id)} /></div>;
              })}
            </div>
          </div>
        </div>

        <Divider label="建设与征兵" />
        {unlocked.length > 0 && <div style={{ fontSize: 10, color: 'var(--good)', marginBottom: 4, letterSpacing: '0.05em' }}>▸ 可建（{unlocked.length}）</div>}
        <BuildGrid ids={unlocked} />
        {locked.length > 0 && <><div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8, marginBottom: 4, letterSpacing: '0.05em' }}>▸ 待解锁（{locked.length}·需科技）</div><BuildGrid ids={locked} locked /></>}
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 12, color: 'var(--text-mute)' }}>征兵</span><Btn label="+50" variant="ghost" onClick={() => recruit(prov.id, 50)} /><Btn label="+100" variant="ghost" onClick={() => recruit(prov.id, 100)} /><span className="dim" style={{ fontSize: 11 }}>消耗人口与补给</span></div>

        <Divider label="开发与驻军" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><Btn label="开垦 +2农 (60金)" variant="ghost" onClick={() => developProvince(prov.id, 'reclaim')} disabled={player.resources.gold < 60} /><Btn label="部署驻军50" variant="ghost" onClick={() => developProvince(prov.id, 'garrison_deploy')} /><Btn label="召回驻军50" variant="ghost" onClick={() => developProvince(prov.id, 'garrison_recall')} disabled={prov.garrison < 50} /><span className="dim" style={{ fontSize: 11 }}>开垦增产 · 驻军压叛乱</span></div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>➤ 战略军队调动请至 <span style={{ color: 'var(--war)' }}>军事页</span> · 农业基础 {prov.agriBase} · 驻军 {prov.garrison}</div>
      </Panel>
    </div>
  );
}

function Bar({ value, max = 100, kind = 'neutral' }: { value: number; max?: number; kind?: 'high' | 'low' | 'neutral' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let c = 'var(--bar-ok)';
  if (kind === 'high') c = pct >= 60 ? 'var(--bar-good)' : pct >= 30 ? 'var(--bar-warn)' : 'var(--bar-bad)';
  else if (kind === 'low') c = pct <= 30 ? 'var(--bar-good)' : pct <= 60 ? 'var(--bar-warn)' : 'var(--bar-bad)';
  return <div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 7, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width 0.25s' }} /></div>;
}
