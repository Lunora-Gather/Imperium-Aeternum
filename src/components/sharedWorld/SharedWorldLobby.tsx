import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../store/accountStore';
import { useSharedWorldStore } from '../../store/sharedWorldStore';
import { subscribeToWorldLobby } from '../../services/appwrite/sharedWorldService';
import type { NationControl, SharedWorldInstance } from '../../shared-world/types';
import { Btn, Tag } from '../ui';
import { WorldChatPanel } from '../social/WorldChatPanel';

export function SharedWorldButton() {
  const [open, setOpen] = useState(false);
  return <>
    <button className="ia-btn ia-btn--ghost ia-world-entry-btn" onClick={() => setOpen(true)}>◎ 共享活版图</button>
    {open && createPortal(<SharedWorldLobby onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function SharedWorldLobby({ onClose }: { onClose: () => void }) {
  const user = useAccountStore((state) => state.user);
  const store = useSharedWorldStore();
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
        <div><span className="ia-up">Living Worlds</span><h2 id="shared-world-title" className="ia-display">共享活版图</h2><p>玩家控制部分国家，其余国家由 AI 持续治理；整个版图使用统一年份。</p></div>
        <Btn label="关闭" variant="ghost" onClick={onClose} />
      </header>

      {!user ? <div className="ia-world-empty"><strong>需要先登录账号</strong><p>共享版图涉及国家控制权和多人世界状态，游客仍可继续使用完整单机模式。</p></div> : !selectedWorld ? <WorldList worlds={store.worlds} loading={store.loading} onSelect={setSelectedWorldId} /> : <WorldDetail world={selectedWorld} controls={controls} userId={user.$id} mineCount={mine.length} busyNationId={store.busyNationId} onBack={() => setSelectedWorldId(null)} onClaim={(nationId) => void store.claim(selectedWorld.id, nationId)} onRelease={(nationId) => void store.release(selectedWorld.id, nationId)} />}
      {store.message && <div className="ia-world-message">{store.message}</div>}
    </section>
  </div>;
}

function WorldList({ worlds, loading, onSelect }: { worlds: SharedWorldInstance[]; loading: boolean; onSelect: (id: string) => void }) {
  if (loading) return <div className="ia-world-empty">正在读取版图纪元…</div>;
  if (!worlds.length) return <div className="ia-world-empty"><strong>首张共享版图正在筹备</strong><p>基础设施已经接入；版图开放后会在这里显示世界年份、控制人数和可认领国家。</p></div>;
  return <div className="ia-world-list">{worlds.map((world) => <button key={world.id} className="ia-world-card" onClick={(event) => { event.stopPropagation(); onSelect(world.id); }}>
    <div><Tag text={world.status === 'active' ? '运行中' : world.status === 'paused' ? '已暂停' : '筹备中'} tone={world.status === 'active' ? 'good' : 'warn'} /><span>第 {world.turn + 1} 年</span></div>
    <strong className="ia-display">{world.name}</strong>
    <p>{world.nationCount} 国共享同一历史进程 · 无人控制国家由 AI 自主推进</p>
    <em>进入版图大厅 →</em>
  </button>)}</div>;
}

function WorldDetail({ world, controls, userId, mineCount, busyNationId, onBack, onClaim, onRelease }: { world: SharedWorldInstance; controls: NationControl[]; userId: string; mineCount: number; busyNationId: string | null; onBack: () => void; onClaim: (nationId: string) => void; onRelease: (nationId: string) => void }) {
  return <>
    <div className="ia-world-detail-head"><button className="ia-btn ia-btn--ghost" onClick={onBack}>← 版图列表</button><div><strong>{world.name}</strong><span>第 {world.turn + 1} 年 · 修订 {world.revision}</span></div><Tag text={`我控制 ${mineCount}/${world.tickPolicy.maxNationsPerUser}`} tone="info" /></div>
    <div className="ia-world-rule-strip"><span>有人在线才推进</span><span>离线国家保守托管</span><span>AI 国家持续发展</span><span>统一年度结算</span></div>
    {controls.length > 0 && <WorldChatPanel worldId={world.id} nationId={controls.find((control) => control.controllerUserId === userId)?.nationId} />}
    <div className="ia-world-nations">{controls.map((control) => {
      const isMine = control.controllerUserId === userId;
      const available = control.status === 'available' || !control.controllerUserId;
      return <article key={control.id} className={`ia-world-nation ${isMine ? 'is-mine' : available ? 'is-open' : 'is-taken'}`}>
        <div><strong>{control.nationName}</strong><Tag text={isMine ? '由我控制' : available ? '可认领' : '已有统治者'} tone={isMine ? 'gold' : available ? 'good' : 'info'} /></div>
        <p>{isMine ? '离线时由保守 AI 托管，不会停止发展。' : available ? '认领后可与账号下其他国家自由切换。' : '不可重复选择；对方释放或租约到期后重新开放。'}</p>
        {isMine ? <Btn label={busyNationId === control.nationId ? '处理中…' : '释放控制'} warn disabled={busyNationId !== null} onClick={() => onRelease(control.nationId)} /> : available ? <Btn label={mineCount >= world.tickPolicy.maxNationsPerUser ? '已达本版图上限' : busyNationId === control.nationId ? '认领中…' : '认领国家'} variant="primary" disabled={busyNationId !== null || mineCount >= world.tickPolicy.maxNationsPerUser} onClick={() => onClaim(control.nationId)} /> : null}
      </article>;
    })}</div>
  </>;
}
