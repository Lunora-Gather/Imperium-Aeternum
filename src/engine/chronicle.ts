// Imperium Aeternum — 史册引擎（E12：里程碑叙事层）
// 在回合结算时检测关键里程碑，记入 GameState.chronicle
// 目的：让玩家感受帝国百年历程，增强叙事感与记忆点

import type { GameState, Nation, ChronicleEntry } from '../types/game';
import { provincesOf } from './init';

const CHRONICLE_MAX = 50;

// 添加史册条目（去重：同 kind+title 不重复记）
export function addChronicle(state: GameState, entry: ChronicleEntry): void {
  // 去重：同 kind 且标题相同则不重复记（避免扩张里程碑刷屏）
  if (state.chronicle.some((c) => c.kind === entry.kind && c.title === entry.title)) return;
  state.chronicle.push(entry);
  if (state.chronicle.length > CHRONICLE_MAX) {
    state.chronicle = state.chronicle.slice(-CHRONICLE_MAX);
  }
}

// 回合结算时检测里程碑（在 turn.ts 调用）
export function detectMilestones(state: GameState, prev: GameState): void {
  const playerId = state.playerNationId;
  const player = state.nations[playerId];
  if (!player) return;
  const prevPlayer = prev.nations[playerId];
  if (!prevPlayer) return;

  const turn = state.turn;
  const provs = provincesOf(playerId, state.provinces);
  const prevProvs = provincesOf(playerId, prev.provinces);
  const totalPop = provs.reduce((s, p) => s + p.population, 0);
  const prevPop = prevProvs.reduce((s, p) => s + p.population, 0);

  // 开国（首回合）
  if (turn === 1 && !state.chronicle.some((c) => c.kind === 'founding')) {
    addChronicle(state, {
      turn, kind: 'founding',
      title: `${player.name} 立国`,
      desc: `${player.ruler.name} 肇基，${player.government.type} 制初立，疆土 ${provs.length} 省。`,
    });
  }

  // 扩张里程碑（3/5/10/20 省）
  const provCount = provs.length;
  const prevProvCount = prevProvs.length;
  const expandThresholds = [3, 5, 10, 20, 35];
  for (const th of expandThresholds) {
    if (provCount >= th && prevProvCount < th) {
      addChronicle(state, {
        turn, kind: 'expansion',
        title: `疆土达 ${th} 省`,
        desc: `帝国扩张至 ${provCount} 省，治能压力日增。`,
      });
    }
  }

  // 人口里程碑（500/2000/5000/10000）
  const popThresholds = [500, 2000, 5000, 10000];
  for (const th of popThresholds) {
    if (totalPop >= th && prevPop < th) {
      addChronicle(state, {
        turn, kind: 'population',
        title: `子民破 ${th}`,
        desc: `人口达 ${Math.round(totalPop)}，邦国兴盛。`,
      });
    }
  }

  // 首战（首次进入战争）
  if (player.atWar && !prevPlayer.atWar) {
    const war = state.wars.find((w) => w.attackerId === playerId || w.defenderId === playerId);
    const enemy = war ? state.nations[war.attackerId === playerId ? war.defenderId : war.attackerId] : null;
    addChronicle(state, {
      turn, kind: 'victory',
      title: `首战打响`,
      desc: enemy ? `与 ${enemy.name} 兵戎相见，国运系于此战。` : `兵戈既起，社稷动员。`,
    });
  }

  // 危机度过（稳定度从 <20 回升到 >50）
  if (prevPlayer.government.stability < 20 && player.government.stability > 50) {
    addChronicle(state, {
      turn, kind: 'crisis',
      title: `危局扭转`,
      desc: `稳定度从 ${Math.round(prevPlayer.government.stability)} 回升至 ${Math.round(player.government.stability)}，社稷转安。`,
    });
  }

  // E14: 乱世序章——稳定度跌破 20（仅首次记）
  if (player.government.stability < 20 && prevPlayer.government.stability >= 20 &&
      !state.chronicle.some((c) => c.kind === 'crisis' && c.title === '乱世的序章')) {
    addChronicle(state, {
      turn, kind: 'crisis',
      title: `乱世的序章`,
      desc: `社稷动荡，稳定度降至 ${Math.round(player.government.stability)}，人心思乱。`,
    });
  }

  // E14: 财政危机——连续 3 年赤字（仅首次记）
  let deficitStreak = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const r = state.history[i];
    const net = r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
    if (net < 0) deficitStreak++; else break;
  }
  if (deficitStreak >= 3 && !state.chronicle.some((c) => c.kind === 'crisis' && c.title === '财政危机')) {
    addChronicle(state, {
      turn, kind: 'crisis',
      title: `财政危机`,
      desc: `国库连续 ${deficitStreak} 年赤字，财用匮乏，宜速整顿。`,
    });
  }

  // 财政 milestone（国库破 1000/3000）
  const goldThresholds = [1000, 3000];
  for (const th of goldThresholds) {
    if (player.resources.gold >= th && prevPlayer.resources.gold < th) {
      addChronicle(state, {
        turn, kind: 'trade',
        title: `国库充盈`,
        desc: `金库达 ${Math.round(player.resources.gold)}，财用足。`,
      });
    }
  }

  // 统治者在位 20/40 年
  const reign = player.ruler.reignYears ?? 0;
  const prevReign = prevPlayer.ruler.reignYears ?? 0;
  for (const th of [20, 40]) {
    if (reign >= th && prevReign < th) {
      addChronicle(state, {
        turn, kind: 'reign',
        title: `${player.ruler.name} 在位 ${th} 载`,
        desc: `主君治 ${th} 年，邦国根基渐固。`,
      });
    }
  }

  // 新君继位（统治者名字变了）
  if (prevPlayer.ruler.name !== player.ruler.name && turn > 1) {
    addChronicle(state, {
      turn, kind: 'reign',
      title: `新君继位`,
      desc: `${player.ruler.name} 承大统，年 ${player.ruler.age}，治能 ${player.ruler.ability}。`,
    });
  }

  // E13: 战事里程碑——首胜/惨败/灭敌
  for (const war of state.wars) {
    const isAttacker = war.attackerId === playerId;
    const isDefender = war.defenderId === playerId;
    if (!isAttacker && !isDefender) continue;
    const prevWar = prev.wars.find((w) => w.id === war.id);
    if (!prevWar) continue;
    // 新战报（防御：旧存档/AI 内联创建的战争可能无 battleReports 字段）
    const prevReports = prevWar.battleReports ?? [];
    const newReports = (war.battleReports ?? []).slice(prevReports.length);
    for (const r of newReports) {
      const playerWon = isAttacker ? r.outcome === 'advance' : r.outcome === 'repelled';
      const playerLost = isAttacker ? r.outcome === 'repelled' : r.outcome === 'advance';
      if (playerWon && !state.chronicle.some((c) => c.kind === 'victory' && c.title === '首战告捷')) {
        addChronicle(state, {
          turn, kind: 'victory',
          title: `首战告捷`,
          desc: `我军于 ${state.provinces[war.targetProvinceId]?.name ?? '前线'} 取胜，斩敌 ${r.defLoss}。`,
        });
      }
      if (playerLost && r.attLoss + r.defLoss > 100 && !state.chronicle.some((c) => c.kind === 'crisis' && c.title === '兵败之辱')) {
        addChronicle(state, {
          turn, kind: 'crisis',
          title: `兵败之辱`,
          desc: `我军于 ${state.provinces[war.targetProvinceId]?.name ?? '前线'} 惨败，折损 ${isAttacker ? r.attLoss : r.defLoss} 人。`,
        });
      }
    }
  }

  // E13: 灭敌国
  for (const [nid, n] of Object.entries(state.nations)) {
    if (n.defeated) {
      const prevN = prev.nations[nid];
      if (prevN && !prevN.defeated && !state.chronicle.some((c) => c.kind === 'victory' && c.title === `灭 ${n.name}`)) {
        // 仅记玩家参与的灭国
        const playerInvolved = state.wars.some((w) =>
          (w.attackerId === playerId && w.defenderId === nid) || (w.defenderId === playerId && w.attackerId === nid));
        if (playerInvolved) {
          addChronicle(state, {
            turn, kind: 'victory',
            title: `灭 ${n.name}`,
            desc: `${n.name} 国祚终绝，疆土尽归我有。`,
          });
        }
      }
    }
  }
}
