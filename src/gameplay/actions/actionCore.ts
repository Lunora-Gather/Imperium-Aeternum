import { enableMapSet, produce } from 'immer';
import type { DiplomaticRelation, GameState, Nation } from '../../types/game';
import { invariantErrors } from '../stateInvariants';

enableMapSet();

export interface GameActionResult {
  state: GameState;
  ok: boolean;
  messages: string[];
}

export interface ActionOutcome {
  ok: boolean;
  messages: string[];
}

export type ActionExecutor = (state: GameState, player: Nation) => ActionOutcome;

export function success(...messages: string[]): ActionOutcome {
  return { ok: true, messages };
}

export function failure(message: string): ActionOutcome {
  return { ok: false, messages: [message] };
}

/**
 * Executes one player command as an isolated transaction.
 * Failed commands return the exact original state reference; successful commands
 * use Immer structural sharing so every changed selector receives a new reference.
 */
export function runGameAction(state: GameState, execute: ActionExecutor): GameActionResult {
  let outcome: ActionOutcome = failure('操作失败');
  let candidate: GameState;

  try {
    candidate = produce(state, (draft) => {
      const working = draft as unknown as GameState;
      const player = working.nations[working.playerNationId];
      if (!player || player.defeated) {
        outcome = failure('玩家国家不存在或已经灭亡');
        return;
      }
      outcome = execute(working, player);
      if (outcome.ok) working._relMap = undefined;
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { state, ok: false, messages: [`操作异常：${detail}`] };
  }

  if (!outcome.ok) return { state, ...outcome };
  const errors = invariantErrors(candidate);
  if (errors.length > 0) {
    return {
      state,
      ok: false,
      messages: [`操作已撤销：状态校验失败（${errors[0].detail}）`],
    };
  }
  return { state: candidate, ...outcome };
}

export function spendAdmin(player: Nation, amount: number): ActionOutcome | null {
  if (player.resources.adminPt < amount) return failure(`行动点不足（需 ${amount}）`);
  player.resources.adminPt -= amount;
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function hasTech(player: Nation, techId: string | undefined): boolean {
  if (!techId) return true;
  const match = /^(agri|mil|admin|culture)_lv(\d+)$/.exec(techId);
  if (!match) return false;
  const branch = match[1] as 'agri' | 'mil' | 'admin' | 'culture';
  return player.tech[branch] >= Number(match[2]);
}

export function relationPair(
  state: GameState,
  from: string,
  to: string,
): [DiplomaticRelation, DiplomaticRelation] | null {
  const left = state.relations.find((relation) => relation.from === from && relation.to === to);
  const right = state.relations.find((relation) => relation.from === to && relation.to === from);
  return left && right ? [left, right] : null;
}

export function validForeignTarget(state: GameState, player: Nation, targetId: string): Nation | null {
  if (!targetId || targetId === player.id) return null;
  const target = state.nations[targetId];
  return target && !target.defeated ? target : null;
}
