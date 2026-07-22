import { describe, expect, it } from 'vitest';
import { createWorldState } from '../init';
import type { GameState } from '../../types/game';
import { advanceTurnPipeline, prepareGameState } from '../../gameplay/turnPipeline';
import { resolvePendingEventChoice } from '../../gameplay/pendingEventResolution';
import { invariantErrors } from '../../gameplay/stateInvariants';

const TIMEOUT_MS = 60_000;

function serializable(state: GameState): string {
  return JSON.stringify({ ...state, _relMap: undefined });
}

function resolveAllPlayerEvents(state: GameState): GameState {
  let next = state;
  for (let guard = 0; guard < 20; guard += 1) {
    const pending = next.pendingEvents.find((entry) => entry.nationId === next.playerNationId);
    if (!pending) return next;
    const resolved = resolvePendingEventChoice(next, pending.nationId, pending.eventId, 0);
    if (!resolved.resolved) throw new Error(`无法结算确定性重放事件 ${pending.eventId}`);
    next = resolved.state;
  }
  throw new Error('确定性重放的玩家事件链超过 20 层');
}

function replayPair(create: () => GameState, turns: number): void {
  let left = prepareGameState(create());
  let right = prepareGameState(create());
  expect(serializable(left)).toBe(serializable(right));

  for (let turn = 0; turn < turns; turn += 1) {
    left = resolveAllPlayerEvents(advanceTurnPipeline(left).state);
    right = resolveAllPlayerEvents(advanceTurnPipeline(right).state);
    expect(serializable(left), `turn ${turn + 1}`).toBe(serializable(right));
    expect(invariantErrors(left), `turn ${turn + 1}`).toEqual([]);
  }
}

describe('cross-scale deterministic replay', () => {
  it('replays the same regional seed and event choices into an identical full state', () => {
    replayPair(
      () => createWorldState(73001, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n']),
      4,
    );
  }, TIMEOUT_MS);

  it('replays the same full-world seed and event choices into an identical full state', () => {
    replayPair(() => createWorldState(73002, 'n_ea_qin'), 2);
  }, TIMEOUT_MS);
});
