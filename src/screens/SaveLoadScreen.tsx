// SaveLoad v16 — 存档恢复预检 + 多槽位管理 + 自动修复可视化
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { listAllSlots, clearAllSaves, SAVE_VERSION, type getSlotMeta } from '../store/persistence';
import { inspectAllSaveSlots, type SaveRecoveryPreview } from '../gameplay/saveRecovery';
import { Panel, Btn, Tag, Divider } from '../components/ui';
import { AccountButton } from '../components/account/AccountPanel';
import { useAccountStore } from '../store/accountStore';

type SlotMeta = NonNullable<ReturnType<typeof getSlotMeta>>;

function recoveryTone(preview?: SaveRecoveryPreview | null): 'danger' | 'warn' | 'good' | 'info' {
  if (!preview) return 'info';
  return preview.tone === 'danger' ? 'danger' : preview.tone === 'warn' ? 'warn' : preview.tone === 'good' ? 'good' : 'info';
}

function RecoveryMini({ preview }: { preview?: SaveRecoveryPreview | null }) {
  if (!preview || preview.status === 'empty') return null;
  return <div style={{ display: 'grid', gap: 4, marginBottom: 7 }}>
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag text={preview.label} tone={recoveryTone(preview)} />
      {preview.score !== undefined && <Tag text={`体检 ${preview.score}/100`} tone={preview.score >= 75 ? 'good' : preview.score >= 45 ? 'warn' : 'danger'} />}
      {preview.savedKB !== undefined && <Tag text={`${preview.savedKB}KB`} tone={preview.savedKB > 4000 ? 'warn' : 'info'} />}
    </div>
    {preview.repairs.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.45 }}>将自动：{preview.repairs.slice(0, 3).join('、')}</div>}
    {preview.status === 'broken' && <div style={{ fontSize: 11, color: 'var(--danger)', lineHeight: 1.45 }}>{preview.details[0]}</div>}
  </div>;
}

