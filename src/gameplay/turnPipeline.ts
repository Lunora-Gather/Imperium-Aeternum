// 单一回合管线：安全引擎结算 → 国运目标 → 战略焦点/AI 记忆 → 状态净化。
// Store、测试和未来模拟器都应调用此入口，避免运行时覆盖方法造成顺序漂移。

import type { GameState, TurnReport } from '../types/game';
import { applyAmbitionsAfterTurn, syncAmbitionMeta } from './ambitions';
import { processTurn } from '../engine/turn';
import { sanitizeState } from './stateHygiene';
import { applyAIStrategy, applyPlayerFocus } from './strategyFocus';
import { applyNationalPurposeAfterTurn, initializeNationalPurpose } from './nationalPurpose';

export interface TurnPipelineResult {
  state: GameState;
  report: TurnReport;
  notes: string[];
}

export function prepareGameState(state: GameState): GameState {
  return sanitizeState(initializeNationalPurpose(syncAmbitionMeta(state)));
}

export function advanceTurnPipeline(state: GameState): TurnPipelineResult {
  const turn = processTurn(state);
  const purpose = applyNationalPurposeAfterTurn(turn.state);
  const ambition = applyAmbitionsAfterTurn(purpose.state);
  const notes = [...purpose.notes, ...(ambition.note ? [ambition.note] : [])];
  let next = ambition.state;

  if (!next.victory.type) {
    const focus = applyPlayerFocus(next, next.strategyFocus ?? 'balance');
    next = applyAIStrategy(focus.state);
    if (focus.note) {
      notes.push(focus.note);
      if (next.lastReport) {
        const strategicNotes = [...(next.lastReport.strategicNotes ?? []), focus.note].slice(-8);
        next.lastReport = { ...next.lastReport, strategicNotes };
        next.history = next.history.map((report) => report.turn === next.lastReport?.turn ? next.lastReport : report) as TurnReport[];
      }
    }
  }

  const finalState = sanitizeState(next);
  const finalReport = finalState.lastReport?.turn === turn.report.turn ? finalState.lastReport : turn.report;
  return { state: finalState, report: finalReport, notes };
}
