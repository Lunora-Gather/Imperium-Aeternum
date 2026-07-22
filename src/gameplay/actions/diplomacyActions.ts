import type { GameState } from '../../types/game';
import { clamp, failure, relationPair, runGameAction, spendAdmin, success, validForeignTarget } from './actionCore';

export type SpyKind = 'steal_tech' | 'foment_rebellion' | 'spy_military';

function peacefulPair(state: GameState, playerId: string, targetId: string) {
  const pair = relationPair(state, playerId, targetId);
  if (!pair || pair.some((relation) => relation.treaty === 'war' || relation.treaty === 'truce')) return null;
  return pair;
}
export function improveRelationAction(state: GameState, targetId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure('当前无法改善关系');
    if (player.resources.influence < 20) return failure('影响力不足');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 20;
    for (const relation of pair) {
      relation.relation = clamp(relation.relation + 5, -100, 100);
      relation.trust = clamp(relation.trust + 4, 0, 100);
    }
    return success(`改善了与 ${target.name} 的关系`);
  });
}

export function formTradeAction(state: GameState, targetId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 0 || pair.some((relation) => relation.treaty === 'alliance' || relation.treaty === 'trade')) {
      return failure('无法建立贸易');
    }
    if (player.resources.influence < 30) return failure('影响力不足');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    for (const relation of pair) {
      relation.treaty = 'trade';
      relation.tradeDep = Math.max(relation.tradeDep, 20);
    }
    return success(`与 ${target.name} 建立贸易`);
  });
}

export function formAllianceAction(state: GameState, targetId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 50 || pair.some((relation) => relation.treaty === 'alliance')) return failure('无法结盟');
    if (player.resources.influence < 50) return failure('影响力不足');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 50;
    for (const relation of pair) relation.treaty = 'alliance';
    return success(`与 ${target.name} 结盟`);
  });
}

export function espionageAction(state: GameState, targetId: string, kind: SpyKind) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? relationPair(working, player.id, target.id) : null;
    if (!target || !pair || pair.some((relation) => relation.treaty === 'alliance')) return failure('间谍行动条件不足');
    if (!['steal_tech', 'foment_rebellion', 'spy_military'].includes(kind)) return failure('未知间谍行动');
    if (player.resources.influence < 40) return failure('影响力不足');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 40;
    const messages: string[] = [];
    if (kind === 'steal_tech') player.resources.sciPt += 30;
    if (kind === 'foment_rebellion') {
      Object.values(working.provinces).filter((province) => province.ownerId === target.id).slice(0, 2).forEach((province) => {
        province.unrest = clamp(province.unrest + 8, 0, 100);
        province.rebellionRisk = clamp(province.rebellionRisk + 6, 0, 100);
      });
    }
    if (kind === 'spy_military') messages.push(`${target.name} 军力约 ${target.army.reduce((total, army) => total + army.size, 0)}`);
    for (const relation of pair) relation.trust = clamp(relation.trust - 5, 0, 100);
    messages.push('间谍行动完成');
    return success(...messages);
  });
}

export function dynasticMarriageAction(state: GameState, targetId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair || pair[0].relation < 20) return failure('联姻条件不足');
    if (player.resources.influence < 30 || player.resources.gold < 80) return failure('联姻资源不足');
    const apFailure = spendAdmin(player, 2);
    if (apFailure) return apFailure;
    player.resources.influence -= 30;
    player.resources.gold -= 80;
    for (const relation of pair) {
      relation.relation = clamp(relation.relation + 15, -100, 100);
      relation.trust = clamp(relation.trust + 10, 0, 100);
    }
    return success(`与 ${target.name} 联姻成功`);
  });
}

export function culturalExportAction(state: GameState, targetId: string) {
  return runGameAction(state, (working, player) => {
    const target = validForeignTarget(working, player, targetId);
    const pair = target ? peacefulPair(working, player.id, target.id) : null;
    if (!target || !pair) return failure('当前无法进行文化输出');
    if (player.tech.culture < 5) return failure('文化输出需要文化科技 Lv5');
    if (player.resources.sciPt < 30) return failure('科研点不足');
    const apFailure = spendAdmin(player, 1);
    if (apFailure) return apFailure;
    player.resources.sciPt -= 30;
    player.resources.influence += 5;
    for (const relation of pair) relation.relation = clamp(relation.relation + 8, -100, 100);
    return success(`对 ${target.name} 的文化输出完成`);
  });
}
