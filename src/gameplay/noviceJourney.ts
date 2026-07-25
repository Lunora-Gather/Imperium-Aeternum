import type { NavigationTab } from './navigationTabs';

export type NoviceJourneyStepId = 'orient' | 'economy' | 'province' | 'save' | 'turn' | 'report';
export type NoviceJourneyStatus = 'active' | 'completed' | 'dismissed';

export interface NoviceJourneyStep {
  id: NoviceJourneyStepId;
  title: string;
  body: string;
  why: string;
  tab: NavigationTab;
  cta: string;
  completion: 'manual' | 'save' | 'turn' | 'report';
  completionHint: string;
}

export interface NoviceJourneyProgress {
  version: 1;
  status: NoviceJourneyStatus;
  completed: NoviceJourneyStepId[];
}

export interface NoviceJourneyContext {
  turn: number;
  currentTab: NavigationTab;
  hasLocalSave: boolean;
}

export const NOVICE_JOURNEY_STEPS: readonly NoviceJourneyStep[] = [
  {
    id: 'orient',
    title: '找到今年该做的事',
    body: '在总览找到“行动中心”，先读第一条建议；再看“下一回合前检查”有没有红色项目。',
    why: '这两个区域会把复杂信息变成明确动作，你不需要自己翻遍所有页面。',
    tab: 'dashboard',
    cta: '带我去总览',
    completion: 'manual',
    completionHint: '找到行动中心和回合前检查后，完成这一步。',
  },
  {
    id: 'economy',
    title: '确认钱粮不会见底',
    body: '打开经济页，找到预计收入、支出和粮食变化。第一年先保持收支安全，不要急着把税率拉满。',
    why: '国库或粮食断裂会连锁伤害安定、军队和长期发展。',
    tab: 'economy',
    cta: '打开经济页',
    completion: 'manual',
    completionHint: '确认年度收支和粮食变化后，完成这一步。',
  },
  {
    id: 'province',
    title: '挑一个核心省份',
    body: '打开省份页，比较人口、不满和空建筑槽。第一局先集中建设一个人口多、局势稳的核心省份。',
    why: '国家资源最终来自省份；先集中建设，比到处点按钮更容易形成正循环。',
    tab: 'province',
    cta: '查看省份',
    completion: 'manual',
    completionHint: '选好一个优先发展的省份后，完成这一步。',
  },
  {
    id: 'save',
    title: '留下第一个安全存档',
    body: '回到总览点“存档”，或在存档页保存槽位。系统检测到本地存档后会自动完成。',
    why: '改革、战争和重大事件可能改变路线，先存档才能放心试错。',
    tab: 'save',
    cta: '去存档',
    completion: 'save',
    completionHint: '完成条件：任意本地存档可读取。',
  },
  {
    id: 'turn',
    title: '谨慎推进一年',
    body: '回总览确认没有待决事件和红色阻断，再点“下一回合”。推进成功后自动完成。',
    why: '游戏的核心循环是计划、行动、结算、复盘，不是连续跳过年份。',
    tab: 'dashboard',
    cta: '回总览推进',
    completion: 'turn',
    completionHint: '完成条件：进入第 2 年。',
  },
  {
    id: 'report',
    title: '读第一份年报',
    body: '查看财政、粮食、安定和世界事件的实际变化，再决定下一年要修正什么。',
    why: '年报是结果，总览是下一轮计划；读懂两者就掌握了完整玩法循环。',
    tab: 'report',
    cta: '打开年报',
    completion: 'report',
    completionHint: '完成条件：第 2 年后打开年报。',
  },
] as const;

export function createNoviceJourney(status: NoviceJourneyStatus = 'active'): NoviceJourneyProgress {
  return { version: 1, status, completed: [] };
}

function uniqueKnown(ids: readonly NoviceJourneyStepId[]): NoviceJourneyStepId[] {
  const known = new Set(NOVICE_JOURNEY_STEPS.map((step) => step.id));
  return [...new Set(ids.filter((id) => known.has(id)))];
}

export function normalizeNoviceJourney(value: unknown): NoviceJourneyProgress {
  if (!value || typeof value !== 'object') return createNoviceJourney();
  const raw = value as Partial<NoviceJourneyProgress>;
  const status: NoviceJourneyStatus = raw.status === 'completed' || raw.status === 'dismissed' ? raw.status : 'active';
  const completed = uniqueKnown(Array.isArray(raw.completed) ? raw.completed : []);
  return {
    version: 1,
    status: completed.length === NOVICE_JOURNEY_STEPS.length ? 'completed' : status,
    completed,
  };
}

export function completeNoviceJourneyStep(progress: NoviceJourneyProgress, id: NoviceJourneyStepId): NoviceJourneyProgress {
  const completed = uniqueKnown([...progress.completed, id]);
  return {
    version: 1,
    status: completed.length === NOVICE_JOURNEY_STEPS.length ? 'completed' : 'active',
    completed,
  };
}

export function reconcileNoviceJourney(progress: NoviceJourneyProgress, context: NoviceJourneyContext): NoviceJourneyProgress {
  if (progress.status !== 'active') return progress;
  let next = normalizeNoviceJourney(progress);
  if (context.hasLocalSave) next = completeNoviceJourneyStep(next, 'save');
  if (context.turn >= 1) next = completeNoviceJourneyStep(next, 'turn');
  if (context.turn >= 1 && context.currentTab === 'report') next = completeNoviceJourneyStep(next, 'report');
  return next;
}

export function getNextNoviceJourneyStep(progress: NoviceJourneyProgress): NoviceJourneyStep | null {
  if (progress.status !== 'active') return null;
  const completed = new Set(progress.completed);
  return NOVICE_JOURNEY_STEPS.find((step) => !completed.has(step.id)) ?? null;
}

export function noviceJourneyProgress(progress: NoviceJourneyProgress): { current: number; total: number; percent: number } {
  const completed = uniqueKnown(progress.completed).length;
  const completedSet = new Set(progress.completed);
  const nextIndex = NOVICE_JOURNEY_STEPS.findIndex((step) => !completedSet.has(step.id));
  return {
    current: nextIndex < 0 ? NOVICE_JOURNEY_STEPS.length : nextIndex + 1,
    total: NOVICE_JOURNEY_STEPS.length,
    percent: Math.round((completed / NOVICE_JOURNEY_STEPS.length) * 100),
  };
}
