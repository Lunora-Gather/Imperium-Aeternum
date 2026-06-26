// V29 胜利路线仪表盘：把四条国运目标转成可展示、可测试、可跳转的路线卡。
// 纯函数，不改 GameState；年报页、总览页和未来任务系统可复用。

import type { GameState } from '../types/game';
import { getAmbitionSnapshot, type AmbitionSnapshot } from './ambitions';
import type { NavigationTab } from './navigationTabs';

export type VictoryRouteId = 'conquest' | 'economy' | 'diplomacy' | 'eternal';
export type VictoryRouteTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';

export interface VictoryRouteCard {
  id: VictoryRouteId;
  label: string;
  tab: NavigationTab;
  progress: number;
  done: boolean;
  tone: VictoryRouteTone;
  current: string;
  target: string;
  next: string;
  warning?: string;
}

function pct(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function tone(progress: number, done: boolean, warning?: string): VictoryRouteTone {
  if (done) return 'gold';
  if (warning) return 'warn';
  if (progress >= 70) return 'good';
  if (progress >= 40) return 'info';
  return 'info';
}

function stableEnough(state: GameState): boolean {
  const player = state.nations[state.playerNationId];
  return (player?.government.stability ?? 0) >= 40;
}

export function buildVictoryRoutes(state: GameState, snapshot: AmbitionSnapshot = getAmbitionSnapshot(state)): VictoryRouteCard[] {
  const player = state.nations[state.playerNationId];
  const atWar = state.wars.some((w) => w.attackerId === state.playerNationId || w.defenderId === state.playerNationId);
  const stable = stableEnough(state);
  const conquestWarning = !stable ? '征服胜利需要安定 ≥40' : undefined;
  const diplomacyWarning = atWar ? '合纵胜利需要先结束战争' : undefined;
  const economyWarning = player && player.government.stability < 40 ? '富国路线需要稳定政局维持连续年数' : undefined;
  const eternalWarning = atWar ? '永恒路线需要和平稳定年数' : player && player.government.legitimacy < 35 ? '永恒路线需要维持法统' : undefined;

  const routes: VictoryRouteCard[] = [
    {
      id: 'conquest',
      label: '征服路线',
      tab: 'military',
      progress: pct(snapshot.conquest.current, snapshot.conquest.target),
      done: snapshot.conquest.done,
      current: `${snapshot.conquest.current} 省`,
      target: `${snapshot.conquest.target} 省`,
      next: stable ? '扩张疆土并保持安定。' : '先提高安定，再扩张疆土。',
      warning: conquestWarning,
      tone: tone(pct(snapshot.conquest.current, snapshot.conquest.target), snapshot.conquest.done, conquestWarning),
    },
    {
      id: 'economy',
      label: '富国路线',
      tab: 'economy',
      progress: Math.min(pct(snapshot.economy.current, snapshot.economy.target), pct(snapshot.economy.turns, snapshot.economy.needTurns)),
      done: snapshot.economy.done,
      current: `${snapshot.economy.current} 金 · ${snapshot.economy.turns} 年`,
      target: `${snapshot.economy.target} 金 · ${snapshot.economy.needTurns} 年`,
      next: '提高净收入，连续多年维持国库与稳定。',
      warning: economyWarning,
      tone: tone(Math.min(pct(snapshot.economy.current, snapshot.economy.target), pct(snapshot.economy.turns, snapshot.economy.needTurns)), snapshot.economy.done, economyWarning),
    },
    {
      id: 'diplomacy',
      label: '合纵路线',
      tab: 'diplomacy',
      progress: Math.min(pct(snapshot.diplomacy.influence, snapshot.diplomacy.influenceTarget), pct(snapshot.diplomacy.goodRelations, snapshot.diplomacy.goodTarget)),
      done: snapshot.diplomacy.done,
      current: `${snapshot.diplomacy.influence} 影响 · ${snapshot.diplomacy.goodRelations} 友邦`,
      target: `${snapshot.diplomacy.influenceTarget} 影响 · ${snapshot.diplomacy.goodTarget} 友邦`,
      next: atWar ? '先停战，再扩大贸易和同盟网络。' : '积累影响力并改善关键国家关系。',
      warning: diplomacyWarning,
      tone: tone(Math.min(pct(snapshot.diplomacy.influence, snapshot.diplomacy.influenceTarget), pct(snapshot.diplomacy.goodRelations, snapshot.diplomacy.goodTarget)), snapshot.diplomacy.done, diplomacyWarning),
    },
    {
      id: 'eternal',
      label: '永恒路线',
      tab: 'dashboard',
      progress: pct(snapshot.eternal.turns, snapshot.eternal.target),
      done: snapshot.eternal.done,
      current: `${snapshot.eternal.turns} 年`,
      target: `${snapshot.eternal.target} 年`,
      next: '维持和平、安定和法统，避免长期崩盘。',
      warning: eternalWarning,
      tone: tone(pct(snapshot.eternal.turns, snapshot.eternal.target), snapshot.eternal.done, eternalWarning),
    },
  ];
  return routes.sort((a, b) => Number(b.done) - Number(a.done) || b.progress - a.progress);
}

export function bestVictoryRoute(state: GameState, snapshot: AmbitionSnapshot = getAmbitionSnapshot(state)): VictoryRouteCard {
  return buildVictoryRoutes(state, snapshot)[0];
}
