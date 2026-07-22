import { createInitialState, createWorldState } from '../src/engine/init';
import { invariantErrors } from '../src/gameplay/stateInvariants';
import { resolvePendingEventChoice } from '../src/gameplay/pendingEventResolution';
import { advanceTurnPipeline, prepareGameState } from '../src/gameplay/turnPipeline';
import type { GameState } from '../src/types/game';

interface SimulationCase {
  id: string;
  turns: number;
  create: (sample: number) => GameState;
  budgetMsPerTurn: number;
}

const args = process.argv.slice(2);
const legacyTurnsArg = args.find((arg) => /^\d+$/.test(arg));
const requestedTurns = Number(legacyTurnsArg);
const overrideTurns = Number.isSafeInteger(requestedTurns) && requestedTurns > 0 ? requestedTurns : null;
const samplesArg = args.find((arg) => arg.startsWith('--samples='));
const requestedSamples = Number(samplesArg?.split('=')[1] ?? 1);
const sampleCount = Number.isSafeInteger(requestedSamples) && requestedSamples > 0 ? requestedSamples : 1;
const cases: SimulationCase[] = [
  { id: 'classic', turns: overrideTurns ?? 20, create: () => createInitialState(), budgetMsPerTurn: 150 },
  { id: 'regional', turns: overrideTurns ?? 10, create: (sample) => createWorldState(9102 + sample, 'n_med_rome', ['mediterranean', 'europe_w', 'middle_east', 'africa_n']), budgetMsPerTurn: 600 },
  { id: 'world', turns: overrideTurns ?? 5, create: (sample) => createWorldState(9103 + sample, 'n_ea_qin'), budgetMsPerTurn: 1_200 },
];

function resolvePlayerQueue(state: GameState): GameState {
  let next = state;
  for (let guard = 0; guard < 20; guard += 1) {
    const pending = next.pendingEvents.find((entry) => entry.nationId === next.playerNationId);
    if (!pending) return next;
    const resolved = resolvePendingEventChoice(next, pending.nationId, pending.eventId, 0);
    if (!resolved.resolved) throw new Error(`${pending.eventId} 无法结算`);
    next = resolved.state;
  }
  throw new Error('玩家事件链超过 20 步，疑似循环');
}

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))];
}

for (const simulation of cases) {
  const measurements: number[] = [];
  let lastResult: Record<string, unknown> | null = null;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    let state = prepareGameState(simulation.create(sample));
    const startedAt = performance.now();
    let completedTurns = 0;
    for (; completedTurns < simulation.turns && !state.victory.type; completedTurns += 1) {
      state = resolvePlayerQueue(advanceTurnPipeline(state).state);
      const errors = invariantErrors(state);
      if (errors.length > 0) throw new Error(`${simulation.id} 样本 ${sample + 1} 第 ${state.turn} 回合：${errors.map((issue) => issue.detail).join('; ')}`);
    }
    const elapsedMs = performance.now() - startedAt;
    const perTurnMs = elapsedMs / Math.max(1, completedTurns);
    measurements.push(perTurnMs);
    lastResult = {
      scenario: simulation.id,
      turns: completedTurns,
      elapsedMs: Math.round(elapsedMs),
      perTurnMs: Math.round(perTurnMs),
      nations: Object.keys(state.nations).length,
      provinces: Object.keys(state.provinces).length,
      victory: state.victory.type,
    };
  }

  const p95 = percentile(measurements, 0.95);
  const summary = sampleCount === 1
    ? lastResult
    : {
        ...lastResult,
        samples: sampleCount,
        perTurnMs: {
          min: Math.round(Math.min(...measurements)),
          p50: Math.round(percentile(measurements, 0.5)),
          p95: Math.round(p95),
          max: Math.round(Math.max(...measurements)),
          avg: Math.round(measurements.reduce((sum, value) => sum + value, 0) / measurements.length),
        },
      };
  console.log(JSON.stringify(summary));
  if (p95 > simulation.budgetMsPerTurn) {
    throw new Error(`${simulation.id} P95 回合耗时 ${Math.round(p95)}ms，超过预算 ${simulation.budgetMsPerTurn}ms`);
  }
}
