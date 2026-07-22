import { beforeEach, describe, expect, it } from 'vitest';
import saveV3Json from './fixtures/save-v3.json';
import saveV4Json from './fixtures/save-v4.json';
import type { SaveGame } from '../../types/game';
import { SAVE_VERSION } from '../../types/game';
import { advanceTurnPipeline, prepareGameState } from '../../gameplay/turnPipeline';
import { invariantErrors } from '../../gameplay/stateInvariants';
import { loadGameFromSlot, migrate } from '../persistence';
import { allocateEntityId } from '../../utils/id';

class FixtureStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

function fixture<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new FixtureStorage(), configurable: true });
});

describe('fixed legacy save fixtures', () => {
  it('migrates the independent v3 fixture, removes retired counters, and advances a complete turn', () => {
    const source = fixture(saveV3Json) as unknown as SaveGame;
    const sourceSnapshot = JSON.stringify(source);

    const migrated = migrate(source);
    const prepared = prepareGameState(migrated.gameState);
    const advanced = advanceTurnPipeline(prepared).state;

    expect(JSON.stringify(source)).toBe(sourceSnapshot);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.gameState.version).toBe(SAVE_VERSION);
    expect('stableTurnsCount' in migrated.gameState).toBe(false);
    expect('highEconomyStableTurns' in migrated.gameState).toBe(false);
    expect(invariantErrors(prepared)).toEqual([]);
    expect(invariantErrors(advanced)).toEqual([]);
    expect(advanced.turn).toBe(13);
    expect(advanced.lastReport?.nationId).toBe('legacy_nation');
  });

  it('recovers the v4 fixture through the real slot loader and resumes after the highest persisted entity id', () => {
    localStorage.setItem('imperium-aeternum-save-2', JSON.stringify(saveV4Json));

    const loaded = loadGameFromSlot(2);
    const rewritten = JSON.parse(localStorage.getItem('imperium-aeternum-save-2') ?? '{}') as SaveGame;

    expect(loaded).toBeTruthy();
    expect(rewritten.version).toBe(SAVE_VERSION);
    expect(rewritten.gameState.version).toBe(SAVE_VERSION);
    expect(loaded?.entityIdCounter).toBe(35);
    expect(loaded && allocateEntityId(loaded, 'war')).toBe('entity_10_war');
    if (!loaded) return;
    const prepared = prepareGameState(loaded);
    expect(invariantErrors(prepared)).toEqual([]);
    expect(advanceTurnPipeline(prepared).state.turn).toBe(25);
  });
});
