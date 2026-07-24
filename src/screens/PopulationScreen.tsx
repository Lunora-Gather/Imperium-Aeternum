import { registerGovernanceTranslations } from '../i18n/catalogs/governance';
import { localizeReactTree } from '../i18n/reactTree';
registerGovernanceTranslations();
// Population v3 — 人口判断 + 阶层风险 + 派系优先级
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { Panel, Stat, Bar, Btn, Tag, Divider } from '../components/ui';

const CLASS_LABEL: Record<string, string> = { peasants: '农民', workers: '工人', merchants: '商人', soldiers: '士兵', scholars: '学者', nobles: '贵族', clergy: '神职' };
const FACTION_LABEL: Record<string, string> = { nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职' };
const FACTION_COLOR: Record<string, string> = { nobles: 'var(--accent)', merchants: 'var(--gold)', military: 'var(--war)', commoners: 'var(--food)', clergy: 'var(--stable)' };

function tone(v: number, highGood = true): 'danger' | 'warn' | 'good' | 'info' {
  if (highGood) return v < 30 ? 'danger' : v < 55 ? 'warn' : v > 75 ? 'good' : 'info';
  return v > 70 ? 'danger' : v > 45 ? 'warn' : v < 25 ? 'good' : 'info';
}

export default function PopulationScreen() {
  const { state, appeaseFaction } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const avgUnrest = provs.length ? provs.reduce((s, p) => s + p.unrest, 0) / provs.length : 0;
  const avgLoyalty = provs.length ? provs.reduce((s, p) => s + p.loyalty, 0) / provs.length : 0;

  const classAgg: Record<string, { count: number; sat: number; provinces: number }> = {};
  for (const p of provs) for (const c of p.classes) {
    if (!classAgg[c.classId]) classAgg[c.classId] = { count: 0, sat: 0, provinces: 0 };
    classAgg[c.classId].count += c.count;
    classAgg[c.classId].sat += c.satisfaction;
    classAgg[c.classId].provinces += 1;
  }
  Object.values(classAgg).forEach((v) => { v.sat = v.provinces > 0 ? v.sat / v.provinces : 0; });
  const classes = Object.entries(classAgg).sort((a, b) => b[1].count - a[1].count);
  const lowClasses = classes.filter(([, v]) => v.sat < 45).slice(0, 3);
  const lowFactions = [...player.factions].sort((a, b) => a.satisfaction - b.satisfaction).slice(0, 3);
  const avgClassSat = Object.values(classAgg).reduce((s, v) => s + v.sat, 0) / Math.max(1, Object.keys(classAgg).length);

  const advice: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info' }[] = [];
  if (avgUnrest > 55) advice.push({ title: '民怨偏高', body: '全国平均不满已较高，应优先在省份页压低不满或降低税率。', tone: 'danger' });
  if (lowClasses.length > 0) advice.push({ title: '阶层不满', body: `${lowClasses.map(([k]) => CLASS_LABEL[k] ?? k).join('、')} 满意度偏低，后续事件风险上升。`, tone: 'warn' });
  if (lowFactions[0]?.satisfaction < 35) advice.push({ title: '派系需要处理', body: `${FACTION_LABEL[lowFactions[0].id] ?? lowFactions[0].id} 满意度最低，可安抚或在政治页选择有利政策。`, tone: 'warn' });
  if (avgLoyalty < 45) advice.push({ title: '忠诚不足', body: '地方忠诚偏低，扩张或高税会放大不稳定。', tone: 'warn' });
  if (advice.length === 0) advice.push({ title: '社会尚稳', body: '人口和派系状态可支撑继续发展，适合转向经济、科技或外交目标。', tone: 'good' });

  return localizeReactTree(
    <div>
      <Panel title="人口判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {advice.slice(0, 4).map((a) => <Guide key={a.title} {...a} />)}
        </div>
      </Panel>

      <Panel title="人口与阶层" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
          <Stat kind="core" accent="var(--food)" label="总人口" value={totalPop} />
          <Stat kind="core" accent="var(--accent)" label="省份数" value={provs.length} />
          <Stat kind="core" accent="var(--stable)" label="阶层满意" value={avgClassSat} warn={avgClassSat < 45} />
          <Stat kind="core" accent="var(--warn)" label="平均不满" value={avgUnrest} warn={avgUnrest > 45} />
          <Stat kind="core" accent="var(--good)" label="平均忠诚" value={avgLoyalty} warn={avgLoyalty < 45} />
        </div>
        <Divider label="阶层（全国汇总）" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {classes.map(([k, v]) => {
            const sat = v.sat; const t = tone(sat);
            return <div key={k} className="ia-card" style={{ padding: 10, borderLeft: t === 'danger' ? '3px solid var(--war)' : t === 'warn' ? '3px solid var(--warn)' : undefined }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><strong style={{ fontSize: 13 }}>{CLASS_LABEL[k] ?? k}</strong><Tag text={`${v.count}人`} tone="info" /></div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ flex: 1 }}><Bar value={sat} kind="high" /></div><strong style={{ fontSize: 13, width: 32, textAlign: 'right', color: `var(--${t === 'danger' ? 'war' : t === 'warn' ? 'warn' : 'good'})` }}>{Math.round(sat)}</strong></div>{sat < 45 && <div style={{ marginTop: 6, fontSize: 10, color: 'var(--warn)' }}>需关注：满意度偏低</div>}</div>;
          })}
        </div>
      </Panel>

      <Panel title="派系权力与满意度">
        <p className="dim" style={{ fontSize: 11, marginBottom: 10 }}>派系满意度低会增加政治事件风险。安抚消耗 30 金；长期更应通过政策和法律解决。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {player.factions.map((f) => {
            const sat = f.satisfaction; const t = tone(sat); const color = FACTION_COLOR[f.id] ?? 'var(--border-hi)';
            return <div key={f.id} className="ia-card" style={{ padding: 12, position: 'relative', overflow: 'hidden', border: sat < 35 ? '1px solid var(--warn)' : undefined }}><div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color }} /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div><strong style={{ fontSize: 14 }}>{FACTION_LABEL[f.id] ?? f.id}</strong><Tag text={`权力 ${f.power}`} tone="info" /></div><Btn label="安抚 30金" variant="ghost" onClick={() => appeaseFaction(f.id)} disabled={player.resources.gold < 30} /></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, color: 'var(--text-mute)', width: 36 }}>满意</span><div style={{ flex: 1 }}><Bar value={sat} kind="high" /></div><strong style={{ fontSize: 14, width: 32, textAlign: 'right', color: `var(--${t === 'danger' ? 'war' : t === 'warn' ? 'warn' : 'good'})` }}>{Math.round(sat)}</strong></div>{sat < 30 && <div className="danger" style={{ fontSize: 11, marginTop: 6 }}>⚠ 派系强烈不满</div>}{f.power > 60 && sat < 45 && <div style={{ fontSize: 11, marginTop: 4, color: 'var(--warn)' }}>高权力低满意，政治风险偏高</div>}</div>;
          })}
        </div>
      </Panel>
    </div>
  );
}

function Guide({ title, body, tone }: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info' }) {
  return <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{title}</strong><Tag text={tone === 'danger' ? '紧急' : tone === 'warn' ? '注意' : tone === 'good' ? '良好' : '建议'} tone={tone} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{body}</div></div>;
}
