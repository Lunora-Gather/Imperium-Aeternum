import type { PolicyId } from '../../data/policies';
import { POLICY_BY_ID } from '../../data/policies';
import { LAWS } from '../../data/laws';
import { enactLaw as engineEnactLaw, enactPolicy as engineEnactPolicy } from '../../engine/politics';
import type { GameState } from '../../types/game';
import { failure, runGameAction, spendAdmin, success } from './actionCore';

export function enactPolicyAction(state: GameState, policyId: PolicyId) {
  return runGameAction(state, (working, player) => {
    const definition = POLICY_BY_ID[policyId];
    if (!definition) return failure('政策不存在');
    const apFailure = spendAdmin(player, definition.costAction);
    if (apFailure) return apFailure;
    const result = engineEnactPolicy(player, policyId, working);
    if (!result.ok) return failure(`推行失败：${result.reason ?? '条件不足'}`);
    return success(`推行政策：${definition.name}`);
  });
}
export function enactLawAction(state: GameState, lawId: string) {
  return runGameAction(state, (working, player) => {
    const definition = LAWS.find((entry) => entry.id === lawId);
    if (!definition) return failure('法律不存在');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    const result = engineEnactLaw(player, lawId, working);
    if (!result.ok) return failure(`推行失败：${result.reason ?? '条件不足'}`);
    return success(`推行法律：${definition.name}`);
  });
}
