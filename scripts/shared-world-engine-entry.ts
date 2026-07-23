import { createWorldState } from '../src/engine/init';
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

type ActionPayload = { action?: string; args?: unknown[] };

function selectNation(state: GameState, nationId: string): void {
  if (!state.nations[nationId] || state.nations[nationId].defeated) throw new Error('国家不存在或已经覆亡');
  state.playerNationId = nationId;
  for (const nation of Object.values(state.nations)) nation.isPlayer = nation.id === nationId;
}

export function createSharedWorldSnapshot(): GameState {
  return createWorldState(20260722);
}

export function applySharedWorldCommand(state: GameState, nationId: string, payload: ActionPayload): { state: GameState; messages: string[] } {
  const working = structuredClone(state) as GameState;
  selectNation(working, nationId);
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
    case 'set_strategy_focus': working.strategyFocus = text(0) as never; result = { ok: true, state: working, messages: ['国策焦点已更新'] }; break;
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
    case 'make_peace': result = makePeaceAction(working, text(0)); break;
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
  const active = humanNationIds.find((id) => state.nations[id] && !state.nations[id].defeated) ?? Object.keys(state.nations)[0];
  selectNation(state, active);
  return processTurn(state, { humanNationIds, sharedWorld: true }).state;
}
