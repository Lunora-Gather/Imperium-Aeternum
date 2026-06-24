// Province v2 — 省份列表加 StatusDot + 建筑图标网格 + 阶层满意度可视化
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { BUILDINGS } from '../data/buildings';
import { TECHNOLOGIES } from '../data/technologies';
import { Panel, StatRow, Btn, Tag, StatusDot, Divider } from '../components/ui';
import type { BuildingId } from '../data/buildings';
import type { Nation } from '../types/game';
import type { Province } from '../types/game';

// P1-4: 通用前置科技检查——prereqTech 形如 'admin_lv2'/'culture_lv6'/'mil_lv6'
function techUnlocked(player: Nation, prereqTech?: string): boolean {
  if (!prereqTech) return true;
  const m = prereqTech.match(/^([a-z]+)_lv(\d+)$/);
  if (!m) return true;
  const branch = m[1] as 'agri' | 'mil' | 'admin' | 'culture';
  const need = Number(m[2]);
  const cur = player.tech[branch] ?? 0;
  return cur >= need;
}
function techLabel(prereqTech?: string): string {
  if (!prereqTech) return '';
  const t = TECHNOLOGIES.find((x) => x.id === prereqTech);
  return t ? t.name : prereqTech;
}

const CLASS_LABEL: Record<string, string> = {
  farmers: '农民', workers: '工人', merchants: '商人', soldiers: '士兵', scholars: '学者', nobles: '贵族', clergy: '神职',
};

function provStatus(p: Province): 'good' | 'warn' | 'danger' | 'neutral' {
  if (p.rebellionRisk > 70) return 'danger';
  if (p.unrest > 50 || p.loyalty < 40) return 'warn';
  if (p.loyalty > 70 && p.unrest < 20) return 'good';
  return 'neutral';
}

