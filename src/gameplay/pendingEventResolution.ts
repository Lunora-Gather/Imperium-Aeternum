// 待决事件的原子化结算边界：基于最新状态生成新状态，避免双击/按键重复结算。

import { Immer } from 'immer';
import type { GameState } from '../types/game';
import { applyEffect, EVENT_BY_ID, recordEvent } from '../engine/events';

// Keep untouched world data shared and preserve the engine's mutable snapshots.
const eventUpdates = new Immer({ autoFreeze: false });

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
  const index = pendingIndex(state, nationId, eventId);
  if (!event || !option || !state.nations[nationId] || index < 0) {
    return { state, resolved: false };
  }

  const next = eventUpdates.produce(state, (draft) => {
    draft._relMap = undefined;
    applyEffect(draft.nations[nationId], option.effects, draft);
    recordEvent(draft, nationId, eventId, optionIndex);
    draft.pendingEvents.splice(index, 1);
    if (draft.pendingEventOptions?.nationId === nationId && draft.pendingEventOptions.eventId === eventId) draft.pendingEventOptions = null;
  });

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
  return { ...state, _relMap: undefined, pendingEvents: state.pendingEvents.filter((_, i) => i !== index) };
}
