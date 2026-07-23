import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import { useSharedWorldStore } from '../../store/sharedWorldStore';
import { subscribeToWorldLobby } from '../../services/appwrite/sharedWorldService';
import type { NationControl, SharedWorldInstance } from '../../shared-world/types';
import { Btn, Tag } from '../ui';
import { WorldChatPanel } from '../social/WorldChatPanel';
import { useGameStore } from '../../store/gameStore';
import { useI18n } from '../../i18n';

export function SharedWorldButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return <>
    <button className="ia-btn ia-btn--ghost ia-world-entry-btn" onClick={() => setOpen(true)}>◎ {t('共享活版图')}</button>
    {open && createPortal(<SharedWorldLobby onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function SharedWorldLobby({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const user = useAccountStore((state) => state.user);
  const store = useSharedWorldStore();
  const startSharedWorld = useGameStore((state) => state.startSharedWorld);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const selectedWorld = store.worlds.find((world) => world.id === selectedWorldId) ?? null;
  const controls = selectedWorldId ? store.controls[selectedWorldId] ?? [] : [];
  const mine = useMemo(() => controls.filter((control) => control.controllerUserId === user?.$id), [controls, user?.$id]);

  useEffect(() => {
    if (user) void store.refreshWorlds();
  }, [user]);

  useEffect(() => {
    if (!selectedWorldId || !user) return;
    void store.join(selectedWorldId);
    let dispose: (() => Promise<void>) | undefined;
    void subscribeToWorldLobby(selectedWorldId, () => void store.refreshControls(selectedWorldId)).then((cleanup) => { dispose = cleanup; });
    return () => { if (dispose) void dispose(); };
  }, [selectedWorldId, user]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section className="ia-shared-world-modal ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="shared-world-title" onClick={(event) => event.stopPropagation()}>
      <header className="ia-shared-world-head">
        <div><span className="ia-up">Living Worlds</span><h2 id="shared-world-title" className="ia-display">{t('共享活版图')}</h2><p>{t('玩家控制部分国家，其余国家由 AI 持续治理；整个版图使用统一年份。')}</p></div>
        <Btn label={t('关闭')} variant="ghost" onClick={onClose} />
      </header>

      {!user ? <div className="ia-world-empty"><strong>{t('需要先登录账号')}</strong><p>{t('共享版图涉及国家控制权和多人世界状态，游客仍可继续使用完整单机模式。')}</p></div> : !selectedWorld ? <WorldList worlds={store.worlds} loading={store.loading} onSelect={setSelectedWorldId} /> : <WorldDetail world={selectedWorld} controls={controls} userId={user.$id} mineCount={mine.length} busyNationId={store.busyNationId} loading={store.loading} onBack={() => setSelectedWorldId(null)} onClaim={(nationId) => void store.claim(selectedWorld.id, nationId)} onRelease={(nationId) => void store.release(selectedWorld.id, nationId)} onEnter={(nationId) => void store.enter(selectedWorld.id, nationId).then((state) => { if (!state) return; startSharedWorld(state, nationId, selectedWorld.name); onClose(); })} />}
      {store.message && <div className="ia-world-message">{store.message}</div>}
    </section>
  </div>;
}

function WorldList({ worlds, loading, onSelect }: { worlds: SharedWorldInstance[]; loading: boolean; onSelect: (id: string) => void }) {
  const { t } = useI18n();
  if (loading) return <div className="ia-world-empty">{t('正在读取版图纪元…')}</div>;
  if (!worlds.length) return <div className="ia-world-empty"><strong>{t('首张共享版图正在筹备')}</strong><p>{t('基础设施已经接入；版图开放后会在这里显示世界年份、控制人数和可认领国家。')}</p></div>;
  return <div className="ia-world-list">{worlds.map((world) => <button key={world.id} className="ia-world-card" onClick={(event) => { event.stopPropagation(); onSelect(world.id); }}>
    <div><Tag text={t(world.status === 'active' ? '运行中' : world.status === 'paused' ? '已暂停' : '筹备中')} tone={world.status === 'active' ? 'good' : 'warn'} /><span>{t('第 {{year}} 年', { year: world.turn + 1 })}</span></div>
    <strong className="ia-display">{world.name}</strong>
    <p>{t('{{count}} 国共享同一历史进程 · 无人控制国家由 AI 自主推进', { count: world.nationCount })}</p>
    <em>{t('进入版图大厅 →')}</em>
  </button>)}</div>;
}

function WorldDetail({ world, controls, userId, mineCount, busyNationId, loading, onBack, onClaim, onRelease, onEnter }: { world: SharedWorldInstance; controls: NationControl[]; userId: string; mineCount: number; busyNationId: string | null; loading: boolean; onBack: () => void; onClaim: (nationId: string) => void; onRelease: (nationId: string) => void; onEnter: (nationId: string) => void }) {
  const { t } = useI18n();
  const mine = controls.filter((control) => control.controllerUserId === userId);
  const canEnter = mine.length > 0 && world.status !== 'paused' && world.status !== 'archived';
  return <>
    <div className="ia-world-detail-head"><button className="ia-btn ia-btn--ghost" onClick={onBack}>{t('← 版图列表')}</button><div><strong>{world.name}</strong><span>{t('第 {{year}} 年 · 修订 {{revision}}', { year: world.turn + 1, revision: world.revision })}</span></div><Tag text={t('我控制 {{mine}}/{{max}}', { mine: mineCount, max: world.tickPolicy.maxNationsPerUser })} tone="info" /></div>
    <div className="ia-world-rule-strip"><span>{t('有人在线才推进')}</span><span>{t('离线国家保守托管')}</span><span>{t('AI 国家持续发展')}</span><span>{t('统一年度结算')}</span></div>
    <section className={`ia-world-start-card ${canEnter ? 'is-ready' : ''}`} aria-live="polite">
      <div className="ia-world-start-steps"><span className={mineCount > 0 ? 'is-done' : 'is-current'}><b>1</b>{t('认领国家')}</span><i>→</i><span className={world.snapshotFileId ? 'is-done' : mineCount > 0 ? 'is-current' : ''}><b>2</b>{t('版图初始化')}</span><i>→</i><span className={world.snapshotFileId && canEnter ? 'is-current' : ''}><b>3</b>{t('进入治理')}</span></div>
      <div><strong>{t(mineCount === 0 ? '先选择一个可认领国家' : world.snapshotFileId ? '共享纪元已经可以进入' : '国家已认领，可以创建首个权威世界快照')}</strong><p>{t(mineCount === 0 ? '认领后控制权会绑定账号；其他玩家不能重复选择。' : world.snapshotFileId ? '进入后行动会先由服务器校验，再写入统一世界状态。' : '首次进入会初始化整张版图；之后所有玩家读取同一个纪元，不会各玩各的。')}</p></div>
      <Btn label={t(loading ? '载入纪元中…' : canEnter ? world.snapshotFileId ? '进入治理' : '初始化并进入治理' : mineCount > 0 ? '版图已暂停' : '请先认领国家')} variant={canEnter ? 'primary' : 'ghost'} disabled={!canEnter || loading} onClick={() => { if (mine[0]) onEnter(mine[0].nationId); }} />
    </section>
    {controls.length > 0 && <WorldChatPanel worldId={world.id} nationId={controls.find((control) => control.controllerUserId === userId)?.nationId} />}
    <div className="ia-world-nations">{controls.map((control) => {
      const isMine = control.controllerUserId === userId;
      const available = control.status === 'available' || !control.controllerUserId;
      return <article key={control.id} className={`ia-world-nation ${isMine ? 'is-mine' : available ? 'is-open' : 'is-taken'}`}>
        <div><strong>{control.nationName}</strong><Tag text={t(isMine ? '由我控制' : available ? '可认领' : '已有统治者')} tone={isMine ? 'gold' : available ? 'good' : 'info'} /></div>
        <p>{t(isMine ? '离线时由保守 AI 托管，不会停止发展。' : available ? '认领后可与账号下其他国家自由切换。' : '不可重复选择；对方释放或租约到期后重新开放。')}</p>
        {isMine ? <span className="ia-world-nation-actions"><Btn label={t('以此国进入')} variant="primary" disabled={loading} onClick={() => onEnter(control.nationId)} /><Btn label={t(busyNationId === control.nationId ? '处理中…' : '释放控制')} warn disabled={busyNationId !== null || loading} onClick={() => onRelease(control.nationId)} /></span> : available ? <Btn label={t(mineCount >= world.tickPolicy.maxNationsPerUser ? '已达本版图上限' : busyNationId === control.nationId ? '认领中…' : '认领国家')} variant="primary" disabled={busyNationId !== null || mineCount >= world.tickPolicy.maxNationsPerUser} onClick={() => onClaim(control.nationId)} /> : null}
      </article>;
    })}</div>
  </>;
}
