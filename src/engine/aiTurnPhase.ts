import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId } from '../data/national-characters';
import type { GameState, Nation } from '../types/game';
import { clamp } from '../utils/math';
import { processAITurn } from './ai';
import { settleCultureReligion } from './culture';
import { settleEconomy } from './economy';
import { aiChooseOption, applyEffect, createEventAvailabilityIndex, EVENT_BY_ID, type EventAvailabilityIndex, recordEvent, resolvePendingEventsForAI, rollEvents } from './events';
import { activateTendency } from './formulas';
import { lawPerTurnEffects, settlePolitics } from './politics';
import { settlePopulation } from './population';
import { settleTechnology } from './technology';

function refreshActiveCharacters(nation: Nation): void {
  const activated = activateTendency(nation.tendency) as NationalCharacterId[];
  nation.activeCharacterBonuses = activated.filter((id) => id !== 'balanced' && NATIONAL_CHARACTERS[id]);
}

function groupByNation<T>(items: T[], nationId: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const id = nationId(item);
    const group = groups.get(id);
    if (group) group.push(item);
    else groups.set(id, [item]);
  }
  return groups;
}

export interface AITurnPhaseOptions {
  humanNationIds?: ReadonlySet<string>;
  eventAvailability?: EventAvailabilityIndex;
}

export function runAITurnPhase(state: GameState, playerId: string, rng: () => number, options: AITurnPhaseOptions = {}): void {
  const humanNationIds = options.humanNationIds ?? new Set<string>();
  processAITurn(state, humanNationIds);
  const eventAvailability = options.eventAvailability ?? createEventAvailabilityIndex(state);

  // Peace agreements can transfer provinces during AI orders. Group the resulting
  // map only after those orders, preserving the generator's province order.
  const provincesByOwner = groupByNation(Object.values(state.provinces), p => p.ownerId);
  const relationsBySource = groupByNation(state.relations, r => r.from);

  for (const nation of Object.values(state.nations)) {
    if (nation.id === playerId || nation.isPlayer || nation.defeated) continue;
    if (humanNationIds.has(nation.id)) { refreshActiveCharacters(nation); continue; }
    const provinces = provincesByOwner.get(nation.id) ?? [];
    if (provinces.length === 0) continue;

    const economy = settleEconomy(nation, state, provinces, relationsBySource.get(nation.id) ?? []);
    for (const province of provinces) if (province.priorAgriBase !== undefined) delete province.priorAgriBase;
    settlePopulation(nation, provinces, economy.grain.shortageExpected, true, nation.atWar, false);
    settlePolitics(nation, state, provinces);
    lawPerTurnEffects(nation, provinces);
    settleTechnology(nation, state);
    settleCultureReligion(nation, state, provinces);
    nation.resources.influence = Math.min(nation.resources.influence + 3, 100);

    for (const eventId of rollEvents(nation, state, rng, 1, eventAvailability, provinces)) {
      const event = EVENT_BY_ID[eventId];
      if (!event) continue;
      const optionIndex = aiChooseOption(event, rng);
      const option = event.options[optionIndex];
      if (option) applyEffect(nation, option.effects, state, eventAvailability);
      recordEvent(state, nation.id, eventId, optionIndex, eventAvailability);
    }
    resolvePendingEventsForAI(nation, state, rng, undefined, eventAvailability);

    if (state.turn % 10 === 0) {
      for (const key of Object.keys(nation.tendency) as (keyof typeof nation.tendency)[]) {
        nation.tendency[key] = clamp(nation.tendency[key] - 2, 0, 100);
      }
    }
    refreshActiveCharacters(nation);
  }

  const player = state.nations[playerId];
  if (player) refreshActiveCharacters(player);
}
