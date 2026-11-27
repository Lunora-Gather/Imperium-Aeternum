import { createWorldState } from '../src/engine/init';
import { addChronicle, CHRONICLE_MAX, personalChronicleOwner } from '../src/engine/chronicle';
import { validPendingEvents } from '../src/gameplay/stateHygiene';
import { sharedNationView } from '../src/shared-world/nationView';
import { legacyOceanCapital, restoreCapitalTerrain } from '../src/engine/worldgen';
import { setProvincePopulation } from '../src/engine/provincePopulation';
import { derivePolicyMods } from '../src/engine/politics';
import { processTurn } from '../src/engine/turn';
import type { GameState } from '../src/types/game';
import {
  appeaseFactionAction, buildAction, culturalExportAction, conveneDiplomaticSummitAction,
  declareWarAction, demolishBuildingAction, developProvinceAction, dynasticMarriageAction,
  embargoTradeRouteAction, enactLawAction, enactPolicyAction, espionageAction,
  establishTradeRouteAction, formAllianceAction, formTradeAction, improveRelationAction,
  makePeaceAction, moveArmyAction, negotiateRebellionAction, recruitAction, researchAction,
  setTaxRateAction, suppressRebellionAction, upgradeBuildingAction,
} from '../src/gameplay/actions';
import { resolvePendingEventChoice } from '../src/gameplay/pendingEventResolution';

export { sharedNationView };

export function prepareSharedSnapshot(state: GameState): GameState {
  const next = { ...state, pendingEvents: validPendingEvents(state) };
  for (const province of Object.values(state.provinces)) {
    const oceanCapital = legacyOceanCapital(state, province);
    if (!oceanCapital && province.classes?.length && province.classes.every(group => group.weight !== undefined)) continue;
    if (next.provinces === state.provinces) next.provinces = { ...state.provinces };
    const restored = { ...province, classes: (province.classes ?? []).map(group => ({ ...group })) };
    if (oceanCapital) restoreCapitalTerrain(restored);
    setProvincePopulation(restored, province.population);
    next.provinces[province.id] = restored;
  }
  for (const nation of Object.values(state.nations)) {
    if (!nation.activePolicies?.some(policy => policy.policyId === 'crop_rotation') || nation.policyMods?.foodOutputMod !== undefined) continue;
    if (next.nations === state.nations) next.nations = { ...state.nations };
    next.nations[nation.id] = { ...nation, policyMods: derivePolicyMods(nation) };
  }
  const options = next.pendingEventOptions;
  if (!next.pendingEvents.some(p => p.eventId === options?.eventId && p.nationId === options?.nationId)) next.pendingEventOptions = null;
  if (!next.sharedChronicles) {
    next.chronicle = [];
    next.sharedChronicles = {};
    for (const entry of state.chronicle ?? []) {
      const owner = entry.kind === 'founding'
        ? Object.values(state.nations).find((n) => entry.title === `${n.name} 立国`)?.id
        : undefined;
      if (personalChronicleOwner(entry) || owner) addChronicle(next, owner ? { ...entry, actorId: owner } : entry);
      else next.chronicle.push(entry);
    }
  }
  return next;
}

export function sharedRulerSnapshot(state: GameState, nationId: string): GameState {
  const { sharedFocuses, sharedHistories, sharedChronicles, ...view } = sharedNationView(state, nationId);
  view.chronicle = [...state.chronicle, ...(sharedChronicles?.[nationId] ?? [])]
    .sort((a, b) => a.turn - b.turn).slice(-CHRONICLE_MAX);
  view.pendingEvents = state.pendingEvents.filter((entry) => entry.nationId === nationId);
  const options = state.pendingEventOptions;
  view.pendingEventOptions = options?.nationId === nationId ? options : null;
  return view;
}

type ActionPayload = { action?: string; args?: unknown[] };
const STRATEGY_FOCUSES = new Set(['balance', 'stability', 'prosperity', 'military', 'diplomacy', 'reform']);

export function createSharedWorldSnapshot(): GameState {
  return prepareSharedSnapshot(createWorldState(20260722));
}

