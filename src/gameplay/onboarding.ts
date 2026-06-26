// V17 新手/回归玩家引导：把总览、国运目标、回合前检查、存档恢复串成一条可执行路线。
// 纯数据 + 纯函数，供 App 引导弹窗、测试和未来任务系统复用。

export type OnboardingStepId = 'dashboard' | 'ambition' | 'readiness' | 'action' | 'turn' | 'save';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  body: string;
  tab: 'dashboard' | 'province' | 'economy' | 'politics' | 'military' | 'diplomacy' | 'tech' | 'report' | 'save';
  cta: string;
  shortcut?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'dashboard',
    title: '① 先看总览',
    body: '总览页现在是总参谋部。先看“下一回合前检查”，红色是推进前必须处理，黄色是最好先关注。',
    tab: 'dashboard',
    cta: '打开总览',
    shortcut: 'Esc / 1',
  },
  {
    id: 'ambition',
    title: '② 对齐国运目标',
    body: '右侧“国运目标”会按剧本规模给出征服、富国、合纵、永恒四条路线。先选一个主线，不要每回合乱点。',
    tab: 'dashboard',
    cta: '查看国运目标',
  },
  {
    id: 'readiness',
    title: '③ 修红黄项',
    body: '回合前检查项可以跳转到对应页面。国库、粮储、安定、待决事件最优先；战时再看军队补给和士气。',
    tab: 'dashboard',
    cta: '查看体检项',
  },
  {
    id: 'action',
    title: '④ 做一件关键事',
    body: '每回合先做一件最能解决当前风险的事：缺钱看经济，地方乱看省份/政治，战时看军事，合纵看外交。',
    tab: 'province',
    cta: '去处理内政',
    shortcut: '2 / 3 / 5',
  },
  {
    id: 'turn',
    title: '⑤ 推进并读年报',
    body: '确认没有待决事件后，点“下一回合”或按空格。结算后先看年报，再回总览看趋势是否好转。',
    tab: 'report',
    cta: '理解年报',
    shortcut: 'Space / 9',
  },
  {
    id: 'save',
    title: '⑥ 关键点手动存档',
    body: '开战、改革、读旧档、连续胜利前都去存档页。槽位体检会告诉你存档是否健康、是否会自动修复。',
    tab: 'save',
    cta: '打开存档体检',
    shortcut: '0',
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
