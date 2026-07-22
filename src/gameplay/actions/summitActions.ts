import type { GameState, SummitAgenda, SummitStance } from '../../types/game';
import {
  applyDiplomaticSummitResolution,
  calculateDiplomaticSummitResolution,
  previewDiplomaticSummit,
  SUMMIT_AGENDAS,
} from '../../engine/summits';
import { failure, runGameAction, success } from './actionCore';

const VALID_AGENDAS = new Set<SummitAgenda>(['trade', 'security', 'normalization', 'technology']);
const VALID_STANCES = new Set<SummitStance>(['conciliatory', 'pragmatic', 'firm']);

export function conveneDiplomaticSummitAction(
  state: GameState,
  targetId: string,
  agenda: SummitAgenda,
  stance: SummitStance,
) {
  return runGameAction(state, (working, player) => {
    if (!VALID_AGENDAS.has(agenda) || !VALID_STANCES.has(stance)) return failure('会谈议题或交涉姿态无效');
    const preview = previewDiplomaticSummit(working, player.id, targetId, agenda, stance);
    if (!preview.eligible) return failure(`无法举行元首会谈：${preview.reasons[0] ?? '条件不足'}`);

    const resolution = calculateDiplomaticSummitResolution(working, player.id, targetId, agenda, stance);
    const record = applyDiplomaticSummitResolution(working, resolution);
    const commitmentText = record.commitments.length > 0
      ? `承诺：${record.commitments.join('；')}`
      : `${SUMMIT_AGENDAS[agenda].label}未形成长期协议`;
    return success(record.summary, commitmentText);
  });
}
