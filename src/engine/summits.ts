import type {
  DiplomaticAccord,
  DiplomaticRelation,
  DiplomaticSummitRecord,
  GameState,
  Nation,
  SummitAgenda,
  SummitOutcome,
  SummitStance,
} from '../types/game';
import { clamp } from '../utils/math';
import { mulberry32 } from '../utils/random';
import { allocateEntityId } from '../utils/id';
import { addChronicle } from './chronicle';

export interface SummitCost {
  adminPt: number;
  influence: number;
  gold: number;
}

export interface SummitFactor {
  label: string;
  value: number;
  detail: string;
}

export interface SummitPreview {
  eligible: boolean;
  reasons: string[];
  willingness: number;
  likelihood: 'very_low' | 'uncertain' | 'plausible' | 'likely';
  costs: SummitCost;
  factors: SummitFactor[];
  cooldownRemaining: number;
}

export interface SummitAgendaDef {
  label: string;
  description: string;
  agreementName: string;
  duration: number;
}

export const SUMMIT_AGENDAS: Record<SummitAgenda, SummitAgendaDef> = {
  trade: {
    label: '经贸开放',
    description: '商讨市场准入、关税协调与长期贸易依存。',
    agreementName: '双边经贸框架',
    duration: 6,
  },
  security: {
    label: '安全与不侵犯',
    description: '降低误判与边境压力，并以多年不侵犯承诺约束双方。',
    agreementName: '双边不侵犯声明',
    duration: 8,
  },
  normalization: {
    label: '关系正常化',
    description: '修复敌意、恢复互信并逐步降低彼此威胁认知。',
    agreementName: '关系正常化路线图',
    duration: 5,
  },
  technology: {
    label: '科研与学术互访',
    description: '建立学者、典籍与技术交流机制，逐年增加科研积累。',
    agreementName: '科研互访协定',
    duration: 6,
  },
};

export const SUMMIT_STANCES: Record<SummitStance, { label: string; description: string; cost: SummitCost; score: number }> = {
  conciliatory: {
    label: '主动让步',
    description: '承担更多接待与交换成本，显著提高对方接受意愿。',
    cost: { adminPt: 2, influence: 30, gold: 100 },
    score: 14,
  },
  pragmatic: {
    label: '务实互惠',
    description: '以对等交换寻求可执行的中间方案。',
    cost: { adminPt: 2, influence: 25, gold: 60 },
    score: 0,
  },
  firm: {
    label: '强势交涉',
    description: '成本较低但更依赖实力优势，失败时外交代价更大。',
    cost: { adminPt: 2, influence: 35, gold: 40 },
    score: -8,
  },
};

const SUMMIT_COOLDOWN = 8;

function pairMatches(a: string, b: string, left: string, right: string): boolean {
  return (a === left && b === right) || (a === right && b === left);
}

function relationPair(state: GameState, left: string, right: string): [DiplomaticRelation, DiplomaticRelation] | null {
  const forward = state.relations.find((relation) => relation.from === left && relation.to === right);
  const reverse = state.relations.find((relation) => relation.from === right && relation.to === left);
  return forward && reverse ? [forward, reverse] : null;
}

function average(left: number, right: number): number {
  return (left + right) / 2;
}

