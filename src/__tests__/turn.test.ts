// 阶段 5a 烟雾测试：推进 10 回合 + 存读档
// 不依赖浏览器，纯逻辑验证

import { describe, it, expect } from 'vitest';
import { createInitialState } from '../engine/init';
import { processTurn } from '../engine/turn';
import { saveGame, loadGame } from '../store/persistence';
import { PLAYER_ID } from '../data/nations';
import { moveArmy, declareWar } from '../engine/military';
import type { GameState, Province, Army } from '../types/game';

// localStorage polyfill（node 环境无）
const store: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  key: (i: number) => Object.keys(store)[i] ?? null,
  length: 0,
} as unknown as Storage;

describe('阶段 5a 烟雾测试', () => {
  it('能初始化并推进 10 回合无 NaN/崩溃', () => {
    let state = createInitialState();
    expect(state.turn).toBe(0);
    for (let i = 0; i < 10; i++) {
      const { state: next } = processTurn(state);
      state = next;
      // 关键字段非 NaN
      const player = state.nations[PLAYER_ID];
      expect(Number.isNaN(player.resources.gold)).toBe(false);
      expect(Number.isNaN(player.government.stability)).toBe(false);
      expect(Number.isNaN(player.government.legitimacy)).toBe(false);
      // 推进回合数
      expect(state.turn).toBe(i + 1);
    }
    expect(state.turn).toBe(10);
  });

  it('5b 烟雾：推进 50 回合无 NaN/Infinity/崩溃', () => {
    let state = createInitialState();
    for (let i = 0; i < 50; i++) {
      const { state: next } = processTurn(state);
      state = next;
      // 全字段扫描 NaN/Infinity
      for (const n of Object.values(state.nations)) {
        expect(Number.isFinite(n.resources.gold)).toBe(true);
        expect(Number.isFinite(n.resources.food)).toBe(true);
        expect(Number.isFinite(n.government.stability)).toBe(true);
        expect(Number.isFinite(n.government.legitimacy)).toBe(true);
        expect(Number.isFinite(n.government.corruption)).toBe(true);
        expect(Number.isFinite(n.warExhaustion)).toBe(true);
        for (const f of n.factions) expect(Number.isFinite(f.satisfaction)).toBe(true);
      }
      for (const p of Object.values(state.provinces)) {
        expect(Number.isFinite(p.population)).toBe(true);
        expect(Number.isFinite(p.assimilation)).toBe(true);
        expect(Number.isFinite(p.loyalty)).toBe(true);
        expect(Number.isFinite(p.unrest)).toBe(true);
        expect(Number.isFinite(p.rebellionRisk)).toBe(true);
      }
    }
    expect(state.turn).toBe(50);
  });

  it('W1.5 性能：50 回合耗时 < 40s（DEC-015）', () => {
    const start = performance.now();
    let state = createInitialState();
    for (let i = 0; i < 50; i++) {
      state = processTurn(state).state;
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(40000);
    expect(state.turn).toBe(50);
  });

  it('存档与读档能完整恢复 GameState', () => {
    let state = createInitialState();
    // 推进 5 回合产生差异
    for (let i = 0; i < 5; i++) {
      state = processTurn(state).state;
    }
    saveGame(state);
    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    const l = loaded as GameState;
    expect(l.turn).toBe(state.turn);
    expect(l.seed).toBe(state.seed);
    expect(l.nations[PLAYER_ID].resources.gold).toBe(state.nations[PLAYER_ID].resources.gold);
    expect(l.nations[PLAYER_ID].government.stability).toBe(state.nations[PLAYER_ID].government.stability);
  });

  it('seed 推进确定性：相同初态推进相同回合得相同结果', () => {
    const s1 = createInitialState();
    const s2 = createInitialState();
    let a = s1, b = s2;
    for (let i = 0; i < 3; i++) {
      a = processTurn(a).state;
      b = processTurn(b).state;
    }
    expect(a.nations[PLAYER_ID].resources.gold).toBe(b.nations[PLAYER_ID].resources.gold);
    expect(a.nations[PLAYER_ID].government.stability).toBe(b.nations[PLAYER_ID].government.stability);
  });

  it('省份与国家数据自洽', () => {
    const state = createInitialState();
    // 玩家有 6 个开局省份（扩展 A 后罗马核心区）
    const playerProvs = Object.values(state.provinces).filter((p) => p.ownerId === PLAYER_ID);
    expect(playerProvs.length).toBe(6);
    // 玩家首都存在且属于玩家
    const player = state.nations[PLAYER_ID];
    expect(player.capital).toBe('p01');
    expect(state.provinces['p01'].ownerId).toBe(PLAYER_ID);
    expect(state.provinces['p01'].isCapital).toBe(true);
    // 派系 5 个
    expect(player.factions.length).toBe(5);
    // 关系数：5 国×4 对外 = 20
    expect(state.relations.length).toBe(20);
  });

  // E21: 战略军队调动 + 主动求和
  it('E21 moveArmy：相邻己省调动成功、合并同省军队、耗金', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    const playerProvs = Object.values(state.provinces).filter((p) => p.ownerId === PLAYER_ID);
    // 首都已有军队（初态 capital p01 应有 army）
    const capitalArmy = player.army.find((a) => a.location === player.capital) ?? player.army[0];
    expect(capitalArmy).toBeTruthy();
    const startSize = capitalArmy.size;
    const startGold = player.resources.gold;
    // 找一个首都相邻的己省
    const capitalProv = state.provinces[player.capital];
    const adjSelf = playerProvs.find((p) => capitalProv.adjacent.includes(p.id) && p.id !== player.capital);
    expect(adjSelf).toBeTruthy();
    const target = adjSelf as Province;
    // 调动前目标省无军队
    const destBefore = player.army.find((a) => a.location === target.id);
    expect(destBefore).toBeUndefined();
    const r = moveArmy(player, capitalArmy.id, target.id, capitalProv, target);
    expect(r.ok).toBe(true);
    // 原军队消失、目标省出现军队且兵力相等
    expect(player.army.find((a) => a.id === capitalArmy.id)).toBeUndefined();
    const dest = player.army.find((a) => a.location === target.id);
    expect(dest).toBeTruthy();
    expect((dest as Army).size).toBe(startSize);
    // 耗金 > 0
    expect(player.resources.gold).toBeLessThan(startGold);
  });

  it('E21 moveArmy：不相邻且非首都枢纽拒绝调动', () => {
    const state = createInitialState();
    const player = state.nations[PLAYER_ID];
    const playerProvs = Object.values(state.provinces).filter((p) => p.ownerId === PLAYER_ID);
    const capitalProv = state.provinces[player.capital];
    // 找一个非首都相邻的己省（远离首都）
    const farSelf = playerProvs.find((p) => p.id !== player.capital && !capitalProv.adjacent.includes(p.id));
    if (!farSelf) return; // 若无可测试的远离省，跳过
    const armyAtCapital = player.army.find((a) => a.location === player.capital);
    if (!armyAtCapital) return;
    // 再找一个非 farSelf 相邻的己省（必不相邻且非首都枢纽）
    const anotherFar = playerProvs.find((p) => p.id !== farSelf.id && p.id !== player.capital && !farSelf.adjacent.includes(p.id));
    if (!anotherFar) return;
    const r = moveArmy(player, armyAtCapital.id, anotherFar.id, capitalProv, anotherFar);
    // capital→anotherFar 若 anotherFar 不在 capital 相邻则拒绝
    if (!capitalProv.adjacent.includes(anotherFar.id)) {
      expect(r.ok).toBe(false);
    }
  });
});
