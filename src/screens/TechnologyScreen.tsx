// Technology v3 — 科技路线判断：根据国势推荐农业/军事/行政/文化
import { useGameStore } from '../store/gameStore';
import { TECHNOLOGIES } from '../data/technologies';
import { Panel, Stat, Btn, Tag, Bar, Divider } from '../components/ui';

const BRANCH_LABEL: Record<string, string> = { agri: '农业', mil: '军事', admin: '行政', culture: '文化' };
const BRANCH_COLOR: Record<string, string> = { agri: 'var(--food)', mil: 'var(--war)', admin: 'var(--accent)', culture: 'var(--gold)' };
const BRANCH_ICON: Record<string, string> = { agri: '🌾', mil: '⚔', admin: '⚖', culture: '✦' };

type Branch = 'agri' | 'mil' | 'admin' | 'culture';

function nextTech(branch: Branch, level: number) {
  return TECHNOLOGIES.filter((t) => t.branch === branch && t.level > level).sort((a, b) => a.level - b.level)[0] ?? null;
}

function toneForBranch(branch: Branch): 'danger' | 'warn' | 'good' | 'info' {
  if (branch === 'agri') return 'good';
  if (branch === 'mil') return 'danger';
  if (branch === 'admin') return 'info';
  return 'warn';
}

