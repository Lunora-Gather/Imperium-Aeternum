// 逻辑护栏：不重写大引擎，只包一层安全回合结算。
// 目标：
// 1) 避免旧 processTurn 的浅拷贝把上一回合状态一起改掉；
// 2) 按真正的 playerNationId 修正报告差值；
// 3) 保留原有 AI/战争/经济/事件逻辑。

import { useGameStore } from '../store/gameStore';
import type { GameState, TurnReport, Province } from '../types/game';
import { processTurn as unsafeProcessTurn } from '../engine/turn';
import { normalizeGameState, autoSave } from '../store/persistence';

let installed = false;

function cloneState(state: GameState): GameState {
  // GameState 是纯数据；_relMap 是 transient Map，不能序列化，故显式丢弃。
  return JSON.parse(JSON.stringify({ ...state, _relMap: undefined })) as GameState;
}

function playerId(state: GameState): string {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  const marked = Object.values(state.nations).find((n) => n.isPlayer && !n.defeated);
  if (marked) return marked.id;
  return Object.values(state.nations).find((n) => !n.defeated)?.id ?? Object.keys(state.nations)[0];
}

function provincesOf(state: GameState, nationId: string): Province[] {
  return Object.values(state.provinces).filter((p) => p.ownerId === nationId);
}

function mergeWarning(base: string[], text: string, yes: boolean): string[] {
  if (!yes || base.includes(text)) return base;
  return [...base, text];
}

function rebuildWarProgress(prev: GameState, next: GameState, pid: string): TurnReport['warProgress'] {
  const out: TurnReport['warProgress'] = [];
  for (const w of next.wars) {
    if (w.attackerId !== pid && w.defenderId !== pid) continue;
    const old = prev.wars.find((x) => x.id === w.id);
    const oldLen = old?.battleReports?.length ?? 0;
    const fresh = (w.battleReports ?? []).slice(oldLen);
    for (const r of fresh) {
      out.push({
        target: next.provinces[w.targetProvinceId]?.name ?? w.targetProvinceId,
        progressDelta: r.progressDelta,
        outcome: r.outcome,
      });
    }
  }
  return out;
}

function rebuildProvinceChanges(prev: GameState, next: GameState, pid: string): TurnReport['provinceChanges'] {
  const out: TurnReport['provinceChanges'] = [];
  for (const [id, p] of Object.entries(next.provinces)) {
    const old = prev.provinces[id];
    if (!old || old.ownerId === p.ownerId) continue;
    if (old.ownerId === pid || p.ownerId === pid) out.push({ id, name: p.name, from: old.ownerId, to: p.ownerId });
  }
  return out;
}

function rebuildFactionDelta(prev: GameState, next: GameState, pid: string): TurnReport['factionDelta'] {
  const old = prev.nations[pid];
  const cur = next.nations[pid];
  if (!old || !cur) return [];
  const out: TurnReport['factionDelta'] = [];
  for (const f of cur.factions) {
    const pf = old.factions.find((x) => x.id === f.id);
    if (!pf) continue;
    const delta = Math.round(f.satisfaction - pf.satisfaction);
    if (delta !== 0) out.push({ id: f.id, delta });
  }
  return out;
}

function rebuildUnrestDelta(prev: GameState, next: GameState, pid: string): number {
  let delta = 0;
  for (const p of provincesOf(next, pid)) {
    const old = prev.provinces[p.id];
    if (old) delta += Math.round(p.unrest - old.unrest);
  }
  return delta;
}

