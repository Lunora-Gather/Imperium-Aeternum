import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../../engine/init';
import { inspectSaveSlot } from '../saveRecovery';
import { SAVE_VERSION, type SaveGame } from '../../types/game';
import { loadGameFromSlot } from '../../store/persistence';

const STORAGE: Record<string, string> = {};

function installLocalStorageMock() {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => STORAGE[key] ?? null,
    setItem: (key: string, value: string) => { STORAGE[key] = String(value); },
    removeItem: (key: string) => { delete STORAGE[key]; },
    clear: () => { for (const key of Object.keys(STORAGE)) delete STORAGE[key]; },
  });
}

function key(slot: number) {
  return `imperium-aeternum-save-${slot}`;
}

function healthySave(version = SAVE_VERSION): SaveGame {
  const state = createInitialState();
  (state as typeof state & { ambitionMeta?: { playerNationId: string; worldProvinces: number } }).ambitionMeta = {
    playerNationId: state.playerNationId,
    worldProvinces: Object.keys(state.provinces).length,
  };
  return { version, createdAt: '2026-01-01T00:00:00.000Z', gameState: state };
}

describe('save recovery previews', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it('reports empty and broken slots without throwing', () => {
    expect(inspectSaveSlot(1).status).toBe('empty');

    localStorage.setItem(key(2), '{bad-json');
    const broken = inspectSaveSlot(2);

    expect(broken.status).toBe('broken');
    expect(broken.tone).toBe('danger');
  });

  it('previews migration and repair without mutating localStorage', () => {
    const save = healthySave(3);
    save.gameState.wars.push({ id: 'bad-war', attackerId: save.gameState.playerNationId, defenderId: 'missing', targetProvinceId: 'missing-province', progress: 200, turns: -3, battleReports: [] });
    save.gameState._relMap = new Map();
    const rawBefore = JSON.stringify(save);
    localStorage.setItem(key(1), rawBefore);

    const preview = inspectSaveSlot(1);

    expect(localStorage.getItem(key(1))).toBe(rawBefore);
    expect(['repairable', 'risky']).toContain(preview.status);
    expect(preview.repairs).toContain(`升级存档架构 v3 → v${SAVE_VERSION}`);
    expect(preview.repairs).toEqual(expect.arrayContaining(['清理临时外交缓存', '移除无效或重复战争']));
    expect(preview.score).toBeGreaterThanOrEqual(0);

    expect(loadGameFromSlot(1)?.wars).toEqual([]);
    const rewritten = JSON.parse(localStorage.getItem(key(1))!) as SaveGame;
    expect(rewritten.gameState.wars).toEqual([]);
    expect(inspectSaveSlot(1).repairs).not.toContain('移除无效或重复战争');
  });

  it('refreshes cached health when another tab changes or removes the exact stored value', () => {
    const save = healthySave();
    localStorage.setItem(key(1), JSON.stringify(save));
    const first = inspectSaveSlot(1);
    first.details.length = 0;
    expect(inspectSaveSlot(1).details.length).toBeGreaterThan(0);
    save.gameState.turn = 27;
    localStorage.setItem(key(1), JSON.stringify(save));
    expect(inspectSaveSlot(1).turn).toBe(27);
    localStorage.setItem(key(1), '{broken');
    expect(inspectSaveSlot(1).status).toBe('broken');
    localStorage.removeItem(key(1));
    expect(inspectSaveSlot(1).status).toBe('empty');
  });

  it('marks structurally healthy saves as non-dangerous', () => {
    localStorage.setItem(key(3), JSON.stringify(healthySave()));

    const preview = inspectSaveSlot(3);

    expect(['healthy', 'repairable']).toContain(preview.status);
    expect(preview.tone).not.toBe('danger');
    expect(preview.label).not.toBe('无法恢复');
  });
});
