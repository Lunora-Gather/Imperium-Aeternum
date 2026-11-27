// 单一回合管线：安全引擎结算 → 国运目标 → 战略焦点/AI 记忆 → 状态净化。
// Store、测试和未来模拟器都应调用此入口，避免运行时覆盖方法造成顺序漂移。

import type { GameState, TurnReport } from '../types/game';
import { applyAmbitionsAfterTurn } from './ambitions';
import { detectMilestones } from '../engine/chronicle';
import { nationWarnings, processTurn, yearEndChanges } from '../engine/turn';
import { sanitizeTurnSnapshot } from './stateHygiene';
import { applyAIStrategy, applyPlayerFocus } from './strategyFocus';
import { reviewBorderPact } from './borderPact';
import { offerGrainBudget } from './campaignDecisions';
import { settleNationalPurpose } from './nationalPurpose';
export { prepareGameState } from './prepareGameState';

export interface TurnPipelineResult {
  state: GameState;
  report: TurnReport;
  notes: string[];
}

export function advanceTurnPipeline(state: GameState): TurnPipelineResult {
  const turn = processTurn(state, { deferNationalMilestones: true });
  const initialWarnings = nationWarnings(turn.state.nations[turn.state.playerNationId]);
  const purpose = settleNationalPurpose(turn.state);
  const ambition = applyAmbitionsAfterTurn(purpose.state);
  const notes = [...purpose.notes, ...(ambition.note ? [ambition.note] : [])];
  let next = ambition.state;

  if (!next.victory.type) {
    const focus = applyPlayerFocus(next, next.strategyFocus ?? 'balance');
    next = applyAIStrategy(focus.state);
    reviewBorderPact(next, state);
    offerGrainBudget(next);
    if (focus.note) {
      notes.push(focus.note);
      if (next.lastReport) {
        const strategicNotes = [...(next.lastReport.strategicNotes ?? []), focus.note].slice(-8);
        next.lastReport = { ...next.lastReport, strategicNotes };
      }
    }
  }

  const finalState = sanitizeTurnSnapshot(next);
  const id = finalState.playerNationId;
  const report = finalState.lastReport ?? turn.report;
  const finalReport = { ...report, ...yearEndChanges(state, finalState, id), warnings: [
    ...nationWarnings(finalState.nations[id]), ...report.warnings.filter(w => !initialWarnings.includes(w)),
  ] };
  finalState.lastReport = finalReport;
  finalState.history = finalState.history.map((entry) => entry.turn === finalReport.turn && entry.nationId === id ? finalReport : entry);
  detectMilestones(finalState, state);
  return { state: finalState, report: finalReport, notes };
}
