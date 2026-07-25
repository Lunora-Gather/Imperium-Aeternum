// V23 新手/回归玩家引导：复用统一 NavigationTab 合约，避免引导跳转目标漂移。
// 纯数据 + 纯函数，供 App 引导弹窗、测试和未来任务系统复用。

import type { NavigationTab } from './navigationTabs';

export type OnboardingStepId = 'dashboard' | 'ambition' | 'readiness' | 'action' | 'save' | 'turn';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  body: string;
  tab: NavigationTab;
  cta: string;
  shortcut?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'dashboard',
    title: '① 先认 5 个关键数字',
    body: '顶部的国库、粮储、人口、安定和疆土，是国家最重要的状态。国库、粮储或安定变红时，先别急着推进年份。',
    tab: 'dashboard',
    cta: '看看关键数字',
    shortcut: 'Esc / 1',
  },
  {
    id: 'ambition',
    title: '② 每年只定一个目标',
    body: '先看总览里的“行动中心”。第一年只解决最重要的一件事：缺钱就理财，地方不稳就治理，有战事再整军。',
    tab: 'dashboard',
    cta: '查看行动中心',
  },
  {
    id: 'readiness',
    title: '③ 红色必须处理，黄色建议处理',
    body: '“下一回合前检查”会直接告诉你风险。点提示就能去对应页面；红色代表继续推进可能出大问题。',
    tab: 'dashboard',
    cta: '查看回合前检查',
  },
  {
    id: 'action',
    title: '④ 做一件有效的事',
    body: '不用把所有页面都点一遍。跟着行动中心进入经济、省份、政治、军事或外交页，完成一项能改善当前问题的行动。',
    tab: 'province',
    cta: '去看看省份',
    shortcut: '2 / 3 / 5',
  },
  {
    id: 'save',
    title: '⑤ 第一次推进前先存档',
    body: '存档让你可以放心尝试。第一次结束年份前先保存；以后在开战、改革和重大选择前再保存一次。',
    tab: 'save',
    cta: '保存当前进度',
    shortcut: '0',
  },
  {
    id: 'turn',
    title: '⑥ 推进一年，再读结果',
    body: '没有待决事件和红色阻断后，点“下一回合”或按空格。结算后读年报：哪些变好、哪些变坏，就是下一年的计划。',
    tab: 'report',
    cta: '看看年报怎么读',
    shortcut: 'Space / 9',
  },
];

export function getOnboardingStep(index: number): OnboardingStep {
  const safe = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, Math.round(index)));
  return ONBOARDING_STEPS[safe];
}

export function nextOnboardingIndex(index: number): number {
  return Math.min(index + 1, ONBOARDING_STEPS.length - 1);
}

export function prevOnboardingIndex(index: number): number {
  return Math.max(index - 1, 0);
}

export function onboardingProgress(index: number): { current: number; total: number; done: boolean } {
  const current = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, Math.round(index)));
  return { current: current + 1, total: ONBOARDING_STEPS.length, done: current >= ONBOARDING_STEPS.length - 1 };
}
