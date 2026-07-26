// V23 导航 Tab 合约：统一 App、行动中心、年报路由和战略参谋的页面 id。
// 避免各模块各自手写字符串 union，后续新增页面时只改这里。

export const NAVIGATION_TABS = [
  'dashboard',
  'map',
  'province',
  'economy',
  'population',
  'politics',
  'military',
  'diplomacy',
  'tech',
  'stats',
  'report',
  'chronicle',
  'save',
] as const;

export type NavigationTab = typeof NAVIGATION_TABS[number];

export interface NavigationItem {
  id: NavigationTab;
  label: string;
  key: string;
  icon: string;
}

export interface NavigationGroup {
  group: string;
  tabs: readonly NavigationItem[];
}

export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  { group: '治理', tabs: [
    { id: 'dashboard', label: '总览', key: '1', icon: '◈' },
    { id: 'map', label: '舆图', key: 'm', icon: '⬡' },
    { id: 'province', label: '省份', key: '2', icon: '▣' },
    { id: 'economy', label: '经济', key: '3', icon: '◉' },
    { id: 'population', label: '人口', key: '4', icon: '◯' },
    { id: 'politics', label: '政治', key: '5', icon: '⚖' },
    { id: 'tech', label: '科技', key: '6', icon: '✦' },
    { id: 'stats', label: '统计', key: 's', icon: '◇' },
  ] },
  { group: '征伐', tabs: [
    { id: 'military', label: '军事', key: '7', icon: '⚔' },
    { id: 'diplomacy', label: '外交', key: '8', icon: '✉' },
  ] },
  { group: '纪事', tabs: [
    { id: 'report', label: '年报', key: '9', icon: '✶' },
    { id: 'chronicle', label: '史册', key: 'c', icon: '✧' },
    { id: 'save', label: '存档', key: '0', icon: '⌶' },
  ] },
];

export const ALL_NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((group) => group.tabs);

const TAB_SET = new Set<string>(NAVIGATION_TABS);

export function isNavigationTab(tab: string | undefined | null): tab is NavigationTab {
  return typeof tab === 'string' && TAB_SET.has(tab);
}

export function shouldBlockGlobalShortcut(input: {
  hasOpenDialog: boolean;
  targetTagName?: string;
  targetIsContentEditable?: boolean;
}): boolean {
  const tag = input.targetTagName?.toUpperCase();
  return input.hasOpenDialog || tag === 'INPUT' || tag === 'TEXTAREA' || input.targetIsContentEditable === true;
}

export function centeredTabScrollLeft(input: {
  currentScrollLeft: number;
  activeOffsetLeft: number;
  activeWidth: number;
  containerWidth: number;
  maxScrollLeft: number;
}): number {
  const centered = input.currentScrollLeft
    + input.activeOffsetLeft
    - (input.containerWidth - input.activeWidth) / 2;
  return Math.max(0, Math.min(input.maxScrollLeft, Math.round(centered)));
}
