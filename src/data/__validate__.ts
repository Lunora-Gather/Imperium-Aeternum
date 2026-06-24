// Imperium Aeternum — 数据自检脚本
// 阶段 3b 验证门槛：npm run validate
// 检查所有数据表内部一致性。

import { NATIONS, NATION_BY_ID, PLAYER_ID } from './nations';
import { PROVINCES, PROVINCE_BY_ID } from './provinces';
import { BUILDINGS, BUILDING_LIST } from './buildings';
import { TECHNOLOGIES, TECH_BY_ID } from './technologies';
import { POLICIES, POLICY_BY_ID } from './policies';
import { GOVERNMENTS } from './governments';
import { FACTIONS } from './factions';
import { EVENTS } from './events';
import { NATIONAL_CHARACTERS, BEHAVIOR_MAPPINGS } from './national-characters';

interface ValidateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function fail(acc: ValidateResult, msg: string): void {
  acc.errors.push(msg);
  acc.ok = false;
}

function warn(acc: ValidateResult, msg: string): void {
  acc.warnings.push(msg);
}

export function validateData(): ValidateResult {
  const acc: ValidateResult = { ok: true, errors: [], warnings: [] };

  // 1. 国家数量 = 5，玩家恰好 1
  if (NATIONS.length !== 5) fail(acc, `国家数应为 5，实际 ${NATIONS.length}`);
  const players = NATIONS.filter((n) => n.isPlayer);
  if (players.length !== 1) fail(acc, `玩家国家应 1，实际 ${players.length}`);
  if (players[0]?.id !== PLAYER_ID) fail(acc, `玩家 id 应为 ${PLAYER_ID}`);

  // 2. 国家 capital 引用省份存在；n05 允许空首都
  for (const n of NATIONS) {
    if (n.capital !== '' && !PROVINCE_BY_ID[n.capital]) {
      fail(acc, `国家 ${n.id} 首都 ${n.capital} 不存在`);
    }
    if (!GOVERNMENTS[n.government]) fail(acc, `国家 ${n.id} 政体 ${n.government} 不存在`);
    if (!NATIONAL_CHARACTERS[n.character]) fail(acc, `国家 ${n.id} 性格 ${n.character} 不存在`);
    // initRelations 引用国家存在且不含自环
    for (const r of n.initRelations) {
      if (!NATION_BY_ID[r.target]) fail(acc, `国家 ${n.id} 外交目标 ${r.target} 不存在`);
      if (r.target === n.id) fail(acc, `国家 ${n.id} 自环外交`);
    }
  }

  // 3. 省份数量 ≥ 30（扩展后 50），ownerId 引用国家存在或 'barbarian'
  if (PROVINCES.length < 30) fail(acc, `省份数应 ≥30，实际 ${PROVINCES.length}`);
  const NATION_IDS_PLUS_BARBARIAN = new Set<string>([...NATIONS.map((n) => n.id), 'barbarian']);
  for (const p of PROVINCES) {
    if (!NATION_IDS_PLUS_BARBARIAN.has(p.ownerId)) {
      fail(acc, `省份 ${p.id} owner ${p.ownerId} 不存在`);
    }
    // adjacent 引用存在；对称性检查（海洋省份豁免——陆地邻海但海不回指所有陆地是合理设计）
    for (const adj of p.adjacent) {
      if (!PROVINCE_BY_ID[adj]) fail(acc, `省份 ${p.id} 相邻 ${adj} 不存在`);
      const other = PROVINCE_BY_ID[adj];
      if (other && p.type !== 'ocean' && other.type !== 'ocean' && !other.adjacent.includes(p.id)) {
        warn(acc, `省份 ${p.id}↔${adj} 相邻不对称`);
      }
    }
    // 陆地省份阶层比例和 ≈ 1；海洋省份比例和可为 0
    const r = p.initClassRatio;
    const sum = r.peasants + r.workers + r.merchants + r.soldiers + r.scholars + r.nobles + r.clergy;
    if (p.type === 'ocean') {
      if (sum !== 0) warn(acc, `海洋省份 ${p.id} 阶层比例和 ${sum} 应为 0`);
      if (p.initPop !== 0) fail(acc, `海洋省份 ${p.id} initPop 应为 0`);
    } else {
      if (Math.abs(sum - 1) > 0.01) fail(acc, `省份 ${p.id} 阶层比例和 ${sum} ≠ 1`);
    }
    // 贸易节点必须有 tier
    if (p.isTradeNode && (!p.tradeNodeTier || p.tradeNodeTier < 1 || p.tradeNodeTier > 3)) {
      fail(acc, `省份 ${p.id} 贸易节点 tier 非法`);
    }
    // 要塞等级 0-3
    if ((p.fortressLevel ?? 0) < 0 || (p.fortressLevel ?? 0) > 3) {
      fail(acc, `省份 ${p.id} 要塞等级 ${(p.fortressLevel ?? 0)} 越界`);
    }
  }

  // 4. 建筑 id 唯一，前置科技存在
  const bIds = new Set<string>();
  for (const b of BUILDING_LIST) {
    if (bIds.has(b.id)) fail(acc, `建筑 id 重复 ${b.id}`);
    bIds.add(b.id);
    if (b.prereqTech && !TECH_BY_ID[b.prereqTech]) {
      fail(acc, `建筑 ${b.id} 前置科技 ${b.prereqTech} 不存在`);
    }
  }

  // 5. 科技：每条路线 5 或 8 级（B 扩展后 8 级），prereq 链合法，level 1-N 连续
  for (const branch of ['agri', 'mil', 'admin'] as const) {
    const list = TECHNOLOGIES.filter((t) => t.branch === branch).sort((a, b) => a.level - b.level);
    if (list.length !== 5 && list.length !== 8) fail(acc, `科技 ${branch} 应 5 或 8 级，实际 ${list.length}`);
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (t.level !== i + 1) fail(acc, `科技 ${t.id} level 应 ${i + 1}`);
      if (i > 0 && t.prereqTech !== list[i - 1].id) {
        fail(acc, `科技 ${t.id} prereq 应 ${list[i - 1].id}`);
      }
    }
  }

  // 6. 政策：allowedGovernments 引用存在，prereqTech 存在
  for (const p of POLICIES) {
    for (const g of p.allowedGovernments) {
      if (!GOVERNMENTS[g]) fail(acc, `政策 ${p.id} 政体 ${g} 不存在`);
    }
    if (p.prereqTech && !TECH_BY_ID[p.prereqTech]) fail(acc, `政策 ${p.id} 前置科技 ${p.prereqTech} 不存在`);
  }

  // 7. 事件：id 唯一，≥2 选项，触发条件可被 GameState 判定，引用国家存在
  const eIds = new Set<string>();
  if (EVENTS.length < 20) warn(acc, `事件 ${EVENTS.length} 个，建议 ≥20`);
  for (const e of EVENTS) {
    if (eIds.has(e.id)) fail(acc, `事件 id 重复 ${e.id}`);
    eIds.add(e.id);
    if (e.options.length < 2) fail(acc, `事件 ${e.id} 选项 < 2`);
    for (const opt of e.options) {
      if (opt.effects.relation && !NATION_BY_ID[opt.effects.relation.target as keyof typeof NATION_BY_ID]) {
        fail(acc, `事件 ${e.id} 选项外交目标 ${opt.effects.relation.target} 不存在`);
      }
      if (opt.effects.factionSat) {
        for (const fr of opt.effects.factionSat) {
          if (!FACTIONS[fr.faction]) fail(acc, `事件 ${e.id} 派系 ${fr.faction} 不存在`);
        }
      }
    }
    if (e.trigger.relationBelow && !NATION_BY_ID[e.trigger.relationBelow.target as keyof typeof NATION_BY_ID]) {
      fail(acc, `事件 ${e.id} 触发外交目标 ${e.trigger.relationBelow.target} 不存在`);
    }
    if (e.trigger.factionSatBelow && !FACTIONS[e.trigger.factionSatBelow.faction]) {
      fail(acc, `事件 ${e.id} 触发派系 ${e.trigger.factionSatBelow.faction} 不存在`);
    }
  }

  // 8. 行为映射：tendency 性格存在
  for (const b of BEHAVIOR_MAPPINGS) {
    for (const k of Object.keys(b.tendencyGain)) {
      if (!NATIONAL_CHARACTERS[k as keyof typeof NATIONAL_CHARACTERS]) {
        fail(acc, `行为 ${b.actionId} 性格 ${k} 不存在`);
      }
    }
  }

  // 9. 派系逼宫事件 id 在事件表存在
  for (const f of Object.values(FACTIONS)) {
    if (!EVENTS.find((e) => e.id === f.coupEventId)) {
      fail(acc, `派系 ${f.id} 逼宫事件 ${f.coupEventId} 不存在`);
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
  console.log(`✅ 数据自检通过（${NATIONS.length} 国 / ${PROVINCES.length} 省 / ${BUILDING_LIST.length} 建筑 / ${TECHNOLOGIES.length} 科技 / ${POLICIES.length} 政策 / ${EVENTS.length} 事件）`);
}

export { NATIONS, PROVINCES, BUILDINGS, TECHNOLOGIES, POLICIES, GOVERNMENTS, FACTIONS, EVENTS };
