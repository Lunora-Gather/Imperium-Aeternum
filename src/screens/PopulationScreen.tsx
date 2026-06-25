// Population v2 — 阶层卡片 + 派系权力可视化 + 安抚按钮
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { Panel, Stat, Bar, Btn, Tag, Divider } from '../components/ui';

const CLASS_LABEL: Record<string, string> = {
  peasants: '农民', workers: '工人', merchants: '商人', soldiers: '士兵', scholars: '学者', nobles: '贵族', clergy: '神职',
};
const FACTION_LABEL: Record<string, string> = {
  nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职',
};
const FACTION_COLOR: Record<string, string> = {
  nobles: 'var(--accent)', merchants: 'var(--gold)', military: 'var(--war)', commoners: 'var(--food)', clergy: 'var(--stable)',
};

export default function PopulationScreen() {
  const { state, appeaseFaction } = useGameStore();
  // C2: pid/player 用 selector 精确订阅
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);

  // 全国阶层汇总
  const classAgg: Record<string, { count: number; sat: number }> = {};
  for (const p of provs) {
    for (const c of p.classes) {
      if (!classAgg[c.classId]) classAgg[c.classId] = { count: 0, sat: 0 };
      classAgg[c.classId].count += c.count;
      classAgg[c.classId].sat += c.satisfaction;
    }
  }
  Object.keys(classAgg).forEach((k) => {
    const n = provs.filter((p) => p.classes.some((c) => c.classId === k)).length;
    if (n > 0) classAgg[k].sat /= n;
  });

  return (
    <div>
      <Panel title="人口与阶层" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          <Stat kind="core" accent="var(--food)" label="总人口" value={totalPop} />
          <Stat kind="core" accent="var(--accent)" label="省份数" value={provs.length} />
          <Stat kind="core" accent="var(--stable)" label="平均满意度" value={Object.values(classAgg).reduce((s, v) => s + v.sat, 0) / Math.max(1, Object.keys(classAgg).length)} />
        </div>
        <Divider label="阶层（全国汇总）" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {Object.entries(classAgg).map(([k, v]) => {
            const sat = v.sat;
            const tone = sat < 30 ? 'danger' : sat < 60 ? 'warn' : 'good';
            return (
              <div key={k} className="ia-card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{CLASS_LABEL[k] ?? k}</strong>
                  <Tag text={`${v.count}人`} tone="info" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1 }}><Bar value={sat} kind="high" /></div>
                  <strong style={{ fontSize: 13, width: 32, textAlign: 'right', color: `var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : 'good'})` }}>{Math.round(sat)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="派系权力与满意度">
        <p className="dim" style={{ fontSize: 11, marginBottom: 10 }}>派系满意度低会触发逼宫、罢市、兵变等事件。安抚消耗 30 金。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {player.factions.map((f) => {
            const sat = f.satisfaction;
            const tone = sat < 30 ? 'danger' : sat < 60 ? 'warn' : 'good';
            const color = FACTION_COLOR[f.id] ?? 'var(--border-hi)';
            return (
              <div key={f.id} className="ia-card" style={{ padding: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{FACTION_LABEL[f.id] ?? f.id}</strong>
                    <Tag text={`权力 ${f.power}`} tone="info" />
                  </div>
                  <Btn label="安抚 30金" variant="ghost" onClick={() => appeaseFaction(f.id)} disabled={player.resources.gold < 30} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 36 }}>满意</span>
                  <div style={{ flex: 1 }}><Bar value={sat} kind="high" /></div>
                  <strong style={{ fontSize: 14, width: 32, textAlign: 'right', color: `var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : 'good'})` }}>{Math.round(sat)}</strong>
                </div>
                {sat < 30 && <div className="danger" style={{ fontSize: 11, marginTop: 6 }}>⚠ 派系怒火中烧</div>}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
