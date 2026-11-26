import { useEffect, useRef, useState } from 'react';
import { useSharedWorldStore, watchWorldLobby } from '../../store/sharedWorldStore';
import type { NationControl, SharedWorldInstance } from '../../shared-world/types';
import { Btn, Tag } from '../ui';
import { WorldChatPanel } from '../social/WorldChatPanel';
import { useGameStore } from '../../store/gameStore';
import { useI18n } from '../../i18n';

export default function WorldDirectory({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t } = useI18n();
  const store = useSharedWorldStore();
  const startSharedWorld = useGameStore((state) => state.startSharedWorld);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const selectedWorld = store.worlds.find((world) => world.id === selectedWorldId) ?? null;
  const activeWorldId = selectedWorld?.id ?? null;
  const readError = (activeWorldId && store.rosterErrors[activeWorldId]) || store.worldListError;
  const controls = selectedWorldId ? store.controls[selectedWorldId] : undefined;
  const entry = useRef<AbortController>();
  const retry = useRef<() => void>();
  useEffect(() => () => entry.current?.abort(), [userId, activeWorldId]);

  useEffect(() => {
    const watcher = watchWorldLobby(activeWorldId);
    retry.current = watcher.refresh;
    return () => { retry.current = undefined; watcher.stop(); };
  }, [activeWorldId, userId]);

  return <>
    {readError && <div className="ia-world-message" role="status"><p>{t(readError)}</p><Btn label={t('重新加载版图')} variant="ghost" onClick={() => retry.current?.()} /></div>}
    {!selectedWorld ? <WorldList worlds={store.worlds} loading={store.loading} error={!!readError} onSelect={setSelectedWorldId} /> : controls === undefined ? (
      !readError && <div className="ia-world-empty" role="status">{t('正在读取国家控制状态…')}</div>
    ) : controls.length === 0 ? (
      !readError && <div className="ia-world-empty" role="status">{t('这张版图暂无可显示的国家。')}</div>
    ) : <WorldDetail world={selectedWorld} controls={controls} userId={userId} busyNationId={store.busyNationId} loading={store.entering} onBack={() => setSelectedWorldId(null)} onClaim={(nationId) => void store.claim(selectedWorld.id, nationId)} onRelease={(nationId) => void store.release(selectedWorld.id, nationId)} onEnter={async (nationId) => {
      entry.current?.abort();
      entry.current = new AbortController();
      const state = await store.enter(selectedWorld.id, nationId, entry.current.signal);
      if (state) { startSharedWorld(state, nationId, selectedWorld.name); onClose(); }
    }} />}
    {store.message && <div className="ia-world-message">{t(store.message)}</div>}
  </>;
}

