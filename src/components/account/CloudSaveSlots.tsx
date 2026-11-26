import { registerEnglishPatterns, registerEnglishTranslations, useI18n } from '../../i18n';
import type { SaveRecoveryPreview } from '../../gameplay/saveRecovery';
import { useAccountStore } from '../../store/accountStore';
import { Btn, Tag } from '../ui';

registerEnglishTranslations({
  '槽位 {{slot}}': 'Slot {{slot}}', '槽位 0（自动）': 'Slot 0 (auto)',
  '云端已有': 'Saved in cloud', '云端为空': 'Empty in cloud', '尚未取得云端列表': 'Cloud list unavailable',
  '当前没有存档': 'No saves yet', '本地：{{save}}': 'Local: {{save}}', '云端：{{save}}': 'Cloud: {{save}}',
  '上传': 'Upload', '下载': 'Download', '同步中…': 'Syncing…',
  '确认覆盖云端': 'Replace cloud save', '确认覆盖本地': 'Replace local save',
  '云存档完整性校验失败，文件可能已损坏': 'The cloud file failed its integrity check. It may be damaged.',
  '存档已变化，请比较后确认用云端覆盖本地': 'The save changed. Compare the versions before replacing your local save.',
  '云端存档已变化，请比较后重新确认': 'The cloud save changed. Compare the versions and confirm again.',
});
registerEnglishPatterns([
  { pattern: /^槽位 (\d+) 已从云端恢复$/, replacement: 'Slot $1 restored from the cloud' },
  { pattern: /^槽位 (\d+) 已上传云端$/, replacement: 'Slot $1 uploaded to the cloud' },
]);

export interface CloudSaveSlotProps {
  slots: SaveRecoveryPreview[];
  checking: boolean;
  withReviewedSlot: (slot: number, action: (stored: string | null) => void) => void;
  onRestore: () => void;
  onContinue?: (slot: number) => void;
}

export default function CloudSaveSlots({ slots, checking, withReviewedSlot, onRestore, onContinue }: CloudSaveSlotProps) {
  const account = useAccountStore();
  const { t, locale } = useI18n();
  const cloudBySlot = new Map(account.cloudSaves.map(row => [row.slot, row]));
  const visible = onContinue ? slots.filter(local => local.status !== 'empty' || cloudBySlot.has(local.slot)) : slots;
  const describe = (nation: string | undefined, turn = 0) =>
    `${t(nation ?? '未知')} · ${t('第 {{year}} 年', { year: turn + 1 })}`;
  const savedAt = (iso?: string) => {
    if (!iso || !Number.isFinite(Date.parse(iso))) return null;
    return <> · <time dateTime={iso}>{new Date(iso).toLocaleString(locale)}</time></>;
  };
  if (!visible.length) return <p className="dim">{t(checking ? '正在检查存档…' : account.cloudListLoaded ? '当前没有存档' : '尚未取得云端列表')}</p>;

  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 8 }}>
    {visible.map(local => {
      const { slot } = local;
      const readable = local.status !== 'empty' && local.status !== 'broken';
      const cloud = cloudBySlot.get(slot);
      const conflict = account.conflicts[slot];
      const busy = checking || account.busySlot !== null;
      const cloudStatus = cloud ? '云端已有' : account.cloudListLoaded ? '云端为空' : '尚未取得云端列表';
      const reviewedCloud = cloud ? cloud.contentHash === conflict?.cloud : account.cloudListLoaded && conflict?.cloud === null;
      const upload = (force = false) => withReviewedSlot(slot, () => void account.uploadSlot(slot, force));
      const download = (force = false) => withReviewedSlot(slot, () => {
        void account.downloadSlot(slot, force).then(ok => { if (ok) onRestore(); });
      });
      return <div key={slot} className="ia-card" style={{ padding: 9, borderColor: conflict ? 'var(--warn)' : cloud ? 'var(--good)' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <strong>{t(slot === 0 ? '槽位 0（自动）' : '槽位 {{slot}}', { slot })}</strong>
          <Tag text={t(cloudStatus)} tone={cloud ? 'good' : 'info'} />
        </div>
        <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.5, margin: '5px 0 7px' }}>
          {t('本地：{{save}}', { save: readable ? describe(local.nationName, local.turn) : t(local.label) })}{savedAt(local.createdAt)}
          {cloud && <><br />{t('云端：{{save}}', { save: describe(cloud.nationName, cloud.turn) })}{savedAt(cloud.clientUpdatedAt)}</>}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Btn label={t(account.busySlot === slot ? '同步中…' : '上传')} variant="ghost" disabled={busy || !readable} onClick={() => upload()} />
          <Btn label={t('下载')} variant="ghost" disabled={busy || !cloud} onClick={() => download()} />
          {conflict && <>
            <Btn label={t('确认覆盖云端')} warn disabled={busy || !reviewedCloud || !readable} onClick={() => upload(true)} />
            <Btn label={t('确认覆盖本地')} warn disabled={busy || !reviewedCloud || !cloud} onClick={() => download(true)} />
          </>}
          {onContinue && readable && <Btn label={t('继续槽位 {{slot}}', { slot })} disabled={busy} onClick={() => onContinue(slot)} />}
        </div>
      </div>;
    })}
  </div>;
}
