import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameState, Nation, Province } from '../types/game';

export type StrategyFocusId = 'balance' | 'stability' | 'prosperity' | 'military' | 'diplomacy' | 'reform';

interface StrategyFocusDef {
  id: StrategyFocusId;
  label: string;
  short: string;
  desc: string;
  effect: string;
}

const FOCUSES: StrategyFocusDef[] = [
  { id: 'balance', label: '均衡', short: '守中', desc: '维持基本行政弹性，适合不确定局势。', effect: '每年行政点 +1' },
  { id: 'stability', label: '安民', short: '稳国', desc: '压低不满，稳住地方，适合内乱风险高时。', effect: '安定 +1，不满与叛乱略降，国库小耗' },
  { id: 'prosperity', label: '富国', short: '生财', desc: '优先税源与粮储，适合和平发展。', effect: '金粮随疆土增长，腐败略升' },
  { id: 'military', label: '强军', short: '备战', desc: '提高补给和军队训练，适合准备扩张。', effect: '补给 +8，军队士气/训练 +1，厌战小升' },
  { id: 'diplomacy', label: '睦邻', short: '合纵', desc: '改善周边关系，积累影响力，适合外交路线。', effect: '影响力 +4，与周边关系略升，威胁略降' },
  { id: 'reform', label: '改革', short: '变法', desc: '积累科研与行政力，但短期有稳定压力。', effect: '科研 +4、行政 +1，安定 -1' },
];

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function playerId(state: GameState): string {
  return state.playerNationId || Object.values(state.nations).find((n) => n.isPlayer)?.id || Object.keys(state.nations)[0];
}

function provincesOfPlayer(state: GameState, pid: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === pid);
}

function applyFocusEffect(state: GameState, focus: StrategyFocusId): { state: GameState; note: string } {
  const pid = playerId(state);
  const player = state.nations[pid];
  if (!player) return { state, note: '' };

  const next: GameState = {
    ...state,
    nations: { ...state.nations, [pid]: { ...player, resources: { ...player.resources }, government: { ...player.government }, army: [...player.army] } },
    provinces: { ...state.provinces },
    relations: state.relations.map((r) => ({ ...r })),
  } as GameState;
  (next as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus = focus;

  const p = next.nations[pid] as Nation;
  const provs = provincesOfPlayer(next, pid);
  const scale = Math.max(1, Math.min(12, provs.length));
  let note = '';

  if (focus === 'balance') {
    p.resources.adminPt += 1;
    note = '均衡国策：行政点 +1';
  }
  if (focus === 'stability') {
    p.government.stability = clamp(p.government.stability + 1);
    p.resources.gold -= Math.max(4, Math.round(scale * 1.5));
    for (const prov of provs) {
      const copy = { ...prov, unrest: clamp(prov.unrest - 1), rebellionRisk: clamp(prov.rebellionRisk - 1) };
      next.provinces[copy.id] = copy;
    }
    note = '安民国策：安定 +1，地方不满下降';
  }
  if (focus === 'prosperity') {
    p.resources.gold += Math.round(6 + scale * 3);
    p.resources.food += Math.round(8 + scale * 4);
    p.government.corruption = clamp(p.government.corruption + 0.5);
    note = '富国国策：国库与粮储增长，腐败略升';
  }
  if (focus === 'military') {
    p.resources.supply += 8;
    p.warExhaustion = clamp(p.warExhaustion + 0.5);
    p.army = p.army.map((a) => ({ ...a, morale: clamp(a.morale + 1), training: clamp(a.training + 1), supply: clamp(a.supply + 2) }));
    note = '强军国策：补给增长，军队士气与训练提升';
  }
  if (focus === 'diplomacy') {
    p.resources.influence += 4;
    for (const r of next.relations) {
      if (r.from === pid || r.to === pid) {
        r.relation = clamp(r.relation + 1, -100, 100);
        r.trust = clamp(r.trust + 0.5);
        r.threat = clamp(r.threat - 0.5);
      }
    }
    note = '睦邻国策：影响力增加，周边关系略有改善';
  }
  if (focus === 'reform') {
    p.resources.sciPt += 4;
    p.resources.adminPt += 1;
    p.government.stability = clamp(p.government.stability - 1);
    note = '改革国策：科研与行政增长，短期安定承压';
  }

  return { state: next, note };
}

let installed = false;

export function installStrategyFocus(): void {
  if (installed) return;
  installed = true;
  const store = useGameStore.getState() as unknown as Record<string, unknown>;
  const originalNextTurn = store.nextTurn as (() => unknown) | undefined;
  if (!originalNextTurn) return;

  useGameStore.setState({
    setStrategyFocus: (id: StrategyFocusId) => {
      const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void };
      const old = ((cur.state as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus ?? 'balance') as StrategyFocusId;
      if (old === id) return;
      const def = FOCUSES.find((f) => f.id === id);
      useGameStore.setState({ state: { ...cur.state, strategyFocus: id } as GameState } as never);
      cur.logMsg?.(`国策焦点改为：${def?.label ?? id}`);
    },
    nextTurn: () => {
      const result = originalNextTurn.call(useGameStore.getState());
      const cur = useGameStore.getState() as unknown as { state: GameState; logMsg?: (msg: string) => void };
      const focus = (((cur.state as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus) ?? 'balance') as StrategyFocusId;
      if (cur.state.victory.type) return result;
      const applied = applyFocusEffect(cur.state, focus);
      useGameStore.setState({ state: applied.state } as never);
      if (applied.note) cur.logMsg?.(applied.note);
      return result;
    },
  } as never);
}

export function StrategyFocusDock() {
  const scene = useGameStore((s) => s.scene);
  const focus = useGameStore((s) => (((s.state as unknown as { strategyFocus?: StrategyFocusId }).strategyFocus) ?? 'balance') as StrategyFocusId);
  const state = useGameStore((s) => s.state);
  const player = state.nations[state.playerNationId];
  const current = useMemo(() => FOCUSES.find((f) => f.id === focus) ?? FOCUSES[0], [focus]);
  if (scene !== 'playing' || !player) return null;

  const setFocus = (id: StrategyFocusId) => {
    const action = (useGameStore.getState() as unknown as { setStrategyFocus?: (id: StrategyFocusId) => void }).setStrategyFocus;
    action?.(id);
  };

  return (
    <aside className="ia-focus-dock" aria-label="国策焦点">
      <div className="ia-focus-title">
        <span>国策焦点</span>
        <strong>{current.label}</strong>
      </div>
      <p>{current.effect}</p>
      <div className="ia-focus-options">
        {FOCUSES.map((f) => (
          <button key={f.id} className={focus === f.id ? 'is-active' : ''} onClick={() => setFocus(f.id)} title={`${f.desc}\n${f.effect}`}>
            <span>{f.short}</span>
            <em>{f.label}</em>
          </button>
        ))}
      </div>
    </aside>
  );
}