export default function SaveLoadScreen() {
  const { newGame, saveToSlot, loadFromSlot, deleteSlotSave, state, log } = useGameStore();
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const provs = provincesOf(pid, state.provinces);
  const [slots, setSlots] = useState<ReturnType<typeof listAllSlots>>([]);
  const [previews, setPreviews] = useState<SaveRecoveryPreview[]>([]);
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const account = useAccountStore();
  const refresh = () => {
    setSlots(listAllSlots());
    setPreviews(inspectAllSaveSlots());
  };
  useEffect(() => { refresh(); }, [state.turn, log.length]);
  useEffect(() => { void account.initialize(); }, [account.initialize]);

  const fmtTime = (iso: string) => { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '未知时间'; return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  const doClearAll = () => { if (!window.confirm('确认删除全部浏览器本地存档？此操作不能恢复。')) return; clearAllSaves(); refresh(); };
  const previewBySlot = new Map(previews.map((p) => [p.slot, p]));
  const filled = slots.filter((s) => !!s.meta).length;
  const empty = slots.filter((s) => !s.meta && s.slot !== 0).length;
  const old = slots.filter((s) => s.meta && (s.meta as SlotMeta).version < SAVE_VERSION).length;
  const manual = slots.filter((s) => s.slot !== 0 && !!s.meta).length;
  const repairable = previews.filter((p) => p.status === 'repairable').length;
  const risky = previews.filter((p) => p.status === 'risky').length;
  const broken = previews.filter((p) => p.status === 'broken').length;
  const riskyNow = (player?.resources.gold ?? 0) < 0 || (player?.resources.food ?? 0) < 0 || (player?.government.stability ?? 100) < 35 || state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const advice = broken > 0 ? { text: `${broken} 个槽位无法恢复，请删除或覆盖。`, tone: 'danger' as const }
    : risky > 0 ? { text: `${risky} 个存档可读但仍有风险，读档后先看“下一回合前检查”。`, tone: 'warn' as const }
      : repairable > 0 || old > 0 ? { text: `${Math.max(repairable, old)} 个存档读档时会自动修复并写回。`, tone: 'warn' as const }
        : manual === 0 ? { text: '还没有手动存档，建议立刻存到槽位 1-4。', tone: 'danger' as const }
          : riskyNow ? { text: '当前局势有风险，建议手动保存一个安全点。', tone: 'warn' as const }
            : empty > 0 ? { text: '存档结构正常，仍有空槽可做分支路线。', tone: 'good' as const }
              : { text: '槽位已满，覆盖前先确认年份和国家。', tone: 'info' as const };
  const cloudBySlot = new Map(account.cloudSaves.map((save) => [save.slot, save]));

  return <div>
    <Panel title="存档恢复体检" accent>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
        <Health label="已用槽位" value={filled} tone="info" />
        <Health label="手动存档" value={manual} tone={manual > 0 ? 'good' : 'danger'} />
        <Health label="可自动修复" value={repairable + old} tone={repairable + old > 0 ? 'warn' : 'good'} />
        <Health label="风险/损坏" value={risky + broken} tone={risky + broken > 0 ? 'danger' : 'good'} />
      </div>
      <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${advice.tone === 'danger' ? 'war' : advice.tone === 'warn' ? 'warn' : advice.tone === 'good' ? 'good' : 'border'})` }}><Tag text="建议" tone={advice.tone} /><span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-mute)' }}>{advice.text}</span></div>
    </Panel>

    <Panel title="云端同步" accent>
      {!account.user ? <div className="ia-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><strong>当前为游客模式</strong><div className="dim" style={{ fontSize: 11, marginTop: 3 }}>本地存档完整可用；登录后可将槽位同步到 Appwrite 私有云端。</div></div><AccountButton /></div> : <>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}><div><Tag text="已登录" tone="good" /><span style={{ marginLeft: 7, fontSize: 11, color: 'var(--text-mute)' }}>{account.user.email}</span></div><Btn label="刷新云端" variant="ghost" onClick={() => void account.refreshCloudSaves()} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>{[0, 1, 2, 3, 4].map((slot) => { const local = slots.find((entry) => entry.slot === slot)?.meta; const cloud = cloudBySlot.get(slot); const busy = account.busySlot === slot; const conflict = account.conflictSlot === slot; return <div key={slot} className="ia-card" style={{ padding: 9, borderColor: conflict ? 'var(--warn)' : cloud ? 'var(--good)' : undefined }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}><strong style={{ fontSize: 12 }}>槽位 {slot}{slot === 0 ? '（自动）' : ''}</strong><Tag text={cloud ? '云端已有' : '云端为空'} tone={cloud ? 'good' : 'info'} /></div><div className="dim" style={{ fontSize: 10, lineHeight: 1.5, margin: '5px 0 7px' }}>本地：{local ? `${local.nationName ?? '未知'} · 第 ${local.turn + 1} 年` : '空'}<br />云端：{cloud ? `${cloud.nationName} · 第 ${cloud.turn + 1} 年` : '空'}</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}><Btn label={busy ? '同步中…' : '上传'} variant="ghost" disabled={!local || busy} onClick={() => void account.uploadSlot(slot)} /><Btn label="下载" variant="ghost" disabled={!cloud || busy} onClick={() => void account.downloadSlot(slot).then((ok) => { if (ok) refresh(); })} />{conflict && <><Btn label="确认覆盖云端" warn onClick={() => void account.uploadSlot(slot, true)} /><Btn label="确认覆盖本地" warn onClick={() => void account.downloadSlot(slot, true).then((ok) => { if (ok) refresh(); })} /></>}</div></div>; })}</div>
        {account.message && <div style={{ marginTop: 9, fontSize: 11, color: account.conflictSlot !== null ? 'var(--warn)' : 'var(--text-mute)' }}>{account.message}</div>}
      </>}
    </Panel>

    <Panel title="存档管理" accent>
      <div className="ia-card" style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><strong style={{ fontSize: 14 }}>{player?.name ?? '未知'}</strong><div style={{ display: 'flex', gap: 6 }}><Tag text={`当前：第 ${state.turn + 1} 年`} tone="info" /><Tag text={`存档架构 v${SAVE_VERSION}`} tone="gold" /></div></div><div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-mute)', flexWrap: 'wrap' }}><span>省份 <strong style={{ color: 'var(--text)' }}>{provs.length}</strong></span><span>国库 <strong style={{ color: 'var(--gold)' }}>{Math.round(player?.resources.gold ?? 0)}</strong></span><span>粮储 <strong style={{ color: 'var(--food)' }}>{Math.round(player?.resources.food ?? 0)}</strong></span><span>稳定 <strong style={{ color: 'var(--stable)' }}>{Math.round(player?.government.stability ?? 0)}</strong></span><span>统治者 <strong style={{ color: 'var(--text)' }}>{player?.ruler.name ?? '?'}</strong></span></div></div>
      <Divider label="操作" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}><Btn label="新游戏" variant="primary" onClick={newGame} /><Btn label="刷新体检" variant="ghost" onClick={refresh} /><Btn label="清空全部存档" warn onClick={doClearAll} /></div>
      <Divider label="存档槽位（槽位 0 = 自动存档）" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginBottom: 12 }}>{slots.map((s) => { const isAuto = s.slot === 0; const meta = s.meta as SlotMeta | null; const preview = previewBySlot.get(s.slot); const isOld = !!meta && meta.version < SAVE_VERSION; const isCurrentNation = !!meta && meta.nationName === player?.name; const isBroken = preview?.status === 'broken'; const canLoad = !!meta && !isBroken; return <div key={s.slot} className="ia-card" style={{ padding: 10, borderColor: isBroken ? 'var(--war)' : isOld || preview?.status === 'repairable' ? 'var(--warn)' : isAuto ? 'var(--border-gold)' : isCurrentNation ? 'var(--good)' : 'var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><strong style={{ fontSize: 13 }}>{isAuto ? '槽位 0（自动）' : `槽位 ${s.slot}`}</strong>{meta ? <Tag text={isOld ? `旧档 v${meta.version}→v${SAVE_VERSION}` : `v${meta.version}`} tone={isOld ? 'warn' : 'info'} /> : <Tag text="空" tone="info" />}</div>{meta ? <><div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4 }}>{meta.nationName ?? preview?.nationName ?? '未知'} · 第 {(preview?.turn ?? meta.turn) + 1} 年</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}><Tag text={fmtTime(meta.createdAt)} tone="info" />{isAuto && <Tag text="自动" tone="gold" />}{isCurrentNation && <Tag text="当前国家" tone="good" />}{isOld && <Tag text="读档迁移" tone="warn" />}</div><RecoveryMini preview={preview} /><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{!isAuto && <Btn label={pickSlot === s.slot ? '确认覆盖' : '存档'} variant={pickSlot === s.slot ? 'warn' : 'ghost'} onClick={() => { if (pickSlot !== s.slot) { setPickSlot(s.slot); return; } saveToSlot(s.slot); setPickSlot(null); refresh(); }} />}<Btn label={preview?.status === 'repairable' || isOld ? '修复并读档' : '读档'} variant="ghost" disabled={!canLoad} onClick={() => { loadFromSlot(s.slot); refresh(); }} />{!isAuto && <Btn label="删除" warn onClick={() => { if (window.confirm(`删除槽位 ${s.slot}？`)) { deleteSlotSave(s.slot); refresh(); } }} />}</div></> : <><div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>空槽位，可保存当前路线。</div>{!isAuto && <Btn label="存档到此" variant="ghost" onClick={() => { saveToSlot(s.slot); refresh(); }} />}</>}</div>; })}</div>
      <div className="ia-card" style={{ background: 'rgba(245,166,35,0.06)', borderColor: 'var(--warn)' }}><p className="dim" style={{ fontSize: 11, margin: 0, lineHeight: 1.6 }}>ℹ 槽位体检是只读预检，不会提前改写 localStorage。点击“修复并读档”后才会迁移、净化并写回存档。关键节点建议手动存档到槽位 1-4。</p></div>
    </Panel>
  </div>;
}
function Health({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'warn' | 'good' | 'info' }) { return <div className="ia-card" style={{ padding: 10 }}><Tag text={label} tone={tone} /><div style={{ fontSize: 22, marginTop: 6, fontWeight: 700 }}>{value}</div></div>; }
