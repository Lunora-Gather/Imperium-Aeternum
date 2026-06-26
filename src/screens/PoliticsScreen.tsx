// Politics v3 — 政局判断：稳定、合法、腐败、派系风险先于政策列表
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { POLICIES } from '../data/policies';
import { GOVERNMENTS } from '../data/governments';
import { LAWS, LAWS_BY_CATEGORY, LAW_CATEGORY_LABEL } from '../data/laws';
import type { LawCategory } from '../data/laws';
import { Panel, StatRow, Btn, Tag, Divider } from '../components/ui';
import type { PolicyId } from '../data/policies';

const factionLabel = (id: string): string => ({ nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职' }[id] ?? id);

function toneByValue(value: number, lowBad = true): 'danger' | 'warn' | 'good' | 'info' {
  if (lowBad) return value < 30 ? 'danger' : value < 50 ? 'warn' : value >= 70 ? 'good' : 'info';
  return value > 65 ? 'danger' : value > 45 ? 'warn' : value < 20 ? 'good' : 'info';
}

export default function PoliticsScreen() {
  const { state, enactPolicy, enactLaw, suppressRebellion, negotiateRebellion } = useGameStore();
  const player = useGameStore((s) => s.state.nations[s.state.playerNationId]);
  const govDef = GOVERNMENTS[player.government.type];
  const [tab, setTab] = useState<'policy' | 'law'>('policy');

  const enact = (id: PolicyId) => { enactPolicy(id); };
  const doEnactLaw = (id: string) => { enactLaw(id); };
  const lowFactions = [...player.factions].sort((a, b) => a.satisfaction - b.satisfaction).slice(0, 3);
  const urgentFactions = lowFactions.filter((f) => f.satisfaction < 40);
  const activePolicyIds = new Set(player.activePolicies.map((p) => p.policyId));
  const activeLawIds = new Set(player.activeLaws.map((l) => l.lawId));

  const advice: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info'; tab?: 'policy' | 'law' }[] = [];
  if (player.civilWar?.active) advice.push({ title: '内战处理中', body: '优先选择镇压或谈判，否则每回合会持续损耗稳定与税收。', tone: 'danger' });
  if (player.government.stability < 30) advice.push({ title: '稳定危急', body: '稳定过低会触发崩溃或叛乱，应优先选择加稳定的政策或法律。', tone: 'danger', tab: 'policy' });
  if (player.government.legitimacy < 30) advice.push({ title: '合法性危急', body: '合法性不足会削弱统治，优先推行增加合法性的法律。', tone: 'danger', tab: 'law' });
  if (player.government.corruption > 55) advice.push({ title: '腐败偏高', body: '腐败会吞掉财政收入，优先考虑行政类法律和改革。', tone: 'warn', tab: 'law' });
  if (urgentFactions.length > 0) advice.push({ title: '派系不满', body: `${urgentFactions.map((f) => factionLabel(f.id)).join('、')} 不满偏高，政策选择要看派系反应。`, tone: 'warn', tab: 'policy' });
  if (player.resources.adminPt < 2) advice.push({ title: '行政点不足', body: '大多数政策和法律需要行动点，先处理最紧急事项。', tone: 'warn' });
  if (advice.length === 0) advice.push({ title: '政局尚稳', body: '可根据国运路线选择：稳国内政、降腐败、提高治能或补合法性。', tone: 'good' });

  return (
    <div>
      <Panel title="政局判断" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 10 }}>
          {advice.slice(0, 4).map((a) => <Guide key={a.title} title={a.title} body={a.body} tone={a.tone} onClick={a.tab ? () => setTab(a.tab!) : undefined} />)}
        </div>
        <Divider label="派系温度" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
          {lowFactions.map((f) => <div key={f.id} className="ia-card" style={{ padding: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><strong style={{ fontSize: 12 }}>{factionLabel(f.id)}</strong><Tag text={`${Math.round(f.satisfaction)}`} tone={toneByValue(f.satisfaction)} /></div><MiniBar value={f.satisfaction} /></div>)}
        </div>
      </Panel>

      <Panel title="政体与稳定" accent>
        <div className="ia-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div><Tag text={govDef.name} tone="info" /><span style={{ marginLeft: 8, fontSize: 13 }}>统治者 <strong>{player.ruler.name}</strong> · {player.ruler.age}岁 · 能力 {player.ruler.ability}</span></div>
          </div>
          <p className="dim" style={{ fontSize: 12, margin: 0 }}>{govDef.description}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><StatRow label="稳定度" value={player.government.stability} kind="high" warn={player.government.stability < 30} /><StatRow label="合法性" value={player.government.legitimacy} kind="high" warn={player.government.legitimacy < 30} /></div>
          <div><StatRow label="行政能力" value={player.government.efficiency} kind="high" /><StatRow label="腐败" value={player.government.corruption} kind="low" warn={player.government.corruption > 50} /></div>
        </div>
      </Panel>

      {player.civilWar?.active && (
        <Panel title="⚠ 内战爆发" accent>
          <div className="ia-card" style={{ marginBottom: 12, borderColor: 'var(--war)' }}>
            <p style={{ color: 'var(--war)', fontSize: 13, margin: '0 0 8px' }}>{player.civilWar.rebels.length} 省叛乱，内战持续中。每回合稳定 -3、税收 ×0.7。叛军占首都则国家分裂。</p>
            <p className="dim" style={{ fontSize: 12, margin: '0 0 10px' }}>当前军队 {player.army.reduce((s, a) => s + a.size, 0)} · 金 {player.resources.gold}</p>
            <div style={{ display: 'flex', gap: 8 }}><Btn label="镇压（150金+200兵+稳定-10）" onClick={() => suppressRebellion()} variant="warn" /><Btn label="谈判（合法-15+稳定+15）" onClick={() => negotiateRebellion()} /></div>
          </div>
        </Panel>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button className="ia-btn ia-btn--ghost" onClick={() => setTab('policy')} style={tab === 'policy' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>政策（{player.activePolicies.length}）</button>
        <button className="ia-btn ia-btn--ghost" onClick={() => setTab('law')} style={tab === 'law' ? { color: 'var(--gold)', borderColor: 'var(--border-gold)' } : {}}>法律（{player.activeLaws.length}）</button>
      </div>

      {tab === 'policy' ? (
        <>
          <Panel title={`已推行政策（${player.activePolicies.length}）`}>
            {player.activePolicies.length === 0 ? <span className="dim">无</span> : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{player.activePolicies.map((p) => { const def = POLICIES.find((x) => x.id === p.policyId); return <Tag key={p.policyId} text={def?.name ?? p.policyId} tone="good" />; })}</div>}
          </Panel>
          <Panel title="可推行政策">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
              {POLICIES.map((p) => {
                const already = activePolicyIds.has(p.id);
                const govOk = p.allowedGovernments.length === 0 || p.allowedGovernments.includes(player.government.type);
                const techOk = !p.prereqTech || player.tech.admin >= 3;
                const goldOk = player.resources.gold >= p.costGold;
                const can = !already && govOk && techOk && goldOk;
                const blockers: string[] = [];
                if (!govOk) blockers.push('政体不符');
                if (!techOk) blockers.push('需行政Lv3');
                if (!goldOk) blockers.push('金不足');
                return <PolicyCard key={p.id} title={p.name} desc={p.description} already={already} can={can} cost={p.costGold} blocker={blockers[0]} factionReaction={p.factionReaction} onClick={() => enact(p.id)} />;
              })}
            </div>
          </Panel>
        </>
      ) : (
        <>
          <Panel title={`已推行法律（${player.activeLaws.length}）`}>
            {player.activeLaws.length === 0 ? <span className="dim">无</span> : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{player.activeLaws.map((l) => { const def = LAWS.find((x) => x.id === l.lawId); return <Tag key={l.lawId} text={`${def?.name ?? l.lawId}·${LAW_CATEGORY_LABEL[def?.category ?? 'civil']}`} tone="good" />; })}</div>}
          </Panel>
          {(['civil', 'criminal', 'administrative'] as LawCategory[]).map((cat) => (
            <Panel key={cat} title={`${LAW_CATEGORY_LABEL[cat]}（${LAWS_BY_CATEGORY[cat].length}）`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {LAWS_BY_CATEGORY[cat].map((l) => {
                  const already = activeLawIds.has(l.id);
                  const govOk = l.allowedGovernments.length === 0 || l.allowedGovernments.includes(player.government.type);
                  const techOk = player.tech.admin >= l.prereqAdminLevel;
                  const conflict = l.conflictsWith?.some((c) => activeLawIds.has(c));
                  const goldOk = player.resources.gold >= l.costGold;
                  const can = !already && govOk && techOk && !conflict && goldOk;
                  const blocker = !govOk ? '政体不符' : !techOk ? `需行政Lv${l.prereqAdminLevel}` : conflict ? '互斥法律已推行' : !goldOk ? '金不足' : null;
                  return <LawCard key={l.id} title={l.name} desc={l.description} effects={l.effects} already={already} can={can} cost={l.costGold} blocker={blocker} factionReaction={l.factionReaction} onClick={() => doEnactLaw(l.id)} />;
                })}
              </div>
            </Panel>
          ))}
        </>
      )}
    </div>
  );
}

function Guide({ title, body, tone, onClick }: { title: string; body: string; tone: 'danger' | 'warn' | 'good' | 'info'; onClick?: () => void }) {
  const content = <><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><strong style={{ fontSize: 13 }}>{title}</strong><Tag text={tone === 'danger' ? '紧急' : tone === 'warn' ? '注意' : tone === 'good' ? '良好' : '建议'} tone={tone} /></div><div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{body}</div></>;
  if (onClick) return <button className="ia-card" onClick={onClick} style={{ padding: 10, textAlign: 'left', cursor: 'pointer', borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}>{content}</button>;
  return <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}>{content}</div>;
}

function PolicyCard({ title, desc, already, can, cost, blocker, factionReaction, onClick }: { title: string; desc: string; already: boolean; can: boolean; cost: number; blocker?: string | null; factionReaction: Record<string, number>; onClick: () => void }) {
  return <div className="ia-card" style={{ padding: 10, opacity: can || already ? 1 : 0.7, border: already ? '1px solid var(--good)' : can ? '1px solid var(--border-gold)' : '1px solid var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}><strong style={{ fontSize: 13 }}>{title}</strong>{already ? <Tag text="已推行" tone="good" /> : blocker ? <Tag text={blocker} tone="danger" /> : <Tag text={`${cost}金`} tone="info" />}</div><p className="dim" style={{ fontSize: 11, margin: '0 0 8px 0', lineHeight: 1.5 }}>{desc}</p><FactionBadges reaction={factionReaction} /><Btn label={already ? '已推行' : '推行'} variant={can ? 'primary' : 'ghost'} onClick={onClick} disabled={!can} /></div>;
}

function LawCard({ title, desc, effects, already, can, cost, blocker, factionReaction, onClick }: { title: string; desc: string; effects: Record<string, number | undefined>; already: boolean; can: boolean; cost: number; blocker?: string | null; factionReaction: Record<string, number>; onClick: () => void }) {
  const effectText = [effects.corruptionMod ? `腐败${effects.corruptionMod > 0 ? '+' : ''}${effects.corruptionMod}` : '', effects.stabilityMod ? `稳定${effects.stabilityMod > 0 ? '+' : ''}${effects.stabilityMod}` : '', effects.efficiencyMod ? `治能${effects.efficiencyMod > 0 ? '+' : ''}${effects.efficiencyMod}` : '', effects.legitimacyMod ? `合法${effects.legitimacyMod > 0 ? '+' : ''}${effects.legitimacyMod}` : '', effects.taxEffMod && effects.taxEffMod !== 1 ? `税率×${Number(effects.taxEffMod).toFixed(2)}` : '', effects.unrestReduction ? `不满-${effects.unrestReduction}/回合` : '', effects.rebellionReduction ? `叛乱-${effects.rebellionReduction}/回合` : ''].filter(Boolean).join(' · ');
  return <div className="ia-card" style={{ padding: 10, opacity: can || already ? 1 : 0.7, border: already ? '1px solid var(--good)' : can ? '1px solid var(--border-gold)' : '1px solid var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}><strong style={{ fontSize: 12 }}>{title}</strong>{already ? <Tag text="已推行" tone="good" /> : blocker ? <Tag text={blocker} tone="danger" /> : <Tag text={`${cost}金`} tone="info" />}</div><p className="dim" style={{ fontSize: 10, margin: '0 0 6px 0', lineHeight: 1.4 }}>{desc}</p>{effectText && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>{effectText}</div>}<FactionBadges reaction={factionReaction} /><Btn label={already ? '已推行' : '推行'} variant={can ? 'primary' : 'ghost'} onClick={onClick} disabled={!can} /></div>;
}

function FactionBadges({ reaction }: { reaction: Record<string, number> }) {
  const entries = Object.entries(reaction).filter(([, delta]) => delta !== 0);
  if (entries.length === 0) return null;
  return <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>{entries.map(([fid, delta]) => <span key={fid} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, color: delta > 0 ? 'var(--good)' : 'var(--war)', background: delta > 0 ? 'rgba(122,154,62,0.1)' : 'rgba(162,61,40,0.1)' }}>{factionLabel(fid)} {delta > 0 ? '+' : ''}{delta}</span>)}</div>;
}

function MiniBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct < 30 ? 'var(--war)' : pct < 50 ? 'var(--warn)' : 'var(--good)';
  return <div style={{ height: 7, borderRadius: 999, background: 'var(--bg-inset)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: color }} /></div>;
}
