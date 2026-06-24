// EventModal v2 — category 配色 + 选项后果提示 + 键盘快捷键
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { EVENT_BY_ID, applyEffect, recordEvent } from '../engine/events';
import { Btn, Tag } from '../components/ui';
import type { EventEffect } from '../data/events';

const CATEGORY_TONE: Record<string, 'danger' | 'warn' | 'info' | 'good'> = {
  crisis: 'danger', military: 'danger', religion: 'warn',
  politics: 'warn', economy: 'warn', diplomacy: 'info',
  science: 'good', opportunity: 'good', culture: 'info', population: 'info',
};
const CATEGORY_ICON: Record<string, string> = {
  crisis: '⚠', military: '⚔', religion: '☯', politics: '⚖',
  economy: '💰', diplomacy: '🤝', science: '🔬', opportunity: '✨', culture: '🎭', population: '👥',
};

// 选项效果摘要
function effectSummary(eff: EventEffect): { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] {
  const out: { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] = [];
  const push = (v: number, label: string, invert = false) => {
    if (v === 0) return;
    const isGood = invert ? v < 0 : v > 0;
    out.push({ txt: `${label} ${v >= 0 ? '+' : ''}${v}`, tone: isGood ? 'good' : 'danger' });
  };
  push(eff.gold ?? 0, '金');
  push(eff.food ?? 0, '粮');
  push(eff.stability ?? 0, '稳定');
  push(eff.legitimacy ?? 0, '合法');
  push(eff.corruption ?? 0, '腐败', true);
  push(eff.warExhaustion ?? 0, '厌战', true);
  if (eff.factionSat && eff.factionSat.length > 0) {
    eff.factionSat.forEach((f) => out.push({ txt: `${f.faction} ${f.delta >= 0 ? '+' : ''}${f.delta}`, tone: f.delta >= 0 ? 'good' : 'warn' }));
  }
  return out;
}

export default function EventModal() {
  const { state, logMsg } = useGameStore();
  const pid = state.playerNationId;
  const pending = state.pendingEvents.find((p) => p.nationId === pid);
  if (!pending) return null;
  const ev = EVENT_BY_ID[pending.eventId];
  if (!ev) return null;

  const choose = (idx: number) => {
    const opt = ev.options[idx];
    if (opt) {
      applyEffect(state.nations[pid], opt.effects, state);
      logMsg(`事件 ${ev.title}：选择「${opt.text}」`);
    }
    recordEvent(state, pid, pending.eventId, idx);
    state.pendingEvents = state.pendingEvents.filter((p) => p !== pending);
    useGameStore.setState((s) => ({ state: { ...s.state } }));
  };

  // P0: 键盘快捷键——1/2/3 选对应选项（最多支持 3 选项）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' && ev.options.length >= 1) { e.preventDefault(); choose(0); }
      else if (e.key === '2' && ev.options.length >= 2) { e.preventDefault(); choose(1); }
      else if (e.key === '3' && ev.options.length >= 3) { e.preventDefault(); choose(2); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev.options.length, pending]);

  const tone = CATEGORY_TONE[ev.category] ?? 'info';
  const icon = CATEGORY_ICON[ev.category] ?? '📢';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 10, padding: 18, maxWidth: 520, width: '90%',
        border: `2px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border-hi'})`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(52,152,219,0.1)`,
      }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>
              <Tag text={ev.category} tone={tone} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{ev.title}</h3>
          </div>
        </div>
        <p style={{ color: 'var(--text)', marginBottom: 14, fontSize: 14, lineHeight: 1.6 }}>{ev.description}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ev.options.map((opt, i) => {
            const sums = effectSummary(opt.effects);
            const hasChain = !!(opt.effects as { triggerEvent?: string }).triggerEvent;
            return (
              <button key={i} className="ia-btn" onClick={() => choose(i)}
                title={`快捷键 ${i + 1}`}
                style={{ textAlign: 'left', padding: 10, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ev.options.length <= 3 && <span style={{ fontSize: 10, color: 'var(--gold)', opacity: 0.7, border: '1px solid var(--border-gold)', borderRadius: 3, padding: '0 4px' }}>[{i + 1}]</span>}
                  {opt.text}
                </div>
                {sums.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {sums.map((s, j) => <Tag key={j} text={s.txt} tone={s.tone} />)}
                  </div>
                )}
                {hasChain && (
                  <div style={{ fontSize: 10, color: 'var(--gold)', fontStyle: 'italic', marginTop: 2 }}>✦ 此事后续或有变…</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
