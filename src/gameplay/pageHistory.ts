// V18 页面返回栈：让顶部 ↩ 真正返回上一页，而不是误回标题页。
// 纯函数，App 负责持有 state；测试负责锁住导航语义。

export interface BackResolution<T extends string> {
  target: T;
  history: T[];
  usedFallback: boolean;
}

export function pushPageHistory<T extends string>(history: T[], current: T, next: T, limit = 12): T[] {
  if (current === next) return history;
  const base = history[history.length - 1] === current ? history : [...history, current];
  return base.slice(Math.max(0, base.length - limit));
}

export function resolveBackTarget<T extends string>(history: T[], current: T, fallback: T): BackResolution<T> {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const candidate = history[i];
    if (candidate !== current) return { target: candidate, history: history.slice(0, i), usedFallback: false };
  }
  return { target: fallback, history: [], usedFallback: true };
}

export function resetPageHistory<T extends string>(): T[] {
  return [];
}
