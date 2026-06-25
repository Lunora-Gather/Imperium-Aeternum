// Chronicle — 史册独立页（E20：全里程碑回顾，按类分组）
// 玩家积累的 10 类里程碑在此完整展示，增强叙事感与帝国历程回顾
import { useGameStore } from '../store/gameStore';
import { Panel, Tag, Divider } from '../components/ui';
import type { ChronicleEntry } from '../types/game';

type ChronicleKind = 'founding' | 'expansion' | 'population' | 'victory' | 'crisis' | 'reform' | 'trade' | 'tech' | 'reign';

const KIND_META: Record<ChronicleKind, { label: string; icon: string; color: string }> = {
  founding: { label: '开国', icon: '◈', color: 'var(--gold)' },
  expansion: { label: '扩张', icon: '⬡', color: 'var(--accent)' },
  population: { label: '人口', icon: '◯', color: 'var(--text-soft)' },
  victory: { label: '武功', icon: '⚔', color: 'var(--war)' },
  crisis: { label: '危局', icon: '☠', color: 'var(--war)' },
  reform: { label: '改革', icon: '⚖', color: 'var(--accent)' },
  trade: { label: '财赋', icon: '◉', color: 'var(--gold)' },
  tech: { label: '科技', icon: '✦', color: 'var(--accent)' },
  reign: { label: '治世', icon: '✶', color: 'var(--gold)' },
};

const KIND_ORDER: ChronicleKind[] = ['founding', 'reign', 'expansion', 'population', 'trade', 'tech', 'reform', 'victory', 'crisis'];

export default function ChronicleScreen() {
  const { state } = useGameStore();
  // C2: pid 用 selector 精确订阅
  const pid = useGameStore((s) => s.state.playerNationId);
  const player = useGameStore((s) => s.state.nations[pid]);
  const chronicle = state.chronicle;

  // 按类分组
  const grouped: Record<string, ChronicleEntry[]> = {};
  for (const c of chronicle) {
    (grouped[c.kind] ??= []).push(c);
  }

  // 统计
  const stats = {
    total: chronicle.length,
    reign: chronicle.filter((c) => c.kind === 'reign').length,
    expansion: chronicle.filter((c) => c.kind === 'expansion').length,
    victory: chronicle.filter((c) => c.kind === 'victory').length,
    crisis: chronicle.filter((c) => c.kind === 'crisis').length,
  };

  return (
    <div>
      <Panel title="史册" icon="✶" accent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
          <div><Stat label="总条目" value={stats.total} color="var(--gold)" /></div>
          <div><Stat label="治世" value={stats.reign} color="var(--gold)" /></div>
          <div><Stat label="扩张" value={stats.expansion} color="var(--accent)" /></div>
          <div><Stat label="武功" value={stats.victory} color="var(--war)" /></div>
          <div><Stat label="危局" value={stats.crisis} color="var(--war)" /></div>
        </div>
        <p className="dim" style={{ fontSize: 11, marginBottom: 0 }}>
          {player.name} · {player.ruler.name} 治下 · 已历 {state.turn} 年 · 史册载 {chronicle.length} 事
        </p>
      </Panel>

      {chronicle.length === 0 ? (
        <Panel title="尚无史载">
          <p className="dim" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
            帝国初立，史册未开。推进回合，开国、扩张、武功、危局诸事将载入史册。
          </p>
        </Panel>
      ) : (
        <Panel title="纪事本末">
          {KIND_ORDER.map((kind) => {
            const entries = grouped[kind];
            if (!entries || entries.length === 0) return null;
            const meta = KIND_META[kind];
            return (
              <div key={kind} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: meta.color, fontSize: 14 }}>{meta.icon}</span>
                  <strong className="ia-display" style={{ fontSize: 13, color: meta.color, letterSpacing: '0.05em' }}>{meta.label}</strong>
                  <Tag text={`${entries.length}`} tone="info" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 20, borderLeft: `2px solid var(--border)` }}>
                  {entries.map((c, i) => (
                    <div key={i} className="ia-card" style={{ padding: 8, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>第{c.turn}年</span>
                      <div>
                        <strong style={{ fontSize: 12, color: 'var(--text-soft)' }}>{c.title}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2, lineHeight: 1.5 }}>{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-2)', background: 'var(--bg-inset)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
