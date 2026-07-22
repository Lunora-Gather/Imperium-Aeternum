import { NATIONAL_CHARACTERS } from '../data/national-characters';
import type { NationalCharacterId } from '../data/national-characters';
import type { GameState, Nation, Province } from '../types/game';
import { clamp } from '../utils/math';
import { processAITurn } from './ai';
import { settleCultureReligion } from './culture';
import { settleEconomy } from './economy';
import { aiChooseOption, applyEffect, createEventAvailabilityIndex, EVENT_BY_ID, recordEvent, resolvePendingEventsForAI, rollEvents } from './events';
import { activateTendency } from './formulas';
import { lawPerTurnEffects, settlePolitics } from './politics';
import { settlePopulation } from './population';
import { settleTechnology } from './technology';

function refreshActiveCharacters(nation: Nation): void {
  const activated = activateTendency(nation.tendency) as NationalCharacterId[];
  nation.activeCharacterBonuses = activated.filter((id) => id !== 'balanced' && NATIONAL_CHARACTERS[id]);
}

export function runAITurnPhase(state: GameState, playerId: string, rng: () => number): void {
  processAITurn(state);
  const eventAvailability = createEventAvailabilityIndex(state);

  const provincesByOwner = new Map<string, Province[]>();
  for (const province of Object.values(state.provinces)) {
    const owned = provincesByOwner.get(province.ownerId);
    if (owned) owned.push(province);
    else provincesByOwner.set(province.ownerId, [province]);
  }

  for (const nation of Object.values(state.nations)) {
    if (nation.id === playerId || nation.isPlayer || nation.defeated) continue;
    const provinces = provincesByOwner.get(nation.id) ?? [];
    if (provinces.length === 0) continue;

    settleEconomy(nation, state);
    const totalPopulation = provinces.reduce((sum, province) => sum + province.population, 0);
    settlePopulation(nation, provinces, nation.resources.food < totalPopulation * 0.4, true, nation.atWar, false);
    settlePolitics(nation, state);
    lawPerTurnEffects(nation, provinces);
    settleTechnology(nation, state);
    settleCultureReligion(nation, state);
    nation.resources.influence = Math.min(nation.resources.influence + 3, 100);

    for (const eventId of rollEvents(nation, state, rng, 1, eventAvailability)) {
      const event = EVENT_BY_ID[eventId];
      if (!event) continue;
      const optionIndex = aiChooseOption(event, rng);
      const option = event.options[optionIndex];
      if (option) applyEffect(nation, option.effects, state);
      recordEvent(state, nation.id, eventId, optionIndex);
    }
    resolvePendingEventsForAI(nation, state, rng);

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
