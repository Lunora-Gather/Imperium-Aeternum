// Imperium Aeternum — 数学工具
// FROZEN v1（阶段 4）

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

export function avg(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : 0;
}