function workingNationView(state: GameState, nationId: string) {
  const view = sharedNationView(state.sharedChronicles ? state : prepareSharedSnapshot(state), nationId);
  view.sharedFocuses ??= { [state.playerNationId]: state.strategyFocus ?? 'balance' };
  if (!view.sharedHistories) {
    view.sharedHistories = {};
    for (const report of state.history) (view.sharedHistories[report.nationId] ??= []).push(report);
  }
  // Older snapshots recorded events only for the then-selected ruler.
  view.triggeredEvents = state.triggeredEvents.map((e) => e.nationId ? e : { ...e, nationId: state.playerNationId });
  view.eventCooldowns = state.eventCooldowns.map((e) => e.nationId ? e : { ...e, nationId: state.playerNationId });
  return view;
}

export function applySharedWorldCommand(state: GameState, nationId: string, payload: ActionPayload): { state: GameState; messages: string[] } {
  if (!state.nations[nationId] || state.nations[nationId].defeated) throw new Error('国家不存在或已经覆亡');
  const working = workingNationView(structuredClone(state), nationId);
  const action = String(payload.action ?? '');
  const args = Array.isArray(payload.args) ? payload.args : [];
  const text = (index: number) => String(args[index] ?? '');
  const num = (index: number) => Number(args[index]);
  let result;
  switch (action) {
    case 'resolve_event': {
      const eventResult = resolvePendingEventChoice(working, nationId, text(0), num(1));
      if (!eventResult.resolved) throw new Error('事件不存在或已经处理');
      result = { ok: true, state: eventResult.state, messages: [`事件 ${eventResult.eventTitle}：选择「${eventResult.optionText}」`] };
      break;
    }
    case 'set_strategy_focus': {
      const focus = text(0);
      if (!STRATEGY_FOCUSES.has(focus)) throw new Error('国策焦点无效');
      working.sharedFocuses![nationId] = working.strategyFocus = focus as NonNullable<GameState['strategyFocus']>;
      result = { ok: true, state: working, messages: ['国策焦点已更新'] };
      break;
    }
    case 'set_tax_rate': result = setTaxRateAction(working, num(0)); break;
    case 'appease_faction': result = appeaseFactionAction(working, text(0)); break;
    case 'build': result = buildAction(working, text(0), text(1)); break;
    case 'recruit': result = recruitAction(working, text(0), num(1)); break;
    case 'research': result = researchAction(working, text(0)); break;
    case 'improve_relation': result = improveRelationAction(working, text(0)); break;
    case 'form_trade': result = formTradeAction(working, text(0)); break;
    case 'form_alliance': result = formAllianceAction(working, text(0)); break;
    case 'summit': result = conveneDiplomaticSummitAction(working, text(0), text(1) as never, text(2) as never); break;
    case 'espionage': result = espionageAction(working, text(0), text(1) as never); break;
    case 'dynastic_marriage': result = dynasticMarriageAction(working, text(0)); break;
    case 'cultural_export': result = culturalExportAction(working, text(0)); break;
    case 'declare_war': result = declareWarAction(working, text(0), text(1)); break;
    case 'make_peace': result = makePeaceAction(working, text(0), true); break;
    case 'move_army': result = moveArmyAction(working, text(0), text(1)); break;
    case 'enact_policy': result = enactPolicyAction(working, text(0) as never); break;
    case 'enact_law': result = enactLawAction(working, text(0)); break;
    case 'establish_trade_route': result = establishTradeRouteAction(working, text(0)); break;
    case 'embargo_trade_route': result = embargoTradeRouteAction(working, text(0)); break;
    case 'develop_province': result = developProvinceAction(working, text(0), text(1) as never); break;
    case 'upgrade_building': result = upgradeBuildingAction(working, text(0), text(1)); break;
    case 'demolish_building': result = demolishBuildingAction(working, text(0), text(1)); break;
    case 'suppress_rebellion': result = suppressRebellionAction(working); break;
    case 'negotiate_rebellion': result = negotiateRebellionAction(working); break;
    default: throw new Error('不支持的共享版图行动');
  }
  if (!result.ok) throw new Error(result.messages.join('；') || '行动执行失败');
  return { state: result.state, messages: result.messages };
}

export function advanceSharedWorld(state: GameState, humanNationIds: string[]): GameState {
  const rulers = [...new Set(humanNationIds)].filter((id) => state.nations[id] && !state.nations[id].defeated).sort();
  const reference = rulers[0] ?? Object.values(state.nations).find((n) => !n.defeated)?.id;
  if (!reference) throw new Error('版图已无存续国家');
  const view = workingNationView(state, reference);
  return processTurn(view, { humanNationIds: rulers, sharedWorld: true }).state;
}
