import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../../engine/init';
import { inspectSaveSlot } from '../saveRecovery';
import { SAVE_VERSION, type SaveGame } from '../../types/game';

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
    (save.gameState as typeof save.gameState & { _relMap?: Record<string, unknown> })._relMap = {};
    const rawBefore = JSON.stringify(save);
    localStorage.setItem(key(1), rawBefore);

    const preview = inspectSaveSlot(1);

    expect(localStorage.getItem(key(1))).toBe(rawBefore);
    expect(preview.status).toBe('repairable');
    expect(preview.repairs).toEqual(expect.arrayContaining(['升级存档架构 v3 → v4', '清理临时外交缓存', '移除无效或重复战争']));
    expect(preview.score).toBeGreaterThanOrEqual(75);
  });

  it('marks structurally healthy saves as healthy', () => {
    localStorage.setItem(key(3), JSON.stringify(healthySave()));

    const preview = inspectSaveSlot(3);

    expect(preview.status).toBe('healthy');
    expect(preview.repairs).toHaveLength(0);
    expect(preview.label).toBe('健康');
  });
});
