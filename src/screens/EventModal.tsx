// EventModal v4 — 事件后果预览更完整：即时数值 + 长期治理影响 + 快捷键
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { EVENT_BY_ID, applyEffect, recordEvent } from '../engine/events';
import { Tag } from '../components/ui';
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

const FACTION_LABEL: Record<string, string> = {
  nobles: '贵族', merchants: '商人', military: '军方', commoners: '民众', clergy: '神职',
};

function effectTone(label: string, value: number): 'good' | 'warn' | 'danger' | 'info' {
  if (value === 0) return 'info';
  const lowerIsGood = ['腐败', '厌战', '税率'].includes(label);
  if (lowerIsGood) return value < 0 ? 'good' : value > 0 ? 'warn' : 'info';
  if (label === '人口' && value < 0) return 'danger';
  return value > 0 ? 'good' : 'danger';
}

function effectSummary(eff: EventEffect): { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] {
  const out: { txt: string; tone: 'good' | 'warn' | 'danger' | 'info' }[] = [];
  const push = (v: number | undefined, label: string, suffix = '') => {
    if (!v) return;
    out.push({ txt: `${label} ${v >= 0 ? '+' : ''}${v}${suffix}`, tone: effectTone(label, v) });
  };

  push(eff.gold, '金');
  push(eff.food, '粮');
  push(eff.wood, '木');
  push(eff.iron, '铁');
  push(eff.population, '人口');
  push(eff.stability, '稳定');
  push(eff.legitimacy, '合法');
  push(eff.corruption, '腐败');
  push(eff.efficiency, '治能');
  push(eff.warExhaustion, '厌战');
  push(eff.influence, '影响');
  push(eff.adminPt, '行政');
  push(eff.sciPt, '科研');
  if (eff.taxRate) out.push({ txt: `税率 ${eff.taxRate > 0 ? '+' : ''}${Math.round(eff.taxRate * 100)}%`, tone: effectTone('税率', eff.taxRate) });
  if (eff.assimilationMod) out.push({ txt: `同化 ${eff.assimilationMod > 0 ? '+' : ''}${eff.assimilationMod}`, tone: eff.assimilationMod > 0 ? 'good' : 'warn' });
  if (eff.relation) out.push({ txt: `外交关系 ${eff.relation.delta >= 0 ? '+' : ''}${eff.relation.delta}`, tone: eff.relation.delta >= 0 ? 'good' : 'danger' });
  if (eff.factionSat && eff.factionSat.length > 0) {
    eff.factionSat.forEach((f) => out.push({ txt: `${FACTION_LABEL[f.faction] ?? f.faction} ${f.delta >= 0 ? '+' : ''}${f.delta}`, tone: f.delta >= 0 ? 'good' : 'warn' }));
  }
  return out;
}

function consequenceText(eff: EventEffect): string {
  const notes: string[] = [];
  if ((eff.stability ?? 0) <= -8) notes.push('可能诱发不满与叛乱');
  if ((eff.legitimacy ?? 0) <= -8) notes.push('会削弱统治正当性');
  if ((eff.corruption ?? 0) > 0) notes.push('长期拖累税收与行政');
  if ((eff.warExhaustion ?? 0) > 0) notes.push('战时压力会上升');
  if ((eff.population ?? 0) < 0) notes.push('人口损失会影响税收、兵源和粮耗');
  if ((eff.food ?? 0) < -80) notes.push('粮储下降，后续饥荒风险升高');
  if ((eff.gold ?? 0) < -120) notes.push('国库压力明显上升');
  if ((eff.taxRate ?? 0) > 0) notes.push('增税会换来收入，但民心承压');
  if ((eff.adminPt ?? 0) > 0 || (eff.sciPt ?? 0) > 0) notes.push('短期行动能力提升');
  if (eff.triggerEvent) notes.push('会开启后续事件链');
  if (notes.length === 0) return '后果较直接，无明显长期连锁。';
  return notes.join('；') + '。';
}

export default function EventModal() {
  const { state, logMsg } = useGameStore();
  const pid = state.playerNationId;
  const pending = state.pendingEvents.find((p) => p.nationId === pid) ?? null;
  const ev = pending ? EVENT_BY_ID[pending.eventId] : null;

  const clearPending = () => {
    if (!pending) return;
    state.pendingEvents = state.pendingEvents.filter((p) => p !== pending);
    useGameStore.setState((s) => ({ state: { ...s.state } }));
  };

  const choose = (idx: number) => {
    if (!pending || !ev) return;
    const opt = ev.options[idx];
    if (opt) {
      applyEffect(state.nations[pid], opt.effects, state);
      logMsg(`事件 ${ev.title}：选择「${opt.text}」`);
    }
    recordEvent(state, pid, pending.eventId, idx);
    state.pendingEvents = state.pendingEvents.filter((p) => p !== pending);
    useGameStore.setState((s) => ({ state: { ...s.state } }));
  };

  useEffect(() => {
    if (pending && !ev) {
      logMsg(`事件已失效：${pending.eventId}，已跳过`);
      clearPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.eventId, !!ev]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pending || !ev) return;
      if (e.key === '1' && ev.options.length >= 1) { e.preventDefault(); choose(0); }
      else if (e.key === '2' && ev.options.length >= 2) { e.preventDefault(); choose(1); }
      else if (e.key === '3' && ev.options.length >= 3) { e.preventDefault(); choose(2); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.eventId, ev?.options.length]);

  if (!pending || !ev) return null;

  const tone = CATEGORY_TONE[ev.category] ?? 'info';
  const icon = CATEGORY_ICON[ev.category] ?? '📢';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 10, padding: 18, maxWidth: 620, width: '92%',
        border: `1px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border-gold'})`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.38)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 26 }}>{icon}</span>
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
            const note = consequenceText(opt.effects);
            return (
              <button key={i} className="ia-btn" onClick={() => choose(i)}
                title={`快捷键 ${i + 1}`}
                style={{ textAlign: 'left', padding: 11, flexDirection: 'column', alignItems: 'stretch', gap: 7 }}>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ev.options.length <= 3 && <span style={{ fontSize: 10, color: 'var(--gold)', opacity: 0.7, border: '1px solid var(--border-gold)', borderRadius: 3, padding: '0 4px' }}>[{i + 1}]</span>}
                  {opt.text}
                </div>
                {sums.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {sums.map((s, j) => <Tag key={j} text={s.txt} tone={s.tone} />)}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>后果：{note}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
