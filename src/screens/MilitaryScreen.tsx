import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { findRelationExplicit } from '../engine/diplomacy';
import { Panel, Stat, Btn, Tag, Bar, Divider } from '../components/ui';
import type { War, Army, GameState } from '../types/game';

function peaceTermsText(war: War, state: GameState, pid: string): { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] {
  const attacking = war.attackerId === pid;
  const out: { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] = [];
  if (war.progress >= 60) {
    if (attacking) {
      out.push({ txt: '✓ 割占目标省', tone: 'good' });
      out.push({ txt: '✓ 获赔款', tone: 'good' });
    } else {
      out.push({ txt: '✗ 失目标省', tone: 'danger' });
      out.push({ txt: '✗ 赔款', tone: 'danger' });
    }
  } else if (war.progress <= 40) {
    if (attacking) {
      out.push({ txt: '✗ 赔款', tone: 'danger' });
      out.push({ txt: '✗ 厌战+10', tone: 'danger' });
    } else {
      out.push({ txt: '✓ 获赔款', tone: 'good' });
    }
  } else {
    out.push({ txt: '白和（无割让）', tone: 'info' });
  }
  return out;
}

function PeaceTermsBtn({ war, state, pid, makePeace, logMsg }: {
  war: War; state: GameState; pid: string;
  makePeace: (id: string) => boolean; logMsg: (m: string) => void;
}) {
  const [show, setShow] = useState(false);
  const terms = peaceTermsText(war, state, pid);
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Btn label="求和" variant="ghost" onClick={() => { if (makePeace(war.id)) logMsg('议和成功'); }} />
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
          background: 'var(--bg-panel)', border: '1px solid var(--border-hi)', borderRadius: 6,
          padding: 8, minWidth: 140, zIndex: 50, fontSize: 11,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, letterSpacing: '0.05em' }}>和约条件（进度 {Math.round(war.progress)}%）</div>
          {terms.map((t, i) => <div key={i} style={{ color: `var(--${t.tone === 'good' ? 'good' : t.tone === 'danger' ? 'war' : t.tone === 'warn' ? 'warn' : 'text'})`, padding: '1px 0' }}>{t.txt}</div>)}
        </div>
      )}
    </div>
  );
}

