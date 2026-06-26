// Imperium Aeternum — 数据自检脚本
// 检查静态数据表、剧本生成结果和基础运行时结构。

import type { GameState } from '../types/game';
import { NATIONS, NATION_BY_ID, PLAYER_ID } from './nations';
import { PROVINCES, PROVINCE_BY_ID } from './provinces';
import { BUILDINGS, BUILDING_LIST } from './buildings';
import { TECHNOLOGIES, TECH_BY_ID } from './technologies';
import { POLICIES, POLICY_BY_ID } from './policies';
import { GOVERNMENTS } from './governments';
import { FACTIONS } from './factions';
import { EVENTS } from './events';
import { NATIONAL_CHARACTERS, BEHAVIOR_MAPPINGS } from './national-characters';
import { createInitialState, createWorldState } from '../engine/init';

interface ValidateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

interface ScenarioCheck {
  id: string;
  seed: number;
  playerNationId?: string;
  regionFilter?: string[];
  expectedMinNations: number;
  expectedMinProvinces: number;
  build: () => GameState;
}

const SCENARIO_CHECKS: ScenarioCheck[] = [
  { id: 'classic', seed: 12345, expectedMinNations: 5, expectedMinProvinces: 30, build: () => createInitialState() },
  { id: 'world', seed: 20260626, playerNationId: 'n_med_rome', expectedMinNations: 120, expectedMinProvinces: 300, build: () => createWorldState(20260626, 'n_med_rome') },
  { id: 'eastasia', seed: 20260626, playerNationId: 'n_ea_qin', regionFilter: ['asia_east', 'asia_central', 'asia_south'], expectedMinNations: 10, expectedMinProvinces: 30, build: () => createWorldState(20260626, 'n_ea_qin', ['asia_east', 'asia_central', 'asia_south']) },
  { id: 'w5_mediterranean', seed: 20260626, playerNationId: 'n_med_rome', regionFilter: ['mediterranean', 'europe_w', 'middle_east', 'africa_n'], expectedMinNations: 10, expectedMinProvinces: 30, build: () => createWorldState(20260626, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n']) },
  { id: 'w6_americas', seed: 20260626, playerNationId: 'n_am_inca', regionFilter: ['americas'], expectedMinNations: 5, expectedMinProvinces: 10, build: () => createWorldState(20260626, 'n_am_inca', ['americas']) },
  { id: 'w4_europe', seed: 20260626, playerNationId: 'n_we_frank', regionFilter: ['europe_w', 'europe_e', 'europe_n', 'mediterranean'], expectedMinNations: 10, expectedMinProvinces: 30, build: () => createWorldState(20260626, 'n_we_frank', ['europe_w', 'europe_e', 'europe_n', 'mediterranean']) },
  { id: 'w8_indianocean', seed: 20260626, playerNationId: 'n_sa_maurya', regionFilter: ['asia_south', 'africa_e', 'middle_east'], expectedMinNations: 8, expectedMinProvinces: 24, build: () => createWorldState(20260626, 'n_sa_maurya', ['asia_south', 'africa_e', 'middle_east']) },
  { id: 'w7_random_seed_1', seed: 20260627, regionFilter: ['asia_east'], expectedMinNations: 5, expectedMinProvinces: 10, build: () => createWorldState(20260627, undefined, ['asia_east']) },
  { id: 'challenge_survival', seed: 12345, expectedMinNations: 5, expectedMinProvinces: 30, build: () => createInitialState() },
];

function fail(acc: ValidateResult, msg: string): void {
  acc.errors.push(msg);
  acc.ok = false;
}

function warn(acc: ValidateResult, msg: string): void {
  acc.warnings.push(msg);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateGameStateShape(acc: ValidateResult, scenario: ScenarioCheck, state: GameState): void {
  const nations = Object.values(state.nations);
  const provinces = Object.values(state.provinces);
  if (nations.length < scenario.expectedMinNations) fail(acc, `剧本 ${scenario.id} 国家数过少：${nations.length} < ${scenario.expectedMinNations}`);
  if (provinces.length < scenario.expectedMinProvinces) fail(acc, `剧本 ${scenario.id} 省份数过少：${provinces.length} < ${scenario.expectedMinProvinces}`);
  if (!state.playerNationId || !state.nations[state.playerNationId]) fail(acc, `剧本 ${scenario.id} 玩家国家不存在：${state.playerNationId}`);
  const markedPlayers = nations.filter((n) => n.isPlayer);
  if (markedPlayers.length !== 1) fail(acc, `剧本 ${scenario.id} isPlayer 标记应恰好 1，实际 ${markedPlayers.length}`);
  if (markedPlayers[0] && markedPlayers[0].id !== state.playerNationId) fail(acc, `剧本 ${scenario.id} playerNationId 与 isPlayer 不一致`);

  for (const n of nations) {
    if (!n.id) fail(acc, `剧本 ${scenario.id} 存在空 id 国家`);
    if (n.capital && !state.provinces[n.capital]) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 首都 ${n.capital} 不存在`);
    if (!GOVERNMENTS[n.government.type]) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 政体 ${n.government.type} 不存在`);
    if (!NATIONAL_CHARACTERS[n.character]) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 性格 ${n.character} 不存在`);
    for (const [k, v] of Object.entries(n.resources)) if (!isFiniteNumber(v)) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 资源 ${k} 非有限数`);
    for (const k of ['stability', 'legitimacy', 'efficiency', 'corruption'] as const) {
      const v = n.government[k];
      if (!isFiniteNumber(v) || v < 0 || v > 100) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 政府 ${k} 越界：${v}`);
    }
    if (!Array.isArray(n.army)) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} army 不是数组`);
    for (const a of n.army) {
      if (!state.provinces[a.location]) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 军队 ${a.id} 位置 ${a.location} 不存在`);
      if (!isFiniteNumber(a.size) || a.size < 0) fail(acc, `剧本 ${scenario.id} 国家 ${n.id} 军队 ${a.id} 兵力非法`);
    }
  }

  for (const p of provinces) {
    if (!state.nations[p.ownerId] && p.ownerId !== 'barbarian') fail(acc, `剧本 ${scenario.id} 省份 ${p.id} owner ${p.ownerId} 不存在`);
    if (!isFiniteNumber(p.population) || p.population < 0) fail(acc, `剧本 ${scenario.id} 省份 ${p.id} population 非法`);
    for (const k of ['assimilation', 'loyalty', 'unrest', 'rebellionRisk'] as const) {
      const v = p[k];
      if (!isFiniteNumber(v) || v < 0 || v > 100) fail(acc, `剧本 ${scenario.id} 省份 ${p.id} ${k} 越界：${v}`);
    }
    if (!Array.isArray(p.adjacent)) fail(acc, `剧本 ${scenario.id} 省份 ${p.id} adjacent 不是数组`);
    for (const adj of p.adjacent) if (!state.provinces[adj]) fail(acc, `剧本 ${scenario.id} 省份 ${p.id} 相邻 ${adj} 不存在`);
  }

  const relKeys = new Set<string>();
  for (const r of state.relations) {
    if (!state.nations[r.from] || !state.nations[r.to] || r.from === r.to) fail(acc, `剧本 ${scenario.id} 外交关系非法：${r.from}->${r.to}`);
    if (relKeys.has(`${r.from}|${r.to}`)) fail(acc, `剧本 ${scenario.id} 外交关系重复：${r.from}->${r.to}`);
    relKeys.add(`${r.from}|${r.to}`);
    if (!isFiniteNumber(r.relation) || r.relation < -100 || r.relation > 100) fail(acc, `剧本 ${scenario.id} 外交关系数值越界：${r.from}->${r.to}`);
  }
  for (const r of state.relations) {
    if (!relKeys.has(`${r.to}|${r.from}`)) warn(acc, `剧本 ${scenario.id} 外交关系缺少反向项：${r.from}->${r.to}`);
  }
}

export function validateData(): ValidateResult {
  const acc: ValidateResult = { ok: true, errors: [], warnings: [] };

  // 1. 经典静态数据：国家数量 = 5，玩家恰好 1
  if (NATIONS.length !== 5) fail(acc, `经典国家数应为 5，实际 ${NATIONS.length}`);
  const players = NATIONS.filter((n) => n.isPlayer);
  if (players.length !== 1) fail(acc, `经典玩家国家应 1，实际 ${players.length}`);
  if (players[0]?.id !== PLAYER_ID) fail(acc, `经典玩家 id 应为 ${PLAYER_ID}`);

  // 2. 国家 capital 引用省份存在；n05 允许空首都
  for (const n of NATIONS) {
    if (n.capital !== '' && !PROVINCE_BY_ID[n.capital]) fail(acc, `国家 ${n.id} 首都 ${n.capital} 不存在`);
    if (!GOVERNMENTS[n.government]) fail(acc, `国家 ${n.id} 政体 ${n.government} 不存在`);
    if (!NATIONAL_CHARACTERS[n.character]) fail(acc, `国家 ${n.id} 性格 ${n.character} 不存在`);
    for (const r of n.initRelations) {
      if (!NATION_BY_ID[r.target]) fail(acc, `国家 ${n.id} 外交目标 ${r.target} 不存在`);
      if (r.target === n.id) fail(acc, `国家 ${n.id} 自环外交`);
    }
  }

  // 3. 省份数量 ≥ 30，ownerId 引用国家存在或 barbarian
  if (PROVINCES.length < 30) fail(acc, `省份数应 ≥30，实际 ${PROVINCES.length}`);
  const NATION_IDS_PLUS_BARBARIAN = new Set<string>([...NATIONS.map((n) => n.id), 'barbarian']);
  for (const p of PROVINCES) {
    if (!NATION_IDS_PLUS_BARBARIAN.has(p.ownerId)) fail(acc, `省份 ${p.id} owner ${p.ownerId} 不存在`);
    for (const adj of p.adjacent) {
      if (!PROVINCE_BY_ID[adj]) fail(acc, `省份 ${p.id} 相邻 ${adj} 不存在`);
      const other = PROVINCE_BY_ID[adj];
      if (other && p.type !== 'ocean' && other.type !== 'ocean' && !other.adjacent.includes(p.id)) warn(acc, `省份 ${p.id}↔${adj} 相邻不对称`);
    }
    const r = p.initClassRatio;
    const sum = r.peasants + r.workers + r.merchants + r.soldiers + r.scholars + r.nobles + r.clergy;
    if (p.type === 'ocean') {
      if (sum !== 0) warn(acc, `海洋省份 ${p.id} 阶层比例和 ${sum} 应为 0`);
      if (p.initPop !== 0) fail(acc, `海洋省份 ${p.id} initPop 应为 0`);
    } else if (Math.abs(sum - 1) > 0.01) fail(acc, `省份 ${p.id} 阶层比例和 ${sum} ≠ 1`);
    if (p.isTradeNode && (!p.tradeNodeTier || p.tradeNodeTier < 1 || p.tradeNodeTier > 3)) fail(acc, `省份 ${p.id} 贸易节点 tier 非法`);
    if ((p.fortressLevel ?? 0) < 0 || (p.fortressLevel ?? 0) > 3) fail(acc, `省份 ${p.id} 要塞等级 ${(p.fortressLevel ?? 0)} 越界`);
  }

  // 4. 建筑 id 唯一，前置科技存在
  const bIds = new Set<string>();
  for (const b of BUILDING_LIST) {
    if (bIds.has(b.id)) fail(acc, `建筑 id 重复 ${b.id}`);
    bIds.add(b.id);
    if (b.prereqTech && !TECH_BY_ID[b.prereqTech]) fail(acc, `建筑 ${b.id} 前置科技 ${b.prereqTech} 不存在`);
  }

  // 5. 科技：每条路线 5 或 8 级，prereq 链合法，level 1-N 连续
  for (const branch of ['agri', 'mil', 'admin', 'culture'] as const) {
    const list = TECHNOLOGIES.filter((t) => t.branch === branch).sort((a, b) => a.level - b.level);
    if (list.length !== 5 && list.length !== 8) fail(acc, `科技 ${branch} 应 5 或 8 级，实际 ${list.length}`);
    for (let i = 0; i < list.length; i += 1) {
      const t = list[i];
      if (t.level !== i + 1) fail(acc, `科技 ${t.id} level 应 ${i + 1}`);
      if (i > 0 && t.prereqTech !== list[i - 1].id) fail(acc, `科技 ${t.id} prereq 应 ${list[i - 1].id}`);
    }
  }

  // 6. 政策：allowedGovernments 引用存在，prereqTech 存在
  for (const p of POLICIES) {
    if (!POLICY_BY_ID[p.id]) fail(acc, `政策索引缺失 ${p.id}`);
    for (const g of p.allowedGovernments) if (!GOVERNMENTS[g]) fail(acc, `政策 ${p.id} 政体 ${g} 不存在`);
    if (p.prereqTech && !TECH_BY_ID[p.prereqTech]) fail(acc, `政策 ${p.id} 前置科技 ${p.prereqTech} 不存在`);
  }

  // 7. 事件：id 唯一，≥2 选项，引用存在
  const eIds = new Set<string>();
  if (EVENTS.length < 20) warn(acc, `事件 ${EVENTS.length} 个，建议 ≥20`);
  for (const e of EVENTS) {
    if (eIds.has(e.id)) fail(acc, `事件 id 重复 ${e.id}`);
    eIds.add(e.id);
    if (e.options.length < 2) fail(acc, `事件 ${e.id} 选项 < 2`);
    for (const opt of e.options) {
      if (opt.effects.relation && !NATION_BY_ID[opt.effects.relation.target as keyof typeof NATION_BY_ID]) fail(acc, `事件 ${e.id} 选项外交目标 ${opt.effects.relation.target} 不存在`);
      if (opt.effects.factionSat) for (const fr of opt.effects.factionSat) if (!FACTIONS[fr.faction]) fail(acc, `事件 ${e.id} 派系 ${fr.faction} 不存在`);
    }
    if (e.trigger.relationBelow && !NATION_BY_ID[e.trigger.relationBelow.target as keyof typeof NATION_BY_ID]) fail(acc, `事件 ${e.id} 触发外交目标 ${e.trigger.relationBelow.target} 不存在`);
    if (e.trigger.factionSatBelow && !FACTIONS[e.trigger.factionSatBelow.faction]) fail(acc, `事件 ${e.id} 触发派系 ${e.trigger.factionSatBelow.faction} 不存在`);
  }

  // 8. 行为映射：tendency 性格存在
  for (const b of BEHAVIOR_MAPPINGS) for (const k of Object.keys(b.tendencyGain)) if (!NATIONAL_CHARACTERS[k as keyof typeof NATIONAL_CHARACTERS]) fail(acc, `行为 ${b.actionId} 性格 ${k} 不存在`);

  // 9. 派系逼宫事件 id 在事件表存在
  for (const f of Object.values(FACTIONS)) if (!EVENTS.find((e) => e.id === f.coupEventId)) fail(acc, `派系 ${f.id} 逼宫事件 ${f.coupEventId} 不存在`);

  // 10. 全剧本生成校验：覆盖经典、大地图、区域剧本和随机洲固定种子
  for (const scenario of SCENARIO_CHECKS) {
    try {
      validateGameStateShape(acc, scenario, scenario.build());
    } catch (e) {
      fail(acc, `剧本 ${scenario.id} 生成异常：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return acc;
}

// 直接运行入口（ESM 兼容）
const isMain = typeof process !== 'undefined'
  && process.argv[1]
  && (import.meta.url.endsWith((process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '')));
if (isMain) {
  const r = validateData();
  if (r.warnings.length) {
    console.warn('WARNINGS:');
    r.warnings.forEach((w) => console.warn('  - ' + w));
  }
  if (r.errors.length) {
    console.error('ERRORS:');
    r.errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log(`✅ 数据自检通过（${NATIONS.length} 经典国 / ${PROVINCES.length} 经典省 / ${BUILDING_LIST.length} 建筑 / ${TECHNOLOGIES.length} 科技 / ${POLICIES.length} 政策 / ${EVENTS.length} 事件 / ${SCENARIO_CHECKS.length} 剧本）`);
}

export { NATIONS, PROVINCES, BUILDINGS, TECHNOLOGIES, POLICIES, GOVERNMENTS, FACTIONS, EVENTS };
