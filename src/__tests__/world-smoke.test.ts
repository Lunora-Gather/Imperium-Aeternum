// W4 硬证据烟雾测试：192 国世界真正初始化 + 推进回合
// 这不是规划，是真正跑出来的数据

import { describe, it, expect } from 'vitest';
import { createWorldState } from '../engine/init';
import { processTurn } from '../engine/turn';
import { applyEffect } from '../engine/events';
import { EVENTS, EVENT_BY_ID } from '../data/events';
import type { GameState } from '../types/game';

describe('W4 世界级烟雾测试（192 国 / 600 省）', () => {
  it('创建世界：192 国 / 600 省 / 稀疏外交', () => {
    const state = createWorldState(12345);
    const nationCount = Object.keys(state.nations).length;
    const provinceCount = Object.keys(state.provinces).length;
    const relationCount = state.relations.length;

    // 硬断言：~195 国（当今世界级）
    expect(nationCount).toBeGreaterThanOrEqual(180);
    expect(nationCount).toBeLessThanOrEqual(220);
    // 硬断言：~600 省
    expect(provinceCount).toBeGreaterThanOrEqual(500);
    expect(provinceCount).toBeLessThanOrEqual(700);
    // 稀疏外交：远小于全连接
    expect(relationCount).toBeLessThan(2000);

    // 体量分级统计
    const tierCounts: Record<string, number> = {};
    for (const n of Object.values(state.nations)) {
      tierCounts[n.tier] = (tierCounts[n.tier] ?? 0) + 1;
    }
    // S 级超级大国存在
    expect(tierCounts['S']).toBeGreaterThanOrEqual(2);
    // D 级城邦最多
    expect(tierCounts['D']).toBeGreaterThanOrEqual(tierCounts['C'] ?? 0);

    // 玩家国家存在且是 S/A 级
    const player = Object.values(state.nations).find((n) => n.isPlayer);
    expect(player).toBeDefined();
    expect(['S', 'A']).toContain(player!.tier);
  });

  it('推进 10 回合无 NaN/Infinity/崩溃（192 国世界）', () => {
    let state = createWorldState(12345);
    for (let i = 0; i < 10; i++) {
      const { state: next } = processTurn(state);
      state = next;
      // 全国家全字段扫描
      for (const n of Object.values(state.nations)) {
        expect(Number.isFinite(n.resources.gold)).toBe(true);
        expect(Number.isFinite(n.resources.food)).toBe(true);
        expect(Number.isFinite(n.government.stability)).toBe(true);
        expect(Number.isFinite(n.government.legitimacy)).toBe(true);
        expect(Number.isFinite(n.government.corruption)).toBe(true);
        expect(Number.isFinite(n.warExhaustion)).toBe(true);
      }
      for (const p of Object.values(state.provinces)) {
        expect(Number.isFinite(p.population)).toBe(true);
        expect(Number.isFinite(p.unrest)).toBe(true);
        expect(Number.isFinite(p.rebellionRisk)).toBe(true);
      }
    }
    expect(state.turn).toBe(10);
  });

  it('推进 50 回合性能 < 40s + 无 NaN', () => {
    const start = performance.now();
    let state = createWorldState(12345);
    for (let i = 0; i < 50; i++) {
      state = processTurn(state).state;
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(40000);
    expect(state.turn).toBe(50);

    // 最终状态全字段扫描
    let nanCount = 0;
    for (const n of Object.values(state.nations)) {
      if (!Number.isFinite(n.resources.gold)) nanCount++;
      if (!Number.isFinite(n.government.stability)) nanCount++;
    }
    expect(nanCount).toBe(0);
  });

  it('世界统计快照（可验证的真实数据）', () => {
    const state = createWorldState(12345);
    const nations = Object.values(state.nations);
    const provinces = Object.values(state.provinces);

    // 按洲统计国家数（用国家 id 前缀粗分）
    const tierCounts: Record<string, number> = {};
    for (const n of nations) tierCounts[n.tier] = (tierCounts[n.tier] ?? 0) + 1;

    // 按政体统计
    const govCounts: Record<string, number> = {};
    for (const n of nations) govCounts[n.government.type] = (govCounts[n.government.type] ?? 0) + 1;

    // 按文化统计省份数
    const cultureCounts: Record<string, number> = {};
    for (const p of provinces) cultureCounts[p.culture] = (cultureCounts[p.culture] ?? 0) + 1;

    // 硬断言：政体多样性（至少 5 种不同政体）
    expect(Object.keys(govCounts).length).toBeGreaterThanOrEqual(5);
    // 硬断言：文化多样性（至少 8 种不同文化）
    expect(Object.keys(cultureCounts).length).toBeGreaterThanOrEqual(8);
    // 硬断言：总军事力量 > 0
    const totalArmy = nations.reduce((s, n) => s + n.army.reduce((a, b) => a + b.size, 0), 0);
    expect(totalArmy).toBeGreaterThan(0);
    // 硬断言：总国库 > 0
    const totalGold = nations.reduce((s, n) => s + n.resources.gold, 0);
    expect(totalGold).toBeGreaterThan(0);
    // 硬断言：总人口 > 0
    const totalPop = provinces.reduce((s, p) => s + p.population, 0);
    expect(totalPop).toBeGreaterThan(0);
  });

  // A2: 非 n01 剧本烟雾测试——选非默认玩家国能正常推进
  // 验证 P0 修复（PLAYER_ID 硬编码）确实解锁了多剧本选国
  it('A2 选非默认玩家国推进 50 回合无 NaN + 玩家国家正确', () => {
    // 用 seed 7777 生成世界，挑第一个非默认 S/A 级国作为玩家
    const probe = createWorldState(7777);
    const candidates = Object.values(probe.nations).filter((n) => n.tier === 'S' || n.tier === 'A');
    expect(candidates.length).toBeGreaterThan(1);  // 至少有可选
    const chosen = candidates.find((n) => n.id !== probe.playerNationId) ?? candidates[0];
    const chosenId = chosen.id;

    // 重新生成，指定 chosenId 为玩家
    let state = createWorldState(7777, chosenId);
    expect(state.playerNationId).toBe(chosenId);
    expect(state.nations[chosenId].isPlayer).toBe(true);

    for (let i = 0; i < 50; i++) {
      state = processTurn(state).state;
    }
    expect(state.turn).toBe(50);

    // 全字段扫描无 NaN
    let nanCount = 0;
    for (const n of Object.values(state.nations)) {
      if (!Number.isFinite(n.resources.gold)) nanCount++;
      if (!Number.isFinite(n.resources.food)) nanCount++;
      if (!Number.isFinite(n.government.stability)) nanCount++;
    }
    expect(nanCount).toBe(0);

    // 玩家国家仍存活且数据正常
    const player = state.nations[chosenId];
    expect(player).toBeDefined();
    expect(Number.isFinite(player.resources.gold)).toBe(true);
    expect(player.resources.gold).toBeGreaterThan(-1e9);  // 未失控
  });

  // A5: D 级国家负粮兜底测试——Static 档应被动建农场
  it('A5 D 级国家粮储不足时被动建农场（Static 档兜底）', () => {
    const state = createWorldState(12345);
    // 找一个 D 级国
    const dNation = Object.values(state.nations).find((n) => n.tier === 'D');
    expect(dNation).toBeDefined();
    if (!dNation) return;

    // 人为把粮储压到极低
    const dId = dNation.id;
    state.nations[dId].resources.food = 0;
    const provs = Object.values(state.provinces).filter((p) => p.ownerId === dId);
    const farmsBefore = provs.reduce((s, p) => s + p.buildings.filter((b) => b.defId === 'farm').length, 0);

    // 推 3 回合（D 级每 5 回合走 Static，但 food 兜底每回合都跑）
    let s = state;
    for (let i = 0; i < 3; i++) s = processTurn(s).state;

    const provsAfter = Object.values(s.provinces).filter((p) => p.ownerId === dId);
    const farmsAfter = provsAfter.reduce((acc, p) => acc + p.buildings.filter((b) => b.defId === 'farm').length, 0);
    // 至少建了 1 个农场（或原本就有 ≥3 满了不建）
    if (farmsBefore < 3) {
      expect(farmsAfter).toBeGreaterThan(farmsBefore);
    }
  });

  // C1: 事件链测试——选项的 triggerEffect 应把下一事件入队 pendingEvents
  it('C1 事件链：选项 triggerEvent 把下一事件推入 pendingEvents', () => {
    const state = createWorldState(12345);
    const pid = state.playerNationId;
    const player = state.nations[pid];
    const beforeCount = state.pendingEvents.length;
    // 模拟选了 evt_chain_plague_1 的第一个选项（effects 含 triggerEvent: 'evt_chain_plague_2'）
    applyEffect(player, { triggerEvent: 'evt_chain_plague_2' }, state);
    expect(state.pendingEvents.length).toBe(beforeCount + 1);
    expect(state.pendingEvents[state.pendingEvents.length - 1].eventId).toBe('evt_chain_plague_2');
    expect(state.pendingEvents[state.pendingEvents.length - 1].nationId).toBe(pid);
    // 重复触发同一链事件不应重复入队
    applyEffect(player, { triggerEvent: 'evt_chain_plague_2' }, state);
    expect(state.pendingEvents.length).toBe(beforeCount + 1);  // 仍只 1 个
  });

  // C1: 事件链数据完整性——15 条链，triggerEvent 引用合法（D1 扩展至 15 链 + 继承内战支线）
  it('C1 事件链数据：15 条链，triggerEvent 引用合法', () => {
    const chainIds = EVENTS.filter((e) => e.id.startsWith('evt_chain_')).map((e) => e.id);
    expect(chainIds.length).toBe(44);  // 15 链（含继承内战 2 支线，D1 +5 链）
    // 每个 triggerEvent 引用必须在 EVENT_BY_ID 存在
    for (const e of EVENTS) {
      for (const opt of e.options) {
        if (opt.effects.triggerEvent) {
          expect(EVENT_BY_ID[opt.effects.triggerEvent]).toBeDefined();
        }
      }
    }
    // 链首事件 weight>0（可自然触发），链中/尾 weight=0（只靠 triggerEvent）
    const chainHeads = [
      'evt_chain_plague_1', 'evt_chain_heir_1', 'evt_chain_border_1',
      'evt_chain_drought_1', 'evt_chain_decline_1', 'evt_chain_tech_1',
      'evt_chain_culture_1', 'evt_chain_alliance_1', 'evt_chain_migrate_1',
      // D1 新增 5 链头
      'evt_chain_barbarian_1', 'evt_chain_succession_1', 'evt_chain_commerce_1',
      'evt_chain_reform_1', 'evt_chain_pandemic_1',
    ];
    for (const id of chainHeads) {
      expect(EVENT_BY_ID[id].weight).toBeGreaterThan(0);
    }
    for (const id of chainIds) {
      if (!chainHeads.includes(id)) {
        expect(EVENT_BY_ID[id].weight).toBe(0);  // 链中/尾/支线不自然触发
      }
    }
  });
});