export default function TechnologyScreen() {
  const { research, state } = useGameStore();
  const player = useGameStore((s) => s.state.nations[s.state.playerNationId]);
  const pid = state.playerNationId;
  const researching = player.tech.researchProgress;
  const researchingTech = researching ? TECHNOLOGIES.find((t) => t.id === researching.techId) : null;
  const researchingPct = researching && researchingTech ? Math.min(100, (researching.sciPtInvested / researchingTech.costSci) * 100) : 0;
  const atWar = state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const report = state.lastReport;

  const route: { branch: Branch; title: string; body: string; priority: number }[] = [];
  if (player.resources.food < 0 || (report && report.foodDelta < -80)) route.push({ branch: 'agri', title: '先补农业', body: '粮食危险时，农业科技能提升粮食基础和长期人口承载。', priority: 100 });
  if (atWar || player.warExhaustion > 45) route.push({ branch: 'mil', title: '补军事', body: '战争中优先军事科技，提升军队质量和补给能力。', priority: 90 });
  if (player.government.corruption > 50 || player.government.efficiency < 45) route.push({ branch: 'admin', title: '补行政', body: '腐败和治能问题会拖累全局，行政科技能打开政策和法律空间。', priority: 85 });
  if (player.resources.influence < 60 || player.government.legitimacy < 40) route.push({ branch: 'culture', title: '补文化', body: '文化科技适合外交、合法性和长期影响力路线。', priority: 70 });
  if (route.length < 3) route.push({ branch: 'admin', title: '通用路线', body: '行政科技通常最稳，能解锁政策、法律和治理效率。', priority: 50 });
  if (route.length < 3) route.push({ branch: 'agri', title: '发展路线', body: '农业科技适合和平发展，能支撑人口和税基。', priority: 45 });
  route.sort((a, b) => b.priority - a.priority);

  const doResearch = (techId: string) => { research(techId); };

  return (
    <div>
      <Panel title="科技路线判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
          {route.slice(0, 4).map((r) => {
            const t = nextTech(r.branch, player.tech[r.branch]);
            return <div key={`${r.branch}-${r.title}`} className="ia-card" style={{ padding: 10, borderLeft: `3px solid ${BRANCH_COLOR[r.branch]}` }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{BRANCH_ICON[r.branch]} {r.title}</strong><Tag text={BRANCH_LABEL[r.branch]} tone={toneForBranch(r.branch)} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{r.body}</div>{t && <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-mute)' }}>下一项：{t.name} · {t.costSci}科/{t.costGold}金</div>}</div>;
          })}
        </div>
      </Panel>

      <Panel title="科技总览" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
          <Stat kind="core" accent="var(--accent)" label="科研点" value={player.resources.sciPt} />
          <Stat kind="core" accent={BRANCH_COLOR.agri} label="农业" value={`Lv ${player.tech.agri}/8`} />
          <Stat kind="core" accent={BRANCH_COLOR.mil} label="军事" value={`Lv ${player.tech.mil}/8`} />
          <Stat kind="core" accent={BRANCH_COLOR.admin} label="行政" value={`Lv ${player.tech.admin}/8`} />
          <Stat kind="core" accent={BRANCH_COLOR.culture} label="文化" value={`Lv ${player.tech.culture}/8`} />
        </div>
        {researching && researchingTech ? (
          <div className="ia-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><strong style={{ fontSize: 13 }}>研发中：{BRANCH_ICON[researchingTech.branch]} {researchingTech.name}</strong><Tag text={`${researching.sciPtInvested}/${researchingTech.costSci}科`} tone="warn" /></div>
            <Bar value={researchingPct} kind="high" />
            <p className="dim" style={{ fontSize: 10, marginTop: 6, marginBottom: 0 }}>AI 渐进研发中 · 玩家点下方“研发”即时完成</p>
          </div>
        ) : <p className="dim" style={{ fontSize: 12 }}>点下方科技即时研发完成（扣科研点+金）。优先按上方路线判断选择关键突破。</p>}
      </Panel>

      {(['agri', 'mil', 'admin', 'culture'] as const).map((branch) => {
        const techs = TECHNOLOGIES.filter((t) => t.branch === branch);
        const currentLv = player.tech[branch];
        return (
          <Panel key={branch} title={`${BRANCH_ICON[branch]} ${BRANCH_LABEL[branch]}科技树 · 当前 Lv${currentLv}`}>
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div style={{ position: 'absolute', left: 12, top: 16, bottom: 16, width: 2, background: `linear-gradient(to bottom, ${BRANCH_COLOR[branch]}, transparent)`, opacity: 0.4 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {techs.map((t, idx) => {
                  const done = currentLv >= t.level;
                  const available = !done && (!t.prereqTech || currentLv >= t.level - 1);
                  const inProgress = researching?.techId === t.id;
                  const goldOk = player.resources.gold >= t.costGold;
                  const sciOk = player.resources.sciPt >= t.costSci;
                  const can = available && !done && !researching && goldOk && sciOk;
                  const blocker = !available ? '锁定' : !sciOk ? '科研不足' : !goldOk ? '金不足' : null;
                  return (
                    <div key={t.id} className="ia-card" style={{ padding: 10, opacity: done ? 0.7 : 1, position: 'relative', border: done ? '1px solid var(--good)' : inProgress ? '1px solid var(--warn)' : can ? '1px solid var(--border-gold)' : '1px solid var(--border)', boxShadow: inProgress ? '0 0 12px rgba(201,164,78,0.3)' : 'none', animation: inProgress ? 'ia-pulse 1.5s ease-in-out infinite' : 'none' }}>
                      <div style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', background: done ? BRANCH_COLOR[branch] : inProgress ? 'var(--warn)' : 'var(--bg-inset)', border: `2px solid ${done ? BRANCH_COLOR[branch] : 'var(--border)'}`, zIndex: 1 }} />
                      {idx > 0 && <div style={{ position: 'absolute', left: -18, top: -6, width: 2, height: 12, background: done ? BRANCH_COLOR[branch] : 'var(--border)', opacity: 0.5 }} />}
                      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 120px 86px', gap: 8, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: BRANCH_COLOR[branch] }}>{t.level}</div><div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Lv</div></div>
                        <div><strong style={{ fontSize: 13 }}>{t.name}</strong><div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{t.description}</div></div>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'right' }}>{t.costSci}科 · {t.costGold}金</div>
                        <div>{done ? <Tag text="已学" tone="good" /> : inProgress ? <Tag text="研发中" tone="warn" /> : can ? <Btn label="研发" variant="primary" onClick={() => doResearch(t.id)} /> : <Tag text={blocker ?? '锁定'} tone={blocker === '锁定' ? 'info' : 'danger'} />}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
