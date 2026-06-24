// SaveLoad v3 — B3 多槽位存档管理
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { listAllSlots, SLOT_COUNT, type getSlotMeta } from '../store/persistence';
import { Panel, Btn, Tag, Divider } from '../components/ui';

type SlotMeta = NonNullable<ReturnType<typeof getSlotMeta>>;

export default function SaveLoadScreen() {
  const { newGame, saveToSlot, loadFromSlot, deleteSlotSave, state } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = provincesOf(pid, state.provinces);
  // 槽位列表（每次渲染刷新以反映最新存档状态）
  const [slots, setSlots] = useState<ReturnType<typeof listAllSlots>>([]);
  const refresh = () => setSlots(listAllSlots());
  useEffect(() => { refresh(); }, [state.turn]);
  // 手动存档选中槽位
  const [pickSlot, setPickSlot] = useState<number | null>(null);

  const fmtTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <Panel title="存档管理" accent>
        {/* 当前状态卡 */}
        <div className="ia-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 14 }}>{player?.name ?? '未知'}</strong>
            <Tag text={`当前：第 ${state.turn + 1} 年`} tone="info" />
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-mute)' }}>
            <span>省份 <strong style={{ color: 'var(--text)' }}>{provs.length}</strong></span>
            <span>国库 <strong style={{ color: 'var(--gold)' }}>{Math.round(player?.resources.gold ?? 0)}</strong></span>
            <span>稳定 <strong style={{ color: 'var(--stable)' }}>{Math.round(player?.government.stability ?? 0)}</strong></span>
            <span>统治者 <strong style={{ color: 'var(--text)' }}>{player?.ruler.name ?? '?'}</strong></span>
          </div>
        </div>

        <Divider label="操作" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Btn label="新游戏" variant="primary" onClick={newGame} />
        </div>

        {/* B3: 5 槽位卡片 */}
        <Divider label="存档槽位（槽位 0 = 自动存档）" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
          {slots.map((s) => {
            const isAuto = s.slot === 0;
            const meta = s.meta as SlotMeta | null;
            return (
              <div key={s.slot} className="ia-card" style={{ padding: 10, borderColor: isAuto ? 'var(--border-gold)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{isAuto ? `槽位 0（自动）` : `槽位 ${s.slot}`}</strong>
                  {meta && <Tag text={`v${meta.version}`} tone="info" />}
                </div>
                {meta ? (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 4 }}>
                      {meta.nationName ?? '未知'} · 第 {meta.turn + 1} 年
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                      {fmtTime(meta.createdAt)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!isAuto && <Btn label="存档" variant="ghost" onClick={() => { saveToSlot(s.slot); refresh(); }} />}
                      <Btn label="读档" variant="ghost" onClick={() => loadFromSlot(s.slot)} />
                      {!isAuto && <Btn label="删除" warn onClick={() => { deleteSlotSave(s.slot); refresh(); }} />}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>空槽位</div>
                    {!isAuto && <Btn label="存档到此" variant="ghost" onClick={() => { saveToSlot(s.slot); refresh(); }} />}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="ia-card" style={{ background: 'rgba(245,166,35,0.06)', borderColor: 'var(--warn)' }}>
          <p className="dim" style={{ fontSize: 11, margin: 0, lineHeight: 1.6 }}>
            ℹ 存档位于浏览器 localStorage（键 <code style={{ color: 'var(--warn)' }}>imperium-aeternum-save-0~4</code>）。
            每 10 回合自动存档到槽位 0。换浏览器或清缓存会丢失。建议关键节点手动存档到槽位 1-4。
          </p>
        </div>
      </Panel>
    </div>
  );
}