export default function ProvinceScreen() {
  const { state, build, recruit, upgradeBuilding, developProvince } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = provincesOf(pid, state.provinces);
  // P2: 若有跨页跳转待选省份（地图/骚动徽章点击），优先选中它并清标记
  const pendingId = useGameStore((s) => s.pendingProvinceId);
  const setPendingProvince = useGameStore((s) => s.setPendingProvince);
  const [selected, setSelected] = useState(provs[0]?.id ?? '');
  useEffect(() => {
    if (pendingId && provs.some((p) => p.id === pendingId)) {
      setSelected(pendingId);
      setPendingProvince(null);
    }
  }, [pendingId, provs, setPendingProvince]);
  const prov = state.provinces[selected];

  if (!prov) return <Panel title="省份管理"><p className="dim">无省份</p></Panel>;

  return (
    <div>
      {/* 省份列表 — 带 StatusDot */}
      <Panel title={`省份列表（${provs.length}）`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
          {provs.map((p) => {
            const st = provStatus(p);
            return (
              <button key={p.id} onClick={() => setSelected(p.id)}
                className="ia-btn"
                style={selected === p.id ? {
                  background: 'var(--border-hi)', borderColor: 'var(--gold)', color: '#fff', justifyContent: 'flex-start',
                } : { justifyContent: 'flex-start', fontSize: 12 }}>
                <StatusDot status={st} />{p.name}{p.isCapital ? ' ★' : ''}
                <span className="dim" style={{ marginLeft: 'auto', fontSize: 10 }}>{p.population}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
          <StatusDot status="good" />稳定 <StatusDot status="warn" />不满 <StatusDot status="danger" />叛乱风险
        </div>
      </Panel>

      <Panel title={`${prov.name} ${prov.isCapital ? '★ 首都' : ''}`} accent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* 左：基础信息 + 状态条 */}
          <div>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Tag text={prov.terrain} />
              <Tag text={prov.culture} tone="info" />
              <Tag text={prov.religion} tone="info" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13 }}>
              <span>人口 <strong>{prov.population}</strong></span>
              <span>驻军 <strong>{prov.garrison}</strong></span>
              <span>建筑 <strong>{prov.buildings.length}</strong></span>
            </div>
            <StatRow label="同化" value={prov.assimilation} kind="high" />
            <StatRow label="忠诚" value={prov.loyalty} kind="high" warn={prov.loyalty < 40} />
            <StatRow label="不满" value={prov.unrest} kind="low" warn={prov.unrest > 50} />
            <StatRow label="叛乱" value={prov.rebellionRisk} kind="low" warn={prov.rebellionRisk > 70} />
          </div>

          {/* 右：阶层 + 建筑 */}
          <div>
            <strong style={{ fontSize: 13 }}>阶层</strong>
            <div style={{ marginTop: 6 }}>
              {prov.classes.map((c) => {
                const sat = c.satisfaction;
                const tone = sat < 30 ? 'danger' : sat < 60 ? 'warn' : 'good';
                return (
                  <div key={c.classId} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 40px', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{CLASS_LABEL[c.classId] ?? c.classId}</span>
                    <Bar value={sat} kind="high" />
                    <span style={{ fontSize: 11, textAlign: 'right', color: `var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : 'good'})` }}>{Math.round(sat)}</span>
                  </div>
                );
              })}
            </div>
            <Divider />
            <strong style={{ fontSize: 13 }}>建筑</strong>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {prov.buildings.length === 0 ? <span className="dim">无</span> :
                prov.buildings.map((b) => {
                  const def = BUILDINGS[b.defId];
                  const upgCost = def ? Math.round(def.costGold * 0.6 * b.level) : 0;
                  const canUpg = b.level < 3 && (player?.resources.gold ?? 0) >= upgCost;
                  return (
                    <div key={b.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <Tag text={`${def?.name ?? b.defId} Lv${b.level}`} tone={b.level >= 3 ? 'good' : 'info'} />
                      {b.level < 3 && <Btn label={`↑${upgCost}金`} variant="ghost" onClick={() => upgradeBuilding(prov.id, b.id)} disabled={!canUpg} />}
                      {/* E23: 升级收益预览 */}
                      {b.level < 3 && def && (
                        <span style={{ fontSize: 9, color: 'var(--good)' }}>
                          →{def.yield.gold ? `+${def.yield.gold}金` : ''}{def.yield.food ? `+${def.yield.food}粮` : ''}{def.yield.influence ? `+${def.yield.influence}影` : ''}{def.yield.sciPt ? `+${def.yield.sciPt}科` : ''}{def.yield.supply ? `+${def.yield.supply}补` : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <Divider label="建设与征兵" />

        {/* P1-4: 建设按科技解锁分栏——可建高亮 / 待解锁灰且标注前置 */}
        {(() => {
          const allIds = Object.keys(BUILDINGS) as BuildingId[];
          const unlocked = allIds.filter((bid) => techUnlocked(player, BUILDINGS[bid].prereqTech));
          const locked = allIds.filter((bid) => !techUnlocked(player, BUILDINGS[bid].prereqTech));
          const Grid = ({ ids, locked: isLocked }: { ids: BuildingId[]; locked?: boolean }) => (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6, opacity: isLocked ? 0.6 : 1 }}>
              {ids.map((bid) => {
                const b = BUILDINGS[bid];
                const goldOk = (player?.resources.gold ?? 0) >= b.costGold;
                return (
                  <button key={bid} className="ia-btn" onClick={() => build(prov.id, bid)} disabled={!goldOk || isLocked}
                    title={isLocked ? `需科技：${techLabel(b.prereqTech)}` : ''}
                    style={{ flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', fontSize: 12, padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {b.costGold}金{b.costWood > 0 ? `·${b.costWood}木` : ''}
                      {isLocked && <span style={{ color: 'var(--war)' }}> · 🔒{techLabel(b.prereqTech)}</span>}
                    </div>
                    {/* E23: 建筑收益预览 */}
                    <div style={{ fontSize: 9, color: 'var(--good)', marginTop: 2 }}>
                      {b.yield.gold ? `+${b.yield.gold}金 ` : ''}{b.yield.food ? `+${b.yield.food}粮 ` : ''}{b.yield.influence ? `+${b.yield.influence}影 ` : ''}{b.yield.sciPt ? `+${b.yield.sciPt}科 ` : ''}{b.yield.supply ? `+${b.yield.supply}补 ` : ''}{b.yield.adminPt ? `+${b.yield.adminPt}政 ` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          );
          return (
            <>
              {unlocked.length > 0 && <div style={{ fontSize: 10, color: 'var(--good)', marginBottom: 4, letterSpacing: '0.05em' }}>▸ 可建（{unlocked.length}）</div>}
              <Grid ids={unlocked} />
              {locked.length > 0 && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8, marginBottom: 4, letterSpacing: '0.05em' }}>▸ 待解锁（{locked.length}·需科技）</div>
                  <Grid ids={locked} locked />
                </>
              )}
            </>
          );
        })()}
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>征兵</span>
          <Btn label="+50" variant="ghost" onClick={() => recruit(prov.id, 50)} />
          <Btn label="+100" variant="ghost" onClick={() => recruit(prov.id, 100)} />
          <span className="dim" style={{ fontSize: 11 }}>消耗人口与粮食</span>
        </div>

        {/* E16: 省份开发——开垦/驻军调动 */}
        <Divider label="开发与驻军" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn label="开垦 +2农 (60金)" variant="ghost" onClick={() => developProvince(prov.id, 'reclaim')} disabled={(player?.resources.gold ?? 0) < 60} />
          <Btn label="部署驻军50" variant="ghost" onClick={() => developProvince(prov.id, 'garrison_deploy')} />
          <Btn label="召回驻军50" variant="ghost" onClick={() => developProvince(prov.id, 'garrison_recall')} disabled={prov.garrison < 50} />
          <span className="dim" style={{ fontSize: 11 }}>开垦永久增产 · 省驻军压叛乱（与军队独立）</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
          ➤ 战略军队调动（省间移动、前线进攻）请至 <span style={{ color: 'var(--war)' }}>军事页</span> · 调动后军队需在与敌省相邻的己省方可发起攻势
          <br />农业基础 {prov.agriBase} · 驻军 {prov.garrison}
        </div>
      </Panel>
    </div>
  );
}

// 内联 Bar（避免循环依赖 ui.tsx 的 Bar 在同文件再用一次的 import 冲突）
function Bar({ value, max = 100, kind = 'neutral' }: { value: number; max?: number; kind?: 'high' | 'low' | 'neutral' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let c = 'var(--bar-ok)';
  if (kind === 'high') {
    if (pct >= 60) c = 'var(--bar-good)';
    else if (pct >= 30) c = 'var(--bar-warn)';
    else c = 'var(--bar-bad)';
  } else if (kind === 'low') {
    if (pct <= 30) c = 'var(--bar-good)';
    else if (pct <= 60) c = 'var(--bar-warn)';
    else c = 'var(--bar-bad)';
  }
  return (
    <div style={{ background: 'var(--bg-inset)', borderRadius: 3, height: 7, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width 0.25s' }} />
    </div>
  );
}