function rebuildWorldEvents(prev: GameState, next: GameState, pid: string): string[] {
  const out: string[] = [];
  const neighbors = new Set<string>();
  for (const p of provincesOf(prev, pid)) {
    for (const adjId of p.adjacent) {
      const adj = prev.provinces[adjId];
      if (adj && adj.ownerId !== pid) neighbors.add(adj.ownerId);
    }
  }

  for (const w of next.wars) {
    if (prev.wars.some((old) => old.id === w.id)) continue;
    if (w.attackerId !== pid && w.defenderId !== pid && !neighbors.has(w.attackerId) && !neighbors.has(w.defenderId)) continue;
    out.push(`⚔ ${next.nations[w.attackerId]?.name ?? w.attackerId} 向 ${next.nations[w.defenderId]?.name ?? w.defenderId} 宣战`);
  }

  for (const [nid, n] of Object.entries(next.nations)) {
    const old = prev.nations[nid];
    if (old && !old.defeated && n.defeated && nid !== pid && neighbors.has(nid)) out.push(`☠ ${n.name} 灭亡`);
  }

  for (const r of next.relations) {
    const old = prev.relations.find((x) => x.from === r.from && x.to === r.to);
    if (r.treaty === 'alliance' && old?.treaty !== 'alliance') {
      if (r.from === pid || r.to === pid || neighbors.has(r.from) || neighbors.has(r.to)) {
        out.push(`🤝 ${next.nations[r.from]?.name ?? r.from} 与 ${next.nations[r.to]?.name ?? r.to} 结盟`);
      }
    }
    if (r.treaty === 'none' && old?.treaty === 'truce' && old.truceTurns > 0 && (r.from === pid || r.to === pid)) {
      const other = r.from === pid ? r.to : r.from;
      out.push(`🕊 与 ${next.nations[other]?.name ?? other} 停战到期`);
    }
  }

  return out.slice(-10);
}

function repairReport(prev: GameState, next: GameState, raw: TurnReport): TurnReport {
  const pid = playerId(next);
  const player = next.nations[pid];
  const warnings = [...(raw.warnings ?? [])];
  const repaired: TurnReport = {
    ...raw,
    nationId: pid,
    warProgress: rebuildWarProgress(prev, next, pid),
    factionDelta: rebuildFactionDelta(prev, next, pid),
    unrestDelta: rebuildUnrestDelta(prev, next, pid),
    provinceChanges: rebuildProvinceChanges(prev, next, pid),
    worldEvents: rebuildWorldEvents(prev, next, pid),
    exhaustSnapshot: Math.round(player?.warExhaustion ?? raw.exhaustSnapshot ?? 0),
    warnings: player ? mergeWarning(
      mergeWarning(
        mergeWarning(
          mergeWarning(warnings, '⚠ 国库赤字', player.resources.gold < 0),
          '⚠ 粮食短缺', player.resources.food < 0,
        ),
        '⚠ 稳定度过低', player.government.stability < 20,
      ),
      '⚠ 厌战高涨', player.warExhaustion > 70,
    ) : warnings,
  };
  return repaired;
}

export function processTurnSafe(state: GameState): { state: GameState; report: TurnReport } {
  const prev = normalizeGameState(cloneState(state));
  const working = normalizeGameState(cloneState(state));

  // 规范 isPlayer，避免旧档多个国家带 isPlayer 导致 UI/AI 误判。
  const pid = playerId(working);
  working.playerNationId = pid;
  for (const n of Object.values(working.nations)) n.isPlayer = n.id === pid;

  const result = unsafeProcessTurn(working);
  const next = normalizeGameState(result.state);
  next.playerNationId = playerId(next);
  for (const n of Object.values(next.nations)) n.isPlayer = n.id === next.playerNationId;

  const report = repairReport(prev, next, result.report);
  next.lastReport = report;
  const history = Array.isArray(next.history) ? [...next.history] : [];
  if (history.length > 0 && history[history.length - 1]?.turn === report.turn) history[history.length - 1] = report;
  else history.push(report);
  next.history = history.slice(-10);
  next._relMap = undefined;

  return { state: next, report };
}

export function installLogicGuard(): void {
  if (installed) return;
  installed = true;

  useGameStore.setState({
    nextTurn: () => {
      const store = useGameStore.getState();
      const cur = store.state;
      if (cur.victory.type) return null;

      const { state: next, report } = processTurnSafe(cur);
      useGameStore.setState({ state: next, justProcessedTurn: true });
      if (report.warnings.length) useGameStore.getState().logMsg(report.warnings.join('; '));
      useGameStore.getState().logMsg(`进入第 ${next.turn + 1} 年`);
      if (next.turn > 0 && next.turn % 10 === 0) autoSave(next);
      return report;
    },
  } as never);
}
