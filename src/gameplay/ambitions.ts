// 动态国运目标：按剧本体量缩放胜利条件。
// 解决：世界剧本/大国开局时，旧的“7省征服胜利、2000金经济胜利”过于固定。
// V13：把进度同步从 UI wrapper 里抽成可复用函数，避免新局、读档、回合链顺序导致右侧目标条滞后。

import type { AmbitionMeta, GameState } from '../types/game';
export type { AmbitionMeta } from '../types/game';

export interface AmbitionSnapshot {
  conquest: { current: number; target: number; done: boolean };
  economy: { current: number; target: number; turns: number; needTurns: number; done: boolean };
  diplomacy: { influence: number; influenceTarget: number; goodRelations: number; goodTarget: number; done: boolean };
  eternal: { turns: number; target: number; done: boolean };
  worldScale: 'local' | 'regional' | 'world';
}

type StateWithAmbition = GameState;

function playerId(state: GameState): string {
  if (state.playerNationId && state.nations[state.playerNationId]) return state.playerNationId;
  return Object.values(state.nations).find((n) => n.isPlayer && !n.defeated)?.id ?? Object.keys(state.nations)[0];
}

function provinceCount(state: GameState, id: string): number {
  return Object.values(state.provinces).filter((p) => p.ownerId === id).length;
}

function goodRelationCount(state: GameState, id: string): number {
  return state.relations.filter((r) => r.from === id && r.relation >= 70 && r.treaty !== 'war').length;
}

function scaleOf(total: number): AmbitionSnapshot['worldScale'] {
  // 经典剧本有 50 省；各区域剧本约 66–224 省，完整世界约 577 省。
  if (total <= 60) return 'local';
  if (total <= 260) return 'regional';
  return 'world';
}

function makeMeta(state: GameState): AmbitionMeta {
  const pid = playerId(state);
  const player = state.nations[pid];
  return {
    playerNationId: pid,
    startTurn: state.turn,
    startProvinces: Math.max(1, provinceCount(state, pid)),
    startGold: Math.max(0, Math.round(player?.resources.gold ?? 0)),
    worldProvinces: Object.keys(state.provinces).length,
    economyTurns: 0,
    peaceTurns: 0,
    lastProgressTurn: state.turn,
  };
}

function normalizeMetaForState(state: GameState, meta: NonNullable<GameState['ambitionMeta']>): AmbitionMeta {
  const pid = playerId(state);
  const player = state.nations[pid];
  return {
    playerNationId: meta.playerNationId,
    startTurn: meta.startTurn ?? state.turn,
    startProvinces: Math.max(1, Math.round(meta.startProvinces ?? provinceCount(state, pid))),
    startGold: Math.max(0, Math.round(meta.startGold ?? player?.resources.gold ?? 0)),
    worldProvinces: meta.worldProvinces,
    lastProgressTurn: meta.lastProgressTurn ?? state.turn,
    economyTurns: Math.max(0, Math.round(meta.economyTurns ?? 0)),
    peaceTurns: Math.max(0, Math.round(meta.peaceTurns ?? 0)),
    warnedPremature: meta.warnedPremature,
  };
}

function getMetaForRead(state: StateWithAmbition): AmbitionMeta {
  const pid = playerId(state);
  const worldProvinces = Object.keys(state.provinces).length;
  const meta = state.ambitionMeta;
  if (!meta || meta.playerNationId !== pid || meta.worldProvinces !== worldProvinces) return makeMeta(state);
  return normalizeMetaForState(state, meta);
}

function ensureMetaForWrite(state: StateWithAmbition): AmbitionMeta {
  const pid = playerId(state);
  const worldProvinces = Object.keys(state.provinces).length;
  if (!state.ambitionMeta || state.ambitionMeta.playerNationId !== pid || state.ambitionMeta.worldProvinces !== worldProvinces) {
    state.ambitionMeta = makeMeta(state);
  } else {
    state.ambitionMeta = normalizeMetaForState(state, state.ambitionMeta);
  }
  return state.ambitionMeta as AmbitionMeta;
}

// extra, share, province multiplier, gold floor, gold delta, gold multiplier,
// influence, friendly nations, economy years, peace years.
type VictoryTargetProfile = readonly [number, number, number, number, number, number, number, number, number, number];
const SCENARIO_TARGETS: Record<string, VictoryTargetProfile> = {
  classic: [3, 0, 1, 5000, 4000, 8, 150, 3, 8, 80],
  challenge_survival: [4, 0, 1.35, 6500, 5500, 9, 180, 4, 10, 100],
  eastasia: [7, .18, 1.9, 11500, 8500, 8, 190, 5, 10, 100],
  w3_eastasia: [8, .18, 1.9, 13000, 9500, 8, 200, 5, 11, 105],
  w5_mediterranean: [8, .2, 2, 13000, 9500, 8, 190, 5, 10, 100],
  w6_americas: [6, .2, 1.85, 9500, 7000, 7, 170, 4, 9, 90],
  w7_random: [7, .18, 1.9, 11500, 8500, 8, 190, 5, 10, 100],
  w4_europe: [7, .17, 1.85, 12000, 9000, 8, 210, 6, 10, 105],
  w8_indianocean: [6, .16, 1.75, 10500, 7500, 7, 185, 5, 9, 95],
  world: [10, .12, 1.7, 25000, 20000, 10, 240, 8, 12, 120],
};

