import { ExecutionMethod } from 'appwrite';
import type { SummitPreview } from '../../engine/summits';
import { SUMMIT_AGENDAS, SUMMIT_STANCES } from '../../engine/summits';
import type { Locale } from '../../i18n';
import type { GameState, Nation, SummitAgenda, SummitStance } from '../../types/game';
import { APPWRITE_CONFIG } from './config';
import { getAppwriteServices } from './client';

export interface SummitAIBrief {
  headline: string;
  counterpartyPosition: string;
  recommendedOpening: string;
  risks: string[];
  basis: string;
}

export interface SummitAIBriefResult {
  brief: SummitAIBrief;
  source: 'huggingface' | 'rules';
  model?: string;
  message?: string;
}

interface GatewayResponse {
  ok?: boolean;
  message?: string;
  brief?: SummitAIBrief;
  source?: 'huggingface';
  model?: string;
}

function pairRelation(state: GameState, left: string, right: string) {
  const relations = state.relations.filter((entry) => (entry.from === left && entry.to === right) || (entry.from === right && entry.to === left));
  const average = (key: 'relation' | 'trust' | 'threat') => Math.round(relations.reduce((sum, entry) => sum + entry[key], 0) / Math.max(1, relations.length));
  return { relation: average('relation'), trust: average('trust'), threat: average('threat'), treaty: relations[0]?.treaty ?? 'none' };
}

function localized(locale: Locale, values: { target: string; willingness: number; eligible: boolean; topFactor: string; reason: string }): SummitAIBrief {
  if (locale === 'en') return {
    headline: values.eligible ? `A summit with ${values.target} is procedurally possible` : `Conditions are not ready for a summit with ${values.target}`,
    counterpartyPosition: `The rules estimate willingness at ${values.willingness}/100. The strongest visible consideration is ${values.topFactor || 'the current bilateral balance'}.`,
    recommendedOpening: values.eligible ? 'Open with the selected agenda, acknowledge the strongest opposing concern, and avoid promises beyond the computed commitments.' : `Resolve the blocking condition first: ${values.reason || 'formal diplomatic prerequisites are not met'}.`,
    risks: [values.eligible ? 'The displayed willingness is not a guaranteed outcome.' : 'Calling a summit now is prohibited by the deterministic rules.'],
    basis: 'Rule-based fallback generated from the same summit preview; it does not change the result.',
  };
  if (locale === 'zh-TW') return {
    headline: values.eligible ? `與${values.target}舉行會談的程序條件已具備` : `與${values.target}舉行會談的條件尚未成熟`,
    counterpartyPosition: `規則估計對方意願為 ${values.willingness}/100；目前最重要的可見因素是「${values.topFactor || '雙邊現實利益'}」。`,
    recommendedOpening: values.eligible ? '先陳述所選議題，再正面回應對方最大疑慮，不作超出規則承諾範圍的保證。' : `先解除阻斷條件：${values.reason || '正式外交前提尚未滿足'}。`,
    risks: [values.eligible ? '會談意願只是估計，並不保證結果。' : '確定性規則目前禁止召開會談。'],
    basis: '這是依同一份會談預覽生成的規則降級簡報，不會改變結果。',
  };
  return {
    headline: values.eligible ? `与${values.target}举行会谈的程序条件已具备` : `与${values.target}举行会谈的条件尚未成熟`,
    counterpartyPosition: `规则估计对方意愿为 ${values.willingness}/100；当前最重要的可见因素是“${values.topFactor || '双边现实利益'}”。`,
    recommendedOpening: values.eligible ? '先陈述所选议题，再正面回应对方最大疑虑，不作超出规则承诺范围的保证。' : `先解除阻断条件：${values.reason || '正式外交前提尚未满足'}。`,
    risks: [values.eligible ? '会谈意愿只是估计，并不保证结果。' : '确定性规则当前禁止召开会谈。'],
    basis: '这是依据同一份会谈预览生成的规则降级简报，不会改变结果。',
  };
}

export function buildRuleSummitBrief(locale: Locale, target: Nation, preview: SummitPreview): SummitAIBrief {
  const topFactor = [...preview.factors].sort((left, right) => Math.abs(right.value) - Math.abs(left.value))[0]?.label ?? '';
  return localized(locale, { target: target.name, willingness: preview.willingness, eligible: preview.eligible, topFactor, reason: preview.reasons[0] ?? '' });
}

export async function requestSummitAIBrief(
  state: GameState,
  target: Nation,
  agenda: SummitAgenda,
  stance: SummitStance,
  preview: SummitPreview,
  locale: Locale,
): Promise<SummitAIBriefResult> {
  const initiator = state.nations[state.playerNationId];
  const latest = [...state.diplomaticSummits].reverse().find((entry) =>
    (entry.initiatorId === initiator.id && entry.targetId === target.id) || (entry.targetId === initiator.id && entry.initiatorId === target.id));
  try {
    const execution = await getAppwriteServices().functions.createExecution({
      functionId: APPWRITE_CONFIG.aiDiplomacyFunctionId,
      body: JSON.stringify({
        action: 'summit_brief',
        locale,
        summit: {
          turn: state.turn + 1,
          agenda,
          agendaLabel: SUMMIT_AGENDAS[agenda].label,
          stance,
          stanceLabel: SUMMIT_STANCES[stance].label,
          eligible: preview.eligible,
          willingness: preview.willingness,
          likelihood: preview.likelihood,
          initiator: { name: initiator.name, ruler: initiator.ruler.name, government: initiator.government.type, stability: initiator.government.stability, legitimacy: initiator.government.legitimacy },
          target: { name: target.name, ruler: target.ruler.name, government: target.government.type, stability: target.government.stability, legitimacy: target.government.legitimacy },
          relation: pairRelation(state, initiator.id, target.id),
          reasons: preview.reasons,
          factors: preview.factors,
          latest: latest ? { outcome: latest.outcome, summary: latest.summary, commitments: latest.commitments } : null,
        },
      }),
      async: false,
      xpath: '/',
      method: ExecutionMethod.POST,
    });
    const response = JSON.parse(execution.responseBody || '{}') as GatewayResponse;
    if (!response.ok || !response.brief) throw new Error(response.message || 'AI 书记官暂不可用');
    return { brief: response.brief, source: 'huggingface', model: response.model };
  } catch (error) {
    return {
      brief: buildRuleSummitBrief(locale, target, preview),
      source: 'rules',
      message: error instanceof Error ? error.message : 'AI 书记官暂不可用',
    };
  }
}
