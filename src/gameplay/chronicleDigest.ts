// V32 帝国史册摘要：把已有 GameState.chronicle 加工成可展示的纪年、主题和关键条目。
// 纯函数，不修改存档；Dashboard 侧栏与测试复用。

import type { ChronicleEntry, GameState } from '../types/game';

export type ChronicleTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';
export type ChronicleTheme = 'founding' | 'expansion' | 'war' | 'crisis' | 'prosperity' | 'reign' | 'reform' | 'diplomacy';

export interface ChronicleHighlight {
  id: string;
  turn: number;
  title: string;
  body: string;
  tone: ChronicleTone;
  theme: ChronicleTheme;
  icon: string;
}

export interface ChronicleDigest {
  era: string;
  chapterTitle: string;
  summary: string;
  tone: ChronicleTone;
  total: number;
  glory: number;
  crisis: number;
  reform: number;
  diplomacy: number;
  recent: ChronicleHighlight[];
  highlights: ChronicleHighlight[];
  empty: boolean;
}

function kindTheme(kind: ChronicleEntry['kind']): ChronicleTheme {
  if (kind === 'founding') return 'founding';
  if (kind === 'expansion' || kind === 'population') return 'expansion';
  if (kind === 'victory' || kind === 'milestone_war') return 'war';
  if (kind === 'crisis' || kind === 'milestone_rebellion') return 'crisis';
  if (kind === 'trade' || kind === 'tech') return 'prosperity';
  if (kind === 'reign') return 'reign';
  if (kind === 'reform') return 'reform';
  return 'diplomacy';
}

function themeTone(theme: ChronicleTheme): ChronicleTone {
  if (theme === 'war') return 'danger';
  if (theme === 'crisis') return 'warn';
  if (theme === 'prosperity') return 'gold';
  if (theme === 'expansion') return 'good';
  if (theme === 'reign') return 'info';
  if (theme === 'reform') return 'info';
  if (theme === 'diplomacy') return 'good';
  return 'gold';
}

function themeIcon(theme: ChronicleTheme): string {
  if (theme === 'founding') return '◇';
  if (theme === 'expansion') return '◆';
  if (theme === 'war') return '⚔';
  if (theme === 'crisis') return '⚠';
  if (theme === 'prosperity') return '◈';
  if (theme === 'reign') return '♛';
  if (theme === 'reform') return '✦';
  return '🤝';
}

function era(turn: number): string {
  if (turn <= 1) return '开国元年';
  if (turn <= 8) return '草创纪';
  if (turn <= 25) return '奠基纪';
  if (turn <= 60) return '扩张纪';
  return '永恒纪';
}

function keyOf(e: ChronicleEntry, i: number): string {
  return e.id ?? `${e.kind}-${e.turn}-${e.title}-${i}`;
}

function toHighlight(e: ChronicleEntry, i: number): ChronicleHighlight {
  const theme = kindTheme(e.kind);
  return { id: keyOf(e, i), turn: e.turn, title: e.title, body: e.desc, tone: themeTone(theme), theme, icon: themeIcon(theme) };
}

function chapter(entries: ChronicleHighlight[], turn: number): { title: string; summary: string; tone: ChronicleTone } {
  if (entries.length === 0) return { title: '史册尚未展开', summary: '帝国仍在等待第一条足以入史的事件。推进回合后，开国、扩张、危机、胜利和继承都会写入史册。', tone: 'info' };
  const crisis = entries.filter((x) => x.theme === 'crisis').length;
  const war = entries.filter((x) => x.theme === 'war').length;
  const expansion = entries.filter((x) => x.theme === 'expansion').length;
  const prosperity = entries.filter((x) => x.theme === 'prosperity').length;
  const reign = entries.filter((x) => x.theme === 'reign').length;
  if (crisis >= Math.max(2, war + expansion)) return { title: '危局与修复之书', summary: `第 ${turn} 年，史册记录了多次危机。这个国家的主线不是无脑扩张，而是在崩坏边缘维持统治。`, tone: 'warn' };
  if (war + expansion >= prosperity + reign + 2) return { title: '兵锋与疆土之书', summary: `第 ${turn} 年，史册以战争和扩张为主轴。帝国的记忆正在被疆土、边境和胜败塑造。`, tone: 'danger' };
  if (prosperity + reign >= war + crisis) return { title: '富庶与统绪之书', summary: `第 ${turn} 年，史册更重财政、人口、技术与统治延续。国家机器正在走向长期化。`, tone: 'gold' };
  return { title: '均衡治世之书', summary: `第 ${turn} 年，史册呈现扩张、治理和风险并行的局面。下一阶段关键在于继续保持修正能力。`, tone: 'good' };
}

function pickHighlights(entries: ChronicleHighlight[]): ChronicleHighlight[] {
  const weights: Record<ChronicleTheme, number> = { founding: 80, war: 75, crisis: 70, expansion: 60, prosperity: 55, reign: 50, reform: 45, diplomacy: 45 };
  return [...entries]
    .sort((a, b) => (weights[b.theme] + b.turn * 0.03) - (weights[a.theme] + a.turn * 0.03))
    .slice(0, 4);
}

export function buildChronicleDigest(state: GameState): ChronicleDigest {
  const entries = [...(state.chronicle ?? [])].sort((a, b) => a.turn - b.turn).map(toHighlight);
  const recent = [...entries].sort((a, b) => b.turn - a.turn).slice(0, 5);
  const ch = chapter(entries, state.turn);
  const glory = entries.filter((x) => x.theme === 'war' || x.theme === 'expansion' || x.theme === 'prosperity').length;
  const crisis = entries.filter((x) => x.theme === 'crisis').length;
  const reform = entries.filter((x) => x.theme === 'reform' || x.theme === 'reign').length;
  const diplomacy = entries.filter((x) => x.theme === 'diplomacy').length;
  return {
    era: era(state.turn),
    chapterTitle: ch.title,
    summary: ch.summary,
    tone: ch.tone,
    total: entries.length,
    glory,
    crisis,
    reform,
    diplomacy,
    recent,
    highlights: pickHighlights(entries),
    empty: entries.length === 0,
  };
}
