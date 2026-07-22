// GameState 不变量审计：只读、无修复副作用，供测试、调试和维护脚本统一使用。

import type { GameState } from '../types/game';
import { EVENT_BY_ID } from '../data/events';
import { isValidProvinceOwner } from './stateOwnership';
import { entitySequenceFromId } from '../utils/id';

export type InvariantSeverity = 'error' | 'warning';

export interface StateInvariantIssue {
  id: string;
  severity: InvariantSeverity;
  detail: string;
}

function finite(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function auditStateInvariants(state: GameState): StateInvariantIssue[] {
  const issues: StateInvariantIssue[] = [];
  const add = (id: string, severity: InvariantSeverity, detail: string) => issues.push({ id, severity, detail });
  let maxEntitySequence = 0;
  const inspectEntityId = (id: string) => { maxEntitySequence = Math.max(maxEntitySequence, entitySequenceFromId(id)); };
  if (![state.version, state.turn, state.seed, state.entityIdCounter, state.bankruptTurns, state.lowStabilityTurns].every(finite)) {
    add('state-number-invalid', 'error', '顶层状态含 NaN/Infinity。');
  }
  if (!Number.isSafeInteger(state.entityIdCounter) || state.entityIdCounter < 0) {
    add('entity-id-counter-invalid', 'error', `entityIdCounter=${state.entityIdCounter} 非法。`);
  }
  const player = state.nations[state.playerNationId];
  if (!player) add('player-missing', 'error', `playerNationId=${state.playerNationId} 不存在。`);

  const markedPlayers = Object.values(state.nations).filter((nation) => nation.isPlayer);
  if (markedPlayers.length !== 1 || markedPlayers[0]?.id !== state.playerNationId) {
    add('player-marker-mismatch', 'error', `isPlayer 标记 ${markedPlayers.length} 个，未与 playerNationId 对齐。`);
  }

  const buildingIds = new Set<string>();
  for (const [provinceKey, province] of Object.entries(state.provinces)) {
    if (province.id !== provinceKey) add('province-key-mismatch', 'error', `${provinceKey} 的内部 id=${province.id}。`);
    if (!isValidProvinceOwner(state, province.ownerId)) add('province-owner-invalid', 'error', `${province.id} 指向无效 ownerId=${province.ownerId}。`);
    if (![province.population, province.garrison, province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].every(finite)) {
      add('province-number-invalid', 'error', `${province.id} 含 NaN/Infinity。`);
    }
    if (province.population < 0 || province.garrison < 0) add('province-negative', 'error', `${province.id} 含负人口或负驻军。`);
    if ([province.unrest, province.rebellionRisk, province.loyalty, province.assimilation].some((value) => value < 0 || value > 100)) {
      add('province-range-invalid', 'error', `${province.id} 的百分比字段越界。`);
    }
    for (const adjacentId of province.adjacent) {
      if (!state.provinces[adjacentId] || adjacentId === province.id) add('province-adjacency-invalid', 'error', `${province.id} 含无效邻接 ${adjacentId}。`);
      else if (!state.provinces[adjacentId].adjacent.includes(province.id)) add('province-adjacency-asymmetric', 'warning', `${province.id}→${adjacentId} 缺少反向邻接。`);
    }
    for (const building of province.buildings) {
      inspectEntityId(building.id);
      if (building.provinceId !== province.id) add('building-province-mismatch', 'error', `${building.id} 的 provinceId 与容器不一致。`);
      if (buildingIds.has(building.id)) add('building-id-duplicate', 'error', `建筑 id=${building.id} 重复。`);
      buildingIds.add(building.id);
      if (!Number.isSafeInteger(building.level) || building.level < 1 || building.level > 3) add('building-level-invalid', 'error', `${building.id} 等级非法。`);
    }
  }

  const armyIds = new Set<string>();
  const activeWarNations = new Set(state.wars.flatMap((war) => [war.attackerId, war.defenderId]));
  for (const [nationKey, nation] of Object.entries(state.nations)) {
    if (nation.id !== nationKey) add('nation-key-mismatch', 'error', `${nationKey} 的内部 id=${nation.id}。`);
    const resourceValues = Object.values(nation.resources);
    const governmentValues = [nation.government.stability, nation.government.legitimacy, nation.government.efficiency, nation.government.corruption];
    if (![...resourceValues, ...governmentValues, nation.warExhaustion].every(finite)) add('nation-number-invalid', 'error', `${nation.id} 含 NaN/Infinity。`);
    if ([nation.resources.wood, nation.resources.iron, nation.resources.adminPt, nation.resources.sciPt, nation.resources.influence, nation.resources.supply].some((value) => value < 0)) {
      add('nation-resource-negative', 'error', `${nation.id} 含不允许为负的资源。`);
    }
    if ([...governmentValues, nation.warExhaustion].some((value) => value < 0 || value > 100)) add('nation-range-invalid', 'error', `${nation.id} 的治理字段越界。`);
    const ownedProvinceCount = Object.values(state.provinces).filter((province) => province.ownerId === nation.id).length;
    if (!nation.defeated && ownedProvinceCount > 0 && (!state.provinces[nation.capital] || state.provinces[nation.capital].ownerId !== nation.id)) {
      add('nation-capital-invalid', 'error', `${nation.id} 没有有效的本国首都（${nation.capital || '空'}）。`);
    }
    if (nation.atWar !== activeWarNations.has(nation.id)) add('nation-war-flag-mismatch', 'error', `${nation.id} 的 atWar 与战争列表不一致。`);
    if (new Set(nation.activePolicies.map((policy) => policy.policyId)).size !== nation.activePolicies.length) add('policy-duplicate', 'error', `${nation.id} 含重复政策。`);
    if (new Set(nation.activeLaws.map((law) => law.lawId)).size !== nation.activeLaws.length) add('law-duplicate', 'error', `${nation.id} 含重复法律。`);
    if (new Set(nation.activeTradeRoutes.map((route) => route.routeId)).size !== nation.activeTradeRoutes.length) add('trade-route-duplicate', 'error', `${nation.id} 含重复贸易路线。`);
    for (const army of nation.army) {
      inspectEntityId(army.id);
      if (armyIds.has(army.id)) add('army-id-duplicate', 'error', `军队 id=${army.id} 重复。`);
      armyIds.add(army.id);
      if (army.ownerId !== nation.id) add('army-owner-mismatch', 'error', `${army.id} ownerId 与所属国家不一致。`);
      if (!state.provinces[army.location]) add('army-location-invalid', 'error', `${army.id} 位于不存在的省份 ${army.location}。`);
      else if (state.provinces[army.location].ownerId !== nation.id) add('army-location-hostile', 'error', `${army.id} 位于非己方省份 ${army.location}。`);
      if (![army.size, army.morale, army.training, army.equipment, army.supply].every(finite)) add('army-number-invalid', 'error', `${army.id} 含 NaN/Infinity。`);
      if (army.size <= 0 || [army.morale, army.training, army.equipment, army.supply].some((value) => value < 0 || value > 100)) add('army-range-invalid', 'error', `${army.id} 兵力或百分比字段越界。`);
    }
  }

  const warPairs = new Set<string>();
  for (const war of state.wars) {
    inspectEntityId(war.id);
    if (!state.nations[war.attackerId] || !state.nations[war.defenderId] || !state.provinces[war.targetProvinceId]) add('war-reference-invalid', 'error', `${war.id} 含无效引用。`);
    if (war.attackerId === war.defenderId) add('war-self-reference', 'error', `${war.id} 的攻守方相同。`);
    const target = state.provinces[war.targetProvinceId];
    if (target && target.ownerId !== war.defenderId) add('war-target-owner-mismatch', 'error', `${war.id} 的目标省不属于防守方。`);
    if (![war.progress, war.turns].every(finite) || war.progress < 0 || war.progress > 100 || war.turns < 0) add('war-number-invalid', 'error', `${war.id} 的进度或回合非法。`);
    const pair = [war.attackerId, war.defenderId].sort().join('|');
    if (warPairs.has(pair)) add('war-pair-duplicate', 'error', `${pair} 存在重复战争。`);
    warPairs.add(pair);
  }

  const summitIds = new Set<string>();
  for (const summit of state.diplomaticSummits) {
    inspectEntityId(summit.id);
    if (summitIds.has(summit.id)) add('summit-id-duplicate', 'error', `会谈 id=${summit.id} 重复。`);
    summitIds.add(summit.id);
    if (!state.nations[summit.initiatorId] || !state.nations[summit.targetId] || summit.initiatorId === summit.targetId) {
      add('summit-reference-invalid', 'error', `${summit.id} 含无效国家引用。`);
    }
    if (!finite(summit.turn) || !finite(summit.score) || summit.score < 0 || summit.score > 100) {
      add('summit-number-invalid', 'error', `${summit.id} 的回合或评分非法。`);
    }
  }

  const accordIds = new Set<string>();
  const accordKeys = new Set<string>();
  for (const accord of state.diplomaticAccords) {
    inspectEntityId(accord.id);
    if (accordIds.has(accord.id)) add('accord-id-duplicate', 'error', `协议 id=${accord.id} 重复。`);
    accordIds.add(accord.id);
    if (!state.nations[accord.partyA] || !state.nations[accord.partyB] || accord.partyA === accord.partyB) {
      add('accord-reference-invalid', 'error', `${accord.id} 含无效国家引用。`);
    }
    if (
      !finite(accord.startedTurn)
      || !finite(accord.expiresTurn)
      || accord.startedTurn > accord.expiresTurn
      || ![1, 2].includes(accord.strength)
    ) add('accord-number-invalid', 'error', `${accord.id} 的期限或强度非法。`);
    const key = `${[accord.partyA, accord.partyB].sort().join('|')}|${accord.agenda}`;
    if (accordKeys.has(key)) add('accord-duplicate', 'error', `${key} 存在重复生效协议。`);
    accordKeys.add(key);
  }

  if (state.entityIdCounter < maxEntitySequence) {
    add('entity-id-counter-stale', 'error', `entityIdCounter=${state.entityIdCounter} 落后于已分配序列 ${maxEntitySequence}。`);
  }

  const relationKeys = new Set<string>();
  const relationMap = new Map<string, GameState['relations'][number]>();
  for (const relation of state.relations) {
    const key = `${relation.from}|${relation.to}`;
    if (!state.nations[relation.from] || !state.nations[relation.to] || relation.from === relation.to) add('relation-reference-invalid', 'error', `${key} 含无效引用。`);
    if (relationKeys.has(key)) add('relation-duplicate', 'error', `${key} 重复。`);
    relationKeys.add(key);
    relationMap.set(key, relation);
    if (![relation.relation, relation.trust, relation.threat, relation.tradeDep, relation.truceTurns].every(finite)) add('relation-number-invalid', 'error', `${key} 含 NaN/Infinity。`);
    if (relation.relation < -100 || relation.relation > 100 || [relation.trust, relation.threat, relation.tradeDep].some((value) => value < 0 || value > 100) || relation.truceTurns < 0) {
      add('relation-range-invalid', 'error', `${key} 的关系字段越界。`);
    }
  }

  for (const relation of state.relations) {
    const reverse = relationMap.get(`${relation.to}|${relation.from}`);
    if (!reverse) add('relation-reverse-missing', 'warning', `${relation.from}|${relation.to} 缺少反向关系。`);
    else if (reverse.treaty !== relation.treaty || reverse.truceTurns !== relation.truceTurns) add('relation-treaty-asymmetric', 'error', `${relation.from}|${relation.to} 的条约状态不对称。`);
  }

  for (const war of state.wars) {
    const left = relationMap.get(`${war.attackerId}|${war.defenderId}`);
    const right = relationMap.get(`${war.defenderId}|${war.attackerId}`);
    if (left?.treaty !== 'war' || right?.treaty !== 'war') add('war-treaty-mismatch', 'error', `${war.id} 未同步双向战争条约。`);
  }

  for (const entry of state.triggeredEvents) {
    if (entry.nationId !== undefined && !state.nations[entry.nationId]) {
      add('triggered-event-nation-invalid', 'error', `${entry.eventId} 指向不存在国家 ${entry.nationId}。`);
    }
    if (!finite(entry.turn) || !Number.isSafeInteger(entry.optionIndex) || entry.optionIndex < 0) {
      add('triggered-event-number-invalid', 'error', `${entry.eventId} 的回合或选项索引非法。`);
    }
  }

  const cooldownKeys = new Set<string>();
  for (const entry of state.eventCooldowns) {
    if (entry.nationId !== undefined && !state.nations[entry.nationId]) {
      add('event-cooldown-nation-invalid', 'error', `${entry.eventId} 指向不存在国家 ${entry.nationId}。`);
    }
    if (!finite(entry.lastTriggeredTurn)) {
      add('event-cooldown-turn-invalid', 'error', `${entry.eventId} 的冷却回合非法。`);
    }
    const key = `${entry.nationId ?? state.playerNationId}|${entry.eventId}`;
    if (cooldownKeys.has(key)) add('event-cooldown-duplicate', 'error', `${key} 冷却记录重复。`);
    cooldownKeys.add(key);
  }

  const pendingKeys = new Set<string>();
  for (const pending of state.pendingEvents) {
    const key = `${pending.nationId}|${pending.eventId}`;
    if (!state.nations[pending.nationId]) add('pending-event-nation-invalid', 'error', `${key} 指向不存在国家。`);
    if (!EVENT_BY_ID[pending.eventId]) add('pending-event-definition-missing', 'error', `${key} 指向不存在事件。`);
    if (pendingKeys.has(key)) add('pending-event-duplicate', 'error', `${key} 重复待决。`);
    pendingKeys.add(key);
  }
  if (state.pendingEventOptions && !state.nations[state.pendingEventOptions.nationId]) add('pending-options-nation-invalid', 'error', '待决事件选项指向不存在国家。');
  if (state.pendingEventOptions && !EVENT_BY_ID[state.pendingEventOptions.eventId]) add('pending-options-definition-missing', 'error', '待决事件选项指向不存在事件。');

  if (state.lastReport && state.lastReport.turn !== state.turn) add('report-turn-stale', 'warning', `lastReport=${state.lastReport.turn}，state.turn=${state.turn}。`);
  if (state.lastReport && state.lastReport.nationId !== state.playerNationId) add('report-player-mismatch', 'error', `lastReport.nationId=${state.lastReport.nationId} 未指向玩家。`);
  if (state.history.length > 12) add('history-unbounded', 'warning', `history 长度 ${state.history.length} 超过维护上限。`);
  if (state._relMap) add('transient-cache-present', 'warning', '_relMap 不应跨层持久存在。');
  return issues;
}

export function invariantErrors(state: GameState): StateInvariantIssue[] {
  return auditStateInvariants(state).filter((issue) => issue.severity === 'error');
}
