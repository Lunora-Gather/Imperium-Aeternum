// SaveLoad v5 — 存档体检 + 多槽位管理 + 旧档修复提示
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { listAllSlots, clearAllSaves, SAVE_VERSION, type getSlotMeta } from '../store/persistence';
import { Panel, Btn, Tag, Divider } from '../components/ui';

type SlotMeta = NonNullable<ReturnType<typeof getSlotMeta>>;

export default function SaveLoadScreen() {
  const { newGame, saveToSlot, loadFromSlot, deleteSlotSave, state, log } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const [slots, setSlots] = useState<ReturnType<typeof listAllSlots>>([]);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const refresh = () => setSlots(listAllSlots());
  useEffect(() => { refresh(); }, [state.turn, log.length]);

  const fmtTime = (iso: string) => { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '未知时间'; return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  const doClearAll = () => { if (!window.confirm('确认删除全部浏览器本地存档？此操作不能恢复。')) return; clearAllSaves(); refresh(); };
  const filled = slots.filter((s) => !!s.meta).length;
  const empty = slots.filter((s) => !s.meta && s.slot !== 0).length;
  const old = slots.filter((s) => s.meta && (s.meta as SlotMeta).version < SAVE_VERSION).length;
  const manual = slots.filter((s) => s.slot !== 0 && !!s.meta).length;
  const riskyNow = (player?.resources.gold ?? 0) < 0 || (player?.resources.food ?? 0) < 0 || (player?.government.stability ?? 100) < 35 || state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const advice = old > 0 ? { text: `${old} 个旧档可读档自动修复，读之前建议保留一个手动槽。`, tone: 'warn' as const } : manual === 0 ? { text: '还没有手动存档，建议立刻存到槽位 1-4。', tone: 'danger' as const } : riskyNow ? { text: '当前局势有风险，建议手动保存一个安全点。', tone: 'warn' as const } : empty > 0 ? { text: '存档结构正常，仍有空槽可做分支路线。', tone: 'good' as const } : { text: '槽位已满，覆盖前先确认年份和国家。', tone: 'info' as const };

  return <div>
    <Panel title="存档体检" accent>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}><Health label="已用槽位" value={filled} tone="info" /><Health label="手动存档" value={manual} tone={manual > 0 ? 'good' : 'danger'} /><Health label="空槽位" value={empty} tone={empty > 0 ? 'good' : 'warn'} /><Health label="旧档" value={old} tone={old > 0 ? 'warn' : 'good'} /></div>
      <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${advice.tone === 'danger' ? 'war' : advice.tone === 'warn' ? 'warn' : advice.tone === 'good' ? 'good' : 'border'})` }}><Tag text="建议" tone={advice.tone} /><span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-mute)' }}>{advice.text}</span></div>
    </Panel>

    <Panel title="存档管理" accent>
      <div className="ia-card" style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><strong style={{ fontSize: 14 }}>{player?.name ?? '未知'}</strong><div style={{ display: 'flex', gap: 6 }}><Tag text={`当前：第 ${state.turn + 1} 年`} tone="info" /><Tag text={`存档架构 v${SAVE_VERSION}`} tone="gold" /></div></div><div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-mute)', flexWrap: 'wrap' }}><span>省份 <strong style={{ color: 'var(--text)' }}>{provs.length}</strong></span><span>国库 <strong style={{ color: 'var(--gold)' }}>{Math.round(player?.resources.gold ?? 0)}</strong></span><span>粮储 <strong style={{ color: 'var(--food)' }}>{Math.round(player?.resources.food ?? 0)}</strong></span><span>稳定 <strong style={{ color: 'var(--stable)' }}>{Math.round(player?.government.stability ?? 0)}</strong></span><span>统治者 <strong style={{ color: 'var(--text)' }}>{player?.ruler.name ?? '?'}</strong></span></div></div>
      <Divider label="操作" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}><Btn label="新游戏" variant="primary" onClick={newGame} /><Btn label="清空全部存档" warn onClick={doClearAll} /></div>
      <Divider label="存档槽位（槽位 0 = 自动存档）" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>{slots.map((s) => { const isAuto = s.slot === 0; const meta = s.meta as SlotMeta | null; const isOld = !!meta && meta.version < SAVE_VERSION; const isCurrentNation = !!meta && meta.nationName === player?.name; return <div key={s.slot} className="ia-card" style={{ padding: 10, borderColor: isOld ? 'var(--warn)' : isAuto ? 'var(--border-gold)' : isCurrentNation ? 'var(--good)' : 'var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><strong style={{ fontSize: 13 }}>{isAuto ? '槽位 0（自动）' : `槽位 ${s.slot}`}</strong>{meta ? <Tag text={isOld ? `旧档 v${meta.version}→v${SAVE_VERSION}` : `v${meta.version}`} tone={isOld ? 'warn' : 'info'} /> : <Tag text="空" tone="info" />}</div>{meta ? <><div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4 }}>{meta.nationName ?? '未知'} · 第 {meta.turn + 1} 年</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}><Tag text={fmtTime(meta.createdAt)} tone="info" />{isAuto && <Tag text="自动" tone="gold" />}{isCurrentNation && <Tag text="当前国家" tone="good" />}{isOld && <Tag text="读档修复" tone="warn" />}</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{!isAuto && <Btn label={pickSlot === s.slot ? '确认覆盖' : '存档'} variant={pickSlot === s.slot ? 'warn' : 'ghost'} onClick={() => { if (pickSlot !== s.slot) { setPickSlot(s.slot); return; } saveToSlot(s.slot); setPickSlot(null); refresh(); }} />}<Btn label={isOld ? '修复并读档' : '读档'} variant="ghost" onClick={() => { loadFromSlot(s.slot); refresh(); }} />{!isAuto && <Btn label="删除" warn onClick={() => { if (window.confirm(`删除槽位 ${s.slot}？`)) { deleteSlotSave(s.slot); refresh(); } }} />}</div></> : <><div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>空槽位，可保存当前路线。</div>{!isAuto && <Btn label="存档到此" variant="ghost" onClick={() => { saveToSlot(s.slot); refresh(); }} />}</>}</div>; })}</div>
      <div className="ia-card" style={{ background: 'rgba(245,166,35,0.06)', borderColor: 'var(--warn)' }}><p className="dim" style={{ fontSize: 11, margin: 0, lineHeight: 1.6 }}>ℹ 存档位于浏览器 localStorage（键 <code style={{ color: 'var(--warn)' }}>imperium-aeternum-save-0~4</code>）。旧档会在读档时自动升级，补全缺失字段和双向外交关系。关键节点建议手动存档到槽位 1-4。</p></div>
    </Panel>
  </div>;
}
function Health({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'warn' | 'good' | 'info' }) { return <div className="ia-card" style={{ padding: 10 }}><Tag text={label} tone={tone} /><div style={{ fontSize: 22, marginTop: 6, fontWeight: 700 }}>{value}</div></div>; }