function nationPower(nation: Nation, state: GameState): number {
  const army = nation.army.reduce((sum, unit) => sum + unit.size * (0.5 + unit.morale / 200), 0);
  const provinces = Object.values(state.provinces).filter((province) => province.ownerId === nation.id).length;
  return army + provinces * 180 + nation.resources.gold * 0.2 + nation.government.stability * 2;
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function otherWars(state: GameState, nationId: string, excludedId: string): number {
  return state.wars.filter((war) =>
    (war.attackerId === nationId || war.defenderId === nationId)
    && war.attackerId !== excludedId
    && war.defenderId !== excludedId,
  ).length;
}

function factor(label: string, value: number, detail: string): SummitFactor {
  return { label, value: Math.round(value), detail };
}

function agendaFactors(
  agenda: SummitAgenda,
  initiator: Nation,
  target: Nation,
  relations: [DiplomaticRelation, DiplomaticRelation],
  state: GameState,
): SummitFactor[] {
  const [forward, reverse] = relations;
  const avgThreat = average(forward.threat, reverse.threat);
  const tendency = target.tendency;
  switch (agenda) {
    case 'trade':
      return [
        factor('商业取向', (tendency.commerce + tendency.mercantilist) / 14, '对方越重视商业与重商政策，越愿意开放市场。'),
        factor('孤立倾向', -tendency.isolationist / 10, '孤立主义会压低经贸谈判空间。'),
        factor('既有贸易', forward.treaty === 'trade' ? 10 : 0, '已有贸易关系更容易升级为长期框架。'),
      ];
    case 'security':
      return [
        factor('共同避战需求', Math.min(12, avgThreat / 7), '较高威胁会制造达成不侵犯承诺的现实需求。'),
        factor('扩张倾向', -(tendency.expansionist + tendency.militarism) / 14, '扩张与军国倾向会削弱承诺可信度。'),
        factor('外部战争压力', otherWars(state, target.id, initiator.id) * 6, '对方若另有战事，更需要稳定这一方向。'),
      ];
    case 'normalization':
      return [
        factor('修复空间', average(forward.relation, reverse.relation) < 0 ? 12 : 4, '关系越紧张，改善带来的现实收益越大。'),
        factor('低威胁环境', -avgThreat / 12, '持续高威胁会妨碍互信恢复。'),
        factor('国内稳定', (target.government.stability - 50) / 8, '稳定政府更有能力兑现渐进式承诺。'),
      ];
    case 'technology':
      return [
        factor('学术取向', (tendency.scholarly + tendency.technocracy) / 12, '学术与技术官僚倾向提高交流意愿。'),
        factor('孤立倾向', -tendency.isolationist / 9, '孤立主义会限制知识与人员流动。'),
        factor('科研基础', (target.tech.admin + target.tech.culture - 2) * 2, '行政与文化基础决定交流机制能否执行。'),
      ];
  }
}

export function getActiveAccord(
  state: GameState,
  left: string,
  right: string,
  agenda?: SummitAgenda,
): DiplomaticAccord | undefined {
  return state.diplomaticAccords.find((accord) =>
    pairMatches(accord.partyA, accord.partyB, left, right)
    && accord.expiresTurn >= state.turn
    && (!agenda || accord.agenda === agenda),
  );
}

export function hasActiveNonAggressionAccord(state: GameState, left: string, right: string): boolean {
  return !!getActiveAccord(state, left, right, 'security');
}

export function previewDiplomaticSummit(
  state: GameState,
  initiatorId: string,
  targetId: string,
  agenda: SummitAgenda,
  stance: SummitStance,
): SummitPreview {
  const initiator = state.nations[initiatorId];
  const target = state.nations[targetId];
  const reasons: string[] = [];
  const factors: SummitFactor[] = [];
  const costs = SUMMIT_STANCES[stance].cost;

  if (!initiator || initiator.defeated) reasons.push('发起国不存在或已经灭亡');
  if (!target || target.defeated || targetId === initiatorId) reasons.push('目标国家无效');
  const relations = initiator && target ? relationPair(state, initiatorId, targetId) : null;
  if (!relations) reasons.push('双方尚未建立可用的正式外交渠道');
  if (state.turn < 3) reasons.push('建国初期外交机制尚未成熟（需第 4 年起）');
  if (state.wars.some((war) => pairMatches(war.attackerId, war.defenderId, initiatorId, targetId))) {
    reasons.push('双方正在交战，应先通过停战或和平谈判结束战争');
  }

  const lastSummit = [...state.diplomaticSummits]
    .reverse()
    .find((summit) => pairMatches(summit.initiatorId, summit.targetId, initiatorId, targetId));
  const cooldownRemaining = lastSummit
    ? Math.max(0, SUMMIT_COOLDOWN - (state.turn - lastSummit.turn))
    : 0;
  if (cooldownRemaining > 0) reasons.push(`距离上次元首接触过近（还需 ${cooldownRemaining} 年）`);

  if (initiator) {
    if (initiator.government.stability < 30) reasons.push('国内稳定低于 30，元首无法离开危机处置');
    if (initiator.government.legitimacy < 25) reasons.push('合法性低于 25，对外承诺缺乏国内授权');
    if (initiator.resources.adminPt < costs.adminPt) reasons.push(`行政点不足（需 ${costs.adminPt}）`);
    if (initiator.resources.influence < costs.influence) reasons.push(`影响力不足（需 ${costs.influence}）`);
    if (initiator.resources.gold < costs.gold) reasons.push(`国库不足（需 ${costs.gold}）`);
  }
  if (target && target.government.stability < 25) reasons.push('对方国内局势过于动荡，无法兑现长期承诺');

  if (relations && initiator && target) {
    const [forward, reverse] = relations;
    const avgRelation = average(forward.relation, reverse.relation);
    const avgTrust = average(forward.trust, reverse.trust);
    const avgThreat = average(forward.threat, reverse.threat);
    const treaty = forward.treaty;

    if (treaty === 'truce' && agenda !== 'normalization') reasons.push('停战期内只能先讨论关系正常化');
    if (getActiveAccord(state, initiatorId, targetId, agenda)) reasons.push('该议题已有生效中的双边协议');

    if (agenda === 'trade' && (avgRelation < 5 || avgTrust < 25)) {
      reasons.push('经贸开放至少需要关系 5、信任 25');
    }
    if (agenda === 'security' && (avgRelation < -20 || avgTrust < 15)) {
      reasons.push('安全会谈至少需要关系 -20、信任 15');
    }
    if (agenda === 'normalization' && avgRelation >= 55) reasons.push('双方关系已较稳定，无需启动正常化路线图');
    if (agenda === 'normalization' && avgRelation < -55) reasons.push('敌意过深，应先通过使节改善最低沟通条件');
    if (agenda === 'technology' && (avgRelation < 20 || avgTrust < 35)) {
      reasons.push('科研互访至少需要关系 20、信任 35');
    }
    if (
      agenda === 'technology'
      && (initiator.tech.admin + initiator.tech.culture < 2 || target.tech.admin + target.tech.culture < 2)
    ) reasons.push('双方至少需要行政与文化科技合计达到 2');

    factors.push(
      factor('双边关系', avgRelation * 0.25, `当前平均关系 ${Math.round(avgRelation)}。`),
      factor('相互信任', (avgTrust - 40) * 0.3, `当前平均信任 ${Math.round(avgTrust)}。`),
      factor('威胁认知', -avgThreat * 0.12, `当前平均威胁 ${Math.round(avgThreat)}。`),
    );
    if (treaty === 'trade') factors.push(factor('贸易基础', 8, '既有贸易降低了执行成本。'));
    if (treaty === 'alliance') factors.push(factor('同盟基础', 15, '同盟关系显著提高了承诺可信度。'));
    if (treaty === 'truce') factors.push(factor('停战阴影', -8, '近期冲突仍压低政治互信。'));

    const initiatorCapital = state.provinces[initiator.capital];
    const targetCapital = state.provinces[target.capital];
    if (initiator.government.type === target.government.type) factors.push(factor('政体相近', 4, '相近制度便于理解对方承诺。'));
    if (initiatorCapital && targetCapital && initiatorCapital.culture === targetCapital.culture) {
      factors.push(factor('文化纽带', 4, '共同文化降低沟通成本。'));
    }
    if (initiatorCapital && targetCapital && initiatorCapital.religion === targetCapital.religion) {
      factors.push(factor('宗教纽带', 3, '共同信仰提高社会接受度。'));
    }

    const powerRatio = nationPower(initiator, state) / Math.max(1, nationPower(target, state));
    if (stance === 'firm') {
      factors.push(factor(
        '实力支撑',
        powerRatio >= 1.25 ? 10 : powerRatio >= 0.9 ? -2 : -14,
        `发起国综合实力约为对方的 ${powerRatio.toFixed(2)} 倍。`,
      ));
    }
    factors.push(factor('交涉姿态', SUMMIT_STANCES[stance].score, SUMMIT_STANCES[stance].description));
    factors.push(...agendaFactors(agenda, initiator, target, relations, state));
  }

  const willingness = clamp(Math.round(38 + factors.reduce((sum, entry) => sum + entry.value, 0)), 0, 100);
  const likelihood: SummitPreview['likelihood'] = willingness >= 75
    ? 'likely'
    : willingness >= 58
      ? 'plausible'
      : willingness >= 40
        ? 'uncertain'
        : 'very_low';

  return {
    eligible: reasons.length === 0,
    reasons,
    willingness,
    likelihood,
    costs,
    factors,
    cooldownRemaining,
  };
}

type SummitRecordDraft = Omit<DiplomaticSummitRecord, 'id'>;
type AccordDraft = Omit<DiplomaticAccord, 'id'>;

export interface DiplomaticSummitResolution {
  record: SummitRecordDraft;
  costs: SummitCost;
  relationDelta: number;
  trustDelta: number;
  threatDelta: number;
  tradeDepDelta: number;
  accord?: AccordDraft;
}

function outcomeFromScore(score: number): SummitOutcome {
  if (score < 25) return 'rejected';
  if (score < 43) return 'breakdown';
  if (score < 63) return 'stalemate';
  if (score < 82) return 'agreement';
  return 'breakthrough';
}

function commitmentsFor(agenda: SummitAgenda, strength: 1 | 2, duration: number): string[] {
  const yearly = strength === 2 ? '强化' : '基础';
  switch (agenda) {
    case 'trade':
      return [`${duration} 年市场准入框架`, `${yearly}贸易收益与依存增长`];
    case 'security':
      return [`${duration} 年双边不侵犯承诺`, `${yearly}边境降温与威胁削减`];
    case 'normalization':
      return [`${duration} 年关系正常化路线图`, `${yearly}互信恢复机制`];
    case 'technology':
      return [`${duration} 年科研与学者互访`, `${yearly}年度科研积累`];
  }
}

function summaryFor(
  initiator: Nation,
  target: Nation,
  agenda: SummitAgenda,
  outcome: SummitOutcome,
): string {
  const subject = SUMMIT_AGENDAS[agenda].label;
  if (outcome === 'rejected') return `${target.name} 拒绝就“${subject}”举行正式会谈。`;
  if (outcome === 'breakdown') return `${initiator.name} 与 ${target.name} 的“${subject}”会谈因分歧公开破裂。`;
  if (outcome === 'stalemate') return `双方就“${subject}”交换立场，但未形成可执行承诺。`;
  if (outcome === 'agreement') return `双方就“${subject}”达成务实协议，后续效果将逐年兑现。`;
  return `双方在“${subject}”上取得突破，签署了更强、更长期的双边协议。`;
}

export function calculateDiplomaticSummitResolution(
  state: GameState,
  initiatorId: string,
  targetId: string,
  agenda: SummitAgenda,
  stance: SummitStance,
): DiplomaticSummitResolution {
  const preview = previewDiplomaticSummit(state, initiatorId, targetId, agenda, stance);
  if (!preview.eligible) throw new Error(preview.reasons[0] ?? '会谈条件不足');
  const initiator = state.nations[initiatorId];
  const target = state.nations[targetId];
  const rng = mulberry32(
    state.seed
    ^ Math.imul(state.turn + 1, 0x9e3779b1)
    ^ stableHash(`${initiatorId}|${targetId}|${agenda}|${stance}`),
  );
  const score = clamp(preview.willingness + Math.floor(rng() * 17) - 8, 0, 100);
  const outcome = outcomeFromScore(score);
  const accepted = outcome === 'agreement' || outcome === 'breakthrough';
  const strength: 1 | 2 = outcome === 'breakthrough' ? 2 : 1;
  const duration = SUMMIT_AGENDAS[agenda].duration + (strength === 2 ? 2 : 0);
  const commitments = accepted ? commitmentsFor(agenda, strength, duration) : [];

  let relationDelta = 0;
  let trustDelta = 0;
  let threatDelta = 0;
  let tradeDepDelta = 0;
  if (outcome === 'rejected') {
    relationDelta = stance === 'firm' ? -4 : -1;
    trustDelta = stance === 'firm' ? -4 : -2;
  } else if (outcome === 'breakdown') {
    relationDelta = stance === 'firm' ? -10 : -6;
    trustDelta = -8;
    threatDelta = 5;
  } else if (outcome === 'stalemate') {
    relationDelta = 1;
  } else if (outcome === 'agreement') {
    relationDelta = 6;
    trustDelta = 8;
    threatDelta = -4;
    tradeDepDelta = agenda === 'trade' ? 20 : 0;
  } else {
    relationDelta = 12;
    trustDelta = 14;
    threatDelta = -8;
    tradeDepDelta = agenda === 'trade' ? 35 : 0;
  }

  const actualCosts = outcome === 'rejected'
    ? { adminPt: 1, influence: 10, gold: 0 }
    : preview.costs;

  return {
    record: {
      turn: state.turn,
      initiatorId,
      targetId,
      agenda,
      stance,
      outcome,
      score,
      summary: summaryFor(initiator, target, agenda, outcome),
      commitments,
    },
    costs: actualCosts,
    relationDelta,
    trustDelta,
    threatDelta,
    tradeDepDelta,
    accord: accepted ? {
      partyA: initiatorId,
      partyB: targetId,
      agenda,
      startedTurn: state.turn,
      expiresTurn: state.turn + duration,
      strength,
    } : undefined,
  };
}

export function applyDiplomaticSummitResolution(
  state: GameState,
  resolution: DiplomaticSummitResolution,
): DiplomaticSummitRecord {
  const initiator = state.nations[resolution.record.initiatorId];
  if (!initiator) throw new Error('会谈发起国不存在');
  initiator.resources.adminPt -= resolution.costs.adminPt;
  initiator.resources.influence -= resolution.costs.influence;
  initiator.resources.gold -= resolution.costs.gold;

  const pair = relationPair(state, resolution.record.initiatorId, resolution.record.targetId);
  if (pair) {
    for (const relation of pair) {
      relation.relation = clamp(relation.relation + resolution.relationDelta, -100, 100);
      relation.trust = clamp(relation.trust + resolution.trustDelta, 0, 100);
      relation.threat = clamp(relation.threat + resolution.threatDelta, 0, 100);
      relation.tradeDep = clamp(relation.tradeDep + resolution.tradeDepDelta, 0, 100);
      if (
        resolution.accord?.agenda === 'trade'
        && relation.treaty === 'none'
      ) relation.treaty = 'trade';
    }
  }

  const record: DiplomaticSummitRecord = {
    id: allocateEntityId(state, 'summit'),
    ...resolution.record,
  };
  state.diplomaticSummits.push(record);
  if (resolution.accord) {
    state.diplomaticAccords.push({
      id: allocateEntityId(state, 'accord'),
      ...resolution.accord,
    });
    addChronicle(state, {
      id: `summit_${record.id}`,
      turn: state.turn,
      kind: 'milestone_diplomacy',
      title: SUMMIT_AGENDAS[record.agenda].agreementName,
      desc: record.summary,
      actorId: record.initiatorId,
    });
  }
  state._relMap = undefined;
  return record;
}

function addPairValue(
  state: GameState,
  accord: DiplomaticAccord,
  field: 'relation' | 'trust' | 'threat' | 'tradeDep',
  amount: number,
): void {
  const pair = relationPair(state, accord.partyA, accord.partyB);
  if (!pair) return;
  for (const relation of pair) {
    const min = field === 'relation' ? -100 : 0;
    relation[field] = clamp(relation[field] + amount, min, 100);
  }
}

export function settleDiplomaticAccords(state: GameState): void {
  const active: DiplomaticAccord[] = [];
  for (const accord of state.diplomaticAccords) {
    const left = state.nations[accord.partyA];
    const right = state.nations[accord.partyB];
    if (!left || !right || left.defeated || right.defeated) continue;
    if (state.turn > accord.expiresTurn) {
      addChronicle(state, {
        id: `accord_end_${accord.id}`,
        turn: state.turn,
        kind: 'milestone_diplomacy',
        title: `${SUMMIT_AGENDAS[accord.agenda].agreementName}期满`,
        desc: `${left.name} 与 ${right.name} 的协议按期结束，后续关系将重新取决于现实利益。`,
        actorId: accord.partyA,
      });
      continue;
    }
    const atWar = state.wars.some((war) =>
      pairMatches(war.attackerId, war.defenderId, accord.partyA, accord.partyB),
    );
    if (atWar) {
      addPairValue(state, accord, 'relation', -20);
      addPairValue(state, accord, 'trust', -25);
      addChronicle(state, {
        id: `accord_breach_${accord.id}`,
        turn: state.turn,
        kind: 'milestone_diplomacy',
        title: `${SUMMIT_AGENDAS[accord.agenda].agreementName}破裂`,
        desc: `${left.name} 与 ${right.name} 爆发战争，既有承诺失效并造成严重信任损失。`,
        actorId: accord.partyA,
      });
      continue;
    }
    if (state.turn <= accord.startedTurn) {
      active.push(accord);
      continue;
    }

    const strength = accord.strength;
    if (accord.agenda === 'trade') {
      left.resources.gold += 8 * strength;
      right.resources.gold += 8 * strength;
      addPairValue(state, accord, 'tradeDep', 3 * strength);
      addPairValue(state, accord, 'relation', strength);
      addPairValue(state, accord, 'trust', strength);
    } else if (accord.agenda === 'security') {
      addPairValue(state, accord, 'threat', -4 * strength);
      addPairValue(state, accord, 'relation', strength);
      addPairValue(state, accord, 'trust', strength);
    } else if (accord.agenda === 'normalization') {
      addPairValue(state, accord, 'relation', 2 * strength);
      addPairValue(state, accord, 'trust', strength);
      addPairValue(state, accord, 'threat', -2 * strength);
    } else {
      left.resources.sciPt += 4 * strength;
      right.resources.sciPt += 4 * strength;
      addPairValue(state, accord, 'relation', strength);
      addPairValue(state, accord, 'trust', strength);
    }
    active.push(accord);
  }
  state.diplomaticAccords = active;
  state._relMap = undefined;
}
