import { describe, expect, it } from 'vitest';
import { GOVERNMENTS, governmentDisplayName } from '../../data/governments';
import { NATIONAL_CHARACTERS, nationalCharacterDisplayName } from '../../data/national-characters';
import { FACTIONS, factionDisplayName } from '../../data/factions';

describe('nation presentation labels', () => {
  it('turns every government id into its player-facing name', () => {
    for (const government of Object.values(GOVERNMENTS)) {
      expect(governmentDisplayName(government.id)).toBe(government.name);
      expect(governmentDisplayName(government.id)).not.toBe(government.id);
    }
  });

  it('turns every national character id into its player-facing name', () => {
    for (const character of Object.values(NATIONAL_CHARACTERS)) {
      expect(nationalCharacterDisplayName(character.id)).toBe(character.name);
      expect(nationalCharacterDisplayName(character.id)).not.toBe(character.id);
    }
  });

  it('does not expose unknown legacy ids to players', () => {
    expect(governmentDisplayName('legacy_government')).toBe('未知政体');
    expect(nationalCharacterDisplayName('legacy_character')).toBe('未知国性');
    expect(factionDisplayName('legacy_faction')).toBe('未知派系');
  });

  it('turns every faction id into its player-facing name', () => {
    for (const faction of Object.values(FACTIONS)) {
      expect(factionDisplayName(faction.id)).toBe(faction.name);
      expect(factionDisplayName(faction.id)).not.toBe(faction.id);
    }
  });
});
