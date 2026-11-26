import type { GameState } from '../types/game';

export function sharedNationView(state: GameState, nationId: string): GameState {
  const history = state.sharedHistories?.[nationId] ?? state.history.filter((r) => r.nationId === nationId);
  const lastReport = history[history.length - 1] ?? (state.lastReport?.nationId === nationId ? state.lastReport : null);
  return {
    ...state, playerNationId: nationId, history, lastReport,
    strategyFocus: state.sharedFocuses?.[nationId] ?? (state.playerNationId === nationId ? state.strategyFocus : undefined) ?? 'balance',
    nations: Object.fromEntries(Object.entries(state.nations).map(([id, n]) =>
      [id, n.isPlayer === (id === nationId) ? n : { ...n, isPlayer: id === nationId }])),
  };
}
