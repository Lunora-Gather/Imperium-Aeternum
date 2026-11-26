import { registerGovernanceTranslations } from '../i18n/catalogs/governance';
import { translate } from '../i18n';
import { localizeReactTree } from '../i18n/reactTree';
registerGovernanceTranslations();
// SaveLoad v16 — 存档恢复预检 + 多槽位管理 + 自动修复可视化
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { SAVE_VERSION, SLOT_CHANGED, slotStorageValue } from '../store/persistence';
import { useSavePreviews } from '../components/useSavePreviews';
import type { SaveRecoveryPreview } from '../gameplay/saveRecovery';
import { Panel, Btn, Tag, Divider } from '../components/ui';
import { AccountButton, CloudSaveSlots } from '../components/account/AccountPanel';
import CampaignExitControl from '../components/CampaignExitControl';
import { useAccountStore } from '../store/accountStore';
import { useSharedWorldSessionStore } from '../store/sharedWorldSessionStore';

function RecoveryMini({ preview }: { preview: SaveRecoveryPreview }) {
  return localizeReactTree(<div style={{ display: 'grid', gap: 4, marginBottom: 7 }}>
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag text={preview.label} tone={preview.tone} />
      {preview.score !== undefined && <Tag text={`体检 ${preview.score}/100`} tone={preview.score >= 75 ? 'good' : preview.score >= 45 ? 'warn' : 'danger'} />}
      {preview.savedKB !== undefined && <Tag text={preview.storageSavingsPercent === undefined ? `${preview.savedKB} KB`
        : translate('原始 {{size}} KB · 节省 {{percent}}%', { size: preview.savedKB, percent: preview.storageSavingsPercent })} tone={preview.savedKB > 4000 ? 'warn' : 'info'} />}
    </div>
    {preview.repairs.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.45 }}>将自动：{preview.repairs.slice(0, 3).join('、')}</div>}
    {preview.status === 'broken' && <div style={{ fontSize: 11, color: 'var(--danger)', lineHeight: 1.45 }}>{preview.details[0]}</div>}
  </div>);
}

