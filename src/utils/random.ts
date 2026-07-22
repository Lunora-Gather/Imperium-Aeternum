// Imperium Aeternum — 确定性随机
// 数据源：docs/00-project-plan.md §7
// mulberry32 seeded RNG

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 工具：[min, max] 整数
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// 工具：按权重抽一项
export function weightedPick<T>(rng: () => number, items: { item: T; weight: number }[]): T | null {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const it of items) {
    const weight = Math.max(0, it.weight);
    if (weight <= 0) continue;
    if (r < weight) return it.item;
    r -= weight;
  }
  // Defensive fallback for a non-conforming RNG returning 1 exactly.
  return [...items].reverse().find((item) => item.weight > 0)?.item ?? null;
}

// 工具：从数组随机抽 n 个
export function sample<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
