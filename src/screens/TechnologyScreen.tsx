// Technology v2 — 三路科技树可视化 + 研发状态色 + 科研点置顶
import { useGameStore } from '../store/gameStore';
import { TECHNOLOGIES } from '../data/technologies';
import { startResearch } from '../engine/technology';
import { Panel, Stat, Btn, Tag, Bar, Divider } from '../components/ui';

const BRANCH_LABEL: Record<string, string> = { agri: '农业', mil: '军事', admin: '行政', culture: '文化' };
const BRANCH_COLOR: Record<string, string> = { agri: 'var(--food)', mil: 'var(--war)', admin: 'var(--accent)', culture: 'var(--gold)' };
const BRANCH_ICON: Record<string, string> = { agri: '🌾', mil: '⚔', admin: '⚖', culture: '✦' };

export default function TechnologyScreen() {
  const { state, logMsg } = useGameStore();
  // C2: player 用 selector 精确订阅
  const player = useGameStore((s) => s.state.nations[s.state.playerNationId]);
  const researching = player.tech.researchProgress;
  const researchingTech = researching ? TECHNOLOGIES.find((t) => t.id === researching.techId) : null;
  const researchingPct = researching && researchingTech ? Math.min(100, (researching.sciPtInvested / researchingTech.costSci) * 100) : 0;

  const doResearch = (techId: string) => {
    const r = startResearch(player, techId);
    logMsg(r.ok ? `开始研发 ${techId}` : `研发失败：${r.reason}`);
    useGameStore.setState((s) => ({ state: { ...s.state } }));
  };

  return (
    <div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>研发中：{BRANCH_ICON[researchingTech.branch]} {researchingTech.name}</strong>
              <Tag text={`${researching.sciPtInvested}/${researchingTech.costSci}科`} tone="warn" />
            </div>
            <Bar value={researchingPct} kind="high" />
            <p className="dim" style={{ fontSize: 10, marginTop: 6, marginBottom: 0 }}>AI 渐进研发中 · 玩家点下方"研发"即时完成</p>
          </div>
        ) : (
          <p className="dim" style={{ fontSize: 12 }}>点下方科技即时研发完成（扣科研点+金）。AI 国家渐进研发——你比 AI 更灵活，可即时决策关键突破。</p>
        )}
      </Panel>

      {(['agri', 'mil', 'admin', 'culture'] as const).map((branch) => {
        const techs = TECHNOLOGIES.filter((t) => t.branch === branch);
        const currentLv = player.tech[branch];
        return (
          <Panel key={branch} title={`${BRANCH_ICON[branch]} ${BRANCH_LABEL[branch]}科技树 · 当前 Lv${currentLv}`}>
            {/* E14: 树状连线——左侧分支主线 + 节点 */}
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* 分支主线 */}
              <div style={{
                position: 'absolute', left: 12, top: 16, bottom: 16, width: 2,
                background: `linear-gradient(to bottom, ${BRANCH_COLOR[branch]}, transparent)`,
                opacity: 0.4,
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {techs.map((t, idx) => {
                const done = currentLv >= t.level;
                const available = !done && (!t.prereqTech || currentLv >= t.level - 1);
                const inProgress = researching?.techId === t.id;
                const can = available && !done && !researching && player.resources.gold >= t.costGold;
                return (
                  <div key={t.id} className="ia-card" style={{
                    padding: 10, opacity: done ? 0.7 : 1, position: 'relative',
                    border: done ? '1px solid var(--good)' : inProgress ? '1px solid var(--warn)' : '1px solid var(--border)',
                    boxShadow: inProgress ? '0 0 12px rgba(201,164,78,0.3)' : 'none',
                    animation: inProgress ? 'ia-pulse 1.5s ease-in-out infinite' : 'none',
                  }}>
                    {/* 分支节点圆点 */}
                    <div style={{
                      position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)',
                      width: 14, height: 14, borderRadius: '50%',
                      background: done ? BRANCH_COLOR[branch] : inProgress ? 'var(--warn)' : 'var(--bg-inset)',
                      border: `2px solid ${done ? BRANCH_COLOR[branch] : 'var(--border)'}`,
                      zIndex: 1,
                    }} />
                    {idx > 0 && (
                      <div style={{
                        position: 'absolute', left: -18, top: -6, width: 2, height: 12,
                        background: done ? BRANCH_COLOR[branch] : 'var(--border)', opacity: 0.5,
                      }} />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px', gap: 8, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: BRANCH_COLOR[branch] }}>{t.level}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Lv</div>
                      </div>
                      <div>
                        <strong style={{ fontSize: 13 }}>{t.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{t.description}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-mute)', textAlign: 'right' }}>
                        {t.costSci}科 · {t.costGold}金
                      </div>
                      <div>
                        {done ? <Tag text="已学" tone="good" /> :
                          inProgress ? <Tag text="研发中" tone="warn" /> :
                          available ? <Btn label="研发" variant="ghost" onClick={() => doResearch(t.id)} disabled={!can} /> :
                          <Tag text="锁定" tone="info" />}
                      </div>
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