function fallbackProfile(worldScale: AmbitionSnapshot['worldScale']): VictoryTargetProfile {
  if (worldScale === 'local') return SCENARIO_TARGETS.classic;
  if (worldScale === 'world') return SCENARIO_TARGETS.world;
  return [6, .16, 1.8, 12000, 9000, 8, 190, 5, 10, 100];
}

function targets(meta: AmbitionMeta, scenarioId?: string) {
  const worldScale = scaleOf(meta.worldProvinces);
  const profile = (scenarioId && SCENARIO_TARGETS[scenarioId]) || fallbackProfile(worldScale);
  const conquestTarget = Math.min(meta.worldProvinces, Math.max(
    7,
    meta.startProvinces + profile[0],
    Math.ceil(meta.worldProvinces * profile[1]),
    Math.ceil(meta.startProvinces * profile[2]),
  ));
  const economyTarget = Math.max(profile[3], meta.startGold + profile[4], meta.startGold * profile[5]);
  const influenceTarget = profile[6];
  const goodTarget = profile[7];
  const economyNeedTurns = profile[8];
  const eternalTarget = profile[9];
  return { conquestTarget, economyTarget, influenceTarget, goodTarget, economyNeedTurns, eternalTarget, worldScale };
}

export function getAmbitionSnapshot(state: GameState): AmbitionSnapshot {
  const s = state as StateWithAmbition;
  const meta = getMetaForRead(s);
  const pid = playerId(s);
  const player = s.nations[pid];
  const t = targets(meta, s.scenarioId);
  const currentProvs = provinceCount(s, pid);
  const good = goodRelationCount(s, pid);
  return {
    conquest: { current: currentProvs, target: t.conquestTarget, done: currentProvs >= t.conquestTarget && (player?.government.stability ?? 0) >= 40 },
    economy: { current: Math.round(player?.resources.gold ?? 0), target: t.economyTarget, turns: meta.economyTurns, needTurns: t.economyNeedTurns, done: meta.economyTurns >= t.economyNeedTurns },
    diplomacy: { influence: Math.round(player?.resources.influence ?? 0), influenceTarget: t.influenceTarget, goodRelations: good, goodTarget: t.goodTarget, done: (player?.resources.influence ?? 0) >= t.influenceTarget && good >= t.goodTarget && s.wars.length === 0 },
    eternal: { turns: meta.peaceTurns, target: t.eternalTarget, done: meta.peaceTurns >= t.eternalTarget },
    worldScale: t.worldScale,
  };
}

export function syncAmbitionMeta(state: GameState): GameState {
  const next = { ...state } as StateWithAmbition;
  next.ambitionMeta = ensureMetaForWrite(next);
  return next;
}

export function applyAmbitionsAfterTurn(state: GameState): { state: GameState; note?: string } {
  const next = syncAmbitionMeta(state) as StateWithAmbition;
  const meta = ensureMetaForWrite(next);
  const pid = playerId(next);
  const player = next.nations[pid];
  if (!player) return { state: next };

  const t = targets(meta, next.scenarioId);
  const provs = provinceCount(next, pid);
  const atWar = next.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const stable = player.government.stability >= 40;
  const good = goodRelationCount(next, pid);

  // 进度计数只允许每个 state.turn 推进一次，避免 wrapper 重装、读档恢复或重复 setState 造成右侧目标条跳动。
  if (meta.lastProgressTurn !== next.turn) {
    if (player.resources.gold >= t.economyTarget && stable) meta.economyTurns += 1;
    else meta.economyTurns = 0;

    if (!atWar && player.government.stability >= 45 && player.government.legitimacy >= 35) meta.peaceTurns += 1;
    else meta.peaceTurns = 0;

    meta.lastProgressTurn = next.turn;
  }

  let note: string | undefined;

  if (next.victory.type?.startsWith('win')) {
    const premature =
      (next.victory.type === 'win_conquest' && !(provs >= t.conquestTarget && stable)) ||
      (next.victory.type === 'win_economy' && meta.economyTurns < t.economyNeedTurns) ||
      (next.victory.type === 'win_culture' && !((player.resources.influence >= t.influenceTarget) && good >= t.goodTarget && !atWar)) ||
      (next.victory.type === 'win_eternal' && meta.peaceTurns < t.eternalTarget);
    if (premature) {
      next.victory.type = null;
      if (!meta.warnedPremature) {
        meta.warnedPremature = true;
        note = '国运目标已按剧本体量重算，旧式过早胜利已延后。';
      }
    }
  }

  if (!next.victory.type && !next.legacyMode) {
    if (provs >= t.conquestTarget && stable) next.victory.type = 'win_conquest';
    else if (meta.economyTurns >= t.economyNeedTurns) next.victory.type = 'win_economy';
    else if (player.resources.influence >= t.influenceTarget && good >= t.goodTarget && !atWar) next.victory.type = 'win_culture';
    else if (meta.peaceTurns >= t.eternalTarget) next.victory.type = 'win_eternal';
  }

  return { state: next, note };
}