function WorldList({ worlds, loading, error, onSelect }: { worlds: SharedWorldInstance[]; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  const { t } = useI18n();
  if (!worlds.length && error) return null;
  if (!worlds.length && loading) return <div className="ia-world-empty">{t('正在读取版图纪元…')}</div>;
  if (!worlds.length) return <div className="ia-world-empty"><strong>{t('首张共享版图正在筹备')}</strong><p>{t('基础设施已经接入；版图开放后会在这里显示世界年份、控制人数和可认领国家。')}</p></div>;
  return <div className="ia-world-list">{worlds.map((world) => <button key={world.id} className="ia-world-card" onClick={(event) => { event.stopPropagation(); onSelect(world.id); }}>
    <div><Tag text={t(world.status === 'active' ? '运行中' : world.status === 'paused' ? '已暂停' : '筹备中')} tone={world.status === 'active' ? 'good' : 'warn'} /><span>{t('第 {{year}} 年', { year: world.turn + 1 })}</span></div>
    <strong className="ia-display">{world.name}</strong>
    <p>{t('{{count}} 国共享同一历史进程 · 无人控制国家由 AI 自主推进', { count: world.nationCount })}</p>
    <em>{t('进入版图大厅 →')}</em>
  </button>)}</div>;
}

function WorldDetail({ world, controls, userId, busyNationId, loading, onBack, onClaim, onRelease, onEnter }: { world: SharedWorldInstance; controls: NationControl[]; userId: string; busyNationId: string | null; loading: boolean; onBack: () => void; onClaim: (nationId: string) => void; onRelease: (nationId: string) => void; onEnter: (nationId: string) => void }) {
  const { t } = useI18n();
  const mine = controls.filter((control) => control.controllerUserId === userId && !control.unavailable);
  const mineCount = mine.length;
  const open = world.status !== 'paused' && world.status !== 'archived';
  const canEnter = mineCount > 0 && open;
  return <>
    <div className="ia-world-detail-head"><button className="ia-btn ia-btn--ghost" onClick={onBack}>{t('← 版图列表')}</button><div><strong>{world.name}</strong><span>{t('第 {{year}} 年 · 修订 {{revision}}', { year: world.turn + 1, revision: world.revision })}</span></div><Tag text={t('我控制 {{mine}}/{{max}}', { mine: mineCount, max: world.tickPolicy.maxNationsPerUser })} tone="info" /></div>
    <div className="ia-world-rule-strip"><span>{t('有人在线才推进')}</span><span>{t('离线国家保守托管')}</span><span>{t('AI 国家持续发展')}</span><span>{t('统一年度结算')}</span></div>
    <section className={`ia-world-start-card ${canEnter ? 'is-ready' : ''}`} aria-live="polite">
      <div className="ia-world-start-steps"><span className={mineCount > 0 ? 'is-done' : 'is-current'}><b>1</b>{t('认领国家')}</span><i>→</i><span className={world.snapshotFileId ? 'is-done' : mineCount > 0 ? 'is-current' : ''}><b>2</b>{t('版图初始化')}</span><i>→</i><span className={world.snapshotFileId && canEnter ? 'is-current' : ''}><b>3</b>{t('进入治理')}</span></div>
      <div><strong>{t(mineCount === 0 ? '先选择一个可认领国家' : world.snapshotFileId ? '共享纪元已经可以进入' : '国家已认领，可以创建首个权威世界快照')}</strong><p>{t(mineCount === 0 ? '认领后控制权会绑定账号；其他玩家不能重复选择。' : world.snapshotFileId ? '进入后行动会先由服务器校验，再写入统一世界状态。' : '首次进入会初始化整张版图；之后所有玩家读取同一个纪元，不会各玩各的。')}</p></div>
      <Btn label={t(loading ? '载入纪元中…' : canEnter ? world.snapshotFileId ? '进入治理' : '初始化并进入治理' : mineCount > 0 ? '版图已暂停' : '请先认领国家')} variant={canEnter ? 'primary' : 'ghost'} disabled={!canEnter || loading} onClick={() => { if (mine[0]) onEnter(mine[0].nationId); }} />
    </section>
    <WorldChatPanel key={world.id} worldId={world.id} nationId={mine[0]?.nationId} />
    <div className="ia-world-nations">{controls.map((control) => {
      const isMine = control.controllerUserId === userId;
      const available = !control.unavailable && (control.status === 'available' || !control.controllerUserId);
      return <article key={control.id} className={`ia-world-nation ${isMine ? 'is-mine' : available ? 'is-open' : 'is-taken'}`}>
        <div><strong>{control.nationName}</strong><Tag text={t(control.unavailable === 'missing' ? '国家资料缺失' : control.unavailable ? '国家已覆亡' : isMine ? '由我控制' : available ? '可认领' : '已有统治者')} tone={isMine ? 'gold' : available ? 'good' : 'info'} /></div>
        {!control.unavailable && <p>{t(isMine ? '离线时由保守 AI 托管，不会停止发展。' : available ? '认领后可与账号下其他国家自由切换。' : '不可重复选择；对方释放或租约到期后重新开放。')}</p>}
        {isMine ? <span className="ia-world-nation-actions">{control.unavailable !== 'missing' && <Btn label={t(control.unavailable ? '查看记录' : '以此国进入')} variant="primary" disabled={loading || !open} onClick={() => onEnter(control.nationId)} />}<Btn label={t(busyNationId === control.nationId ? '处理中…' : '释放控制')} warn disabled={busyNationId !== null || loading} onClick={() => onRelease(control.nationId)} /></span> : available ? <Btn label={t(mineCount >= world.tickPolicy.maxNationsPerUser ? '已达本版图上限' : busyNationId === control.nationId ? '认领中…' : '认领国家')} variant="primary" disabled={busyNationId !== null || mineCount >= world.tickPolicy.maxNationsPerUser} onClick={() => onClaim(control.nationId)} /> : null}
      </article>;
    })}</div>
  </>;
}
