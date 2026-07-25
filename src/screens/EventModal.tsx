import { registerGovernanceTranslations } from '../i18n/catalogs/governance';
import { localizeReactTree } from '../i18n/reactTree';
registerGovernanceTranslations();
// EventModal v4 — 事件后果预览更完整：即时数值 + 长期治理影响 + 快捷键
import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { EVENT_BY_ID } from '../engine/events';
import { Tag } from '../components/ui';
import type { EventEffect } from '../data/events';
import { discardPendingEvent } from '../gameplay/pendingEventResolution';

const CATEGORY_TONE: Record<string, 'danger' | 'warn' | 'info' | 'good'> = {
  crisis: 'danger', military: 'danger', religion: 'warn',
  politics: 'warn', economy: 'warn', diplomacy: 'info',
  science: 'good', opportunity: 'good', culture: 'info', population: 'info',
};
const CATEGORY_ICON: Record<string, string> = {
  crisis: '⚠', military: '⚔', religion: '☯', politics: '⚖',
  economy: '💰', diplomacy: '🤝', science: '🔬', opportunity: '✨', culture: '🎭', population: '👥',
};
const CATEGORY_LABEL: Record<string, string> = {
  crisis: '危机', military: '军事', religion: '宗教', politics: '政治',
  economy: '经济', diplomacy: '外交', science: '科技', opportunity: '机遇', culture: '文化', population: '人口',
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
  const { state, logMsg, resolveEvent } = useGameStore();
  const pid = state.playerNationId;
  const pending = state.pendingEvents.find((p) => p.nationId === pid) ?? null;
  const ev = pending ? EVENT_BY_ID[pending.eventId] : null;
  const dialogRef = useRef<HTMLDivElement>(null);

  const clearPending = useCallback(() => {
    if (!pending) return;
    const current = useGameStore.getState().state;
    const next = discardPendingEvent(current, pid, pending.eventId);
    if (next !== current) useGameStore.setState({ state: next });
  }, [pending, pid]);

  const choose = useCallback((idx: number) => {
    if (!pending || !ev) return;
    resolveEvent(pending.eventId, idx);
  }, [ev, pending, resolveEvent]);

  useEffect(() => {
    if (pending && !ev) {
      logMsg(`事件已失效：${pending.eventId}，已跳过`);
      clearPending();
    }
  }, [clearPending, ev, logMsg, pending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pending || !ev) return;
      if (e.key === '1' && ev.options.length >= 1) { e.preventDefault(); choose(0); }
      else if (e.key === '2' && ev.options.length >= 2) { e.preventDefault(); choose(1); }
      else if (e.key === '3' && ev.options.length >= 3) { e.preventDefault(); choose(2); }
      else if (e.key === 'Tab') {
        const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    dialogRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, ev, pending]);

  if (!pending || !ev) return null;

  const tone = CATEGORY_TONE[ev.category] ?? 'info';
  const icon = CATEGORY_ICON[ev.category] ?? '📢';
  const playerEvents = state.pendingEvents.filter((event) => event.nationId === pid);
  const eventPosition = Math.max(0, playerEvents.findIndex((event) => event.eventId === pending.eventId)) + 1;
  const shortcutHint = `数字键 1–${Math.min(3, ev.options.length)} 可快速选择`;

  return localizeReactTree(
    <div className="ia-event-backdrop">
      <section
        ref={dialogRef}
        className={`ia-event-dialog tone-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        aria-describedby="event-dialog-description"
      >
        <header className="ia-event-header">
          <span className="ia-event-icon" aria-hidden="true">{icon}</span>
          <div className="ia-event-heading">
            <div className="ia-event-kicker">
              <Tag text={CATEGORY_LABEL[ev.category] ?? ev.category} tone={tone} />
              <span>待决事件</span>
              {playerEvents.length > 1 && <span className="ia-event-progress">{eventPosition} / {playerEvents.length}</span>}
            </div>
            <h3 id="event-dialog-title">{ev.title}</h3>
          </div>
        </header>

        <div className="ia-event-body">
          <p id="event-dialog-description" className="ia-event-description">{ev.description}</p>
          <div className="ia-event-options">
          {ev.options.map((opt, i) => {
            const sums = effectSummary(opt.effects);
            const note = consequenceText(opt.effects);
            return (
              <button
                key={i}
                className="ia-event-option"
                onClick={() => choose(i)}
                title={`快捷键 ${i + 1}`}
                aria-label={`${i + 1}. ${opt.text}`}
              >
                <div className="ia-event-option-head">
                  <span className="ia-event-shortcut" aria-hidden="true">{i + 1}</span>
                  <strong>{opt.text}</strong>
                  <span className="ia-event-select"><span>选择</span><b aria-hidden="true">→</b></span>
                </div>
                {sums.length > 0 && (
                  <div className="ia-event-impact">
                    <span className="ia-event-section-label">即时影响</span>
                    <div className="ia-event-effect-tags">
                      {sums.map((s, j) => <Tag key={j} text={s.txt} tone={s.tone} />)}
                    </div>
                  </div>
                )}
                <div className="ia-event-consequence">
                  <span className="ia-event-section-label">后续影响</span>
                  <span>{note}</span>
                </div>
              </button>
            );
          })}
          </div>
        </div>
        <footer className="ia-event-footer">
          <span>{shortcutHint}</span>
          <span>选择后立即生效</span>
        </footer>
      </section>
    </div>
  );
}
