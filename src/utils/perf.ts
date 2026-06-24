// Imperium Aeternum — 性能计时工具（DEC-015）
// W1.5: 每回合各 engine 阶段计时，输出到 TurnReport

export interface PerfLog {
  turn: number;
  totalMs: number;
  phases: { name: string; ms: number }[];
}

const phaseTimers: { name: string; start: number }[] = [];
let turnStart = 0;

/** 开始计时一个回合 */
export function startTurn(turn: number): void {
  turnStart = performance.now();
  phaseTimers.length = 0;
}

/** 开始计时一个阶段 */
export function startPhase(name: string): void {
  phaseTimers.push({ name, start: performance.now() });
}

/** 结束当前阶段 */
export function endPhase(): void {
  const t = phaseTimers[phaseTimers.length - 1];
  if (t) (t as { name: string; start: number; ms?: number }).ms = performance.now() - t.start;
}

/** 结束回合，返回 PerfLog */
export function endTurn(turn: number): PerfLog {
  const totalMs = performance.now() - turnStart;
  const phases = phaseTimers.map((t) => ({
    name: t.name,
    ms: (t as { ms?: number }).ms ?? performance.now() - t.start,
  }));
  return { turn, totalMs, phases };
}