function MoveArmyModal({ army, onClose }: { army: Army; onClose: () => void }) {
  const { state, moveArmy } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const fromProv = state.provinces[army.location];
  const myProvs = provincesOf(pid, state.provinces);
  const targets = myProvs.filter((p) => {
    if (p.id === army.location) return false;
    const isAdj = fromProv?.adjacent.includes(p.id);
    const isHub = p.id === player.capital || army.location === player.capital;
    return isAdj || isHub;
  });
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: 18, maxWidth: 480, width: '90%', border: '2px solid var(--border-hi)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="ia-display" style={{ margin: 0, fontSize: 16 }}>➤ 调动军队 · {fromProv?.name}</h3>
          <Btn label="✕" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 10 }}>
          兵力 <strong style={{ color: 'var(--war)' }}>{army.size}</strong> · 仅可调至相邻己省或首都枢纽（首都调动半价）
        </div>
        {targets.length === 0 ? <p className="dim">无可调动目标（需相邻己省或首都枢纽）</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {targets.map((p) => {
              const isHub = p.id === player.capital || army.location === player.capital;
              const cost = Math.round((isHub ? 3 : 5) + army.size * (isHub ? 0.15 : 0.3));
              const enough = player.resources.gold >= cost;
              return (
                <div key={p.id} className="ia-card" style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 12 }}>{p.name}</strong>
                    <span className="dim" style={{ fontSize: 10, marginLeft: 6 }}>{isHub ? '首都枢纽' : '相邻'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Tag text={`${cost}金`} tone={enough ? 'info' : 'danger'} />
                    <Btn label="调动" variant={enough ? 'primary' : 'ghost'} disabled={!enough} onClick={() => { if (moveArmy(army.id, p.id)) onClose(); }} />
                  </div>
                </div>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
}

function BattleReportModal({ war, onClose }: { war: War; onClose: () => void }) {
  const state = useGameStore((s) => s.state);
  const prov = state.provinces[war.targetProvinceId];
  const attacker = state.nations[war.attackerId];
  const defender = state.nations[war.defenderId];
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} className="ia-battle-in" style={{ background: 'var(--bg-panel)', borderRadius: 10, padding: 18, maxWidth: 560, width: '90%', border: '2px solid var(--war)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(162,61,40,0.15)', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="ia-display" style={{ margin: 0, fontSize: 16, color: 'var(--war)' }}>⚔ 战报 · {prov?.name ?? war.targetProvinceId}</h3>
          <Btn label="✕" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 12 }}>
          {attacker?.name} 攻 vs {defender?.name} 守 · 进度 {Math.round(war.progress)}% · 已 {war.turns} 年
        </div>
        {war.battleReports.length === 0 ? <p className="dim">尚无战报</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {war.battleReports.slice().reverse().map((r, i) => {
              const tone = r.outcome === 'advance' ? 'good' : r.outcome === 'repelled' ? 'danger' : 'warn';
              const icon = r.outcome === 'advance' ? '▲' : r.outcome === 'repelled' ? '▼' : '◆';
              return (
                <div key={i} className="ia-card ia-report-row" style={{ padding: 10, borderLeft: `3px solid var(--${tone === 'good' ? 'good' : tone === 'danger' ? 'war' : 'warn'})`, animationDelay: `${i * 0.08}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 12, color: `var(--${tone === 'good' ? 'good' : tone === 'danger' ? 'war' : 'warn'})` }}>{icon} {r.narrative}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 12 }}>
                    <span>我军 {r.attSize} → 折 {r.attLoss}</span>
                    <span>敌军 {r.defSize} → 折 {r.defLoss}</span>
                    <span>进度 {r.progressDelta >= 0 ? '+' : ''}{r.progressDelta}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
}

export default function MilitaryScreen() {
  const { state, recruit, makePeace, declareWar: storeDeclareWar, logMsg } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const myWars = state.wars.filter((w) => w.attackerId === pid || w.defenderId === pid);
  const armyTotal = player.army.reduce((s, a) => s + a.size, 0);
  const [reportWar, setReportWar] = useState<War | null>(null);
  const [moveTarget, setMoveTarget] = useState<Army | null>(null);

  const frontierProvinceIds = new Set<string>();
  for (const p of provs) {
    if (p.adjacent.some((id) => state.provinces[id] && state.provinces[id].ownerId !== pid)) frontierProvinceIds.add(p.id);
  }
  const frontierArmies = player.army.filter((a) => frontierProvinceIds.has(a.location));
  const weakArmies = player.army.filter((a) => a.morale < 40 || a.supply < 35 || a.equipment < 35);
  const possibleWarRows = provs.flatMap((p) => p.adjacent.map((adjId) => {
    const adj = state.provinces[adjId];
    if (!adj || adj.ownerId === pid) return null;
    const rel = findRelationExplicit(pid, adj.ownerId, state);
    if (rel?.treaty === 'alliance') return null;
    return { p, adj, rel };
  })).filter((x): x is NonNullable<typeof x> => !!x);

  const guidance: { title: string; body: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] = [];
  if (myWars.length > 0 && frontierArmies.length === 0) guidance.push({ title: '先调兵到前线', body: '你在战争中，但军队没有部署在边境省。先点“调动”，把军队移到敌省相邻的己省。', tone: 'danger' });
  if (player.warExhaustion > 60) guidance.push({ title: '考虑议和', body: '厌战过高会拖垮稳定和财政。若战线没有优势，优先求和止损。', tone: 'warn' });
  if (weakArmies.length > 0) guidance.push({ title: '军队状态偏差', body: `${weakArmies.length} 支军队士气/装备/补给偏低，避免贸然进攻。`, tone: 'warn' });
  if (armyTotal < Math.max(150, provs.length * 35)) guidance.push({ title: '兵力偏少', body: '当前兵力不足以支撑扩张，优先征兵或提升补给。', tone: 'warn' });
  if (myWars.length === 0 && possibleWarRows.length > 0 && armyTotal >= Math.max(200, provs.length * 45)) guidance.push({ title: '可选择扩张', body: '当前无战争且兵力尚可，可在宣战区选择低关系邻国。', tone: 'good' });
  if (guidance.length === 0) guidance.push({ title: '军情平稳', body: '保持边境驻军，避免多线作战，等待更好的扩张机会。', tone: 'info' });

  const doDeclare = (target: string, provId: string) => { storeDeclareWar(target, provId); };

  return (
    <div>
      <Panel title="军情判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
          {guidance.slice(0, 3).map((g, i) => (
            <div key={i} className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${g.tone === 'danger' ? 'war' : g.tone === 'warn' ? 'warn' : g.tone === 'good' ? 'good' : 'border'})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 13 }}>{g.title}</strong>
                <Tag text={g.tone === 'danger' ? '紧急' : g.tone === 'warn' ? '注意' : g.tone === 'good' ? '机会' : '情报'} tone={g.tone} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{g.body}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="军力概览" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          <Stat kind="core" accent="var(--war)" label="总兵力" value={armyTotal} />
          <Stat kind="core" accent="var(--warn)" label="厌战" value={player.warExhaustion} warn={player.warExhaustion > 50} />
          <Stat kind="core" accent="var(--stable)" label="补给" value={player.resources.supply} />
          <Stat kind="core" accent={player.atWar ? 'var(--war)' : 'var(--good)'} label="状态" value={player.atWar ? '战争中' : '和平'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatRowMini label="士气均值" value={player.army.length ? player.army.reduce((s, a) => s + a.morale, 0) / player.army.length : 0} kind="high" />
          <StatRowMini label="训练均值" value={player.army.length ? player.army.reduce((s, a) => s + a.training, 0) / player.army.length : 0} kind="high" />
        </div>
      </Panel>

      <Panel title={`军队部署（${player.army.length}）`}>
        {player.army.length === 0 ? <span className="dim">无军队。在省份或下方征兵。</span> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {player.army.map((a) => {
              const prov = state.provinces[a.location];
              const front = frontierProvinceIds.has(a.location);
              return (
                <div key={a.id} className="ia-card" style={{ padding: 10, borderLeft: front ? '3px solid var(--war)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{prov?.name ?? a.location}</strong>
                    <div style={{ display: 'flex', gap: 4 }}><Tag text={`${a.size}人`} tone="info" />{front && <Tag text="前线" tone="danger" />}</div>
                  </div>
                  <StatRowMini label="士气" value={a.morale} kind="high" />
                  <StatRowMini label="训练" value={a.training} kind="high" />
                  <StatRowMini label="装备" value={a.equipment} kind="high" />
                  <Btn label="调动" variant="ghost" onClick={() => setMoveTarget(a)} />
                </div>
              );
            })}
          </div>
        }
      </Panel>

      <Panel title={`进行中的战争（${myWars.length}）`}>
        {myWars.length === 0 ? <span className="dim">无</span> :
          myWars.map((w) => {
            const prov = state.provinces[w.targetProvinceId];
            const attacking = w.attackerId === pid;
            return (
              <div key={w.id} className="ia-card" style={{ marginBottom: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div><Tag text={attacking ? '进攻' : '防守'} tone={attacking ? 'danger' : 'warn'} /><strong style={{ marginLeft: 6, fontSize: 13 }}>{prov?.name ?? w.targetProvinceId}</strong></div>
                  <span className="dim" style={{ fontSize: 11 }}>第 {w.turns} 回合</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 36 }}>进度</span>
                  <div style={{ flex: 1 }}><Bar value={w.progress} kind="high" /></div>
                  <strong style={{ fontSize: 13, color: 'var(--border-hi)', width: 40, textAlign: 'right' }}>{Math.round(w.progress)}%</strong>
                  <Btn label="战报" variant="ghost" onClick={() => setReportWar(w)} />
                  <PeaceTermsBtn war={w} state={state} pid={pid} makePeace={makePeace} logMsg={logMsg} />
                </div>
              </div>
            );
          })
        }
      </Panel>

      {reportWar && <BattleReportModal war={reportWar} onClose={() => setReportWar(null)} />}
      {moveTarget && <MoveArmyModal army={moveTarget} onClose={() => setMoveTarget(null)} />}

      <Panel title="宣战">
        <p className="dim" style={{ fontSize: 11, marginBottom: 8 }}>向相邻非同盟国家宣战。战力对比助你预判胜算——<span style={{ color: 'var(--good)' }}>绿</span>占优、<span style={{ color: 'var(--warn)' }}>黄</span>均势、<span style={{ color: 'var(--war)' }}>红</span>劣势。</p>
        <div className="ia-card" style={{ marginBottom: 8, padding: 8, background: 'rgba(201,120,40,0.08)', border: '1px solid var(--warn)' }}>
          <span style={{ fontSize: 11, color: 'var(--warn)' }}>⚠ 战略要点：宣战后须在“军队部署”区把军队调动到与敌省相邻的己省（前线），否则无军队在前线将自动议和。</span>
        </div>
        <div>
          {possibleWarRows.map(({ p, adj, rel }) => {
            if (rel?.treaty === 'truce' && rel.truceTurns > 0) {
              const enemy = state.nations[adj.ownerId];
              return (
                <div key={`${p.id}-${adj.id}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 60px', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center', opacity: 0.6 }}>
                  <span style={{ fontSize: 12 }}>邻省 <strong>{adj.name}</strong> <span className="dim">属 {enemy?.name ?? adj.ownerId}</span></span>
                  <span style={{ fontSize: 12, color: 'var(--warn)' }}>停战 {rel.truceTurns} 回合</span>
                  <Tag text="停战" tone="warn" />
                </div>
              );
            }
            const relation = rel?.relation ?? 0;
            const tone = relation < -30 ? 'danger' : relation < 30 ? 'warn' : 'good';
            const enemy = state.nations[adj.ownerId];
            const enemyArmy = enemy?.army.reduce((s, a) => s + a.size, 0) ?? 0;
            const ratio = armyTotal > 0 ? armyTotal / Math.max(1, enemyArmy) : 0;
            const advantage = ratio >= 1.5 ? { txt: '占优', tone: 'good' as const } : ratio >= 0.8 ? { txt: '均势', tone: 'warn' as const } : { txt: '劣势', tone: 'danger' as const };
            return (
              <div key={`${p.id}-${adj.id}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px 70px', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>邻省 <strong>{adj.name}</strong> <span className="dim">属 {enemy?.name ?? adj.ownerId}</span></span>
                <span style={{ fontSize: 12, color: `var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : 'good'})` }}>关系 {Math.round(relation)}</span>
                <span style={{ fontSize: 12 }}><span style={{ color: 'var(--good)' }}>{armyTotal}</span><span className="dim" style={{ margin: '0 4px' }}>vs</span><span style={{ color: 'var(--war)' }}>{enemyArmy}</span></span>
                <Tag text={advantage.txt} tone={advantage.tone} />
                <Btn label="宣战" warn onClick={() => doDeclare(adj.ownerId, adj.id)} />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="征兵">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {provs.map((p) => (
            <div key={p.id} className="ia-card" style={{ padding: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{p.name} <span className="dim">({p.population}人)</span></div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn label="+50" variant="ghost" onClick={() => recruit(p.id, 50)} />
                <Btn label="+100" variant="ghost" onClick={() => recruit(p.id, 100)} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StatRowMini({ label, value, kind }: { label: string; value: number; kind: 'high' | 'low' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 32px', gap: 6, alignItems: 'center', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{label}</span>
      <Bar value={value} kind={kind} />
      <span style={{ fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
    </div>
  );
}