export default function SaveLoadScreen() {
  const { saveToSlot, loadFromSlot, deleteSlotSave, logMsg, state } = useGameStore();
  const shared = useSharedWorldSessionStore((s) => !!s.session);
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = provincesOf(pid, state.provinces);
  const { slots: previews, rescan, checking, versions, withReviewedSlot, clearReviewed, setDeletion, deletionDialog } = useSavePreviews(logMsg);
  const slots = previews ?? [];
  const [pickSlot, setPickSlot] = useState<{ slot: number; stored: string } | null>(null);
  const account = useAccountStore();
  const refresh = () => {
    rescan();
    setPickSlot(null);
  };

  const writeSlot = (slot: number) => {
    let stored: string | null;
    try { stored = slotStorageValue(slot); }
    catch { logMsg('无法读取本地存档。'); refresh(); return; }
    const changed = stored !== versions?.get(slot);
    if (changed || (stored !== null && (pickSlot?.slot !== slot || pickSlot.stored !== stored))) {
      setPickSlot(stored === null ? null : { slot, stored });
      if (changed) { logMsg(SLOT_CHANGED); rescan(); }
      return;
    }
    saveToSlot(slot, { stored });
    refresh();
  };
  const removeSlot = (slot: number) => withReviewedSlot(slot, stored => {
    if (stored !== null) setDeletion({ message: translate('删除槽位 {{slot}}？', { slot }), remove: () => {
      deleteSlotSave(slot, { stored });
      refresh();
    } });
  });
  useEffect(() => { void account.initialize(); }, [account.initialize]);

  const fmtTime = (iso: string) => { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '未知时间'; return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  const doClearAll = () => clearReviewed(translate('确认删除全部浏览器本地存档？此操作不能恢复。'));
  const filled = slots.filter((s) => s.status !== 'empty').length;
  const empty = slots.filter((s) => s.status === 'empty' && s.slot !== 0).length;
  const manual = slots.filter((s) => s.slot !== 0 && s.status !== 'empty' && s.status !== 'broken').length;
  const repairable = slots.filter((s) => s.status === 'repairable').length;
  const risky = slots.filter((s) => s.status === 'risky').length;
  const broken = slots.filter((s) => s.status === 'broken').length;
  const riskyNow = (player?.resources.gold ?? 0) < 0 || (player?.resources.food ?? 0) < 0 || (player?.government.stability ?? 100) < 35 || state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const advice = broken > 0 ? { text: `${broken} 个槽位无法恢复，请删除或覆盖。`, tone: 'danger' as const }
    : risky > 0 ? { text: `${risky} 个存档可读但仍有风险，读档后先看“下一回合前检查”。`, tone: 'warn' as const }
      : repairable > 0 ? { text: `${repairable} 个存档读档时会自动修复并写回。`, tone: 'warn' as const }
        : manual === 0 ? { text: '还没有手动存档，建议立刻存到槽位 1-4。', tone: 'danger' as const }
          : riskyNow ? { text: '当前局势有风险，建议手动保存一个安全点。', tone: 'warn' as const }
            : empty > 0 ? { text: '存档结构正常，仍有空槽可做分支路线。', tone: 'good' as const }
              : { text: '槽位已满，覆盖前先确认年份和国家。', tone: 'info' as const };

  return localizeReactTree(<div className="ia-screen-stack">
    {deletionDialog}
    <Panel title="存档恢复体检" accent>
      {checking && <div role="status">正在检查存档…</div>}
      {previews && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
        <Health label="已用槽位" value={filled} tone="info" />
        <Health label="手动存档" value={manual} tone={manual > 0 ? 'good' : 'danger'} />
        <Health label="可自动修复" value={repairable} tone={repairable > 0 ? 'warn' : 'good'} />
        <Health label="风险/损坏" value={risky + broken} tone={risky + broken > 0 ? 'danger' : 'good'} />
      </div>
      <div className="ia-card" style={{ padding: 10, borderLeft: `3px solid var(--${advice.tone === 'danger' ? 'war' : advice.tone === 'warn' ? 'warn' : advice.tone === 'good' ? 'good' : 'border'})` }}><Tag text="建议" tone={advice.tone} /><span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-mute)' }}>{advice.text}</span></div>
      </>}
    </Panel>

    <Panel title="云端同步" accent>
      {!account.user ? <div className="ia-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><strong>当前为游客模式</strong><div className="dim" style={{ fontSize: 11, marginTop: 3 }}>本地存档完整可用；登录后可将槽位同步到 Appwrite 私有云端。</div></div><AccountButton /></div> : <>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}><div><Tag text="已登录" tone="good" /><span style={{ marginLeft: 7, fontSize: 11, color: 'var(--text-mute)' }}>{account.user.email}</span></div><Btn label="刷新云端" variant="ghost" onClick={() => void account.refreshCloudSaves()} /></div>
        <CloudSaveSlots slots={slots} checking={checking} withReviewedSlot={withReviewedSlot} onRestore={refresh} />
        {account.message && <div role="status" style={{ marginTop: 9, fontSize: 11, color: Object.keys(account.conflicts).length > 0 ? 'var(--warn)' : 'var(--text-mute)' }}>{account.message}</div>}
      </>}
    </Panel>

    <Panel title="存档管理" accent>
      <div className="ia-card" style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><strong style={{ fontSize: 14 }}>{player?.name ?? '未知'}</strong><div style={{ display: 'flex', gap: 6 }}><Tag text={`当前：第 ${state.turn + 1} 年`} tone="info" /><Tag text={`存档架构 v${SAVE_VERSION}`} tone="gold" /></div></div><div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-mute)', flexWrap: 'wrap' }}><span>省份 <strong style={{ color: 'var(--text)' }}>{provs.length}</strong></span><span>国库 <strong style={{ color: 'var(--gold)' }}>{Math.round(player?.resources.gold ?? 0)}</strong></span><span>粮储 <strong style={{ color: 'var(--food)' }}>{Math.round(player?.resources.food ?? 0)}</strong></span><span>稳定 <strong style={{ color: 'var(--stable)' }}>{Math.round(player?.government.stability ?? 0)}</strong></span><span>统治者 <strong style={{ color: 'var(--text)' }}>{player?.ruler.name ?? '?'}</strong></span></div></div>
      <Divider label="操作" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}><CampaignExitControl presentation="save" /><Btn label="刷新体检" variant="ghost" onClick={refresh} /><Btn label="清空全部存档" warn disabled={checking} onClick={doClearAll} /></div>
      <Divider label="存档槽位（槽位 0 = 自动存档）" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginBottom: 12 }}>
        {slots.map((preview) => {
          const { slot, status, version } = preview;
          const isAuto = slot === 0;
          const confirming = pickSlot?.slot === slot && pickSlot.stored === versions?.get(slot);
          const occupied = status !== 'empty';
          const canLoad = occupied && status !== 'broken';
          const isOld = version !== undefined && version < SAVE_VERSION;
          const isCurrentNation = canLoad && preview.nationName === player?.name;
          const borderColor = status === 'broken' ? 'var(--war)' : isOld || status === 'repairable' ? 'var(--warn)' : isAuto ? 'var(--border-gold)' : isCurrentNation ? 'var(--good)' : 'var(--border)';
          return <div key={slot} className="ia-card" style={{ padding: 10, borderColor }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>{isAuto ? '槽位 0（自动）' : `槽位 ${slot}`}</strong>
              {version !== undefined && <Tag text={isOld ? `旧档 v${version}→v${SAVE_VERSION}` : `v${version}`} tone={isOld ? 'warn' : 'info'} />}
              {!occupied && <Tag text="空" tone="info" />}
            </div>
            {canLoad && <>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4 }}>{preview.nationName ?? '未知'} · 第 {(preview.turn ?? 0) + 1} 年</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {preview.createdAt && <Tag text={fmtTime(preview.createdAt)} tone="info" />}
                {isAuto && <Tag text="自动" tone="gold" />}
                {isCurrentNation && <Tag text="当前国家" tone="good" />}
                {isOld && <Tag text="读档迁移" tone="warn" />}
              </div>
            </>}
            {occupied && <RecoveryMini preview={preview} />}
            {!occupied && !shared && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>空槽位，可保存当前路线。</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {!isAuto && !shared && <Btn
                label={occupied ? confirming ? '确认覆盖' : '存档' : '存档到此'}
                variant={confirming ? 'warn' : 'ghost'}
                disabled={checking}
                onClick={() => writeSlot(slot)}
              />}
              {occupied && <Btn label={status === 'repairable' || isOld ? '修复并读档' : '读档'} variant="ghost" disabled={checking || !canLoad} onClick={() => withReviewedSlot(slot, stored => { loadFromSlot(slot, stored); refresh(); })} />}
              {occupied && (!isAuto || status === 'broken') && <Btn label="删除" warn disabled={checking} onClick={() => removeSlot(slot)} />}
            </div>
          </div>;
        })}
      </div>
      <div className="ia-card" style={{ background: 'rgba(245,166,35,0.06)', borderColor: 'var(--warn)' }}><p className="dim" style={{ fontSize: 11, margin: 0, lineHeight: 1.6 }}>ℹ 槽位体检是只读预检，不会提前改写 localStorage。点击“修复并读档”后才会迁移、净化并写回存档。关键节点建议手动存档到槽位 1-4。</p></div>
    </Panel>
  </div>);
}
function Health({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'warn' | 'good' | 'info' }) { return <div className="ia-card" style={{ padding: 10 }}><Tag text={label} tone={tone} /><div style={{ fontSize: 22, marginTop: 6, fontWeight: 700 }}>{value}</div></div>; }
