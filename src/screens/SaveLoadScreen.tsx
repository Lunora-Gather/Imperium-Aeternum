// SaveLoad v2 — 存档管理卡片化 + 危险操作分级
import { useGameStore } from '../store/gameStore';
import { provincesOf } from '../engine/init';
import { getSaveMeta } from '../store/persistence';
import { Panel, Btn, Tag, Divider } from '../components/ui';

export default function SaveLoadScreen() {
  const { newGame, save, load, clearSave, hasSave, state } = useGameStore();
  const pid = state.playerNationId;
  const player = state.nations[pid];
  const provs = provincesOf(pid, state.provinces);
  // P2: 存档时间戳（不随渲染刷新，仅在 save/load 触发重渲时更新）
  const meta = hasSave() ? getSaveMeta() : null;
  const savedAt = meta?.createdAt ? new Date(meta.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
  const savedTurn = meta?.turn != null ? meta.turn + 1 : null;

  return (
    <div>
      <Panel title="存档管理" accent>
        <div className="ia-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 14 }}>{player?.name ?? '未知'}</strong>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {savedAt && <Tag text={`存档：${savedAt} · 第 ${savedTurn} 年`} tone="gold" />}
              <Tag text={`当前：第 ${state.turn + 1} 年`} tone="info" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-mute)' }}>
            <span>省份 <strong style={{ color: 'var(--text)' }}>{provs.length}</strong></span>
            <span>国库 <strong style={{ color: 'var(--gold)' }}>{Math.round(player?.resources.gold ?? 0)}</strong></span>
            <span>稳定 <strong style={{ color: 'var(--stable)' }}>{Math.round(player?.government.stability ?? 0)}</strong></span>
            <span>统治者 <strong style={{ color: 'var(--text)' }}>{player?.ruler.name ?? '?'}</strong></span>
            <span>战争 <strong style={{ color: state.wars.length > 0 ? 'var(--war)' : 'var(--good)' }}>{state.wars.filter(w => w.attackerId === pid || w.defenderId === pid).length}</strong></span>
            <span>版本 <strong style={{ color: 'var(--text-dim)' }}>{state.version}</strong></span>
          </div>
        </div>

        <Divider label="操作" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
          <Btn label="新游戏" variant="primary" onClick={newGame} />
          <Btn label="存档" variant="ghost" onClick={save} />
          <Btn label="读档" variant="ghost" onClick={() => load()} disabled={!hasSave()} />
          <Btn label="删除存档" warn onClick={clearSave} disabled={!hasSave()} />
        </div>

        <div className="ia-card" style={{ background: 'rgba(245,166,35,0.06)', borderColor: 'var(--warn)' }}>
          <p className="dim" style={{ fontSize: 11, margin: 0, lineHeight: 1.6 }}>
            ℹ 存档位置：浏览器 localStorage（键 <code style={{ color: 'var(--warn)' }}>imperium-aeternum-save</code>）。
            换浏览器或清缓存会丢失。建议关键节点手动存档。
          </p>
        </div>
      </Panel>
    </div>
  );
}
