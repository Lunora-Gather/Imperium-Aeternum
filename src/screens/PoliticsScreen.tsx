// Politics v2 — 政体信息卡 + 政策列表状态色 + 推行按钮分级 + C2 法律页签
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { POLICIES } from '../data/policies';
import { GOVERNMENTS } from '../data/governments';
import { LAWS, LAWS_BY_CATEGORY, LAW_CATEGORY_LABEL } from '../data/laws';
import type { LawCategory } from '../data/laws';
import { Panel, StatRow, Btn, Tag, Divider } from '../components/ui';
import type { PolicyId } from '../data/policies';

// E11: 派系 id → 中文标签
const factionLabel = (id: string): string => ({
  nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职',
}[id] ?? id);

export default function PoliticsScreen() {
  const { state, enactPolicy, enactLaw, suppressRebellion, negotiateRebellion } = useGameStore();
  // C2: player 用 selector 精确订阅
  const player = useGameStore((s) => s.state.nations[s.state.playerNationId]);
  const govDef = GOVERNMENTS[player.government.type];
  const [tab, setTab] = useState<'policy' | 'law'>('policy');

  // P3: 不再叠加「推行失败」泛化提示——store 已按具体情况 log 了真实原因
  // （行动点不足/已推行/政体不允许/缺前置科技/金不足），重复提示反而冲淡真实原因
  const enact = (id: PolicyId) => { enactPolicy(id); };
  const doEnactLaw = (id: string) => { enactLaw(id); };

  return (
    <div>
      <Panel title="政体与稳定" accent>
        <div className="ia-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <Tag text={govDef.name} tone="info" />
              <span style={{ marginLeft: 8, fontSize: 13 }}>统治者 <strong>{player.ruler.name}</strong> · {player.ruler.age}岁 · 能力 {player.ruler.ability}</span>
            </div>
          </div>
          <p className="dim" style={{ fontSize: 12, margin: 0 }}>{govDef.description}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <StatRow label="稳定度" value={player.government.stability} kind="high" warn={player.government.stability < 30} />
            <StatRow label="合法性" value={player.government.legitimacy} kind="high" warn={player.government.legitimacy < 30} />
          </div>
          <div>
            <StatRow label="行政能力" value={player.government.efficiency} kind="high" />
            <StatRow label="腐败" value={player.government.corruption} kind="low" warn={player.government.corruption > 50} />
          </div>
        </div>
      </Panel>

      {/* A2: 内战状态卡——3-4 省叛乱时显示镇压/谈判按钮 */}
      {player.civilWar?.active && (
        <Panel title="⚠ 内战爆发" accent>
          <div className="ia-card" style={{ marginBottom: 12, borderColor: 'var(--danger, #c33)' }}>
            <p style={{ color: 'var(--danger, #c33)', fontSize: 13, margin: '0 0 8px' }}>
              {player.civilWar.rebels.length} 省叛乱，内战持续中。每回合稳定 -3、税收 ×0.7。叛军占首都则国家分裂。
            </p>
            <p className="dim" style={{ fontSize: 12, margin: '0 0 10px' }}>
              当前军队 {player.army.reduce((s, a) => s + a.size, 0)} · 金 {player.resources.gold}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn label="镇压（150金+200兵+稳定-10）" onClick={() => suppressRebellion()} variant="warn" />
              <Btn label="谈判（割1省+合法-15+稳定+15）" onClick={() => negotiateRebellion()} />
            </div>
          </div>
        </Panel>
      )}

      {/* C2: 政策/法律 切换页签 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button className="ia-btn ia-btn--ghost" onClick={() => setTab('policy')} style={tab === 'policy' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>政策（{player.activePolicies.length}）</button>
        <button className="ia-btn ia-btn--ghost" onClick={() => setTab('law')} style={tab === 'law' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>法律（{player.activeLaws.length}）</button>
      </div>

      {tab === 'policy' ? (
        <>
          <Panel title={`已推行政策（${player.activePolicies.length}）`}>
            {player.activePolicies.length === 0 ? <span className="dim">无</span> :
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {player.activePolicies.map((p) => {
                  const def = POLICIES.find((x) => x.id === p.policyId);
                  return <Tag key={p.policyId} text={def?.name ?? p.policyId} tone="good" />;
                })}
              </div>
            }
          </Panel>

          <Panel title="可推行政策">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
              {POLICIES.map((p) => {
                const already = player.activePolicies.some((x) => x.policyId === p.id);
                const govOk = p.allowedGovernments.length === 0 || p.allowedGovernments.includes(player.government.type);
                const techOk = !p.prereqTech || player.tech.admin >= 3;
                const goldOk = player.resources.gold >= p.costGold;
                const can = !already && govOk && techOk && goldOk;
                const blockers: string[] = [];
                if (!govOk) blockers.push('政体不符');
                if (!techOk) blockers.push('需Lv3');
                return (
                  <div key={p.id} className="ia-card" style={{ padding: 10, opacity: can ? 1 : 0.7, border: already ? '1px solid var(--good)' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <strong style={{ fontSize: 13 }}>{p.name}</strong>
                      {already ? <Tag text="已推行" tone="good" /> :
                        blockers.length > 0 ? <Tag text={blockers[0]} tone="danger" /> :
                        <Tag text={`${p.costGold}金`} tone={goldOk ? 'info' : 'warn'} />}
                    </div>
                    <p className="dim" style={{ fontSize: 11, margin: '0 0 8px 0', lineHeight: 1.5 }}>{p.description}</p>
                    {/* E11: 派系反应预览 */}
                    {Object.keys(p.factionReaction).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                        {Object.entries(p.factionReaction).map(([fid, delta]) => (
                          delta === 0 ? null : (
                            <span key={fid} style={{
                              fontSize: 10, padding: '1px 5px', borderRadius: 3,
                              color: delta > 0 ? 'var(--good)' : 'var(--war)',
                              background: delta > 0 ? 'rgba(122,154,62,0.1)' : 'rgba(162,61,40,0.1)',
                            }}>
                              {factionLabel(fid)} {delta > 0 ? '+' : ''}{delta}
                            </span>
                          )
                        ))}
                      </div>
                    )}
                    <Btn label={already ? '已推行' : '推行'} variant={can ? 'primary' : 'ghost'} onClick={() => enact(p.id)} disabled={!can} />
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      ) : (
        <>
          {/* C2: 法律页签 */}
          <Panel title={`已推行法律（${player.activeLaws.length}）`}>
            {player.activeLaws.length === 0 ? <span className="dim">无</span> :
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {player.activeLaws.map((l) => {
                  const def = LAWS.find((x) => x.id === l.lawId);
                  return <Tag key={l.lawId} text={`${def?.name ?? l.lawId}·${LAW_CATEGORY_LABEL[def?.category ?? 'civil']}`} tone="good" />;
                })}
              </div>
            }
          </Panel>

          {(['civil', 'criminal', 'administrative'] as LawCategory[]).map((cat) => (
            <Panel key={cat} title={`${LAW_CATEGORY_LABEL[cat]}（${LAWS_BY_CATEGORY[cat].length}）`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {LAWS_BY_CATEGORY[cat].map((l) => {
                  const already = player.activeLaws.some((x) => x.lawId === l.id);
                  const govOk = l.allowedGovernments.length === 0 || l.allowedGovernments.includes(player.government.type);
                  const techOk = player.tech.admin >= l.prereqAdminLevel;
                  const conflict = l.conflictsWith?.some((c) => player.activeLaws.some((x) => x.lawId === c));
                  const goldOk = player.resources.gold >= l.costGold;
                  const can = !already && govOk && techOk && !conflict && goldOk;
                  const blocker = !govOk ? '政体不符' : !techOk ? `需行政Lv${l.prereqAdminLevel}` : conflict ? '互斥法律已推行' : !goldOk ? '金不足' : null;
                  return (
                    <div key={l.id} className="ia-card" style={{ padding: 10, opacity: can ? 1 : 0.7, border: already ? '1px solid var(--good)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <strong style={{ fontSize: 12 }}>{l.name}</strong>
                        {already ? <Tag text="已推行" tone="good" /> : blocker ? <Tag text={blocker} tone="danger" /> : <Tag text={`${l.costGold}金`} tone="info" />}
                      </div>
                      <p className="dim" style={{ fontSize: 10, margin: '0 0 6px 0', lineHeight: 1.4 }}>{l.description}</p>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
                        {l.effects.corruptionMod ? `腐败${l.effects.corruptionMod > 0 ? '+' : ''}${l.effects.corruptionMod} ` : ''}
                        {l.effects.stabilityMod ? `稳定${l.effects.stabilityMod > 0 ? '+' : ''}${l.effects.stabilityMod} ` : ''}
                        {l.effects.efficiencyMod ? `治能${l.effects.efficiencyMod > 0 ? '+' : ''}${l.effects.efficiencyMod} ` : ''}
                        {l.effects.legitimacyMod ? `合法${l.effects.legitimacyMod > 0 ? '+' : ''}${l.effects.legitimacyMod} ` : ''}
                        {l.effects.taxEffMod && l.effects.taxEffMod !== 1 ? `税率×${l.effects.taxEffMod.toFixed(2)} ` : ''}
                        {l.effects.unrestReduction ? `不满-${l.effects.unrestReduction}/回合 ` : ''}
                        {l.effects.rebellionReduction ? `叛乱-${l.effects.rebellionReduction}/回合 ` : ''}
                      </div>
                      {/* E11: 派系反应预览 */}
                      {Object.keys(l.factionReaction).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {Object.entries(l.factionReaction).map(([fid, delta]) => (
                            delta === 0 ? null : (
                              <span key={fid} style={{
                                fontSize: 10, padding: '1px 5px', borderRadius: 3,
                                color: delta > 0 ? 'var(--good)' : 'var(--war)',
                                background: delta > 0 ? 'rgba(122,154,62,0.1)' : 'rgba(162,61,40,0.1)',
                              }}>
                                {factionLabel(fid)} {delta > 0 ? '+' : ''}{delta}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                      <Btn label={already ? '已推行' : '推行'} variant={can ? 'primary' : 'ghost'} onClick={() => doEnactLaw(l.id)} disabled={!can} />
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
        </>
      )}
    </div>
  );
}
