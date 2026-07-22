// 待决事件的原子化结算边界：基于最新状态生成新状态，避免双击/按键重复结算。

import type { GameState } from '../types/game';
import { applyEffect, EVENT_BY_ID, recordEvent } from '../engine/events';
import { cloneGameStateForTurn } from '../engine/turnIsolation';

export interface PendingEventResolution {
  state: GameState;
  resolved: boolean;
  eventTitle?: string;
  optionText?: string;
}

function pendingIndex(state: GameState, nationId: string, eventId: string): number {
  return state.pendingEvents.findIndex((pending) => pending.nationId === nationId && pending.eventId === eventId);
}

export function resolvePendingEventChoice(
  state: GameState,
  nationId: string,
  eventId: string,
  optionIndex: number,
): PendingEventResolution {
  const event = EVENT_BY_ID[eventId];
  const option = event?.options[optionIndex];
  if (!event || !option || !state.nations[nationId] || pendingIndex(state, nationId, eventId) < 0) {
    return { state, resolved: false };
  }

  const next = cloneGameStateForTurn(state);
  const index = pendingIndex(next, nationId, eventId);
  if (index < 0) return { state, resolved: false };

  applyEffect(next.nations[nationId], option.effects, next);
  recordEvent(next, nationId, eventId, optionIndex);
  next.pendingEvents.splice(index, 1);

  return {
    state: next,
    resolved: true,
    eventTitle: event.title,
    optionText: option.text,
  };
}

export function discardPendingEvent(state: GameState, nationId: string, eventId: string): GameState {
  const index = pendingIndex(state, nationId, eventId);
  if (index < 0) return state;
  const next = cloneGameStateForTurn(state);
  next.pendingEvents.splice(index, 1);
  return next;
}
