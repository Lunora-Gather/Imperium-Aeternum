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

const TAB_SET = new Set<string>(NAVIGATION_TABS);

export function isNavigationTab(tab: string | undefined | null): tab is NavigationTab {
  return typeof tab === 'string' && TAB_SET.has(tab);
}
